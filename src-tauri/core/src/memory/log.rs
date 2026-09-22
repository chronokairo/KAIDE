use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};

/// Summary metadata for a saved conversation, shown in the resume picker.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub id: i64,
    pub timestamp: String,
    pub updated_at: String,
    pub summary: String,
    pub message_count: usize,
    pub model: String,
}

/// A recalled memory vector with its cosine similarity score.
#[derive(Debug, Clone)]
pub struct VectorHit {
    pub text: String,
    pub source: String,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SessionRecord {
    id: i64,
    timestamp: String,
    summary: String,
    context: String,
    workspace: String,
    model: String,
    updated_at: String,
    status: String,
    message_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct MessageRecord {
    session_id: i64,
    seq: i64,
    role: String,
    content: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct VectorRecord {
    id: i64,
    session_id: i64,
    text: String,
    source: String,
    created_at: String,
    embedding: Vec<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DecisionRecord {
    id: i64,
    timestamp: String,
    decision: String,
    reason: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
struct MemoryStore {
    #[serde(default)]
    next_session_id: i64,
    #[serde(default)]
    next_vector_id: i64,
    #[serde(default)]
    next_decision_id: i64,
    #[serde(default)]
    sessions: Vec<SessionRecord>,
    #[serde(default)]
    messages: Vec<MessageRecord>,
    #[serde(default)]
    vectors: Vec<VectorRecord>,
    #[serde(default)]
    decisions: Vec<DecisionRecord>,
}

pub struct LongTermMemory {
    path: PathBuf,
    store: Arc<RwLock<MemoryStore>>,
}

impl LongTermMemory {
    pub fn new(db_path: PathBuf) -> crate::error::Result<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let store = if db_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&db_path) {
                serde_json::from_str::<MemoryStore>(&content).unwrap_or_default()
            } else {
                MemoryStore::default()
            }
        } else {
            MemoryStore::default()
        };

        Ok(LongTermMemory {
            path: db_path,
            store: Arc::new(RwLock::new(store)),
        })
    }

    fn persist(&self, store: &MemoryStore) -> crate::error::Result<()> {
        if let Some(parent) = self.path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let data = serde_json::to_vec_pretty(store).map_err(|e| crate::error::message(e.to_string()))?;
        let temp_path = self.path.with_extension("tmp");
        std::fs::write(&temp_path, &data)?;
        let _ = std::fs::remove_file(&self.path);
        std::fs::rename(&temp_path, &self.path)?;
        Ok(())
    }

    pub fn path(&self) -> &Path {
        self.path.as_path()
    }

    /// Create a new session record and return its id.
    pub fn start_session(&self, workspace: &str, model: &str) -> crate::error::Result<i64> {
        let now = crate::types::time::now_local_rfc3339();
        let mut store = self.store.write().map_err(|_| crate::error::message("lock poisoned"))?;
        store.next_session_id += 1;
        let id = store.next_session_id;

        store.sessions.push(SessionRecord {
            id,
            timestamp: now.clone(),
            summary: String::new(),
            context: String::new(),
            workspace: workspace.to_string(),
            model: model.to_string(),
            updated_at: now,
            status: "active".to_string(),
            message_count: 0,
        });

        self.persist(&store)?;
        Ok(id)
    }

    /// Append transcript records `(seq, role, content)` to a session.
    pub fn append_messages(
        &self,
        session_id: i64,
        messages: &[(i64, String, String)],
    ) -> crate::error::Result<()> {
        if messages.is_empty() {
            return Ok(());
        }
        let now = crate::types::time::now_local_rfc3339();
        let mut store = self.store.write().map_err(|_| crate::error::message("lock poisoned"))?;

        for (seq, role, content) in messages {
            let already_exists = store
                .messages
                .iter()
                .any(|m| m.session_id == session_id && m.seq == *seq);
            if !already_exists {
                store.messages.push(MessageRecord {
                    session_id,
                    seq: *seq,
                    role: role.clone(),
                    content: content.clone(),
                    created_at: now.clone(),
                });
            }
        }

        let count = store.messages.iter().filter(|m| m.session_id == session_id).count();
        if let Some(session) = store.sessions.iter_mut().find(|s| s.id == session_id) {
            session.updated_at = now;
            session.message_count = count;
        }

        self.persist(&store)?;
        Ok(())
    }

    /// Refresh session metadata after a write: title, context, model, etc.
    pub fn update_session(
        &self,
        session_id: i64,
        title: &str,
        context: &str,
        model: &str,
    ) -> crate::error::Result<()> {
        let now = crate::types::time::now_local_rfc3339();
        let mut store = self.store.write().map_err(|_| crate::error::message("lock poisoned"))?;

        let count = store.messages.iter().filter(|m| m.session_id == session_id).count();
        if let Some(session) = store.sessions.iter_mut().find(|s| s.id == session_id) {
            if !title.trim().is_empty() {
                session.summary = title.to_string();
            }
            session.context = context.to_string();
            session.model = model.to_string();
            session.updated_at = now;
            session.message_count = count;
        }

        self.persist(&store)?;
        Ok(())
    }

    /// Persist an embedding for memory recall.
    pub fn store_vector(
        &self,
        session_id: i64,
        source: &str,
        text: &str,
        embedding: &[f32],
    ) -> crate::error::Result<()> {
        let now = crate::types::time::now_local_rfc3339();
        let mut store = self.store.write().map_err(|_| crate::error::message("lock poisoned"))?;
        store.next_vector_id += 1;
        let id = store.next_vector_id;

        store.vectors.push(VectorRecord {
            id,
            session_id,
            text: text.to_string(),
            source: source.to_string(),
            created_at: now,
            embedding: embedding.to_vec(),
        });

        self.persist(&store)?;
        Ok(())
    }

    /// Top-`k` vectors most similar to query embedding.
    pub fn search_vectors(&self, query: &[f32], k: usize) -> crate::error::Result<Vec<VectorHit>> {
        let store = self.store.read().map_err(|_| crate::error::message("lock poisoned"))?;
        let mut hits: Vec<(f64, String, String)> = Vec::new();

        for record in &store.vectors {
            if record.embedding.len() != query.len() {
                continue;
            }
            let mut dot = 0.0f64;
            for (index, val) in record.embedding.iter().enumerate() {
                dot += *val as f64 * query[index] as f64;
            }
            if dot.is_finite() {
                hits.push((dot, record.text.clone(), record.source.clone()));
            }
        }

        hits.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));
        Ok(hits
            .into_iter()
            .take(k.clamp(1, 50))
            .map(|(score, text, source)| VectorHit {
                text,
                source,
                score,
            })
            .collect())
    }

    /// Recently active saved sessions for a workspace, newest first.
    pub fn list_sessions(&self, workspace: &str, limit: usize) -> crate::error::Result<Vec<SessionInfo>> {
        let store = self.store.read().map_err(|_| crate::error::message("lock poisoned"))?;
        let mut matched: Vec<&SessionRecord> = store
            .sessions
            .iter()
            .filter(|s| s.workspace == workspace && s.status == "active" && s.message_count > 0)
            .collect();

        matched.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

        Ok(matched
            .into_iter()
            .take(limit)
            .map(|s| SessionInfo {
                id: s.id,
                timestamp: s.timestamp.clone(),
                updated_at: s.updated_at.clone(),
                summary: s.summary.clone(),
                message_count: s.message_count,
                model: s.model.clone(),
            })
            .collect())
    }

    /// Id of the most recently active session for a workspace, if any.
    pub fn latest_session(&self, workspace: &str) -> crate::error::Result<Option<i64>> {
        let store = self.store.read().map_err(|_| crate::error::message("lock poisoned"))?;
        let mut matched: Vec<&SessionRecord> = store
            .sessions
            .iter()
            .filter(|s| s.workspace == workspace && s.status == "active" && s.message_count > 0)
            .collect();

        matched.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(matched.first().map(|s| s.id))
    }

    /// Full transcript of a session as `(seq, role, content)`, in order.
    pub fn load_session(&self, session_id: i64) -> crate::error::Result<Vec<(i64, String, String)>> {
        let store = self.store.read().map_err(|_| crate::error::message("lock poisoned"))?;
        let mut msgs: Vec<&MessageRecord> = store
            .messages
            .iter()
            .filter(|m| m.session_id == session_id)
            .collect();

        msgs.sort_by_key(|m| m.seq);

        Ok(msgs
            .into_iter()
            .map(|m| (m.seq, m.role.clone(), m.content.clone()))
            .collect())
    }

    /// Stored compaction context for a session, if any.
    pub fn session_context(&self, session_id: i64) -> crate::error::Result<Option<String>> {
        let store = self.store.read().map_err(|_| crate::error::message("lock poisoned"))?;
        let context = store
            .sessions
            .iter()
            .find(|s| s.id == session_id)
            .map(|s| s.context.clone())
            .filter(|s| !s.trim().is_empty());
        Ok(context)
    }

    /// Remove a saved conversation entirely.
    pub fn delete_session(&self, session_id: i64) -> crate::error::Result<()> {
        let mut store = self.store.write().map_err(|_| crate::error::message("lock poisoned"))?;
        store.messages.retain(|m| m.session_id != session_id);
        store.vectors.retain(|v| v.session_id != session_id);
        store.sessions.retain(|s| s.id != session_id);
        self.persist(&store)?;
        Ok(())
    }

    /// Legacy compatibility shim.
    pub fn save_session(&self, task: &str, response: &str) -> crate::error::Result<()> {
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
    pub fn get_recent_sessions(&self, limit: usize) -> crate::error::Result<Vec<(String, String)>> {
        let store = self.store.read().map_err(|_| crate::error::message("lock poisoned"))?;
        let mut matched: Vec<&SessionRecord> = store
            .sessions
            .iter()
            .filter(|s| s.status == "active" && s.message_count > 0)
            .collect();

        matched.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

        Ok(matched
            .into_iter()
            .take(limit)
            .map(|s| (s.updated_at.clone(), s.summary.clone()))
            .collect())
    }

    pub fn save_decision(&self, decision: &str, reason: &str) -> crate::error::Result<()> {
        let now = crate::types::time::now_local_rfc3339();
        let mut store = self.store.write().map_err(|_| crate::error::message("lock poisoned"))?;
        store.next_decision_id += 1;
        let id = store.next_decision_id;

        store.decisions.push(DecisionRecord {
            id,
            timestamp: now,
            decision: decision.to_string(),
            reason: reason.to_string(),
        });

        self.persist(&store)?;
        Ok(())
    }

    /// Full-text search across active sessions and their messages.
    pub fn search_memories(&self, query: &str, limit: usize) -> crate::error::Result<Vec<serde_json::Value>> {
        let query_lower = query.to_lowercase();
        let store = self.store.read().map_err(|_| crate::error::message("lock poisoned"))?;

        let mut by_session = std::collections::HashMap::<i64, serde_json::Value>::new();

        for session in store.sessions.iter().filter(|s| s.status == "active") {
            let session_msgs: Vec<&MessageRecord> = store
                .messages
                .iter()
                .filter(|m| m.session_id == session.id)
                .collect();

            let mut matched_content: Option<String> = None;
            if session.summary.to_lowercase().contains(&query_lower) {
                matched_content = Some(session.summary.clone());
            } else {
                for msg in &session_msgs {
                    if msg.content.to_lowercase().contains(&query_lower) {
                        matched_content = Some(msg.content.clone());
                        break;
                    }
                }
            }

            if let Some(source) = matched_content {
                let score = source.to_lowercase().matches(&query_lower).count().max(1) as f64;
                let snippet = source.chars().take(240).collect::<String>();
                let candidate = serde_json::json!({
                    "sessionId": session.id,
                    "session_id": session.id,
                    "summary": session.summary,
                    "snippet": snippet,
                    "score": score,
                    "timestamp": session.timestamp,
                    "model": session.model,
                    "message_count": session.message_count
                });

                let replace = by_session
                    .get(&session.id)
                    .and_then(|val| val.get("score"))
                    .and_then(serde_json::Value::as_f64)
                    .unwrap_or(0.0)
                    < score;
                if replace {
                    by_session.insert(session.id, candidate);
                }
            }
        }

        let mut results = by_session.into_values().collect::<Vec<_>>();
        results.sort_by(|a, b| {
            b.get("score")
                .and_then(serde_json::Value::as_f64)
                .partial_cmp(&a.get("score").and_then(serde_json::Value::as_f64))
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        results.truncate(limit);
        Ok(results)
    }
}

impl Clone for LongTermMemory {
    fn clone(&self) -> Self {
        Self {
            path: self.path.clone(),
            store: Arc::clone(&self.store),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_memory(tag: &str) -> LongTermMemory {
        let dir =
            std::env::temp_dir().join(format!("chronokairo-memory-log-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        LongTermMemory::new(dir.join("memory.json")).unwrap()
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
        m.append_messages(id, &[(1i64, "assistant".to_string(), "hi".to_string())])
            .unwrap();
        assert_eq!(m.load_session(id).unwrap().len(), 2);
    }

    #[test]
    fn sessions_are_scoped_by_workspace() {
        let m = temp_memory("scope");
        let a = m.start_session("/ws/a", "m").unwrap();
        m.append_messages(a, &[(0, "user".into(), "x".into())])
            .unwrap();
        let b = m.start_session("/ws/b", "m").unwrap();
        m.append_messages(b, &[(0, "user".into(), "y".into())])
            .unwrap();
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
        m.append_messages(id, &[(0, "user".into(), "x".into())])
            .unwrap();
        assert_eq!(m.list_sessions("/tmp/ws", 10).unwrap().len(), 1);
    }

    #[test]
    fn delete_removes_session_and_messages() {
        let m = temp_memory("delete");
        let id = m.start_session("/tmp/ws", "m").unwrap();
        m.append_messages(id, &[(0, "user".into(), "x".into())])
            .unwrap();
        m.delete_session(id).unwrap();
        assert!(m.load_session(id).unwrap().is_empty());
        assert!(m.list_sessions("/tmp/ws", 10).unwrap().is_empty());
    }

    #[test]
    fn vector_store_roundtrips_and_ranks_by_similarity() {
        let m = temp_memory("vectors");
        let id = m.start_session("/tmp/ws", "m").unwrap();
        let norm = |v: &[f32]| {
            let len = v.iter().map(|x| x * x).sum::<f32>().sqrt();
            v.iter().map(|x| x / len).collect::<Vec<_>>()
        };
        let target = norm(&[1.0, 0.0, 0.0]);
        let close = norm(&[0.95, 0.31, 0.0]);
        let far = norm(&[0.0, 0.0, 1.0]);
        m.store_vector(id, "ws-a", "target text", &target).unwrap();
        m.store_vector(id, "ws-b", "close text", &close).unwrap();
        m.store_vector(id, "ws-c", "far text", &far).unwrap();

        let hits = m.search_vectors(&target, 2).unwrap();
        assert_eq!(hits.len(), 2);
        assert_eq!(hits[0].text, "target text");
        assert!((hits[0].score - 1.0).abs() < 1e-6);
        assert_eq!(hits[1].text, "close text");
        assert!(hits[1].score > 0.9);
        assert!(hits.iter().all(|h| h.score <= 1.0));
    }
}
