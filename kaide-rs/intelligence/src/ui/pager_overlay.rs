//! Pager-style overlay widget: a scrollable, closable full-screen view over a
//! list of wrapped lines, with a header row, separator/percent bar and key
//! hints.
//!
//! Adapted from OpenAI Codex's `tui/src/pager_overlay.rs`. The Codex original
//! is built on a custom `Renderable` trait and config-driven keymap; here the
//! pager wraps plain ratatui `Line`s and uses ratatui's row-based
//! `Paragraph::scroll`, which matches the TUI's existing rendering model.

use crossterm::event::{KeyCode, KeyEvent};
use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::Stylize,
    text::{Line, Span, Text},
    widgets::{Clear, Paragraph, Widget, Wrap},
};

use crate::ui::live_wrap::RowBuilder;

/// A pager navigation action, matched against a raw key event.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PagerAction {
    ScrollUp,
    ScrollDown,
    PageUp,
    PageDown,
    JumpTop,
    JumpBottom,
    Close,
}

impl PagerAction {
    pub fn matches(&self, key: &KeyEvent) -> bool {
        match self {
            PagerAction::ScrollUp => matches!(key.code, KeyCode::Up | KeyCode::Char('k')),
            PagerAction::ScrollDown => matches!(key.code, KeyCode::Down | KeyCode::Char('j')),
            PagerAction::PageUp => matches!(key.code, KeyCode::PageUp | KeyCode::Char('u')),
            PagerAction::PageDown => matches!(key.code, KeyCode::PageDown | KeyCode::Char('d')),
            PagerAction::JumpTop => matches!(key.code, KeyCode::Home | KeyCode::Char('g')),
            PagerAction::JumpBottom => matches!(key.code, KeyCode::End | KeyCode::Char('G')),
            PagerAction::Close => matches!(key.code, KeyCode::Esc | KeyCode::Char('q')),
        }
    }
}

/// Scrollable full-screen overlay over a fixed list of wrapped lines.
pub struct PagerOverlay {
    title: String,
    lines: Vec<Line<'static>>,
    scroll_offset: usize,
    is_done: bool,
}

impl PagerOverlay {
    /// Create a pager starting at the top of the content.
    pub fn new(lines: Vec<Line<'static>>, title: String) -> Self {
        Self {
            title,
            lines,
            scroll_offset: 0,
            is_done: false,
        }
    }

    /// Create a pager pinned to the bottom of the content (follow-along mode).
    pub fn new_at_bottom(lines: Vec<Line<'static>>, title: String) -> Self {
        Self {
            title,
            lines,
            scroll_offset: usize::MAX,
            is_done: false,
        }
    }

    /// Update the pager content, keeping the current scroll position if it
    /// still fits, otherwise clamping to the bottom.
    pub fn set_lines(&mut self, lines: Vec<Line<'static>>) {
        self.lines = lines;
    }

    /// Whether the user requested to close the overlay.
    pub fn is_done(&self) -> bool {
        self.is_done
    }

    /// Process a key event. Returns `true` when the overlay should close.
    pub fn handle_event(&mut self, key: &KeyEvent) -> bool {
        if PagerAction::Close.matches(key) {
            self.is_done = true;
            return true;
        }
        let viewport = self.viewport_area();
        let page = viewport.height.max(1) as usize;
        match key.code {
            KeyCode::Up | KeyCode::Char('k') => {
                self.scroll_offset = self.scroll_offset.saturating_sub(1);
            }
            KeyCode::Down | KeyCode::Char('j') => {
                self.scroll_offset = self.scroll_offset.saturating_add(1);
            }
            KeyCode::PageUp | KeyCode::Char('u') => {
                self.scroll_offset = self.scroll_offset.saturating_sub(page);
            }
            KeyCode::PageDown | KeyCode::Char('d') => {
                self.scroll_offset = self.scroll_offset.saturating_add(page);
            }
            KeyCode::Home | KeyCode::Char('g') => {
                self.scroll_offset = 0;
            }
            KeyCode::End | KeyCode::Char('G') => {
                self.scroll_offset = usize::MAX;
            }
            _ => return false,
        }
        true
    }

    /// Wrapped-line height of the content at the given width.
    fn content_height(&self, width: u16) -> usize {
        if width == 0 || self.lines.is_empty() {
            return 0;
        }
        self.lines
            .iter()
            .map(|line| {
                let mut rb = RowBuilder::new(width as usize);
                rb.push_fragment(&line.to_string());
                rb.display_rows().len()
            })
            .sum()
    }

    fn render_view(&mut self, area: Rect, buf: &mut Buffer) {
        Clear.render(area, buf);
        self.render_header(area, buf);
        let content_area = self.content_area(area);
        let content_height = self.content_height(content_area.width);
        let max_scroll = content_height.saturating_sub(content_area.height as usize);
        self.scroll_offset = if self.scroll_offset == usize::MAX {
            max_scroll
        } else {
            self.scroll_offset.min(max_scroll)
        };

        let body = Paragraph::new(Text::from(self.lines.clone()))
            .wrap(Wrap { trim: false })
            .scroll((self.scroll_offset as u16, 0));
        body.render(content_area, buf);

        // Fill the space below the wrapped content with '~' placeholder rows.
        let drawn = content_height.saturating_sub(self.scroll_offset);
        for y in content_area.y + (drawn as u16).min(content_area.height)..content_area.bottom() {
            if content_area.width == 0 {
                break;
            }
            buf[(content_area.x, y)] = '~'.into();
            for x in content_area.x + 1..content_area.right() {
                buf[(x, y)] = ' '.into();
            }
        }

        self.render_bottom_bar(area, content_area, buf, content_height);
    }

    fn render_header(&self, area: Rect, buf: &mut Buffer) {
        Span::from(format!("/ {}", self.title)).dim().render(area, buf);
    }

    fn render_bottom_bar(&self, area: Rect, content_area: Rect, buf: &mut Buffer, total_len: usize) {
        let sep_y = content_area.bottom();
        let sep_rect = Rect::new(area.x, sep_y, area.width, 1);
        Span::from("─".repeat(sep_rect.width as usize))
            .dim()
            .render(sep_rect, buf);
        let percent = if total_len == 0 {
            100
        } else {
            let max_scroll = total_len.saturating_sub(content_area.height as usize);
            if max_scroll == 0 {
                100
            } else {
                (((self.scroll_offset.min(max_scroll)) as f32 / max_scroll as f32) * 100.0).round()
                    as u8
            }
        };
        let pct_text = format!(" {percent}% ");
        let pct_w = pct_text.chars().count() as u16;
        let pct_x = sep_rect.x + sep_rect.width - pct_w - 1;
        Span::from(pct_text)
            .dim()
            .render(Rect::new(pct_x, sep_rect.y, pct_w, 1), buf);
    }

    fn render_hints(&self, area: Rect, buf: &mut Buffer) {
        let nav = "↑/↓ or k/j to scroll  PgUp/PgDn to page  Home/End to jump  Esc/q to quit";
        let nav_area = Rect::new(area.x, area.y, area.width, 1);
        Paragraph::new(Line::from(nav).dim()).render(nav_area, buf);
    }

    fn content_area(&self, area: Rect) -> Rect {
        let mut area = area;
        area.y = area.y.saturating_add(1);
        area.height = area.height.saturating_sub(2);
        area
    }

    fn viewport_area(&self) -> Rect {
        // Without a live terminal we approximate the viewport; the caller may
        // override the effective page height by resizing. Kept as a 1x1 rect so
        // page scrolling degrades gracefully (page = 1) in tests.
        Rect::new(0, 0, 1, 1)
    }
}

impl PagerOverlay {
    pub fn render(&mut self, area: Rect, buf: &mut Buffer) {
        let top_h = area.height.saturating_sub(3);
        let top = Rect::new(area.x, area.y, area.width, top_h);
        let bottom = Rect::new(area.x, area.y + top_h, area.width, 3);
        self.render_view(top, buf);
        self.render_hints(bottom, buf);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ratatui::{backend::TestBackend, Terminal};

    fn pager_over_20_lines() -> PagerOverlay {
        PagerOverlay::new(
            (0..20)
                .map(|i| Line::from(format!("line-{i:02}")))
                .collect(),
            "T E S T".to_string(),
        )
    }

    fn buffer_text(term: &mut Terminal<TestBackend>) -> String {
        let size = term.size().unwrap();
        let area = Rect::new(0, 0, size.width, size.height);
        let buf = term.backend().buffer();
        let mut out = String::new();
        for y in area.y..area.bottom() {
            for x in area.x..area.right() {
                let symbol = buf[(x, y)].symbol();
                out.push(symbol.chars().next().unwrap_or(' '));
            }
            while out.ends_with(' ') {
                out.pop();
            }
            out.push('\n');
        }
        out
    }

    #[test]
    fn close_sets_done() {
        let mut pager = pager_over_20_lines();
        let key = KeyEvent::new(KeyCode::Esc, crossterm::event::KeyModifiers::NONE);
        assert!(pager.handle_event(&key));
        assert!(pager.is_done());
    }

    #[test]
    fn scroll_down_then_up() {
        let mut pager = pager_over_20_lines();
        let down = KeyEvent::new(KeyCode::Down, crossterm::event::KeyModifiers::NONE);
        let up = KeyEvent::new(KeyCode::Up, crossterm::event::KeyModifiers::NONE);
        pager.handle_event(&down);
        pager.handle_event(&down);
        assert_eq!(pager.scroll_offset, 2);
        pager.handle_event(&up);
        assert_eq!(pager.scroll_offset, 1);
    }

    #[test]
    fn scroll_offset_is_clamped_to_content() {
        let mut pager = pager_over_20_lines();
        let mut term = Terminal::new(TestBackend::new(40, 10)).unwrap();
        term.draw(|f| pager.render(f.area(), f.buffer_mut())).unwrap();
        // 20 wrapped lines in a 5-row content area.
        let max_scroll = pager.content_height(40) - 5;
        assert_eq!(pager.scroll_offset, 0);
        assert!(pager.scroll_offset <= max_scroll);
    }

    #[test]
    fn renders_header_and_separator() {
        let mut pager = pager_over_20_lines();
        let mut term = Terminal::new(TestBackend::new(40, 10)).unwrap();
        term.draw(|f| pager.render(f.area(), f.buffer_mut())).unwrap();
        let text = buffer_text(&mut term);
        assert!(text.contains("/ T E S T"));
        assert!(text.contains("─────"));
    }

    #[test]
    fn new_at_bottom_starts_pinned_to_last_page() {
        let mut pager = PagerOverlay::new_at_bottom(
            (0..20)
                .map(|i| Line::from(format!("line-{i:02}")))
                .collect(),
            "T E S T".to_string(),
        );
        let mut term = Terminal::new(TestBackend::new(40, 10)).unwrap();
        term.draw(|f| pager.render(f.area(), f.buffer_mut())).unwrap();
        assert_eq!(pager.scroll_offset, pager.content_height(40) - 5);
    }

    #[test]
    fn empty_content_renders_without_panic() {
        let mut pager = PagerOverlay::new(vec![], "EMPTY".to_string());
        let mut term = Terminal::new(TestBackend::new(20, 8)).unwrap();
        term.draw(|f| pager.render(f.area(), f.buffer_mut())).unwrap();
    }
}
