//! P0 de mercado (fundação) — testes de integração do subsistema LLM.
//!
//! Valida: streaming de resposta token-a-token (loopback sem rede externa),
//! multi-providers com roteamento (router + catálogo + store de credenciais) e
//! a fallback chain com rate-limit/circuit-breaker.

use kaide::llm::client::{LlmClient, ToolDef};
use kaide::llm::provider_chain::{
    CompletionProvider, FallbackChain, ProviderError, TokenBucket,
};
use kaide::llm::router::LlmRouter;
use kaide::providers::types::{Catalog, Cost, Limits, ModelInfo, Provider};
use kaide::providers::{mask_key, ProviderCatalog, ProviderStore};
use std::future::Future;
use std::pin::Pin;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};

// ---------------------------------------------------------------------------
// Loopback: servidor ollama NDJSON local (nenhuma rede externa).
// ---------------------------------------------------------------------------

fn spawn_ollama_loopback() -> (String, Arc<Mutex<bool>>) {
    use std::io::{Read, Write};
    use std::net::TcpListener;

    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let stopped = Arc::new(Mutex::new(false));
    let stopped_thread = stopped.clone();

    std::thread::spawn(move || {
        listener.set_nonblocking(true).unwrap();
        let body = concat!(
            r#"{"message":{"content":"Olá "},"done":false}"#, "\n",
            r#"{"message":{"content":"mundo"},"done":false}"#, "\n",
            r#"{"message":{"content":""},"done":true,"prompt_eval_count":7,"eval_count":3,"done_reason":"stop"}"#, "\n",
        );
        while !*stopped_thread.lock().unwrap() {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    stream.set_nonblocking(false).unwrap();
                    let mut buf = [0u8; 1];
                    let mut head = Vec::new();
                    loop {
                        match stream.read(&mut buf) {
                            Ok(0) => break,
                            Ok(_) => {
                                head.push(buf[0]);
                                if head.ends_with(b"\r\n\r\n") || head.len() > 16 * 1024 {
                                    break;
                                }
                            }
                            Err(_) => break,
                        }
                    }
                    let head_str = String::from_utf8_lossy(&head).to_string();
                    let content_length: usize = head_str
                        .lines()
                        .find_map(|line| {
                            let (name, value) = line.split_once(':')?;
                            if name.eq_ignore_ascii_case("content-length") {
                                value.trim().parse().ok()
                            } else {
                                None
                            }
                        })
                        .unwrap_or(0);
                    let mut body_read = 0;
                    while body_read < content_length {
                        match stream.read(&mut buf) {
                            Ok(0) => break,
                            Ok(_) => body_read += 1,
                            Err(_) => break,
                        }
                    }
                    let response = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: application/x-ndjson\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        body.len(),
                        body
                    );
                    let _ = stream.write_all(response.as_bytes());
                    let _ = stream.flush();
                }
                Err(_) => std::thread::sleep(std::time::Duration::from_millis(10)),
            }
        }
    });

    (format!("http://{addr}"), stopped)
}

// ---------------------------------------------------------------------------
// P0: streaming de resposta — deltas de texto + usage contra o loopback.
// ---------------------------------------------------------------------------

#[test]
fn p0_streaming_delivers_token_deltas_and_usage() {
    let (host, stopped) = spawn_ollama_loopback();
    let client = LlmClient::ollama(&host);

    let mut tokens: Vec<String> = Vec::new();
    let mut tool_deltas = 0usize;
    let completion = kaide::async_rt::block_on(client.chat_meta_stream(
        "qwen3:1.7b",
        vec![kaide::json!({"role": "user", "content": "diga ola"})],
        None,
        None,
        None,
        &mut |token: &str| tokens.push(token.to_string()),
        Some(&mut |_reasoning: &str| {}),
        Some(&mut |_index: usize, _name: Option<&str>, _args: &str| {
            tool_deltas += 1;
        }),
    ))
    .unwrap();

    assert_eq!(tokens, vec!["Olá ".to_string(), "mundo".to_string()]);
    assert_eq!(completion.content, "Olá mundo");
    assert!(tool_deltas == 0);
    let usage = completion.usage.expect("usage reported by server");
    assert_eq!(usage.prompt_tokens, 7);
    assert_eq!(usage.completion_tokens, 3);
    assert_eq!(usage.total_tokens, 10);
    assert_eq!(completion.finish_reason.as_deref(), Some("stop"));

    *stopped.lock().unwrap() = true;
}

// ---------------------------------------------------------------------------
// P0: multi-providers com roteamento e seleção de modelo.
// ---------------------------------------------------------------------------

fn synthetic_catalog() -> Catalog {
    let mut models = std::collections::HashMap::new();
    models.insert(
        "z-ai/glm-5.2".to_string(),
        ModelInfo {
            id: "z-ai/glm-5.2".into(),
            name: "GLM 5.2".into(),
            family: "glm".into(),
            reasoning: true,
            tool_call: true,
            temperature: true,
            open_weights: false,
            attachment: false,
            limit: Limits { context: 128000, output: 16000 },
            cost: Cost { input: 0.5, output: 1.5, cache_read: None, cache_write: None },
            modalities: Default::default(),
            knowledge: None,
            release_date: None,
        },
    );
    let mut providers = std::collections::HashMap::new();
    providers.insert(
        "nvidia".to_string(),
        Provider {
            id: "nvidia".into(),
            name: "NVIDIA NIM".into(),
            api: "https://integrate.api.nvidia.com/v1".into(),
            env: vec!["NVIDIA_API_KEY".into()],
            doc: String::new(),
            models,
        },
    );
    providers
}

#[test]
fn p0_multi_provider_router_resolves_models_and_costs() {
    let router = LlmRouter::with_catalog(
        LlmClient::ollama("http://localhost:11434"),
        ProviderCatalog {
            catalog: synthetic_catalog(),
        },
    );

    // Provider default do produto.
    assert_eq!(router.provider(), "nvidia");

    // IDs qualificados por provider roteiam para cloud; base id fica local.
    let (is_cloud, api_id) = router.resolve("nvidia/z-ai/glm-5.2");
    assert!(is_cloud);
    assert_eq!(api_id, "z-ai/glm-5.2");
    let (is_cloud, _) = router.resolve("qwen3:1.7b");
    assert!(!is_cloud);

    // Capacidades e custo vêm do catálogo do provider ativo.
    assert!(router.is_cloud_model("nvidia/z-ai/glm-5.2"));
    assert!(router.supports_tool_calls("nvidia/z-ai/glm-5.2"));
    let cost = router.estimate_cost("nvidia/z-ai/glm-5.2", 1_000_000, 1_000_000);
    assert!(cost.total() > 0.0);
    let local_cost = router.estimate_cost("qwen3:1.7b", 1_000_000, 1_000_000);
    assert!(local_cost.total() < f64::EPSILON);
}

#[test]
fn p0_provider_store_manages_credentials_in_memory() {
    let mut store = ProviderStore::default();
    store.set_key("nvidia", "nvsecret-key-123");
    store.set_enabled("groq", false);

    assert_eq!(store.api_key("nvidia"), Some("nvsecret-key-123"));
    let active: Vec<&str> = store
        .active_providers()
        .into_iter()
        .map(|(id, _)| id)
        .collect();
    assert!(active.contains(&"nvidia"));
    assert!(!active.contains(&"groq"));

    // Chave nunca aparece inteira em máscara de exibição.
    let masked = mask_key("nvsecret-key-123");
    assert!(masked.len() < "nvsecret-key-123".len());
    assert!(!masked.contains("secret-key"));

    store.set_enabled("groq", true);
    store.remove("groq");
    assert!(store.api_key("groq").is_none());
}

// ---------------------------------------------------------------------------
// P0: fallback chain — rate-limit, circuit breaker e failover de providers.
// ---------------------------------------------------------------------------

struct MockProvider {
    name: &'static str,
    result: MockResult,
    calls: AtomicUsize,
}

enum MockResult {
    Ok,
    RateLimited,
    Fatal,
}

impl MockProvider {
    fn arc(self) -> Arc<dyn CompletionProvider> {
        Arc::new(self)
    }
}

impl CompletionProvider for MockProvider {
    fn name(&self) -> &str {
        self.name
    }
    fn complete<'a>(
        &'a self,
        _prompt: &'a str,
    ) -> Pin<Box<dyn Future<Output = Result<String, ProviderError>> + Send + 'a>> {
        self.calls.fetch_add(1, Ordering::SeqCst);
        let result = match self.result {
            MockResult::Ok => Ok("resposta do provider".to_string()),
            MockResult::RateLimited => Err(ProviderError::RateLimited),
            MockResult::Fatal => Err(ProviderError::Fatal("explodiu".into())),
        };
        Box::pin(async move { result })
    }
}

#[test]
fn p0_fallback_chain_skips_unhealthy_providers() {
    // Rate-limited e fatal são pulados; o saudável responde.
    let chain = FallbackChain::new(vec![
        MockProvider { name: "rate-limited", result: MockResult::RateLimited, calls: AtomicUsize::new(0) }.arc(),
        MockProvider { name: "fatal", result: MockResult::Fatal, calls: AtomicUsize::new(0) }.arc(),
        MockProvider { name: "primary-ok", result: MockResult::Ok, calls: AtomicUsize::new(0) }.arc(),
    ]);
    let answer = kaide::async_rt::block_on(chain.complete("prompt")).unwrap();
    assert_eq!(answer, "resposta do provider");

    // Todos doentes → erro explícito.
    let dead = FallbackChain::new(vec![
        MockProvider { name: "rate-limited", result: MockResult::RateLimited, calls: AtomicUsize::new(0) }.arc(),
        MockProvider { name: "fatal", result: MockResult::Fatal, calls: AtomicUsize::new(0) }.arc(),
    ]);
    let error = kaide::async_rt::block_on(dead.complete("prompt")).unwrap_err();
    assert!(error.contains("providers"), "chain must explain failure: {error}");

    // Token bucket limita rajadas de RPM: capacidade inicial é consumida
    // sem bloquear (uma terceira chamada aguardaria refill ~30s).
    let bucket = TokenBucket::new(2.0);
    kaide::async_rt::block_on(bucket.acquire());
    kaide::async_rt::block_on(bucket.acquire());
}

#[test]
fn p0_tool_defs_serialize_to_openai_function_shape() {
    let def = ToolDef {
        r#type: "function".into(),
        function: kaide::llm::client::ToolFunction {
            name: "read_file".into(),
            description: "lê um arquivo".into(),
            parameters: kaide::json!({"type": "object", "properties": {}}),
        },
    };
    let value = kaide::json::Serialize::to_json(&def);
    let json = kaide::json::to_string(&value);
    assert!(json.contains("read_file"));
    assert!(json.contains("function"));
}
