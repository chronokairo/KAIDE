use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProviderKeys {
    pub nvidia_api_key: String,
    pub tavily_api_key: String,
    pub serp_api_key: String,
    pub perplexity_api_key: String,
    pub exa_api_key: String,
}

impl ProviderKeys {
    pub fn has_any_web_provider(&self) -> bool {
        !self.tavily_api_key.is_empty()
            || !self.serp_api_key.is_empty()
            || !self.perplexity_api_key.is_empty()
            || !self.exa_api_key.is_empty()
    }

    pub fn active_providers(&self) -> Vec<WebProvider> {
        let mut providers = Vec::new();
        if !self.tavily_api_key.is_empty() {
            providers.push(WebProvider::Tavily);
        }
        if !self.serp_api_key.is_empty() {
            providers.push(WebProvider::SerpAPI);
        }
        if !self.perplexity_api_key.is_empty() {
            providers.push(WebProvider::Perplexity);
        }
        if !self.exa_api_key.is_empty() {
            providers.push(WebProvider::Exa);
        }
        providers
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum WebProvider {
    Tavily,
    SerpAPI,
    Perplexity,
    Exa,
}

impl WebProvider {
    pub fn name(&self) -> &'static str {
        match self {
            WebProvider::Tavily => "tavily",
            WebProvider::SerpAPI => "serpapi",
            WebProvider::Perplexity => "perplexity",
            WebProvider::Exa => "exa",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            WebProvider::Tavily => "Tavily Search",
            WebProvider::SerpAPI => "SerpAPI / Google Custom Search",
            WebProvider::Perplexity => "Perplexity AI",
            WebProvider::Exa => "Exa.ai",
        }
    }
}

const STORE_KEY: &str = "provider_keys";

pub async fn load_keys(app: &AppHandle) -> Result<ProviderKeys> {
    let store = app.store("config.dat")?;
    if let Some(value) = store.get(STORE_KEY) {
        let keys: ProviderKeys = serde_json::from_value(value.clone())
            .context("desserializando chaves de provedores")?;
        Ok(keys)
    } else {
        Ok(ProviderKeys::default())
    }
}

pub async fn save_keys(app: &AppHandle, keys: &ProviderKeys) -> Result<()> {
    let store = app.store("config.dat")?;
    store.set(STORE_KEY, serde_json::to_value(keys)?);
    store.save()?;
    Ok(())
}

pub async fn test_tavily(api_key: &str) -> Result<String> {
    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.tavily.com/search")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&serde_json::json!({
            "query": "test",
            "max_results": 1
        }))
        .send()
        .await
        .context("requisição Tavily falhou")?;

    if resp.status().is_success() {
        Ok("Conexão Tavily OK".to_string())
    } else {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        Err(anyhow::anyhow!("Tavily error {}: {}", status, text))
    }
}

pub async fn test_serpapi(api_key: &str) -> Result<String> {
    let client = reqwest::Client::new();
    let resp = client
        .get("https://serpapi.com/account")
        .query(&[("api_key", api_key)])
        .send()
        .await
        .context("requisição SerpAPI falhou")?;

    if resp.status().is_success() {
        Ok("Conexão SerpAPI OK".to_string())
    } else {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        Err(anyhow::anyhow!("SerpAPI error {}: {}", status, text))
    }
}

pub async fn test_perplexity(api_key: &str) -> Result<String> {
    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.perplexity.ai/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&serde_json::json!({
            "model": "sonar",
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 1
        }))
        .send()
        .await
        .context("requisição Perplexity falhou")?;

    if resp.status().is_success() {
        Ok("Conexão Perplexity OK".to_string())
    } else {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        Err(anyhow::anyhow!("Perplexity error {}: {}", status, text))
    }
}

pub async fn test_exa(api_key: &str) -> Result<String> {
    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.exa.ai/search")
        .header("x-api-key", api_key)
        .json(&serde_json::json!({
            "query": "test",
            "num_results": 1
        }))
        .send()
        .await
        .context("requisição Exa falhou")?;

    if resp.status().is_success() {
        Ok("Conexão Exa OK".to_string())
    } else {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        Err(anyhow::anyhow!("Exa error {}: {}", status, text))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_active_providers() {
        let keys = ProviderKeys {
            tavily_api_key: "tvly-123".to_string(),
            serp_api_key: "".to_string(),
            ..Default::default()
        };
        assert_eq!(keys.active_providers(), vec![WebProvider::Tavily]);
    }
}
