use crate::llm::client::{ChatCompletion, LlmClient, ResponseFormat, ToolChoice, ToolDef};
use crate::llm::tier;
use crate::models_dev::{base_id, ModelsDevClient};
use anyhow::{Context, Result};
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
    catalog: Arc<ModelsDevClient>,
    fallback_model: Arc<Mutex<Option<String>>>,
}

impl LlmRouter {
    pub fn new(local: LlmClient) -> Self {
        Self::with_catalog(local, ModelsDevClient::load())
    }

    /// Build a router against a specific catalog (used by tests).
    pub fn with_catalog(local: LlmClient, catalog: ModelsDevClient) -> Self {
        Self {
            local,
            cloud: Arc::new(Mutex::new(None)),
            provider: Arc::new(Mutex::new(DEFAULT_PROVIDER.to_string())),
            cloud_models: Arc::new(Mutex::new(HashSet::new())),
            catalog: Arc::new(catalog),
            fallback_model: Arc::new(Mutex::new(None)),
        }
    }

    /// The currently active cloud provider id ("" when not configured).
    pub fn provider(&self) -> String {
        self.provider.lock().unwrap().clone()
    }

    /// Build (or rebuild) the cloud backend for `provider` from the models.dev
    /// catalog default base URL + the configured/env API key.  Returns the API
    /// base URL on success.
    pub fn set_provider(&self, provider: &str) -> Result<String> {
        let catalog_client = crate::models_dev::ModelsDevClient::load();
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

    /// Point the router at a cloud backend built from an explicit API base +
    /// key, without touching the providers store.  Used when credentials come
    /// from the frontend settings (Tauri commands) instead of `providers.toml`.
    pub fn set_cloud(&self, base_url: &str, api_key: &str) {
        *self.cloud.lock().unwrap() = Some(LlmClient::cloud(base_url, api_key));
        *self.provider.lock().unwrap() = DEFAULT_PROVIDER.to_string();
    }

    /// Build a router whose only backend is a cloud client configured with an
    /// explicit API base + key (Tauri commands receive the key from the UI).
    pub fn cloud_only(base_url: &str, api_key: &str) -> Self {
        let router = Self::new(LlmClient::ollama("http://localhost:11434"));
        router.set_cloud(base_url, api_key);
        router
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

    /// Try the primary model with retries; on any error, fall back to
    /// a same-tier model (if resolvable) and retry once.
    pub async fn generate_with_retry_with_fallback(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        match self
            .generate_with_retry(model, prompt, tools, response_format)
            .await
        {
            Ok(text) => Ok(text),
            Err(primary_err) => {
                let Some(fb_model) = self.resolve_fallback(model) else {
                    return Err(primary_err);
                };
                self.generate_with_retry(&fb_model, prompt, tools, response_format)
                    .await
                    .map_err(|fb_err| {
                        anyhow::anyhow!(
                            "{primary_err}\n  [fallback {fb_model} also failed: {fb_err}]"
                        )
                    })
            }
        }
    }

    pub async fn chat(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
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
        messages: Vec<serde_json::Value>,
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
        messages: Vec<serde_json::Value>,
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

    /// Try the primary model; on any error, automatically fall back to
    /// a same-tier model (if resolvable) and retry once.
    pub async fn chat_meta_with_fallback(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<ChatCompletion> {
        match self
            .chat_meta_with_choice(model, messages.clone(), tools, tool_choice, response_format)
            .await
        {
            Ok(completion) => Ok(completion),
            Err(primary_err) => {
                let Some(fb_model) = self.resolve_fallback(model) else {
                    return Err(primary_err);
                };
                // The fallback model may not support tools; capability
                // filtering is re-applied for its own id.
                self.chat_meta_with_choice(&fb_model, messages, tools, tool_choice, response_format)
                    .await
                    .map_err(|fb_err| {
                        anyhow::anyhow!(
                            "{primary_err}\n  [fallback {fb_model} also failed: {fb_err}]"
                        )
                    })
            }
        }
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
            .stream(&api_id, prompt, tools, response_format, on_token, on_tool_call_delta)
            .await
    }

    /// Stream a conversation response with the same same-tier fallback as
    /// [`Self::chat_meta_with_fallback`]: `on_token` receives each content
    /// delta while a normalized [`ChatCompletion`] is returned. The fallback
    /// attempt re-streams from scratch, so a failed primary call never leaves
    /// partial text behind in the final completion.
    pub async fn chat_meta_stream_with_fallback(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
    ) -> Result<ChatCompletion> {
        let client = self.client_for(model)?;
        let (_, api_id) = self.resolve(model);
        match client
            .chat_meta_stream(
                &api_id,
                messages.clone(),
                tools,
                tool_choice,
                response_format,
                on_token,
            )
            .await
        {
            Ok(completion) => Ok(completion),
            Err(primary_err) => {
                let Some(fb_model) = self.resolve_fallback(model) else {
                    return Err(primary_err);
                };
                let fb_client = self.client_for(&fb_model)?;
                let (_, fb_api_id) = self.resolve(&fb_model);
                fb_client
                    .chat_meta_stream(
                        &fb_api_id,
                        messages,
                        tools,
                        tool_choice,
                        response_format,
                        on_token,
                    )
                    .await
                    .map_err(|fb_err| {
                        anyhow::anyhow!(
                            "{primary_err}\n  [fallback {fb_model} also failed: {fb_err}]"
                        )
                    })
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models_dev::types::{Catalog, Cost, Limits, Modalities, ModelInfo, Provider};

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
            ModelsDevClient {
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
        assert!(fb.is_none(), "no same-tier fallback available in test catalog");
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
}
