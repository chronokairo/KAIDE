# ADR 0013 — Streaming Tool Call Deltas

**Status:** Accepted  
**Date:** 2026-08-03  
**Author:** Antigravity + Luan  

## Context

The ChronoKairo agent loop only sees tool calls after the LLM returns a complete response. During SSE streaming, tool call arguments arrive in chunks, but the agent loop discards them and waits for the final JSON. This creates a UX gap: the user sees no indication of what the model is deciding until the full response arrives.

## Decision

1. **New `AgentEvent::ToolCallDelta`:**
   ```rust
   ToolCallDelta {
       index: usize,
       name: Option<String>,
       args_delta: String,
   }
   ```
   Emitted incrementally as tool call arguments arrive in SSE chunks.

2. **New `AgentHooks::on_tool_call_delta`:**
   ```rust
   pub on_tool_call_delta: Option<Arc<dyn Fn(usize, Option<&str>, &str) + Send + Sync>>;
   ```

3. **Cloud client streaming (`src/llm/client.rs`):**
   - `LlmClient::stream_chat` now accepts `on_tool_call_delta: &mut dyn FnMut(usize, Option<&str>, &str)`.
   - For each SSE delta containing `tool_calls`, extracts `index`, `function.name`, and `function.arguments` chunk.
   - Calls `on_tool_call_delta(index, name, args)` for non-empty argument chunks.
   - Also emits raw JSON via existing `on_token` callback for backward compatibility.

4. **Propagated through router (`src/llm/router.rs`):**
   - `LlmRouter::stream` accepts and forwards `on_tool_call_delta`.

5. **UI integration (`src/ui.rs`):**
   - Handles `AgentEvent::ToolCallDelta` by adding a message: `name[index] Δ args_delta`.
   - Added test `tool_call_delta_event_is_handled`.

6. **Executor compatibility (`src/agent/executor.rs`):**
   - Updated `stream` call to pass no-op `on_tool_call_delta` callback.

## Consequences

- Tool call deltas are now available to the UI in real-time during streaming.
- The agent loop itself still uses non-streaming `chat_meta_with_fallback`; full integration would require rewriting `run_tool_use_iteration` to use streaming.
- 174 tests pass, including the new `tool_call_delta_event_is_handled` test.
