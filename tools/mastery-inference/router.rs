use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

use crate::inference::gateway::InferenceMode;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelHealthStats {
    pub model_id: String,
    pub avg_latency_ms: u64,
    pub success_count: u32,
    pub failure_count: u32,
    pub is_available: bool,
    pub last_used: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelBenchmarkResult {
    pub model_id: String,
    pub name: String,
    pub latency_ms: u64,
    pub status: String,
    pub is_fastest: bool,
}

#[derive(Debug, Clone)]
struct ModelHealth {
    latencies: Vec<u64>,
    successes: u32,
    failures: u32,
    consecutive_failures: u32,
    last_failure: Option<Instant>,
}

impl Default for ModelHealth {
    fn default() -> Self {
        Self {
            latencies: Vec::new(),
            successes: 0,
            failures: 0,
            consecutive_failures: 0,
            last_failure: None,
        }
    }
}

pub struct ModelRouter {
    health_map: Arc<RwLock<HashMap<String, ModelHealth>>>,
}

impl Default for ModelRouter {
    fn default() -> Self {
        Self::new()
    }
}

impl ModelRouter {
    pub fn new() -> Self {
        Self {
            health_map: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Primary pools for low-latency vs high-accuracy tasks
    pub fn fast_candidates() -> &'static [&'static str] {
        &[
            "nvidia/nemotron-3.5-lightning-30b-a3b",
            "meta/llama-3.1-8b-instruct",
            "mistralai/mistral-7b-instruct-v0.3",
            "google/gemma-2-9b-it",
            "meta/llama-3.1-70b-instruct",
        ]
    }

    pub fn accuracy_candidates() -> &'static [&'static str] {
        &[
            "meta/llama-3.3-70b-instruct",
            "meta/llama-3.1-70b-instruct",
            "nvidia/llama-3.1-nemotron-70b-instruct",
            "mistralai/mistral-large-2-instruct",
            "deepseek-ai/deepseek-r1",
        ]
    }

    /// Selects an ordered list of candidate models based on task mode and routing strategy
    pub async fn resolve_candidate_chain(
        &self,
        mode: InferenceMode,
        strategy: &str,
        preferred_model: Option<&str>,
    ) -> Vec<String> {
        let mut candidates: Vec<String> = Vec::new();

        // If manual strategy or specific model preferred, put it first
        if let Some(pref) = preferred_model.filter(|s| !s.trim().is_empty()) {
            candidates.push(pref.to_string());
        }

        let strategy_normalized = strategy.to_lowercase();

        match strategy_normalized.as_str() {
            "low_latency" => {
                for m in Self::fast_candidates() {
                    if !candidates.contains(&m.to_string()) {
                        candidates.push(m.to_string());
                    }
                }
                for m in Self::accuracy_candidates() {
                    if !candidates.contains(&m.to_string()) {
                        candidates.push(m.to_string());
                    }
                }
            }
            "high_accuracy" => {
                for m in Self::accuracy_candidates() {
                    if !candidates.contains(&m.to_string()) {
                        candidates.push(m.to_string());
                    }
                }
                for m in Self::fast_candidates() {
                    if !candidates.contains(&m.to_string()) {
                        candidates.push(m.to_string());
                    }
                }
            }
            // "auto" (Smart Router): choose based on task requirements
            _ => {
                match mode {
                    InferenceMode::Hint | InferenceMode::GoalParse | InferenceMode::Question => {
                        // Fast, interactive tasks benefit from lower latency
                        for m in Self::fast_candidates() {
                            if !candidates.contains(&m.to_string()) {
                                candidates.push(m.to_string());
                            }
                        }
                        for m in Self::accuracy_candidates() {
                            if !candidates.contains(&m.to_string()) {
                                candidates.push(m.to_string());
                            }
                        }
                    }
                    InferenceMode::Explanation | InferenceMode::Evaluate | InferenceMode::Example => {
                        // Deep explanation and answer evaluation benefit from larger models
                        for m in Self::accuracy_candidates() {
                            if !candidates.contains(&m.to_string()) {
                                candidates.push(m.to_string());
                            }
                        }
                        for m in Self::fast_candidates() {
                            if !candidates.contains(&m.to_string()) {
                                candidates.push(m.to_string());
                            }
                        }
                    }
                }
            }
        }

        // Re-order candidates based on real-time health (move currently circuit-broken models to the end)
        let health = self.health_map.read().await;
        candidates.sort_by_key(|m| {
            if let Some(h) = health.get(m) {
                // If 3 consecutive failures in the last 30s, penalize in priority
                if h.consecutive_failures >= 2 {
                    if let Some(last) = h.last_failure {
                        if last.elapsed() < Duration::from_secs(30) {
                            return 1000 + h.consecutive_failures;
                        }
                    }
                }
                // Sort by average latency if available
                if !h.latencies.is_empty() {
                    let avg = h.latencies.iter().sum::<u64>() / h.latencies.len() as u64;
                    return (avg / 100) as u32;
                }
            }
            50 // Default weight for unmeasured models
        });

        candidates
    }

    pub async fn record_outcome(&self, model: &str, latency: Duration, is_success: bool) {
        let mut map = self.health_map.write().await;
        let entry = map.entry(model.to_string()).or_default();

        if is_success {
            entry.successes += 1;
            entry.consecutive_failures = 0;
            let ms = latency.as_millis() as u64;
            entry.latencies.push(ms);
            if entry.latencies.len() > 10 {
                entry.latencies.remove(0);
            }
        } else {
            entry.failures += 1;
            entry.consecutive_failures += 1;
            entry.last_failure = Some(Instant::now());
        }
    }

    pub async fn get_stats(&self) -> Vec<ModelHealthStats> {
        let map = self.health_map.read().await;
        let mut list = Vec::new();

        for (model_id, health) in map.iter() {
            let avg = if health.latencies.is_empty() {
                0
            } else {
                health.latencies.iter().sum::<u64>() / health.latencies.len() as u64
            };

            let is_available = health.consecutive_failures < 3
                || health
                    .last_failure
                    .map(|f| f.elapsed() > Duration::from_secs(30))
                    .unwrap_or(true);

            list.push(ModelHealthStats {
                model_id: model_id.clone(),
                avg_latency_ms: avg,
                success_count: health.successes,
                failure_count: health.failures,
                is_available,
                last_used: None,
            });
        }

        list.sort_by_key(|s| s.avg_latency_ms);
        list
    }

    pub async fn benchmark_top_models(api_key: &str) -> Vec<ModelBenchmarkResult> {
        let test_models = [
            "meta/llama-3.1-8b-instruct",
            "mistralai/mistral-7b-instruct-v0.3",
            "meta/llama-3.1-70b-instruct",
            "nvidia/llama-3.1-nemotron-70b-instruct",
            "meta/llama-3.3-70b-instruct",
        ];

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(8))
            .build()
            .unwrap_or_default();

        let mut tasks = Vec::new();

        for model in test_models {
            let client = client.clone();
            let key = api_key.to_string();
            let m_str = model.to_string();

            tasks.push(tokio::spawn(async move {
                let start = Instant::now();
                let body = serde_json::json!({
                    "model": m_str,
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 4,
                    "temperature": 0.0
                });

                let res = client
                    .post("https://integrate.api.nvidia.com/v1/chat/completions")
                    .header("Authorization", format!("Bearer {}", key))
                    .header("Content-Type", "application/json")
                    .json(&body)
                    .send()
                    .await;

                let latency = start.elapsed().as_millis() as u64;

                match res {
                    Ok(r) if r.status().is_success() => (m_str, latency, "ok".to_string()),
                    Ok(r) => (m_str, latency, format!("http_{}", r.status().as_u16())),
                    Err(e) => (m_str, latency, format!("error: {}", e)),
                }
            }));
        }

        let mut results = Vec::new();
        for t in tasks {
            if let Ok((id, latency, status)) = t.await {
                let name = id.split('/').nth(1).unwrap_or(&id).replace('-', " ");
                results.push(ModelBenchmarkResult {
                    model_id: id,
                    name,
                    latency_ms: latency,
                    status,
                    is_fastest: false,
                });
            }
        }

        // Find fastest successful
        let fastest_latency = results
            .iter()
            .filter(|r| r.status == "ok")
            .map(|r| r.latency_ms)
            .min();

        if let Some(min_lat) = fastest_latency {
            for r in &mut results {
                if r.status == "ok" && r.latency_ms == min_lat {
                    r.is_fastest = true;
                }
            }
        }

        results.sort_by_key(|r| if r.status == "ok" { r.latency_ms } else { u64::MAX });
        results
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_router_auto_mode_prioritizes_fast_for_hint() {
        let router = ModelRouter::new();
        let chain = router.resolve_candidate_chain(InferenceMode::Hint, "auto", None).await;
        assert!(!chain.is_empty());
        assert!(chain[0].contains("8b") || chain[0].contains("lightning") || chain[0].contains("7b"));
    }

    #[tokio::test]
    async fn test_router_auto_mode_prioritizes_accuracy_for_explanation() {
        let router = ModelRouter::new();
        let chain = router.resolve_candidate_chain(InferenceMode::Explanation, "auto", None).await;
        assert!(!chain.is_empty());
        assert!(chain[0].contains("70b") || chain[0].contains("nemotron") || chain[0].contains("r1"));
    }

    #[tokio::test]
    async fn test_router_preferred_model_takes_precedence() {
        let router = ModelRouter::new();
        let chain = router.resolve_candidate_chain(InferenceMode::Hint, "auto", Some("custom/my-model")).await;
        assert_eq!(chain[0], "custom/my-model");
    }

    #[tokio::test]
    async fn test_router_health_tracking_and_circuit_breaking() {
        let router = ModelRouter::new();
        let test_model = "test/failing-model";

        // Record failure
        router.record_outcome(test_model, Duration::from_millis(5000), false).await;
        router.record_outcome(test_model, Duration::from_millis(5000), false).await;

        let stats = router.get_stats().await;
        let found = stats.iter().find(|s| s.model_id == test_model);
        assert!(found.is_some());
        assert_eq!(found.unwrap().failure_count, 2);
    }
}
