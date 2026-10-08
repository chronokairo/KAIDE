# ADR 0005 — Token Usage & Cost Tracking Per Turn

**Status:** Accepted  
**Date:** 2026-08-02  
**Author:** Antigravity + Luan  

## Context

Prior to this change, LLM token usage (prompt tokens, completion tokens, total tokens) returned by providers (Ollama, NVIDIA NIM, OpenAI-compatible APIs) was ignored by `ChatCompletion`. As a result, the harness had no token or cost visibility per turn or session (Gap G6).

## Decision

1. **`TokenUsage` Struct (`src/llm/client.rs`):**
   - Defined `TokenUsage { prompt_tokens: usize, completion_tokens: usize, total_tokens: usize }`.
   - Added `pub usage: Option<TokenUsage>` to `ChatCompletion`.

2. **Provider Response Deserialization:**
   - **Ollama:** Parsed `prompt_eval_count` and `eval_count` from `/api/chat` responses.
   - **Cloud (OpenAI-compatible / NIM):** Parsed `usage` object (`prompt_tokens`, `completion_tokens`, `total_tokens`) from `/chat/completions` responses.

3. **Event Notification in Agent Loop (`src/agent/loop.rs`):**
   - The agent loop emits a status note (`[usage] X prompt + Y completion = Z total tokens`) whenever token usage is reported by the model.

## Consequences

- Operators and the TUI receive real-time token consumption metrics for each turn.
- Enables future token budgeting, context window compaction triggers, and dollar-cost estimation.
- All unit tests pass cleanly across Windows and Unix platforms.
