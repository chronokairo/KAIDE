//! Immediate-mode double-buffered terminal screen buffer with diff-based VT emission.
//! Directly inspired by microsoft/edit's `framebuffer.rs`.

use super::vt::{Style, Vt};
use std::io::{self, Write};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Cell {
    pub ch: char,
    pub style: Style,
}

impl Default for Cell {
    fn default() -> Self {
        Self {
            ch: ' ',
            style: Style::default(),
        }
    }
}

pub struct Framebuffer {
    width: u16,
    height: u16,
    front: Vec<Cell>,
    back: Vec<Cell>,
    cursor_pos: Option<(u16, u16)>,
}

impl Framebuffer {
    pub fn new(width: u16, height: u16) -> Self {
        let size = (width as usize) * (height as usize);
        Self {
            width,
            height,
            front: vec![Cell::default(); size],
            back: vec![Cell::default(); size],
            cursor_pos: None,
        }
    }

    pub fn resize(&mut self, width: u16, height: u16) {
        if self.width == width && self.height == height {
            return;
        }
        self.width = width;
        self.height = height;
        let size = (width as usize) * (height as usize);
        self.front = vec![Cell::default(); size];
        self.back = vec![Cell::default(); size];
    }

    pub fn width(&self) -> u16 {
        self.width
    }

    pub fn height(&self) -> u16 {
        self.height
    }

    pub fn clear(&mut self) {
        for cell in self.back.iter_mut() {
            *cell = Cell::default();
        }
    }

    pub fn set(&mut self, col: u16, row: u16, ch: char, style: Style) {
        if col < self.width && row < self.height {
            let idx = (row as usize) * (self.width as usize) + (col as usize);
            self.back[idx] = Cell { ch, style };
        }
    }

    pub fn print_str(&mut self, col: u16, row: u16, text: &str, style: Style) {
        let mut cur_col = col;
        for ch in text.chars() {
            if cur_col >= self.width {
                break;
            }
            self.set(cur_col, row, ch, style);
            cur_col += 1;
        }
    }

    pub fn set_cursor(&mut self, col: u16, row: u16) {
        self.cursor_pos = Some((col, row));
    }

    /// Render only the changed cells between front and back buffers.
    pub fn flush<W: Write>(&mut self, writer: &mut W) -> io::Result<()> {
        let mut out = String::with_capacity(4096);
        let mut last_style = Style::default();
        let mut style_active = false;
        let mut last_pos: Option<(u16, u16)> = None;

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = (row as usize) * (self.width as usize) + (col as usize);
                let back_cell = self.back[idx];
                let front_cell = self.front[idx];

                if back_cell != front_cell {
                    // Position cursor if not adjacent to last printed cell
                    let need_move = match last_pos {
                        Some((last_col, last_row)) => last_row != row || last_col + 1 != col,
                        None => true,
                    };
                    if need_move {
                        Vt::move_cursor(&mut out, col, row);
                    }

                    // Update styling if changed
                    if !style_active || back_cell.style != last_style {
                        Vt::apply_style(&mut out, &back_cell.style);
                        last_style = back_cell.style;
                        style_active = true;
                    }

                    out.push(back_cell.ch);
                    self.front[idx] = back_cell;
                    last_pos = Some((col, row));
                }
            }
        }

        if let Some((col, row)) = self.cursor_pos {
            Vt::move_cursor(&mut out, col, row);
            Vt::show_cursor(&mut out);
        } else {
            Vt::hide_cursor(&mut out);
        }

        if style_active {
            Vt::reset_style(&mut out);
        }

        if !out.is_empty() {
            writer.write_all(out.as_bytes())?;
            writer.flush()?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_framebuffer_diff_rendering() {
        let mut fb = Framebuffer::new(10, 5);
        fb.print_str(0, 0, "Hello", Style::default());

        let mut output = Vec::new();
        fb.flush(&mut output).unwrap();
        let rendered = String::from_utf8(output).unwrap();
        assert!(rendered.contains("Hello"));

        // Second flush with no changes produces no cell writes
        let mut second = Vec::new();
        fb.flush(&mut second).unwrap();
        let rendered2 = String::from_utf8(second).unwrap();
        assert!(!rendered2.contains("Hello"));
    }
}
