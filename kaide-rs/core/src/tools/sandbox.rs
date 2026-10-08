use std::fmt;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SandboxViolation {
    PathTraversal(String),
    OutOfWorkspace(String),
    PathDenied(String),
    CommandDenied(String),
    NetworkDenied(String),
}

impl fmt::Display for SandboxViolation {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::PathTraversal(s) => write!(f, "Path traversal detected: {s}"),
            Self::OutOfWorkspace(s) => write!(f, "Path escapes workspace boundary: {s}"),
            Self::PathDenied(s) => write!(f, "Access to sensitive/denied path blocked: {s}"),
            Self::CommandDenied(s) => write!(f, "Command execution blocked by policy: {s}"),
            Self::NetworkDenied(s) => write!(f, "Network egress blocked by policy for URL: {s}"),
        }
    }
}

impl std::error::Error for SandboxViolation {}

/// Security Policy & Sandbox configuration
#[derive(Debug, Clone)]
pub struct SandboxPolicy {
    pub workspace_root: PathBuf,
    pub allow_read_outside: bool,
    pub allow_write_outside: bool,
    pub allow_network: bool,
    pub allowed_read_paths: Vec<PathBuf>,
    pub allowed_write_paths: Vec<PathBuf>,
    pub denied_patterns: Vec<String>,
    pub allowed_commands: Vec<String>,
    pub denied_commands: Vec<String>,
    pub scrub_env_vars: bool,
    pub insecure_mode: bool,
}

impl Default for SandboxPolicy {
    fn default() -> Self {
        Self {
            workspace_root: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            allow_read_outside: false,
            allow_write_outside: false,
            allow_network: true,
            allowed_read_paths: Vec::new(),
            allowed_write_paths: Vec::new(),
            denied_patterns: vec![
                ".git".to_string(),
                ".ssh".to_string(),
                ".aws".to_string(),
                ".env".to_string(),
                "id_rsa".to_string(),
                "id_ed25519".to_string(),
            ],
            allowed_commands: Vec::new(),
            denied_commands: vec![
                "rm -rf /".to_string(),
                "mkfs".to_string(),
                ":(){ :|:& };:".to_string(),
            ],
            scrub_env_vars: true,
            insecure_mode: false,
        }
    }
}

impl SandboxPolicy {
    pub fn new(workspace_root: PathBuf) -> Self {
        Self {
            workspace_root,
            ..Default::default()
        }
    }

    /// Sets insecure mode explicitly
    pub fn with_insecure_mode(mut self, insecure: bool) -> Self {
        self.insecure_mode = insecure;
        self
    }

    /// Resolves and verifies that a relative or absolute path is allowed for reading
    pub fn check_read_path(&self, rel_or_abs: impl AsRef<Path>) -> Result<PathBuf, SandboxViolation> {
        if self.insecure_mode {
            return Ok(self.workspace_root.join(rel_or_abs));
        }

        let target = self.resolve_path(rel_or_abs.as_ref())?;
        self.check_denied_patterns(&target)?;

        let canonical_root = self.canonical_workspace_root();
        if let Ok(canon_target) = target.canonicalize() {
            if canon_target.starts_with(&canonical_root) || canon_target == canonical_root {
                return Ok(canon_target);
            }
        }

        if self.allow_read_outside {
            return Ok(target);
        }

        for allowed in &self.allowed_read_paths {
            if let Ok(canon_allowed) = allowed.canonicalize() {
                if let Ok(canon_target) = target.canonicalize() {
                    if canon_target.starts_with(&canon_allowed) {
                        return Ok(canon_target);
                    }
                }
            }
        }

        Err(SandboxViolation::OutOfWorkspace(
            target.to_string_lossy().to_string(),
        ))
    }

    /// Resolves and verifies that a relative or absolute path is allowed for writing
    pub fn check_write_path(&self, rel_or_abs: impl AsRef<Path>) -> Result<PathBuf, SandboxViolation> {
        if self.insecure_mode {
            return Ok(self.workspace_root.join(rel_or_abs));
        }

        let target = self.resolve_path(rel_or_abs.as_ref())?;
        self.check_denied_patterns(&target)?;

        let canonical_root = self.canonical_workspace_root();
        let target_dir = target.parent().unwrap_or(&self.workspace_root);
        
        if let Ok(canon_dir) = target_dir.canonicalize() {
            if canon_dir.starts_with(&canonical_root) || canon_dir == canonical_root {
                return Ok(target);
            }
        } else if !target.is_absolute() && !target.to_string_lossy().contains("..") {
            return Ok(self.workspace_root.join(target));
        }

        if self.allow_write_outside {
            return Ok(target);
        }

        for allowed in &self.allowed_write_paths {
            if let Ok(canon_allowed) = allowed.canonicalize() {
                if let Ok(canon_dir) = target_dir.canonicalize() {
                    if canon_dir.starts_with(&canon_allowed) {
                        return Ok(target);
                    }
                }
            }
        }

        Err(SandboxViolation::OutOfWorkspace(
            target.to_string_lossy().to_string(),
        ))
    }

    /// Validates if a shell command is allowed to execute
    pub fn check_command(&self, command: &str) -> Result<(), SandboxViolation> {
        if self.insecure_mode {
            return Ok(());
        }

        let trimmed = command.trim();
        for denied in &self.denied_commands {
            if trimmed.contains(denied) {
                return Err(SandboxViolation::CommandDenied(format!(
                    "Command contains forbidden pattern '{denied}'"
                )));
            }
        }

        if !self.allowed_commands.is_empty() {
            let first_word = trimmed
                .split_whitespace()
                .next()
                .unwrap_or("")
                .trim_end_matches(".exe");
            if !self.allowed_commands.iter().any(|cmd| cmd == first_word) {
                return Err(SandboxViolation::CommandDenied(format!(
                    "Command '{first_word}' is not in allowed_commands"
                )));
            }
        }

        Ok(())
    }

    /// Validates URL network access
    pub fn check_network(&self, url: &str) -> Result<(), SandboxViolation> {
        if self.insecure_mode || self.allow_network {
            return Ok(());
        }
        Err(SandboxViolation::NetworkDenied(url.to_string()))
    }

    /// Scrubs sensitive API keys and secrets from environment variables
    pub fn clean_env_vars(&self) -> Vec<(String, String)> {
        let mut clean = Vec::new();
        for (k, v) in std::env::vars() {
            if self.scrub_env_vars {
                let upper = k.to_uppercase();
                if upper.ends_with("_KEY")
                    || upper.ends_with("_SECRET")
                    || upper.ends_with("_TOKEN")
                    || upper.starts_with("AWS_")
                    || upper == "GITHUB_TOKEN"
                    || upper == "ANTHROPIC_API_KEY"
                    || upper == "OPENAI_API_KEY"
                    || upper == "NVIDIA_API_KEY"
                {
                    continue;
                }
            }
            clean.push((k, v));
        }
        clean
    }

    fn resolve_path(&self, p: &Path) -> Result<PathBuf, SandboxViolation> {
        let p_str = p.to_string_lossy();
        if p_str.contains("..") {
            // Check if normalized path stays inside
            let combined = if p.is_absolute() {
                p.to_path_buf()
            } else {
                self.workspace_root.join(p)
            };
            
            if let Ok(canon) = combined.canonicalize() {
                let canon_root = self.canonical_workspace_root();
                if !canon_root.as_os_str().is_empty() && !canon.starts_with(&canon_root) {
                    return Err(SandboxViolation::PathTraversal(p_str.to_string()));
                }
            } else {
                // If path does not exist yet, verify lexical normalization
                let mut components = Vec::new();
                for comp in combined.components() {
                    match comp {
                        std::path::Component::ParentDir => {
                            if components.pop().is_none() {
                                return Err(SandboxViolation::PathTraversal(p_str.to_string()));
                            }
                        }
                        std::path::Component::Normal(c) => components.push(c),
                        _ => {}
                    }
                }
            }
        }

        if p.is_absolute() {
            Ok(p.to_path_buf())
        } else {
            Ok(self.workspace_root.join(p))
        }
    }

    fn check_denied_patterns(&self, p: &Path) -> Result<(), SandboxViolation> {
        let p_str = p.to_string_lossy().to_lowercase();
        for pattern in &self.denied_patterns {
            let pat_lower = pattern.to_lowercase();
            if p_str.contains(&format!("/{}", pat_lower))
                || p_str.contains(&format!("\\{}", pat_lower))
                || p_str.ends_with(&pat_lower)
            {
                return Err(SandboxViolation::PathDenied(pattern.clone()));
            }
        }
        Ok(())
    }

    fn canonical_workspace_root(&self) -> PathBuf {
        self.workspace_root
            .canonicalize()
            .unwrap_or_else(|_| self.workspace_root.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sandbox_path_traversal() {
        let temp_dir = std::env::temp_dir().join("chronokairo_sb_test");
        let _ = std::fs::create_dir_all(&temp_dir);

        let policy = SandboxPolicy::new(temp_dir.clone());
        let res = policy.check_read_path("../../windows/system32");
        assert!(res.is_err());

        let ok_path = temp_dir.join("sub/file.txt");
        let _ = std::fs::create_dir_all(temp_dir.join("sub"));
        let _ = std::fs::write(&ok_path, "hello");
        assert!(policy.check_read_path("sub/file.txt").is_ok());

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_sandbox_denied_patterns() {
        let policy = SandboxPolicy::new(PathBuf::from("."));
        assert!(policy.check_read_path(".git/config").is_err());
        assert!(policy.check_write_path("sub/.env").is_err());
    }

    #[test]
    fn test_sandbox_command_filter() {
        let policy = SandboxPolicy::new(PathBuf::from("."));
        assert!(policy.check_command("rm -rf /").is_err());
        assert!(policy.check_command("cargo check").is_ok());
    }
}
