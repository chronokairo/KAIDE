# Terminal Module (`src/terminal`)

This module provides cross-platform interactive PTY (Pseudo-Terminal) session management and Axum WebSocket streaming for `anamnesic-coder`.

## Module Files

- `mod.rs` - Module entry point and `start_terminal_server` runner.
- `pty.rs` - `portable-pty` abstraction for spawning processes, reading/writing raw buffers, and handling resize.
- `shell.rs` - OS default shell detection (PowerShell/CMD on Windows, `$SHELL`/Bash on Unix).
- `session.rs` - Thread-safe `TerminalSessionManager` lifecycle state container.
- `websocket.rs` - Axum `/ws/terminal` endpoint bridging WebSocket frames with PTY stdin/stdout streams.
