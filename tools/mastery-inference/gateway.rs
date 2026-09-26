#![allow(dead_code)]

use std::sync::Arc;
use std::time::Instant;
use tauri::State;
use crate::state::AppState;
use crate::config::settings::Settings;
use crate::ai_rules::{InferenceCache, RateLimiter, FallbackManager};
use crate::harness::context::{ContextBuilder, StudentContext};
use crate::inference::router::{ModelBenchmarkResult, ModelHealthStats, ModelRouter};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InferenceMode {
    Explanation,
    Example,
    Question,
    Evaluate,
    GoalParse,
    Hint,
}

impl std::fmt::Display for InferenceMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            InferenceMode::Explanation => write!(f, "explanation"),
            InferenceMode::Example => write!(f, "example"),
            InferenceMode::Question => write!(f, "question"),
            InferenceMode::Evaluate => write!(f, "evaluate"),
            InferenceMode::GoalParse => write!(f, "goal_parse"),
            InferenceMode::Hint => write!(f, "hint"),
        }
    }
}

pub struct InferenceGateway {
    pub settings: Settings,
    pub cache: InferenceCache,
    pub rate_limiter: RateLimiter,
    pub fallback: FallbackManager,
    pub router: Arc<ModelRouter>,
}

impl InferenceGateway {
    pub fn new(settings: Settings) -> Self {
        Self::with_router(settings, Arc::new(ModelRouter::default()))
    }

    pub fn with_router(settings: Settings, router: Arc<ModelRouter>) -> Self {
        Self {
            settings,
            cache: InferenceCache::new(),
            rate_limiter: RateLimiter::new(10, 60),
            fallback: FallbackManager::new(),
            router,
        }
    }


    pub async fn generate(
        &self,
        mode: InferenceMode,
        context: &StudentContext,
    ) -> anyhow::Result<String> {
        let cache_key = format!(
            "{}:{}:{}",
            context.current_skill_id, mode, context.mastery
        );

        if let Some(cached) = self.cache.get(&cache_key).await {
            return Ok(cached);
        }

        if !self.rate_limiter.check(&cache_key).await {
            return Ok(self.fallback.get_skill_fallback(&context.current_skill_id, mode.to_string().as_str()).await);
        }

        match self.generate_from_provider(mode, context).await {
            Ok(content) => {
                self.cache.set(cache_key, content.clone(), 3600).await;
                Ok(content)
            }
            Err(e) => {
                eprintln!("Inference fallback acionado para {}: {}", mode, e);
                Ok(self.fallback.get_skill_fallback(&context.current_skill_id, mode.to_string().as_str()).await)
            }
        }
    }

    async fn generate_from_provider(
        &self,
        mode: InferenceMode,
        context: &StudentContext,
    ) -> anyhow::Result<String> {
        let strategy = self.settings.routing_strategy.as_deref().unwrap_or("auto");
        let preferred_model = self.settings.nvidia_model.as_deref();

        // Model Router resolves the best candidate chain for lowest latency & highest availability
        let candidates = self
            .router
            .resolve_candidate_chain(mode, strategy, preferred_model)
            .await;

        let api_key = self.settings.nvidia_api_key.clone();
        let mut last_err = anyhow::anyhow!("Nenhum modelo disponível");

        for candidate in candidates {
            let start = Instant::now();
            let provider = crate::inference::providers::nvidia::NvidiaProvider::new(
                api_key.clone(),
                Some(candidate.clone()),
            );

            match provider.generate_with_context(mode, context).await {
                Ok(content) => {
                    let elapsed = start.elapsed();
                    self.router.record_outcome(&candidate, elapsed, true).await;
                    return Ok(content);
                }
                Err(e) => {
                    let elapsed = start.elapsed();
                    self.router.record_outcome(&candidate, elapsed, false).await;
                    eprintln!(
                        "Modelo {} falhou ({}ms), roteando para o próximo: {}",
                        candidate,
                        elapsed.as_millis(),
                        e
                    );
                    last_err = e;
                }
            }
        }

        Err(last_err)
    }

    pub async fn generate_explanation(&self, context: &StudentContext) -> anyhow::Result<String> {
        self.generate(InferenceMode::Explanation, context).await
    }

    pub async fn generate_example(&self, context: &StudentContext) -> anyhow::Result<String> {
        self.generate(InferenceMode::Example, context).await
    }

    pub async fn generate_question(&self, context: &StudentContext) -> anyhow::Result<String> {
        self.generate(InferenceMode::Question, context).await
    }

    pub async fn generate_hint(&self, context: &StudentContext) -> anyhow::Result<String> {
        self.generate(InferenceMode::Hint, context).await
    }

    pub async fn evaluate_attempt(
        &self,
        context: &StudentContext,
        question: &str,
        answer: &str,
    ) -> anyhow::Result<String> {
        let mut ctx = context.clone();
        ctx.question = question.to_string();
        ctx.answer = answer.to_string();
        self.generate(InferenceMode::Evaluate, &ctx).await
    }

    pub async fn evaluate_inference_attempt(
        &self,
        context: &StudentContext,
        question: &str,
        answer: &str,
    ) -> anyhow::Result<(bool, String)> {
        let response = self.evaluate_attempt(context, question, answer).await?;
        let trimmed = response.trim_start();
        let is_correct = trimmed.starts_with("CORRETA:");
        let feedback = trimmed
            .strip_prefix("CORRETA:")
            .or_else(|| trimmed.strip_prefix("INCORRETA:"))
            .unwrap_or(trimmed)
            .trim()
            .to_string();
        Ok((is_correct, feedback))
    }

    pub async fn parse_goal(&self, text: &str) -> anyhow::Result<String> {
        let context = StudentContext {
            goal_id: None,
            current_skill_id: String::new(),
            mastery: 0,
            prerequisite_masteries: Vec::new(),
            recent_mistakes: Vec::new(),
            session_target: Some(text.to_string()),
            question: String::new(),
            answer: String::new(),
        };
        self.generate(InferenceMode::GoalParse, &context).await
    }
}

async fn build_full_context(state: &State<'_, AppState>, skill_id: &str, session_target: Option<String>, mastery: i32) -> anyhow::Result<StudentContext> {
    let db = state.db.lock().await;
    let builder = ContextBuilder::new(&db);
    let mut ctx = builder.build(skill_id)?;
    ctx.mastery = mastery.clamp(0, 100) as u8;
    ctx.session_target = session_target;
    Ok(ctx)
}

#[tauri::command]
pub async fn generate_inference_explanation(
    state: State<'_, AppState>,
    skill_id: String,
    context: String,
    mastery: i32,
) -> Result<String, String> {
    let settings = Settings::load().map_err(|e| e.to_string())?;
    let gateway = InferenceGateway::with_router(settings, state.model_router.clone());
    let ctx = build_full_context(&state, &skill_id, Some(context), mastery)
        .await
        .map_err(|e| e.to_string())?;
    gateway.generate_explanation(&ctx).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_inference_example(
    state: State<'_, AppState>,
    skill_id: String,
    context: String,
    mastery: i32,
) -> Result<String, String> {
    let settings = Settings::load().map_err(|e| e.to_string())?;
    let gateway = InferenceGateway::with_router(settings, state.model_router.clone());
    let ctx = build_full_context(&state, &skill_id, Some(context), mastery)
        .await
        .map_err(|e| e.to_string())?;
    gateway.generate_example(&ctx).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_inference_question(
    state: State<'_, AppState>,
    skill_id: String,
    context: String,
    mastery: i32,
) -> Result<String, String> {
    let settings = Settings::load().map_err(|e| e.to_string())?;
    let gateway = InferenceGateway::with_router(settings, state.model_router.clone());
    let ctx = build_full_context(&state, &skill_id, Some(context), mastery)
        .await
        .map_err(|e| e.to_string())?;
    gateway.generate_question(&ctx).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_inference_hint(
    state: State<'_, AppState>,
    skill_id: String,
    context: String,
    mastery: i32,
) -> Result<String, String> {
    let settings = Settings::load().map_err(|e| e.to_string())?;
    let gateway = InferenceGateway::with_router(settings, state.model_router.clone());
    let ctx = build_full_context(&state, &skill_id, Some(context), mastery)
        .await
        .map_err(|e| e.to_string())?;
    gateway.generate_hint(&ctx).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn parse_goal_with_ai(
    state: State<'_, AppState>,
    text: String,
) -> Result<String, String> {
    let settings = Settings::load().map_err(|e| e.to_string())?;
    let gateway = InferenceGateway::with_router(settings, state.model_router.clone());
    gateway.parse_goal(&text).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_nvidia_connection() -> Result<String, String> {
    let settings = Settings::load().map_err(|e| e.to_string())?;
    if settings
        .nvidia_api_key
        .as_deref()
        .map(str::trim)
        .unwrap_or("")
        .is_empty()
    {
        return Err("Nenhuma API key configurada. Informe sua chave da NVIDIA NIM em Configurações da IA.".to_string());
    }
    let provider = crate::inference::providers::nvidia::NvidiaProvider::new(
        settings.nvidia_api_key.clone(),
        settings.nvidia_model.clone(),
    );
    let model = settings
        .nvidia_model
        .clone()
        .unwrap_or_else(|| "meta/llama-3.1-70b-instruct".to_string());
    match provider.ping().await {
        Ok(reply) => Ok(format!("Conectado ao modelo {} — resposta: {}", model, reply)),
        Err(e) => Err(format!("Falha na conexão ({}): {}", model, e)),
    }
}

#[tauri::command]
pub async fn evaluate_inference_attempt(
    state: State<'_, AppState>,
    skill_id: String,
    context: String,
    mastery: i32,
    question: String,
    answer: String,
) -> Result<(bool, String), String> {
    let settings = Settings::load().map_err(|e| e.to_string())?;
    let gateway = InferenceGateway::with_router(settings, state.model_router.clone());
    let ctx = build_full_context(&state, &skill_id, Some(context), mastery)
        .await
        .map_err(|e| e.to_string())?;
    gateway.evaluate_inference_attempt(&ctx, &question, &answer).await.map_err(|e| e.to_string())
}


#[tauri::command]
pub async fn get_available_models(
    state: State<'_, AppState>,
    api_key: Option<String>,
    force_refresh: Option<bool>,
) -> Result<Vec<crate::inference::ModelInfo>, String> {
    let key = if let Some(k) = api_key.as_deref().filter(|k| !k.trim().is_empty()) {
        Some(k.to_string())
    } else {
        Settings::load().ok().and_then(|s| s.nvidia_api_key)
    };

    let force = force_refresh.unwrap_or(false);

    if let Some(k) = key.as_deref() {
        match state.model_registry.get_models(Some(k), force).await {
            Ok(models) => Ok(models),
            Err(e) => {
                eprintln!("Erro ao buscar modelos online ({}), retornando fallback", e);
                Ok(crate::inference::ModelRegistry::fallback_models())
            }
        }
    } else {
        Ok(crate::inference::ModelRegistry::fallback_models())
    }
}

#[tauri::command]
pub async fn get_model_health_stats(
    state: State<'_, AppState>,
) -> Result<Vec<ModelHealthStats>, String> {
    Ok(state.model_router.get_stats().await)
}

#[tauri::command]
pub async fn benchmark_models(
    api_key: Option<String>,
) -> Result<Vec<ModelBenchmarkResult>, String> {
    let key = if let Some(k) = api_key.as_deref().filter(|k| !k.trim().is_empty()) {
        Some(k.to_string())
    } else {
        Settings::load().ok().and_then(|s| s.nvidia_api_key)
    };

    let k = key.ok_or_else(|| "Nenhuma chave NVIDIA informada para benchmark".to_string())?;
    Ok(ModelRouter::benchmark_top_models(&k).await)
}
