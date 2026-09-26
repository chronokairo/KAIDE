//! Chat composer surface, separated from the global TUI composition.

use crate::ui::engine::terminal::Frame;
use crate::ui::engine::ratatui::{
    layout::Rect,
    style::Style,
    text::{Line, Span},
    widgets::{Paragraph, Wrap},
};
use crate::ui::engine::Color;

#[derive(Clone, Debug, Default)]
pub struct ComposerState {
    pub input: String,
    pub cursor_position: usize,
    pub input_history: Vec<String>,
    pub history_index: Option<usize>,
}

impl ComposerState {
    pub fn clear(&mut self) {
        self.input.clear();
        self.cursor_position = 0;
        self.history_index = None;
    }
    pub fn push_history(&mut self, value: &str) {
        if !value.is_empty() && self.input_history.last().map(String::as_str) != Some(value) {
            self.input_history.push(value.to_string());
        }
        self.history_index = None;
    }

    /// Insert a Unicode scalar at the logical cursor.
    pub fn insert(&mut self, ch: char) {
        let byte = self
            .input
            .char_indices()
            .nth(self.cursor_position)
            .map(|(i, _)| i)
            .unwrap_or(self.input.len());
        self.input.insert(byte, ch);
        self.cursor_position += 1;
        self.history_index = None;
    }

    /// Insert a paste as one edit operation while keeping the character-based
    /// cursor contract. The caller may cap the input before calling this.
    pub fn insert_text(&mut self, text: &str) {
        for ch in text.chars() {
            self.insert(ch);
        }
    }

    pub fn backspace(&mut self) -> bool {
        if self.cursor_position == 0 {
            return false;
        }
        let byte = self
            .input
            .char_indices()
            .nth(self.cursor_position - 1)
            .map(|(i, _)| i)
            .unwrap_or(0);
        self.input.remove(byte);
        self.cursor_position -= 1;
        self.history_index = None;
        true
    }

    pub fn delete(&mut self) -> bool {
        if self.cursor_position >= self.input.chars().count() {
            return false;
        }
        let byte = self
            .input
            .char_indices()
            .nth(self.cursor_position)
            .map(|(i, _)| i)
            .unwrap_or(self.input.len());
        self.input.remove(byte);
        self.history_index = None;
        true
    }

    pub fn move_left(&mut self) {
        self.cursor_position = self.cursor_position.saturating_sub(1);
    }

    pub fn move_right(&mut self) {
        self.cursor_position = (self.cursor_position + 1).min(self.input.chars().count());
    }

    pub fn move_home(&mut self) {
        self.cursor_position = 0;
    }

    pub fn move_end(&mut self) {
        self.cursor_position = self.input.chars().count();
    }

    /// Find the newest history entry containing `query`, preserving the
    /// character-based cursor contract used by the terminal editor.
    pub fn search_history(&mut self, query: &str) -> bool {
        let query = query.trim();
        let Some((index, value)) = self
            .input_history
            .iter()
            .enumerate()
            .rev()
            .find(|(_, value)| query.is_empty() || value.contains(query))
        else {
            return false;
        };
        self.input = value.clone();
        self.cursor_position = self.input.chars().count();
        self.history_index = Some(index);
        true
    }
}

#[cfg(test)]
mod tests {
    use super::{render, ComposerState};

    #[test]
    fn unicode_editing_keeps_character_cursor() {
        let mut composer = ComposerState::default();
        composer.insert('é');
        composer.insert('β');
        assert_eq!(composer.input, "éβ");
        assert_eq!(composer.cursor_position, 2);
        assert!(composer.backspace());
        assert_eq!(composer.input, "é");
        assert_eq!(composer.cursor_position, 1);
    }

    #[test]
    fn history_search_selects_latest_matching_prompt() {
        let mut composer = ComposerState::default();
        composer.push_history("cargo check");
        composer.push_history("cargo test");
        composer.push_history("cargo check --all-targets");
        assert!(composer.search_history("check"));
        assert_eq!(composer.input, "cargo check --all-targets");
        assert_eq!(composer.cursor_position, composer.input.chars().count());
    }

    #[test]
    fn paste_insertion_preserves_unicode_cursor() {
        let mut composer = ComposerState::default();
        composer.insert_text("alpha\nÎ²eta");
        assert_eq!(composer.input, "alpha\nÎ²eta");
        assert_eq!(composer.cursor_position, composer.input.chars().count());
    }
    #[test]
    fn render_matches_clean_composer_layout_and_cursor_position() {
        use crate::ui::engine::ratatui::backend::TestBackend;
        use crate::ui::engine::ratatui::layout::Rect;
        use crate::ui::engine::ratatui::Terminal;

        let mut terminal = Terminal::new(TestBackend::new(40, 3)).unwrap();
        terminal
            .draw(|frame| render(frame, Rect::new(0, 0, 40, 3), "abc", 3, false))
            .unwrap();
        let buffer = terminal.backend().buffer();
        let row: String = (0..40)
            .filter_map(|x| buffer.cell((x, 0)))
            .map(|cell| cell.symbol().to_string())
            .collect();
        assert!(row.contains("abc|"), "unexpected composer row: {row:?}");
        assert!(!row.contains("|abc"), "cursor rendered before input: {row:?}");
        assert!(!row.contains("Composer"), "composer title should be hidden: {row:?}");
    }
}

pub(super) fn render(
    frame: &mut Frame<'_>,
    area: Rect,
    input: &str,
    cursor_position: usize,
    loading: bool,
) {
    // The prompt is stable. The cursor is rendered at the logical insertion
    // point below; using `|` as the loading prompt made it appear at the
    // beginning of every message.
    let prompt = "›";
    let prompt_style = crate::ui::style::prompt_style(loading);
    let cursor_position = cursor_position.min(input.chars().count());
    let before_cursor = input.chars().take(cursor_position).collect::<String>();
    let after_cursor = input.chars().skip(cursor_position).collect::<String>();
    let cursor_style = Style::default().fg(if loading {
        crate::ui::style::ACCENT
    } else {
        crate::ui::style::PROMPT
    });

    let spans = if input.is_empty() && !loading {
        vec![
            Span::styled(format!("{prompt} "), prompt_style),
            Span::styled(
                "Ask a question, describe a change, or type / for commands...",
                crate::ui::style::muted(),
            ),
        ]
    } else {
        vec![
            Span::styled(format!("{prompt} "), prompt_style),
            Span::styled(
                before_cursor.clone(),
                Style::default().fg(if loading { crate::ui::style::MUTED } else { Color::White }),
            ),
            Span::styled("|", cursor_style),
            Span::styled(
                after_cursor,
                Style::default().fg(if loading { crate::ui::style::MUTED } else { Color::White }),
            ),
        ]
    };
    let composer = if input.contains('\n') {
        let mut lines = Vec::new();
        let cursor_row = before_cursor.matches('\n').count();
        let cursor_col = before_cursor.rsplit('\n').next().unwrap_or("").chars().count();
        for (index, line) in input.split('\n').enumerate() {
            let prefix = if index == 0 { format!("{prompt} ") } else { "  ".into() };
            let line_spans = if index == cursor_row {
                let left = line.chars().take(cursor_col).collect::<String>();
                let right = line.chars().skip(cursor_col).collect::<String>();
                vec![
                    Span::styled(prefix, prompt_style),
                    Span::styled(left, Style::default().fg(Color::White)),
                    Span::styled("|", cursor_style),
                    Span::styled(right, Style::default().fg(Color::White)),
                ]
            } else {
                vec![
                    Span::styled(prefix, prompt_style),
                    Span::styled(line.to_string(), Style::default().fg(Color::White)),
                ]
            };
            lines.push(Line::from(line_spans));
        }
        Paragraph::new(lines)
    } else {
        Paragraph::new(Line::from(spans))
    }
        .wrap(Wrap { trim: false });
    // Codex keeps the composer as part of the page flow instead of putting a
    // dialog-like box around it. A small horizontal inset preserves the
    // breathing room without spending rows on borders or a title.
    let composer_area = Rect {
        x: area.x.saturating_add(1),
        y: area.y,
        width: area.width.saturating_sub(2),
        height: area.height,
    };
    frame.render_widget(composer, composer_area);
    if !loading {
        let width = (composer_area.width as usize).saturating_sub(2).max(1);
        let cursor_row = before_cursor.matches('\n').count() as u16;
        let line_chars = before_cursor.rsplit('\n').next().unwrap_or("");
        let cursor_col = crate::ui::width::display_width(line_chars) as u16;
        let prompt_offset: u16 = 2; // "› "
        let total_col = cursor_col + prompt_offset;
        let soft_wrap_rows = total_col / (width as u16);
        let soft_wrap_col = total_col % (width as u16);

        let x = composer_area.x + soft_wrap_col;
        let y = composer_area.y + cursor_row + soft_wrap_rows;
        frame.set_cursor_position((
            x.min(composer_area.x + composer_area.width.saturating_sub(1)),
            y.min(composer_area.y + composer_area.height.saturating_sub(1)),
        ));
    }
}
