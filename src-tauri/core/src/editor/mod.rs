//! Núcleo de edição UTF-8 inspirado no Microsoft Edit.
//!
//! O módulo é deliberadamente independente do renderer: a TUI pode desenhar
//! `lines()` e encaminhar teclas para este buffer sem conhecer a lógica de
//! seleção, histórico ou busca.

use std::fs;
use std::io;
use std::path::Path;

pub mod clipboard;
pub use clipboard::Clipboard;

#[derive(Clone, Debug, PartialEq, Eq)]
struct Snapshot { lines: Vec<String>, row: usize, col: usize, anchor: Option<(usize, usize)> }

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Cursor { pub row: usize, pub col: usize }

#[derive(Clone, Debug)]
pub struct EditorBuffer {
    lines: Vec<String>, cursor: Cursor, anchor: Option<Cursor>,
    undo: Vec<Snapshot>, redo: Vec<Snapshot>, pub modified: bool,
    clipboard: Clipboard,
}

impl EditorBuffer {
    pub fn new(text: &str) -> Self {
        let mut lines: Vec<String> = text.split('\n').map(str::to_owned).collect();
        if lines.is_empty() { lines.push(String::new()); }
        Self { lines, cursor: Cursor { row: 0, col: 0 }, anchor: None, undo: Vec::new(), redo: Vec::new(), modified: false, clipboard: Clipboard::default() }
    }
    pub fn open(path: impl AsRef<Path>) -> io::Result<Self> { Ok(Self::new(&fs::read_to_string(path)?)) }
    pub fn save(&mut self, path: impl AsRef<Path>) -> io::Result<()> { fs::write(path, self.text())?; self.modified = false; Ok(()) }
    pub fn text(&self) -> String { self.lines.join("\n") }
    pub fn lines(&self) -> &[String] { &self.lines }
    pub fn cursor(&self) -> Cursor { self.cursor }
    pub fn set_cursor(&mut self, row: usize, col: usize) { self.cursor.row = row.min(self.lines.len() - 1); self.cursor.col = col.min(self.lines[self.cursor.row].chars().count()); }
    /// Synchronize an external renderer mirror while retaining undo history.
    pub fn sync_external_text(&mut self, text: &str, row: usize, col: usize) {
        if self.text() != text { self.mutate(); self.lines = text.split('\n').map(str::to_owned).collect(); if self.lines.is_empty() { self.lines.push(String::new()); } }
        self.set_cursor(row, col);
    }
    pub fn line_col_1based(&self) -> (usize, usize) { (self.cursor.row + 1, self.cursor.col + 1) }
    pub fn select_all(&mut self) { self.anchor = Some(Cursor { row: 0, col: 0 }); self.cursor = Cursor { row: self.lines.len() - 1, col: self.lines.last().map(|s| s.chars().count()).unwrap_or(0) }; }
    pub fn clear_selection(&mut self) { self.anchor = None; }
    pub fn has_selection(&self) -> bool { self.anchor.is_some() }
    pub fn clipboard(&self) -> &Clipboard { &self.clipboard }
    pub fn clipboard_mut(&mut self) -> &mut Clipboard { &mut self.clipboard }
    /// Copy selection, or the current line when no selection exists (Edit behavior).
    pub fn copy(&mut self) {
        if let Some(text) = self.selected_text() { self.clipboard.write(text); }
        else { self.clipboard.write_line(self.lines[self.cursor.row].clone()); }
    }
    pub fn cut(&mut self) {
        self.copy();
        if self.anchor.is_some() { self.mutate(); self.delete_selection(); }
    }
    pub fn paste(&mut self) { let text = self.clipboard.read().to_string(); if text.is_empty() { return; } self.insert(&text); }
    pub fn selected_text(&self) -> Option<String> { let (a, b) = self.selection_bounds()?; let mut out = String::new(); for row in a.row..=b.row { if row > a.row { out.push('\n'); } let line: Vec<char> = self.lines[row].chars().collect(); let start = if row == a.row { a.col } else { 0 }; let end = if row == b.row { b.col } else { line.len() }; out.extend(line[start.min(line.len())..end.min(line.len())].iter()); } Some(out) }
    pub fn insert(&mut self, text: &str) { self.mutate(); for ch in text.chars() { if ch == '\n' { self.newline_raw(); } else { self.insert_char_raw(ch); } } }
    pub fn insert_char(&mut self, ch: char) { self.mutate(); if ch == '\n' { self.newline_raw(); } else { self.insert_char_raw(ch); } }
    pub fn newline(&mut self) { self.mutate(); self.newline_raw(); }
    pub fn backspace(&mut self) { self.mutate(); if self.cursor.col > 0 { let line = &mut self.lines[self.cursor.row]; let at = byte_at(line, self.cursor.col - 1); line.remove(at); self.cursor.col -= 1; } else if self.cursor.row > 0 { let current = self.lines.remove(self.cursor.row); self.cursor.row -= 1; self.cursor.col = self.lines[self.cursor.row].chars().count(); self.lines[self.cursor.row].push_str(&current); } }
    pub fn delete(&mut self) { self.mutate(); let len = self.lines[self.cursor.row].chars().count(); if self.cursor.col < len { let at = byte_at(&self.lines[self.cursor.row], self.cursor.col); self.lines[self.cursor.row].remove(at); } else if self.cursor.row + 1 < self.lines.len() { let next = self.lines.remove(self.cursor.row + 1); self.lines[self.cursor.row].push_str(&next); } }
    pub fn move_left(&mut self) { if self.cursor.col > 0 { self.cursor.col -= 1; } else if self.cursor.row > 0 { self.cursor.row -= 1; self.cursor.col = self.lines[self.cursor.row].chars().count(); } }
    pub fn move_right(&mut self) { let len = self.lines[self.cursor.row].chars().count(); if self.cursor.col < len { self.cursor.col += 1; } else if self.cursor.row + 1 < self.lines.len() { self.cursor.row += 1; self.cursor.col = 0; } }
    pub fn move_word_left(&mut self) { while self.cursor.col > 0 && self.char_before().is_whitespace() { self.move_left(); } while self.cursor.col > 0 && !self.char_before().is_whitespace() { self.move_left(); } }
    pub fn move_word_right(&mut self) { let len = self.lines[self.cursor.row].chars().count(); while self.cursor.col < len && self.char_at(self.cursor.col).is_whitespace() { self.move_right(); } while self.cursor.col < len && !self.char_at(self.cursor.col).is_whitespace() { self.move_right(); } }
    pub fn goto_line(&mut self, line_1based: usize) { self.cursor.row = line_1based.saturating_sub(1).min(self.lines.len() - 1); self.cursor.col = self.cursor.col.min(self.lines[self.cursor.row].chars().count()); }
    pub fn undo(&mut self) { if let Some(s) = self.undo.pop() { self.redo.push(self.snapshot()); self.restore(s); } }
    pub fn redo(&mut self) { if let Some(s) = self.redo.pop() { self.undo.push(self.snapshot()); self.restore(s); } }
    /// Indent or unindent the selected lines (or the current line) by four spaces.
    pub fn indent_lines(&mut self, unindent: bool) {
        let (start, end) = self.selected_line_range();
        self.mutate();
        for row in start..=end {
            if unindent {
                let remove = self.lines[row].as_bytes().iter().take(4)
                    .take_while(|b| **b == b' ' || **b == b'\t').count();
                if remove > 0 {
                    self.lines[row].drain(..remove);
                    if self.cursor.row == row { self.cursor.col = self.cursor.col.saturating_sub(remove); }
                }
            } else {
                self.lines[row].insert_str(0, "    ");
                if self.cursor.row == row { self.cursor.col += 4; }
            }
        }
    }
    /// Move the selected lines, or the current line, one row up or down.
    pub fn move_lines(&mut self, down: bool) {
        let (start, end) = self.selected_line_range();
        if (down && end + 1 >= self.lines.len()) || (!down && start == 0) { return; }
        self.mutate();
        if down {
            self.lines[start..=end + 1].rotate_left(end - start + 1);
            self.cursor.row += 1;
            if let Some(anchor) = &mut self.anchor { anchor.row += 1; }
        } else {
            self.lines[start - 1..=end].rotate_right(end - start + 1);
            self.cursor.row -= 1;
            if let Some(anchor) = &mut self.anchor { anchor.row -= 1; }
        }
    }
    pub fn replace_all(&mut self, needle: &str, replacement: &str, opts: crate::tools::find_replace::FindOptions) -> usize { let old = self.text(); let (new, count) = crate::tools::find_replace::replace_all(&old, needle, replacement, opts); if count > 0 { self.mutate(); self.lines = new.split('\n').map(str::to_owned).collect(); self.cursor.row = self.cursor.row.min(self.lines.len() - 1); self.cursor.col = self.cursor.col.min(self.lines[self.cursor.row].chars().count()); } count }
    fn delete_selection(&mut self) { let Some((a, b)) = self.selection_bounds() else { return; }; let mut text = self.text(); let start = absolute_byte(&self.lines, a); let end = absolute_byte(&self.lines, b); text.replace_range(start..end, ""); self.lines = text.split('\n').map(str::to_owned).collect(); self.cursor = a; self.anchor = None; self.modified = true; }
    fn mutate(&mut self) { self.undo.push(self.snapshot()); self.redo.clear(); self.modified = true; }
    fn snapshot(&self) -> Snapshot { Snapshot { lines: self.lines.clone(), row: self.cursor.row, col: self.cursor.col, anchor: self.anchor.map(|c| (c.row, c.col)) } }
    fn restore(&mut self, s: Snapshot) { self.lines = s.lines; self.cursor = Cursor { row: s.row, col: s.col }; self.anchor = s.anchor.map(|(row, col)| Cursor { row, col }); self.modified = true; }
    fn newline_raw(&mut self) { let at = byte_at(&self.lines[self.cursor.row], self.cursor.col); let right = self.lines[self.cursor.row].split_off(at); self.lines.insert(self.cursor.row + 1, right); self.cursor.row += 1; self.cursor.col = 0; }
    fn insert_char_raw(&mut self, ch: char) { let at = byte_at(&self.lines[self.cursor.row], self.cursor.col); self.lines[self.cursor.row].insert(at, ch); self.cursor.col += 1; }
    fn char_before(&self) -> char { self.lines[self.cursor.row].chars().nth(self.cursor.col - 1).unwrap_or('\0') }
    fn char_at(&self, col: usize) -> char { self.lines[self.cursor.row].chars().nth(col).unwrap_or('\0') }
    fn selection_bounds(&self) -> Option<(Cursor, Cursor)> { let a = self.anchor?; if (a.row, a.col) <= (self.cursor.row, self.cursor.col) { Some((a, self.cursor)) } else { Some((self.cursor, a)) } }
    fn selected_line_range(&self) -> (usize, usize) {
        self.selection_bounds()
            .map(|(a, b)| (a.row, b.row))
            .unwrap_or((self.cursor.row, self.cursor.row))
    }
}

fn byte_at(s: &str, col: usize) -> usize { s.char_indices().nth(col).map(|(i, _)| i).unwrap_or(s.len()) }
fn absolute_byte(lines: &[String], cursor: Cursor) -> usize { lines.iter().take(cursor.row).map(|s| s.len() + 1).sum::<usize>() + byte_at(&lines[cursor.row], cursor.col) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn utf8_edit_and_history() { let mut e = EditorBuffer::new("Olá\nmundo"); e.goto_line(1); e.move_right(); e.insert_char('!'); assert_eq!(e.text(), "O!lá\nmundo"); e.undo(); assert_eq!(e.text(), "Olá\nmundo"); e.redo(); assert_eq!(e.text(), "O!lá\nmundo"); }
    #[test] fn words_and_selection() { let mut e = EditorBuffer::new("alpha beta"); e.move_word_right(); e.move_word_right(); e.select_all(); assert_eq!(e.selected_text().as_deref(), Some("alpha beta")); }
    #[test] fn edit_clipboard_copies_and_cuts_selection() { let mut e = EditorBuffer::new("alpha beta"); e.select_all(); e.copy(); assert_eq!(e.clipboard().read(), "alpha beta"); e.cut(); assert_eq!(e.text(), ""); e.paste(); assert_eq!(e.text(), "alpha beta"); }
    #[test] fn multiline_delete() { let mut e = EditorBuffer::new("a\nb"); e.cursor.col = 1; e.delete(); assert_eq!(e.text(), "ab"); }
    #[test] fn indent_and_unindent_current_line() {
        let mut e = EditorBuffer::new("one\ntwo");
        e.goto_line(2);
        e.indent_lines(false);
        assert_eq!(e.text(), "one\n    two");
        e.indent_lines(true);
        assert_eq!(e.text(), "one\ntwo");
    }
    #[test] fn move_lines_preserves_block_and_cursor() {
        let mut e = EditorBuffer::new("a\nb\nc");
        e.goto_line(2);
        e.move_lines(true);
        assert_eq!(e.text(), "a\nc\nb");
        assert_eq!(e.cursor().row, 2);
        e.move_lines(false);
        assert_eq!(e.text(), "a\nb\nc");
    }
}
