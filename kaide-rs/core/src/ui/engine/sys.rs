//! Pure std terminal control commands replacing crossterm system routines.

use std::io::{self, Write};

#[cfg(unix)]
static ORIG_TERMIOS: std::sync::Mutex<Option<libc::termios>> = std::sync::Mutex::new(None);

#[cfg(unix)]
pub fn enable_raw_mode() -> io::Result<()> {
    unsafe {
        let fd = libc::STDIN_FILENO;
        if libc::isatty(fd) == 0 {
            return Ok(());
        }
        let mut termios = std::mem::MaybeUninit::<libc::termios>::uninit();
        if libc::tcgetattr(fd, termios.as_mut_ptr()) != 0 {
            return Err(io::Error::last_os_error());
        }
        let orig = termios.assume_init();
        let mut raw = orig;

        raw.c_iflag &= !(libc::BRKINT | libc::ICRNL | libc::INPCK | libc::ISTRIP | libc::IXON);
        raw.c_oflag &= !(libc::OPOST);
        raw.c_cflag |= libc::CS8;
        raw.c_lflag &= !(libc::ECHO | libc::ICANON | libc::IEXTEN | libc::ISIG);
        raw.c_cc[libc::VMIN] = 1;
        raw.c_cc[libc::VTIME] = 0;

        if libc::tcsetattr(fd, libc::TCSANOW, &raw) != 0 {
            return Err(io::Error::last_os_error());
        }

        if let Ok(mut lock) = ORIG_TERMIOS.lock() {
            if lock.is_none() {
                *lock = Some(orig);
            }
        }
        Ok(())
    }
}

#[cfg(unix)]
pub fn disable_raw_mode() -> io::Result<()> {
    unsafe {
        let fd = libc::STDIN_FILENO;
        if let Ok(mut lock) = ORIG_TERMIOS.lock() {
            if let Some(orig) = lock.take() {
                if libc::tcsetattr(fd, libc::TCSANOW, &orig) != 0 {
                    return Err(io::Error::last_os_error());
                }
            }
        }
        Ok(())
    }
}

#[cfg(unix)]
pub fn size() -> io::Result<(u16, u16)> {
    unsafe {
        let mut winsz: libc::winsize = std::mem::zeroed();
        let ret = libc::ioctl(libc::STDOUT_FILENO, libc::TIOCGWINSZ, &mut winsz);
        if ret == 0 && winsz.ws_col > 0 && winsz.ws_row > 0 {
            return Ok((winsz.ws_col, winsz.ws_row));
        }
    }
    if let (Ok(width), Ok(height)) = (std::env::var("COLUMNS"), std::env::var("LINES")) {
        if let (Ok(width), Ok(height)) = (width.parse::<u16>(), height.parse::<u16>()) {
            return Ok((width.max(1), height.max(1)));
        }
    }
    Ok((120, 30))
}

#[cfg(not(unix))]
pub fn enable_raw_mode() -> io::Result<()> {
    Ok(())
}

#[cfg(not(unix))]
pub fn disable_raw_mode() -> io::Result<()> {
    Ok(())
}

#[cfg(not(unix))]
pub fn size() -> io::Result<(u16, u16)> {
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
