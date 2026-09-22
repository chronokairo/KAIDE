# ADR 0012 — MCP Client (Model Context Protocol)

**Status:** Accepted  
**Date:** 2026-08-03  
**Author:** Antigravity + Luan  

## Context

The ChronoKairo agent has a fixed set of 12 built-in tools. All 2026 leaders (Claude Code, Antigravity, Cursor, Codex) support the Model Context Protocol (MCP) to dynamically load tools from external servers (GitHub, databases, Jira, etc.). Without MCP, ChronoKairo cannot extend its toolset without code changes.

## Decision

1. **New module `src/mcp/mod.rs` with `McpClient`:**
   - Spawns a child process (`Command::new`) with piped stdin/stdout.
   - Sends JSON-RPC 2.0 messages over stdio.
   - Implements `initialize`, `tools/list`, and `tools/call` methods.
   - `McpServerConfig` holds `command`, `args`, `env`.

2. **Config integration (`src/config/settings.rs`):**
   - Added `mcp_servers: Vec<McpServerConfig>` to `Config`.
   - Defaults to `Vec::new()`.

3. **State integration (`src/agent/state.rs`):**
   - Added `mcp_clients: Vec<McpClient>` to `AgentState`.
   - Initialized in `new()` as empty vec.
   - `Clone` impl resets `mcp_clients: Vec::new()` (sub-agents don't inherit MCP connections).

4. **Tool registry integration (`src/agent/agent_loop.rs`):**
   - `coding_tools(state: &mut AgentState)` now accepts state and iterates over `mcp_clients` to call `list_tools()`, extending the built-in tool list.
   - `connect_mcp_clients(state)` called at the start of `run_agent_loop_with_hooks` to spawn all configured MCP servers.
   - `try_mcp_tool(state, tc)` added as fallback in `execute_tool()` for unrecognized tool names — iterates MCP clients and calls `call_tool()`.

5. **Module registration (`src/main.rs`):**
   - Added `mod mcp;`.

## Consequences

- Tools from MCP servers are dynamically merged into the LLM tool definitions.
- MCP tools are classified as `Command` by default in `tool_effect()`, so they run sequentially.
- 173 tests pass, including `try_mcp_tool_returns_none_when_no_mcp_clients` and `mcp_server_config_*` tests.
- Initial implementation covers stdio transport only; future work could add SSE/WebSocket transports.
