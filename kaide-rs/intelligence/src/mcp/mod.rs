pub mod acp;

use anyhow::{Context, Result};
use serde_json::Value;
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct McpServerConfig {
    pub command: String,
    pub args: Vec<String>,
    pub env: Vec<(String, String)>,
}

pub struct McpClient {
    process: std::process::Child,
    stdin: std::process::ChildStdin,
    stdout: BufReader<std::process::ChildStdout>,
    next_id: u64,
}

impl McpClient {
    pub fn connect(config: &McpServerConfig) -> Result<Self> {
        let mut cmd = Command::new(&config.command);
        cmd.args(&config.args);
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::inherit());
        for (key, value) in &config.env {
            cmd.env(key, value);
        }
        let mut process = cmd.spawn().context("failed to spawn MCP server")?;
        let stdin = process.stdin.take().context("failed to get MCP server stdin")?;
        let stdout = process.stdout.take().context("failed to get MCP server stdout")?;
        let mut client = Self {
            process,
            stdin,
            stdout: BufReader::new(stdout),
            next_id: 1,
        };
        client.initialize()?;
        Ok(client)
    }

    fn send_request(&mut self, method: &str, params: Option<Value>) -> Result<Value> {
        let id = self.next_id;
        self.next_id += 1;

        let mut request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": method,
        });
        if let Some(params) = params {
            request["params"] = params;
        }

        writeln!(self.stdin, "{}", request)?;
        self.stdin.flush()?;

        let mut line = String::new();
        loop {
            line.clear();
            let bytes_read = self.stdout.read_line(&mut line)?;
            if bytes_read == 0 {
                break;
            }
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Ok(response) = serde_json::from_str::<Value>(trimmed) {
                if response.get("id").and_then(|v| v.as_u64()) == Some(id) {
                    return Ok(response.get("result").cloned().unwrap_or(Value::Null));
                }
            }
        }
        anyhow::bail!("MCP server closed connection without response")
    }

    fn initialize(&mut self) -> Result<()> {
        let params = serde_json::json!({
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "anamnesic-coder",
                "version": "0.1.0"
            }
        });
        let _result = self.send_request("initialize", Some(params))?;
        let notification = serde_json::json!({
            "jsonrpc": "2.0",
            "method": "initialized"
        });
        writeln!(self.stdin, "{}", notification)?;
        self.stdin.flush()?;
        Ok(())
    }

    pub fn list_tools(&mut self) -> Result<Vec<crate::llm::client::ToolDef>> {
        let result = self.send_request("tools/list", None)?;
        let tools = result
            .get("tools")
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default();
        let mut defs = Vec::new();
        for tool in tools {
            let name = tool
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");
            let description = tool
                .get("description")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let input_schema = tool
                .get("inputSchema")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({"type": "object", "properties": {}}));
            defs.push(crate::llm::client::ToolDef {
                r#type: "function".into(),
                function: crate::llm::client::ToolFunction {
                    name: name.into(),
                    description: description.into(),
                    parameters: input_schema,
                },
            });
        }
        Ok(defs)
    }

    pub fn call_tool(&mut self, name: &str, arguments: &Value) -> Result<String> {
        let params = serde_json::json!({
            "name": name,
            "arguments": arguments
        });
        let result = self.send_request("tools/call", Some(params))?;
        let content = result
            .get("content")
            .and_then(|v| v.as_array())
            .and_then(|arr| arr.first())
            .and_then(|item| item.get("text"))
            .and_then(|v| v.as_str())
            .unwrap_or("");
        Ok(content.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mcp_server_config_can_be_created() {
        let config = McpServerConfig {
            command: "node".into(),
            args: vec!["server.js".into()],
            env: vec![],
        };
        assert_eq!(config.command, "node");
        assert_eq!(config.args, vec!["server.js"]);
    }

    #[test]
    fn mcp_server_config_supports_equality() {
        let a = McpServerConfig {
            command: "python".into(),
            args: vec!["-m".into(), "mcp".into()],
            env: vec![],
        };
        let b = McpServerConfig {
            command: "python".into(),
            args: vec!["-m".into(), "mcp".into()],
            env: vec![],
        };
        assert_eq!(a, b);
    }
}
