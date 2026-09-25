//! HTTP + WebSocket server exposing a real PTY in the browser.
//!
//! Routes:
//!   GET /    → xterm.js single-page terminal
//!   GET /ws  → WebSocket bridge: browser stdin/stdout/resize ↔ ConPTY/PTY
//!
//! Protocol over the WebSocket:
//!   client → server: binary frame = terminal input bytes
//!   client → server: text frame = JSON `{"resize":{"cols":120,"rows":30}}`
//!   server → client: binary frame = terminal output bytes

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};
use bytes::Bytes;
use serde::Deserialize;
use std::path::PathBuf;
use std::sync::Arc;
use super::pty::TerminalSession;

const INDEX_HTML: &str = include_str!("index.html");

#[derive(Clone)]
struct AppState {
    /// argv[0] is the program (e.g. `anamnesic tui`, `pwsh`).
    argv: Arc<Vec<String>>,
    /// Working directory for the spawned session.
    cwd: PathBuf,
}

#[derive(Deserialize)]
struct ResizeMsg {
    resize: Resize,
}

#[derive(Deserialize)]
struct Resize {
    cols: u16,
    rows: u16,
}

/// Serve the terminal UI on `addr:port`, spawning `argv` in the PTY.
pub async fn serve(
    addr: &str,
    port: u16,
    argv: Vec<String>,
    cwd: PathBuf,
) -> anyhow::Result<()> {
    let state = AppState {
        argv: Arc::new(argv),
        cwd,
    };

    let app = Router::new()
        .route("/", get(index))
        .route("/ws", get(ws_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind((addr, port)).await?;
    log::info!("terminal server listening on http://{addr}:{port}");
    axum::serve(listener, app).await?;
    Ok(())
}

async fn index() -> impl IntoResponse {
    Html(INDEX_HTML)
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| session(socket, state))
}

/// Bridge one browser connection to a PTY session.
async fn session(socket: WebSocket, state: AppState) {
    // First frame is the initial resize so the PTY starts at browser size.
    let mut socket = socket;
    let (cols, rows) = match socket.recv().await {
        Some(Ok(Message::Text(text))) => match serde_json::from_str::<ResizeMsg>(&text) {
            Ok(msg) => (msg.resize.cols.max(20), msg.resize.rows.max(5)),
            Err(_) => (120, 30),
        },
        _ => (120, 30),
    };

    let session = match TerminalSession::spawn(&state.argv, cols, rows, Some(&state.cwd)) {
        Ok(s) => s,
        Err(e) => {
            let shell = super::shell::default_shell_command();
            log::warn!("failed to spawn {:?}: {e}, falling back to default shell {}", state.argv, shell);
            match TerminalSession::spawn(&[shell], cols, rows, Some(&state.cwd)) {
                Ok(s) => s,
                Err(err) => {
                    let _ = socket
                        .send(Message::Text(format!("failed to spawn terminal: {err}").into()))
                        .await;
                    return;
                }
            }
        }
    };

    log::info!(
        "terminal session started: {:?}",
        state.argv
    );

    // Forward output → browser.
    let (out_tx, mut out_rx) = tokio::sync::mpsc::channel::<Vec<u8>>(64);
    let session_out = session.clone_read_handle();
    let output_task = tokio::spawn(async move {
        loop {
            let data = session_out.read_available();
            if data.is_empty() {
                if out_tx.is_closed() {
                    break;
                }
                tokio::time::sleep(std::time::Duration::from_millis(10)).await;
                continue;
            }
            if out_tx.send(data).await.is_err() {
                break;
            }
        }
    });

    // Forward input + resize → PTY.
    loop {
        tokio::select! {
            Some(data) = out_rx.recv() => {
                if socket.send(Message::Binary(Bytes::from(data))).await.is_err() {
                    break;
                }
            }
            Some(msg) = socket.recv() => match msg {
                Ok(Message::Binary(data)) => {
                    let _ = session.write_input(&data);
                }
                Ok(Message::Text(text)) => {
                    if let Ok(msg) = serde_json::from_str::<ResizeMsg>(&text) {
                        let _ = session.resize(msg.resize.cols.max(20), msg.resize.rows.max(5));
                    } else {
                        let _ = session.write_input(text.as_bytes());
                    }
                }
                Ok(Message::Close(_)) | Err(_) => break,
                _ => {}
            }
        }
    }

    output_task.abort();
    log::info!("terminal session closed");
}
