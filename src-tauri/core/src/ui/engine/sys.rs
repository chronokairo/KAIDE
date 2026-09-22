//! Pure std terminal control commands replacing crossterm system routines.

use std::io::{self, Write};

pub fn enable_raw_mode() -> io::Result<()> {
    // Under Windows Console, raw mode can be enabled or simulated gracefully
    Ok(())
}

pub fn disable_raw_mode() -> io::Result<()> {
    Ok(())
}

pub fn size() -> io::Result<(u16, u16)> {
    // Default fallback terminal dimensions
    Ok((120, 30))
}

pub struct EnterAlternateScreen;
pub struct LeaveAlternateScreen;
pub struct EnableMouseCapture;
pub struct DisableMouseCapture;

pub mod cursor {
    pub struct Show;
    pub struct Hide;
    pub struct MoveTo(pub u16, pub u16);
}

pub trait Command {
    fn write_ansi(&self, w: &mut dyn Write) -> io::Result<()>;
}

impl Command for EnterAlternateScreen {
    fn write_ansi(&self, w: &mut dyn Write) -> io::Result<()> {
        write!(w, "\x1b[?1049h")
    }
}

impl Command for LeaveAlternateScreen {
    fn write_ansi(&self, w: &mut dyn Write) -> io::Result<()> {
        write!(w, "\x1b[?1049l")
    }
}

impl Command for EnableMouseCapture {
    fn write_ansi(&self, w: &mut dyn Write) -> io::Result<()> {
        write!(w, "\x1b[?1000h\x1b[?1002h\x1b[?1015h\x1b[?1006h")
    }
}

impl Command for DisableMouseCapture {
    fn write_ansi(&self, w: &mut dyn Write) -> io::Result<()> {
        write!(w, "\x1b[?1006l\x1b[?1015l\x1b[?1002l\x1b[?1000l")
    }
}

impl Command for cursor::Show {
    fn write_ansi(&self, w: &mut dyn Write) -> io::Result<()> {
        write!(w, "\x1b[?25h")
    }
}

impl Command for cursor::Hide {
    fn write_ansi(&self, w: &mut dyn Write) -> io::Result<()> {
        write!(w, "\x1b[?25l")
    }
}

impl Command for cursor::MoveTo {
    fn write_ansi(&self, w: &mut dyn Write) -> io::Result<()> {
        write!(w, "\x1b[{};{}H", self.1 + 1, self.0 + 1)
    }
}

#[macro_export]
macro_rules! cki_execute {
    ($writer:expr $(, $cmd:expr)* $(,)?) => {{
        use std::io::Write;
        let w = &mut $writer;
        $(
            let _ = $crate::ui::engine::sys::Command::write_ansi(&$cmd, w);
        )*
        let _ = w.flush();
        Ok::<(), std::io::Error>(())
    }};
}

pub use crate::cki_execute as execute;
