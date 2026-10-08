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

#[derive(Debug, Clone, PartialEq, Eq)]
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
    pub write_tool_policy: ApprovalPolicy,
    pub command_tool_policy: ApprovalPolicy,
    pub mcp_servers: Vec<crate::mcp::McpServerConfig>,
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
                "pytest".into(),
                "python".into(),
                "npm".into(),
                "node".into(),
                "pip".into(),
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
            use_local: false,
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
            write_tool_policy: ApprovalPolicy::from_env("WRITE_TOOL_POLICY", ApprovalPolicy::Allow),
            command_tool_policy: ApprovalPolicy::from_env(
                "COMMAND_TOOL_POLICY",
                ApprovalPolicy::Allow,
            ),
            mcp_servers: Vec::new(),
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
