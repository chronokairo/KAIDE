//! Truncate styled ratatui `Line`s to a terminal display width, preserving
//! grapheme boundaries and per-span styling.
//!
//! Adapted from OpenAI Codex's `tui/src/line_truncation.rs`.

use ratatui::text::{Line, Span};
use unicode_segmentation::UnicodeSegmentation;

use crate::ui::width::display_width;

pub(crate) fn line_width(line: &Line<'_>) -> usize {
    line.iter()
        .map(|span| display_width(span.content.as_ref()))
        .sum()
}

pub(crate) fn truncate_line_to_width(line: Line<'static>, max_width: usize) -> Line<'static> {
    if max_width == 0 {
        return Line::from(Vec::<Span<'static>>::new());
    }

    let Line {
        style,
        alignment,
        spans,
    } = line;
    let mut used = 0usize;
    let mut spans_out: Vec<Span<'static>> = Vec::with_capacity(spans.len());

    for span in spans {
        let span_width = display_width(span.content.as_ref());

        if span_width == 0 {
            spans_out.push(span);
            continue;
        }

        if used >= max_width {
            break;
        }

        if used + span_width <= max_width {
            used += span_width;
            spans_out.push(span);
            continue;
        }

        let style = span.style;
        let text = span.content.as_ref();
        let mut end_idx = 0usize;
        for (idx, grapheme) in text.grapheme_indices(true) {
            let grapheme_width = display_width(grapheme);
            if used + grapheme_width > max_width {
                break;
            }
            end_idx = idx + grapheme.len();
            used += grapheme_width;
        }

        if end_idx > 0 {
            spans_out.push(Span::styled(text[..end_idx].to_string(), style));
        }

        break;
    }

    Line {
        style,
        alignment,
        spans: spans_out,
    }
}

/// Truncate a styled line to `max_width` and append an ellipsis on overflow.
///
/// Intended for short UI rows. This preserves a fast no-overflow path (width
/// pre-scan + return original line unchanged) and uses `truncate_line_to_width`
/// for the overflow case.
pub(crate) fn truncate_line_with_ellipsis_if_overflow(
    line: Line<'static>,
    max_width: usize,
) -> Line<'static> {
    if max_width == 0 {
        return Line::from(Vec::<Span<'static>>::new());
    }

    if line_width(&line) <= max_width {
        return line;
    }

    let truncated = truncate_line_to_width(line, max_width.saturating_sub(1));
    let Line {
        style,
        alignment,
        mut spans,
    } = truncated;
    let ellipsis_style = spans.last().map(|span| span.style).unwrap_or_default();
    spans.push(Span::styled("…", ellipsis_style));
    Line {
        style,
        alignment,
        spans,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ratatui::style::{Color, Style};

    fn line(text: &str) -> Line<'static> {
        Line::from(text.to_string())
    }

    #[test]
    fn line_width_sums_span_widths() {
        let styled = Line::from(vec![
            Span::raw("olá"),
            Span::styled("界", Style::default().fg(Color::Red)),
        ]);
        assert_eq!(line_width(&styled), 5);
    }

    #[test]
    fn truncate_line_to_width_respects_grapheme_boundaries() {
        let out = truncate_line_to_width(line("abcdefgh"), 4);
        assert_eq!(out.to_string(), "abcd");
    }

    #[test]
    fn truncate_line_to_width_handles_wide_chars() {
        // "界" is 2 columns; a budget of 3 fits "a界".
        let out = truncate_line_to_width(line("a界b"), 3);
        assert_eq!(out.to_string(), "a界");
    }

    #[test]
    fn truncate_line_to_width_zero_is_empty() {
        let out = truncate_line_to_width(line("abc"), 0);
        assert!(out.spans.is_empty());
    }

    #[test]
    fn truncate_line_to_width_preserves_span_styles() {
        let styled = Line::from(vec![Span::styled("abcde", Style::default().fg(Color::Red))]);
        let out = truncate_line_to_width(styled, 3);
        assert_eq!(out.to_string(), "abc");
        assert_eq!(
            out.spans.first().map(|s| s.style.fg),
            Some(Some(Color::Red))
        );
    }

    #[test]
    fn ellipsis_only_when_overflowing() {
        let short = truncate_line_with_ellipsis_if_overflow(line("short"), 10);
        assert_eq!(short.to_string(), "short");
    }

    #[test]
    fn ellipsis_appended_on_overflow() {
        let out = truncate_line_with_ellipsis_if_overflow(line("abcdefghijklmnop"), 8);
        assert_eq!(out.to_string(), "abcdefg…");
    }
}
