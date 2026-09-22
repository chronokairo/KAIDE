//! Weighted candidate scoring.
//!
//! The router does not branch on `if complexity > X { remote }`. Instead every
//! surviving candidate gets a score that is the weighted sum of normalized
//! factors: complexity fit, context fit, estimated confidence, cost, latency,
//! capability and privacy. Weights are policy data (env-configurable), never
//! hardcoded in the decision path.

use crate::llm::routing::complexity::Complexity;
use crate::llm::routing::privacy::PrivacyLevel;
use crate::llm::routing::RoutingContext;

/// Configurable scoring weights (sum need not be 1.0; the total is normalized).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RoutingWeights {
    pub complexity: f64,
    pub context: f64,
    pub confidence: f64,
    pub cost: f64,
    pub latency: f64,
    pub capability: f64,
    pub privacy: f64,
}

impl Default for RoutingWeights {
    fn default() -> Self {
        Self {
            complexity: 0.30,
            context: 0.15,
            confidence: 0.25,
            cost: 0.10,
            latency: 0.05,
            capability: 0.10,
            privacy: 0.05,
        }
    }
}

impl RoutingWeights {
    /// Parse `ROUTING_WEIGHTS=complexity,context,confidence,cost,latency,capability,privacy`.
    /// Falls back to defaults when the variable is missing or malformed.
    pub fn from_env() -> Self {
        let mut weights = Self::default();
        if let Ok(raw) = std::env::var("ROUTING_WEIGHTS") {
            let parts: Vec<f64> = raw
                .split(',')
                .filter_map(|p| p.trim().parse::<f64>().ok())
                .collect();
            if parts.len() == 7 {
                weights.complexity = parts[0];
                weights.context = parts[1];
                weights.confidence = parts[2];
                weights.cost = parts[3];
                weights.latency = parts[4];
                weights.capability = parts[5];
                weights.privacy = parts[6];
            }
        }
        weights
    }
}

/// Per-candidate factor breakdown, kept so the decision can be audited.
#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct CandidateScore {
    pub total: f64,
    pub complexity: f64,
    pub context: f64,
    pub confidence: f64,
    pub cost: f64,
    pub latency: f64,
    pub capability: f64,
    pub privacy: f64,
}

/// Weighted scorer. `local_bias` is a small additive preference for the local
/// model that implements the "local-first" policy in the scoring dimension.
pub struct Scorer {
    pub weights: RoutingWeights,
    pub local_bias: f64,
}

impl Scorer {
    pub fn new(weights: RoutingWeights, local_bias: f64) -> Self {
        Self {
            weights,
            local_bias,
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn score(
        &self,
        is_remote: bool,
        complexity: Complexity,
        context: &RoutingContext,
        confidence: f64,
        estimated_cost: f64,
        estimated_latency_ms: f64,
        privacy: PrivacyLevel,
    ) -> CandidateScore {
        let complexity_f = complexity_factor(is_remote, complexity);
        let context_f = context_factor(context, context.session_tokens);
        let confidence_f = confidence.clamp(0.0, 1.0);
        let cost_f = cost_factor(is_remote, estimated_cost);
        let latency_f = latency_factor(estimated_latency_ms);
        let capability_f = capability_factor(is_remote, complexity);
        let privacy_f = privacy_factor(is_remote, privacy);

        let mut total = self.weights.complexity * complexity_f
            + self.weights.context * context_f
            + self.weights.confidence * confidence_f
            + self.weights.cost * cost_f
            + self.weights.latency * latency_f
            + self.weights.capability * capability_f
            + self.weights.privacy * privacy_f;

        if !is_remote {
            total += self.local_bias;
        }

        CandidateScore {
            total,
            complexity: complexity_f,
            context: context_f,
            confidence: confidence_f,
            cost: cost_f,
            latency: latency_f,
            capability: capability_f,
            privacy: privacy_f,
        }
    }
}

/// A remote model is *penalized* for trivial work: sending "explain this
/// function" to a flagship model wastes cost and latency for no quality gain.
fn complexity_factor(is_remote: bool, complexity: Complexity) -> f64 {
    if is_remote {
        match complexity {
            Complexity::Trivial => 0.45,
            Complexity::Simple => 0.65,
            Complexity::Moderate => 0.85,
            Complexity::Complex => 1.0,
            Complexity::Critical => 1.0,
        }
    } else {
        match complexity {
            Complexity::Trivial => 1.0,
            Complexity::Simple => 0.9,
            Complexity::Moderate => 0.55,
            Complexity::Complex => 0.3,
            Complexity::Critical => 0.15,
        }
    }
}

fn context_factor(context: &RoutingContext, tokens: usize) -> f64 {
    // The candidate's real window lives in `model_windows` (set by the router
    // after capability resolution); fall back to the policy's local window.
    let window = context
        .model_windows
        .values()
        .max()
        .copied()
        .unwrap_or(context.local_max_context);
    if window == 0 {
        return 1.0;
    }
    let fill = tokens as f64 / window as f64;
    if fill >= 1.0 {
        0.0
    } else if fill >= 0.8 {
        0.4
    } else if fill >= 0.5 {
        0.75
    } else {
        1.0
    }
}

/// Local models score 1.0 (≈ free); remote cost is normalized so a few cents
/// is still acceptable but a pricey call is penalized.
fn cost_factor(is_remote: bool, cost_usd: f64) -> f64 {
    if is_remote {
        1.0 / (1.0 + 20.0 * cost_usd.max(0.0))
    } else {
        1.0
    }
}

fn latency_factor(ms: f64) -> f64 {
    (1.0 - (ms.max(0.0) / 10_000.0)).clamp(0.0, 1.0)
}

/// Hard tasks reward reasoning capability; easy tasks are capability-neutral.
fn capability_factor(is_remote: bool, complexity: Complexity) -> f64 {
    if complexity.prefers_remote() {
        if is_remote {
            1.0
        } else {
            0.4
        }
    } else {
        1.0
    }
}

fn privacy_factor(is_remote: bool, privacy: PrivacyLevel) -> f64 {
    if is_remote && privacy == PrivacyLevel::Private {
        0.0
    } else {
        1.0
    }
}

/// Simple latency heuristic (ms): a small local model is fast, a flagship
/// remote model is slower and hard tasks add overhead.
pub fn estimate_latency_ms(is_remote: bool, complexity: Complexity, context_tokens: usize) -> f64 {
    let base = if is_remote { 2_500.0 } else { 700.0 };
    let complexity_bonus = match complexity {
        Complexity::Trivial => 50.0,
        Complexity::Simple => 120.0,
        Complexity::Moderate => 300.0,
        Complexity::Complex => 600.0,
        Complexity::Critical => 900.0,
    };
    base + complexity_bonus + (context_tokens as f64 / 1_000.0) * 25.0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ctx() -> RoutingContext {
        RoutingContext::default()
    }

    #[test]
    fn local_trivial_beats_remote_on_score() {
        let scorer = Scorer::new(RoutingWeights::default(), 0.05);
        let local = scorer.score(
            false,
            Complexity::Trivial,
            &ctx(),
            0.9,
            0.0,
            750.0,
            PrivacyLevel::Public,
        );
        let remote = scorer.score(
            true,
            Complexity::Trivial,
            &ctx(),
            0.95,
            0.002,
            2600.0,
            PrivacyLevel::Public,
        );
        assert!(
            local.total > remote.total,
            "local {} vs remote {}",
            local.total,
            remote.total
        );
    }

    #[test]
    fn remote_complex_beats_local_on_score() {
        let scorer = Scorer::new(RoutingWeights::default(), 0.05);
        let local = scorer.score(
            false,
            Complexity::Complex,
            &ctx(),
            0.4,
            0.0,
            1300.0,
            PrivacyLevel::Public,
        );
        let remote = scorer.score(
            true,
            Complexity::Complex,
            &ctx(),
            0.8,
            0.01,
            3100.0,
            PrivacyLevel::Public,
        );
        assert!(
            remote.total > local.total,
            "remote {} vs local {}",
            remote.total,
            local.total
        );
    }

    #[test]
    fn weights_are_configurable() {
        let weights = RoutingWeights {
            complexity: 0.0,
            context: 0.0,
            confidence: 0.0,
            cost: 1.0,
            latency: 0.0,
            capability: 0.0,
            privacy: 0.0,
        };
        let scorer = Scorer::new(weights, 0.0);
        let cheap_remote = scorer.score(
            true,
            Complexity::Moderate,
            &ctx(),
            0.8,
            0.0,
            3000.0,
            PrivacyLevel::Public,
        );
        let pricey_remote = scorer.score(
            true,
            Complexity::Moderate,
            &ctx(),
            0.8,
            1.0,
            3000.0,
            PrivacyLevel::Public,
        );
        assert!(cheap_remote.total > pricey_remote.total);
    }

    #[test]
    fn weights_parse_from_env() {
        let prev = std::env::var_os("ROUTING_WEIGHTS");
        std::env::set_var("ROUTING_WEIGHTS", "0.1,0.2,0.3,0.4,0.5,0.6,0.7");
        let w = RoutingWeights::from_env();
        assert_eq!(w.complexity, 0.1);
        assert_eq!(w.privacy, 0.7);
        match prev {
            Some(v) => std::env::set_var("ROUTING_WEIGHTS", v),
            None => std::env::remove_var("ROUTING_WEIGHTS"),
        }
    }
}
