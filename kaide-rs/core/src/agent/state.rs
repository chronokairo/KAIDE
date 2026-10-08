use crate::config::settings::Config;
use crate::memory::log::LongTermMemory;
use crate::memory::short_term::ShortTermMemory;
use crate::tools::fs::FileTools;
use crate::tools::git::GitTools;
use crate::tools::test::{VerificationResult, VerificationStatus};
use crate::tools::transaction::{WorkspaceDiff, WorkspaceTransaction};
use std::collections::BTreeSet;

/// A single tracked item in the agent's session checklist (`todo` tool).
#[derive(Debug, Clone)]
pub struct TodoItem {
    pub text: String,
    pub done: bool,
}

impl TodoItem {
    pub fn new(text: impl Into<String>) -> Self {
        Self {
            text: text.into(),
            done: false,
        }
    }
}

pub struct AgentState {
    pub retries: usize,
    pub repair_attempt: usize,
    pub last_test_output: String,
    pub verification: Option<VerificationResult>,
    pub changed_files: BTreeSet<String>,
    /// Actions refused by the approval policy during this turn. A turn with
    /// blocked actions must never be reported as a success.
    pub blocked_actions: Vec<String>,
    pub last_diff: WorkspaceDiff,
    pub transaction: Option<WorkspaceTransaction>,
    pub dirty: bool,
    pub config: Config,
    pub session: ShortTermMemory,
    pub long_memory: LongTermMemory,
    pub files: FileTools,
    pub git: GitTools,
    pub mcp_clients: Vec<crate::mcp::McpClient>,
    /// Persistent session record backing this conversation, created lazily on
    /// the first persist. `None` means the next turn starts a fresh session.
    pub session_id: Option<i64>,
    /// Set on cloned sub-agent states so their turns never write into the
    /// parent session transcript.
    pub session_persist: bool,
    /// Watermark of the newest transcript record already written to disk.
    /// `None` means nothing has been persisted for this session yet.
    pub last_persisted_seq: Option<u64>,
    /// Compaction summary already reflected in the persisted session.
    pub last_persisted_summary: Option<String>,
    /// Accumulated USD cost of cloud LLM calls in this turn (local = 0).
    pub turn_cost_usd: f64,
    /// Session task checklist maintained via the `todo` tool.
    pub todos: Vec<TodoItem>,
    /// Immutable per-turn specification (v0.9.5): compiled once from the raw
    /// user task at turn start; never re-derived from session context.
    pub task_spec: Option<std::sync::Arc<crate::repo::spec::TaskSpec>>,
    /// Workspace paths locked for this turn (acceptance oracle). Writes to
    /// these paths are refused before touching the filesystem.
    pub locked_paths: BTreeSet<String>,
    /// Local embedding engine for `memory_search` (lazily loads the GGUF model).
    pub embedder: crate::llm::embedder::Embedder,
    /// Discovered skill packs (project `./skills` + user `~/.chronokairo/skills`).
    pub skills: crate::skills::SkillRegistry,
    /// Long-running detached commands (C9 background tasks) spawned this session.
    pub background: crate::tools::background::BackgroundTaskManager,
}

impl AgentState {
    pub fn new(mut config: Config) -> crate::error::Result<Self> {
        config.workspace_dir = crate::tools::fs::normalize_workspace_path(&config.workspace_dir);
        let long_memory = LongTermMemory::new(config.memory_dir.join("memory.db"))?;
        let embedder = crate::llm::embedder::Embedder::new();
        let mut skills = crate::skills::SkillRegistry::new();
        skills.load_from(crate::skills::default_skill_dirs(&config.workspace_dir));
        Ok(AgentState {
            retries: 0,
            repair_attempt: 0,
            last_test_output: String::new(),
            verification: None,
            changed_files: BTreeSet::new(),
            blocked_actions: Vec::new(),
            last_diff: WorkspaceDiff::default(),
            transaction: None,
            dirty: false,
            session: ShortTermMemory::new(config.max_context_tokens),
            long_memory,
            files: FileTools::new_with_policy(
                config.workspace_dir.clone(),
                config.path_allowlist.clone(),
                config.path_denylist.clone(),
            ),
            git: GitTools::new(config.workspace_dir.to_string_lossy().to_string()),
            config,
            mcp_clients: Vec::new(),
            session_id: None,
            session_persist: true,
            last_persisted_seq: None,
            last_persisted_summary: None,
            turn_cost_usd: 0.0,
            todos: Vec::new(),
            task_spec: None,
            locked_paths: BTreeSet::new(),
            embedder,
            skills,
            background: crate::tools::background::BackgroundTaskManager::new(),
        })
    }

    pub fn start_turn(&mut self) -> crate::error::Result<()> {
        self.retries = 0;
        self.repair_attempt = 0;
        self.last_test_output.clear();
        self.verification = None;
        self.changed_files.clear();
        self.blocked_actions.clear();
        self.last_diff = WorkspaceDiff::default();
        self.dirty = false;
        self.turn_cost_usd = 0.0;
        // A new turn compiles a fresh specification from the incoming task.
        self.task_spec = None;
        self.locked_paths.clear();
        self.transaction = Some(WorkspaceTransaction::begin(
            self.config.workspace_dir.clone(),
            self.config.transaction_max_bytes,
        )?);
        Ok(())
    }

    /// True when `path` points at a file locked for this turn (oracle).
    pub fn path_is_locked(&self, path: &str) -> bool {
        let norm = path.replace('\\', "/");
        let norm = norm.trim_start_matches("./");
        if self
            .task_spec
            .as_ref()
            .map(|spec| spec.locks_path(&norm))
            .unwrap_or(false)
        {
            return true;
        }
        self.locked_paths.iter().any(|locked| {
            let l = locked.trim_start_matches("./");
            norm == l || norm.ends_with(&format!("/{l}"))
        })
    }

    /// Refusal message for attempts to mutate locked paths.
    pub fn locked_path_error(&self, path: &str) -> Option<String> {
        if self.path_is_locked(path) {
            return Some(format!(
                "ORACLE LOCKED: `{path}` contains this turn's acceptance tests.\n\
                 These tests define the required behavior and MUST NOT be edited, deleted or weakened.\n\
                 Fix the implementation instead."
            ));
        }
        // When the task carries an explicit API contract, the specification
        // owns the whole `tests/` territory for this turn: no parallel junk
        // test files, no self-grading — whether or not an LLM-synthesized
        // oracle was successfully locked on top.
        let spec_owns_tests = self
            .task_spec
            .as_ref()
            .map(|spec| {
                spec.oracle.is_some() || !spec.contract.methods.is_empty()
            })
            .unwrap_or(false);
        let norm = path.replace('\\', "/");
        let norm = norm.trim_start_matches("./");
        if spec_owns_tests && (norm == "tests" || norm.starts_with("tests/")) {
            let oracle_path = self
                .task_spec
                .as_ref()
                .and_then(|spec| spec.oracle.as_ref())
                .map(|o| o.path.as_str())
                .unwrap_or("the fixed acceptance tests shipped with the task");
            return Some(format!(
                "SPECIFICATION OWNS TESTS: this turn has an explicit API contract \
                 ({oracle_path} define the required behavior).\nCreating or modifying files \
                 under `tests/` is disabled while the specification is locked.\nDo NOT write \
                 your own tests — make the IMPLEMENTATION satisfy them."
            ));
        }
        None
    }

    pub fn refresh_workspace_diff(&mut self) -> crate::error::Result<WorkspaceDiff> {
        let diff = self
            .transaction
            .as_ref()
            .map(WorkspaceTransaction::diff)
            .transpose()?
            .unwrap_or_default();
        self.changed_files = diff.paths().into_iter().collect();
        self.dirty = !diff.is_empty();
        self.last_diff = diff.clone();
        Ok(diff)
    }

    pub fn keep_changes(&mut self) -> crate::error::Result<WorkspaceDiff> {
        let diff = self.refresh_workspace_diff()?;
        self.transaction = None;
        Ok(diff)
    }

    pub fn rollback_changes(&mut self) -> crate::error::Result<WorkspaceDiff> {
        let diff = match self.transaction.take() {
            Some(transaction) => transaction.rollback()?,
            None => WorkspaceDiff::default(),
        };
        self.changed_files.clear();
        self.dirty = false;
        self.verification = None;
        self.last_test_output.clear();
        self.last_diff = diff.clone();
        Ok(diff)
    }

    pub fn mark_changed(&mut self, path: impl Into<String>) {
        self.changed_files.insert(path.into());
        self.dirty = true;
        self.verification = None;
        self.last_test_output.clear();
    }

    pub fn record_verification(&mut self, result: VerificationResult) {
        self.last_test_output = result.output.clone();
        self.verification = Some(result);
    }

    pub fn verification_failed(&self) -> bool {
        self.verification
            .as_ref()
            .map(|result| result.status == VerificationStatus::Failed)
            .unwrap_or(false)
    }

    pub fn reset(&mut self) {
        self.session.clear();
        self.retries = 0;
        self.repair_attempt = 0;
        self.last_test_output.clear();
        self.verification = None;
        self.changed_files.clear();
        self.blocked_actions.clear();
        self.last_diff = WorkspaceDiff::default();
        self.transaction = None;
        self.dirty = false;
        // `/reset` starts a brand-new conversation: the next turn creates a new
        // session record instead of appending to the previous one.
        self.session_id = None;
        self.last_persisted_seq = None;
        self.last_persisted_summary = None;
        self.turn_cost_usd = 0.0;
        self.todos.clear();
        self.task_spec = None;
        self.locked_paths.clear();
    }

    pub fn record_blocked_action(&mut self, action: impl Into<String>) {
        self.blocked_actions.push(action.into());
    }

    /// Ensure a persistent session record exists for this conversation.
    fn ensure_session(&mut self) -> crate::error::Result<i64> {
        if let Some(id) = self.session_id {
            return Ok(id);
        }
        let workspace = self.config.workspace_dir.display().to_string();
        let id = self
            .long_memory
            .start_session(&workspace, &self.config.coder_model)?;
        self.session_id = Some(id);
        Ok(id)
    }

    /// Write the transcript records added since the last persist to the session
    /// store (append-only). Sub-agent states do not persist.
    pub fn persist_session(&mut self) -> crate::error::Result<()> {
        if !self.session_persist {
            return Ok(());
        }
        let id = self.ensure_session()?;
        let summary = self.session.summary().map(str::to_string);
        let mut records: Vec<(i64, String, String)> = self
            .session
            .records_after(self.last_persisted_seq)
            .into_iter()
            .map(|(seq, role, content)| (seq as i64, role, content))
            .collect();
        if summary.is_some() && summary != self.last_persisted_summary {
            let seq = self.session.next_seq() as i64;
            records.push((
                seq,
                "system".into(),
                format!("[Session summary so far] {}", summary.as_deref().unwrap()),
            ));
            self.last_persisted_summary = summary.clone();
        }
        if records.is_empty() {
            return Ok(());
        }
        self.long_memory.append_messages(id, &records)?;
        self.last_persisted_seq = Some(
            records
                .iter()
                .map(|(seq, _, _)| *seq as u64)
                .max()
                .unwrap_or(0),
        );

        let history = self.session.history();
        let title: String = history
            .iter()
            .find(|(role, _)| role == "user")
            .map(|(_, content)| content.chars().take(80).collect())
            .unwrap_or_default();
        let context = summary.unwrap_or_default();
        self.long_memory
            .update_session(id, &title, &context, &self.config.coder_model)?;

        if self.config.memory_indexing {
            self.index_persisted_records(id, &records);
        }
        Ok(())
    }

    /// Embed freshly persisted assistant messages into the vector store so
    /// `memory_search` can recall them across sessions. Best-effort: indexing
    /// failures are logged and skipped, never fatal.
    fn index_persisted_records(&mut self, session_id: i64, records: &[(i64, String, String)]) {
        if !self.embedder.is_available() {
            return;
        }
        use crate::llm::embedder::EmbedKind;
        let workspace = self.config.workspace_dir.display().to_string();
        for (_, role, content) in records {
            if role != "assistant" {
                continue;
            }
            let content = content.trim();
            if content.len() < 16 || content.len() > 2000 {
                continue;
            }
            match self.embedder.embed(content, EmbedKind::Passage) {
                Ok(embedding) => {
                    if let Err(error) = self
                        .long_memory
                        .store_vector(session_id, &workspace, content, &embedding)
                    {
                        crate::cki_debug!("memory indexing store failed: {error}");
                    }
                }
                Err(error) => {
                    crate::cki_debug!("memory indexing embed failed: {error}");
                }
            }
        }
    }

    /// Load a saved conversation into the working session, restoring the full
    /// transcript so the next turn continues with the prior context intact.
    pub fn load_session_into_state(&mut self, id: i64) -> crate::error::Result<usize> {
        let rows = self.long_memory.load_session(id)?;
        let context = self.long_memory.session_context(id)?;
        let mut max_seq = 0u64;
        let mut restored: Vec<(u64, String, String)> = Vec::with_capacity(rows.len());
        for (seq, role, content) in rows {
            max_seq = max_seq.max(seq as u64);
            restored.push((seq as u64, role, content));
        }
        self.session = ShortTermMemory::new(self.config.max_context_tokens);
        self.session.load_records(restored);
        // Materialize any stored compaction context as a leading system record
        // so summarized history survives the reload — unless a summary record is
        // already part of the transcript (a previous reload wrote it).
        if let Some(context) = context {
            let already = self.session.conversation().iter().any(|(role, content)| {
                role == "system" && content.contains("Session summary so far")
            });
            if !already {
                self.session
                    .add_message("system", &format!("[Session summary so far] {context}"));
            }
        }
        // The watermark stays at the highest seq already on disk; any materialized
        // summary record (fresh seq) is written by the next persist.
        self.last_persisted_seq = Some(max_seq);
        self.last_persisted_summary = self
            .session
            .conversation()
            .iter()
            .rev()
            .find(|(role, content)| {
                role == "system" && content.starts_with("[Session summary so far]")
            })
            .map(|(_, content)| {
                content
                    .trim_start_matches("[Session summary so far]")
                    .trim()
                    .to_string()
            });
        self.session_id = Some(id);
        Ok(self.session.history().len())
    }

    pub fn subagent_clone(&self) -> crate::error::Result<Self> {
        let mut child = Self::new(self.config.clone())?;
        child.session_persist = false;
        Ok(child)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_config(tag: &str) -> Config {
        let base = std::env::temp_dir().join(format!("chronokairo-state-{tag}"));
        let _ = fs::remove_dir_all(&base);
        Config {
            workspace_dir: base.join("workspace"),
            memory_dir: base.join("memory"),
            ..Config::default()
        }
    }

    #[test]
    fn creates_state_with_empty_session() {
        let cfg = temp_config("new");
        let state = AgentState::new(cfg).unwrap();
        assert!(state.session.history().is_empty());
        assert_eq!(state.retries, 0);
        let _ = fs::remove_dir_all(state.config.workspace_dir.parent().unwrap());
    }

    #[test]
    fn reset_clears_session_and_retries() {
        let cfg = temp_config("reset");
        let mut state = AgentState::new(cfg).unwrap();
        state.session.add_message("assistant", "hi");
        state.retries = 2;
        state.mark_changed("src/lib.rs");
        state.last_test_output = "stale failure".into();
        state.reset();
        assert!(state.session.history().is_empty());
        assert_eq!(state.retries, 0);
        assert!(state.last_test_output.is_empty());
        assert!(state.changed_files.is_empty());
        assert!(!state.dirty);
        assert!(state.verification.is_none());
        let _ = fs::remove_dir_all(state.config.workspace_dir.parent().unwrap());
    }

    #[test]
    fn files_and_git_point_at_workspace() {
        let cfg = temp_config("tools");
        let state = AgentState::new(cfg).unwrap();
        state.files.write_file("a.txt", "content").unwrap();
        assert_eq!(state.files.read_file("a.txt").as_deref(), Some("content"));
        let _ = fs::remove_dir_all(state.config.workspace_dir.parent().unwrap());
    }

    #[test]
    fn persist_and_reload_roundtrips_transcript() {
        let cfg = temp_config("persist");
        let mut state = AgentState::new(cfg).unwrap();
        state.session.add_message("user", "add tests");
        state.session.add_message("assistant", "done.");
        state.persist_session().unwrap();
        let id = state.session_id.unwrap();

        let mut fresh = AgentState::new(state.config.clone()).unwrap();
        let count = fresh.load_session_into_state(id).unwrap();
        assert_eq!(count, 2);
        let history = fresh.session.history();
        assert_eq!(history[0], ("user".to_string(), "add tests".to_string()));
        assert_eq!(history[1], ("assistant".to_string(), "done.".to_string()));
        assert_eq!(fresh.session_id, Some(id));

        // Continuing the resumed session appends, not duplicates.
        fresh.session.add_message("user", "one more");
        fresh.persist_session().unwrap();
        let reloaded = fresh.long_memory.load_session(id).unwrap();
        assert_eq!(reloaded.len(), 3);
        let _ = fs::remove_dir_all(state.config.workspace_dir.parent().unwrap());
    }

    #[test]
    fn reset_starts_a_fresh_session_record() {
        let cfg = temp_config("reset-session");
        let mut state = AgentState::new(cfg).unwrap();
        state.session.add_message("user", "first");
        state.persist_session().unwrap();
        let first_id = state.session_id.unwrap();
        state.reset();
        assert!(state.session_id.is_none());
        state.session.add_message("user", "second");
        state.persist_session().unwrap();
        assert_ne!(state.session_id, Some(first_id));
        let _ = fs::remove_dir_all(state.config.workspace_dir.parent().unwrap());
    }

    #[test]
    fn subagent_clone_never_persists() {
        let cfg = temp_config("subagent");
        let mut state = AgentState::new(cfg).unwrap();
        let mut sub = state.subagent_clone().unwrap();
        sub.session.add_message("user", "sub task");
        sub.persist_session().unwrap();
        assert!(sub.session_id.is_none());
        assert!(!sub.session_persist);
        // Parent session untouched.
        state.session.add_message("user", "parent");
        state.persist_session().unwrap();
        assert_eq!(
            state
                .long_memory
                .load_session(state.session_id.unwrap())
                .unwrap()
                .len(),
            1
        );
        let _ = fs::remove_dir_all(state.config.workspace_dir.parent().unwrap());
    }
}
