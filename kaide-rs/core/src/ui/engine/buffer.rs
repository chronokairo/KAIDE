//! Pure std Buffer implementation compatible with Ratatui Buffer.

use super::layout::Rect;
use super::vt::{Color, Style};
use std::ops::{Index, IndexMut};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Cell {
    pub symbol: String,
    pub fg: Color,
    pub bg: Color,
    pub modifier: u16,
}

impl Default for Cell {
    fn default() -> Self {
        Self {
            symbol: " ".to_string(),
            fg: Color::Reset,
            bg: Color::Reset,
            modifier: 0,
        }
    }
}

impl Cell {
    pub fn set_char(&mut self, ch: char) -> &mut Self {
        self.symbol.clear();
        self.symbol.push(ch);
        self
    }

    pub fn set_symbol(&mut self, symbol: &str) -> &mut Self {
        self.symbol.clear();
        self.symbol.push_str(symbol);
        self
    }

    pub fn symbol(&self) -> &str {
        &self.symbol
    }

    pub fn set_style(&mut self, style: Style) -> &mut Self {
        if let Some(fg) = style.fg { self.fg = fg; }
        if let Some(bg) = style.bg { self.bg = bg; }
        self
    }
}

impl From<char> for Cell {
    fn from(ch: char) -> Self {
        let mut c = Cell::default();
        c.set_char(ch);
        c
    }
}

impl From<&str> for Cell {
    fn from(s: &str) -> Self {
        let mut c = Cell::default();
        c.set_symbol(s);
        c
    }
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Buffer {
    pub area: Rect,
    pub content: Vec<Cell>,
}

impl Buffer {
    pub fn empty(area: Rect) -> Self {
        let size = area.area();
        Self {
            area,
            content: vec![Cell::default(); size],
        }
    }

    pub fn get(&self, x: u16, y: u16) -> &Cell {
        let idx = self.index_of(x, y);
        &self.content[idx]
    }

    pub fn get_mut(&mut self, x: u16, y: u16) -> &mut Cell {
        let idx = self.index_of(x, y);
        &mut self.content[idx]
    }

    pub fn set_string(&mut self, x: u16, y: u16, string: &str, style: Style) {
        let mut cur_x = x;
        for ch in string.chars() {
            if cur_x >= self.area.right() || y >= self.area.bottom() {
                break;
            }
            let cell = self.get_mut(cur_x, y);
            cell.set_char(ch);
            cell.set_style(style);
            cur_x = cur_x.saturating_add(1);
        }
    }

    pub fn cell(&self, (x, y): (u16, u16)) -> Option<&Cell> {
        if x >= self.area.right() || y >= self.area.bottom() || x < self.area.x || y < self.area.y {
            None
        } else {
            let idx = self.index_of(x, y);
            self.content.get(idx)
        }
    }

    pub fn resize(&mut self, area: Rect) {
        let size = area.area();
        self.area = area;
        self.content.resize(size, Cell::default());
    }

    pub fn index_of(&self, x: u16, y: u16) -> usize {
        let rel_x = x.saturating_sub(self.area.x) as usize;
        let rel_y = y.saturating_sub(self.area.y) as usize;
        (rel_y * (self.area.width as usize) + rel_x).min(self.content.len().saturating_sub(1))
    }
}

impl Index<(u16, u16)> for Buffer {
    type Output = Cell;
    fn index(&self, (x, y): (u16, u16)) -> &Self::Output {
        self.get(x, y)
    }
}

impl IndexMut<(u16, u16)> for Buffer {
    fn index_mut(&mut self, (x, y): (u16, u16)) -> &mut Self::Output {
        self.get_mut(x, y)
    }
}
