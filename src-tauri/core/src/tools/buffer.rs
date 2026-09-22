//! GapBuffer + TextBuffer — inspirado em `microsoft/edit` `crates/edit/src/buffer.rs`.
//! Otimizado para edições localizadas: gap no cursor evita shifts O(n).
//! Coordenadas lógicas (line/col no arquivo) vs visuais (tela com tabs/wrap).
//! Transações `edit_begin/edit_end` para undo/redo.
//! Zero-Lib: `std` apenas.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LogicalPos { pub line: usize, pub col: usize } // 0-based

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct VisualPos { pub row: usize, pub col: usize }

/// Gap buffer simples em Vec<u8> + gap indices.
#[derive(Debug, Clone)]
pub struct GapBuffer {
    buf: Vec<u8>,
    gap_start: usize,
    gap_end: usize,
}

impl GapBuffer {
    pub fn new() -> Self { Self { buf: vec![0u8; 64], gap_start: 0, gap_end: 64 } }

    pub fn from_str(s: &str) -> Self {
        let bytes = s.as_bytes();
        let cap = (bytes.len() + 64).next_power_of_two();
        let mut buf = vec![0u8; cap];
        buf[..bytes.len()].copy_from_slice(bytes);
        Self { buf, gap_start: bytes.len(), gap_end: cap }
    }

    pub fn len(&self) -> usize { self.buf.len() - (self.gap_end - self.gap_start) }
    pub fn is_empty(&self) -> bool { self.len() == 0 }

    fn move_gap(&mut self, pos: usize) {
        let len = self.len();
        let pos = pos.min(len);
        if pos == self.gap_start { return; }
        if pos < self.gap_start {
            let delta = self.gap_start - pos;
            let src = pos;
            let dst = self.gap_end - delta;
            self.buf.copy_within(src..self.gap_start, dst);
            self.gap_start = pos;
            self.gap_end -= delta;
        } else {
            let delta = pos - self.gap_start;
            let src = self.gap_end;
            let dst = self.gap_start;
            self.buf.copy_within(src..src+delta, dst);
            self.gap_start += delta;
            self.gap_end += delta;
        }
    }

    fn ensure_gap(&mut self, needed: usize) {
        if self.gap_end - self.gap_start >= needed { return; }
        let new_cap = (self.buf.len() + needed).next_power_of_two();
        let mut new_buf = vec![0u8; new_cap];
        let left = self.gap_start;
        let right_len = self.buf.len() - self.gap_end;
        new_buf[..left].copy_from_slice(&self.buf[..left]);
        new_buf[new_cap - right_len..].copy_from_slice(&self.buf[self.gap_end..]);
        self.gap_end = new_cap - right_len;
        self.buf = new_buf;
    }

    pub fn insert(&mut self, pos: usize, text: &str) {
        let bytes = text.as_bytes();
        self.move_gap(pos);
        self.ensure_gap(bytes.len());
        self.buf[self.gap_start..self.gap_start + bytes.len()].copy_from_slice(bytes);
        self.gap_start += bytes.len();
    }

    pub fn delete(&mut self, pos: usize, len: usize) {
        if len == 0 { return; }
        self.move_gap(pos);
        let avail = self.buf.len() - self.gap_end;
        let del = len.min(avail);
        self.gap_end += del;
    }

    pub fn to_string(&self) -> String {
        let mut v = Vec::with_capacity(self.len());
        v.extend_from_slice(&self.buf[..self.gap_start]);
        v.extend_from_slice(&self.buf[self.gap_end..]);
        String::from_utf8_lossy(&v).into_owned()
    }

    pub fn as_bytes_vec(&self) -> Vec<u8> {
        let mut v = Vec::with_capacity(self.len());
        v.extend_from_slice(&self.buf[..self.gap_start]);
        v.extend_from_slice(&self.buf[self.gap_end..]);
        v
    }
}

impl Default for GapBuffer { fn default() -> Self { Self::new() } }

/// TextBuffer de alto nível com linhas, undo e coordenadas.
#[derive(Debug, Clone)]
pub struct TextBuffer {
    gap: GapBuffer,
    // undo: pilha de snapshots (simplificado; edit transacional)
    undo_stack: Vec<String>,
    redo_stack: Vec<String>,
    in_transaction: bool,
    txn_start_snapshot: Option<String>,
    tab_width: usize,
}

impl TextBuffer {
    pub fn new(text: &str) -> Self {
        Self { gap: GapBuffer::from_str(text), undo_stack: Vec::new(), redo_stack: Vec::new(), in_transaction: false, txn_start_snapshot: None, tab_width: 4 }
    }

    pub fn text(&self) -> String { self.gap.to_string() }
    pub fn len(&self) -> usize { self.gap.len() }

    // --- Transações (edit_begin/edit_end do edit) ---
    pub fn edit_begin(&mut self) {
        if !self.in_transaction {
            self.in_transaction = true;
            self.txn_start_snapshot = Some(self.gap.to_string());
        }
    }
    pub fn edit_end(&mut self) {
        if self.in_transaction {
            if let Some(snap) = self.txn_start_snapshot.take() {
                if snap != self.gap.to_string() {
                    self.undo_stack.push(snap);
                    self.redo_stack.clear();
                }
            }
            self.in_transaction = false;
        }
    }

    pub fn insert(&mut self, pos: usize, text: &str) { self.gap.insert(pos, text); }
    pub fn delete(&mut self, pos: usize, len: usize) { self.gap.delete(pos, len); }

    pub fn undo(&mut self) -> bool {
        if let Some(prev) = self.undo_stack.pop() {
            let cur = self.gap.to_string();
            self.redo_stack.push(cur);
            self.gap = GapBuffer::from_str(&prev);
            true
        } else { false }
    }
    pub fn redo(&mut self) -> bool {
        if let Some(next) = self.redo_stack.pop() {
            let cur = self.gap.to_string();
            self.undo_stack.push(cur);
            self.gap = GapBuffer::from_str(&next);
            true
        } else { false }
    }

    // --- Coordenadas ---
    pub fn logical_to_offset(&self, pos: LogicalPos) -> Option<usize> {
        let text = self.gap.to_string();
        let lines: Vec<&str> = text.split('\n').collect();
        if pos.line >= lines.len() { return None; }
        let mut off = 0usize;
        for i in 0..pos.line { off += lines[i].len() + 1; }
        if pos.col > lines[pos.line].len() { return None; }
        Some(off + pos.col)
    }

    pub fn offset_to_logical(&self, offset: usize) -> LogicalPos {
        let text = self.gap.to_string();
        let mut line = 0usize;
        let mut col = 0usize;
        let mut cur = 0usize;
        for ch in text.chars() {
            if cur == offset { break; }
            if ch == '\n' { line += 1; col = 0; } else { col += 1; }
            cur += ch.len_utf8();
            if cur > offset { break; }
        }
        LogicalPos { line, col }
    }

    /// Visual col considerando tabs.
    pub fn logical_to_visual(&self, pos: LogicalPos) -> VisualPos {
        let text = self.gap.to_string();
        let lines: Vec<&str> = text.split('\n').collect();
        if pos.line >= lines.len() { return VisualPos { row: pos.line, col: pos.col }; }
        let line_text = lines[pos.line];
        let mut vcol = 0usize;
        for (i, ch) in line_text.chars().enumerate() {
            if i >= pos.col { break; }
            if ch == '\t' { vcol = (vcol / self.tab_width + 1) * self.tab_width; } else { vcol += 1; }
        }
        VisualPos { row: pos.line, col: vcol }
    }

    /// Varredura O(n) com memchr-like (zero-state line tracking do edit) — sem cache de quebras.
    pub fn line_count(&self) -> usize {
        let bytes = self.gap.as_bytes_vec();
        let mut count = 1usize;
        for &b in &bytes { if b == b'\n' { count += 1; } }
        if bytes.last() == Some(&b'\n') { count -= 1; }
        count.max(1)
    }

    /// Busca rápida de quebras (SIMD futuro: memchr2) — aqui escalar std.
    pub fn find_line_start(&self, line: usize) -> Option<usize> {
        self.logical_to_offset(LogicalPos { line, col: 0 })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn gap_insert_delete() {
        let mut g = GapBuffer::from_str("hello world");
        g.insert(5, ",");
        assert_eq!(g.to_string(), "hello, world");
        g.delete(5, 1);
        assert_eq!(g.to_string(), "hello world");
    }
    #[test]
    fn transaction_undo_redo() {
        let mut tb = TextBuffer::new("a\nb\nc");
        tb.edit_begin();
        tb.gap.insert(2, "X\n");
        tb.edit_end();
        assert!(tb.text().contains("X"));
        assert!(tb.undo());
        assert!(!tb.text().contains("X"));
        assert!(tb.redo());
        assert!(tb.text().contains("X"));
    }
    #[test]
    fn logical_visual() {
        let tb = TextBuffer::new("a\tb");
        let v = tb.logical_to_visual(LogicalPos { line: 0, col: 2 });
        assert_eq!(v.col, 4); // 'a' col0, '\t' -> 4, 'b' visual 4
    }
    #[test]
    fn line_count_zero_state() {
        let tb = TextBuffer::new("a\nb\nc\n");
        assert_eq!(tb.line_count(), 3);
    }
}
