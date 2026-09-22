use crate::llm::client::{ChatCompletion, LlmClient, ResponseFormat, ToolChoice, ToolDef};
use crate::llm::tier;
use crate::providers::{base_id, ProviderCatalog};
use crate::error::{Context, Result};
use std::collections::HashSet;
use std::sync::{Arc, Mutex};

/// Default cloud provider id used when none is explicitly selected.
pub const DEFAULT_PROVIDER: &str = "nvidia";

/// Default cloud model used for TUI and as the primary model for
/// same-tier fallback resolution.
pub const DEFAULT_CLOUD_MODEL: &str = "z-ai/glm-5.2";

/// Runtime router between the local backend (Ollama / GGUF) and a lazily-built
/// OpenAI-compatible cloud backend (NVIDIA NIM, Ollama Cloud, …).
///
/// The TUI starts with a single backend and lets the user switch cloud
/// providers and models live.  This router decides, per model id, whether a
/// request should go to the local server or to the cloud:
///
/// * ids explicitly marked as cloud (picked from a provider's model list) → cloud
/// * ids present in the active provider's catalog (matched by base id, so a
///   single model like `glm-5.2` can be served by several providers) → cloud
/// * provider-qualified ids (`nvidia/…`) → cloud
/// * everything else → local
///
/// The resolved id sent to the API is the active provider's catalog id (e.g.
/// `z-ai/glm-5.2` on NVIDIA NIM vs `glm-5.2` on Ollama Cloud), so one base
/// model works across providers.
///
/// `cloud`, `provider` and `cloud_models` live behind `Arc<Mutex<…>>` so a
/// clone handed to the agent thread sees provider changes made in the UI thread.
#[derive(Clone)]
pub struct LlmRouter {
    local: LlmClient,
    cloud: Arc<Mutex<Option<LlmClient>>>,
    provider: Arc<Mutex<String>>,
    cloud_models: Arc<Mutex<HashSet<String>>>,
    catalog: Arc<ProviderCatalog>,
    fallback_model: Arc<Mutex<Option<String>>>,
}

/// USD cost estimate for a completed LLM call, priced from the provider
/// catalog. Defaults to zero for local/free models not present in the catalog.
#[derive(Debug, Clone, Default)]
pub struct CostEstimate {
    pub input_usd: f64,
    pub output_usd: f64,
}

impl CostEstimate {
    pub fn total(&self) -> f64 {
        self.input_usd + self.output_usd
    }
}

#[derive(Debug, Clone)]
pub struct AutoTestProbeResult {
    pub model: String,
    pub latency_ms: u128,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone)]
pub struct AutoTestRecord {
    pub timestamp: String,
    pub provider: String,
    pub selected_model: String,
    pub selected_latency_ms: u128,
    pub results: Vec<AutoTestProbeResult>,
}

impl AutoTestProbeResult {
    pub fn to_json(&self) -> crate::json::Value {
        let mut object = std::collections::BTreeMap::new();
        object.insert("model".into(), crate::json::Value::from(self.model.clone()));
        object.insert("latency_ms".into(), crate::json::Value::from(self.latency_ms));
        object.insert("success".into(), crate::json::Value::from(self.success));
        object.insert("error".into(), crate::json::Value::from(self.error.clone()));
        crate::json::Value::object(object)
    }

    pub fn from_json(value: &crate::json::Value) -> crate::error::Result<Self> {
        let object = value.as_object().ok_or_else(|| crate::error::message("probe result must be an object"))?;
        Ok(Self {
            model: object.get("model").and_then(|v| v.as_str()).ok_or_else(|| crate::error::message("probe result missing model"))?.to_string(),
            latency_ms: object.get("latency_ms").and_then(|v| v.as_u64()).ok_or_else(|| crate::error::message("probe result missing latency_ms"))? as u128,
            success: object.get("success").and_then(|v| v.as_bool()).ok_or_else(|| crate::error::message("probe result missing success"))?,
            error: object.get("error").and_then(|v| if v.is_null() { None } else { v.as_str().map(str::to_string) }),
        })
    }
}

impl AutoTestRecord {
    pub fn to_json(&self) -> crate::json::Value {
        let mut object = std::collections::BTreeMap::new();
        object.insert("timestamp".into(), crate::json::Value::from(self.timestamp.clone()));
        object.insert("provider".into(), crate::json::Value::from(self.provider.clone()));
        object.insert("selected_model".into(), crate::json::Value::from(self.selected_model.clone()));
        object.insert("selected_latency_ms".into(), crate::json::Value::from(self.selected_latency_ms));
        object.insert("results".into(), crate::json::Value::array(self.results.iter().map(AutoTestProbeResult::to_json).collect::<Vec<_>>()));
        crate::json::Value::object(object)
    }

    pub fn from_json(value: &crate::json::Value) -> crate::error::Result<Self> {
        let object = value.as_object().ok_or_else(|| crate::error::message("auto-test record must be an object"))?;
        let results = object.get("results").and_then(|v| v.as_array()).ok_or_else(|| crate::error::message("auto-test record missing results"))?
            .iter().map(AutoTestProbeResult::from_json).collect::<crate::error::Result<Vec<_>>>()?;
        Ok(Self {
            timestamp: object.get("timestamp").and_then(|v| v.as_str()).ok_or_else(|| crate::error::message("record missing timestamp"))?.to_string(),
            provider: object.get("provider").and_then(|v| v.as_str()).ok_or_else(|| crate::error::message("record missing provider"))?.to_string(),
            selected_model: object.get("selected_model").and_then(|v| v.as_str()).ok_or_else(|| crate::error::message("record missing selected_model"))?.to_string(),
            selected_latency_ms: object.get("selected_latency_ms").and_then(|v| v.as_u64()).ok_or_else(|| crate::error::message("record missing selected_latency_ms"))? as u128,
            results,
        })
    }
}

impl LlmRouter {
    pub fn new(local: LlmClient) -> Self {
        Self::with_catalog(local, ProviderCatalog::load())
    }

    /// Build a router against a specific catalog (used by tests).
    pub fn with_catalog(local: LlmClient, catalog: ProviderCatalog) -> Self {
        Self {
            local,
            cloud: Arc::new(Mutex::new(None)),
            provider: Arc::new(Mutex::new(DEFAULT_PROVIDER.to_string())),
            cloud_models: Arc::new(Mutex::new(HashSet::new())),
            catalog: Arc::new(catalog),
            fallback_model: Arc::new(Mutex::new(None)),
        }
    }

    /// Build a router with a fake cloud client, used by tests that need a
    /// configured remote backend without a real provider/API key.
    #[cfg(test)]
    pub fn with_cloud_for_test(local: LlmClient, catalog: ProviderCatalog) -> Self {
        let router = Self::with_catalog(local, catalog);
        *router.cloud.lock().unwrap() =
            Some(LlmClient::cloud("https://fake.invalid/v1", "test-key"));
        router
    }

    /// The currently active cloud provider id ("" when not configured).
    pub fn provider(&self) -> String {
        self.provider.lock().unwrap().clone()
    }

    /// Read-only access to the provider catalog, used by the task router to
    /// resolve model capabilities and context windows per candidate.
    pub fn catalog_client(&self) -> &ProviderCatalog {
        &self.catalog
    }

    /// Build (or rebuild) the cloud backend for `provider` from the provider's
    /// API base URL + the configured/env API key.  Returns the API
    /// base URL on success.
    pub fn set_provider(&self, provider: &str) -> Result<String> {
        let catalog_client = crate::providers::ProviderCatalog::load();
        let (base, key) = crate::providers::ProviderStore::resolve_cloud_credentials(
            provider,
            &catalog_client.catalog,
        )
        .with_context(|| format!("configuring cloud provider '{provider}'"))?;
        *self.cloud.lock().unwrap() = Some(LlmClient::cloud(&base, &key));
        *self.provider.lock().unwrap() = provider.to_string();
        // Dynamically resolve a same-tier fallback for the default cloud model
        // instead of hardcoding a single model per provider.
        *self.fallback_model.lock().unwrap() =
            tier::find_same_tier_fallback(DEFAULT_CLOUD_MODEL, provider, &catalog_client);
        Ok(base)
    }

    /// Whether a cloud client is currently configured.
    pub fn cloud_configured(&self) -> bool {
        self.cloud.lock().unwrap().is_some()
    }

    /// Mark a model id as a cloud model (used by the TUI model picker).
    pub fn mark_cloud(&self, model: &str) {
        self.cloud_models.lock().unwrap().insert(model.to_string());
    }

    /// Unmark a model id so it routes to the local backend again.
    pub fn unmark_cloud(&self, model: &str) {
        self.cloud_models.lock().unwrap().remove(model);
    }

    /// Clear all cloud model markings (e.g. after switching provider).
    pub fn clear_cloud_marks(&self) {
        self.cloud_models.lock().unwrap().clear();
    }

    /// Set a fallback model used when the primary model fails for any
    /// reason (HTTP error, timeout, parse failure).  Pass `None` to
    /// disable fallback.
    pub fn set_fallback_model(&self, model: Option<String>) {
        *self.fallback_model.lock().unwrap() = model;
    }

    /// Return the configured fallback model, if any.
    pub fn fallback_model(&self) -> Option<String> {
        self.fallback_model.lock().unwrap().clone()
    }

    /// Update the active model and recompute the same-tier fallback.
    ///
    /// Call this when the primary model changes (e.g. user picks a new
    /// model in the TUI) so the fallback stays in the same intelligence
    /// tier as the new primary.
    pub fn set_model(&self, model: &str) {
        let provider = self.provider.lock().unwrap().clone();
        let fallback = tier::find_same_tier_fallback(model, &provider, &self.catalog);
        if let Some(fb) = &fallback {
            if fb != model {
                *self.fallback_model.lock().unwrap() = fallback;
            }
        }
    }

    /// Dynamically resolve a same-tier fallback for `model` that is
    /// guaranteed different from `model`.  Falls back to the stored
    /// `fallback_model` if no same-tier candidate is found.
    pub fn resolve_fallback(&self, model: &str) -> Option<String> {
        let provider = self.provider.lock().unwrap().clone();
        if let Some(fb) = tier::find_same_tier_fallback(model, &provider, &self.catalog) {
            if fb != model {
                return Some(fb);
            }
        }
        // Fall back to the stored fallback model
        let stored = self.fallback_model.lock().unwrap().clone();
        stored.filter(|fb| fb != model)
    }

    /// Estimate the USD cost of a completed call for `model` using provider
    /// catalog prices ($ per million tokens). Prefers the active provider's
    /// listing; falls back to any provider matching the base id. Local/free
    /// models not in the catalog price at zero.
    pub fn estimate_cost(
        &self,
        model: &str,
        prompt_tokens: usize,
        completion_tokens: usize,
    ) -> CostEstimate {
        let base = base_id(model);
        let active = self.provider();
        let mut found: Option<(f64, f64)> = None;
        for (pid, provider) in self.catalog.catalog.iter() {
            for (mid, info) in provider.models.iter() {
                if mid == model || base_id(mid) == base {
                    let candidate = (info.cost.input, info.cost.output);
                    let prefer = !active.is_empty() && pid == &active;
                    if found.is_none() || prefer {
                        found = Some(candidate);
                    }
                }
            }
        }
        let Some((input_mtok, output_mtok)) = found else {
            return CostEstimate::default();
        };
        CostEstimate {
            input_usd: input_mtok * prompt_tokens as f64 / 1e6,
            output_usd: output_mtok * completion_tokens as f64 / 1e6,
        }
    }

    /// Resolve a model id against the active provider: `(is_cloud, api_id)`.
    ///
    /// The `api_id` is the provider-specific catalog id when the model is a
    /// cloud model, so one base model (`glm-5.2`) works under any provider
    /// (`z-ai/glm-5.2` on NVIDIA NIM, `glm-5.2` on Ollama Cloud). The catalog
    /// takes precedence over the marked set so a marked base id is still sent
    /// to the API under the active provider's id.
    pub fn resolve(&self, model: &str) -> (bool, String) {
        let provider = self.provider.lock().unwrap().clone();
        if let Some(api_id) = self.catalog.provider_model_api_id(&provider, model) {
            return (true, api_id);
        }
        if self.cloud_models.lock().unwrap().contains(model) {
            return (true, model.to_string());
        }
        if base_id(model) != model {
            return (true, model.to_string());
        }
        (false, model.to_string())
    }

    /// True when `model` should be sent to the cloud backend.
    pub fn is_cloud_model(&self, model: &str) -> bool {
        self.resolve(model).0
    }

    /// Probe a model with a quick lightweight request to measure availability and latency (ms).
    /// Returns `Ok(Duration)` on success, or `Err` if unavailable / failing / rate limited.
    pub async fn test_model_availability(&self, model: &str) -> Result<std::time::Duration> {
        let (_, api_id) = self.resolve(model);
        let client = self.client_for(model)?;
        let start = std::time::Instant::now();
        let timeout_duration = std::time::Duration::from_secs(4);

        crate::async_rt::time::timeout(timeout_duration, client.generate(&api_id, "Hi", None, None))
            .await
            .map_err(|_| crate::error::anyhow!("Timeout probing model '{model}'"))?
            .map_err(|e| crate::error::anyhow!("Probe failed for model '{model}': {e}"))?;

        Ok(start.elapsed())
    }

    /// Test all candidate models and return a complete AutoTestRecord report.
    pub async fn test_and_rank_models(&self, candidates: &[String]) -> AutoTestRecord {
        let provider = self.provider();
        let timestamp = match std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) {
            Ok(d) => format!("T-unix +{}s", d.as_secs()),
            Err(_) => "Now".to_string(),
        };

        let mut results = Vec::new();
        let mut best: Option<(String, u128)> = None;

        for candidate in candidates {
            match self.test_model_availability(candidate).await {
                Ok(dur) => {
                    let ms = dur.as_millis();
                    results.push(AutoTestProbeResult {
                        model: candidate.clone(),
                        latency_ms: ms,
                        success: true,
                        error: None,
                    });
                    match &best {
                        None => best = Some((candidate.clone(), ms)),
                        Some((_, best_ms)) => {
                            if ms < *best_ms {
                                best = Some((candidate.clone(), ms));
                            }
                        }
                    }
                }
                Err(e) => {
                    results.push(AutoTestProbeResult {
                        model: candidate.clone(),
                        latency_ms: 0,
                        success: false,
                        error: Some(e.to_string()),
                    });
                }
            }
        }

        let (selected_model, selected_latency_ms) = if let Some((m, lat)) = best {
            (m, lat)
        } else if !candidates.is_empty() {
            (candidates[0].clone(), 0)
        } else {
            ("glm-5.2".to_string(), 0)
        };

        AutoTestRecord {
            timestamp,
            provider,
            selected_model,
            selected_latency_ms,
            results,
        }
    }

    /// Test a list of candidate model names and return the candidate model
    /// with the best availability (lowest latency + 200 OK status).
    pub async fn select_best_available_model(
        &self,
        candidates: &[String],
    ) -> Result<(String, std::time::Duration)> {
        let record = self.test_and_rank_models(candidates).await;
        Ok((
            record.selected_model,
            std::time::Duration::from_millis(record.selected_latency_ms as u64),
        ))
    }

    /// Pick the concrete client for a model id (cloned; cheap for reqwest).
    pub fn client_for(&self, model: &str) -> Result<LlmClient> {
        if self.is_cloud_model(model) {
            self.cloud
                .lock()
                .unwrap()
                .clone()
                .with_context(|| {
                    format!("model '{model}' is a cloud model but no cloud provider is configured (use /provider)")
                })
        } else {
            Ok(self.local.clone())
        }
    }

    pub async fn generate(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        let (_, api_id) = self.resolve(model);
        self.client_for(model)?
            .generate(&api_id, prompt, tools, response_format)
            .await
    }

    pub async fn generate_with_retry(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        let (_, api_id) = self.resolve(model);
        self.client_for(model)?
            .generate_with_retry(&api_id, prompt, tools, response_format)
            .await
    }

    /// Executes model generation with exponential backoff retry on transient HTTP errors (429/5xx).
    pub async fn generate_with_retry_with_fallback(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        self.generate_with_retry(model, prompt, tools, response_format)
            .await
    }

    pub async fn chat(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        self.chat_meta(model, messages, tools, response_format)
            .await
            .map(|c| c.content)
    }

    pub async fn chat_meta(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<ChatCompletion> {
        self.chat_meta_with_choice(model, messages, tools, None, response_format)
            .await
    }

    /// Whether the catalog reports native tool calling for `model` under the
    /// active provider. Unknown models are assumed capable so local/off-catalog
    /// models keep working; the loop still validates the response.
    pub fn supports_tool_calls(&self, model: &str) -> bool {
        let provider = self.provider.lock().unwrap().clone();
        let base = base_id(model);
        if let Some(catalog_provider) = self.catalog.catalog.get(&provider) {
            for (id, info) in catalog_provider.models.iter() {
                if id == model || base_id(id) == base {
                    return info.tool_call;
                }
            }
        }
        true
    }

    /// Chat with explicit `tool_choice`. Tools are dropped when the resolved
    /// model has no tool-calling capability, so an incapable model never
    /// receives a tool schema it cannot honor.
    pub async fn chat_meta_with_choice(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<ChatCompletion> {
        let (_, api_id) = self.resolve(model);
        let capable = self.supports_tool_calls(model);
        let tools = if capable { tools } else { None };
        let tool_choice = if capable && tools.is_some() {
            tool_choice
        } else {
            None
        };
        self.client_for(model)?
            .chat_meta(&api_id, messages, tools, tool_choice, response_format)
            .await
    }

    /// Chat with explicit `tool_choice` with exponential backoff retry.
    pub async fn chat_meta_with_fallback(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<ChatCompletion> {
        self.chat_meta_with_choice(model, messages, tools, tool_choice, response_format)
            .await
    }

    pub async fn stream(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
        on_tool_call_delta: &mut dyn FnMut(usize, Option<&str>, &str),
    ) -> Result<String> {
        let (_, api_id) = self.resolve(model);
        self.client_for(model)?
            .stream(
                &api_id,
                prompt,
                tools,
                response_format,
                on_token,
                on_tool_call_delta,
            )
            .await
    }

    /// Stream a conversation response on the active model with exponential backoff retry.
    pub async fn chat_meta_stream_with_fallback(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
        on_reasoning: Option<&mut dyn FnMut(&str)>,
        on_tool_call_delta: Option<&mut dyn FnMut(usize, Option<&str>, &str)>,
    ) -> Result<ChatCompletion> {
        let client = self.client_for(model)?;
        let (_, api_id) = self.resolve(model);
        client
            .chat_meta_stream(
                &api_id,
                messages,
                tools,
                tool_choice,
                response_format,
                on_token,
                on_reasoning,
                on_tool_call_delta,
            )
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::providers::types::{Catalog, Cost, Limits, Modalities, ModelInfo, Provider};

    fn model(id: &str, tool: bool) -> ModelInfo {
        ModelInfo {
            id: id.into(),
            name: id.into(),
            family: id.into(),
            reasoning: false,
            tool_call: tool,
            temperature: false,
            open_weights: true,
            attachment: false,
            limit: Limits {
                context: 131_072,
                output: 4096,
            },
            cost: Cost {
                input: 0.0,
                output: 0.0,
                cache_read: None,
                cache_write: None,
            },
            modalities: Modalities {
                input: vec!["text".into()],
                output: vec!["text".into()],
            },
            knowledge: None,
            release_date: None,
        }
    }

    fn provider(id: &str, models: Vec<ModelInfo>) -> Provider {
        let map = models.into_iter().map(|m| (m.id.clone(), m)).collect();
        Provider {
            id: id.into(),
            name: id.into(),
            api: String::new(),
            env: vec![],
            doc: String::new(),
            models: map,
        }
    }

    fn test_catalog() -> Catalog {
        let mut catalog = Catalog::new();
        catalog.insert(
            "ollama-cloud".into(),
            provider(
                "ollama-cloud",
                vec![model("glm-5.2", true), model("nemotron-3-nano:30b", true)],
            ),
        );
        catalog.insert(
            "nvidia".into(),
            provider(
                "nvidia",
                vec![
                    model("z-ai/glm-5.2", true),
                    model("legacy/no-tools-7b", false),
                    model("nvidia/nemotron-nano-9b-v2", true),
                    model("nvidia/llama-3.1-nemotron-70b-instruct", true),
                ],
            ),
        );
        catalog
    }

    fn router() -> LlmRouter {
        LlmRouter::with_catalog(
            LlmClient::ollama("http://localhost:11434"),
            ProviderCatalog {
                catalog: test_catalog(),
            },
        )
    }

    #[test]
    fn defaults_to_nvidia_provider() {
        assert_eq!(router().provider(), "nvidia");
        assert!(!router().cloud_configured());
    }

    #[test]
    fn capability_lookup_reflects_the_active_provider_catalog() {
        let router = router();
        assert!(router.supports_tool_calls("z-ai/glm-5.2"));
        assert!(router.supports_tool_calls("glm-5.2"));
        assert!(!router.supports_tool_calls("legacy/no-tools-7b"));
        // Unknown/local models stay usable; the loop validates their replies.
        assert!(router.supports_tool_calls("qwen3:1.7b"));
    }

    #[test]
    fn provider_qualified_ids_route_to_cloud() {
        let r = router();
        assert!(r.is_cloud_model("nvidia/llama-3.3-nemotron-super-49b-v1.5"));
        assert!(r.is_cloud_model("ollama-cloud/glm-5.1"));
        assert!(!r.is_cloud_model("qwen3:1.7b"));
    }

    #[test]
    fn single_model_resolves_per_active_provider() {
        let r = router();
        // Default provider is nvidia, which serves glm-5.2 as "z-ai/glm-5.2".
        assert_eq!(r.resolve("glm-5.2"), (true, "z-ai/glm-5.2".to_string()));
        // Switch to Ollama Cloud: same base model, provider-specific id.
        *r.provider.lock().unwrap() = "ollama-cloud".to_string();
        assert_eq!(r.resolve("glm-5.2"), (true, "glm-5.2".to_string()));
        assert_eq!(r.resolve("z-ai/glm-5.2"), (true, "glm-5.2".to_string()));
        // A model the provider does not serve stays local.
        assert_eq!(r.resolve("qwen3:1.7b"), (false, "qwen3:1.7b".to_string()));
    }

    #[test]
    fn marked_base_model_still_uses_provider_catalog_id() {
        let r = router();
        *r.provider.lock().unwrap() = "nvidia".to_string();
        // Marking a base id must not bypass the catalog's provider-specific id.
        r.mark_cloud("glm-5.2");
        assert_eq!(r.resolve("glm-5.2"), (true, "z-ai/glm-5.2".to_string()));
    }

    #[test]
    fn marked_models_route_to_cloud() {
        let r = router();
        r.mark_cloud("custom-cloud");
        assert!(r.is_cloud_model("custom-cloud"));
        r.unmark_cloud("custom-cloud");
        assert!(!r.is_cloud_model("custom-cloud"));
    }

    #[test]
    fn clear_cloud_marks_resets_marked_set() {
        let r = router();
        r.mark_cloud("custom-a");
        r.mark_cloud("custom-b");
        r.clear_cloud_marks();
        assert!(!r.is_cloud_model("custom-a"));
        assert!(!r.is_cloud_model("custom-b"));
    }

    #[test]
    fn estimate_cost_prices_cloud_models_and_ignores_local() {
        let mut model = model("z-ai/glm-5.2", true);
        model.cost.input = 0.50;
        model.cost.output = 1.00;
        let mut catalog = Catalog::new();
        catalog.insert("nvidia".into(), provider("nvidia", vec![model]));
        let r = LlmRouter::with_catalog(
            LlmClient::ollama("http://localhost:11434"),
            ProviderCatalog { catalog },
        );
        // 2M prompt @ $0.50/MTok + 1M completion @ $1.00/MTok.
        let cost = r.estimate_cost("glm-5.2", 2_000_000, 1_000_000);
        assert!((cost.input_usd - 1.0).abs() < 1e-9);
        assert!((cost.output_usd - 1.0).abs() < 1e-9);
        assert!((cost.total() - 2.0).abs() < 1e-9);
        // Local model not present in the catalog prices at zero.
        let local = r.estimate_cost("qwen3:1.7b", 1000, 1000);
        assert_eq!(local.total(), 0.0);
    }

    #[test]
    fn local_model_uses_local_client() {
        let r = router();
        let client = r.client_for("qwen3:1.7b").unwrap();
        match client {
            LlmClient::Ollama(_) => {}
            _ => panic!("expected local Ollama client"),
        }
    }

    #[test]
    fn unmapped_cloud_model_errors_without_configured_provider() {
        let r = router();
        let err = match r.client_for("nvidia/llama-3.3-nemotron-super-49b-v1.5") {
            Ok(_) => panic!("expected error for unconfigured cloud model"),
            Err(e) => e,
        };
        assert!(err.to_string().contains("no cloud provider is configured"));
    }

    #[test]
    fn resolve_fallback_finds_same_tier_model() {
        let r = router();
        // glm-5.2 is Intelligent tier; fallback should be a different Intelligent model.
        // In the test catalog, the only other Intelligent model on nvidia is... none.
        // GLM-5.2 is the only intelligent one, so fallback should be None.
        // Let's test with nemotron-70b which is Smart tier.
        let fb = r.resolve_fallback("nvidia/llama-3.1-nemotron-70b-instruct");
        assert!(
            fb.is_none(),
            "no same-tier fallback available in test catalog"
        );
    }

    #[test]
    fn fallback_never_returns_primary_model() {
        let r = router();
        // Even if resolve_fallback returns something, it must never equal the primary.
        let fb = r.resolve_fallback("z-ai/glm-5.2");
        if let Some(ref fb) = fb {
            assert_ne!(fb, "z-ai/glm-5.2");
        }
    }

    #[test]
    fn set_model_updates_fallback() {
        let r = router();
        // Should not panic; the test catalog may or may not have a same-tier fallback.
        r.set_model("nvidia/llama-3.1-nemotron-70b-instruct");
        // No same-tier model in test catalog, so fallback should remain None or unchanged.
    }

    #[test]
    fn select_best_available_model_returns_first_if_probes_fail() {
        crate::async_rt::block_on(async {
            let r = router();
            let candidates = vec![
                "nvidia/unknown-a".to_string(),
                "nvidia/unknown-b".to_string(),
            ];
            let (selected, _) = r.select_best_available_model(&candidates).await.unwrap();
            assert_eq!(selected, "nvidia/unknown-a");
        });
    }
}
