//! Typed transcript cells used by the chat renderer.
//!
//! The legacy message vector remains the persistence boundary for now; this
//! adapter gives rendering the same cell-oriented contract as codex-rs and
//! makes the later event-log migration mechanical.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CellKind { User, Assistant, Thinking, Plan, Tool, System }

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct HistoryCell<'a> {
    pub kind: CellKind,
    pub role: &'a str,
    pub content: &'a str,
}

impl<'a> HistoryCell<'a> {
    pub fn from_message(role: &'a str, content: &'a str) -> Self {
        let kind = match role.to_ascii_lowercase().as_str() {
            "user" => CellKind::User,
            "assistant" => CellKind::Assistant,
            "thinking" => CellKind::Thinking,
            "plan" => CellKind::Plan,
            "tool" => CellKind::Tool,
            _ => CellKind::System,
        };
        Self { kind, role, content }
    }
}

pub fn from_messages<'a>(messages: &'a [(String, String)]) -> impl Iterator<Item = HistoryCell<'a>> {
    messages.iter().map(|(role, content)| HistoryCell::from_message(role, content))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_roles_to_rendering_cells() {
        assert_eq!(HistoryCell::from_message("Assistant", "ok").kind, CellKind::Assistant);
        assert_eq!(HistoryCell::from_message("Tool", "read").kind, CellKind::Tool);
        assert_eq!(HistoryCell::from_message("unknown", "x").kind, CellKind::System);
    }
}
