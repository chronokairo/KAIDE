use crate::providers::ProviderEntry;
use crate::error::{bail, Result};

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

    let response = crate::http::Client::new()
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

    let body = response.text().unwrap_or_default();
    let count = crate::json::from_str(&body)
        .ok()
        .and_then(|value| value.get("data")?.as_array().map(|items| items.len()));
    Ok(count
        .map(|count| format!("{count} models listed"))
        .unwrap_or_else(|| "OK".into()))
}

/// Default API base URL per provider. Consults the built-in provider registry
/// first; unknown ids fall back to a conventional `https://api.<id>.com/v1`.
pub(crate) fn default_base(provider_id: &str) -> String {
    if let Some(kp) = crate::providers::catalog::known_provider(provider_id) {
        return kp.api.to_string();
    }
    match provider_id {
        "ollama-cloud" => "https://ollama.com/v1".into(),
        "anthropic" => "https://api.anthropic.com/v1".into(),
        other => format!("https://api.{other}.com/v1"),
    }
}
