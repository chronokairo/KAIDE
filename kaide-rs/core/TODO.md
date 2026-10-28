# TODO — Chronokairo Coder (August 2026)

## TUI parity backlog — Codex / Claude Code

Este bloco registra os gaps levantados na comparação do TUI. Itens marcados
como concluídos possuem testes no código; os demais continuam deliberadamente
abertos para não confundir aproximação visual com paridade funcional.

### ~~UX1. Composer multiline~~ ✅ DONE
- `Shift+Enter` insere nova linha; `Enter` envia o turno.
- Cursor e renderização respeitam linhas e caracteres Unicode.
- Testes: `src/ui/composer.rs` (`unicode_editing_keeps_character_cursor`).

### ~~UX2. Busca de histórico no composer~~ ✅ DONE
- `Ctrl+R` no foco de input carrega a entrada mais recente que contém a busca.
- `Ctrl+R` fora do input mantém o atalho de expandir/recolher o transcript.
- Testes: `src/ui/composer.rs` (`history_search_selects_latest_matching_prompt`).

### ~~UX3. Paste grande e bracketed paste~~ ✅ DONE
- Parser std-first de frames bracketed-paste e evento `Paste` foram adicionados.
- O TUI limita o payload a 20.000 caracteres e aplica a colagem como uma edição.
- O leitor incremental preserva frames divididos entre leituras e mantém teclas
  normais na fila; testes cobrem frame dividido, Unicode, multiline e teclas.

### ~~UX4. Menções `@` e `$`~~ ✅ DONE
- Autocomplete de arquivos (`@`) e referências de contexto (`$`) implementado
  no mesmo popup modal de `/`, com seleção por setas/Enter/Tab.
- O índice `$` agora inclui `AGENTS.md`, `CLAUDE.md`, `.cursorrules`,
  `CONTEXT.md` e skills descobertas no workspace/usuário.
- Teste: `src/ui/mod.rs` (`reference_picker_filters_files_and_context`).
- A substituição altera somente o token ativo e preserva prefixo, sufixo e
  cursor Unicode-safe; skills também são indexadas no picker.
- Testes: `reference_picker_filters_files_and_context` e
  `reference_replacement_preserves_surrounding_prompt_text`.

### ~~UX5. Fila explícita durante execução~~ ✅ DONE
- O CKI já aceita tarefas pendentes por `task_tx` e mostra a contagem no
  status. `Tab` no input durante execução envia/enfileira o prompt sem
  alternar Agent/Plan.

### ~~UX6. IDs de thread/turn/item no protocolo~~ ✅ DONE
- `TurnContext` agora emite `thread_id`/`turn_id`; `ToolCall` e `ToolResult`
  propagam o `item_id` do modelo e approvals continuam correlacionados por ID.
- Deltas de tool call recebem ID determinístico `call_<index>` e o callback de
  streaming Cloud/Ollama propaga o índice, nome e argumentos ao protocolo.
- Testes: `src/llm/client.rs` (`stream_chat_meta_parses_sse_tool_call_deltas`) e
  `src/protocol/mod.rs` (`tool_delta_round_trips_item_id`).

### ~~UX7. Approval granular por ferramenta e escopo~~ ✅ DONE
- Implementados allow once, allow session, deny e memória por sessão. A
  memória agora é escopada por ferramenta e resumo da ação, evitando que uma
  aprovação de comando autorize outro comando.
- O TUI exibe os escopos ativos em `/permissions` e revoga todos com
  `/permissions clear`, usando o mesmo broker compartilhado pelo worker.
- Escopos são persistidos por workspace em `.chronokairo/approval-scopes`,
  recarregados no início da sessão e removidos por `/permissions clear`.
- Testes: `permissions_clear_revokes_shared_session_scopes` e
  `approval_scopes_persist_per_workspace_and_reload`.

### ~~UX8. Terminal como item de execução colapsável~~ ✅ DONE
- O terminal web/PTY e a saída de comandos já existem e são fullscreen-safe.
- Cada execução agora gera `ToolResult`/item `Terminal` com ID, status,
  exit code, timeout, duração e saída limitada por contexto.
- Ctrl+O/Ctrl+E/Ctrl+R alternam a visibilidade dos itens, incluindo terminal.
- Teste: `src/ui/mod.rs` (`flatten_messages_collapses_terminal_output_and_expands_it`).

### ~~UX9. Composer dinâmico e popups empilhados~~ ✅ DONE
- Bottom pane, stack de views, slash picker e approval overlay já existem.
- A altura dinâmica do composer conforme multiline já está implementada.
- Todas as operações do composer (edição, cursor, histórico e submit) passam
  por `route_composer_edit_key`, com prioridade explícita de overlays e foco;
  Tab continua reservado ao alternador Agent/Plan durante ocioso.
- Teste: `composer_key_router_handles_editing_only_in_input_focus`.

### ~~UX10. Testes de paridade visual/interativa~~ ✅ DONE
- Testes de buffer cobrem renderização do terminal/composer, reflow e resize;
  slash picker e approval; testes de interação cobrem picker de referências,
  histórico e paste.
- Os cenários de popup e estados loading/queued/completed estão cobertos por
  `draw_snapshot_contains_slash_picker` e `draw_snapshot_contains_approval_prompt`.
- O teste `draw_snapshot_covers_loading_queued_and_completed_states` valida o
  status e a composição da tela nos três estados.

## P0 — Safety and Reliability (CRITICAL)

### ~~1. Command Injection via Prefix-Based Allowlist~~ ✅ FIXED
- **File:** `src/tools/shell.rs`
- **Fix applied:** `parse_command()` rejects all shell metacharacters (`;`, `&`, `|`, `` ` ``, `$`, `(`, `)`, `{`, `}`, `<`, `>`, `\n`, `\\`) before execution. `is_allowed()` validates the parsed executable against the allowlist, not a prefix match. `run_command_raw` also validates through `is_allowed()`.

### ~~2. No Timeout or Process-Group Kill on `run_command`~~ ✅ FIXED
- **File:** `src/tools/shell.rs`
- **Fix applied:** `run_command_inner` uses `child.try_wait()` polling with configurable `command_timeout_secs` (default 600s). On timeout, kills the process group (Unix) or child process (Windows). Pipe readers run on separate threads to prevent deadlock.

### ~~3. `run_command_raw` Bypasses the Allowlist Entirely~~ ✅ FIXED
- **File:** `src/tools/shell.rs`
- **Fix applied:** `run_command_raw` now validates through `is_allowed()` first and returns an error `CommandOutput` if rejected.

### ~~4. `unsafe` `transmute` on Untrusted GGUF Data~~ ✅ FIXED
- **File:** `src/llm/infer/gguf.rs`
- **Fix applied:** Replaced `unsafe transmute` with `TryFrom<i32>` for `GgmlType` (ADR 0007).

### ~~5. GGUF Parsing Panics on Truncated/Corrupt Files~~ ✅ FIXED
- **File:** `src/llm/infer/gguf.rs`
- **Fix applied:** All binary read methods use bounds-checked `read_bytes` with explicit EOF error propagation (ADR 0007).

### ~~6. Q4_0/Q8_0 Dequantization Panics on Corrupt Data~~ ✅ FIXED
- **File:** `src/llm/infer/model.rs`
- **Fix applied:** Added bounds checks to `dequantize_q4_0_row`, `dequantize_q8_0_row`, and `dequantize_f16_row` (ADR 0007).

### ~~7. `tensor_data` Can Read Beyond Buffer~~ ✅ FIXED
- **File:** `src/llm/infer/gguf.rs`
- **Fix applied:** Added `checked_add` and bounds check on slice boundaries in `tensor_data` (ADR 0007).

### ~~8. TOCTOU Race in `FileTools::resolve`~~ ✅ FIXED
- **File:** `src/tools/fs.rs`
- **Lines:** 126–155
- **Issue:** Between the `canonicalize()` check and the actual `fs::read_to_string`/`fs::write` call, an attacker with concurrent access could replace a file with a symlink.
- **Fix:** Re-validate the path after canonicalization, or use `O_NOFOLLOW` where available.

## P0 — Harness Gaps (from gap analysis vs. Claude Code / Codex / Antigravity)

> See full report: `docs/gap-analysis-2026-08.md`

### ~~G1. Line-Range Code Editing (edit_file / multi_edit_file)~~ ✅ DONE
- **Gap:** `replace_exact` exige match exato de string e não suporta edições multi-site. Todos os líderes (Claude Code, Antigravity, Cursor) usam edição por line-range.
- **Impact:** Crítico para SWE-bench — modelos erram whitespace/indentation frequentemente, causando falha de match.
- **Files:** `src/tools/fs.rs`, `src/agent/agent_loop.rs`
- **Fix:** Implementado `edit_file(path, start_line, end_line, old_content, new_content)` com line-range anchoring e validação de conteúdo. Implementado `multi_edit_file(path, edits[])` para edições não-contíguas no mesmo arquivo, aplicadas em ordem descendente de linha. Ambos registrados em `coding_tools()` e dispatch em `execute_tool()` com gate de aprovação `ToolEffect::Mutation`. `replace_exact` mantido como fallback.
- **Ref:** Antigravity `replace_file_content` / `multi_replace_file_content`; Claude Code `Edit` tool.
- **ADR:** 0006

### ~~G2. Approval Broker Not Wired (security gap)~~ ✅ FIXED
- **Gap:** Os tipos `ApprovalRequest`, `ApprovalDecision` e `AgentHooks.on_approval` existem em `src/agent/agent_loop.rs:50-71`, mas `execute_tool_call()` nunca chama `on_approval()`. Writes e commands executam sem gate, mesmo com `write_tool_policy: Ask`.
- **Impact:** Segurança — o modelo pode escrever/executar qualquer coisa sem aprovação.
- **Files:** `src/agent/agent_loop.rs`, `src/agent/executor.rs`
- **Fix:** No dispatch de tools mutadores/commands, verificar a policy (`write_tool_policy`/`command_tool_policy`) e chamar `hooks.on_approval()` antes de executar. Se `Deny` ou sem callback, retornar erro. Todos os mutation tools (write_file, replace_exact, edit_file, multi_edit_file) e command tools (run_command, run_tests) passam pelo gate. O TUI (`src/ui.rs`) implementa o fluxo interativo de aprovação via canal mpsc.

### ~~G3. Context Compaction / Conversation Summarization~~ ✅ DONE
- **Gap:** O histórico de conversa cresce indefinidamente. Quando excede o contexto do modelo, o loop falha. Nenhuma sumarização ou compactação de mensagens antigas.
- **Impact:** Tarefas longas (multi-step refactoring) falham por context overflow.
- **Files:** `src/agent/loop.rs`, `src/compressor/`
- **Fix:** Quando `estimated_tokens > 0.8 * max_context_tokens`, sumarizar mensagens antigas (exceto as últimas N) usando o modelo summarizer. Implementado em `maybe_compact()` em `src/agent/agent_loop.rs:226` com threshold de 80% do contexto. `Session::compact()` em `src/memory/short_term.rs` injeta o resumo. Disparado no início de cada turno.
- **Ref:** ADR 0009

### ~~G4. Token Counting~~ ✅ DONE
- **Gap:** Não há contagem de tokens. Não sabe quanto contexto resta por turno.
- **Impact:** Pré-requisito para G3 (compaction) e G6 (cost tracking).
- **Files:** `src/llm/client.rs`, `src/agent/loop.rs`
- **Fix:** Adicionar estimativa de tokens usando subword length division, punctuation weighting, e multibyte UTF-8 handling em `src/memory/short_term.rs`. Rastrear tokens in/out em cada chamada LLM. Expor `estimated_tokens()` e `remaining_context()` para o agent loop. Usado por `maybe_compact()` para decidir quando sumarizar.
- **Ref:** ADR 0009

## P1 — Error Handling & Robustness

### ~~9. `unwrap()` in Production Paths~~ ✅ FIXED
- **Files:** `src/main.rs:401`, `src/agent/state.rs:61,74,83`, `src/llm/router.rs` (Mutex locks)
- **Issue:** `unwrap()` calls that can panic in production.
- **Fix:** Replace with proper error handling or `expect()` with descriptive messages.
- **Note:** Several `unwrap()` sites in `src/llm/client.rs` have been addressed by the retry+backoff refactor. Mutex lock unwraps in the router are considered acceptable (poisoned mutex = unrecoverable).

### ~~10. `partial_cmp().unwrap()` on Costs (NaN Panic)~~ ✅ FIXED
- **File:** `src/models_dev/client.rs`
- **Lines:** 81, 100, 149
- **Issue:** Will panic if any cost is NaN.
- **Fix:** Use `.unwrap_or(Equal)`.
- **Note:** `bench/model_bench.rs`, `hw_recommend/recommender.rs`, `llm/infer/engine.rs:325` already use `.unwrap_or(Equal)`. One remaining bare `.unwrap()` at `engine.rs:333`.

### ~~11. `partial_cmp().unwrap()` in Top-K Sampling~~ ✅ FIXED
- **File:** `src/llm/infer/engine.rs`
- **Line:** 333
- **Issue:** Will panic on NaN logits in `select_nth_unstable_by`.
- **Fix:** Use `.unwrap_or(Equal)`.

### ~~12. `unwrap_or_default` Silently Swallows HTTP Read Errors~~ ✅ FIXED
- **File:** `src/llm/client.rs`
- **Lines:** 570, 711, 808, 868 (and others)
- **Issue:** `resp.text().await.unwrap_or_default()` silently discards errors in non-retry paths.
- **Fix:** Propagate errors properly or log them.
- **Note:** The retry paths (429/5xx) now log and retry correctly. The `unwrap_or_default` on response body reading is a separate concern for non-retried paths.

## P1 — Harness Gaps (competitive parity)

### ~~G5. Sub-Agent Support (Task tool)~~ ✅ DONE
- **Gap:** O Chronokairo tem apenas um loop sequencial. Claude Code, Antigravity e Cursor suportam sub-agentes para delegação de tarefas e pesquisa paralela.
- **Impact:** Tarefas complexas (multi-arquivo, refatoração) são lentas e gastam mais tokens.
- **Files:** `src/agent/agent_loop.rs`, `src/agent/state.rs`
- **Fix:** Implementado tool `task` que spawna um sub-agente em thread separada com `tokio::runtime::Runtime::new()`. O sub-agente usa `AgentState::clone()` (com `Clone` manual resetando retries/transaction/dirty), roda `run_agent_loop_with_hooks` em modo `Agent`, e retorna o resultado via `mpsc::channel` com timeout de 300s. `execute_tool` e `execute_tool_calls` atualizados para receber `&LlmRouter`. Registrado em `coding_tools()` com parâmetros `task` (required) e `model` (optional).
- **Ref:** ADR 0011

### ~~G6. Cost Tracking Per Turn~~ ✅ DONE
- **Gap:** Não sabe quanto gastou em tokens/dinheiro por turno ou sessão. Claude Code e Aider mostram isso.
- **Impact:** Ops — sem visibilidade de custos; impossível otimizar.
- **Files:** `src/llm/router.rs`, `src/agent/state.rs`, `src/agent/agent_loop.rs`
- **Fix:** `LlmRouter::estimate_cost` precifica tokens em US$ pelo catálogo models.dev (base id do provider ativo). Acumulado em `AgentState.turn_cost_usd`, resetado por turno; mostrado na nota `[usage]` (com `($X.XXXX)`) e no resumo final (`Estimated cost: $X.XXXX`). Modelo local/fora do catálogo → US$ 0.

### ~~G7. MCP Client (Model Context Protocol)~~ ✅ DONE
- **Gap:** Não conecta a tool servers MCP externos. Todos os líderes (Claude Code, Antigravity, Cursor, Codex) suportam MCP.
- **Impact:** Extensibilidade — não pode usar tools de terceiros (GitHub, DB, Jira, etc.).
- **Files:** `src/mcp/mod.rs`, `src/agent/agent_loop.rs`, `src/config/settings.rs`, `src/agent/state.rs`
- **Fix:** Implementado MCP client com stdio transport em `src/mcp/mod.rs`. `McpClient::connect()` spawns processo filho, envia `initialize` JSON-RPC, e mantém stdin/stdout pipes. `list_tools()` converte tools MCP para `ToolDef`. `call_tool()` envia `tools/call` e extrai conteúdo textual. Registrado em `coding_tools(state)` que agora aceita `&mut AgentState` e mescla tools MCP com tools built-in. `execute_tool()` tem fallback `try_mcp_tool()` para tool names não reconhecidos. `connect_mcp_clients()` é chamado no início de `run_agent_loop_with_hooks`. Config: `Config.mcp_servers: Vec<McpServerConfig>`. State: `AgentState.mcp_clients: Vec<McpClient>`.
- **Ref:** ADR 0012

### ~~G8. Auto-Read Project Context (AGENTS.md)~~ ✅ DONE
- **Gap:** O agente não lê nenhum arquivo de contexto de projeto automaticamente. O próprio projeto tem um `AGENTS.md` mas o agente ignora.
- **Impact:** O modelo não tem contexto sobre arquitetura, convenções, e regras do projeto.
- **Files:** `src/agent/loop.rs`, `src/llm/prompt.rs`
- **Fix:** Implementado `CoderPrompt::load_project_context` (`src/llm/prompt.rs`) — lê `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `CONTEXT.md` na raiz do workspace e injeta no system prompt junto do repo map.
- **Ref:** ADR 0004

### ~~G9. Streaming Tool Call Deltas~~ ✅ DONE
- **Gap:** Tool calls são parseados apenas de respostas completas. Não há streaming incremental de tool call deltas durante SSE.
- **Impact:** UX — o usuário não vê o que o modelo está decidindo até a resposta completa chegar.
- **Files:** `src/llm/client.rs`, `src/llm/router.rs`, `src/agent/agent_loop.rs`, `src/ui.rs`
- **Fix:** Implementado streaming incremental de tool call deltas. `CloudClient::stream_chat` agora aceita `on_tool_call_delta` callback e emite `(index, name, args_delta)` para cada delta SSE. `LlmClient::stream` e `LlmRouter::stream` propagam o callback. `AgentEvent::ToolCallDelta` adicionado para eventos parciais. `AgentHooks::on_tool_call_delta` adicionado. UI handle `ToolCallDelta` exibindo `name[index] Δ args_delta`. `executor.rs` atualizado para passar no-op delta callback. 174 tests pass.
- **Ref:** ADR 0013

### ~~Provider health checks, circuit breaking~~ ✅ DONE
- **Gap:** Sem proteção contra providers instáveis. Se um provider cai, o loop retry forever sem circuit breaker.
- **Impact:** Robustez — latência alta e custo com retries infinitos.
- **Files:** `src/llm/provider_chain.rs`
- **Fix:** Implementado `CircuitBreaker` com estados Closed/Open/HalfOpen. `CircuitBreakerProvider` wrapper around any `CompletionProvider`. `FallbackChain::new` agora wraps todos os providers com `CircuitBreakerProvider` (threshold=3, cooldown=30s). Após 3 falhas consecutivas, circuito abre por 30s. Após cooldown, tenta novamente (half-open). Sucesso reseta o contador. 2 testes: `circuit_breaker_opens_after_threshold_failures` e `circuit_breaker_records_success`.
- **Ref:** ADR 0014

### ~~G10. `list_files` Should Include Directories~~ ✅ DONE
- **Gap:** `list_files` só retorna arquivos (`is_file()`), não diretórios. Antigravity e Claude Code retornam ambos.
- **Impact:** O modelo não vê a estrutura de diretórios do projeto.
- **Files:** `src/tools/fs.rs`
- **Fix:** Implementado tool `list_tree` com `depth`/`max_entries` (inclui diretórios com sufixo `/`).

## P2 — Code Quality & Design

### ~~13. Dead Code: `maybe_compact_chain`~~ ✅ REMOVED
- Removed as part of ADR 0002 (unified orchestration).

### ~~14. Dead Code: `run_agent_loop_with_fallback`~~ ✅ REMOVED
- Removed as part of ADR 0002 (unified orchestration).

### ~~15. Dead Code: `execute_step_inner_chain`~~ ✅ REMOVED
- Removed as part of ADR 0002 (unified orchestration).

### ~~16. Unused `r#loop` Raw Identifier~~ ✅ FIXED
- **File:** `src/main.rs:18`, `src/agent/mod.rs:4`, `src/agent/executor.rs:1`, `src/ui.rs:24,520`
- **Issue:** Module name `loop` fights the Rust keyword, requiring `r#loop` everywhere.
- **Fix:** Rename to `agent_loop` or `cycle`.

### 17. `#![allow(dead_code)]` at Crate Root
- **File:** `src/main.rs`
- **Line:** 3
- **Issue:** Suppresses dead-code warnings for the entire crate.
- **Fix:** Remove and fix dead code.

### 18. `truncate_str` Keeps Tail Instead of Head
- **File:** `src/ui.rs`
- **Lines:** 1455–1463
- **Issue:** Keeps the last `max` characters and prepends ellipsis. For model names and paths, the beginning is usually more informative.
- **Fix:** Change to keep the head (first `max` characters) with trailing ellipsis.

### 19. Conversation Cloned on Every Tool-Use Iteration
- **File:** `src/agent/loop.rs`
- **Issue:** `conversation.clone()` clones the entire message history on every iteration.
- **Fix:** Use `Arc<Vec<…>>` or incremental updates. Related to G3 (context compaction).

### 20. Embedding Lookup Allocates a New Vec Per Token
- **File:** `src/llm/infer/engine.rs`
- **Lines:** 231–236
- **Issue:** `.to_vec()` allocates a new vector for each token.
- **Fix:** Reuse a scratch buffer.

### ~~21. NVIDIA GPU Detection Reads File Twice~~ ✅ FIXED
- **File:** `src/hw_recommend/detector.rs`
- **Lines:** 153–170
- **Issue:** `detect_gpu_nvidia` reads `/proc/driver/nvidia/gpus/0/information` twice.
- **Fix:** Read once and parse both fields.

### ~~22. `.env` Parser Doesn't Handle Values Containing `=`~~ ✅ FIXED
- **File:** `src/providers/store.rs`
- **Issue:** Edge case with values containing `=`.
- **Fix:** Use `split_once('=')` which already handles this correctly.

### ~~23. `mask_key` Reveals Too Much for Short Keys~~ ✅ FIXED
- **File:** `src/providers/store.rs`
- **Lines:** 278–281
- **Issue:** `mask_key("ab")` returns `"ab****"`, revealing the entire key. Keys shorter than 4 chars have no masking.
- **Fix:** Always mask at least 4 characters; show at most `min(4, len/2)` visible chars.

## P2 — Harness Gaps (nice-to-have)

### ~~G11. Repo Map (Aider-style)~~ ✅ DONE
- **Gap:** O agente não tem uma visão estrutural do repositório. Aider e Cursor geram um mapa de definições (classes, funções) para guiar file selection.
- **Impact:** Context efficiency — o agente gasta iterações buscando arquivos relevantes.
- **Fix:** Implementado `RepoMapGenerator` (regex, max 2KB) injetado no system prompt. Melhora futura: símbolos via LSP/tree-sitter (ver C2 no backlog competitivo).

### ~~G12. Lint Integration~~ ✅ DONE
- **Gap:** Não integra com linters. Claude Code, Cursor e Aider usam lint feedback para self-correction.
- **Impact:** O agente não detecta erros de estilo/tipo sem rodar o test command completo.
- **Fix:** Implementado lint gate — `Config.lint_on_mutation` (env `LINT_ON_MUTATION`, default true) roda `cargo clippy --message-format short` junto do gate de testes após mutação (`tools::test::run_lint`). Só para workspaces com `Cargo.toml`.

### ~~G13. Web Search Tool~~ ✅ DONE
- **Gap:** Não tem capacidade de buscar na web. Antigravity tem `search_web`, Aider tem web integration.
- **Impact:** O agente não pode pesquisar documentação, APIs, ou soluções para erros desconhecidos.
- **Fix:** Implementado em `src/tools/web.rs` — `http_fetch(url, max_bytes, timeout_secs)` (HTML→texto) + `web_search(query, max_results, timeout_secs)` sem API key: SearXNG via `WEB_SEARCH_URL` (JSON) com fallback DuckDuckGo HTML. Ambos com gate de approval via `command_tool_policy`.

### ~~G14. Session Persistence~~ ✅ DONE
- **Gap:** Sessões não persistem entre execuções. Claude Code, Cursor e Codex salvam sessões.
- **Impact:** UX — o usuário perde todo o contexto ao reiniciar.
- **Fix:** Implementado `persist_session`/`resume_session` (SQLite, crash-safe) + flags `--resume`/`--cont`. Auto-index vetorial opcional via `MEMORY_INDEXING`.

### G15. Background Task Execution
- **Gap:** Não suporta execução em background. Antigravity e Cursor permitem rodar tarefas enquanto o usuário faz outra coisa.
- **Impact:** UX — builds longos bloqueiam o agent loop.
- **Fix:** Executar commands longos em thread separada com polling de status. Emitir eventos via `AgentHooks`.

### ~~G16. Git Branch/Stash Operations~~ ✅ DONE
- **Gap:** Git tools são básicos (status, diff, log, stage, commit). Sem branch, stash, blame.
- **Impact:** Workflow — não pode criar feature branches ou stash work-in-progress.
- **Fix:** Implementado em `src/tools/git.rs` — `git_branch`, `git_stash`, `git_log`, `git_restore` (status/diff/log/stash/restore).

## P3 — Logic Bugs & Edge Cases

### ~~24. `needs_fix` Has False-Positive Logic~~ ✅ REMOVED
- The `needs_fix` heuristic was removed as part of the unified orchestration refactor (ADR 0002). Verification now uses `VerificationResult` with `VerificationStatus::Passed/Failed/Unavailable`.

### 25. `list_files` Skips Directories
- Subsumed by G10.

### 26. `read_file` Step Falls Back to `search_code`
- **File:** `src/agent/executor.rs`
- **Issue:** If a `read_file` step has no `filename`, it silently falls back to `search_code`.
- **Fix:** Return an error or skip the step instead of silently changing operation.

### 27. Retry Logic Can Exceed `max_retries`
- **File:** `src/agent/loop.rs`
- **Issue:** The recursive call can trigger another retry, exceeding `max_retries`.
- **Fix:** Decrement retry count properly or use a loop instead of recursion.

### ~~28. `allowed_commands` Contains Multi-Word Commands~~ ✅ FIXED
- **File:** `src/config/settings.rs`
- **Lines:** 94–120
- **Issue:** The blocked commands list contains multi-word entries (`"rm -rf"`, `"del /f"`, `"rd /s"`) but `is_allowed()` now validates by executable name only. Multi-word blocked commands are misleading.
- **Fix:** Remove multi-word entries from `blocked_commands`. Document that `blocked_commands` is executable-name-only.

### ~~29. `extract_path` Heuristic Can Return Invalid Paths~~ ✅ FIXED
- **File:** `src/agent/executor.rs`
- **Lines:** 249+
- **Issue:** Can return things like `"a.b.c"` as a path when the step description mentions a version number.
- **Fix:** Add more heuristics to filter out non-path tokens.

### ~~31. `Bench` Command Overwrites Local Results with Cloud~~ ✅ FIXED
- **File:** `src/bench/mod.rs`, `src/bench/local.rs`, `src/bench/cloud.rs`
- **Issue:** Both local and cloud benchmark results were saved to the same file from a single combined module.
- **Fix:** Split `model_bench.rs` into `local.rs` and `cloud.rs` modules. Exported both from `mod.rs`. Made shared helpers (`BenchResult`, `names_match`, `estimate_tps_from_catalog`) `pub(crate)` in `model_bench.rs` for cross-module use. `main.rs` can now route local and cloud results to separate output files.

### ~~32. Status/WARN Messages Leaked to Chat~~ ✅ FIXED
- **File:** `src/ui.rs`
- **Issue:** `AgentEvent::Status` events (warnings, rate limits, planning messages) were added to chat as `[System]` messages instead of the status bar.
- **Fix:** Route `AgentEvent::Status` to `a.status` instead of `a.add_message("System", ...)`.

### ~~33. ESC Blocked During Approval Modal~~ ✅ FIXED
- **File:** `src/ui.rs`
- **Issue:** During approval prompts, ESC was captured by the modal and could not interrupt the running turn or quit.
- **Fix:** ESC in approval modal now denies the approval (unblocking the worker). ESC during loading interrupts the turn. Ctrl+C twice quits.

### ~~34. Duplicate Character Input on Windows~~ ✅ FIXED
- **File:** `src/ui.rs`
- **Issue:** Each keystroke appeared twice ("iiss dduupplliccaattee") because crossterm emits both Press and Release key events on Windows.
- **Fix:** Filter `KeyEventKind::Release` events in the key handler.

### ~~35. TUI Layout Breaks During Retries~~ ✅ FIXED
- **File:** `src/ui.rs`
- **Issue:** Status messages during retries (planning, warnings, rate limits) were either leaking to chat or breaking the terminal layout because `app.status` was never rendered in a fixed position.
- **Fix:** Added a dedicated fixed status line (`page[2]`) between the main content and input bar. Status text is truncated to terminal width to prevent wrapping. Layout is now 5 rows: header, content, status, input, bottom bar.

---

## P4 — Estrutura / Arquitetura (padrões Codex 2026)

Recomendações da comparação com `codex-rs` (openai/codex). NÃO copiar o workspace inteiro (~140 crates) — adotar só a disciplina de fronteiras + config centralizada, em grau adequado para projeto single-crate.

### S1. Upgrade edition 2021 → 2024
- **File:** `Cargo.toml`
- **Fix:** Bump `edition = "2024"`. Baixo esforço; alinha com o `workspace.package.edition = "2024"` do Codex.

### S2. Criar `lib.rs` (hoje só existe `main.rs`)
- **File:** `src/lib.rs` (novo), `src/main.rs`
- **Fix:** Adicionar target `lib` para habilitar doc-tests e rustdoc. Pré-requisito/suporte para remover `#![allow(dead_code)]` (item 17) — hoje existe só porque é binário puro.

### S3. Split seletivo em workspace pequeno (2–3 crates)
- **Fix:** Fronteira de maior valor é `llm/infer` (gguf, engine, gpu, tokenizer, model, ops) — único subsistema auto-contido e pesado (CPU/GPU, isolável e testável). Espelha o Codex (`ollama`/`lmstudio`/`model-provider` separados do `cli`). `compressor` também é bom candidato (funções puras).
- **Alvo:**
  ```
  Cargo.toml            (workspace)
  crates/infer/         ← src/llm/infer
  crates/compressor/    ← src/compressor
  src/                  (harness do agente: agent, tools, repo, mcp, ui, etc.)
  ```
- **Não fatiar:** `agent` + `tools` + `ui` + `repo` (núcleo acoplado). Manter juntos.

### S4. Adotar `workspace.package` / `workspace.dependencies` / `workspace.lints`
- **Fix:** Centralizar edition/versão/licença e versões de deps em um lugar só. `workspace.lints` com lista curta de `deny` (ex: `unwrap_used`, `uninlined_format_args`, `needless_late_init`). Custo ~zero, maior ganho de padronização.

### S5. Consistência de nomes (Codex usa nomes descritivos claros)
- **Files:** `src/hw_recommend/`, `src/models_dev/`, `src/main.rs:84`
- **Fix:** `hw_recommend` → `hardware`; `models_dev` → `catalog` (é um client do models.dev); alinhar `clap name = "slowcode"` com `chronokairo` (nome antigo residual).

### S6. Testes de integração com mock provider
- **Fix:** O Codex usa `wiremock` + crates de `test-support`. É a única lacuna de infra real do harness. Duplicado do item aberto "Integration tests with mock provider".

---

## Roadmap — Competitive Backlog (2026-08-06)

> Fonte: comparação com Claude Code / Codex / Antigravity / Cursor / Aider (ver `docs/gap-analysis-2026-08.md`).
> Entregues nesta rodada: cost em US$ (G6), web tools (G13), lint gate (G12), todo tool, memória vetorial, global settings (`~/.chronokairo/settings.json`), snapshot respeitando `.gitignore`.

### Implementar (novos gaps)

#### C1. Path-scoped permissions — 🔴 Alta — Segurança
- **Gap:** `require_approval` existe, mas não há rede automática: nada impede write/shell fora do `workspace_dir` (`..`, symlink escape, diretórios do sistema). Codex (sandbox) e Claude (path-scope) fazem.
- **Files:** `src/tools/fs.rs`, `src/tools/shell.rs`, `src/agent/agent_loop.rs`
- **Fix:** gate automático de escrita: rejeitar caminhos fora do workspace, `..`, symlink escape; policy por prefixo de path.

#### C2. Symbol / LSP search — 🔴 Alta — Navegação
- **Gap:** o repo map regex (2KB) é fraco para navegação. Claude (LSP) e Cursor (LSP) têm go-to-def/referências.
- **Fix:** índice de símbolos (tree-sitter, ctags ou LSP) com tool `search_symbols`.

#### C3. Sub-agentes paralelos — 🟡 Média — Throughput
- **Gap:** tool `task` roda 1 sub-agente/turno sequencial. Claude/Cursor disparam N em paralelo.
- **Fix:** escalar `task` para N concorrentes com junção de resultados e timeout total.

#### C4. Skills system — 🟡 Média — Extensibilidade
- **Gap:** sem sistema de skills (Claude `SKILL.md`, Antigravity skills). MCP já cobre tools externas; falta conhecimento/prompting empacotado por skill.
- **Fix:** `skills/` no projeto + `SKILL.md` injetável + tool `load_skill`; gates por policy.

#### C5. File checksums / change-tracking — 🟡 Média — Contexto e diff
- **Gap:** o snapshot lê bytes todo turno; sem hash por arquivo (Claude/Cursor/Aider têm). Releitura redundante gasta I/O e tokens.
- **Fix:** hash+size por arquivo no snapshot; reler só o que mudou; diff por checksum.

#### C6. Extended thinking — 🟡 Média — Modelos reasoning
- **Gap:** sem pass-through de `reasoning_content` (Claude/Codex). `ToolCallDelta` já existe; é o próximo degrau.
- **Fix:** campo `thinking` no streaming, persistência opcional, exibição colapsável na UI.

#### C7. Adversarial verification — 🟢 Baixa — Qualidade
- **Fix:** após passar nos testes, o agente questiona a própria solução (padrão Claude Code).

#### C8. Notebook editing / timers / image gen — 🟢 Baixa — Paridade
- Notebook editing (Claude/Cursor), timers/cron (Antigravity), image gen (Antigravity). Avaliar público-alvo.

#### C9. Background tasks — 🟡 Média — UX (reabre G15)
- **Fix:** commands longos (build/verify) em thread separada com polling de status via `AgentHooks`, sem travar o loop.

### Remover / congelar

#### R1. Remover `--caveman` — `src/compressor/caveman.rs`
- Modo de compressão "cavernês"; é gimmick. Remover ou esconder atrás de feature flag.

#### R2. Avaliar `serve`/`src/terminal/` (501 linhas: pty + websocket)
- Menor uso no fluxo core. Se o TUI no browser não é usado, remover; se é diferencial de acesso remoto, manter e documentar.

#### R3. Congelar `bench`/`hw_recommend` (735 + 521 linhas)
- São dev-tools (subcomandos `bench`/`check`), não features do harness. Parar de evoluir; manter apenas manutenção.

### Sprint sugerido

| Sprint | Foco | Itens | Timeline |
|--------|------|-------|----------|
| 1 | Segurança | C1 (path-scope) | 1-2 dias |
| 2 | Extensibilidade | C4 (skills) | 1 dia |
| 3 | Contexto/Perf | C5 (checksums), C7 | 2-3 dias |
| 4 | Throughput | C3 (sub-agentes paralelos) | 2-3 dias |
| 5 | Qualidade | C6 (thinking), C2 (symbols) | 1 semana |
| — | Limpeza | R1, R2, R3 | 1 dia |

---

## Vision Gap Analysis (2026-08-08)

> Comparação do documento de visão (README/vision) com o código real. Inventários: `docs/explore-report-01-llm-routing-inference.md`, `docs/explore-report-02-context-memory-caching.md`, `docs/explore-report-03-agent-tools-validation-security.md`. Síntese: `docs/gap-analysis-vision-2026-08.md`. Log: ADR 0016.

### Contexto

O código atual é um harness completo e funcional, mas várias capacidades da visão estão ausentes, parciais ou desacopladas do runtime. Principais achados:

- `src/repo/context.rs` está **vazio (0 bytes)** — o "Context Engine / seleção de contexto mínimo" não existe.
- Router roteia por **model-id apenas** (`router.rs:213-225`); **sem classificação de tarefa** (determinístico → local → remoto).
- Custo é precificado/rastreado por turno (`turn_cost_usd`) mas **nunca é input de roteamento**.
- `hw_recommend` funciona mas é **CLI/bench-only e Linux-only**; nunca consultado pelo router.
- `FallbackChain`/`CircuitBreaker` construídos (`provider_chain.rs:316`) mas **conectados apenas a benchmarks**; sem escalada local→remoto no runtime.
- Memória categorizada (architecture/decisions/conventions/failures/fixes/dependencies/summaries) **não existe**; `save_decision` (`log.rs:375`) sem call sites; sem tool `memory_save`.
- Caching da visão (repo analysis, symbol indexes, file summaries, embeddings, test results, error classifications, model responses, context selections) **ausente** — só o catálogo models.dev é cacheado.
- Tree-sitter/LSP ausentes (indexação por regex); sem file summaries; layer2 de compressão é dead code.
- Sem confidence scoring, complexity estimation, ou métricas por tarefa persistidas (route/model/latency/validation/files_changed).
- MCP server expõe apenas `run_coder` e **auto-aprova tudo** (`mcp/server.rs:93-100`).
- Segurança: forte em containment/aprovação; mas `allowed_commands` default `"*"`, `token_escapes_workspace` falha em traversal relativa (`rm ../../x`), sem sandbox/audit log.

### Top 5 prioridades para fechar o gap

1. Implementar `repo/context.rs` — seleção de contexto mínimo + persistir repo map / symbol cache.
2. Classificador de tarefas → roteamento determinístico / local / remoto.
3. Conectar `FallbackChain` / escalada ao router do runtime (local→remoto, remoto→local).
4. Custo como sinal de roteamento + persistência de métricas por tarefa.
5. Memória categorizada (decisions/failures/fixes) com tool `memory_save`.

---

## Status Summary (as of 2026-08-02)

### Fixed (from previous TODOs)

| # | Item | Fixed In |
|---|------|----------|
| 1 | Command injection via prefix-based allowlist | ADR 0002 |
| 2 | Timeout + process-group kill for `run_command` | ADR 0002 |
| 3 | `run_command_raw` bypasses allowlist | ADR 0002 |
| 13 | Dead code: `maybe_compact_chain` | ADR 0002 |
| 14 | Dead code: `run_agent_loop_with_fallback` | ADR 0002 |
| 15 | Dead code: `execute_step_inner_chain` | ADR 0002 |
| 24 | `needs_fix` false-positive logic | ADR 0002 |
| 4 | `unsafe transmute` on untrusted GGUF data | ADR 0007 |
| 5 | GGUF parsing panics on truncated files | ADR 0007 |
| 6 | Q4_0/Q8_0 dequantization bounds checks | ADR 0007 |
| 7 | `tensor_data` out-of-bounds check | ADR 0007 |
| 8 | Path traversal, symlink escape & injection safety | ADR 0008 |
| 9 | Replaced unwrap calls with pattern matching in production | ADR 0008 |
| 10 | `partial_cmp().unwrap()` NaN panic safety | ADR 0008 |
| 11 | Top-K sampling NaN comparison safety | ADR 0008 |
| 12 | HTTP error status check in OllamaClient | ADR 0008 |
| 16 | Rename `r#loop` → `agent_loop` | ADR 0008 |
| 21 | GPU info single file-read refactor | ADR 0008 |
| 22 | `.env` value parser with quotes & inline comments | ADR 0008 |
| 23 | Short API key masking safety | ADR 0008 |
| 28 | Multi-word blocked commands support | ADR 0008 |
| 29 | `extract_path` dot/slash extension requirement | ADR 0008 |
| 31 | Bench module split (local.rs / cloud.rs) | ADR 0010 |
| 32 | Status/WARN messages routed to status bar (not chat) | UI fix |
| 33 | ESC handling: interrupt + approval deny + Ctrl+C twice quit | UI fix |
| 34 | Windows duplicate character input (KeyEventKind filter) | UI fix |
| 35 | Fixed TUI layout: dedicated status line, no overlap during retries | UI fix |

### Implemented Features

| Feature | Status | ADR |
|---------|--------|-----|
| Workspace transactions (snapshot/diff/rollback) | ✅ Done | 0002 |
| Interactive approval broker (G2) | ✅ Done | 0002 |
| Parallel read-only tool execution | ✅ Done | 0002 |
| `tool_choice` + capability filtering | ✅ Done | 0002 |
| Unified orchestration (no more FallbackChain) | ✅ Done | 0002 |
| Limits calibrated to GLM-5.2 via NIM | ✅ Done | 0002 |
| Protocol normalization (typed tool_calls) | ✅ Done | 0002 |
| Prompt contract for GLM-5.2 | ✅ Done | 0002 |
| LLM Router (local/cloud routing) | ✅ Done | 0001 |
| Provider switching at runtime (`/provider`) | ✅ Done | 0001 |
| Same-tier model fallback via `ModelTier` | ✅ Done | 0003 |
| Exponential backoff on 429/5xx | ✅ Done | 0003 |
| LLM error surfacing in TUI chat | ✅ Done | 0003 |
| Mouse wheel scrolling in TUI | ✅ Done | 0003 |
| Workspace defaults to current directory | ✅ Done | 0003 |
| Auto-read project context (`AGENTS.md`) (G8) | ✅ Done | 0004 |
| `list_files` includes directories (G10) | ✅ Done | 0004 |
| Token usage & cost tracking per turn (G6) | ✅ Done | 0005 |
| Windows cross-platform path resolution fixes | ✅ Done | 0005 |
| Line-range surgical code editing (`edit_file`, `multi_edit_file`) (G1) | ✅ Done | 0006 |
| GGUF safe parsing & bounds-checked dequantization | ✅ Done | 0007 |
| Floating point safety & complete key masking | ✅ Done | 0008 |
| Context intelligence, token estimation (G4) & repo map (G11, G3) | ✅ Done | 0009 |
| Git branch & stash operations (G16) | ✅ Done | 0009 |
| Bench module split (local.rs / cloud.rs) (Item 31) | ✅ Done | 0010 |
| Sub-agent support (Task tool) (G5) | ✅ Done | 0011 |
| MCP client with stdio transport (G7) | ✅ Done | 0012 |
| Streaming tool call deltas (G9) | ✅ Done | 0013 |
| Provider health checks & circuit breaking | ✅ Done | 0014 |
| Cost tracking em US$ (catálogo models.dev) (G6) | ✅ Done | — |
| Web search keyless + `http_fetch` (G13) | ✅ Done | — |
| Lint gate (`cargo clippy` pós-mutação) (G12) | ✅ Done | — |
| TODO tracking tool (`todo`) | ✅ Done | — |
| Memória vetorial/semântica local (`memory_search`, embeddings) | ✅ Done | — |
| Global settings (`~/.chronokairo/settings.json`, Claude-style) | ✅ Done | — |
| Snapshot respeita `.gitignore` + guard de tempo | ✅ Done | — |
| Prompts versioned/tested | ✅ Done | — |
| Status/WARN messages to fixed status bar (no chat leak) | ✅ Done | UI |
| ESC handling: interrupt + approval deny + Ctrl+C twice quit | ✅ Done | UI |
| Windows duplicate character input fix (KeyEventKind filter) | ✅ Done | UI |
| Fixed TUI layout: dedicated status line, no overlap during retries | ✅ Done | UI |
| Collapsible workspace info panel (Context, Token Usage, Models, Todo, etc.) | ✅ Done | UI |

### All Open Demands

| # | Priority | Item | Category | Effort |
|---|----------|------|----------|--------|
| C1 | 🔴 Alta | Path-scoped permissions (workspace containment) | Safety | Médio |
| C2 | 🔴 Alta | Symbol / LSP search | Harness | Alto |
| C3 | P1 | Parallel sub-agents (N por turno) | Harness | Médio |
| C4 | P1 | Skills system (`SKILL.md` + `load_skill`) | Extensibilidade | Baixo |
| C5 | P1 | File checksums / change-tracking | Performance | Médio |
| C6 | P1 | Extended thinking (`reasoning_content`) | Harness | Médio |
| C7 | P2 | Adversarial verification | Quality | Baixo |
| C8 | P2 | Notebook editing / timers / image gen | Harness | Alto |
| C9 | P2 | Background task execution (reabre G15) | Harness | Alto |
| R1 | P2 | Remove `--caveman` | Limpeza | Baixo |
| R2 | P2 | Avaliar `serve`/`src/terminal/` | Limpeza | Baixo |
| R3 | P3 | Congelar `bench`/`hw_recommend` | Limpeza | Baixo |
| 17 | P2 | Remove `#![allow(dead_code)]` | Code Quality | Baixo |
| 18 | P2 | Fix `truncate_str` (head vs tail) | Code Quality | Baixo |
| 19 | P2 | Fix conversation clone per iteration | Performance | Médio |
| 20 | P2 | Fix embedding alloc per token | Performance | Baixo |
| 30 | P2 | Make `get_cloud_models` data-driven | Code Quality | Baixo |
| — | P2 | Integration tests with mock provider | Testing | Médio |
| — | P2 | CI pipeline | Infra | Médio |
| S1 | P3 | Upgrade edition 2021 → 2024 | Estrutura | Baixo |
| S2 | P3 | Create `lib.rs` target | Estrutura | Baixo |
| S3 | P3 | Workspace split: `crates/infer` + `crates/compressor` | Estrutura | Alto |
| S4 | P3 | `workspace.package` / `workspace.dependencies` / `workspace.lints` | Estrutura | Médio |
| S5 | P3 | Rename `hw_recommend`→`hardware`, `models_dev`→`catalog`, fix clap name | Estrutura | Baixo |
| S6 | P3 | Mock provider integration tests | Testing | Médio |

### Recommended Sprint Order

| Sprint | Focus | Items | Timeline |
|--------|-------|-------|----------|
| **1** | Safety | C1, R1 | 1-2 dias |
| **2** | Extensibility | C4, R2 | 1 dia |
| **3** | Context Intelligence | C5, C7 | 2-3 dias |
| **4** | Architecture | C3, C6, C9 | 2-3 dias |
| **5** | Competitive | C2, C8, R3 | 1 semana |

### Test Coverage

~284 unit tests across all modules (3 ignored: 2 live web + 1 embedding real). Key areas:

| Module | Tests |
|--------|-------|
| `llm/tier.rs` | 10 (tier classification, fallback resolution, ordering) |
| `llm/router.rs` | 12+ (routing, resolution, provider switching, capability, fallback, cost) |
| `tools/shell.rs` | 8 (allowlist, metacharacters, timeout, combined output) |
| `tools/fs.rs` | 6+ (path traversal, workspace containment, transactions) |
| `tools/transaction.rs` | 4 (snapshot, diff, rollback, gitignore) |
| `tools/web.rs` | 5 (strip_html, truncation, DDG parser + 2 live `[ignore]`) |
| `config/settings.rs` | 6 (defaults, env overrides, policies) |
| `agent/agent_loop.rs` | 12+ (tool dispatch, todo, parallel execution, output formatting) |
| `llm/embedder.rs` | 2 (global resolve) + 1 real `[ignore]` |
| `memory/log.rs` | 6+ (short-term, search, vector store) |
| `providers/store.rs` | 6+ (env loading, catalog resolution, masking) |
| `models_dev/` | 10+ (catalog queries, provider models) |
| `ui/` | 6+ (truncation, formatting, elapsed time) |
