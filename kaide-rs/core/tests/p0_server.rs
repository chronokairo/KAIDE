//! P0 de mercado (fundação) — testes de integração de servidor: cliente MCP
//! (JSON-RPC sobre stdio contra um servidor fake), protocolo versionado com
//! event log canônico e app-server headless (runtime_api).

use kaide::app_server::runtime_api;
use kaide::mcp::{McpClient, McpServerConfig};
use kaide::protocol::event_log::CanonicalEventLog;
use kaide::protocol::EventMsg;

fn temp_dir(tag: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "chronokairo-p0-server-{tag}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

// ---------------------------------------------------------------------------
// Servidor MCP fake embutido no próprio binário de teste (mesmo padrão do
// teste unitário `mcp::tests::fake_mcp_server_process`). No-op a menos que
// seja spawnado com CHRONOKAIRO_P0_FAKE_MCP=1.
// ---------------------------------------------------------------------------

#[test]
fn fake_mcp_server_process() {
    if std::env::var("CHRONOKAIRO_P0_FAKE_MCP").as_deref() != Ok("1") {
        return;
    }
    use std::io::{BufRead, Write};
    let stdin = std::io::stdin();
    let mut stdout = std::io::stdout();
    for line in stdin.lock().lines() {
        let line = match line {
            Ok(line) => line,
            Err(_) => break,
        };
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let Ok(request) = serde_json::from_str::<serde_json::Value>(trimmed) else {
            continue;
        };
        // Notificações não recebem resposta.
        if request.get("id").is_none() {
            continue;
        }
        let id = request["id"].clone();
        let method = request["method"].as_str().unwrap_or_default();
        let result = match method {
            "initialize" => serde_json::json!({
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "serverInfo": { "name": "p0-fake", "version": "0.1.0" }
            }),
            "tools/list" => serde_json::json!({
                "tools": [{
                    "name": "fake_tool",
                    "description": "tool de teste do p0",
                    "inputSchema": { "type": "object", "properties": {} }
                }]
            }),
            "tools/call" => serde_json::json!({
                "content": [{ "type": "text", "text": "fake result" }]
            }),
            _ => serde_json::json!({}),
        };
        let response = serde_json::json!({
            "jsonrpc": "2.0",
            "id": id,
            "result": result
        });
        let _ = writeln!(stdout, "{}", serde_json::to_string(&response).unwrap());
        let _ = stdout.flush();
    }
}

// ---------------------------------------------------------------------------
// P0: cliente MCP — connect, discovery de tools e call_tool.
// ---------------------------------------------------------------------------

#[test]
fn p0_mcp_client_discovers_and_calls_tools() {
    let exe = std::env::current_exe().unwrap();
    let mut client = McpClient::connect(&McpServerConfig {
        command: exe.to_string_lossy().to_string(),
        args: vec!["fake_mcp_server_process".into(), "--exact".into()],
        env: vec![("CHRONOKAIRO_P0_FAKE_MCP".into(), "1".into())],
    })
    .expect("fake MCP server must boot");

    // Discovery no handshake cacheia a lista de tools.
    assert!(client.has_tool("fake_tool"));
    let tools = client.list_tools().unwrap();
    assert_eq!(tools.len(), 1);
    assert_eq!(tools[0].function.name, "fake_tool");
    assert_eq!(tools[0].function.description, "tool de teste do p0");

    // Chamada de tool devolve o conteúdo de texto.
    let output = client
        .call_tool("fake_tool", &kaide::json!({}))
        .unwrap();
    assert_eq!(output, "fake result");
}

// ---------------------------------------------------------------------------
// P0: protocolo versionado — EventMsg JSON roundtrip + event log canônico
// persistível e reproduzível.
// ---------------------------------------------------------------------------

#[test]
fn p0_protocol_round_trips_and_persists_event_log() {
    let events = vec![
        EventMsg::TurnStarted,
        EventMsg::TurnContext {
            thread_id: "sess-p0".into(),
            turn_id: 7,
        },
        EventMsg::ToolCall {
            id: "tc-1".into(),
            name: "write_file".into(),
            summary: "criar arquivo".into(),
        },
        EventMsg::ToolResult {
            id: "tc-1".into(),
            name: "write_file".into(),
            output: "ok".into(),
            exit_code: Some(0),
            timed_out: false,
            duration_ms: 12,
        },
        EventMsg::Done {
            message: "turno concluido".into(),
        },
    ];

    // Serialização versionada {"type": ..., "data": {...}}
    for event in &events {
        let json = event.to_json();
        let back = EventMsg::from_json(&json).unwrap();
        match (event, back) {
            (EventMsg::Done { message: a }, EventMsg::Done { message: b }) => {
                assert_eq!(a, &b);
            }
            (EventMsg::ToolResult { id: a, .. }, EventMsg::ToolResult { id: b, .. }) => {
                assert_eq!(a, &b);
            }
            (EventMsg::TurnContext { thread_id: a, turn_id: t_a }, EventMsg::TurnContext { thread_id: b, turn_id: t_b }) => {
                assert_eq!(a, &b);
                assert_eq!(t_a, &t_b);
            }
            (a, b) => {
                assert_eq!(
                    std::mem::discriminant(a),
                    std::mem::discriminant(&b),
                    "roundtrip changed event variant"
                );
            }
        }
    }

    // Event log canônico: sequência monotônica, persistência JSONL e replay.
    let dir = temp_dir("event-log");
    let mut log = CanonicalEventLog::new();
    for (index, event) in events.iter().enumerate() {
        let seq = log.append("sess-p0", (index + 1) as u64, event.clone());
        assert_eq!(seq, (index + 1) as u64, "sequence must be monotonic");
    }
    assert_eq!(log.len(), 5);

    let path = dir.join("session.jsonl");
    log.persist_jsonl(&path).unwrap();
    let reloaded = CanonicalEventLog::load_jsonl(&path).unwrap();
    assert_eq!(reloaded.len(), 5);

    let replayed = reloaded.replay();
    assert_eq!(replayed.session_id, "sess-p0");
    assert_eq!(replayed.total_turns, 1);
    assert!(replayed.tool_calls.iter().any(|(name, summary)| name == "write_file" && summary == "criar arquivo"));
    assert_eq!(replayed.completed_successfully, true);
    assert_eq!(replayed.final_message.as_deref(), Some("turno concluido"));

    // Replay é determinístico sobre as mesmas entradas.
    let again = CanonicalEventLog::replay_entries(reloaded.entries());
    assert_eq!(again.total_turns, replayed.total_turns);
    assert_eq!(again.final_message, replayed.final_message);

    let _ = std::fs::remove_dir_all(&dir);
}

// ---------------------------------------------------------------------------
// P0: app-server headless — runtime_api exposto por JSON-RPC/IPC.
// ---------------------------------------------------------------------------

#[test]
fn p0_app_server_runtime_api_serves_patch_and_search() {
    let ws = temp_dir("runtime-api");
    std::fs::write(ws.join("grep_target.rs"), "pub fn alpha() {}\n").unwrap();
    std::fs::write(ws.join("other.txt"), "arquivo de apoio\n").unwrap();

    // Discovery de métodos.
    assert!(runtime_api::supports("apply_patch_dry_run"));
    assert!(runtime_api::supports("search_files"));
    assert!(!runtime_api::supports("no_such_method"));

    // apply_patch_dry_run valida sem escrever.
    let patch = "--- a/generated.txt\n+++ b/generated.txt\n@@ -0,0 +1,2 @@\n+linha um\n+linha dois\n";
    let params = serde_json::json!({ "patch": patch });
    let result = runtime_api::call("apply_patch_dry_run", Some(&params), &ws, "qwen3:1.7b");
    match result {
        Ok(value) => {
            let valid = value.get("valid").and_then(|v| v.as_bool()).unwrap_or(false);
            assert!(valid, "dry run must accept a valid patch: {value:?}");
        }
        Err(error) => panic!("dry run must not fail on a valid patch: {error}"),
    }
    assert!(
        !ws.join("generated.txt").exists(),
        "dry run must never write files"
    );

    // search_files ranqueia por similaridade de nome.
    let params = serde_json::json!({ "query": "grep_target" });
    let result = runtime_api::call("search_files", Some(&params), &ws, "qwen3:1.7b").unwrap();
    let total = result
        .get("totalMatches")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    assert!(total >= 1, "search must find grep_target.rs");
    let first = result
        .get("results")
        .and_then(|v| v.as_array())
        .and_then(|items| items.first())
        .cloned()
        .unwrap_or_default();
    assert!(
        first.get("path").and_then(|p| p.as_str()).unwrap_or("").contains("grep_target.rs"),
        "top match must be the queried file"
    );

    let _ = std::fs::remove_dir_all(&ws);
}
