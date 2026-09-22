//! Terminal display-width helpers matching Ratatui's terminal-cell semantics
//! while retaining `usize` precision for long lines.
//! Pure standard-library display width and basic grapheme segmentation.

/// Returns the display width Ratatui uses for terminal text without its `u16` limit.
pub(crate) fn display_width(text: &str) -> usize {
    text.chars().map(char_width).sum()
}

/// Returns a scalar's terminal width, treating halfwidth sound marks as visible cells.
pub(crate) fn char_width(ch: char) -> usize {
    let u = ch as u32;

    if matches!(ch, '\u{FF9E}' | '\u{FF9F}') {
        return 1;
    }

    if u < 32 || (0x7F..=0x9F).contains(&u) || matches!(ch, '\u{200B}'..='\u{200F}' | '\u{FEFF}') {
        return 0;
    }

    if matches!(u, 0x0300..=0x036F | 0x1AB0..=0x1AFF | 0x1DC0..=0x1DFF | 0x20D0..=0x20FF | 0xFE20..=0xFE2F) {
        return 0;
    }

    if u <= 0x7E {
        return 1;
    }

    if matches!(
        u,
        0x1100..=0x115F
        | 0x2E80..=0xA4CF
        | 0xAC00..=0xD7A3
        | 0xF900..=0xFAFF
        | 0xFE10..=0xFE19
        | 0xFE30..=0xFE6F
        | 0xFF00..=0xFF60
        | 0xFFE0..=0xFFE6
        | 0x1F300..=0x1F64F
        | 0x1F680..=0x1F6FF
        | 0x1F900..=0x1F9FF
        | 0x20000..=0x2FFFD
        | 0x30000..=0x3FFFD
    ) {
        return 2;
    }

    1
}

/// Returns usable content width after reserving fixed columns.
pub(crate) fn usable_content_width(total_width: usize, reserved_cols: usize) -> Option<usize> {
    total_width
        .checked_sub(reserved_cols)
        .filter(|remaining| *remaining > 0)
}

/// Helper to iterate grapheme-like slices from text using pure std.
pub(crate) fn grapheme_indices(text: &str) -> impl Iterator<Item = (usize, &str)> {
    GraphemeIndices { text, byte_idx: 0 }
}

pub(crate) fn graphemes(text: &str) -> impl Iterator<Item = &str> {
    grapheme_indices(text).map(|(_, s)| s)
}

struct GraphemeIndices<'a> {
    text: &'a str,
    byte_idx: usize,
}

impl<'a> Iterator for GraphemeIndices<'a> {
    type Item = (usize, &'a str);

    fn next(&mut self) -> Option<Self::Item> {
        if self.byte_idx >= self.text.len() {
            return None;
        }

        let start = self.byte_idx;
        let mut char_indices = self.text[start..].char_indices();
        let (_, first_char) = char_indices.next()?;
        let mut end = start + first_char.len_utf8();

        for (offset, next_char) in char_indices {
            let u = next_char as u32;
            let is_combining = matches!(
                u,
                0x0300..=0x036F | 0x1AB0..=0x1AFF | 0x1DC0..=0x1DFF | 0x20D0..=0x20FF | 0xFE20..=0xFE2F
                | 0xFE00..=0xFE0F
                | 0x1F3FB..=0x1F3FF
                | 0x200D
                | 0xFF9E..=0xFF9F
            );
            if is_combining {
                end = start + offset + next_char.len_utf8();
            } else {
                break;
            }
        }

        self.byte_idx = end;
        Some((start, &self.text[start..end]))
    }
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
