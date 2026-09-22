use crate::agent::agent_loop::{AgentEvent, AgentHooks};
use crate::agent::finalize::{finalize_turn, FinalizeSummary};
use crate::agent::state::AgentState;
use crate::agent::tool_registry::ToolRegistry;
use crate::agent::verify::VerificationGate;
use crate::llm::router::LlmRouter;
use crate::protocol::event_log::CanonicalEventLog;
use crate::protocol::EventMsg;
use crate::tools::sandbox::SandboxPolicy;
use crate::error::Result;
use crate::ui::AgentMode;
use std::sync::{Arc, Mutex};

/// Typed result of the pure tool loop
#[derive(Debug, Clone)]
pub enum ToolLoopOutcome {
    Success { final_text: String, summary: FinalizeSummary },
    NeedsInput { prompt: String },
    Interrupted,
    MaxIterationsReached,
    Failed { error: String },
}

/// 7-Phase modular tool loop orchestrator
pub struct ModularAgentLoop {
    pub registry: ToolRegistry,
    pub sandbox: SandboxPolicy,
    pub verification_gate: VerificationGate,
    pub event_log: CanonicalEventLog,
    pub max_iterations: usize,
}

impl ModularAgentLoop {
    pub fn new(workspace_dir: std::path::PathBuf) -> Self {
        Self {
            registry: ToolRegistry::new(),
            sandbox: SandboxPolicy::new(workspace_dir),
            verification_gate: VerificationGate::default(),
            event_log: CanonicalEventLog::new(),
            max_iterations: 25,
        }
    }

    /// Pure 7-phase loop execution
    pub fn execute_turn(
        &mut self,
        prompt: &str,
        _client: &LlmRouter,
        state: &mut AgentState,
        hooks: &AgentHooks,
    ) -> Result<ToolLoopOutcome> {
        let session_id = state
            .session_id
            .map(|id| id.to_string())
            .unwrap_or_else(|| "default_session".into());
        let turn_id = state.retries as u64;

        // Phase 1 & 2: log the turn start, then delegate execution to the
        // production loop. This keeps one behavioral implementation while
        // exposing the typed outcome/event-log contract to other frontends.
        self.event_log.append(&session_id, turn_id, EventMsg::TurnStarted);
        let captured = Arc::new(Mutex::new(Vec::<AgentEvent>::new()));
        let sink = captured.clone();
        let downstream = hooks.on_event.clone();
        let runtime_hooks = AgentHooks {
            on_event: Some(Arc::new(move |event| {
                if let Ok(mut events) = sink.lock() {
                    events.push(event.clone());
                }
                if let Some(callback) = &downstream {
                    callback(event);
                }
            })),
            on_tool_call_delta: hooks.on_tool_call_delta.clone(),
            on_text_delta: hooks.on_text_delta.clone(),
            on_approval: hooks.on_approval.clone(),
            on_plan_approval: hooks.on_plan_approval.clone(),
            interrupt: hooks.interrupt.clone(),
            session_approvals: hooks.session_approvals.clone(),
        };

        crate::async_rt::block_on(crate::agent::agent_loop::run_agent_loop_with_hooks(
            _client,
            state,
            prompt,
            &runtime_hooks,
            AgentMode::Agent,
        ));

        let events = captured.lock().map(|events| events.clone()).unwrap_or_default();
        let mut outcome = None;
        for event in events {
            self.event_log.append(&session_id, turn_id, event.clone().into());
            match event {
                AgentEvent::Done { message } => {
                    outcome = Some(ToolLoopOutcome::Success {
                        final_text: message,
                        summary: finalize_turn(state, false)?,
                    });
                }
                AgentEvent::Failed { message } => {
                    outcome = Some(ToolLoopOutcome::Failed { error: message });
                }
                AgentEvent::Interrupted => outcome = Some(ToolLoopOutcome::Interrupted),
                _ => {}
            }
        }
        outcome.ok_or_else(|| crate::error::message("agent turn produced no terminal event"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_modular_loop_creation() {
        let orchestrator = ModularAgentLoop::new(PathBuf::from("."));
        assert!(orchestrator.registry.has_tool("read_file"));
        assert_eq!(orchestrator.max_iterations, 25);
    }
}
