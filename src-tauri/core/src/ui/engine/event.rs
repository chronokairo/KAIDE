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
            // Hold a possible prefix of the paste marker until the next read.
            if BRACKETED_PASTE_START.starts_with(&self.pending) {
                break;
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
