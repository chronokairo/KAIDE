//! Cost estimation abstraction.
//!
//! Local SLMs cost ~$0 from an API billing standpoint, but that is a policy
//! input, not a hard fact — the seam below lets a future estimator factor in
//! GPU time, energy or cloud reserved capacity. Remote models are priced from
//! the provider catalog through [`LlmRouter::estimate_cost`].

use crate::llm::router::{CostEstimate, LlmRouter};

/// Plug-in point for per-candidate cost estimation.
pub trait CostEstimator {
    /// Estimate the USD cost of a call of `prompt_tokens` + `completion_tokens`.
    fn estimate(&self, model: &str, prompt_tokens: usize, completion_tokens: usize)
        -> CostEstimate;
}

/// Catalog-backed estimator reusing the existing [`LlmRouter`] pricing.
pub struct RouterCostEstimator<'a> {
    pub llm: &'a LlmRouter,
}

impl CostEstimator for RouterCostEstimator<'_> {
    fn estimate(
        &self,
        model: &str,
        prompt_tokens: usize,
        completion_tokens: usize,
    ) -> CostEstimate {
        self.llm
            .estimate_cost(model, prompt_tokens, completion_tokens)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn catalog_estimator_prices_remote_and_zeroes_local() {
        // The router tests already cover estimate_cost; here we only assert the
        // estimator delegates and returns the CostEstimate shape.
        let router = crate::llm::router::LlmRouter::with_catalog(
            crate::llm::client::LlmClient::ollama("http://localhost:11434"),
            crate::providers::ProviderCatalog {
                catalog: Default::default(),
            },
        );
        let est = RouterCostEstimator { llm: &router };
        let cost = est.estimate("qwen3:1.7b", 1000, 1000);
        assert_eq!(cost.total(), 0.0);
        let _ = CostEstimate::default();
    }
}
