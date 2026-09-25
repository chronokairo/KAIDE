use crate::llm::infer::engine::InferenceEngine;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ToolDef {
    pub r#type: String,
    pub function: ToolFunction,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ToolFunction {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ToolCall {
    #[serde(default)]
    pub id: String,
    #[serde(default = "function_call_type")]
    pub r#type: String,
    pub function: ToolCallFunction,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ToolCallFunction {
    pub name: String,
    #[serde(default, deserialize_with = "deserialize_tool_arguments")]
    pub arguments: String,
}

fn function_call_type() -> String {
    "function".to_string()
}

/// OpenAI-compatible providers disagree on whether `arguments` is a JSON
/// string or an object. Normalize both forms to a JSON string at the boundary.
fn deserialize_tool_arguments<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let value = serde_json::Value::deserialize(deserializer)?;
    match value {
        serde_json::Value::String(arguments) => Ok(arguments),
        serde_json::Value::Null => Ok("{}".to_string()),
        other => serde_json::to_string(&other).map_err(serde::de::Error::custom),
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ToolCallResult {
    pub tool_call_id: String,
    pub content: String,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct TokenUsage {
    pub prompt_tokens: usize,
    pub completion_tokens: usize,
    pub total_tokens: usize,
}

/// A normalized chat completion. Tool calls are kept separate from assistant
/// text so the agent never has to guess whether arbitrary content is JSON.
#[derive(Clone, Debug)]
pub struct ChatCompletion {
    pub content: String,
    pub tool_calls: Vec<ToolCall>,
    pub finish_reason: Option<String>,
    pub usage: Option<TokenUsage>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub enum ResponseFormat {
    #[default]
    Text,
    JsonObject,
    JsonSchema {
        name: String,
        schema: serde_json::Value,
        strict: bool,
    },
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ToolChoice {
    Auto,
    None,
    Required,
    Function(String),
}

impl Serialize for ToolChoice {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            Self::Auto => serializer.serialize_str("auto"),
            Self::None => serializer.serialize_str("none"),
            Self::Required => serializer.serialize_str("required"),
            Self::Function(name) => serde_json::json!({
                "type": "function",
                "function": { "name": name }
            })
            .serialize(serializer),
        }
    }
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<serde_json::Value>,
    stream: bool,
    max_tokens: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<ToolDef>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<ToolChoice>,
}

#[derive(Deserialize)]
struct ChatResponse {
    message: ChatMessage,
    #[serde(default)]
    done_reason: Option<String>,
    #[serde(default)]
    prompt_eval_count: Option<usize>,
    #[serde(default)]
    eval_count: Option<usize>,
}

#[derive(Deserialize)]
struct ChatMessage {
    #[serde(default)]
    content: Option<String>,
    #[serde(default)]
    tool_calls: Option<Vec<ToolCall>>,
}

#[derive(Serialize)]
struct CloudChatRequest {
    model: String,
    messages: Vec<serde_json::Value>,
    stream: bool,
    max_tokens: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<ToolDef>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<ToolChoice>,
    #[serde(skip_serializing_if = "Option::is_none")]
    response_format: Option<ResponseFormat>,
}

#[derive(Deserialize)]
struct CloudChatResponse {
    choices: Vec<CloudChoice>,
    #[serde(default)]
    usage: Option<CloudUsage>,
}

#[derive(Deserialize)]
struct CloudUsage {
    #[serde(default)]
    prompt_tokens: usize,
    #[serde(default)]
    completion_tokens: usize,
    #[serde(default)]
    total_tokens: usize,
}

#[derive(Deserialize)]
struct CloudChoice {
    message: CloudMessage,
    finish_reason: Option<String>,
}

#[derive(Deserialize)]
struct CloudMessage {
    content: Option<String>,
    #[serde(default)]
    tool_calls: Option<Vec<ToolCall>>,
}

#[derive(Serialize)]
struct CloudStreamRequest {
    model: String,
    messages: Vec<serde_json::Value>,
    stream: bool,
    max_tokens: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<ToolDef>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<ToolChoice>,
    #[serde(skip_serializing_if = "Option::is_none")]
    response_format: Option<ResponseFormat>,
}

pub struct OllamaClient {
    host: String,
    client: reqwest::Client,
}

impl Clone for OllamaClient {
    fn clone(&self) -> Self {
        Self {
            host: self.host.clone(),
            client: self.client.clone(),
        }
    }
}

/// OpenAI-compatible cloud client (used for NVIDIA NIM and other providers).
pub struct CloudClient {
    base_url: String,
    api_key: String,
    client: reqwest::Client,
}

impl Clone for CloudClient {
    fn clone(&self) -> Self {
        Self {
            base_url: self.base_url.clone(),
            api_key: self.api_key.clone(),
            client: self.client.clone(),
        }
    }
}

pub enum LlmClient {
    Ollama(OllamaClient),
    Local(Arc<Mutex<InferenceEngine>>),
    Cloud(CloudClient),
}

impl Clone for LlmClient {
    fn clone(&self) -> Self {
        match self {
            LlmClient::Ollama(c) => LlmClient::Ollama(c.clone()),
            LlmClient::Local(e) => LlmClient::Local(Arc::clone(e)),
            LlmClient::Cloud(c) => LlmClient::Cloud(c.clone()),
        }
    }
}

impl LlmClient {
    pub fn ollama(host: &str) -> Self {
        LlmClient::Ollama(OllamaClient::new(host))
    }

    pub fn local(engine: InferenceEngine) -> Self {
        LlmClient::Local(Arc::new(Mutex::new(engine)))
    }

    /// OpenAI-compatible cloud backend (NVIDIA NIM, etc.).
    pub fn cloud(base_url: &str, api_key: &str) -> Self {
        LlmClient::Cloud(CloudClient::new(base_url, api_key))
    }

    pub async fn generate(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        match self {
            LlmClient::Ollama(c) => c.generate(model, prompt, tools, response_format).await,
            // NVIDIA NIM and the other supported cloud backends are
            // OpenAI-compatible chat APIs.  Using chat here also preserves
            // tool calls and reasoning-model responses; `/v1/completions`
            // may return an empty `text` for chat-tuned models.
            LlmClient::Cloud(c) => {
                c.chat(
                    model,
                    vec![serde_json::json!({ "role": "user", "content": prompt })],
                    tools,
                    response_format,
                )
                .await
            }
            LlmClient::Local(eng) => {
                let mut eng = eng
                    .lock()
                    .map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
                eng.generate(prompt, 512, 0.8, 40)
                    .map_err(|e| anyhow::anyhow!("Local inference error: {}", e))
            }
        }
    }

    /// Generate with bounded retries and exponential backoff on transient failures.
    pub async fn generate_with_retry(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        let mut last_err: Option<anyhow::Error> = None;
        for attempt in 0..3 {
            match self.generate(model, prompt, tools, response_format).await {
                Ok(text) => return Ok(text),
                Err(e) => {
                    last_err = Some(e);
                    if attempt < 2 {
                        let backoff = std::time::Duration::from_millis(500 * (1 << attempt));
                        tokio::time::sleep(backoff).await;
                    }
                }
            }
        }
        Err(last_err.unwrap_or_else(|| anyhow::anyhow!("LLM call failed")))
    }

    /// Stream a response, invoking `on_token` for each text chunk and
    /// `on_tool_call_delta` for incremental tool-call arguments.
    /// Falls back to non-streaming output for local engines.
    pub async fn stream(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
        on_tool_call_delta: &mut dyn FnMut(usize, Option<&str>, &str),
    ) -> Result<String> {
        match self {
            LlmClient::Ollama(c) => {
                c.stream_generate(model, prompt, tools, response_format, on_token)
                    .await
            }
            LlmClient::Cloud(c) => {
                let messages = vec![serde_json::json!({ "role": "user", "content": prompt })];
                c.stream_chat(model, messages, tools, response_format, on_token, on_tool_call_delta)
                    .await
            }
            LlmClient::Local(eng) => {
                let mut eng = eng
                    .lock()
                    .map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
                let text = eng
                    .generate(prompt, 512, 0.8, 40)
                    .map_err(|e| anyhow::anyhow!("Local inference error: {}", e))?;
                on_token(&text);
                Ok(text)
            }
        }
    }

    pub async fn chat(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        self.chat_meta(model, messages, tools, None, response_format)
            .await
            .map(|c| c.content)
    }

    /// Like [`Self::chat`] but also returns the backend finish reason so the
    /// agent loop can distinguish a natural stop from a truncated/tool-driven
    /// response that should continue.
    pub async fn chat_meta(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<ChatCompletion> {
        match self {
            LlmClient::Ollama(c) => {
                c.chat_meta(model, messages, tools, tool_choice, response_format)
                    .await
            }
            LlmClient::Cloud(c) => {
                c.chat_meta(model, messages, tools, tool_choice, response_format)
                    .await
            }
            LlmClient::Local(eng) => {
                // Flatten chat messages into a single prompt for local inference
                let prompt = messages
                    .iter()
                    .filter_map(|m| {
                        let role = m.get("role")?.as_str()?;
                        let content = m.get("content")?.as_str()?;
                        Some(format!("{}: {}", role, content))
                    })
                    .collect::<Vec<_>>()
                    .join("\n");
                let mut eng = eng
                    .lock()
                    .map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
                let content = eng
                    .generate(&prompt, 512, 0.8, 40)
                    .map_err(|e| anyhow::anyhow!("Local inference error: {}", e))?;
                Ok(ChatCompletion {
                    content,
                    tool_calls: Vec::new(),
                    finish_reason: None,
                    usage: None,
                })
            }
        }
    }

    /// Stream a conversation response, invoking `on_token` for each content
    /// delta while returning the same normalized [`ChatCompletion`] as
    /// [`Self::chat_meta`]. Only the cloud backend streams incrementally; the
    /// Ollama and local backends fall back to a non-streaming completion and
    /// emit the whole text through `on_token`.
    pub async fn chat_meta_stream(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
    ) -> Result<ChatCompletion> {
        match self {
            LlmClient::Cloud(c) => {
                c.stream_chat_meta(model, messages, tools, tool_choice, response_format, on_token)
                    .await
            }
            LlmClient::Ollama(c) => {
                let completion =
                    c.chat_meta(model, messages, tools, tool_choice, response_format).await?;
                if !completion.content.is_empty() {
                    on_token(&completion.content);
                }
                Ok(completion)
            }
            LlmClient::Local(_eng) => {
                let completion = self
                    .chat_meta(model, messages, tools, tool_choice, response_format)
                    .await?;
                if !completion.content.is_empty() {
                    on_token(&completion.content);
                }
                Ok(completion)
            }
        }
    }
}

impl OllamaClient {
    pub fn new(host: &str) -> Self {
        Self {
            host: host.trim_end_matches('/').to_string(),
            client: reqwest::Client::new(),
        }
    }

    pub async fn generate(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        _response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        let body = serde_json::json!({
            "model": model,
            "prompt": prompt,
            "stream": false,
            "tools": tools.unwrap_or(&vec![]),
        });

        let resp = self
            .client
            .post(format!("{}/api/generate", self.host))
            .json(&body)
            .send()
            .await
            .context("Ollama request failed")?;

        let data: serde_json::Value = resp
            .json()
            .await
            .context("Failed to parse Ollama response")?;

        // Check if the response contains tool_calls
        if let Some(tool_calls) = data
            .get("message")
            .and_then(|m| m.get("tool_calls"))
            .and_then(|t| t.as_array())
        {
            let mut results = Vec::new();
            for tc in tool_calls {
                let name = tc
                    .get("name")
                    .and_then(|n| n.as_str())
                    .unwrap_or("")
                    .to_string();
                let arguments = tc
                    .get("arguments")
                    .and_then(|a| a.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_default();
                results.push(ToolCall {
                    id: tc
                        .get("id")
                        .and_then(|i| i.as_str())
                        .unwrap_or("")
                        .to_string(),
                    r#type: "function".to_string(),
                    function: ToolCallFunction { name, arguments },
                });
            }
            return Ok(serde_json::to_string(&results)?);
        }

        Ok(data["response"].as_str().unwrap_or("").to_string())
    }

    pub async fn chat(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        self.chat_meta(model, messages, tools, None, response_format)
            .await
            .map(|c| c.content)
    }

    pub async fn chat_meta(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        _response_format: Option<&ResponseFormat>,
    ) -> Result<ChatCompletion> {
        let max_tokens = 16384;
        let body = ChatRequest {
            model: model.to_string(),
            messages,
            stream: false,
            max_tokens,
            tools: tools.cloned(),
            tool_choice: tool_choice.cloned(),
        };

        let resp = self
            .client
            .post(format!("{}/api/chat", self.host))
            .json(&body)
            .send()
            .await
            .context("Ollama chat request failed")?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            anyhow::bail!("Ollama chat request failed: HTTP {status} {text}");
        }

        let data: ChatResponse = resp
            .json()
            .await
            .context("Failed to parse Ollama chat response")?;
        let tool_calls = data.message.tool_calls.unwrap_or_default();
        let finish_reason = if tool_calls.is_empty() {
            data.done_reason
        } else {
            Some("tool_calls".to_string())
        };

        let prompt_tokens = data.prompt_eval_count.unwrap_or(0);
        let completion_tokens = data.eval_count.unwrap_or(0);
        let usage = if prompt_tokens > 0 || completion_tokens > 0 {
            Some(TokenUsage {
                prompt_tokens,
                completion_tokens,
                total_tokens: prompt_tokens + completion_tokens,
            })
        } else {
            None
        };

        Ok(ChatCompletion {
            content: data.message.content.unwrap_or_default(),
            tool_calls,
            finish_reason,
            usage,
        })
    }

    /// Stream a `/api/generate` call (NDJSON lines), feeding text chunks to `on_token`.
    /// Supports tool calls — when the model emits tool_calls, they are returned
    /// as a JSON array string instead of streaming text.
    pub async fn stream_generate(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        _response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
    ) -> Result<String> {
        let body = serde_json::json!({
            "model": model,
            "prompt": prompt,
            "stream": true,
            "tools": tools.unwrap_or(&vec![]),
        });

        let mut resp = self
            .client
            .post(format!("{}/api/generate", self.host))
            .json(&body)
            .send()
            .await
            .context("Ollama stream request failed")?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            anyhow::bail!("Ollama stream request failed: HTTP {status} {text}");
        }

        let mut buffer: Vec<u8> = Vec::new();
        let mut full = String::new();
        let mut done = false;
        let mut _saw_tool_calls = false;
        while !done {
            let Some(chunk) = resp.chunk().await.context("Ollama stream read failed")? else {
                break;
            };
            buffer.extend_from_slice(&chunk);
            while let Some(pos) = buffer.iter().position(|&b| b == b'\n') {
                let line: Vec<u8> = buffer.drain(..=pos).collect();
                let line = String::from_utf8_lossy(&line).trim().to_string();
                if line.is_empty() {
                    continue;
                }
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(&line) {
                    if let Some(tool_calls) = v
                        .get("message")
                        .and_then(|m| m.get("tool_calls"))
                        .and_then(|t| t.as_array())
                    {
                        _saw_tool_calls = true;
                        for tc in tool_calls {
                            let name = tc
                                .get("name")
                                .and_then(|n| n.as_str())
                                .unwrap_or("")
                                .to_string();
                            let arguments = tc
                                .get("arguments")
                                .and_then(|a| a.as_str())
                                .map(|s| s.to_string())
                                .unwrap_or_default();
                            let id = tc
                                .get("id")
                                .and_then(|i| i.as_str())
                                .unwrap_or("")
                                .to_string();
                            on_token(
                                &serde_json::json!({
                                    "tool_call": {
                                        "id": id,
                                        "type": "function",
                                        "function": { "name": name, "arguments": arguments }
                                    }
                                })
                                .to_string(),
                            );
                        }
                    }
                    if let Some(t) = v["response"].as_str() {
                        if !t.is_empty() {
                            on_token(t);
                            full.push_str(t);
                        }
                    }
                    if v["done"].as_bool() == Some(true) {
                        done = true;
                        break;
                    }
                }
            }
        }
        Ok(full)
    }
}

impl CloudClient {
    pub fn new(base_url: &str, api_key: &str) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            api_key: api_key.to_string(),
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(8))
                .build()
                .unwrap_or_default(),
        }
    }

    /// Single-turn text completion (`POST /v1/completions`).
    pub async fn generate(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        let mut body = serde_json::json!({
            "model": model,
            "prompt": prompt,
            "stream": false,
            "max_tokens": 2048,
            "tools": tools.unwrap_or(&vec![]),
        });
        if let Some(rf) = response_format {
            if let Some(obj) = body.as_object_mut() {
                match rf {
                    ResponseFormat::JsonObject => {
                        obj.insert(
                            "response_format".into(),
                            serde_json::json!({"type": "json_object"}),
                        );
                    }
                    ResponseFormat::JsonSchema {
                        name,
                        schema,
                        strict,
                    } => {
                        obj.insert(
                            "response_format".into(),
                            serde_json::json!({
                                "type": "json_schema",
                                "json_schema": {
                                    "name": name,
                                    "schema": schema,
                                    "strict": strict,
                                }
                            }),
                        );
                    }
                    ResponseFormat::Text => {}
                }
            }
        }

        let resp = self
            .client
            .post(format!("{}/completions", self.base_url))
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await
            .context("cloud completions request failed")?;
        if resp.status() == reqwest::StatusCode::NOT_FOUND {
            let messages = vec![serde_json::json!({"role": "user", "content": prompt})];
            return self.chat(model, messages, tools, response_format).await;
        }
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            anyhow::bail!("cloud completions request failed: HTTP {status} {text}");
        }

        let data: serde_json::Value = resp
            .json()
            .await
            .context("Failed to parse cloud completions response")?;

        if let Some(tool_calls) = data["choices"][0]["message"]["tool_calls"].as_array() {
            if !tool_calls.is_empty() {
                return Ok(serde_json::to_string(tool_calls)?);
            }
        }

        data["choices"][0]["text"]
            .as_str()
            .map(|s| s.to_string())
            .or_else(|| {
                data["choices"][0]["message"]["content"]
                    .as_str()
                    .map(|s| s.to_string())
            })
            .context("cloud response missing completion text")
    }

    /// Chat completion (`POST /v1/chat/completions`).
    pub async fn chat(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        self.chat_meta(model, messages, tools, None, response_format)
            .await
            .map(|c| c.content)
    }

    /// Chat completion that also exposes the backend's `finish_reason` so the
    /// agent loop can continue when the model is truncated or still calling tools.
    /// Retries automatically on 429/500/502/503 with exponential backoff.
    pub async fn chat_meta(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
    ) -> Result<ChatCompletion> {
        let max_tokens = 16384;
        let mut body = CloudChatRequest {
            model: model.to_string(),
            messages,
            stream: false,
            max_tokens,
            tools: tools.cloned(),
            tool_choice: tool_choice.cloned(),
            response_format: None,
        };
        if let Some(rf) = response_format {
            body.response_format = Some(rf.clone());
        }

        const MAX_RETRIES: u32 = 1;
        let mut last_err: Option<anyhow::Error> = None;

        for attempt in 0..=MAX_RETRIES {
            let resp = self
                .client
                .post(format!("{}/chat/completions", self.base_url))
                .bearer_auth(&self.api_key)
                .json(&body)
                .send()
                .await
                .context("cloud chat request failed")?;

            if resp.status().is_success() {
                let data: CloudChatResponse = resp
                    .json()
                    .await
                    .context("Failed to parse cloud chat response")?;
                let choice = data
                    .choices
                    .into_iter()
                    .next()
                    .context("cloud chat response contained no choices")?;
                let tool_calls = choice.message.tool_calls.unwrap_or_default();
                let usage = data.usage.map(|u| TokenUsage {
                    prompt_tokens: u.prompt_tokens,
                    completion_tokens: u.completion_tokens,
                    total_tokens: u.total_tokens,
                });
                return Ok(ChatCompletion {
                    content: choice.message.content.unwrap_or_default(),
                    tool_calls,
                    finish_reason: choice.finish_reason,
                    usage,
                });
            }

            let status = resp.status();
            let status_code = status.as_u16();
            let text = resp.text().await.unwrap_or_default();
            let retryable =
                status_code == 429 || status_code == 500 || status_code == 502 || status_code == 503;

            if retryable && attempt < MAX_RETRIES {
                let backoff_ms = match status_code {
                    429 => 2000u64 * 2u64.pow(attempt), // longer for rate limits
                    _ => 500u64 * 2u64.pow(attempt),
                };
                log::warn!(
                    "cloud chat HTTP {status_code} (attempt {}/{}); retrying in {}ms",
                    attempt + 1,
                    MAX_RETRIES,
                    backoff_ms
                );
                tokio::time::sleep(std::time::Duration::from_millis(backoff_ms)).await;
                last_err = Some(anyhow::anyhow!(
                    "cloud chat: HTTP {status} {text}"
                ));
                continue;
            }

            anyhow::bail!("cloud chat request failed: HTTP {status} {text}");
        }

        Err(last_err.unwrap_or_else(|| anyhow::anyhow!("cloud chat failed after retries")))
    }

    /// Stream a chat completion (SSE), feeding content deltas to `on_token`
    /// and structured tool-call deltas to `on_tool_call_delta`.
    pub async fn stream_chat(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
        on_tool_call_delta: &mut dyn FnMut(usize, Option<&str>, &str),
    ) -> Result<String> {
        let mut body = CloudStreamRequest {
            model: model.to_string(),
            messages,
            stream: true,
            max_tokens: 16384,
            tools: tools.cloned(),
            tool_choice: None,
            response_format: None,
        };
        if let Some(rf) = response_format {
            body.response_format = Some(rf.clone());
        }

        let mut resp = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await
            .context("cloud stream request failed")?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            anyhow::bail!("cloud stream request failed: HTTP {status} {text}");
        }

        let mut buffer: Vec<u8> = Vec::new();
        let mut full = String::new();
        loop {
            let Some(chunk) = resp.chunk().await.context("cloud stream read failed")? else {
                break;
            };
            buffer.extend_from_slice(&chunk);
            while let Some(pos) = buffer.iter().position(|&b| b == b'\n') {
                let line: Vec<u8> = buffer.drain(..=pos).collect();
                let line = String::from_utf8_lossy(&line).trim().to_string();
                let Some(data) = line.strip_prefix("data:") else {
                    continue;
                };
                let data = data.trim();
                if data == "[DONE]" {
                    return Ok(full);
                }
                if data.is_empty() {
                    continue;
                }
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(delta) = v["choices"][0]["delta"].as_object() {
                        if let Some(content) = delta.get("content").and_then(|c| c.as_str()) {
                            if !content.is_empty() {
                                on_token(content);
                                full.push_str(content);
                            }
                        }
                        if let Some(tcs) = delta.get("tool_calls").and_then(|t| t.as_array()) {
                            for tc in tcs {
                                let index = tc.get("index").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
                                let name = tc.get("function").and_then(|f| f.get("name")).and_then(|v| v.as_str());
                                let args = tc.get("function").and_then(|f| f.get("arguments")).and_then(|v| v.as_str()).unwrap_or("");
                                if !args.is_empty() {
                                    on_tool_call_delta(index, name, args);
                                }
                                on_token(
                                    &serde_json::json!({
                                        "tool_call": tc
                                    })
                                    .to_string(),
                                );
                            }
                        }
                    }
                }
            }
        }
        Ok(full)
    }

    /// Stream a chat completion (SSE) for the conversation API, feeding content
    /// deltas to `on_token` while accumulating tool calls, finish reason and
    /// usage into a normal [`ChatCompletion`]. Unlike [`Self::stream_chat`],
    /// tool-call chunks are NOT echoed through `on_token` — the caller owns the
    /// typed tool calls.
    pub async fn stream_chat_meta(
        &self,
        model: &str,
        messages: Vec<serde_json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
    ) -> Result<ChatCompletion> {
        let mut body = CloudStreamRequest {
            model: model.to_string(),
            messages,
            stream: true,
            max_tokens: 16384,
            tools: tools.cloned(),
            tool_choice: tool_choice.cloned(),
            response_format: None,
        };
        if let Some(rf) = response_format {
            body.response_format = Some(rf.clone());
        }

        let mut resp = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await
            .context("cloud stream request failed")?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            anyhow::bail!("cloud stream request failed: HTTP {status} {text}");
        }

        let mut buffer: Vec<u8> = Vec::new();
        let mut content = String::new();
        let mut tool_calls: Vec<ToolCall> = Vec::new();
        let mut finish_reason: Option<String> = None;
        let mut usage: Option<TokenUsage> = None;
        loop {
            let Some(chunk) = resp.chunk().await.context("cloud stream read failed")? else {
                break;
            };
            buffer.extend_from_slice(&chunk);
            let mut done = false;
            while let Some(pos) = buffer.iter().position(|&b| b == b'\n') {
                let line: Vec<u8> = buffer.drain(..=pos).collect();
                let line = String::from_utf8_lossy(&line).trim().to_string();
                let Some(data) = line.strip_prefix("data:") else {
                    continue;
                };
                let data = data.trim();
                if data == "[DONE]" {
                    done = true;
                    break;
                }
                if data.is_empty() {
                    continue;
                }
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(choice) = v["choices"][0].as_object() {
                        if let Some(reason) = choice
                            .get("finish_reason")
                            .and_then(|r| r.as_str())
                            .filter(|r| !r.is_empty())
                        {
                            finish_reason = Some(reason.to_string());
                        }
                        if let Some(delta) = choice.get("delta").and_then(|d| d.as_object()) {
                            if let Some(chunk) = delta.get("content").and_then(|c| c.as_str()) {
                                if !chunk.is_empty() {
                                    on_token(chunk);
                                    content.push_str(chunk);
                                }
                            }
                            if let Some(tcs) = delta.get("tool_calls").and_then(|t| t.as_array()) {
                                for tc in tcs {
                                    let index = tc
                                        .get("index")
                                        .and_then(|v| v.as_u64())
                                        .unwrap_or(0) as usize;
                                    while tool_calls.len() <= index {
                                        tool_calls.push(ToolCall {
                                            id: String::new(),
                                            r#type: function_call_type(),
                                            function: ToolCallFunction {
                                                name: String::new(),
                                                arguments: String::new(),
                                            },
                                        });
                                    }
                                    if let Some(id) = tc.get("id").and_then(|v| v.as_str()) {
                                        if !id.is_empty() {
                                            tool_calls[index].id = id.to_string();
                                        }
                                    }
                                    if let Some(name) = tc
                                        .get("function")
                                        .and_then(|f| f.get("name"))
                                        .and_then(|v| v.as_str())
                                    {
                                        if !name.is_empty() {
                                            tool_calls[index].function.name = name.to_string();
                                        }
                                    }
                                    if let Some(args) = tc
                                        .get("function")
                                        .and_then(|f| f.get("arguments"))
                                        .and_then(|v| v.as_str())
                                    {
                                        if !args.is_empty() {
                                            tool_calls[index].function.arguments.push_str(args);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if let Some(u) = v.get("usage") {
                        usage = Some(TokenUsage {
                            prompt_tokens: u
                                .get("prompt_tokens")
                                .and_then(|x| x.as_u64())
                                .unwrap_or(0) as usize,
                            completion_tokens: u
                                .get("completion_tokens")
                                .and_then(|x| x.as_u64())
                                .unwrap_or(0) as usize,
                            total_tokens: u
                                .get("total_tokens")
                                .and_then(|x| x.as_u64())
                                .unwrap_or(0) as usize,
                        });
                    }
                }
            }
            if done {
                break;
            }
        }
        Ok(ChatCompletion {
            content,
            tool_calls,
            finish_reason,
            usage,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tool_def(name: &str) -> ToolDef {
        ToolDef {
            r#type: "function".into(),
            function: ToolFunction {
                name: name.into(),
                description: "desc".into(),
                parameters: serde_json::json!({ "type": "object", "properties": {} }),
            },
        }
    }

    #[test]
    fn tool_def_serializes_to_openai_shape() {
        let v = serde_json::to_value(tool_def("read_file")).unwrap();
        assert_eq!(v["type"], "function");
        assert_eq!(v["function"]["name"], "read_file");
        assert_eq!(v["function"]["description"], "desc");
        assert_eq!(v["function"]["parameters"]["type"], "object");
    }

    #[test]
    fn tool_call_parses_string_arguments() {
        let json = r#"[{"id":"call_1","type":"function","function":{"name":"run_command","arguments":"{\"command\":\"cargo test\"}"}}]"#;
        let calls: Vec<ToolCall> = serde_json::from_str(json).unwrap();
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].id, "call_1");
        assert_eq!(calls[0].function.name, "run_command");
        assert_eq!(calls[0].function.arguments, r#"{"command":"cargo test"}"#);
    }

    #[test]
    fn tool_call_normalizes_object_arguments() {
        let json = r#"[{"function":{"name":"replace_exact","arguments":{"path":"src/lib.rs","old":"a","new":"b"}}}]"#;
        let calls: Vec<ToolCall> = serde_json::from_str(json).unwrap();
        let arguments: serde_json::Value =
            serde_json::from_str(&calls[0].function.arguments).unwrap();
        assert_eq!(calls[0].r#type, "function");
        assert_eq!(arguments["path"], "src/lib.rs");
        assert_eq!(arguments["old"], "a");
    }

    #[test]
    fn cloud_response_keeps_text_tools_and_finish_reason_separate() {
        let json = r#"{"choices":[{"message":{"content":"working","tool_calls":[{"id":"c1","type":"function","function":{"name":"read_file","arguments":{"path":"src/lib.rs"}}}]},"finish_reason":"tool_calls"}]}"#;
        let response: CloudChatResponse = serde_json::from_str(json).unwrap();
        let choice = &response.choices[0];
        assert_eq!(choice.message.content.as_deref(), Some("working"));
        assert_eq!(choice.finish_reason.as_deref(), Some("tool_calls"));
        assert_eq!(choice.message.tool_calls.as_ref().unwrap().len(), 1);
    }

    #[test]
    fn ollama_response_accepts_null_content_and_object_arguments() {
        let json = r#"{"message":{"content":null,"tool_calls":[{"function":{"name":"run_tests","arguments":{}}}]},"done_reason":"stop"}"#;
        let response: ChatResponse = serde_json::from_str(json).unwrap();
        assert!(response.message.content.is_none());
        assert_eq!(response.done_reason.as_deref(), Some("stop"));
        assert_eq!(
            response.message.tool_calls.unwrap()[0].function.arguments,
            "{}"
        );
    }

    #[test]
    fn empty_tool_calls_array_parses_to_empty() {
        let calls: Vec<ToolCall> = serde_json::from_str("[]").unwrap();
        assert!(calls.is_empty());
    }

    #[test]
    fn response_format_json_schema_serializes_variant() {
        let rf = ResponseFormat::JsonSchema {
            name: "plan".into(),
            schema: serde_json::json!({ "type": "object" }),
            strict: true,
        };
        let v = serde_json::to_value(&rf).unwrap();
        assert_eq!(v["JsonSchema"]["name"], "plan");
        assert_eq!(v["JsonSchema"]["strict"], true);
    }

    #[test]
    fn cloud_client_trims_trailing_slash() {
        let c = CloudClient::new("https://integrate.api.nvidia.com/", "k");
        assert_eq!(c.base_url, "https://integrate.api.nvidia.com");
        assert_eq!(c.api_key, "k");
    }

    #[test]
    fn ollama_client_trims_trailing_slash() {
        let c = OllamaClient::new("http://localhost:11434/");
        assert_eq!(c.host, "http://localhost:11434");
    }

    #[test]
    fn tool_choice_serializes_openai_variants() {
        assert_eq!(
            serde_json::to_value(ToolChoice::Auto).unwrap(),
            serde_json::json!("auto")
        );
        assert_eq!(
            serde_json::to_value(ToolChoice::None).unwrap(),
            serde_json::json!("none")
        );
        assert_eq!(
            serde_json::to_value(ToolChoice::Required).unwrap(),
            serde_json::json!("required")
        );
        assert_eq!(
            serde_json::to_value(ToolChoice::Function("run_tests".into())).unwrap(),
            serde_json::json!({"type": "function", "function": {"name": "run_tests"}})
        );
    }

    #[test]
    fn chat_request_omits_tool_choice_when_absent() {
        let req = ChatRequest {
            model: "qwen3:1.7b".into(),
            messages: vec![],
            stream: false,
            max_tokens: 16384,
            tools: None,
            tool_choice: None,
        };
        let value = serde_json::to_value(&req).unwrap();
        assert!(value.get("tool_choice").is_none());
        assert!(value.get("tools").is_none());
    }

    #[test]
    fn chat_request_includes_model_messages_and_tools() {
        let req = ChatRequest {
            model: "qwen3:1.7b".into(),
            messages: vec![serde_json::json!({ "role": "user", "content": "hi" })],
            stream: false,
            max_tokens: 16384,
            tools: Some(vec![tool_def("run_command")]),
            tool_choice: Some(ToolChoice::Required),
        };
        let v = serde_json::to_value(&req).unwrap();
        assert_eq!(v["model"], "qwen3:1.7b");
        assert_eq!(v["messages"][0]["role"], "user");
        assert_eq!(v["tools"][0]["function"]["name"], "run_command");
    }
}

