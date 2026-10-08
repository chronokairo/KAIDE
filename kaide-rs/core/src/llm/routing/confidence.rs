//! Confidence estimation abstraction.
//!
//! The router never trusts a model's self-declared probability. [`ConfidenceEstimator`]
//! is the seam where future signals can be blended (syntax/type/lint/test
//! validation, tool results, per-model historical success rates). Today it is
//! implemented by [`HeuristicConfidenceEstimator`], which combines task
//! complexity, context fit, capability match and prompt ambiguity.

use crate::llm::routing::complexity::{Complexity, TaskProfile};
use crate::llm::routing::RoutingContext;

/// A single confidence estimate with its provenance.
#[derive(Debug, Clone)]
pub struct ConfidenceResult {
    /// 0.0 .. 1.0.
    pub score: f64,
    /// Where the estimate came from (e.g. "heuristic").
    pub source: &'static str,
    /// Human-readable signals that produced the estimate.
    pub signals: Vec<String>,
}

/// Plug-in point for confidence estimation.
pub trait ConfidenceEstimator {
    /// Estimate how likely `candidate` is to produce an acceptable result for
    /// a task of `complexity` given the routing context.
    fn estimate(
        &self,
        is_remote: bool,
        complexity: Complexity,
        profile: &TaskProfile,
        context: &RoutingContext,
    ) -> ConfidenceResult;
}

/// Deterministic heuristic estimator. Cheap, reproducible, and conservative
/// for local SLMs on hard tasks.
pub struct HeuristicConfidenceEstimator;

impl ConfidenceEstimator for HeuristicConfidenceEstimator {
    fn estimate(
        &self,
        is_remote: bool,
        complexity: Complexity,
        profile: &TaskProfile,
        context: &RoutingContext,
    ) -> ConfidenceResult {
        let mut signals = Vec::new();

        // Base confidence by task class. Local models are strong on trivial
        // work and trusted far less on architecture-level changes; remote
        // models hold a high floor across the board.
        let base: f64 = if is_remote {
            match complexity {
                Complexity::Trivial => 0.95,
                Complexity::Simple => 0.90,
                Complexity::Moderate => 0.85,
                Complexity::Complex => 0.80,
                Complexity::Critical => 0.75,
            }
        } else {
            match complexity {
                Complexity::Trivial => 0.90,
                Complexity::Simple => 0.82,
                Complexity::Moderate => 0.60,
                Complexity::Complex => 0.40,
                Complexity::Critical => 0.25,
            }
        };
        signals.push(format!(
            "base={:.2} ({} model, {})",
            base,
            if is_remote { "remote" } else { "local" },
            complexity.as_str()
        ));

        let mut score = base;

        // Context fit: confidence decays as the window fills up. Overflow is a
        // hard fail: no later adjustment may resurrect a task that cannot fit.
        let window = max_context_for(is_remote, context);
        if window > 0 {
            let fill = context.session_tokens as f64 / window as f64;
            if fill >= 1.0 {
                signals.push("context overflow".into());
                return ConfidenceResult {
                    score: 0.0,
                    source: "heuristic",
                    signals,
                };
            }
            if fill >= 0.8 {
                score -= 0.20;
                signals.push(format!("context {:.0}% full", fill * 100.0));
            } else if fill >= 0.5 {
                score -= 0.10;
            }
        }

        // Capability mismatch hurts confidence even when not fatal.
        if context.requires_tool_use && !is_remote && profile.codegen {
            // Small local models without a proven tool-calling track record on
            // codegen tasks get a small penalty.
            score -= 0.05;
        }

        // Ambiguous requests are riskier for cheap models.
        if profile.score == 0 && profile.prompt_tokens <= 60 {
            score += 0.05; // short, well-scoped → very predictable
        }

        // Hard tasks on models that cannot reason get a strong penalty.
        if !is_remote && complexity.prefers_remote() {
            score -= 0.15;
            signals.push("hard task, non-reasoning local model".into());
        }

        score = score.clamp(0.0, 1.0);
        ConfidenceResult {
            score,
            source: "heuristic",
            signals,
        }
    }
}

/// Effective context window the estimator budgets against. Local candidates
/// use the policy's local window (passed through the context) and remote
/// candidates a large default; the actual per-model window is rechecked by the
/// capability filter in the router.
fn max_context_for(is_remote: bool, context: &RoutingContext) -> usize {
    context
        .model_windows
        .get(if is_remote { "remote" } else { "local" })
        .copied()
        .unwrap_or(if is_remote {
            128_000
        } else {
            context.local_max_context
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn ctx(tokens: usize) -> RoutingContext {
        RoutingContext {
            session_tokens: tokens,
            local_max_context: 8192,
            ..RoutingContext::default()
        }
    }

    fn profile(prompt: &str) -> TaskProfile {
        let mut p = TaskProfile::default();
        p.prompt_tokens = crate::memory::short_term::estimate_tokens(prompt);
        p
    }

    #[test]
    fn local_trivial_is_high_confidence() {
        let e = HeuristicConfidenceEstimator;
        let r = e.estimate(
            false,
            Complexity::Trivial,
            &profile("explain this function"),
            &ctx(500),
        );
        assert!(r.score >= 0.8, "score {}", r.score);
    }

    #[test]
    fn local_hard_task_is_low_confidence() {
        let e = HeuristicConfidenceEstimator;
        let r = e.estimate(
            false,
            Complexity::Critical,
            &profile("redesign the whole architecture"),
            &ctx(500),
        );
        assert!(r.score < 0.4, "score {}", r.score);
    }

    #[test]
    fn remote_hard_task_keeps_high_confidence() {
        let e = HeuristicConfidenceEstimator;
        let r = e.estimate(
            true,
            Complexity::Complex,
            &profile("refactor across modules"),
            &ctx(500),
        );
        assert!(r.score >= 0.7, "score {}", r.score);
    }

    #[test]
    fn overflowing_context_zeroes_confidence() {
        let e = HeuristicConfidenceEstimator;
        let mut ctx = ctx(9000);
        ctx.model_windows = HashMap::from([("local".into(), 8192)]);
        let r = e.estimate(false, Complexity::Simple, &profile("add a test"), &ctx);
        assert_eq!(r.score, 0.0);
    }
}
