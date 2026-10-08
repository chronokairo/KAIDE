//! Módulo de rate-limiting + fallback pro adapter HTTP OpenAI-compatible.
//! Encaixa entre o plan/act/verify loop e o provider real (NIM ou local).
//!


type CompletionFuture<'a> = std::pin::Pin<Box<dyn std::future::Future<Output = Result<String, ProviderError>> + Send + 'a>>;
use std::sync::Arc;
use std::time::{Duration, Instant};
use crate::async_rt::sync::Mutex;

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
            crate::async_rt::time::sleep(Duration::from_millis(200)).await;
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
    state: Mutex<CircuitState>,
    failures: Mutex<u32>,
    opened_at: Mutex<Option<Instant>>,
    threshold: u32,
    cooldown: Duration,
}

impl CircuitBreaker {
    pub fn new(threshold: u32, cooldown: Duration) -> Self {
        Self {
            state: Mutex::new(CircuitState::Closed),
            failures: Mutex::new(0),
            opened_at: Mutex::new(None),
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

pub trait CompletionProvider: Send + Sync {
    fn name(&self) -> &str;
    fn complete<'a>(&'a self, prompt: &'a str) -> CompletionFuture<'a>;
}

// ---------- Provider NIM com rate limiter embutido ----------

pub struct NimProvider {
    client: crate::http::Client,
    api_key: String,
    model: String,
    base_url: String,
    bucket: TokenBucket,
}

impl NimProvider {
    pub fn new(base_url: &str, api_key: String, model: String, rpm: f64) -> Self {
        Self {
            client: crate::http::Client::new(),
            api_key,
            model,
            base_url: base_url.trim_end_matches('/').to_string(),
            bucket: TokenBucket::new(rpm),
        }
    }
}

impl CompletionProvider for NimProvider {
    fn name(&self) -> &str {
        "nim"
    }

    fn complete<'a>(&'a self, prompt: &'a str) -> CompletionFuture<'a> { Box::pin(async move {
        self.bucket.acquire().await;

        let user_message = crate::json_expr!({"role": "user", "content": prompt});
        let request = crate::json_expr!({"model": self.model.clone(), "messages": vec![user_message], "max_tokens": 2048usize});
        let resp = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .bearer_auth(&self.api_key)
            .json_value(&request)
            .send()
            .await
            .map_err(|e| ProviderError::Transient(e.to_string()))?;

        let status = resp.status().as_u16();
        if status != 200 {
            let body = resp.text().unwrap_or_default();
            return Err(ProviderError::from_status(status, &body));
        }

        let json = resp
            .json_value()
            .map_err(|e| ProviderError::Transient(e.to_string()))?;

        json.get("choices").and_then(|value| value.as_array()).and_then(|values| values.first())
            .and_then(|value| value.get("message"))
            .and_then(|value| value.get("content"))
            .and_then(|value| value.as_str())
            .map(String::from)
            .ok_or_else(|| ProviderError::Fatal("resposta sem campo content".into()))
    }) }
}

// ---------- Provider local (Ollama no T1000/1650) ----------

pub struct LocalProvider {
    client: crate::http::Client,
    endpoint: String, // ex: http://localhost:11434
    model: String,    // ex: nemotron-3-nano
}

impl LocalProvider {
    pub fn new(endpoint: String, model: String) -> Self {
        Self {
            client: crate::http::Client::new(),
            endpoint,
            model,
        }
    }
}

impl CompletionProvider for LocalProvider {
    fn name(&self) -> &str {
        "local"
    }

    fn complete<'a>(&'a self, prompt: &'a str) -> CompletionFuture<'a> { Box::pin(async move {
        let request = crate::json_expr!({"model": self.model.clone(), "prompt": prompt, "stream": false});
        let resp = self
            .client
            .post(format!("{}/api/generate", self.endpoint))
            .json_value(&request)
            .send()
            .await
            .map_err(|e| ProviderError::Transient(e.to_string()))?;

        let status = resp.status().as_u16();
        if status != 200 {
            let body = resp.text().unwrap_or_default();
            return Err(ProviderError::from_status(status, &body));
        }

        let json = resp
            .json_value()
            .map_err(|e| ProviderError::Transient(e.to_string()))?;

        json.get("response")
            .and_then(|value| value.as_str())
            .map(String::from)
            .ok_or_else(|| ProviderError::Fatal("resposta sem campo response".into()))
    }) }
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

impl CompletionProvider for CircuitBreakerProvider {
    fn name(&self) -> &str {
        self.inner.name()
    }

    fn complete<'a>(&'a self, prompt: &'a str) -> CompletionFuture<'a> { Box::pin(async move {
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
    }) }
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
            .map(|p| {
                Arc::new(CircuitBreakerProvider::new(p, 3, Duration::from_secs(30)))
                    as Arc<dyn CompletionProvider>
            })
            .collect();
        Self {
            providers: wrapped,
            max_retries_per_provider: 3,
        }
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
    let jitter_ms: u64 = crate::random::system_u64().map(|n| n % 250).unwrap_or(0);
    crate::async_rt::time::sleep(Duration::from_millis(base_ms + jitter_ms)).await;
}

// ---------- Exemplo de montagem ----------

pub fn build_default_chain(
    base_url: &str,
    nim_api_key: String,
    nim_model: String,
) -> FallbackChain {
    let nim = Arc::new(NimProvider::new(base_url, nim_api_key, nim_model, 40.0));
    FallbackChain::new(vec![nim])
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};
    type CompletionFuture<'a> = std::pin::Pin<Box<dyn std::future::Future<Output = Result<String, ProviderError>> + Send + 'a>>;
use std::sync::Arc;

    fn run<F: std::future::Future<Output = T>, T>(fut: F) -> T {
        crate::async_rt::block_on(fut)
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
            Arc::new(Self {
                name,
                result,
                calls: AtomicUsize::new(0),
            })
        }
        fn calls(&self) -> usize {
            self.calls.load(Ordering::SeqCst)
        }
    }

    impl CompletionProvider for MockProvider {
        fn name(&self) -> &str {
            self.name
        }
        fn complete<'a>(&'a self, _prompt: &'a str) -> CompletionFuture<'a> { Box::pin(async move {
            self.calls.fetch_add(1, Ordering::SeqCst);
            match self.result {
                MockResult::Ok(s) => Ok(s.to_string()),
                MockResult::RateLimited => Err(ProviderError::RateLimited),
                MockResult::CreditExhausted => Err(ProviderError::CreditExhausted),
                MockResult::Fatal => Err(ProviderError::Fatal("boom".into())),
            }
        }) }
    }

    #[test]
    fn classifies_http_statuses() {
        assert!(matches!(
            ProviderError::from_status(429, ""),
            ProviderError::RateLimited
        ));
        assert!(matches!(
            ProviderError::from_status(402, ""),
            ProviderError::CreditExhausted
        ));
        assert!(matches!(
            ProviderError::from_status(500, "boom"),
            ProviderError::Transient(_)
        ));
        assert!(matches!(
            ProviderError::from_status(403, "denied"),
            ProviderError::Fatal(_)
        ));
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

