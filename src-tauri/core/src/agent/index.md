# src/agent directory

This directory contains the agent-related modules.

## Files

- `agent_loop.rs` - Legacy monolithic agent loop orchestration
- `executor.rs` - Executes the agent's actions
- `finalize.rs` - Transaction finalization and post-turn review
- `loop.rs` - Pure 7-phase orchestration loop with typed state machine (`ToolLoopOutcome`)
- `mod.rs` - Module definition for the agent
- `planner.rs` - Plans the agent's next steps
- `semantic_guard.rs` - Semantic prompt boundaries and guard checks
- `state.rs` - Holds the agent's state
- `subagent.rs` - Isolated subagent sessions with depth limits and sub-event logs
- `tool_registry.rs` - Universal `Tool` trait and registry dispatch
- `verify.rs` - Deterministic verification gate and repair loop (`VerificationGate`, `VerificationAction`)