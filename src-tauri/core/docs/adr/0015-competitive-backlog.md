# ADR 0015 — Competitive Backlog Implementation (C1–C9, R1–R3)

**Status:** Accepted  
**Date:** 2026-08-06  
**Author:** Luan  

## Context

Gap analysis (`docs/gap-analysis-2026-08.md`) against Claude Code, Codex, Antigravity, Cursor, and Aider identified 16 gaps (G1–G16). Previous sessions closed G6, G8, G10–G14, G16. The remaining gaps plus new competitive demands were distilled into a backlog of 9 items to implement (C1–C9) and 3 items to remove/freeze (R1–R3).

## Decision

### Implemented (C1–C9)

**C1. Path-scoped permissions** (`src/config/settings.rs`, `src/tools/fs.rs`, `src/tools/shell.rs`)  
- Added `path_allowlist`, `path_denylist`, `block_workspace_escape` to `Config` (env: `PATH_ALLOWLIST`, `PATH_DENYLIST`, `BLOCK_WORKSPACE_ESCAPE`).
- `FileTools::resolve()` enforces deny-list (workspace-relative prefixes) and allow-list (absolute prefixes outside workspace).
- Shell mutation commands (`rm`, `mv`, `cp`, `mkdir`, `del`, `mkdir`, PowerShell `Remove-Item`, etc.) with absolute path args outside workspace/allowlist are rejected via `escapes_workspace()` in `is_allowed()`.

**C2. Symbol search** (`src/repo/scanner.rs`, `src/agent/agent_loop.rs`)  
- `SymbolIndex::build()` extracts symbols (Rust `fn`/`struct`/`enum`/`trait`, Python `def`/`class`, JS/TS `function`/`class`) from the workspace.
- `symbol_search` tool: query by name + optional `symbol_type` filter (e.g. `fn`, `struct`, `def`, `class`, `function`).

**C3. Parallel sub-agents** (`src/agent/agent_loop.rs`)  
- `task` tool now accepts `tasks: ["..."]` array; fans out N sub-agents concurrently (bounded by `max_parallel_tools`, capped at 8) with a 5-minute aggregate timeout.
- Results collected in order, aggregated into one tool output.

**C4. Skills system** (`src/skills/mod.rs`, `src/agent/state.rs`, `src/agent/agent_loop.rs`)  
- Skills = Markdown files with optional YAML frontmatter (`name`, `description`) in `./skills` (project) and `~/.chronokairo/skills` (user).
- `list_skills` and `load_skill(name)` tools for discovery and context injection.
- Project skills take precedence over user skills on name collision.

**C5. File checksums / change-tracking** (`src/tools/transaction.rs`)  
- `WorkspaceDiff::checksum()` — stable FNV-1a digest over sorted path lists (content-agnostic, same paths = same checksum).
- `WorkspaceTransaction::fingerprint()` — order-independent FNV-1a over full baseline (path + content) for per-turn workspace fingerprint.
- `baseline_digest(path)` — per-file digest to detect out-of-band edits.
- Diff output now includes `checksum:` and `baseline:` in the audit.

**C6. Extended thinking** — **Already implemented** in prior sessions.  
- `stream_chat_meta` parses `reasoning_content` / `thinking` deltas.
- `hooks.reasoning_delta()` + `reset_reasoning()` forwarded to TUI (`feed_reasoning_delta`, "Thinking" panel, Ctrl+T toggle).
- Token usage tracks `reasoning_tokens`. No code changes needed this session.

**C7. Adversarial verification** (`src/agent/agent_loop.rs`, `src/config/settings.rs`)  
- New config `adversarial_verification` (env `ADVERSARIAL_VERIFICATION`, default `false`).
- After tests/lint pass, runs a summarizer-model critique on the diff (`build_adversarial_prompt` + `run_adversarial_review`).
- Concerns surfaced as a soft note in the final audit (`Adversarial review notes:`), not a hard gate.

**C8. Notebook editing / timers / image gen** — **Deferred**. Requires heavy dependencies (tree-sitter, external APIs). Not in scope.

**C9. Background tasks** (`src/tools/background.rs`, `src/agent/state.rs`, `src/agent/agent_loop.rs`)  
- `BackgroundTaskManager` spawns detached commands (same allow/block + workspace-escape gates as `run_command`).
- Tools: `spawn_background(command)`, `background_status(id)`, `list_background`, `kill_background(id)`.
- Output captured incrementally via reader threads; status polled on demand.

### Removals / Freezes (R1–R3)

**R1. Removed `--caveman` flag** (`src/main.rs`, `src/agent/state.rs`, `src/llm/prompt.rs`, `src/agent/agent_loop.rs`, `src/agent/executor.rs`, `src/agent/planner.rs`, `src/ui/mod.rs`, `src/compressor/caveman.rs` deleted).  
- CLI flag, `/caveman` command, prompt suffixes, UI display all removed.  
- Rationale: marginal utility, adds cognitive load, not used by competitors.

**R2. Removed `serve` / `terminal`.**
- The browser terminal, PTY bridge, and xterm.js surface were removed; the supported interface is the native Ratatui TUI.

**R3. Froze `bench` / `hw_recommend`** — No new features.  
- Existing modules remain; no active development planned.

## Consequences

- All tests pass (≈305 including new tests).
- Clippy warnings unchanged (8 pre-existing, 0 new).
- Config surface area grows modestly (5 new env vars). Documentation updated in `TODO.md` and `docs/gap-analysis-2026-08.md`.
