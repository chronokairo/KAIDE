//! Pure std UI widgets matching Ratatui widget contracts.

use super::buffer::Buffer;
use super::layout::{Alignment, Rect};
use super::vt::{Line, Span, Style};
use std::marker::PhantomData;

pub trait Widget {
    fn render(self, area: Rect, buf: &mut Buffer);
}

pub trait StatefulWidget {
    type State;
    fn render(self, area: Rect, buf: &mut Buffer, state: &mut Self::State);
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Borders(u8);

impl Borders {
    pub const NONE: Borders = Borders(0);
    pub const TOP: Borders = Borders(1);
    pub const RIGHT: Borders = Borders(2);
    pub const BOTTOM: Borders = Borders(4);
    pub const LEFT: Borders = Borders(8);
    pub const ALL: Borders = Borders(1 | 2 | 4 | 8);

    pub fn contains(&self, other: Borders) -> bool {
        (self.0 & other.0) == other.0
    }
}

impl std::ops::BitOr for Borders {
    type Output = Self;
    fn bitor(self, rhs: Self) -> Self {
        Borders(self.0 | rhs.0)
    }
}

#[derive(Clone, Debug, Default)]
pub struct Block<'a> {
    title: Option<Line<'a>>,
    borders: Option<Borders>,
    style: Style,
    border_style: Style,
    _marker: PhantomData<&'a ()>,
}

impl<'a> Block<'a> {
    pub fn default() -> Self {
        Self {
            title: None,
            borders: None,
            style: Style::default(),
            border_style: Style::default(),
            _marker: PhantomData,
        }
    }

    pub fn title<T: Into<Line<'a>>>(mut self, title: T) -> Self {
        self.title = Some(title.into());
        self
    }

    pub fn borders(mut self, borders: Borders) -> Self {
        self.borders = Some(borders);
        self
    }

    pub fn style(mut self, style: Style) -> Self {
        self.style = style;
        self
    }

    pub fn border_style(mut self, style: Style) -> Self {
        self.border_style = style;
        self
    }

    pub fn inner(&self, area: Rect) -> Rect {
        let borders = self.borders.unwrap_or(Borders::NONE);
        let mut inner = area;
        if borders.contains(Borders::LEFT) {
            inner.x = inner.x.saturating_add(1);
            inner.width = inner.width.saturating_sub(1);
        }
        if borders.contains(Borders::RIGHT) {
            inner.width = inner.width.saturating_sub(1);
        }
        if borders.contains(Borders::TOP) {
            inner.y = inner.y.saturating_add(1);
            inner.height = inner.height.saturating_sub(1);
        }
        if borders.contains(Borders::BOTTOM) {
            inner.height = inner.height.saturating_sub(1);
        }
        inner
    }
}

impl<'a> Widget for Block<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.is_empty() { return; }
        let borders = self.borders.unwrap_or(Borders::NONE);

        if borders.contains(Borders::TOP) {
            for x in area.left()..area.right() {
                buf[(x, area.top())].set_char('─').set_style(self.border_style);
            }
        }
        if borders.contains(Borders::BOTTOM) && area.height > 1 {
            for x in area.left()..area.right() {
                buf[(x, area.bottom().saturating_sub(1))].set_char('─').set_style(self.border_style);
            }
        }
        if borders.contains(Borders::LEFT) {
            for y in area.top()..area.bottom() {
                buf[(area.left(), y)].set_char('│').set_style(self.border_style);
            }
        }
        if borders.contains(Borders::RIGHT) && area.width > 1 {
            for y in area.top()..area.bottom() {
                buf[(area.right().saturating_sub(1), y)].set_char('│').set_style(self.border_style);
            }
        }

        if let Some(title) = self.title {
            let title_x = area.left().saturating_add(1);
            let mut cur_x = title_x;
            for span in title.spans {
                buf.set_string(cur_x, area.top(), &span.content, span.style);
                cur_x = cur_x.saturating_add(span.content.chars().count() as u16);
            }
        }
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Wrap {
    pub trim: bool,
}

#[derive(Clone, Debug, Default)]
pub struct Paragraph<'a> {
    lines: Vec<Line<'a>>,
    block: Option<Block<'a>>,
    style: Style,
    scroll: (u16, u16),
    alignment: Alignment,
    wrap: Option<Wrap>,
    _marker: PhantomData<&'a ()>,
}

impl<'a> Paragraph<'a> {
    pub fn new<T: Into<ParagraphContent<'a>>>(content: T) -> Self {
        Self {
            lines: content.into().lines,
            block: None,
            style: Style::default(),
            scroll: (0, 0),
            alignment: Alignment::Left,
            wrap: None,
            _marker: PhantomData,
        }
    }

    pub fn block(mut self, block: Block<'a>) -> Self {
        self.block = Some(block);
        self
    }

    pub fn style(mut self, style: Style) -> Self {
        self.style = style;
        self
    }

    pub fn wrap(mut self, wrap: Wrap) -> Self {
        self.wrap = Some(wrap);
        self
    }

    pub fn scroll(mut self, scroll: (u16, u16)) -> Self {
        self.scroll = scroll;
        self
    }

    pub fn alignment(mut self, alignment: Alignment) -> Self {
        self.alignment = alignment;
        self
    }

    pub fn line_count(&self, width: u16) -> usize {
        if width == 0 { return self.lines.len(); }
        let trim = self.wrap.as_ref().map(|w| w.trim).unwrap_or(false);
        let mut count = 0;
        for line in &self.lines {
            if self.wrap.is_some() {
                let wrapped = wrap_line(line, width as usize, trim);
                count += wrapped.len();
            } else {
                count += 1;
            }
        }
        count.max(self.lines.len())
    }
}

pub fn wrap_line<'a>(line: &Line<'a>, max_width: usize, trim: bool) -> Vec<Line<'a>> {
    if max_width == 0 || line.spans.is_empty() {
        return vec![line.clone()];
    }

    #[derive(Debug)]
    enum Token<'a> {
        Word(Vec<Span<'a>>, usize),
        Whitespace(Vec<Span<'a>>, usize),
    }

    let mut tokens: Vec<Token<'a>> = Vec::new();

    for span in &line.spans {
        if span.content.is_empty() {
            continue;
        }

        let mut chars = span.content.chars().peekable();
        while let Some(&c) = chars.peek() {
            let is_ws = c.is_whitespace();
            let mut chunk = String::new();
            let mut chunk_len = 0;
            while let Some(&next_c) = chars.peek() {
                if next_c.is_whitespace() == is_ws {
                    chunk.push(next_c);
                    chunk_len += 1;
                    chars.next();
                } else {
                    break;
                }
            }

            let span_part = Span::styled(chunk, span.style);
            if is_ws {
                if let Some(Token::Whitespace(ref mut spans, ref mut len)) = tokens.last_mut() {
                    spans.push(span_part);
                    *len += chunk_len;
                } else {
                    tokens.push(Token::Whitespace(vec![span_part], chunk_len));
                }
            } else {
                if let Some(Token::Word(ref mut spans, ref mut len)) = tokens.last_mut() {
                    spans.push(span_part);
                    *len += chunk_len;
                } else {
                    tokens.push(Token::Word(vec![span_part], chunk_len));
                }
            }
        }
    }

    if tokens.is_empty() {
        return vec![Line::new()];
    }

    let mut lines: Vec<Line<'a>> = Vec::new();
    let mut current_line: Vec<Span<'a>> = Vec::new();
    let mut current_width: usize = 0;

    for token in tokens {
        match token {
            Token::Whitespace(spans, len) => {
                if trim && current_width == 0 {
                    continue;
                }
                if current_width + len <= max_width {
                    current_line.extend(spans);
                    current_width += len;
                } else {
                    lines.push(Line::from_spans(std::mem::take(&mut current_line)));
                    current_width = 0;
                }
            }
            Token::Word(spans, word_len) => {
                if current_width + word_len <= max_width {
                    current_line.extend(spans);
                    current_width += word_len;
                } else {
                    if current_width > 0 {
                        lines.push(Line::from_spans(std::mem::take(&mut current_line)));
                        current_width = 0;
                    }
                    if word_len <= max_width {
                        current_line.extend(spans);
                        current_width += word_len;
                    } else {
                        for span in spans {
                            let style = span.style;
                            let mut chunk = String::new();
                            for ch in span.content.chars() {
                                chunk.push(ch);
                                current_width += 1;
                                if current_width == max_width {
                                    current_line.push(Span::styled(std::mem::take(&mut chunk), style));
                                    lines.push(Line::from_spans(std::mem::take(&mut current_line)));
                                    current_width = 0;
                                }
                            }
                            if !chunk.is_empty() {
                                current_line.push(Span::styled(chunk, style));
                            }
                        }
                    }
                }
            }
        }
    }

    if !current_line.is_empty() || lines.is_empty() {
        lines.push(Line::from_spans(current_line));
    }

    lines
}

pub struct ParagraphContent<'a> {
    pub lines: Vec<Line<'a>>,
    _marker: PhantomData<&'a ()>,
}

impl<'a> From<&'a str> for ParagraphContent<'a> {
    fn from(s: &'a str) -> Self {
        Self { lines: s.lines().map(Line::from).collect(), _marker: PhantomData }
    }
}

impl<'a> From<String> for ParagraphContent<'a> {
    fn from(s: String) -> Self {
        Self { lines: s.lines().map(|l| Line::from(l.to_string())).collect(), _marker: PhantomData }
    }
}

impl<'a> From<Line<'a>> for ParagraphContent<'a> {
    fn from(line: Line<'a>) -> Self {
        Self { lines: vec![line], _marker: PhantomData }
    }
}

impl<'a> From<Vec<Line<'a>>> for ParagraphContent<'a> {
    fn from(lines: Vec<Line<'a>>) -> Self {
        Self { lines, _marker: PhantomData }
    }
}

impl<'a> Widget for Paragraph<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let content_area = if let Some(block) = &self.block {
            let inner = block.inner(area);
            block.clone().render(area, buf);
            inner
        } else {
            area
        };

        if content_area.is_empty() { return; }

        let trim = self.wrap.as_ref().map(|w| w.trim).unwrap_or(false);
        let mut lines = Vec::new();
        for line in &self.lines {
            if self.wrap.is_some() {
                lines.extend(wrap_line(line, content_area.width as usize, trim));
            } else {
                lines.push(line.clone());
            }
        }

        let skip_lines = self.scroll.0 as usize;
        let mut current_y = content_area.top();

        for line in lines.into_iter().skip(skip_lines) {
            if current_y >= content_area.bottom() { break; }
            let line_w: u16 = line.spans.iter().map(|s| s.content.chars().count() as u16).sum();
            let mut current_x = match self.alignment {
                Alignment::Left => content_area.left(),
                Alignment::Center => content_area.left() + content_area.width.saturating_sub(line_w) / 2,
                Alignment::Right => content_area.right().saturating_sub(line_w),
            };
            for span in line.spans {
                if current_x >= content_area.right() { break; }
                buf.set_string(current_x, current_y, &span.content, span.style);
                current_x = current_x.saturating_add(span.content.chars().count() as u16);
            }
            current_y = current_y.saturating_add(1);
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct Clear;

impl Widget for Clear {
    fn render(self, area: Rect, buf: &mut Buffer) {
        for y in area.top()..area.bottom() {
            for x in area.left()..area.right() {
                buf[(x, y)] = ' '.into();
            }
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct ListState {
    pub selected: Option<usize>,
}

impl ListState {
    pub fn select(&mut self, index: Option<usize>) {
        self.selected = index;
    }

    pub fn selected(&self) -> Option<usize> {
        self.selected
    }
}

#[derive(Clone, Debug)]
pub struct ListItem<'a> {
    pub content: Line<'a>,
    _marker: PhantomData<&'a ()>,
}

impl<'a> ListItem<'a> {
    pub fn new<T: Into<Line<'a>>>(content: T) -> Self {
        Self { content: content.into(), _marker: PhantomData }
    }
}

#[derive(Clone, Debug)]
pub struct List<'a> {
    items: Vec<ListItem<'a>>,
    block: Option<Block<'a>>,
    highlight_style: Style,
    highlight_symbol: Option<&'static str>,
    _marker: PhantomData<&'a ()>,
}

impl<'a> List<'a> {
    pub fn new<T: IntoIterator<Item = ListItem<'a>>>(items: T) -> Self {
        Self {
            items: items.into_iter().collect(),
            block: None,
            highlight_style: Style::default(),
            highlight_symbol: None,
            _marker: PhantomData,
        }
    }

    pub fn block(mut self, block: Block<'a>) -> Self {
        self.block = Some(block);
        self
    }

    pub fn highlight_style(mut self, style: Style) -> Self {
        self.highlight_style = style;
        self
    }

    pub fn highlight_symbol(mut self, symbol: &'static str) -> Self {
        self.highlight_symbol = Some(symbol);
        self
    }
}

impl<'a> StatefulWidget for List<'a> {
    type State = ListState;

    fn render(self, area: Rect, buf: &mut Buffer, state: &mut Self::State) {
        let content_area = if let Some(block) = &self.block {
            let inner = block.inner(area);
            block.clone().render(area, buf);
            inner
        } else {
            area
        };

        if content_area.is_empty() { return; }

        let mut current_y = content_area.top();
        for (idx, item) in self.items.iter().enumerate() {
            if current_y >= content_area.bottom() { break; }
            let is_selected = state.selected == Some(idx);
            let mut current_x = content_area.left();

            if is_selected {
                if let Some(sym) = self.highlight_symbol {
                    buf.set_string(current_x, current_y, sym, self.highlight_style);
                    current_x = current_x.saturating_add(sym.chars().count() as u16);
                }
            }

            let style = if is_selected { self.highlight_style } else { Style::default() };
            for span in &item.content.spans {
                buf.set_string(current_x, current_y, &span.content, style);
                current_x = current_x.saturating_add(span.content.chars().count() as u16);
            }

            current_y = current_y.saturating_add(1);
        }
    }
}

impl<'a> Widget for Span<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.is_empty() { return; }
        buf.set_string(area.x, area.y, &self.content, self.style);
    }
}

impl<'a> Widget for Line<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.is_empty() { return; }
        let mut cur_x = area.x;
        for span in self.spans {
            if cur_x >= area.right() { break; }
            buf.set_string(cur_x, area.y, &span.content, span.style);
            cur_x = cur_x.saturating_add(span.content.chars().count() as u16);
        }
    }
}

impl<'a> From<super::ratatui::text::Text<'a>> for ParagraphContent<'a> {
    fn from(text: super::ratatui::text::Text<'a>) -> Self {
        Self { lines: text.lines, _marker: PhantomData }
    }
}
