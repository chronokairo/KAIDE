# Explore Report 03 — Agent Loop, Tools, Validation & Security

> Inventory produced 2026-08-08 for the vision-vs-codebase gap analysis.
> Scope: `src/agent/`, `src/tools/`, `src/types/`, `src/config/`, plus the protocol/app-server/MCP-server consumers.

## 1. Agent loop (`src/agent/agent_loop.rs`, ~2500 lines)

- `run_agent_loop_with_hooks` / `run_agent_loop` (`:2005`) — the orchestration loop; tool-use iteration with streaming deltas, repair loop, transactional finalization, adversarial review.
- `execute_tool_calls` (`:778`) — parallel read-only groups + sequential mutation tools; `execute_tool` (`:906`) is the **match-based dispatch** (to be replaced by a registry per AGENTS.md).
- Verification + repair: on test/lint failure, `repair_attempt += 1` and re-prompts with command + output (`:571-578`), bounded by `max_retries` (`:1465`).
- Adversarial review (C7): `build_adversarial_prompt` (`:1511`) + `run_adversarial_review` (`:1524`, config `adversarial_verification`, default false) — summarizer-model critique on the diff, soft note only.
- `maybe_compact` (`:327-346`) — LLM compaction at 80% context.
- MCP: `connect_mcp_clients` (`:675-683`), `try_mcp_tool` (`:685-717`), tools merged in `coding_tools` (`:1962-1964`).
- Per-turn cost: `estimate_cost` → `state.turn_cost_usd` → `AgentEvent::TokenUsage` (`:468-489`), final `Estimated cost: $X.XXXX` (`:675-676`).

### Full tool list (dispatch `:856-1339` + `coding_tools`)
`read_file`, `list_tree`, `search_code`, `git_status`, `git_diff`, `run_command`, `run_tests`, `http_fetch`, `web_search`, `todo`, `memory_search`, `list_skills`, `load_skill`, `spawn_background`, `background_status`, `list_background`, `kill_background`, `symbol_search`, `task`, plus MCP tools. Editing/mutation tools (write/edit/replace) live in `src/tools/fs.rs` and `src/agent/executor.rs`.

## 2. Planner / Executor (`src/agent/planner.rs`, `src/agent/executor.rs`)

- `planner.rs` — `PlannerPrompt` (JSON step-plan schema with TDD guidance). `execute_step` → `executor::execute_step`.
- `executor.rs` — `MAX_FILE_FIX_ATTEMPTS = 2` (`:11`); `write_with_verification` (`:168`) gates both the write and the `cargo check`, regenerate loop capped at 2 attempts (`:227-236`), error truncated in retry prompt (`:233`). `search_code` prefers rg, falls back to regex walk (`:302-370`). `grep_context` (`:485-502`) is a crude `rg -n --max-count 5` context heuristic used only by the planner-executor path.

## 3. Tools

- `src/tools/fs.rs` (834) — `resolve` (`:322`) lexical-normalize → walk-up canonicalize → denylist → workspace/allowlist containment; `atomic_write` (`:710`); `edit_file` (`:576`, validates `old_content` against actual line slice); `multi_edit_file` (`:637`, descending order, **rejects overlapping ranges** `:655-665`); symlink escape tests (`#[cfg(unix)]` only — no Windows junction test).
- `src/tools/shell.rs` (488) — `run_command_inner` (`:249`) via `cmd.exe /C` or `sh -c`; `SHELL_META_CHARS`/`parse_command` (`:43-62`) are **dead code**; `token_escapes_workspace` (`:83`) returns false for **relative** tokens (so `rm ../../x` passes the gate); `is_allowed` (`:155`) blocked-substring check first, then wildcard `*` = allow-all (`:178`); process-group termination (`:330-355`) is a no-op on Windows.
- `src/tools/test.rs` (150) — `run_tests` (`:42`) auto-detection: Cargo → pytest (`pyproject.toml`/`pytest.ini`/`setup.cfg`/`tests`) → package.json; `run_verification_command` (`:94`) maps code 0 + no-timeout → `Passed`; `run_lint` (`:112`) = `cargo clippy --message-format short`, skipped without Cargo.toml.
- `src/tools/transaction.rs` (459) — `SKIPPED_DIRS` = `.git, target, node_modules, memory_data` (`:5`); `WorkspaceTransaction::begin` (`:96`), `diff` (`:106`), `baseline_digest` (`:139`), `fingerprint` (`:147`), `diff_for_file` (`:165`, diffy Myers patch), `rollback` (`:207`, restores **turn baseline, not git HEAD**), `scan_workspace` (`:226`, gitignore-aware via `ignore` crate, `follow_links(false)`, 10 s budget, 64 MB cap, symlink skip).
- `src/tools/background.rs` — `BackgroundTaskManager`, same allow/block gates as `run_command`.
- `src/tools/web.rs` — `http_fetch` (HTML→text) + keyless `web_search` (SearXNG JSON, DuckDuckGo HTML fallback).
- `src/tools/git.rs` — status/diff/log/stage/commit/branch/stash/restore.

## 4. Config (`src/config/settings.rs`, `src/config/global_settings.rs`)

- `Config` (`:78`): policies `write_tool_policy`/`command_tool_policy` (Ask/Allow/Deny), `allowed_commands` — head entry is literally `"*"` (`:151-152`, making the rest redundant), `blocked_commands` (`:189-197`) = `rm -rf, sudo, reboot, shutdown, format, del /f, rd /s`, `denial_message` (`:20-28`).
- `path_allowlist`, `path_denylist`, `block_workspace_escape` (C1), `adversarial_verification`, `max_retries`, `context_compact_threshold`, `summarizer_model`, `mcp_servers`.
- Global settings `~/.chronokairo/settings.json` (Claude-style).

## 5. Security posture

- **Exists:** workspace containment + symlink escape prevention (Unix-tested), path allow/deny lists, approval broker (Ask/AllowOnce/AllowSession/Deny), plan approval gate, blocked-command list, `atomic_write`, transaction rollback, provider store chmod 600, read/write tool separation (`ToolEffect`).
- **Weaknesses:**
  - `allowed_commands` default `"*"` (`settings.rs:151-152`).
  - `token_escapes_workspace` misses relative traversal (`rm ../../x` passes).
  - **No worker sandbox** (the `sandbox/` Dockerfile exists but is not wired), **no process isolation for sub-agents**, **no audit log**, **no execution-limit policy beyond timeouts**.
  - Windows junction/reparse-point escape untested (Unix-only symlink test).

## 6. Observability

- Per-turn `TokenUsage` events + `turn_cost_usd`; displayed in TUI and JSONL.
- **Missing:** persisted per-task metrics JSON (task_id, route, model, tokens, latency, validation, files_changed, cache hits). No metrics store/report, no way to measure cloud-token reduction or cache hit rate.

## 7. Protocol / app-server / MCP-server (new, uncommitted)

- `src/protocol/mod.rs` (320) — `Op`/`EventMsg`/`Session` queue-pair. `Session::spawn` runs the loop on a thread with its own Tokio runtime; `submit(Op)`, `next_event()`, `approve_exec`, `approve_plan`, `interrupt`. `AgentEvent → EventMsg` mapping covers status/tool/text/plan/approval/file/verification/transaction/token/reasoning/done/failed/interrupted. Both `on_plan_approval` and `on_approval` route through mpsc waiters keyed by request id.
- `src/app_server/mod.rs` (185) — JSON-RPC 2.0 stdio server: `initialize`, `start_turn`, `interrupt`, `exec_approval`, `plan_approval`, `shutdown`; event pump emits `agent/event` notifications. Driven by the same `Session`.
- `src/mcp/server.rs` (175) — MCP server exposing a single `run_coder` tool (`{prompt, mode: agent|plan}`). **Auto-approves every `ExecApprovalRequest` (AllowOnce) and `PlanApprovalRequest` (Approve)** (`:93-100`) — fully non-interactive, zero human-in-the-loop.
- CLI: `exec` (`main.rs:384`), `app-server` (`:394`), `mcp-server` (`:398`).

## 8. Capability matrix

| Capability | Status | Evidence |
|---|---|---|
| Validation: automatic tests | ✅ Cargo/pytest/npm gates | `tools/test.rs:42` |
| Validation: lint gate | ✅ cargo clippy (Cargo-only) | `tools/test.rs:112` |
| Validation: build verification | ⚠️ only via `cargo check` in write path | `executor.rs:168` |
| Workspace transaction (snapshot/diff/rollback) | ✅ per turn | `tools/transaction.rs` |
| Repair loop / repair budget | ✅ `repair_attempt` + `max_retries`, file-fix cap 2 | `agent_loop.rs:571`, `executor.rs:11` |
| Adversarial diff review (C7) | ✅ soft gate, summarizer model | `agent_loop.rs:1524` |
| Minimal-diff enforcement | ❌ no enforcement/measurement | — |
| Regression detection | ❌ none | — |
| Escalation (local→remote) | ❌ none at runtime | `router.rs:361-369` (no-op alias) |
| Security: sandbox / process isolation / audit log | ❌ absent (sandbox/ dockerfile not wired) | — |
| Observability: per-task metrics | ❌ token/cost per turn only; no persistence | `agent_loop.rs:468` |
| MCP server human-in-the-loop | ❌ auto-approves all | `mcp/server.rs:93-100` |
