use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelCategory {
    Chat,
    Reasoning,
    Coding,
    Vision,
    Embedding,
    Safety,
    Other,
}

impl ModelCategory {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelCategory::Chat => "chat",
            ModelCategory::Reasoning => "reasoning",
            ModelCategory::Coding => "coding",
            ModelCategory::Vision => "vision",
            ModelCategory::Embedding => "embedding",
            ModelCategory::Safety => "safety",
            ModelCategory::Other => "other",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub owned_by: String,
    pub category: ModelCategory,
    pub is_recommended: bool,
}

#[derive(Debug, Deserialize)]
struct NvidiaModelsResponse {
    data: Vec<NvidiaModelItem>,
}

#[derive(Debug, Deserialize)]
struct NvidiaModelItem {
    id: String,
    #[serde(default)]
    owned_by: Option<String>,
}

pub struct ModelRegistry {
    cache: RwLock<Option<(Instant, Vec<ModelInfo>)>>,
    cache_ttl: Duration,
}

impl Default for ModelRegistry {
    fn default() -> Self {
        Self::new(Duration::from_secs(3600)) // 1 hour TTL
    }
}

impl ModelRegistry {
    pub fn new(cache_ttl: Duration) -> Self {
        Self {
            cache: RwLock::new(None),
            cache_ttl,
        }
    }

    pub fn classify_model(id: &str, owned_by: Option<&str>) -> ModelInfo {
        let lower = id.to_lowercase();
        let owned = owned_by.unwrap_or("unknown").to_string();

        let category = if lower.contains("embed")
            || lower.contains("bge-")
            || lower.contains("e5-")
            || lower.contains("rerank")
            || lower.contains("retriever")
        {
            ModelCategory::Embedding
        } else if lower.contains("guard")
            || lower.contains("aegis")
            || lower.contains("shield")
            || lower.contains("safety")
        {
            ModelCategory::Safety
        } else if lower.contains("coder")
            || lower.contains("starcoder")
            || lower.contains("codestral")
            || lower.contains("deepseek-coder")
            || lower.contains("devstral")
        {
            ModelCategory::Coding
        } else if lower.contains("vision")
            || lower.contains("vila")
            || lower.contains("nvlm")
            || lower.contains("pixtral")
            || lower.contains("kosmos")
            || lower.contains("vl-")
            || lower.contains("-vl")
        {
            ModelCategory::Vision
        } else if lower.contains("r1")
            || lower.contains("reasoning")
            || lower.contains("reasoner")
            || lower.contains("qwq")
            || lower.contains("thinking")
        {
            ModelCategory::Reasoning
        } else if lower.contains("instruct")
            || lower.contains("chat")
            || lower.contains("nemotron")
            || lower.contains("llama")
            || lower.contains("mistral")
            || lower.contains("gemma")
            || lower.contains("kimi")
            || lower.contains("phi")
            || lower.contains("gpt")
            || lower.contains("qwen")
            || lower.contains("deepseek")
            || lower.contains("-it")
        {
            ModelCategory::Chat
        } else {
            ModelCategory::Other
        };

        let is_recommended = matches!(
            id,
            "meta/llama-3.1-70b-instruct"
                | "meta/llama-3.3-70b-instruct"
                | "nvidia/llama-3.1-nemotron-70b-instruct"
                | "mistralai/mistral-large-2-instruct"
                | "deepseek-ai/deepseek-r1"
                | "nvidia/nemotron-3-super-120b-a12b"
                | "nvidia/nemotron-3.5-lightning-30b-a3b"
        );

        let name = Self::format_display_name(id);

        ModelInfo {
            id: id.to_string(),
            name,
            owned_by: owned,
            category,
            is_recommended,
        }
    }

    fn format_display_name(id: &str) -> String {
        let parts: Vec<&str> = id.split('/').collect();
        let base = if parts.len() > 1 { parts[1] } else { parts[0] };
        
        base.replace('-', " ")
            .replace('_', " ")
            .split_whitespace()
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<Vec<String>>()
            .join(" ")
    }

    pub async fn get_models(
        &self,
        api_key: Option<&str>,
        force_refresh: bool,
    ) -> anyhow::Result<Vec<ModelInfo>> {
        if !force_refresh {
            let cache_read = self.cache.read().await;
            if let Some((timestamp, models)) = &*cache_read {
                if timestamp.elapsed() < self.cache_ttl {
                    return Ok(models.clone());
                }
            }
        }

        let key = api_key.ok_or_else(|| anyhow::anyhow!("NVIDIA API Key não fornecida"))?;
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .build()?;

        let response = client
            .get("https://integrate.api.nvidia.com/v1/models")
            .header("Authorization", format!("Bearer {}", key))
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let err_text = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("NVIDIA API HTTP {}: {}", status, err_text));
        }

        let body: NvidiaModelsResponse = response.json().await?;
        let mut models: Vec<ModelInfo> = body
            .data
            .into_iter()
            .map(|m| Self::classify_model(&m.id, m.owned_by.as_deref()))
            .collect();

        models.sort_by(|a, b| {
            b.is_recommended
                .cmp(&a.is_recommended)
                .then_with(|| {
                    let cat_order = |cat: &ModelCategory| match cat {
                        ModelCategory::Chat => 0,
                        ModelCategory::Reasoning => 1,
                        ModelCategory::Coding => 2,
                        ModelCategory::Vision => 3,
                        ModelCategory::Embedding => 4,
                        ModelCategory::Safety => 5,
                        ModelCategory::Other => 6,
                    };
                    cat_order(&a.category).cmp(&cat_order(&b.category))
                })
                .then_with(|| a.id.cmp(&b.id))
        });

        let mut cache_write = self.cache.write().await;
        *cache_write = Some((Instant::now(), models.clone()));

        Ok(models)
    }

    pub fn fallback_models() -> Vec<ModelInfo> {
        let default_ids = [
            ("meta/llama-3.1-70b-instruct", Some("meta")),
            ("meta/llama-3.3-70b-instruct", Some("meta")),
            ("nvidia/llama-3.1-nemotron-70b-instruct", Some("nvidia")),
            ("nvidia/nemotron-3-super-120b-a12b", Some("nvidia")),
            ("nvidia/nemotron-3.5-lightning-30b-a3b", Some("nvidia")),
            ("mistralai/mistral-large-2-instruct", Some("mistralai")),
            ("deepseek-ai/deepseek-r1", Some("deepseek-ai")),
            ("qwen/qwen-2.5-coder-32b-instruct", Some("qwen")),
            ("google/gemma-2-27b-it", Some("google")),
        ];

        default_ids
            .iter()
            .map(|(id, owner)| Self::classify_model(id, *owner))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_chat_models() {
        let m1 = ModelRegistry::classify_model("meta/llama-3.1-70b-instruct", Some("meta"));
        assert_eq!(m1.category, ModelCategory::Chat);
        assert!(m1.is_recommended);

        let m2 = ModelRegistry::classify_model("nvidia/llama-3.1-nemotron-70b-instruct", Some("nvidia"));
        assert_eq!(m2.category, ModelCategory::Chat);
        assert!(m2.is_recommended);

        let m3 = ModelRegistry::classify_model("google/gemma-2-27b-it", Some("google"));
        assert_eq!(m3.category, ModelCategory::Chat);
    }

    #[test]
    fn test_classify_reasoning_models() {
        let m = ModelRegistry::classify_model("deepseek-ai/deepseek-r1", Some("deepseek-ai"));
        assert_eq!(m.category, ModelCategory::Reasoning);
        assert!(m.is_recommended);

        let m2 = ModelRegistry::classify_model("qwen/qwq-32b-preview", Some("qwen"));
        assert_eq!(m2.category, ModelCategory::Reasoning);
    }

    #[test]
    fn test_classify_coding_models() {
        let m = ModelRegistry::classify_model("qwen/qwen-2.5-coder-32b-instruct", Some("qwen"));
        assert_eq!(m.category, ModelCategory::Coding);

        let m2 = ModelRegistry::classify_model("mistralai/codestral-22b-instruct-v0.1", Some("mistralai"));
        assert_eq!(m2.category, ModelCategory::Coding);
    }

    #[test]
    fn test_classify_embedding_and_safety_models() {
        let embed = ModelRegistry::classify_model("nvidia/nv-embedqa-e5-v5", Some("nvidia"));
        assert_eq!(embed.category, ModelCategory::Embedding);

        let guard = ModelRegistry::classify_model("meta/llama-guard-3-8b", Some("meta"));
        assert_eq!(guard.category, ModelCategory::Safety);
    }

    #[test]
    fn test_fallback_models_non_empty() {
        let fallback = ModelRegistry::fallback_models();
        assert!(!fallback.is_empty());
        assert!(fallback.iter().any(|m| m.id == "meta/llama-3.1-70b-instruct"));
    }
}
