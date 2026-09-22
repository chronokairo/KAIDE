# ADR 0003 — Resilient Routing: Same-Tier Fallback, Backoff & Error Surfacing

**Status:** Accepted  
**Date:** 2026-08-02  
**Author:** Luan  

## Context

After ADR 0002 (harness parity), GLM-5.2 via NVIDIA NIM was the primary model,
routed through `LlmRouter`. Three failure modes remained unaddressed:

1. **No fallback on model failure.** If the primary model returned 429 (rate
   limit) or 5xx (server error) after exhausting retries, the agent loop would
   fail the turn outright. Other models of comparable capability on the same
   provider were ignored.

2. **No retry with backoff.** `CloudClient::chat_meta` failed immediately on
   transient HTTP errors. NIM rate limits (`429 Too Many Requests`) and sporadic
   502/503 gateway errors caused unnecessary failures.

3. **LLM errors invisible to the user.** The TUI showed a generic "Error"
   banner; the underlying HTTP status/body was only visible in stderr, not the
   chat panel.

Additionally, the TUI lacked mouse wheel scrolling for the chat pane and
workspace paths defaulted to the filesystem root instead of the current
directory.

## Decision

### 1. Model Tier Classification (`src/llm/tier.rs`)

Introduce a `ModelTier` enum (`Dumb`, `Smart`, `Intelligent`) that classifies
models by capability profile using NIM-catalog-era heuristics:

- **Intelligent:** GLM-5.2, DeepSeek V4, Nemotron 3 Ultra 550B, Kimi K2.6,
  Inkling, GPT-4/5, Claude, Gemini 2 (frontier reasoning + large context).
- **Smart:** Nemotron Super/70B/49B/120B, Yi Large, Qwen 72B, Llama 70B,
  Mixtral, Command R (capable coding/reasoning).
- **Dumb:** Nano 9B/8B, Mistral, Nemo, Gemma, Phi, StarCoder, 7B–13B
  (fast, limited reasoning).

Two classification entry points:

- `classify_model_tier(model_id)` — ID-based heuristic; unknown models
  conservatively default to `Smart` to avoid accidental degradation.
- `classify_model_tier_from_info(model_id, catalog_info)` — refines with
  catalog metadata (context window ≥ 512K + reasoning + tool_call → promote
  to Intelligent; context ≥ 200K + tool_call → promote Dumb to Smart).

### 2. Dynamic Same-Tier Fallback (`src/llm/router.rs`)

`find_same_tier_fallback()` scans the active provider's catalog for a model
that matches the primary's tier, supports tool calling if the primary does,
is different from the primary, and is cheapest by input cost.

The router exposes:

- `resolve_fallback(model)` — dynamically finds a same-tier fallback and
  filters out the primary; falls back to the stored `fallback_model` if
  no catalog match.
- `set_model(model)` — called when the user picks a new model; recomputes
  the same-tier fallback.
- `chat_meta_with_fallback(…)` — tries the primary model; on any error,
  retries once with the fallback model.
- `generate_with_retry_with_fallback(…)` — same pattern for `generate`.

Error messages from both models are chained:
`"{primary_err}\n  [fallback {fb_model} also failed: {fb_err}]"`.

### 3. Exponential Backoff on Transient HTTP Errors (`src/llm/client.rs`)

`CloudClient::chat_meta` retries up to 5 times on HTTP 429, 500, 502, 503:

| Status | Backoff base | Rationale |
|--------|-------------|-----------|
| 429    | 2 s × 2^attempt | NIM rate limits; longer backoff avoids retry storms |
| 5xx    | 500 ms × 2^attempt | Transient gateway errors; faster recovery |

`generate_with_retry` (Ollama client) retries with 500 ms × 2^attempt.

### 4. LLM Error Surfacing to TUI

The agent loop now calls `hooks.warn(error_message)` before falling back or
failing, which emits an `AgentEvent::Status` that appears as a System message
in the TUI chat pane. Previously, HTTP error details were only visible via
`eprintln!`.

### 5. Mouse Wheel Scrolling

The TUI event loop now handles `MouseEventKind::ScrollUp` and
`MouseEventKind::ScrollDown` to scroll the chat history viewport.
`EnableMouseCapture` was already enabled; only the event handler was missing.

### 6. Workspace Defaults

`Config::workspace_dir` defaults to `"."` (current directory) and the TUI
resolves this to the `--dir` argument or `cwd` at startup, instead of
defaulting to filesystem root.

## Consequences

- A 429 on GLM-5.2 automatically retries with backoff; if all retries fail,
  the router transparently falls back to the cheapest same-tier model (e.g.
  DeepSeek V4 Flash on NIM) — no user intervention needed.
- Tier classification is heuristic (string matching) and will need periodic
  updates as new models appear; `classify_model_tier_from_info` mitigates
  this for catalog-listed models.
- Error messages now appear in the TUI chat, improving debuggability.
- Mouse wheel scrolling works out-of-the-box on terminals that support mouse
  capture.
- Unit tests cover tier classification, fallback resolution, ordering, and
  edge cases (10 new tests in `tier.rs`, 2 new in `router.rs`).
- Remaining gaps: streaming tool deltas, MCP client, cost tracking, CI,
  `#[test]` count now at ~160.
