use crate::agent::agent_loop::PlanApprovalDecision;
use crate::protocol::{ApprovalDecisionSerde, Op, Session};
use crate::error::Result;
use serde_json::Value;
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct JsonRpcRequest {
    jsonrpc: String,
    id: Option<Value>,
    method: String,
    params: Option<Value>,
}

#[derive(Debug, serde::Serialize)]
struct JsonRpcResponse {
    jsonrpc: String,
    id: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<JsonRpcError>,
}

#[derive(Debug, serde::Serialize)]
struct JsonRpcError {
    code: i32,
    message: String,
}

#[derive(Debug, serde::Serialize)]
struct JsonRpcNotification {
    jsonrpc: String,
    method: String,
    params: Value,
}

pub struct AppServer {
    session: Arc<Session>,
    workspace: std::path::PathBuf,
    model: String,
    pending_requests: Arc<Mutex<HashMap<u64, crate::async_rt::sync::oneshot::Sender<Value>>>>,
    next_request_id: Arc<Mutex<u64>>,
}

impl AppServer {
    pub fn new(
        client: crate::llm::router::LlmRouter,
        state: crate::agent::state::AgentState,
    ) -> Self {
        let workspace = state.config.workspace_dir.clone();
        let model = state.config.coder_model.clone();
        let session = Arc::new(Session::spawn(client, state));
        Self {
            session,
            workspace,
            model,
            pending_requests: Arc::new(Mutex::new(HashMap::new())),
            next_request_id: Arc::new(Mutex::new(1)),
        }
    }

    pub fn run_stdio(self) -> Result<()> {
        let stdin = std::io::stdin();
        let stdout = Arc::new(Mutex::new(std::io::stdout()));
        let reader = BufReader::new(stdin.lock());

        // Event pump: read events from session and write as notifications
        let event_pump_session = self.session.clone();
        let event_pump_stdout = stdout.clone();
        let pump_handle = std::thread::spawn(move || {
            while let Some(event) = event_pump_session.next_event() {
                if let Ok(json) = serde_json::to_value(&event) {
                    let notification = JsonRpcNotification {
                        jsonrpc: "2.0".into(),
                        method: "agent/event".into(),
                        params: json,
                    };
                    if let Ok(line) = serde_json::to_string(&notification) {
                        let mut out = event_pump_stdout.lock().unwrap();
                        let _ = writeln!(out, "{}", line);
                        let _ = out.flush();
                    }
                }
            }
        });

        // Main loop: read requests from stdin
        for line in reader.lines() {
            let line = line?;
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            let request: JsonRpcRequest = match serde_json::from_str(line) {
                Ok(r) => r,
                Err(_) => {
                    self.write_error(None, -32700, "Parse error")?;
                    continue;
                }
            };

            match request.method.as_str() {
                "initialize" => {
                    let result = serde_json::json!({
                        "protocolVersion": 1,
                        "capabilities": {
                            "tasks": "v1",
                            "approvals": "v1",
                            "streaming": "v1",
                            "interrupt": "v1"
                        },
                        "serverInfo": {"name": "chronokairo", "version": env!("CARGO_PKG_VERSION")}
                    });
                    self.write_response(request.id, Some(result), None)?;
                }
                "start_turn" => {
                    let prompt = request
                        .params
                        .as_ref()
                        .and_then(|p| p.get("prompt"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let mode = request
                        .params
                        .as_ref()
                        .and_then(|p| p.get("mode"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("agent");
                    self.session.submit(Op::UserTurn {
                        prompt: prompt.into(),
                        mode: mode.into(),
                    })?;
                    self.write_response(request.id, Some(serde_json::json!({"ok": true})), None)?;
                }
                "interrupt" => {
                    self.session.interrupt();
                    self.write_response(request.id, Some(serde_json::json!({"ok": true})), None)?;
                }
                "exec_approval" => {
                    let id = request
                        .params
                        .as_ref()
                        .and_then(|p| p.get("id"))
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    let decision = request
                        .params
                        .as_ref()
                        .and_then(|p| p.get("decision"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("deny");
                    let decision = match decision {
                        "allow_once" => ApprovalDecisionSerde::AllowOnce,
                        "allow_session" => ApprovalDecisionSerde::AllowSession,
                        _ => ApprovalDecisionSerde::Deny,
                    };
                    self.session.approve_exec(id, decision);
                    self.write_response(request.id, Some(serde_json::json!({"ok": true})), None)?;
                }
                "plan_approval" => {
                    let id = request
                        .params
                        .as_ref()
                        .and_then(|p| p.get("id"))
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    let decision = request
                        .params
                        .as_ref()
                        .and_then(|p| p.get("decision"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("deny");
                    let decision = match decision {
                        "approve" => PlanApprovalDecision::Approve,
                        _ => PlanApprovalDecision::Deny,
                    };
                    self.session.approve_plan(id, decision);
                    self.write_response(request.id, Some(serde_json::json!({"ok": true})), None)?;
                }
                "shutdown" => {
                    self.write_response(request.id, Some(serde_json::json!({"ok": true})), None)?;
                    break;
                }
                method if runtime_api::supports(method) => {
                    match runtime_api::call(method, request.params.as_ref(), &self.workspace, &self.model) {
                        Ok(result) => self.write_response(request.id, Some(result), None)?,
                        Err(message) => self.write_error(request.id, -32001, &message)?,
                    }
                }
                _ => {
                    self.write_error(request.id, -32601, "Method not found")?;
                }
            }
        }

        pump_handle.join().ok();
        Ok(())
    }

    fn write_response(
        &self,
        id: Option<Value>,
        result: Option<Value>,
        error: Option<JsonRpcError>,
    ) -> Result<()> {
        let mut stdout = std::io::stdout();
        let response = JsonRpcResponse {
            jsonrpc: "2.0".into(),
            id,
            result,
            error,
        };
        let line = serde_json::to_string(&response)?;
        writeln!(stdout, "{}", line)?;
        stdout.flush()?;
        Ok(())
    }

    fn write_error(&self, id: Option<Value>, code: i32, message: &str) -> Result<()> {
        self.write_response(
            id,
            None,
            Some(JsonRpcError {
                code,
                message: message.into(),
            }),
        )
    }
}
mod runtime_api;
