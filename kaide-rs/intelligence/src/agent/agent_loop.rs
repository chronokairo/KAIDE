use crate::agent::executor;
use crate::agent::planner;
use crate::agent::state::AgentState;
use crate::config::settings::ApprovalPolicy;
use crate::llm::prompt::CoderPrompt;
use crate::llm::router::LlmRouter;
use crate::tools::shell;
use crate::tools::test::{self, VerificationResult, VerificationStatus};
use crate::ui::AgentMode;
use anyhow::Result;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;

/// Progress events emitted by the agent loop, consumed by the TUI to show
/// live tool calls, plan steps and final results (mirrors exec-cell streaming
/// in 2026-era coding-agent TUIs).
#[derive(Debug, Clone)]
pub enum AgentEvent {
    Status(String),
    ToolCall {
        name: String,
        summary: String,
    },
    ToolCallDelta {
        index: usize,
        name: Option<String>,
        args_delta: String,
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
    Transaction {
        action: String,
        summary: String,
    },
    /// Streaming assistant text: one event per content delta. The TUI appends
    /// these into a live message line while the model is still generating.
    TextDelta {
        text: String,
    },
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApprovalDecision {
    AllowOnce,
    AllowSession,
    Deny,
}

static APPROVAL_ID: AtomicU64 = AtomicU64::new(1);

/// Streamed tool-call argument delta callback: `(call_index, tool_name, args_delta)`.
pub type ToolCallDeltaFn = Arc<dyn Fn(usize, Option<&str>, &str) + Send + Sync>;

/// Optional UI hooks for the agent loop: progress, approval and cancellation.
#[derive(Default, Clone)]
pub struct AgentHooks {
    pub on_event: Option<Arc<dyn Fn(AgentEvent) + Send + Sync>>,
    pub on_tool_call_delta: Option<ToolCallDeltaFn>,
    pub on_text_delta: Option<Arc<dyn Fn(&str) + Send + Sync>>,
    pub on_approval: Option<Arc<dyn Fn(ApprovalRequest) -> ApprovalDecision + Send + Sync>>,
    pub interrupt: Option<Arc<AtomicBool>>,
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

    pub fn tool_call(&self, name: &str, summary: &str) {
        if self.on_event.is_some() {
            self.emit(AgentEvent::ToolCall {
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

    pub fn require_approval(
        &self,
        policy: ApprovalPolicy,
        tool: &str,
        summary: &str,
        risk: &str,
    ) -> Result<(), String> {
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
                match self
                    .on_approval
                    .as_ref()
                    .map(|callback| callback(request))
                    .unwrap_or(ApprovalDecision::Deny)
                {
                    ApprovalDecision::AllowOnce | ApprovalDecision::AllowSession => Ok(()),
                    ApprovalDecision::Deny => Err(format!("{tool} was not approved")),
                }
            }
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

async fn maybe_compact(client: &LlmRouter, state: &mut AgentState) {
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
            eprintln!("  [context compacted — history summarized]");
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
        }
    }
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
) -> Result<ToolLoopOutcome> {
    let project_ctx = CoderPrompt::load_project_context(&state.config.workspace_dir);
    let system_prompt = CoderPrompt::with_context(&state.caveman, &project_ctx);
    let mut conversation: Vec<serde_json::Value> =
        vec![serde_json::json!({"role": "system", "content": system_prompt})];
    for (role, content) in prior {
        match role.as_str() {
            "user" => conversation.push(serde_json::json!({"role": "user", "content": content})),
            "assistant" => {
                conversation.push(serde_json::json!({"role": "assistant", "content": content}))
            }
            "system" => {
                conversation.push(serde_json::json!({"role": "system", "content": content}))
            }
            // Diagnostic-only roles (Error, Tool, …) never reach the model.
            _ => {}
        }
    }
    conversation.push(serde_json::json!({"role": "user", "content": prompt}));
    let mut used_tools = false;

    for iteration in 0..state.config.max_tool_iterations {
        if hooks.interrupted() {
            let _ = state.refresh_workspace_diff();
            let summary = finalize_transaction(state, hooks, false);
            if !summary.is_empty() {
                hooks.note(summary.trim());
            }
            return Ok(ToolLoopOutcome::Interrupted);
        }
        let tool_choice = if state.dirty && state.verification.is_none() {
            // A mutation is pending verification: require a tool call so the
            // model cannot answer before running the gate.
            crate::llm::client::ToolChoice::Required
        } else {
            crate::llm::client::ToolChoice::Auto
        };
        let tool_list = tools.to_vec();
        let mut stream_token = |token: &str| hooks.text_delta(token);
        let completion = tokio::select! {
            res = client.chat_meta_stream_with_fallback(
                model,
                conversation.clone(),
                Some(&tool_list),
                Some(&tool_choice),
                None,
                &mut stream_token,
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
                    tokio::time::sleep(std::time::Duration::from_millis(15)).await;
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
            hooks.note(&format!(
                "  [usage] {} prompt + {} completion = {} total tokens",
                usage.prompt_tokens, usage.completion_tokens, usage.total_tokens
            ));
        }
        let response = completion.content;
        let mut tool_calls = completion.tool_calls;

        // Temporary compatibility path for providers that still serialize tool
        // calls into assistant content. Typed tool_calls always take precedence.
        if tool_calls.is_empty() {
            tool_calls = serde_json::from_str(&response).unwrap_or_default();
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
            conversation.push(serde_json::json!({
                "role": "assistant",
                "content": if response.trim().is_empty() { serde_json::Value::Null } else { serde_json::Value::String(response.clone()) },
                "tool_calls": &tool_calls,
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
                hooks.tool_call(&tc.function.name, &summary);
                if result.mutated {
                    if let Some(path) = &result.changed_file {
                        hooks.file_changed(path);
                    }
                }
                if let Some(verification) = &result.verification {
                    hooks.verification(verification);
                }
                conversation.push(serde_json::json!({
                    "role": "tool",
                    "tool_call_id": tc.id,
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
                conversation.push(serde_json::json!({"role": "assistant", "content": response}));
            }
            continue;
        }

        if !used_tools {
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
                let feedback = truncate_tool_output(&gate.output, FIX_FEEDBACK_CAP);
                conversation.push(serde_json::json!({
                    "role": "user",
                    "content": format!(
                        "Verification failed (repair {}/{}). Fix the implementation without weakening tests, then run verification again.\nCommand: {}\nOutput:\n{}",
                        state.repair_attempt,
                        state.config.max_retries,
                        gate.command.as_deref().unwrap_or("unknown"),
                        feedback
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

        let mut final_text = audited_final_text(state, &response);
        final_text.push_str(&finalize_transaction(state, hooks, true));
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
        "read_file" | "list_tree" | "search_code" | "git_status" | "git_diff" => {
            ToolEffect::ReadOnly
        }
            "write_file" | "replace_exact" | "edit_file" | "multi_edit_file" => ToolEffect::Mutation,
        _ => ToolEffect::Command,
    }
}

fn connect_mcp_clients(state: &mut AgentState) {
    let configs = state.config.mcp_servers.clone();
    for config in configs {
        match crate::mcp::McpClient::connect(&config) {
            Ok(client) => state.mcp_clients.push(client),
            Err(err) => eprintln!("[mcp] failed to connect to {}: {err}", config.command),
        }
    }
}

fn try_mcp_tool(
    state: &mut AgentState,
    tc: &crate::llm::client::ToolCall,
) -> Option<ToolExecutionResult> {
    let args = tool_arguments(tc).ok()?;
    let name = &tc.function.name;
    for client in &mut state.mcp_clients {
        if let Ok(result) = client.call_tool(name, &args) {
            return Some(ToolExecutionResult {
                output: truncate_tool_output(&result, state.config.max_tool_output_bytes),
                mutated: false,
                changed_file: None,
                verification: None,
                exit_code: None,
                timed_out: false,
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
            results[index] = Some(execute_tool(client, state, &tool_calls[index], hooks));
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

fn tool_arguments(tc: &crate::llm::client::ToolCall) -> Result<serde_json::Value, String> {
    serde_json::from_str(&tc.function.arguments)
        .map_err(|error| format!("invalid JSON arguments: {error}"))
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
                        anyhow::anyhow!("file not found or path is outside workspace")
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
            let result = if tc.function.name == "write_file" {
                string_arg("content")
                    .ok_or_else(|| anyhow::anyhow!("missing required argument: content"))
                    .and_then(|content| state.files.write_file(path, content))
            } else if tc.function.name == "edit_file" {
                let start = usize_arg("start_line");
                let end = usize_arg("end_line");
                let old = string_arg("old_content");
                match string_arg("new_content") {
                    Some(new_content) => state.files.edit_file(path, start, end, old, new_content),
                    None => Err(anyhow::anyhow!("missing required argument: new_content")),
                }
            } else if tc.function.name == "multi_edit_file" {
                let parsed = || -> anyhow::Result<Vec<crate::tools::fs::MultiEdit>> {
                    let arr = args
                        .get("edits")
                        .and_then(|value| value.as_array())
                        .ok_or_else(|| anyhow::anyhow!("missing required argument: edits"))?;
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
                            anyhow::bail!("each edit requires integer start_line and end_line");
                        };
                        let old_content = entry
                            .get("old_content")
                            .and_then(|v| v.as_str())
                            .map(String::from);
                        let new_content = entry
                            .get("new_content")
                            .and_then(|v| v.as_str())
                            .ok_or_else(|| anyhow::anyhow!("each edit requires new_content"))?
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
                    _ => Err(anyhow::anyhow!("missing required arguments: old, new")),
                }
            };
            match result {
                Ok(()) => {
                    state.session.add_file(path);
                    state.mark_changed(path);
                    ToolExecutionResult {
                        output: format!("changed {path}"),
                        mutated: true,
                        changed_file: Some(path.to_string()),
                        verification: None,
                        exit_code: None,
                        timed_out: false,
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
                    }
                } else {
                    let output = shell::run_command_raw_with_interrupt(command, &state.config, hooks.interrupt.as_deref());
                    ToolExecutionResult {
                        output: truncate_tool_output(&output.combined(), cap),
                        mutated: false,
                        changed_file: None,
                        verification: None,
                        exit_code: output.code,
                        timed_out: output.timed_out,
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
            }
        }
        "task" => {
            let Some(task) = string_arg("task") else {
                return ToolExecutionResult::output("missing required argument: task");
            };
            let model = string_arg("model").unwrap_or(&state.config.coder_model);
            let (tx, rx) = mpsc::channel::<(String, bool)>();
            let tx = Arc::new(Mutex::new(Some(tx)));
            let client = client.clone();
            let mut sub_state = match AgentState::new(state.config.clone()) {
                Ok(mut s) => {
                    s.session_persist = false;
                    s
                }
                Err(e) => return ToolExecutionResult::output(format!("Failed to initialize sub-agent state: {e}")),
            };
            let task = task.to_string();
            let model = model.to_string();

            let run_sub = async move {
                let _ = sub_state.start_turn();
                sub_state.session.add_message("user", &task);
                let sub_hooks = AgentHooks {
                    on_event: Some(Arc::new({
                        let tx = tx.clone();
                        move |event| {
                            if let AgentEvent::Done { message } = event {
                                if let Some(tx) = tx.lock().unwrap().take() {
                                    let _ = tx.send((message.clone(), true));
                                }
                            } else if let AgentEvent::Failed { message } = event {
                                if let Some(tx) = tx.lock().unwrap().take() {
                                    let _ = tx.send((message.clone(), false));
                                }
                            }
                        }
                    })),
                    on_tool_call_delta: None,
                    on_text_delta: None,
                    on_approval: None,
                    interrupt: None,
                };
                let _ = run_agent_loop_with_hooks(
                    &client,
                    &mut sub_state,
                    &task,
                    &sub_hooks,
                    AgentMode::Agent,
                )
                .await;
            };

            if let Ok(handle) = tokio::runtime::Handle::try_current() {
                handle.spawn(run_sub);
            } else {
                tokio::spawn(run_sub);
            }

            let res = tokio::task::block_in_place(|| {
                rx.recv_timeout(std::time::Duration::from_secs(300))
            });

            match res {
                Ok((msg, ok)) => ToolExecutionResult {
                    output: format!("[task:{model}] {msg}"),
                    mutated: false,
                    changed_file: None,
                    verification: None,
                    exit_code: None,
                    timed_out: !ok,
                },
                Err(_) => ToolExecutionResult::output(format!("[task:{model}] timed out")),
            }
        }
        "acp_kilo_code_search" | "acp_opencode_search" => {
            let arguments: serde_json::Value = serde_json::from_str(&tc.function.arguments)
                .unwrap_or_else(|_| serde_json::json!({"query": tc.function.arguments}));
            match crate::mcp::acp::execute_acp_tool_call(&tc.function.name, &arguments) {
                Ok(out) => ToolExecutionResult::output(out),
                Err(err) => ToolExecutionResult::output(format!("ACP Error: {err}")),
            }
        }
        _ => {
            if let Some(result) = try_mcp_tool(state, tc) {
                result
            } else {
                ToolExecutionResult::output(format!("Unknown tool: {}", tc.function.name))
            }
        }
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

fn automatic_verification(state: &AgentState) -> VerificationResult {
    match state
        .config
        .command_tool_policy
        .denial_message("automatic verification")
    {
        Some(message) => VerificationResult::unavailable(message),
        None => test::run_tests("", &state.config),
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
        if state.config.require_diff_summary {
            return format!("\nWorkspace diff: {}", diff.summary());
        }
        return String::new();
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

    let matcher = regex::Regex::new(pattern)
        .or_else(|_| regex::Regex::new(&regex::escape(pattern)))
        .expect("escaped text is a valid regex");
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
                if matcher.is_match(line) {
                    let relative = path.strip_prefix(root).unwrap_or(&path);
                    let rel_str = relative.display().to_string().replace('\\', "/");
                    matches.push(format!(
                        "{}:{}:{}",
                        rel_str,
                        line_index + 1,
                        line
                    ));
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
        serde_json::json!({
            "type": "object",
            "properties": properties,
            "required": required,
            "additionalProperties": false
        })
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
            "Spawn a sub-agent to execute a self-contained task in isolation. Use for complex multi-step work that should not pollute the current session.",
            object(
                serde_json::json!({
                    "task": {"type": "string"},
                    "model": {"type": "string"}
                }),
                serde_json::json!(["task"]),
            ),
        ),
    ];
    for client in &mut state.mcp_clients {
        if let Ok(mcp_tools) = client.list_tools() {
            tools.extend(mcp_tools);
        }
    }
    tools.extend(crate::mcp::acp::get_acp_tool_definitions());
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
    let caveman_tag = state.caveman.tag();
    if !caveman_tag.is_empty() {
        hooks.note(&format!("[{}]", caveman_tag));
    }
    hooks.note(&format!("[Planning] {task}"));
    state.session.add_message("user", task);

    connect_mcp_clients(state);
    maybe_compact(client, state).await;

    if hooks.interrupted() {
        finalize_transaction(state, hooks, false);
        hooks.emit(AgentEvent::Interrupted);
        return;
    }

    match mode {
        AgentMode::Agent => run_agent_mode(client, state, task, hooks).await,
        AgentMode::Plan => run_plan_mode(client, state, task, hooks).await,
    }
    // Persist the transcript at turn boundaries (append-only, crash-safe).
    if let Err(e) = state.persist_session() {
        hooks.warn(&format!("  [persist] session save failed: {e}"));
    }
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
    match run_tool_use_iteration(client, state, &model, task, &tools, hooks, &prior).await {
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
            state.session.add_message(
                "Error",
                &format!("  [tools] unavailable ({e}); using planner fallback"),
            );
        }
    }

    if hooks.interrupted() {
        finalize_transaction(state, hooks, false);
        hooks.emit(AgentEvent::Interrupted);
        return;
    }

    run_planner_fallback(client, state, task, hooks).await;
}

/// Plan mode: planner first, then execute plan steps.
async fn run_plan_mode(client: &LlmRouter, state: &mut AgentState, task: &str, hooks: &AgentHooks) {
    run_planner_fallback(client, state, task, hooks).await;
}

/// Shared planner fallback: generate a plan, execute steps, verify, and fix.
async fn run_planner_fallback(
    client: &LlmRouter,
    state: &mut AgentState,
    task: &str,
    hooks: &AgentHooks,
) {
    let context = state.session.get_context();
    let fallback_plan = || crate::types::plan::Plan {
        steps: vec![crate::types::plan::PlanStep {
            step_type: "answer".into(),
            description: task.into(),
            filename: None,
            pattern: None,
            command: None,
        }],
    };
    let plan = planner::plan_task(
        client,
        &state.config.planner_model,
        task,
        &context,
        &state.caveman,
    )
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

    if state.verification_failed() {
        if state.retries < state.config.max_retries {
            state.retries += 1;
            let feedback = truncate_tool_output(&state.last_test_output, FIX_FEEDBACK_CAP);
            let fix_task = format!(
                "Fix the failed verification for the original task: {task}\n\nVerification output:\n{feedback}"
            );
            let tools = coding_tools(state);
            let model = state.config.coder_model.clone();
            let prior = state.session.conversation();
            match run_tool_use_iteration(client, state, &model, &fix_task, &tools, hooks, &prior).await {
                Ok(ToolLoopOutcome::Completed(message)) => {
                    state.session.add_message("assistant", &message);
                    hooks.done(&message);
                }
                Ok(ToolLoopOutcome::Failed(message)) => {
                    let mut message = message;
                    message.push_str(&finalize_transaction(state, hooks, false));
                    hooks.failed(&message);
                }
                Ok(ToolLoopOutcome::Interrupted) => {
                    finalize_transaction(state, hooks, false);
                    hooks.emit(AgentEvent::Interrupted);
                }
                Ok(ToolLoopOutcome::NoTools) => {
                    let mut message =
                        "Repair model returned no tool calls while verification was failing"
                            .to_string();
                    message.push_str(&finalize_transaction(state, hooks, false));
                    hooks.failed(&message);
                }
                Err(error) => {
                    let mut message = format!("Repair loop unavailable: {error}");
                    message.push_str(&finalize_transaction(state, hooks, false));
                    hooks.failed(&message);
                }
            }
            return;
        }
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

    let mut message = format!("Completed: {summary_str}");
    message.push_str(&finalize_transaction(state, hooks, true));
    hooks.done(&message);
}

#[cfg(test)]
mod tests {
    use super::*;

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
            std::env::temp_dir().join(format!("anamnesic-loop-{tag}-{}", std::process::id()));
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

    #[test]
    fn tool_effects_are_classified_for_the_scheduler() {
        assert_eq!(tool_effect("read_file"), ToolEffect::ReadOnly);
        assert_eq!(tool_effect("git_diff"), ToolEffect::ReadOnly);
        assert_eq!(tool_effect("replace_exact"), ToolEffect::Mutation);
        assert_eq!(tool_effect("write_file"), ToolEffect::Mutation);
        assert_eq!(tool_effect("edit_file"), ToolEffect::Mutation);
        assert_eq!(tool_effect("multi_edit_file"), ToolEffect::Mutation);
        assert_eq!(tool_effect("run_tests"), ToolEffect::Command);
        assert_eq!(tool_effect("run_command"), ToolEffect::Command);
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

        assert!(result.output.contains("[task:"), "got: {}", result.output);
        assert!(result.output.contains("hello") || result.output.contains("timed out"), "got: {}", result.output);
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
    fn failed_mutation_repairs_then_fails_when_budget_is_exhausted() {
        let root =
            std::env::temp_dir().join(format!("anamnesic-gate-state-{}", std::process::id()));
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
        let result = try_mcp_tool(&mut state, &call);
        assert!(result.is_none());
        let _ = std::fs::remove_dir_all(root);
    }
}
