# Explore Report 02 — Context, Memory & Caching Layer

> Inventory produced 2026-08-08 for the vision-vs-codebase gap analysis.
> Scope: `src/repo/`, `src/compressor/`, `src/memory/`, `src/llm/embedder.rs`.

**Headline:** `src/repo/context.rs` is **0 bytes** (empty). It is the declared home for the "context selection" capability and was never implemented.

## 1. `src/repo/` — repository indexing & repo map

`mod.rs` exports only `scanner::{RepoMapGenerator, SymbolIndex}`; `pub mod context;` points at the empty file.

- `scanner.rs` (241 lines) — builds a `SymbolIndex` by walking the workspace (`std::fs::read_dir`, depth-limited to 4, `scanner.rs:20,88-128`) and extracting declarations via **hand-written regex** (`scanner.rs:135-140`). Only `.rs`, `.py`, `.js/.ts/.tsx/.jsx` are parsed (`:144,160,176`). Skip list: `.git, target, node_modules, vendor, dist, build, .idea, .vscode, brain` (`:102-104`).
- `SymbolIndex::build` (`:18`), `search` (`:24`), `search_type` (`:40`).
- `RepoMapGenerator::generate_map(workspace, max_bytes)` (`:59`), injected into the system prompt via `CoderPrompt::load_project_context` (`src/llm/prompt.rs:63`, capped 2,000 bytes) and rebuilt **on every tool-use iteration** (`agent_loop.rs:395`).
- `SymbolIndex` is rebuilt from scratch on every `symbol_search` call (`agent_loop.rs:1304`).
- **Tree-sitter: MISSING** (only match is a test regex string in `src/editor/notebook_test.rs:18`; `tree-sitter` absent from `Cargo.toml`; `lsp-types`/`tower-lsp` declared but unused).
- **No persistence of the index or repo map; no mtime/incremental analysis.**

## 2. `src/compressor/` — output compression

- `layer1.rs` (355 lines, wired): deterministic rule-based lossy compression. `compress()` rules (`:16-47`): strip_ansi, remove_progress_bars, collapse_blank_lines, template_dedup, filter_stack_frames, filter_test_pass, factor_common_prefix, shorten_paths, normalize_tokens (SHA256/JWT masking). Returns `CompressResult { output, original_lines, compressed_lines, applied_rules }`.
- **Wired only in the planner-executor path** (`src/agent/executor.rs:13-36`, applied to file reads / search results / command output / test output ≥200 chars). **Not** applied to agent-loop tool outputs (those use `truncate_tool_output`).
- `layer2.rs` (222 lines): **dead code** (`#![allow(dead_code)]`, zero call sites outside its own tests). Rough token estimate `bytes * 0.25`; `TokenizerKind::Cl100kBase` is a placeholder that never tokenizes.

## 3. `src/memory/` — short-term & persistent memory

### `short_term.rs` (325 lines)
In-process rolling-window conversation buffer of `(seq, role, content)` tuples with optional LLM compaction summary and calibrated token estimator.

- `estimate_tokens` (`:17`): heuristic BPE-ish estimator (non-ASCII = 2 tokens, punctuation/whitespace = 1, words ÷ 4).
- `add_message` (`:50`), `load_records` (`:60`), `records_after` (`:75`, watermark delta), `compact(summary)` (`:121`, keeps last message + summary), `clear` (`:181`).
- LLM compaction: `maybe_compact` in `agent_loop.rs:327-346` — at 80% of `max_context_tokens` (`context_compact_threshold`), asks `summarizer_model` for a ≤150-token summary, then `session.compact(summary)`. Summary materialized as a `system` record on reload (`state.rs:307-316`).

### `log.rs` (496 lines) — SQLite long-term memory
Persistent store for sessions, transcripts, decisions, and vector embeddings with **brute-force cosine-similarity** vector search.

- Tables (`:36-67`): `sessions`, `decisions`, `session_messages (PRIMARY KEY (session_id, seq))`, `memory_vectors (embedding BLOB)`. Migration adds `workspace, model, updated_at, status, message_count` (`:88-94`).
- `start_session` (`:119`), `append_messages` (`:132`, `INSERT OR IGNORE` on `(session_id, seq)`), `update_session` (`:164`).
- `store_vector` (`:193`, L2-normalized f32 LE BLOB), `search_vectors` (`:219`, **loads every row, O(n) scan**, `k.clamp(1, 50)`). **No ANN index.**
- `list_sessions` (`:258`), `latest_session` (`:284`), `load_session` (`:297`), `session_context` (`:316`), `delete_session` (`:325`), `get_recent_sessions` (`:359`).
- `save_decision(decision, reason)` (`:375`) writes the `decisions` table — **NO production call sites (dead code, tests only)**.

### Categorized long-term memory — PARTIAL / mostly MISSING
- Exists: persisted session transcripts (episodic), vector memory of assistant outputs, empty `decisions` table with a dead `save_decision`.
- **Missing:** architecture / conventions / failures / fixes / dependencies / summaries stores.
- Project conventions only via static file injection (`AGENTS.md`/`CLAUDE.md`/`.cursorrules`/`CONTEXT.md`, `prompt.rs:49-62`) + the passive skill-pack system (`src/skills/mod.rs`).
- The **only** memory tool exposed to the model is `memory_search` (`agent_loop.rs:1170`). **No `memory_save`/`remember`/`forget` tool** — the agent cannot write categorized long-term memories itself.

### Persistent sessions — EXISTS
- Full CRUD in SQLite; `AgentState::persist_session` (`state.rs:211-258`) at end of turn (`agent_loop.rs:2045`); `load_session_into_state` (`state.rs:295-332`) used by CLI `--resume`/`--cont` and UI `/resume`/`/continue`.
- **Gaps:** UI resume picker state (`ui/mod.rs:183-187`) is never populated (only `latest_session` is used); `delete_session`/`list_sessions`/`get_recent_sessions` have no production call sites; no rename/export/import.

## 4. `src/llm/embedder.rs` (245 lines) — vector embeddings

- Local GGUF embedding engine (`Qwen3-Embedding-0.6B-Q8_0.gguf` default, Jina v5 fallback), `EmbedKind { Query, Passage }` prefixes, last-token pooling + L2 normalization. Model in `~/.chronokairo/models/embeddings/`; `--download-embedding-model` CLI flag.
- Feeds `memory_search` → `search_vectors`. Auto-indexing `AgentState::index_persisted_records` (`state.rs:263-291`) embeds assistant messages (16–2,000 chars only), gated by `MEMORY_INDEXING` env, **default OFF** (`settings.rs:230`).
- **Gaps:** brute-force linear search (no ANN/HNSW/`vec0`); no embedding cache/dedup (re-embeds every persist); only assistant messages indexed (no user tasks, tool results, file content); no per-file/per-chunk code embeddings.

## 5. Cross-cutting: caching inventory

The only persistent caches in the codebase:
1. **models.dev catalog** — `~/.cache/rustcode/models_dev.json` with TTL (`src/models_dev/client.rs:168-203`).
2. **UI availability-test record** — `~/.gemini/antigravity-cli/last_auto_test.json` (`src/ui/mod.rs:817-839`).
3. **MCP tool list** — in-memory, captured at connect time (`src/mcp/mod.rs:136-140`).
4. **SQLite memory DB** — sessions/transcripts/vectors (not a cache per se).

**MISSING persistent caches for:** repository analysis / repo map, symbol indexes, file summaries (none exist), embeddings, test results, error classifications, model responses, context selections. `cache_read/cache_write` in `models_dev/types.rs:63-64` and `llm/router.rs:510-511` are `None` (prompt-caching costs not tracked).

## 6. Capability matrix

| Capability | Status | Evidence |
|---|---|---|
| a. Repo map / symbol index | **EXISTS — regex, not persisted, shallow (depth 4, 3 language families)** | `repo/scanner.rs:59,130`; rebuilt per call `agent_loop.rs:1304`, `prompt.rs:63` |
| b. Tree-sitter | **MISSING** (pure regex) | `scanner.rs:135-140`; no tree-sitter dep; lsp deps unused |
| c. Minimal-relevant context selection | **ESSENTIALLY MISSING** — `context.rs` empty; only 2KB repo map + static instruction files + crude `rg` heuristic | `repo/context.rs` (0 B), `prompt.rs:48-68`, `executor.rs:485` |
| d. Deterministic compression | **EXISTS** (layer1 wired; layer2 dead) | `compressor/layer1.rs:8`, `executor.rs:17`; `layer2.rs` no callers |
| d'. LLM file summaries | **MISSING** (only conversation compaction is LLM-generated) | `agent_loop.rs:327-346` |
| e. Persistent caches | **MINIMAL** — only models.dev catalog, UI auto-test record; none for repo/symbols/summaries/embeddings/tests/errors/responses/context | `models_dev/client.rs:168`, `ui/mod.rs:817` |
| f. Categorized long-term memory (architecture/decisions/conventions/failures/fixes/dependencies/summaries) | **MISSING** — `decisions` table exists but writer is dead (`save_decision` no callers); no other categories; only `memory_search`, no `memory_save` | `memory/log.rs:375`; `agent_loop.rs:1170` |
| g. Persistent sessions + resume | **EXISTS** — SQLite CRUD, CLI/UI resume; picker UI and delete/recent-list APIs unwired | `state.rs:211,295`; `main.rs:489`; `ui/mod.rs:718`; dead: `log.rs:258,325,359` |
| h. Embeddings / semantic search | **EXISTS** — local GGUF, Query/Passage prefixes, brute-force cosine; indexing opt-in off by default; no ANN, no dedup | `llm/embedder.rs:62`, `memory/log.rs:193,219`, `state.rs:263`, `settings.rs:230` |
