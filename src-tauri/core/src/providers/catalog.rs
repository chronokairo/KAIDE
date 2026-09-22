//! Provider model catalog, populated on first run from each provider's own
//! official model-listing endpoint and cached locally. No external catalog
//! (models.dev) is consulted: models are discovered directly from the
//! providers themselves (Ollama `/api/tags`, Gemini `/models`,
//! OpenAI-compatible `/models`, …).

use crate::error::Result;
use crate::providers::types::{Catalog, CloudMatch, Cost, Limits, Modalities, ModelInfo, Provider};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Duration;

/// Local model cache is refreshed after 24 hours; discovery runs again then.
const CACHE_TTL_SECS: u64 = 86_400;
/// Timeout for a single provider model-list request.
const FETCH_TIMEOUT: Duration = Duration::from_secs(15);
/// Default context window used for remote models that don't report one.
const DEFAULT_CLOUD_CONTEXT: u64 = 131_072;

/// Static metadata for a known provider: how to reach it, which env var(s)
/// carry the API key, and the official model-listing route it exposes.
pub(crate) struct KnownProvider {
    pub(crate) id: &'static str,
    pub(crate) name: &'static str,
    pub(crate) api: &'static str,
    pub(crate) env: &'static [&'static str],
}

/// Built-in provider registry. Replaces the models.dev catalog: every entry
/// points directly at the provider's own API.
pub(crate) const KNOWN_PROVIDERS: &[KnownProvider] = &[
    KnownProvider {
        id: "ollama",
        name: "Ollama (local)",
        api: "http://localhost:11434",
        env: &["OLLAMA_API_KEY"],
    },
    KnownProvider {
        id: "nvidia",
        name: "NVIDIA NIM",
        api: "https://integrate.api.nvidia.com/v1",
        env: &["NVIDIA_API_KEY"],
    },
    KnownProvider {
        id: "openrouter",
        name: "OpenRouter",
        api: "https://openrouter.ai/api/v1",
        env: &["OPENROUTER_API_KEY"],
    },
    KnownProvider {
        id: "groq",
        name: "Groq",
        api: "https://api.groq.com/openai/v1",
        env: &["GROQ_API_KEY"],
    },
    KnownProvider {
        id: "google",
        name: "Google Gemini",
        api: "https://generativelanguage.googleapis.com/v1beta",
        env: &["GEMINI_API_KEY"],
    },
    KnownProvider {
        id: "openai",
        name: "OpenAI",
        api: "https://api.openai.com/v1",
        env: &["OPENAI_API_KEY"],
    },
    KnownProvider {
        id: "deepseek",
        name: "DeepSeek",
        api: "https://api.deepseek.com/v1",
        env: &["DEEPSEEK_API_KEY"],
    },
    KnownProvider {
        id: "mistral",
        name: "Mistral AI",
        api: "https://api.mistral.ai/v1",
        env: &["MISTRAL_API_KEY"],
    },
    KnownProvider {
        id: "togetherai",
        name: "Together AI",
        api: "https://api.together.xyz/v1",
        env: &["TOGETHER_API_KEY"],
    },
];

pub(crate) fn known_provider(provider_id: &str) -> Option<&'static KnownProvider> {
    KNOWN_PROVIDERS.iter().find(|kp| kp.id == provider_id)
}

/// The provider model catalog: a `provider_id -> Provider` map discovered from
/// the providers themselves and cached on disk for fast/offline reuse.
pub struct ProviderCatalog {
    pub catalog: Catalog,
}

impl ProviderCatalog {
    /// Load the catalog: try the fresh local cache first, otherwise discover
    /// models from each provider's official listing endpoint and persist it.
    /// Never panics — on any error returns whatever was discovered (possibly
    /// a metadata-only catalog) and logs a warning.
    pub fn load() -> Self {
        let cache = cache_path();
        if let Some(c) = try_load_cache(&cache) {
            return Self { catalog: c };
        }
        // The legacy models.dev cache is now obsolete; drop it if present.
        let _ = std::fs::remove_file(legacy_cache_path());

        let catalog = discover();
        if let Ok(j) = serde_json::to_vec(&catalog) {
            std::fs::write(&cache, j).ok();
        }
        Self { catalog }
    }

    // ── Query API ─────────────────────────────────────────────────────────────

    /// All (provider_id, model_id, &ModelInfo) triples.
    pub fn all_models(&self) -> Vec<(&str, &str, &ModelInfo)> {
        self.catalog
            .iter()
            .flat_map(|(pid, prov)| {
                prov.models
                    .iter()
                    .map(move |(mid, m)| (pid.as_str(), mid.as_str(), m))
            })
            .collect()
    }

    /// Find a model by exact id across all providers.
    pub fn find_by_id(&self, id: &str) -> Option<(&str, &ModelInfo)> {
        for (pid, prov) in &self.catalog {
            if let Some(m) = prov.models.get(id) {
                return Some((pid, m));
            }
        }
        None
    }

    /// Filter models by predicate.
    pub fn filter<F: Fn(&ModelInfo) -> bool>(&self, pred: F) -> Vec<(&str, &ModelInfo)> {
        self.catalog
            .iter()
            .flat_map(|(pid, prov)| {
                prov.models
                    .values()
                    .filter(|m| pred(m))
                    .map(move |m| (pid.as_str(), m))
            })
            .collect()
    }

    /// Suggest the cheapest cloud models for a given task category.
    /// Returns up to `top_n` models ordered by input cost (ties broken by id).
    pub fn suggest_for_task(&self, category: &str, top_n: usize) -> Vec<(&str, &ModelInfo)> {
        let need_reasoning = matches!(category, "reasoning");
        let need_coding = matches!(category, "coding");

        let mut candidates: Vec<(&str, &ModelInfo)> = self
            .catalog
            .iter()
            .flat_map(|(pid, prov)| prov.models.values().map(move |m| (pid.as_str(), m)))
            .filter(|(_, m)| {
                let has_text_out = m.modalities.output.iter().any(|o| o == "text");
                let ok_reasoning = !need_reasoning || m.reasoning;
                let ok_coding = !need_coding || m.tool_call;
                has_text_out && ok_reasoning && ok_coding
            })
            .collect();

        candidates.sort_by(|a, b| {
            a.1.cost
                .input
                .partial_cmp(&b.1.cost.input)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.1.id.cmp(&b.1.id))
        });
        candidates.into_iter().take(top_n).collect()
    }

    /// Try to find a cloud model that matches a local ollama model name (e.g. "gemma3:4b").
    /// Matches on family prefix — picks cheapest qualifying model of that family.
    pub fn match_local(&self, ollama_name: &str) -> Option<CloudMatch> {
        let family = normalize_family(ollama_name);

        let mut matches: Vec<(&str, &ModelInfo)> = self
            .catalog
            .iter()
            .flat_map(|(pid, prov)| prov.models.values().map(move |m| (pid.as_str(), m)))
            .filter(|(_, m)| {
                let mf = m.family.to_lowercase().replace(['-', '_', '.'], "");
                mf.contains(&family) || family.contains(&mf)
            })
            .collect();

        matches.sort_by(|a, b| {
            a.1.cost
                .input
                .partial_cmp(&b.1.cost.input)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.1.id.cmp(&b.1.id))
        });

        matches.first().map(|(pid, m)| CloudMatch {
            provider: pid.to_string(),
            model_id: m.id.clone(),
            model_name: m.name.clone(),
            cost_in: m.cost.input,
            cost_out: m.cost.output,
            context_k: m.limit.context / 1000,
            reasoning: m.reasoning,
        })
    }

    /// All models from a named provider.
    pub fn provider_models(&self, provider_id: &str) -> Vec<&ModelInfo> {
        self.catalog
            .get(provider_id)
            .map(|p| p.models.values().collect())
            .unwrap_or_default()
    }

    /// Find the provider-specific API model id for `model` inside `provider`'s
    /// catalog, matching on exact id or normalized base id. One model may be
    /// served by several providers under different ids (e.g. `glm-5.2` on
    /// Ollama vs `z-ai/glm-5.2` on NVIDIA NIM), so the router resolves the id
    /// per active provider.
    pub fn provider_model_api_id(&self, provider: &str, model: &str) -> Option<String> {
        let base = crate::providers::base_id(model);
        for (id, _) in self.catalog.get(provider)?.models.iter() {
            if id == model || crate::providers::base_id(id) == base {
                return Some(id.clone());
            }
        }
        None
    }

    /// Print a human-readable list of models matching a query string.
    pub fn print_list(&self, query: &str) {
        let q = query.to_lowercase();
        let mut rows: Vec<(&str, &ModelInfo)> = self
            .catalog
            .iter()
            .flat_map(|(pid, prov)| prov.models.values().map(move |m| (pid.as_str(), m)))
            .filter(|(pid, m)| {
                q.is_empty()
                    || m.id.to_lowercase().contains(&q)
                    || m.name.to_lowercase().contains(&q)
                    || m.family.to_lowercase().contains(&q)
                    || pid.to_lowercase().contains(&q)
            })
            .collect();

        rows.sort_by(|a, b| {
            a.1.cost
                .input
                .partial_cmp(&b.1.cost.input)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.1.id.cmp(&b.1.id))
        });

        println!(
            "\n{:<30} {:<14} {:>9} {:>9} {:>9}  Caps",
            "Model ID", "Provider", "In$/MTok", "Out$/MTok", "Ctx(K)"
        );
        println!("{}", "─".repeat(95));
        for (pid, m) in &rows {
            let caps = [
                if m.reasoning { "reason" } else { "" },
                if m.tool_call { "tools" } else { "" },
                if m.open_weights { "oss" } else { "" },
            ]
            .iter()
            .filter(|s| !s.is_empty())
            .cloned()
            .collect::<Vec<_>>()
            .join(" ");
            println!(
                "{:<30} {:<14} {:>9} {:>9} {:>9}  {}",
                truncate(&m.id, 30),
                truncate(pid, 14),
                fmt_cost(m.cost.input),
                fmt_cost(m.cost.output),
                m.limit.context / 1000,
                caps
            );
        }
        println!("\n  {} models", rows.len());
    }
}

// ── discovery ────────────────────────────────────────────────────────────────

/// Build the catalog by querying each known provider's official model endpoint.
/// Providers without a configured API key keep their metadata (base URL, env
/// var) so they stay usable via `providers set/import`, but carry no models.
fn discover() -> Catalog {
    let store = crate::providers::ProviderStore::load();
    let env_map = crate::providers::load_env_with_dotenv();

    let mut catalog = Catalog::new();
    for kp in KNOWN_PROVIDERS {
        let mut prov = Provider {
            id: kp.id.to_string(),
            name: kp.name.to_string(),
            api: kp.api.to_string(),
            env: kp.env.iter().map(|s| s.to_string()).collect(),
            doc: String::new(),
            models: HashMap::new(),
        };

        for (mid, info) in discover_models_for(kp, &store, &env_map) {
            prov.models.insert(mid, info);
        }

        catalog.insert(kp.id.to_string(), prov);
    }
    catalog
}

/// Resolve an API key for a provider: store first, then env/`.env`/globals.
fn provider_key(
    kp: &KnownProvider,
    store: &crate::providers::ProviderStore,
    env_map: &HashMap<String, String>,
) -> Option<String> {
    if let Some(k) = store.api_key(kp.id) {
        return Some(k.to_string());
    }
    for env in kp.env {
        if let Some(v) = env_map.get(*env) {
            if !v.is_empty() {
                return Some(v.clone());
            }
        }
    }
    None
}

/// Fetch and map the models of one provider (best-effort; errors are logged
/// and yield an empty list so discovery never fails as a whole).
fn discover_models_for(
    kp: &KnownProvider,
    store: &crate::providers::ProviderStore,
    env_map: &HashMap<String, String>,
) -> Vec<(String, ModelInfo)> {
    let result = if kp.id == "ollama" {
        fetch_ollama_models()
    } else {
        let Some(key) = provider_key(kp, store, env_map) else {
            return Vec::new();
        };
        if kp.id == "google" {
            fetch_gemini_models(kp, &key)
        } else {
            fetch_openai_compatible_models(kp, &key)
        }
    };

    match result {
        Ok(list) => list,
        Err(e) => {
            crate::cki_warn!(
                "providers: model discovery failed for '{}' ({e})",
                kp.id
            );
            Vec::new()
        }
    }
}

/// OpenAI-compatible `GET {base}/models` listing (NVIDIA, Groq, OpenRouter, …).
fn fetch_openai_compatible_models(
    kp: &KnownProvider,
    key: &str,
) -> Result<Vec<(String, ModelInfo)>> {
    let url = format!("{}/models", kp.api.trim_end_matches('/'));
    let resp = crate::http::blocking::Client::builder()
        .timeout(FETCH_TIMEOUT)
        .build()?
        .get(&url)
        .bearer_auth(key)
        .send()?;
    if !resp.status().is_success() {
        return Ok(Vec::new());
    }
    let body = resp.text()?;
    let value: serde_json::Value = serde_json::from_str(&body)?;
    let data: Vec<serde_json::Value> = value
        .get("data")
        .and_then(|d| d.as_array())
        .cloned()
        .unwrap_or_default();

    let mut out = Vec::new();
    for entry in data.iter() {
        let Some(id) = entry.get("id").and_then(|i| i.as_str()) else {
            continue;
        };
        if id.is_empty() {
            continue;
        }
        out.push((id.to_string(), cloud_model_info(id, None)));
    }
    Ok(out)
}

/// Gemini REST `GET {base}/models?key=…` listing.
fn fetch_gemini_models(kp: &KnownProvider, key: &str) -> Result<Vec<(String, ModelInfo)>> {
    let url = format!(
        "{}/models?key={}",
        kp.api.trim_end_matches('/'),
        urlencode(key)
    );
    let resp = crate::http::blocking::Client::builder()
        .timeout(FETCH_TIMEOUT)
        .build()?
        .get(&url)
        .send()?;
    if !resp.status().is_success() {
        return Ok(Vec::new());
    }
    let body = resp.text()?;
    let value: serde_json::Value = serde_json::from_str(&body)?;
    let models: Vec<serde_json::Value> = value
        .get("models")
        .and_then(|m| m.as_array())
        .cloned()
        .unwrap_or_default();

    let mut out = Vec::new();
    for entry in models.iter() {
        let Some(name) = entry.get("name").and_then(|n| n.as_str()) else {
            continue;
        };
        let id = name.strip_prefix("models/").unwrap_or(name).to_string();
        if id.is_empty() {
            continue;
        }
        out.push((id.clone(), cloud_model_info(&id, Some(name))));
    }
    Ok(out)
}

/// Ollama local `GET {base}/api/tags` listing (the official route).
fn fetch_ollama_models() -> Result<Vec<(String, ModelInfo)>> {
    let base = std::env::var("OLLAMA_HOST")
        .unwrap_or_else(|_| KNOWN_PROVIDERS[0].api.to_string());
    let url = format!("{}/api/tags", base.trim_end_matches('/'));
    let resp = crate::http::blocking::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()?
        .get(&url)
        .send()?;
    if !resp.status().is_success() {
        return Ok(Vec::new());
    }
    let body = resp.text()?;
    let value: serde_json::Value = serde_json::from_str(&body)?;
    let models: Vec<serde_json::Value> = value
        .get("models")
        .and_then(|m| m.as_array())
        .cloned()
        .unwrap_or_default();

    let mut out = Vec::new();
    for entry in models.iter() {
        let Some(id) = entry.get("name").and_then(|n| n.as_str()) else {
            continue;
        };
        if id.is_empty() {
            continue;
        }
        let family = entry
            .get("details")
            .and_then(|d| d.get("family"))
            .and_then(|f| f.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| base_id(id).replace(['-', '_', '.'], ""));
        let context = entry
            .get("details")
            .and_then(|d| d.get("context_length"))
            .and_then(|c| c.as_u64())
            .unwrap_or(0);
        let caps: Vec<String> = entry
            .get("capabilities")
            .and_then(|c| c.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|c| c.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default();
        let reasoning = caps.iter().any(|c| c == "thinking" || c == "reasoning");
        let tool_call = caps.iter().any(|c| c == "tools" || c == "tool_call");
        let vision = caps.iter().any(|c| c == "vision");

        out.push((
            id.to_string(),
            ModelInfo {
                id: id.to_string(),
                name: id.to_string(),
                family,
                reasoning,
                tool_call,
                temperature: true,
                open_weights: true,
                attachment: vision,
                limit: Limits {
                    context: if context > 0 { context } else { DEFAULT_CLOUD_CONTEXT },
                    output: 0,
                },
                cost: Cost::default(),
                modalities: Modalities {
                    input: if vision {
                        vec!["text".into(), "image".into()]
                    } else {
                        vec!["text".into()]
                    },
                    output: vec!["text".into()],
                },
                knowledge: None,
                release_date: None,
            },
        ));
    }
    Ok(out)
}

fn cloud_model_info(id: &str, display_name: Option<&str>) -> ModelInfo {
    let (reasoning, vision) = heuristic_flags(id);
    let name = display_name
        .map(|s| s.to_string())
        .unwrap_or_else(|| id.to_string());
    ModelInfo {
        id: id.to_string(),
        name,
        family: base_id(id).replace(['-', '_', '.'], ""),
        reasoning,
        tool_call: true,
        temperature: true,
        open_weights: true,
        attachment: vision,
        limit: Limits {
            context: DEFAULT_CLOUD_CONTEXT,
            output: 0,
        },
        cost: Cost::default(),
        modalities: Modalities {
            input: if vision {
                vec!["text".into(), "image".into()]
            } else {
                vec!["text".into()]
            },
            output: vec!["text".into()],
        },
        knowledge: None,
        release_date: None,
    }
}

/// Heuristic capability flags derived from a model id.
fn heuristic_flags(id: &str) -> (bool, bool) {
    let l = id.to_lowercase();
    let reasoning = l.contains("reason")
        || l.contains("think")
        || l.contains("deepseek")
        || l.contains("kimi")
        || l.contains("glm-5")
        || l.contains("gpt-5")
        || l.contains("o1")
        || l.contains("o3")
        || l.contains("o4")
        || l.contains("gemini-2")
        || l.contains("gemini-3")
        || l.contains("claude");
    let vision = l.contains("vision") || l.contains("omni") || l.contains("gemini");
    (reasoning, vision)
}

// ── cache ────────────────────────────────────────────────────────────────────

fn cache_path() -> PathBuf {
    home_under_cache("provider_catalog.json")
}

fn legacy_cache_path() -> PathBuf {
    home_under_cache("models_dev.json")
}

fn home_under_cache(file: &str) -> PathBuf {
    let dir = crate::config::home_dir().join(".cache").join("rustcode");
    std::fs::create_dir_all(&dir).ok();
    dir.join(file)
}

fn try_load_cache(path: &PathBuf) -> Option<Catalog> {
    let meta = std::fs::metadata(path).ok()?;
    let age = meta.modified().ok()?.elapsed().ok()?;
    if age.as_secs() > CACHE_TTL_SECS {
        return None;
    }
    let bytes = std::fs::read(path).ok()?;
    serde_json::from_slice(&bytes).ok()
}

// ── helpers ──────────────────────────────────────────────────────────────────

fn normalize_family(ollama_name: &str) -> String {
    // "gemma3:4b" → "gemma"
    // "llama3.2:3b" → "llama"
    // "qwen3:8b" → "qwen"
    let base = ollama_name.split(':').next().unwrap_or(ollama_name);
    let trimmed = base.trim_end_matches(|c: char| c.is_ascii_digit() || c == '.');
    trimmed.to_lowercase().replace(['-', '_', '.'], "")
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}…", &s[..max.saturating_sub(1)])
    }
}

fn fmt_cost(c: f64) -> String {
    if c <= 0.0 {
        "free".to_string()
    } else {
        format!("{c:.3}")
    }
}

/// Percent-encode a value for a URL query parameter (no external crates).
fn urlencode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

/// Canonical base id for a model: the last `/`-separated segment, lowercased,
/// with any `:tag` suffix kept. `z-ai/glm-5.2` → `glm-5.2`,
/// `zai-org/GLM-5.2` → `glm-5.2`, `qwen3:1.7b` → `qwen3:1.7b`.
pub fn base_id(id: &str) -> String {
    id.rsplit('/').next().unwrap_or(id).to_ascii_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::providers::types::{Cost, Limits, Modalities, ModelInfo, Provider};

    fn model(id: &str, family: &str, tool: bool, cost_in: f64) -> ModelInfo {
        ModelInfo {
            id: id.into(),
            name: id.into(),
            family: family.into(),
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
                input: cost_in,
                output: cost_in,
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
            api: format!("https://{id}.example.com/v1"),
            env: vec![],
            doc: String::new(),
            models: map,
        }
    }

    fn sample_client() -> ProviderCatalog {
        let mut catalog = Catalog::new();
        catalog.insert(
            "fakea".into(),
            provider(
                "fakea",
                vec![
                    model("fakea/cheap:1b", "cheap", true, 0.05),
                    model("fakea/pricey:4b", "pricey", false, 0.50),
                ],
            ),
        );
        catalog.insert(
            "fakeb".into(),
            provider("fakeb", vec![model("fakeb/gemma:4b", "gemma", true, 0.20)]),
        );
        ProviderCatalog { catalog }
    }

    #[test]
    fn find_by_id_locates_model_across_providers() {
        let c = sample_client();
        let (pid, m) = c.find_by_id("fakeb/gemma:4b").unwrap();
        assert_eq!(pid, "fakeb");
        assert_eq!(m.id, "fakeb/gemma:4b");
        assert!(c.find_by_id("does-not-exist").is_none());
    }

    #[test]
    fn provider_models_returns_only_that_provider() {
        let c = sample_client();
        let models = c.provider_models("fakea");
        assert_eq!(models.len(), 2);
        assert!(c.provider_models("nope").is_empty());
    }

    #[test]
    fn suggest_for_task_prefers_cheapest_tool_callable() {
        let c = sample_client();
        let best = c.suggest_for_task("coding", 3);
        let (pid, m) = best[0];
        assert_eq!((pid, m.id.as_str()), ("fakea", "fakea/cheap:1b"));
    }

    #[test]
    fn match_local_maps_ollama_family_to_cloud() {
        let c = sample_client();
        let matched = c.match_local("gemma3:4b").unwrap();
        assert_eq!(matched.model_id, "fakeb/gemma:4b");
        assert_eq!(matched.provider, "fakeb");
    }

    #[test]
    fn match_local_returns_none_when_no_family_matches() {
        let c = sample_client();
        assert!(c.match_local("zenith9000:7b").is_none());
    }

    #[test]
    fn filter_selects_only_matching_models() {
        let c = sample_client();
        let tool_capable: Vec<_> = c.filter(|m| m.tool_call).into_iter().collect();
        assert_eq!(tool_capable.len(), 2);
    }

    #[test]
    fn all_models_spans_providers() {
        let c = sample_client();
        assert_eq!(c.all_models().len(), 3);
    }

    #[test]
    fn base_id_normalizes_provider_qualified_ids() {
        assert_eq!(base_id("glm-5.2"), "glm-5.2");
        assert_eq!(base_id("z-ai/glm-5.2"), "glm-5.2");
        assert_eq!(base_id("zai-org/GLM-5.2"), "glm-5.2");
        assert_eq!(base_id("workers-ai/@cf/zai-org/glm-5.2"), "glm-5.2");
        assert_eq!(base_id("qwen3:1.7b"), "qwen3:1.7b");
        assert_eq!(base_id("zai-org/glm-5.2:thinking"), "glm-5.2:thinking");
    }

    #[test]
    fn provider_model_api_id_matches_exact_or_base_id() {
        let c = sample_client();
        assert_eq!(
            c.provider_model_api_id("fakea", "cheap:1b").as_deref(),
            Some("fakea/cheap:1b")
        );
        assert_eq!(
            c.provider_model_api_id("fakea", "fakea/cheap:1b")
                .as_deref(),
            Some("fakea/cheap:1b")
        );
        assert!(c.provider_model_api_id("fakea", "nope").is_none());
        assert!(c
            .provider_model_api_id("missing-provider", "cheap:1b")
            .is_none());
    }

    #[test]
    fn heuristic_flags_marks_reasoning_and_vision() {
        assert!(heuristic_flags("z-ai/glm-5.2").0);
        assert!(heuristic_flags("deepseek-ai/deepseek-v4-pro").0);
        assert!(heuristic_flags("google/gemini-2.5-flash").1);
        assert!(!heuristic_flags("nvidia/llama-3.1-nemotron-70b-instruct").0);
    }

    #[test]
    fn urlencode_encodes_key_safely() {
        assert_eq!(urlencode("abc123-_~."), "abc123-_~.");
        assert!(urlencode("a b+c").contains('%'));
    }
}