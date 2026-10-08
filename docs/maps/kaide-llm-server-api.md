# Mapa de APIs do núcleo `kaide` — LLM, Providers, MCP, Memória, Skills, Compressor, Protocolo e App-Server

> Gerado em 2026-09-26 como subsídio para os testes de integração dos P0s de mercado (`TODO.md` — "P0 — Coding agent de mercado").
> Crate `kaide` (zero-lib, `kaide-rs/core`), binário `kaide`. Todos os módulos são `pub mod` via `lib.rs` (`kaide::llm::...`, `kaide::mcp::...`, etc.).

**Infra compartilhada** (`apps/web/src/error.rs`, `apps/web/src/http/`, `apps/web/src/async_rt/`):

```rust
// error.rs
pub type Error = Box<dyn std::error::Error + Send + Sync + 'static>;
pub type Result<T, E = Error> = std::result::Result<T, E>;
pub fn message(impl fmt::Display) -> Error
pub trait Context<T> { fn context(...); fn with_context(...); } // impl p/ Result e Option
pub use {cki_bail as bail, cki_ensure as ensure, cki_error_value as anyhow}; // macros crate-root

// http/mod.rs — cliente HTTP próprio (std::net)
pub use client::{blocking, Client, ClientBuilder, RequestBuilder};
pub use response::Response; pub use status::StatusCode; pub use url::Url;
// blocking::Client síncrono; Response::{status, text, json_value, json<T>, bytes, chunk() (async p/ SSE)}

// async_rt/executor.rs
pub fn block_on<F: Future>(fut: F) -> F::Output
pub mod time { sleep, timeout }
```

## 1. `kaide::llm`

### 1.1 `llm/client.rs` (1931 linhas) — prioridade

**Tipos de domínio (todos `pub`, `#[derive(Clone, Debug)]`):**

```rust
pub struct ToolDef { pub r#type: String, pub function: ToolFunction }
pub struct ToolFunction { pub name: String, pub description: String, pub parameters: crate::json::Value }
pub struct ToolCall { pub id: String, pub r#type: String, pub function: ToolCallFunction }
pub struct ToolCallFunction { pub name: String, pub arguments: String }
pub struct ToolCallResult { pub tool_call_id: String, pub content: String }
pub struct TokenUsage { pub prompt_tokens: usize, pub completion_tokens: usize, pub reasoning_tokens: usize, pub total_tokens: usize } // Default, PartialEq, Eq
pub struct ChatCompletion { pub content: String, pub reasoning_content: String, pub tool_calls: Vec<ToolCall>, pub finish_reason: Option<String>, pub usage: Option<TokenUsage> }
pub enum ResponseFormat { Text /*default*/, JsonObject, JsonSchema { name: String, schema: crate::json::Value, strict: bool } }
pub enum ToolChoice { Auto, None, Required, Function(String) }
```

- Serde manual via traits `crate::json::Serialize`/`Deserialize`. `ToolCallFunction::from_json` **normaliza `arguments` string OU objeto** → sempre `String` JSON.
- Mensagens do chat são `Vec<crate::json::Value>` (formato OpenAI), **não** structs tipadas. `ChatRequest`/`CloudChatRequest` são **privados**.

**Clientes:**

```rust
pub struct OllamaClient { host: String, client: crate::http::Client }
pub struct CloudClient { base_url: String, api_key: String, client: crate::http::Client }
pub enum LlmClient { Ollama(OllamaClient), Local(Arc<Mutex<InferenceEngine>>), Cloud(CloudClient) }
pub enum ClientKind { Ollama, Local, Cloud }  // Copy, PartialEq, Eq

OllamaClient::new(host: &str) -> Self                      // remove '/' final
CloudClient::new(base_url: &str, api_key: &str) -> Self    // timeout 60s
LlmClient::ollama(host: &str) -> Self
LlmClient::local(engine: InferenceEngine) -> Self           // GGUF in-process
LlmClient::cloud(base_url: &str, api_key: &str) -> Self
LlmClient::kind(&self) -> ClientKind
```

**API do `LlmClient`:**

```rust
pub async fn generate(&self, model, prompt, tools: Option<&Vec<ToolDef>>, response_format: Option<&ResponseFormat>) -> Result<String>
pub async fn generate_with_retry(...) -> Result<String>          // 3 tentativas, backoff 500ms*2^n
pub async fn stream(&self, model, prompt, tools, response_format,
    on_token: &mut dyn FnMut(&str), on_tool_call_delta: &mut dyn FnMut(usize, Option<&str>, &str)) -> Result<String>
pub async fn chat(&self, model, messages: Vec<Value>, tools, response_format) -> Result<String>   // só content
pub async fn chat_meta(&self, model, messages, tools, tool_choice, response_format) -> Result<ChatCompletion>
pub async fn chat_meta_stream(&self, model, messages, tools, tool_choice, response_format,
    on_token: &mut dyn FnMut(&str),
    on_reasoning: Option<&mut dyn FnMut(&str)>,
    on_tool_call_delta: Option<&mut dyn FnMut(usize, Option<&str>, &str)>) -> Result<ChatCompletion>
```

**Como ativar stream**: streaming é escolhido por método (`stream`/`chat_meta_stream`), não por flag. `Local` nunca faz HTTP (achata mensagens e chama `engine.generate`; `on_token` recebe o texto todo de uma vez).

- **Ollama**: `stream_generate` (NDJSON `/api/generate`), `chat_meta_stream` (NDJSON `/api/chat`; converte `arguments` string→objeto; acumula tool_calls por `index`; lê `reasoning_content` **ou** `thinking`).
- **Cloud (OpenAI-compatible)**: `chat_meta` (retry 429/5xx até 5x, backoff 2000ms×2^n), `stream_chat_meta` (SSE `data:`...`[DONE]`; tool_calls por `index` acumulados; reasoning em `reasoning_content`/`reasoning`).

**Transporte fake/loopback para testes sem rede**: padrão `SseFixture` (privado em `llm/client.rs` L1864–1929): binda `TcpListener` em `127.0.0.1:0`, valida request-line e `Content-Length`, lê o body, responde `HTTP/1.1 200 OK` + `Content-Type: text/event-stream` + corpo SSE estático. `CloudClient::new(&mock.uri(), "k")` aponta para o loopback — o cliente HTTP real é exercitado contra servidor local de 1 request.

**Testes existentes**: `tool_def_serializes_to_openai_shape`, `tool_call_parses_string_arguments`, `tool_call_normalizes_object_arguments`, `cloud_response_keeps_text_tools_and_finish_reason_separate`, `ollama_response_accepts_null_content_and_object_arguments`, `empty_tool_calls_array_parses_to_empty`, `response_format_json_schema_serializes_variant`, `cloud_client_trims_trailing_slash`, `ollama_client_trims_trailing_slash`, `tool_choice_serializes_openai_variants`, `chat_request_omits_tool_choice_when_absent`, `chat_request_includes_model_messages_and_tools`, `stream_chat_meta_parses_sse_content_deltas`, `stream_chat_meta_parses_sse_tool_call_deltas`, `stream_chat_meta_returns_usage_from_sse`, `stream_chat_meta_emits_token_usage_event`.

### 1.2 `llm/router.rs`

```rust
pub const DEFAULT_PROVIDER: &str = "nvidia";
pub const DEFAULT_CLOUD_MODEL: &str = "z-ai/glm-5.2";
pub struct LlmRouter { ... }  // Clone; Arc<Mutex<...>> p/ troca de provider ao vivo
pub struct CostEstimate { pub input_usd: f64, pub output_usd: f64 }  // pub fn total(&self) -> f64
pub struct AutoTestProbeResult { pub model: String, pub latency_ms: u128, pub success: bool, pub error: Option<String> }
pub struct AutoTestRecord { pub timestamp, provider, selected_model, selected_latency_ms, results: Vec<AutoTestProbeResult> }

LlmRouter::new(local: LlmClient) -> Self                          // carrega ProviderCatalog::load() (I/O + cache!)
LlmRouter::with_catalog(local: LlmClient, catalog: ProviderCatalog) -> Self  // catálogo injetado, zero rede (usado por testes)
#[cfg(test)] LlmRouter::with_cloud_for_test(local, catalog) -> Self

// Métodos: provider(), catalog_client(), set_provider(&str) (resolve credenciais via ProviderStore),
// cloud_configured(), mark_cloud/unmark_cloud/clear_cloud_marks(&str), set_fallback_model(Option<String>),
// fallback_model(), set_model(&str), resolve_fallback(&str), estimate_cost(model, prompt_tokens, completion_tokens),
// resolve(&str) -> (bool, String), is_cloud_model(&str), test_model_availability(&str), test_and_rank_models(...),
// select_best_available_model(...), client_for(&str), generate(...), generate_with_retry(_with_fallback),
// chat(_meta), supports_tool_calls(&str) (catálogo; default true p/ desconhecidos),
// chat_meta_with_choice (derruba tools se o modelo não é capaz), chat_meta_with_fallback, stream(...), chat_meta_stream_with_fallback
```

**Testes** (helpers `model()/provider()/test_catalog()/router()`; sem rede): `defaults_to_nvidia_provider`, `capability_lookup_reflects_the_active_provider_catalog`, `provider_qualified_ids_route_to_cloud`, `single_model_resolves_per_active_provider`, `marked_base_model_still_uses_provider_catalog_id`, `marked_models_route_to_cloud`, `clear_cloud_marks_resets_marked_set`, `estimate_cost_prices_cloud_models_and_ignores_local`, `local_model_uses_local_client`, `unmapped_cloud_model_errors_without_configured_provider`, `resolve_fallback_finds_same_tier_model`, `fallback_never_returns_primary_model`, `set_model_updates_fallback`, `select_best_available_model_returns_first_if_probes_fail`.

### 1.3 `llm/provider_chain.rs` — rate-limit + circuit breaker + fallback

```rust
pub struct TokenBucket { ... }            // pub fn new(rpm: f64); pub async fn acquire()
pub enum ProviderError { RateLimited, CreditExhausted, Transient(String), Fatal(String) }
pub enum CircuitState { Closed, Open, HalfOpen }
pub struct CircuitBreaker { ... }         // new(threshold: u32, cooldown: Duration); pub async fn allow() -> bool; record_success(); record_failure()
pub trait CompletionProvider: Send + Sync { fn name(&self) -> &str; fn complete<'a>(...) -> Pin<Box<dyn Future<Output = Result<String, ProviderError>> + Send + 'a>>; }
pub struct NimProvider { ... }            // new(base_url, api_key, model, rpm) — POST {base}/chat/completions
pub struct LocalProvider { ... }         // new(endpoint, model) — POST {endpoint}/api/generate
pub struct CircuitBreakerProvider { ... } // new(inner: Arc<dyn CompletionProvider>, threshold, cooldown); try_acquire/record_success/record_failure
pub struct FallbackChain { ... }         // new(providers: Vec<Arc<dyn CompletionProvider>>) (envolve cada um em breaker 3/30s); pub async fn complete(&self, prompt) -> Result<String, String> (3 retries/provider)
pub fn build_default_chain(base_url, nim_api_key, nim_model) -> FallbackChain
```

**Testes** (padrão `MockProvider` + `MockResult::{Ok,RateLimited,CreditExhausted,Fatal}` + `AtomicUsize` de calls — **o trait é o ponto de fake**): `classifies_http_statuses`, `token_bucket_grants_initial_capacity`, `chain_returns_first_ok`, `chain_skips_credit_exhausted_provider`, `chain_skips_fatal_provider`, `chain_errors_when_all_providers_fail`, `circuit_breaker_opens_after_threshold_failures`, `circuit_breaker_records_success`.

### 1.4 `llm/model_resolver.rs`

```rust
pub fn resolve_model(name_or_path: &str, models_dir: &Path) -> Result<PathBuf> // caminho direto → roots candidatos → .gguf → .alias → TRUSTED_MODELS → substring → manifest Ollama (blobs sha256-*)
pub fn list_models(models_dir: &Path) -> Vec<String>
pub fn list_models_in_root(root: &Path) -> Vec<String>
pub fn candidate_roots(models_dir: &Path) -> Vec<PathBuf> // dado, ~/.chronokairo/models, ~/.anamnesic/models, OLLAMA_MODELS, ~/.ollama/models, LOCALAPPDATA, /usr/share/ollama
```

**Testes** (fixtures `temp_dir(tag)` + `write_manifest()`): `resolves_named_model_to_blob`, `resolves_direct_file_path`, `errors_when_model_missing`, `lists_models_from_manifests`, `lists_nothing_without_manifests`, `resolves_direct_gguf_in_root`, `resolves_via_alias_file`, `resolves_trusted_model_filename`, `lists_direct_gguf_models`.

### 1.5 `llm/prompt.rs`

```rust
pub struct PlannerPrompt;   // pub fn system() -> &'static str; pub fn version() -> &'static str
pub struct CoderPrompt;     // pub fn system() -> &'static str (include_str!("../../prompts/coder.txt"))
impl CoderPrompt {
    pub fn load_project_context(workspace: &Path) -> String  // AGENTS.md → ChronoContextEngine::build_context_pack; senão CLAUDE.md/.cursorrules/CONTEXT.md (cap 4000); + RepoMap
    pub fn with_context(project_context: &str) -> String      // system + "Project Instructions:\n<ctx>"
    pub fn version() -> &'static str
}
```

**Testes**: `loads_project_context_from_workspace`, `planner_prompt_contains_expected_sections`, `coder_prompt_contains_expected_sections`, `prompts_report_version`.

### 1.6 `llm/manage.rs` — lifecycle GGUF

```rust
pub fn rm_model(query: &str) -> Result<()>                    // ~/.chronokairo/models
pub fn rm_model_in(query: &str, dir: &Path) -> Result<()>      // testável com temp dir
pub fn cp_model(source: &str, target: &str) -> Result<()>
pub fn cp_model_in(source, target, dir: &Path) -> Result<()>  // cria .alias
pub fn show_model(query: &str) -> Result<()>
pub fn ps_status() -> Result<()>
pub fn run_direct(query: &str, prompt: Option<&str>, no_gpu: bool) -> Result<()>
pub fn list_models_detailed(models_dir: &Path) -> Result<()>
```

**Testes**: `ps_status_runs_without_panic`, `list_models_detailed_handles_empty`, `list_models_detailed_formats_table`, `cp_and_rm_model_lifecycle`.

### 1.7 `llm/embedder.rs`

```rust
pub const EMBEDDING_DEFAULT: &str = "Qwen3-Embedding-0.6B-Q8_0.gguf";
pub enum EmbedKind { Query, Passage }
pub struct Embedder { ... }
impl Embedder {
    pub fn new() -> Self                    // resolve ~/.chronokairo/models/embeddings/*.gguf
    pub fn is_available(&self) -> bool
    pub fn embed(&self, text: &str, kind: EmbedKind) -> Result<Vec<f32>>  // prefixo "Query: "/"Passage: ", L2-norm
    pub fn dim(&self) -> usize
}
pub fn global_models_dir() -> PathBuf
pub fn download_embedding_model() -> Result<PathBuf>
```

**Testes**: `resolve_source_uses_global_models_dir`, `resolve_source_returns_none_when_missing` (setam `HOME`/`USERPROFILE` em temp + `ENV_LOCK` mutex), `#[ignore] real_embedding_model_ranks_similar_texts`.

**Nota**: `llm/tier.rs` expõe `pub enum ModelTier`, `classify_model_tier(model_id)`, `classify_model_tier_from_info(...)`, `find_same_tier_fallback(...)`.

## 2. `kaide::providers`

### 2.1 `types.rs` (serde real)

```rust
pub type Catalog = HashMap<String, Provider>;
pub struct Provider { pub id, name, api: String, pub env: Vec<String>, pub doc: String, pub models: HashMap<String, ModelInfo> }
pub struct ModelInfo { pub id, name, family: String; pub reasoning, tool_call, temperature, open_weights, attachment: bool; pub limit: Limits; pub cost: Cost; pub modalities: Modalities; pub knowledge: Option<String>; pub release_date: Option<String> }
pub struct Limits { pub context: u64, pub output: u64 }
pub struct Cost { pub input: f64, pub output: f64, pub cache_read: Option<f64>, pub cache_write: Option<f64> }  // USD/MTok
pub struct Modalities { pub input: Vec<String>, pub output: Vec<String> }
pub struct CloudMatch { pub provider, model_id, model_name: String, pub cost_in, cost_out: f64, pub context_k: u64, pub reasoning: bool }
```

### 2.2 `catalog.rs`

```rust
pub struct ProviderCatalog { pub catalog: Catalog }   // campo pub — injetável em testes
impl ProviderCatalog {
    pub fn load() -> Self                              // cache ~/.cache/rustcode/provider_catalog.json (TTL 24h); senão discovery HTTP
    pub fn all_models(&self) -> Vec<(&str, &str, &ModelInfo)>
    pub fn find_by_id(&self, id: &str) -> Option<(&str, &ModelInfo)>
    pub fn filter<F: Fn(&ModelInfo) -> bool>(&self, pred: F) -> Vec<(&str, &ModelInfo)>
    pub fn suggest_for_task(&self, category: &str, top_n: usize) -> Vec<(&str, &ModelInfo)>  // "coding"/"reasoning"
    pub fn match_local(&self, ollama_name: &str) -> Option<CloudMatch>  // family prefix, mais barato
    pub fn provider_models(&self, provider_id: &str) -> Vec<&ModelInfo>
    pub fn provider_model_api_id(&self, provider, model) -> Option<String>  // id exato ou base_id
    pub fn print_list(&self, query: &str)
}
pub fn base_id(id: &str) -> String   // último segmento pós '/', lowercased
```

**Testes** (com `sample_client()` fake em memória): `find_by_id_locates_model_across_providers`, `provider_models_returns_only_that_provider`, `suggest_for_task_prefers_cheapest_tool_callable`, `match_local_maps_ollama_family_to_cloud`, `match_local_returns_none_when_family_matches`, `filter_selects_only_matching_models`, `all_models_spans_providers`, `base_id_normalizes_provider_qualified_ids`, `provider_model_api_id_matches_exact_or_base_id`, `heuristic_flags_marks_reasoning_and_vision`, `urlencode_encodes_key_safely`.

### 2.3 `store.rs` — credenciais (TOML próprio)

```rust
pub struct ProviderEntry { pub api_key: Option<String>, pub api_base: Option<String>, pub enabled: bool /*default true*/ }
pub struct ProviderStore { #[serde(flatten)] pub providers: HashMap<String, ProviderEntry> }
impl ProviderStore {
    pub fn load() -> Self                     // ~/.chronokairo/providers.toml (fallback legacy ~/.anamnesic)
    pub fn save(&self) -> Result<()>          // chmod 0600
    pub fn set_key(&mut self, provider_id, api_key)
    pub fn set_base(&mut self, provider_id, api_base)
    pub fn remove(&mut self, provider_id)
    pub fn set_enabled(&mut self, provider_id, enabled)
    pub fn api_key(&self, provider_id) -> Option<&str>
    pub fn active_providers(&self) -> Vec<(&str, &ProviderEntry)>
    pub fn config_path_display() -> String
    pub fn detect_env_keys(catalog: &Catalog) -> Vec<(String, String, String)>
    pub fn import_from_env(catalog: &Catalog) -> Result<Vec<String>>
    pub fn resolve_cloud_credentials(provider_id, catalog) -> Result<(String, String)>  // (base, key)
}
pub fn load_dotenv()
pub fn print_store(store, catalog)
pub fn mask_key(key: &str) -> String
```

**Testes**: `set_key_creates_enabled_entry`, `remove_deletes_entry`, `set_enabled_toggles_without_removing_key`, `active_providers_only_returns_enabled_with_key`, `set_base_overrides_default`, `config_path_uses_home` (manipula `HOME`), `detect_env_keys_finds_unconfigured_provider`, `mask_key_hides_most_of_key`.

### 2.4 `verify.rs`

```rust
pub async fn test_provider(provider_id: &str, entry: &ProviderEntry) -> Result<String>  // GET {base}/models com bearer
```

## 3. `kaide::mcp`

### 3.1 `mod.rs` — cliente MCP (stdio subprocess)

```rust
pub struct McpServerConfig { pub command: String, pub args: Vec<String>, pub env: Vec<(String, String)> }
pub struct McpClient { process: Child, stdin, stdout: BufReader<ChildStdout>, next_id: u64, tools: Vec<ToolDef> }  // campos privados
impl McpClient {
    pub fn connect(config: &McpServerConfig) -> Result<Self>   // spawn + handshake "initialize" ("2024-11-05") + "initialized" + list_tools cacheado
    pub fn list_tools(&mut self) -> Result<Vec<crate::llm::client::ToolDef>>
    pub fn has_tool(&self, name: &str) -> bool
    pub fn call_tool(&mut self, name: &str, arguments: &Value) -> Result<String>  // tools/call → content[0].text
}
```

Protocolo JSON-RPC 2.0 linha-a-linha em stdin/stdout; ignora linhas não-JSON e respostas com id diferente.

**Testes**: `mcp_server_config_can_be_created`, `mcp_server_config_supports_equality`, **`fake_mcp_server_process`** (L199) — server JSON-RPC fake embutido no binário de teste; no-op a menos que `CHRONOKAIRO_FAKE_MCP_SERVER=1` (responde `initialize`/`tools/list` (tool `fake_tool`)/`tools/call` "fake result"); usado como subprocesso via `McpClient::connect(&McpServerConfig { command: current_exe, args, env })`.

### 3.2 `server.rs` — MCP server expondo o harness

```rust
pub struct McpServer { session: Arc<Session>, workspace: PathBuf }
impl McpServer {
    pub fn new(client: LlmRouter, state: AgentState) -> Self
    pub fn run_stdio(self) -> Result<()>   // loop JSON-RPC stdio; tools: "run_coder" (prompt/mode) e "chrono_get_context" (task/char_budget)
}
```

`run_coder` submete `Op::UserTurn` e drena `session.next_event()`; approvals auto-aprovados (exec: AllowOnce; plan: Approve); Done/Failed/Interrupted encerram. Sem testes `#[cfg(test)]`.

## 4. `kaide::memory`

### 4.1 `short_term.rs`

```rust
pub fn estimate_tokens(text: &str) -> usize   // BPE calibrado (ASCII/4; non-ASCII ×2; pontuação/ws +1)
pub struct ShortTermMemory { ... }            // VecDeque<(u64 seq, role, content)>; campos privados
impl ShortTermMemory {
    pub fn new(max_messages: usize) -> Self
    pub fn add_message(&mut self, role: &str, content: &str)   // pop_front ao exceder max
    pub fn load_records(&mut self, records: Vec<(u64, String, String)>) -> usize
    pub fn records_after(&self, last_seq: Option<u64>) -> Vec<(u64, String, String)>  // delta p/ persistência
    pub fn next_seq(&self) -> u64
    pub fn summary(&self) -> Option<&str>
    pub fn add_action(&mut self, action: &str)
    pub fn add_file(&mut self, filepath: &str)  // dedup
    pub fn file_count(&self) -> usize
    pub fn transcript(&self) -> String
    pub fn estimated_tokens(&self) -> usize
    pub fn compact(&mut self, summary: String)  // mantém só a última msg
    pub fn get_context(&self) -> String          // summary + última msg (200 chars) + 5 ações + 10 arquivos
    pub fn history(&self) -> Vec<(String, String)>
    pub fn conversation(&self) -> Vec<(String, String)>  // injeta summary como system uma vez
    pub fn last_message(&self) -> Option<(String, String)>
    pub fn clear(&mut self)
}
```

**Testes**: `token_estimate_is_positive`, `token_estimate_counts_non_ascii_extra`, `compact_keeps_last_message_and_summary`, `prunes_oldest_messages_over_capacity`, `add_file_deduplicates`, `transcript_contains_messages_in_order`, `last_message_returns_most_recent`, `get_context_truncates_long_last_message`, `clear_resets_all_state`, `records_after_only_yields_unsaved_messages`, `load_records_preserves_order_and_continues_seq`, `conversation_materializes_summary_as_system_once`.

### 4.2 `log.rs` — memória de longo prazo (JSON em disco)

```rust
pub struct SessionInfo { pub id: i64, pub timestamp: String, pub updated_at: String, pub summary: String, pub message_count: usize, pub model: String }
pub struct VectorHit { pub text: String, pub source: String, pub score: f64 }
pub struct LongTermMemory { path: PathBuf, store: Arc<RwLock<MemoryStore>> }  // Clone (compartilha store)
impl LongTermMemory {
    pub fn new(db_path: PathBuf) -> Result<Self>
    pub fn path(&self) -> &Path
    pub fn start_session(&self, workspace: &str, model: &str) -> Result<i64>
    pub fn append_messages(&self, session_id, messages: &[(i64, String, String)]) -> Result<()>  // idempotente por (session_id, seq)
    pub fn update_session(&self, session_id, title, context, model) -> Result<()>
    pub fn store_vector(&self, session_id, source, text, embedding: &[f32]) -> Result<()>
    pub fn search_vectors(&self, query: &[f32], k: usize) -> Result<Vec<VectorHit>>  // dot product top-k (clamp 1..=50)
    pub fn list_sessions(&self, workspace: &str, limit: usize) -> Result<Vec<SessionInfo>>  // só "active" com messages
    pub fn latest_session(&self, workspace: &str) -> Result<Option<i64>>
    pub fn load_session(&self, session_id) -> Result<Vec<(i64, String, String)>>  // por seq
    pub fn session_context(&self, session_id) -> Result<Option<String>>
    pub fn delete_session(&self, session_id) -> Result<()>
    pub fn save_session(&self, task, response) -> Result<()>   // legacy shim
    pub fn get_recent_sessions(&self, limit) -> Result<Vec<(String, String)>>
    pub fn save_decision(&self, decision, reason) -> Result<()>
    pub fn search_memories(&self, query, limit) -> Result<Vec<serde_json::Value>>  // full-text
}
```

Persistência atômica: `.tmp` + rename. **Testes** (fixture `temp_memory(tag)`): `persists_and_reloads_session_transcript`, `append_is_idempotent_per_seq`, `sessions_are_scoped_by_workspace`, `empty_sessions_are_excluded_from_listing`, `delete_removes_session_and_messages`, `vector_store_roundtrips_and_ranks_by_similarity`.

## 5. `kaide::skills`

```rust
pub struct Skill { pub name: String, pub description: String, pub body: String, pub source: PathBuf }  // parse() é PRIVADO
impl Skill { pub fn summary(&self) -> String }  // "name - description"
pub struct SkillRegistry { skills: Vec<Skill> }  // Debug, Clone, Default
impl SkillRegistry {
    pub fn new() -> Self
    pub fn load_from(&mut self, dirs: impl IntoIterator<Item = PathBuf>)  // escaneia .md; ordena por nome; dedup case-insensitive (primeiro vence = projeto)
    pub fn list(&self) -> &[Skill]
    pub fn get(&self, name: &str) -> Option<&Skill>
    pub fn is_empty(&self) -> bool
}
pub fn default_skill_dirs(workspace: &Path) -> Vec<PathBuf>  // ./skills + ~/.chronokairo/skills (+ legacy ~/.anamnesic/skills)
```

**Testes**: `parses_frontmatter_and_body`, `body_without_frontmatter_still_works`, `registry_loads_and_dedups_with_project_precedence`, `summary_uses_description_when_present`, `missing_directory_is_silently_ignored`.

## 6. `kaide::compressor`

### 6.1 `helpers.rs` — funções puras

```rust
pub fn is_base64_url_char(c: char) -> bool
pub fn replace_timestamps(s: &str) -> String      // ISO → "<TS>"
pub fn replace_uuids(s: &str) -> String           // → "<UUID>"
pub fn replace_hex_literals(s: &str) -> String   // 0x…{6,} → "<HEX>"
pub fn replace_numbers(s: &str) -> String        // \d{3,} → "<N>"
pub fn replace_opaque_hashes(s: &str) -> String  // hex ≥40 → "<HASH>"
pub fn replace_hashes_and_sha(s: &str) -> String // 64 hex → "<SHA256>"; ≥32 → "<HASH>"
pub fn replace_jwts(s: &str) -> String           // eyJ… → "<JWT>"
pub fn replace_urls(s: &str) -> String           // scheme://… → "scheme://<URL>"
pub fn shorten_quoted_paths(input: &str, min_len: usize) -> String  // mantém últimos 3 segmentos
```

### 6.2 `layer1.rs` — compressão estrutural de output

```rust
pub struct CompressResult { pub output: String, pub original_lines: usize, pub compressed_lines: usize, pub applied_rules: Vec<String> }
pub fn compress(input: &str) -> CompressResult
// pipeline: strip_ansi → remove_progress_bars → collapse_blank_lines → template_dedup ([×N])
// → filter_stack_frames ("N framework frames omitted") → filter_test_pass ("test … ok")
// → factor_common_prefix ("[common prefix: …]") → shorten_paths(40) → normalize_tokens (SHA256/JWT)
```

**Testes**: `strips_ansi_sequences`, `removes_progress_and_build_lines`, `collapses_runs_of_blank_lines`, `dedups_repeated_templates_by_timestamp`, `collapses_framework_stack_frames`, `filters_passing_test_lines`, `factors_common_prefix`, `shortens_long_quoted_paths`, `masks_hashes_and_tokens`, `compress_applies_rules_end_to_end`.

### 6.3 `layer2.rs` — compressão semântica

```rust
pub struct CompressLayer2 { tokenizer: TokenizerKind, pub original_tokens: usize, pub compressed_tokens: usize, pub applied_rules: Vec<String> }
impl CompressLayer2 {
    pub fn new() -> Self
    pub fn process(&mut self, input: &str) -> String  // opaque_norm → path_shrink(30) → ws_collapse (indent >4 → 4) → prefix_consolidate ("[common: …] ×N lines" se prefixo ≥8 em ≥50% das linhas)
}
```

**Testes**: `estimates_tokens_from_byte_length`, `normalizes_opaque_tokens`, `shortens_paths_keeping_last_segments`, `leaves_short_paths_untouched`, `collapses_deep_indentation`, `consolidates_repeated_prefixes`, `leaves_short_inputs_untouched_by_consolidation`, `process_reports_rule_application`.

## 7. `kaide::protocol`

### 7.1 `mod.rs` — queue-pair Op/EventMsg + Session

```rust
pub enum Op { UserTurn { prompt: String, mode: String }, Interrupt, ExecApproval { id: u64, decision: String }, PlanApproval { id: u64, decision: String }, Shutdown }
pub enum EventMsg { TurnContext { thread_id: String, turn_id: u64 }, TurnStarted, TextDelta { text }, ReasoningDelta { text },
    ToolCall { id, name, summary }, ToolCallDelta { id, index, name: Option<String>, args_delta },
    ToolResult { id, name, output, exit_code: Option<i32>, timed_out, duration_ms },
    PlanStep { index, total, description }, PlanApprovalRequest { id, steps: Vec<PlanStepSummary> },
    ExecApprovalRequest { id, tool, summary, risk }, FileChanged { path }, Verification { status, command: Option<String>, summary },
    CompletionAudit { passed, evidence }, Transaction { action, summary },
    TokenUsage { prompt_tokens, completion_tokens, reasoning_tokens, total_tokens }, Note { text }, Routing { summary },
    Done { message }, Failed { message }, Interrupted, TurnComplete { final_text }, Error { message } }  // #[serde(tag="type", content="data")]
pub struct PlanStepSummary { pub step_type: String, pub description: String, pub filename: Option<String>, pub command: Option<String> }
pub enum ApprovalDecisionSerde { AllowOnce, AllowSession, Deny }
impl EventMsg { pub fn to_json(&self) -> Value; pub fn from_json(&Value) -> Result<Self> }  // {"type":..., "data":{...}}
impl From<AgentEvent> for EventMsg
pub struct Session { ... }  // campos privados
impl Session {
    pub fn spawn(client: LlmRouter, state: AgentState) -> Self   // thread própria + runtime async; loop de Op
    pub fn submit(&self, op: Op) -> Result<(), mpsc::SendError<Op>>
    pub fn next_event(&self) -> Option<EventMsg>   // bloqueante
    pub fn try_next_event(&self) -> Option<EventMsg>
    pub fn interrupt(&self)
    pub fn approve_exec(&self, id: u64, decision: ApprovalDecisionSerde)
    pub fn approve_plan(&self, id: u64, decision: PlanApprovalDecision)
    pub fn shutdown(&mut self)   // Drop também chama
}
```

Fluxo por turno: `Op::UserTurn` → `TurnContext { thread_id, turn_id }` → `run_agent_loop_with_hooks` (hooks traduzem AgentEvent→EventMsg); approvals bloqueiam em `mpsc` até `approve_exec/approve_plan`.

**Testes**: `tool_result_round_trips_with_terminal_metadata`, `turn_context_round_trips_correlation_ids`, `tool_delta_round_trips_item_id`.

### 7.2 `event_log.rs` — event log canônico

```rust
pub struct EventLogEntry { pub schema_version: u32, pub sequence_id: u64, pub timestamp: String, pub session_id: String, pub turn_id: u64, pub event: EventMsg, pub metadata: HashMap<String, String> }
pub struct ReplayedSession { pub session_id, pub total_turns, pub tool_calls: Vec<(String,String)>, pub files_changed: Vec<String>, pub verifications: pub approvals: Vec<String>, pub total_prompt_tokens, pub total_completion_tokens, pub total_reasoning_tokens: usize, pub completed_successfully: bool, pub final_message: Option<String> }
pub struct CanonicalEventLog { ... }  // Debug, Clone, Default
impl CanonicalEventLog {
    pub fn new() -> Self
    pub fn append(&mut self, session_id: &str, turn_id: u64, event: EventMsg) -> u64
    pub fn append_with_metadata(&mut self, session_id, turn_id, event, metadata: HashMap<String,String>) -> u64
    pub fn entries(&self) -> &[EventLogEntry]
    pub fn len(&self) / pub fn is_empty(&self) -> bool
    pub fn persist_jsonl(&self, path: &Path) -> Result<()>
    pub fn append_to_file(entry: &EventLogEntry, path: &Path) -> Result<()>   // assoc. estático
    pub fn load_jsonl(path: &Path) -> Result<Self>   // recupera next_sequence
    pub fn replay(&self) -> ReplayedSession
    pub fn replay_entries(entries: &[EventLogEntry]) -> ReplayedSession  // determinístico
}
```

Formato JSONL: `{"schema_version":1, "sequence_id", "timestamp" (UTC RFC3339), "session_id", "turn_id", "event": {type/data}, "metadata"}`. **Teste**: `test_event_log_replay`.

## 8. `kaide::app_server`

### 8.1 `mod.rs` — JSON-RPC 2.0 sobre stdio (app-server headless)

```rust
pub struct AppServer { session: Arc<Session>, workspace: PathBuf, model: String, ... }
impl AppServer {
    pub fn new(client: LlmRouter, state: AgentState) -> Self
    pub fn run_stdio(self) -> Result<()>
}
```

**Métodos**: `initialize` → `{"protocolVersion":1, "capabilities": {"tasks":"v1","approvals":"v1","streaming":"v1","interrupt":"v1"}, "serverInfo":{"name":"chronokairo","version":CARGO_PKG_VERSION}}`; `start_turn` (params `{prompt, mode}` — "agent"|"plan") → `{"ok":true}`; `interrupt`, `exec_approval` (`{id, decision}`), `plan_approval`, `shutdown` → `{"ok":true}`; métodos suportados por `runtime_api::supports` → despachados a `runtime_api::call`; erro de domínio → código **-32001**; método desconhecido → **-32601**; parse → **-32700**.

**Eventos**: thread "event pump" drena `session.next_event()` e escreve 1 linha por evento: `{"jsonrpc":"2.0","method":"agent/event","params":<EventMsg>}`. Consumidores leem dois streams misturados no stdout: respostas (com `id`) e notificações `agent/event` (sem `id`).

### 8.2 `runtime_api.rs` — API de leitura/consulta do runtime

```rust
pub fn supports(method: &str) -> bool
pub fn call(method: &str, params: Option<&Value>, default_workspace: &Path, default_model: &str) -> Result<Value, String>
```

**Todos os 33 métodos** (`METHODS`): `get_harness_overview`, `get_harness_skills`, `get_harness_memory_sessions` (param `limit` default 50), `get_harness_session_messages` (param `sessionId` obrigatório), `create_harness_session` (`model?`, `title?`, `initialPrompt?` → id `i64`), `get_harness_context_files` (AGENTS.md/CLAUDE.md/MEMORY.md/.github/copilot-instructions.md), `read_harness_file`/`write_harness_file` (recusa escape), `get_harness_automations` (.github/workflows), `get_harness_git_scan`, `get_harness_git_status`, `get_context_fragments`, `assemble_context_fragments`, `preview_context_for_prompt`, `search_files` (`query`, `roots?`, `limit?`), `get_file_watch_snapshot`, `apply_patch_dry_run` (não escreve), `apply_patch_commit`, `apply_patch_commit_with_backup` (manifest `~/.chronokairo/patch-backups/{patch_id}.json`), `revert_patch` (param `patchId`), `get_exec_policy`, `set_exec_policy`, `check_command_policy` (`command: [argv]` → `{allowed, decision, rule}`), `allow_command_always`, `remove_exec_policy_rule`, `search_memories`, `collect_git_info`, `detect_fsmonitor`, `get_default_branch`, `get_attribution_policy`, `get_git_user_info`, `format_commit_attribution`.

**Sessões**: `create_harness_session` → `LongTermMemory::start_session` + `update_session` (+ `append_messages`); retomada = `get_harness_memory_sessions` → `get_harness_session_messages(sessionId)`. Backing store: `~/.chronokairo/memory.db` (fallback legacy `~/.anamnesic/memory.db`). O transcript é retomado por `ShortTermMemory::load_records` via `AgentState::load_session_into_state`.

**Testes** (workspace temp + `crate::config::global_settings::TestHome::new()`): `patch_dry_run_does_not_write_and_backup_can_revert`, `file_search_returns_frontend_contract`.

## Receitas de construção para testes (transversal)

1. **LLM sem rede**: `LlmClient::cloud("http://127.0.0.1:<porta>", "test-key")` + réplica do padrão `SseFixture` (TcpListener loopback com body fixo), ou serde direto nos tipos.
2. **Router sem rede**: `LlmRouter::with_catalog(LlmClient::ollama("http://localhost:11434"), ProviderCatalog { catalog: <HashMap sintético> })`.
3. **Provider chain**: implementar `CompletionProvider` num mock (padrão `MockProvider`) e montar `FallbackChain::new(vec![Arc::new(mock), ...])`; rodar com `crate::async_rt::block_on`.
4. **MCP**: spawn do próprio binário de teste com env `CHRONOKAIRO_FAKE_MCP_SERVER=1` + `McpClient::connect(&McpServerConfig { command: current_exe, args: vec!["fake_mcp_server_process".into(), "--exact".into()], env })`.
5. **Session/AppServer/McpServer**: `Config::default()` com `workspace_dir` + `memory_dir` temp → `AgentState::new(config)` → `Session::spawn(router, state)` / `AppServer::new` / `McpServer::new`. Approvals: `session.approve_exec(id, ApprovalDecisionSerde::AllowOnce)`.
6. **Memória/compressor/skills/event log**: puro `new` + temp dir, sem I/O de rede.
