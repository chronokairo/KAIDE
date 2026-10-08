pub mod event_log;

use crate::agent::agent_loop::{
    AgentEvent, AgentHooks, ApprovalDecision, ApprovalRequest, PlanApprovalDecision,
    PlanApprovalRequest,
};
use crate::agent::state::AgentState;
use crate::llm::router::LlmRouter;
use crate::ui::AgentMode;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeSet, HashMap};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Op {
    UserTurn { prompt: String, mode: String },
    Interrupt,
    ExecApproval { id: u64, decision: String },
    PlanApproval { id: u64, decision: String },
    Shutdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum EventMsg {
    /// Correlates all events emitted for a user turn without changing the
    /// existing event payloads consumed by older clients.
    TurnContext {
        thread_id: String,
        turn_id: u64,
    },
    TurnStarted,
    TextDelta {
        text: String,
    },
    ReasoningDelta {
        text: String,
    },
    ToolCall {
        id: String,
        name: String,
        summary: String,
    },
    ToolCallDelta {
        id: String,
        index: usize,
        name: Option<String>,
        args_delta: String,
    },
    ToolResult {
        id: String,
        name: String,
        output: String,
        exit_code: Option<i32>,
        timed_out: bool,
        duration_ms: u64,
    },
    PlanStep {
        index: usize,
        total: usize,
        description: String,
    },
    PlanApprovalRequest {
        id: u64,
        steps: Vec<PlanStepSummary>,
    },
    ExecApprovalRequest {
        id: u64,
        tool: String,
        summary: String,
        risk: String,
    },
    FileChanged {
        path: String,
    },
    Verification {
        status: String,
        command: Option<String>,
        summary: String,
    },
    CompletionAudit {
        passed: bool,
        evidence: String,
    },
    Transaction {
        action: String,
        summary: String,
    },
    TokenUsage {
        prompt_tokens: usize,
        completion_tokens: usize,
        reasoning_tokens: usize,
        total_tokens: usize,
    },
    Note {
        text: String,
    },
    Routing {
        summary: String,
    },
    Done {
        message: String,
    },
    Failed {
        message: String,
    },
    Interrupted,
    TurnComplete {
        final_text: String,
    },
    Error {
        message: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanStepSummary {
    pub step_type: String,
    pub description: String,
    pub filename: Option<String>,
    pub command: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ApprovalDecisionSerde {
    AllowOnce,
    AllowSession,
    Deny,
}

fn tagged(name: &str, data: Option<crate::json::Value>) -> crate::json::Value {
    let mut object = std::collections::BTreeMap::new();
    object.insert("type".into(), crate::json::Value::from(name));
    if let Some(data) = data { object.insert("data".into(), data); }
    crate::json::Value::object(object)
}

fn event_data(value: &crate::json::Value) -> crate::error::Result<&std::collections::BTreeMap<String, crate::json::Value>> {
    value.get("data").and_then(|data| data.as_object()).ok_or_else(|| crate::error::message("event is missing data"))
}
fn event_text(data: &std::collections::BTreeMap<String, crate::json::Value>, key: &str) -> crate::error::Result<String> {
    data.get(key).and_then(|value| value.as_str()).map(str::to_string).ok_or_else(|| crate::error::message(format!("event is missing {key}")))
}
fn event_usize(data: &std::collections::BTreeMap<String, crate::json::Value>, key: &str) -> crate::error::Result<usize> {
    data.get(key).and_then(|value| value.as_u64()).map(|value| value as usize).ok_or_else(|| crate::error::message(format!("event is missing {key}")))
}
fn event_u64(data: &std::collections::BTreeMap<String, crate::json::Value>, key: &str) -> crate::error::Result<u64> {
    data.get(key).and_then(|value| value.as_u64()).ok_or_else(|| crate::error::message(format!("event is missing {key}")))
}
fn event_optional_text(data: &std::collections::BTreeMap<String, crate::json::Value>, key: &str) -> Option<String> {
    data.get(key).and_then(|value| if value.is_null() { None } else { value.as_str().map(str::to_string) })
}

impl PlanStepSummary {
    fn to_json(&self) -> crate::json::Value { crate::json_expr!({
        "step_type": self.step_type.clone(), "description": self.description.clone(),
        "filename": self.filename.clone(), "command": self.command.clone()
    }) }
    fn from_json(value: &crate::json::Value) -> crate::error::Result<Self> {
        let data = value.as_object().ok_or_else(|| crate::error::message("plan step summary must be an object"))?;
        Ok(Self {
            step_type: data.get("step_type").and_then(|value| value.as_str()).unwrap_or_default().into(),
            description: event_text(data, "description")?,
            filename: event_optional_text(data, "filename"),
            command: event_optional_text(data, "command"),
        })
    }
}

impl EventMsg {
    pub fn to_json(&self) -> crate::json::Value {
        match self {
            Self::TurnContext { thread_id, turn_id } => tagged("TurnContext", Some(crate::json_expr!({"thread_id": thread_id.clone(), "turn_id": *turn_id}))),
            Self::TurnStarted => tagged("TurnStarted", None),
            Self::Interrupted => tagged("Interrupted", None),
            Self::TextDelta { text } => tagged("TextDelta", Some(crate::json_expr!({"text": text.clone()}))),
            Self::ReasoningDelta { text } => tagged("ReasoningDelta", Some(crate::json_expr!({"text": text.clone()}))),
            Self::ToolCall { id, name, summary } => tagged("ToolCall", Some(crate::json_expr!({"id": id.clone(), "name": name.clone(), "summary": summary.clone()}))),
            Self::ToolCallDelta { id, index, name, args_delta } => tagged("ToolCallDelta", Some(crate::json_expr!({"id": id.clone(), "index": *index, "name": name.clone(), "args_delta": args_delta.clone()}))),
            Self::ToolResult { id, name, output, exit_code, timed_out, duration_ms } => tagged("ToolResult", Some(crate::json_expr!({"id": id.clone(), "name": name.clone(), "output": output.clone(), "exit_code": exit_code.map(i64::from), "timed_out": *timed_out, "duration_ms": *duration_ms}))),
            Self::PlanStep { index, total, description } => tagged("PlanStep", Some(crate::json_expr!({"index": *index, "total": *total, "description": description.clone()}))),
            Self::PlanApprovalRequest { id, steps } => tagged("PlanApprovalRequest", Some(crate::json_expr!({"id": *id, "steps": steps.iter().map(PlanStepSummary::to_json).collect::<Vec<_>>() }))),
            Self::ExecApprovalRequest { id, tool, summary, risk } => tagged("ExecApprovalRequest", Some(crate::json_expr!({"id": *id, "tool": tool.clone(), "summary": summary.clone(), "risk": risk.clone()}))),
            Self::FileChanged { path } => tagged("FileChanged", Some(crate::json_expr!({"path": path.clone()}))),
            Self::Verification { status, command, summary } => tagged("Verification", Some(crate::json_expr!({"status": status.clone(), "command": command.clone(), "summary": summary.clone()}))),
            Self::CompletionAudit { passed, evidence } => tagged("CompletionAudit", Some(crate::json_expr!({"passed": *passed, "evidence": evidence.clone()}))),
            Self::Transaction { action, summary } => tagged("Transaction", Some(crate::json_expr!({"action": action.clone(), "summary": summary.clone()}))),
            Self::TokenUsage { prompt_tokens, completion_tokens, reasoning_tokens, total_tokens } => tagged("TokenUsage", Some(crate::json_expr!({"prompt_tokens": *prompt_tokens, "completion_tokens": *completion_tokens, "reasoning_tokens": *reasoning_tokens, "total_tokens": *total_tokens}))),
            Self::Note { text } => tagged("Note", Some(crate::json_expr!({"text": text.clone()}))),
            Self::Routing { summary } => tagged("Routing", Some(crate::json_expr!({"summary": summary.clone()}))),
            Self::Done { message } => tagged("Done", Some(crate::json_expr!({"message": message.clone()}))),
            Self::Failed { message } => tagged("Failed", Some(crate::json_expr!({"message": message.clone()}))),
            Self::TurnComplete { final_text } => tagged("TurnComplete", Some(crate::json_expr!({"final_text": final_text.clone()}))),
            Self::Error { message } => tagged("Error", Some(crate::json_expr!({"message": message.clone()}))),
        }
    }

    pub fn from_json(value: &crate::json::Value) -> crate::error::Result<Self> {
        let name = value.get("type").and_then(|value| value.as_str()).ok_or_else(|| crate::error::message("event is missing type"))?;
        let data = if matches!(name, "TurnStarted" | "Interrupted") { None } else { Some(event_data(value)?) };
        let empty = std::collections::BTreeMap::new();
        let d = data.unwrap_or(&empty);
        Ok(match name {
            "TurnContext" => Self::TurnContext { thread_id: event_text(d, "thread_id")?, turn_id: event_u64(d, "turn_id")? },
            "TurnStarted" => Self::TurnStarted,
            "Interrupted" => Self::Interrupted,
            "TextDelta" => Self::TextDelta { text: event_text(d, "text")? },
            "ReasoningDelta" => Self::ReasoningDelta { text: event_text(d, "text")? },
            "ToolCall" => Self::ToolCall { id: event_optional_text(d, "id").unwrap_or_default(), name: event_text(d, "name")?, summary: event_text(d, "summary")? },
            "ToolCallDelta" => Self::ToolCallDelta { id: event_optional_text(d, "id").unwrap_or_else(|| format!("call_{}", event_usize(d, "index").unwrap_or(0))), index: event_usize(d, "index")?, name: event_optional_text(d, "name"), args_delta: event_text(d, "args_delta")? },
            "ToolResult" => Self::ToolResult { id: event_text(d, "id")?, name: event_text(d, "name")?, output: event_text(d, "output")?, exit_code: d.get("exit_code").and_then(|value| value.as_i64()).and_then(|value| i32::try_from(value).ok()), timed_out: d.get("timed_out").and_then(|value| value.as_bool()).unwrap_or(false), duration_ms: d.get("duration_ms").and_then(|value| value.as_u64()).unwrap_or(0) },
            "PlanStep" => Self::PlanStep { index: event_usize(d, "index")?, total: event_usize(d, "total")?, description: event_text(d, "description")? },
            "PlanApprovalRequest" => Self::PlanApprovalRequest { id: event_u64(d, "id")?, steps: d.get("steps").and_then(|value| value.as_array()).ok_or_else(|| crate::error::message("event is missing steps"))?.iter().map(PlanStepSummary::from_json).collect::<crate::error::Result<Vec<_>>>()? },
            "ExecApprovalRequest" => Self::ExecApprovalRequest { id: event_u64(d, "id")?, tool: event_text(d, "tool")?, summary: event_text(d, "summary")?, risk: event_text(d, "risk")? },
            "FileChanged" => Self::FileChanged { path: event_text(d, "path")? },
            "Verification" => Self::Verification { status: event_text(d, "status")?, command: event_optional_text(d, "command"), summary: event_text(d, "summary")? },
            "CompletionAudit" => Self::CompletionAudit { passed: d.get("passed").and_then(|value| value.as_bool()).ok_or_else(|| crate::error::message("event is missing passed"))?, evidence: event_text(d, "evidence")? },
            "Transaction" => Self::Transaction { action: event_text(d, "action")?, summary: event_text(d, "summary")? },
            "TokenUsage" => Self::TokenUsage { prompt_tokens: event_usize(d, "prompt_tokens")?, completion_tokens: event_usize(d, "completion_tokens")?, reasoning_tokens: event_usize(d, "reasoning_tokens")?, total_tokens: event_usize(d, "total_tokens")? },
            "Note" => Self::Note { text: event_text(d, "text")? },
            "Routing" => Self::Routing { summary: event_text(d, "summary")? },
            "Done" => Self::Done { message: event_text(d, "message")? },
            "Failed" => Self::Failed { message: event_text(d, "message")? },
            "TurnComplete" => Self::TurnComplete { final_text: event_text(d, "final_text")? },
            "Error" => Self::Error { message: event_text(d, "message")? },
            other => return Err(crate::error::message(format!("unknown event type {other}"))),
        })
    }
}

impl From<ApprovalDecision> for ApprovalDecisionSerde {
    fn from(d: ApprovalDecision) -> Self {
        match d {
            ApprovalDecision::AllowOnce => Self::AllowOnce,
            ApprovalDecision::AllowSession => Self::AllowSession,
            ApprovalDecision::Deny => Self::Deny,
        }
    }
}

impl From<AgentEvent> for EventMsg {
    fn from(ev: AgentEvent) -> Self {
        match ev {
            AgentEvent::Status(text) => EventMsg::Note { text },
            AgentEvent::ToolCall { id, name, summary } => EventMsg::ToolCall { id, name, summary },
            AgentEvent::ToolCallDelta {
                id,
                index,
                name,
                args_delta,
            } => EventMsg::ToolCallDelta {
                id,
                index,
                name,
                args_delta,
            },
            AgentEvent::ToolResult { id, name, output, exit_code, timed_out, duration_ms } => EventMsg::ToolResult { id, name, output, exit_code, timed_out, duration_ms },
            AgentEvent::PlanStep {
                index,
                total,
                description,
            } => EventMsg::PlanStep {
                index,
                total,
                description,
            },
            AgentEvent::FileChanged { path } => EventMsg::FileChanged { path },
            AgentEvent::Verification {
                status,
                command,
                summary,
            } => EventMsg::Verification {
                status,
                command,
                summary,
            },
            AgentEvent::CompletionAudit { passed, evidence } => EventMsg::CompletionAudit { passed, evidence },
            AgentEvent::Transaction { action, summary } => {
                EventMsg::Transaction { action, summary }
            }
            AgentEvent::TextDelta { text } => EventMsg::TextDelta { text },
            AgentEvent::TokenUsage {
                prompt_tokens,
                completion_tokens,
                reasoning_tokens,
                total_tokens,
            } => EventMsg::TokenUsage {
                prompt_tokens,
                completion_tokens,
                reasoning_tokens,
                total_tokens,
            },
            AgentEvent::ReasoningDelta { text } => EventMsg::ReasoningDelta { text },
            AgentEvent::ResetReasoning => EventMsg::Note {
                text: "[reset_reasoning]".into(),
            },
            AgentEvent::Routing { summary } => EventMsg::Routing { summary },
            AgentEvent::Done { message } => EventMsg::Done { message },
            AgentEvent::Failed { message } => EventMsg::Failed { message },
            AgentEvent::Interrupted => EventMsg::Interrupted,
        }
    }
}

struct ApprovalWaiter {
    tx: mpsc::Sender<ApprovalDecision>,
}

struct PlanWaiter {
    tx: mpsc::Sender<PlanApprovalDecision>,
}

pub struct Session {
    op_tx: mpsc::Sender<Op>,
    event_rx: Arc<Mutex<mpsc::Receiver<EventMsg>>>,
    event_tx: mpsc::Sender<EventMsg>,
    exec_waiters: Arc<Mutex<HashMap<u64, ApprovalWaiter>>>,
    plan_waiters: Arc<Mutex<HashMap<u64, PlanWaiter>>>,
    interrupt: Arc<AtomicBool>,
    handle: Option<thread::JoinHandle<()>>,
}

impl Session {
    pub fn spawn(client: LlmRouter, mut state: AgentState) -> Self {
        let (op_tx, op_rx) = mpsc::channel::<Op>();
        let (event_tx, event_rx) = mpsc::channel::<EventMsg>();
        let event_rx = Arc::new(Mutex::new(event_rx));

        let exec_waiters = Arc::new(Mutex::new(HashMap::<u64, ApprovalWaiter>::new()));
        let plan_waiters = Arc::new(Mutex::new(HashMap::<u64, PlanWaiter>::new()));
        let interrupt = Arc::new(AtomicBool::new(false));

        let client_clone = client.clone();
        let exec_waiters_clone = exec_waiters.clone();
        let plan_waiters_clone = plan_waiters.clone();
        let interrupt_clone = interrupt.clone();
        let event_tx = Arc::new(event_tx);
        let event_tx_for_session = event_tx.clone();

        let handle = thread::spawn(move || {
            let runtime = crate::async_rt::runtime::Runtime::new().expect("Failed to create runtime");
            runtime.block_on(async {
                let mut turn_id = 0u64;
                loop {
                    match op_rx.recv() {
                        Ok(Op::UserTurn { prompt, mode }) => {
                            turn_id = turn_id.saturating_add(1);
                            interrupt_clone.store(false, Ordering::Relaxed);
                            let thread_id = state.session_id
                                .map(|id| id.to_string())
                                .unwrap_or_else(|| "default_session".into());
                            let _ = event_tx.send(EventMsg::TurnContext { thread_id, turn_id });
                            let agent_mode = match mode.as_str() {
                                "plan" => AgentMode::Plan,
                                _ => AgentMode::Agent,
                            };
                            // Clone senders for this turn
                            let event_tx = event_tx.clone();
                            let event_tx_clone = (*event_tx).clone();
                            let event_tx_text = (*event_tx).clone();
                            let event_tx_reasoning = (*event_tx).clone();
                            let event_tx_tool_delta = (*event_tx).clone();
                            let event_tx_tool_call = (*event_tx).clone();
                            let event_tx_plan_step = (*event_tx).clone();
                            let event_tx_file_changed = (*event_tx).clone();
                            let event_tx_verification = (*event_tx).clone();
                            let event_tx_transaction = (*event_tx).clone();
                            let event_tx_token = (*event_tx).clone();
                            let event_tx_note = (*event_tx).clone();
                            let event_tx_done = (*event_tx).clone();
                            let event_tx_failed = (*event_tx).clone();
                            let event_tx_interrupt = (*event_tx).clone();

                            let hooks = build_protocol_hooks(
                                event_tx_clone,
                                event_tx_text,
                                event_tx_reasoning,
                                event_tx_tool_delta,
                                event_tx_tool_call,
                                event_tx_plan_step,
                                event_tx_file_changed,
                                event_tx_verification,
                                event_tx_transaction,
                                event_tx_token,
                                event_tx_note,
                                event_tx_done,
                                event_tx_failed,
                                event_tx_interrupt,
                                exec_waiters_clone.clone(),
                                plan_waiters_clone.clone(),
                                interrupt_clone.clone(),
                            );
                            crate::agent::agent_loop::run_agent_loop_with_hooks(
                                &client_clone,
                                &mut state,
                                &prompt,
                                &hooks,
                                agent_mode,
                            )
                            .await;
                        }
                        Ok(Op::Interrupt) => {
                            interrupt_clone.store(true, Ordering::Relaxed);
                        }
                        Ok(Op::ExecApproval { id, decision }) => {
                            if let Some(waiter) = exec_waiters_clone.lock().unwrap().remove(&id) {
                                let decision = match decision.as_str() {
                                    "allow_once" => ApprovalDecision::AllowOnce,
                                    "allow_session" => ApprovalDecision::AllowSession,
                                    _ => ApprovalDecision::Deny,
                                };
                                let _ = waiter.tx.send(decision);
                            }
                        }
                        Ok(Op::PlanApproval { id, decision }) => {
                            if let Some(waiter) = plan_waiters_clone.lock().unwrap().remove(&id) {
                                let decision = match decision.as_str() {
                                    "approve" => PlanApprovalDecision::Approve,
                                    _ => PlanApprovalDecision::Deny,
                                };
                                let _ = waiter.tx.send(decision);
                            }
                        }
                        Ok(Op::Shutdown) | Err(_) => {
                            break;
                        }
                    }
                }
            });
        });

        Self {
            op_tx,
            event_rx,
            event_tx: event_tx_for_session.as_ref().clone(),
            exec_waiters,
            plan_waiters,
            interrupt,
            handle: Some(handle),
        }
    }

    pub fn submit(&self, op: Op) -> Result<(), mpsc::SendError<Op>> {
        self.op_tx.send(op)
    }

    pub fn next_event(&self) -> Option<EventMsg> {
        self.event_rx.lock().unwrap().recv().ok()
    }

    pub fn try_next_event(&self) -> Option<EventMsg> {
        self.event_rx.lock().unwrap().try_recv().ok()
    }

    pub fn interrupt(&self) {
        self.interrupt.store(true, Ordering::Relaxed);
    }

    pub fn approve_exec(&self, id: u64, decision: ApprovalDecisionSerde) {
        if let Some(waiter) = self.exec_waiters.lock().unwrap().remove(&id) {
            let decision = match decision {
                ApprovalDecisionSerde::AllowOnce => ApprovalDecision::AllowOnce,
                ApprovalDecisionSerde::AllowSession => ApprovalDecision::AllowSession,
                ApprovalDecisionSerde::Deny => ApprovalDecision::Deny,
            };
            let _ = waiter.tx.send(decision);
        }
    }

    pub fn approve_plan(&self, id: u64, decision: PlanApprovalDecision) {
        if let Some(waiter) = self.plan_waiters.lock().unwrap().remove(&id) {
            let _ = waiter.tx.send(decision);
        }
    }

    pub fn shutdown(&mut self) {
        let _ = self.submit(Op::Shutdown);
        if let Some(h) = self.handle.take() {
            let _ = h.join();
        }
    }
}

impl Drop for Session {
    fn drop(&mut self) {
        self.shutdown();
    }
}

#[allow(clippy::too_many_arguments)]
fn build_protocol_hooks(
    event_tx: mpsc::Sender<EventMsg>,
    event_tx_text: mpsc::Sender<EventMsg>,
    _event_tx_reasoning: mpsc::Sender<EventMsg>,
    _event_tx_tool_delta: mpsc::Sender<EventMsg>,
    event_tx_tool_call: mpsc::Sender<EventMsg>,
    event_tx_plan_step: mpsc::Sender<EventMsg>,
    _event_tx_file_changed: mpsc::Sender<EventMsg>,
    _event_tx_verification: mpsc::Sender<EventMsg>,
    _event_tx_transaction: mpsc::Sender<EventMsg>,
    _event_tx_token: mpsc::Sender<EventMsg>,
    _event_tx_note: mpsc::Sender<EventMsg>,
    _event_tx_done: mpsc::Sender<EventMsg>,
    _event_tx_failed: mpsc::Sender<EventMsg>,
    _event_tx_interrupt: mpsc::Sender<EventMsg>,
    exec_waiters: Arc<Mutex<HashMap<u64, ApprovalWaiter>>>,
    plan_waiters: Arc<Mutex<HashMap<u64, PlanWaiter>>>,
    interrupt: Arc<AtomicBool>,
) -> AgentHooks {
    AgentHooks {
        on_event: Some(Arc::new(move |ev: AgentEvent| {
            let _ = event_tx.send(ev.into());
        })),
        on_tool_call_delta: None,
        on_text_delta: Some(Arc::new(move |text: &str| {
            let _ = event_tx_text.send(EventMsg::TextDelta {
                text: text.to_string(),
            });
        })),
        on_approval: Some(Arc::new(move |req: ApprovalRequest| {
            let (tx, rx) = mpsc::channel::<ApprovalDecision>();
            exec_waiters
                .lock()
                .unwrap()
                .insert(req.id, ApprovalWaiter { tx });
            let _ = event_tx_tool_call.send(EventMsg::ExecApprovalRequest {
                id: req.id,
                tool: req.tool,
                summary: req.summary,
                risk: req.risk,
            });
            rx.recv().unwrap_or(ApprovalDecision::Deny)
        })),
        on_plan_approval: Some(Arc::new(move |req: PlanApprovalRequest| {
            let (tx, rx) = mpsc::channel::<PlanApprovalDecision>();
            plan_waiters
                .lock()
                .unwrap()
                .insert(req.id, PlanWaiter { tx });
            let steps: Vec<PlanStepSummary> = req
                .steps
                .iter()
                .map(|s| PlanStepSummary {
                    step_type: s.step_type.clone(),
                    description: s.description.clone(),
                    filename: s.filename.clone(),
                    command: s.command.clone(),
                })
                .collect();
            let _ = event_tx_plan_step.send(EventMsg::PlanApprovalRequest { id: req.id, steps });
            rx.recv().unwrap_or(PlanApprovalDecision::Deny)
        })),
        interrupt: Some(interrupt),
        session_approvals: Arc::new(Mutex::new(BTreeSet::new())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tool_result_round_trips_with_terminal_metadata() {
        let event = EventMsg::ToolResult {
            id: "call_7".into(),
            name: "run_command".into(),
            output: "cargo test [exit 0]".into(),
            exit_code: Some(0),
            timed_out: false,
            duration_ms: 42,
        };
        let encoded = event.to_json();
        let decoded = EventMsg::from_json(&encoded).expect("tool result must decode");
        match decoded {
            EventMsg::ToolResult { id, name, exit_code, timed_out, .. } => {
                assert_eq!(id, "call_7");
                assert_eq!(name, "run_command");
                assert_eq!(exit_code, Some(0));
                assert!(!timed_out);
            }
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn turn_context_round_trips_correlation_ids() {
        let event = EventMsg::TurnContext { thread_id: "session-1".into(), turn_id: 4 };
        let decoded = EventMsg::from_json(&event.to_json()).expect("turn context must decode");
        assert!(matches!(decoded, EventMsg::TurnContext { thread_id, turn_id } if thread_id == "session-1" && turn_id == 4));
    }

    #[test]
    fn tool_delta_round_trips_item_id() {
        let event = EventMsg::ToolCallDelta {
            id: "call_0".into(),
            index: 0,
            name: Some("read_file".into()),
            args_delta: "{\"path\":\"a.rs\"}".into(),
        };
        let decoded = EventMsg::from_json(&event.to_json()).expect("tool delta must decode");
        assert!(matches!(decoded, EventMsg::ToolCallDelta { id, index: 0, .. } if id == "call_0"));
    }
}
