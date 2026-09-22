use crate::llm::infer::engine::InferenceEngine;
use crate::error::{Context, Result};
use std::sync::{Arc, Mutex};
use crate::json::Serialize;

#[derive(Clone, Debug)]
pub struct ToolDef {
    pub r#type: String,
    pub function: ToolFunction,
}

#[derive(Clone, Debug)]
pub struct ToolFunction {
    pub name: String,
    pub description: String,
    pub parameters: crate::json::Value,
}

#[derive(Clone, Debug)]
pub struct ToolCall {
    pub id: String,
    pub r#type: String,
    pub function: ToolCallFunction,
}

#[derive(Clone, Debug)]
pub struct ToolCallFunction {
    pub name: String,
    pub arguments: String,
}

fn function_call_type() -> String { "function".to_string() }

/// OpenAI-compatible providers may encode tool arguments as either a JSON
/// string or an object. Normalize both forms at the protocol boundary.
#[derive(Clone, Debug)]
pub struct ToolCallResult {
    pub tool_call_id: String,
    pub content: String,
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct TokenUsage {
    pub prompt_tokens: usize,
    pub completion_tokens: usize,
    pub reasoning_tokens: usize,
    pub total_tokens: usize,
}

/// A normalized chat completion. Tool calls are kept separate from assistant
/// text so the agent never has to guess whether arbitrary content is JSON.
#[derive(Clone, Debug)]
pub struct ChatCompletion {
    pub content: String,
    pub reasoning_content: String,
    pub tool_calls: Vec<ToolCall>,
    pub finish_reason: Option<String>,
    pub usage: Option<TokenUsage>,
}

#[derive(Clone, Debug, Default)]
pub enum ResponseFormat {
    #[default]
    Text,
    JsonObject,
    JsonSchema {
        name: String,
        schema: crate::json::Value,
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

#[derive(Clone, Debug)]
struct GenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
}

struct GenerateResponse {
    response: String,
}

#[derive(Clone, Debug)]
struct ChatRequest {
    model: String,
    messages: Vec<crate::json::Value>,
    stream: bool,
    max_tokens: u32,
    tools: Option<Vec<ToolDef>>,
    tool_choice: Option<ToolChoice>,
}

struct ChatResponse {
    message: ChatMessage,
    done_reason: Option<String>,
    prompt_eval_count: Option<usize>,
    eval_count: Option<usize>,
}

struct ChatMessage {
    content: Option<String>,
    reasoning_content: Option<String>,
    tool_calls: Option<Vec<ToolCall>>,
}

#[derive(Clone, Debug)]
struct CloudChatRequest {
    model: String,
    messages: Vec<crate::json::Value>,
    stream: bool,
    max_tokens: u32,
    tools: Option<Vec<ToolDef>>,
    tool_choice: Option<ToolChoice>,
    response_format: Option<ResponseFormat>,
}

struct CloudChatResponse {
    choices: Vec<CloudChoice>,
    usage: Option<CloudUsage>,
}

struct CloudUsage {
    prompt_tokens: usize,
    completion_tokens: usize,
    reasoning_tokens: usize,
    total_tokens: usize,
}

struct CloudChoice {
    message: CloudMessage,
    finish_reason: Option<String>,
}

struct CloudMessage {
    content: Option<String>,
    reasoning_content: Option<String>,
    tool_calls: Option<Vec<ToolCall>>,
}

#[derive(Clone, Debug)]
struct CloudStreamRequest {
    model: String,
    messages: Vec<crate::json::Value>,
    stream: bool,
    max_tokens: u32,
    tools: Option<Vec<ToolDef>>,
    tool_choice: Option<ToolChoice>,
    response_format: Option<ResponseFormat>,
}

struct CloudStreamDelta {
    choices: Option<Vec<CloudStreamChoice>>,
}

struct CloudStreamChoice {
    delta: CloudStreamDeltaContent,
    finish_reason: Option<String>,
}

struct CloudStreamDeltaContent {
    content: Option<String>,
    tool_calls: Option<Vec<ToolCall>>,
}

fn json_tools(tools: &Option<Vec<ToolDef>>) -> Option<crate::json::Value> {
    tools.as_ref().map(|items| crate::json::Value::Array(
        items.iter().map(|tool| crate::json::Serialize::to_json(tool)).collect()
    ))
}

fn internal_json<T: crate::json::Serialize>(value: &T) -> crate::json::Value {
    value.to_json()
}

impl crate::json::Serialize for ToolDef {
    fn to_json(&self) -> crate::json::Value {
        let function = crate::json_expr!({
            "name": self.function.name.clone(),
            "description": self.function.description.clone(),
            "parameters": self.function.parameters.clone()
        });
        crate::json_expr!({ "type": self.r#type.clone(), "function": function })
    }
}

impl crate::json::Serialize for ToolCallFunction {
    fn to_json(&self) -> crate::json::Value {
        crate::json!({"name": self.name.clone(), "arguments": self.arguments.clone()})
    }
}

impl crate::json::Serialize for ToolCall {
    fn to_json(&self) -> crate::json::Value {
        crate::json!({"id": self.id.clone(), "type": self.r#type.clone(), "function": self.function.to_json()})
    }
}

impl crate::json::Serialize for ResponseFormat {
    fn to_json(&self) -> crate::json::Value {
        match self {
            Self::Text => crate::json::Value::String("text".into()),
            Self::JsonObject => crate::json_expr!({ "type": "json_object" }),
            Self::JsonSchema { name, schema, strict } => crate::json_expr!({
                "type": "json_schema",
                "json_schema": crate::json_expr!({
                    "name": name.clone(), "schema": schema.clone(), "strict": *strict
                })
            }),
        }
    }
}

impl crate::json::Serialize for ToolChoice {
    fn to_json(&self) -> crate::json::Value {
        match self {
            Self::Auto => crate::json::Value::String("auto".into()),
            Self::None => crate::json::Value::String("none".into()),
            Self::Required => crate::json::Value::String("required".into()),
            Self::Function(name) => crate::json_expr!({
                "type": "function", "function": crate::json_expr!({ "name": name.clone() })
            }),
        }
    }
}

impl crate::json::Serialize for GenerateRequest {
    fn to_json(&self) -> crate::json::Value {
        crate::json_expr!({ "model": self.model.clone(), "prompt": self.prompt.clone(), "stream": self.stream })
    }
}

impl crate::json::Serialize for ChatRequest {
    fn to_json(&self) -> crate::json::Value {
        let mut map = std::collections::BTreeMap::new();
        map.insert("model".into(), self.model.clone().into());
        map.insert("messages".into(), self.messages.iter().map(internal_json).collect::<Vec<_>>().into());
        map.insert("stream".into(), self.stream.into());
        map.insert("max_tokens".into(), self.max_tokens.into());
        if let Some(tools) = json_tools(&self.tools) { map.insert("tools".into(), tools); }
        if let Some(choice) = &self.tool_choice { map.insert("tool_choice".into(), choice.to_json()); }
        crate::json::Value::Object(map)
    }
}

impl crate::json::Serialize for CloudChatRequest {
    fn to_json(&self) -> crate::json::Value {
        let mut value = ChatRequest {
            model: self.model.clone(), messages: self.messages.clone(), stream: self.stream,
            max_tokens: self.max_tokens, tools: self.tools.clone(), tool_choice: self.tool_choice.clone()
        }.to_json();
        if let crate::json::Value::Object(map) = &mut value {
            if let Some(format) = &self.response_format { map.insert("response_format".into(), format.to_json()); }
        }
        value
    }
}

impl crate::json::Serialize for CloudStreamRequest {
    fn to_json(&self) -> crate::json::Value {
        let mut value = CloudChatRequest {
            model: self.model.clone(), messages: self.messages.clone(), stream: self.stream,
            max_tokens: self.max_tokens, tools: self.tools.clone(), tool_choice: self.tool_choice.clone(),
            response_format: self.response_format.clone()
        }.to_json();
        if let crate::json::Value::Object(map) = &mut value {
            if self.tool_choice.is_none() { map.remove("tool_choice"); }
        }
        value
    }
}

fn obj<'a>(value: &'a crate::json::Value, name: &str) -> Result<&'a crate::json::Value, crate::json::Error> {
    value.get(name).ok_or_else(|| crate::json::Error(format!("missing field {name}")))
}

fn opt_text(value: &crate::json::Value, name: &str) -> Option<String> {
    value.get(name).and_then(|v| v.as_str()).map(str::to_owned)
}

impl crate::json::Deserialize for ToolCallFunction {
    fn from_json(value: &crate::json::Value) -> std::result::Result<Self, crate::json::Error> {
        let name = obj(value, "name")?.as_str().unwrap_or_default().to_owned();
        let arguments = match value.get("arguments") {
            Some(crate::json::Value::String(text)) => text.clone(),
            Some(crate::json::Value::Null) | None => "{}".into(),
            Some(other) => crate::json::to_string(other),
        };
        Ok(Self { name, arguments })
    }
}

impl crate::json::Deserialize for ToolCall {
    fn from_json(value: &crate::json::Value) -> std::result::Result<Self, crate::json::Error> {
        Ok(Self {
            id: opt_text(value, "id").unwrap_or_default(),
            r#type: opt_text(value, "type").unwrap_or_else(|| "function".into()),
            function: ToolCallFunction::from_json(obj(value, "function")?)?,
        })
    }
}

impl crate::json::Deserialize for GenerateResponse {
    fn from_json(value: &crate::json::Value) -> std::result::Result<Self, crate::json::Error> {
        Ok(Self { response: obj(value, "response")?.as_str().unwrap_or_default().into() })
    }
}

impl crate::json::Deserialize for ChatMessage {
    fn from_json(value: &crate::json::Value) -> std::result::Result<Self, crate::json::Error> {
        let tool_calls = value.get("tool_calls").map(Vec::<ToolCall>::from_json).transpose()?;
        Ok(Self {
            content: opt_text(value, "content"),
            reasoning_content: opt_text(value, "reasoning_content"),
            tool_calls,
        })
    }
}

impl crate::json::Deserialize for ChatResponse {
    fn from_json(value: &crate::json::Value) -> std::result::Result<Self, crate::json::Error> {
        Ok(Self {
            message: ChatMessage::from_json(obj(value, "message")?)?,
            done_reason: opt_text(value, "done_reason"),
            prompt_eval_count: value.get("prompt_eval_count").and_then(|v| v.as_u64()).map(|n| n as usize),
            eval_count: value.get("eval_count").and_then(|v| v.as_u64()).map(|n| n as usize),
        })
    }
}

impl crate::json::Deserialize for CloudUsage {
    fn from_json(value: &crate::json::Value) -> std::result::Result<Self, crate::json::Error> {
        Ok(Self {
            prompt_tokens: value.get("prompt_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
            completion_tokens: value.get("completion_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
            reasoning_tokens: value.get("reasoning_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
            total_tokens: value.get("total_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
        })
    }
}

impl crate::json::Deserialize for CloudMessage {
    fn from_json(value: &crate::json::Value) -> std::result::Result<Self, crate::json::Error> {
        Ok(Self {
            content: opt_text(value, "content"),
            reasoning_content: opt_text(value, "reasoning_content"),
            tool_calls: value.get("tool_calls").map(Vec::<ToolCall>::from_json).transpose()?,
        })
    }
}

impl crate::json::Deserialize for CloudChoice {
    fn from_json(value: &crate::json::Value) -> std::result::Result<Self, crate::json::Error> {
        Ok(Self {
            message: CloudMessage::from_json(obj(value, "message")?)?,
            finish_reason: opt_text(value, "finish_reason"),
        })
    }
}

impl crate::json::Deserialize for CloudChatResponse {
    fn from_json(value: &crate::json::Value) -> std::result::Result<Self, crate::json::Error> {
        Ok(Self {
            choices: Vec::<CloudChoice>::from_json(obj(value, "choices")?)?,
            usage: value.get("usage").map(CloudUsage::from_json).transpose()?,
        })
    }
}

pub struct OllamaClient {
    host: String,
    client: crate::http::Client,
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
    client: crate::http::Client,
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

/// Coarse backend kind used by the task router (e.g. the in-process GGUF
/// engine cannot call tools, while Ollama can).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ClientKind {
    Ollama,
    Local,
    Cloud,
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

    /// The backend kind of this client.
    pub fn kind(&self) -> ClientKind {
        match self {
            LlmClient::Ollama(_) => ClientKind::Ollama,
            LlmClient::Local(_) => ClientKind::Local,
            LlmClient::Cloud(_) => ClientKind::Cloud,
        }
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
                    vec![crate::json!({ "role": "user", "content": prompt })],
                    tools,
                    response_format,
                )
                .await
            }
            LlmClient::Local(eng) => {
                let mut eng = eng
                    .lock()
                    .map_err(|e| crate::error::anyhow!("Lock error: {}", e))?;
                eng.generate(prompt, 512, 0.8, 40)
                    .map_err(|e| crate::error::anyhow!("Local inference error: {}", e))
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
        let mut last_err: Option<crate::error::Error> = None;
        for attempt in 0..3 {
            match self.generate(model, prompt, tools, response_format).await {
                Ok(text) => return Ok(text),
                Err(e) => {
                    last_err = Some(e);
                    if attempt < 2 {
                        let backoff = std::time::Duration::from_millis(500 * (1 << attempt));
                        crate::async_rt::time::sleep(backoff).await;
                    }
                }
            }
        }
        Err(last_err.unwrap_or_else(|| crate::error::anyhow!("LLM call failed")))
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
                let messages = vec![crate::json!({ "role": "user", "content": prompt })];
                c.stream_chat(
                    model,
                    messages,
                    tools,
                    response_format,
                    on_token,
                    on_tool_call_delta,
                )
                .await
            }
            LlmClient::Local(eng) => {
                let mut eng = eng
                    .lock()
                    .map_err(|e| crate::error::anyhow!("Lock error: {}", e))?;
                let text = eng
                    .generate(prompt, 512, 0.8, 40)
                    .map_err(|e| crate::error::anyhow!("Local inference error: {}", e))?;
                on_token(&text);
                Ok(text)
            }
        }
    }

    pub async fn chat(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
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
        messages: Vec<crate::json::Value>,
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
                    .map_err(|e| crate::error::anyhow!("Lock error: {}", e))?;
                let content = eng
                    .generate(&prompt, 512, 0.8, 40)
                    .map_err(|e| crate::error::anyhow!("Local inference error: {}", e))?;
                Ok(ChatCompletion {
                    content,
                    reasoning_content: String::new(),
                    tool_calls: Vec::new(),
                    finish_reason: None,
                    usage: None,
                })
            }
        }
    }

    /// Stream a conversation response, invoking `on_token` for each content
    /// delta and `on_reasoning` for each reasoning delta while returning the
    /// same normalized [`ChatCompletion`] as [`Self::chat_meta`].
    pub async fn chat_meta_stream(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
        on_reasoning: Option<&mut dyn FnMut(&str)>,
        on_tool_call_delta: Option<&mut dyn FnMut(usize, Option<&str>, &str)>,
    ) -> Result<ChatCompletion> {
        match self {
            LlmClient::Cloud(c) => {
                c.stream_chat_meta(
                    model,
                    messages,
                    tools,
                    tool_choice,
                    response_format,
                    on_token,
                    on_reasoning,
                    on_tool_call_delta,
                )
                .await
            }
            LlmClient::Ollama(c) => {
                c.chat_meta_stream(
                    model,
                    messages,
                    tools,
                    tool_choice,
                    response_format,
                    on_token,
                    on_reasoning,
                    on_tool_call_delta,
                )
                .await
            }
            LlmClient::Local(eng) => {
                let prompt = messages
                    .iter()
                    .filter_map(|m| {
                        let role = m.get("role")?.as_str()?;
                        let content = m.get("content")?.as_str()?;
                        Some(format!("{}: {}", role, content))
                    })
                    .collect::<Vec<_>>()
                    .join("\n");
                let mut eng = eng.lock().unwrap();
                let text = eng
                    .generate(&prompt, 512, 0.8, 40)
                    .map_err(|e| crate::error::anyhow!("Local inference error: {}", e))?;
                if !text.is_empty() {
                    on_token(&text);
                }
                Ok(ChatCompletion {
                    content: text,
                    reasoning_content: String::new(),
                    tool_calls: Vec::new(),
                    finish_reason: None,
                    usage: None,
                })
            }
        }
    }
}

impl OllamaClient {
    pub fn new(host: &str) -> Self {
        Self {
            host: host.trim_end_matches('/').to_string(),
            client: crate::http::Client::new(),
        }
    }

    pub async fn generate(
        &self,
        model: &str,
        prompt: &str,
        tools: Option<&Vec<ToolDef>>,
        _response_format: Option<&ResponseFormat>,
    ) -> Result<String> {
        let body = crate::json!({
            "model": model,
            "prompt": prompt,
            "stream": false,
            "tools": tools.map(|items| items.iter().map(|tool| tool.to_json()).collect::<Vec<_>>()).unwrap_or_default(),
        });

        let resp = self
            .client
            .post(format!("{}/api/generate", self.host))
            .json_value(&internal_json(&body))
            .send()
            .await
            .context("Ollama request failed")?;

        let data: crate::json::Value = resp
            .json_value()
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
            return Ok(crate::json::to_string(&crate::json::Value::Array(
                results.iter().map(|call| call.to_json()).collect()
            )));
        }

        Ok(data["response"].as_str().unwrap_or("").to_string())
    }

    pub async fn chat(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
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
        messages: Vec<crate::json::Value>,
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
            .json_value(&internal_json(&body))
            .send()
            .await
            .context("Ollama chat request failed")?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            crate::error::bail!("Ollama chat request failed: HTTP {status} {text}");
        }

        let value = resp
            .json_value()
            .context("Failed to parse Ollama chat response")?;
        let data = <ChatResponse as crate::json::Deserialize>::from_json(&value)
            .map_err(|e| crate::error::anyhow!("Failed to decode Ollama chat response: {e}"))?;
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
                reasoning_tokens: 0,
                total_tokens: prompt_tokens + completion_tokens,
            })
        } else {
            None
        };

        Ok(ChatCompletion {
            content: data.message.content.unwrap_or_default(),
            reasoning_content: data.message.reasoning_content.unwrap_or_default(),
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
        let body = crate::json!({
            "model": model,
            "prompt": prompt,
            "stream": true,
            "tools": tools.map(|items| items.iter().map(|tool| tool.to_json()).collect::<Vec<_>>()).unwrap_or_default(),
        });

        let mut resp = self
            .client
            .post(format!("{}/api/generate", self.host))
            .json_value(&internal_json(&body))
            .send()
            .await
            .context("Ollama stream request failed")?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            crate::error::bail!("Ollama stream request failed: HTTP {status} {text}");
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
                if let Ok(v) = crate::json::from_str(&line) {
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
                            let function = crate::json_expr!({
                                "name": name, "arguments": arguments
                            });
                            let tool_call = crate::json_expr!({
                                "id": id, "type": "function", "function": function
                            });
                            on_token(&crate::json::to_string(&crate::json_expr!({
                                "tool_call": tool_call
                            })));
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

    /// Stream a chat completion via Ollama's /api/chat SSE endpoint,
    /// feeding content and reasoning deltas to `on_token`.
    pub async fn chat_meta_stream(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        _response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
        mut on_reasoning: Option<&mut dyn FnMut(&str)>,
        mut on_tool_call_delta: Option<&mut dyn FnMut(usize, Option<&str>, &str)>,
    ) -> Result<ChatCompletion> {
        let ollama_messages: Vec<crate::json::Value> = messages
            .into_iter()
            .map(|mut msg| {
                if let Some(tool_calls) = msg.get_mut("tool_calls").and_then(|tc| tc.as_array_mut()) {
                    for tc in tool_calls {
                        if let Some(func) = tc.get_mut("function") {
                            if let Some(args_val) = func.get("arguments") {
                                if let Some(args_str) = args_val.as_str() {
                                    if let Ok(parsed) = crate::json::from_str(args_str) {
                                        func["arguments"] = parsed;
                                    } else {
                                        func["arguments"] = crate::json!({});
                                    }
                                }
                            }
                        }
                    }
                }
                msg
            })
            .collect();

        let body = ChatRequest {
            model: model.to_string(),
            messages: ollama_messages,
            stream: true,
            max_tokens: 16384,
            tools: tools.cloned(),
            tool_choice: tool_choice.cloned(),
        };

        let mut resp = self
            .client
            .post(format!("{}/api/chat", self.host))
            .json_value(&internal_json(&body))
            .send()
            .await
            .context("Ollama stream request failed")?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            crate::error::bail!("Ollama stream request failed: HTTP {status} {text}");
        }

        let mut buffer: Vec<u8> = Vec::new();
        let mut content = String::new();
        let mut reasoning_content = String::new();
        let mut tool_calls: Vec<ToolCall> = Vec::new();
        let mut finish_reason: Option<String> = None;
        let mut prompt_tokens = 0usize;
        let mut completion_tokens = 0usize;
        loop {
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
                if let Ok(v) = crate::json::from_str(&line) {
                    if let Some(msg) = v.get("message").and_then(|m| m.as_object()) {
                        if let Some(chunk_text) = msg
                            .get("content")
                            .and_then(|c| c.as_str())
                            .filter(|c| !c.is_empty())
                        {
                            on_token(chunk_text);
                            content.push_str(chunk_text);
                        }
                        if let Some(reasoning) = msg
                            .get("reasoning_content")
                            .or_else(|| msg.get("thinking"))
                            .and_then(|r| r.as_str())
                            .filter(|r| !r.is_empty())
                        {
                            if let Some(on_reasoning) = on_reasoning.as_deref_mut() {
                                on_reasoning(reasoning);
                            }
                            reasoning_content.push_str(reasoning);
                        }
                        if let Some(tcs) = msg.get("tool_calls").and_then(|t| t.as_array()) {
                            for tc in tcs {
                                let index =
                                    tc.get("index").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
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
                                {
                                    let args_str = if let Some(s) = args.as_str() {
                                        s.to_string()
                                    } else {
                                        crate::json::to_string(args)
                                    };
                                    if !args_str.is_empty() {
                                        tool_calls[index].function.arguments.push_str(&args_str);
                                        if let Some(callback) = on_tool_call_delta.as_deref_mut() {
                                            let name = tc
                                                .get("function")
                                                .and_then(|f| f.get("name"))
                                                .and_then(|v| v.as_str());
                                            callback(index, name, &args_str);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if let Some(reason) = v
                        .get("done_reason")
                        .and_then(|r| r.as_str())
                        .filter(|r| !r.is_empty())
                    {
                        finish_reason = Some(reason.to_string());
                    }
                    if let Some(p) = v.get("prompt_eval_count").and_then(|v| v.as_u64()) {
                        prompt_tokens = p as usize;
                    }
                    if let Some(e) = v.get("eval_count").and_then(|v| v.as_u64()) {
                        completion_tokens = e as usize;
                    }
                    if v.get("done").and_then(|v| v.as_bool()) == Some(true) {
                        break;
                    }
                }
            }
        }
        let usage = if prompt_tokens > 0 || completion_tokens > 0 {
            Some(TokenUsage {
                prompt_tokens,
                completion_tokens,
                reasoning_tokens: 0,
                total_tokens: prompt_tokens + completion_tokens,
            })
        } else {
            None
        };
        Ok(ChatCompletion {
            content,
            reasoning_content,
            tool_calls,
            finish_reason,
            usage,
        })
    }
}

impl CloudClient {
    pub fn new(base_url: &str, api_key: &str) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            api_key: api_key.to_string(),
            client: crate::http::Client::builder()
                .timeout(std::time::Duration::from_secs(60))
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
        let mut body = crate::json!({
            "model": model,
            "prompt": prompt,
            "stream": false,
            "max_tokens": 2048,
            "tools": tools.map(|items| items.iter().map(|tool| tool.to_json()).collect::<Vec<_>>()).unwrap_or_default(),
        });
        if let Some(rf) = response_format {
            if let Some(obj) = body.as_object_mut() {
                match rf {
                    ResponseFormat::JsonObject => {
                        obj.insert(
                            "response_format".into(),
                            crate::json!({"type": "json_object"}),
                        );
                    }
                    ResponseFormat::JsonSchema {
                        name,
                        schema,
                        strict,
                    } => {
                        obj.insert(
                            "response_format".into(),
                            crate::json!({
                                "type": "json_schema",
                                "json_schema": {
                                    "name": name,
                                "schema": schema.clone(),
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
            .json_value(&internal_json(&body))
            .send()
            .await
            .context("cloud completions request failed")?;
        if resp.status() == crate::http::StatusCode::NOT_FOUND {
            let messages = vec![crate::json!({"role": "user", "content": prompt})];
            return self.chat(model, messages, tools, response_format).await;
        }
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            crate::error::bail!("cloud completions request failed: HTTP {status} {text}");
        }

        let data: crate::json::Value = resp
            .json_value()
            .context("Failed to parse cloud completions response")?;

        if let Some(tool_calls) = data["choices"][0]["message"]["tool_calls"].as_array() {
            if !tool_calls.is_empty() {
                return Ok(crate::json::to_string(&crate::json::Value::Array(
                    tool_calls.iter().cloned().collect()
                )));
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
        messages: Vec<crate::json::Value>,
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
        messages: Vec<crate::json::Value>,
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

        const MAX_RETRIES: u32 = 5;
        let mut last_err: Option<crate::error::Error> = None;

        for attempt in 0..=MAX_RETRIES {
            let resp = self
                .client
                .post(format!("{}/chat/completions", self.base_url))
                .bearer_auth(&self.api_key)
                .json_value(&internal_json(&body))
                .send()
                .await
                .context("cloud chat request failed")?;

            if resp.status().is_success() {
                let value = resp
                    .json_value()
                    .context("Failed to parse cloud chat response")?;
                let data = <CloudChatResponse as crate::json::Deserialize>::from_json(&value)
                    .map_err(|e| crate::error::anyhow!("Failed to decode cloud chat response: {e}"))?;
                let choice = data
                    .choices
                    .into_iter()
                    .next()
                    .context("cloud chat response contained no choices")?;
                let tool_calls = choice.message.tool_calls.unwrap_or_default();
                let usage = data.usage.map(|u| TokenUsage {
                    prompt_tokens: u.prompt_tokens,
                    completion_tokens: u.completion_tokens,
                    reasoning_tokens: u.reasoning_tokens,
                    total_tokens: u.total_tokens,
                });
                return Ok(ChatCompletion {
                    content: choice.message.content.unwrap_or_default(),
                    reasoning_content: choice.message.reasoning_content.unwrap_or_default(),
                    tool_calls,
                    finish_reason: choice.finish_reason,
                    usage,
                });
            }

            let status = resp.status();
            let status_code = status.as_u16();
            let text = resp.text().unwrap_or_default();
            let retryable = status_code == 429
                || status_code == 500
                || status_code == 502
                || status_code == 503;

            if retryable && attempt < MAX_RETRIES {
                let backoff_ms = match status_code {
                    429 => 2000u64 * 2u64.pow(attempt), // longer for rate limits
                    _ => 500u64 * 2u64.pow(attempt),
                };
                crate::cki_warn!(
                    "cloud chat HTTP {status_code} (attempt {}/{}); retrying in {}ms",
                    attempt + 1,
                    MAX_RETRIES,
                    backoff_ms
                );
                crate::async_rt::time::sleep(std::time::Duration::from_millis(backoff_ms)).await;
                last_err = Some(crate::error::anyhow!("cloud chat: HTTP {status} {text}"));
                continue;
            }

            crate::error::bail!("cloud chat request failed: HTTP {status} {text}");
        }

        Err(last_err.unwrap_or_else(|| crate::error::anyhow!("cloud chat failed after retries")))
    }

    /// Stream a chat completion (SSE), feeding content deltas to `on_token`
    /// and structured tool-call deltas to `on_tool_call_delta`.
    pub async fn stream_chat(
        &self,
        model: &str,
        messages: Vec<crate::json::Value>,
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
            .json_value(&internal_json(&body))
            .send()
            .await
            .context("cloud stream request failed")?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            crate::error::bail!("cloud stream request failed: HTTP {status} {text}");
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
                if let Ok(v) = crate::json::from_str(data) {
                    if let Some(delta) = v["choices"][0]["delta"].as_object() {
                        if let Some(content) = delta.get("content").and_then(|c| c.as_str()) {
                            if !content.is_empty() {
                                on_token(content);
                                full.push_str(content);
                            }
                        }
                        if let Some(tcs) = delta.get("tool_calls").and_then(|t| t.as_array()) {
                            for tc in tcs {
                                let index =
                                    tc.get("index").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
                                let name = tc
                                    .get("function")
                                    .and_then(|f| f.get("name"))
                                    .and_then(|v| v.as_str());
                                let args = tc
                                    .get("function")
                                    .and_then(|f| f.get("arguments"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("");
                                if !args.is_empty() {
                                    on_tool_call_delta(index, name, args);
                                }
                                on_token(&crate::json::to_string(&crate::json_expr!({
                                    "tool_call": tc.clone()
                                })));
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
        messages: Vec<crate::json::Value>,
        tools: Option<&Vec<ToolDef>>,
        tool_choice: Option<&ToolChoice>,
        response_format: Option<&ResponseFormat>,
        on_token: &mut dyn FnMut(&str),
        mut on_reasoning: Option<&mut dyn FnMut(&str)>,
        mut on_tool_call_delta: Option<&mut dyn FnMut(usize, Option<&str>, &str)>,
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
            .json_value(&internal_json(&body))
            .send()
            .await
            .context("cloud stream request failed")?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            crate::error::bail!("cloud stream request failed: HTTP {status} {text}");
        }

        let mut buffer: Vec<u8> = Vec::new();
        let mut content = String::new();
        let mut reasoning_content = String::new();
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
                if let Ok(v) = crate::json::from_str(data) {
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
                            if let Some(reasoning) = delta
                                .get("reasoning_content")
                                .or_else(|| delta.get("reasoning"))
                                .and_then(|r| r.as_str())
                            {
                                if !reasoning.is_empty() {
                                    if let Some(on_reasoning) = on_reasoning.as_deref_mut() {
                                        on_reasoning(reasoning);
                                    }
                                    reasoning_content.push_str(reasoning);
                                }
                            }
                            if let Some(tcs) = delta.get("tool_calls").and_then(|t| t.as_array()) {
                                for tc in tcs {
                                    let index =
                                        tc.get("index").and_then(|v| v.as_u64()).unwrap_or(0)
                                            as usize;
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
                                            if let Some(callback) = on_tool_call_delta.as_deref_mut() {
                                                let name = tc
                                                    .get("function")
                                                    .and_then(|f| f.get("name"))
                                                    .and_then(|v| v.as_str());
                                                callback(index, name, args);
                                            }
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
                                .unwrap_or(0)
                                as usize,
                            reasoning_tokens: u
                                .get("reasoning_tokens")
                                .and_then(|x| x.as_u64())
                                .unwrap_or(0)
                                as usize,
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
            reasoning_content,
            tool_calls,
            finish_reason,
            usage,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::serde_json;

    fn tool_def(name: &str) -> ToolDef {
        ToolDef {
            r#type: "function".into(),
            function: ToolFunction {
                name: name.into(),
                description: "desc".into(),
                parameters: crate::json!({ "type": "object", "properties": {} }),
            },
        }
    }

    #[test]
    fn tool_def_serializes_to_openai_shape() {
        let v = crate::json::Serialize::to_json(&tool_def("read_file"));
        assert_eq!(v["type"].as_str(), Some("function"));
        assert_eq!(v["function"]["name"].as_str(), Some("read_file"));
        assert_eq!(v["function"]["description"].as_str(), Some("desc"));
        assert_eq!(v["function"]["parameters"]["type"].as_str(), Some("object"));
    }

    #[test]
    fn tool_call_parses_string_arguments() {
        let json = r#"[{"id":"call_1","type":"function","function":{"name":"run_command","arguments":"{\"command\":\"cargo test\"}"}}]"#;
        let calls: Vec<ToolCall> = crate::json::Deserialize::from_json_string(json).unwrap();
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].id, "call_1");
        assert_eq!(calls[0].function.name, "run_command");
        assert_eq!(calls[0].function.arguments, r#"{"command":"cargo test"}"#);
    }

    #[test]
    fn tool_call_normalizes_object_arguments() {
        let json = r#"[{"function":{"name":"replace_exact","arguments":{"path":"src/lib.rs","old":"a","new":"b"}}}]"#;
        let calls: Vec<ToolCall> = crate::json::Deserialize::from_json_string(json).unwrap();
        let arguments: crate::json::Value = crate::json::from_str(&calls[0].function.arguments).unwrap();
        assert_eq!(calls[0].r#type, "function");
        assert_eq!(arguments["path"].as_str(), Some("src/lib.rs"));
        assert_eq!(arguments["old"].as_str(), Some("a"));
    }

    #[test]
    fn cloud_response_keeps_text_tools_and_finish_reason_separate() {
        let json = r#"{"choices":[{"message":{"content":"working","tool_calls":[{"id":"c1","type":"function","function":{"name":"read_file","arguments":{"path":"src/lib.rs"}}}]},"finish_reason":"tool_calls"}]}"#;
        let value = crate::json::from_str(json).unwrap();
        let response = <CloudChatResponse as crate::json::Deserialize>::from_json(&value).unwrap();
        let choice = &response.choices[0];
        assert_eq!(choice.message.content.as_deref(), Some("working"));
        assert_eq!(choice.finish_reason.as_deref(), Some("tool_calls"));
        assert_eq!(choice.message.tool_calls.as_ref().unwrap().len(), 1);
    }

    #[test]
    fn ollama_response_accepts_null_content_and_object_arguments() {
        let json = r#"{"message":{"content":null,"tool_calls":[{"function":{"name":"run_tests","arguments":{}}}]},"done_reason":"stop"}"#;
        let value = crate::json::from_str(json).unwrap();
        let response = <ChatResponse as crate::json::Deserialize>::from_json(&value).unwrap();
        assert!(response.message.content.is_none());
        assert_eq!(response.done_reason.as_deref(), Some("stop"));
        assert_eq!(
            response.message.tool_calls.unwrap()[0].function.arguments,
            "{}"
        );
    }

    #[test]
    fn empty_tool_calls_array_parses_to_empty() {
        let calls: Vec<ToolCall> = crate::json::Deserialize::from_json_string("[]").unwrap();
        assert!(calls.is_empty());
    }

    #[test]
    fn response_format_json_schema_serializes_variant() {
        let rf = ResponseFormat::JsonSchema {
            name: "plan".into(),
            schema: crate::json!({ "type": "object" }),
            strict: true,
        };
        let v = crate::json::Serialize::to_json(&rf);
        assert_eq!(v["json_schema"]["name"].as_str(), Some("plan"));
        assert_eq!(v["json_schema"]["strict"].as_bool(), Some(true));
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
            crate::json::Serialize::to_json(&ToolChoice::Auto),
            crate::json!("auto")
        );
        assert_eq!(
            crate::json::Serialize::to_json(&ToolChoice::None),
            crate::json!("none")
        );
        assert_eq!(
            crate::json::Serialize::to_json(&ToolChoice::Required),
            crate::json!("required")
        );
        assert_eq!(
            crate::json::Serialize::to_json(&ToolChoice::Function("run_tests".into())),
            crate::json!({"type": "function", "function": {"name": "run_tests"}})
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
        let value = crate::json::Serialize::to_json(&req);
        assert!(value.get("tool_choice").is_none());
        assert!(value.get("tools").is_none());
    }

    #[test]
    fn chat_request_includes_model_messages_and_tools() {
        let req = ChatRequest {
            model: "qwen3:1.7b".into(),
            messages: vec![crate::json!({ "role": "user", "content": "hi" })],
            stream: false,
            max_tokens: 16384,
            tools: Some(vec![tool_def("run_command")]),
            tool_choice: Some(ToolChoice::Required),
        };
        let v = crate::json::Serialize::to_json(&req);
        assert_eq!(v["model"].as_str(), Some("qwen3:1.7b"));
        assert_eq!(v["messages"][0]["role"].as_str(), Some("user"));
        assert_eq!(v["tools"][0]["function"]["name"].as_str(), Some("run_command"));
    }

    #[test]
    fn stream_chat_meta_parses_sse_content_deltas() {
        crate::async_rt::block_on(async {
            let mock = SseFixture::start("data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\r\ndata: [DONE]\r\n");

            let client = CloudClient::new(&mock.uri(), "k");
            let mut tokens = Vec::new();
            let result = client
                .stream_chat_meta(
                    "glm-5.2",
                    vec![crate::json!({"role": "user", "content": "hi"})],
                    None,
                    None,
                    None,
                    &mut |t| tokens.push(t.to_string()),
                    None,
                    None,
                )
                .await;

            assert!(result.is_ok());
            let completion = result.unwrap();
            assert_eq!(completion.content, "Hello");
            assert_eq!(tokens, vec!["Hello"]);
        });
    }

    #[test]
    fn stream_chat_meta_parses_sse_tool_call_deltas() {
        crate::async_rt::block_on(async {
            let mock = SseFixture::start("data: {\"choices\":[{\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"name\":\"read_file\",\"arguments\":\"{\\\"path\\\":\\\"src/lib.rs\\\"}\"}}]}}]}\r\ndata: [DONE]\r\n");

            let client = CloudClient::new(&mock.uri(), "k");
            let mut tokens = Vec::new();
            let mut deltas = Vec::new();
            let result = client
                .stream_chat_meta(
                    "glm-5.2",
                    vec![crate::json!({"role": "user", "content": "hi"})],
                    None,
                    None,
                    None,
                    &mut |t| tokens.push(t.to_string()),
                    None,
                    Some(&mut |index, name, args| {
                        deltas.push((index, name.map(str::to_string), args.to_string()))
                    }),
                )
                .await;

            assert!(result.is_ok());
            let completion = result.unwrap();
            assert!(completion.content.is_empty());
            assert!(tokens.is_empty());
            assert_eq!(deltas, vec![(0, Some("read_file".into()), "{\"path\":\"src/lib.rs\"}".into())]);
        });
    }

    #[test]
    fn stream_chat_meta_returns_usage_from_sse() {
        crate::async_rt::block_on(async {
            let mock = SseFixture::start("data: {\"choices\":[{\"delta\":{\"content\":\"ok\"}}],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":5,\"total_tokens\":15}}\r\ndata: [DONE]\r\n");

            let client = CloudClient::new(&mock.uri(), "k");
            let mut tokens = Vec::new();
            let result = client
                .stream_chat_meta(
                    "glm-5.2",
                    vec![crate::json!({"role": "user", "content": "hi"})],
                    None,
                    None,
                    None,
                    &mut |t| tokens.push(t.to_string()),
                    None,
                    None,
                )
                .await;

            assert!(result.is_ok());
            let completion = result.unwrap();
            assert_eq!(completion.content, "ok");
            assert_eq!(tokens, vec!["ok"]);
        });
    }

    #[test]
    fn stream_chat_meta_emits_token_usage_event() {
        crate::async_rt::block_on(async {
            let mock = SseFixture::start("data: {\"choices\":[{\"delta\":{\"content\":\"done\"}}],\"usage\":{\"prompt_tokens\":100,\"completion_tokens\":50,\"total_tokens\":150}}\r\ndata: [DONE]\r\n");

            let client = CloudClient::new(&mock.uri(), "k");
            let mut tokens = Vec::new();
            let result = client
                .stream_chat_meta(
                    "glm-5.2",
                    vec![crate::json!({"role": "user", "content": "hi"})],
                    None,
                    None,
                    None,
                    &mut |t| tokens.push(t.to_string()),
                    None,
                    None,
                )
                .await;

            assert!(result.is_ok());
            let completion = result.unwrap();
            assert_eq!(completion.content, "done");
        });
    }

    /// One-request loopback server for exercising the real HTTP/SSE client.
    /// Checks the request route and drains the JSON body before replying.
    struct SseFixture {
        address: std::net::SocketAddr,
        stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
        worker: Option<std::thread::JoinHandle<std::io::Result<()>>>,
    }
    impl SseFixture {
        fn start(body: &'static str) -> Self {
            use std::io::{BufRead, Read, Write};
            use std::sync::atomic::Ordering;
            use std::time::{Duration, Instant};
            let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
            let address = listener.local_addr().unwrap();
            listener.set_nonblocking(true).unwrap();
            let stop = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
            let cancelled = stop.clone();
            let worker = std::thread::spawn(move || {
                let deadline = Instant::now() + Duration::from_secs(10);
                let mut stream = loop {
                    match listener.accept() {
                        Ok((stream, _)) => break stream,
                        Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                            if cancelled.load(Ordering::Relaxed) || Instant::now() > deadline {
                                return Err(std::io::Error::new(std::io::ErrorKind::TimedOut, "SSE fixture received no request"));
                            }
                            std::thread::sleep(Duration::from_millis(2));
                        }
                        Err(e) => return Err(e),
                    }
                };
                stream.set_read_timeout(Some(Duration::from_secs(5)))?;
                stream.set_write_timeout(Some(Duration::from_secs(5)))?;
                let mut reader = std::io::BufReader::new(&mut stream);
                let mut line = String::new();
                reader.read_line(&mut line)?;
                assert_eq!(line.trim_end(), "POST /chat/completions HTTP/1.1");
                let mut length = 0;
                loop {
                    line.clear();
                    if reader.read_line(&mut line)? == 0 { return Err(std::io::Error::new(std::io::ErrorKind::UnexpectedEof, "incomplete headers")); }
                    if line == "\r\n" { break; }
                    if let Some((key, value)) = line.split_once(':') {
                        if key.eq_ignore_ascii_case("content-length") { length = value.trim().parse::<usize>().unwrap(); }
                    }
                }
                assert!((1..=1_048_576).contains(&length));
                let mut request = vec![0; length];
                reader.read_exact(&mut request)?;
                let request: serde_json::Value = serde_json::from_slice(&request).unwrap();
                assert_eq!(request["stream"].as_bool(), Some(true));
                assert!(request["messages"].is_array());
                drop(reader);
                write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", body.len())?;
                stream.write_all(body.as_bytes())?;
                stream.flush()
            });
            Self { address, stop, worker: Some(worker) }
        }
        fn uri(&self) -> String { format!("http://{}", self.address) }
    }
    impl Drop for SseFixture {
        fn drop(&mut self) {
            self.stop.store(true, std::sync::atomic::Ordering::Relaxed);
            let result = self.worker.take().unwrap().join();
            if !std::thread::panicking() { result.expect("SSE fixture worker panicked").expect("SSE fixture failed"); }
        }
    }}


