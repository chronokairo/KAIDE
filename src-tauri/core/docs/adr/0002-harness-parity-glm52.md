# ADR 0002 — Harness Parity (GLM-5.2)

**Status:** Accepted  
**Date:** 2026-08-02  
**Author:** Luan + Kiro  

## Context

The ChronoKairo harness lagged modern coding agents (Claude Code, Codex CLI,
Antigravity) in several structural ways: no transactional workspace, no
interactive approval, sequential-only tool execution, no capability filtering,
no `tool_choice`, no deterministic diff/rollback, divergent orchestration paths,
and limits far below competitors.

The primary model target is `z-ai/glm-5.2` served via NVIDIA NIM.

## Decision

Implement full parity in a single incremental refactor, validated by unit tests
(148 passing) and end-to-end smoke tests against GLM-5.2.

### Changes

1. **Workspace transactions** (`src/tools/transaction.rs`)  
   - Per-turn snapshot of the workspace filesystem (excluding .git, target, etc.)
   - `diff()` → added/modified/deleted; `rollback()` → restore baseline.
   - Baseline is the turn start, not `git HEAD`, preserving user's dirty state.

2. **Deterministic finalization**  
   - Every exit path (success, failure, interrupt, max iterations) finalizes the
     transaction: success keeps + reports diff; failure rolls back.
   - `finalize_transaction` is idempotent; layered exits cannot double-rollback.

3. **Interactive approval broker**  
   - `ApprovalRequest`/`ApprovalDecision` with channel-based broker.
   - TUI modal: `a` allow once, `s` allow session, `d`/Esc deny.
   - Non-interactive (CLI) sessions are fail-closed.
   - Blocked actions are tracked; a turn with any denied action reports failure.

4. **Parallel read-only tool execution**  
   - Tools classified as ReadOnly / Mutation / Command.
   - Independent reads run concurrently via `std::thread::scope` (bounded by
     `MAX_PARALLEL_TOOLS`).
   - Mutations and commands remain strictly sequential.
   - Results always return in the model's original call order.

5. **`tool_choice` + capability filtering**  
   - `ToolChoice` enum: Auto, None, Required, Function(name).
   - Serialized in OpenAI format on ChatRequest/CloudChatRequest/CloudStreamRequest.
   - Router strips tools from models the catalog reports as non-tool-calling.
   - Pending verification forces `Required` so the model cannot answer before
     running the gate.

6. **Unified orchestration**  
   - Removed orphan `FallbackChain` agent path (`run_agent_loop_with_fallback`,
     `execute_step_inner_chain`, `plan_task_with_chain`).
   - Single typed loop + planner fallback; router handles provider fallback
     preserving messages, tools, IDs, and finish reason.

7. **Limits calibrated to GLM-5.2 via NIM**  
   | Parameter | Value | Rationale |
   |---|---|---|
   | MAX_TOOL_ITERATIONS | 128 | Matches 128K output budget |
   | MAX_TOOL_OUTPUT_BYTES | 100,000 | ~25K tokens; ≤10% of context per call |
   | MAX_CONTEXT_TOKENS | 128,000 | NIM effective context |
   | Output tokens/turn | 16,384 | NIM provider cap |
   | COMMAND_TIMEOUT_SECS | 600 | Long-horizon tasks |
   | MAX_RETRIES | 5 | Good self-correction rate |
   | MAX_PARALLEL_TOOLS | 4 | Bounded NIM fan-out |

8. **Protocol normalization**  
   - `ChatCompletion` carries typed `tool_calls: Vec<ToolCall>` separate from
     `content` and `finish_reason`.
   - `ToolCallFunction.arguments` deserializes both string and object forms.
   - Temporary compatibility: if typed `tool_calls` is empty, falls back to
     parsing assistant content as JSON array.

9. **Prompt contract** (`prompts/coder.txt`)  
   - Oriented to GLM-5.2's strengths: batch read-only calls, prefer
     `replace_exact`, run verification after every mutation, report honestly.
   - Harness appends metadata (changed files, diff, verification); model need
     not repeat it.

## Consequences

- GLM-5.2 smoke tests pass end-to-end (edit + gate + rollback).
- Failed turns never leave partial modifications in the workspace.
- `ask` policy is genuinely interactive in TUI and fail-closed in CLI.
- Read-only tools run ~4× faster on batched calls.
- Models without tool calling fall back cleanly to the planner path.
- The orphan FallbackChain code path is gone; one less maintenance surface.
- Remaining gaps: MCP client, streaming tool deltas, cost tracking, CI pipeline.
