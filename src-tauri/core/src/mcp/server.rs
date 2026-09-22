use crate::agent::agent_loop::PlanApprovalDecision;
use crate::protocol::{ApprovalDecisionSerde, EventMsg, Op, Session};
use crate::error::Result;
use crate::json::Value;
use std::io::{BufRead, BufReader, Write};
use std::sync::Arc;

pub struct McpServer {
    session: Arc<Session>,
    workspace: std::path::PathBuf,
}

impl McpServer {
    pub fn new(
        client: crate::llm::router::LlmRouter,
        state: crate::agent::state::AgentState,
    ) -> Self {
        let workspace = state.config.workspace_dir.clone();
        let session = Arc::new(Session::spawn(client, state));
        Self { session, workspace }
    }

    pub fn run_stdio(self) -> Result<()> {
        let stdin = std::io::stdin();
        let reader = BufReader::new(stdin.lock());

        // Initialize handshake
        self.write_response(
            crate::json!(1),
            crate::json!({
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "serverInfo": {"name": "ckc", "version": "0.1.0"}
            }),
        )?;
        self.write_notification("initialized", crate::json!({}))?;

        for line in reader.lines() {
            let line = line?;
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            let request: Value = match crate::json::from_str(line) {
                Ok(r) => r,
                Err(_) => continue,
            };

            let id = request.get("id").cloned();
            let method = request.get("method").and_then(|m| m.as_str()).unwrap_or("");
            let params = request.get("params").cloned().unwrap_or(Value::Null);

            match method {
                "tools/list" => {
                    let result = crate::json!({
                        "tools": [
                            {
                                "name": "run_coder",
                                "description": "Run a coding task with the ChronoKairo agent. Returns the final result.",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "prompt": {"type": "string", "description": "The task to execute"},
                                        "mode": {"type": "string", "enum": ["agent", "plan"], "default": "agent", "description": "Execution mode: agent (tool-use) or plan (planner-first)"}
                                    },
                                    "required": ["prompt"]
                                }
                            },
                            {
                                "name": "chrono_get_context",
                                "description": "Retrieve curated ChronoKairo operational context, MOC guidelines, and active task directives using the Zero-Lib ChronoContext engine.",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "task": {"type": "string", "description": "The specific task or domain keyword (e.g. 'reels', 'marketing', 'leads', 'proposta')"},
                                        "char_budget": {"type": "integer", "default": 8000, "description": "Maximum character budget for the returned context pack"}
                                    }
                                }
                            }
                        ]
                    });
                    self.write_response(id.unwrap_or(Value::Null), result)?;
                }
                "tools/call" => {
                    let tool_name = params.get("name").and_then(|v| v.as_str()).unwrap_or("");
                    if tool_name == "chrono_get_context" {
                        let args = params.get("arguments").cloned().unwrap_or(Value::Null);
                        let task = args.get("task").and_then(|v| v.as_str());
                        let budget = args.get("char_budget").and_then(|v| v.as_u64()).unwrap_or(8000) as usize;
                        let pack = crate::repo::ChronoContextEngine::build_context_pack(
                            &self.workspace,
                            task,
                            budget,
                        );
                        let result = crate::json!({
                            "content": [{
                                "type": "text",
                                "text": pack
                            }]
                        });
                        self.write_response(id.unwrap_or(Value::Null), result)?;
                        continue;
                    }
                    if tool_name == "run_coder" {
                        let args = params.get("arguments").cloned().unwrap_or(Value::Null);
                        let prompt = args.get("prompt").and_then(|v| v.as_str()).unwrap_or("");
                        let mode = args.get("mode").and_then(|v| v.as_str()).unwrap_or("agent");

                        // Start the turn
                        self.session.submit(Op::UserTurn {
                            prompt: prompt.into(),
                            mode: mode.into(),
                        })?;

                        // Collect events until TurnComplete
                        let mut final_text = String::new();
                        while let Some(event) = self.session.next_event() {
                            match event {
                                EventMsg::TextDelta { text } => {
                                    final_text.push_str(&text);
                                    self.write_notification(
                                        "message",
                                        crate::json_expr!({
                                            "level": "info",
                                            "message": text,
                                        }),
                                    )?;
                                }
                                EventMsg::ToolCall { name, summary, .. } => {
                                    self.write_notification(
                                        "message",
                                        crate::json_expr!({
                                            "level": "info",
                                            "message": format!("{}: {}", name, summary),
                                        }),
                                    )?;
                                }
                                EventMsg::ExecApprovalRequest {
                                    id,
                                    tool: _,
                                    summary: _,
                                    risk: _,
                                } => {
                                    // In MCP mode, auto-approve for now (non-interactive)
                                    self.session
                                        .approve_exec(id, ApprovalDecisionSerde::AllowOnce);
                                }
                                EventMsg::PlanApprovalRequest { id, steps: _ } => {
                                    // Auto-approve plans in MCP mode
                                    self.session.approve_plan(id, PlanApprovalDecision::Approve);
                                }
                                EventMsg::Done { message } => {
                                    final_text = message;
                                    break;
                                }
                                EventMsg::Failed { message } => {
                                    final_text = message;
                                    break;
                                }
                                EventMsg::Interrupted => {
                                    final_text = "Turn interrupted".into();
                                    break;
                                }
                                _ => {}
                            }
                        }

                        let result = crate::json_expr!({
                            "content": crate::json::Value::Array(vec![crate::json_expr!({
                                "type": "text", "text": final_text
                            })])
                        });
                        self.write_response(id.unwrap_or(Value::Null), result)?;
                    } else {
                        self.write_response(
                            id.unwrap_or(Value::Null),
                            crate::json_expr!({
                                "content": crate::json::Value::Array(vec![crate::json_expr!({
                                    "type": "text", "text": "Unknown tool"
                                })]),
                                "isError": true
                            }),
                        )?;
                    }
                }
                "initialize" => {
                    let result = crate::json!({
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "serverInfo": {"name": "ckc", "version": "0.1.0"}
                    });
                    self.write_response(id.unwrap_or(Value::Null), result)?;
                    self.write_notification("initialized", crate::json!({}))?;
                }
                _ => {
                    // Unknown method - ignore or respond error
                    if id.is_some() {
                        self.write_response(
                            id.unwrap_or(Value::Null),
                            crate::json_expr!({
                                "error": crate::json_expr!({"code": -32601, "message": "Method not found"})
                            }),
                        )?;
                    }
                }
            }
        }
        Ok(())
    }

    fn write_response(&self, id: Value, result: Value) -> Result<()> {
        let mut stdout = std::io::stdout();
        let response = crate::json!({
            "jsonrpc": "2.0",
            "id": id,
            "result": result
        });
        let line = crate::json::to_string(&response);
        writeln!(stdout, "{}", line)?;
        stdout.flush()?;
        Ok(())
    }

    fn write_notification(&self, method: &str, params: Value) -> Result<()> {
        let mut stdout = std::io::stdout();
        let notification = crate::json!({
            "jsonrpc": "2.0",
            "method": method,
            "params": params
        });
        let line = crate::json::to_string(&notification);
        writeln!(stdout, "{}", line)?;
        stdout.flush()?;
        Ok(())
    }
}
