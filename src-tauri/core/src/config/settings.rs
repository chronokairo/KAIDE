use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApprovalPolicy {
    Allow,
    Ask,
    Deny,
}

impl ApprovalPolicy {
    fn from_env(name: &str, default: Self) -> Self {
        match std::env::var(name).ok().as_deref() {
            Some("allow") => Self::Allow,
            Some("ask") => Self::Ask,
            Some("deny") => Self::Deny,
            _ => default,
        }
    }

    pub fn denial_message(self, action: &str) -> Option<String> {
        match self {
            Self::Allow => None,
            Self::Ask => Some(format!(
                "{action} requires approval; no approval callback is available in this session"
            )),
            Self::Deny => Some(format!("{action} is denied by policy")),
        }
    }
}

fn env_bool(name: &str, default: bool) -> bool {
    std::env::var(name)
        .ok()
        .and_then(|value| match value.to_ascii_lowercase().as_str() {
            "1" | "true" | "yes" | "on" => Some(true),
            "0" | "false" | "no" | "off" => Some(false),
            _ => None,
        })
        .unwrap_or(default)
}

fn env_list(name: &str) -> Vec<String> {
    std::env::var(name)
        .ok()
        .map(|value| {
            value
                .split(',')
                .map(|item| item.trim())
                .filter(|item| !item.is_empty())
                .map(String::from)
                .collect()
        })
        .unwrap_or_default()
}

fn expand_home(path: &str) -> String {
    let path = path.trim();
    if path == "~" || path.starts_with("~/") || path.starts_with("~\\") {
        if let Some(home) = std::env::var_os("USERPROFILE")
            .or_else(|| std::env::var_os("HOME"))
            .map(|h| h.to_string_lossy().into_owned())
        {
            let rest = path[1..].trim_start_matches(['/', '\\']);
            return if rest.is_empty() {
                home
            } else {
                std::path::Path::new(&home)
                    .join(rest)
                    .to_string_lossy()
                    .into_owned()
            };
        }
    }
    path.to_string()
}

#[derive(Debug, Clone, PartialEq)]
pub struct Config {
    pub workspace_dir: PathBuf,
    pub memory_dir: PathBuf,
    pub ollama_host: String,
    pub planner_model: String,
    pub coder_model: String,
    pub summarizer_model: String,
    pub max_context_tokens: usize,
    pub max_retries: usize,
    pub chunk_size: usize,
    pub chunk_overlap: usize,
    pub allowed_commands: Vec<String>,
    pub blocked_commands: Vec<String>,
    /// Absolute path prefixes (outside the workspace) that the file tools are
    /// allowed to touch. Everything else outside the workspace is rejected.
    /// Home-relative (`~/...`) entries are expanded against the user's home.
    pub path_allowlist: Vec<String>,
    /// Path prefixes that are forbidden even when inside the workspace (e.g.
    /// `.git`, `node_modules/.cache`). Matched against the workspace-relative
    /// path of the target file or directory.
    pub path_denylist: Vec<String>,
    /// Master switch for the automatic workspace-containment gate. When on,
    /// mutation shell commands that reference absolute paths outside the
    /// workspace (and outside `path_allowlist`) are refused without running.
    pub block_workspace_escape: bool,
    pub use_local: bool,
    pub models_dir: PathBuf,
    pub max_seq_len: usize,
    pub command_timeout_secs: u64,
    pub max_tool_iterations: usize,
    pub max_tool_output_bytes: usize,
    pub max_parallel_tools: usize,
    pub transaction_max_bytes: usize,
    pub rollback_on_failure: bool,
    pub require_diff_summary: bool,
    /// Run `cargo clippy` in addition to the test gate after a mutation.
    pub lint_on_mutation: bool,
    /// After passing tests/lint, ask the coder model to critique the diff for
    /// regressions, security issues or weakened tests. Advisory only: concerns
    /// are surfaced as a note, not as a hard failure.
    pub adversarial_verification: bool,
    /// Auto-index assistant messages into the vector store on persist.
    pub memory_indexing: bool,
    /// v0.9.5 Specification-Locked Execution: compile an immutable TaskSpec
    /// (raw task + contract + repo API baseline) once per turn and enforce it
    /// on every write before compilation.
    pub spec_lock: bool,
    /// Generate the locked acceptance-oracle test file at turn start, before
    /// any implementation exists. Requires `spec_lock`.
    pub spec_oracle: bool,
    pub write_tool_policy: ApprovalPolicy,
    pub command_tool_policy: ApprovalPolicy,
    pub mcp_servers: Vec<crate::mcp::McpServerConfig>,
    /// Task-routing policy (local-first SLM vs remote cloud model).
    pub routing: crate::llm::routing::policy::RoutingPolicy,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            workspace_dir: PathBuf::from("."),
            memory_dir: PathBuf::from("memory_data"),
            ollama_host: std::env::var("OLLAMA_HOST").unwrap_or("http://localhost:11434".into()),
            planner_model: std::env::var("PLANNER_MODEL").unwrap_or("granite3.3:2b".into()),
            coder_model: std::env::var("CODER_MODEL").unwrap_or("qwen3:1.7b".into()),
            summarizer_model: std::env::var("SUMMARIZER_MODEL").unwrap_or("qwen3:0.6b".into()),
            max_context_tokens: std::env::var("MAX_CONTEXT_TOKENS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(128_000),
            max_retries: std::env::var("MAX_RETRIES")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
            chunk_size: std::env::var("CHUNK_SIZE")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(300),
            chunk_overlap: std::env::var("CHUNK_OVERLAP")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(20),
            allowed_commands: vec![
                "*".into(),
                "pytest".into(),
                "python".into(),
                "python3".into(),
                "py".into(),
                "npm".into(),
                "npx".into(),
                "pnpm".into(),
                "yarn".into(),
                "bun".into(),
                "deno".into(),
                "node".into(),
                "pip".into(),
                "uv".into(),
                "poetry".into(),
                "git".into(),
                "echo".into(),
                "cat".into(),
                "ls".into(),
                "dir".into(),
                "findstr".into(),
                "rg".into(),
                "fd".into(),
                "sg".into(),
                "tree".into(),
                "cargo".into(),
                "rustc".into(),
                "go".into(),
                "gcc".into(),
                "g++".into(),
                "make".into(),
                "powershell".into(),
                "pwsh".into(),
                "cmd".into(),
                "bash".into(),
                "sh".into(),
            ],
            blocked_commands: vec![
                "rm -rf".into(),
                "sudo".into(),
                "reboot".into(),
                "shutdown".into(),
                "format".into(),
                "del /f".into(),
                "rd /s".into(),
            ],
            path_allowlist: env_list("PATH_ALLOWLIST"),
            path_denylist: env_list("PATH_DENYLIST"),
            block_workspace_escape: env_bool("BLOCK_WORKSPACE_ESCAPE", true),
            use_local: true,
            models_dir: std::env::var("MODELS_DIR")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("models")),
            max_seq_len: 2048,
            command_timeout_secs: std::env::var("COMMAND_TIMEOUT_SECS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(600),
            max_tool_iterations: std::env::var("MAX_TOOL_ITERATIONS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(128),
            max_tool_output_bytes: std::env::var("MAX_TOOL_OUTPUT_BYTES")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(100_000),
            max_parallel_tools: std::env::var("MAX_PARALLEL_TOOLS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(4),
            transaction_max_bytes: std::env::var("TRANSACTION_MAX_BYTES")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(64 * 1024 * 1024),
            rollback_on_failure: env_bool("ROLLBACK_ON_FAILURE", true),
            require_diff_summary: env_bool("REQUIRE_DIFF_SUMMARY", true),
            lint_on_mutation: env_bool("LINT_ON_MUTATION", true),
            adversarial_verification: env_bool("ADVERSARIAL_VERIFICATION", false),
            memory_indexing: env_bool("MEMORY_INDEXING", false),
            spec_lock: env_bool("SPEC_LOCK", true),
            spec_oracle: env_bool("SPEC_ORACLE", true),
            write_tool_policy: ApprovalPolicy::from_env("WRITE_TOOL_POLICY", ApprovalPolicy::Allow),
            command_tool_policy: ApprovalPolicy::from_env(
                "COMMAND_TOOL_POLICY",
                ApprovalPolicy::Allow,
            ),
            mcp_servers: Vec::new(),
            routing: crate::llm::routing::policy::RoutingPolicy::from_env(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Serializes tests that mutate process-global env vars, which otherwise
    /// race when the test binary runs them in parallel.
    static ENV_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

    #[test]
    fn defaults_are_reasonable() {
        let cfg = Config::default();
        assert!(cfg.max_context_tokens > 0);
        assert!(cfg.max_retries > 0);
        assert!(cfg.chunk_overlap < cfg.chunk_size);
        assert!(!cfg.allowed_commands.is_empty());
        assert!(!cfg.blocked_commands.is_empty());
        assert!(cfg.allowed_commands.iter().any(|c| c == "cargo"));
        assert!(cfg.allowed_commands.iter().any(|c| c == "npm"));
        assert!(cfg.max_tool_output_bytes > 0);
        assert_eq!(cfg.write_tool_policy, ApprovalPolicy::Allow);
        assert_eq!(cfg.command_tool_policy, ApprovalPolicy::Allow);
        assert!(cfg.blocked_commands.iter().any(|c| c == "sudo"));
        assert!(cfg.block_workspace_escape);
        assert!(cfg.path_allowlist.is_empty());
        assert!(cfg.path_denylist.is_empty());
    }

    #[test]
    fn ollama_host_defaults_to_localhost() {
        let prev = std::env::var_os("OLLAMA_HOST");
        std::env::remove_var("OLLAMA_HOST");
        let cfg = Config::default();
        assert_eq!(cfg.ollama_host, "http://localhost:11434");
        match prev {
            Some(v) => std::env::set_var("OLLAMA_HOST", v),
            None => std::env::remove_var("OLLAMA_HOST"),
        }
    }

    #[test]
    fn respects_max_context_env_override() {
        let prev = std::env::var_os("MAX_CONTEXT_TOKENS");
        std::env::set_var("MAX_CONTEXT_TOKENS", "8192");
        let cfg = Config::default();
        assert_eq!(cfg.max_context_tokens, 8192);
        match prev {
            Some(v) => std::env::set_var("MAX_CONTEXT_TOKENS", v),
            None => std::env::remove_var("MAX_CONTEXT_TOKENS"),
        }
    }

    #[test]
    fn command_timeout_defaults_to_600() {
        let _guard = ENV_LOCK.lock().unwrap();
        let prev = std::env::var_os("COMMAND_TIMEOUT_SECS");
        std::env::remove_var("COMMAND_TIMEOUT_SECS");
        let cfg = Config::default();
        assert_eq!(cfg.command_timeout_secs, 600);
        match prev {
            Some(v) => std::env::set_var("COMMAND_TIMEOUT_SECS", v),
            None => std::env::remove_var("COMMAND_TIMEOUT_SECS"),
        }
    }

    #[test]
    fn command_timeout_respects_env_override() {
        let _guard = ENV_LOCK.lock().unwrap();
        let prev = std::env::var_os("COMMAND_TIMEOUT_SECS");
        std::env::set_var("COMMAND_TIMEOUT_SECS", "7");
        let cfg = Config::default();
        assert_eq!(cfg.command_timeout_secs, 7);
        match prev {
            Some(v) => std::env::set_var("COMMAND_TIMEOUT_SECS", v),
            None => std::env::remove_var("COMMAND_TIMEOUT_SECS"),
        }
    }

    #[test]
    fn default_coder_model_is_local_to_ollama() {
        let _guard = ENV_LOCK.lock().unwrap();
        let prev = std::env::var_os("CODER_MODEL");
        std::env::remove_var("CODER_MODEL");
        let cfg = Config::default();
        assert_eq!(cfg.coder_model, "qwen3:1.7b");
        assert!(!cfg.coder_model.contains('/'));
        match prev {
            Some(v) => std::env::set_var("CODER_MODEL", v),
            None => std::env::remove_var("CODER_MODEL"),
        }
    }
}
