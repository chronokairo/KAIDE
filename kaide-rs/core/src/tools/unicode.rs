//! Unicode measurement — port de `microsoft/edit` `crates/edit/src/unicode/measurement.rs` + `crates/stdext/src/unicode/utf8.rs` + `crates/stdext/src/unicode/mod.rs`
//! 3 sistemas de coordenadas: absolute offset (bytes), logical (line, grapheme), visual (row, col com wrap/tab/wide)
//! Word wrap Alt+Z, grapheme clusters, East Asian wide (2 cols), tab expansion.
//! Zero-lib: std only, tabelas estáticas.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Absolute(pub usize);
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Logical { pub line: usize, pub grapheme: usize }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Visual { pub row: usize, pub col: usize }

pub struct MeasurementConfig { pub tab_width: usize, pub wrap_col: Option<usize> }

impl Default for MeasurementConfig {
    fn default() -> Self { Self { tab_width: 4, wrap_col: None } }
}

/// Largura display de um char: 1 narrow, 2 wide (CJK, emoji). Baseado em edit's unicode table.
// https://unicode.org/reports/tr11/ Simplified ranges
pub fn char_width(c: char) -> usize {
    match c {
        '\t' => 0, // handled via tab expansion
        '\n' | '\r' => 0,
        c if c < '\u{20}' => 0,
        _ => {
            let cp = c as u32;
            // Wide ranges: Hangul, CJK, Fullwidth, Emoji presentation
            if (0x1100..=0x115F).contains(&cp) || (0x2E80..=0xA4CF).contains(&cp)
                || (0xAC00..=0xD7A3).contains(&cp) || (0xF900..=0xFAFF).contains(&cp)
                || (0xFE10..=0xFE6F).contains(&cp) || (0xFF00..=0xFF60).contains(&cp)
                || (0xFFE0..=0xFFE6).contains(&cp) || (0x1F000..=0x1FFFF).contains(&cp)
                || (0x20000..=0x2FFFD).contains(&cp) || (0x30000..=0x3FFFD).contains(&cp)
            { 2 } else { 1 }
        }
    }
}

/// Iterator Utf8Chars com recovery U+FFFD (ICU/WHATWG) — port de `stdext/src/unicode/utf8.rs`
pub struct Utf8Chars<'a> { bytes: &'a [u8], pos: usize }
impl<'a> Utf8Chars<'a> {
    pub fn new(s: &'a [u8]) -> Self { Self { bytes: s, pos: 0 } }
}
impl<'a> Iterator for Utf8Chars<'a> {
    type Item = char;
    fn next(&mut self) -> Option<char> {
        if self.pos >= self.bytes.len() { return None; }
        let b0 = self.bytes[self.pos];
        if b0 < 0x80 { self.pos += 1; return Some(b0 as char); }
        // try decode 2-4 bytes, on error emit FFFD and advance 1
        let remaining = &self.bytes[self.pos..];
        match std::str::from_utf8(remaining) {
            Ok(s) => {
                let ch = s.chars().next().unwrap();
                self.pos += ch.len_utf8();
                Some(ch)
            }
            Err(e) => {
                if e.valid_up_to() > 0 {
                    let s = std::str::from_utf8(&remaining[..e.valid_up_to()]).unwrap();
                    let ch = s.chars().next().unwrap();
                    self.pos += ch.len_utf8();
                    Some(ch)
                } else {
                    self.pos += e.error_len().unwrap_or(1);
                    Some('\u{FFFD}')
                }
            }
        }
    }
}

/// Mede visual col de um prefixo de linha com tabs/wide
pub fn measure_visual_col(line: &str, grapheme_up_to: usize, tab_width: usize) -> usize {
    let mut col = 0usize;
    let mut g = 0usize;
    for ch in line.chars() {
        if g >= grapheme_up_to { break; }
        if ch == '\t' { col = (col / tab_width + 1) * tab_width; }
        else { col += char_width(ch); }
        g += 1;
    }
    col
}

/// Converte logical -> visual com wrap opcional
pub fn logical_to_visual(text: &str, logical: Logical, cfg: &MeasurementConfig) -> Visual {
    let lines: Vec<&str> = text.split('\n').collect();
    if logical.line >= lines.len() { return Visual { row: logical.line, col: logical.grapheme }; }
    let mut row = 0usize;
    for i in 0..logical.line {
        let w = visual_rows_for_line(lines[i], cfg);
        row += w;
    }
    let line = lines[logical.line];
    let col = measure_visual_col(line, logical.grapheme, cfg.tab_width);
    if let Some(wrap) = cfg.wrap_col {
        row += col / wrap;
        Visual { row, col: col % wrap }
    } else {
        Visual { row, col }
    }
}

fn visual_rows_for_line(line: &str, cfg: &MeasurementConfig) -> usize {
    if let Some(wrap) = cfg.wrap_col {
        let width = line.chars().fold(0usize, |acc, ch| {
            if ch == '\t' { (acc / cfg.tab_width + 1) * cfg.tab_width } else { acc + char_width(ch) }
        });
        ((width + wrap - 1) / wrap).max(1)
    } else { 1 }
}

/// Navega por offsets absolutos -> logical (linha/grapheme)
pub fn offset_to_logical(text: &str, offset: usize) -> Logical {
    let bytes = text.as_bytes();
    let offset = offset.min(bytes.len());
    let prefix = &text[..offset.min(text.len())];
    let line = prefix.chars().filter(|&c| c == '\n').count();
    let grapheme = prefix.rsplit('\n').next().map(|l| l.chars().count()).unwrap_or(0);
    Logical { line, grapheme }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn wide_char_width() {
        assert_eq!(char_width('a'), 1);
        assert_eq!(char_width('中'), 2);
    assert_eq!(char_width('\u{1F600}'), 2);
    }
    #[test]
    fn utf8_recovery() {
        let bytes = [0xFF, b'a'];
        let chars: Vec<char> = Utf8Chars::new(&bytes).collect();
        assert_eq!(chars[0], '\u{FFFD}');
        assert_eq!(chars[1], 'a');
    }
    #[test]
    fn visual_with_tab() {
        assert_eq!(measure_visual_col("a\tb", 2, 4), 4);
    }
    #[test]
    fn wrap_row() {
        let cfg = MeasurementConfig { tab_width: 4, wrap_col: Some(4) };
        let v = logical_to_visual("abcdefgh", Logical { line: 0, grapheme: 6 }, &cfg);
        assert_eq!(v.row, 1);
        assert_eq!(v.col, 2);
    }
}
