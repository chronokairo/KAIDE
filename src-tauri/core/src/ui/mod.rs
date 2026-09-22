use crate::ui::engine::crossterm::{
    cursor::Show,
    event::{
        self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind, KeyModifiers,
        MouseButton, MouseEventKind,
    },
    execute,
    terminal::{EnterAlternateScreen, LeaveAlternateScreen},
};
use crate::ui::engine::ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Clear, List, ListItem, Paragraph, Wrap},
    Terminal,
};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::{
    error::Error,
    io::{self, Write},
    sync::mpsc,
    thread,
    time::{Duration, Instant},
};



use crate::agent::agent_loop::{
    AgentEvent, AgentHooks, ApprovalDecision, ApprovalRequest, PlanApprovalDecision,
    PlanApprovalRequest,
};
use crate::agent::state::AgentState;
use crate::config::settings::ApprovalPolicy;
use crate::llm::router::{LlmRouter, DEFAULT_PROVIDER};

pub mod engine;
pub mod syntax;
mod bottom_pane;
mod history_cell;
mod chatwidget;
mod composer;
mod style;
mod diff_render;
pub(crate) mod file_search;
mod line_truncation;
mod live_wrap;
mod pager_overlay;
mod width;

use width::{display_width, grapheme_indices};


const SPINNER: [char; 4] = ['|', '/', '-', '\\'];

/// Available slash commands, shown in the interactive picker (modern-harness style).
const SLASH_COMMANDS: &[(&str, &str)] = &[
    (
        "/info",
        "Show workspace info (context, tokens, models, todo, files)",
    ),
    ("/help", "Show help"),
    ("/status", "Show model, provider, directory, context tokens"),
    (
        "/model",
        "Select active model (no arg = pick from list, or /model <name>)",
    ),
    (
        "/provider",
        "Select cloud provider and configure API key (or /provider <name> [key])",
    ),
    (
        "/providers",
        "Manage cloud providers and keys (list, show, set <provider> <key>)",
    ),
    (
        "/key",
        "Set or update API key for a provider (/key [provider] <api-key>)",
    ),
    ("/reset", "Reset session"),
    ("/resume", "Resume a saved session (picker)"),
    ("/continue", "Continue the most recent session"),
    (
        "/plan",
        "Toggle plan mode (generate plan first, then approve before executing)",
    ),
    ("/compact", "Compact the current transcript into a local summary"),
    ("/context", "Show context usage and routing budget"),
    ("/permissions", "Show write and command approval policies"),
    ("/tools", "List registered agent tools"),
    ("/theme", "Set TUI theme label (default, dark, light, no-color)"),
    ("/add-dir", "Allow an additional workspace directory for this session"),
    ("/find", "Find text in the open editor (case, word, or regex flags)"),
    ("/replace", "Replace all text in the open editor using old => new"),
];

#[derive(PartialEq)]
pub enum Focus {
    Sidebar,
    Messages,
    Input,
    Editor,
}

/// Agent execution mode: Agent uses tool-use iteration (interactive),
/// Plan generates a plan first then executes steps sequentially.
#[derive(PartialEq, Clone, Copy)]
pub enum AgentMode {
    Agent,
    Plan,
}

#[derive(Debug, Clone)]
pub struct TokenBreakdown {
    pub input: usize,
    pub output: usize,
    pub reasoning: usize,
    pub cache_read: usize,
    pub cache_write: usize,
    pub cache_rate: f64,
    pub generation_speed: f64,
}

#[derive(Debug, Clone)]
pub struct ModelEntry {
    pub provider: String,
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct TodoItem {
    pub text: String,
    pub done: bool,
}

#[derive(Debug, Clone)]
pub struct InfoPanelSection {
    pub title: &'static str,
    pub open: bool,
    pub lines: Vec<Span<'static>>,
}

impl InfoPanelSection {
    pub fn new(title: &'static str) -> Self {
        Self {
            title,
            open: false,
            lines: Vec::new(),
        }
    }

    pub fn closed(title: &'static str) -> Self {
        Self::new(title)
    }

    pub fn open(title: &'static str, lines: Vec<Span<'static>>) -> Self {
        Self {
            title,
            open: true,
            lines,
        }
    }
}

pub struct App {
    pub messages: Vec<(String, String)>, // (role, content)
    // Composer input is owned by BottomPane.
    pub loading: bool,
    pub sidebar_items: Vec<String>,
    pub sidebar_selected: usize,
    pub focus: Focus,
    pub agent_mode: AgentMode,
    pub editor_file: Option<String>,
    pub editor_lines: Vec<String>,
    pub editor_row: usize,
    pub editor_col: usize,
    pub editor_dirty: bool,
    pub editor_scroll: usize,
    /// Editor core adapted from microsoft/edit. The legacy mirrors above are
    /// kept for rendering compatibility while input migration is completed.
    pub editor_buffer: Option<crate::editor::EditorBuffer>,
    /// Word-wrap policy shared by transcript and embedded editor.
    pub word_wrap: bool,
    pub status: String,
    pub scroll_offset: usize,
    pub follow: bool,
    pub model: String,
    pub auto_model: bool,
    pub dir: String,
    pub git_branch: String,
    pub tokens: usize,
    pub elapsed: Duration,
    pub spinner_frame: usize,
    pub provider: String,
    pub key_input_popup: bool,
    pub key_input_provider: String,
    pub key_input_value: String,
    /// Pending approval prompt (`ask` policy): the worker blocks until the
    /// user answers, but rendering and input keep running.
    pub pending_approval: Option<ApprovalRequest>,
    /// Pending plan approval: when in Plan mode, the planner proposes steps
    /// and waits for user approval before executing.
    pub pending_plan_approval: Option<PlanApprovalRequest>,
    pub quit_pending: bool,
    pub token_breakdown: TokenBreakdown,
    pub max_context_tokens: usize,
    pub context_cost: f64,
    pub models: Vec<ModelEntry>,
    pub todo_items: Vec<TodoItem>,
    pub modified_files: Vec<String>,
    pub memory_enabled: bool,
    pub indexing_enabled: bool,
    /// Resume session picker state.
    pub resume_ids: Vec<i64>,
    /// Tracks the in-flight streaming tool-call delta so chunks of the same
    /// call accumulate on one chat line instead of stacking new lines.
    pub last_delta_line: Option<(usize, String)>,
    /// True while the model is streaming assistant text; the last message is
    /// the live, still-growing response. Reset on Done/Failed/Interrupted.
    pub streaming_assistant: bool,
    /// Unified diff content for modified files (+green / -red).
    pub diff_content: Vec<String>,
    /// Whether the reasoning panel is expanded (showing full content)
    /// or collapsed (showing only a summary).
    pub reasoning_expanded: bool,
    /// Whether tool call details are expanded (showing full output)
    /// or collapsed (showing rollup summary). Toggled with Ctrl+O or Ctrl+E.
    pub tool_calls_expanded: bool,
    /// Fuzzy file-search overlay state (Ctrl+P): query, ranking and selection.
    // Overlay payloads are owned by BottomPane.
    /// /info overlay: full-screen view of the former left sidebar sections.
    /// Auto model availability test overlay popup and real-time live test state.
    pub auto_test_popup: bool,
    pub auto_test_running: bool,
    pub auto_test_current_candidate: Option<(String, usize, usize)>,
    pub auto_test_live_results: Vec<crate::llm::router::AutoTestProbeResult>,
    pub last_auto_test: Option<crate::llm::router::AutoTestRecord>,
    /// Accumulated reasoning content for thinking models (GLM-5.2, deepseek-r1).
    pub reasoning: String,
    /// Active top tab: 0 = Session, 1 = Issues, 2 = Pull Requests, 3 = Gists
    pub active_tab: usize,
    /// Number of background tasks enqueued and currently running.
    pub pending_tasks: usize,
    /// Context references available to the `$` picker (project guidance and
    /// discovered zero-lib skills). Kept as display names so the TUI does not
    /// need to depend on the skills implementation.
    pub context_reference_items: Vec<String>,
    /// Shared approval broker handle, installed by `run_ui` after startup.
    pub(crate) session_approvals: Option<Arc<Mutex<std::collections::BTreeSet<String>>>>,
    /// Human-readable approval scopes shown by `/permissions`.
    pub approval_scopes: Vec<String>,
    /// Modal views and selector payloads are routed through the bottom pane
    /// stack; the app retains only domain data needed by the core loop.
    pub(crate) bottom_pane: crate::ui::bottom_pane::BottomPane,
    /// Cached transcript render; invalidated by message content or visual
    /// expansion state, so idle frames do not rebuild every cell.
    pub(crate) history_cache: Option<(u64, Vec<Line<'static>>)>,
}

#[derive(Debug, Clone)]
pub enum AutoTestProbeEvent {
    ProbeStarted {
        model: String,
        index: usize,
        total: usize,
    },
    ProbeSuccess {
        model: String,
        latency_ms: u128,
        index: usize,
        total: usize,
    },
    ProbeFailed {
        model: String,
        error: String,
        index: usize,
        total: usize,
    },
    Complete {
        record: crate::llm::router::AutoTestRecord,
    },
}

/// Byte offset of the `char_index`-th character of `s`. Clamped to `s.len()`
/// when the index is at/past the end, so it is safe to use with `insert`.
fn char_index_to_byte_index(s: &str, char_index: usize) -> usize {
    s.char_indices()
        .nth(char_index)
        .map(|(byte, _)| byte)
        .unwrap_or(s.len())
}

impl App {
    pub fn new(model: &str) -> Self {
        Self {
            messages: Vec::new(),
            loading: false,
            sidebar_items: Vec::new(),
            sidebar_selected: 0,
            focus: Focus::Input,
            agent_mode: AgentMode::Agent,
            editor_file: None,
            editor_lines: Vec::new(),
            editor_row: 0,
            editor_col: 0,
            editor_dirty: false,
            editor_scroll: 0,
            editor_buffer: None,
            word_wrap: false,
            status: "Ready · F1: Session · F2: Issues · F3: PRs · F4: Gists · Enter to send · Esc interrupt"
                .into(),
            scroll_offset: 0,
            follow: true,
            model: model.to_string(),
            auto_model: false,
            dir: String::new(),
            git_branch: String::new(),
            tokens: 0,
            elapsed: Duration::ZERO,
            spinner_frame: 0,
            provider: DEFAULT_PROVIDER.to_string(),
            key_input_popup: false,
            key_input_provider: String::new(),
            key_input_value: String::new(),
            pending_approval: None,
            pending_plan_approval: None,
            quit_pending: false,
            token_breakdown: TokenBreakdown {
                input: 0,
                output: 0,
                reasoning: 0,
                cache_read: 0,
                cache_write: 0,
                cache_rate: 0.0,
                generation_speed: 0.0,
            },
            max_context_tokens: 0,
            context_cost: 0.0,
            models: Vec::new(),
            todo_items: Vec::new(),
            modified_files: Vec::new(),
            memory_enabled: false,
            indexing_enabled: false,
            resume_ids: Vec::new(),
            last_delta_line: None,
            streaming_assistant: false,
            diff_content: Vec::new(),
            reasoning_expanded: true,
            tool_calls_expanded: false,
            auto_test_popup: false,
            auto_test_running: false,
            auto_test_current_candidate: None,
            auto_test_live_results: Vec::new(),
            last_auto_test: load_auto_test_record(),
            reasoning: String::new(),
            active_tab: 0,
            pending_tasks: 0,
            context_reference_items: Vec::new(),
            session_approvals: None,
            approval_scopes: Vec::new(),
            bottom_pane: crate::ui::bottom_pane::BottomPane::default(),
            history_cache: None,
        }
    }

    pub fn add_message(&mut self, role: &str, content: &str) {
        let clean = strip_ansi_and_controls(content);
        if clean.trim().is_empty() && role.eq_ignore_ascii_case("assistant") {
            return;
        }
        self.messages.push((role.to_string(), clean));
        self.history_cache = None;
    }

    /// Replace only the active `@`/`$` reference token at the composer cursor,
    /// preserving the surrounding prompt and using character indices for
    /// Unicode-safe cursor placement.
    pub fn replace_reference_at_cursor(&mut self, trigger: char, value: &str) -> bool {
        let input = self.bottom_pane.composer.input.clone();
        let cursor = self.bottom_pane.composer.cursor_position.min(input.chars().count());
        let before: String = input.chars().take(cursor).collect();
        let suffix: String = input.chars().skip(cursor).collect();
        let Some(token_start) = before.rfind(trigger) else {
            return false;
        };
        let replacement = format!("{}{}", &before[..token_start], value);
        self.bottom_pane.composer.input = format!("{}{}", replacement, suffix);
        self.bottom_pane.composer.cursor_position = replacement.chars().count();
        true
    }


    pub fn feed_tool_delta(&mut self, index: usize, name: &str, args_delta: &str) {
        const MAX_DELTA_CHARS: usize = 240;
        let mut text;
        if let Some((last_index, ref last_text)) = self.last_delta_line {
            if last_index == index {
                if let Some((_, last)) = self.messages.last_mut() {
                    if last.starts_with("Δ ") {
                        text = last_text.clone();
                        if text.chars().count() < MAX_DELTA_CHARS {
                            text.push_str(args_delta);
                        }
                        *last = text.clone();
                        self.last_delta_line = Some((index, text));
                        return;
                    }
                }
            }
        }
        let tag = format!("Δ {name}[{index}]");
        text = format!("{tag} {args_delta}");
        self.messages.push(("Tool".to_string(), text.clone()));
        self.last_delta_line = Some((index, text));
    }

    /// Append streamed assistant text to a single live message. Creates the
    /// message on the first delta of a turn, then accumulates onto it until a
    /// terminal event (Done/Failed/Interrupted) calls `end_streaming`.
    pub fn feed_text_delta(&mut self, text: &str) {
        const MAX_STREAM_CHARS: usize = 20_000;
        let text = &strip_ansi_and_controls(text);
        if text.is_empty() {
            return;
        }
        if self.streaming_assistant {
            if let Some((role, last)) = self.messages.last_mut() {
                if role == "Assistant" && last.chars().count() < MAX_STREAM_CHARS {
                    last.push_str(text);
                    return;
                }
            }
            self.streaming_assistant = false;
        }
        self.messages
            .push(("Assistant".to_string(), text.to_string()));
        self.streaming_assistant = true;
    }

    /// Accumulate reasoning content deltas into a single live message.
    /// Unlike text deltas, reasoning content is displayed separately
    /// (italic, subdued) and does not count as the assistant's response.
    /// Flushes to the transcript periodically so thinking appears live.
    pub fn feed_reasoning_delta(&mut self, text: &str) {
        const MAX_REASONING_CHARS: usize = 32_000;
        const FLUSH_THRESHOLD: usize = 120;
        if self.reasoning.len() < MAX_REASONING_CHARS {
            self.reasoning.push_str(text);
        }
        if self.reasoning.len() >= FLUSH_THRESHOLD {
            let chunk = std::mem::take(&mut self.reasoning);
            if let Some((role, content)) = self.messages.last_mut() {
                if role == "Thinking" {
                    content.push_str(&chunk);
                    return;
                }
            }
            self.messages.push(("Thinking".to_string(), chunk));
        }
    }

    /// Reset reasoning accumulation between tool iterations.
    /// Call at the start of each new assistant response to avoid
    /// concatenating reasoning from multiple iterations without a separator.
    /// Any remaining tail (< 120 chars) is flushed to the transcript first.
    pub fn reset_reasoning(&mut self) {
        if !self.reasoning.is_empty() {
            let chunk = std::mem::take(&mut self.reasoning);
            if let Some((role, content)) = self.messages.last_mut() {
                if role == "Thinking" {
                    content.push_str(&chunk);
                    return;
                }
            }
            self.messages.push(("Thinking".to_string(), chunk));
        }
    }

    /// Stop the live assistant message. If `final_content` is provided, the
    /// last streaming Assistant partial is replaced with the final text so the
    /// transcript shows exactly one copy of the response; any trailing
    /// Thinking flushes are kept before it (Thinking → Assistant). Open
    /// reasoning tails are flushed first. Returns true if a streaming message
    /// was finalized (callers should not push the final message again).
    pub fn end_streaming(&mut self, final_content: Option<&str>) -> bool {
        // Close any open reasoning accumulation before finalizing content.
        // Insert remaining reasoning before the Assistant message so the
        // transcript reads Thinking → Assistant, not Assistant → Thinking.
        if !self.reasoning.is_empty() {
            let reasoning = std::mem::take(&mut self.reasoning);
            match self.messages.last_mut() {
                Some((role, _)) if role == "Assistant" => {
                    let idx = self.messages.len().saturating_sub(1);
                    self.messages
                        .insert(idx, ("Thinking".to_string(), reasoning));
                }
                Some((_, last)) => {
                    last.push_str(&reasoning);
                }
                None => {
                    self.messages.push(("Thinking".to_string(), reasoning));
                }
            }
        }
        if !self.streaming_assistant {
            return false;
        }
        if let Some(content) = final_content {
            // Replace the last streaming Assistant partial with the final
            // content and keep any trailing Thinking flushes (one or several,
            // e.g. interleaved reasoning) BEFORE it, so the transcript always
            // reads ... Thinking → Assistant(final).
            if let Some(idx) = self.messages.iter().rposition(|(r, _)| r == "Assistant") {
                let mut tail = self.messages.split_off(idx);
                let mut assistant = tail.remove(0);
                assistant.1 = content.to_string();
                self.messages.extend(tail);
                self.messages.push(assistant);
            } else {
                self.messages
                    .push(("Assistant".to_string(), content.to_string()));
            }
        }
        self.streaming_assistant = false;
        true
    }

    /// Open the Ctrl+P overlay seeded with the workspace file list.
    pub fn open_file_search(&mut self, paths: Vec<String>) {
        self.show_view(crate::ui::bottom_pane::ViewKind::FileSearch);
        self.bottom_pane.file_search.query.clear();
        self.bottom_pane.file_search.selected = 0;
        self.bottom_pane.file_search.paths = paths;
        self.refresh_file_search();
    }

    /// Re-rank the file-search results for the current query.
    pub fn refresh_file_search(&mut self) {
        let limit = 100;
        self.bottom_pane.file_search.results = file_search::search_files(
            &self.bottom_pane.file_search.paths,
            &self.bottom_pane.file_search.query,
            limit,
        );
        self.bottom_pane.file_search.selected = self
            .bottom_pane.file_search.selected
            .min(self.bottom_pane.file_search.results.len().saturating_sub(1));
    }

    pub fn move_file_search_selection(&mut self, up: bool) {
        let len = self.bottom_pane.file_search.results.len();
        if len == 0 {
            return;
        }
        if up {
            self.bottom_pane.file_search.selected = self.bottom_pane.file_search.selected.saturating_sub(1);
        } else if self.bottom_pane.file_search.selected + 1 < len {
            self.bottom_pane.file_search.selected += 1;
        }
    }

    /// Load `path` (workspace-relative) into the built-in editor.
    pub fn open_editor(&mut self, path: &str, content: Option<&str>) {
        let lines: Vec<String> = content
            .map(|c| c.lines().map(str::to_string).collect())
            .unwrap_or_default();
        self.editor_file = Some(path.to_string());
        self.editor_lines = lines;
        self.editor_row = 0;
        self.editor_col = 0;
        self.editor_dirty = false;
        self.editor_scroll = 0;
        self.editor_buffer = Some(crate::editor::EditorBuffer::new(&self.editor_lines.join("\n")));
        self.focus = Focus::Editor;
        self.status = format!("Editing {path} — Ctrl+S save · Esc close");
    }

    pub fn clear_input(&mut self) {
        self.bottom_pane.composer.clear();
    }
    fn show_view(&mut self, view: crate::ui::bottom_pane::ViewKind) {
        self.bottom_pane.show(view);
    }
    fn close_view(&mut self, view: crate::ui::bottom_pane::ViewKind) {
        self.bottom_pane.close(view);
    }
    fn view_open(&self, view: crate::ui::bottom_pane::ViewKind) -> bool {
        self.bottom_pane.active() == Some(view)
    }
    fn previous_input(&mut self) {
        if self.bottom_pane.composer.input_history.is_empty() {
            return;
        }
        let index = self
            .bottom_pane.composer.history_index
            .unwrap_or(self.bottom_pane.composer.input_history.len())
            .saturating_sub(1);
        self.bottom_pane.composer.input = self.bottom_pane.composer.input_history[index].clone();
        self.bottom_pane.composer.cursor_position = self.bottom_pane.composer.input.chars().count();
        self.bottom_pane.composer.history_index = Some(index);
    }

    fn next_input(&mut self) {
        let Some(index) = self.bottom_pane.composer.history_index else {
            return;
        };
        if index + 1 < self.bottom_pane.composer.input_history.len() {
            self.bottom_pane.composer.input = self.bottom_pane.composer.input_history[index + 1].clone();
            self.bottom_pane.composer.cursor_position = self.bottom_pane.composer.input.chars().count();
            self.bottom_pane.composer.history_index = Some(index + 1);
        } else {
            self.clear_input();
        self.bottom_pane.composer.history_index = None;
        }
    }
}

/// Handle TUI slash commands (e.g. /model). Returns true if the command was
/// handled locally and should not be sent to the agent.
fn handle_slash_command(
    input: &str,
    app: &mut App,
    state: &Arc<Mutex<AgentState>>,
    router: &LlmRouter,
    auto_test_tx: Option<&mpsc::Sender<AutoTestProbeEvent>>,
) -> bool {
    let cmd = input.split_whitespace().next().unwrap_or("");
    match cmd {
        "/auto" => {
            let sub = input.trim_start_matches("/auto").trim();
            let arg = if sub.is_empty() {
                "auto".to_string()
            } else {
                format!("auto {sub}")
            };
            set_active_model(app, state, router, &arg, auto_test_tx);
            true
        }
        "/reset" => {
            state.lock().unwrap().reset();
            app.messages.clear();
            app.add_message("System", "Session reset.");
            app.status = "Ready · Enter to send · ↑/↓ history · PgUp/PgDn scroll · mouse wheel · Esc interrupt".into();
            true
        }
        "/status" => {
            let st = state.lock().unwrap();
            let out = format!(
                "model: {}\nprovider: {}\ndir: {}\ncontext tokens: {}",
                app.model,
                app.provider,
                st.config.workspace_dir.display(),
                st.session.estimated_tokens()
            );
            app.add_message("System", &out);
            true
        }
        "/info" => {
            let st = state.lock().unwrap();
            update_info_sections(app, &st);
            drop(st);
            app.show_view(crate::ui::bottom_pane::ViewKind::Info);
            app.status = "Workspace info — ↑/↓ navigate · Enter toggle · Esc close".into();
            true
        }
        cmd if cmd == "/provider" || cmd.starts_with("/provider ") => {
            let arg = input.trim_start_matches("/provider").trim();
            if arg.is_empty() {
                open_provider_selector(app, "");
            } else {
                let parts: Vec<&str> = arg.split_whitespace().collect();
                if parts.len() >= 2 {
                    let prov = parts[0].to_lowercase();
                    let key = parts[1..].join(" ");
                    if let Err(e) = save_provider_key(&prov, &key) {
                        app.add_message("Error", &format!("Failed to save key: {e}"));
                    } else {
                        app.add_message("System", &format!("✓ API key saved for '{prov}'"));
                        set_active_provider(app, state, router, &prov);
                        open_model_selector(app, state);
                    }
                } else {
                    let prov = parts[0].to_lowercase();
                    let store = crate::providers::ProviderStore::load();
                    let catalog_client = crate::providers::ProviderCatalog::load();
                    let has_key = store.api_key(&prov).is_some()
                        || crate::providers::ProviderStore::resolve_cloud_credentials(&prov, &catalog_client.catalog).is_ok();
                    if has_key {
                        set_active_provider(app, state, router, &prov);
                        open_model_selector(app, state);
                    } else {
                        app.key_input_provider = prov.clone();
                        app.key_input_value = String::new();
                        app.key_input_popup = true;
                        app.status = format!("Enter API key for {prov} (Enter to confirm, Esc to cancel)");
                    }
                }
            }
            true
        }
        cmd if cmd == "/providers" || cmd.starts_with("/providers ") => {
            let arg = input.trim_start_matches("/providers").trim();
            if arg.is_empty() || arg.eq_ignore_ascii_case("list") {
                open_provider_selector(app, "");
            } else if arg.eq_ignore_ascii_case("show") {
                let store = crate::providers::ProviderStore::load();
                let mut out = format!("Configured cloud providers ({}):\n", crate::providers::ProviderStore::config_path_display());
                for (pid, entry) in &store.providers {
                    let key_preview = entry.api_key.as_deref().map(crate::providers::mask_key).unwrap_or_else(|| "—".into());
                    out.push_str(&format!("  • {:<14} key: {:<12} enabled: {}\n", pid, key_preview, entry.enabled));
                }
                app.add_message("System", &out);
            } else if arg.starts_with("set ") {
                let rest = arg.trim_start_matches("set ").trim();
                let parts: Vec<&str> = rest.split_whitespace().collect();
                if parts.len() >= 2 {
                    let prov = parts[0].to_lowercase();
                    let key = parts[1..].join(" ");
                    if let Err(e) = save_provider_key(&prov, &key) {
                        app.add_message("Error", &format!("Failed to save key: {e}"));
                    } else {
                        app.add_message("System", &format!("✓ API key saved for '{prov}'"));
                        set_active_provider(app, state, router, &prov);
                        open_model_selector(app, state);
                    }
                } else {
                    app.add_message("Error", "Usage: /providers set <provider> <api-key>");
                }
            } else {
                open_provider_selector(app, arg);
            }
            true
        }
        cmd if cmd == "/key" || cmd.starts_with("/key ") => {
            let arg = input.trim_start_matches("/key").trim();
            if arg.is_empty() {
                app.key_input_provider = app.provider.clone();
                app.key_input_value = String::new();
                app.key_input_popup = true;
                app.status = format!("Enter API key for {} (Enter to confirm, Esc to cancel)", app.provider);
            } else {
                let parts: Vec<&str> = arg.split_whitespace().collect();
                let (prov, key) = if parts.len() >= 2 {
                    (parts[0].to_lowercase(), parts[1..].join(" "))
                } else {
                    (app.provider.clone(), parts[0].to_string())
                };
                if let Err(e) = save_provider_key(&prov, &key) {
                    app.add_message("Error", &format!("Failed to save key: {e}"));
                } else {
                    app.add_message("System", &format!("✓ API key saved for '{prov}'"));
                    set_active_provider(app, state, router, &prov);
                    open_model_selector(app, state);
                }
            }
            true
        }
        cmd if cmd == "/model" || cmd.starts_with("/model ") => {
            let arg = input.trim_start_matches("/model").trim();
            if arg.is_empty() {
                open_model_selector(app, state);
            } else {
                set_active_model(app, state, router, arg, auto_test_tx);
            }
            true
        }
        "/resume" | "/continue" => {
            let mut st = state.lock().unwrap();
            let workspace = st.config.workspace_dir.display().to_string();
            match st.long_memory.latest_session(&workspace) {
                Ok(Some(id)) => match st.load_session_into_state(id) {
                    Ok(count) => {
                        drop(st);
                        app.messages.clear();
                        let s = state.lock().unwrap();
                        for (role, content) in s.session.history() {
                            app.add_message(&display_role(&role), &content);
                        }
                        app.add_message(
                            "System",
                            &format!("✓ Resumed session {id} ({count} messages restored)"),
                        );
                    }
                    Err(e) => app.add_message("Error", &format!("Failed to load session: {e}")),
                },
                Ok(None) => {
                    app.add_message("System", "No previous session found for this workspace.")
                }
                Err(e) => app.add_message("Error", &format!("Failed to query sessions: {e}")),
            }
            true
        }
        "/help" => {
            let cmds: Vec<&str> = SLASH_COMMANDS.iter().map(|(c, _)| *c).collect();
            app.add_message(
                "System",
                &format!(
                    "Commands: {}\nKeys: PgUp/PgDn scroll · ↑/↓ 3-line scroll · mouse wheel · Ctrl+L clear · Esc interrupt/quit",
                    cmds.join(" · ")
                ),
            );
            true
        }
        "/plan" => {
            app.agent_mode = match app.agent_mode {
                AgentMode::Agent => AgentMode::Plan,
                AgentMode::Plan => AgentMode::Agent,
            };
            let mode_str = match app.agent_mode {
                AgentMode::Agent => "agent (tool-use)",
                AgentMode::Plan => "plan (planner-first)",
            };
            app.add_message("System", &format!("Mode: {}", mode_str));
            app.status = format!("Ready · mode: {} · Esc interrupt", mode_str);
            true
        }
        "/context" => {
            let st = state.lock().unwrap();
            let used = st.session.estimated_tokens();
            let max = st.config.max_context_tokens;
            app.add_message(
                "Context",
                &format!("tokens: {used}/{max} · files: {} · model: {}", st.session.file_count(), app.model),
            );
            true
        }
        "/compact" => {
            let mut st = state.lock().unwrap();
            let before = st.session.estimated_tokens();
            st.session.compact(format!("Manual local compaction at {before} estimated tokens."));
            let after = st.session.estimated_tokens();
            drop(st);
            app.add_message("Context", &format!("Compacted transcript: {before} → {after} estimated tokens."));
            true
        }
        "/permissions" => {
            let subcommand = input.trim_start_matches("/permissions").trim();
            if subcommand.eq_ignore_ascii_case("clear") {
                if let Some(approvals) = &app.session_approvals {
                    if let Ok(mut scopes) = approvals.lock() {
                        scopes.clear();
                    }
                }
                app.approval_scopes.clear();
                let _ = persist_approval_scopes(state, &app.approval_scopes);
                app.add_message("Permissions", "Session approval scopes revoked.");
                return true;
            }
            let st = state.lock().unwrap();
            let active = if app.approval_scopes.is_empty() {
                "none".to_string()
            } else {
                app.approval_scopes.join(" | ")
            };
            app.add_message(
                "Permissions",
                &format!("write: {:?} · command: {:?}", st.config.write_tool_policy, st.config.command_tool_policy),
            );
            app.add_message("Permissions", &format!("session approvals: {active}"));
            true
        }
        "/tools" => {
            app.add_message("Tools", "Native: read_file, write_file, edit_file, apply_patch, run_command, run_tests, search, web_fetch, web_search, todo, task, verify");
            true
        }
        cmd if cmd == "/theme" || cmd.starts_with("/theme ") => {
            let theme = input.trim_start_matches("/theme").trim();
            let theme = if theme.is_empty() { "default" } else { theme };
            app.status = format!("Theme: {theme}");
            app.add_message("Theme", &format!("Theme selected: {theme}"));
            true
        }
        cmd if cmd == "/add-dir" || cmd.starts_with("/add-dir ") => {
            let path = input.trim_start_matches("/add-dir").trim();
            if path.is_empty() {
                app.add_message("Error", "Usage: /add-dir <path>");
            } else {
                let mut st = state.lock().unwrap();
                st.config.path_allowlist.push(path.to_string());
                app.add_message("Permissions", &format!("Additional directory allowed for this session: {path}"));
            }
            true
        }
        cmd if cmd == "/find" || cmd.starts_with("/find ") => {
            let rest = input.trim_start_matches("/find").trim();
            if rest.is_empty() {
                app.add_message("Editor", "Usage: /find <text> [--ignore-case] [--whole-word] [--regex]");
            } else if let Some(buffer) = app.editor_buffer.as_ref() {
                let mut pattern_parts = Vec::new();
                let mut opts = crate::tools::find_replace::FindOptions::default();
                for part in rest.split_whitespace() {
                    match part {
                        "--ignore-case" => opts.match_case = false,
                        "--whole-word" => opts.whole_word = true,
                        "--regex" => opts.regex = true,
                        _ => pattern_parts.push(part),
                    }
                }
                let pattern = pattern_parts.join(" ");
                let matches = crate::tools::find_replace::find_all(&buffer.text(), &pattern, opts);
                let summary = matches.iter().take(20).map(|m| format!("{}:{}", m.line, m.col)).collect::<Vec<_>>().join(", ");
                app.add_message("Editor", &format!("{} match(es){}", matches.len(), if summary.is_empty() { String::new() } else { format!(": {summary}") }));
            } else {
                app.add_message("Editor", "Open a file first with Ctrl+P.");
            }
            true
        }
        cmd if cmd == "/replace" || cmd.starts_with("/replace ") => {
            let rest = input.trim_start_matches("/replace").trim();
            let Some((old, new)) = rest.split_once("=>") else {
                app.add_message("Editor", "Usage: /replace <old> => <new>");
                return true;
            };
            let old = old.trim();
            let new = new.trim();
            if old.is_empty() {
                app.add_message("Editor", "The search text cannot be empty.");
            } else if let Some(mut buffer) = app.editor_buffer.take() {
                let count = buffer.replace_all(old, new, crate::tools::find_replace::FindOptions::default());
                app.editor_lines = buffer.lines().to_vec();
                app.editor_dirty |= count > 0;
                app.editor_buffer = Some(buffer);
                app.add_message("Editor", &format!("Replaced {count} occurrence(s)."));
            } else {
                app.add_message("Editor", "Open a file first with Ctrl+P.");
            }
            true
        }
        _ => false,
    }
}

/// Dedupe a model id list while preserving order (used by the model pickers).
fn unique_model_ids(items: Vec<String>) -> Vec<String> {
    let mut seen = std::collections::HashSet::new();
    items
        .into_iter()
        .filter(|m| seen.insert(m.clone()))
        .collect()
}

/// Return the ranked display name for a model base ID, or the ID itself
/// if not in the top list.  Used for the NVIDIA provider's best-model picker.
fn ranked_model_name(base_id: &str) -> String {
    match base_id {
        "glm-5.2" => "GLM-5.2".into(),
        "qwen3.5-397b-a17b" => "Qwen3.5-397B-A17B".into(),
        "deepseek-v4-pro" => "DeepSeek-V4-Pro".into(),
        "kimi-k2.6" => "Kimi-K2.6".into(),
        "minimax-m3" => "MiniMax-M3".into(),
        "nemotron-3-ultra-550b-a55b" => "Nemotron-3-Ultra-550B-A55B".into(),
        _ => base_id.to_string(),
    }
}

/// Return the rank position of a model base ID in the NVIDIA best-model list.
/// Models not in the list sort last.
fn ranked_model_order(base_id: &str) -> usize {
    match base_id {
        "glm-5.2" => 0,
        "qwen3.5-397b-a17b" => 1,
        "deepseek-v4-pro" => 2,
        "kimi-k2.6" => 3,
        "minimax-m3" => 4,
        "nemotron-3-ultra-550b-a55b" => 5,
        _ => usize::MAX,
    }
}

/// Clean and shorten a file/folder path for display in TUI headers and footers.
/// Strips Windows verbatim prefixes (`\\?\`), normalizes directory separators,
/// replaces user home directory with `~`, and shortens with `…/` if needed.
pub fn clean_display_path(path: &str, max_width: usize) -> String {
    if path.is_empty() {
        return String::new();
    }
    let mut s = path.trim();
    // Strip Windows verbatim / extended-length path prefix \\?\ and \\?\UNC\
    if let Some(stripped) = s.strip_prefix(r"\\?\UNC\") {
        s = stripped;
    } else if let Some(stripped) = s.strip_prefix(r"\\?\") {
        s = stripped;
    } else if let Some(stripped) = s.strip_prefix(r"\??\") {
        s = stripped;
    }

    let mut path_str = s.to_string();

    // Replace user home with ~
    if let Some(home) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
        let home_str = home.to_string_lossy().to_string();
        let clean_home = home_str.trim_start_matches(r"\\?\").trim_end_matches(['/', '\\']);
        if !clean_home.is_empty() {
            #[cfg(windows)]
            let starts = path_str.to_lowercase().starts_with(&clean_home.to_lowercase());
            #[cfg(not(windows))]
            let starts = path_str.starts_with(clean_home);

            if starts {
                let tail = &path_str[clean_home.len()..];
                let tail = tail.trim_start_matches(['/', '\\']);
                if tail.is_empty() {
                    path_str = "~".to_string();
                } else {
                    path_str = format!("~/{tail}");
                }
            }
        }
    }

    // Convert backslashes to forward slashes for clean modern UI look
    path_str = path_str.replace('\\', "/");

    if max_width > 0 && display_width(&path_str) > max_width {
        let parts: Vec<&str> = path_str.split('/').collect();
        if parts.len() > 2 {
            let tail = parts[parts.len().saturating_sub(2)..].join("/");
            let shortened = format!("…/{tail}");
            if display_width(&shortened) <= max_width {
                return shortened;
            }
        }
        truncate_str(&path_str, max_width)
    } else {
        path_str
    }
}

/// Safely execute an async future synchronously without panicking if already inside a Tokio runtime.
fn block_on_async<F: std::future::Future>(fut: F) -> F::Output {
    crate::async_rt::block_on(fut)
}

fn auto_test_cache_path() -> std::path::PathBuf {
    if let Some(home) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
        std::path::PathBuf::from(home)
            .join(".gemini")
            .join("antigravity-cli")
            .join("last_auto_test.json")
    } else {
        std::env::temp_dir().join("last_auto_test.json")
    }
}

pub fn load_auto_test_record() -> Option<crate::llm::router::AutoTestRecord> {
    let p = auto_test_cache_path();
    let data = std::fs::read_to_string(p).ok()?;
    crate::json::from_str(&data).ok().and_then(|value| crate::llm::router::AutoTestRecord::from_json(&value).ok())
}

pub fn save_auto_test_record(record: &crate::llm::router::AutoTestRecord) {
    let p = auto_test_cache_path();
    if let Some(parent) = p.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = std::fs::write(p, crate::json::to_string(&record.to_json()));
}

fn format_auto_test_scene(record: &crate::llm::router::AutoTestRecord) -> String {
    let mut out = String::new();
    out.push_str(&format!(
        "Κ [Auto Mode — Cena do Último Teste de Disponibilidade]\n✦ Provedor: {}\n✦ Registro/Timestamp: {}\n✦ Candidatos Probed ({} modelos):\n",
        record.provider,
        record.timestamp,
        record.results.len()
    ));

    for res in &record.results {
        let is_winner = res.model == record.selected_model && res.success;
        let winner_tag = if is_winner { " [Vencedor]" } else { "" };
        if res.success {
            out.push_str(&format!(
                "  ✓ {} — {}ms (200 OK){}\n",
                res.model, res.latency_ms, winner_tag
            ));
        } else {
            let err = res.error.as_deref().unwrap_or("Failed");
            out.push_str(&format!("  ✗ {} — {}\n", res.model, err));
        }
    }

    out.push_str(&format!(
        "└── Modelo Ativo Selecionado por Padrão: {} (latência {}ms)",
        record.selected_model, record.selected_latency_ms
    ));

    out
}

// Save an API key for a provider to ProviderStore and GlobalSettings and set in env.
fn save_provider_key(provider: &str, key: &str) -> crate::error::Result<()> {
    let mut store = crate::providers::ProviderStore::load();
    store.set_key(provider, key);
    store.save()?;

    let catalog_client = crate::providers::ProviderCatalog::load();
    let env_name = catalog_client
        .catalog
        .get(provider)
        .and_then(|p| p.env.first().map(|s| s.as_str()))
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("{}_API_KEY", provider.to_uppercase().replace('-', "_")));

    let mut globals = crate::config::GlobalSettings::load();
    globals.set_env(&env_name, key);
    let _ = globals.save();
    std::env::set_var(&env_name, key);
    Ok(())
}

/// Open the provider selector popup with status indicator for configured keys.
fn open_provider_selector(app: &mut App, filter_query: &str) {
    app.show_view(crate::ui::bottom_pane::ViewKind::Provider);
    let catalog = crate::providers::ProviderCatalog::load();
    let store = crate::providers::ProviderStore::load();
    let env_detected = crate::providers::ProviderStore::detect_env_keys(&catalog.catalog);
    let env_providers: std::collections::HashSet<String> = env_detected
        .into_iter()
        .map(|(p, _, _)| p)
        .collect();

    let mut provs: Vec<(String, String, usize, bool)> = catalog
        .catalog
        .iter()
        .map(|(pid, p)| {
            let n = p
                .models
                .values()
                .filter(|m| m.modalities.output.is_empty() || m.modalities.output.iter().any(|o| o == "text"))
                .count();
            let has_key = store.api_key(pid).is_some() || env_providers.contains(pid);
            (pid.clone(), p.name.clone(), n, has_key)
        })
        .collect();

    if !filter_query.is_empty() {
        let q = filter_query.to_lowercase();
        provs.retain(|(pid, name, _, _)| {
            pid.to_lowercase().contains(&q) || name.to_lowercase().contains(&q)
        });
    }

    // Configured providers first (alphabetically), then unconfigured (alphabetically)
    provs.sort_by(|a, b| {
        b.3.cmp(&a.3)
            .then_with(|| a.1.to_lowercase().cmp(&b.1.to_lowercase()))
    });

    if provs.is_empty() && filter_query.is_empty() {
        // Keep the picker useful while offline or before models.dev has a
        // cache. These entries are display-only; selecting one still uses
        // the normal provider/model configuration path.
        let provider_items = vec![
            "openrouter     — OpenRouter              (catalog offline) ◇ [no key]".into(),
            "nvidia         — NVIDIA NIM              (catalog offline) ◇ [no key]".into(),
        ];
        app.bottom_pane.provider.replace(provider_items, 0);
        app.show_view(crate::ui::bottom_pane::ViewKind::Provider);
    } else if provs.is_empty() {
        let msg = if filter_query.is_empty() {
            "No cloud providers found (offline or none discovered).".to_string()
        } else {
            format!("No provider matches \"{filter_query}\".")
        };
        app.add_message("System", &msg);
    } else {
        let provider_items = provs
            .iter()
            .map(|(pid, name, n, has_key)| {
                let key_tag = if *has_key {
                    "✓ [key set]"
                } else {
                    "○ [no key]"
                };
                format!("{:<14} — {:<22} ({n} models) {key_tag}", pid, name)
            })
            .collect::<Vec<_>>();
        let provider_selected = provider_items
            .iter()
            .position(|s| {
                let id = s.split(" — ").next().unwrap_or(s).trim();
                id.eq_ignore_ascii_case(&app.provider)
            })
            .unwrap_or(0);
        app.bottom_pane.provider.replace(provider_items, provider_selected);
        app.show_view(crate::ui::bottom_pane::ViewKind::Provider);
    }
}

/// Open the model selector popup with local models + all available models for the active cloud provider.
fn open_model_selector(app: &mut App, state: &Arc<Mutex<AgentState>>) {
    app.bottom_pane.show(crate::ui::bottom_pane::ViewKind::Model);
    let st = state.lock().unwrap();
    let local = crate::llm::model_resolver::list_models(&st.config.models_dir);
    let dir = st.config.models_dir.clone();
    drop(st);

    let provider = app.provider.clone();
    let catalog = crate::providers::ProviderCatalog::load();
    let mut prov_models = catalog.provider_models(&provider);

    let cloud_items: Vec<String> = if provider == "nvidia" {
        let mut cloud_ranked: Vec<(usize, String)> = prov_models
            .into_iter()
            .filter(|m| m.modalities.output.is_empty() || m.modalities.output.iter().any(|o| o == "text"))
            .map(|m| {
                let base = crate::providers::base_id(&m.id);
                let display = ranked_model_name(&base);
                (ranked_model_order(&base), display)
            })
            .collect();
        cloud_ranked.sort_by_key(|(rank, _)| *rank);
        cloud_ranked
            .into_iter()
            .map(|(_, name)| format!("{} [cloud]", name))
            .collect()
    } else {
        // For all other cloud providers: sort tool-capable on top, then by name
        prov_models.sort_by(|a, b| {
            b.tool_call
                .cmp(&a.tool_call)
                .then_with(|| a.id.to_lowercase().cmp(&b.id.to_lowercase()))
        });
        prov_models
            .into_iter()
            .filter(|m| m.modalities.output.is_empty() || m.modalities.output.iter().any(|o| o == "text"))
            .map(|m| {
                let tool_tag = if m.tool_call { "" } else { " (no-tools)" };
                format!("{}{} [cloud]", m.id, tool_tag)
            })
            .collect()
    };

    let mut items: Vec<String> = local.clone();
    if provider == "nvidia" {
        items.push("auto".into());
    }
    items.extend(unique_model_ids(cloud_items));
    items.dedup();

    if items.is_empty() && provider == "openrouter" {
        // Offline fallback keeps Ctrl+P/provider selection discoverable.
        app.bottom_pane.model.replace(vec!["openrouter/auto [cloud]".into()], 0);
        app.show_view(crate::ui::bottom_pane::ViewKind::Model);
    } else if items.is_empty() {
        app.add_message(
            "System",
            &format!(
                "No catalog models found for provider '{}' in {}. Use /model <name> to set model ID directly.",
                provider,
                dir.display()
            ),
        );
        app.status =
            "Ready · Enter to send · ↑/↓ history · PgUp/PgDn scroll · mouse wheel · Esc interrupt".into();
    } else {
        let model_selected = items
            .iter()
            .position(|m| {
                let trimmed = m
                    .trim_end_matches(" [cloud]")
                    .trim_end_matches(" (no-tools)")
                    .trim();
                trimmed.eq_ignore_ascii_case(&app.model)
            })
            .unwrap_or(0);
        app.bottom_pane.model.replace(items, model_selected);
        app.show_view(crate::ui::bottom_pane::ViewKind::Model);
    }
}

fn pinned_candidate_models(provider: &str, state: &Arc<Mutex<AgentState>>) -> Vec<String> {
    let catalog = crate::providers::ProviderCatalog::load();
    let cloud_candidates: Vec<String> = catalog
        .provider_models(provider)
        .into_iter()
        .filter(|m| m.modalities.output.is_empty() || m.modalities.output.iter().any(|o| o == "text"))
        .filter(|m| {
            if provider == "nvidia" {
                let base = crate::providers::base_id(&m.id);
                matches!(
                    base.as_str(),
                    "glm-5.2"
                        | "qwen3.5-397b-a17b"
                        | "deepseek-v4-pro"
                        | "kimi-k2.6"
                        | "minimax-m3"
                        | "nemotron-3-ultra-550b-a55b"
                )
            } else {
                m.tool_call
            }
        })
        .map(|m| crate::providers::base_id(&m.id))
        .collect();

    let mut candidates = unique_model_ids(cloud_candidates);
    if candidates.is_empty() {
        let st = state.lock().unwrap();
        let local = crate::llm::model_resolver::list_models(&st.config.models_dir);
        if !local.is_empty() {
            candidates = local;
        } else {
            candidates = vec![
                "glm-5.2".into(),
                "qwen3.5-397b-a17b".into(),
                "deepseek-v4-pro".into(),
                "kimi-k2.6".into(),
                "minimax-m3".into(),
            ];
        }
    }
    candidates
}

fn start_async_auto_test(
    app: &mut App,
    state: &Arc<Mutex<AgentState>>,
    router: &LlmRouter,
    auto_test_tx: mpsc::Sender<AutoTestProbeEvent>,
) {
    app.auto_model = true;
    app.auto_test_popup = false;
    app.auto_test_running = true;
    app.auto_test_live_results.clear();
    app.auto_test_current_candidate = None;

    let provider = app.provider.clone();
    let candidates = pinned_candidate_models(&provider, state);

    app.add_message(
        "System",
        &format!("Τ [Auto Mode Test] Executando novo teste de disponibilidade em tempo real nos modelos fixados ({})…", candidates.join(", ")),
    );
    app.status = format!(
        "Testing availability across {} pinned models…",
        candidates.len()
    );

    let router_clone = router.clone();
    let provider_clone = provider.clone();
    thread::spawn(move || {
        let total = candidates.len();
        let mut results = Vec::new();
        let mut best: Option<(String, u128)> = None;

        for (idx, candidate) in candidates.into_iter().enumerate() {
            let index = idx + 1;
            let _ = auto_test_tx.send(AutoTestProbeEvent::ProbeStarted {
                model: candidate.clone(),
                index,
                total,
            });

            let res = block_on_async(router_clone.test_model_availability(&candidate));
            match res {
                Ok(dur) => {
                    let ms = dur.as_millis();
                    let item = crate::llm::router::AutoTestProbeResult {
                        model: candidate.clone(),
                        latency_ms: ms,
                        success: true,
                        error: None,
                    };
                    results.push(item);
                    let _ = auto_test_tx.send(AutoTestProbeEvent::ProbeSuccess {
                        model: candidate.clone(),
                        latency_ms: ms,
                        index,
                        total,
                    });
                    match &best {
                        None => best = Some((candidate, ms)),
                        Some((_, best_ms)) => {
                            if ms < *best_ms {
                                best = Some((candidate, ms));
                            }
                        }
                    }
                }
                Err(e) => {
                    let err_msg = e.to_string();
                    let item = crate::llm::router::AutoTestProbeResult {
                        model: candidate.clone(),
                        latency_ms: 0,
                        success: false,
                        error: Some(err_msg.clone()),
                    };
                    results.push(item);
                    let _ = auto_test_tx.send(AutoTestProbeEvent::ProbeFailed {
                        model: candidate,
                        error: err_msg,
                        index,
                        total,
                    });
                }
            }
        }

        let (selected_model, selected_latency_ms) = if let Some((m, lat)) = best {
            (m, lat)
        } else if !results.is_empty() {
            (results[0].model.clone(), 0)
        } else {
            ("glm-5.2".to_string(), 0)
        };

        let timestamp = match std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) {
            Ok(d) => format!("T-unix +{}s", d.as_secs()),
            Err(_) => "Now".to_string(),
        };

        let record = crate::llm::router::AutoTestRecord {
            timestamp,
            provider: provider_clone,
            selected_model,
            selected_latency_ms,
            results,
        };

        let _ = auto_test_tx.send(AutoTestProbeEvent::Complete { record });
    });
}

/// Set the active coder model for subsequent agent turns. Strips the
/// " [cloud]" picker suffix and tells the router whether the model is a cloud
/// model so requests go to the right backend.
fn set_active_model(
    app: &mut App,
    state: &Arc<Mutex<AgentState>>,
    router: &LlmRouter,
    name: &str,
    auto_test_tx: Option<&mpsc::Sender<AutoTestProbeEvent>>,
) {
    let clean = name
        .trim_end_matches(" [cloud]")
        .trim_end_matches(" (no-tools)")
        .trim()
        .to_string();
    let is_force_test =
        clean.contains("test") || clean.contains("refresh") || clean.contains("probe");
    let is_auto_cmd = clean == "auto" || clean.starts_with("auto");
    if is_auto_cmd {
        app.auto_model = true;
        app.auto_test_popup = false;

        if is_force_test {
            if let Some(tx) = auto_test_tx {
                start_async_auto_test(app, state, router, tx.clone());
            } else {
                let candidates = pinned_candidate_models(&app.provider, state);
                let record = block_on_async(router.test_and_rank_models(&candidates));
                save_auto_test_record(&record);
                let best = record.selected_model.clone();
                {
                    let mut st = state.lock().unwrap();
                    st.config.coder_model = best.clone();
                    st.config.planner_model = best.clone();
                    st.config.summarizer_model = best.clone();
                }
                app.model = best.clone();
                app.last_auto_test = Some(record.clone());
                router.set_model(&best);
                let catalog = crate::providers::ProviderCatalog::load();
                if catalog
                    .provider_model_api_id(&app.provider, &best)
                    .is_some()
                {
                    router.mark_cloud(&best);
                }
                let scene = format_auto_test_scene(&record);
                app.add_message("System", &scene);
                app.status = format!(
                    "Ready · model: {best} (auto {}ms) · Esc interrupt",
                    record.selected_latency_ms
                );
            }
            return;
        }

        // Standard `/model auto` or `/auto` without `test`: default to the winning model from the last test!
        let record = app.last_auto_test.clone().or_else(load_auto_test_record);
        if let Some(rec) = record {
            let best = rec.selected_model.clone();
            {
                let mut st = state.lock().unwrap();
                st.config.coder_model = best.clone();
                st.config.planner_model = best.clone();
                st.config.summarizer_model = best.clone();
            }
            app.model = best.clone();
            app.last_auto_test = Some(rec.clone());
            router.set_model(&best);
            let catalog = crate::providers::ProviderCatalog::load();
            if catalog
                .provider_model_api_id(&app.provider, &best)
                .is_some()
            {
                router.mark_cloud(&best);
            }
            app.add_message(
                "System",
                &format!(
                    "✓ Modo auto ativo — Modelo padrão selecionado: {} (latência {}ms baseada no último teste). Use /auto test para executar um novo teste.",
                    rec.selected_model, rec.selected_latency_ms
                ),
            );
            app.status = format!(
                "Ready · model: {best} (auto {}ms) · Esc interrupt",
                rec.selected_latency_ms
            );
        } else if let Some(tx) = auto_test_tx {
            start_async_auto_test(app, state, router, tx.clone());
        } else {
            let candidates = pinned_candidate_models(&app.provider, state);
            let record = block_on_async(router.test_and_rank_models(&candidates));
            save_auto_test_record(&record);
            app.last_auto_test = Some(record.clone());
            app.model = record.selected_model.clone();
        }
        return;
    }
    app.auto_model = false;
    let mut is_cloud = name.ends_with(" [cloud]");
    if !is_cloud {
        // Typed names: resolve against the active provider's catalog so plain
        // cloud ids (e.g. Ollama Cloud "glm-5.2") still route to the cloud.
        let provider = app.provider.clone();
        let catalog = crate::providers::ProviderCatalog::load();
        is_cloud = catalog.provider_model_api_id(&provider, &clean).is_some();
    }
    if is_cloud {
        router.mark_cloud(&clean);
    } else {
        router.unmark_cloud(&clean);
    }
    {
        let mut st = state.lock().unwrap();
        // The selected model drives the whole agent lifecycle (mirrors
        // `--model`, which sets planner/coder/summarizer).  Keeping the
        // planner and summarizer on separate local default models while the
        // coder runs on a cloud model would silently send planning and
        // compaction requests to Ollama.
        st.config.coder_model = clean.clone();
        st.config.planner_model = clean.clone();
        st.config.summarizer_model = clean.clone();
    }
    app.model = clean.clone();
    router.set_model(&clean);
    app.add_message(
        "System",
        &format!(
            "Model set to {clean}{}",
            if is_cloud { " (cloud)" } else { "" }
        ),
    );
    app.status = format!("Ready · model: {clean} · Esc interrupt");
}

/// Set the active cloud provider: rebuilds the router's cloud backend using
/// the provider's API base URL + the configured/env API key.
fn set_active_provider(
    app: &mut App,
    _state: &Arc<Mutex<AgentState>>,
    router: &LlmRouter,
    name: &str,
) {
    match router.set_provider(name) {
        Ok(base) => {
            router.clear_cloud_marks();
            app.provider = name.to_string();
            app.add_message("System", &format!("Cloud provider set to {name} ({base})"));
            app.status = format!("Ready · provider: {name} · run /model to list its models");
        }
        Err(e) => {
            app.add_message("Error", &format!("Provider {name} not configured: {e}"));
            app.status = format!("Provider {name} failed · see error above");
        }
    }
}

/// Current git branch of the workspace, or "no git" when not a repository.
fn git_branch(dir: &std::path::Path) -> String {
    let out = std::process::Command::new("git")
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .current_dir(dir)
        .output();
    match out {
        Ok(o) if o.status.success() => {
            let s = String::from_utf8_lossy(&o.stdout);
            let s = s.trim();
            if s.is_empty() {
                "detached".into()
            } else {
                s.to_string()
            }
        }
        _ => "no git".into(),
    }
}

/// Open/refresh the slash-command picker as the user types. Modern harnesses
/// (Claude Code, Codex) promote commands as soon as the prompt starts with `/`.
fn refresh_command_menu(app: &mut App) {
    let input = app.bottom_pane.composer.input.trim_start();
    let command_token = input.split_whitespace().next().unwrap_or("").to_string();
    let command_open = command_token.starts_with('/') && app.focus == Focus::Input;
    if command_open {
        app.show_view(crate::ui::bottom_pane::ViewKind::Commands);
        let items = SLASH_COMMANDS
            .iter()
            .filter(|(cmd, _)| cmd.to_ascii_lowercase().starts_with(&command_token.to_ascii_lowercase()))
            .map(|(c, d)| (c.to_string(), d.to_string()))
            .collect();
        app.bottom_pane.commands.items = items;
        if app.bottom_pane.commands.selected >= app.bottom_pane.commands.items.len() {
            app.bottom_pane.commands.selected = app.bottom_pane.commands.items.len().saturating_sub(1);
        }
    } else {
        app.bottom_pane.close(crate::ui::bottom_pane::ViewKind::Commands);
    }

}

/// Refresh the lightweight `@` file and `$` context reference picker.
fn refresh_reference_menu(app: &mut App) {
    let input = app.bottom_pane.composer.input.clone();
    let cursor = app.bottom_pane.composer.cursor_position.min(input.chars().count());
    let before = input.chars().take(cursor).collect::<String>();
    let Some((trigger, query)) = before
        .char_indices()
        .rev()
        .find_map(|(index, ch)| {
            if ch == '@' || ch == '$' {
                Some((ch, before[index + ch.len_utf8()..].to_string()))
            } else { None }
        })
    else {
        app.bottom_pane.close(crate::ui::bottom_pane::ViewKind::References);
        return;
    };
    if query.chars().any(char::is_whitespace) {
        app.bottom_pane.close(crate::ui::bottom_pane::ViewKind::References);
        return;
    }
    let mut items = if trigger == '@' {
        app.bottom_pane.file_search.paths.clone()
    } else {
        if app.context_reference_items.is_empty() {
            vec!["AGENTS.md".into(), "CLAUDE.md".into(), ".cursorrules".into(), "CONTEXT.md".into()]
        } else {
            app.context_reference_items.clone()
        }
    };
    items.retain(|item| item.to_ascii_lowercase().contains(&query.to_ascii_lowercase()));
    items.truncate(20);
    if items.is_empty() {
        app.bottom_pane.close(crate::ui::bottom_pane::ViewKind::References);
    } else {
        app.show_view(crate::ui::bottom_pane::ViewKind::References);
        app.bottom_pane.references.trigger = trigger;
        app.bottom_pane.references.items = items;
        app.bottom_pane.references.selected = app.bottom_pane.references.selected
            .min(app.bottom_pane.references.items.len().saturating_sub(1));
    }
}

/// Single routing point for composer editing keys. Modal overlays are handled
/// before this function; editor keys are handled after it, so the composer
/// never competes with another focus target for text-editing events.
#[derive(Debug, PartialEq, Eq)]
enum ComposerRoute {
    Handled,
    Submit(String),
    Unhandled,
}

fn route_composer_edit_key(app: &mut App, key: crate::ui::engine::event::KeyEvent) -> ComposerRoute {
    if app.focus != Focus::Input
        || key.modifiers.contains(KeyModifiers::CONTROL | KeyModifiers::ALT)
    {
        return ComposerRoute::Unhandled;
    }
    match key.code {
        KeyCode::Char(ch) => {
            app.bottom_pane.composer.insert(ch);
            refresh_command_menu(app);
            refresh_reference_menu(app);
            ComposerRoute::Handled
        }
        KeyCode::Backspace => {
            if app.bottom_pane.composer.backspace() {
                refresh_command_menu(app);
                refresh_reference_menu(app);
            }
            ComposerRoute::Handled
        }
        KeyCode::Left => {
            app.bottom_pane.composer.move_left();
            ComposerRoute::Handled
        }
        KeyCode::Right => {
            app.bottom_pane.composer.move_right();
            ComposerRoute::Handled
        }
        KeyCode::Home => {
            app.bottom_pane.composer.move_home();
            ComposerRoute::Handled
        }
        KeyCode::End => {
            app.bottom_pane.composer.move_end();
            ComposerRoute::Handled
        }
        KeyCode::Up => {
            app.previous_input();
            ComposerRoute::Handled
        }
        KeyCode::Down => {
            app.next_input();
            ComposerRoute::Handled
        }
        KeyCode::Enter => {
            let input = app.bottom_pane.composer.input.trim().to_string();
            if input.is_empty() {
                ComposerRoute::Handled
            } else {
                ComposerRoute::Submit(input)
            }
        }
        _ => ComposerRoute::Unhandled,
    }
}

/// Resolve the modal that owns focus. The bottom-pane stack is authoritative.
fn active_view(app: &App) -> Option<crate::ui::bottom_pane::ViewKind> {
    use crate::ui::bottom_pane::ViewKind;
    let valid = |view| match view {
        ViewKind::Commands | ViewKind::References | ViewKind::Model | ViewKind::Provider | ViewKind::Resume
        | ViewKind::FileSearch | ViewKind::Info => true,
        ViewKind::Approval => app.pending_approval.is_some(),
        ViewKind::PlanApproval => app.pending_plan_approval.is_some(),
    };
        if let Some(view) = app.bottom_pane.active() {
        if valid(view) { return Some(view); }
    }
    None
}

/// Submit a user input line: run slash commands locally or spawn the agent turn.
#[allow(clippy::too_many_arguments)]
fn run_input(
    app: &mut App,
    state: &Arc<Mutex<AgentState>>,
    client: &LlmRouter,
    task_tx: &mpsc::Sender<(String, AgentMode)>,
    auto_test_tx: &mpsc::Sender<AutoTestProbeEvent>,
    start: &mut Instant,
    input: &str,
) {
    if input.starts_with('/') && handle_slash_command(input, app, state, client, Some(auto_test_tx))
    {
        app.clear_input();
        return;
    }
    app.add_message("User", input);
    app.bottom_pane.composer.push_history(input);
    app.loading = true;
    app.follow = true;
    app.pending_tasks += 1;
    if app.pending_tasks > 1 {
        app.status = format!("Working… ({} background tasks queued)", app.pending_tasks);
    } else {
        app.status = "Working… (Esc to interrupt)".into();
    }
    *start = Instant::now();
    app.elapsed = Duration::ZERO;
    let _ = task_tx.send((input.to_string(), app.agent_mode));
    app.clear_input();
}

/// Owns a second handle to stdout and restores the terminal to its pre-app
/// state on ANY exit path — normal return, early `?` error, or panic
/// unwinding. Without this, a crash mid-turn leaves the user's terminal stuck
/// in raw mode / the alternate screen until they close the tab.
struct TerminalGuard {
    stdout: io::Stdout,
}

fn approval_scopes_path(state: &Arc<Mutex<AgentState>>) -> Option<std::path::PathBuf> {
    state
        .lock()
        .ok()
        .map(|st| st.config.workspace_dir.join(".chronokairo").join("approval-scopes"))
}

fn load_persisted_approval_scopes(state: &Arc<Mutex<AgentState>>) -> Vec<String> {
    let Some(path) = approval_scopes_path(state) else { return Vec::new() };
    std::fs::read_to_string(path)
        .ok()
        .map(|raw| {
            raw.lines()
                .filter(|line| !line.trim().is_empty())
                .map(|line| line.replace("\\\\", "\\").replace("\\n", "\n"))
                .collect()
        })
        .unwrap_or_default()
}

fn persist_approval_scopes(state: &Arc<Mutex<AgentState>>, scopes: &[String]) -> std::io::Result<()> {
    let Some(path) = approval_scopes_path(state) else { return Ok(()) };
    if scopes.is_empty() {
        match std::fs::remove_file(path) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e),
        }
    } else {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let encoded = scopes
            .iter()
            .map(|scope| scope.replace('\\', "\\\\").replace('\n', "\\n"))
            .collect::<Vec<_>>()
            .join("\n");
        std::fs::write(path, encoded)
    }
}

impl Drop for TerminalGuard {
    fn drop(&mut self) {
        let _ = crate::ui::engine::crossterm::terminal::disable_raw_mode();
        let _ = execute!(self.stdout, LeaveAlternateScreen, DisableMouseCapture, Show);
    }
}

pub fn run_ui(client: LlmRouter, state: AgentState) -> Result<(), Box<dyn Error>> {
    // Setup terminal. The guard is created right after raw mode is enabled so
    // any failure between here and the main loop (EnterAlternateScreen,
    // Terminal::new, early returns) still restores the terminal. It runs on
    // drop: normal exit, propagated error, or panic unwinding.
    enable_raw_mode()?;
    let _guard = TerminalGuard {
        stdout: io::stdout(),
    };
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    // Enable bracketed paste mode (ESC [?2004h)
    let _ = io::stdout().write_all(b"\x1b[?2004h");
    let _ = io::stdout().flush();
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // Create app and event channels
    let model_name = state.config.coder_model.clone();
    let mut initial_app = App::new(&model_name);
    initial_app.dir = state.config.workspace_dir.display().to_string();
    initial_app.git_branch = git_branch(&state.config.workspace_dir);
    // Bring the default cloud provider online (e.g. nvidia with
    // NVIDIA_API_KEY from .env) so cloud models work without the --cloud flag.
    let provider_msg = match client.set_provider(&initial_app.provider) {
        Ok(base) => format!("Cloud provider ready: {} ({base})", initial_app.provider),
        Err(e) => format!(
            "Cloud provider {} not configured: {e}",
            initial_app.provider
        ),
    };
    initial_app.add_message("System", &provider_msg);
    for (role, content) in state.session.history() {
        initial_app.add_message(&display_role(&role), &content);
    }
    let app = Arc::new(Mutex::new(initial_app));
    let state = Arc::new(Mutex::new(state));
    // populate sidebar with workspace files
    {
        let st = state.lock().unwrap();
        let files = st.files.list_files("");
        let root = st.files.workspace_root().to_path_buf();
        let mut a = app.lock().unwrap();
        a.sidebar_items = files;
            a.bottom_pane.file_search.paths = file_search::walk_files(&root);
        a.context_reference_items = vec![
            "AGENTS.md".into(),
            "CLAUDE.md".into(),
            ".cursorrules".into(),
            "CONTEXT.md".into(),
        ];
        a.context_reference_items.extend(
            st.skills
                .list()
                .iter()
                .map(|skill| format!("skill:{}", skill.name)),
        );
        update_info_sections(&mut a, &st);
    }
    let (tx, rx) = mpsc::channel();
    // Agent progress stream + interrupt flag (Esc while loading cancels the turn).
    let (agent_tx, agent_rx) = mpsc::channel::<AgentEvent>();
    // Approval broker: worker → UI requests, UI → worker decisions.
    let (approval_tx, approval_rx) = mpsc::channel::<ApprovalRequest>();
    let (decision_tx, decision_rx) = mpsc::channel::<ApprovalDecision>();
    let decision_rx = Arc::new(Mutex::new(decision_rx));
    // Plan approval broker.
    let (plan_approval_tx, plan_approval_rx) = mpsc::channel::<PlanApprovalRequest>();
    let (plan_decision_tx, plan_decision_rx) = mpsc::channel::<PlanApprovalDecision>();
    let plan_decision_rx = Arc::new(Mutex::new(plan_decision_rx));
    let interrupt = Arc::new(AtomicBool::new(false));
    let (task_tx, task_rx) = mpsc::channel::<(String, AgentMode)>();
    let task_rx = Arc::new(Mutex::new(task_rx));
    let (auto_test_tx, auto_test_rx) = mpsc::channel::<AutoTestProbeEvent>();
    // Claude-style approval memory: an `allow for session` decision applies
    // to later turns, while the worker still receives a fresh hook value.
    let session_approvals = Arc::new(Mutex::new(std::collections::BTreeSet::new()));
    let persisted_scopes = load_persisted_approval_scopes(&state);
    if let Ok(mut approvals) = session_approvals.lock() {
        approvals.extend(persisted_scopes.iter().cloned());
    }
    {
        let mut initial = app.lock().unwrap();
        initial.session_approvals = Some(Arc::clone(&session_approvals));
        initial.approval_scopes = persisted_scopes;
    }
    let mut start = Instant::now();
    // Last terminal size seen by the resize handler, used to clear the screen
    // once per actual resize (crossterm can deliver batches of resize events).
    let mut last_size: (u16, u16) = (0, 0);

    // Spawn worker thread loop to execute background tasks continuously
    {
        let client_worker = client.clone();
        let state_worker = Arc::clone(&state);
        let interrupt_worker = Arc::clone(&interrupt);
        let agent_tx_worker = agent_tx.clone();
        let approval_tx_worker = approval_tx.clone();
        let decision_rx_worker = Arc::clone(&decision_rx);
        let plan_approval_tx_worker = plan_approval_tx.clone();
        let plan_decision_rx_worker = Arc::clone(&plan_decision_rx);
        let task_rx_worker = Arc::clone(&task_rx);
        let session_approvals_worker = Arc::clone(&session_approvals);

        thread::spawn(move || {
            while let Ok((input_text, agent_mode)) = task_rx_worker.lock().unwrap().recv() {
                interrupt_worker.store(false, Ordering::Relaxed);
                let agent_tx_clone = agent_tx_worker.clone();
                let agent_tx_text = agent_tx_worker.clone();
                let approval_tx_clone = approval_tx_worker.clone();
                let approval_rx_clone = Arc::clone(&decision_rx_worker);
                let plan_approval_tx_clone = plan_approval_tx_worker.clone();
                let plan_decision_rx_clone = Arc::clone(&plan_decision_rx_worker);
                let interrupt_clone = Arc::clone(&interrupt_worker);
                let session_approvals_clone = Arc::clone(&session_approvals_worker);

                let hooks = AgentHooks {
                    on_event: Some(Arc::new(move |ev| {
                        let _ = agent_tx_clone.send(ev);
                    })),
                    on_tool_call_delta: None,
                    on_text_delta: Some(Arc::new(move |text| {
                        let _ = agent_tx_text.send(AgentEvent::TextDelta {
                            text: text.to_string(),
                        });
                    })),
                    on_approval: Some(Arc::new(move |request| {
                        if approval_tx_clone.send(request).is_err() {
                            return ApprovalDecision::Deny;
                        }
                        approval_rx_clone
                            .lock()
                            .map(|rx| rx.recv().unwrap_or(ApprovalDecision::Deny))
                            .unwrap_or(ApprovalDecision::Deny)
                    })),
                    on_plan_approval: Some(Arc::new(move |request| {
                        if plan_approval_tx_clone.send(request).is_err() {
                            return PlanApprovalDecision::Deny;
                        }
                        plan_decision_rx_clone
                            .lock()
                            .map(|rx| rx.recv().unwrap_or(PlanApprovalDecision::Deny))
                            .unwrap_or(PlanApprovalDecision::Deny)
                    })),
                    interrupt: Some(interrupt_clone),
                    session_approvals: session_approvals_clone,
                };

                let mut st = state_worker.lock().unwrap();
                block_on_async(crate::agent::agent_loop::run_agent_loop_with_hooks(
                    &client_worker,
                    &mut st,
                    &input_text,
                    &hooks,
                    agent_mode,
                ));
            }
        });
    }

    // Spawn input handling thread
    thread::spawn(move || {
        let tx = tx.clone();
        loop {
            if let Ok(event) = event::read() {
                if tx.send(event).is_err() {
                    break;
                }
            }
        }
    });

    // App loop
    {
        let mut init = app.lock().unwrap();
        init.add_message("System", "ChronoKairo is ready. Type '/' for commands (e.g. /model), ask for a change, or inspect files.");
    }

    loop {
        // Drain agent progress events (tool calls, plan steps, final result).
        let agent_events: Vec<AgentEvent> = agent_rx.try_iter().collect();
        {
            let mut a = app.lock().unwrap();
            for ev in agent_events {
                match ev {
                    AgentEvent::Status(text) => a.status = sanitize_status(&strip_ansi_and_controls(&text)),
                    AgentEvent::ToolCall { name, summary, .. } => {
                        let clean: String = strip_ansi_and_controls(&summary).chars().take(120).collect();
                        a.add_message("Tool", &format!("{name} — {clean}"));
                    }
                    AgentEvent::ToolCallDelta {
                        id: _,
                        index,
                        name,
                        args_delta,
                    } => {
                        let prefix = name.as_deref().unwrap_or("?");
                        let clean = strip_ansi_and_controls(&args_delta);
                        a.feed_tool_delta(index, prefix, &clean);
                    }
                    AgentEvent::ToolResult { name, output, exit_code, timed_out, duration_ms, .. } => {
                        let mut detail = output;
                        if timed_out {
                            detail.push_str(" [timed out]");
                        } else if let Some(code) = exit_code {
                            detail.push_str(&format!(" [exit {code}]"));
                        }
                        detail.push_str(&format!(" [{duration_ms}ms]"));
                        a.add_message("Terminal", &format!("{name}: {detail}"));
                    }
                    AgentEvent::PlanStep {
                        index,
                        total,
                        description,
                    } => {
                        a.add_message("Plan", &format!("[{index}/{total}] {description}"));
                    }
                    AgentEvent::FileChanged { path } => {
                        a.add_message("File", &format!("changed {path}"));
                    }
                    AgentEvent::Verification {
                        status,
                        command,
                        summary,
                    } => {
                        let command = command.unwrap_or_else(|| "auto-detect".into());
                        let clean = strip_ansi_and_controls(&summary);
                        a.add_message("Verify", &format!("[{status}] {command} — {clean}"));
                    }
                    AgentEvent::CompletionAudit { passed, evidence } => {
                        let role = if passed { "Completion" } else { "Error" };
                        let state = if passed { "confirmed" } else { "rejected" };
                        a.add_message(role, &format!("[{state}] {evidence}"));
                    }
                    AgentEvent::ReasoningDelta { text } => {
                        a.feed_reasoning_delta(&text);
                    }
                    AgentEvent::ResetReasoning => {
                        a.reset_reasoning();
                    }
                    AgentEvent::Done { message } => {
                        if !a.end_streaming(Some(&message)) {
                            a.add_message("Assistant", &message);
                        }
                        a.pending_tasks = a.pending_tasks.saturating_sub(1);
                        if a.pending_tasks == 0 {
                            a.loading = false;
                            a.status = "Ready".into();
                        } else {
                            a.status =
                                format!("Working… ({} background tasks queued)", a.pending_tasks);
                        }
                    }
                    AgentEvent::Transaction { action, summary } => {
                        a.add_message("Workspace", &format!("[{action}] {summary}"));
                    }
                    AgentEvent::Routing { summary } => {
                        a.add_message("Router", &summary);
                    }
                    AgentEvent::Failed { message } => {
                        a.end_streaming(None);
                        let clean = strip_ansi_and_controls(&message);
                        a.add_message("Error", &clean);
                        a.loading = false;
                        a.status = "Failed".into();
                    }
                    AgentEvent::Interrupted => {
                        a.end_streaming(None);
                        a.add_message("System", "Turn interrupted by user.");
                        a.loading = false;
                        a.status = "Interrupted".into();
                    }
                    AgentEvent::TextDelta { text } => {
                        a.feed_text_delta(&text);
                    }
                    AgentEvent::TokenUsage {
                        prompt_tokens,
                        completion_tokens,
                        reasoning_tokens,
                        total_tokens,
                    } => {
                        a.token_breakdown.input = prompt_tokens;
                        a.token_breakdown.output = completion_tokens;
                        a.token_breakdown.reasoning = reasoning_tokens;
                        a.tokens = total_tokens;
                        a.context_cost = a.token_breakdown.input as f64 * 0.000003
                            + a.token_breakdown.output as f64 * 0.000012
                            + a.token_breakdown.reasoning as f64 * 0.000001;
                    }
                }
            }
        }
        // Drain real-time auto mode probe events.
        let probe_events: Vec<AutoTestProbeEvent> = auto_test_rx.try_iter().collect();
        if !probe_events.is_empty() {
            let mut a = app.lock().unwrap();
            for ev in probe_events {
                match ev {
                    AutoTestProbeEvent::ProbeStarted {
                        model,
                        index,
                        total,
                    } => {
                        a.auto_test_running = true;
                        a.auto_test_current_candidate = Some((model.clone(), index, total));
                        a.status = format!("Testing availability [{index}/{total}] {model}…");
                    }
                    AutoTestProbeEvent::ProbeSuccess {
                        model, latency_ms, ..
                    } => {
                        a.auto_test_live_results
                            .push(crate::llm::router::AutoTestProbeResult {
                                model,
                                latency_ms,
                                success: true,
                                error: None,
                            });
                    }
                    AutoTestProbeEvent::ProbeFailed { model, error, .. } => {
                        a.auto_test_live_results
                            .push(crate::llm::router::AutoTestProbeResult {
                                model,
                                latency_ms: 0,
                                success: false,
                                error: Some(error),
                            });
                    }
                    AutoTestProbeEvent::Complete { record } => {
                        a.auto_test_running = false;
                        a.auto_test_current_candidate = None;
                        a.last_auto_test = Some(record.clone());
                        save_auto_test_record(&record);

                        let best = record.selected_model.clone();
                        {
                            let mut st = state.lock().unwrap();
                            st.config.coder_model = best.clone();
                            st.config.planner_model = best.clone();
                            st.config.summarizer_model = best.clone();
                        }
                        a.model = best.clone();
                        client.set_model(&best);
                        let catalog = crate::providers::ProviderCatalog::load();
                        if catalog.provider_model_api_id(&a.provider, &best).is_some() {
                            client.mark_cloud(&best);
                        }
                        let scene = format_auto_test_scene(&record);
                        a.add_message("System", &scene);
                        a.status = format!(
                            "Ready · model: {best} (auto {}ms) · Esc interrupt",
                            record.selected_latency_ms
                        );
                    }
                }
            }
        }
        // Surface any pending approval request from the worker.
        if let Ok(request) = approval_rx.try_recv() {
            let mut a = app.lock().unwrap();
            a.status = format!("Approval required: {} · a/s/d", request.tool);
            a.pending_approval = Some(request);
            a.bottom_pane.show(crate::ui::bottom_pane::ViewKind::Approval);
        }
        // Surface any pending plan approval request from the worker.
        if let Ok(request) = plan_approval_rx.try_recv() {
            let mut a = app.lock().unwrap();
            let step_count = request.steps.len();
            a.status = format!("Plan approval required: {} step(s) · a/s/d", step_count);
            a.pending_plan_approval = Some(request);
            a.bottom_pane.show(crate::ui::bottom_pane::ViewKind::PlanApproval);
        }
        // Refresh context budget + workspace diff + elapsed + spinner from shared state.
        // Do not block rendering while the worker owns AgentState for a turn.
        {
            let mut a = app.lock().unwrap();
            if let Ok(st) = state.try_lock() {
                a.tokens = st.session.estimated_tokens();
                let diff = st.last_diff.paths();
                a.modified_files = if diff.is_empty() {
                    vec!["No changes".into()]
                } else {
                    diff
                };
                a.diff_content = st.last_diff.diff_content.clone();
                update_info_sections(&mut a, &st);
            }
            if a.loading {
                a.elapsed = start.elapsed();
                a.spinner_frame = (a.spinner_frame + 1) % SPINNER.len();
            }
        }
        {
            let mut guard = app.lock().unwrap();
            draw(&mut terminal, &mut guard)?;
        }

        match rx.recv_timeout(Duration::from_millis(80)) {
            Ok(Event::Paste(text)) => {
                let mut guard = app.lock().unwrap();
                // Keep paste bounded so one clipboard payload cannot starve
                // rendering or inflate the conversation context.
                const MAX_PASTE_CHARS: usize = 20_000;
                let bounded: String = text.chars().take(MAX_PASTE_CHARS).collect();
                guard.bottom_pane.composer.insert_text(&bounded);
                refresh_reference_menu(&mut guard);
            }
            Ok(Event::Key(key)) => {
                // On Windows, crossterm emits both Press and Release events.
                // Only handle Press (and Repeat for held keys) to avoid double input.
                if key.kind == KeyEventKind::Release {
                    continue;
                }
                let mut guard = app.lock().unwrap();
                // Top-level Universal Ctrl+C handler: works across all popups, overlays, modals, and screens.
                if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('c') {
                    if guard.quit_pending {
                        break;
                    }
                    guard.quit_pending = true;
                    if guard.loading {
                        interrupt.store(true, Ordering::Relaxed);
                    }
                    guard.auto_test_running = false;
                    guard.auto_test_popup = false;
                    guard.close_view(crate::ui::bottom_pane::ViewKind::Info);
                    guard.close_view(crate::ui::bottom_pane::ViewKind::FileSearch);
                    guard.close_view(crate::ui::bottom_pane::ViewKind::Commands);
                    guard.close_view(crate::ui::bottom_pane::ViewKind::Model);
                    guard.close_view(crate::ui::bottom_pane::ViewKind::Provider);
                    guard.key_input_popup = false;
                    guard.key_input_value.clear();
                    guard.close_view(crate::ui::bottom_pane::ViewKind::Resume);
                    guard.bottom_pane = crate::ui::bottom_pane::BottomPane::default();
                    guard.pending_approval = None;
                    guard.status = "Press Ctrl+C again to quit".into();
                    continue;
                } else {
                    guard.quit_pending = false;
                }

                // Key input modal captures typing for configuring API keys
                if guard.key_input_popup {
                    match key.code {
                        KeyCode::Char(c) => {
                            guard.key_input_value.push(c);
                        }
                        KeyCode::Backspace => {
                            guard.key_input_value.pop();
                        }
                        KeyCode::Tab => {
                            if guard.view_open(crate::ui::bottom_pane::ViewKind::Commands) {
                                if let Some((command, _)) = guard
                                    .bottom_pane
                                    .commands
                                    .items
                                    .get(guard.bottom_pane.commands.selected)
                                    .cloned()
                                {
                                    guard.bottom_pane.composer.input = command;
                                    guard.bottom_pane.composer.cursor_position =
                                        guard.bottom_pane.composer.input.chars().count();
                                    refresh_command_menu(&mut guard);
                                }
                            }
                        }
                        KeyCode::Enter => {
                            let key_val = guard.key_input_value.trim().to_string();
                            let prov = guard.key_input_provider.clone();
                            guard.key_input_popup = false;
                            guard.key_input_value.clear();
                            if !key_val.is_empty() {
                                if let Err(e) = save_provider_key(&prov, &key_val) {
                                    guard.add_message("Error", &format!("Failed to save key: {e}"));
                                } else {
                                    guard.add_message("System", &format!("✓ API key saved for '{prov}'"));
                                    set_active_provider(&mut guard, &state, &client, &prov);
                                    open_model_selector(&mut guard, &state);
                                }
                            }
                        }
                        KeyCode::Esc => {
                            guard.key_input_popup = false;
                            guard.key_input_value.clear();
                            guard.status = "API key configuration cancelled.".into();
                        }
                        _ => {}
                    }
                    continue;
                }

                // The approval modal only captures explicit decisions.
                if guard.pending_approval.is_some() {
                    let decision = match key.code {
                        KeyCode::Char('a') => Some(ApprovalDecision::AllowOnce),
                        KeyCode::Char('s') => Some(ApprovalDecision::AllowSession),
                        KeyCode::Char('d') | KeyCode::Esc => Some(ApprovalDecision::Deny),
                        _ => None,
                    };
                    if let Some(decision) = decision {
                        let request = guard.pending_approval.take();
                        let label = match decision {
                            ApprovalDecision::AllowOnce => "allowed once",
                            ApprovalDecision::AllowSession => "allowed for session",
                            ApprovalDecision::Deny => "denied",
                        };
                        if let Some(request) = request {
                            if decision == ApprovalDecision::AllowSession {
                                let scope = format!("{}\n{}", request.tool, request.summary);
                                if !guard.approval_scopes.contains(&scope) {
                                    guard.approval_scopes.push(scope);
                                }
                                let _ = persist_approval_scopes(&state, &guard.approval_scopes);
                            }
                            guard.add_message("Approval", &format!("{} — {label}", request.tool));
                        }
                        guard.bottom_pane.close(crate::ui::bottom_pane::ViewKind::Approval);
                        guard.status = "Working…".into();
                        let _ = decision_tx.send(decision);
                        continue;
                    }
                }
                // The plan approval modal only captures explicit decisions.
                if guard.pending_plan_approval.is_some() {
                    let decision = match key.code {
                        KeyCode::Char('a') | KeyCode::Char('s') => {
                            Some(PlanApprovalDecision::Approve)
                        }
                        KeyCode::Char('d') | KeyCode::Esc => Some(PlanApprovalDecision::Deny),
                        _ => None,
                    };
                    if let Some(decision) = decision {
                        let request = guard.pending_plan_approval.take();
                        let label = match decision {
                            PlanApprovalDecision::Approve => "approved",
                            PlanApprovalDecision::Deny => "denied",
                        };
                        if let Some(request) = request {
                            guard.add_message(
                                "Plan",
                                &format!("Plan {label} ({} steps)", request.steps.len()),
                            );
                        }
                        guard.bottom_pane.close(crate::ui::bottom_pane::ViewKind::PlanApproval);
                        guard.status = "Working…".into();
                        let _ = plan_decision_tx.send(decision);
                        continue;
                    }
                }
                if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('l') {
                    guard.messages.clear();
                    guard.status = "Chat cleared (session memory is preserved).".into();
                    continue;
                }
                // Ctrl+P: toggle the fuzzy file-search overlay.
                if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('p') {
                if guard.view_open(crate::ui::bottom_pane::ViewKind::FileSearch) {
                    guard.close_view(crate::ui::bottom_pane::ViewKind::FileSearch);
                        guard.bottom_pane.close(crate::ui::bottom_pane::ViewKind::FileSearch);
                    } else {
                    let paths = guard.bottom_pane.file_search.paths.clone();
                        guard.open_file_search(paths);
                    }
                    continue;
                }
                // Ctrl+T: toggle reasoning panel expand/collapse.
                if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('t') {
                    guard.reasoning_expanded = !guard.reasoning_expanded;
                    continue;
                }
                // Ctrl+O: toggle tool call details expand/collapse.
                if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('o') {
                    guard.tool_calls_expanded = !guard.tool_calls_expanded;
                    continue;
                }
                // Ctrl+E: toggle tool call timeline expand/collapse.
                if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('e') {
                    guard.tool_calls_expanded = !guard.tool_calls_expanded;
                    continue;
                }
                // Ctrl+R: toggle compact/expanded view.
                if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('r') {
                    if guard.focus == Focus::Input {
                        let query = guard.bottom_pane.composer.input.clone();
                        if guard.bottom_pane.composer.search_history(&query) {
                            refresh_command_menu(&mut guard);
                            guard.status = "History match loaded".into();
                        } else {
                            guard.status = "No matching history entry".into();
                        }
                        continue;
                    }
                    guard.tool_calls_expanded = !guard.tool_calls_expanded;
                    guard.reasoning_expanded = !guard.reasoning_expanded;
                    continue;
                }
                // Ctrl+Shift+C: copy last assistant message to clipboard (OSC 52)
                if key
                    .modifiers
                    .contains(KeyModifiers::CONTROL | KeyModifiers::SHIFT)
                    && key.code == KeyCode::Char('c')
                {
                    if let Some((_, content)) =
                        guard.messages.iter().rev().find(|(r, _)| r == "Assistant")
                    {
                        copy_to_clipboard(content);
                        guard.status = format!("Copied {} chars to clipboard", content.len());
                    } else {
                        guard.status = "No assistant message to copy".into();
                    }
                    continue;
                }
                // The file-search overlay captures all keystrokes while open.
                if active_view(&guard) == Some(crate::ui::bottom_pane::ViewKind::FileSearch) {
                    let mut handled = true;
                    match key.code {
                        KeyCode::Char(c) => {
                    guard.bottom_pane.file_search.query.push(c);
                            guard.refresh_file_search();
                        }
                        KeyCode::Backspace => {
                    guard.bottom_pane.file_search.query.pop();
                            guard.refresh_file_search();
                        }
                        KeyCode::Up => guard.move_file_search_selection(true),
                        KeyCode::Down => guard.move_file_search_selection(false),
                        KeyCode::Enter => {
                            if !guard.loading {
                                if let Some(m) = guard
                        .bottom_pane.file_search.results
                        .get(guard.bottom_pane.file_search.selected)
                                    .cloned()
                                {
                                    let path = m.path.clone();
                                    guard.close_view(crate::ui::bottom_pane::ViewKind::FileSearch);
                                    let content = state.lock().unwrap().files.read_file(&path);
                                    guard.open_editor(&path, content.as_deref());
                                }
                            }
                        }
                        KeyCode::Esc => {
                            guard.close_view(crate::ui::bottom_pane::ViewKind::FileSearch);
                            guard.bottom_pane.close(crate::ui::bottom_pane::ViewKind::FileSearch);
                        }
                        _ => handled = false,
                    }
                    if handled {
                        continue;
                    }
                }
                // Modal pickers (slash-command menu / model selector) take over
                // Up/Down/Enter/Esc while open.
                if matches!(
                    active_view(&guard),
                    Some(crate::ui::bottom_pane::ViewKind::Commands
                        | crate::ui::bottom_pane::ViewKind::References
                        | crate::ui::bottom_pane::ViewKind::Model
                        | crate::ui::bottom_pane::ViewKind::Provider
                        | crate::ui::bottom_pane::ViewKind::Resume)
                ) {
                    let mut handled = true;
                    match key.code {
                        KeyCode::Up => {
                            if guard.view_open(crate::ui::bottom_pane::ViewKind::Commands) {
                                guard.bottom_pane.commands.selected = guard.bottom_pane.commands.selected.saturating_sub(1);
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::References) {
                                guard.bottom_pane.references.selected = guard.bottom_pane.references.selected.saturating_sub(1);
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::Model) {
                                guard.bottom_pane.model.move_up();
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::Resume) {
                                guard.bottom_pane.resume.move_up();
                            } else {
                                guard.bottom_pane.provider.move_up();
                            }
                        }
                        KeyCode::Down => {
                            if guard.view_open(crate::ui::bottom_pane::ViewKind::Commands) {
                                if guard.bottom_pane.commands.selected + 1 < guard.bottom_pane.commands.items.len() {
                                    guard.bottom_pane.commands.selected += 1;
                                }
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::References) {
                                if guard.bottom_pane.references.selected + 1 < guard.bottom_pane.references.items.len() {
                                    guard.bottom_pane.references.selected += 1;
                                }
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::Model) {
                                guard.bottom_pane.model.move_down();
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::Resume) {
                                guard.bottom_pane.resume.move_down();
                            } else {
                                guard.bottom_pane.provider.move_down();
                            }
                        }
                        KeyCode::Enter => {
                            if guard.view_open(crate::ui::bottom_pane::ViewKind::Commands) {
                                let sel = guard
                                    .bottom_pane.commands.selected
                                    .min(guard.bottom_pane.commands.items.len().saturating_sub(1));
                                let text = guard
                                    .bottom_pane.commands.items
                                    .get(sel)
                                    .map(|(c, _)| c.clone())
                    .unwrap_or_else(|| guard.bottom_pane.composer.input.trim().to_string());
                                guard.close_view(crate::ui::bottom_pane::ViewKind::Commands);
                                run_input(
                                    &mut guard,
                                    &state,
                                    &client,
                                    &task_tx,
                                    &auto_test_tx,
                                    &mut start,
                                    &text,
                                );
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::References) {
                                if let Some(value) = guard.bottom_pane.references.items.get(guard.bottom_pane.references.selected).cloned() {
                                    let trigger = guard.bottom_pane.references.trigger;
                                    if guard.replace_reference_at_cursor(trigger, &value) {
                                        guard.close_view(crate::ui::bottom_pane::ViewKind::References);
                                    }
                                }
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::Model) {
                                let name = guard
                                    .bottom_pane.model
                                    .selected_item()
                                    .map(str::to_string)
                                    .unwrap_or_default();
                                guard.close_view(crate::ui::bottom_pane::ViewKind::Model);
                                if !name.is_empty() {
                                    set_active_model(
                                        &mut guard,
                                        &state,
                                        &client,
                                        &name,
                                        Some(&auto_test_tx),
                                    );
                                }
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::Provider) {
                                let name = guard
                                    .bottom_pane.provider
                                    .selected_item()
                                    .map(str::to_string)
                                    .unwrap_or_default();
                                guard.close_view(crate::ui::bottom_pane::ViewKind::Provider);
                                if !name.is_empty() {
                                    let id = name.split(" — ").next().unwrap_or(&name).trim().to_string();
                                    let store = crate::providers::ProviderStore::load();
                                    let catalog_client = crate::providers::ProviderCatalog::load();
                                    let has_key = store.api_key(&id).is_some()
                                        || crate::providers::ProviderStore::resolve_cloud_credentials(&id, &catalog_client.catalog).is_ok();
                                    if has_key {
                                        set_active_provider(&mut guard, &state, &client, &id);
                                        open_model_selector(&mut guard, &state);
                                    } else {
                                        guard.key_input_provider = id.clone();
                                        guard.key_input_value = String::new();
                                        guard.key_input_popup = true;
                                        guard.status = format!("Enter API key for {id} (Enter to confirm, Esc to cancel)");
                                    }
                                }
                            } else if guard.view_open(crate::ui::bottom_pane::ViewKind::Resume) {
                                if let Some(&session_id) =
                                    guard.resume_ids.get(guard.bottom_pane.resume.selected)
                                {
                                    guard.close_view(crate::ui::bottom_pane::ViewKind::Resume);
                                    let mut st = state.lock().unwrap();
                                    match st.load_session_into_state(session_id) {
                                        Ok(count) => {
                                            drop(st);
                                            guard.messages.clear();
                                            let s = state.lock().unwrap();
                                            for (role, content) in s.session.history() {
                                                guard.add_message(&display_role(&role), &content);
                                            }
                                            guard.add_message("System", &format!("✓ Resumed session {session_id} ({count} messages)"));
                                        }
                                        Err(e) => {
                                            guard.add_message("Error", &format!("Failed: {e}"))
                                        }
                                    }
                                }
                            }
                        }
                        KeyCode::Tab => {
                            if guard.view_open(crate::ui::bottom_pane::ViewKind::Commands) {
                                if let Some((command, _)) = guard
                                    .bottom_pane
                                    .commands
                                    .items
                                    .get(guard.bottom_pane.commands.selected)
                                    .cloned()
                                {
                                    guard.bottom_pane.composer.input = command;
                                    guard.bottom_pane.composer.cursor_position =
                                        guard.bottom_pane.composer.input.chars().count();
                                    refresh_command_menu(&mut guard);
                                }
                            }
                        }
                        KeyCode::Esc => {
                            guard.close_view(crate::ui::bottom_pane::ViewKind::Commands);
                            guard.close_view(crate::ui::bottom_pane::ViewKind::References);
                            guard.close_view(crate::ui::bottom_pane::ViewKind::Model);
                            guard.close_view(crate::ui::bottom_pane::ViewKind::Provider);
                            guard.close_view(crate::ui::bottom_pane::ViewKind::Resume);
                            guard.bottom_pane.close_active();
                        }
                        _ => handled = false,
                    }
                    // Once `/` or `@` opens its picker, text editing must
                    // still reach the composer. The old unconditional modal
                    // capture swallowed every character after the trigger,
                    // leaving the menu stuck on the first item.
                    let picker_edit = matches!(
                        active_view(&guard),
                        Some(crate::ui::bottom_pane::ViewKind::Commands
                            | crate::ui::bottom_pane::ViewKind::References)
                    ) && matches!(
                        key.code,
                        KeyCode::Char(_)
                            | KeyCode::Backspace
                            | KeyCode::Left
                            | KeyCode::Right
                            | KeyCode::Home
                            | KeyCode::End
                    );
                    if handled || (active_view(&guard).is_some() && !picker_edit) {
                        continue;
                    }
                }
                // Auto test scene overlay captures Esc key while open.
                if guard.auto_test_popup {
                    if matches!(key.code, KeyCode::Esc) {
                        guard.auto_test_popup = false;
                    }
                    continue;
                }
                // /info overlay captures navigation keys while open.
                if active_view(&guard) == Some(crate::ui::bottom_pane::ViewKind::Info) {
                    match key.code {
                        KeyCode::Esc => {
                            guard.bottom_pane.close(crate::ui::bottom_pane::ViewKind::Info);
                        }
                        KeyCode::Up => {
                    if guard.bottom_pane.info.selected > 0 {
                        guard.bottom_pane.info.selected -= 1;
                            }
                        }
                        KeyCode::Down => {
                    if guard.bottom_pane.info.selected + 1 < guard.bottom_pane.info.sections.len() {
                        guard.bottom_pane.info.selected += 1;
                            }
                        }
                        KeyCode::Enter => {
                    let idx = guard.bottom_pane.info.selected;
                    if let Some(section) = guard.bottom_pane.info.sections.get_mut(idx) {
                                section.open = !section.open;
                            }
                        }
                        _ => {}
                    }
                    continue;
                }
                // Edit-compatible structural editing shortcuts take precedence over
                // the harness-wide Tab and navigation bindings.
                if guard.focus == Focus::Editor
                    && (matches!(key.code, KeyCode::Tab | KeyCode::BackTab)
                        || (key.modifiers.contains(KeyModifiers::ALT)
                            && matches!(key.code, KeyCode::Up | KeyCode::Down)))
                {
                    if let Some(mut buffer) = guard.editor_buffer.take() {
                        buffer.set_cursor(guard.editor_row, guard.editor_col);
                        if matches!(key.code, KeyCode::Tab | KeyCode::BackTab) {
                            buffer.indent_lines(
                                key.code == KeyCode::BackTab
                                    || key.modifiers.contains(KeyModifiers::SHIFT),
                            );
                        } else {
                            buffer.move_lines(key.code == KeyCode::Down);
                        }
                        let cursor = buffer.cursor();
                        guard.editor_lines = buffer.lines().to_vec();
                        guard.editor_row = cursor.row;
                        guard.editor_col = cursor.col;
                        guard.editor_dirty = true;
                        guard.editor_buffer = Some(buffer);
                    }
                    continue;
                }
                // Codex-style multiline composition: Enter submits, while
                // Shift+Enter inserts a newline into the current prompt.
                if guard.focus == Focus::Input
                    && key.code == KeyCode::Enter
                    && key.modifiers.contains(KeyModifiers::SHIFT)
                {
                    guard.bottom_pane.composer.insert('\n');
                    refresh_command_menu(&mut guard);
                    continue;
                }
                match route_composer_edit_key(&mut guard, key) {
                    ComposerRoute::Handled => continue,
                    ComposerRoute::Submit(input) => {
                        guard.close_view(crate::ui::bottom_pane::ViewKind::Commands);
                        run_input(
                            &mut guard,
                            &state,
                            &client,
                            &task_tx,
                            &auto_test_tx,
                            &mut start,
                            &input,
                        );
                        continue;
                    }
                    ComposerRoute::Unhandled => {}
                }
                match key.code {
                    KeyCode::Char('z') if key.modifiers.contains(KeyModifiers::ALT) => {
                        guard.word_wrap = !guard.word_wrap;
                        guard.status = format!("Word wrap: {}", if guard.word_wrap { "On" } else { "Off" });
                    }
                    KeyCode::PageUp => {
                        guard.scroll_offset = guard.scroll_offset.saturating_sub(10);
                        guard.follow = false;
                    }
                    KeyCode::PageDown => {
                        guard.scroll_offset += 10;
                    }
                    KeyCode::Home => {
                        guard.scroll_offset = 0;
                        guard.follow = false;
                    }
                    KeyCode::End => {
                        guard.follow = true;
                    }
                    KeyCode::Tab => {
                        if guard.focus == Focus::Input && guard.loading {
                            let queued = guard.bottom_pane.composer.input.trim().to_string();
                            if !queued.is_empty() {
                                run_input(
                                    &mut guard,
                                    &state,
                                    &client,
                                    &task_tx,
                                    &auto_test_tx,
                                    &mut start,
                                    &queued,
                                );
                            }
                            continue;
                        }
                        guard.agent_mode = match guard.agent_mode {
                            AgentMode::Agent => AgentMode::Plan,
                            AgentMode::Plan => AgentMode::Agent,
                        };
                        let mode_str = match guard.agent_mode {
                            AgentMode::Agent => "agent (tool-use)",
                            AgentMode::Plan => "plan (planner-first)",
                        };
                        guard.add_message("System", &format!("Mode switched to {}", mode_str));
                        guard.status = format!(
                            "Ready · mode: {} · Esc interrupt",
                            match guard.agent_mode {
                                AgentMode::Agent => "agent",
                                AgentMode::Plan => "plan",
                            }
                        );
                    }
                    KeyCode::Up => {
                        if let Focus::Sidebar = guard.focus {
                    if guard.bottom_pane.info.selected > 0 {
                        guard.bottom_pane.info.selected -= 1;
                            }
                        } else if guard.focus == Focus::Editor {
                            if guard.editor_row > 0 {
                                guard.editor_row -= 1;
                            }
                            let line_len = guard
                                .editor_lines
                                .get(guard.editor_row)
                                .map(|l| l.len())
                                .unwrap_or(0);
                            if guard.editor_col > line_len {
                                guard.editor_col = line_len;
                            }
                            // adjust scroll
                            if guard.editor_row < guard.editor_scroll {
                                guard.editor_scroll = guard.editor_row;
                            }
                        } else if guard.focus == Focus::Input {
                            guard.previous_input();
                        } else {
                            guard.scroll_offset = guard.scroll_offset.saturating_sub(3);
                            guard.follow = false;
                        }
                    }
                    KeyCode::Down => {
                        if let Focus::Sidebar = guard.focus {
                    if guard.bottom_pane.info.selected + 1 < guard.bottom_pane.info.sections.len() {
                        guard.bottom_pane.info.selected += 1;
                            }
                        } else if guard.focus == Focus::Editor {
                            if guard.editor_row + 1 < guard.editor_lines.len() {
                                guard.editor_row += 1;
                            }
                            let line_len = guard
                                .editor_lines
                                .get(guard.editor_row)
                                .map(|l| l.len())
                                .unwrap_or(0);
                            if guard.editor_col > line_len {
                                guard.editor_col = line_len;
                            }
                        } else if guard.focus == Focus::Input {
                            guard.next_input();
                        } else {
                            guard.scroll_offset += 3;
                        }
                    }
                    KeyCode::Enter => {
                        match guard.focus {
                            Focus::Input | Focus::Messages => {
                                let input = guard.bottom_pane.composer.input.trim().to_string();
                                if !input.is_empty() {
                                    guard.close_view(crate::ui::bottom_pane::ViewKind::Commands);
                                    guard.focus = Focus::Input;
                                    run_input(
                                        &mut guard,
                                        &state,
                                        &client,
                                        &task_tx,
                                        &auto_test_tx,
                                        &mut start,
                                        &input,
                                    );
                                }
                            }
                            Focus::Sidebar => {
                    let idx = guard.bottom_pane.info.selected;
                    if let Some(section) = guard.bottom_pane.info.sections.get_mut(idx) {
                                    section.open = !section.open;
                                }
                            }
                            Focus::Editor
                                // insert newline at cursor
                                if guard.editor_row <= guard.editor_lines.len() => {
                                    let line = if guard.editor_row < guard.editor_lines.len() {
                                        guard.editor_lines[guard.editor_row].clone()
                                    } else {
                                        String::new()
                                    };
                                    let byte = char_index_to_byte_index(&line, guard.editor_col);
                                    let (left, right) = line.split_at(byte);
                                    let row = guard.editor_row;
                                    if row < guard.editor_lines.len() {
                                        guard.editor_lines[row] = left.to_string();
                                        guard.editor_lines.insert(row + 1, right.to_string());
                                    } else {
                                        guard.editor_lines.push(left.to_string());
                                        guard.editor_lines.push(right.to_string());
                                    }
                                    guard.editor_row += 1;
                                    guard.editor_col = 0;
                                    guard.editor_dirty = true;
                                }
                            _ => {}
                        }
                    }
                    KeyCode::Char(c) => {
                        if guard.focus == Focus::Editor {
                            // insert char into editor at cursor
                            if guard.editor_row >= guard.editor_lines.len() {
                                guard.editor_lines.push(String::new());
                            }
                            let row = guard.editor_row;
                            let col_char = guard.editor_col;
                            let line = &mut guard.editor_lines[row];
                            let col = char_index_to_byte_index(line, col_char);
                            if col_char <= line.chars().count() {
                                line.insert(col, c);
                            } else {
                                line.push(c);
                            }
                            guard.editor_col += 1;
                            guard.editor_dirty = true;
                        } else {
                            guard.bottom_pane.composer.insert(c);
                            refresh_command_menu(&mut guard);
                            refresh_reference_menu(&mut guard);
                        }
                    }
                    KeyCode::Backspace => {
                        if guard.focus == Focus::Editor {
                            let row = guard.editor_row;
                            let col = guard.editor_col;
                            if row < guard.editor_lines.len() {
                                if col > 0 {
                                    let byte =
                                        char_index_to_byte_index(&guard.editor_lines[row], col - 1);
                                    guard.editor_lines[row].remove(byte);
                                    guard.editor_col -= 1;
                                } else if row > 0 {
                                    // join with previous line
                                    let prev_len = guard.editor_lines[row - 1].chars().count();
                                    let cur = guard.editor_lines.remove(row);
                                    guard.editor_row -= 1;
                                    guard.editor_col = prev_len;
                                    guard.editor_lines[row - 1].push_str(&cur);
                                }
                            }
                            guard.editor_dirty = true;
                        } else {
                            if guard.bottom_pane.composer.backspace() {
                                refresh_command_menu(&mut guard);
                                refresh_reference_menu(&mut guard);
                            }
                        }
                    }
                    KeyCode::Left => {
                        if guard.focus == Focus::Editor {
                            if guard.editor_col > 0 {
                                guard.editor_col -= 1;
                            } else if guard.editor_row > 0 {
                                guard.editor_row -= 1;
                                let row = guard.editor_row;
                                guard.editor_col = guard.editor_lines[row].chars().count();
                            }
                        } else {
                            guard.bottom_pane.composer.move_left();
                        }
                    }
                    KeyCode::Right => {
                        if guard.focus == Focus::Editor {
                            let row = guard.editor_row;
                            if row < guard.editor_lines.len() {
                                let len = guard.editor_lines[row].chars().count();
                                if guard.editor_col < len {
                                    guard.editor_col += 1;
                                } else if row + 1 < guard.editor_lines.len() {
                                    guard.editor_row += 1;
                                    guard.editor_col = 0;
                                }
                            }
                        } else {
                            guard.bottom_pane.composer.move_right();
                        }
                    }
                    KeyCode::Esc => {
                        // If editing, close editor; else interrupt running turn
                        if guard.focus == Focus::Editor {
                            guard.editor_file = None;
                            guard.editor_lines.clear();
                            guard.focus = Focus::Input;
                        } else if guard.loading {
                            interrupt.store(true, Ordering::Relaxed);
                            guard.status = "Interrupting…".into();
                        } else if guard.focus != Focus::Input {
                            guard.focus = Focus::Input;
                        }
                        guard.quit_pending = false;
                    }
                    _ => {}
                }
                // Edit-compatible clipboard and history shortcuts. Keep the
                // existing line mirrors synchronized while the core buffer
                // becomes the authoritative editing model.
                if guard.focus == Focus::Editor && !key.modifiers.contains(KeyModifiers::CONTROL) {
                    let text = guard.editor_lines.join("\n");
                    let row = guard.editor_row;
                    let col = guard.editor_col;
                    if let Some(mut buffer) = guard.editor_buffer.take() {
                        buffer.sync_external_text(&text, row, col);
                        guard.editor_buffer = Some(buffer);
                    }
                }
                if key.modifiers.contains(KeyModifiers::CONTROL) && guard.focus == Focus::Editor {
                    if let Some(mut buffer) = guard.editor_buffer.take() {
                        buffer.set_cursor(guard.editor_row, guard.editor_col);
                        match key.code {
                            KeyCode::Char('c') => buffer.copy(),
                            KeyCode::Char('x') => { buffer.cut(); guard.editor_lines = buffer.lines().to_vec(); guard.editor_dirty = true; }
                            KeyCode::Char('v') => { buffer.paste(); guard.editor_lines = buffer.lines().to_vec(); guard.editor_dirty = true; }
                            KeyCode::Char('z') => { buffer.undo(); guard.editor_lines = buffer.lines().to_vec(); guard.editor_dirty = true; }
                            KeyCode::Char('y') => { buffer.redo(); guard.editor_lines = buffer.lines().to_vec(); guard.editor_dirty = true; }
                            _ => {}
                        }
                        let c = buffer.cursor();
                        guard.editor_row = c.row;
                        guard.editor_col = c.col;
                        guard.editor_buffer = Some(buffer);
                    }
                }
                // handle Ctrl-S save
                if key.modifiers.contains(KeyModifiers::CONTROL) {
                    if let KeyCode::Char('s') = key.code {
                        if guard.focus == Focus::Editor {
                            if let Some(fname) = &guard.editor_file {
                                let content = guard.editor_lines.join("\n");
                                let mut st = state.lock().unwrap();
                                match st.config.write_tool_policy {
                                    ApprovalPolicy::Deny => {
                                        guard.add_message(
                                            "Error",
                                            "Save denied: write policy is set to deny",
                                        );
                                    }
                                    _ => match st.files.write_file(fname, &content) {
                                        Ok(_) => {
                                            let path = fname.clone();
                                            st.mark_changed(path);
                                            guard.add_message("Info", "File saved");
                                            guard.editor_dirty = false;
                                        }
                                        Err(e) => {
                                            guard.add_message(
                                                "Error",
                                                &format!("Save failed: {}", e),
                                            );
                                        }
                                    },
                                }
                            }
                        }
                    }
                }
            }
            Ok(Event::Mouse(mouse)) => {
                let mut guard = app.lock().unwrap();
                match mouse.kind {
                    MouseEventKind::ScrollUp => {
                        guard.scroll_offset = guard.scroll_offset.saturating_sub(5);
                        guard.follow = false;
                    }
                    MouseEventKind::ScrollDown => {
                        guard.scroll_offset += 5;
                    }
                    MouseEventKind::Down(MouseButton::Left) => {
                        // Toggle tool call rollup expansion on click.
                        let flattened = flatten_messages(&guard);
                        let msg_area_top = 0; // transcript starts at the top in Codex layout
                        let clicked_row = mouse.row as usize;
                        if clicked_row > msg_area_top {
                            let offset = if guard.follow {
                                flattened.len().saturating_sub(guard.scroll_offset)
                            } else {
                                guard.scroll_offset
                            };
                            let line_idx = clicked_row - msg_area_top + offset;
                            if line_idx < flattened.len() {
                                let line_text = flattened[line_idx].to_string();
                                if line_text.starts_with("●")
                                    || line_text.starts_with("Δ")
                                    || line_text.contains(" tool use")
                                {
                                    guard.tool_calls_expanded = !guard.tool_calls_expanded;
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
            // On a real resize, force a full repaint. ratatui's Terminal::draw
            // already autoresizes every frame, but clearing once per resize
            // avoids stale glyphs from backends that deliver resize batches.
            Ok(Event::Resize(width, height)) if width > 0 && height > 0 => {
                if (width, height) != last_size {
                    last_size = (width, height);
                    let _ = terminal.clear();
                }
            }
            Ok(_) => {}
            Err(mpsc::RecvTimeoutError::Timeout) => {}
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    Ok(())
}

fn update_info_sections(app: &mut App, _state: &AgentState) {
    let used = app.tokens;
    let max = app.max_context_tokens;
    let pct = if max > 0 {
        (used as f64 / max as f64) * 100.0
    } else {
        0.0
    };
    let cost = app.context_cost;

    app.bottom_pane.info.sections[0] = InfoPanelSection::open(
        "Context",
        vec![
            Span::styled(format!("{} tokens", used), Style::default()),
            Span::styled(format!("{:.0}% used", pct), Style::default()),
            Span::styled(format!("${:.4} spent", cost), Style::default()),
        ],
    );

    let tb = &app.token_breakdown;
    app.bottom_pane.info.sections[1] = InfoPanelSection::open(
        "Token Usage",
        vec![
            Span::styled(format!("Input: {}", tb.input), Style::default()),
            Span::styled(format!("Output: {}", tb.output), Style::default()),
            Span::styled(format!("Reasoning: {}", tb.reasoning), Style::default()),
            Span::styled(format!("Cache read: {}", tb.cache_read), Style::default()),
            Span::styled(format!("Cache write: {}", tb.cache_write), Style::default()),
            Span::styled(
                format!("Cache rate: {:.1}%", tb.cache_rate),
                Style::default(),
            ),
            Span::styled(
                format!("Speed: {:.1} tok/s", tb.generation_speed),
                Style::default(),
            ),
            Span::styled(format!("Cost: ${:.4}", cost), Style::default()),
        ],
    );

    app.bottom_pane.info.sections[2] = InfoPanelSection::open("Models", {
        let mut lines = app
            .models
            .iter()
            .map(|m| Span::styled(format!("{} — {}", m.provider, m.name), Style::default()))
            .collect::<Vec<_>>();
        if lines.is_empty() {
            lines.push(Span::styled("No models loaded", Style::default()));
        }
        lines
    });

    app.bottom_pane.info.sections[3] = InfoPanelSection::open(
        "Code Indexing",
        vec![Span::styled(
            if app.indexing_enabled {
                "Enabled"
            } else {
                "Disabled"
            },
            Style::default(),
        )],
    );

    app.bottom_pane.info.sections[4] = InfoPanelSection::open("Todo", {
        let mut lines = Vec::new();
        if app.todo_items.is_empty() {
            lines.push(Span::styled("No active tasks", Style::default()));
        } else {
            for item in &app.todo_items {
                let mark = if item.done { "[x]" } else { "[ ]" };
                lines.push(Span::styled(
                    format!("{} {}", mark, item.text),
                    Style::default(),
                ));
            }
        }
        lines
    });

    app.bottom_pane.info.sections[5] = InfoPanelSection::open("Modified Files", {
        if app.diff_content.is_empty() {
            if app.modified_files.is_empty() {
                vec![Span::styled("No changes", Style::default())]
            } else {
                app.modified_files
                    .iter()
                    .map(|f| Span::styled(f.clone(), Style::default().fg(Color::Gray)))
                    .collect()
            }
        } else {
            app.diff_content
                .iter()
                .map(|line| {
                    let style = if line.starts_with('+') {
                        Style::default().fg(Color::Green)
                    } else if line.starts_with('-') {
                        Style::default().fg(Color::Red)
                    } else if line.starts_with("@@") {
                        Style::default().fg(Color::Cyan)
                    } else {
                        Style::default().fg(Color::Gray)
                    };
                    Span::styled(line.clone(), style)
                })
                .collect()
        }
    });

    app.bottom_pane.info.sections[6] = InfoPanelSection::open(
        "Memory",
        vec![Span::styled(
            if app.memory_enabled {
                "Enabled"
            } else {
                "Disabled"
            },
            Style::default(),
        )],
    );
}

fn draw<B: crate::ui::engine::ratatui::backend::Backend>(
    f: &mut Terminal<B>,
    app: &mut App,
) -> Result<(), Box<dyn Error>> {
    f.draw(|f| {
        let size = f.area();
        let composer_height = (app.bottom_pane.composer.input.matches('\n').count() as u16 + 1)
            .clamp(1, size.height.saturating_sub(2).max(1));
        let page = Layout::default()
            .direction(Direction::Vertical)
            .constraints(
                [
                    Constraint::Min(0),
                    // Codex-style bottom pane: keep a visible composer well
                    // around the prompt instead of letting input touch the
                    // transcript and footer.
                    Constraint::Length(composer_height),
                    Constraint::Length(1),
                ]
                .as_ref(),
            )
            .split(size);
        app.bottom_pane.render_composer(f, page[1], app.loading);

        // Modern bottom shortcut / info bar
        let avail_footer_w = page[2].width as usize;
        let footer_state = app.bottom_pane.footer_state(
            app.loading,
            app.pending_approval.is_some(),
            app.pending_plan_approval.is_some(),
            app.status.clone(),
            app.elapsed,
            app.git_branch.clone(),
            clean_display_path(&app.dir, 36),
        );
        let footer_left = footer_state.left_label();
        let footer_right = format!("{} ", footer_state.hint());

        let f_left_w = display_width(&footer_left);
        let f_right_w = display_width(&footer_right);
        let f_pad = avail_footer_w.saturating_sub(f_left_w + f_right_w);

        let bottom = Paragraph::new(Line::from(vec![
            Span::styled(footer_left, crate::ui::style::muted()),
            Span::styled(" ".repeat(f_pad), Style::default()),
            Span::styled(footer_right, crate::ui::style::muted()),
        ]));
        f.render_widget(bottom, page[2]);

        // Full-width transcript (Codex-style single column — no sidebar).
        if let Some(editor_file) = app.editor_file.as_ref() {
            let title = format!(
                "Editor - {}{}",
                editor_file,
                if app.editor_dirty { " *" } else { "" }
            );
            // compute visible lines based on scroll and area height
            let area_height = page[0].height as usize - 2; // leave room for borders
            let editor_lines: &[String] = app
                .editor_buffer
                .as_ref()
                .map(|buffer| buffer.lines())
                .unwrap_or(&app.editor_lines);
            let total_lines = editor_lines.len();
            let scroll = if app.editor_scroll + area_height > total_lines {
                total_lines.saturating_sub(area_height)
            } else {
                app.editor_scroll
            };
            let end = std::cmp::min(scroll + area_height, total_lines);
            let line_num_width = total_lines.to_string().len();
            let editor_path = editor_file.as_str();
            let visible: Vec<Line<'static>> = editor_lines[scroll..end]
                .iter()
                .enumerate()
                .map(|(i, line)| {
                    let num = scroll + i + 1;
                    let prefix = format!("{:>width$} │ ", num, width = line_num_width);
                    let mut spans = vec![Span::styled(prefix, Style::default().fg(Color::Gray))];
                    spans.extend(crate::ui::syntax::highlight_line(editor_path, line));
                    Line::from(spans)
                })
                .collect();
            let mut editor = Paragraph::new(visible)
                .block(Block::default().title(title).borders(Borders::ALL));
            if app.word_wrap {
                editor = editor.wrap(Wrap { trim: false });
            }
            f.render_widget(editor, page[0]);
            // set cursor in editor area relative to scroll
            let r = (app.editor_row.saturating_sub(scroll)) as u16;
            let _c = app.editor_col as u16 + line_num_width as u16 + 3; // offset for line numbers
            f.set_cursor_position((page[0].x + _c + 1, page[0].y + r + 1));
        } else {
        let messages_lines = crate::ui::chatwidget::history_lines(app);
        let view_height = page[0].height as usize;
        let widget = Paragraph::new(messages_lines).wrap(Wrap { trim: app.word_wrap });
        // Ratatui's own WordWrapper drives both the render and the scroll
        // math, so the visible window always matches the wrapped layout.
        let total_wrapped = widget.line_count(page[0].width);
        let offset = if app.follow {
            total_wrapped.saturating_sub(view_height)
        } else {
            app.scroll_offset.min(total_wrapped.saturating_sub(view_height))
        };
        f.render_widget(widget.scroll((offset as u16, 0)), page[0]);
        }

        // Overlays are routed by the BottomPane view stack. Legacy payload
        // flags are consulted only by `active_view()` during migration.
        if matches!(
            active_view(app),
            Some(crate::ui::bottom_pane::ViewKind::Commands
                | crate::ui::bottom_pane::ViewKind::References
                | crate::ui::bottom_pane::ViewKind::Model
                | crate::ui::bottom_pane::ViewKind::Provider
                | crate::ui::bottom_pane::ViewKind::Resume)
        ) {
            let (items, title, selected) = if app.view_open(crate::ui::bottom_pane::ViewKind::Commands) {
                let items = app
                    .bottom_pane.commands.items
                    .iter()
                    .map(|(cmd, desc)| {
                        ListItem::new(Line::from(vec![
                            Span::styled(
                                cmd.clone(),
                                Style::default()
                                    .fg(Color::Cyan)
                                    .add_modifier(Modifier::BOLD),
                            ),
                            Span::styled(format!("  {desc}"), Style::default().fg(Color::Gray)),
                        ]))
                    })
                    .collect::<Vec<_>>();
                let selected = app.bottom_pane.commands.selected.min(items.len().saturating_sub(1));
                (items, " Slash commands ".to_string(), selected)
            } else if app.view_open(crate::ui::bottom_pane::ViewKind::References) {
                let items = app
                    .bottom_pane
                    .references
                    .items
                    .iter()
                    .map(|item| ListItem::new(Span::styled(item.clone(), Style::default().fg(Color::Cyan))))
                    .collect::<Vec<_>>();
                let selected = app.bottom_pane.references.selected.min(items.len().saturating_sub(1));
                let title = if app.bottom_pane.references.trigger == '@' {
                    " References: files ".to_string()
                } else {
                    " References: context ".to_string()
                };
                (items, title, selected)
            } else if app.view_open(crate::ui::bottom_pane::ViewKind::Model) {
                let items = app
                    .bottom_pane.model.items
                    .iter()
                    .map(|m| {
                        ListItem::new(Span::styled(m.clone(), Style::default().fg(Color::Cyan)))
                    })
                    .collect::<Vec<_>>();
                let selected = app.bottom_pane.model.selected.min(items.len().saturating_sub(1));
                (
                    items,
                    " Select model — ↑/↓ · Enter set · Esc cancel ".to_string(),
                    selected,
                )
            } else if app.view_open(crate::ui::bottom_pane::ViewKind::Resume) {
                let items = app
                    .bottom_pane.resume.items
                    .iter()
                    .map(|s| {
                        ListItem::new(Span::styled(
                            s.clone(),
                            Style::default().fg(Color::LightGreen),
                        ))
                    })
                    .collect::<Vec<_>>();
                let selected = app.bottom_pane.resume.selected.min(items.len().saturating_sub(1));
                (
                    items,
                    " Resume session — ↑/↓ · Enter resume · Esc cancel ".to_string(),
                    selected,
                )
            } else {
                let items = app
                    .bottom_pane.provider.items
                    .iter()
                    .map(|p| {
                        let style = if p.contains("[key set]") {
                            Style::default().fg(Color::Green)
                        } else {
                            Style::default().fg(Color::LightBlue)
                        };
                        ListItem::new(Span::styled(p.clone(), style))
                    })
                    .collect::<Vec<_>>();
                let selected = app.bottom_pane.provider.selected.min(items.len().saturating_sub(1));
                (
                    items,
                    " Select provider — ↑/↓ · Enter set & choose model · Esc cancel ".to_string(),
                    selected,
                )
            };
            let popup_w = 76.min(size.width.saturating_sub(4));
            let popup_h = (items.len() as u16 + 2).min(size.height.saturating_sub(4));
            let x = size.x + (size.width.saturating_sub(popup_w)) / 2;
            let y = size.y + (size.height.saturating_sub(popup_h)) / 3;
            let area = Rect {
                x,
                y,
                width: popup_w,
                height: popup_h,
            };
            f.render_widget(Clear, area);
            let mut list_state = crate::ui::engine::ratatui::widgets::ListState::default();
            list_state.select(Some(selected));
            let list = List::new(items)
                .block(Block::default().title(title).borders(Borders::ALL))
                .highlight_style(Style::default().bg(Color::Gray))
                .highlight_symbol("▶ ");
            f.render_stateful_widget(list, area, &mut list_state);
        }

        // /info overlay: former left-sidebar sections, rendered full-screen.
        if app.view_open(crate::ui::bottom_pane::ViewKind::Info) {
            let popup_w = (size.width.saturating_sub(6)).max(30);
            let popup_h = (size.height.saturating_sub(4)).max(10);
            let x = size.x + (size.width.saturating_sub(popup_w)) / 2;
            let y = size.y + 2;
            let area = Rect { x, y, width: popup_w, height: popup_h };
            let mut panel_lines: Vec<Line> = Vec::new();
            for (idx, section) in app.bottom_pane.info.sections.iter().enumerate() {
                let arrow = if section.open { "▼" } else { "▶" };
                let selected = idx == app.bottom_pane.info.selected;
                let style = if selected {
                    Style::default()
                        .fg(Color::Yellow)
                        .add_modifier(Modifier::BOLD)
                } else {
                    Style::default().fg(Color::Cyan)
                };
                let mut spans = Vec::new();
                if selected {
                    spans.push(Span::styled(
                        "▶ ",
                        Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD),
                    ));
                } else {
                    spans.push(Span::styled("  ", Style::default()));
                }
                spans.push(Span::styled(format!("{} {}", arrow, section.title), style));
                panel_lines.push(Line::from(spans));
                if section.open {
                    for span in &section.lines {
                        panel_lines.push(Line::from(vec![
                            Span::styled("    ", Style::default()),
                            Span::styled(&*span.content, Style::default().fg(Color::Gray)),
                        ]));
                    }
                }
            }
            let panel_block = Block::default()
                .title(" Workspace info — ↑/↓ navigate · Enter toggle · Esc close ")
                .borders(Borders::ALL);
            let panel = Paragraph::new(panel_lines).block(panel_block).wrap(Wrap { trim: false });
            f.render_widget(panel, area);
        }

        // /auto & /model auto Test Scene Overlay: renders last availability test results.
        if app.auto_test_popup {
            let popup_w = (size.width.saturating_sub(6)).max(40);
            let popup_h = (size.height.saturating_sub(4)).max(12);
            let x = size.x + (size.width.saturating_sub(popup_w)) / 2;
            let y = size.y + (size.height.saturating_sub(popup_h)) / 3;
            let area = Rect { x, y, width: popup_w, height: popup_h };

            let mut lines: Vec<Line> = Vec::new();
            if let Some(ref record) = app.last_auto_test {
                lines.push(Line::from(vec![
                    Span::styled("✦ Provedor: ", Style::default().fg(Color::Gray)),
                    Span::styled(&record.provider, Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)),
                    Span::styled(format!("  │  Timestamp: {}", record.timestamp), Style::default().fg(Color::Gray)),
                ]));
                lines.push(Line::from(""));
                lines.push(Line::from(Span::styled("Resultados dos Probes por Candidato:", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD))));

                for res in &record.results {
                    let is_winner = res.model == record.selected_model && res.success;
                    let mut spans = Vec::new();
                    if is_winner {
                        spans.push(Span::styled("▶ [V] ", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)));
                        spans.push(Span::styled(format!("{} — {}ms (200 OK) [VENCEDOR]", res.model, res.latency_ms), Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)));
                    } else if res.success {
                        spans.push(Span::styled("  ✓ ", Style::default().fg(Color::Green)));
                        spans.push(Span::styled(format!("{} — {}ms (200 OK)", res.model, res.latency_ms), Style::default().fg(Color::White)));
                    } else {
                        let err = res.error.as_deref().unwrap_or("Failed");
                        spans.push(Span::styled("  ✗ ", Style::default().fg(Color::Red)));
                        spans.push(Span::styled(format!("{} — {}", res.model, err), Style::default().fg(Color::Red)));
                    }
                    lines.push(Line::from(spans));
                }

                lines.push(Line::from(""));
                lines.push(Line::from(vec![
                    Span::styled("Modelo Ativo Selecionado por Padrão: ", Style::default().fg(Color::Gray)),
                    Span::styled(&record.selected_model, Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)),
                    Span::styled(format!(" (latência {}ms)", record.selected_latency_ms), Style::default().fg(Color::Green)),
                ]));
            } else {
                lines.push(Line::from(Span::styled("Nenhum teste prévio encontrado. Execute /auto test para iniciar um novo teste.", Style::default().fg(Color::Gray))));
            }

            let title = " Τ TELA DE TESTE DE DISPONIBILIDADE — Esc fechar · /auto test recarregar ";
            let para = Paragraph::new(lines)
                .block(Block::default().title(title).borders(Borders::ALL))
                .wrap(Wrap { trim: false });
            f.render_widget(para, area);
        }

        // Ctrl+P fuzzy file-search overlay.
        if app.view_open(crate::ui::bottom_pane::ViewKind::FileSearch) {
            let popup_w = 72.min(size.width.saturating_sub(4));
            let max_h = size.height.saturating_sub(2).max(4);
            let popup_h = (app.bottom_pane.file_search.results.len() as u16 + 4).min(max_h);
            let x = size.x + (size.width.saturating_sub(popup_w)) / 2;
            let y = size.y + (size.height.saturating_sub(popup_h)) / 3;
            let area = Rect { x, y, width: popup_w, height: popup_h };
            let title = format!(
                " Open file · {} result{} · ↑/↓ · Enter open · Esc cancel ",
                app.bottom_pane.file_search.results.len(),
                if app.bottom_pane.file_search.results.len() == 1 { "" } else { "s" }
            );
            let mut lines: Vec<Line> = Vec::new();
            lines.push(Line::from(vec![
                Span::styled(
                    "❯ ",
                    Style::default().fg(Color::Green).add_modifier(Modifier::BOLD),
                ),
                Span::styled(
                    app.bottom_pane.file_search.query.clone(),
                    Style::default().fg(Color::White),
                ),
            ]));
            lines.push(Line::from(""));
            if app.bottom_pane.file_search.results.is_empty() {
                let hint = if app.bottom_pane.file_search.query.is_empty() {
                    "type to filter workspace files…"
                } else {
                    "no matches"
                };
                lines.push(Line::from(Span::styled(
                    hint,
                    Style::default().fg(Color::Gray),
                )));
            } else {
                for (i, m) in app.bottom_pane.file_search.results.iter().enumerate() {
                    let selected = i == app.bottom_pane.file_search.selected;
                    let mut spans: Vec<Span> = vec![Span::styled(
                        if selected { "▶ " } else { "  " },
                        Style::default().fg(Color::Yellow),
                    )];
                    for (start, end, matched) in file_search::highlight_segments(&m.path, &m.indices) {
                        let style = if matched {
                            Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)
                        } else if selected {
                            Style::default().fg(Color::White)
                        } else {
                            Style::default().fg(Color::Gray)
                        };
                        spans.push(Span::styled(m.path[start..end].to_string(), style));
                    }
                    lines.push(Line::from(spans));
                }
            }
            let para = Paragraph::new(lines)
                .block(Block::default().title(title).borders(Borders::ALL))
                .wrap(Wrap { trim: true });
            f.render_widget(para, area);
        }

        // Approval modal (write/command policy set to `ask`).
        if let Some(request) = &app.pending_approval {
            let popup_w = 76.min(size.width.saturating_sub(4));
            let popup_h = 9.min(size.height.saturating_sub(4));
            let area = Rect {
                x: size.x + (size.width.saturating_sub(popup_w)) / 2,
                y: size.y + (size.height.saturating_sub(popup_h)) / 2,
                width: popup_w,
                height: popup_h,
            };
            f.render_widget(Clear, area);
            let body = vec![
                Line::from(Span::styled(
                    format!("Permission requested: {}", request.tool),
                    Style::default()
                        .fg(Color::Yellow)
                        .add_modifier(Modifier::BOLD),
                )),
                Line::from(Span::raw(request.summary.clone())),
                Line::from(Span::styled(
                    format!("Risk: {}", request.risk),
                    Style::default().fg(Color::Gray),
                )),
                Line::from(Span::raw("")),
                Line::from(Span::styled(
                    "[a] allow once   [s] allow for session   [d/Esc] deny",
                    Style::default().fg(Color::Cyan),
                )),
            ];
            let paragraph = Paragraph::new(body)
                .block(
                    Block::default()
                        .title(" Permission ")
                        .borders(Borders::ALL)
                        .border_style(Style::default().fg(Color::Yellow)),
                )
                .wrap(Wrap { trim: true });
            f.render_widget(paragraph, area);
        }

        // Plan approval modal (Plan mode).
        if let Some(request) = &app.pending_plan_approval {
            let popup_w = 80.min(size.width.saturating_sub(4));
            let step_count = request.steps.len();
            let popup_h = ((4 + step_count.min(12)) as u16).min(size.height.saturating_sub(4));
            let area = Rect {
                x: size.x + (size.width.saturating_sub(popup_w)) / 2,
                y: size.y + (size.height.saturating_sub(popup_h)) / 3,
                width: popup_w,
                height: popup_h,
            };
            let mut body = vec![
                Line::from(Span::styled(
                    format!("Plan: {} step(s)", step_count),
                    Style::default()
                        .fg(Color::Yellow)
                        .add_modifier(Modifier::BOLD),
                )),
                Line::from(Span::raw("")),
            ];
            for (i, step) in request.steps.iter().take(12).enumerate() {
                let cmd = step.command.as_deref().unwrap_or("");
                let file = step.filename.as_deref().unwrap_or("");
                let desc = if !cmd.is_empty() {
                    format!("  {}. [{}] {} — `{}`", i + 1, step.step_type, step.description, cmd)
                } else if !file.is_empty() {
                    format!("  {}. [{}] {} ({})", i + 1, step.step_type, step.description, file)
                } else {
                    format!("  {}. [{}] {}", i + 1, step.step_type, step.description)
                };
                body.push(Line::from(Span::raw(desc)));
            }
            if step_count > 12 {
                body.push(Line::from(Span::styled(
                    format!("  … and {} more step(s)", step_count - 12),
                    Style::default().fg(Color::Gray),
                )));
            }
            body.push(Line::from(Span::raw("")));
            body.push(Line::from(Span::styled(
                "a/s: approve   d/Esc: deny",
                Style::default().fg(Color::Cyan),
            )));
            let paragraph = Paragraph::new(body)
                .block(
                    Block::default()
                        .title(" Plan approval required ")
                        .borders(Borders::ALL),
                )
                .wrap(Wrap { trim: true });
            f.render_widget(paragraph, area);
        }

        // Key input modal
        if app.key_input_popup {
            let popup_w = 72.min(size.width.saturating_sub(4));
            let popup_h = 7.min(size.height.saturating_sub(4));
            let area = Rect {
                x: size.x + (size.width.saturating_sub(popup_w)) / 2,
                y: size.y + (size.height.saturating_sub(popup_h)) / 3,
                width: popup_w,
                height: popup_h,
            };
            f.render_widget(Clear, area);

            let masked = if app.key_input_value.len() <= 6 {
                "*".repeat(app.key_input_value.len())
            } else {
                let tail = &app.key_input_value[app.key_input_value.len() - 4..];
                format!("{}...{}", "*".repeat(app.key_input_value.len() - 4), tail)
            };

            let lines = vec![
                Line::from(vec![
                    Span::styled(
                        format!("Provedor: {}", app.key_input_provider),
                        Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD),
                    ),
                ]),
                Line::from(vec![
                    Span::styled("API Key: ", Style::default().fg(Color::Yellow)),
                    Span::styled(
                        if app.key_input_value.is_empty() { "<digite ou cole a API key>" } else { &masked },
                        if app.key_input_value.is_empty() { Style::default().fg(Color::DarkGray) } else { Style::default().fg(Color::White).add_modifier(Modifier::BOLD) },
                    ),
                ]),
                Line::from(Span::styled(
                    "Enter salvar & escolher modelo · Esc cancelar",
                    Style::default().fg(Color::Gray),
                )),
            ];

            let block = Block::default()
                .title(format!(" Configurar API Key: {} ", app.key_input_provider))
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::Yellow));

            let para = Paragraph::new(lines).block(block);
            f.render_widget(para, area);
        }
    })?;
    Ok(())
}

fn display_role(role: &str) -> String {
    match role {
        "user" => "User".into(),
        "assistant" => "Assistant".into(),
        _ => role.to_string(),
    }
}

/// Count the number of visual lines produced when wrapping `lines` to
/// `width` cells. Used for scroll-offset math so that `scroll_offset`
/// tracks visual rows, not logical `Line` entries.
/// Number of visual rows a set of lines occupies once wrapped at `width`.
/// Delegates to ratatui's own `Paragraph::line_count` so the count always
/// matches how the widget will actually render (WordWrapper, trim, spans
/// concatenated without separators).
fn count_wrapped_lines(lines: &[Line<'static>], width: usize) -> usize {
    if width == 0 {
        return lines.len();
    }
    Paragraph::new(lines.to_vec())
        .wrap(Wrap { trim: true })
        .line_count(width as u16)
}

/// Flatten chat messages into renderable transcript lines (Codex-style):
/// user messages use a bold-dim `›` prefix, assistant messages render markdown
/// with a dim `•` bullet, and status/tool messages stay compact and subdued.
/// Flush accumulated tool calls into a rollup summary or individual lines.
fn flush_tool_rollup(
    app: &App,
    count: &mut usize,
    buffer: &mut Vec<String>,
    lines: &mut Vec<Line<'static>>,
) {
    if *count == 0 {
        return;
    }
    let expanded = app.tool_calls_expanded;
    if expanded {
        for content in buffer.drain(..) {
            lines.extend(status_message_lines("tool", &content));
            lines.push(Line::from(""));
        }
    } else {
        let summary = format_tool_rollup(buffer);
        lines.extend(status_message_lines("tool", &summary));
    }
    *count = 0;
    buffer.clear();
}

/// Flush terminal output as a separate collapsible transcript item.
fn flush_terminal_rollup(
    app: &App,
    count: &mut usize,
    buffer: &mut Vec<String>,
    lines: &mut Vec<Line<'static>>,
) {
    if *count == 0 {
        return;
    }
    if app.tool_calls_expanded {
        for content in buffer.drain(..) {
            lines.extend(status_message_lines("terminal", &content));
            lines.push(Line::from(""));
        }
    } else {
        let summary = if *count == 1 {
            "Terminal output (collapsed)".to_string()
        } else {
            format!("Terminal output ×{} (collapsed)", *count)
        };
        lines.extend(status_message_lines("terminal", &summary));
    }
    *count = 0;
    buffer.clear();
}

/// Build a rollup summary string from tool call contents.
/// Groups by tool name and shows counts, e.g. "Read file, Glob, Bash ×5".
/// Active (streaming) tool calls are marked with a ● prefix.
fn format_tool_rollup(buffer: &[String]) -> String {
    let mut counts: std::collections::BTreeMap<String, usize> = std::collections::BTreeMap::new();
    let mut active_tools: Vec<String> = Vec::new();
    for content in buffer {
        let name = extract_tool_name(content);
        if content.starts_with("Δ ") {
            if !active_tools.contains(&name) {
                active_tools.push(name.clone());
            }
        }
        *counts.entry(name).or_insert(0) += 1;
    }
    let parts: Vec<String> = counts
        .iter()
        .map(|(name, &count)| {
            let is_active = active_tools.contains(name);
            let prefix = if is_active { "● " } else { "" };
            if count > 1 {
                format!("{prefix}{name} ×{count}")
            } else {
                format!("{prefix}{name}")
            }
        })
        .collect();
    let total = buffer.len();
    let plural = if total == 1 { "" } else { "s" };
    format!("{} tool use{}: {}", total, plural, parts.join(", "))
}

/// Extract the tool name from a tool call content string.
/// Handles both "Δ name[idx] ..." (delta) and "name — summary" (completed) formats.
fn extract_tool_name(content: &str) -> String {
    if let Some(rest) = content.strip_prefix("Δ ") {
        let end = rest.find(['[', ' ']).unwrap_or(rest.len());
        rest[..end].to_string()
    } else if let Some(pos) = content.find(' ') {
        content[..pos].to_string()
    } else {
        content.to_string()
    }
}

/// Flush accumulated thinking content into a single cohesive block.
fn flush_thinking_rollup(
    app: &App,
    buffer: &mut Vec<String>,
    lines: &mut Vec<Line<'static>>,
) {
    if buffer.is_empty() {
        return;
    }
    let total_content = buffer.join(" ");
    buffer.clear();
    let trimmed = total_content.trim();
    if trimmed.is_empty() {
        return;
    }
    if app.reasoning_expanded {
        let mut is_first = true;
        for line in trimmed.lines() {
            let t = line.trim();
            if t.is_empty() {
                continue;
            }
            let prefix = if is_first {
                is_first = false;
                "δ "
            } else {
                "   "
            };
            lines.push(Line::from(vec![
                Span::styled(prefix, Style::default().fg(Color::DarkGray)),
                Span::styled(
                    t.to_string(),
                    Style::default()
                        .fg(Color::DarkGray)
                        .add_modifier(Modifier::ITALIC),
                ),
            ]));
        }
    } else {
        let summary = format!("Thinking ({} chars)", trimmed.chars().count());
        lines.extend(status_message_lines("thinking", &summary));
    }
}

fn flatten_messages(app: &App) -> Vec<Line<'static>> {
    let mut lines = Vec::new();
    let mut tool_count = 0usize;
    let mut tool_buffer = Vec::new();
    let mut terminal_count = 0usize;
    let mut terminal_buffer = Vec::new();
    let mut thinking_buffer = Vec::new();
    let mut in_plan = false;

    for cell in crate::ui::history_cell::from_messages(&app.messages) {
        let role = cell.role;
        let content_owned = sanitize_ui_symbols(cell.content);
        let content = content_owned.as_str();
        match role.to_ascii_lowercase().as_str() {
            "user" => {
                in_plan = false;
                flush_thinking_rollup(app, &mut thinking_buffer, &mut lines);
                flush_tool_rollup(app, &mut tool_count, &mut tool_buffer, &mut lines);
                flush_terminal_rollup(app, &mut terminal_count, &mut terminal_buffer, &mut lines);
                lines.extend(user_message_lines(content));
            }
            "assistant" => {
                in_plan = false;
                flush_thinking_rollup(app, &mut thinking_buffer, &mut lines);
                flush_tool_rollup(app, &mut tool_count, &mut tool_buffer, &mut lines);
                flush_terminal_rollup(app, &mut terminal_count, &mut terminal_buffer, &mut lines);
                lines.extend(assistant_message_lines(content));
            }
            "thinking" => {
                in_plan = false;
                flush_tool_rollup(app, &mut tool_count, &mut tool_buffer, &mut lines);
                flush_terminal_rollup(app, &mut terminal_count, &mut terminal_buffer, &mut lines);
                thinking_buffer.push(content.to_string());
            }
            "plan" => {
                in_plan = true;
                flush_thinking_rollup(app, &mut thinking_buffer, &mut lines);
                flush_tool_rollup(app, &mut tool_count, &mut tool_buffer, &mut lines);
                flush_terminal_rollup(app, &mut terminal_count, &mut terminal_buffer, &mut lines);
                lines.extend(status_message_lines(role, content));
            }
            "tool" => {
                flush_thinking_rollup(app, &mut thinking_buffer, &mut lines);
                flush_terminal_rollup(app, &mut terminal_count, &mut terminal_buffer, &mut lines);
                if app.tool_calls_expanded {
                    flush_tool_rollup(app, &mut tool_count, &mut tool_buffer, &mut lines);
                    if in_plan {
                        lines.extend(plan_tool_message_lines(content));
                    } else {
                        lines.extend(status_message_lines(role, content));
                    }
                } else {
                    tool_count += 1;
                    tool_buffer.push(content.to_string());
                }
            }
            "terminal" => {
                flush_thinking_rollup(app, &mut thinking_buffer, &mut lines);
                flush_tool_rollup(app, &mut tool_count, &mut tool_buffer, &mut lines);
                terminal_count += 1;
                terminal_buffer.push(content.to_string());
            }
            _ => {
                in_plan = false;
                flush_thinking_rollup(app, &mut thinking_buffer, &mut lines);
                flush_tool_rollup(app, &mut tool_count, &mut tool_buffer, &mut lines);
                flush_terminal_rollup(app, &mut terminal_count, &mut terminal_buffer, &mut lines);
                lines.extend(status_message_lines(role, content));
            }
        }
    }
    flush_thinking_rollup(app, &mut thinking_buffer, &mut lines);
    flush_tool_rollup(app, &mut tool_count, &mut tool_buffer, &mut lines);
    flush_terminal_rollup(app, &mut terminal_count, &mut terminal_buffer, &mut lines);
    lines
}

/// Render a tool message inside a plan step with ⎿ child indentation.
fn plan_tool_message_lines(content: &str) -> Vec<Line<'static>> {
    let mut out = Vec::new();
    for line in content.lines() {
        let mut spans = Vec::new();
        spans.push(Span::styled("⎿ ", Style::default().fg(Color::Gray)));
        spans.push(Span::styled(
            line.to_string(),
            Style::default().fg(Color::Gray),
        ));
        out.push(Line::from(spans));
    }
    out
}

/// Codex-style user cell: `› ` (bold dim) on the first line, `  ` continuation.
fn user_message_lines(content: &str) -> Vec<Line<'static>> {
    let mut out = Vec::new();
    let style = Style::default().fg(Color::LightBlue);
    let mut first = true;
    for content_line in content.lines() {
        let prefix = if first {
            Span::styled(
                "› ",
                Style::default()
                    .add_modifier(Modifier::BOLD)
                    .add_modifier(Modifier::DIM),
            )
        } else {
            Span::styled("  ", Style::default())
        };
        first = false;
        out.push(Line::from(vec![
            prefix,
            Span::styled(content_line.to_string(), style),
        ]));
    }
    if first {
        // Empty message: render the prompt prefix so the cell stays visible.
        out.push(Line::from(vec![Span::styled(
            "› ",
            Style::default()
                .add_modifier(Modifier::BOLD)
                .add_modifier(Modifier::DIM),
        )]));
    }
    out
}

/// Codex-style assistant cell: markdown rendered, first line prefixed with
/// `• ` (dim), continuation lines with two spaces.
fn assistant_message_lines(content: &str) -> Vec<Line<'static>> {
    if content.trim().is_empty() {
        return Vec::new();
    }
    let raw_spans = match render_markdown_lines(content) {
        Some(spans) => spans,
        None => vec![Span::styled(
            content.to_string(),
            Style::default().fg(Color::Gray),
        )],
    };

    let mut out = Vec::new();
    let mut current_line_spans: Vec<Span<'static>> = Vec::new();
    let mut is_first_line = true;

    for span in raw_spans {
        if span.content.contains('\n') {
            let parts: Vec<&str> = span.content.split('\n').collect();
            for (idx, part) in parts.iter().enumerate() {
                if !part.is_empty() {
                    current_line_spans.push(Span::styled((*part).to_string(), span.style));
                }
                if idx < parts.len() - 1 {
                    let prefix = if is_first_line {
                        is_first_line = false;
                        Span::styled("• ", Style::default().add_modifier(Modifier::DIM))
                    } else {
                        Span::styled("  ", Style::default())
                    };
                    let mut line_spans = vec![prefix];
                    line_spans.append(&mut current_line_spans);
                    out.push(Line::from(line_spans));
                }
            }
        } else {
            current_line_spans.push(span);
        }
    }

    if !current_line_spans.is_empty() {
        let prefix = if is_first_line {
            Span::styled("• ", Style::default().add_modifier(Modifier::DIM))
        } else {
            Span::styled("  ", Style::default())
        };
        let mut line_spans = vec![prefix];
        line_spans.append(&mut current_line_spans);
        out.push(Line::from(line_spans));
    }

    out
}

/// Merge runs of consecutive blank spans (a lone `\n` splits into two empty
/// pieces) so paragraphs are separated by exactly one blank line.
fn collapse_consecutive_blanks(spans: Vec<Span<'static>>) -> Vec<Span<'static>> {
    let mut out: Vec<Span<'static>> = Vec::with_capacity(spans.len());
    for span in spans {
        let blank = span.content.trim().is_empty();
        if blank
            && out
                .last()
                .is_some_and(|last: &Span<'static>| last.content.trim().is_empty())
        {
            continue;
        }
        out.push(span);
    }
    out
}

/// Compact subdued cell for system/tool/plan/error/verify/workspace messages.
fn status_message_lines(role: &str, content: &str) -> Vec<Line<'static>> {
    let lower = role.to_ascii_lowercase();
    let (prefix, prefix_style, content_style, italic) = match lower.as_str() {
        "error" => (
            "✗ ",
            Style::default().fg(Color::LightRed).add_modifier(Modifier::BOLD),
            Style::default().fg(Color::LightRed),
            false,
        ),
        "plan" => (
            "Π ",
            Style::default()
                .fg(Color::LightMagenta)
                .add_modifier(Modifier::BOLD),
            Style::default().fg(Color::LightMagenta),
            false,
        ),
        "thinking" => (
            "δ ",
            Style::default().fg(Color::DarkGray),
            Style::default().fg(Color::DarkGray),
            true,
        ),
        "tool" => {
            let is_active = content.starts_with('Δ');
            let is_rollup = content.contains("tool use");
            let icon = if is_rollup {
                "↳ "
            } else if content.contains("list_dir")
                || content.contains("search")
                || content.contains("grep")
            {
                "Σ "
            } else if content.contains("read") {
                "Ρ "
            } else if content.contains("write")
                || content.contains("replace")
                || content.contains("edit")
            {
                "Ε "
            } else if content.contains("run")
                || content.contains("exec")
                || content.contains("cargo")
                || content.contains("command")
            {
                "Ω "
            } else if content.contains("verify") || content.contains("test") {
                "Τ "
            } else if is_active {
                "· "
            } else {
                "Ω "
            };
            let prefix_style = if is_active {
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default().fg(Color::LightCyan)
            };
            let content_style = if is_active {
                Style::default().fg(Color::Cyan)
            } else {
                Style::default().fg(Color::Gray)
            };
            (icon, prefix_style, content_style, false)
        }
        "terminal" => (
            "$ ",
            Style::default().fg(Color::LightYellow).add_modifier(Modifier::BOLD),
            Style::default().fg(Color::Gray),
            false,
        ),
        "file" => (
            "↳ ",
            Style::default().fg(Color::Cyan),
            Style::default().fg(Color::Cyan),
            false,
        ),
        "verify" => (
            "Τ ",
            Style::default().fg(Color::LightYellow),
            Style::default().fg(Color::Gray),
            false,
        ),
        "workspace" => (
            "",
            Style::default(),
            Style::default().fg(Color::Gray),
            false,
        ),
        "approval" => (
            "✓ ",
            Style::default().fg(Color::Green).add_modifier(Modifier::BOLD),
            Style::default().fg(Color::Green),
            false,
        ),
        "info" | "system" => {
            if content.starts_with('✓') {
                (
                    "",
                    Style::default().fg(Color::Green),
                    Style::default().fg(Color::Green),
                    false,
                )
            } else if content.starts_with('✗') {
                (
                    "",
                    Style::default().fg(Color::LightRed),
                    Style::default().fg(Color::LightRed),
                    false,
                )
            } else {
                (
                    "",
                    Style::default(),
                    Style::default().fg(Color::Gray),
                    false,
                )
            }
        }
        _ => ("", Style::default(), Style::default().fg(Color::Gray), false),
    };
    let clean = strip_ansi_and_controls(content);
    let mut out = Vec::new();
    let mut first = true;
    for content_line in clean.lines() {
        if content_line.trim().is_empty() {
            continue;
        }
        let mut spans = Vec::new();
        if first {
            if !prefix.is_empty() {
                spans.push(Span::styled(prefix, prefix_style));
            }
        } else {
            let indent = " ".repeat(display_width(prefix));
            spans.push(Span::styled(indent, Style::default()));
        }
        first = false;
        let style = if italic {
            content_style.add_modifier(Modifier::ITALIC)
        } else {
            content_style
        };
        spans.push(Span::styled(content_line.to_string(), style));
        out.push(Line::from(spans));
    }
    if first && !prefix.is_empty() {
        out.push(Line::from(vec![Span::styled(prefix, prefix_style)]));
    }
    out
}

/// Insert a block-level separator span unless one was just inserted (so
/// stacked block boundaries like `End(List)` + `Start(Paragraph)` collapse to
/// a single break instead of producing empty rows). Never inserts a leading
/// break for the first block of the message.
fn push_block_sep(spans: &mut Vec<Span<'static>>, sep: &str) {
    if spans.is_empty() {
        return;
    }
    if spans.last().is_some_and(|s| s.content.ends_with('\n')) {
        return;
    }
    spans.push(Span::raw(sep.to_string()));
}

fn render_markdown_lines(text: &str) -> Option<Vec<Span<'static>>> {
    let mut spans: Vec<Span<'static>> = Vec::new();
    let mut in_code_block = false;
    let mut code_block_text = String::new();

    let lines: Vec<&str> = text.split('\n').collect();
    for (i, raw_line) in lines.iter().enumerate() {
        let line = raw_line.trim_end();

        // Fenced code block toggle
        if line.starts_with("```") {
            if in_code_block {
                spans.push(Span::styled(
                    code_block_text.clone(),
                    Style::default()
                        .fg(Color::LightYellow)
                        .bg(Color::Rgb(30, 30, 30))
                        .add_modifier(Modifier::BOLD),
                ));
                code_block_text.clear();
                in_code_block = false;
            } else {
                in_code_block = true;
                code_block_text.clear();
            }
            continue;
        }

        if in_code_block {
            if !code_block_text.is_empty() {
                code_block_text.push('\n');
            }
            code_block_text.push_str(line);
            continue;
        }

        // Empty line
        if line.trim().is_empty() {
            push_block_sep(&mut spans, "\n\n");
            continue;
        }

        // Horizontal Rule
        if line.starts_with("---") || line.starts_with("***") || line.starts_with("___") {
            push_block_sep(&mut spans, "\n");
            spans.push(Span::styled("─".repeat(40), Style::default().fg(Color::DarkGray)));
            continue;
        }

        // Headings
        if let Some(rest) = line.strip_prefix("# ") {
            push_block_sep(&mut spans, "\n\n");
            spans.push(Span::styled("◆ ", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)));
            render_inline(rest, &mut spans, Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD));
            push_block_sep(&mut spans, "\n");
            continue;
        } else if let Some(rest) = line.strip_prefix("## ") {
            push_block_sep(&mut spans, "\n\n");
            spans.push(Span::styled("◈ ", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)));
            render_inline(rest, &mut spans, Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD));
            push_block_sep(&mut spans, "\n");
            continue;
        } else if let Some(rest) = line.strip_prefix("### ") {
            push_block_sep(&mut spans, "\n\n");
            spans.push(Span::styled("▪ ", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)));
            render_inline(rest, &mut spans, Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD));
            push_block_sep(&mut spans, "\n");
            continue;
        }

        // List item (- or * or +)
        let trimmed_start = line.trim_start();
        if trimmed_start.starts_with("- ") || trimmed_start.starts_with("* ") || trimmed_start.starts_with("+ ") {
            push_block_sep(&mut spans, "\n");
            spans.push(Span::styled("• ", Style::default().fg(Color::LightCyan)));
            let item_text = &trimmed_start[2..];
            render_inline(item_text, &mut spans, Style::default());
            continue;
        }

        // Numbered list item
        let first_word = trimmed_start.split_whitespace().next().unwrap_or("");
        if first_word.ends_with('.') && first_word[..first_word.len() - 1].chars().all(|c| c.is_ascii_digit()) {
            push_block_sep(&mut spans, "\n");
            spans.push(Span::styled("• ", Style::default().fg(Color::LightCyan)));
            let item_text = trimmed_start[first_word.len()..].trim_start();
            render_inline(item_text, &mut spans, Style::default());
            continue;
        }

        // Blockquote
        if let Some(rest) = line.strip_prefix("> ") {
            push_block_sep(&mut spans, "\n");
            spans.push(Span::styled("▎ ", Style::default().fg(Color::Gray)));
            render_inline(rest, &mut spans, Style::default().fg(Color::Gray));
            continue;
        }

        // Table row
        if line.starts_with('|') && line.ends_with('|') {
            let inner = &line[1..line.len() - 1];
            // Check if delimiter row
            if inner.chars().all(|c| c == '-' || c == '|' || c == ':' || c == ' ') {
                push_block_sep(&mut spans, "\n");
                spans.push(Span::styled(
                    "├──────────────────────────┼──────────────────────────────────────────┤",
                    Style::default().fg(Color::DarkGray),
                ));
                continue;
            }

            push_block_sep(&mut spans, "\n");
            spans.push(Span::styled("│ ", Style::default().fg(Color::DarkGray)));
            let cells: Vec<&str> = inner.split('|').collect();
            for (c_idx, cell) in cells.iter().enumerate() {
                if c_idx > 0 {
                    spans.push(Span::styled(" │ ", Style::default().fg(Color::DarkGray)));
                }
                render_inline(cell.trim(), &mut spans, Style::default());
            }
            spans.push(Span::styled(" │", Style::default().fg(Color::DarkGray)));
            continue;
        }

        // Regular paragraph / text line
        if i > 0 && !spans.is_empty() && !spans.last().is_some_and(|s| s.content.ends_with('\n')) {
            spans.push(Span::raw("\n".to_string()));
        }
        render_inline(line, &mut spans, Style::default());
    }

    if in_code_block && !code_block_text.is_empty() {
        spans.push(Span::styled(
            code_block_text,
            Style::default()
                .fg(Color::LightYellow)
                .bg(Color::Rgb(30, 30, 30))
                .add_modifier(Modifier::BOLD),
        ));
    }

    if !spans.is_empty() {
        Some(spans)
    } else {
        None
    }
}

/// Helper for rendering bold, italic, code spans in a single line without regex.
fn render_inline(mut text: &str, spans: &mut Vec<Span<'static>>, base_style: Style) {
    while !text.is_empty() {
        // Look for code `...`
        if let Some(start) = text.find('`') {
            if let Some(end) = text[start + 1..].find('`') {
                let before = &text[..start];
                if !before.is_empty() {
                    render_inline_styling(before, spans, base_style);
                }
                let code_content = &text[start + 1..start + 1 + end];
                spans.push(Span::styled(
                    code_content.to_string(),
                    Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD),
                ));
                text = &text[start + 1 + end + 1..];
                continue;
            }
        }

        // No code span, render text with formatting
        render_inline_styling(text, spans, base_style);
        break;
    }
}

fn render_inline_styling(mut text: &str, spans: &mut Vec<Span<'static>>, base_style: Style) {
    while !text.is_empty() {
        // Check for bold **...**
        if let Some(start) = text.find("**") {
            if let Some(end) = text[start + 2..].find("**") {
                let before = &text[..start];
                if !before.is_empty() {
                    spans.push(Span::styled(before.to_string(), base_style));
                }
                let bold_content = &text[start + 2..start + 2 + end];
                spans.push(Span::styled(
                    bold_content.to_string(),
                    base_style.add_modifier(Modifier::BOLD),
                ));
                text = &text[start + 2 + end + 2..];
                continue;
            }
        }

        // Normal text
        spans.push(Span::styled(text.to_string(), base_style));
        break;
    }
}

/// Split any span that embeds newlines (e.g. a fenced code block) into one
/// span per display row, so each entry in the returned list occupies exactly
/// one terminal line. Keeps vertical scroll math exact in `flatten_messages`.
fn expand_multiline_spans(spans: Vec<Span<'static>>) -> Vec<Span<'static>> {
    let mut out = Vec::new();
    for span in spans {
        if span.content.contains('\n') {
            for piece in span.content.split('\n') {
                let mut line = span.clone();
                line.content = piece.to_string().into();
                out.push(line);
            }
        } else {
            out.push(span);
        }
    }
    out
}

/// Truncate a string to at most `max` display columns, keeping the head and
/// appending an ellipsis on overflow. Operates on grapheme clusters so
/// combining marks and wide (CJK) characters never split mid-glyph.
fn truncate_str(s: &str, max: usize) -> String {
    if max == 0 || display_width(s) <= max {
        return s.to_string();
    }
    let target = max.saturating_sub(1);
    let mut used = 0usize;
    let mut end = 0usize;
    for (idx, grapheme) in grapheme_indices(s) {
        let grapheme_width = display_width(grapheme);
        if used + grapheme_width > target {
            break;
        }
        used += grapheme_width;
        end = idx + grapheme.len();
    }
    let mut out: String = s[..end].to_string();
    out.push('…');
    out
}

/// Strip ANSI escape codes and control characters (\r, cursor jumps, color codes)
/// from tool output or text before passing into Ratatui spans.
/// Prevents terminal corruption on Windows Terminal / crossterm.
pub fn strip_ansi_and_controls(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut chars = input.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\x1b' {
            if let Some(&'[') = chars.peek() {
                chars.next();
                while let Some(&next) = chars.peek() {
                    chars.next();
                    if next.is_ascii_alphabetic() || next == '~' || next == '@' {
                        break;
                    }
                }
            } else if let Some(&']') = chars.peek() {
                chars.next();
                while let Some(next) = chars.next() {
                    if next == '\x07' || (next == '\x1b' && chars.peek() == Some(&'\\')) {
                        if next == '\x1b' {
                            chars.next();
                        }
                        break;
                    }
                }
            } else if let Some(&'(') | Some(&')') = chars.peek() {
                chars.next();
                let _ = chars.next();
            }
            continue;
        }
        if c == '\r' {
            if chars.peek() != Some(&'\n') {
                out.push('\n');
            }
            continue;
        }
        if c == '\t' {
            out.push_str("    ");
            continue;
        }
        if c == '\n' || !c.is_control() {
            out.push(c);
        }
    }
    out
}

/// Collapse a status message to a single display line: newlines/carriage
/// returns become spaces and repeated whitespace is squeezed, so the fixed
/// status row can never render as stacked lines (e.g. fallback error chains).
fn sanitize_status(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut prev_ws = false;
    for ch in s.chars() {
        if ch == '\n' || ch == '\r' || ch == '\t' || ch == ' ' {
            if !prev_ws {
                out.push(' ');
                prev_ws = true;
            }
        } else {
            out.push(ch);
            prev_ws = false;
        }
    }
    sanitize_ui_symbols(&out)
}

/// Keep the TUI glyph vocabulary predictable across terminal fonts. Decorative
/// emoji/check/warning glyphs are rendered as compact text or Greek markers;
/// box-drawing characters remain available for layout.
fn sanitize_ui_symbols(s: &str) -> String {
    s.chars()
        .map(|ch| match ch {
            '✓' => 'v',
            '✗' => 'x',
            '⚠' => '!',
            '●' | '•' => '·',
            '❯' | '▶' => '>',
            '▼' => 'v',
            '⎇' => 'G',
            '✦' => '*',
            _ => ch,
        })
        .collect()
}

/// Copy text to system clipboard using OSC 52 escape sequence.
/// Works in most modern terminals (Alacritty, Kitty, WezTerm, iTerm2, Windows Terminal, etc.)
fn copy_to_clipboard(text: &str) {
    let encoded = crate::base64::encode(text);
    let osc52 = format!("\x1b]52;c;{}\x07", encoded);
    let _ = io::stdout().write_all(osc52.as_bytes());
    let _ = io::stdout().flush();
}

fn format_elapsed(d: Duration) -> String {
    let s = d.as_secs();
    if s < 60 {
        format!("{s}s")
    } else if s < 3600 {
        format!("{}m {:02}s", s / 60, s % 60)
    } else {
        format!("{}h {:02}m", s / 3600, (s % 3600) / 60)
    }
}

fn enable_raw_mode() -> Result<(), Box<dyn Error>> {
    crate::ui::engine::crossterm::terminal::enable_raw_mode()?;
    Ok(())
}

fn disable_raw_mode() -> Result<(), Box<dyn Error>> {
    crate::ui::engine::crossterm::terminal::disable_raw_mode()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn truncate_keeps_short_strings() {
        assert_eq!(truncate_str("short", 22), "short");
    }

    #[test]
    fn truncate_keeps_head_and_appends_ellipsis() {
        let out = truncate_str("abcdefghijklmnop", 5);
        assert!(out.ends_with('…'));
        assert_eq!(out.chars().count(), 5);
        assert!(out.starts_with("abcd"));
    }

    #[test]
    fn truncate_handles_unicode() {
        let out = truncate_str("olá mundo feliz", 6);
        assert_eq!(out.chars().count(), 6);
        assert!(out.starts_with("olá m"));
    }

    #[test]
    fn truncate_respects_display_width_of_wide_chars() {
        // "界" occupies 2 columns: budget of 4 fits "a界" plus ellipsis.
        let out = truncate_str("a界bc", 4);
        assert_eq!(out, "a界…");
        assert_eq!(display_width(&out), 4);
    }

    #[test]
    fn format_elapsed_seconds() {
        assert_eq!(format_elapsed(Duration::from_secs(42)), "42s");
    }

    #[test]
    fn format_elapsed_minutes() {
        assert_eq!(format_elapsed(Duration::from_secs(125)), "2m 05s");
    }

    #[test]
    fn format_elapsed_hours() {
        assert_eq!(format_elapsed(Duration::from_secs(7200)), "2h 00m");
    }

    #[test]
    fn display_role_maps_user_and_assistant() {
        assert_eq!(display_role("user"), "User");
        assert_eq!(display_role("assistant"), "Assistant");
        assert_eq!(display_role("system"), "system");
    }

    #[test]
    fn sanitize_status_removes_newlines() {
        assert_eq!(sanitize_status("a\nb"), "a b");
        assert_eq!(sanitize_status("a\r\nb"), "a b");
        assert_eq!(sanitize_status("a\tb"), "a b");
        assert_eq!(sanitize_status("a\n\nb"), "a b");
        assert_eq!(sanitize_status(" a b "), " a b ");
    }

    #[test]
    fn strip_ansi_and_controls_removes_vt100_escapes_and_crs() {
        assert_eq!(strip_ansi_and_controls("\x1b[32m✓ pass\x1b[0m"), "✓ pass");
        assert_eq!(strip_ansi_and_controls("\x1b[1A\x1b[2Kprogress\r\ndone"), "progress\ndone");
        assert_eq!(strip_ansi_and_controls("col1\tcol2"), "col1    col2");
        assert_eq!(strip_ansi_and_controls("line\rline"), "line\nline");
    }

    #[test]
    fn expand_multiline_spans_splits_code_blocks() {
        let spans = vec![
            Span::raw("before"),
            Span::raw("let x = 1;\nlet y = 2;\nlet z = 3;"),
            Span::raw("after"),
        ];
        let out = expand_multiline_spans(spans);
        let texts: Vec<&str> = out.iter().map(|s| s.content.as_ref()).collect();
        assert_eq!(
            texts,
            vec!["before", "let x = 1;", "let y = 2;", "let z = 3;", "after"]
        );
        assert!(out.iter().all(|s| !s.content.contains('\n')));
    }

    #[test]
    fn feed_tool_delta_accumulates_on_one_line() {
        let mut app = App::new("model");
        app.feed_tool_delta(0, "edit_file", "{\"path\":");
        app.feed_tool_delta(0, "?", "\"a.rs\",");
        app.feed_tool_delta(0, "?", "\"new\":1}");
        assert_eq!(app.messages.len(), 1);
        assert_eq!(app.messages[0].0, "Tool");
        assert_eq!(
            app.messages[0].1,
            "Δ edit_file[0] {\"path\":\"a.rs\",\"new\":1}"
        );
    }

    #[test]
    fn feed_tool_delta_starts_new_line_for_new_index() {
        let mut app = App::new("model");
        app.feed_tool_delta(0, "read_file", "a");
        app.feed_tool_delta(1, "edit_file", "b");
        assert_eq!(app.messages.len(), 2);
        assert!(app.messages[0].1.starts_with("Δ read_file[0]"));
        assert!(app.messages[1].1.starts_with("Δ edit_file[1]"));
    }

    #[test]
    fn feed_text_delta_accumulates_one_live_message() {
        let mut app = App::new("model");
        app.feed_text_delta("Hello ");
        app.feed_text_delta("world");
        assert_eq!(app.messages.len(), 1);
        assert_eq!(app.messages[0].0, "Assistant");
        assert_eq!(app.messages[0].1, "Hello world");
        assert!(app.streaming_assistant);
    }

    #[test]
    fn feed_text_delta_recovers_from_stale_stream_flag() {
        let mut app = App::new("model");
        app.streaming_assistant = true;
        app.feed_text_delta("fresh");
        assert_eq!(app.messages.len(), 1);
        assert_eq!(app.messages[0].1, "fresh");
    }

    #[test]
    fn end_streaming_replaces_live_message_once() {
        let mut app = App::new("model");
        app.feed_text_delta("partial ");
        app.feed_text_delta("text");
        let replaced = app.end_streaming(Some("final answer"));
        assert!(replaced);
        assert_eq!(app.messages.len(), 1);
        assert_eq!(app.messages[0].1, "final answer");
        assert!(!app.streaming_assistant);
        assert!(!app.end_streaming(Some("again")));
    }

    #[test]
    fn end_streaming_without_stream_noops() {
        let mut app = App::new("model");
        assert!(!app.end_streaming(Some("x")));
        assert!(app.messages.is_empty());
    }

    #[test]
    fn file_search_ranks_and_selects() {
        let mut app = App::new("model");
        app.open_file_search(vec![
            "src/main.rs".to_string(),
            "tests/main_test.rs".to_string(),
            "docs/README.md".to_string(),
        ]);
        assert!(app.view_open(crate::ui::bottom_pane::ViewKind::FileSearch));
        app.bottom_pane.file_search.query.push_str("s");
        app.refresh_file_search();
        assert_eq!(app.bottom_pane.file_search.results.len(), 3);
        assert_eq!(app.bottom_pane.file_search.results[0].path, "src/main.rs");
        app.move_file_search_selection(false);
        assert_eq!(app.bottom_pane.file_search.selected, 1);
        app.move_file_search_selection(false);
        assert_eq!(app.bottom_pane.file_search.selected, 2);
        app.move_file_search_selection(false);
        assert_eq!(app.bottom_pane.file_search.selected, 2);
        app.move_file_search_selection(true);
        assert_eq!(app.bottom_pane.file_search.selected, 1);
    }

    #[test]
    fn open_editor_loads_lines_and_focus() {
        let mut app = App::new("model");
        app.open_editor("src/main.rs", Some("fn main() {}\n// end"));
        assert!(app.focus == Focus::Editor);
        assert_eq!(app.editor_file.as_deref(), Some("src/main.rs"));
        assert_eq!(app.editor_lines, vec!["fn main() {}", "// end"]);
        assert_eq!(app.editor_row, 0);
        assert_eq!(app.editor_col, 0);
        assert!(!app.editor_dirty);
    }

    #[test]
    fn open_editor_handles_missing_content() {
        let mut app = App::new("model");
        app.open_editor("empty.txt", None);
        assert!(app.focus == Focus::Editor);
        assert!(app.editor_lines.is_empty());
    }

    #[test]
    fn git_branch_reports_no_git_outside_repo() {
        let dir = std::env::temp_dir();
        assert_eq!(git_branch(&dir), "no git");
    }

    fn test_app_state_router() -> (App, Arc<Mutex<AgentState>>, LlmRouter) {
        static COUNTER: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
        let id = COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let mut cfg = crate::config::settings::Config::default();
        let base = std::env::temp_dir().join(format!("chronokairo-ui-{}-{}", std::process::id(), id));
        cfg.workspace_dir = base.join("workspace");
        cfg.memory_dir = base.join("memory");
        let state = Arc::new(Mutex::new(
            crate::agent::state::AgentState::new(cfg).unwrap(),
        ));
        let app = App::new(&state.lock().unwrap().config.coder_model);
        let router = LlmRouter::new(crate::llm::client::LlmClient::ollama(
            "http://localhost:11434",
        ));
        (app, state, router)
    }

    #[test]
    fn flatten_messages_user_prefix_and_assistant_bullet() {
        let mut app = App::new("model");
        app.add_message("User", "fix the bug");
        app.add_message("Assistant", "Done.");
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        assert!(texts[0].starts_with("› fix the bug"));
        assert!(texts[1].starts_with("• Done."));
    }

    #[test]
    fn flatten_messages_status_cells_are_subdued() {
        let mut app = App::new("model");
        app.add_message("System", "ready");
        app.add_message("Error", "boom");
        app.add_message("Tool", "edit_file — changed src/main.rs");
        app.tool_calls_expanded = true;
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        assert_eq!(texts[0], "ready");
        assert!(texts[1].starts_with("✗ boom"));
        assert!(texts[2].contains("edit_file — changed src/main.rs"));
    }

    #[test]
    fn flatten_messages_collapses_tool_calls_when_expanded_is_false() {
        let mut app = App::new("model");
        app.tool_calls_expanded = false;
        app.add_message("Tool", "edit_file — changed src/main.rs");
        app.add_message("Tool", "run_tests — all passed");
        app.add_message("Tool", "bash — exit 0");
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        // All 3 tool calls should be collapsed into a single rollup line.
        let tool_lines: Vec<_> = texts.iter().filter(|t| t.starts_with("↳")).collect();
        assert_eq!(tool_lines.len(), 1);
        assert!(tool_lines[0].contains("3 tool uses"));
        assert!(tool_lines[0].contains("edit_file"));
    }

    #[test]
    fn flatten_messages_collapses_terminal_output_and_expands_it() {
        let mut app = App::new("model");
        app.add_message("Terminal", "cargo test [exit 0] [42ms]");
        app.add_message("Terminal", "stdout line");
        let collapsed: Vec<String> = flatten_messages(&app)
            .iter()
            .map(|line| line.to_string())
            .collect();
        assert_eq!(collapsed.len(), 1);
        assert!(collapsed[0].contains("Terminal output"));

        app.tool_calls_expanded = true;
        let expanded: Vec<String> = flatten_messages(&app)
            .iter()
            .map(|line| line.to_string())
            .collect();
        assert!(expanded.iter().any(|line| line.contains("cargo test")));
        assert!(expanded.iter().any(|line| line.contains("stdout line")));
    }

    #[test]
    fn extract_tool_name_handles_delta_and_completed_formats() {
        assert_eq!(
            extract_tool_name("Δ edit_file[0] {\"path\": \"a.rs\"}"),
            "edit_file"
        );
        assert_eq!(extract_tool_name("Δ run_tests[3] all passed"), "run_tests");
        assert_eq!(
            extract_tool_name("read_file — read src/main.rs"),
            "read_file"
        );
        assert_eq!(extract_tool_name("bash"), "bash");
    }

    #[test]
    fn flatten_messages_rollup_with_streaming_delta_does_not_panic() {
        let mut app = App::new("model");
        app.tool_calls_expanded = false;
        app.add_message("Tool", "read_file — read src/main.rs");
        app.feed_tool_delta(0, "edit_file", "{\"path\":\"a.rs\"}");
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        let tool_lines: Vec<_> = texts.iter().filter(|t| t.starts_with("↳")).collect();
        assert_eq!(tool_lines.len(), 1);
        assert!(tool_lines[0].contains("2 tool uses"));
    }

    #[test]
    fn markdown_paragraphs_split_into_separate_lines() {
        let mut app = App::new("model");
        app.add_message("Assistant", "first para\n\nsecond para");
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        assert_eq!(texts[0], "• first para");
        assert!(texts[1].trim().is_empty());
        assert_eq!(texts[2], "  second para");
    }

    #[test]
    fn info_command_opens_popup() {
        let (mut app, state, router) = test_app_state_router();
        let handled = handle_slash_command("/info", &mut app, &state, &router, None);
        assert!(handled);
        assert!(app.view_open(crate::ui::bottom_pane::ViewKind::Info));
        assert!(!app.bottom_pane.info.sections.is_empty());
    }

    #[test]
    fn selecting_cloud_model_drives_entire_lifecycle_to_cloud() {
        let (mut app, state, router) = test_app_state_router();
        set_active_model(&mut app, &state, &router, "z-ai/glm-5.2 [cloud]", None);
        let st = state.lock().unwrap();
        assert_eq!(st.config.coder_model, "z-ai/glm-5.2");
        assert_eq!(st.config.planner_model, "z-ai/glm-5.2");
        assert_eq!(st.config.summarizer_model, "z-ai/glm-5.2");
        assert_eq!(app.model, "z-ai/glm-5.2");
        assert!(router.is_cloud_model("z-ai/glm-5.2"));
        match router.client_for("z-ai/glm-5.2") {
            Ok(_) => panic!("expected cloud model to fail without configured provider"),
            Err(e) => assert!(e.to_string().contains("no cloud provider is configured")),
        }
    }

    #[test]
    fn selecting_local_model_keeps_lifecycle_on_ollama() {
        let (mut app, state, router) = test_app_state_router();
        set_active_model(&mut app, &state, &router, "qwen3:1.7b", None);
        let st = state.lock().unwrap();
        assert_eq!(st.config.coder_model, "qwen3:1.7b");
        assert_eq!(st.config.planner_model, "qwen3:1.7b");
        assert_eq!(st.config.summarizer_model, "qwen3:1.7b");
        assert!(!router.is_cloud_model("qwen3:1.7b"));
        match router.client_for("qwen3:1.7b").unwrap() {
            crate::llm::client::LlmClient::Ollama(_) => {}
            _ => panic!("expected local Ollama client for local model"),
        }
    }

    #[test]
    fn planner_summarizer_default_to_local_models() {
        let (mut app, state, router) = test_app_state_router();
        set_active_model(&mut app, &state, &router, "z-ai/glm-5.2 [cloud]", None);
        // Switching back to a local model must also move planner/summarizer.
        set_active_model(&mut app, &state, &router, "granite3.3:2b", None);
        let st = state.lock().unwrap();
        assert_eq!(st.config.planner_model, "granite3.3:2b");
        assert_eq!(st.config.coder_model, "granite3.3:2b");
        assert_eq!(st.config.summarizer_model, "granite3.3:2b");
        assert!(!router.is_cloud_model("granite3.3:2b"));
    }

    #[test]
    fn tool_call_delta_event_is_handled() {
        let events = Arc::new(Mutex::new(Vec::new()));
        let captured = Arc::clone(&events);
        let hooks = AgentHooks {
            on_event: Some(Arc::new(move |ev| captured.lock().unwrap().push(ev))),
            on_tool_call_delta: None,
            on_text_delta: None,
            on_approval: None,
            on_plan_approval: None,
            interrupt: None,
            session_approvals: Arc::new(Mutex::new(std::collections::BTreeSet::new())),
        };
        hooks.emit(AgentEvent::ToolCallDelta {
            id: "call_0".into(),
            index: 0,
            name: Some("read_file".into()),
            args_delta: "{\"path\":\"/tmp".into(),
        });
        let captured = events.lock().unwrap();
        assert_eq!(captured.len(), 1);
    }

    #[test]
    fn feed_reasoning_delta_flushes_at_threshold() {
        let mut app = App::new("model");
        let chunk = "x".repeat(120);
        app.feed_reasoning_delta(&chunk);
        assert_eq!(app.reasoning.len(), 0);
        assert_eq!(app.messages.len(), 1);
        assert_eq!(app.messages[0].0, "Thinking");
        assert_eq!(app.messages[0].1, chunk);
    }

    #[test]
    fn feed_reasoning_delta_accumulates_below_threshold() {
        let mut app = App::new("model");
        app.feed_reasoning_delta("hello ");
        app.feed_reasoning_delta("world");
        assert_eq!(app.reasoning, "hello world");
        assert_eq!(app.messages.len(), 0);
    }

    #[test]
    fn end_streaming_inserts_reasoning_tail_before_assistant() {
        let mut app = App::new("model");
        app.streaming_assistant = true;
        app.messages
            .push(("Assistant".to_string(), "streamed partial".to_string()));
        app.reasoning.push_str("tail reasoning");
        let finalized = app.end_streaming(Some("final content"));
        assert!(finalized);
        assert_eq!(app.messages.len(), 2);
        assert_eq!(app.messages[0].0, "Thinking");
        assert_eq!(app.messages[0].1, "tail reasoning");
        assert_eq!(app.messages[1].0, "Assistant");
        assert_eq!(app.messages[1].1, "final content");
    }

    #[test]
    fn end_streaming_appends_to_existing_thinking() {
        let mut app = App::new("model");
        app.streaming_assistant = true;
        app.messages
            .push(("Assistant".to_string(), "streamed partial".to_string()));
        app.messages
            .push(("Thinking".to_string(), "existing thinking".to_string()));
        app.reasoning.push_str(" more tail");
        let finalized = app.end_streaming(Some("final content"));
        assert!(finalized);
        assert_eq!(app.messages.len(), 2);
        assert_eq!(app.messages[0].0, "Thinking");
        assert_eq!(app.messages[0].1, "existing thinking more tail");
        assert_eq!(app.messages[1].0, "Assistant");
        assert_eq!(app.messages[1].1, "final content");
    }

    #[test]
    fn end_streaming_no_content_only_flushes_reasoning() {
        let mut app = App::new("model");
        app.streaming_assistant = true;
        app.messages
            .push(("Assistant".to_string(), "streamed partial".to_string()));
        app.reasoning.push_str("tail reasoning");
        let finalized = app.end_streaming(None);
        assert!(finalized);
        assert_eq!(app.messages.len(), 2);
        assert_eq!(app.messages[0].0, "Thinking");
        assert_eq!(app.messages[0].1, "tail reasoning");
        assert_eq!(app.messages[1].0, "Assistant");
        assert_eq!(app.messages[1].1, "streamed partial");
    }

    #[test]
    fn reset_reasoning_flushes_tail() {
        let mut app = App::new("model");
        app.reasoning.push_str("small tail");
        app.reset_reasoning();
        assert!(app.reasoning.is_empty());
        assert_eq!(app.messages.len(), 1);
        assert_eq!(app.messages[0].0, "Thinking");
        assert_eq!(app.messages[0].1, "small tail");
    }

    #[test]
    fn reset_reasoning_no_op_when_empty() {
        let mut app = App::new("model");
        app.reset_reasoning();
        assert!(app.reasoning.is_empty());
        assert_eq!(app.messages.len(), 0);
    }

    #[test]
    fn end_streaming_early_return_does_not_lose_reasoning() {
        let mut app = App::new("model");
        app.streaming_assistant = false;
        app.reasoning.push_str("orphaned tail");
        let finalized = app.end_streaming(Some("final content"));
        assert!(!finalized);
        assert_eq!(app.messages.len(), 1);
        assert_eq!(app.messages[0].0, "Thinking");
        assert_eq!(app.messages[0].1, "orphaned tail");
    }

    #[test]
    fn end_streaming_handles_multiple_thinking_flushes_after_partial() {
        let mut app = App::new("model");
        app.streaming_assistant = true;
        app.messages
            .push(("Assistant".to_string(), "streamed partial".to_string()));
        app.messages
            .push(("Thinking".to_string(), "flush A".to_string()));
        app.messages
            .push(("Thinking".to_string(), "flush B".to_string()));
        let finalized = app.end_streaming(Some("final content"));
        assert!(finalized);
        assert_eq!(app.messages.len(), 3);
        assert_eq!(app.messages[0].0, "Thinking");
        assert_eq!(app.messages[0].1, "flush A");
        assert_eq!(app.messages[1].0, "Thinking");
        assert_eq!(app.messages[1].1, "flush B");
        assert_eq!(app.messages[2].0, "Assistant");
        assert_eq!(app.messages[2].1, "final content");
    }

    #[test]
    fn end_streaming_without_assistant_pushes_final_content() {
        let mut app = App::new("model");
        app.streaming_assistant = true;
        app.messages
            .push(("Thinking".to_string(), "reasoning only".to_string()));
        let finalized = app.end_streaming(Some("final content"));
        assert!(finalized);
        assert_eq!(app.messages.len(), 2);
        assert_eq!(app.messages[0].0, "Thinking");
        assert_eq!(app.messages[0].1, "reasoning only");
        assert_eq!(app.messages[1].0, "Assistant");
        assert_eq!(app.messages[1].1, "final content");
    }

    #[test]
    fn char_index_to_byte_index_maps_char_to_byte_offsets() {
        let s = "o que é";
        assert_eq!(char_index_to_byte_index(s, 0), 0);
        assert_eq!(char_index_to_byte_index(s, 6), 6);
        assert_eq!(char_index_to_byte_index(s, 7), s.len());
        assert_eq!(char_index_to_byte_index("", 0), 0);
    }

    #[test]
    fn insert_char_after_multibyte_uses_byte_offset() {
        let mut input = String::new();
        let mut cursor = 0usize;
        for c in "o que é".chars() {
            let pos = char_index_to_byte_index(&input, cursor);
            input.insert(pos, c);
            cursor += 1;
        }
        assert_eq!(input, "o que é");
        assert_eq!(cursor, input.chars().count());

        let pos = char_index_to_byte_index(&input, cursor);
        input.insert(pos, '?');
        assert_eq!(input, "o que é?");
    }

    #[test]
    fn backspace_after_multibyte_removes_char_not_byte() {
        let mut input = "o que é".to_string();
        let mut cursor = input.chars().count();
        let pos = char_index_to_byte_index(&input, cursor - 1);
        input.remove(pos);
        cursor -= 1;
        assert_eq!(input, "o que ");
        assert_eq!(cursor, 6);
    }

    #[test]
    fn previous_input_cursor_at_char_count_for_multibyte() {
        let mut app = App::new("model");
            app.bottom_pane.composer.input_history.push("o que é".to_string());
        app.previous_input();
            assert_eq!(app.bottom_pane.composer.input, "o que é");
            assert_eq!(app.bottom_pane.composer.cursor_position, "o que é".chars().count());
    }

    #[test]
    fn count_wrapped_lines_counts_visual_rows() {
        use crate::ui::engine::ratatui::text::Line;
        use crate::ui::engine::ratatui::text::Span;
        // A 100-char unbroken run wraps to 2 visual rows at width 80
        // (80 chars on the first row, the remaining 20 on the second).
        let lines = vec![Line::from(Span::raw("x".repeat(100)))];
        assert_eq!(count_wrapped_lines(&lines, 80), 2);
    }

    #[test]
    fn count_wrapped_lines_matches_ratatui_for_prefixed_lines() {
        use crate::ui::engine::ratatui::text::Line;
        use crate::ui::engine::ratatui::text::Span;
        // Prefix span + content span are concatenated WITHOUT a separator,
        // so "• " + 78 chars is exactly one visual row at width 80. A
        // hand-rolled counter inserting a virtual space would count 2.
        let exact = Line::from(vec![Span::raw("• "), Span::raw("x".repeat(78))]);
        assert_eq!(count_wrapped_lines(&[exact], 80), 1);

        // Multi-word content wraps by words, not by whole-span units.
        let words: String = "hello world ".repeat(20);
        let content = words.trim_end().to_string();
        let line = Line::from(vec![Span::raw("• "), Span::raw(content)]);
        let lines = vec![line];
        let width = 80;
        let expected = Paragraph::new(lines.clone())
            .wrap(Wrap { trim: true })
            .line_count(width as u16);
        assert_eq!(count_wrapped_lines(&lines, width), expected);
        assert!(expected >= 3);
    }

    #[test]
    fn count_wrapped_lines_counts_multiple_lines() {
        use crate::ui::engine::ratatui::text::Line;
        use crate::ui::engine::ratatui::text::Span;
        let lines = vec![
            Line::from(Span::raw("x".repeat(80))),
            Line::from(Span::raw("y".repeat(80))),
        ];
        assert_eq!(count_wrapped_lines(&lines, 80), 2);
    }

    #[test]
    fn markdown_list_items_split_into_separate_lines() {
        let cases = [
            (
                "**Tecnologias principais:**\n- React Query\n- **Backend:** Node.js",
                "React Query",
                "Backend:",
            ),
            (
                "**Funcionalidades visíveis:**\n- Persistência em localStorage\n- **UI:** tema claro/escuro\n- Feedback háptico \"Theme Lab\"",
                "localStorage",
                "UI:",
            ),
            (
                "**Auth:**\n- validação\n- **UI:** tema",
                "validação",
                "Auth:",
            ),
        ];
        for (md, a, b) in cases {
            let mut app = App::new("model");
            app.add_message("Assistant", md);
            let lines = flatten_messages(&app);
            let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
            let full = texts.join("|");
            assert!(
                !full.contains(&format!("{a}{b}")),
                "list items glued: {full}"
            );
            assert!(
                !full.contains(&format!("{b}{a}")),
                "list items glued: {full}"
            );
            // Both fragments must be present on their own rendered lines.
            for frag in [a, b] {
                assert!(
                    texts.iter().any(|t| t.contains(frag)),
                    "missing {frag} in: {full}"
                );
            }
        }
    }

    #[test]
    fn markdown_soft_breaks_keep_line_breaks() {
        let mut app = App::new("model");
        app.add_message("Assistant", "linha um\nlinha dois\nlinha três");
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        let full = texts.join("|");
        assert!(texts[0].contains("linha um"), "got: {full}");
        assert!(texts[1].contains("linha dois"), "got: {full}");
        assert!(texts[2].contains("linha três"), "got: {full}");
    }

    #[test]
    fn markdown_paragraph_boundary_does_not_glue() {
        let mut app = App::new("model");
        app.add_message(
            "Assistant",
            "**Tecnologias principais:**\nReact Query\n\n**Backend:**\nNode.js",
        );
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        let full = texts.join("|");
        assert!(
            !full.contains("React Query**Backend:**"),
            "glued across paragraph boundary: {full}"
        );
    }

    #[test]
    fn markdown_heading_splits_its_own_line() {
        let mut app = App::new("model");
        app.add_message("Assistant", "## Seção\nconteúdo\n## Outra\nmais");
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        let full = texts.join("|");
        assert!(!full.contains("Seçãoconteúdo"), "glued heading: {full}");
        assert!(texts.iter().any(|t| t.contains("Seção")), "got: {full}");
        assert!(texts.iter().any(|t| t.contains("mais")), "got: {full}");
    }

    #[test]
    fn markdown_table_cells_do_not_glue() {
        let mut app = App::new("model");
        app.add_message(
            "Assistant",
            "| Camada | Responsabilidade |\n|---|---|\n| Tool Layer | Trait Tool único |\n| Loop Layer | while-loop puro |",
        );
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        let full = texts.join("|");
        assert!(
            !full.contains("CamadaResponsabilidade"),
            "table cells glued: {full}"
        );
        assert!(
            !full.contains("Tool LayerTrait"),
            "table cells glued: {full}"
        );
        assert!(texts.iter().any(|t| t.contains("Camada")), "got: {full}");
        assert!(texts.iter().any(|t| t.contains("Tool Layer")), "got: {full}");
    }

    #[test]
    fn thinking_stream_flushes_as_unified_block() {
        let mut app = App::new("model");
        app.reasoning_expanded = true;
        app.feed_reasoning_delta("The user is asking about the project. ");
        app.feed_reasoning_delta("Let me explore more.");
        app.reset_reasoning();
        let lines = flatten_messages(&app);
        let texts: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
        let thought_count = texts.iter().filter(|t| t.contains("δ")).count();
        assert_eq!(thought_count, 1, "expected 1 thinking block, got: {texts:?}");
    }

    #[test]
    fn reflow_renders_long_line_within_width() {
        use crate::ui::engine::ratatui::backend::TestBackend;
        use crate::ui::engine::ratatui::Terminal;
        let mut app = App::new("model");
        app.streaming_assistant = false;
        app.messages
            .push(("Assistant".to_string(), "x".repeat(200)));
        let backend = TestBackend::new(40, 10);
        let mut terminal = Terminal::new(backend).unwrap();
        terminal
            .draw(|f| {
                let area = f.area();
                let chunks = Layout::default()
                    .direction(Direction::Vertical)
                    .constraints([Constraint::Min(1), Constraint::Length(3)])
                    .split(area);
                let messages_lines = flatten_messages(&app);
                let widget = Paragraph::new(messages_lines).wrap(Wrap { trim: true });
                f.render_widget(widget, chunks[0]);
            })
            .unwrap();
        let buf = terminal.backend().buffer();
        // The long line should be reflowed, not cut off at column 40.
        // At least one row beyond the first should contain 'x'.
        let mut found_x_beyond_row0 = false;
        for y in 1..10 {
            for x in 0..40 {
                if buf.cell((x, y)).is_some_and(|c| c.symbol() == "x") {
                    found_x_beyond_row0 = true;
                    break;
                }
            }
            if found_x_beyond_row0 {
                break;
            }
        }
        assert!(found_x_beyond_row0, "reflow did not wrap long line");
    }

    #[test]
    fn draw_snapshot_contains_terminal_item_and_composer() {
        use crate::ui::engine::ratatui::backend::TestBackend;
        use crate::ui::engine::ratatui::Terminal;
        let mut app = App::new("model");
        app.add_message("Terminal", "cargo test [exit 0] [42ms]");
        let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
        draw(&mut terminal, &mut app).unwrap();
        let buffer = terminal.backend().buffer();
        let rendered: String = (0..24)
            .flat_map(|y| (0..80).filter_map(move |x| buffer.cell((x, y))))
            .map(|cell| cell.symbol().to_string())
            .collect();
        assert!(rendered.contains("Terminal output"));
        assert!(rendered.contains("›"));
    }

    #[test]
    fn draw_snapshot_contains_slash_picker() {
        use crate::ui::engine::ratatui::backend::TestBackend;
        use crate::ui::engine::ratatui::Terminal;
        let mut app = App::new("model");
        app.bottom_pane.commands.items = vec![("/help".into(), "Show help".into())];
        app.show_view(crate::ui::bottom_pane::ViewKind::Commands);
        let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
        draw(&mut terminal, &mut app).unwrap();
        let buffer = terminal.backend().buffer();
        let rendered: String = (0..24)
            .flat_map(|y| (0..80).filter_map(move |x| buffer.cell((x, y))))
            .map(|cell| cell.symbol().to_string())
            .collect();
        assert!(rendered.contains("Slash commands"));
        assert!(rendered.contains("/help"));
    }

    #[test]
    fn draw_snapshot_contains_approval_prompt() {
        use crate::ui::engine::ratatui::backend::TestBackend;
        use crate::ui::engine::ratatui::Terminal;
        let mut app = App::new("model");
        app.pending_approval = Some(ApprovalRequest {
            id: 7,
            tool: "run_command".into(),
            summary: "cargo check".into(),
            risk: "command execution".into(),
        });
        let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
        draw(&mut terminal, &mut app).unwrap();
        let buffer = terminal.backend().buffer();
        let rendered: String = (0..24)
            .flat_map(|y| (0..80).filter_map(move |x| buffer.cell((x, y))))
            .map(|cell| cell.symbol().to_string())
            .collect();
        assert!(rendered.contains("Permission"));
        assert!(rendered.contains("run_command"));
        assert!(rendered.contains("allow for session"));
    }

    #[test]
    fn draw_snapshot_covers_loading_queued_and_completed_states() {
        use crate::ui::engine::ratatui::backend::TestBackend;
        use crate::ui::engine::ratatui::Terminal;
        let mut app = App::new("model");
        app.loading = true;
        app.pending_tasks = 2;
        app.status = "Working (2 background tasks queued)".into();
        let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
        draw(&mut terminal, &mut app).unwrap();
        let buffer = terminal.backend().buffer();
        let loading: String = (0..24)
            .flat_map(|y| (0..80).filter_map(move |x| buffer.cell((x, y))))
            .map(|cell| cell.symbol().to_string())
            .collect();
        assert!(loading.contains("Ctrl+C cancel"));

        app.loading = false;
        app.pending_tasks = 0;
        app.status = "Ready".into();
        draw(&mut terminal, &mut app).unwrap();
        let buffer = terminal.backend().buffer();
        let completed: String = (0..24)
            .flat_map(|y| (0..80).filter_map(move |x| buffer.cell((x, y))))
            .map(|cell| cell.symbol().to_string())
            .collect();
        assert!(completed.contains("Esc interrupt"));
    }

    #[test]
    fn resize_rerenders_without_panic_and_respects_new_width() {
        use crate::ui::engine::ratatui::backend::TestBackend;
        use crate::ui::engine::ratatui::Terminal;
        let mut app = App::new("model");
        app.streaming_assistant = false;
        app.messages
            .push(("Assistant".to_string(), "word ".repeat(60)));
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).unwrap();
        draw(&mut terminal, &mut app).unwrap();
        // Simulate the resize handler: shrink, clear, then redraw (the real loop
        // calls terminal.clear() once per Event::Resize).
        terminal.backend_mut().resize(30, 24);
        terminal.clear().unwrap();
        draw(&mut terminal, &mut app).unwrap();
        let buf = terminal.backend().buffer();
        // Content must be present and reflowed at the new width. Wrapped cells
        // hold single characters, so count 'w' (only present in the message).
        let mut w_count = 0;
        for y in 0..24 {
            for x in 0..30 {
                if buf.cell((x, y)).is_some_and(|c| c.symbol() == "w") {
                    w_count += 1;
                }
            }
        }
        assert!(
            w_count > 5,
            "message not rendered after resize+clear+redraw"
        );
        // Nothing may render outside the resized buffer width (draw must not
        // have written stale glyphs beyond column 30).
        for y in 0..24 {
            for x in 30..80 {
                assert!(
                    !buf.cell((x, y))
                        .is_some_and(|c| !c.symbol().trim().is_empty()),
                    "cell at {x},{y} rendered outside the resized width"
                );
            }
        }
    }

    #[test]
    fn open_provider_selector_populates_items_with_key_status() {
        let (mut app, _state, _router) = test_app_state_router();
        open_provider_selector(&mut app, "");
        assert!(app.view_open(crate::ui::bottom_pane::ViewKind::Provider));
        assert!(!app.bottom_pane.provider.items.is_empty());
        assert!(app.bottom_pane.provider.items.iter().any(|p| p.contains("[key set]") || p.contains("[no key]")));
    }

    #[test]
    fn open_model_selector_loads_models_for_provider() {
        let (mut app, state, _router) = test_app_state_router();
        app.provider = "openrouter".into();
        open_model_selector(&mut app, &state);
        assert!(app.view_open(crate::ui::bottom_pane::ViewKind::Model));
        assert!(!app.bottom_pane.model.items.is_empty());
        assert!(app.bottom_pane.model.items.iter().any(|m| m.contains("[cloud]")));
    }

    #[test]
    fn save_provider_key_persists_to_store_and_env() {
        let _profile = crate::config::global_settings::TestHome::new();
        let res = save_provider_key("testprov", "sk-test-12345678");
        assert!(res.is_ok());
        let store = crate::providers::ProviderStore::load();
        assert_eq!(store.api_key("testprov"), Some("sk-test-12345678"));
        assert_eq!(std::env::var("TESTPROV_API_KEY").ok(), Some("sk-test-12345678".to_string()));
    }

    #[test]
    fn clean_display_path_strips_unc_and_normalizes() {
        assert_eq!(clean_display_path(r"\\?\C:\Projects\app", 50), "C:/Projects/app");
        assert_eq!(clean_display_path(r"\\?\UNC\server\share\file", 50), "server/share/file");
        assert_eq!(clean_display_path("/usr/local/bin/app", 50), "/usr/local/bin/app");
    }

    #[test]
    fn clean_display_path_truncates_long_paths() {
        let path = "C:/Users/user/very/deeply/nested/directory/structure/myproject";
        let cleaned = clean_display_path(path, 25);
        assert!(cleaned.starts_with("…/"));
        assert!(cleaned.ends_with("myproject"));
        assert!(display_width(&cleaned) <= 25);
    }

    #[test]
    fn reference_picker_filters_files_and_context() {
        let mut app = App::new("model");
        app.focus = Focus::Input;
        app.bottom_pane.file_search.paths = vec!["src/main.rs".into(), "README.md".into()];
        app.bottom_pane.composer.input = "@src/".into();
        app.bottom_pane.composer.cursor_position = 5;
        refresh_reference_menu(&mut app);
        assert!(app.view_open(crate::ui::bottom_pane::ViewKind::References));
        assert_eq!(app.bottom_pane.references.items, vec!["src/main.rs"]);
        app.bottom_pane.composer.input = "$AG".into();
        app.bottom_pane.composer.cursor_position = 3;
        refresh_reference_menu(&mut app);
        assert!(app.bottom_pane.references.items.iter().any(|item| item == "AGENTS.md"));
        app.context_reference_items.push("skill:rust-testing".into());
        app.bottom_pane.composer.input = "$skill".into();
        app.bottom_pane.composer.cursor_position = 5;
        refresh_reference_menu(&mut app);
        assert_eq!(app.bottom_pane.references.items, vec!["skill:rust-testing"]);
    }

    #[test]
    fn reference_replacement_preserves_surrounding_prompt_text() {
        let mut app = App::new("model");
        app.bottom_pane.composer.input = "leia @src/ aqui β".into();
        app.bottom_pane.composer.cursor_position = "leia @src/".chars().count();
        assert!(app.replace_reference_at_cursor('@', "src/main.rs"));
        assert_eq!(app.bottom_pane.composer.input, "leia src/main.rs aqui β");
        assert_eq!(
            app.bottom_pane.composer.cursor_position,
            "leia src/main.rs".chars().count()
        );
    }

    #[test]
    fn composer_key_router_handles_editing_only_in_input_focus() {
        let mut app = App::new("model");
        assert_eq!(route_composer_edit_key(
            &mut app,
            crate::ui::engine::event::KeyEvent::new(KeyCode::Char('x'), KeyModifiers::NONE)
        ), ComposerRoute::Handled);
        assert_eq!(app.bottom_pane.composer.input, "x");
        assert_eq!(route_composer_edit_key(
            &mut app,
            crate::ui::engine::event::KeyEvent::new(KeyCode::Backspace, KeyModifiers::NONE)
        ), ComposerRoute::Handled);
        assert!(app.bottom_pane.composer.input.is_empty());
        app.focus = Focus::Messages;
        assert_eq!(route_composer_edit_key(
            &mut app,
            crate::ui::engine::event::KeyEvent::new(KeyCode::Char('y'), KeyModifiers::NONE)
        ), ComposerRoute::Unhandled);
    }

    #[test]
    fn permissions_clear_revokes_shared_session_scopes() {
        let (mut app, state, router) = test_app_state_router();
        let approvals = Arc::new(Mutex::new(std::collections::BTreeSet::from([
            "run_command\ncargo check".to_string(),
        ])));
        app.session_approvals = Some(Arc::clone(&approvals));
        app.approval_scopes.push("run_command\ncargo check".into());
        assert!(handle_slash_command("/permissions clear", &mut app, &state, &router, None));
        assert!(approvals.lock().unwrap().is_empty());
        assert!(app.approval_scopes.is_empty());
    }

    #[test]
    fn approval_scopes_persist_per_workspace_and_reload() {
        let (_app, state, _router) = test_app_state_router();
        let scopes = vec!["run_command\ncargo check".to_string(), "write_file\nsrc/lib.rs".to_string()];
        persist_approval_scopes(&state, &scopes).unwrap();
        assert_eq!(load_persisted_approval_scopes(&state), scopes);
        persist_approval_scopes(&state, &[]).unwrap();
        assert!(load_persisted_approval_scopes(&state).is_empty());
    }
}


