# ADR 0011 — Sub-Agent Support (Task tool)

**Status:** Accepted  
**Date:** 2026-08-03  
**Author:** Antigravity + Luan  

## Context

The ChronoKairo agent loop is strictly sequential — a single `AgentState` runs one turn at a time. For complex multi-file refactoring or research tasks, this wastes turns and tokens because the agent has to juggle sub-tasks in-context. All 2026 leaders (Claude Code, Antigravity, Cursor) support sub-agents for isolated task execution.

## Decision

1. **Implement `task` tool in `coding_tools()` (`src/agent/agent_loop.rs`):**
   - Accepts `task` (required string) and optional `model` (string).
   - Spawns a sub-agent in a new `std::thread` with its own `tokio::runtime::Runtime`.

2. **Isolated sub-agent state via `Clone`:**
   - `AgentState::clone()` resets `retries`, `repair_attempt`, `last_test_output`, `verification`, `changed_files`, `blocked_actions`, `last_diff`, `transaction`, `dirty`.
   - Shares `config`, `files`, `git`, `caveman`, `long_memory` (new DB connection), `session` (cloned history).
   - Required adding `Clone` to `Config`, `WorkspaceTransaction`, `FileTools`, `GitTools`, `ShortTermMemory`, `LongTermMemory`.

3. **Result capture via `mpsc::channel`:**
   - Sub-agent `AgentHooks` captures `AgentEvent::Done` or `AgentEvent::Failed` and sends `(message, success)` through channel.
   - Parent blocks on `rx.recv_timeout(Duration::from_secs(300))`.

4. **Wired into `execute_tool()` and `execute_tool_calls()`:**
   - `execute_tool` now takes `&LlmRouter` to allow sub-agent to use the same router.
   - Updated all call sites and tests.

## Consequences

- The parent agent can delegate isolated tasks without polluting its session.
- Sub-agent runs in `AgentMode::Agent` with full tool access.
- Initial depth=1 (no nested sub-agents yet).
- 170 tests pass, including `task_tool_spawns_sub_agent`.
