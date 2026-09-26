//! Pure std terminal event models and raw-mode input parser.

use std::time::Duration;
use std::collections::VecDeque;

pub use super::sys::{DisableMouseCapture, EnableMouseCapture};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum KeyCode {
    Char(char),
    Enter,
    Esc,
    Backspace,
    Left,
    Right,
    Up,
    Down,
    Home,
    End,
    PageUp,
    PageDown,
    Tab,
    BackTab,
    Delete,
    F(u8),
    Null,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct KeyModifiers(pub u8);

impl KeyModifiers {
    pub const NONE: KeyModifiers = KeyModifiers(0);
    pub const SHIFT: KeyModifiers = KeyModifiers(1);
    pub const CONTROL: KeyModifiers = KeyModifiers(2);
    pub const ALT: KeyModifiers = KeyModifiers(4);

    pub fn contains(&self, other: KeyModifiers) -> bool {
        (self.0 & other.0) == other.0
    }
}

impl std::ops::BitOr for KeyModifiers {
    type Output = Self;
    fn bitor(self, rhs: Self) -> Self {
        KeyModifiers(self.0 | rhs.0)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum KeyEventKind {
    Press,
    Release,
    Repeat,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct KeyEventState(pub u8);

impl KeyEventState {
    pub const NONE: KeyEventState = KeyEventState(0);
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct KeyEvent {
    pub code: KeyCode,
    pub modifiers: KeyModifiers,
    pub kind: KeyEventKind,
    pub state: KeyEventState,
}

impl KeyEvent {
    pub const fn new(code: KeyCode, modifiers: KeyModifiers) -> Self {
        Self {
            code,
            modifiers,
            kind: KeyEventKind::Press,
            state: KeyEventState::NONE,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MouseButton {
    Left,
    Right,
    Middle,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MouseEventKind {
    Down(MouseButton),
    Up(MouseButton),
    Drag(MouseButton),
    Moved,
    ScrollDown,
    ScrollUp,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct MouseEvent {
    pub kind: MouseEventKind,
    pub column: u16,
    pub row: u16,
    pub modifiers: KeyModifiers,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Event {
    Key(KeyEvent),
    /// A complete bracketed paste payload, already stripped of terminal
    /// markers. Kept as a distinct event so the TUI can apply one bounded
    /// edit instead of processing thousands of keypresses.
    Paste(String),
    Mouse(MouseEvent),
    Resize(u16, u16),
}

pub const BRACKETED_PASTE_START: &[u8] = b"\x1b[200~";
pub const BRACKETED_PASTE_END: &[u8] = b"\x1b[201~";

/// Parse one complete bracketed-paste frame from a byte buffer.
/// Returns the decoded UTF-8 payload and bytes consumed, or `None` when the
/// buffer does not contain a complete frame.
pub fn parse_bracketed_paste(input: &[u8]) -> Option<(String, usize)> {
    if !input.starts_with(BRACKETED_PASTE_START) {
        return None;
    }
    let payload_start = BRACKETED_PASTE_START.len();
    let end = input[payload_start..]
        .windows(BRACKETED_PASTE_END.len())
        .position(|window| window == BRACKETED_PASTE_END)?
        + payload_start;
    let payload = String::from_utf8_lossy(&input[payload_start..end]).into_owned();
    Some((payload, end + BRACKETED_PASTE_END.len()))
}

/// Incremental byte decoder used by the input thread. It retains incomplete
/// bracketed-paste frames between reads, so a paste split across OS reads is
/// still delivered as one `Event::Paste`.
#[derive(Default)]
pub struct InputDecoder {
    pending: Vec<u8>,
    events: VecDeque<Event>,
}

fn parse_sgr_mouse(bytes: &[u8]) -> Option<(Event, usize)> {
    if !bytes.starts_with(b"\x1b[<") {
        return None;
    }
    let end_idx = bytes[3..].iter().position(|&b| b == b'M' || b == b'm')? + 3;
    let final_byte = bytes[end_idx];
    let payload = std::str::from_utf8(&bytes[3..end_idx]).ok()?;
    let parts: Vec<&str> = payload.split(';').collect();
    if parts.len() != 3 {
        return None;
    }
    let btn: u16 = parts[0].parse().ok()?;
    let col: u16 = parts[1].parse().ok()?;
    let row: u16 = parts[2].parse().ok()?;

    let column = col.saturating_sub(1);
    let row = row.saturating_sub(1);

    let mut modifiers = KeyModifiers::NONE;
    if (btn & 4) != 0 {
        modifiers = modifiers | KeyModifiers::SHIFT;
    }
    if (btn & 8) != 0 {
        modifiers = modifiers | KeyModifiers::ALT;
    }
    if (btn & 16) != 0 {
        modifiers = modifiers | KeyModifiers::CONTROL;
    }

    let kind = if (btn & 64) != 0 {
        if (btn & 1) != 0 {
            MouseEventKind::ScrollDown
        } else {
            MouseEventKind::ScrollUp
        }
    } else if final_byte == b'm' {
        let b = match btn & 3 {
            0 => MouseButton::Left,
            1 => MouseButton::Middle,
            2 => MouseButton::Right,
            _ => MouseButton::Left,
        };
        MouseEventKind::Up(b)
    } else if (btn & 32) != 0 {
        match btn & 3 {
            0 => MouseEventKind::Drag(MouseButton::Left),
            1 => MouseEventKind::Drag(MouseButton::Middle),
            2 => MouseEventKind::Drag(MouseButton::Right),
            _ => MouseEventKind::Moved,
        }
    } else {
        let b = match btn & 3 {
            0 => MouseButton::Left,
            1 => MouseButton::Middle,
            2 => MouseButton::Right,
            _ => MouseButton::Left,
        };
        MouseEventKind::Down(b)
    };

    Some((
        Event::Mouse(MouseEvent {
            kind,
            column,
            row,
            modifiers,
        }),
        end_idx + 1,
    ))
}

fn parse_x10_mouse(bytes: &[u8]) -> Option<(Event, usize)> {
    if !bytes.starts_with(b"\x1b[M") || bytes.len() < 6 {
        return None;
    }
    let cb = bytes[3].saturating_sub(32);
    let cx = (bytes[4].saturating_sub(32)).saturating_sub(1) as u16;
    let cy = (bytes[5].saturating_sub(32)).saturating_sub(1) as u16;

    let mut modifiers = KeyModifiers::NONE;
    if (cb & 4) != 0 {
        modifiers = modifiers | KeyModifiers::SHIFT;
    }
    if (cb & 8) != 0 {
        modifiers = modifiers | KeyModifiers::ALT;
    }
    if (cb & 16) != 0 {
        modifiers = modifiers | KeyModifiers::CONTROL;
    }

    let kind = if (cb & 64) != 0 {
        if (cb & 1) != 0 {
            MouseEventKind::ScrollDown
        } else {
            MouseEventKind::ScrollUp
        }
    } else if (cb & 3) == 3 {
        MouseEventKind::Up(MouseButton::Left)
    } else {
        let b = match cb & 3 {
            0 => MouseButton::Left,
            1 => MouseButton::Middle,
            2 => MouseButton::Right,
            _ => MouseButton::Left,
        };
        MouseEventKind::Down(b)
    };

    Some((
        Event::Mouse(MouseEvent {
            kind,
            column: cx,
            row: cy,
            modifiers,
        }),
        6,
    ))
}

fn parse_escape_sequence(bytes: &[u8]) -> Option<(Event, usize)> {
    if bytes.len() < 2 || bytes[0] != 27 {
        return None;
    }
    match bytes[1] {
        b'[' => {
            if bytes.starts_with(b"\x1b[<") {
                if let Some(res) = parse_sgr_mouse(bytes) {
                    return Some(res);
                }
            }
            if bytes.starts_with(b"\x1b[M") {
                if let Some(res) = parse_x10_mouse(bytes) {
                    return Some(res);
                }
            }
            if bytes.len() >= 6 && &bytes[..6] == b"\x1b[1;5A" {
                return Some((Event::Key(KeyEvent::new(KeyCode::Up, KeyModifiers::CONTROL)), 6));
            }
            if bytes.len() >= 6 && &bytes[..6] == b"\x1b[1;5B" {
                return Some((Event::Key(KeyEvent::new(KeyCode::Down, KeyModifiers::CONTROL)), 6));
            }
            if bytes.len() >= 6 && &bytes[..6] == b"\x1b[1;5C" {
                return Some((Event::Key(KeyEvent::new(KeyCode::Right, KeyModifiers::CONTROL)), 6));
            }
            if bytes.len() >= 6 && &bytes[..6] == b"\x1b[1;5D" {
                return Some((Event::Key(KeyEvent::new(KeyCode::Left, KeyModifiers::CONTROL)), 6));
            }
            if bytes.len() >= 4 {
                match &bytes[..4] {
                    b"\x1b[1~" => return Some((Event::Key(KeyEvent::new(KeyCode::Home, KeyModifiers::NONE)), 4)),
                    b"\x1b[3~" => return Some((Event::Key(KeyEvent::new(KeyCode::Delete, KeyModifiers::NONE)), 4)),
                    b"\x1b[4~" => return Some((Event::Key(KeyEvent::new(KeyCode::End, KeyModifiers::NONE)), 4)),
                    b"\x1b[5~" => return Some((Event::Key(KeyEvent::new(KeyCode::PageUp, KeyModifiers::NONE)), 4)),
                    b"\x1b[6~" => return Some((Event::Key(KeyEvent::new(KeyCode::PageDown, KeyModifiers::NONE)), 4)),
                    _ => {}
                }
            }
            if bytes.len() >= 3 {
                match bytes[2] {
                    b'A' => return Some((Event::Key(KeyEvent::new(KeyCode::Up, KeyModifiers::NONE)), 3)),
                    b'B' => return Some((Event::Key(KeyEvent::new(KeyCode::Down, KeyModifiers::NONE)), 3)),
                    b'C' => return Some((Event::Key(KeyEvent::new(KeyCode::Right, KeyModifiers::NONE)), 3)),
                    b'D' => return Some((Event::Key(KeyEvent::new(KeyCode::Left, KeyModifiers::NONE)), 3)),
                    b'H' => return Some((Event::Key(KeyEvent::new(KeyCode::Home, KeyModifiers::NONE)), 3)),
                    b'F' => return Some((Event::Key(KeyEvent::new(KeyCode::End, KeyModifiers::NONE)), 3)),
                    b'Z' => return Some((Event::Key(KeyEvent::new(KeyCode::BackTab, KeyModifiers::SHIFT)), 3)),
                    _ => {}
                }
            }
            None
        }
        b'O' => {
            if bytes.len() >= 3 {
                match bytes[2] {
                    b'P' => return Some((Event::Key(KeyEvent::new(KeyCode::F(1), KeyModifiers::NONE)), 3)),
                    b'Q' => return Some((Event::Key(KeyEvent::new(KeyCode::F(2), KeyModifiers::NONE)), 3)),
                    b'R' => return Some((Event::Key(KeyEvent::new(KeyCode::F(3), KeyModifiers::NONE)), 3)),
                    b'S' => return Some((Event::Key(KeyEvent::new(KeyCode::F(4), KeyModifiers::NONE)), 3)),
                    _ => None,
                }
            } else {
                None
            }
        }
        _ => None,
    }
}

impl InputDecoder {
    pub fn feed(&mut self, bytes: &[u8]) {
        self.pending.extend_from_slice(bytes);
        loop {
            if self.pending.is_empty() {
                break;
            }
            if self.pending.starts_with(BRACKETED_PASTE_START) {
                let Some((text, consumed)) = parse_bracketed_paste(&self.pending) else {
                    break;
                };
                self.pending.drain(..consumed);
                self.events.push_back(Event::Paste(text));
                continue;
            }
            // Check for escape sequences
            if self.pending[0] == 27 {
                if self.pending.len() == 1 {
                    self.pending.clear();
                    self.events.push_back(Event::Key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE)));
                    break;
                }
                if let Some((event, consumed)) = parse_escape_sequence(&self.pending) {
                    self.pending.drain(..consumed);
                    self.events.push_back(event);
                    continue;
                }
                if self.pending[1] == b'[' {
                    // Check if final byte (0x40..=0x7E) has arrived for this CSI sequence
                    let has_final = self.pending[2..].iter().any(|&b| b >= 0x40 && b <= 0x7E);
                    if !has_final && self.pending.len() < 32 {
                        // Incomplete CSI sequence, wait for remaining bytes from stdin
                        break;
                    }
                    // Complete but unhandled CSI sequence. Drain the whole sequence so
                    // raw numbers/delimiters NEVER leak into text typing.
                    let consume_len = if let Some(pos) = self.pending[2..].iter().position(|&b| b >= 0x40 && b <= 0x7E) {
                        2 + pos + 1
                    } else {
                        self.pending.len()
                    };
                    self.pending.drain(..consume_len);
                    continue;
                }
                self.pending.remove(0);
                self.events.push_back(Event::Key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE)));
                continue;
            }
            // Multi-byte UTF-8
            if self.pending[0] >= 0x80 {
                let needed = match self.pending[0] {
                    0b1100_0000..=0b1101_1111 => 2,
                    0b1110_0000..=0b1110_1111 => 3,
                    0b1111_0000..=0b1111_0111 => 4,
                    _ => 1,
                };
                if self.pending.len() < needed {
                    break;
                }
                let slice = &self.pending[..needed];
                if let Ok(s) = std::str::from_utf8(slice) {
                    if let Some(ch) = s.chars().next() {
                        self.pending.drain(..needed);
                        self.events.push_back(Event::Key(KeyEvent::new(KeyCode::Char(ch), KeyModifiers::NONE)));
                        continue;
                    }
                }
                self.pending.remove(0);
                continue;
            }
            let byte = self.pending.remove(0);
            self.events.push_back(byte_to_event(byte));
        }
    }

    pub fn pop(&mut self) -> Option<Event> {
        self.events.pop_front()
    }
}

fn byte_to_event(byte: u8) -> Event {
    match byte {
        b'\r' | b'\n' => Event::Key(KeyEvent::new(KeyCode::Enter, KeyModifiers::NONE)),
        b'\t' => Event::Key(KeyEvent::new(KeyCode::Tab, KeyModifiers::NONE)),
        27 => Event::Key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE)),
        127 | 8 => Event::Key(KeyEvent::new(KeyCode::Backspace, KeyModifiers::NONE)),
        b if b < 32 => {
            let ch = (b + b'a' - 1) as char;
            Event::Key(KeyEvent::new(KeyCode::Char(ch), KeyModifiers::CONTROL))
        }
        b => Event::Key(KeyEvent::new(KeyCode::Char(b as char), KeyModifiers::NONE)),
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_bracketed_paste, InputDecoder, Event, KeyCode, BRACKETED_PASTE_END, BRACKETED_PASTE_START};

    #[test]
    fn bracketed_paste_parser_handles_multiline_unicode() {
        let mut frame = BRACKETED_PASTE_START.to_vec();
        frame.extend_from_slice("one\nÎ²eta".as_bytes());
        frame.extend_from_slice(BRACKETED_PASTE_END);
        let (text, consumed) = parse_bracketed_paste(&frame).unwrap();
        assert_eq!(text, "one\nÎ²eta");
        assert_eq!(consumed, frame.len());
    }

    #[test]
    fn bracketed_paste_parser_waits_for_end_marker() {
        assert!(parse_bracketed_paste(BRACKETED_PASTE_START).is_none());
    }

    #[test]
    fn incremental_decoder_handles_frame_split_across_reads() {
        let mut decoder = InputDecoder::default();
        decoder.feed(BRACKETED_PASTE_START);
        assert!(decoder.pop().is_none());
        decoder.feed(b"large\n");
        assert!(decoder.pop().is_none());
        decoder.feed(BRACKETED_PASTE_END);
        assert!(matches!(decoder.pop(), Some(Event::Paste(text)) if text == "large\n"));
    }

    #[test]
    fn incremental_decoder_keeps_regular_keys() {
        let mut decoder = InputDecoder::default();
        decoder.feed(b"ab\n");
        assert!(matches!(decoder.pop(), Some(Event::Key(key)) if key.code == KeyCode::Char('a')));
        assert!(matches!(decoder.pop(), Some(Event::Key(key)) if key.code == KeyCode::Char('b')));
        assert!(matches!(decoder.pop(), Some(Event::Key(key)) if key.code == KeyCode::Enter));
    }

    #[test]
    fn incremental_decoder_handles_arrow_and_escape_sequences() {
        let mut decoder = InputDecoder::default();
        // Up arrow \x1b[A, Down \x1b[B, Home \x1b[H, End \x1b[F, BackTab \x1b[Z, Delete \x1b[3~
        decoder.feed(b"\x1b[A\x1b[B\x1b[H\x1b[F\x1b[Z\x1b[3~");
        assert!(matches!(decoder.pop(), Some(Event::Key(key)) if key.code == KeyCode::Up));
        assert!(matches!(decoder.pop(), Some(Event::Key(key)) if key.code == KeyCode::Down));
        assert!(matches!(decoder.pop(), Some(Event::Key(key)) if key.code == KeyCode::Home));
        assert!(matches!(decoder.pop(), Some(Event::Key(key)) if key.code == KeyCode::End));
        assert!(matches!(decoder.pop(), Some(Event::Key(key)) if key.code == KeyCode::BackTab));
        assert!(matches!(decoder.pop(), Some(Event::Key(key)) if key.code == KeyCode::Delete));
        assert!(decoder.pop().is_none());
    }

    #[test]
    fn incremental_decoder_handles_multibyte_utf8() {
        let mut decoder = InputDecoder::default();
        // 'ç' in UTF-8 is 0xC3 0xA7; 'ã' is 0xC3 0xA3
        decoder.feed("código: çã".as_bytes());
        let mut chars = Vec::new();
        while let Some(Event::Key(key)) = decoder.pop() {
            if let KeyCode::Char(c) = key.code {
                chars.push(c);
            }
        }
        let s: String = chars.into_iter().collect();
        assert_eq!(s, "código: çã");
    }

    #[test]
    fn incremental_decoder_handles_sgr_mouse_click_and_scroll() {
        let mut decoder = InputDecoder::default();
        // Left click down at col 35, row 12 (1-based: 36, 13)
        decoder.feed(b"\x1b[<0;36;13M");
        let ev = decoder.pop().unwrap();
        match ev {
            Event::Mouse(m) => {
                assert_eq!(m.kind, super::MouseEventKind::Down(super::MouseButton::Left));
                assert_eq!(m.column, 35);
                assert_eq!(m.row, 12);
            }
            _ => panic!("expected mouse event"),
        }

        // Left release
        decoder.feed(b"\x1b[<0;36;13m");
        let ev = decoder.pop().unwrap();
        match ev {
            Event::Mouse(m) => {
                assert_eq!(m.kind, super::MouseEventKind::Up(super::MouseButton::Left));
                assert_eq!(m.column, 35);
                assert_eq!(m.row, 12);
            }
            _ => panic!("expected mouse event"),
        }

        // Scroll up at col 20, row 5
        decoder.feed(b"\x1b[<64;21;6M");
        let ev = decoder.pop().unwrap();
        match ev {
            Event::Mouse(m) => {
                assert_eq!(m.kind, super::MouseEventKind::ScrollUp);
                assert_eq!(m.column, 20);
                assert_eq!(m.row, 5);
            }
            _ => panic!("expected mouse event"),
        }
    }

    #[test]
    fn incremental_decoder_drains_unhandled_csi_without_leaking_characters() {
        let mut decoder = InputDecoder::default();
        // Cursor report \x1b[12;34R followed by normal typing 'abc'
        decoder.feed(b"\x1b[12;34Rabc");
        // '12;34R' must NOT be leaked into characters!
        assert!(matches!(decoder.pop(), Some(Event::Key(k)) if k.code == KeyCode::Char('a')));
        assert!(matches!(decoder.pop(), Some(Event::Key(k)) if k.code == KeyCode::Char('b')));
        assert!(matches!(decoder.pop(), Some(Event::Key(k)) if k.code == KeyCode::Char('c')));
        assert!(decoder.pop().is_none());
    }
}

pub fn poll(_timeout: Duration) -> std::io::Result<bool> {
    Ok(false)
}

pub fn read() -> std::io::Result<Event> {
    use std::io::Read;
    thread_local! {
        static DECODER: std::cell::RefCell<InputDecoder> =
            std::cell::RefCell::new(InputDecoder::default());
    }
    loop {
        if let Some(event) = DECODER.with(|decoder| decoder.borrow_mut().pop()) {
            return Ok(event);
        }
        let mut stdin = std::io::stdin();
        let mut bytes = [0u8; 256];
        let n = stdin.read(&mut bytes)?;
        if n == 0 {
            return Ok(Event::Key(KeyEvent::new(KeyCode::Null, KeyModifiers::NONE)));
        }
        DECODER.with(|decoder| decoder.borrow_mut().feed(&bytes[..n]));
    }
}
