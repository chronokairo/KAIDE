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

/// Check whether a command is allowed by the allow/block lists.
/// Rejects commands with shell metacharacters (chaining, injection) and
/// checks the executable name against the allow/block lists.
pub fn is_allowed(cmd: &str, config: &Config) -> bool {
    let (executable, _args) = match parse_command(cmd) {
        Some(pair) => pair,
        None => return false,
    };
    let cmd_lower = cmd.to_lowercase();
    let exe_lower = executable.to_lowercase();
    for blocked in &config.blocked_commands {
        let b = blocked.to_lowercase();
        if exe_lower == b || cmd_lower.contains(&b) || exe_lower.starts_with(&format!("{b}/")) {
            return false;
        }
    }
    config
        .allowed_commands
        .iter()
        .any(|a| exe_lower == a.to_lowercase() || exe_lower.starts_with(&format!("{a}/")))
}

/// Run an allowlisted command with a timeout and return combined output.
pub fn run_command(cmd: &str, config: &Config) -> String {
    if !is_allowed(cmd, config) {
        return format!(
            "Command not in allowed list or contains shell operators: {}",
            cmd
        );
    }
    match run_command_inner(cmd, config, None) {
        Ok(out) => out.combined(),
        Err(e) => format!("Error: {e}"),
    }
}

/// Run a command and return the raw `CommandOutput` (used by the verification gate).
/// Also validates the allowlist and rejects shell metacharacters.
pub fn run_command_raw(cmd: &str, config: &Config) -> CommandOutput {
    run_command_raw_with_interrupt(cmd, config, None)
}

pub fn run_command_raw_with_interrupt(
    cmd: &str,
    config: &Config,
    interrupt: Option<&std::sync::atomic::AtomicBool>,
) -> CommandOutput {
    if !is_allowed(cmd, config) {
        return CommandOutput {
            code: None,
            stdout: String::new(),
            stderr: format!("Command not in allowed list or contains shell operators: {cmd}"),
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

/// Internal helper: execute an allowlisted program directly and enforce a timeout.
fn run_command_inner(
    cmd: &str,
    config: &Config,
    interrupt: Option<&std::sync::atomic::AtomicBool>,
) -> std::io::Result<CommandOutput> {
    let (executable, args) = parse_command(cmd)
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "invalid command"))?;
    let mut command = Command::new(executable);
    command
        .args(args)
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
}
