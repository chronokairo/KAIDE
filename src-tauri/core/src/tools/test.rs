use crate::config::settings::Config;
use crate::tools::shell;

#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum VerificationStatus {
    Passed,
    Failed,
    Unavailable,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct VerificationResult {
    pub status: VerificationStatus,
    pub command: Option<String>,
    pub exit_code: Option<i32>,
    pub timed_out: bool,
    pub output: String,
}

impl VerificationResult {
    pub fn passed(&self) -> bool {
        self.status == VerificationStatus::Passed
    }

    pub fn failed(&self) -> bool {
        self.status == VerificationStatus::Failed
    }

    pub fn unavailable(message: impl Into<String>) -> Self {
        Self {
            status: VerificationStatus::Unavailable,
            command: None,
            exit_code: None,
            timed_out: false,
            output: message.into(),
        }
    }
}

/// Detect the workspace test runner and execute it through the same allowlisted,
/// timeout-aware process runner used by command tools.
pub fn run_tests(request: &str, config: &Config) -> VerificationResult {
    let request = request.trim();
    let command = if config.workspace_dir.join("Cargo.toml").exists() {
        cargo_command(request)
    } else if has_python_tests(config) {
        python_command(request)
    } else if config.workspace_dir.join("package.json").exists() {
        node_command(request)
    } else {
        return VerificationResult::unavailable(
            "No supported test framework detected (Cargo, Python/pytest, or Node/npm).",
        );
    };

    run_verification_command(&command, config)
}
fn cargo_command(request: &str) -> String {
    if request.is_empty() || request == "cargo" || request == "cargo test" {
        "cargo test".to_string()
    } else if request.starts_with("cargo ") {
        request.to_string()
    } else {
        format!("cargo test {request}")
    }
}

fn python_command(request: &str) -> String {
    if request.starts_with("python ") || request.starts_with("pytest") {
        request.to_string()
    } else if request.is_empty() || request == "tests" {
        "python -m pytest -v".to_string()
    } else {
        format!("python -m pytest {request} -v")
    }
}

fn node_command(request: &str) -> String {
    if request.starts_with("npm ") || request.starts_with("node ") {
        request.to_string()
    } else if request.is_empty() {
        "npm test".to_string()
    } else {
        format!("npm test {request}")
    }
}

fn has_python_tests(config: &Config) -> bool {
    ["pyproject.toml", "pytest.ini", "setup.cfg", "tests"]
        .iter()
        .any(|path| config.workspace_dir.join(path).exists())
}

pub fn run_verification_command(command: &str, config: &Config) -> VerificationResult {
    let result = shell::run_command_raw(command, config);
    let status = if result.code == Some(0) && !result.timed_out {
        VerificationStatus::Passed
    } else {
        VerificationStatus::Failed
    };
    VerificationResult {
        status,
        command: Some(command.to_string()),
        exit_code: result.code,
        timed_out: result.timed_out,
        output: result.combined(),
    }
}

/// Run `cargo clippy` (short output) as a static-analysis gate for Rust
/// workspaces. Returns `None` when no Cargo.toml is present.
pub fn run_lint(config: &Config) -> Option<VerificationResult> {
    if !config.workspace_dir.join("Cargo.toml").exists() {
        return None;
    }
    Some(run_verification_command(
        "cargo clippy --message-format short",
        config,
    ))
}

#[derive(Clone, Debug, PartialEq, Eq, Default)]
pub struct CompilerDiagnostic {
    pub file: Option<String>,
    pub line: Option<usize>,
    pub column: Option<usize>,
    pub code: Option<String>,
    pub message: String,
    pub hints: Vec<String>,
}

/// Extract structured compiler diagnostics from raw compiler/test output.
pub fn extract_diagnostics(output: &str) -> Vec<CompilerDiagnostic> {
    let mut diagnostics = Vec::new();
    let mut current: Option<CompilerDiagnostic> = None;

    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // Pattern 1: Short format `src/storage.rs:28:81: error[E0499]: cannot borrow...`
        if let Some(err_idx) = trimmed.find(": error") {
            let prefix = &trimmed[..err_idx];
            let after = &trimmed[err_idx + 2..]; // `error...` or `error[E0499]: ...`
            let file_parts: Vec<&str> = prefix.split(':').collect();

            let (file, line_num, col) = if file_parts.len() >= 3 {
                (
                    Some(file_parts[0].replace('\\', "/")),
                    file_parts[1].parse::<usize>().ok(),
                    file_parts[2].parse::<usize>().ok(),
                )
            } else if file_parts.len() == 2 {
                (
                    Some(file_parts[0].replace('\\', "/")),
                    file_parts[1].parse::<usize>().ok(),
                    None,
                )
            } else {
                (Some(prefix.replace('\\', "/")), None, None)
            };

            let code = if let Some(start) = after.find('[') {
                if let Some(end) = after.find(']') {
                    if end > start {
                        Some(after[start + 1..end].to_string())
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            };

            let message = after
                .split(':')
                .nth(1)
                .unwrap_or(after)
                .trim()
                .to_string();

            if let Some(diag) = current.take() {
                diagnostics.push(diag);
            }

            current = Some(CompilerDiagnostic {
                file,
                line: line_num,
                column: col,
                code,
                message,
                hints: Vec::new(),
            });
            continue;
        }

        // Pattern 2: Standard rustc format `error[E0499]: cannot borrow...`
        if trimmed.starts_with("error[") || trimmed.starts_with("error:") {
            if let Some(diag) = current.take() {
                diagnostics.push(diag);
            }

            let code = if let Some(start) = trimmed.find('[') {
                if let Some(end) = trimmed.find(']') {
                    if end > start {
                        Some(trimmed[start + 1..end].to_string())
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            };

            let message = trimmed
                .split(':')
                .nth(1)
                .unwrap_or(trimmed)
                .trim()
                .to_string();

            current = Some(CompilerDiagnostic {
                file: None,
                line: None,
                column: None,
                code,
                message,
                hints: Vec::new(),
            });
            continue;
        }

        // Location line `--> src/storage.rs:28:81`
        if trimmed.starts_with("--> ") {
            let loc = trimmed.trim_start_matches("--> ").trim();
            let parts: Vec<&str> = loc.split(':').collect();
            if let Some(diag) = current.as_mut() {
                if parts.len() >= 3 {
                    diag.file = Some(parts[0].replace('\\', "/"));
                    diag.line = parts[1].parse::<usize>().ok();
                    diag.column = parts[2].parse::<usize>().ok();
                } else if parts.len() == 2 {
                    diag.file = Some(parts[0].replace('\\', "/"));
                    diag.line = parts[1].parse::<usize>().ok();
                }
            }
            continue;
        }

        // Hints & suggestions `help: ...` or `note: ...`
        if trimmed.starts_with("help: ") || trimmed.starts_with("note: ") {
            if let Some(diag) = current.as_mut() {
                diag.hints.push(trimmed.to_string());
            }
        }
    }

    if let Some(diag) = current {
        diagnostics.push(diag);
    }

    diagnostics
}

/// Format a scoped, concise repair prompt from compiler diagnostics targeting a file.
pub fn format_scoped_repair_prompt(
    diagnostics: &[CompilerDiagnostic],
    target_file: Option<&str>,
    raw_fallback: &str,
) -> String {
    let relevant: Vec<&CompilerDiagnostic> = if let Some(target) = target_file {
        let norm_target = target.replace('\\', "/");
        let matched: Vec<_> = diagnostics
            .iter()
            .filter(|d| d.file.as_deref().map(|f| f.ends_with(&norm_target) || norm_target.ends_with(f)).unwrap_or(false))
            .collect();
        if matched.is_empty() {
            diagnostics.iter().collect()
        } else {
            matched
        }
    } else {
        diagnostics.iter().collect()
    };

    if relevant.is_empty() {
        return format!("Compiler check failed:\n{}", raw_fallback.trim());
    }

    let mut out = String::new();
    let header_file = target_file.unwrap_or("workspace");
    out.push_str(&format!("Compiler constraints to resolve in `{header_file}`:\n"));

    for diag in &relevant {
        let code_str = diag.code.as_deref().map(|c| format!(" [{c}]")).unwrap_or_default();
        let loc_str = match (diag.file.as_deref(), diag.line) {
            (Some(f), Some(l)) => format!(" in `{f}:{l}`"),
            (_, Some(l)) => format!(" at line {l}"),
            (Some(f), None) => format!(" in `{f}`"),
            _ => String::new(),
        };
        out.push_str(&format!("• Error{code_str}{loc_str}: {}\n", diag.message));
        for hint in &diag.hints {
            out.push_str(&format!("    ↳ {}\n", hint));
        }
    }

    out.push_str("\nOperational Constraints:\n");
    if let Some(target) = target_file {
        out.push_str(&format!("1. Resolve these constraints strictly within `{target}` using `edit_file`.\n"));
    } else {
        out.push_str("1. Resolve these constraints using `edit_file` on the affected files.\n");
    }
    out.push_str("2. Preserve existing struct and method signatures.\n");
    out.push_str("3. Do not invent non-existent root modules.\n");

    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reports_unavailable_without_a_known_manifest() {
        let root =
            std::env::temp_dir().join(format!("chronokairo-test-runner-none-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        let config = Config {
            workspace_dir: root.clone(),
            ..Config::default()
        };

        let result = run_tests("", &config);

        assert_eq!(result.status, VerificationStatus::Unavailable);
        assert!(result.command.is_none());
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn cargo_request_is_not_misused_as_a_test_name_filter() {
        assert_eq!(cargo_command("cargo test"), "cargo test");
        assert_eq!(cargo_command("duration"), "cargo test duration");
        assert_eq!(cargo_command("cargo check"), "cargo check");
    }

    #[test]
    fn extracts_rustc_diagnostics_correctly() {
        let stderr = r#"
error[E0499]: cannot borrow `*self` as mutable more than once at a time
  --> src/storage.rs:28:81
   |
28 |         if let (Some(from_account), Some(to_account)) = (self.get_mut(from_id), self.get_mut(to_id)) {
   |                                                         ------------------------^^^^----------------
   |                                                         ||                      |
   |                                                         ||                      second mutable borrow occurs here
help: try adding a local storing this
        "#;

        let diags = extract_diagnostics(stderr);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].code.as_deref(), Some("E0499"));
        assert_eq!(diags[0].file.as_deref(), Some("src/storage.rs"));
        assert_eq!(diags[0].line, Some(28));
        assert!(diags[0].message.contains("cannot borrow"));
        assert_eq!(diags[0].hints.len(), 1);
        assert!(diags[0].hints[0].contains("help: try adding a local"));

        let prompt = format_scoped_repair_prompt(&diags, Some("src/storage.rs"), stderr);
        assert!(prompt.contains("Compiler constraints to resolve in `src/storage.rs`"));
        assert!(prompt.contains("Error [E0499] in `src/storage.rs:28`"));
        assert!(prompt.contains("cannot borrow"));
        assert!(prompt.contains("help: try adding a local"));
    }

    #[test]
    fn extracts_short_message_diagnostics_correctly() {
        let stderr = "src\\service.rs:34:9: error[E0594]: cannot assign to `from_account.balance`\nhelp: consider specifying this binding";
        let diags = extract_diagnostics(stderr);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].code.as_deref(), Some("E0594"));
        assert_eq!(diags[0].file.as_deref(), Some("src/service.rs"));
        assert_eq!(diags[0].line, Some(34));
    }
}

