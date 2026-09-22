use std::io::Read;
use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use crate::config::settings::Config;

/// Result of running a shell command.
pub struct CommandOutput {
    pub code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub timed_out: bool,
}

impl CommandOutput {
    pub fn combined(&self) -> String {
        let mut result = self.stdout.clone();
        if !self.stderr.is_empty() {
            if !result.is_empty() {
                result.push('\n');
            }
            result.push_str("STDERR:\n");
            result.push_str(&self.stderr);
        }
        if let Some(code) = self.code {
            if code != 0 {
                if !result.is_empty() {
                    result.push('\n');
                }
                result.push_str(&format!("exit code: {code}"));
            }
        }
        if result.trim().is_empty() {
            "(no output)".into()
        } else {
            result
        }
    }
}

/// Shell metacharacters and operators that indicate command chaining or injection.
const SHELL_META_CHARS: &[char] = &[
    ';', '&', '|', '`', '$', '(', ')', '{', '}', '<', '>', '\n', '\\',
];

/// Parse a command string into (executable, args). Returns None if the command
/// contains shell metacharacters or is empty.
fn parse_command(cmd: &str) -> Option<(String, Vec<String>)> {
    let trimmed = cmd.trim();
    if trimmed.is_empty() {
        return None;
    }
    // Reject any command containing shell metacharacters
    if trimmed.chars().any(|c| SHELL_META_CHARS.contains(&c)) {
        return None;
    }
    let mut parts = trimmed.split_whitespace();
    let executable = parts.next()?.to_string();
    let args = parts.map(|s| s.to_string()).collect();
    Some((executable, args))
}

/// Extract the base executable name from a command string (first token, no args).
fn executable_name(cmd: &str) -> Option<String> {
    cmd.split_whitespace().next().map(|s| s.to_string())
}

/// Executables that can mutate the filesystem; their path arguments are subject
/// to the workspace-containment gate (`block_workspace_escape`).
fn mutation_executables() -> &'static [&'static str] {
    &[
        "rm",
        "rmdir",
        "mv",
        "cp",
        "ln",
        "mkdir",
        "md",
        "install",
        "truncate",
        "dd",
        "shred",
        "chmod",
        "chown",
        "touch",
        "tee",
        "vi",
        "vim",
        "nano",
        "ed",
        "del",
        "erase",
        "deltree",
        "rd",
        "ren",
        "rename",
        "move",
        "copy",
        "xcopy",
        "attrib",
        "takeown",
        "icacls",
        "sc",
        "reg",
        "wmic",
        "powershell",
        "pwsh",
        "cmd",
    ]
}

/// True when the resolved absolute target of `token` (an absolute path) falls
/// outside the workspace and outside every allowlisted prefix.
fn token_escapes_workspace(token: &str, config: &Config) -> bool {
    let trimmed = token.trim_matches(['"', '\'']);
    let path = std::path::PathBuf::from(trimmed);
    if !path.is_absolute() {
        return false;
    }
    let normalized = crate::tools::fs::normalize_workspace_path(&path);
    if normalized.starts_with(&config.workspace_dir) {
        return false;
    }
    !config.path_allowlist.iter().any(|allowed| {
        let allowed = std::path::PathBuf::from(allowed);
        normalized.starts_with(&allowed)
    })
}

/// Workspace-containment gate: when enabled, a *mutation* command whose path
/// arguments reference absolute paths outside the workspace (and outside the
/// allowlist) is refused before it can run. Read-only commands (`git`, `cargo`,
/// `ls`, ...) are not scanned, keeping false positives low.
pub fn escapes_workspace(cmd: &str, config: &Config) -> bool {
    if !config.block_workspace_escape {
        return false;
    }
    let tokens: Vec<String> = tokenize(cmd);
    let Some(executable) = tokens.first() else {
        return false;
    };
    let exe = executable
        .rsplit(['/', '\\'])
        .next()
        .unwrap_or(executable)
        .to_ascii_lowercase();
    if !mutation_executables().contains(&exe.as_str()) {
        return false;
    }
    tokens
        .iter()
        .skip(1)
        .any(|arg| token_escapes_workspace(arg, config))
}

/// Split a command string into whitespace-delimited tokens, honoring single and
/// double quotes. Unlike `parse_command`, this keeps Windows backslash paths
/// intact (backslash is a path separator, not a shell metacharacter here).
fn tokenize(cmd: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    let mut quote: Option<char> = None;
    for ch in cmd.chars() {
        match ch {
            '\'' | '"' if quote.is_none() => {
                quote = Some(ch);
            }
            c if Some(c) == quote => {
                quote = None;
            }
            c if quote.is_none() && c.is_whitespace() => {
                if !current.is_empty() {
                    tokens.push(std::mem::take(&mut current));
                }
            }
            c => current.push(c),
        }
    }
    if !current.is_empty() {
        tokens.push(current);
    }
    tokens
}

/// Check whether a command is allowed by the allow/block lists.
pub fn is_allowed(cmd: &str, config: &Config) -> bool {
    let trimmed = cmd.trim();
    if trimmed.is_empty() {
        return false;
    }
    let cmd_lower = trimmed.to_lowercase();
    let first_word = trimmed
        .split_whitespace()
        .next()
        .unwrap_or("")
        .trim_matches('"')
        .trim_matches('\'');
    let exe_lower = first_word.to_lowercase();

    // Check blocked commands for forbidden operations (e.g. rm -rf /, format, sudo reboot)
    for blocked in &config.blocked_commands {
        let b = blocked.to_lowercase();
        if !b.contains(' ') {
            if exe_lower == b
                || exe_lower == format!("{b}.exe")
                || exe_lower.ends_with(&format!("/{b}"))
                || exe_lower.ends_with(&format!("\\{b}"))
                || exe_lower.ends_with(&format!("/{b}.exe"))
                || exe_lower.ends_with(&format!("\\{b}.exe"))
            {
                return false;
            }
        } else if cmd_lower.contains(&b) {
            return false;
        }
    }

    // If allowed_commands is empty or contains wildcard "*", allow all non-blocked commands
    if config.allowed_commands.is_empty() || config.allowed_commands.iter().any(|a| a == "*") {
        return !escapes_workspace(cmd, config);
    }

    // Check allowed_commands list
    let listed = config.allowed_commands.iter().any(|a| {
        let a_lower = a.to_lowercase();
        exe_lower == a_lower
            || exe_lower.ends_with(&format!("/{a_lower}"))
            || exe_lower.ends_with(&format!("\\{a_lower}"))
    });
    listed && !escapes_workspace(cmd, config)
}

/// Run an allowlisted command with a timeout and return combined output.
pub fn run_command(cmd: &str, config: &Config) -> String {
    if super::exec_policy::command_is_forbidden(cmd, &config.workspace_dir) {
        return format!("Command forbidden by persistent execution policy: {cmd}");
    }
    if escapes_workspace(cmd, config) {
        return format!(
            "Command rejected: it mutates a path outside the workspace (and outside PATH_ALLOWLIST): {}",
            cmd
        );
    }
    if !is_allowed(cmd, config) {
        return format!(
            "Command not in allowed list or contains blocked operation: {}",
            cmd
        );
    }
    match run_command_inner(cmd, config, None) {
        Ok(out) => out.combined(),
        Err(e) => format!("Error: {e}"),
    }
}

/// Run a command and return the raw `CommandOutput` (used by the verification gate).
pub fn run_command_raw(cmd: &str, config: &Config) -> CommandOutput {
    run_command_raw_with_interrupt(cmd, config, None)
}

pub fn run_command_raw_with_interrupt(
    cmd: &str,
    config: &Config,
    interrupt: Option<&std::sync::atomic::AtomicBool>,
) -> CommandOutput {
    if super::exec_policy::command_is_forbidden(cmd, &config.workspace_dir) {
        return CommandOutput {
            code: None,
            stdout: String::new(),
            stderr: format!("Command forbidden by persistent execution policy: {cmd}"),
            timed_out: false,
        };
    }
    if escapes_workspace(cmd, config) {
        return CommandOutput {
            code: None,
            stdout: String::new(),
            stderr: format!(
                "Command rejected: it mutates a path outside the workspace (and outside PATH_ALLOWLIST): {cmd}"
            ),
            timed_out: false,
        };
    }
    if !is_allowed(cmd, config) {
        return CommandOutput {
            code: None,
            stdout: String::new(),
            stderr: format!("Command not in allowed list or contains blocked operation: {cmd}"),
            timed_out: false,
        };
    }
    run_command_inner(cmd, config, interrupt).unwrap_or_else(|e| CommandOutput {
        code: None,
        stdout: String::new(),
        stderr: format!("Error: {e}"),
        timed_out: false,
    })
}

/// Internal helper: execute a process using system shell to support arguments and shell features.
fn run_command_inner(
    cmd: &str,
    config: &Config,
    interrupt: Option<&std::sync::atomic::AtomicBool>,
) -> std::io::Result<CommandOutput> {
    #[cfg(target_family = "windows")]
    let mut command = {
        let mut c = Command::new("cmd.exe");
        c.args(["/C", cmd]);
        c
    };

    #[cfg(not(target_family = "windows"))]
    let mut command = {
        let mut c = Command::new("sh");
        c.args(["-c", cmd]);
        c
    };
    command
        .current_dir(&config.workspace_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    configure_process_group(&mut command);

    let mut child = command.spawn()?;
    let stdout = child.stdout.take().expect("stdout was configured as piped");
    let stderr = child.stderr.take().expect("stderr was configured as piped");
    let stdout_reader = thread::spawn(move || read_pipe(stdout));
    let stderr_reader = thread::spawn(move || read_pipe(stderr));

    let timeout = Duration::from_secs(config.command_timeout_secs);
    let started = Instant::now();
    let (status, timed_out) = loop {
        if let Some(status) = child.try_wait()? {
            break (status, false);
        }
        if let Some(flag) = interrupt {
            if flag.load(std::sync::atomic::Ordering::Relaxed) {
                terminate_process(&mut child);
                break (child.wait()?, false);
            }
        }
        if started.elapsed() >= timeout {
            terminate_process(&mut child);
            break (child.wait()?, true);
        }
        thread::sleep(Duration::from_millis(10));
    };

    let stdout = join_reader(stdout_reader);
    let mut stderr = join_reader(stderr_reader);
    if timed_out {
        if !stderr.is_empty() && !stderr.ends_with('\n') {
            stderr.push('\n');
        }
        stderr.push_str(&format!(
            "command timed out after {} second(s)",
            config.command_timeout_secs
        ));
    }

    Ok(CommandOutput {
        code: status.code(),
        stdout,
        stderr,
        timed_out,
    })
}

fn read_pipe<R: Read>(mut pipe: R) -> String {
    let mut bytes = Vec::new();
    let _ = pipe.read_to_end(&mut bytes);
    String::from_utf8_lossy(&bytes).into_owned()
}

fn join_reader(reader: thread::JoinHandle<String>) -> String {
    reader
        .join()
        .unwrap_or_else(|_| "failed to read process output".into())
}

#[cfg(unix)]
fn configure_process_group(command: &mut Command) {
    use std::os::unix::process::CommandExt;
    command.process_group(0);
}

#[cfg(not(unix))]
fn configure_process_group(_command: &mut Command) {}

#[cfg(unix)]
fn terminate_process(child: &mut Child) {
    let process_group = format!("-{}", child.id());
    let killed_group = Command::new("kill")
        .args(["-KILL", "--", &process_group])
        .status()
        .map(|status| status.success())
        .unwrap_or(false);
    if !killed_group {
        let _ = child.kill();
    }
}

#[cfg(not(unix))]
fn terminate_process(child: &mut Child) {
    let _ = child.kill();
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::settings::Config;

    fn test_config() -> Config {
        Config {
            workspace_dir: std::env::temp_dir(),
            ..Config::default()
        }
    }

    #[test]
    fn blocks_dangerous_commands() {
        let cfg = test_config();
        assert!(!is_allowed("rm -rf /", &cfg));
        assert!(!is_allowed("sudo apt install", &cfg));
    }

    #[test]
    fn allows_listed_commands() {
        let cfg = test_config();
        assert!(is_allowed("cargo check", &cfg));
        assert!(is_allowed("echo hello", &cfg));
    }

    #[test]
    fn empty_command_is_never_allowed() {
        let cfg = test_config();
        assert!(!is_allowed("", &cfg));
        assert!(!is_allowed("   ", &cfg));
    }

    #[test]
    fn run_command_refuses_disallowed_command_without_executing() {
        let cfg = test_config();
        let out = run_command("sudo whoami", &cfg);
        assert!(out.contains("not in allowed list"));
    }

    #[test]
    fn combined_joins_stdout_stderr_and_exit_code() {
        let out = CommandOutput {
            code: Some(2),
            stdout: "one".into(),
            stderr: "boom".into(),
            timed_out: false,
        };
        let c = out.combined();
        assert!(c.contains("one"));
        assert!(c.contains("STDERR:"));
        assert!(c.contains("boom"));
        assert!(c.contains("exit code: 2"));
    }

    #[test]
    fn combined_falls_back_to_no_output_label() {
        let out = CommandOutput {
            code: Some(0),
            stdout: String::new(),
            stderr: String::new(),
            timed_out: false,
        };
        assert_eq!(out.combined(), "(no output)");
    }

    #[cfg(target_family = "unix")]
    #[test]
    fn runs_allowlisted_program_directly() {
        let cfg = test_config();
        let out = run_command("echo ok", &cfg);
        assert_eq!(out.trim(), "ok");
    }

    #[cfg(target_family = "unix")]
    #[test]
    fn terminates_a_command_after_timeout() {
        let mut cfg = test_config();
        cfg.allowed_commands.push("sleep".into());
        cfg.command_timeout_secs = 0;

        let started = Instant::now();
        let out = run_command("sleep 2", &cfg);

        assert!(started.elapsed() < Duration::from_secs(1));
        assert!(out.contains("command timed out"), "got: {out}");
    }

    #[test]
    fn mutation_command_with_absolute_escape_is_rejected() {
        let cfg = test_config();
        // Read-only commands pass even with absolute paths.
        assert!(is_allowed("git status C:/Windows/System32", &cfg));
        // Mutation commands with args outside the workspace are blocked.
        let outside = cfg
            .workspace_dir
            .parent()
            .unwrap_or(std::path::Path::new("/"))
            .to_path_buf();
        assert!(!is_allowed(&format!("rm {}", outside.display()), &cfg));
        assert!(!is_allowed(&format!("mkdir {}", outside.display()), &cfg));
    }

    #[test]
    fn mutation_command_inside_workspace_is_allowed() {
        let cfg = test_config();
        let inside = cfg.workspace_dir.join("subdir");
        assert!(is_allowed(&format!("mkdir {}", inside.display()), &cfg));
    }

    #[test]
    fn disable_block_workspace_escape_lets_mutation_run() {
        let mut cfg = test_config();
        cfg.block_workspace_escape = false;
        let outside = std::env::temp_dir();
        assert!(is_allowed(&format!("rm {}file", outside.display()), &cfg));
    }

    #[test]
    fn path_allowlist_permits_external_mutation_target() {
        let mut cfg = test_config();
        let outside = cfg
            .workspace_dir
            .parent()
            .unwrap_or(std::path::Path::new("/"))
            .to_path_buf();
        cfg.path_allowlist.push(outside.display().to_string());
        let target = outside.join("chronokairo_bash_subdir");
        assert!(is_allowed(&format!("mkdir {}", target.display()), &cfg));
    }
}
