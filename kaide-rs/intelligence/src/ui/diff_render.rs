//! Renders unified diff text into styled ratatui lines for the diff pager.
//!
//! Adapted from OpenAI Codex's `tui/src/diff_render.rs`; the Codex original
//! layers syntax highlighting, terminal-palette detection and per-hunk parsers
//! on top, none of which are needed for the minimal diff viewer here. Lines are
//! classified by their leading character and styled accordingly.

use ratatui::{
    style::{Color, Modifier, Style},
    text::{Line, Span},
};

/// Style a single unified-diff line.
fn style_diff_line(line: &str) -> Span<'static> {
    if line.starts_with("@@") {
        Span::styled(
            line.to_string(),
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
    } else if line.starts_with("--- a/") || line.starts_with("+++ b/") {
        Span::styled(line.to_string(), Style::default().fg(Color::Blue))
    } else if line.starts_with('+') {
        Span::styled(line.to_string(), Style::default().fg(Color::Green))
    } else if line.starts_with('-') {
        Span::styled(line.to_string(), Style::default().fg(Color::Red))
    } else if line.starts_with(' ') {
        Span::styled(line.to_string(), Style::default())
    } else {
        // `diff --git`, `\ No newline at end of file`, etc.
        Span::styled(line.to_string(), Style::default().add_modifier(Modifier::DIM))
    }
}

/// Convert unified diff text into styled lines for a pager.
pub fn diff_lines(diff_text: &str) -> Vec<Line<'static>> {
    diff_text
        .lines()
        .map(|line| Line::from(style_diff_line(line)))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classifies_diff_line_prefixes() {
        assert_eq!(style_diff_line("@@ -1,3 +1,3 @@").style.fg, Some(Color::Cyan));
        assert_eq!(style_diff_line("+added").style.fg, Some(Color::Green));
        assert_eq!(style_diff_line("-removed").style.fg, Some(Color::Red));
        assert_eq!(style_diff_line(" context").style.fg, None);
        assert_eq!(
            style_diff_line("--- a/src/a.rs").style.fg,
            Some(Color::Blue)
        );
        assert_eq!(
            style_diff_line("\\ No newline at end of file")
                .style
                .add_modifier,
            Modifier::DIM
        );
    }

    #[test]
    fn diff_lines_preserves_text() {
        let diff = "--- a/f\n+++ b/f\n@@ -1,2 +1,2 @@\n-a\n+b\n";
        let lines = diff_lines(diff);
        assert_eq!(lines.len(), 5);
        assert_eq!(lines[0].to_string(), "--- a/f");
        assert_eq!(lines[3].to_string(), "-a");
        assert_eq!(lines[4].to_string(), "+b");
    }

    #[test]
    fn empty_diff_yields_no_lines() {
        assert!(diff_lines("").is_empty());
    }
}
