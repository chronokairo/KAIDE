use std::sync::Arc;
use std::time::Instant;
use super::model_bench::BenchResult;

const CLOUD_BENCH_PROMPT: &str = "Write a Python function that computes fibonacci numbers.";
const CLOUD_BENCH_TIMEOUT_SECS: u64 = 60;

/// Benchmark a single cloud model via its provider chain.
pub async fn benchmark_cloud_model(
    model_id: &str,
    _provider_id: &str,
    api_key: &str,
    _base_url: &str,
    rpm: f64,
) -> BenchResult {
    let chain = build_cloud_chain(api_key, model_id, rpm);
    let t0 = Instant::now();

    let result = tokio::time::timeout(
        std::time::Duration::from_secs(CLOUD_BENCH_TIMEOUT_SECS),
        chain.complete(CLOUD_BENCH_PROMPT),
    )
    .await;

    let elapsed = t0.elapsed();
    let load_ms = 0u64; // cloud models have no load time

    match result {
        Ok(Ok(text)) => {
            let tokens_out = text.split_whitespace().count();
            let gen_ms = elapsed.as_millis() as u64;
            let tps = if gen_ms > 0 { tokens_out as f32 / (gen_ms as f32 / 1000.0) } else { 0.0 };
            let sample: String = text.chars().take(80).collect();

            BenchResult {
                model: model_id.to_string(),
                load_ms,
                gen_ms,
                tokens_out,
                tps,
                hw_score: None,
                predicted_tps: None,
                hw_rank: None,
                output_sample: sample,
                error: None,
                cloud_match: None,
            }
        }
        Ok(Err(e)) => BenchResult::error(model_id, format!("provider error: {e}")),
        Err(_) => BenchResult::error(model_id, format!("timeout after {CLOUD_BENCH_TIMEOUT_SECS}s")),
    }
}

/// Build a FallbackChain for a specific cloud model via NIM.
fn build_cloud_chain(
    api_key: &str,
    model_id: &str,
    rpm: f64,
) -> crate::llm::provider_chain::FallbackChain {
    use crate::llm::provider_chain::{NimProvider, LocalProvider, CompletionProvider};

    let nim = Arc::new(NimProvider::new("https://integrate.api.nvidia.com", api_key.to_string(), model_id.to_string(), rpm));
    let local = Arc::new(LocalProvider::new(
        "http://localhost:11434".to_string(),
        "nemotron-3-nano".to_string(),
    ));

    let providers: Vec<Arc<dyn CompletionProvider>> = vec![nim, local];
    crate::llm::provider_chain::FallbackChain::new(providers)
}

/// Benchmark multiple cloud models and return results sorted by TPS.
pub async fn rank_cloud_models(
    models: &[(String, String, String, String, f64)],
) -> Vec<BenchResult> {
    let mut results = Vec::new();
    for (model_id, provider_id, api_key, base_url, rpm) in models {
        println!("  Benchmarking cloud model: {model_id} ({provider_id})...");
        let result = benchmark_cloud_model(model_id, provider_id, api_key, base_url, *rpm).await;
        results.push(result);
    }
    results.sort_by(|a, b| {
        b.tps.partial_cmp(&a.tps).unwrap_or(std::cmp::Ordering::Equal)
    });
    results
}
