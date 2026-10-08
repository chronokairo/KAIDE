use std::path::{Path, PathBuf};
use rusqlite::Connection;
use chrono::Local;

/// Summary metadata for a saved conversation, shown in the resume picker.
#[derive(Debug, Clone)]
pub struct SessionInfo {
    pub id: i64,
    pub timestamp: String,
    pub updated_at: String,
    pub summary: String,
    pub message_count: usize,
    pub model: String,
}

pub struct LongTermMemory {
    conn: Connection,
    path: PathBuf,
}

impl LongTermMemory {
    pub fn new(db_path: PathBuf) -> anyhow::Result<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let conn = Connection::open(&db_path)?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                summary TEXT,
                context TEXT
            );
            CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                decision TEXT,
                reason TEXT
            );
            CREATE TABLE IF NOT EXISTS session_messages (
                session_id INTEGER NOT NULL,
                seq INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT,
                PRIMARY KEY (session_id, seq)
            );
            CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages(session_id);"
        )?;
        Self::migrate_sessions_table(&conn)?;
        Ok(LongTermMemory { conn, path: db_path })
    }

    /// Add metadata columns that older session rows lack. Applies only to the
    /// local SQLite database, so the `ALTER TABLE` calls are idempotent.
    fn migrate_sessions_table(conn: &Connection) -> anyhow::Result<()> {
        let mut columns = Vec::new();
        {
            let mut stmt = conn.prepare("PRAGMA table_info(sessions)")?;
            let rows = stmt.query_map([], |row| row.get::<_, String>(1))?;
            for row in rows {
                columns.push(row?);
            }
        }
        for (name, definition) in [
            ("workspace", "TEXT"),
            ("model", "TEXT"),
            ("updated_at", "TEXT"),
            ("status", "TEXT DEFAULT 'active'"),
            ("message_count", "INTEGER DEFAULT 0"),
        ] {
            if !columns.iter().any(|c| c == name) {
                conn.execute_batch(&format!("ALTER TABLE sessions ADD COLUMN {name} {definition};"))?;
            }
        }
        Ok(())
    }

    pub fn path(&self) -> &Path {
        self.path.as_path()
    }

    /// Create a new session record and return its id.
    pub fn start_session(&self, workspace: &str, model: &str) -> anyhow::Result<i64> {
        let now = Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO sessions (timestamp, summary, context, workspace, model, updated_at, status, message_count)
             VALUES (?1, '', '', ?2, ?3, ?4, 'active', 0)",
            rusqlite::params![now, workspace, model, now],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    /// Append transcript records `(seq, role, content)` to a session. Rows are
    /// keyed on `(session_id, seq)` so re-writing an already-persisted seq is a
    /// no-op — transcripts are append-only and survive compaction.
    pub fn append_messages(
        &self,
        session_id: i64,
        messages: &[(i64, String, String)],
    ) -> anyhow::Result<()> {
        if messages.is_empty() {
            return Ok(());
        }
        let tx = self.conn.unchecked_transaction()?;
        let now = Local::now().to_rfc3339();
        {
            let mut stmt = tx.prepare(
                "INSERT OR IGNORE INTO session_messages (session_id, seq, role, content, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
            )?;
            for (seq, role, content) in messages {
                stmt.execute(rusqlite::params![session_id, seq, role, content, now])?;
            }
        }
        tx.execute(
            "UPDATE sessions SET
                updated_at = ?1,
                message_count = (SELECT COUNT(*) FROM session_messages WHERE session_id = ?2)
             WHERE id = ?2",
            rusqlite::params![now, session_id],
        )?;
        tx.commit()?;
        Ok(())
    }

    /// Refresh session metadata after a write: title (first user message),
    /// compaction context, model, last-activity timestamp and message count.
    pub fn update_session(
        &self,
        session_id: i64,
        title: &str,
        context: &str,
        model: &str,
    ) -> anyhow::Result<()> {
        self.conn.execute(
            "UPDATE sessions SET
                summary = COALESCE(NULLIF(?1, ''), summary),
                context = ?2,
                model = ?3,
                updated_at = ?4,
                message_count = (SELECT COUNT(*) FROM session_messages WHERE session_id = ?5)
             WHERE id = ?5",
            rusqlite::params![
                title,
                context,
                model,
                Local::now().to_rfc3339(),
                session_id
            ],
        )?;
        Ok(())
    }

    /// Recently active saved sessions for a workspace, newest first.
    pub fn list_sessions(&self, workspace: &str, limit: usize) -> anyhow::Result<Vec<SessionInfo>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, timestamp, updated_at, summary, message_count, model
             FROM sessions
             WHERE workspace = ?1 AND status = 'active' AND message_count > 0
             ORDER BY updated_at DESC
             LIMIT ?2",
        )?;
        let rows = stmt.query_map(rusqlite::params![workspace, limit as i64], |row| {
            Ok(SessionInfo {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                updated_at: row.get(2)?,
                summary: row.get(3)?,
                message_count: row.get(4)?,
                model: row.get(5)?,
            })
        })?;
        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }
        Ok(result)
    }

    /// Id of the most recently active session for a workspace, if any.
    pub fn latest_session(&self, workspace: &str) -> anyhow::Result<Option<i64>> {
        let mut stmt = self.conn.prepare(
            "SELECT id FROM sessions
             WHERE workspace = ?1 AND status = 'active' AND message_count > 0
             ORDER BY updated_at DESC LIMIT 1",
        )?;
        let mut rows = stmt.query_map(rusqlite::params![workspace], |row| {
            row.get::<_, i64>(0)
        })?;
        Ok(rows.next().transpose()?)
    }

    /// Full transcript of a session as `(seq, role, content)`, in order.
    pub fn load_session(&self, session_id: i64) -> anyhow::Result<Vec<(i64, String, String)>> {
        let mut stmt = self.conn.prepare(
            "SELECT seq, role, content FROM session_messages WHERE session_id = ?1 ORDER BY seq",
        )?;
        let rows = stmt.query_map(rusqlite::params![session_id], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        })?;
        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }
        Ok(result)
    }

    /// Stored compaction context for a session, if any.
    pub fn session_context(&self, session_id: i64) -> anyhow::Result<Option<String>> {
        let mut stmt = self.conn.prepare("SELECT context FROM sessions WHERE id = ?1")?;
        let mut rows = stmt.query_map(rusqlite::params![session_id], |row| {
            row.get::<_, String>(0)
        })?;
        Ok(rows.next().transpose()?.filter(|s| !s.trim().is_empty()))
    }

    /// Remove a saved conversation entirely.
    pub fn delete_session(&self, session_id: i64) -> anyhow::Result<()> {
        self.conn.execute(
            "DELETE FROM session_messages WHERE session_id = ?1",
            rusqlite::params![session_id],
        )?;
        self.conn.execute(
            "DELETE FROM sessions WHERE id = ?1",
            rusqlite::params![session_id],
        )?;
        Ok(())
    }

    /// Legacy compatibility shim: create a one-off session record and store
    /// `task` + `response` as a two-message transcript.  Used by CLI/planner
    /// paths that do not go through the full persist workflow.
    pub fn save_session(&self, task: &str, response: &str) -> anyhow::Result<()> {
        let ws = self
            .path
            .parent()
            .and_then(|p| p.parent())
            .map(|p| p.display().to_string())
            .unwrap_or_default();
        let id = self.start_session(&ws, "")?;
        let msgs = vec![
            (0i64, "user".to_string(), task.to_string()),
            (1i64, "assistant".to_string(), response.to_string()),
        ];
        self.append_messages(id, &msgs)?;
        self.update_session(id, task, "", "")?;
        Ok(())
    }

    /// Return recently active sessions across all workspaces, newest first.
    /// Used by the CLI `--resume` flag.
    pub fn get_recent_sessions(&self, limit: usize) -> anyhow::Result<Vec<(String, String)>> {
        let mut stmt = self.conn.prepare(
            "SELECT updated_at, summary FROM sessions
             WHERE status = 'active' AND message_count > 0
             ORDER BY updated_at DESC LIMIT ?1",
        )?;
        let rows = stmt.query_map(rusqlite::params![limit as i64], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;
        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }
        Ok(result)
    }

    pub fn save_decision(&self, decision: &str, reason: &str) -> anyhow::Result<()> {
        self.conn.execute(
            "INSERT INTO decisions (timestamp, decision, reason) VALUES (?1, ?2, ?3)",
            rusqlite::params![Local::now().to_rfc3339(), decision, reason],
        )?;
        Ok(())
    }
}

impl Clone for LongTermMemory {
    fn clone(&self) -> Self {
        Self::new(self.path.clone()).expect("failed to clone long-term memory connection")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_memory(tag: &str) -> LongTermMemory {
        let dir = std::env::temp_dir().join(format!("anamnesic-memory-log-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        LongTermMemory::new(dir.join("memory.db")).unwrap()
    }

    #[test]
    fn persists_and_reloads_session_transcript() {
        let m = temp_memory("roundtrip");
        let id = m.start_session("/tmp/ws", "qwen3:1.7b").unwrap();
        let messages = vec![
            (0i64, "user".to_string(), "add tests".to_string()),
            (1i64, "assistant".to_string(), "done".to_string()),
        ];
        m.append_messages(id, &messages).unwrap();
        m.update_session(id, "add tests", "", "qwen3:1.7b").unwrap();

        let sessions = m.list_sessions("/tmp/ws", 10).unwrap();
        assert_eq!(sessions.len(), 1);
        assert_eq!(sessions[0].id, id);
        assert_eq!(sessions[0].message_count, 2);
        assert_eq!(sessions[0].summary, "add tests");

        let loaded = m.load_session(id).unwrap();
        assert_eq!(loaded.len(), 2);
        assert_eq!(loaded[0].1, "user");
        assert_eq!(loaded[0].2, "add tests");
        assert_eq!(loaded[1].2, "done");
    }

    #[test]
    fn append_is_idempotent_per_seq() {
        let m = temp_memory("idempotent");
        let id = m.start_session("/tmp/ws", "m").unwrap();
        let one = vec![(0i64, "user".to_string(), "hello".to_string())];
        m.append_messages(id, &one).unwrap();
        // Same seq re-appended must not duplicate.
        m.append_messages(id, &one).unwrap();
        let loaded = m.load_session(id).unwrap();
        assert_eq!(loaded.len(), 1);
        // A new seq appends.
        m.append_messages(id, &[(1i64, "assistant".to_string(), "hi".to_string())]).unwrap();
        assert_eq!(m.load_session(id).unwrap().len(), 2);
    }

    #[test]
    fn sessions_are_scoped_by_workspace() {
        let m = temp_memory("scope");
        let a = m.start_session("/ws/a", "m").unwrap();
        m.append_messages(a, &[(0, "user".into(), "x".into())]).unwrap();
        let b = m.start_session("/ws/b", "m").unwrap();
        m.append_messages(b, &[(0, "user".into(), "y".into())]).unwrap();
        let list_a = m.list_sessions("/ws/a", 10).unwrap();
        assert_eq!(list_a.len(), 1);
        assert_eq!(list_a[0].id, a);
        assert_eq!(m.latest_session("/ws/b").unwrap(), Some(b));
        assert_eq!(m.latest_session("/ws/none").unwrap(), None);
    }

    #[test]
    fn empty_sessions_are_excluded_from_listing() {
        let m = temp_memory("empty");
        let id = m.start_session("/tmp/ws", "m").unwrap();
        assert!(m.list_sessions("/tmp/ws", 10).unwrap().is_empty());
        assert_eq!(m.latest_session("/tmp/ws").unwrap(), None);
        m.append_messages(id, &[(0, "user".into(), "x".into())]).unwrap();
        assert_eq!(m.list_sessions("/tmp/ws", 10).unwrap().len(), 1);
    }

    #[test]
    fn delete_removes_session_and_messages() {
        let m = temp_memory("delete");
        let id = m.start_session("/tmp/ws", "m").unwrap();
        m.append_messages(id, &[(0, "user".into(), "x".into())]).unwrap();
        m.delete_session(id).unwrap();
        assert!(m.load_session(id).unwrap().is_empty());
        assert!(m.list_sessions("/tmp/ws", 10).unwrap().is_empty());
    }
}
