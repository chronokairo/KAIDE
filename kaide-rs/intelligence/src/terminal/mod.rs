//! Browser terminal: Axum HTTP + WebSocket bridge to a `portable-pty` session.
//!
//! Lets the ratatui TUI (or any terminal program) run inside a browser tab via
//! xterm.js, preserving alternate screen, resize and mouse input.

pub mod pty;
pub mod server;
pub mod session;
pub mod shell;
pub mod websocket;
