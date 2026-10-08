use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio::task;

use crate::terminal::session::TerminalSessionManager;

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ClientControlMessage {
    Input { data: String },
    Resize { cols: u16, rows: u16 },
}

/// Axum WebSocket endpoint handler for upgrading connection to interactive PTY terminal.
pub async fn ws_terminal_handler(
    ws: WebSocketUpgrade,
    State(manager): State<TerminalSessionManager>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_terminal_socket(socket, manager))
}

async fn handle_terminal_socket(socket: WebSocket, manager: TerminalSessionManager) {
    let session_id = format!("term-{}", rand::random::<u32>());

    let reader = match manager.create_session(&session_id, 120, 30, None) {
        Ok(reader) => reader,
        Err(err) => {
            log::error!("Failed to create PTY session {session_id}: {err}");
            return;
        }
    };

    let pty_session = match manager.get_session(&session_id) {
        Some(session) => session,
        None => return,
    };

    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (tx_bytes, mut rx_bytes) = tokio::sync::mpsc::channel::<Vec<u8>>(256);

    // Blocking reader task for PTY stdout -> channel
    let reader_task = task::spawn_blocking(move || {
        loop {
            let data = reader.read_available();
            if data.is_empty() {
                std::thread::sleep(std::time::Duration::from_millis(10));
                continue;
            }
            if tx_bytes.blocking_send(data).is_err() {
                break;
            }
        }
    });

    // Task forwarding channel -> WebSocket output
    let send_task = tokio::spawn(async move {
        while let Some(bytes) = rx_bytes.recv().await {
            if let Ok(text) = String::from_utf8(bytes.clone()) {
                if ws_sender.send(Message::Text(text.into())).await.is_err() {
                    break;
                }
            } else if ws_sender.send(Message::Binary(bytes.into())).await.is_err() {
                break;
            }
        }
    });

    // Task receiving WebSocket input -> PTY stdin / resize
    let session_clone = pty_session.clone();
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = ws_receiver.next().await {
            match msg {
                Message::Text(text) => {
                    if let Ok(ctrl) = serde_json::from_str::<ClientControlMessage>(&text) {
                        match ctrl {
                            ClientControlMessage::Input { data } => {
                                let _ = session_clone.write_input(data.as_bytes());
                            }
                            ClientControlMessage::Resize { cols, rows } => {
                                let _ = session_clone.resize(cols, rows);
                            }
                        }
                    } else {
                        let _ = session_clone.write_input(text.as_bytes());
                    }
                }
                Message::Binary(bytes) => {
                    let _ = session_clone.write_input(&bytes);
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    };

    reader_task.abort();
    manager.remove_session(&session_id);
}
