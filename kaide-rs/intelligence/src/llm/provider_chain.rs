//! Módulo de rate-limiting + fallback pro adapter HTTP OpenAI-compatible.
//! Encaixa entre o plan/act/verify loop e o provider real (NIM ou local).
//!
//! Deps sugeridas no Cargo.toml:
//! tokio = { version = "1", features = ["full"] }
//! reqwest = { version = "0.12", features = ["json"] }
//! serde = { version = "1", features = ["derive"] }
//! rand = "0.8"

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use rand::Rng;

// ---------- Token bucket (rate limiter) ----------

/// Token bucket simples. 40 rpm default = 1 token a cada 1.5s, capacidade 40.
pub struct TokenBucket {
    capacity: f64,
    tokens: Mutex<f64>,
    refill_per_sec: f64,
    last_refill: Mutex<Instant>,
}

impl TokenBucket {
    pub fn new(rpm: f64) -> Self {
        Self {
            capacity: rpm,
            tokens: Mutex::new(rpm),
            refill_per_sec: rpm / 60.0,
            last_refill: Mutex::new(Instant::now()),
        }
    }

    /// Bloqueia até ter 1 token disponível.
    pub async fn acquire(&self) {
        loop {
            {
                let mut tokens = self.tokens.lock().await;
                let mut last = self.last_refill.lock().await;
                let elapsed = last.elapsed().as_secs_f64();
                *tokens = (*tokens + elapsed * self.refill_per_sec).min(self.capacity);
                *last = Instant::now();

                if *tokens >= 1.0 {
                    *tokens -= 1.0;
                    return;
                }
            }
            tokio::time::sleep(Duration::from_millis(200)).await;
        }
    }
}

// ---------- Erros e classificação ----------

#[derive(Debug, Clone)]
pub enum ProviderError {
    RateLimited,       // 429 -> esperar e retry no mesmo provider
    CreditExhausted,   // 402 -> pular pro próximo provider da chain
    Transient(String), // timeout, 5xx -> retry com backoff
    Fatal(String),     // erro que não adianta tentar de novo
}

impl ProviderError {
    fn from_status(status: u16, body: &str) -> Self {
        match status {
            429 => ProviderError::RateLimited,
            402 => ProviderError::CreditExhausted,
            500..=599 => ProviderError::Transient(body.to_string()),
            _ => ProviderError::Fatal(format!("status {status}: {body}")),
        }
    }
}

// ---------- Circuit breaker ----------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CircuitState {
    Closed,
    Open,
    HalfOpen,
}

pub struct CircuitBreaker {
    state: tokio::sync::Mutex<CircuitState>,
    failures: tokio::sync::Mutex<u32>,
    opened_at: tokio::sync::Mutex<Option<Instant>>,
    threshold: u32,
    cooldown: Duration,
}

impl CircuitBreaker {
    pub fn new(threshold: u32, cooldown: Duration) -> Self {
        Self {
            state: tokio::sync::Mutex::new(CircuitState::Closed),
            failures: tokio::sync::Mutex::new(0),
            opened_at: tokio::sync::Mutex::new(None),
            threshold,
            cooldown,
        }
    }

    pub async fn allow(&self) -> bool {
        let mut state = self.state.lock().await;
        match *state {
            CircuitState::Closed => true,
            CircuitState::Open => {
                let mut opened = self.opened_at.lock().await;
                if opened.map(|t| t.elapsed() > self.cooldown).unwrap_or(false) {
                    *state = CircuitState::HalfOpen;
                    *opened = None;
                    true
                } else {
                    false
                }
            }
            CircuitState::HalfOpen => true,
        }
    }

    pub async fn record_success(&self) {
        let mut state = self.state.lock().await;
        let mut failures = self.failures.lock().await;
        *failures = 0;
        *state = CircuitState::Closed;
    }

    pub async fn record_failure(&self) {
        let mut failures = self.failures.lock().await;
        *failures += 1;
        if *failures >= self.threshold {
            let mut state = self.state.lock().await;
            let mut opened = self.opened_at.lock().await;
            *state = CircuitState::Open;
            *opened = Some(Instant::now());
        }
    }
}

// ---------- Trait comum pra qualquer backend (NIM, local, etc) ----------

#[async_trait::async_trait]
pub trait CompletionProvider: Send + Sync {
    fn name(&self) -> &str;
    async fn complete(&self, prompt: &str) -> Result<String, ProviderError>;
}

// ---------- Provider NIM com rate limiter embutido ----------

pub struct NimProvider {
    client: reqwest::Client,
    api_key: String,
    model: String,
    base_url: String,
    bucket: TokenBucket,
}

impl NimProvider {
    pub fn new(base_url: &str, api_key: String, model: String, rpm: f64) -> Self {
        Self {
            client: reqwest::Client::new(),
            api_key,
            model,
            base_url: base_url.trim_end_matches('/').to_string(),
            bucket: TokenBucket::new(rpm),
        }
    }
}

#[async_trait::async_trait]
impl CompletionProvider for NimProvider {
    fn name(&self) -> &str {
        "nim"
    }

    async fn complete(&self, prompt: &str) -> Result<String, ProviderError> {
        self.bucket.acquire().await;

        let resp = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .bearer_auth(&self.api_key)
            .json(&serde_json::json!({
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 2048,
            }))
            .send()
            .await
            .map_err(|e| ProviderError::Transient(e.to_string()))?;

        let status = resp.status().as_u16();
        if status != 200 {
            let body = resp.text().await.unwrap_or_default();
            return Err(ProviderError::from_status(status, &body));
        }

        let json: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| ProviderError::Transient(e.to_string()))?;

        json["choices"][0]["message"]["content"]
            .as_str()
            .map(String::from)
            .ok_or_else(|| ProviderError::Fatal("resposta sem campo content".into()))
    }
}

// ---------- Provider local (Ollama no T1000/1650) ----------

pub struct LocalProvider {
    client: reqwest::Client,
    endpoint: String, // ex: http://localhost:11434
    model: String,    // ex: nemotron-3-nano
}

impl LocalProvider {
    pub fn new(endpoint: String, model: String) -> Self {
        Self { client: reqwest::Client::new(), endpoint, model }
    }
}

#[async_trait::async_trait]
impl CompletionProvider for LocalProvider {
    fn name(&self) -> &str {
        "local"
    }

    async fn complete(&self, prompt: &str) -> Result<String, ProviderError> {
        let resp = self
            .client
            .post(format!("{}/api/generate", self.endpoint))
            .json(&serde_json::json!({
                "model": self.model,
                "prompt": prompt,
                "stream": false,
            }))
            .send()
            .await
            .map_err(|e| ProviderError::Transient(e.to_string()))?;

        let status = resp.status().as_u16();
        if status != 200 {
            let body = resp.text().await.unwrap_or_default();
            return Err(ProviderError::from_status(status, &body));
        }

        let json: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| ProviderError::Transient(e.to_string()))?;

        json["response"]
            .as_str()
            .map(String::from)
            .ok_or_else(|| ProviderError::Fatal("resposta sem campo response".into()))
    }
}

pub struct CircuitBreakerProvider {
    inner: Arc<dyn CompletionProvider>,
    breaker: CircuitBreaker,
}

impl CircuitBreakerProvider {
    pub fn new(inner: Arc<dyn CompletionProvider>, threshold: u32, cooldown: Duration) -> Self {
        Self {
            inner,
            breaker: CircuitBreaker::new(threshold, cooldown),
        }
    }

    pub async fn try_acquire(&self) -> bool {
        self.breaker.allow().await
    }

    pub async fn record_success(&self) {
        self.breaker.record_success().await;
    }

    pub async fn record_failure(&self) {
        self.breaker.record_failure().await;
    }
}

#[async_trait::async_trait]
impl CompletionProvider for CircuitBreakerProvider {
    fn name(&self) -> &str {
        self.inner.name()
    }

    async fn complete(&self, prompt: &str) -> Result<String, ProviderError> {
        if !self.breaker.allow().await {
            return Err(ProviderError::Transient(format!(
                "circuit breaker open for {}",
                self.name()
            )));
        }
        match self.inner.complete(prompt).await {
            Ok(text) => {
                self.breaker.record_success().await;
                Ok(text)
            }
            Err(err) => {
                self.breaker.record_failure().await;
                Err(err)
            }
        }
    }
}

// ---------- Fallback chain com retry + backoff exponencial + jitter ----------

pub struct FallbackChain {
    providers: Vec<Arc<dyn CompletionProvider>>,
    max_retries_per_provider: u32,
}

impl FallbackChain {
    pub fn new(providers: Vec<Arc<dyn CompletionProvider>>) -> Self {
        let wrapped: Vec<Arc<dyn CompletionProvider>> = providers
            .into_iter()
            .map(|p| Arc::new(CircuitBreakerProvider::new(p, 3, Duration::from_secs(30))) as Arc<dyn CompletionProvider>)
            .collect();
        Self { providers: wrapped, max_retries_per_provider: 3 }
    }

    pub async fn complete(&self, prompt: &str) -> Result<String, String> {
        for provider in &self.providers {
            let mut attempt = 0;

            loop {
                match provider.complete(prompt).await {
                    Ok(text) => return Ok(text),

                    Err(ProviderError::RateLimited) => {
                        attempt += 1;
                        if attempt > self.max_retries_per_provider {
                            break; // esgota tentativas nesse provider, cai pro próximo
                        }
                        backoff_sleep(attempt).await;
                    }

                    Err(ProviderError::Transient(_)) => {
                        attempt += 1;
                        if attempt > self.max_retries_per_provider {
                            break;
                        }
                        backoff_sleep(attempt).await;
                    }

                    Err(ProviderError::CreditExhausted) => {
                        // sem crédito: não adianta insistir, pula direto
                        break;
                    }

                    Err(ProviderError::Fatal(msg)) => {
                        eprintln!("[{}] erro fatal: {}", provider.name(), msg);
                        break;
                    }
                }
            }
        }

        Err("todos os providers da chain falharam".into())
    }
}

async fn backoff_sleep(attempt: u32) {
    let base_ms = 500u64 * 2u64.pow(attempt.min(5));
    let jitter_ms: u64 = rand::thread_rng().gen_range(0..250);
    tokio::time::sleep(Duration::from_millis(base_ms + jitter_ms)).await;
}

// ---------- Exemplo de montagem ----------

pub fn build_default_chain(base_url: &str, nim_api_key: String, nim_model: String) -> FallbackChain {
    let nim = Arc::new(NimProvider::new(base_url, nim_api_key, nim_model, 40.0));
    let local = Arc::new(LocalProvider::new("http://localhost:11434".into(), "nemotron-3-nano".into()));

    FallbackChain::new(vec![nim, local])
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::Arc;

    fn run<F: std::future::Future<Output = T>, T>(fut: F) -> T {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let res = rt.block_on(fut);
        rt.shutdown_background();
        res
    }

    enum MockResult {
        Ok(&'static str),
        RateLimited,
        CreditExhausted,
        Fatal,
    }

    struct MockProvider {
        name: &'static str,
        result: MockResult,
        calls: AtomicUsize,
    }

    impl MockProvider {
        fn new(name: &'static str, result: MockResult) -> Arc<Self> {
            Arc::new(Self { name, result, calls: AtomicUsize::new(0) })
        }
        fn calls(&self) -> usize {
            self.calls.load(Ordering::SeqCst)
        }
    }

    #[async_trait::async_trait]
    impl CompletionProvider for MockProvider {
        fn name(&self) -> &str {
            self.name
        }
        async fn complete(&self, _prompt: &str) -> Result<String, ProviderError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            match self.result {
                MockResult::Ok(s) => Ok(s.to_string()),
                MockResult::RateLimited => Err(ProviderError::RateLimited),
                MockResult::CreditExhausted => Err(ProviderError::CreditExhausted),
                MockResult::Fatal => Err(ProviderError::Fatal("boom".into())),
            }
        }
    }

    #[test]
    fn classifies_http_statuses() {
        assert!(matches!(ProviderError::from_status(429, ""), ProviderError::RateLimited));
        assert!(matches!(ProviderError::from_status(402, ""), ProviderError::CreditExhausted));
        assert!(matches!(ProviderError::from_status(500, "boom"), ProviderError::Transient(_)));
        assert!(matches!(ProviderError::from_status(403, "denied"), ProviderError::Fatal(_)));
    }

    #[test]
    fn token_bucket_grants_initial_capacity() {
        let bucket = TokenBucket::new(10.0);
        run(bucket.acquire());
    }

    #[test]
    fn chain_returns_first_ok() {
        let ok = MockProvider::new("ok", MockResult::Ok("done"));
        let chain = FallbackChain::new(vec![ok.clone()]);
        assert_eq!(run(chain.complete("x")).unwrap(), "done");
        assert_eq!(ok.calls(), 1);
    }

    #[test]
    fn chain_skips_credit_exhausted_provider() {
        let broke = MockProvider::new("broke", MockResult::CreditExhausted);
        let ok = MockProvider::new("ok", MockResult::Ok("recovered"));
        let chain = FallbackChain::new(vec![broke.clone(), ok.clone()]);
        assert_eq!(run(chain.complete("x")).unwrap(), "recovered");
        assert_eq!(broke.calls(), 1);
        assert_eq!(ok.calls(), 1);
    }

    #[test]
    fn chain_skips_fatal_provider() {
        let bad = MockProvider::new("bad", MockResult::Fatal);
        let ok = MockProvider::new("ok", MockResult::Ok("fine"));
        let chain = FallbackChain::new(vec![bad.clone(), ok.clone()]);
        assert_eq!(run(chain.complete("x")).unwrap(), "fine");
    }

    #[test]
    fn chain_errors_when_all_providers_fail() {
        let a = MockProvider::new("a", MockResult::CreditExhausted);
        let b = MockProvider::new("b", MockResult::Fatal);
        let chain = FallbackChain::new(vec![a, b]);
        let err = run(chain.complete("x")).unwrap_err();
        assert!(err.contains("falharam"), "got: {err}");
    }

    #[test]
    fn circuit_breaker_opens_after_threshold_failures() {
        let breaker = CircuitBreaker::new(3, Duration::from_secs(60));
        run(async move {
            assert!(breaker.allow().await);
            breaker.record_failure().await;
            breaker.record_failure().await;
            assert!(breaker.allow().await);
            breaker.record_failure().await;
            assert!(!breaker.allow().await);
        });
    }

    #[test]
    fn circuit_breaker_records_success() {
        let breaker = CircuitBreaker::new(2, Duration::from_secs(60));
        run(async move {
            assert!(breaker.allow().await);
            breaker.record_failure().await;
            breaker.record_success().await;
            assert!(breaker.allow().await);
        });
    }
}