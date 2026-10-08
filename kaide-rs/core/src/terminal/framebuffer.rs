//! Immediate-mode framebuffer com diff — inspirado em `microsoft/edit` `crates/edit/src/framebuffer.rs`.
//! Reconstrói a tela frame a frame e envia apenas células sujas via ANSI, reduzindo banda WS.
//! Zero-Lib: `std` apenas.

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Cell {
    pub ch: char,
    pub fg: u8, // 0-255 ANSI
    pub bg: u8,
    pub bold: bool,
}

impl Cell {
    pub fn blank() -> Self { Self { ch: ' ', fg: 7, bg: 0, bold: false } }
    pub fn from_char(ch: char) -> Self { Self { ch, ..Self::blank() } }
}

#[derive(Debug, Clone)]
pub struct Framebuffer {
    pub cols: u16,
    pub rows: u16,
    cells: Vec<Cell>,
    prev: Vec<Cell>,
}

impl Framebuffer {
    pub fn new(cols: u16, rows: u16) -> Self {
        let n = cols as usize * rows as usize;
        Self { cols, rows, cells: vec![Cell::blank(); n], prev: vec![Cell::blank(); n] }
    }

    pub fn resize(&mut self, cols: u16, rows: u16) {
        let n = cols as usize * rows as usize;
        self.cols = cols;
        self.rows = rows;
        self.cells = vec![Cell::blank(); n];
        self.prev = vec![Cell::blank(); n];
    }

    #[inline]
    fn idx(&self, col: u16, row: u16) -> usize { row as usize * self.cols as usize + col as usize }

    pub fn set(&mut self, col: u16, row: u16, cell: Cell) {
        if col < self.cols && row < self.rows {
            let i = self.idx(col, row);
            self.cells[i] = cell;
        }
    }

    pub fn write_str(&mut self, col: u16, row: u16, s: &str, fg: u8) {
        for (i, ch) in s.chars().enumerate() {
            self.set(col + i as u16, row, Cell { ch, fg, ..Cell::blank() });
        }
    }

    pub fn clear(&mut self) { self.cells.fill(Cell::blank()); }

    /// Gera sequência ANSI mínima para atualizar terminal a partir do diff vs frame anterior.
    /// Retorna bytes prontos para enviar ao PTY/WebSocket.
    pub fn render_diff(&mut self) -> Vec<u8> {
        let mut out = Vec::new();
        let mut cur_pos: Option<(u16, u16)> = None;

        for row in 0..self.rows {
            for col in 0..self.cols {
                let i = self.idx(col, row);
                if self.cells[i] != self.prev[i] {
                    if cur_pos != Some((col, row)) {
                        out.extend_from_slice(format!("\x1b[{};{}H", row + 1, col + 1).as_bytes());
                    }
                    let ch = self.cells[i].ch;
                    let mut buf = [0u8; 4];
                    let s = ch.encode_utf8(&mut buf);
                    out.extend_from_slice(s.as_bytes());
                    cur_pos = Some((col + 1, row));
                    if cur_pos.unwrap().0 >= self.cols {
                        cur_pos = Some((0, row + 1));
                    }
                } else if cur_pos == Some((col, row)) {
                    cur_pos = None;
                }
            }
        }
        // swap buffers
        self.prev.clone_from(&self.cells);
        out
    }

    /// Flush total (ex: após resize) — envia tudo com clear.
    pub fn render_full(&mut self) -> Vec<u8> {
        let mut out = Vec::from(b"\x1b[2J\x1b[H".as_slice());
        out.extend(self.render_diff());
        out
    }

    /// Verifica se precisa de settling (layout mudou) — similar a `tui.needs_settling()` do edit.
    pub fn needs_settling(&self) -> bool { self.cells != self.prev }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn diff_only_changed_cells() {
        let mut fb = Framebuffer::new(10, 2);
        fb.write_str(0, 0, "hi", 7);
        let first = fb.render_diff();
        assert!(!first.is_empty());
        let second = fb.render_diff();
        assert!(second.is_empty(), "no diff when unchanged");
        fb.set(0, 0, Cell::from_char('H'));
        let third = fb.render_diff();
        assert!(!third.is_empty());
    }
}
