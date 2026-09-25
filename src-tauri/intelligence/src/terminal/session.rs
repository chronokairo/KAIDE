use anyhow::{Context, Result};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use crate::terminal::pty::TerminalSession;
use crate::terminal::shell::default_shell_command;

#[derive(Clone, Default)]
pub struct TerminalSessionManager {
    sessions: Arc<RwLock<HashMap<String, Arc<TerminalSession>>>>,
}

impl TerminalSessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn create_session(
        &self,
        id: &str,
        cols: u16,
        rows: u16,
        custom_cmd: Option<&str>,
    ) -> Result<crate::terminal::pty::SessionReader> {
        let cmd_str = custom_cmd
            .map(|s| s.to_string())
            .unwrap_or_else(default_shell_command);
        let argv = vec![cmd_str];

        let pty_session = TerminalSession::spawn(&argv, cols, rows, None)?;
        let arc_session = Arc::new(pty_session);
        let mut map = self
            .sessions
            .write()
            .map_err(|_| anyhow::anyhow!("Session lock poisoned"))?;

        map.insert(id.to_string(), Arc::clone(&arc_session));
        Ok((*arc_session).clone_read_handle())
    }

    pub fn get_session(&self, id: &str) -> Option<Arc<TerminalSession>> {
        let map = self.sessions.read().ok()?;
        map.get(id).cloned()
    }

    pub fn remove_session(&self, id: &str) {
        if let Ok(mut map) = self.sessions.write() {
            map.remove(id);
        }
    }

    pub fn resize_session(&self, id: &str, cols: u16, rows: u16) -> Result<()> {
        let session = self
            .get_session(id)
            .context("Session not found for resize")?;
        session.resize(cols, rows)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_manager_lifecycle() {
        let manager = TerminalSessionManager::new();
        let session_id = "test-session-1";

        let _reader = manager
            .create_session(session_id, 100, 30, None)
            .expect("Creating session should succeed");

        assert!(manager.get_session(session_id).is_some());

        manager
            .resize_session(session_id, 120, 40)
            .expect("Resizing session should succeed");

        manager.remove_session(session_id);
        assert!(manager.get_session(session_id).is_none());
    }
}
