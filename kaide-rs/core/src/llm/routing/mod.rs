//! # Model Orchestration / Intelligent Routing
//!
//! Decides per task whether it should run on the local SLM (Ollama / GGUF) or
//! on a remote model, minimizing cost and latency without needlessly degrading
//! quality. The pipeline is:
//!
//! ```text
//! Task → Task Analysis (complexity, privacy) → Candidate Models
//!      → Capability/context/privacy filter → Scoring (weighted)
//!      → Policy (local-first) → Selected Model → escalation on failure
//! ```
//!
//! The router is deliberately cheap: no LLM call is made to decide. All inputs
//! are heuristics, metadata, catalog capabilities and configuration. A future
//! learned router can replace the heuristic estimators behind the same
//! interfaces without rewriting the policy or the decision shape.
//!
//! The router reuses the existing abstractions (`LlmRouter`, `LlmClient`,
//! `ProviderCatalog`, model tiers) — it does not introduce a parallel
//! provider layer.

pub mod capabilities;
pub mod complexity;
pub mod confidence;
pub mod cost;
pub mod policy;
pub mod privacy;
pub mod scorer;

use crate::agent::state::AgentState;
use crate::llm::client::ClientKind;
use crate::llm::router::LlmRouter;
use crate::llm::routing::capabilities::ModelCapabilities;
use crate::llm::routing::complexity::{Complexity, ComplexityAnalyzer};
use crate::llm::routing::confidence::{ConfidenceEstimator, HeuristicConfidenceEstimator};
use crate::llm::routing::cost::{CostEstimator, RouterCostEstimator};
use crate::llm::routing::policy::{EscalationReason, RoutingPolicy, RoutingStrategy};
use crate::llm::routing::privacy::{privacy_for_task, PrivacyLevel};
use crate::llm::routing::scorer::{estimate_latency_ms, CandidateScore, Scorer};
use std::collections::HashMap;

/// Default completion size assumed while planning a route (tokens). The real
/// usage is reported after the call; this only prices the decision.
const PLANNED_COMPLETION_TOKENS: usize = 256;

/// Context the router sees for a task. Everything here is cheap to obtain;
/// no provider call is made while routing.
#[derive(Debug, Clone, Default)]
pub struct RoutingContext {
    /// The configured coder model (what would be used without routing).
    pub primary_model: String,
    /// Estimated transcript + prompt tokens already in the session.
    pub session_tokens: usize,
    /// Number of distinct files referenced by the session so far.
    pub file_count: usize,
    /// Estimated repository size in bytes (0 = unknown).
    pub repo_size_bytes: u64,
    /// Whether the task requires tool-calling capability (agent turns do).
    pub requires_tool_use: bool,
    /// Explicit privacy classification; when `None` the router scans the task.
    pub privacy: Option<PrivacyLevel>,
    /// Local SLM window budget (from policy).
    pub local_max_context: usize,
    /// Resolved per-kind windows, set by the router after capability lookup.
    pub model_windows: HashMap<String, usize>,
}

impl RoutingContext {
    /// Build the routing context for an agent turn from live state.
    pub fn from_state(state: &AgentState) -> Self {
        Self {
            primary_model: state.config.coder_model.clone(),
            session_tokens: state.session.estimated_tokens(),
            file_count: state.session.file_count(),
            repo_size_bytes: 0,
            requires_tool_use: true,
            privacy: None,
            local_max_context: state.config.routing.local_max_context,
            model_windows: HashMap::new(),
        }
    }
}

/// Where a candidate runs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModelKind {
    Local,
    Remote,
}

impl ModelKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Local => "local",
            Self::Remote => "remote",
        }
    }

    fn window_key(&self) -> &'static str {
        self.as_str()
    }
}

/// A model considered by the router.
#[derive(Debug, Clone)]
pub struct CandidateModel {
    pub id: String,
    pub kind: ModelKind,
    pub capabilities: ModelCapabilities,
    pub available: bool,
    pub availability_reason: Option<String>,
    pub confidence: f64,
    pub estimated_cost_usd: f64,
    pub estimated_latency_ms: f64,
    pub score: f64,
    pub score_breakdown: CandidateScore,
}

/// Auditable breakdown of a routing decision.
#[derive(Debug, Clone, Default)]
pub struct RoutingMetadata {
    pub candidates: Vec<CandidateModel>,
    pub local_score: f64,
    pub remote_score: f64,
    pub context_size: usize,
    pub escalation: bool,
    /// Machine-readable reason code (see `RoutingDecision::reason_code`).
    pub reason_code: String,
    /// True when the selected model is remote.
    pub remote: bool,
}

/// Structured result of [`TaskRouter::route`].
#[derive(Debug, Clone)]
pub struct RoutingDecision {
    pub selected_model: String,
    pub reason: Vec<String>,
    pub confidence: f64,
    pub estimated_cost: f64,
    pub estimated_latency_ms: f64,
    pub complexity: Complexity,
    pub privacy: PrivacyLevel,
    pub fallback_model: Option<String>,
    pub metadata: RoutingMetadata,
    /// Set when no valid routing exists (e.g. remote forbidden + local
    /// incapable). The caller should surface this and fall back to the
    /// configured model as a best effort.
    pub error: Option<String>,
}

impl RoutingDecision {
    pub fn is_remote(&self) -> bool {
        self.metadata.remote
    }

    pub fn is_escalated(&self) -> bool {
        self.metadata.escalation
    }

    /// Human-readable one-line summary for logs / TUI.
    pub fn summary(&self) -> String {
        format!(
            "routing → {} [{}] confidence {:.2} cost ${:.4} latency {:.0}ms ({})",
            self.selected_model,
            self.complexity.as_str(),
            self.confidence,
            self.estimated_cost,
            self.estimated_latency_ms,
            self.reason.join("; ")
        )
    }

    /// Structured JSON for observability. Never includes task content.
    pub fn to_json(&self) -> crate::json::Value {
        let candidates = self.metadata.candidates.iter().map(|candidate| {
            let score = &candidate.score_breakdown;
            crate::json_expr!({
                "id": candidate.id.clone(),
                "kind": candidate.kind.as_str(),
                "available": candidate.available,
                "availability_reason": candidate.availability_reason.clone(),
                "confidence": candidate.confidence,
                "estimated_cost_usd": candidate.estimated_cost_usd,
                "estimated_latency_ms": candidate.estimated_latency_ms,
                "score": candidate.score,
                "score_total": score.total, "score_complexity": score.complexity,
                "score_context": score.context, "score_confidence": score.confidence,
                "score_cost": score.cost, "score_latency": score.latency,
                "score_capability": score.capability, "score_privacy": score.privacy
            })
        }).collect::<Vec<_>>();
        crate::json_expr!({
            "type": "routing",
            "selected_model": self.selected_model.clone(),
            "remote": self.metadata.remote,
            "reason": self.reason.clone(),
            "reason_code": self.metadata.reason_code.clone(),
            "confidence": self.confidence,
            "estimated_cost": self.estimated_cost,
            "estimated_latency_ms": self.estimated_latency_ms,
            "complexity": self.complexity.as_str(),
            "privacy": self.privacy.as_str(),
            "fallback": self.fallback_model.clone(),
            "escalation": self.metadata.escalation,
            "context_size": self.metadata.context_size,
            "local_score": self.metadata.local_score,
            "remote_score": self.metadata.remote_score,
            "candidates": candidates,
            "error": self.error.clone(),
        })
    }
}

/// The router. Cheap, deterministic, and provider-agnostic: it works against
/// `LlmRouter` + the provider catalog, never against a specific provider.
pub struct TaskRouter<'a> {
    llm: &'a LlmRouter,
    policy: &'a RoutingPolicy,
    #[cfg(test)]
    local_caps_override: Option<ModelCapabilities>,
    #[cfg(test)]
    local_available_override: Option<bool>,
}

impl<'a> TaskRouter<'a> {
    pub fn new(llm: &'a LlmRouter, policy: &'a RoutingPolicy) -> Self {
        Self {
            llm,
            policy,
            #[cfg(test)]
            local_caps_override: None,
            #[cfg(test)]
            local_available_override: None,
        }
    }

    #[cfg(test)]
    fn with_local_caps(mut self, caps: ModelCapabilities) -> Self {
        self.local_caps_override = Some(caps);
        self
    }

    #[cfg(test)]
    fn with_local_available(mut self, available: bool) -> Self {
        self.local_available_override = Some(available);
        self
    }

    pub fn policy(&self) -> &'a RoutingPolicy {
        self.policy
    }

    /// Full routing pipeline for one task.
    pub fn route(&self, task: &str, context: &RoutingContext) -> RoutingDecision {
        if !self.policy.enabled {
            return self.passthrough_decision(context);
        }

        let profile = ComplexityAnalyzer::analyze(task, context.file_count);
        let complexity = ComplexityAnalyzer::classify(&profile);
        let privacy = context.privacy.unwrap_or_else(|| privacy_for_task(task));

        let mut candidates = self.candidates(context);

        // Give each candidate its real window so confidence/scoring budget
        // against the actual model, not a global default.
        let mut ctx = context.clone();
        ctx.model_windows = candidates
            .iter()
            .map(|c| (c.kind.window_key().to_string(), c.capabilities.max_context))
            .collect();

        // Fill in confidence, cost, latency and score for every candidate.
        let estimator = HeuristicConfidenceEstimator;
        let scorer = Scorer::new(self.policy.weights, self.policy.local_bias);
        let prompt_tokens = context.session_tokens + profile.prompt_tokens;
        for c in candidates.iter_mut() {
            let is_remote = c.kind == ModelKind::Remote;
            let conf = estimator.estimate(is_remote, complexity, &profile, &ctx);
            let cost = RouterCostEstimator { llm: self.llm }.estimate(
                &c.id,
                prompt_tokens,
                PLANNED_COMPLETION_TOKENS,
            );
            let latency = estimate_latency_ms(is_remote, complexity, context.session_tokens);
            c.confidence = conf.score;
            c.estimated_cost_usd = cost.total();
            c.estimated_latency_ms = latency;
            c.score = scorer
                .score(
                    is_remote,
                    complexity,
                    &ctx,
                    conf.score,
                    cost.total(),
                    latency,
                    privacy,
                )
                .total;
        }

        // Hard filters before any scoring decision.
        let remote_allowed = privacy.remote_allowed(&self.policy.privacy);
        if !remote_allowed {
            candidates.retain(|c| c.kind == ModelKind::Local);
        }
        // Keep the pre-filter local candidate around so `decide` can explain
        // *why* it was dropped (context overflow, missing capability).
        let all_local = candidates
            .iter()
            .find(|c| c.kind == ModelKind::Local)
            .cloned();
        candidates.retain(|c| c.available);
        candidates.retain(|c| c.capabilities.compatible_with(&ctx, complexity));

        self.decide(
            &candidates,
            all_local.as_ref(),
            &ctx,
            complexity,
            privacy,
            remote_allowed,
        )
    }

    /// Escalate a previous local decision to remote.
    ///
    /// Called when the local model failed at runtime (validation failure,
    /// tool failure, low confidence discovered after the fact). Returns a
    /// remote decision when possible, otherwise keeps the previous model and
    /// reports an explicit error (e.g. privacy blocks remote).
    pub fn escalate(
        &self,
        prev: &RoutingDecision,
        reason: EscalationReason,
        context: &RoutingContext,
    ) -> RoutingDecision {
        if !self.policy.enabled || !self.policy.fallback_enabled {
            let mut d = prev.clone();
            d.reason.push("escalation disabled by policy".to_string());
            return d;
        }
        if prev.metadata.remote {
            let mut d = prev.clone();
            d.reason.push(format!(
                "escalation requested ({}) but already remote",
                reason.as_str()
            ));
            return d;
        }
        let privacy = context.privacy.unwrap_or(PrivacyLevel::Public);
        let remote_allowed = privacy.remote_allowed(&self.policy.privacy);
        let remote = self
            .candidates(context)
            .into_iter()
            .find(|c| c.kind == ModelKind::Remote && c.available);

        if !remote_allowed {
            return RoutingDecision {
                selected_model: prev.selected_model.clone(),
                reason: vec![
                    "escalation requested but remote execution is forbidden by privacy policy"
                        .to_string(),
                ],
                confidence: prev.confidence,
                estimated_cost: prev.estimated_cost,
                estimated_latency_ms: prev.estimated_latency_ms,
                complexity: prev.complexity,
                privacy,
                fallback_model: None,
                metadata: RoutingMetadata {
                    candidates: Vec::new(),
                    local_score: 0.0,
                    remote_score: 0.0,
                    context_size: context.session_tokens,
                    escalation: true,
                    reason_code: "escalation_blocked_privacy".into(),
                    remote: false,
                },
                error: Some("remote escalation blocked by privacy policy".into()),
            };
        }
        if let Some(remote) = remote {
            let prompt_tokens = context.session_tokens + 64;
            let cost = RouterCostEstimator { llm: self.llm }.estimate(
                &remote.id,
                prompt_tokens,
                PLANNED_COMPLETION_TOKENS,
            );
            let latency = estimate_latency_ms(true, prev.complexity, context.session_tokens);
            return RoutingDecision {
                selected_model: remote.id.clone(),
                reason: vec![format!("escalated: {}", reason.as_str())],
                confidence: remote.confidence.max(0.5),
                estimated_cost: cost.total(),
                estimated_latency_ms: latency,
                complexity: prev.complexity,
                privacy,
                fallback_model: None,
                metadata: RoutingMetadata {
                    candidates: Vec::new(),
                    local_score: prev.metadata.local_score,
                    remote_score: remote.score,
                    context_size: context.session_tokens,
                    escalation: true,
                    reason_code: format!("escalated_{}", reason.as_str()),
                    remote: true,
                },
                error: None,
            };
        }
        RoutingDecision {
            selected_model: prev.selected_model.clone(),
            reason: vec!["escalation requested but no remote model is configured".to_string()],
            confidence: prev.confidence,
            estimated_cost: prev.estimated_cost,
            estimated_latency_ms: prev.estimated_latency_ms,
            complexity: prev.complexity,
            privacy,
            fallback_model: None,
            metadata: RoutingMetadata {
                candidates: Vec::new(),
                local_score: 0.0,
                remote_score: 0.0,
                context_size: context.session_tokens,
                escalation: true,
                reason_code: "escalation_unavailable".into(),
                remote: false,
            },
            error: Some("no remote model available for escalation".into()),
        }
    }

    /// The candidate set for the current policy + context, enriched with
    /// capabilities and availability (before confidence/scoring).
    pub fn candidates(&self, context: &RoutingContext) -> Vec<CandidateModel> {
        let mut out = Vec::new();
        let (local_id, local_is_gguf) = self.local_model_id(context);
        out.push(self.build_candidate(&local_id, ModelKind::Local, context, local_is_gguf));
        if let Some(remote_id) = self.remote_model_id(context) {
            out.push(self.build_candidate(&remote_id, ModelKind::Remote, context, false));
        }
        out
    }

    // ── pipeline internals ──────────────────────────────────────────────────

    fn passthrough_decision(&self, context: &RoutingContext) -> RoutingDecision {
        let model = context.primary_model.clone();
        RoutingDecision {
            selected_model: model.clone(),
            reason: vec!["routing disabled; using configured model".into()],
            confidence: 1.0,
            estimated_cost: 0.0,
            estimated_latency_ms: 0.0,
            complexity: Complexity::Moderate,
            privacy: PrivacyLevel::Public,
            fallback_model: None,
            metadata: RoutingMetadata {
                candidates: Vec::new(),
                local_score: 0.0,
                remote_score: 0.0,
                context_size: context.session_tokens,
                escalation: false,
                reason_code: "passthrough".into(),
                remote: self.llm.is_cloud_model(&model),
            },
            error: None,
        }
    }

    /// The local candidate id (respects a locally-configured primary model,
    /// otherwise the policy's local model) and whether it runs on the
    /// in-process GGUF engine (which cannot call tools).
    fn local_model_id(&self, context: &RoutingContext) -> (String, bool) {
        let primary = context.primary_model.clone();
        let id = if !self.llm.is_cloud_model(&primary) {
            primary
        } else {
            self.policy.local_model.clone()
        };
        let gguf = matches!(
            self.llm.client_for(&id).map(|c| c.kind()),
            Ok(ClientKind::Local)
        );
        (id, gguf)
    }

    /// The remote candidate id, when a cloud backend is configured.
    fn remote_model_id(&self, context: &RoutingContext) -> Option<String> {
        if !self.llm.cloud_configured() {
            return None;
        }
        if let Some(m) = &self.policy.remote_model {
            return Some(m.clone());
        }
        let primary = &context.primary_model;
        if self.llm.is_cloud_model(primary) {
            return Some(primary.clone());
        }
        Some(crate::llm::router::DEFAULT_CLOUD_MODEL.to_string())
    }

    fn build_candidate(
        &self,
        id: &str,
        kind: ModelKind,
        context: &RoutingContext,
        is_gguf: bool,
    ) -> CandidateModel {
        let capabilities = self.capabilities_for(id, kind, is_gguf);
        let available = self.available_for(id, kind);
        let mut candidate = CandidateModel {
            id: id.to_string(),
            kind,
            capabilities,
            available,
            availability_reason: None,
            confidence: 0.0,
            estimated_cost_usd: 0.0,
            estimated_latency_ms: 0.0,
            score: 0.0,
            score_breakdown: CandidateScore::default(),
        };
        if !available {
            candidate.availability_reason = Some(format!(
                "{} model '{}' has no usable backend",
                kind.as_str(),
                id
            ));
        }
        let _ = context;
        candidate
    }

    fn available_for(&self, id: &str, kind: ModelKind) -> bool {
        #[cfg(test)]
        if kind == ModelKind::Local {
            if let Some(available) = self.local_available_override {
                return available;
            }
        }
        match kind {
            ModelKind::Local => self.llm.client_for(id).is_ok(),
            ModelKind::Remote => self.llm.cloud_configured() && self.llm.client_for(id).is_ok(),
        }
    }

    fn capabilities_for(&self, id: &str, kind: ModelKind, is_gguf: bool) -> ModelCapabilities {
        #[cfg(test)]
        if kind == ModelKind::Local {
            if let Some(caps) = self.local_caps_override {
                return caps;
            }
        }
        let info = self.llm.catalog_client().find_by_id(id).map(|(_, m)| m);
        if let Some(info) = info {
            let fallback = if kind == ModelKind::Local {
                self.policy.local_max_context
            } else {
                128_000
            };
            let mut caps = ModelCapabilities::from_catalog(info, fallback);
            if is_gguf {
                caps.tool_use = false;
                caps.reasoning = false;
            }
            return caps;
        }
        match kind {
            ModelKind::Local => ModelCapabilities::local_default(self.policy.local_max_context),
            ModelKind::Remote => ModelCapabilities::remote_default(),
        }
    }

    /// Apply the strategy to the surviving candidates and build the decision.
    fn decide(
        &self,
        candidates: &[CandidateModel],
        all_local: Option<&CandidateModel>,
        ctx: &RoutingContext,
        complexity: Complexity,
        privacy: PrivacyLevel,
        remote_allowed: bool,
    ) -> RoutingDecision {
        let local_score = candidates
            .iter()
            .find(|c| c.kind == ModelKind::Local)
            .map(|c| c.score)
            .unwrap_or(0.0);
        let remote_score = candidates
            .iter()
            .find(|c| c.kind == ModelKind::Remote)
            .map(|c| c.score)
            .unwrap_or(0.0);

        if candidates.is_empty() {
            let error = if !remote_allowed {
                "No local model can satisfy this task and remote execution is forbidden by privacy policy"
                    .to_string()
            } else {
                "No capable model is available for this task (check ROUTING_LOCAL_MODEL and the cloud provider configuration)"
                    .to_string()
            };
            return RoutingDecision {
                selected_model: self.policy.local_model.clone(),
                reason: vec![error.clone()],
                confidence: 0.0,
                estimated_cost: 0.0,
                estimated_latency_ms: 0.0,
                complexity,
                privacy,
                fallback_model: None,
                metadata: RoutingMetadata {
                    candidates: candidates.to_vec(),
                    local_score,
                    remote_score,
                    context_size: ctx.session_tokens,
                    escalation: false,
                    reason_code: if !remote_allowed {
                        "error_privacy_blocks_remote".into()
                    } else {
                        "error_no_capable_model".into()
                    },
                    remote: false,
                },
                error: Some(error),
            };
        }

        let local = candidates.iter().find(|c| c.kind == ModelKind::Local);
        let remote = candidates.iter().find(|c| c.kind == ModelKind::Remote);
        let local_ok = local
            .map(|c| c.available && c.confidence >= self.policy.local_confidence)
            .unwrap_or(false);
        let remote_ok = remote
            .map(|c| c.available && c.confidence >= self.policy.remote_escalation)
            .unwrap_or(false);

        // Highest scored available candidate as a best-effort safety net.
        let best_effort = candidates
            .iter()
            .filter(|c| c.available)
            .max_by(|a, b| {
                a.score
                    .partial_cmp(&b.score)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .cloned();

        let (chosen, reason_codes): (CandidateModel, Vec<&str>) = match self.policy.strategy {
            RoutingStrategy::QualityFirst => {
                let c = best_effort.clone().expect("non-empty candidates");
                (c, vec!["quality-first strategy"])
            }
            RoutingStrategy::CostFirst => {
                let c = candidates
                    .iter()
                    .filter(|c| c.available)
                    .min_by(|a, b| {
                        a.estimated_cost_usd
                            .partial_cmp(&b.estimated_cost_usd)
                            .unwrap_or(std::cmp::Ordering::Equal)
                    })
                    .cloned()
                    .expect("non-empty candidates");
                (c, vec!["cost-first strategy"])
            }
            RoutingStrategy::LocalFirst => {
                if complexity.prefers_remote() {
                    if remote_ok {
                        (
                            remote.unwrap().clone(),
                            vec!["high complexity", "remote model preferred"],
                        )
                    } else if local_ok {
                        (
                            local.unwrap().clone(),
                            vec![
                                "high complexity but remote unavailable or below confidence",
                                "local best-effort",
                            ],
                        )
                    } else {
                        (
                            best_effort.clone().expect("non-empty candidates"),
                            vec![
                                "high complexity",
                                "no candidate met thresholds; best effort",
                            ],
                        )
                    }
                } else if complexity.prefers_local() {
                    if local_ok {
                        (
                            local.unwrap().clone(),
                            vec![
                                "low complexity",
                                "local-first",
                                "local capable and confident",
                            ],
                        )
                    } else if remote_ok {
                        (
                            remote.unwrap().clone(),
                            vec!["local below confidence or unavailable", "remote fallback"],
                        )
                    } else {
                        (
                            best_effort.clone().expect("non-empty candidates"),
                            vec!["no candidate met thresholds; best effort"],
                        )
                    }
                } else {
                    // Moderate: adaptive — the scores decide, with a small
                    // local bias already baked into the scoring.
                    if local_ok && remote_ok {
                        if local.unwrap().score >= remote.unwrap().score {
                            (
                                local.unwrap().clone(),
                                vec!["moderate task", "local scored higher"],
                            )
                        } else {
                            (
                                remote.unwrap().clone(),
                                vec!["moderate task", "remote scored higher"],
                            )
                        }
                    } else if local_ok {
                        (
                            local.unwrap().clone(),
                            vec!["moderate task", "local fallback"],
                        )
                    } else if remote_ok {
                        (
                            remote.unwrap().clone(),
                            vec!["moderate task", "remote fallback"],
                        )
                    } else {
                        (
                            best_effort.clone().expect("non-empty candidates"),
                            vec!["no candidate met thresholds; best effort"],
                        )
                    }
                }
            }
        };

        let mut reason: Vec<String> = reason_codes.iter().map(|s| s.to_string()).collect();
        // Explain filtered-out local when a remote was picked. `all_local` is
        // the pre-filter candidate, so context overflow / missing capability
        // reasons survive even when the local candidate was dropped earlier.
        if chosen.kind == ModelKind::Remote {
            if let Some(local) = local.or(all_local) {
                if !local.available {
                    reason.push("local model unavailable".into());
                } else if !local.capabilities.compatible_with(ctx, complexity) {
                    if ctx.session_tokens > local.capabilities.max_context {
                        reason.push("context exceeds local window".into());
                    } else {
                        reason.push("local model lacks required capability".into());
                    }
                } else if local.confidence < self.policy.local_confidence {
                    reason.push(format!(
                        "local confidence {:.2} below threshold {:.2}",
                        local.confidence, self.policy.local_confidence
                    ));
                }
            }
        }

        let fallback = if chosen.kind == ModelKind::Local {
            remote
                .filter(|r| r.available && remote_allowed)
                .map(|r| r.id.clone())
        } else {
            None
        };

        let reason_code = if chosen.kind == ModelKind::Remote {
            if complexity.prefers_remote() {
                "remote_complex".into()
            } else {
                "remote_adaptive".into()
            }
        } else {
            "local_first".into()
        };

        RoutingDecision {
            selected_model: chosen.id.clone(),
            reason,
            confidence: chosen.confidence,
            estimated_cost: chosen.estimated_cost_usd,
            estimated_latency_ms: chosen.estimated_latency_ms,
            complexity,
            privacy,
            fallback_model: fallback,
            metadata: RoutingMetadata {
                candidates: candidates.to_vec(),
                local_score,
                remote_score,
                context_size: ctx.session_tokens,
                escalation: false,
                reason_code,
                remote: chosen.kind == ModelKind::Remote,
            },
            error: None,
        }
    }
}

/// Convenience: route the current agent turn. Cheap — call at the start of a
/// turn to select the model, then set `state.active_model`.
pub fn route_agent_turn(client: &LlmRouter, state: &AgentState, task: &str) -> RoutingDecision {
    let policy = state.config.routing.clone();
    TaskRouter::new(client, &policy).route(task, &RoutingContext::from_state(state))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::llm::client::LlmClient;
    use crate::llm::router::LlmRouter;
    use crate::providers::types::{Catalog, Cost, Limits, Modalities, ModelInfo, Provider};
    use crate::providers::ProviderCatalog;

    fn model(id: &str, tool: bool, reasoning: bool) -> ModelInfo {
        ModelInfo {
            id: id.into(),
            name: id.into(),
            family: id.into(),
            reasoning,
            tool_call: tool,
            temperature: false,
            open_weights: true,
            attachment: false,
            limit: Limits {
                context: 131_072,
                output: 4096,
            },
            cost: Cost {
                input: 0.5,
                output: 1.0,
                cache_read: None,
                cache_write: None,
            },
            modalities: Modalities::default(),
            knowledge: None,
            release_date: None,
        }
    }

    fn test_catalog() -> Catalog {
        let mut models = std::collections::HashMap::new();
        models.insert("z-ai/glm-5.2".into(), model("z-ai/glm-5.2", true, true));
        models.insert(
            "nvidia/nemotron-nano-9b-v2".into(),
            model("nvidia/nemotron-nano-9b-v2", true, false),
        );
        let mut catalog = Catalog::new();
        catalog.insert(
            "nvidia".into(),
            Provider {
                id: "nvidia".into(),
                name: "nvidia".into(),
                api: String::new(),
                env: vec![],
                doc: String::new(),
                models,
            },
        );
        catalog
    }

    fn router(cloud: bool) -> LlmRouter {
        let local = LlmClient::ollama("http://localhost:11434");
        let client = ProviderCatalog {
            catalog: test_catalog(),
        };
        if cloud {
            LlmRouter::with_cloud_for_test(local, client)
        } else {
            LlmRouter::with_catalog(local, client)
        }
    }

    fn test_policy() -> RoutingPolicy {
        RoutingPolicy::default()
    }

    fn ctx(model: &str, tokens: usize) -> RoutingContext {
        RoutingContext {
            primary_model: model.into(),
            session_tokens: tokens,
            requires_tool_use: true,
            ..RoutingContext::default()
        }
    }

    #[test]
    fn case1_trivial_local_available_high_confidence_goes_local() {
        let router = router(true);
        let d = TaskRouter::new(&router, &test_policy())
            .route("explain this function", &ctx("qwen3:1.7b", 200));
        assert!(!d.is_remote(), "expected local, got {:?}", d.selected_model);
        assert_eq!(d.selected_model, "qwen3:1.7b");
        assert!(d.error.is_none());
        assert_eq!(d.metadata.reason_code, "local_first");
    }

    #[test]
    fn case2_simple_local_available_goes_local() {
        let router = router(true);
        let d = TaskRouter::new(&router, &test_policy())
            .route("adicione um teste simples", &ctx("qwen3:1.7b", 200));
        assert!(!d.is_remote(), "expected local, got {:?}", d.selected_model);
    }

    #[test]
    fn case3_complex_task_goes_remote() {
        let router = router(true);
        let d = TaskRouter::new(&router, &test_policy()).route(
            "refatore o sistema de autenticação inteiro",
            &ctx("qwen3:1.7b", 200),
        );
        assert!(d.is_remote(), "expected remote, got {:?}", d.selected_model);
        assert!(d.complexity >= Complexity::Complex);
        assert_eq!(d.selected_model, "z-ai/glm-5.2");
    }

    #[test]
    fn case4_local_unavailable_goes_remote() {
        let router = router(true);
        let d = TaskRouter::new(&router, &test_policy())
            .with_local_available(false)
            .route("adicione um teste simples", &ctx("qwen3:1.7b", 200));
        assert!(
            d.is_remote(),
            "expected remote fallback, got {:?}",
            d.selected_model
        );
    }

    #[test]
    fn case5_context_exceeds_local_window_goes_remote() {
        let router = router(true);
        let mut policy = test_policy();
        policy.local_max_context = 8192;
        let d = TaskRouter::new(&router, &policy)
            .route("adicione um teste simples", &ctx("qwen3:1.7b", 9_000));
        assert!(d.is_remote(), "expected remote, got {:?}", d.selected_model);
        assert!(
            d.reason
                .iter()
                .any(|r| r.contains("context exceeds local window")),
            "reason: {:?}",
            d.reason
        );
    }

    #[test]
    fn case6_local_without_capability_goes_remote() {
        let router = router(true);
        // Local model cannot call tools while the task needs them.
        let caps = ModelCapabilities {
            tool_use: false,
            ..ModelCapabilities::local_default(8192)
        };
        let d = TaskRouter::new(&router, &test_policy())
            .with_local_caps(caps)
            .route("adicione um teste simples", &ctx("qwen3:1.7b", 200));
        assert!(d.is_remote(), "expected remote, got {:?}", d.selected_model);
    }

    #[test]
    fn case7_privacy_forbids_remote_goes_local() {
        let router = router(true);
        // Default policy forbids Private data on remote.
        let mut ctx = ctx("qwen3:1.7b", 200);
        ctx.privacy = Some(PrivacyLevel::Private);
        let d = TaskRouter::new(&router, &test_policy())
            .route("processar arquivos que não podem sair da máquina", &ctx);
        assert!(!d.is_remote(), "expected local, got {:?}", d.selected_model);
        assert!(d.error.is_none());
    }

    #[test]
    fn case8_local_validation_failure_escalates_to_remote() {
        let router = router(true);
        let policy = test_policy();
        let route = TaskRouter::new(&router, &policy);
        let first = route.route("adicione um teste simples", &ctx("qwen3:1.7b", 200));
        assert!(!first.is_remote());
        let escalated = route.escalate(
            &first,
            EscalationReason::ValidationFailure,
            &ctx("qwen3:1.7b", 200),
        );
        assert!(escalated.is_remote(), "expected remote escalation");
        assert!(escalated.is_escalated());
        assert_eq!(escalated.selected_model, "z-ai/glm-5.2");
        assert!(escalated.error.is_none());
    }

    #[test]
    fn case9_local_confidence_below_threshold_goes_remote() {
        let router = router(true);
        // Moderate task: local heuristic confidence (0.60) < 0.75 threshold.
        let d = TaskRouter::new(&router, &test_policy())
            .route("implemente este endpoint", &ctx("qwen3:1.7b", 200));
        assert!(d.is_remote(), "expected remote, got {:?}", d.selected_model);
        assert!(
            d.reason.iter().any(|r| r.contains("below threshold")),
            "reason: {:?}",
            d.reason
        );
    }

    #[test]
    fn case10_remote_forbidden_and_local_incapable_returns_explicit_error() {
        let router = router(true);
        let caps = ModelCapabilities {
            tool_use: false,
            ..ModelCapabilities::local_default(8192)
        };
        let mut ctx = ctx("qwen3:1.7b", 200);
        ctx.privacy = Some(PrivacyLevel::Private);
        let d = TaskRouter::new(&router, &test_policy())
            .with_local_caps(caps)
            .route("adicione um teste simples", &ctx);
        assert!(d.error.is_some(), "expected explicit error");
        assert!(
            d.error.as_deref().unwrap().contains("privacy"),
            "{}",
            d.error.unwrap()
        );
    }

    #[test]
    fn disabled_policy_passes_configured_model_through() {
        let router = router(true);
        let mut policy = test_policy();
        policy.enabled = false;
        let d = TaskRouter::new(&router, &policy)
            .route("explain this function", &ctx("qwen3:1.7b", 200));
        assert_eq!(d.selected_model, "qwen3:1.7b");
        assert_eq!(d.metadata.reason_code, "passthrough");
    }

    #[test]
    fn escalation_blocked_by_privacy_reports_error() {
        let router = router(true);
        let policy = test_policy();
        let route = TaskRouter::new(&router, &policy);
        let first = route.route("adicione um teste simples", &ctx("qwen3:1.7b", 200));
        let mut ctx = ctx("qwen3:1.7b", 200);
        ctx.privacy = Some(PrivacyLevel::Private);
        let escalated = route.escalate(&first, EscalationReason::ValidationFailure, &ctx);
        assert!(escalated.error.is_some());
        assert!(!escalated.is_remote());
    }

    #[test]
    fn decision_serializes_without_task_content() {
        let router = router(true);
        let d = TaskRouter::new(&router, &test_policy())
            .route("explain this function", &ctx("qwen3:1.7b", 200));
        let json = d.to_json();
        assert_eq!(json.get("type").and_then(|value| value.as_str()), Some("routing"));
        assert_eq!(json.get("selected_model").and_then(|value| value.as_str()), Some("qwen3:1.7b"));
        assert!(
            json.get("task").is_none(),
            "decision must not leak task content"
        );
        let _ = crate::json::to_string(&json);
    }
}
