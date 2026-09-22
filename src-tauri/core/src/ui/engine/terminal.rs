//! Pure std Terminal and Frame implementations over Framebuffer and standard output.

use super::buffer::Buffer;
use super::framebuffer::Framebuffer;
use super::layout::Rect;
use super::widgets::{StatefulWidget, Widget};
use std::io::{self, Write};

pub trait Backend {
    fn size(&self) -> io::Result<Rect>;
    fn flush(&mut self) -> io::Result<()>;
    fn clear(&mut self) -> io::Result<()>;
    fn sync_buffer(&mut self, _buf: &Buffer) {}
}

pub struct TestBackend {
    pub width: u16,
    pub height: u16,
    pub buffer: Buffer,
}

impl TestBackend {
    pub fn new(width: u16, height: u16) -> Self {
        Self {
            width,
            height,
            buffer: Buffer::empty(Rect::new(0, 0, width, height)),
        }
    }

    pub fn buffer(&self) -> &Buffer {
        &self.buffer
    }

    pub fn buffer_mut(&mut self) -> &mut Buffer {
        &mut self.buffer
    }

    pub fn resize(&mut self, width: u16, height: u16) {
        self.width = width;
        self.height = height;
        self.buffer.resize(Rect::new(0, 0, width, height));
    }
}

impl Backend for TestBackend {
    fn size(&self) -> io::Result<Rect> {
        Ok(Rect::new(0, 0, self.width, self.height))
    }
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
    fn clear(&mut self) -> io::Result<()> {
        self.buffer = Buffer::empty(Rect::new(0, 0, self.width, self.height));
        Ok(())
    }
    fn sync_buffer(&mut self, buf: &Buffer) {
        self.buffer = buf.clone();
    }
}

impl Write for TestBackend {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        Ok(buf.len())
    }
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

pub struct CrosstermBackend<W: Write> {
    writer: W,
}

impl<W: Write> CrosstermBackend<W> {
    pub fn new(writer: W) -> Self {
        Self {
            writer,
        }
    }
}

impl<W: Write> Backend for CrosstermBackend<W> {
    fn size(&self) -> io::Result<Rect> {
        let (width, height) = terminal_dimensions();
        Ok(Rect::new(0, 0, width, height))
    }
    fn flush(&mut self) -> io::Result<()> {
        self.writer.flush()
    }
    fn clear(&mut self) -> io::Result<()> {
        write!(self.writer, "\x1b[2J\x1b[H")?;
        self.writer.flush()
    }
}

/// Query the active terminal viewport on every frame, matching Codex's
/// resize-safe rendering model. The fallback is used for redirected output
/// and headless test environments.
fn terminal_dimensions() -> (u16, u16) {
    #[cfg(windows)]
    {
        if let Some((width, height)) = windows_console_dimensions() {
            return (width.max(1), height.max(1));
        }
    }
    #[cfg(not(windows))]
    {
        if let (Ok(width), Ok(height)) = (std::env::var("COLUMNS"), std::env::var("LINES")) {
            if let (Ok(width), Ok(height)) = (width.parse::<u16>(), height.parse::<u16>()) {
                return (width.max(1), height.max(1));
            }
        }
    }
    (120, 30)
}

#[cfg(windows)]
fn windows_console_dimensions() -> Option<(u16, u16)> {
    #[repr(C)]
    struct Coord { x: i16, y: i16 }
    #[repr(C)]
    struct SmallRect { left: i16, top: i16, right: i16, bottom: i16 }
    #[repr(C)]
    struct ConsoleInfo {
        size: Coord,
        cursor: Coord,
        attributes: u16,
        window: SmallRect,
        maximum: Coord,
    }
    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn GetStdHandle(kind: u32) -> *mut std::ffi::c_void;
        fn GetConsoleScreenBufferInfo(handle: *mut std::ffi::c_void, info: *mut ConsoleInfo) -> i32;
    }
    let mut info = std::mem::MaybeUninit::<ConsoleInfo>::uninit();
    // STD_OUTPUT_HANDLE = -11. A failed call means stdout is redirected.
    let ok = unsafe { GetConsoleScreenBufferInfo(GetStdHandle(0xffff_fff5), info.as_mut_ptr()) } != 0;
    if !ok { return None; }
    let info = unsafe { info.assume_init() };
    let width = i32::from(info.window.right) - i32::from(info.window.left) + 1;
    let height = i32::from(info.window.bottom) - i32::from(info.window.top) + 1;
    if width > 0 && height > 0 && width <= i32::from(u16::MAX) && height <= i32::from(u16::MAX) {
        Some((width as u16, height as u16))
    } else { None }
}

impl<W: Write> Write for CrosstermBackend<W> {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.writer.write(buf)
    }
    fn flush(&mut self) -> io::Result<()> {
        self.writer.flush()
    }
}

pub struct Frame<'a> {
    pub area: Rect,
    pub buffer: &'a mut Buffer,
    pub cursor_pos: Option<(u16, u16)>,
}

impl<'a> Frame<'a> {
    pub fn area(&self) -> Rect {
        self.area
    }

    pub fn size(&self) -> Rect {
        self.area
    }

    pub fn buffer_mut(&mut self) -> &mut Buffer {
        self.buffer
    }

    pub fn buffer(&self) -> &Buffer {
        self.buffer
    }

    pub fn render_widget<W: Widget>(&mut self, widget: W, area: Rect) {
        widget.render(area, self.buffer);
    }

    pub fn render_stateful_widget<W: StatefulWidget>(&mut self, widget: W, area: Rect, state: &mut W::State) {
        widget.render(area, self.buffer, state);
    }

    pub fn set_cursor_position<P: Into<(u16, u16)>>(&mut self, pos: P) {
        self.cursor_pos = Some(pos.into());
    }

    pub fn set_cursor(&mut self, x: u16, y: u16) {
        self.cursor_pos = Some((x, y));
    }
}

pub struct Terminal<B: Backend> {
    backend: B,
    buffer: Buffer,
    framebuffer: Framebuffer,
}

impl<B: Backend> Terminal<B> {
    pub fn new(backend: B) -> io::Result<Self> {
        let size = backend.size()?;
        let buffer = Buffer::empty(size);
        let framebuffer = Framebuffer::new(size.width, size.height);
        Ok(Self {
            backend,
            buffer,
            framebuffer,
        })
    }

    pub fn size(&self) -> io::Result<Rect> {
        self.backend.size()
    }

    pub fn clear(&mut self) -> io::Result<()> {
        let size = self.backend.size()?;
        self.buffer = Buffer::empty(size);
        self.backend.clear()
    }

    pub fn show_cursor(&mut self) -> io::Result<()> {
        let mut stdout = io::stdout();
        let _ = write!(stdout, "\x1b[?25h");
        let _ = stdout.flush();
        Ok(())
    }

    pub fn hide_cursor(&mut self) -> io::Result<()> {
        let mut stdout = io::stdout();
        let _ = write!(stdout, "\x1b[?25l");
        let _ = stdout.flush();
        Ok(())
    }

    pub fn autoresize(&mut self) -> io::Result<()> {
        let size = self.backend.size()?;
        if size.width != self.buffer.area.width || size.height != self.buffer.area.height {
            self.buffer = Buffer::empty(size);
            self.framebuffer.resize(size.width, size.height);
        }
        Ok(())
    }

    pub fn draw<F>(&mut self, f: F) -> io::Result<()>
    where
        F: FnOnce(&mut Frame),
    {
        self.autoresize()?;
        let size = self.backend.size()?;
        self.buffer = Buffer::empty(size);

        let cursor_pos = {
            let mut frame = Frame {
                area: size,
                buffer: &mut self.buffer,
                cursor_pos: None,
            };
            f(&mut frame);
            frame.cursor_pos
        };

        // Copy buffer content to Framebuffer
        self.framebuffer.clear();
        for y in 0..size.height {
            for x in 0..size.width {
                let cell = &self.buffer[(x, y)];
                let ch = cell.symbol.chars().next().unwrap_or(' ');
                let style = super::vt::Style {
                    fg: Some(cell.fg),
                    bg: Some(cell.bg),
                    bold: (cell.modifier & 1) != 0,
                    dim: (cell.modifier & 2) != 0,
                    italic: (cell.modifier & 4) != 0,
                    underline: (cell.modifier & 8) != 0,
                    reverse: (cell.modifier & 16) != 0,
                };
                self.framebuffer.set(x, y, ch, style);
            }
        }

        if let Some((cx, cy)) = cursor_pos {
            self.framebuffer.set_cursor(cx, cy);
        }

        // Flush Framebuffer to backend
        let mut stdout = io::stdout();
        let _ = self.framebuffer.flush(&mut stdout);
        let _ = stdout.flush();
        self.backend.sync_buffer(&self.buffer);
        self.backend.flush()?;
        Ok(())
    }

    pub fn backend(&self) -> &B {
        &self.backend
    }

    pub fn backend_mut(&mut self) -> &mut B {
        &mut self.backend
    }
}
