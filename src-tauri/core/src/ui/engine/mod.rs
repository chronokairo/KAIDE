//! Native Zero-Lib Terminal UI Engine based on microsoft/edit architecture.
#![allow(unused_imports)]

pub mod buffer;
pub mod event;
pub mod framebuffer;
pub mod layout;
pub mod sys;
pub mod terminal;
pub mod vt;
pub mod widgets;

pub use buffer::Buffer;
pub use layout::Rect;
pub use vt::{Color, Line, Span, Style};
pub use widgets::{Clear, Paragraph, Widget, Wrap};
#[allow(unused_imports)]
pub use event::{DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEvent, KeyEventKind, KeyEventState, KeyModifiers, MouseButton, MouseEvent, MouseEventKind, poll, read};
#[allow(unused_imports)]
pub use layout::{Alignment, Constraint, Direction, Layout, Margin};
#[allow(unused_imports)]
pub use sys::{cursor, disable_raw_mode, enable_raw_mode, execute, size, EnterAlternateScreen, LeaveAlternateScreen};
#[allow(unused_imports)]
pub use terminal::{Backend, CrosstermBackend, Frame, Terminal, TestBackend};

pub trait Stylize: Sized {
    fn dim(self) -> Self;
    fn bold(self) -> Self;
    fn fg(self, color: Color) -> Self;
    fn bg(self, color: Color) -> Self;
}

impl Stylize for Style {
    fn dim(mut self) -> Self { self.dim = true; self }
    fn bold(mut self) -> Self { self.bold = true; self }
    fn fg(mut self, color: Color) -> Self { self.fg = Some(color); self }
    fn bg(mut self, color: Color) -> Self { self.bg = Some(color); self }
}

impl<'a> Stylize for Span<'a> {
    fn dim(mut self) -> Self { self.style = self.style.dim(); self }
    fn bold(mut self) -> Self { self.style = self.style.bold(); self }
    fn fg(mut self, color: Color) -> Self { self.style = self.style.fg(color); self }
    fn bg(mut self, color: Color) -> Self { self.style = self.style.bg(color); self }
}

impl<'a> Stylize for Line<'a> {
    fn dim(mut self) -> Self {
        for span in &mut self.spans { *span = span.clone().dim(); }
        self
    }
    fn bold(mut self) -> Self {
        for span in &mut self.spans { *span = span.clone().bold(); }
        self
    }
    fn fg(mut self, color: Color) -> Self {
        for span in &mut self.spans { *span = span.clone().fg(color); }
        self
    }
    fn bg(mut self, color: Color) -> Self {
        for span in &mut self.spans { *span = span.clone().bg(color); }
        self
    }
}

pub mod crossterm {
    pub use super::event;
    pub use super::sys as terminal;
    pub use super::sys::cursor;
    pub use super::sys::execute;
}

pub mod ratatui {
    pub use super::layout;
    pub use super::terminal as backend;
    pub use super::terminal::{Frame, Terminal};
    pub use super::widgets;
    pub mod style {
        pub use crate::ui::engine::vt::{Color, Modifier, Style};
    }
    pub mod text {
        pub use crate::ui::engine::vt::{Line, Span};
        use std::marker::PhantomData;

        #[derive(Clone, Debug, Default)]
        pub struct Text<'a> {
            pub lines: Vec<Line<'a>>,
            _marker: PhantomData<&'a ()>,
        }
        impl<'a> Text<'a> {
            pub fn raw(content: impl Into<String>) -> Self {
                let s = content.into();
                let lines: Vec<Line<'a>> = s.lines().map(|l| Line::from(l.to_string())).collect();
                Self { lines, _marker: PhantomData }
            }
        }
        impl<'a> From<Vec<Line<'a>>> for Text<'a> {
            fn from(lines: Vec<Line<'a>>) -> Self {
                Self { lines, _marker: PhantomData }
            }
        }
    }
}
