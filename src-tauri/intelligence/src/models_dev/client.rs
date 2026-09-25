use std::path::PathBuf;
use anyhow::{Result, Context};

use super::types::{Catalog, ModelInfo, CloudMatch};

const API_URL: &str = "https://models.dev/api.json";
/// Cache is refreshed after 24 hours.
const CACHE_TTL_SECS: u64 = 86_400;

pub struct ModelsDevClient {
    pub catalog: Catalog,
}

impl ModelsDevClient {
    /// Load catalog: try local cache first, then fetch from network.
    /// Never panics — on any error returns an empty catalog and logs a warning.
    pub fn load() -> Self {
        let cache = cache_path();
        if let Some(c) = try_load_cache(&cache) { return Self { catalog: c } }
        if tokio::runtime::Handle::try_current().is_ok() {
            log::warn!(
                "models.dev: cache miss inside async runtime; skipping blocking network fetch and using empty catalog"
            );
            return Self { catalog: Catalog::new() };
        }
        match fetch_and_cache(&cache) {
            Ok(c)  => Self { catalog: c },
            Err(e) => {
                log::warn!("models.dev: fetch failed ({e}); using empty catalog");
                Self { catalog: Catalog::new() }
            }
        }
    }

    // ── Query API ─────────────────────────────────────────────────────────────

    /// All (provider_id, model_id, &ModelInfo) triples.
    pub fn all_models(&self) -> Vec<(&str, &str, &ModelInfo)> {
        self.catalog.iter()
            .flat_map(|(pid, prov)| {
                prov.models.iter()
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
        self.catalog.iter()
            .flat_map(|(pid, prov)| {
                prov.models.values()
                    .filter(|m| pred(m))
                    .map(move |m| (pid.as_str(), m))
            })
            .collect()
    }

    /// Suggest the cheapest cloud models for a given task category.
    /// Returns up to `top_n` models sorted by input cost.
    pub fn suggest_for_task(&self, category: &str, top_n: usize) -> Vec<(&str, &ModelInfo)> {
        let need_reasoning = matches!(category, "reasoning");
        let need_coding    = matches!(category, "coding");

        let mut candidates: Vec<(&str, &ModelInfo)> = self.catalog.iter()
            .flat_map(|(pid, prov)| prov.models.values().map(move |m| (pid.as_str(), m)))
            .filter(|(_, m)| {
                let has_text_out = m.modalities.output.iter().any(|o| o == "text");
                let ok_reasoning = !need_reasoning || m.reasoning;
                let ok_coding    = !need_coding    || m.tool_call;
                has_text_out && ok_reasoning && ok_coding
            })
            .collect();

        candidates.sort_by(|a, b| a.1.cost.input.partial_cmp(&b.1.cost.input).unwrap_or(std::cmp::Ordering::Equal));
        candidates.into_iter().take(top_n).collect()
    }

    /// Try to find a cloud model that matches a local ollama model name (e.g. "gemma3:4b").
    /// Matches on family prefix — picks cheapest qualifying model of that family.
    pub fn match_local(&self, ollama_name: &str) -> Option<CloudMatch> {
        let family = normalize_family(ollama_name);

        // Collect all models whose family contains the normalized name
        let mut matches: Vec<(&str, &ModelInfo)> = self.catalog.iter()
            .flat_map(|(pid, prov)| prov.models.values().map(move |m| (pid.as_str(), m)))
            .filter(|(_, m)| {
                let mf = m.family.to_lowercase().replace(['-', '_', '.'], "");
                mf.contains(&family) || family.contains(&mf)
            })
            .collect();

        // Sort by cheapest input cost
        matches.sort_by(|a, b| a.1.cost.input.partial_cmp(&b.1.cost.input).unwrap_or(std::cmp::Ordering::Equal));

        matches.first().map(|(pid, m)| CloudMatch {
            provider:   pid.to_string(),
            model_id:   m.id.clone(),
            model_name: m.name.clone(),
            cost_in:    m.cost.input,
            cost_out:   m.cost.output,
            context_k:  m.limit.context / 1000,
            reasoning:  m.reasoning,
        })
    }

    /// All models from a named provider.
    pub fn provider_models(&self, provider_id: &str) -> Vec<&ModelInfo> {
        self.catalog.get(provider_id)
            .map(|p| p.models.values().collect())
            .unwrap_or_default()
    }

    /// Find the provider-specific API model id for `model` inside `provider`'s
    /// catalog, matching on exact id or normalized base id. One model may be
    /// served by several providers under different ids (e.g. `glm-5.2` on
    /// Ollama vs `z-ai/glm-5.2` on NVIDIA NIM), so the router resolves the id
    /// per active provider.
    pub fn provider_model_api_id(&self, provider: &str, model: &str) -> Option<String> {
        let base = base_id(model);
        for (id, _) in self.catalog.get(provider)?.models.iter() {
            if id == model || base_id(id) == base {
                return Some(id.clone());
            }
        }
        None
    }

    /// Print a human-readable list of models matching a query string.
    pub fn print_list(&self, query: &str) {
        let q = query.to_lowercase();
        let mut rows: Vec<(&str, &ModelInfo)> = self.catalog.iter()
            .flat_map(|(pid, prov)| prov.models.values().map(move |m| (pid.as_str(), m)))
            .filter(|(pid, m)| {
                q.is_empty()
                    || m.id.to_lowercase().contains(&q)
                    || m.name.to_lowercase().contains(&q)
                    || m.family.to_lowercase().contains(&q)
                    || pid.to_lowercase().contains(&q)
            })
            .collect();

        rows.sort_by(|a, b| a.1.cost.input.partial_cmp(&b.1.cost.input).unwrap_or(std::cmp::Ordering::Equal));

        println!("\n{:<30} {:<14} {:>9} {:>9} {:>9}  Caps", "Model ID", "Provider", "In$/MTok", "Out$/MTok", "Ctx(K)");
        println!("{}", "─".repeat(95));
        for (pid, m) in &rows {
            let caps = [
                if m.reasoning   { "reason" } else { "" },
                if m.tool_call   { "tools"  } else { "" },
                if m.open_weights { "oss"   } else { "" },
            ].iter().filter(|s| !s.is_empty()).cloned().collect::<Vec<_>>().join(" ");
            println!("{:<30} {:<14} {:>9.3} {:>9.3} {:>9}  {}",
                truncate(&m.id, 30), truncate(pid, 14),
                m.cost.input, m.cost.output,
                m.limit.context / 1000,
                caps);
        }
        println!("\n  {} models", rows.len());
    }
}

// ── internals ─────────────────────────────────────────────────────────────────

fn cache_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    let dir = PathBuf::from(home).join(".cache").join("rustcode");
    std::fs::create_dir_all(&dir).ok();
    dir.join("models_dev.json")
}

fn try_load_cache(path: &PathBuf) -> Option<Catalog> {
    let meta = std::fs::metadata(path).ok()?;
    let age = meta.modified().ok()?.elapsed().ok()?;
    if age.as_secs() > CACHE_TTL_SECS { return None; }
    let bytes = std::fs::read(path).ok()?;
    serde_json::from_slice(&bytes).ok()
}

fn fetch_and_cache(cache: &PathBuf) -> Result<Catalog> {
    log::info!("models.dev: fetching catalog from {API_URL}");
    // models.dev rejects requests without a browser-like User-Agent (HTTP 403).
    let resp = reqwest::blocking::Client::builder()
        .user_agent(format!("anamnesic-coder/{}", env!("CARGO_PKG_VERSION")))
        .build()
        .context("building HTTP client")?
        .get(API_URL)
        .send()
        .context("HTTP GET models.dev/api.json")?;
    if !resp.status().is_success() {
        anyhow::bail!("models.dev: HTTP {} fetching {API_URL}", resp.status());
    }
    let body = resp.text().context("reading response body")?;
    let catalog: Catalog = serde_json::from_str(&body)
        .context("parsing models.dev JSON")?;
    if let Ok(j) = serde_json::to_vec(&catalog) {
        std::fs::write(cache, j).ok();
    }
    Ok(catalog)
}

fn normalize_family(ollama_name: &str) -> String {
    // "gemma3:4b" → "gemma"
    // "llama3.2:3b" → "llama"
    // "qwen3:8b" → "qwen"
    let base = ollama_name.split(':').next().unwrap_or(ollama_name);
    // strip trailing digits/dots
    let trimmed = base.trim_end_matches(|c: char| c.is_ascii_digit() || c == '.');
    trimmed.to_lowercase().replace(['-', '_', '.'], "")
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max { s.to_string() }
    else { format!("{}…", &s[..max.saturating_sub(1)]) }
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
    use crate::models_dev::types::{Catalog, Cost, Limits, ModelInfo, Modalities, Provider};

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
            limit: Limits { context: 131_072, output: 4096 },
            cost: Cost { input: cost_in, output: cost_in, cache_read: None, cache_write: None },
            modalities: Modalities { input: vec!["text".into()], output: vec!["text".into()] },
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

    fn sample_client() -> ModelsDevClient {
        let mut catalog = Catalog::new();
        catalog.insert("fakea".into(), provider("fakea", vec![
            model("fakea/cheap:1b", "cheap", true, 0.05),
            model("fakea/pricey:4b", "pricey", false, 0.50),
        ]));
        catalog.insert("fakeb".into(), provider("fakeb", vec![
            model("fakeb/gemma:4b", "gemma", true, 0.20),
        ]));
        ModelsDevClient { catalog }
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
        assert_eq!(c.provider_model_api_id("fakea", "cheap:1b").as_deref(), Some("fakea/cheap:1b"));
        assert_eq!(c.provider_model_api_id("fakea", "fakea/cheap:1b").as_deref(), Some("fakea/cheap:1b"));
        assert!(c.provider_model_api_id("fakea", "nope").is_none());
        assert!(c.provider_model_api_id("missing-provider", "cheap:1b").is_none());
    }
}
