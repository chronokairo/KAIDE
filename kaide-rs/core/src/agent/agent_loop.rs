use crate::agent::executor;
use crate::agent::planner;
use crate::agent::state::{AgentState, TodoItem};
use crate::config::settings::ApprovalPolicy;
use crate::llm::prompt::CoderPrompt;
use crate::llm::router::LlmRouter;
use crate::tools::background::TaskStatus;
use crate::tools::shell;
use crate::tools::test::{self, VerificationResult, VerificationStatus};
use crate::ui::AgentMode;
use crate::error::Result;
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Instant;

/// Progress events emitted by the agent loop, consumed by the TUI to show
/// live tool calls, plan steps and final results (mirrors exec-cell streaming
/// in 2026-era coding-agent TUIs).
#[derive(Debug, Clone)]
pub enum AgentEvent {
    Status(String),
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
    /// Bounded result for a completed tool item. Keeping this separate from
    /// the call event lets UIs render terminal output without replaying the
    /// full model conversation.
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
    FileChanged {
        path: String,
    },
    Verification {
        status: String,
        command: Option<String>,
        summary: String,
    },
    /// Deterministic completion audit emitted immediately before a turn is
    /// allowed to keep workspace changes and report success.
    CompletionAudit {
        passed: bool,
        evidence: String,
    },
    Transaction {
        action: String,
        summary: String,
    },
    /// Streaming assistant text: one event per content delta. The TUI appends
    /// these into a live message line while the model is still generating.
    TextDelta {
        text: String,
    },
    /// Token usage from a completed LLM call.
    TokenUsage {
        prompt_tokens: usize,
        completion_tokens: usize,
        reasoning_tokens: usize,
        total_tokens: usize,
    },
    /// Model selected by the task router at the start of a turn.
    Routing {
        summary: String,
    },
    /// Reasoning content delta from thinking models (GLM-5.2, deepseek-r1, etc.).
    ReasoningDelta {
        text: String,
    },
    /// Reset reasoning accumulation between tool iterations.
    ResetReasoning,
    Done {
        message: String,
    },
    Failed {
        message: String,
    },
    Interrupted,
}

#[derive(Debug, Clone)]
pub struct ApprovalRequest {
    pub id: u64,
    pub tool: String,
    pub summary: String,
    pub risk: String,
}

#[derive(Debug, Clone)]
pub struct PlanApprovalRequest {
    pub id: u64,
    pub steps: Vec<crate::types::plan::PlanStep>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PlanApprovalDecision {
    Approve,
    Deny,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ApprovalDecision {
    AllowOnce,
    AllowSession,
    Deny,
}

static APPROVAL_ID: AtomicU64 = AtomicU64::new(1);
static PLAN_APPROVAL_ID: AtomicU64 = AtomicU64::new(1);

/// Streamed tool-call argument delta callback: `(call_index, tool_name, args_delta)`.
pub type ToolCallDeltaFn = Arc<dyn Fn(usize, Option<&str>, &str) + Send + Sync>;

/// Optional UI hooks for the agent loop: progress, approval and cancellation.
#[derive(Default, Clone)]
pub struct AgentHooks {
    pub on_event: Option<Arc<dyn Fn(AgentEvent) + Send + Sync>>,
    pub on_tool_call_delta: Option<ToolCallDeltaFn>,
    pub on_text_delta: Option<Arc<dyn Fn(&str) + Send + Sync>>,
    pub on_approval: Option<Arc<dyn Fn(ApprovalRequest) -> ApprovalDecision + Send + Sync>>,
    pub on_plan_approval:
        Option<Arc<dyn Fn(PlanApprovalRequest) -> PlanApprovalDecision + Send + Sync>>,
    pub interrupt: Option<Arc<AtomicBool>>,
    /// Session-scoped approvals shared by every cloned hook in this turn.
    /// This mirrors Claude Code's "allow for session" behavior while keeping
    /// the approval decision inside the protocol boundary.
    pub session_approvals: Arc<Mutex<BTreeSet<String>>>,
}

impl AgentHooks {
    pub fn emit(&self, event: AgentEvent) {
        if let Some(f) = &self.on_event {
            f(event);
        }
    }

    /// Forward a streamed assistant-text delta to the UI, if any.
    pub fn text_delta(&self, text: &str) {
        if let Some(f) = &self.on_text_delta {
            f(text);
        }
    }

    /// Stream a text chunk to the UI, or to stdout when no UI is attached.
    /// Unlike [`Self::text_delta`], this keeps the CLI streaming behavior of
    /// callers that previously wrote straight to the terminal.
    pub fn stream_text(&self, text: &str) {
        if let Some(f) = &self.on_text_delta {
            f(text);
        } else {
            use std::io::Write;
            print!("{text}");
            let _ = std::io::stdout().flush();
        }
    }

    /// Forward a reasoning content delta to the UI, if any.
    pub fn reasoning_delta(&self, text: &str) {
        if let Some(f) = &self.on_event {
            f(AgentEvent::ReasoningDelta {
                text: text.to_string(),
            });
        }
    }

    /// Reset reasoning accumulation between tool iterations.
    pub fn reset_reasoning(&self) {
        if let Some(f) = &self.on_event {
            f(AgentEvent::ResetReasoning);
        }
    }

    pub fn note(&self, text: &str) {
        if self.on_event.is_some() {
            self.emit(AgentEvent::Status(text.to_string()));
        } else {
            println!("{text}");
        }
    }

    pub fn warn(&self, text: &str) {
        if self.on_event.is_some() {
            self.emit(AgentEvent::Status(text.to_string()));
        } else {
            eprintln!("{text}");
        }
    }

    pub fn tool_call(&self, id: &str, name: &str, summary: &str) {
        if self.on_event.is_some() {
            self.emit(AgentEvent::ToolCall {
                id: id.to_string(),
                name: name.to_string(),
                summary: summary.to_string(),
            });
        } else {
            println!("    → {name}: {summary}");
        }
    }

    pub fn plan_step(&self, index: usize, total: usize, step_type: &str, description: &str) {
        let description = format!("[{step_type}] {description}");
        if self.on_event.is_some() {
            self.emit(AgentEvent::PlanStep {
                index,
                total,
                description,
            });
        } else {
            println!("\n[{index}/{total}] {description}");
        }
    }

    pub fn file_changed(&self, path: &str) {
        if self.on_event.is_some() {
            self.emit(AgentEvent::FileChanged {
                path: path.to_string(),
            });
        } else {
            println!("    Δ {path}");
        }
    }

    pub fn verification(&self, result: &VerificationResult) {
        let status = match result.status {
            VerificationStatus::Passed => "passed",
            VerificationStatus::Failed => "failed",
            VerificationStatus::Unavailable => "unavailable",
        };
        let summary = truncate_tool_output(&result.output, 240);
        if self.on_event.is_some() {
            self.emit(AgentEvent::Verification {
                status: status.to_string(),
                command: result.command.clone(),
                summary,
            });
        } else {
            println!("    ✓ verify [{status}]: {summary}");
        }
    }

    pub fn transaction(&self, action: &str, summary: &str) {
        if self.on_event.is_some() {
            self.emit(AgentEvent::Transaction {
                action: action.to_string(),
                summary: summary.to_string(),
            });
        } else {
            println!("    ↺ transaction [{action}]: {summary}");
        }
    }

    pub fn completion_audit(&self, passed: bool, evidence: &str) {
        self.emit(AgentEvent::CompletionAudit {
            passed,
            evidence: evidence.to_string(),
        });
    }

    pub fn tool_result(
        &self,
        id: &str,
        name: &str,
        output: &str,
        exit_code: Option<i32>,
        timed_out: bool,
        duration_ms: u64,
    ) {
        self.emit(AgentEvent::ToolResult {
            id: id.to_string(),
            name: name.to_string(),
            output: output.to_string(),
            exit_code,
            timed_out,
            duration_ms,
        });
    }

    pub fn require_approval(
        &self,
        policy: ApprovalPolicy,
        tool: &str,
        summary: &str,
        risk: &str,
    ) -> Result<(), String> {
        // Session approvals are scoped to the concrete requested action, not
        // merely the tool name. This prevents approving one shell command or
        // file operation from silently authorizing a different one later.
        let approval_scope = format!("{tool}\n{summary}");
        if policy == ApprovalPolicy::Ask
            && self
                .session_approvals
                .lock()
                .map(|approved| approved.contains(&approval_scope))
                .unwrap_or(false)
        {
            return Ok(());
        }
        match policy {
            ApprovalPolicy::Allow => Ok(()),
            ApprovalPolicy::Deny => Err(format!("{tool} is denied by policy")),
            ApprovalPolicy::Ask => {
                let request = ApprovalRequest {
                    id: APPROVAL_ID.fetch_add(1, Ordering::Relaxed),
                    tool: tool.to_string(),
                    summary: summary.to_string(),
                    risk: risk.to_string(),
                };
                let decision = self
                    .on_approval
                    .as_ref()
                    .map(|callback| callback(request))
                    .unwrap_or(ApprovalDecision::Deny);
                match decision {
                    ApprovalDecision::AllowOnce => Ok(()),
                    ApprovalDecision::AllowSession => {
                        if let Ok(mut approved) = self.session_approvals.lock() {
                            approved.insert(approval_scope);
                        }
                        Ok(())
                    }
                    ApprovalDecision::Deny => Err(format!("{tool} was not approved")),
                }
            }
        }
    }

    pub fn require_plan_approval(
        &self,
        steps: Vec<crate::types::plan::PlanStep>,
    ) -> Result<(), String> {
        let request = PlanApprovalRequest {
            id: PLAN_APPROVAL_ID.fetch_add(1, Ordering::Relaxed),
            steps,
        };
        match self
            .on_plan_approval
            .as_ref()
            .map(|callback| callback(request))
            .unwrap_or(PlanApprovalDecision::Deny)
        {
            PlanApprovalDecision::Approve => Ok(()),
            PlanApprovalDecision::Deny => Err("Plan was not approved".into()),
        }
    }

    pub fn done(&self, message: &str) {
        if self.on_event.is_some() {
            self.emit(AgentEvent::Done {
                message: message.to_string(),
            });
        } else if !message.trim().is_empty() {
            println!("\n[agent] {}", message.trim());
        }
    }

    pub fn failed(&self, message: &str) {
        if self.on_event.is_some() {
            self.emit(AgentEvent::Failed {
                message: message.to_string(),
            });
        } else {
            eprintln!("\n[agent failed] {}", message.trim());
        }
    }

    pub fn interrupted(&self) -> bool {
        self.interrupt
            .as_ref()
            .map(|f| f.load(Ordering::Relaxed))
            .unwrap_or(false)
    }
}

/// Cap on verification output fed back into the fix loop (protects context).
const FIX_FEEDBACK_CAP: usize = 2000;

fn context_compact_threshold(state: &AgentState) -> usize {
    state.config.max_context_tokens.saturating_mul(4) / 5
}

async fn maybe_compact(client: &LlmRouter, state: &mut AgentState, hooks: &AgentHooks) {
    if state.session.estimated_tokens() < context_compact_threshold(state) {
        return;
    }
    let transcript = state.session.transcript();
    let prompt = format!(
        "Summarize this coding-session conversation into a concise summary (max ~150 tokens). Keep key decisions, files touched, and open issues.\n\n{}",
        transcript
    );
    if let Ok(summary) = client
        .generate_with_retry(&state.config.summarizer_model, &prompt, None, None)
        .await
    {
        let summary = summary.trim();
        if !summary.is_empty() {
            state.session.compact(summary.to_string());
            hooks.warn("  [context compacted — history summarized]");
        }
    }
}

/// Terminal outcome of the typed Observe → Act → Verify → Repair loop.
enum ToolLoopOutcome {
    Completed(String),
    NoTools,
    Failed(String),
    Interrupted,
}

#[derive(Debug)]
struct ToolExecutionResult {
    output: String,
    mutated: bool,
    changed_file: Option<String>,
    verification: Option<VerificationResult>,
    exit_code: Option<i32>,
    timed_out: bool,
    duration_ms: u64,
}

impl ToolExecutionResult {
    fn output(output: impl Into<String>) -> Self {
        Self {
            output: output.into(),
            mutated: false,
            changed_file: None,
            verification: None,
            exit_code: None,
            timed_out: false,
            duration_ms: 0,
        }
    }
}

fn value_to_tool_call(val: &crate::json::Value) -> Option<crate::llm::client::ToolCall> {
    use crate::llm::client::{ToolCall, ToolCallFunction};

    // Format A: Standard ToolCall {"type": "function", "function": {"name": "...", "arguments": ...}}
    if let Some(func) = val.get("function").and_then(|f| f.as_object()) {
        let name = func.get("name").and_then(|n| n.as_str())?.to_string();
        let args = if let Some(args_val) = func.get("arguments") {
            if let Some(s) = args_val.as_str() {
                s.to_string()
            } else {
                crate::json::to_string(args_val)
            }
        } else {
            "{}".to_string()
        };
        return Some(ToolCall {
            id: val
                .get("id")
                .and_then(|id| id.as_str())
                .unwrap_or("")
                .to_string(),
            r#type: "function".to_string(),
            function: ToolCallFunction {
                name,
                arguments: args,
            },
        });
    }

    // Format B: Direct {"name": "...", "arguments": ...} or {"name": "...", "parameters": ...} or {"tool": "...", ...}
    let name_opt = val
        .get("name")
        .or_else(|| val.get("tool"))
        .or_else(|| val.get("action"))
        .and_then(|v| v.as_str());

    if let Some(name) = name_opt {
        let args_val_opt = val
            .get("arguments")
            .or_else(|| val.get("parameters"))
            .or_else(|| val.get("args"))
            .or_else(|| val.get("input"));

        let args_str = match args_val_opt {
            Some(crate::json::Value::String(s)) => s.clone(),
            Some(other) => crate::json::to_string(other),
            None => {
                let mut obj = val.clone();
                if let Some(map) = obj.as_object_mut() {
                    map.remove("name");
                    map.remove("tool");
                    map.remove("action");
                    crate::json::to_string(&crate::json::Value::Object(map.clone()))
                } else {
                    "{}".to_string()
                }
            }
        };

        return Some(ToolCall {
            id: val
                .get("id")
                .and_then(|id| id.as_str())
                .unwrap_or("")
                .to_string(),
            r#type: "function".to_string(),
            function: ToolCallFunction {
                name: name.to_string(),
                arguments: args_str,
            },
        });
    }

    None
}

fn collect_tool_calls_from_text(text: &str, calls: &mut Vec<crate::llm::client::ToolCall>) {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return;
    }
    if let Ok(val) = crate::json::from_str(trimmed) {
        if let Some(arr) = val.as_array() {
            for item in arr {
                if let Some(tc) = value_to_tool_call(item) {
                    calls.push(tc);
                }
            }
        } else if let Some(tc) = value_to_tool_call(&val) {
            calls.push(tc);
        }
    }

}

/// Fallback extraction for tool calls when the model returns them inside content
/// (e.g. in markdown blocks or raw JSON).
fn extract_tool_calls_from_content(response: &str) -> Vec<crate::llm::client::ToolCall> {
    let mut calls = Vec::new();
    let trimmed = response.trim();
    if trimmed.is_empty() {
        return calls;
    }

    // 1. Direct JSON parse (array, object, or multiple objects)
    collect_tool_calls_from_text(trimmed, &mut calls);
    if !calls.is_empty() {
        return calls;
    }

    // 2. Extract from markdown code blocks ```json ... ``` or ``` ... ```
    let mut search_pos = 0;
    while let Some(start_fence) = response[search_pos..].find("```") {
        let abs_start = search_pos + start_fence;
        let content_start = match response[abs_start..].find('\n') {
            Some(nl) => abs_start + nl + 1,
            None => break,
        };
        if let Some(end_fence) = response[content_start..].find("```") {
            let block = response[content_start..content_start + end_fence].trim();
            collect_tool_calls_from_text(block, &mut calls);
            search_pos = content_start + end_fence + 3;
        } else {
            // Unclosed code block (e.g. truncated generation)
            let block = response[content_start..].trim();
            collect_tool_calls_from_text(block, &mut calls);
            break;
        }
    }
    if !calls.is_empty() {
        return calls;
    }

    // 3. Extract from <tool_call>...</tool_call> or <toolcall>...</toolcall>
    for tag in &["tool_call", "toolcall", "function_call"] {
        let open_tag = format!("<{tag}>");
        let close_tag = format!("</{tag}>");
        let mut pos = 0;
        while let Some(start) = response[pos..].find(&open_tag) {
            let content_start = pos + start + open_tag.len();
            if let Some(end) = response[content_start..].find(&close_tag) {
                let block = response[content_start..content_start + end].trim();
                collect_tool_calls_from_text(block, &mut calls);
                pos = content_start + end + close_tag.len();
            } else {
                let block = response[content_start..].trim();
                collect_tool_calls_from_text(block, &mut calls);
                break;
            }
        }
    }

    calls
}

/// Run a typed tool-use iteration. A mutation invalidates prior verification;
/// the loop cannot complete until a fresh gate passes or is explicitly unavailable.
///
/// `prior` is the session transcript that preceded the current prompt — the
/// model reads it back so multi-turn (and resumed) conversations keep their
/// context, exactly like 2026-era harness transcripts.
#[allow(clippy::too_many_arguments)]
async fn run_tool_use_iteration(
    client: &LlmRouter,
    state: &mut AgentState,
    model: &str,
    prompt: &str,
    tools: &[crate::llm::client::ToolDef],
    hooks: &AgentHooks,
    prior: &[(String, String)],
    force_required_first: bool,
) -> Result<ToolLoopOutcome> {
    let project_ctx = CoderPrompt::load_project_context(&state.config.workspace_dir);
    let system_prompt = CoderPrompt::with_context(&project_ctx);
    let mut conversation: Vec<crate::json::Value> =
        vec![crate::json!({"role": "system", "content": system_prompt})];
    for (role, content) in prior {
        match role.as_str() {
            "user" => conversation.push(crate::json!({"role": "user", "content": content})),
            "assistant" => {
                conversation.push(crate::json!({"role": "assistant", "content": content}))
            }
            "system" => {
                conversation.push(crate::json!({"role": "system", "content": content}))
            }
            // Diagnostic-only roles (Error, Tool, …) never reach the model.
            _ => {}
        }
    }
    conversation.push(crate::json!({"role": "user", "content": prompt}));
    let mut used_tools = false;

    for iteration in 0..state.config.max_tool_iterations {
        hooks.reset_reasoning();
        if hooks.interrupted() {
            let _ = state.refresh_workspace_diff();
            let summary = finalize_transaction(state, hooks, false);
            if !summary.is_empty() {
                hooks.note(summary.trim());
            }
            return Ok(ToolLoopOutcome::Interrupted);
        }
        let tool_choice = if (iteration == 0 && force_required_first)
            || (state.dirty && state.verification.is_none())
        {
            // A mutation is pending verification: require a tool call so the
            // model cannot answer before running the gate. Repair rounds also
            // force the first call — small models answer cold repair prompts
            // in prose unless tool emission is mandatory.
            crate::llm::client::ToolChoice::Required
        } else {
            crate::llm::client::ToolChoice::Auto
        };
        let tool_list = tools.to_vec();
        let mut stream_token = |token: &str| hooks.text_delta(token);
        let mut stream_reasoning = |token: &str| hooks.reasoning_delta(token);
        let mut stream_tool_delta = |index: usize, name: Option<&str>, args_delta: &str| {
            hooks.emit(AgentEvent::ToolCallDelta {
                id: format!("call_{index}"),
                index,
                name: name.map(str::to_string),
                args_delta: args_delta.to_string(),
            });
        };
        let completion = crate::select! {
            res = client.chat_meta_stream_with_fallback(
                model,
                conversation.clone(),
                Some(&tool_list),
                Some(&tool_choice),
                None,
                &mut stream_token,
                Some(&mut stream_reasoning),
                Some(&mut stream_tool_delta),
            ) => match res {
                Ok(c) => c,
                Err(e) => {
                    let message = format!("{e}");
                    hooks.warn(&format!("  [llm error] {message}"));
                    return Err(e);
                }
            },
            _ = async {
                loop {
                    if hooks.interrupted() {
                        break;
                    }
                    crate::async_rt::time::sleep(std::time::Duration::from_millis(15)).await;
                }
            } => {
                let _ = state.refresh_workspace_diff();
                let summary = finalize_transaction(state, hooks, false);
                if !summary.is_empty() {
                    hooks.note(summary.trim());
                }
                return Ok(ToolLoopOutcome::Interrupted);
            }
        };
        if let Some(usage) = &completion.usage {
            let cost = client.estimate_cost(model, usage.prompt_tokens, usage.completion_tokens);
            state.turn_cost_usd += cost.total();
            let line = if cost.total() > 0.0 {
                format!(
                    "  [usage] {} prompt + {} completion = {} total tokens (${:.4})",
                    usage.prompt_tokens,
                    usage.completion_tokens,
                    usage.total_tokens,
                    cost.total()
                )
            } else {
                format!(
                    "  [usage] {} prompt + {} completion = {} total tokens",
                    usage.prompt_tokens, usage.completion_tokens, usage.total_tokens
                )
            };
            hooks.note(&line);
            hooks.emit(AgentEvent::TokenUsage {
                prompt_tokens: usage.prompt_tokens,
                completion_tokens: usage.completion_tokens,
                reasoning_tokens: usage.reasoning_tokens,
                total_tokens: usage.total_tokens,
            });
        }
        let response = completion.content;
        let mut tool_calls = completion.tool_calls;

        // Fallback extraction for models/providers that serialize tool calls into
        // assistant content (e.g. JSON in markdown code blocks or tags).
        if tool_calls.is_empty() {
            tool_calls = extract_tool_calls_from_content(&response);
        }
        for (index, call) in tool_calls.iter_mut().enumerate() {
            if call.id.is_empty() {
                call.id = format!("call_{}_{}", iteration + 1, index + 1);
            }
        }

        if !tool_calls.is_empty() {
            used_tools = true;
            hooks.note(&format!(
                "  [tools] iteration {}: {} call(s)",
                iteration + 1,
                tool_calls.len()
            ));
            let tool_call_values = tool_calls.iter().map(|call| crate::json::Serialize::to_json(call)).collect::<Vec<_>>();
            conversation.push(crate::json_expr!({
                "role": "assistant",
                "content": if response.trim().is_empty() { crate::json::Value::Null } else { crate::json::Value::String(response.clone()) },
                "tool_calls": tool_call_values,
            }));
            let results = execute_tool_calls(client, state, &tool_calls, hooks);
            for (tc, result) in tool_calls.iter().zip(results) {
                let mut summary =
                    truncate_tool_output(&result.output, state.config.max_tool_output_bytes);
                if result.timed_out {
                    summary.push_str(" [timed out]");
                } else if let Some(code) = result.exit_code {
                    summary.push_str(&format!(" [exit {code}]"));
                }
                hooks.tool_call(&tc.id, &tc.function.name, &summary);
                hooks.tool_result(
                    &tc.id,
                    &tc.function.name,
                    &summary,
                    result.exit_code,
                    result.timed_out,
                    result.duration_ms,
                );
                if result.mutated {
                    if let Some(path) = &result.changed_file {
                        hooks.file_changed(path);
                    }
                }
                if let Some(verification) = &result.verification {
                    hooks.verification(verification);
                }
                conversation.push(crate::json!({
                    "role": "tool",
                    "tool_call_id": tc.id.clone(),
                    "content": result.output,
                }));
            }
            continue;
        }

        if matches!(
            completion.finish_reason.as_deref(),
            Some("length") | Some("tool_calls") | Some("max_tokens")
        ) {
            if !response.trim().is_empty() {
                conversation.push(crate::json!({"role": "assistant", "content": response}));
            }
            continue;
        }

        if !used_tools {
            // Keep the raw reply visible: a silent NoTools is undiagnosable.
            let preview: String = response.chars().take(300).collect();
            if !preview.trim().is_empty() {
                hooks.warn(&format!("  [no-tools] raw reply: {preview}"));
            }
            return Ok(ToolLoopOutcome::NoTools);
        }

        // Recompute the real workspace delta before deciding anything: the
        // filesystem, not the model's narration, defines whether we mutated.
        if let Err(error) = state.refresh_workspace_diff() {
            hooks.warn(&format!("  [transaction] diff unavailable: {error}"));
        }

        if state.dirty && state.verification.is_none() {
            let gate = automatic_verification(state);
            state.record_verification(gate.clone());
            hooks.verification(&gate);
        }

        match verification_action(state) {
            VerificationAction::Repair => {
                state.repair_attempt += 1;
                let gate = state.verification.clone().expect("failed gate exists");
                let diags = test::extract_diagnostics(&gate.output);
                let feedback = test::format_scoped_repair_prompt(&diags, None, &gate.output);
                let oracle_directive = state
                    .task_spec
                    .as_ref()
                    .map(|spec| spec.oracle_repair_directive())
                    .unwrap_or_default();
                conversation.push(crate::json!({
                    "role": "user",
                    "content": format!(
                        "Verification failed (repair {}/{}). Fix the implementation without weakening tests, then run verification again.\nCommand: {}\n\n{}{}",
                        state.repair_attempt,
                        state.config.max_retries,
                        gate.command.as_deref().unwrap_or("unknown"),
                        feedback,
                        oracle_directive
                    )
                }));
                continue;
            }
            VerificationAction::Fail => {
                let gate = state.verification.clone().expect("failed gate exists");
                let mut message = format!(
                    "Verification failed{}:\n{}",
                    gate.command
                        .as_deref()
                        .map(|command| format!(" (`{command}`)"))
                        .unwrap_or_default(),
                    truncate_tool_output(&gate.output, FIX_FEEDBACK_CAP)
                );
                message.push_str(&finalize_transaction(state, hooks, false));
                return Ok(ToolLoopOutcome::Failed(message));
            }
            VerificationAction::Complete => {}
        }

        if let Err(error) = completion_gate(state, hooks) {
            let mut message = error;
            message.push_str(&finalize_transaction(state, hooks, false));
            return Ok(ToolLoopOutcome::Failed(message));
        }
        let mut final_text = audited_final_text(state, &response);
        let diff_note = finalize_transaction(state, hooks, true);
        if let Some(concerns) = run_adversarial_review(client, state, &diff_note).await {
            hooks.note(&format!("[adversarial review] {concerns}"));
            final_text.push_str("\n\nAdversarial review notes:\n");
            final_text.push_str(&concerns);
        }
        final_text.push_str(&diff_note);
        return Ok(ToolLoopOutcome::Completed(final_text));
    }

    let mut message = if state.verification_failed() {
        "Maximum tool iterations reached with verification still failing.".to_string()
    } else {
        "Maximum tool iterations reached before a final response.".to_string()
    };
    let _ = state.refresh_workspace_diff();
    message.push_str(&finalize_transaction(state, hooks, false));
    Ok(ToolLoopOutcome::Failed(message))
}

fn audited_final_text(state: &AgentState, response: &str) -> String {
    let mut final_text = if response.trim().is_empty() {
        "Tool calls completed.".to_string()
    } else {
        response.trim().to_string()
    };
    if !state.blocked_actions.is_empty() {
        final_text.push_str(&format!(
            "\n\nBlocked by approval policy:\n- {}",
            state.blocked_actions.join("\n- ")
        ));
    }
    let lower = final_text.to_lowercase();
    let mentions_all_files = !state.changed_files.is_empty()
        && state
            .changed_files
            .iter()
            .all(|path| final_text.contains(path));
    if !state.changed_files.is_empty() && !mentions_all_files {
        final_text.push_str("\n\nChanged files: ");
        final_text.push_str(
            &state
                .changed_files
                .iter()
                .cloned()
                .collect::<Vec<_>>()
                .join(", "),
        );
    }
    if let Some(verification) = &state.verification {
        let status = match verification.status {
            VerificationStatus::Passed => "passed",
            VerificationStatus::Failed => "failed",
            VerificationStatus::Unavailable => "unavailable",
        };
        let already_reported = lower.contains("verification")
            && (lower.contains(status)
                || (verification.status == VerificationStatus::Passed
                    && lower.contains("tests pass")));
        if !already_reported || verification.status == VerificationStatus::Unavailable {
            final_text.push_str(&format!(
                "\nVerification: {status} ({})",
                verification
                    .command
                    .as_deref()
                    .unwrap_or("no detected runner")
            ));
            if verification.status == VerificationStatus::Unavailable {
                final_text.push_str(&format!(" — {}", verification.output));
            }
        }
    }
    if state.turn_cost_usd > 0.0 {
        final_text.push_str(&format!("\nEstimated cost: ${:.4}", state.turn_cost_usd));
    }
    let pending: Vec<&str> = state
        .todos
        .iter()
        .filter(|item| !item.done)
        .map(|item| item.text.as_str())
        .collect();
    if !pending.is_empty() {
        final_text.push_str(&format!("\nOpen todos:\n- {}", pending.join("\n- ")));
    }
    final_text
}

/// Effect class for a tool, used by the scheduler and the approval gate.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ToolEffect {
    ReadOnly,
    Mutation,
    Command,
}

fn tool_effect(name: &str) -> ToolEffect {
    match name {
        "read_file" | "list_tree" | "search_code" | "symbol_search" | "git_status" | "git_diff" => {
            ToolEffect::ReadOnly
        }
        "write_file" | "replace_exact" | "edit_file" | "multi_edit_file" => ToolEffect::Mutation,
        _ => ToolEffect::Command,
    }
}

fn connect_mcp_clients(state: &mut AgentState, hooks: &AgentHooks) {
    let configs = state.config.mcp_servers.clone();
    for config in configs {
        match crate::mcp::McpClient::connect(&config) {
            Ok(client) => state.mcp_clients.push(client),
            Err(err) => hooks.warn(&format!(
                "[mcp] failed to connect to {}: {err}",
                config.command
            )),
        }
    }
}

fn try_mcp_tool(
    state: &mut AgentState,
    tc: &crate::llm::client::ToolCall,
    hooks: &AgentHooks,
) -> Option<ToolExecutionResult> {
    let args = tool_arguments(tc).ok()?;
    let name = &tc.function.name;
    if !state.mcp_clients.iter().any(|client| client.has_tool(name)) {
        return None;
    }
    if let Err(message) = hooks.require_approval(
        state.config.command_tool_policy,
        name,
        "external MCP tool call",
        "may mutate files or run commands outside this workspace",
    ) {
        state.record_blocked_action(format!("{name}: {message}"));
        return Some(ToolExecutionResult::output(message));
    }
    for client in &mut state.mcp_clients {
        if let Ok(result) = client.call_tool(name, &args) {
            return Some(ToolExecutionResult {
                output: truncate_tool_output(&result, state.config.max_tool_output_bytes),
                mutated: false,
                changed_file: None,
                verification: None,
                exit_code: None,
                timed_out: false,
                duration_ms: 0,
            });
        }
    }
    None
}

/// Owned, `Send + Sync` view of the workspace used to run read-only tools

/// concurrently without sharing `AgentState` (which holds a SQLite handle).
struct ReadContext {
    files: crate::tools::fs::FileTools,
    git: crate::tools::git::GitTools,
    workspace: std::path::PathBuf,
    cap: usize,
}

fn read_context(state: &AgentState) -> ReadContext {
    ReadContext {
        files: crate::tools::fs::FileTools::new(state.config.workspace_dir.clone()),
        git: crate::tools::git::GitTools::new(
            state.config.workspace_dir.to_string_lossy().to_string(),
        ),
        workspace: state.config.workspace_dir.clone(),
        cap: state.config.max_tool_output_bytes,
    }
}

/// Execute a batch of tool calls: independent read-only calls run in parallel
/// (bounded fan-out), while mutations and commands stay strictly sequential.
/// Results are always returned in the model's original call order.
fn execute_tool_calls(
    client: &LlmRouter,
    state: &mut AgentState,
    tool_calls: &[crate::llm::client::ToolCall],
    hooks: &AgentHooks,
) -> Vec<ToolExecutionResult> {
    let max_parallel = state.config.max_parallel_tools.max(1);
    let mut results: Vec<Option<ToolExecutionResult>> =
        (0..tool_calls.len()).map(|_| None).collect();
    let mut index = 0;

    while index < tool_calls.len() {
        if tool_effect(&tool_calls[index].function.name) != ToolEffect::ReadOnly {
            let started = Instant::now();
            let mut result = execute_tool(client, state, &tool_calls[index], hooks);
            result.duration_ms = started.elapsed().as_millis().min(u64::MAX as u128) as u64;
            results[index] = Some(result);
            index += 1;
            continue;
        }
        let mut group = Vec::new();
        while index < tool_calls.len()
            && tool_effect(&tool_calls[index].function.name) == ToolEffect::ReadOnly
            && group.len() < max_parallel
        {
            group.push(index);
            index += 1;
        }
        let context = read_context(state);
        if group.len() == 1 {
            results[group[0]] = Some(execute_read_only(&context, &tool_calls[group[0]]));
            continue;
        }
        std::thread::scope(|scope| {
            let handles: Vec<_> = group
                .iter()
                .map(|&position| {
                    let context = &context;
                    let call = &tool_calls[position];
                    scope.spawn(move || execute_read_only(context, call))
                })
                .collect();
            for (&position, handle) in group.iter().zip(handles) {
                results[position] =
                    Some(handle.join().unwrap_or_else(|_| {
                        ToolExecutionResult::output("read-only tool panicked")
                    }));
            }
        });
    }

    results
        .into_iter()
        .map(|result| {
            result.unwrap_or_else(|| ToolExecutionResult::output("tool was not executed"))
        })
        .collect()
}

fn tool_arguments(tc: &crate::llm::client::ToolCall) -> Result<crate::json::Value, String> {
    let args_str = tc.function.arguments.trim();
    if args_str.is_empty() || args_str == "{}" {
        return Ok(crate::json!({}));
    }
    let cleaned = if let Some(stripped) = args_str.strip_prefix("```json") {
        stripped.trim_end_matches("```").trim()
    } else if let Some(stripped) = args_str.strip_prefix("```") {
        stripped.trim_end_matches("```").trim()
    } else {
        args_str
    };
    if let Ok(v) = crate::json::from_str(cleaned) {
        return Ok(v);
    }
    if let Some(start) = cleaned.find('{') {
        if let Ok(v) = crate::json::from_str(&cleaned[start..]) {
            return Ok(v);
        }
    }
    Err(format!("invalid JSON arguments: {cleaned}"))
}

fn execute_read_only(
    context: &ReadContext,
    tc: &crate::llm::client::ToolCall,
) -> ToolExecutionResult {
    let args = match tool_arguments(tc) {
        Ok(args) => args,
        Err(message) => return ToolExecutionResult::output(message),
    };
    let string_arg = |name: &str| args.get(name).and_then(|value| value.as_str());
    let usize_arg = |name: &str| {
        args.get(name)
            .and_then(|value| value.as_u64())
            .and_then(|value| usize::try_from(value).ok())
    };
    let cap = context.cap;

    match tc.function.name.as_str() {
        "read_file" => match string_arg("path") {
            Some(path) => {
                let content = match (usize_arg("start_line"), usize_arg("end_line")) {
                    (Some(start), Some(end)) => context.files.read_file_range(path, start, end),
                    (Some(start), None) => context.files.read_file_range(path, start, start + 199),
                    _ => context.files.read_file(path).ok_or_else(|| {
                        crate::error::anyhow!("file not found or path is outside workspace")
                    }),
                };
                ToolExecutionResult::output(
                    content
                        .map(|value| truncate_tool_output(&value, cap))
                        .unwrap_or_else(|error| error.to_string()),
                )
            }
            None => ToolExecutionResult::output("missing required argument: path"),
        },
        "list_tree" => {
            let path = string_arg("path").unwrap_or("");
            let depth = usize_arg("depth").unwrap_or(3).min(8);
            let max_entries = usize_arg("max_entries").unwrap_or(200).min(2_000);
            ToolExecutionResult::output(
                context
                    .files
                    .list_tree(path, depth, max_entries)
                    .unwrap_or_else(|error| error.to_string()),
            )
        }
        "search_code" => match string_arg("pattern") {
            Some(pattern) => ToolExecutionResult::output(truncate_tool_output(
                &search_in(&context.workspace, pattern),
                cap,
            )),
            None => ToolExecutionResult::output("missing required argument: pattern"),
        },
        "git_status" => {
            ToolExecutionResult::output(truncate_tool_output(&context.git.status(), cap))
        }
        "git_diff" => ToolExecutionResult::output(truncate_tool_output(
            &context.git.diff(
                string_arg("target")
                    .filter(|target| !target.is_empty())
                    .unwrap_or("HEAD"),
            ),
            cap,
        )),
        "symbol_search" => match string_arg("query") {
            Some(query) => {
                let limit = usize_arg("limit").unwrap_or(20).min(100);
                let index = crate::repo::scanner::SymbolIndex::build(&context.workspace);
                let results = index.search(query, limit);
                if results.is_empty() {
                    ToolExecutionResult::output(format!("No symbols found matching '{query}'"))
                } else {
                    let mut lines = Vec::new();
                    for s in results {
                        lines.push(format!("{}:{}: {} {}", s.file_path, s.line_number, s.symbol_type, s.name));
                    }
                    ToolExecutionResult::output(truncate_tool_output(&lines.join("\n"), cap))
                }
            }
            None => ToolExecutionResult::output("missing required argument: query"),
        },
        other => ToolExecutionResult::output(format!("{other} is not a read-only tool")),
    }
}

fn execute_tool(
    client: &LlmRouter,
    state: &mut AgentState,
    tc: &crate::llm::client::ToolCall,
    hooks: &AgentHooks,
) -> ToolExecutionResult {
    if tool_effect(&tc.function.name) == ToolEffect::ReadOnly {
        return execute_read_only(&read_context(state), tc);
    }
    let args = match tool_arguments(tc) {
        Ok(args) => args,
        Err(message) => return ToolExecutionResult::output(message),
    };
    let string_arg = |name: &str| args.get(name).and_then(|value| value.as_str());
    let cap = state.config.max_tool_output_bytes;

    match tc.function.name.as_str() {
        "write_file" | "replace_exact" | "edit_file" | "multi_edit_file" => {
            let Some(path) = string_arg("path") else {
                return ToolExecutionResult::output("missing required argument: path");
            };
            // v0.9.5 oracle lock: the model can never touch its own exam.
            // Spec-guard refusals are reported to the model but are NOT
            // blocked actions — verification stays the sole judge.
            if let Some(message) = state.locked_path_error(path) {
                return ToolExecutionResult::output(message);
            }
            if let Err(message) = hooks.require_approval(
                state.config.write_tool_policy,
                &tc.function.name,
                &format!("modify {path}"),
                "workspace mutation (revertible within this turn)",
            ) {
                state.record_blocked_action(format!("{} {path}: {message}", tc.function.name));
                return ToolExecutionResult::output(message);
            }
            let usize_arg = |name: &str| {
                args.get(name)
                    .and_then(|value| value.as_u64())
                    .and_then(|value| usize::try_from(value).ok())
            };
            let previous_content = state.files.read_file(path);
            let result = if tc.function.name == "write_file" {
                string_arg("content")
                    .ok_or_else(|| crate::error::anyhow!("missing required argument: content"))
                    .and_then(|content| state.files.write_file(path, content))
            } else if tc.function.name == "edit_file" {
                let start = usize_arg("start_line");
                let end = usize_arg("end_line");
                let old = string_arg("old_content");
                match string_arg("new_content") {
                    Some(new_content) => {
                        if start.is_none() && end.is_none() && old.is_none() {
                            state.files.write_file(path, new_content)
                        } else {
                            state.files.edit_file(path, start, end, old, new_content)
                        }
                    }
                    None => Err(crate::error::anyhow!("missing required argument: new_content")),
                }
            } else if tc.function.name == "multi_edit_file" {
                let parsed = || -> crate::error::Result<Vec<crate::tools::fs::MultiEdit>> {
                    let arr = args
                        .get("edits")
                        .and_then(|value| value.as_array())
                        .ok_or_else(|| crate::error::anyhow!("missing required argument: edits"))?;
                    let mut edits = Vec::with_capacity(arr.len());
                    for entry in arr {
                        let start_line = entry
                            .get("start_line")
                            .and_then(|v| v.as_u64())
                            .and_then(|v| usize::try_from(v).ok());
                        let end_line = entry
                            .get("end_line")
                            .and_then(|v| v.as_u64())
                            .and_then(|v| usize::try_from(v).ok());
                        let (Some(start_line), Some(end_line)) = (start_line, end_line) else {
                            crate::error::bail!("each edit requires integer start_line and end_line");
                        };
                        let old_content = entry
                            .get("old_content")
                            .and_then(|v| v.as_str())
                            .map(String::from);
                        let new_content = entry
                            .get("new_content")
                            .and_then(|v| v.as_str())
                            .ok_or_else(|| crate::error::anyhow!("each edit requires new_content"))?
                            .to_string();
                        edits.push(crate::tools::fs::MultiEdit {
                            start_line,
                            end_line,
                            old_content,
                            new_content,
                        });
                    }
                    Ok(edits)
                };
                parsed().and_then(|edits| state.files.multi_edit_file(path, &edits))
            } else {
                match (string_arg("old"), string_arg("new")) {
                    (Some(old), Some(new)) => state.files.replace_exact(path, old, new),
                    _ => Err(crate::error::anyhow!("missing required arguments: old, new")),
                }
            };
            match result {
                Ok(()) => {
                    if let Some(updated) = state.files.read_file(path) {
                        if let Some(spec) = &state.task_spec {
                            if let Err(rejection) = spec.check_patch(&updated, path) {
                                if let Some(old_c) = &previous_content {
                                    let _ = state.files.write_file(path, old_c);
                                } else if let Some(target) = state.files.resolve(path) {
                                    let _ = std::fs::remove_file(target);
                                }
                                return ToolExecutionResult::output(format!(
                                    "Specification-Locked gate rejected mutation to {path}:\n{rejection}\n\nPreserve the exact required signature."
                                ));
                            }
                        }
                    }
                    state.session.add_file(path);
                    state.mark_changed(path);
                    ToolExecutionResult {
                        output: format!("changed {path}"),
                        mutated: true,
                        changed_file: Some(path.to_string()),
                        verification: None,
                        exit_code: None,
                        timed_out: false,
                        duration_ms: 0,
                    }
                }
                Err(error) => ToolExecutionResult::output(format!("change failed: {error}")),
            }
        }
        "run_command" => match string_arg("command") {
            Some(command) => {
                if let Err(message) = hooks.require_approval(
                    state.config.command_tool_policy,
                    "run_command",
                    command,
                    "runs an allowlisted process in the workspace",
                ) {
                    state.record_blocked_action(format!("run_command {command}: {message}"));
                    return ToolExecutionResult::output(message);
                }
                if is_verification_command(command) {
                    let verification = test::run_verification_command(command, &state.config);
                    state.record_verification(verification.clone());
                    ToolExecutionResult {
                        output: truncate_tool_output(&verification.output, cap),
                        mutated: false,
                        changed_file: None,
                        exit_code: verification.exit_code,
                        timed_out: verification.timed_out,
                        verification: Some(verification),
                        duration_ms: 0,
                    }
                } else {
                    let output = shell::run_command_raw_with_interrupt(
                        command,
                        &state.config,
                        hooks.interrupt.as_deref(),
                    );
                    ToolExecutionResult {
                        output: truncate_tool_output(&output.combined(), cap),
                        mutated: false,
                        changed_file: None,
                        verification: None,
                        exit_code: output.code,
                        timed_out: output.timed_out,
                        duration_ms: 0,
                    }
                }
            }
            None => ToolExecutionResult::output("missing required argument: command"),
        },
        "run_tests" => {
            if let Err(message) = hooks.require_approval(
                state.config.command_tool_policy,
                "run_tests",
                string_arg("command").unwrap_or("auto-detected test runner"),
                "runs the project test suite",
            ) {
                state.record_blocked_action(format!("run_tests: {message}"));
                return ToolExecutionResult::output(message);
            }
            let verification = test::run_tests(string_arg("command").unwrap_or(""), &state.config);
            state.record_verification(verification.clone());
            ToolExecutionResult {
                output: truncate_tool_output(&verification.output, cap),
                mutated: false,
                changed_file: None,
                exit_code: verification.exit_code,
                timed_out: verification.timed_out,
                verification: Some(verification),
                duration_ms: 0,
            }
        }
        "http_fetch" => match string_arg("url") {
            Some(url) => {
                if let Err(message) = hooks.require_approval(
                    state.config.command_tool_policy,
                    "http_fetch",
                    url,
                    "fetches a URL over the network",
                ) {
                    state.record_blocked_action(format!("http_fetch {url}: {message}"));
                    return ToolExecutionResult::output(message);
                }
                let max_bytes = args
                    .get("max_bytes")
                    .and_then(|value| value.as_u64())
                    .map(|value| value as usize)
                    .unwrap_or(state.config.max_tool_output_bytes);
                let timeout = args
                    .get("timeout_secs")
                    .and_then(|value| value.as_u64())
                    .unwrap_or(30);
                match crate::tools::web::http_fetch(url, max_bytes, timeout) {
                    Ok(text) => ToolExecutionResult::output(truncate_tool_output(&text, cap)),
                    Err(error) => ToolExecutionResult::output(format!("fetch failed: {error}")),
                }
            }
            None => ToolExecutionResult::output("missing required argument: url"),
        },
        "web_search" => match string_arg("query") {
            Some(query) => {
                if let Err(message) = hooks.require_approval(
                    state.config.command_tool_policy,
                    "web_search",
                    query,
                    "searches the web (SearXNG or DuckDuckGo)",
                ) {
                    state.record_blocked_action(format!("web_search {query}: {message}"));
                    return ToolExecutionResult::output(message);
                }
                let max_results = args
                    .get("max_results")
                    .and_then(|value| value.as_u64())
                    .map(|value| value as usize)
                    .unwrap_or(8);
                let timeout = args
                    .get("timeout_secs")
                    .and_then(|value| value.as_u64())
                    .unwrap_or(30);
                match crate::tools::web::web_search(query, max_results, timeout) {
                    Ok(text) => ToolExecutionResult::output(truncate_tool_output(&text, cap)),
                    Err(error) => ToolExecutionResult::output(format!("search failed: {error}")),
                }
            }
            None => ToolExecutionResult::output("missing required argument: query"),
        },
        "todo" => {
            let op = string_arg("op").unwrap_or("list");
            let text = string_arg("text").unwrap_or("");
            let index = args
                .get("index")
                .and_then(|value| value.as_u64())
                .map(|value| value as usize);
            match op {
                "add" => {
                    if text.trim().is_empty() {
                        ToolExecutionResult::output("missing required argument: text")
                    } else {
                        let position = state.todos.len();
                        state.todos.push(TodoItem::new(text));
                        ToolExecutionResult::output(format!("todo {position}: {text}"))
                    }
                }
                "complete" | "remove" => {
                    let position = match index {
                        Some(i) => i.checked_sub(1),
                        None => state.todos.iter().position(|item| item.text == text),
                    };
                    match position {
                        Some(pos) if pos < state.todos.len() => {
                            if op == "complete" {
                                let done = state.todos[pos].text.clone();
                                state.todos[pos].done = true;
                                ToolExecutionResult::output(format!("completed todo: {done}"))
                            } else {
                                let removed = state.todos.remove(pos);
                                ToolExecutionResult::output(format!(
                                    "removed todo: {}",
                                    removed.text
                                ))
                            }
                        }
                        _ => ToolExecutionResult::output(
                            "todo not found (pass 1-based index or matching text)",
                        ),
                    }
                }
                "clear" => {
                    let count = state.todos.len();
                    state.todos.clear();
                    ToolExecutionResult::output(format!("cleared {count} todo(s)"))
                }
                _ => ToolExecutionResult::output(todos_display(&state.todos)),
            }
        }
        "memory_search" => {
            let Some(query) = string_arg("query") else {
                return ToolExecutionResult::output("missing required argument: query");
            };
            let k = args
                .get("k")
                .and_then(|value| value.as_u64())
                .map(|value| value as usize)
                .unwrap_or(5);
            use crate::llm::embedder::EmbedKind;
            match state.embedder.embed(query, EmbedKind::Query) {
                Err(error) => {
                    ToolExecutionResult::output(format!("embedding unavailable: {error}"))
                }
                Ok(embedding) => match state.long_memory.search_vectors(&embedding, k) {
                    Err(error) => {
                        ToolExecutionResult::output(format!("memory search failed: {error}"))
                    }
                    Ok(hits) if hits.is_empty() => {
                        ToolExecutionResult::output("No memory matches.")
                    }
                    Ok(hits) => {
                        let lines: Vec<String> = hits
                            .iter()
                            .enumerate()
                            .map(|(i, hit)| {
                                format!(
                                    "{}. [score {:.3}] {}\n   (source: {})",
                                    i + 1,
                                    hit.score,
                                    hit.text,
                                    hit.source
                                )
                            })
                            .collect();
                        ToolExecutionResult::output(lines.join("\n\n"))
                    }
                },
            }
        }
        "list_skills" => {
            let skills = state.skills.list();
            if skills.is_empty() {
                ToolExecutionResult::output(
                    "No skills found. Add Markdown files to ./skills or ~/.chronokairo/skills.",
                )
            } else {
                let body: Vec<String> = skills
                    .iter()
                    .enumerate()
                    .map(|(i, skill)| format!("{}. {}", i + 1, skill.summary()))
                    .collect();
                ToolExecutionResult::output(body.join("\n"))
            }
        }
        "load_skill" => {
            let Some(name) = string_arg("name") else {
                return ToolExecutionResult::output("missing required argument: name");
            };
            match state.skills.get(&name) {
                Some(skill) => ToolExecutionResult::output(format!(
                    "# Skill: {}\n\n{}",
                    skill.name, skill.body
                )),
                None => ToolExecutionResult::output(format!(
                    "skill '{name}' not found. Call list_skills to see available skills."
                )),
            }
        }
        "spawn_background" => {
            let Some(command) = string_arg("command") else {
                return ToolExecutionResult::output("missing required argument: command");
            };
            match state.background.spawn(command, &state.config) {
                Ok(id) => ToolExecutionResult::output(format!(
                    "Background task {id} started: `{command}`. Poll with background_status."
                )),
                Err(error) => ToolExecutionResult::output(format!("spawn failed: {error}")),
            }
        }
        "background_status" => {
            let Some(id) = string_arg("id") else {
                return ToolExecutionResult::output("missing required argument: id");
            };
            match state.background.status(&id) {
                Some((status, output, elapsed)) => {
                    let label = match status {
                        TaskStatus::Running => "running".to_string(),
                        TaskStatus::Done {
                            exit_code,
                            timed_out,
                        } => match (exit_code, timed_out) {
                            (Some(code), false) => format!("done (exit {code})"),
                            (None, true) => "done (timed out)".to_string(),
                            _ => "done".to_string(),
                        },
                    };
                    ToolExecutionResult::output(format!(
                        "[{id}] {label} (elapsed {:.1}s)\n{output}",
                        elapsed.as_secs_f64()
                    ))
                }
                None => ToolExecutionResult::output(format!("no background task with id {id}")),
            }
        }
        "list_background" => {
            let list = state.background.list();
            if list.is_empty() {
                ToolExecutionResult::output("No background tasks.")
            } else {
                let lines: Vec<String> = list
                    .iter()
                    .map(|(id, cmd, status)| format!("{id}  `{cmd}`  {status}"))
                    .collect();
                ToolExecutionResult::output(lines.join("\n"))
            }
        }
        "kill_background" => {
            let Some(id) = string_arg("id") else {
                return ToolExecutionResult::output("missing required argument: id");
            };
            if state.background.kill(&id) {
                ToolExecutionResult::output(format!("Background task {id} killed."))
            } else {
                ToolExecutionResult::output(format!("no background task with id {id}"))
            }
        }
        "symbol_search" => {
            let Some(query) = string_arg("query") else {
                return ToolExecutionResult::output("missing required argument: query");
            };
            let symbol_type = string_arg("symbol_type");
            let limit = args
                .get("limit")
                .and_then(|v| v.as_u64())
                .map(|v| v as usize)
                .unwrap_or(50);
            let index = crate::repo::SymbolIndex::build(&state.config.workspace_dir);
            let results = if let Some(st) = symbol_type {
                index
                    .all()
                    .iter()
                    .filter(|s| {
                        s.symbol_type == st && s.name.to_lowercase().contains(&query.to_lowercase())
                    })
                    .take(limit)
                    .collect()
            } else {
                index.search(&query, limit)
            };
            if results.is_empty() {
                ToolExecutionResult::output("No matching symbols.")
            } else {
                let lines: Vec<String> = results
                    .iter()
                    .map(|s| {
                        format!(
                            "{} {} {}:{}",
                            s.symbol_type, s.name, s.file_path, s.line_number
                        )
                    })
                    .collect();
                ToolExecutionResult::output(lines.join("\n"))
            }
        }
        "task" => {
            let model = string_arg("model")
                .unwrap_or(&state.config.coder_model)
                .to_string();
            // Accept either a single `task` string or a `tasks` array; the
            // array form fans out to N sub-agents that run concurrently and
            // report back together (C3 parallel sub-agents).
            let tasks: Vec<String> = if let Some(arr) = args.get("tasks").and_then(|v| v.as_array())
            {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .filter(|s| !s.trim().is_empty())
                    .collect()
            } else if let Some(single) = string_arg("task") {
                vec![single.to_string()]
            } else {
                return ToolExecutionResult::output(
                    "missing required argument: task (string) or tasks (array of strings)",
                );
            };
            if tasks.is_empty() {
                return ToolExecutionResult::output("no tasks provided");
            }
            let total = tasks.len();
            let (tx, rx) = mpsc::channel::<(usize, String, bool)>();
            let session_approvals = hooks.session_approvals.clone();
            for (idx, task) in tasks.into_iter().enumerate() {
                let tx = Arc::new(Mutex::new(Some(tx.clone())));
                let client = client.clone();
                let config = state.config.clone();
                let sub_approval = hooks.on_approval.clone();
                let session_approvals = session_approvals.clone();
                thread::spawn(move || {
                    let rt = match crate::async_rt::runtime::Runtime::new() {
                        Ok(rt) => rt,
                        Err(error) => {
                            if let Some(tx) = tx.lock().unwrap().take() {
                                let _ = tx.send((idx, format!("runtime error: {error}"), false));
                            }
                            return;
                        }
                    };
                    rt.block_on(async move {
                        let mut sub_state = match AgentState::new(config) {
                            Ok(mut s) => {
                                s.session_persist = false;
                                s
                            }
                            Err(error) => {
                                if let Some(tx) = tx.lock().unwrap().take() {
                                    let _ = tx.send((
                                        idx,
                                        format!("state init failed: {error}"),
                                        false,
                                    ));
                                }
                                return;
                            }
                        };
                        let _ = sub_state.start_turn();
                        sub_state.session.add_message("user", &task);
                        let entry_tx = tx.clone();
                        let sub_hooks = AgentHooks {
                            on_event: Some(Arc::new(move |event| match event {
                                AgentEvent::Done { message } => {
                                    if let Some(tx) = entry_tx.lock().unwrap().take() {
                                        let _ = tx.send((idx, message.clone(), true));
                                    }
                                }
                                AgentEvent::Failed { message } => {
                                    if let Some(tx) = entry_tx.lock().unwrap().take() {
                                        let _ = tx.send((idx, message.clone(), false));
                                    }
                                }
                                _ => {}
                            })),
                            on_tool_call_delta: None,
                            on_text_delta: None,
                            on_approval: sub_approval,
                            on_plan_approval: None,
                            interrupt: None,
                            session_approvals,
                        };
                        let _ = run_agent_loop_with_hooks(
                            &client,
                            &mut sub_state,
                            &task,
                            &sub_hooks,
                            AgentMode::Agent,
                        )
                        .await;
                        // Safety net: if the sub-agent never emitted Done/Failed,
                        // report completion from its last session state so the
                        // parent is never stuck waiting on `barrier`.
                        if let Some(tx) = tx.lock().unwrap().take() {
                            let _ = tx.send((idx, "(no result)".into(), true));
                        }
                    });
                });
            }
            // Gather one message per task, bounded by a 5-minute wall clock so
            // a stuck sub-agent cannot hang the parent turn.
            let model = model; // reused for the timed-out message
            let mut results: Vec<(usize, String, bool)> = Vec::with_capacity(total);
            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(300);
            while results.len() < total {
                let remaining = deadline.saturating_duration_since(std::time::Instant::now());
                match rx.recv_timeout(remaining) {
                    Ok(item) => results.push(item),
                    Err(_) => break,
                }
            }
            results.sort_by_key(|(idx, _, _)| *idx);
            let body: Vec<String> = results
                .iter()
                .enumerate()
                .map(|(pos, (_idx, msg, ok))| {
                    let status = if *ok { "ok" } else { "failed" };
                    format!("[task {}/{}]: ({status}) {msg}", pos + 1, total)
                })
                .collect();
            ToolExecutionResult::output(if body.is_empty() {
                format!("[task:{model}] timed out")
            } else {
                body.join("\n\n")
            })
        }
        _ => {
            if let Some(result) = try_mcp_tool(state, tc, hooks) {
                result
            } else {
                ToolExecutionResult::output(format!("Unknown tool: {}", tc.function.name))
            }
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
enum VerificationAction {
    Complete,
    Repair,
    Fail,
}

fn verification_action(state: &AgentState) -> VerificationAction {
    if !state.verification_failed() {
        VerificationAction::Complete
    } else if state.dirty && state.repair_attempt < state.config.max_retries {
        VerificationAction::Repair
    } else {
        VerificationAction::Fail
    }
}

/// The final safety boundary for autonomous completion. A model response is
/// not evidence of success: mutated work must have a passed verification
/// result, and every refused action must remain visible as a failed turn.
fn completion_gate(state: &AgentState, hooks: &AgentHooks) -> Result<(), String> {
    if !state.blocked_actions.is_empty() {
        let evidence = format!(
            "{} action(s) blocked: {}",
            state.blocked_actions.len(),
            state.blocked_actions.join("; ")
        );
        hooks.completion_audit(false, &evidence);
        return Err(format!("Task incomplete: {evidence}"));
    }

    if state.dirty {
        match state.verification.as_ref() {
            Some(result) if result.passed() => {
                let command = result.command.as_deref().unwrap_or("verification gate");
                let evidence = format!(
                    "workspace changed ({} file(s)); passed: {command}",
                    state.changed_files.len()
                );
                hooks.completion_audit(true, &evidence);
                Ok(())
            }
            Some(result) => {
                let evidence = format!(
                    "workspace changed but verification is {:?}: {}",
                    result.status,
                    truncate_tool_output(&result.output, 320)
                );
                hooks.completion_audit(false, &evidence);
                Err(format!("Task cannot be marked complete: {evidence}"))
            }
            None => {
                let evidence = "workspace changed without a verification result".to_string();
                hooks.completion_audit(false, &evidence);
                Err(format!("Task cannot be marked complete: {evidence}"))
            }
        }
    } else {
        let evidence = "no unverified workspace changes; no blocked actions";
        hooks.completion_audit(true, evidence);
        Ok(())
    }
}

fn todos_display(todos: &[TodoItem]) -> String {
    if todos.is_empty() {
        return "No todos yet.".to_string();
    }
    todos
        .iter()
        .enumerate()
        .map(|(i, item)| {
            let mark = if item.done { "[x]" } else { "[ ]" };
            format!("{}. {} {}", i + 1, mark, item.text)
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn automatic_verification(state: &AgentState) -> VerificationResult {
    match state
        .config
        .command_tool_policy
        .denial_message("automatic verification")
    {
        Some(message) => VerificationResult::unavailable(message),
        None => {
            let base = test::run_tests("", &state.config);
            if !state.config.lint_on_mutation {
                return base;
            }
            if let Some(lint) = test::run_lint(&state.config) {
                if !lint.passed() {
                    return lint;
                }
            }
            base
        }
    }
}

/// Pure helper: build the prompt for the adversarial critique pass. Kept free
/// of I/O so it can be unit-tested.
fn build_adversarial_prompt(diff_summary: &str, changed_files: &str) -> String {
    format!(
        "You are an adversarial code reviewer. The following changes just passed the project's tests and lint gate.\n\
Critique them for regressions, security issues, weakened/removed tests, data loss or behavior changes not implied by the task.\n\
Be concise and concrete. If everything is fine, reply with exactly: OK\n\
\nChanged files:\n{changed_files}\n\nDiff summary:\n{diff_summary}\n\n\
Reply with a short bullet list of concerns, or OK if none."
    )
}

/// Run the adversarial critique pass. Returns the model's reply (which may be
/// `OK`) on success, or an explanatory message on failure. Only the concerns
/// when the reply is not a clean `OK` are surfaced into the audit.
async fn run_adversarial_review(
    client: &LlmRouter,
    state: &AgentState,
    diff_summary: &str,
) -> Option<String> {
    if !state.config.adversarial_verification {
        return None;
    }
    if state.changed_files.is_empty() {
        return None;
    }
    let changed_files = state
        .changed_files
        .iter()
        .cloned()
        .collect::<Vec<_>>()
        .join(", ");
    let prompt = build_adversarial_prompt(diff_summary, &changed_files);
    match client
        .generate_with_retry_with_fallback(&state.config.summarizer_model, &prompt, None, None)
        .await
    {
        Ok(reply) if reply.trim().eq_ignore_ascii_case("OK") => None,
        Ok(reply) => Some(reply.trim().to_string()),
        Err(error) => Some(format!("(adversarial review failed: {error})")),
    }
}

/// Close the turn's workspace transaction. On success the changes are kept and
/// summarized; on failure they are rolled back to the turn baseline (which
/// preserves any pre-existing local modifications) unless disabled.
fn finalize_transaction(state: &mut AgentState, hooks: &AgentHooks, succeeded: bool) -> String {
    if state.transaction.is_none() {
        return String::new();
    }
    if succeeded {
        let diff = match state.keep_changes() {
            Ok(diff) => diff,
            Err(error) => {
                hooks.warn(&format!("  [transaction] keep failed: {error}"));
                return String::new();
            }
        };
        if diff.is_empty() {
            return String::new();
        }
        hooks.transaction("keep", &diff.summary());
        let fingerprint = state
            .transaction
            .as_ref()
            .map(|t| t.fingerprint())
            .unwrap_or_default();
        if state.config.require_diff_summary {
            return format!(
                "\nWorkspace diff: {} (checksum: {}, baseline: {})",
                diff.summary(),
                diff.checksum(),
                fingerprint
            );
        }
        return format!(
            "\nWorkspace diff: {} (checksum: {})",
            diff.summary(),
            diff.checksum()
        );
    }

    if !state.config.rollback_on_failure {
        let summary = state
            .refresh_workspace_diff()
            .map(|diff| diff.summary())
            .unwrap_or_else(|_| "unavailable".to_string());
        hooks.transaction("kept-after-failure", &summary);
        return format!("\nWorkspace left modified (rollback disabled): {summary}");
    }

    match state.rollback_changes() {
        Ok(diff) if diff.is_empty() => String::new(),
        Ok(diff) => {
            hooks.transaction("rollback", &diff.summary());
            format!(
                "\nWorkspace rolled back to the pre-turn state: {}",
                diff.summary()
            )
        }
        Err(error) => {
            hooks.warn(&format!("  [transaction] rollback failed: {error}"));
            format!("\nWorkspace rollback failed: {error}")
        }
    }
}

fn is_verification_command(command: &str) -> bool {
    let command = command.trim();
    [
        "cargo test",
        "cargo check",
        "cargo clippy",
        "pytest",
        "python -m pytest",
        "npm test",
    ]
    .iter()
    .any(|prefix| command == *prefix || command.starts_with(&format!("{prefix} ")))
}

fn truncate_tool_output(value: &str, limit: usize) -> String {
    if value.len() <= limit {
        return value.to_string();
    }
    let mut end = limit.min(value.len());
    while end > 0 && !value.is_char_boundary(end) {
        end -= 1;
    }
    format!("{}\n...[truncated]", &value[..end])
}

fn search_in(workspace: &std::path::Path, pattern: &str) -> String {
    let normalized = crate::tools::fs::normalize_workspace_path(workspace);
    match std::process::Command::new("rg")
        .args(["-n", "--max-count", "20", pattern])
        .current_dir(&normalized)
        .output()
    {
        Ok(out) if out.status.success() => String::from_utf8_lossy(&out.stdout).to_string(),
        Ok(out) if out.status.code() == Some(1) => format!("No matches for: {pattern}"),
        Ok(out) => format!(
            "search failed: {}",
            String::from_utf8_lossy(&out.stderr).trim()
        ),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            search_workspace_without_rg(&normalized, pattern)
        }
        Err(error) => format!("search failed: {error}"),
    }
}

fn search_workspace_without_rg(root: &std::path::Path, pattern: &str) -> String {
    const MAX_MATCHES: usize = 20;
    const MAX_FILE_SIZE: u64 = 1_000_000;
    const SKIPPED_DIRS: &[&str] = &[".git", "target", "node_modules", "memory_data"];

    let pattern_lower = pattern.to_lowercase();
    let mut directories = vec![root.to_path_buf()];
    let mut matches = Vec::new();

    while let Some(directory) = directories.pop() {
        let Ok(entries) = std::fs::read_dir(directory) else {
            continue;
        };
        for entry in entries.flatten() {
            let Ok(file_type) = entry.file_type() else {
                continue;
            };
            let path = entry.path();
            if file_type.is_symlink() {
                continue;
            }
            if file_type.is_dir() {
                let name = entry.file_name();
                if !SKIPPED_DIRS.iter().any(|skip| name == *skip) {
                    directories.push(path);
                }
                continue;
            }
            if !file_type.is_file()
                || entry
                    .metadata()
                    .map(|meta| meta.len() > MAX_FILE_SIZE)
                    .unwrap_or(true)
            {
                continue;
            }
            let Ok(content) = std::fs::read_to_string(&path) else {
                continue;
            };
            for (line_index, line) in content.lines().enumerate() {
                if line.contains(pattern) || line.to_lowercase().contains(&pattern_lower) {
                    let relative = path.strip_prefix(root).unwrap_or(&path);
                    let rel_str = relative.display().to_string().replace('\\', "/");
                    matches.push(format!("{}:{}:{}", rel_str, line_index + 1, line));
                    if matches.len() == MAX_MATCHES {
                        return matches.join("\n");
                    }
                }
            }
        }
    }

    if matches.is_empty() {
        format!("No matches for: {pattern}")
    } else {
        matches.join("\n")
    }
}

fn coding_tools(state: &mut AgentState) -> Vec<crate::llm::client::ToolDef> {
    use crate::llm::client::{ToolDef, ToolFunction};
    let object = |properties, required| {
        let external = serde_json::json!({
            "type": "object",
            "properties": properties,
            "required": required,
            "additionalProperties": false
        });
        crate::json::from_str(&serde_json::to_string(&external).unwrap_or_default())
            .unwrap_or(crate::json::Value::Null)
    };
    let tool = |name: &str, description: &str, parameters| ToolDef {
        r#type: "function".into(),
        function: ToolFunction {
            name: name.into(),
            description: description.into(),
            parameters,
        },
    };
    let mut tools = vec![
        tool(
            "list_tree",
            "List a bounded workspace tree. Use before reading unfamiliar repositories.",
            object(
                serde_json::json!({
                    "path":{"type":"string"},
                    "depth":{"type":"integer","minimum":0,"maximum":8},
                    "max_entries":{"type":"integer","minimum":1,"maximum":2000}
                }),
                serde_json::json!([]),
            ),
        ),
        tool(
            "read_file",
            "Read a UTF-8 file, optionally using a 1-based inclusive line range.",
            object(
                serde_json::json!({
                    "path":{"type":"string"},
                    "start_line":{"type":"integer","minimum":1},
                    "end_line":{"type":"integer","minimum":1}
                }),
                serde_json::json!(["path"]),
            ),
        ),


        tool(
            "edit_file",
            "Surgically edit a line range in a file. Prefers 1-based start_line and end_line for precise anchoring.",
            object(
                serde_json::json!({
                    "path":{"type":"string"},
                    "start_line":{"type":"integer","minimum":1},
                    "end_line":{"type":"integer","minimum":1},
                    "old_content":{"type":"string"},
                    "new_content":{"type":"string"}
                }),
                serde_json::json!(["path", "new_content"]),
            ),
        ),
        tool(
            "multi_edit_file",
            "Apply several non-overlapping line-range edits to one file in a single call. Each edit uses 1-based start_line and end_line.",
            object(
                serde_json::json!({
                    "path":{"type":"string"},
                    "edits":{
                        "type":"array",
                        "items":{
                            "type":"object",
                            "properties":{
                                "start_line":{"type":"integer","minimum":1},
                                "end_line":{"type":"integer","minimum":1},
                                "old_content":{"type":"string"},
                                "new_content":{"type":"string"}
                            },
                            "required":["start_line","end_line","new_content"],
                            "additionalProperties":false
                        },
                        "minItems":1
                    }
                }),
                serde_json::json!(["path", "edits"]),
            ),
        ),
        tool(
            "replace_exact",
            "Atomically replace exactly one occurrence. Fails without changing the file on stale or ambiguous text.",
            object(
                serde_json::json!({
                    "path":{"type":"string"},
                    "old":{"type":"string"},
                    "new":{"type":"string"}
                }),
                serde_json::json!(["path", "old", "new"]),
            ),
        ),
        tool(
            "write_file",
            "Atomically create or deliberately replace a complete UTF-8 file.",
            object(
                serde_json::json!({"path":{"type":"string"},"content":{"type":"string"}}),
                serde_json::json!(["path", "content"]),
            ),
        ),
        tool(
            "search_code",
            "Search workspace text using a regex or literal pattern.",
            object(
                serde_json::json!({"pattern":{"type":"string"}}),
                serde_json::json!(["pattern"]),
            ),
        ),
        tool(
            "symbol_search",
            "Search workspace symbols (functions, structs, classes, etc.) by name. Returns symbol type, file, and line number. Use for finding definitions.",
            object(
                serde_json::json!({
                    "query": {"type":"string"},
                    "limit": {"type":"integer","minimum":1,"maximum":100}
                }),
                serde_json::json!(["query"]),
            ),
        ),
        tool(
            "git_status",
            "Show repository status without modifying it.",
            object(serde_json::json!({}), serde_json::json!([])),
        ),
        tool(
            "git_diff",
            "Show the working-tree diff, optionally against a target revision.",
            object(
                serde_json::json!({"target":{"type":"string"}}),
                serde_json::json!([]),
            ),
        ),
        tool(
            "run_tests",
            "Detect and run Cargo, Python/pytest, or Node/npm verification with a timeout.",
            object(
                serde_json::json!({"command":{"type":"string"}}),
                serde_json::json!([]),
            ),
        ),
        tool(
            "run_command",
            "Run one allowlisted executable directly, without a shell. Prefer run_tests for verification.",
            object(
                serde_json::json!({"command":{"type":"string"}}),
                serde_json::json!(["command"]),
            ),
        ),
        tool(
            "task",
            "Spawn one or more sub-agents to execute self-contained tasks in isolation. Pass `task` for a single task, or `tasks` (array of strings) to run several concurrently. Use for parallel research or independent edits that should not pollute the current session.",
            object(
                serde_json::json!({
                    "task": {"type": "string"},
                    "tasks": {"type": "array", "items": {"type": "string"}},
                    "model": {"type": "string"}
                }),
                serde_json::json!([]),
            ),
        ),
        tool(
            "http_fetch",
            "Fetch a URL (http/https) and return its text content. HTML pages are stripped to readable text. Use for documentation and reference material.",
            object(
                serde_json::json!({
                    "url": {"type": "string"},
                    "max_bytes": {"type": "integer","minimum":1,"maximum":1000000},
                    "timeout_secs": {"type": "integer","minimum":1,"maximum":120}
                }),
                serde_json::json!(["url"]),
            ),
        ),
        tool(
            "web_search",
            "Search the web without an API key (SearXNG if WEB_SEARCH_URL is set, else DuckDuckGo). Returns title, URL and snippet per result.",
            object(
                serde_json::json!({
                    "query": {"type": "string"},
                    "max_results": {"type": "integer","minimum":1,"maximum":20},
                    "timeout_secs": {"type": "integer","minimum":1,"maximum":120}
                }),
                serde_json::json!(["query"]),
            ),
        ),
        tool(
            "todo",
            "Manage the session task checklist. op: add (with text), complete (index or text), remove (index or text), clear, or list.",
            object(
                serde_json::json!({
                    "op": {"type":"string","enum":["add","complete","remove","clear","list"]},
                    "text": {"type":"string"},
                    "index": {"type":"integer","minimum":1}
                }),
                serde_json::json!([]),
            ),
        ),
        tool(
            "memory_search",
            "Semantic recall across past sessions and assistant outputs. Returns the most similar stored texts with scores. Requires the global embedding model (run `kaide --download-embedding-model` once; stored in ~/.chronokairo/models). The first call loads the model (may take a minute or two on CPU).",
            object(
                serde_json::json!({
                    "query": {"type":"string"},
                    "k": {"type":"integer","minimum":1,"maximum":50}
                }),
                serde_json::json!(["query"]),
            ),
        ),
        tool(
            "list_skills",
            "List available skill packs discovered in ./skills and ~/.chronokairo/skills. Each skill is a Markdown document of specialized instructions.",
            object(serde_json::json!({}), serde_json::json!([])),
        ),
        tool(
            "load_skill",
            "Load a skill pack by name and return its body so it can be applied to the current task. Use list_skills first to discover names.",
            object(
                serde_json::json!({
                    "name": {"type":"string"}
                }),
                serde_json::json!(["name"]),
            ),
        ),
        tool(
            "spawn_background",
            "Start a long-running command detached (build, watch, large test). Reuses the same allow/block policy as run_command. Returns a task id to poll later.",
            object(
                serde_json::json!({
                    "command": {"type":"string"}
                }),
                serde_json::json!(["command"]),
            ),
        ),
        tool(
            "background_status",
            "Poll a background task by id. Returns status (running/done), elapsed seconds and captured output so far.",
            object(
                serde_json::json!({
                    "id": {"type":"string"}
                }),
                serde_json::json!(["id"]),
            ),
        ),
        tool(
            "list_background",
            "List running and recently finished background tasks (id, command, status).",
            object(serde_json::json!({}), serde_json::json!([])),
        ),
        tool(
            "kill_background",
            "Stop a running background task by id.",
            object(
                serde_json::json!({
                    "id": {"type":"string"}
                }),
                serde_json::json!(["id"]),
            ),
        ),
        tool(
            "symbol_search",
            "Search workspace symbols (functions, types, classes) extracted from source files. Supports Rust, Python, JavaScript/TypeScript. Query matches symbol names; use symbol_type filter (e.g. 'fn', 'struct', 'def', 'class', 'function') to narrow.",
            object(
                serde_json::json!({
                    "query": {"type":"string"},
                    "symbol_type": {"type":"string"},
                    "limit": {"type":"integer","minimum":1,"maximum":100}
                }),
                serde_json::json!(["query"]),
            ),
        ),
    ];
    for client in &mut state.mcp_clients {
        if let Ok(mcp_tools) = client.list_tools() {
            tools.extend(mcp_tools);
        }
    }
    tools
}

pub async fn run_agent_loop(client: &LlmRouter, state: &mut AgentState, task: &str) {
    run_agent_loop_with_hooks(
        client,
        state,
        task,
        &AgentHooks::default(),
        AgentMode::Agent,
    )
    .await;
}

/// Agent loop with optional progress stream and interrupt support for the TUI.
pub async fn run_agent_loop_with_hooks(
    client: &LlmRouter,
    state: &mut AgentState,
    task: &str,
    hooks: &AgentHooks,
    mode: AgentMode,
) {
    if let Err(error) = state.start_turn() {
        hooks.failed(&format!("Could not snapshot the workspace: {error}"));
        return;
    }
    hooks.note(&format!("[Planning] {task}"));
    state.session.add_message("user", task);

    connect_mcp_clients(state, hooks);

    // v0.9.5 Specification-Locked Execution: compile the immutable task
    // specification ONCE from the raw user task. Planner, coder, repair and
    // verification all read this frozen copy for the rest of the turn.
    if state.config.spec_lock {
        let spec = std::sync::Arc::new(
            crate::repo::spec::compile_task_spec(client, state, task, hooks).await,
        );
        state.task_spec = Some(spec);
        hooks.note("  [spec] specification locked for this turn");
    }

    maybe_compact(client, state, hooks).await;

    if hooks.interrupted() {
        finalize_transaction(state, hooks, false);
        hooks.emit(AgentEvent::Interrupted);
        return;
    }

    match mode {
        AgentMode::Agent => run_agent_mode(client, state, task, hooks).await,
        AgentMode::Plan => run_planner_fallback(client, state, task, hooks, true).await,
    }
    // Persist the transcript at turn boundaries (append-only, crash-safe).
    if let Err(e) = state.persist_session() {
        hooks.warn(&format!("  [persist] session save failed: {e}"));
    }
}

/// Inline the current content of files implicated by the failing gate so the
/// repair model can emit a single edit without exploratory reads — small
/// models routinely answer cold repair prompts in prose instead of tools.
fn inline_failing_sources(state: &AgentState) -> String {
    const MAX_FILE_CHARS: usize = 3500;
    const MAX_TOTAL_CHARS: usize = 7000;
    let mut paths: Vec<String> = Vec::new();
    for line in state.last_test_output.lines() {
        let trimmed = line.trim_start();
        let Some(rest) = trimmed.strip_prefix("-->") else {
            continue;
        };
        let file = rest.split(':').next().unwrap_or("").trim();
        if file.is_empty() {
            continue;
        }
        let normalized = file.replace('\\', "/");
        if normalized.starts_with("tests/")
            || normalized.starts_with("target/")
            || paths.iter().any(|p| p == &normalized)
        {
            continue;
        }
        paths.push(normalized);
    }
    if paths.is_empty() {
        return String::new();
    }
    let mut out = String::from("\n\nCURRENT CONTENT OF THE FILES TO FIX (read-only snapshot; edit these, not the tests):\n");
    let mut total = 0usize;
    for path in paths.iter().take(3) {
        let Some(content) = state.files.read_file(path) else {
            continue;
        };
        if total >= MAX_TOTAL_CHARS {
            break;
        }
        let snippet: String = content.chars().take(MAX_FILE_CHARS).collect();
        total += snippet.len();
        out.push_str(&format!("\n--- {path} ---\n{snippet}\n"));
    }
    if total == 0 {
        return String::new();
    }
    out.push_str("\nApply your fix to the code above with edit_file or replace_exact, then verify with run_tests.\n");
    out
}

/// Agent mode: tool-use iteration first, planner fallback on failure.
async fn run_agent_mode(
    client: &LlmRouter,
    state: &mut AgentState,
    task: &str,
    hooks: &AgentHooks,
) {
    let tools = coding_tools(state);
    let model = state.config.coder_model.clone();
    let prior = state.session.conversation();
    match run_tool_use_iteration(client, state, &model, task, &tools, hooks, &prior, false).await {
        Ok(ToolLoopOutcome::Completed(final_text)) => {
            state.session.add_message("assistant", &final_text);
            state.session.add_action("tool-use turn completed");
            hooks.done(&final_text);
            return;
        }
        Ok(ToolLoopOutcome::Failed(message)) => {
            state.session.add_message("Error", &message);
            hooks.failed(&message);
            return;
        }
        Ok(ToolLoopOutcome::Interrupted) => {
            finalize_transaction(state, hooks, false);
            hooks.emit(AgentEvent::Interrupted);
            return;
        }
        Ok(ToolLoopOutcome::NoTools) => {
            state.session.add_message(
                "Error",
                "  [tools] model did not request tools; using planner fallback",
            );
        }
        Err(e) => {
            let err_msg = format!("API request failed on model '{model}': {e}\n  Tip: use /model auto to test and switch available models.");
            state.session.add_message("Error", &err_msg);
            hooks.failed(&err_msg);
            finalize_transaction(state, hooks, false);
            return;
        }
    }

    if hooks.interrupted() {
        finalize_transaction(state, hooks, false);
        hooks.emit(AgentEvent::Interrupted);
        return;
    }

    run_planner_fallback(client, state, task, hooks, false).await;
}

/// Shared planner fallback: generate a plan, execute steps, verify, and fix.
async fn run_planner_fallback(
    client: &LlmRouter,
    state: &mut AgentState,
    task: &str,
    hooks: &AgentHooks,
    require_plan_approval: bool,
) {
    let context = state.session.get_context();
    let repo_map = crate::repo::RepoMap::build(&state.config.workspace_dir);
    // The contract comes from the frozen per-turn spec, never from the
    // mutable session context.
    let contract_map = state
        .task_spec
        .as_ref()
        .map(|spec| spec.to_prompt_string())
        .unwrap_or_default();
    let enriched_context = format!("{}\n\n{}\n\n{}", repo_map.to_prompt_string(), contract_map, context);
    let fallback_plan = || crate::types::plan::Plan {
        steps: vec![crate::types::plan::PlanStep {
            step_type: "answer".into(),
            description: task.into(),
            filename: None,
            pattern: None,
            command: None,
        }],
    };
    let plan = planner::plan_task(client, &state.config.planner_model, task, &enriched_context)
        .await
        .unwrap_or_else(|e| {
            state.session.add_message(
                "Error",
                &format!("Planner error: {e}. Falling back to direct execution."),
            );
            fallback_plan()
        });

    let steps = plan.steps;
    hooks.note(&format!("  [plan] {} step(s)", steps.len()));
    if steps.is_empty() {
        finalize_transaction(state, hooks, true);
        hooks.done("Planner returned no steps.");
        return;
    }

    // Plan approval gate: in explicit Plan mode, ask for approval before executing.
    if require_plan_approval {
        if let Err(message) = hooks.require_plan_approval(steps.clone()) {
            state.session.add_message("Error", &message);
            finalize_transaction(state, hooks, false);
            hooks.failed(&message);
            return;
        }
    }

    // Fail fast with a clear message if the selected coder model's backend is
    // not available (e.g. a cloud model with no configured provider).
    if let Err(e) = client.client_for(&state.config.coder_model) {
        let message = format!("Coder backend unavailable: {e}");
        state.session.add_message("Error", &message);
        finalize_transaction(state, hooks, false);
        hooks.failed(&message);
        return;
    }

    let total = steps.len();
    for (i, step) in steps.iter().enumerate() {
        if hooks.interrupted() {
            let _ = state.refresh_workspace_diff();
            finalize_transaction(state, hooks, false);
            hooks.emit(AgentEvent::Interrupted);
            return;
        }
        hooks.plan_step(i + 1, total, &step.step_type, &step.description);
        executor::execute_step(client, state, step, hooks).await;
    }

    let summary: Vec<&str> = steps.iter().map(|s| s.description.as_str()).collect();
    let summary_str = summary.join("; ");
    state
        .session
        .add_message("assistant", &format!("Completed: {summary_str}"));
    state.session.add_action(&summary_str);

    if let Err(error) = state.refresh_workspace_diff() {
        hooks.warn(&format!("  [transaction] diff unavailable: {error}"));
    }

    if state.dirty && state.verification.is_none() {
        hooks.note("  [verify] running detected test gate...");
        let gate = automatic_verification(state);
        state.record_verification(gate.clone());
        hooks.verification(&gate);
    }

    // Repair ROUNDS: after each repair iteration the verification gate is
    // re-run, and its fresh diagnostics seed the next round — mirroring the
    // v0.9.2 guided-repair loop that historically converged in <=2 rounds.
    let mut interrupted = false;
    while state.verification_failed() {
        if state.retries >= state.config.max_retries {
            break;
        }
        state.retries += 1;
        let diags = test::extract_diagnostics(&state.last_test_output);
        let feedback = test::format_scoped_repair_prompt(&diags, None, &state.last_test_output);
        let oracle_directive = state
            .task_spec
            .as_ref()
            .map(|spec| spec.oracle_repair_directive())
            .unwrap_or_default();
        let sources = inline_failing_sources(state);
        let fix_task = format!(
            "Repair round {}/{}: fix the failed verification for the task: {task}\n\n\
             {feedback}{oracle_directive}{sources}Use your tools (read_file, edit_file, run_tests).",
            state.retries, state.config.max_retries
        );
        let tools = coding_tools(state);
        let model = state.config.coder_model.clone();
        // Minimal transcript for repair: do not pass long multi-turn session history
        // which pushes small models into prose/conversational mode.
        let prior: Vec<(String, String)> = Vec::new();

        let diag_summary = if diags.is_empty() {
            state.last_test_output.trim().to_string()
        } else {
            diags
                .iter()
                .map(|d| {
                    if let (Some(f), Some(l)) = (&d.file, d.line) {
                        format!("{}:{}: {}", f, l, d.message)
                    } else {
                        d.message.clone()
                    }
                })
                .collect::<Vec<_>>()
                .join("\n")
        };
        let target_files = state.changed_files.iter().cloned().collect::<Vec<_>>().join(", ");
        let recovery_task = format!(
            "Your previous response did not invoke a tool.\n\n\
             You are in REPAIR mode.\n\
             You must perform the correction using one of the provided tools (edit_file, write_file).\n\
             Do not explain.\n\
             Do not return markdown prose.\n\
             Do not describe the fix.\n\n\
             Current diagnostic:\n{diag_summary}\n\n\
             Allowed target:\n{}\n\n\
             Required action:\n\
             emit exactly one tool call to apply the fix.",
            if target_files.is_empty() { "workspace source files" } else { &target_files }
        );

        // Small models sometimes answer a repair prompt in prose instead of
        // emitting tool calls; give each round one strict dry protocol recovery re-ask first.
        let mut outcome: Option<Result<ToolLoopOutcome, crate::error::Error>> = None;
        for attempt in 0..2 {
            let iter_task = if attempt == 0 {
                fix_task.clone()
            } else {
                recovery_task.clone()
            };
            match run_tool_use_iteration(
                client,
                state,
                &model,
                &iter_task,
                &tools,
                hooks,
                &prior,
                true,
            )
            .await
            {
                Ok(ToolLoopOutcome::NoTools) if attempt == 0 => {
                    hooks.warn("  [repair] model replied without tool calls; sending protocol recovery...");
                    continue;
                }
                other => {
                    outcome = Some(other);
                    break;
                }
            }
        }

        match outcome {
            Some(Ok(ToolLoopOutcome::Completed(message))) => {
                state.session.add_message("assistant", &message);
            }
            Some(Ok(ToolLoopOutcome::Failed(mut message))) => {
                message.push_str(&finalize_transaction(state, hooks, false));
                hooks.failed(&message);
                return;
            }
            Some(Ok(ToolLoopOutcome::Interrupted)) => {
                interrupted = true;
                break;
            }
            Some(Ok(ToolLoopOutcome::NoTools)) | None => {
                hooks.warn(
                    "  [repair] model would not emit tool calls; stopping repair rounds",
                );
                break;
            }
            Some(Err(error)) => {
                let mut message = format!("Repair loop unavailable: {error}");
                message.push_str(&finalize_transaction(state, hooks, false));
                hooks.failed(&message);
                return;
            }
        }

        // Re-run the gate on the REAL workspace state before deciding whether
        // another repair round is worth it.
        if let Err(error) = state.refresh_workspace_diff() {
            hooks.warn(&format!("  [transaction] diff unavailable: {error}"));
        }
        let gate = automatic_verification(state);
        state.record_verification(gate.clone());
        hooks.verification(&gate);
    }

    if interrupted {
        finalize_transaction(state, hooks, false);
        hooks.emit(AgentEvent::Interrupted);
        return;
    }

    if state.verification_failed() {
        let mut message = format!(
            "Verification still failing after {} repair attempt(s):\n{}",
            state.retries,
            truncate_tool_output(&state.last_test_output, FIX_FEEDBACK_CAP)
        );
        message.push_str(&finalize_transaction(state, hooks, false));
        hooks.failed(&message);
        return;
    }

    // Planned steps are intentions, not outcomes: an action refused by the
    // approval policy must never be summarized as a completed task.
    if !state.blocked_actions.is_empty() {
        let mut message = format!(
            "Task incomplete: {} action(s) were not permitted:\n- {}",
            state.blocked_actions.len(),
            state.blocked_actions.join("\n- ")
        );
        message.push_str(&finalize_transaction(state, hooks, false));
        hooks.failed(&message);
        return;
    }

    if let Err(error) = completion_gate(state, hooks) {
        let mut message = error;
        message.push_str(&finalize_transaction(state, hooks, false));
        hooks.failed(&message);
        return;
    }
    let mut message = format!("Completed: {summary_str}");
    message.push_str(&finalize_transaction(state, hooks, true));
    hooks.done(&message);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adversarial_prompt_mentions_files_and_diff() {
        let prompt = build_adversarial_prompt("+1 −1 src/lib.rs", "src/lib.rs, src/main.rs");
        assert!(prompt.contains("adversarial code reviewer"));
        assert!(prompt.contains("src/lib.rs, src/main.rs"));
        assert!(prompt.contains("+1 −1 src/lib.rs"));
        assert!(prompt.contains("OK"));
    }

    fn tool_call(name: &str, arguments: serde_json::Value) -> crate::llm::client::ToolCall {
        crate::llm::client::ToolCall {
            id: format!("call_{name}"),
            r#type: "function".into(),
            function: crate::llm::client::ToolCallFunction {
                name: name.into(),
                arguments: arguments.to_string(),
            },
        }
    }

    fn test_state(tag: &str) -> (AgentState, std::path::PathBuf) {
        let root =
            std::env::temp_dir().join(format!("chronokairo-loop-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        let config = crate::config::settings::Config {
            workspace_dir: root.join("workspace"),
            memory_dir: root.join("memory"),
            max_retries: 1,
            ..crate::config::settings::Config::default()
        };
        let state = AgentState::new(config).unwrap();
        (state, root)
    }

    fn dummy_router() -> LlmRouter {
        LlmRouter::new(crate::llm::client::LlmClient::ollama(
            "http://localhost:11434",
        ))
    }

    fn recording_hooks() -> (AgentHooks, Arc<Mutex<Vec<AgentEvent>>>) {
        let events: Arc<Mutex<Vec<AgentEvent>>> = Arc::new(Mutex::new(Vec::new()));
        let sink = events.clone();
        (
            AgentHooks {
                on_event: Some(Arc::new(move |ev: AgentEvent| {
                    sink.lock().unwrap().push(ev);
                })),
                ..Default::default()
            },
            events,
        )
    }

    #[test]
    fn completion_gate_rejects_unverified_mutation() {
        let (mut state, root) = test_state("completion-unverified");
        state.start_turn().unwrap();
        state.mark_changed("src/lib.rs");
        let (hooks, events) = recording_hooks();
        let result = completion_gate(&state, &hooks);
        assert!(result.is_err());
        assert!(events
            .lock()
            .unwrap()
            .iter()
            .any(|event| matches!(event, AgentEvent::CompletionAudit { passed: false, .. })));
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn completion_gate_requires_all_actions_to_be_allowed() {
        let (mut state, root) = test_state("completion-blocked");
        state.blocked_actions.push("run_command".into());
        let (hooks, events) = recording_hooks();
        let result = completion_gate(&state, &hooks);
        assert!(result.is_err());
        assert!(events
            .lock()
            .unwrap()
            .iter()
            .any(|event| matches!(event, AgentEvent::CompletionAudit { passed: false, .. })));
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn completion_gate_accepts_a_passed_mutation() {
        let (mut state, root) = test_state("completion-passed");
        state.start_turn().unwrap();
        state.mark_changed("src/lib.rs");
        state.record_verification(VerificationResult {
            status: VerificationStatus::Passed,
            command: Some("cargo test".into()),
            exit_code: Some(0),
            timed_out: false,
            output: "ok".into(),
        });
        let (hooks, events) = recording_hooks();
        assert!(completion_gate(&state, &hooks).is_ok());
        assert!(events
            .lock()
            .unwrap()
            .iter()
            .any(|event| matches!(event, AgentEvent::CompletionAudit { passed: true, .. })));
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn tool_effects_are_classified_for_the_scheduler() {
        assert_eq!(tool_effect("read_file"), ToolEffect::ReadOnly);
        assert_eq!(tool_effect("git_diff"), ToolEffect::ReadOnly);
        assert_eq!(tool_effect("symbol_search"), ToolEffect::ReadOnly);
        assert_eq!(tool_effect("replace_exact"), ToolEffect::Mutation);
        assert_eq!(tool_effect("write_file"), ToolEffect::Mutation);
        assert_eq!(tool_effect("edit_file"), ToolEffect::Mutation);
        assert_eq!(tool_effect("multi_edit_file"), ToolEffect::Mutation);
        assert_eq!(tool_effect("run_tests"), ToolEffect::Command);
        assert_eq!(tool_effect("run_command"), ToolEffect::Command);
        assert_eq!(tool_effect("list_skills"), ToolEffect::Command);
    }

    #[test]
    fn multi_edit_file_dispatch_applies_several_edits() {
        let (mut state, root) = test_state("multi_dispatch");
        state.files.write_file("src.rs", "a\nb\nc\nd\n").unwrap();
        let call = tool_call(
            "multi_edit_file",
            serde_json::json!({
                "path": "src.rs",
                "edits": [
                    {"start_line": 1, "end_line": 1, "new_content": "A"},
                    {"start_line": 3, "end_line": 4, "new_content": "C\nD2"}
                ]
            }),
        );

        let result = execute_tool(&dummy_router(), &mut state, &call, &AgentHooks::default());

        assert!(result.mutated, "got: {}", result.output);
        assert_eq!(
            state.files.read_file("src.rs").as_deref(),
            Some("A\nb\nC\nD2\n")
        );
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn task_tool_spawns_sub_agent() {
        let (mut state, root) = test_state("task-tool");
        let call = tool_call(
            "task",
            serde_json::json!({"task": "Say hello from sub-agent"}),
        );

        let result = execute_tool(&dummy_router(), &mut state, &call, &AgentHooks::default());

        assert!(
            result.output.contains("[task ") || result.output.contains("[task:"),
            "got: {}",
            result.output
        );
        assert!(
            result.output.contains("hello")
                || result.output.contains("timed out")
                || result.output.contains("API request failed"),
            "got: {}",
            result.output
        );
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn task_tool_runs_parallel_subagents() {
        let (mut state, root) = test_state("task-parallel");
        let call = tool_call(
            "task",
            serde_json::json!({"tasks": ["hello from A", "hello from B"]}),
        );
        let result = execute_tool(&dummy_router(), &mut state, &call, &AgentHooks::default());
        // Both sub-agents report back; on the dummy router both return an
        // API-request-failed message, which still proves fan-out + aggregation.
        assert!(
            result.output.contains("[task 1/2]"),
            "got: {}",
            result.output
        );
        assert!(
            result.output.contains("[task 2/2]"),
            "got: {}",
            result.output
        );
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn utf8_tool_output_is_truncated_on_a_character_boundary() {
        let value = "é".repeat(5_000);
        let truncated = truncate_tool_output(&value, 8_001);
        assert!(truncated.ends_with("...[truncated]"));
        assert!(truncated.is_char_boundary(truncated.len()));
    }

    #[test]
    fn todo_tool_lists_and_completes_items() {
        let (mut state, root) = test_state("todo-tool");
        let add = tool_call(
            "todo",
            serde_json::json!({"op": "add", "text": "write tests"}),
        );
        let result = execute_tool(&dummy_router(), &mut state, &add, &AgentHooks::default());
        assert!(
            result.output.contains("write tests"),
            "got: {}",
            result.output
        );

        let complete = tool_call("todo", serde_json::json!({"op": "complete", "index": 1}));
        let result = execute_tool(
            &dummy_router(),
            &mut state,
            &complete,
            &AgentHooks::default(),
        );
        assert!(
            result.output.contains("completed"),
            "got: {}",
            result.output
        );

        let list = tool_call("todo", serde_json::json!({"op": "list"}));
        let result = execute_tool(&dummy_router(), &mut state, &list, &AgentHooks::default());
        assert!(result.output.contains("[x]"), "got: {}", result.output);
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn failed_mutation_repairs_then_fails_when_budget_is_exhausted() {
        let root =
            std::env::temp_dir().join(format!("chronokairo-gate-state-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        let config = crate::config::settings::Config {
            workspace_dir: root.join("workspace"),
            memory_dir: root.join("memory"),
            max_retries: 1,
            ..crate::config::settings::Config::default()
        };
        let mut state = AgentState::new(config).unwrap();
        state.dirty = true;
        state.record_verification(VerificationResult {
            status: VerificationStatus::Failed,
            command: Some("cargo test".into()),
            exit_code: Some(101),
            timed_out: false,
            output: "failed".into(),
        });

        assert_eq!(verification_action(&state), VerificationAction::Repair);
        state.repair_attempt = 1;
        assert_eq!(verification_action(&state), VerificationAction::Fail);
        state.record_verification(VerificationResult {
            status: VerificationStatus::Passed,
            command: Some("cargo test".into()),
            exit_code: Some(0),
            timed_out: false,
            output: "ok".into(),
        });
        assert_eq!(verification_action(&state), VerificationAction::Complete);
        let reported = "Changed src/lib.rs. Verification: passed.";
        assert_eq!(audited_final_text(&state, reported), reported);

        state.config.command_tool_policy = ApprovalPolicy::Deny;
        state.verification = None;
        let denied = automatic_verification(&state);
        assert_eq!(denied.status, VerificationStatus::Unavailable);
        assert!(denied.output.contains("denied by policy"));
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn try_mcp_tool_returns_none_when_no_mcp_clients() {
        let (mut state, root) = test_state("mcp-none");
        let call = tool_call("some_mcp_tool", serde_json::json!({"arg": "value"}));
        let result = try_mcp_tool(&mut state, &call, &AgentHooks::default());
        assert!(result.is_none());
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn mcp_tool_call_respects_ask_policy_without_approval_callback() {
        let (mut state, root) = test_state("mcp-ask");
        state.mcp_clients.push(fake_mcp_client());
        state.config.command_tool_policy = ApprovalPolicy::Ask;
        let call = tool_call("fake_tool", serde_json::json!({"arg": "value"}));
        let result = try_mcp_tool(&mut state, &call, &AgentHooks::default());
        let result = result.expect("MCP tool must be handled even when denied");
        assert!(result.output.contains("was not approved"));
        assert!(state
            .blocked_actions
            .iter()
            .any(|a| a.contains("fake_tool")));
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn mcp_tool_call_approved_when_callback_returns_allow() {
        let (mut state, root) = test_state("mcp-allow");
        state.mcp_clients.push(fake_mcp_client());
        state.config.command_tool_policy = ApprovalPolicy::Ask;
        let hooks = AgentHooks {
            on_approval: Some(Arc::new(|_| ApprovalDecision::AllowOnce)),
            ..AgentHooks::default()
        };
        let call = tool_call("fake_tool", serde_json::json!({"arg": "value"}));
        let result = try_mcp_tool(&mut state, &call, &hooks)
            .expect("fake_tool should resolve after approval");
        assert!(result.output.contains("fake result"));
        assert!(state.blocked_actions.is_empty());
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn allow_session_is_reused_by_cloned_hook_state() {
        let (mut state, root) = test_state("mcp-allow-session");
        state.mcp_clients.push(fake_mcp_client());
        state.config.command_tool_policy = ApprovalPolicy::Ask;
        let prompts = Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let prompts_seen = prompts.clone();
        let hooks = AgentHooks {
            on_approval: Some(Arc::new(move |_| {
                prompts_seen.fetch_add(1, Ordering::Relaxed);
                ApprovalDecision::AllowSession
            })),
            ..AgentHooks::default()
        };
        let call = tool_call("fake_tool", serde_json::json!({"arg": "value"}));
        assert!(try_mcp_tool(&mut state, &call, &hooks).unwrap().output.contains("fake result"));
        assert!(try_mcp_tool(&mut state, &call, &hooks).unwrap().output.contains("fake result"));
        assert_eq!(prompts.load(Ordering::Relaxed), 1);
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn session_approval_is_scoped_to_concrete_action() {
        let prompts = Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let seen = prompts.clone();
        let hooks = AgentHooks {
            on_approval: Some(Arc::new(move |_| {
                seen.fetch_add(1, Ordering::Relaxed);
                ApprovalDecision::AllowSession
            })),
            ..AgentHooks::default()
        };
        hooks.require_approval(ApprovalPolicy::Ask, "run_command", "cargo check", "command").unwrap();
        hooks.require_approval(ApprovalPolicy::Ask, "run_command", "cargo check", "command").unwrap();
        hooks.require_approval(ApprovalPolicy::Ask, "run_command", "cargo test", "command").unwrap();
        assert_eq!(prompts.load(Ordering::Relaxed), 2);
    }

    #[test]
    fn mcp_tool_call_runs_when_policy_is_allow() {
        let (mut state, root) = test_state("mcp-run");
        state.mcp_clients.push(fake_mcp_client());
        let call = tool_call("fake_tool", serde_json::json!({"arg": "value"}));
        let result = try_mcp_tool(&mut state, &call, &AgentHooks::default())
            .expect("fake_tool should resolve under Allow policy");
        assert!(result.output.contains("fake result"));
        assert!(state.blocked_actions.is_empty());
        let _ = std::fs::remove_dir_all(root);
    }

    /// Spawns a copy of this test binary as a minimal fake MCP server exposing
    /// a single tool named `fake_tool`. Runs with `--exact` on the dedicated
    /// fake-server test (see `src/mcp/mod.rs`) so no other tests execute.
    fn fake_mcp_client() -> crate::mcp::McpClient {
        let exe = std::env::current_exe().unwrap();
        let config = crate::mcp::McpServerConfig {
            command: exe.to_string_lossy().into_owned(),
            args: vec![
                "--exact".into(),
                "mcp::tests::fake_mcp_server_process".into(),
            ],
            env: vec![("CHRONOKAIRO_FAKE_MCP_SERVER".into(), "1".into())],
        };
        crate::mcp::McpClient::connect(&config).expect("fake MCP server should start")
    }

    #[test]
    fn extracts_tool_calls_from_markdown_code_block() {
        let response = r#"Here is the fix:
```json
{
  "name": "edit_file",
  "arguments": {
    "path": "src/lib.rs",
    "new_content": "pub fn hello() {}"
  }
}
```
Hope this helps!"#;
        let calls = extract_tool_calls_from_content(response);
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].function.name, "edit_file");
        assert!(calls[0].function.arguments.contains("src/lib.rs"));
    }

    #[test]
    fn extracts_tool_calls_from_tag_format() {
        let response = r#"<tool_call>
{"name": "write_file", "arguments": {"path": "src/main.rs", "content": "fn main() {}"}}
</tool_call>"#;
        let calls = extract_tool_calls_from_content(response);
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].function.name, "write_file");
        assert!(calls[0].function.arguments.contains("src/main.rs"));
    }

    #[test]
    fn extracts_tool_calls_from_raw_json_object() {
        let response = r#"{"name": "run_tests", "arguments": {"command": "cargo test"}}"#;
        let calls = extract_tool_calls_from_content(response);
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].function.name, "run_tests");
    }
}
