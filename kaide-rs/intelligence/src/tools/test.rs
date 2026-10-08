use crate::config::settings::Config;
use crate::tools::shell;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum VerificationStatus {
    Passed,
    Failed,
    Unavailable,
}

#[derive(Clone, Debug)]
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reports_unavailable_without_a_known_manifest() {
        let root =
            std::env::temp_dir().join(format!("anamnesic-test-runner-none-{}", std::process::id()));
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
}
