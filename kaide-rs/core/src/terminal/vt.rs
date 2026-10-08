//! VT sequence parser — inspirado em `microsoft/edit` `crates/edit/src/vt.rs`.
//! Decodifica bytes crus do PTY em tokens semânticos (C0, CSI, OSC, mouse SGR).
//! Zero-Lib: apenas `std`.

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VtToken {
    Char(char),
    C0(u8),
    Csi { params: Vec<u16>, intermediates: Vec<u8>, final_byte: u8 },
    Osc { data: Vec<u8> },
    Esc { byte: u8 },
    Utf8Error,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum InputEvent {
    Char(char),
    Enter,
    Backspace,
    Tab,
    Escape,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Home,
    End,
    PageUp,
    PageDown,
    Delete,
    Insert,
    F(u8),
    Mouse { col: u16, row: u16, button: MouseButton, pressed: bool },
    Resize { cols: u16, rows: u16 },
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MouseButton { Left, Middle, Right, WheelUp, WheelDown, None }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Modifiers { pub ctrl: bool, pub alt: bool, pub shift: bool }

/// Stateful VT parser — alimenta com bytes, consome tokens.
pub struct VtParser {
    state: ParseState,
    params: Vec<u16>,
    current_param: Option<u16>,
    intermediates: Vec<u8>,
    osc_buf: Vec<u8>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ParseState { Ground, Escape, Csi, Osc, OscEsc }

impl Default for VtParser {
    fn default() -> Self { Self::new() }
}

impl VtParser {
    pub fn new() -> Self {
        Self { state: ParseState::Ground, params: Vec::new(), current_param: None, intermediates: Vec::new(), osc_buf: Vec::new() }
    }

    pub fn feed(&mut self, bytes: &[u8]) -> Vec<VtToken> {
        let mut out = Vec::new();
        let mut i = 0;
        while i < bytes.len() {
            let b = bytes[i];
            match self.state {
                ParseState::Ground => {
                    if b == 0x1B { self.state = ParseState::Escape; }
                    else if b < 0x20 { out.push(VtToken::C0(b)); }
                    else if b == 0x7F { out.push(VtToken::C0(b)); }
                    else {
                        // utf8 char
                        let remaining = &bytes[i..];
                        match std::str::from_utf8(remaining) {
                            Ok(s) => {
                                if let Some(ch) = s.chars().next() {
                                    out.push(VtToken::Char(ch));
                                    i += ch.len_utf8() - 1;
                                }
                            }
                            Err(e) => {
                                let valid_up_to = e.valid_up_to();
                                if valid_up_to > 0 {
                                    let s = std::str::from_utf8(&remaining[..valid_up_to]).unwrap();
                                    for ch in s.chars() { out.push(VtToken::Char(ch)); }
                                    i += valid_up_to - 1;
                                } else if let Some(len) = e.error_len() {
                                    out.push(VtToken::Utf8Error);
                                    i += len - 1;
                                } else {
                                    break; // incomplete sequence, wait for more bytes
                                }
                            }
                        }
                    }
                }
                ParseState::Escape => {
                    match b {
                        b'[' => { self.state = ParseState::Csi; self.params.clear(); self.current_param = None; self.intermediates.clear(); }
                        b']' => { self.state = ParseState::Osc; self.osc_buf.clear(); }
                        0x1B => { /* stay in escape */ }
                        _ => {
                            out.push(VtToken::Esc { byte: b });
                            self.state = ParseState::Ground;
                        }
                    }
                }
                ParseState::Csi => {
                    match b {
                        0x30..=0x39 => {
                            let d = (b - b'0') as u16;
                            self.current_param = Some(self.current_param.unwrap_or(0) * 10 + d);
                        }
                        b';' => {
                            self.params.push(self.current_param.unwrap_or(0));
                            self.current_param = None;
                        }
                        // '<', '?', '>' são prefixos private-mode (SGR mouse: ESC [ < ... M)
                        // 0x3C = '<', 0x3E = '>', 0x3F = '?'
                        b'<' | b'?' | b'>' | 0x20..=0x2F => self.intermediates.push(b),
                        0x40..=0x7E => {
                            if let Some(p) = self.current_param.take() { self.params.push(p); }
                            out.push(VtToken::Csi { params: std::mem::take(&mut self.params), intermediates: std::mem::take(&mut self.intermediates), final_byte: b });
                            self.state = ParseState::Ground;
                        }
                        _ => { self.state = ParseState::Ground; }
                    }
                }
                ParseState::Osc => {
                    if b == 0x1B { self.state = ParseState::OscEsc; }
                    else if b == 0x07 { out.push(VtToken::Osc { data: std::mem::take(&mut self.osc_buf) }); self.state = ParseState::Ground; }
                    else { self.osc_buf.push(b); }
                }
                ParseState::OscEsc => {
                    if b == b'\\' { out.push(VtToken::Osc { data: std::mem::take(&mut self.osc_buf) }); self.state = ParseState::Ground; }
                    else { self.osc_buf.push(0x1B); self.osc_buf.push(b); self.state = ParseState::Osc; }
                }
            }
            i += 1;
        }
        out
    }

    /// Mapeia tokens para eventos semânticos de alto nível (similar a `edit/src/input.rs`).
    pub fn map_input(tokens: &[VtToken]) -> Vec<(InputEvent, Modifiers)> {
        let mut events = Vec::new();
        for tok in tokens {
            let (ev, mods) = match tok {
                VtToken::Char(c) => (InputEvent::Char(*c), Modifiers { ctrl: false, alt: false, shift: false }),
                VtToken::C0(0x0D) | VtToken::C0(0x0A) => (InputEvent::Enter, Modifiers { ctrl: false, alt: false, shift: false }),
                VtToken::C0(0x09) => (InputEvent::Tab, Modifiers { ctrl: false, alt: false, shift: false }),
                VtToken::C0(0x08) | VtToken::C0(0x7F) => (InputEvent::Backspace, Modifiers { ctrl: false, alt: false, shift: false }),
                VtToken::C0(0x1B) => (InputEvent::Escape, Modifiers { ctrl: false, alt: false, shift: false }),
                VtToken::Esc { byte: _ } => (InputEvent::Escape, Modifiers { ctrl: false, alt: false, shift: false }),
                VtToken::Csi { params, intermediates: _, final_byte } => {
                    let ev = match final_byte {
                        b'A' => InputEvent::ArrowUp,
                        b'B' => InputEvent::ArrowDown,
                        b'C' => InputEvent::ArrowRight,
                        b'D' => InputEvent::ArrowLeft,
                        b'H' => InputEvent::Home,
                        b'F' => InputEvent::End,
                        b'~' => {
                            match params.first().copied().unwrap_or(1) {
                                1 => InputEvent::Home,
                                2 => InputEvent::Insert,
                                3 => InputEvent::Delete,
                                4 => InputEvent::End,
                                5 => InputEvent::PageUp,
                                6 => InputEvent::PageDown,
                                11..=15 => InputEvent::F((params[0] - 11) as u8 + 1),
                                17..=21 => InputEvent::F((params[0] - 17) as u8 + 6),
                                23..=24 => InputEvent::F((params[0] - 23) as u8 + 11),
                                _ => InputEvent::Unknown,
                            }
                        }
                        b'M' | b'm' => {
                            // SGR mouse — params: button, col, row
                            if params.len() >= 3 {
                                let btn_code = params[0] & 0b11;
                                let button = match btn_code { 0 => MouseButton::Left, 1 => MouseButton::Middle, 2 => MouseButton::Right, _ => MouseButton::None };
                                let pressed = *final_byte == b'M';
                                InputEvent::Mouse { col: params[1], row: params[2], button, pressed }
                            } else { InputEvent::Unknown }
                        }
                        _ => InputEvent::Unknown,
                    };
                    (ev, Modifiers { ctrl: false, alt: false, shift: false })
                }
                _ => (InputEvent::Unknown, Modifiers { ctrl: false, alt: false, shift: false }),
            };
            if ev != InputEvent::Unknown { events.push((ev, mods)); }
        }
        events
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ground_chars() {
        let mut p = VtParser::new();
        let toks = p.feed(b"hi");
        assert_eq!(toks, vec![VtToken::Char('h'), VtToken::Char('i')]);
    }
    #[test]
    fn csi_arrow() {
        let mut p = VtParser::new();
        let toks = p.feed(b"\x1b[A");
        assert!(matches!(toks[0], VtToken::Csi { final_byte: b'A', .. }));
        let mapped = VtParser::map_input(&toks);
        assert_eq!(mapped[0].0, InputEvent::ArrowUp);
    }
    #[test]
    fn mouse_sgr() {
        let mut p = VtParser::new();
        let toks = p.feed(b"\x1b[<0;10;20M");
        let mapped = VtParser::map_input(&toks);
        assert!(matches!(mapped[0].0, InputEvent::Mouse { col: 10, row: 20, .. }));
    }
}
