//! Word wrap + clipboard OSC52 — port de `microsoft/edit` Word Wrap Alt+Z e mouse/clipboard
//! Zero-lib: std only.

use crate::tools::unicode::char_width;

pub struct WrapConfig { pub enabled: bool, pub width: usize, pub tab_width: usize }

impl Default for WrapConfig {
    fn default() -> Self { Self { enabled: false, width: 80, tab_width: 4 } }
}

impl WrapConfig {
    pub fn toggle(&mut self) { self.enabled = !self.enabled; }
    pub fn wrap_line(&self, line: &str) -> Vec<String> {
        if !self.enabled { return vec![line.to_string()]; }
        let mut out = Vec::new();
        let mut cur = String::new();
        let mut col = 0usize;
        for ch in line.chars() {
            let w = if ch == '\t' { (col / self.tab_width + 1) * self.tab_width - col } else { char_width(ch) };
            if col + w > self.width && !cur.is_empty() {
                out.push(cur);
                cur = String::new();
                col = 0;
            }
            cur.push(ch);
            col += w;
        }
        out.push(cur);
        out
    }
}

/// Clipboard via OSC 52: ESC ] 52 ; c ; <base64> BEL — std base64 sem crate
pub fn osc52_copy(text: &str) -> Vec<u8> {
    let b64 = crate::base64::encode(text.as_bytes());
    format!("\x1b]52;c;{}\x07", b64).into_bytes()
}
pub fn osc52_paste(osc_data: &[u8]) -> Option<String> {
    // osc_data = "52;c;<b64>"
    let s = std::str::from_utf8(osc_data).ok()?;
    if !s.starts_with("52;c;") && !s.starts_with("52;") { return None; }
    let b64 = s.split(';').last()?;
    let bytes = crate::base64::decode(b64).ok()?;
    String::from_utf8(bytes).ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn wrap_toggle() {
        let mut cfg = WrapConfig { enabled: false, width: 4, tab_width: 4 };
        assert_eq!(cfg.wrap_line("abcdefgh").len(), 1);
        cfg.toggle();
        assert_eq!(cfg.wrap_line("abcdefgh").len(), 2);
    }
    #[test]
    fn osc52_roundtrip() {
        let data = osc52_copy("hello");
        assert!(data.starts_with(b"\x1b]52"));
        let inner = b"52;c;aGVsbG8=";
        assert_eq!(osc52_paste(inner).unwrap(), "hello");
    }
}
