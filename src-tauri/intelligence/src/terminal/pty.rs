//! PTY session backed by `portable-pty` (ConPTY on Windows, PTY on Unix).
//!
//! This is the bridge that lets a real terminal program (the TUI) run inside a
//! pseudo-terminal instead of a plain piped subprocess. Piping stdout alone is
//! not enough — ratatui/crossterm need a real TTY for alternate screen,
//! resize and mouse events.

use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::io::{Read, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};

/// Cloneable read side of a session, owned by the output-forwarding task.
pub struct SessionReader {
    inner: Arc<Mutex<Box<dyn Read + Send>>>,
}

impl SessionReader {
    /// Read whatever the child process has written so far.
    pub fn read_available(&self) -> Vec<u8> {
        let mut reader = self.inner.lock().unwrap();
        let mut buf = [0u8; 4096];
        let mut out = Vec::new();
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => out.extend_from_slice(&buf[..n]),
            }
            if out.len() >= 16 * 1024 {
                break;
            }
        }
        out
    }
}

/// A running terminal session bound to a ConPTY/PTY.
pub struct TerminalSession {
    pair: Arc<Mutex<PtyPair>>,
    reader: Arc<Mutex<Box<dyn Read + Send>>>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
}

impl TerminalSession {
    /// Spawn `argv[0]` (e.g. `anamnesic tui`, `pwsh`, `cmd`) inside a fresh
    /// pseudo-terminal sized `cols` x `rows`.
    pub fn spawn(argv: &[String], cols: u16, rows: u16, cwd: Option<&Path>) -> anyhow::Result<Self> {
        let pty_system = native_pty_system();
        let pair = pty_system.openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })?;

        let mut cmd = CommandBuilder::new(&argv[0]);
        for arg in &argv[1..] {
            cmd.arg(arg);
        }
        if let Some(dir) = cwd {
            cmd.cwd(dir);
        }
        // Ensure the child sees a real terminal even if TERM is unset.
        cmd.env("TERM", "xterm-256color");

        let child = pair.slave.spawn_command(cmd)?;
        // Keep the child handle alive for the life of the session so the PTY
        // is not torn down when the slave drops out of scope.
        std::mem::forget(child);

        let reader = pair.master.try_clone_reader()?;
        let writer = pair.master.take_writer()?;
        Ok(Self {
            pair: Arc::new(Mutex::new(pair)),
            reader: Arc::new(Mutex::new(reader)),
            writer: Arc::new(Mutex::new(writer)),
        })
    }

    /// Cloneable handle used by the output-forwarding task.
    pub fn clone_read_handle(&self) -> SessionReader {
        SessionReader {
            inner: Arc::clone(&self.reader),
        }
    }

    /// Resize the terminal after a browser window resize.
    pub fn resize(&self, cols: u16, rows: u16) -> anyhow::Result<()> {
        let pair = self.pair.lock().unwrap();
        let _ = pair.master.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        });
        Ok(())
    }

    /// Write bytes to the child's stdin (terminal input from the browser).
    pub fn write_input(&self, data: &[u8]) -> anyhow::Result<()> {
        let mut writer = self.writer.lock().unwrap();
        writer.write_all(data)?;
        writer.flush()?;
        Ok(())
    }
}
