//! Terminal display-width helpers matching Ratatui's terminal-cell semantics
//! while retaining `usize` precision for long lines.
//!
//! Adapted from OpenAI Codex's `tui/src/width.rs`.

use unicode_width::UnicodeWidthChar;
use unicode_width::UnicodeWidthStr;

/// Returns the display width Ratatui uses for terminal text without its `u16` limit.
pub(crate) fn display_width(text: &str) -> usize {
    UnicodeWidthStr::width(text)
        + text
            .chars()
            .filter(|ch| matches!(ch, '\u{FF9E}' | '\u{FF9F}'))
            .count()
}

/// Returns a scalar's terminal width, treating halfwidth sound marks as visible cells.
pub(crate) fn char_width(ch: char) -> usize {
    if matches!(ch, '\u{FF9E}' | '\u{FF9F}') {
        1
    } else {
        UnicodeWidthChar::width(ch).unwrap_or(0)
    }
}

/// Returns usable content width after reserving fixed columns.
///
/// Guarantees a strict positive width (`Some(n)` where `n > 0`) or `None` when
/// the reserved columns consume the full width. Treat `None` as "render
/// prefix-only fallback" rather than attempting wrapped rendering at zero width.
pub(crate) fn usable_content_width(total_width: usize, reserved_cols: usize) -> Option<usize> {
    total_width
        .checked_sub(reserved_cols)
        .filter(|remaining| *remaining > 0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn display_width_matches_ratatui_halfwidth_sound_marks_without_overflow() {
        assert_eq!(display_width("ｶﾞﾊﾟ"), 4);
        assert_eq!(display_width("ｶﾞﾞ"), 3);
        assert_eq!(display_width("界ﾞ"), 3);
        assert_eq!(char_width('\u{FF9E}'), 1);
        assert_eq!(char_width('\u{FF9F}'), 1);

        let text = "a".repeat(65_536);
        assert_eq!(display_width(&text), 65_536);
    }

    #[test]
    fn display_width_counts_wide_chars_as_two_columns() {
        assert_eq!(display_width("olá"), 3);
        assert_eq!(display_width("mundo"), 5);
        assert_eq!(display_width("界"), 2);
    }

    #[test]
    fn usable_content_width_returns_none_when_reserved_exhausts_width() {
        assert_eq!(usable_content_width(0, 0), None);
        assert_eq!(usable_content_width(2, 2), None);
        assert_eq!(usable_content_width(3, 4), None);
        assert_eq!(usable_content_width(5, 4), Some(1));
    }
}
