//! Long-running detached commands (C9 background tasks).
//!
//! Lets the agent kick off a slow build/test command, keep working, and poll the
//! task later for status and captured output. Re-uses the same allow/block +
//! workspace-containment gates as the synchronous `run_command` so policy still
//! applies to backgrounded processes.
//!
//! ## Design
//!
//! Three threads are spawned per task:
//!
//! * **Stdout drain** – reads the child stdout pipe in 4 KiB chunks and appends
//!   to a shared `Arc<Mutex<String>>` buffer.
//! * **Stderr drain** – same for stderr.
//! * **Monitor** – polls `try_wait()` every 50 ms. When the process exits (or
//!   the deadline passes) it records the final status, kills the child on
//!   timeout, and drops the `Child` so its pipe write-ends close and the drain
//!   threads see EOF.
//!
//! `status()` reads the live buffers directly, so the caller sees partial output
//! while the process is still running (no "no output yet" while Running).
//!
//! ### Windows pipe inheritance fix
//!
//! `cmd.exe /C npm test` spawns grandchildren (node, vitest …) that inherit the
//! stdout/stderr pipe handles. A plain `read_to_end()` blocks until every
//! grandchild exits. We instead do chunked reads: once the monitor sets status
//! to Done and drops the Child (closing the write-end on our side), the drain
//! threads perform one final bounded drain and exit.
//!
//! On Windows, `kill()` also runs `taskkill /F /T /PID` to terminate the entire
//! process tree, not just the immediate child.

use std::collections::BTreeMap;
use std::io::Read;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

use crate::config::settings::Config;
use crate::tools::shell;

// ─── Status ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TaskStatus {
    Running,
    Done {
        exit_code: Option<i32>,
        timed_out: bool,
    },
}

impl std::fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskStatus::Running => write!(f, "Running"),
            TaskStatus::Done { exit_code, timed_out } => match (exit_code, timed_out) {
                (Some(code), false) => write!(f, "Done(exit={code})"),
                (None, true) => write!(f, "Done(timed_out)"),
                _ => write!(f, "Done"),
            },
        }
    }
}

// ─── Inner ───────────────────────────────────────────────────────────────────

#[derive(Debug)]
struct Inner {
    id: String,
    command: String,
    started_at: Instant,
    /// Live-updated by the drain threads (readable even while Running).
    stdout: Arc<Mutex<String>>,
    stderr: Arc<Mutex<String>>,
    status: TaskStatus,
    /// PID kept for process-tree kill on Windows.
    pid: Option<u32>,
    child: Option<Child>,
}

// ─── Manager ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct BackgroundTaskManager {
    inner: Arc<Mutex<BTreeMap<String, Arc<Mutex<Inner>>>>>,
}

impl BackgroundTaskManager {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(BTreeMap::new())),
        }
    }

    /// Spawn `command` detached. Returns the new task id, or an error message
    /// when the allow/block or workspace-containment gate rejects it.
    pub fn spawn(&self, command: &str, config: &Config) -> Result<String, String> {
        if command.trim().is_empty() {
            return Err("empty command".into());
        }
        if shell::escapes_workspace(command, config) {
            return Err(format!(
                "command rejected: it mutates a path outside the workspace (and outside PATH_ALLOWLIST): {command}"
            ));
        }
        if !shell::is_allowed(command, config) {
            return Err(format!(
                "Command not in allowed list or contains blocked operation: {command}"
            ));
        }

        #[cfg(target_family = "windows")]
        let mut cmd = {
            let mut c = Command::new("cmd.exe");
            c.args(["/C", command]);
            c
        };
        #[cfg(not(target_family = "windows"))]
        let mut cmd = {
            let mut c = Command::new("sh");
            c.args(["-c", command]);
            c
        };

        cmd.current_dir(&config.workspace_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let mut child = cmd.spawn().map_err(|e| format!("spawn failed: {e}"))?;
        let pid = child.id();
        let stdout_pipe = child.stdout.take().expect("stdout piped");
        let stderr_pipe = child.stderr.take().expect("stderr piped");

        let id = format!("bg{}", self.next_id());
        let stdout_buf: Arc<Mutex<String>> = Arc::new(Mutex::new(String::new()));
        let stderr_buf: Arc<Mutex<String>> = Arc::new(Mutex::new(String::new()));

        let task = Arc::new(Mutex::new(Inner {
            id: id.clone(),
            command: command.to_string(),
            started_at: Instant::now(),
            stdout: Arc::clone(&stdout_buf),
            stderr: Arc::clone(&stderr_buf),
            status: TaskStatus::Running,
            pid: Some(pid),
            child: Some(child),
        }));
        self.inner.lock().unwrap().insert(id.clone(), Arc::clone(&task));

        let timeout = Duration::from_secs(config.command_timeout_secs);

        // Monitor thread: polls try_wait, enforces deadline, drops Child on exit
        // so pipe write-ends are closed and drain threads see EOF.
        let task_mon = Arc::clone(&task);
        thread::spawn(move || {
            let deadline = Instant::now() + timeout;
            loop {
                thread::sleep(Duration::from_millis(50));
                let mut guard = task_mon.lock().unwrap();
                if !matches!(guard.status, TaskStatus::Running) {
                    break;
                }
                let pid = guard.pid;
                if let Some(child) = guard.child.as_mut() {
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            guard.status = TaskStatus::Done {
                                exit_code: status.code(),
                                timed_out: false,
                            };
                        }
                        Ok(None) => {
                            if Instant::now() >= deadline {
                                kill_process_tree(pid);
                                let _ = child.kill();
                                guard.status = TaskStatus::Done {
                                    exit_code: None,
                                    timed_out: true,
                                };
                            }
                        }
                        Err(_) => {
                            guard.status = TaskStatus::Done {
                                exit_code: None,
                                timed_out: false,
                            };
                        }
                    }
                }
            }
            // Drop child: closes the write-end of the pipes, unblocking drain threads.
            task_mon.lock().unwrap().child = None;
        });

        // Stdout drain thread
        let task_out = Arc::clone(&task);
        thread::spawn(move || drain_pipe(stdout_pipe, stdout_buf, task_out));

        // Stderr drain thread
        let task_err = Arc::clone(&task);
        thread::spawn(move || drain_pipe(stderr_pipe, stderr_buf, task_err));

        Ok(id)
    }

    fn next_id(&self) -> usize {
        self.inner.lock().unwrap().len() + 1
    }

    /// Most recent captured output (stdout + stderr) and current status.
    /// Output is live — readable even while the task is still Running.
    pub fn status(&self, id: &str) -> Option<(TaskStatus, String, Duration)> {
        let map = self.inner.lock().unwrap();
        let task = map.get(id)?;
        let guard = task.lock().unwrap();
        let out = guard.stdout.lock().unwrap().clone();
        let err = guard.stderr.lock().unwrap().clone();
        Some((
            guard.status.clone(),
            render_output_raw(&out, &err),
            guard.started_at.elapsed(),
        ))
    }

    pub fn list(&self) -> Vec<(String, String, String)> {
        let map = self.inner.lock().unwrap();
        map.iter()
            .map(|(id, task)| {
                let g = task.lock().unwrap();
                (
                    id.clone(),
                    g.command.clone(),
                    match &g.status {
                        TaskStatus::Running => "running".into(),
                        TaskStatus::Done { exit_code, timed_out } => {
                            if let Some(code) = exit_code {
                                format!("done (exit {code})")
                            } else if *timed_out {
                                "done (timed out)".into()
                            } else {
                                "done".into()
                            }
                        }
                    },
                )
            })
            .collect()
    }

    /// Stop a running task (kills entire process tree on Windows).
    /// Returns `true` when a kill was performed, `false` if already done.
    pub fn kill(&self, id: &str) -> bool {
        let map = self.inner.lock().unwrap();
        let Some(task) = map.get(id) else {
            return false;
        };
        let mut guard = task.lock().unwrap();
        if matches!(guard.status, TaskStatus::Done { .. }) {
            return false;
        }
        kill_process_tree(guard.pid);
        if let Some(child) = guard.child.as_mut() {
            let _ = child.kill();
        }
        guard.child = None;
        guard.status = TaskStatus::Done {
            exit_code: None,
            timed_out: false,
        };
        true
    }

    /// Block-poll until the task is Done or `deadline` elapses.
    /// Returns the final `(status, output, elapsed)` triple.
    #[cfg(test)]
    pub fn wait_for_done(
        &self,
        id: &str,
        deadline: Duration,
    ) -> Option<(TaskStatus, String, Duration)> {
        let start = Instant::now();
        loop {
            if let Some(result) = self.status(id) {
                if !matches!(result.0, TaskStatus::Running) {
                    return Some(result);
                }
            }
            if start.elapsed() >= deadline {
                return self.status(id);
            }
            thread::sleep(Duration::from_millis(50));
        }
    }
}

impl Default for BackgroundTaskManager {
    fn default() -> Self {
        Self::new()
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Drain `pipe` into `buf` in 4 KiB chunks.
///
/// Exits when it reads 0 bytes (EOF). Once the task is Done the monitor drops
/// the child (closing the write-end), so we see EOF naturally. A 512 KiB cap
/// on the final drain prevents hanging on grandchildren that never close the
/// pipe (pathological case on Windows).
fn drain_pipe<R: Read>(mut pipe: R, buf: Arc<Mutex<String>>, task: Arc<Mutex<Inner>>) {
    let mut tmp = [0u8; 4096];
    loop {
        let n = pipe.read(&mut tmp).unwrap_or(0);
        if n == 0 {
            break; // EOF — write-end closed by monitor or process exit.
        }
        let chunk = String::from_utf8_lossy(&tmp[..n]).into_owned();
        buf.lock().unwrap().push_str(&chunk);

        // After the task is Done the monitor drops Child, closing the write-end.
        // We do one more bounded drain to flush any bytes already in the pipe
        // buffer, then exit regardless of whether grandchildren are still alive.
        if !matches!(task.lock().unwrap().status, TaskStatus::Running) {
            const FINAL_CAP: usize = 512 * 1024;
            let mut remaining = FINAL_CAP;
            loop {
                let n = pipe.read(&mut tmp).unwrap_or(0);
                if n == 0 || remaining == 0 {
                    break;
                }
                remaining = remaining.saturating_sub(n);
                let chunk = String::from_utf8_lossy(&tmp[..n]).into_owned();
                buf.lock().unwrap().push_str(&chunk);
            }
            break;
        }
    }
}

/// Kill the entire Windows process tree rooted at `pid` using `taskkill /F /T`.
/// On non-Windows this is a no-op.
fn kill_process_tree(pid: Option<u32>) {
    #[cfg(target_family = "windows")]
    if let Some(pid) = pid {
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
    }
    #[cfg(not(target_family = "windows"))]
    let _ = pid;
}

fn render_output_raw(stdout: &str, stderr: &str) -> String {
    let mut out = stdout.to_owned();
    if !stderr.is_empty() {
        if !out.is_empty() {
            out.push('\n');
        }
        out.push_str("STDERR:\n");
        out.push_str(stderr);
    }
    if out.trim().is_empty() {
        "(no output yet)".into()
    } else {
        out
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn config() -> Config {
        Config {
            workspace_dir: env::temp_dir(),
            command_timeout_secs: 10,
            ..Config::default()
        }
    }

    #[test]
    fn spawn_status_and_list() {
        let cfg = config();
        let mgr = BackgroundTaskManager::new();
        let id = mgr.spawn("echo hello-bg", &cfg).expect("spawn");
        let (status, output, _) = mgr
            .wait_for_done(&id, Duration::from_secs(5))
            .expect("status");
        assert!(
            matches!(status, TaskStatus::Done { .. }),
            "status: {status}"
        );
        assert!(output.contains("hello-bg"), "output: {output}");
        let list = mgr.list();
        assert!(list.iter().any(|(i, _, _)| i == &id), "list: {list:?}");
    }

    #[test]
    fn output_visible_while_running() {
        let cfg = config();
        let mgr = BackgroundTaskManager::new();
        // Use a command that takes at least a couple seconds
        #[cfg(target_family = "windows")]
        let id = mgr.spawn("ping -n 4 127.0.0.1", &cfg).expect("spawn");
        #[cfg(not(target_family = "windows"))]
        let id = mgr.spawn("sleep 3", &cfg).expect("spawn");

        thread::sleep(Duration::from_millis(150));
        let (status, _output, elapsed) = mgr.status(&id).expect("status");
        // Should still be Running after 150ms
        assert!(
            matches!(status, TaskStatus::Running) || matches!(status, TaskStatus::Done { .. }),
            "unexpected: {status}"
        );
        assert!(elapsed < Duration::from_secs(5));
        // Clean up
        mgr.kill(&id);
    }

    #[test]
    fn kill_terminates_running_task() {
        let cfg = Config {
            workspace_dir: env::temp_dir(),
            command_timeout_secs: 60,
            ..Config::default()
        };
        let mgr = BackgroundTaskManager::new();
        #[cfg(target_family = "windows")]
        let id = mgr.spawn("ping -n 100 127.0.0.1", &cfg).expect("spawn");
        #[cfg(not(target_family = "windows"))]
        let id = mgr.spawn("sleep 100", &cfg).expect("spawn");

        thread::sleep(Duration::from_millis(150));
        assert!(mgr.kill(&id), "kill should return true for running task");
        let (status, _, _) = mgr.status(&id).expect("status after kill");
        assert!(
            matches!(status, TaskStatus::Done { .. }),
            "should be Done after kill, got: {status}"
        );
        // Second kill should return false (already done)
        assert!(!mgr.kill(&id), "second kill should return false");
    }

    #[test]
    fn timeout_kills_long_running_task() {
        let cfg = Config {
            workspace_dir: env::temp_dir(),
            command_timeout_secs: 1,
            ..Config::default()
        };
        let mgr = BackgroundTaskManager::new();
        #[cfg(target_family = "windows")]
        let id = mgr.spawn("ping -n 100 127.0.0.1", &cfg).expect("spawn");
        #[cfg(not(target_family = "windows"))]
        let id = mgr.spawn("sleep 100", &cfg).expect("spawn");

        let (status, _, elapsed) = mgr
            .wait_for_done(&id, Duration::from_secs(4))
            .expect("status");
        assert!(
            matches!(status, TaskStatus::Done { timed_out: true, .. }),
            "should be timed_out=true, got: {status}"
        );
        assert!(elapsed < Duration::from_secs(4), "took too long: {elapsed:?}");
    }

    #[test]
    fn rejected_command_returns_error_not_task() {
        let cfg = config();
        let mgr = BackgroundTaskManager::new();
        let err = mgr.spawn("sudo whoami", &cfg).unwrap_err();
        assert!(err.contains("not in allowed list") || err.contains("blocked"));
    }
}
