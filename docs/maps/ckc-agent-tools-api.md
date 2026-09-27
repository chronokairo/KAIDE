# Mapa de APIs do núcleo `ckc` — Agente, Tools e Repo

> Gerado em 2026-09-26 como subsídio para os testes de integração dos P0s de mercado (`TODO.md` — "P0 — Coding agent de mercado").
> Crate: `src-tauri/core` (`ckc`, zero-lib). Todos os módulos são `pub mod` via `lib.rs`, acessíveis como `ckc::...`.
> Macros do crate: `crate::json!` / `crate::json_expr!` (`#[macro_export]`, root). `crate::json::Value` é o enum JSON próprio. Erros em `crate::error::{Result, anyhow, bail, message, Context}`.

## 1. `ckc::agent::*`

### 1.1 `agent/agent_loop.rs` (3268 linhas) — loop do agente + `AgentHooks`

**Items públicos:**

```rust
pub enum AgentEvent {           // clonável, Debug; 17 variantes
    Status(String),
    ToolCall { id: String, name: String, summary: String },
    ToolCallDelta { id: String, index: usize, name: Option<String>, args_delta: String },
    ToolResult { id: String, name: String, output: String, exit_code: Option<i32>, timed_out: bool, duration_ms: u64 },
    PlanStep { index: usize, total: usize, description: String },
    FileChanged { path: String },
    Verification { status: String, command: Option<String>, summary: String },
    CompletionAudit { passed: bool, evidence: String },
    Transaction { action: String, summary: String },
    TextDelta { text: String },
    TokenUsage { prompt_tokens: usize, completion_tokens: usize, reasoning_tokens: usize, total_tokens: usize },
    Routing { summary: String },
    ReasoningDelta { text: String },
    ResetReasoning,
    Done { message: String },
    Failed { message: String },
    Interrupted,
}

pub struct ApprovalRequest { pub id: u64, pub tool: String, pub summary: String, pub risk: String }
pub struct PlanApprovalRequest { pub id: u64, pub steps: Vec<crate::types::plan::PlanStep> }
pub enum PlanApprovalDecision { Approve, Deny }
pub enum ApprovalDecision { AllowOnce, AllowSession, Deny }
pub type ToolCallDeltaFn = Arc<dyn Fn(usize, Option<&str>, &str) + Send + Sync>;

#[derive(Default, Clone)]
pub struct AgentHooks {
    pub on_event: Option<Arc<dyn Fn(AgentEvent) + Send + Sync>>,
    pub on_tool_call_delta: Option<ToolCallDeltaFn>,
    pub on_text_delta: Option<Arc<dyn Fn(&str) + Send + Sync>>,
    pub on_approval: Option<Arc<dyn Fn(ApprovalRequest) -> ApprovalDecision + Send + Sync>>,
    pub on_plan_approval: Option<Arc<dyn Fn(PlanApprovalRequest) -> PlanApprovalDecision + Send + Sync>>,
    pub interrupt: Option<Arc<AtomicBool>>,
    pub session_approvals: Arc<Mutex<BTreeSet<String>>>,   // sempre presente (não Option)
}

pub async fn run_agent_loop(client: &LlmRouter, state: &mut AgentState, task: &str)
pub async fn run_agent_loop_with_hooks(client: &LlmRouter, state: &mut AgentState, task: &str, hooks: &AgentHooks, mode: AgentMode)
```

**Métodos públicos de `AgentHooks`** (linhas 151–394):

```rust
pub fn emit(&self, event: AgentEvent)
pub fn text_delta(&self, text: &str)              // só callback, sem stdout
pub fn stream_text(&self, text: &str)             // callback OU print! stdout
pub fn reasoning_delta(&self, text: &str)
pub fn reset_reasoning(&self)
pub fn note(&self, text: &str)                    // Status event ou println
pub fn warn(&self, text: &str)
pub fn tool_call(&self, id: &str, name: &str, summary: &str)
pub fn plan_step(&self, index: usize, total: usize, step_type: &str, description: &str)
pub fn file_changed(&self, path: &str)
pub fn verification(&self, result: &VerificationResult)
pub fn transaction(&self, action: &str, summary: &str)
pub fn completion_audit(&self, passed: bool, evidence: &str)
pub fn tool_result(&self, id: &str, name: &str, output: &str, exit_code: Option<i32>, timed_out: bool, duration_ms: u64)
pub fn require_approval(&self, policy: ApprovalPolicy, tool: &str, summary: &str, risk: &str) -> Result<(), String>
pub fn require_plan_approval(&self, steps: Vec<PlanStep>) -> Result<(), String>
pub fn done(&self, message: &str)
pub fn failed(&self, message: &str)
pub fn interrupted(&self) -> bool
```

**Como `require_approval` decide** (prioridade do usuário): scope = `"{tool}\n{summary}"`. Se policy `Ask` e scope já está em `session_approvals` → Ok. `Allow` → Ok. `Deny` → `Err("{tool} is denied by policy")`. `Ask` → chama `on_approval`; sem callback → default **Deny**. `AllowSession` insere o scope em `session_approvals` (reuso em hooks clonados). `AllowOnce` não persiste.

**Fluxo do `run_agent_loop_with_hooks`**: `state.start_turn()` (snapshot transacional) → adiciona mensagem user → conecta MCP → se `config.spec_lock`, compila `TaskSpec` imutável (via `crate::repo::spec::compile_task_spec`, async) → `maybe_compact` → `AgentMode::Agent` chama `run_tool_use_iteration` (match privado `execute_tool`), `AgentMode::Plan` chama `run_planner_fallback(..., require_plan_approval=true)` → `state.persist_session()`.

**ATENÇÃO**: o loop de produção NÃO despacha via `ToolRegistry`; usa um `match` **privado** `fn execute_tool(client, state, tc: &ToolCall, hooks) -> ToolExecutionResult` (linha 1222) + `execute_read_only` (paraleliza read-only com `std::thread::scope`, agrupa por `config.max_parallel_tools`). O `ToolRegistry` (tool_registry.rs) é uma implementação paralela usada por `ModularAgentLoop`. O gate de conclusão `completion_gate` (linha 1846) bloqueia sucesso se houve `blocked_actions` ou mutação sem verificação aprovada.

**Testes existentes (`#[cfg(test)]` mod tests, linha 2841)** — 17 testes:
`adversarial_prompt_mentions_files_and_diff`, `completion_gate_rejects_unverified_mutation`, `completion_gate_requires_all_actions_to_be_allowed`, `completion_gate_accepts_a_passed_mutation`, `tool_effects_are_classified_for_the_scheduler`, `multi_edit_file_dispatch_applies_several_edits`, `task_tool_spawns_sub_agent`, `task_tool_runs_parallel_subagents`, `utf8_tool_output_is_truncated_on_a_character_boundary`, `todo_tool_lists_and_completes_items`, `failed_mutation_repairs_then_fails_when_budget_is_exhausted`, `try_mcp_tool_returns_none_when_no_mcp_clients`, `mcp_tool_call_respects_ask_policy_without_approval_callback`, `mcp_tool_call_approved_when_callback_returns_allow`, `allow_session_is_reused_by_cloned_hook_state`, `session_approval_is_scoped_to_concrete_action`, `mcp_tool_call_runs_when_policy_is_allow`, `extracts_tool_calls_from_markdown_code_block`, `extracts_tool_calls_from_tag_format`, `extracts_tool_calls_from_raw_json_object`.

**Helpers de teste neste arquivo** (modelos a reaproveitar):
- `fn test_state(tag: &str) -> (AgentState, PathBuf)` — cria `Config { workspace_dir: temp/chronokairo-loop-{tag}-{pid}/workspace, memory_dir: .../memory, max_retries: 1, ..Default::default() }` → `AgentState::new(config)`.
- `fn dummy_router() -> LlmRouter` — `LlmRouter::new(LlmClient::ollama("http://localhost:11434"))` (nunca conecta se não gera).
- `fn recording_hooks() -> (AgentHooks, Arc<Mutex<Vec<AgentEvent>>>)` — captura eventos num sink.
- `fn tool_call(name: &str, arguments: serde_json::Value) -> ToolCall` — monta `crate::llm::client::ToolCall { id, r#type: "function", function: ToolCallFunction { name, arguments: json.to_string() } }`.
- `fn fake_mcp_client() -> McpClient` — **fake de processo real**: spawna o próprio binário de teste com `--exact mcp::tests::fake_mcp_server_process` como servidor MCP exposto de `fake_tool` (via `McpClient::connect(&McpServerConfig { command: current_exe, args, env })`).

### 1.2 `agent/tool_registry.rs` — `Tool` trait + Registry (606 linhas)

```rust
pub enum ToolEffect { ReadOnly, Mutation, Command }   // Debug, Clone, Copy, PartialEq, Eq

#[derive(Debug, Clone)]
pub struct ToolOutput {
    pub output: String,
    pub mutated: bool,
    pub changed_file: Option<String>,
    pub verification: Option<VerificationResult>,
    pub exit_code: Option<i32>,
    pub timed_out: bool,
}
impl ToolOutput { pub fn output(text: impl Into<String>) -> Self }

pub struct ToolContext<'a> {
    pub state: &'a mut AgentState,
    pub hooks: &'a AgentHooks,
    pub client: &'a LlmRouter,        // nenhuma tool nativa usa; passe um dummy router
}

pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn schema(&self) -> Value;
    fn effect_class(&self) -> ToolEffect;
    fn is_concurrency_safe(&self) -> bool { self.effect_class() == ToolEffect::ReadOnly }   // default
    fn requires_approval(&self) -> bool { self.effect_class() != ToolEffect::ReadOnly }     // default
    fn execute(&self, ctx: &mut ToolContext, args: &JsonMap<String, Value>) -> Result<ToolOutput>;
    // JsonMap = BTreeMap<String, Value> (alias local p/ "serde_json::Map")
}
```

**12 tools nativas (unit structs, sem campos)**: `ReadFileTool` ("read_file", ReadOnly), `WriteFileTool` ("write_file", Mutation), `EditFileTool` ("edit_file", Mutation), `ApplyPatchTool` ("apply_patch", Mutation — chama `crate::tools::patch::apply_patch`), `RunCommandTool` ("run_command", Command — chama `shell::run_command_raw_with_interrupt`), `RunTestsTool` ("run_tests", Command — chama `test::run_tests` + `state.record_verification`), `ListTreeTool` ("list_tree", ReadOnly), `SearchCodeTool` ("search_code", ReadOnly — invoca binário `rg` externo, degrada graciosamente), `FindReplaceTool` ("find_replace", Mutation, `requires_approval=true`, `is_concurrency_safe=false`), `HighlightTool` ("highlight_file", ReadOnly), `PickerTool` ("file_picker", ReadOnly), `TodoTool` ("todo", Command).

**Registry:**

```rust
pub struct ToolRegistry { tools: HashMap<String, Box<dyn Tool>> }   // campo privado
impl Default for ToolRegistry
impl ToolRegistry {
    pub fn new() -> Self                                    // já registra as 12 default
    pub fn register_default_tools(&mut self)
    pub fn register(&mut self, tool: Box<dyn Tool>) -> Result<()>   // Err se nome duplicado
    pub fn get(&self, name: &str) -> Option<&dyn Tool>
    pub fn has_tool(&self, name: &str) -> bool
    pub fn execute(&self, name: &str, ctx: &mut ToolContext, args: &serde_json::Map<String, Value>) -> Result<ToolOutput>
    pub fn all_schemas(&self) -> Vec<Value>                  // formato OpenAI function-tools
}
```

**Como executar uma tool (receita de integração)**: `ToolRegistry::new()` → `let mut state = AgentState::new(config)?;` → `let hooks = AgentHooks::default();` → `let router = LlmRouter::new(LlmClient::ollama("http://localhost:11434"));` → `let mut ctx = ToolContext { state: &mut state, hooks: &hooks, client: &router };` → `let args: BTreeMap<String, Value> = ...` (ex.: `crate::json::from_str(r#"{"path":"a.txt","content":"x"}"#)?.as_object().unwrap().clone()`) → `registry.execute("write_file", &mut ctx, &args)?`.

**Teste existente**: `test_registry_registration_and_dispatch` (verifica `has_tool` p/ read_file/write_file/apply_patch, schemas ≥ 9).

### 1.3 `agent/subagent.rs` (90 linhas)

```rust
pub const MAX_SUBAGENT_DEPTH: usize = 3;
#[derive(Debug, Clone)]
pub struct SubagentConfig { pub prompt: String, pub description: String, pub max_tokens: Option<usize>, pub max_depth: usize, pub current_depth: usize }
#[derive(Debug, Clone)]
pub struct SubagentOutcome { pub subagent_id: String, pub success: bool, pub output: String, pub files_mutated: Vec<String>, pub tokens_used: usize }
pub struct SubagentSession { pub id: String, pub config: SubagentConfig, pub event_log: CanonicalEventLog }
impl SubagentSession {
    pub fn new(id: impl Into<String>, config: SubagentConfig) -> Result<Self>       // Err se current_depth >= max_depth
    pub fn create_child_state(&self, parent: &AgentState) -> Result<AgentState>     // clone do config do pai; session_persist=false
    pub fn record_event(&mut self, event: EventMsg)                                 // event_log.append(&self.id, 1, event)
}
```

**Nota**: o disparo real de subagent na produção é o tool `"task"` dentro do `execute_tool` privado do agent_loop (linha 1689): aceita `task: string` ou `tasks: [string]`; spawna 1 thread por task, cada uma com `crate::async_rt::runtime::Runtime::new()` + `AgentState::new(config)` (session_persist=false) + `run_agent_loop_with_hooks`; coleta via `mpsc::channel` com deadline de 300 s; saída `"[task i/N]: (ok|failed) msg"`. Os testes existentes exercitam isso via `execute_tool` (interno), não via `SubagentSession`.

**Teste**: `test_subagent_depth_limit` (ok em depth 2/3; Err em 3/3).

### 1.4 `agent/state.rs` (531 linhas) — `AgentState`

```rust
pub struct TodoItem { pub text: String, pub done: bool }
impl TodoItem { pub fn new(text: impl Into<String>) -> Self }

pub struct AgentState {  // TODOS os campos são pub:
    pub retries: usize, pub repair_attempt: usize, pub last_test_output: String,
    pub verification: Option<VerificationResult>, pub changed_files: BTreeSet<String>,
    pub blocked_actions: Vec<String>, pub last_diff: WorkspaceDiff,
    pub transaction: Option<WorkspaceTransaction>, pub dirty: bool, pub config: Config,
    pub session: ShortTermMemory, pub long_memory: LongTermMemory,
    pub files: FileTools, pub git: GitTools, pub mcp_clients: Vec<crate::mcp::McpClient>,
    pub session_id: Option<i64>, pub session_persist: bool,
    pub last_persisted_seq: Option<u64>, pub last_persisted_summary: Option<String>,
    pub turn_cost_usd: f64, pub todos: Vec<TodoItem>,
    pub task_spec: Option<Arc<crate::repo::spec::TaskSpec>>,
    pub locked_paths: BTreeSet<String>,
    pub embedder: crate::llm::embedder::Embedder,
    pub skills: crate::skills::SkillRegistry,
    pub background: crate::tools::background::BackgroundTaskManager,
}
impl AgentState {
    pub fn new(mut config: Config) -> crate::error::Result<Self>          // normaliza workspace, abre LongTermMemory (memory.db), carrega skills; sem rede
    pub fn start_turn(&mut self) -> crate::error::Result<()>               // zera flags do turno + WorkspaceTransaction::begin
    pub fn path_is_locked(&self, path: &str) -> bool                       // task_spec.locks_path OU locked_paths
    pub fn locked_path_error(&self, path: &str) -> Option<String>           // msg "ORACLE LOCKED"/"SPECIFICATION OWNS TESTS"
    pub fn refresh_workspace_diff(&mut self) -> crate::error::Result<WorkspaceDiff>
    pub fn keep_changes(&mut self) -> crate::error::Result<WorkspaceDiff>  // fecha transação mantendo mudanças
    pub fn rollback_changes(&mut self) -> crate::error::Result<WorkspaceDiff> // reverte p/ baseline do turno
    pub fn mark_changed(&mut self, path: impl Into<String>)                // invalida verification
    pub fn record_verification(&mut self, result: VerificationResult)
    pub fn verification_failed(&self) -> bool
    pub fn reset(&mut self)                                                 // nova sessão (session_id=None)
    pub fn record_blocked_action(&mut self, action: impl Into<String>)
    pub fn persist_session(&mut self) -> crate::error::Result<()>           // append-only no LongTermMemory
    pub fn load_session_into_state(&mut self, id: i64) -> crate::error::Result<usize>
    pub fn subagent_clone(&self) -> crate::error::Result<Self>              // filho com session_persist=false
}
```

**Construção**: `AgentState::new(Config { workspace_dir, memory_dir, ..Config::default() })`. Requer `memory_dir` gravável (cria `memory.db` via `LongTermMemory::new`). `FileTools::new_with_policy(workspace, path_allowlist, path_denylist)` e `GitTools::new(workspace)` são criados internamente.

**Testes (6)**: `creates_state_with_empty_session`, `reset_clears_session_and_retries`, `files_and_git_point_at_workspace`, `persist_and_reload_roundtrips_transcript`, `reset_starts_a_fresh_session_record`, `subagent_clone_never_persists`. **Helper**: `fn temp_config(tag: &str) -> Config` (base `temp/chronokairo-state-{tag}` com subdirs workspace/ e memory/).

### 1.5 `agent/loop.rs` (123 linhas) — `ModularAgentLoop` (loop puro tipado)

```rust
#[derive(Debug, Clone)]
pub enum ToolLoopOutcome {
    Success { final_text: String, summary: FinalizeSummary },
    NeedsInput { prompt: String },
    Interrupted,
    MaxIterationsReached,
    Failed { error: String },
}

pub struct ModularAgentLoop {          // TODOS os campos pub
    pub registry: ToolRegistry,
    pub sandbox: SandboxPolicy,
    pub verification_gate: VerificationGate,
    pub event_log: CanonicalEventLog,
    pub max_iterations: usize,          // default 25
}
impl ModularAgentLoop {
    pub fn new(workspace_dir: std::path::PathBuf) -> Self
    pub fn execute_turn(&mut self, prompt: &str, _client: &LlmRouter, state: &mut AgentState, hooks: &AgentHooks) -> Result<ToolLoopOutcome>
}
```

**O que `execute_turn` faz**: loga `EventMsg::TurnStarted` no `event_log`, envolve os hooks com um capturador de eventos (Arc<Mutex<Vec<AgentEvent>>>), chama `crate::async_rt::block_on(run_agent_loop_with_hooks(...))`, replaya os eventos capturados no `event_log` (convertidos em `EventMsg`) e deriva o `ToolLoopOutcome` terminal (Done→Success com `finalize_turn(state,false)`, Failed→Failed, Interrupted→Interrupted; sem evento terminal → `Err("agent turn produced no terminal event")`).

**Teste**: `test_modular_loop_creation` (registry tem read_file; max_iterations == 25).

### 1.6 `agent/executor.rs` (629 linhas) — execução de `PlanStep`

```rust
pub async fn execute_step(client: &LlmRouter, state: &mut AgentState, step: &PlanStep, hooks: &AgentHooks)
```

Despacha por `step.step_type`: `"create_file"` (gera via LLM + spec guard + semantic_guard + `cargo check` com até 3 tentativas), `"edit_file"`, `"read_file"`, `"search_code"`, `"run_command"` (require_approval + `shell::run_command`), `"run_tests"` (require_approval + `test::run_tests`), `"answer"` (stream LLM), `"git_commit"` (require_approval com write_tool_policy), `"git_status"`, `"done"`, `_` → warn "Unknown step type".

**Testes (5)**: `extracts_fenced_block`, `handles_block_without_language_tag`, `falls_back_without_fence`, `keeps_single_line_code`, `extract_path_requires_dot_or_slash`.

### 1.7 `agent/planner.rs` (111 linhas)

```rust
pub async fn plan_task(client: &LlmRouter, model: &str, task: &str, context: &str) -> Result<Plan>
```

Gera plano via `PlannerPrompt::system()` + parse resiliente: JSON `{steps:[...]}` → senão bloco ```sh/bash``` vira step `run_command` → senão comando de verificação explícito no task (`cargo check|cargo test|pytest|npm test`) → senão step único `"answer"`. `Plan`/`PlanStep` são de `crate::types::plan` (campos pub: `step_type`, `description`, `filename`, `pattern`, `command`; `Plan::from_json(&Value)`).

**Testes (2)**: `accepts_fenced_shell_fallback`, `preserves_explicit_verification_command`.

### 1.8 Extras do diretório `agent/`

- **`verify.rs`**: `pub enum VerificationAction { Pass, FailWithRepair { error: String, remaining_budget: usize }, Skip { reason: String }, Halt { reason: String } }`; `pub struct VerificationGate { pub max_repair_budget: usize, pub current_repair_count: usize, pub strict_mode: bool }` com `Default` (budget 3), `pub fn new(max_repair_budget: usize, strict_mode: bool)`, `pub fn evaluate(&mut self, state: &mut AgentState, command_override: Option<&str>) -> VerificationAction` (roda `test::run_tests` de verdade). Teste: `test_verification_gate_budget`.
- **`finalize.rs`**: `pub struct FinalizeSummary { pub files_changed: Vec<String>, pub verification_passed: bool, pub verification_output: Option<String>, pub turn_cost_usd: f64, pub pending_todos: Vec<String> }`; `pub fn finalize_turn(state: &mut AgentState, rollback_on_fail: bool) -> Result<FinalizeSummary>`. Teste: `test_finalize_summary_structure`.
- **`semantic_guard.rs`**: `pub struct SemanticViolation { pub target, pub unknown_member, pub available_members }`; `pub fn validate_code_symbols(code: &str, repo_map: &RepoMap, _target_file: &str) -> Result<(), String>` — rejeita métodos inventados em `store.`. Teste: `detects_unknown_method_on_store`.

## 2. `ckc::tools::*`

### 2.1 `tools/fs.rs` (932 linhas) — `FileTools`

```rust
pub fn normalize_workspace_path(path: &Path) -> PathBuf     // canonicaliza/normaliza; aceita verbatim //?/ no Windows

#[derive(Debug, Clone)]
pub struct MultiEdit { pub start_line: usize, pub end_line: usize, pub old_content: Option<String>, pub new_content: String }

#[derive(Debug, Clone)]
pub struct FileTools { /* campos privados: workspace, allowlist, denylist */ }
impl FileTools {
    pub fn new(workspace: PathBuf) -> Self                                  // sem allow/denylist
    pub fn new_with_policy(workspace: PathBuf, allowlist: Vec<String>, denylist: Vec<String>) -> Self
    pub fn workspace_root(&self) -> &Path
    pub fn parse_goto(path: &str) -> (String, Option<usize>, Option<usize>)  // "file.rs:10:5" → (path, line, col); assoc fn
    pub fn resolve(&self, path: &str) -> Option<PathBuf>                      // contenção + canonicalização; None se fora do workspace
    pub fn remove_file(&self, path: &str) -> crate::error::Result<()>
    pub fn read_file(&self, path: &str) -> Option<String>
    pub fn write_file(&self, path: &str, content: &str) -> crate::error::Result<()>      // atomic write (tmp+rename)
    pub fn append_file(&self, path: &str, content: &str) -> crate::error::Result<()>
    pub fn list_files(&self, path: &str) -> Vec<String>                      // dirs com "/" final
    pub fn read_file_with_goto(&self, path: &str) -> Option<(String, Option<usize>, Option<usize>)>
    pub fn read_file_range(&self, path: &str, start_line: usize, end_line: usize) -> crate::error::Result<String>  // 1-based; header "[lines a-b of n]"
    pub fn list_tree(&self, path: &str, max_depth: usize, max_entries: usize) -> crate::error::Result<String>
    pub fn replace_exact(&self, path: &str, old: &str, new: &str) -> crate::error::Result<()>  // exige EXATAMENTE 1 match
    pub fn edit_file(&self, path: &str, start_line: Option<usize>, end_line: Option<usize>, old_content: Option<&str>, new_content: &str) -> crate::error::Result<()>
    pub fn multi_edit_file(&self, path: &str, edits: &[MultiEdit]) -> crate::error::Result<()>  // rejeita overlaps; valida old_content
}
```

**Segurança embutida (testável)**: rejeita `../`, paths absolutos fora do workspace, symlinks que escapam, injeção tipo `"foo; rm -rf /"`; denylist por prefixo relativo (`.git`); allowlist de prefixes externos.

**Testes — 2 módulos**: `mod tests` (17: `rejects_parent_directory_paths`, `rejects_absolute_and_root_paths`, `allows_absolute_paths_within_workspace`, `rejects_symlink_escape_outside_workspace` (unix/windows), `rejects_deep_path_traversal_and_injection_strings`, `write_then_read_roundtrip`, `append_adds_to_existing_file`, `append_creates_file_when_missing`, `read_missing_file_returns_none`, `list_files_returns_files_and_dirs_within_workspace`, `verbatim_prefix_workspace_is_supported` (win), `absolute_verbatim_path_inside_workspace_resolves` (win), `denylist_blocks_workspace_relative_prefix`, `allowlist_permits_external_path`) e `mod transactional_tests` (7: `replace_exact_changes_one_match`, `replace_exact_leaves_stale_or_ambiguous_files_untouched`, `ranged_read_and_tree_are_bounded`, `edit_file_replaces_line_range_surgically`, `multi_edit_file_applies_non_overlapping_edits`, `multi_edit_file_rejects_overlapping_edits`, `multi_edit_file_validates_old_content`).

**Helpers**: `fn temp_workspace() -> PathBuf` (contador `AtomicU32`, prefixo `chronokairo-file-tools-test-{pid}-{n}`) e `fn workspace(name: &str) -> PathBuf` (`chronokairo-fs-transaction-{name}-{pid}`).

### 2.2 `tools/find_replace.rs` (119 linhas) — funções puras

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FindOptions { pub match_case: bool, pub whole_word: bool, pub regex: bool }   // Default: match_case=true
#[derive(Debug, Clone)]
pub struct Match { pub line: usize, pub col: usize, pub text: String }                   // 1-based
pub fn find_all(text: &str, pattern: &str, opts: FindOptions) -> Vec<Match>
pub fn replace_all(text: &str, pattern: &str, replacement: &str, opts: FindOptions) -> (String, usize)
```

"Regex" é minimalista (`.`/`*`/`+`/`?`/`\d`/`\w`; fallback literal se tem `(`/`[`/`|`). Sem IO — ideal para testes puros.

**Testes (4)**: `case_insensitive`, `whole_word`, `replace_counts`, `regex_fallback`.

### 2.3 `tools/shell.rs` (540 linhas) — runner de comandos

```rust
pub struct CommandOutput { pub code: Option<i32>, pub stdout: String, pub stderr: String, pub timed_out: bool }
impl CommandOutput { pub fn combined(&self) -> String }   // stdout + "STDERR:\n..." + "exit code: N" se !=0; "(no output)" se vazio

pub fn escapes_workspace(cmd: &str, config: &Config) -> bool     // gate de contenção p/ executáveis mutantes com path absoluto fora do workspace/allowlist
pub fn is_allowed(cmd: &str, config: &Config) -> bool             // blocked_commands (exe ou substring) → false; allowed_commands vazio/"*" → tudo não-bloqueado; senão allowlist de executável
pub fn run_command(cmd: &str, config: &Config) -> String         // String combinada; recusa NÃO executa o processo
pub fn run_command_raw(cmd: &str, config: &Config) -> CommandOutput
pub fn run_command_raw_with_interrupt(cmd: &str, config: &Config, interrupt: Option<&AtomicBool>) -> CommandOutput
```

**Ordem dos gates** em `run_command*`: 1) `exec_policy::command_is_forbidden` (policy persistente) → 2) `escapes_workspace` → 3) `is_allowed` → 4) executa `sh -c cmd` (unix) / `cmd.exe /C` (windows) com `current_dir(workspace_dir)`, process group, timeout `config.command_timeout_secs`, kill do grupo em timeout/interrupt.

**Testes (12)**: `blocks_dangerous_commands`, `allows_listed_commands`, `empty_command_is_never_allowed`, `run_command_refuses_disallowed_command_without_executing`, `combined_joins_stdout_stderr_and_exit_code`, `combined_falls_back_to_no_output_label`, `runs_allowlisted_program_directly` (unix), `terminates_a_command_after_timeout` (unix), `mutation_command_with_absolute_escape_is_rejected`, `mutation_command_inside_workspace_is_allowed`, `disable_block_workspace_escape_lets_mutation_run`, `path_allowlist_permits_external_mutation_target`.

**Helper**: `fn test_config() -> Config` — `Config { workspace_dir: std::env::temp_dir(), ..Config::default() }`.

### 2.4 `tools/exec_policy.rs` (188 linhas) — regras persistentes de comando

```rust
pub enum Decision { Allow, Prompt, Forbidden }               // Clone, Copy, Eq, Ord (Allow < Prompt < Forbidden)
pub struct ExecRule { pub command: String, pub decision: Decision, pub scope: Option<String>, pub justification: Option<String> }  // serde camelCase
pub struct ExecPolicy { pub rules: Vec<ExecRule> }            // Default vazio; serde
impl ExecPolicy {
    pub fn load(path: &Path) -> Result<Self, String>         // parser caseiro de TOML [[rules]]; arquivo inexistente → default
    pub fn save(&self, path: &Path) -> Result<(), String>
    pub fn check(&self, command: &[String], workspace: Option<&Path>) -> (Decision, Option<&ExecRule>)
}
pub fn default_path() -> PathBuf                             // ~/.chronokairo/exec_policy.toml (crate::config::home_dir)
pub fn load_default() -> ExecPolicy
pub fn command_is_forbidden(command: &str, workspace: &Path) -> bool
```

**Como `check` decide**: junta tokens; casa regra se pattern `== "*"` / `== full` / `== primeiro-token` / termina com `" *"` (prefixo) / começa com `"* "` (sufixo). Scope `workspace:<prefix>` filtra por `workspace.starts_with`. Entre regras empatadas, **a mais restritiva vence**. Sem match → `(Decision::Prompt, None)`. `command_is_forbidden` faz tokenização whitespace + `load_default` (lê o arquivo do HOME do usuário — estado global em testes!).

**Testes (2)**: `most_restrictive_matching_rule_wins`, `test_save_and_load_roundtrip` (helper: temp dir `chronokairo_exec_policy_{pid}`).

### 2.5 `tools/sandbox.rs` (316 linhas) — política de sandbox

```rust
pub enum SandboxViolation { PathTraversal(String), OutOfWorkspace(String), PathDenied(String), CommandDenied(String), NetworkDenied(String) }
// Debug, Clone, PartialEq, Eq; impl Display; impl std::error::Error

pub struct SandboxPolicy {   // TODOS pub:
    pub workspace_root: PathBuf, pub allow_read_outside: bool, pub allow_write_outside: bool,
    pub allow_network: bool, pub allowed_read_paths: Vec<PathBuf>, pub allowed_write_paths: Vec<PathBuf>,
    pub denied_patterns: Vec<String>, pub allowed_commands: Vec<String>, pub denied_commands: Vec<String>,
    pub scrub_env_vars: bool, pub insecure_mode: bool,
}
impl Default for SandboxPolicy     // root = cwd; denied_patterns: [".git", ".ssh", ".aws", ".env", "id_rsa", "id_ed25519"]; denied_commands: ["rm -rf /", "mkfs", ":(){ :|:& };:"]; allow_network=true; scrub_env_vars=true
impl SandboxPolicy {
    pub fn new(workspace_root: PathBuf) -> Self
    pub fn with_insecure_mode(mut self, insecure: bool) -> Self    // builder
    pub fn check_read_path(&self, rel_or_abs: impl AsRef<Path>) -> Result<PathBuf, SandboxViolation>
    pub fn check_write_path(&self, rel_or_abs: impl AsRef<Path>) -> Result<PathBuf, SandboxViolation>
    pub fn check_command(&self, command: &str) -> Result<(), SandboxViolation>
    pub fn check_network(&self, url: &str) -> Result<(), SandboxViolation>
    pub fn clean_env_vars(&self) -> Vec<(String, String)>            // remove *_KEY/*_SECRET/*_TOKEN/AWS_*/tokens conhecidos
}
```

**Importante**: `SandboxPolicy` é declarativa — os checks são chamados explicitamente (usada por `ModularAgentLoop`; o `shell.rs` NÃO usa SandboxPolicy, usa os próprios gates + Config). Há também o diretório físico `src-tauri/core/sandbox/` (fora do módulo `tools`).

**Testes (3)**: `test_sandbox_path_traversal`, `test_sandbox_denied_patterns`, `test_sandbox_command_filter` (helpers: temp dirs `chronokairo_sb_test`).

### 2.6 `tools/patch.rs` (386 linhas) — apply/preview de unified diff

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PatchResult { pub file_path: String, pub lines_added: usize, pub lines_removed: usize, pub original_sha256: Option<String>, pub new_sha256: String }

pub fn affected_paths(patch_str: &str) -> Result<Vec<String>>                       // paths alvo sem tocar disco
pub fn preview_patch(workspace_root: &Path, patch_str: &str) -> Result<Vec<PatchResult>>   // dry-run (write=false)
pub fn apply_patch(workspace_root: &Path, patch_str: &str) -> Result<Vec<PatchResult>>      // escreve arquivos
pub fn create_patch(old_text: &str, new_text: &str) -> String                       // diff unificado via LCS puro
```

Parser próprio de unified diff (`--- a/x` / `+++ b/x` / `@@ -a,b +c,d @@`; suporta `/dev/null` p/ criação/deleção); recusa path que escapa do root canônico. **Não há revert neste arquivo** — o rollback transacional é `WorkspaceTransaction::rollback` (via `AgentState::rollback_changes`).

**Teste (1)**: `test_apply_patch_simple` (temp dir `chronokairo_patch_test_1`).

### 2.7 `tools/git.rs` (202 linhas) — wrapper de git CLI

```rust
pub struct GitTools { repo: String }   // campo privado
impl GitTools {
    pub fn new(repo: String) -> Self
    pub fn is_git_repo(&self) -> bool
    pub fn init(&self) -> String
    pub fn add(&self, path: &str) -> String
    pub fn branch(&self, name: &str) -> String          // checkout -b
    pub fn commit(&self, msg: &str) -> String
    pub fn diff(&self, target: &str) -> String
    pub fn restore(&self, path: &str) -> String
    pub fn status(&self) -> String
    pub fn log(&self, count: usize) -> String           // --oneline -N
    pub fn stash(&self, msg: &str) -> String            // stash push -m se msg
    pub fn stash_pop(&self) -> String
    pub fn checkout_branch(&self, name: &str) -> String
    pub fn list_branches(&self) -> String               // branch -a
}
```

Todos retornam `String` (stdout ou stderr; `"Git error: {e}"` em falha de spawn). Roda `git` real com `current_dir(repo)` — precisa de git no PATH.

**Testes (6)**: `plain_directory_is_not_a_git_repo`, `init_makes_directory_a_git_repo`, `commit_appears_in_log`, `branch_switches_to_new_branch`, `diff_shows_working_tree_changes`, `stash_and_pop_restores_working_tree`. **Helper**: `fn temp_repo_dir(name: &str) -> String` (`chronokairo-git-tools-{name}-{pid}`); os testes configuram `git config user.name/email` inline.

### 2.8 `tools/background.rs` (480 linhas) — tarefas detached

```rust
pub enum TaskStatus { Running, Done { exit_code: Option<i32>, timed_out: bool } }   // PartialEq, Display
#[derive(Debug, Clone)]
pub struct BackgroundTaskManager { /* inner: Arc<Mutex<BTreeMap<...>>> */ }
impl BackgroundTaskManager {
    pub fn new() -> Self                                            // + Default
    pub fn spawn(&self, command: &str, config: &Config) -> Result<String, String>  // id "bg{N}"; aplica gates do shell
    pub fn status(&self, id: &str) -> Option<(TaskStatus, String, Duration)>      // output ao vivo
    pub fn list(&self) -> Vec<(String, String, String)>                            // (id, comando, status-string)
    pub fn kill(&self, id: &str) -> bool                                          // true se matou
    #[cfg(test)] pub fn wait_for_done(&self, id: &str, deadline: Duration) -> Option<(TaskStatus, String, Duration)>
}
```

3 threads por task (drain stdout/stderr + monitor com deadline = `config.command_timeout_secs`). `spawn` reaplica `shell::escapes_workspace` e `shell::is_allowed` antes de spawnar.

**Testes (5)**: `spawn_status_and_list`, `output_visible_while_running`, `kill_terminates_running_task`, `timeout_kills_long_running_task`, `rejected_command_returns_error_not_task`.

### 2.9 `tools/picker.rs` (62 linhas) — fuzzy file picker

```rust
#[derive(Debug, Clone)]
pub struct PickerMatch { pub path: String, pub score: i32 }
pub fn pick(query: &str, files: &[String], limit: usize) -> Vec<PickerMatch>      // prefix=1000-len, substring=500-len, subsequence ±10/-1
pub fn autocomplete_prefix(prefix: &str, files: &[String]) -> Vec<String>         // starts_with, max 20
```

**Testes (2)**: `prefix_first`, `autocomplete`.

### 2.10 `tools/web.rs` (291 linhas) — fetch/search

```rust
pub fn http_fetch(url: &str, max_bytes: usize, timeout_secs: u64) -> crate::error::Result<String>   // http/https only; HTML→texto; truncagem char-boundary
pub fn web_search(query: &str, max_results: usize, timeout_secs: u64) -> crate::error::Result<String>  // SearXNG (env WEB_SEARCH_URL) senão DuckDuckGo HTML; max_results clamp 1..20
```

Usa `crate::http::blocking::Client` — rede real; testes live são `#[ignore = "live network"]`.

**Testes (3 + 2 ignored)**: `strip_html_removes_tags`, `truncate_keeps_utf8_boundaries`, `ddg_parser_extracts_results`; `http_fetch_live_strips_html`, `web_search_live_returns_results`.

### 2.11 Apoio em `tools/`

- **`tools/test.rs`** (módulo de verificação usado em produção):
```rust
pub enum VerificationStatus { Passed, Failed, Unavailable }
pub struct VerificationResult { pub status: VerificationStatus, pub command: Option<String>, pub exit_code: Option<i32>, pub timed_out: bool, pub output: String }
impl VerificationResult { pub fn passed(&self) -> bool; pub fn failed(&self) -> bool; pub fn unavailable(message: impl Into<String>) -> Self }
pub fn run_tests(request: &str, config: &Config) -> VerificationResult            // detecta Cargo/pytest/npm; Unavailable sem manifest
pub fn run_verification_command(command: &str, config: &Config) -> VerificationResult
pub fn run_lint(config: &Config) -> Option<VerificationResult>                    // cargo clippy; None sem Cargo.toml
pub struct CompilerDiagnostic { pub file: Option<String>, pub line: Option<usize>, pub column: Option<usize>, pub code: Option<String>, pub message: String, pub hints: Vec<String> }
pub fn extract_diagnostics(output: &str) -> Vec<CompilerDiagnostic>
pub fn format_scoped_repair_prompt(diagnostics: &[CompilerDiagnostic], target_file: Option<&str>, raw_fallback: &str) -> String
```
- **`tools/transaction.rs`** — reversão real (usada por `AgentState`):
```rust
pub struct WorkspaceDiff { /* ... */ }
impl WorkspaceDiff { pub fn is_empty(&self) -> bool; pub fn paths(&self) -> Vec<String>; pub fn summary(&self) -> String; pub fn checksum(&self) -> String }
pub struct WorkspaceTransaction { /* ... */ }
impl WorkspaceTransaction {
    pub fn begin(root: PathBuf, max_bytes: usize) -> crate::error::Result<Self>   // snapshot pós-.gitignore
    pub fn diff(&self) -> crate::error::Result<WorkspaceDiff>
    pub fn baseline_content(&self, path: &str) -> Option<Vec<u8>>
    pub fn baseline_digest(&self, path: &str) -> Option<String>
    pub fn fingerprint(&self) -> String
    pub fn diff_for_file(&self, path: &str) -> crate::error::Result<Option<String>>
    pub fn rollback(&self) -> crate::error::Result<WorkspaceDiff>               // restaura baseline do turno
}
```

## 3. `ckc::repo::*`

### 3.1 `repo/chrono_context.rs` (408 linhas) — leitura de AGENTS.md

```rust
pub struct Frontmatter { pub title: Option<String>, pub created: Option<String>, pub updated: Option<String>, pub doc_type: Option<String>, pub status: Option<String>, pub tags: Vec<String>, pub extra: HashMap<String, String> }
impl Frontmatter { pub fn parse(content: &str) -> (Option<Frontmatter>, &str) }

pub struct ChronoDoc { pub rel_path: String, pub frontmatter: Option<Frontmatter>, pub wikilinks: Vec<String>, pub callouts: Vec<String>, pub system_guidelines: Option<String>, pub body_summary: String }
impl ChronoDoc {
    pub fn from_file(workspace: &Path, file_path: &Path) -> Option<Self>
    pub fn extract_wikilinks(text: &str) -> Vec<String>                    // [[target|alias]]
    pub fn extract_callouts(text: &str) -> Vec<String>                      // > [!IMPORTANT] etc.
    pub fn extract_guidelines(text: &str) -> Option<String>                // seção "## Diretrizes para Agentes"/"## System Guidelines"
}

pub struct ChronoContextEngine;
impl ChronoContextEngine {
    pub fn build_context_pack(workspace: &Path, task: Option<&str>, char_budget: usize) -> String
}
```

**Como o AGENTS.md é lido**: `build_context_pack` prioriza `workspace/AGENTS.md` — extrai Frontmatter, callouts, seção guidelines (ou body). Se `task` é passado, escaneia recursivamente `.md` (depth 4, pulando dotdirs/target/node_modules) e inclui até 3 docs cujo filename casa com keywords ≥ 4 chars. Trunca no `char_budget` com `is_char_boundary`.

**Wiring real**: `crate::llm::prompt::CoderPrompt::load_project_context(workspace)` chama `build_context_pack(workspace, None, 12000)` quando `AGENTS.md` existe (senão CLAUDE.md/.cursorrules/CONTEXT.md) + `RepoMap::build` + `RepoMapGenerator::generate_map`.

**Testes (3)**: `test_frontmatter_parser_std`, `test_wikilinks_extraction`, `test_callouts_extraction`.

### 3.2 `repo/context.rs` (409 linhas) — `RepoMap`

```rust
pub enum SymbolKind { Module, Struct, Field, Enum, Trait, Function, Method, ReExport, Import, Test }
pub struct Symbol { pub name: String, pub kind: SymbolKind, pub signature: Option<String>, pub line_number: usize }
pub struct FileInfo { pub path: PathBuf, pub rel_path: String, pub modules: Vec<String>, pub imports: Vec<String>, pub exports: Vec<String>, pub symbols: Vec<Symbol> }
pub struct RepoMap { pub crate_name: Option<String>, pub files: Vec<FileInfo> }
impl RepoMap {
    pub fn build(workspace: &Path) -> Self                    // só .rs; depth 5; pula .git/target/node_modules
    pub fn to_prompt_string(&self) -> String
}
```

**Teste (1)**: `parses_multi_module_rust_repo`.

### 3.3 `repo/scanner.rs` (329 linhas) — índice de símbolos

```rust
pub struct SymbolEntry { pub file_path: String, pub symbol_type: &'static str, pub name: String, pub line_number: usize }
pub struct SymbolIndex { /* entries privado */ }
impl SymbolIndex {
    pub fn build(workspace: &Path) -> Self
    pub fn search(&self, query: &str, limit: usize) -> Vec<&SymbolEntry>      // substring case-insensitive, exact primeiro
    pub fn search_type(&self, symbol_type: &str, limit: usize) -> Vec<&SymbolEntry>
    pub fn all(&self) -> &[SymbolEntry]
}
pub struct RepoMapGenerator;
impl RepoMapGenerator { pub fn generate_map(workspace: &Path, max_bytes: usize) -> String }
```

**Testes (2)**: `generates_repo_map_for_rust_project`, `symbol_index_searches_by_name_and_type`.

### 3.4 Extras de `repo/`

- **`repo/spec.rs`**: `pub struct TaskSpec` com `pub fn from_task(&str)`, `pub fn check_patch(&self, code, file) -> Result<(), String>`, `pub fn to_prompt_string(&str)`, `pub fn oracle_repair_directive(&str)`, `pub fn locks_path(&str) -> bool` (+ `compile_task_spec` async).
- **`repo/contract.rs`**: `pub struct TaskContract` com `pub fn extract(task: &str) -> Self` e `pub fn to_prompt_string(&str)`; `ParamSpec`, `RequiredMethod`.

## Fluxos prioritários — receitas de teste

1. **Executar tool via `ToolRegistry`**: `ToolRegistry::new()` → `ToolContext { state: &mut AgentState, hooks: &AgentHooks, client: &LlmRouter dummy }` → `registry.execute("write_file", &mut ctx, &args)`. Nenhuma tool nativa usa `client`.
2. **`AgentHooks`**: `AgentHooks::default()` + `on_event` (sink `Arc<Mutex<Vec<AgentEvent>>>`), `on_approval`, `interrupt: Arc<AtomicBool>`. `require_approval` é o ponto de teste de autorização.
3. **`exec_policy`**: `ExecPolicy.save/load/check` explícito (evitar `command_is_forbidden` que lê HOME global).
4. **`sandbox`**: `SandboxPolicy::new(tmp_root)` + checks de path/comando/rede.
5. **`patch` + rollback**: `create_patch` → `apply_patch`; reverter via `WorkspaceTransaction::begin/rollback` ou `state.start_turn()/state.rollback_changes()`.
6. **Subagent**: (a) API estruturada `SubagentSession`; (b) tool `"task"` (fan-out real, exige LLM).

## Helpers de teste existentes

| Onde | Helper | O que faz |
|---|---|---|
| `agent/agent_loop.rs` | `test_state`, `dummy_router`, `recording_hooks`, `tool_call`, `fake_mcp_client` | state+workspace temp; router ollama não-conectado; captura de eventos; ToolCall sintético; servidor MCP fake via re-spawn do binário de teste |
| `agent/state.rs` | `temp_config(tag)` | Config com workspace/memory em temp |
| `tools/fs.rs` | `temp_workspace()`, `workspace(name)` | tmp dirs com contador/pid |
| `tools/shell.rs` | `test_config()` | Config com workspace = temp_dir |
| `tools/git.rs` | `temp_repo_dir(name)` | tmp dir para repo git |
| `tools/transaction.rs` | `workspace(name)` | tmp dir |
| Padrão geral | inline `std::env::temp_dir().join("chronokairo-...-{pid}")` | tmp dirs ad-hoc |

## Armadilhas para testes de integração

1. `AgentState::new` **escreve em disco** (`memory.db`, skills, normalização do workspace) — sempre use tmp dirs dedicados.
2. `Config::default()` lê **variáveis de ambiente** (`SPEC_LOCK`, `COMMAND_TOOL_POLICY`, `BLOCK_WORKSPACE_ESCAPE`, ...) — fixe explicitamente os campos sensíveis.
3. Funções async: use `ckc::async_rt::block_on` (fachada própria do crate).
4. `SearchCodeTool`/executor dependem do binário `rg`; `GitTools`/`run_tests` dependem de `git`/`cargo` no PATH.
5. `shell::run_command` respeita `~/.chronokairo/exec_policy.toml` global — prefira `ExecPolicy` explícito em testes.
6. O `sha256` de `PatchResult` é DefaultHasher (não é SHA criptográfico).
