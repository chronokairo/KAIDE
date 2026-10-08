use crate::providers::ProviderEntry;
use anyhow::{bail, Result};

/// Verify a provider by sending a minimal request to its API.
/// Currently supports OpenAI-compatible `/models` endpoints.
pub async fn test_provider(provider_id: &str, entry: &ProviderEntry) -> Result<String> {
    let api_key = match &entry.api_key {
        Some(k) => k.clone(),
        None => bail!("no API key set for provider '{}'", provider_id),
    };

    let base = entry
        .api_base
        .clone()
        .unwrap_or_else(|| default_base(provider_id));
    let models_url = format!("{}/models", base.trim_end_matches('/'));

    let response = reqwest::Client::new()
        .get(&models_url)
        .bearer_auth(api_key)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await;

    let response = match response {
        Err(error) => bail!("request failed: {error}"),
        Ok(response) => response,
    };
    let status = response.status();
    if status == 401 {
        bail!("invalid API key (HTTP 401)");
    } else if status == 403 {
        bail!("forbidden — check key permissions (HTTP 403)");
    } else if !status.is_success() {
        bail!("HTTP {status} from {models_url}");
    }

    let body = response.text().await.unwrap_or_default();
    let count = serde_json::from_str::<serde_json::Value>(&body)
        .ok()
        .and_then(|value| value.get("data")?.as_array().map(Vec::len));
    Ok(count
        .map(|count| format!("{count} models listed"))
        .unwrap_or_else(|| "OK".into()))
}

/// Default API base URL per provider (used when store/catalog have none).
pub(crate) fn default_base(provider_id: &str) -> String {
    match provider_id {
        "nvidia" | "deepseek" | "minimax" | "z-ai" | "openai" | "anthropic" | "google"
        | "mistral" | "groq" | "togetherai" | "cohere" | "openrouter" | "perplexity"
        | "fireworks-ai" | "deepinfra" | "cerebras" | "ollama-cloud" => {
            "https://integrate.api.nvidia.com/v1".into()
        }
        other => format!("https://api.{other}.com/v1"),
    }
}
