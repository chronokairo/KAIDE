# Vision vs. Codebase — Gap Analysis (2026-08-08)

> Comparison of the ChronoKairo Coder product vision (README/vision document) against the actual codebase.
> Raw inventories: `docs/explore-report-01-llm-routing-inference.md`, `docs/explore-report-02-context-memory-caching.md`, `docs/explore-report-03-agent-tools-validation-security.md`.
> Logged as ADR 0016.

## Big picture

- **`src/repo/context.rs` is 0 bytes** — the vision's "Context Engine / minimal context selection" does not exist yet.
- The current product is a **complete standalone harness** (own agent loop, TUI, exec, plan mode, sub-agents). The vision describes a harness-agnostic optimization *layer* exposing granular `chronokairo.*` MCP tools. Today only `run_coder` (the whole harness) is exposed — no `chronokairo.context`, `search`, `memory`, `review`, `validate`, `escalate` tools.
- The in-progress (uncommitted) work implements most of the AGENTS.md migration checklist: `protocol` (Op/EventMsg/Session), `app_server` (JSON-RPC stdio), `mcp/server.rs`, `exec` subcommand. Still missing: `agent_loop.rs` split, tool registry (still match-based `execute_tool` at `agent_loop.rs:906`), TUI→Session bridge.

## Phase 1 — Local Foundation: mostly done

| Item | Status |
|---|---|
| Core runtime | ✅ `agent_loop.rs`, TUI, CLI |
| Model abstraction | ✅ `LlmClient` enum (Ollama/Local/Cloud) |
| Ollama integration | ✅ `OllamaClient` + `/api/generate`, `/api/chat` |
| Local model discovery | ✅ `model_resolver.rs` (Ollama manifests) |
| Hardware detection | ⚠️ `hw_recommend/detector.rs` — Linux-only, used only by CLI/bench, never by the router |
| Basic MCP server | ✅ `mcp/server.rs` (single `run_coder` tool, auto-approves all approvals `server.rs:93-100`) |
| Tool execution | ✅ 17+ tools |
| Git integration | ✅ `tools/git.rs` |
| Runtime independence | ⚠️ vLLM missing; llama.cpp only as in-process GGUF engine |

## Phase 2 — Context: weakest area

| Item | Status |
|---|---|
| Repository indexing | ⚠️ Regex repo map, depth-4, only `.rs/.py/.js/.ts`; rebuilt every tool iteration (`prompt.rs:63` ← `agent_loop.rs:395`) |
| Tree-sitter | ❌ none (lsp crates declared but unused) |
| Symbol indexing | ⚠️ regex `SymbolIndex`, rebuilt per `symbol_search` call (`agent_loop.rs:1304`) |
| Context selection | ❌ `repo/context.rs` empty; only 2KB repo map + static AGENTS.md/CLAUDE.md injection |
| Context compression | ⚠️ deterministic `layer1` (only planner/executor path, not agent loop) + LLM compaction at 80% (`agent_loop.rs:327-346`); `layer2` dead code |
| File summaries | ❌ none |
| Cache | ❌ only models.dev catalog cached |

## Phase 3 — Memory: partial

| Item | Status |
|---|---|
| Persistent sessions | ✅ SQLite CRUD + resume (CLI/TUI) |
| Vector memory | ✅ `memory_search` (GGUF embedder, brute-force cosine; indexing opt-in off by default) |
| Decisions | ❌ `decisions` table exists but `save_decision` (`log.rs:375`) has zero call sites |
| Failures / Fixes / Architecture / Conventions / Dependencies | ❌ no categorized stores |
| Agent-writable memory | ❌ no `memory_save`/`remember` tool — model can only read |

## Phase 4 — Local Intelligence: partial

| Item | Status |
|---|---|
| Task classification / intent extraction | ❌ router routes by model-id string only (`router.rs:213-225`) |
| Local SLM workers | ⚠️ 3 fixed roles: planner `granite3.3:2b`, coder `qwen3:1.7b`, summarizer `qwen3:0.6b`; no worker abstraction; GGUF engine single-model-per-process |
| Error analysis / code explanation | ❌ |
| Diff review | ⚠️ adversarial review exists (`agent_loop.rs:1524`) but reuses the summarizer model |
| Patch generation | ❌ (no model-based patch tool; edits are direct) |
| Local retry | ⚠️ executor `MAX_FILE_FIX_ATTEMPTS=2` + repair budget — good, but no local→remote escalation |

## Phase 5 — Intelligent Routing: the biggest gap

| Item | Status |
|---|---|
| Complexity estimation | ❌ |
| Confidence scoring | ❌ (no logprobs/entropy anywhere) |
| Cost-aware routing | ❌ cost is priced and tracked (`estimate_cost`, `turn_cost_usd`) but never a routing input |
| Hardware-aware routing | ❌ detector/scorer detached from router |
| Cloud escalation (local→remote) | ❌ none — cloud fallback is same-tier cloud only (`tier.rs`); `generate_with_retry_with_fallback` is a no-op alias (`router.rs:361-369`) |
| Model fallback | ⚠️ `FallbackChain` + `CircuitBreaker` (`provider_chain.rs:316`) built but wired only into benchmarks |

## Phase 6 — Validation: strongest area

| Item | Status |
|---|---|
| Automatic tests | ✅ cargo/pytest/npm gates (`tools/test.rs`) |
| Lint gate | ✅ cargo clippy (skipped without Cargo.toml) |
| Build verification | ⚠️ only via `cargo check` in executor write path (`executor.rs:168`) |
| Workspace transaction/rollback | ✅ `tools/transaction.rs` (snapshot→diff→rollback, symlink-safe) |
| Repair loop | ✅ repair budget + adversarial review after passing |
| Minimal-diff enforcement | ❌ no enforcement/measurement |
| Regression detection | ❌ none |

## Phase 7 — A2A: not started (correctly deferred per vision)

## Cross-cutting concerns

- **Observability** — ❌ TokenUsage events + per-turn USD exist, but the vision's per-task metrics JSON (route, model, latency, validation, files_changed, cache hits) is not collected or persisted. No way to measure cloud-token reduction or cache hit rate.
- **Security** — ⚠️ strong path containment / allow-deny / approval; but `allowed_commands` default is `"*"` (`settings.rs:151-152`), `token_escapes_workspace` misses relative traversal (`rm ../../x` passes), no worker sandbox (Docker `sandbox/` not wired), no audit log, MCP server bypasses approval.
- **Caching** — the vision's entire caching section is unimplemented (only models.dev catalog + UI auto-test record cached).

## Top 5 priorities to close the gap

1. Implement `repo/context.rs` minimal-context selection + persist repo map / symbol cache.
2. Task classifier → deterministic / local / remote route.
3. Wire `FallbackChain` / escalation into the runtime router (local→remote, remote→local).
4. Cost as a routing signal + per-task metrics persistence.
5. Categorized memory (decisions/failures/fixes) with a `memory_save` tool.
