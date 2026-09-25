use std::collections::VecDeque;

#[derive(Debug, Clone)]
pub struct ShortTermMemory {
    /// Conversation messages as `(seq, role, content)`. `seq` is a per-session
    /// monotonic id used to append persisted transcripts without duplication:
    /// records beyond the last persisted watermark are written once.
    messages: VecDeque<(u64, String, String)>,
    actions: Vec<String>,
    files: Vec<String>,
    summary: Option<String>,
    max_messages: usize,
    next_seq: u64,
}

/// Calibrated BPE token estimator for code, prose, and JSON structures.
pub fn estimate_tokens(text: &str) -> usize {
    if text.is_empty() {
        return 0;
    }
    let mut tokens = 0usize;
    let mut current_word_len = 0usize;

    for c in text.chars() {
        let extra = if c.is_ascii_whitespace() || c.is_ascii_punctuation() {
            1
        } else if !c.is_ascii() {
            2
        } else {
            current_word_len += 1;
            continue;
        };
        if current_word_len > 0 {
            tokens += current_word_len.div_ceil(4);
            current_word_len = 0;
        }
        tokens += extra;
    }
    if current_word_len > 0 {
        tokens += current_word_len.div_ceil(4);
    }
    tokens.max(1)
}

impl ShortTermMemory {
    pub fn new(max_messages: usize) -> Self {
        ShortTermMemory { messages: VecDeque::new(), actions: Vec::new(), files: Vec::new(), summary: None, max_messages, next_seq: 0 }
    }

    pub fn add_message(&mut self, role: &str, content: &str) {
        let seq = self.next_seq;
        self.next_seq += 1;
        self.messages.push_back((seq, role.to_string(), content.to_string()));
        if self.messages.len() > self.max_messages { self.messages.pop_front(); }
    }

    /// Restore a persisted transcript (ordered `(seq, role, content)` records).
    /// The next message added continues from the highest restored seq, so
    /// resumed sessions keep appending to the same transcript without gaps.
    pub fn load_records(&mut self, records: Vec<(u64, String, String)>) -> usize {
        self.messages.clear();
        self.next_seq = 0;
        for (seq, role, content) in records {
            if seq >= self.next_seq {
                self.next_seq = seq + 1;
            }
            self.messages.push_back((seq, role, content));
        }
        self.messages.len()
    }

    /// Records that a persistent store has not seen yet: everything when
    /// `last_seq` is `None` (nothing persisted), otherwise records with a seq
    /// strictly above the watermark.
    pub fn records_after(&self, last_seq: Option<u64>) -> Vec<(u64, String, String)> {
        self.messages
            .iter()
            .filter(|(seq, _, _)| match last_seq {
                None => true,
                Some(watermark) => *seq > watermark,
            })
            .map(|(seq, role, content)| (*seq, role.clone(), content.clone()))
            .collect()
    }

    pub fn next_seq(&self) -> u64 {
        self.next_seq
    }

    /// The compaction summary, if the transcript was compacted.
    pub fn summary(&self) -> Option<&str> {
        self.summary.as_deref()
    }

    pub fn add_action(&mut self, action: &str) { self.actions.push(action.to_string()); }

    pub fn add_file(&mut self, filepath: &str) {
        if !self.files.contains(&filepath.to_string()) {
            self.files.push(filepath.to_string());
        }
    }

    /// Full conversation transcript (messages + summary prefix).
    pub fn transcript(&self) -> String {
        let mut lines = Vec::new();
        if let Some(summary) = &self.summary {
            lines.push(format!("[Session summary so far] {}", summary));
        }
        for (_, role, content) in &self.messages {
            lines.push(format!("{role}: {content}"));
        }
        lines.join("\n")
    }

    /// Estimated token count of the full transcript.
    pub fn estimated_tokens(&self) -> usize {
        estimate_tokens(&self.transcript())
    }

    /// Collapse old messages into a summary, keeping the most recent message.
    pub fn compact(&mut self, summary: String) {
        let kept = self.messages.back().cloned();
        self.messages.clear();
        if let Some(msg) = kept {
            self.messages.push_back(msg);
        }
        self.summary = Some(summary);
    }

    pub fn get_context(&self) -> String {
        let mut lines = Vec::new();
        if let Some(summary) = &self.summary {
            lines.push(format!("Session summary: {}", summary));
        }
        if let Some((_, role, content)) = self.messages.back() {
            lines.push(format!("Last message ({role}): {}", &content[..content.len().min(200)]));
        }
        if !self.actions.is_empty() {
            let recent: Vec<&str> = self.actions.iter().rev().take(5).map(|s| s.as_str()).collect();
            lines.push(format!("Recent actions: {}", recent.join(", ")));
        }
        if !self.files.is_empty() {
            let recent: Vec<&str> = self.files.iter().rev().take(10).map(|s| s.as_str()).collect();
            lines.push(format!("Files: {}", recent.join(", ")));
        }
        lines.join("\n")
    }

    /// Messages in display order, for the interactive chat UI.
    pub fn history(&self) -> Vec<(String, String)> {
        self.messages
            .iter()
            .map(|(_, role, content)| (role.clone(), content.clone()))
            .collect()
    }

    /// Full conversation feed for the model: every message, with the compaction
    /// summary (if any) materialized as a leading `system` record so resumed
    /// and compacted transcripts keep their summarized context.
    pub fn conversation(&self) -> Vec<(String, String)> {
        let mut out: Vec<(String, String)> = self
            .messages
            .iter()
            .map(|(_, role, content)| (role.clone(), content.clone()))
            .collect();
        if let Some(summary) = &self.summary {
            let expected = format!("[Session summary so far] {summary}");
            if !out.iter().any(|(role, content)| role == "system" && content == &expected) {
                out.insert(0, ("system".into(), expected));
            }
        }
        out
    }

    pub fn last_message(&self) -> Option<(String, String)> {
        self.messages
            .back()
            .map(|(_, role, content)| (role.clone(), content.clone()))
    }

    pub fn clear(&mut self) {
        self.messages.clear();
        self.actions.clear();
        self.files.clear();
        self.summary = None;
        self.next_seq = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_estimate_is_positive() {
        assert!(estimate_tokens("fn main() { println!(\"hello\"); }") > 0);
    }

    #[test]
    fn token_estimate_counts_non_ascii_extra() {
        let ascii = estimate_tokens("hello world");
        let non_ascii = estimate_tokens("olá mundo");
        assert!(non_ascii >= ascii);
    }

    #[test]
    fn compact_keeps_last_message_and_summary() {
        let mut m = ShortTermMemory::new(20);
        m.add_message("user", "task one");
        m.add_message("assistant", "did one");
        m.add_message("user", "task two");
        m.compact("summarized".into());
        let ctx = m.get_context();
        assert!(ctx.contains("Session summary: summarized"));
        assert!(ctx.contains("task two"));
    }

    #[test]
    fn prunes_oldest_messages_over_capacity() {
        let mut m = ShortTermMemory::new(2);
        m.add_message("user", "1");
        m.add_message("user", "2");
        m.add_message("user", "3");
        let hist = m.history();
        assert_eq!(hist.len(), 2);
        assert_eq!(hist[0].1, "2");
        assert_eq!(hist[1].1, "3");
    }

    #[test]
    fn add_file_deduplicates() {
        let mut m = ShortTermMemory::new(10);
        m.add_file("src/main.rs");
        m.add_file("src/main.rs");
        assert_eq!(m.files.len(), 1);
    }

    #[test]
    fn transcript_contains_messages_in_order() {
        let mut m = ShortTermMemory::new(10);
        m.add_message("user", "hi");
        m.add_message("assistant", "yo");
        let t = m.transcript();
        assert!(t.contains("user: hi"));
        assert!(t.contains("assistant: yo"));
        assert!(t.find("user: hi").unwrap() < t.find("assistant: yo").unwrap());
    }

    #[test]
    fn last_message_returns_most_recent() {
        let mut m = ShortTermMemory::new(10);
        m.add_message("user", "first");
        m.add_message("user", "last");
        assert_eq!(m.last_message().unwrap().1, "last");
        assert!(ShortTermMemory::new(5).last_message().is_none());
    }

    #[test]
    fn get_context_truncates_long_last_message() {
        let mut m = ShortTermMemory::new(10);
        m.add_message("user", &"x".repeat(500));
        let ctx = m.get_context();
        assert!(ctx.len() < 400);
    }

    #[test]
    fn clear_resets_all_state() {
        let mut m = ShortTermMemory::new(10);
        m.add_message("user", "hi");
        m.add_action("act");
        m.add_file("f.txt");
        m.compact("sum".into());
        m.clear();
        assert!(m.history().is_empty());
        assert!(m.get_context().is_empty());
        assert!(m.last_message().is_none());
    }

    #[test]
    fn records_after_only_yields_unsaved_messages() {
        let mut m = ShortTermMemory::new(20);
        m.add_message("user", "a");
        m.add_message("assistant", "b");
        assert_eq!(m.records_after(None).len(), 2);
        assert_eq!(m.records_after(Some(0)).len(), 1);
        assert_eq!(m.records_after(Some(1)).len(), 0);
    }

    #[test]
    fn load_records_preserves_order_and_continues_seq() {
        let mut m = ShortTermMemory::new(20);
        let records = vec![
            (0u64, "user".to_string(), "hello".to_string()),
            (1u64, "assistant".to_string(), "hi".to_string()),
        ];
        m.load_records(records);
        assert_eq!(m.history().len(), 2);
        assert_eq!(m.history()[1].1, "hi");
        m.add_message("user", "more");
        let new = m.records_after(Some(1));
        assert_eq!(new.len(), 1);
        assert_eq!(new[0].0, 2);
        assert_eq!(new[0].2, "more");
        // A session with nothing persisted reports every record.
        let mut empty = ShortTermMemory::new(20);
        empty.add_message("system", "[Session summary so far] x");
        assert_eq!(empty.records_after(None).len(), 1);
    }

    #[test]
    fn conversation_materializes_summary_as_system_once() {
        let mut m = ShortTermMemory::new(20);
        m.add_message("user", "task");
        m.add_message("assistant", "done");
        m.compact("the summary".into());
        let conv = m.conversation();
        assert_eq!(conv[0].0, "system");
        assert!(conv[0].1.starts_with("[Session summary so far]"));
        // Materializing the summary as a record keeps it deduplicated.
        m.add_message("system", &conv[0].1);
        let conv2 = m.conversation();
        let system_count = conv2.iter().filter(|(r, _)| r == "system").count();
        assert_eq!(system_count, 1);
    }
}
