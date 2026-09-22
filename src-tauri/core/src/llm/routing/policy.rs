//! Routing policy: strategy, thresholds, weights and escalation reasons.
//!
//! The policy is the single place where routing behaviour is configured. The
//! project configures via environment variables (no YAML), so the policy
//! mirrors that: `ROUTING_*` vars map 1:1 onto fields here.

use crate::llm::routing::privacy::PrivacyPolicy;
use crate::llm::routing::scorer::RoutingWeights;
use std::str::FromStr;

/// Overall routing strategy.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
#[allow(clippy::enum_variant_names)]
pub enum RoutingStrategy {
    /// Try the local SLM first whenever it is capable and confident enough.
    #[default]
    LocalFirst,
    /// Optimize for lowest estimated cost.
    CostFirst,
    /// Optimize for highest expected quality regardless of cost.
    QualityFirst,
}

impl FromStr for RoutingStrategy {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.trim().to_ascii_lowercase().as_str() {
            "local_first" | "local-first" | "local" => Ok(Self::LocalFirst),
            "cost_first" | "cost-first" | "cost" => Ok(Self::CostFirst),
            "quality_first" | "quality-first" | "quality" | "remote" => Ok(Self::QualityFirst),
            _ => Err(format!("unknown routing strategy '{s}'")),
        }
    }
}

impl RoutingStrategy {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::LocalFirst => "local_first",
            Self::CostFirst => "cost_first",
            Self::QualityFirst => "quality_first",
        }
    }
}

/// Why a task that started on a local model was escalated to remote.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EscalationReason {
    LowConfidence,
    LocalModelUnavailable,
    ContextTooLarge,
    CapabilityMissing,
    ToolFailure,
    ValidationFailure,
    ComplexityTooHigh,
}

impl EscalationReason {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::LowConfidence => "low_confidence",
            Self::LocalModelUnavailable => "local_model_unavailable",
            Self::ContextTooLarge => "context_too_large",
            Self::CapabilityMissing => "capability_missing",
            Self::ToolFailure => "tool_failure",
            Self::ValidationFailure => "validation_failure",
            Self::ComplexityTooHigh => "complexity_too_high",
        }
    }
}

/// Full routing configuration. Defaults are local-first and conservative for
/// the 4 GB VRAM target machine (small local window, high local bar).
#[derive(Debug, Clone, PartialEq)]
pub struct RoutingPolicy {
    /// Master switch. When off the router passes the configured coder model
    /// through unchanged.
    pub enabled: bool,
    pub strategy: RoutingStrategy,
    /// Local SLM candidate (defaults to the coder model when local).
    pub local_model: String,
    /// Remote candidate; falls back to the resolved cloud model when unset.
    pub remote_model: Option<String>,
    /// Effective context window budgeted for the local SLM.
    pub local_max_context: usize,
    /// Minimum local confidence to accept a local decision.
    pub local_confidence: f64,
    /// Minimum remote confidence to accept a remote decision.
    pub remote_escalation: f64,
    pub weights: RoutingWeights,
    /// Small additive preference for the local model in scoring.
    pub local_bias: f64,
    /// Allow local → remote escalation (fallback).
    pub fallback_enabled: bool,
    pub privacy: PrivacyPolicy,
}

impl Default for RoutingPolicy {
    fn default() -> Self {
        Self {
            enabled: true,
            strategy: RoutingStrategy::LocalFirst,
            local_model: "qwen3:1.7b".into(),
            remote_model: None,
            local_max_context: 8192,
            local_confidence: 0.75,
            remote_escalation: 0.55,
            weights: RoutingWeights::default(),
            local_bias: 0.05,
            fallback_enabled: true,
            privacy: PrivacyPolicy::default(),
        }
    }
}

impl RoutingPolicy {
    /// Build the policy from `ROUTING_*` environment variables.
    pub fn from_env() -> Self {
        let mut privacy = PrivacyPolicy::default();
        // `ROUTING_PRIVACY=public|internal|sensitive|private` sets the default
        // class; `ROUTING_PRIVACY_REMOTE_FORBIDDEN` lists classes that must
        // stay local.
        if let Ok(level) = std::env::var("ROUTING_PRIVACY") {
            privacy.default_level = parse_level(&level);
        }
        if let Ok(raw) = std::env::var("ROUTING_PRIVACY_REMOTE_FORBIDDEN") {
            privacy.remote_forbidden = raw
                .split(',')
                .filter_map(|p| parse_level_opt(p.trim()))
                .collect();
        }
        Self {
            enabled: env_bool("ROUTING_ENABLED", true),
            strategy: std::env::var("ROUTING_STRATEGY")
                .ok()
                .and_then(|v| RoutingStrategy::from_str(&v).ok())
                .unwrap_or_default(),
            local_model: env("ROUTING_LOCAL_MODEL", "qwen3:1.7b"),
            remote_model: std::env::var("ROUTING_REMOTE_MODEL")
                .ok()
                .filter(|s| !s.is_empty()),
            local_max_context: env_parse("ROUTING_LOCAL_MAX_CONTEXT", 8192),
            local_confidence: env_parse("ROUTING_LOCAL_CONFIDENCE", 0.75),
            remote_escalation: env_parse("ROUTING_REMOTE_ESCALATION", 0.55),
            local_bias: env_parse("ROUTING_LOCAL_BIAS", 0.05),
            fallback_enabled: env_bool("ROUTING_FALLBACK", true),
            weights: RoutingWeights::from_env(),
            privacy,
        }
    }

    /// Validate invariants and clamp out-of-range floats.
    pub fn normalize(&mut self) {
        self.local_confidence = self.local_confidence.clamp(0.0_f64, 1.0_f64);
        self.remote_escalation = self.remote_escalation.clamp(0.0_f64, 1.0_f64);
        self.local_bias = self.local_bias.clamp(0.0_f64, 1.0_f64);
    }
}

fn parse_level(s: &str) -> crate::llm::routing::privacy::PrivacyLevel {
    parse_level_opt(s).unwrap_or_default()
}

fn parse_level_opt(s: &str) -> Option<crate::llm::routing::privacy::PrivacyLevel> {
    use crate::llm::routing::privacy::PrivacyLevel;
    match s.to_ascii_lowercase().as_str() {
        "public" => Some(PrivacyLevel::Public),
        "internal" => Some(PrivacyLevel::Internal),
        "sensitive" => Some(PrivacyLevel::Sensitive),
        "private" => Some(PrivacyLevel::Private),
        _ => None,
    }
}

fn env(name: &str, default: &str) -> String {
    std::env::var(name)
        .ok()
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| default.into())
}

fn env_bool(name: &str, default: bool) -> bool {
    std::env::var(name)
        .ok()
        .and_then(|v| match v.to_ascii_lowercase().as_str() {
            "1" | "true" | "yes" | "on" => Some(true),
            "0" | "false" | "no" | "off" => Some(false),
            _ => None,
        })
        .unwrap_or(default)
}

fn env_parse<T: std::str::FromStr>(name: &str, default: T) -> T {
    std::env::var(name)
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(default)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::llm::routing::privacy::PrivacyLevel;

    static ENV_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

    #[test]
    fn defaults_are_local_first() {
        let policy = RoutingPolicy::default();
        assert!(policy.enabled);
        assert_eq!(policy.strategy, RoutingStrategy::LocalFirst);
        assert!(policy.local_confidence >= 0.7);
        assert!(policy.fallback_enabled);
    }

    #[test]
    fn strategy_parses() {
        assert_eq!(
            "local_first".parse::<RoutingStrategy>().unwrap(),
            RoutingStrategy::LocalFirst
        );
        assert_eq!(
            "quality".parse::<RoutingStrategy>().unwrap(),
            RoutingStrategy::QualityFirst
        );
        assert!("bogus".parse::<RoutingStrategy>().is_err());
    }

    #[test]
    fn policy_reads_env() {
        let _guard = ENV_LOCK.lock().unwrap();
        let prev = (
            std::env::var_os("ROUTING_ENABLED"),
            std::env::var_os("ROUTING_LOCAL_CONFIDENCE"),
            std::env::var_os("ROUTING_STRATEGY"),
            std::env::var_os("ROUTING_PRIVACY"),
        );
        std::env::set_var("ROUTING_ENABLED", "false");
        std::env::set_var("ROUTING_LOCAL_CONFIDENCE", "0.9");
        std::env::set_var("ROUTING_STRATEGY", "quality_first");
        std::env::set_var("ROUTING_PRIVACY", "private");
        let policy = RoutingPolicy::from_env();
        assert!(!policy.enabled);
        assert!((policy.local_confidence - 0.9).abs() < 1e-9);
        assert_eq!(policy.strategy, RoutingStrategy::QualityFirst);
        assert_eq!(policy.privacy.default_level, PrivacyLevel::Private);
        match prev {
            (Some(a), Some(b), Some(c), Some(d)) => {
                std::env::set_var("ROUTING_ENABLED", a);
                std::env::set_var("ROUTING_LOCAL_CONFIDENCE", b);
                std::env::set_var("ROUTING_STRATEGY", c);
                std::env::set_var("ROUTING_PRIVACY", d);
            }
            _ => {
                std::env::remove_var("ROUTING_ENABLED");
                std::env::remove_var("ROUTING_LOCAL_CONFIDENCE");
                std::env::remove_var("ROUTING_STRATEGY");
                std::env::remove_var("ROUTING_PRIVACY");
            }
        }
    }
}
