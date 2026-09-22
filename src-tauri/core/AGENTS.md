# AGENTS.md

This file lists all the index.md files created in the src directory and its subdirectories, providing a map of where documentation for each module can be found.

## Architecture Design Pattern (Binding — August 2026)

The ChronoKairo harness follows a layered architecture derived from the union of three leading 2026-era coding agent architectures:

| Layer | Reference Harness | Core Abstraction |
|-------|-------------------|------------------|
| **Tool Layer** | Claude Code | Single `Tool` trait: `schema() + execute() + effect_class + approval_gate`. Registry replaces stringly-typed `match` dispatch. MCP tools wrapped identically. |
| **Loop Layer** | Claude Code | Pure while-loop orchestration with 7-phase pipeline per tool call: validate → pre-hooks → permission → execute → post-hooks → concurrency scheduler → context update. Typed state machine (`ToolLoopOutcome`, `VerificationAction`). |
| **Core↔UI Decoupling** | Codex CLI | Queue-pair protocol: `Op` (client→core) / `EventMsg` (core→client) over async channels. Core runs as `Session { submit(Op), next_event() }`. UI/headless/app-server/MCP-server are consumers of the same event stream. |
| **State Layer** | OpenHands V1 | Append-only typed event log as single source of truth. `ActionEvent`/`ObservationEvent` replace `(role,content)` vectors. Deterministic replay, pause/resume, condenser. (Incremental adoption; current `(role,content)` history persists alongside.) |
| **Transactional Layer** | ChronoKairo (unique) | Per-turn workspace snapshot → diff → rollback/keep. Verification gate after mutations with repair budget. |

### Module Target Layout (Refactoring Goal)

```
src/
├── protocol/          # Queue-pair: Op/EventMsg, Session(submit/next_event)
├── app_server/        # JSON-RPC 2.0 stdio server (Codex app-server pattern)
├── agent/
│   ├── loop.rs        # Pure orchestration loop
│   ├── tool_registry.rs # Tool trait + registry (replaces execute_tool match)
│   ├── verify.rs      # Verification gate + repair loop
│   ├── finalize.rs    # Transaction finalization + adversarial review
│   ├── subagent.rs    # task tool / sub-agent spawning
│   ├── planner.rs     # Plan generation
│   ├── state.rs       # AgentState (kept)
│   └── tool_defs.rs   # Tool schemas as data
├── mcp/
│   ├── client.rs      # Existing client (kept)
│   └── server.rs      # MCP server exposing harness as tools
├── ui/                # TUI consumer of protocol Session (hooks bridge)
├── terminal/          # Web terminal (kept)
└── ...                # Other modules (kept)
```

### Key Invariants

1. **Single tool interface** — Every capability (native or MCP) implements `Tool { schema, execute, effect_class, is_concurrency_safe, requires_approval }`.
2. **Protocol is the boundary** — No direct hooks from TUI into core loop. The TUI uses a hooks→protocol bridge. `codex exec`, `app-server`, `mcp-server` all drive the same `Session`.
3. **Approval via protocol** — `Op::ExecApproval` / `Op::PlanApproval` route decisions to blocked callbacks. Plan mode adds `PlanApprovalRequest` event.
4. **Event log is canonical** — All state mutations produce typed events. History reconstruction never loses tool calls.
5. **Transactionality is local** — Workspace snapshot/rollback lives in `tools/transaction.rs`; loop layer treats it as opaque gate.
6. **Zero-Lib Policy (Std-First)** — NO new external crates may be added to `Cargo.toml`. All context engines, markdown parsers, protocol adapters, and linters must be built exclusively with Rust's standard library (`std::*`) and existing primitives. This guarantees fast compilation, minimal binary size, zero dependency bloat, and total resilience against supply-chain attacks.

### Migration Checklist (Do Not Skip)

- [x] Add `protocol` crate with `Op`, `EventMsg`, `Session`.
- [x] Add `on_plan_approval` to `AgentHooks`, gate in `run_planner_fallback`.
- [x] `exec` subcommand (human/JSONL).
- [x] `app-server` subcommand (JSON-RPC stdio).
- [x] `mcp-server` subcommand (MCP server with `run_coder` tool).
- [x] Split `agent_loop.rs` into `loop.rs` + `tool_registry.rs` + `verify.rs` + `finalize.rs` + `subagent.rs`.
- [x] Replace `execute_tool` match with registry dispatch.
- [x] Event-log persistence & canonical replay in `protocol/event_log.rs`.
- [x] Sandbox real e policy engine em `tools/sandbox.rs`.
- [x] Patch merging unificado e robusto em `tools/patch.rs`.
- [x] TUI consumes `Session` via hooks bridge (not direct `run_agent_loop_with_hooks`).

## Documentation Index

- [`src/index.md`](src/index.md) - Overview of the src directory
- [`src/agent/index.md`](src/agent/index.md) - Documentation for the agent module
- [`src/compressor/index.md`](src/compressor/index.md) - Documentation for the compressor module
- [`src/config/index.md`](src/config/index.md) - Documentation for the config module
- [`src/hw_recommend/index.md`](src/hw_recommend/index.md) - Documentation for the hardware recommendation module
- [`src/llm/index.md`](src/llm/index.md) - Documentation for the LLM module
- [`src/llm/infer/index.md`](src/llm/infer/index.md) - Documentation for the LLM inference submodule
 - [`src/bench/index.md`](src/bench/index.md) - Documentation for benchmarking utilities
 - [`src/memory/index.md`](src/memory/index.md) - Documentation for memory subsystems
- [`src/repo/index.md`](src/repo/index.md) - Documentation for repository helpers
- [`src/skills/index.md`](src/skills/index.md) - Documentation for the skills system
- [`src/tools/index.md`](src/tools/index.md) - Documentation for tooling helpers
- [`src/types/index.md`](src/types/index.md) - Documentation for shared types

Each index.md file contains a list of files in that directory with brief descriptions of their purpose.

## Architectural Decision Records (ADRs)

- [`docs/adr/0001-llm-router.md`](docs/adr/0001-llm-router.md) — Route LLM traffic through a runtime LlmRouter
- [`docs/adr/0002-harness-parity-glm52.md`](docs/adr/0002-harness-parity-glm52.md) — Harness Parity (GLM-5.2)
- [`docs/adr/0003-resilient-routing.md`](docs/adr/0003-resilient-routing.md) — Resilient Routing: Same-Tier Fallback, Backoff & Error Surfacing
- [`docs/adr/0004-project-context-and-workspace-structure.md`](docs/adr/0004-project-context-and-workspace-structure.md) — Project Context Auto-Loading & Workspace Directory Discovery
- [`docs/adr/0005-token-usage-tracking.md`](docs/adr/0005-token-usage-tracking.md) — Token Usage & Cost Tracking Per Turn
- [`docs/adr/0006-line-range-code-editing.md`](docs/adr/0006-line-range-code-editing.md) — Line-Range Code Editing (`edit_file`)
- [`docs/adr/0007-gguf-safety-and-bounds-checking.md`](docs/adr/0007-gguf-safety-and-bounds-checking.md) — GGUF & Dequantization Memory Safety
- [`docs/adr/0008-robustness-and-floating-point-safety.md`](docs/adr/0008-robustness-and-floating-point-safety.md) — Robustness, Floating Point Safety & Store Key Masking
- [`docs/adr/0009-context-intelligence-and-repo-map.md`](docs/adr/0009-context-intelligence-and-repo-map.md) — Context Intelligence, Calibrated Token Estimation & Repo Map
- [`docs/adr/0010-benchmark-module-refactoring.md`](docs/adr/0010-benchmark-module-refactoring.md) — Benchmark Module Refactoring (Local / Cloud Split)
- [`docs/adr/0011-sub-agent-task-tool.md`](docs/adr/0011-sub-agent-task-tool.md) — Sub-Agent Task Tool (`task`)
- [`docs/adr/0012-mcp-client.md`](docs/adr/0012-mcp-client.md) — MCP Client (Model Context Protocol, stdio)
- [`docs/adr/0013-streaming-tool-call-deltas.md`](docs/adr/0013-streaming-tool-call-deltas.md) — Streaming Tool Call Deltas
- [`docs/adr/0014-circuit-breaker.md`](docs/adr/0014-circuit-breaker.md) — Provider Health Checks & Circuit Breaking
- [`docs/adr/0015-competitive-backlog.md`](docs/adr/0015-competitive-backlog.md) — Competitive Backlog (C1–C9, R1–R3)
- [`docs/adr/0016-vision-gap-analysis.md`](docs/adr/0016-vision-gap-analysis.md) — Vision Gap Analysis (2026-08-08)
- [`docs/adr/0017-specification-locked-execution.md`](docs/adr/0017-specification-locked-execution.md) — Specification-Locked Execution (v0.9.5)
- [`docs/adr/0018-versioned-h-battery-and-tool-resilience.md`](docs/adr/0018-versioned-h-battery-and-tool-resilience.md) — Versioned H-Battery & Resilient Tool Protocol (v0.9.5)
- [`docs/adr/0019-provider-native-model-catalog.md`](docs/adr/0019-provider-native-model-catalog.md) — Provider-Native Model Catalog
- [`docs/adr/0020-rebrand-chronokairo-ckc.md`](docs/adr/0020-rebrand-chronokairo-ckc.md) — ChronoKairo Rebranding and CKC Binary Transition
- [`docs/adr/0021-ckc-pull-local-gguf-models.md`](docs/adr/0021-ckc-pull-local-gguf-models.md) — Local GGUF Model Pulling and Resolution (`ckc pull`)
- [`docs/adr/0022-local-model-lifecycle-management.md`](docs/adr/0022-local-model-lifecycle-management.md) — Local GGUF Model Lifecycle Management (`rm`, `show`, `cp`, `ps`, `run`)
- [`docs/adr/0023-ollama-model-discovery-and-provider-removal.md`](docs/adr/0023-ollama-model-discovery-and-provider-removal.md) — Local Ollama Model Discovery and Zero-Lib Provider Decoupling
- [`docs/adr/0024-edit-inspired-harness-enhancements.md`](docs/adr/0024-edit-inspired-harness-enhancements.md) — Microsoft Edit-Inspired Harness Enhancements (Zero-Lib)
- [`docs/adr/0025-edit-full-zerolib-coverage.md`](docs/adr/0025-edit-full-zerolib-coverage.md) — Microsoft Edit-Inspired Full Zero-Lib Coverage
- [`docs/adr/0026-tui-edit-ux.md`](docs/adr/0026-tui-edit-ux.md) — Microsoft Edit Immediate-Mode TUI Experience & Zero-Warning Clean Architecture
- [`docs/gap-analysis-2026-08.md`](docs/gap-analysis-2026-08.md) — 2026 Competitor Gap Analysis Report
- [`docs/gap-analysis-vision-2026-08.md`](docs/gap-analysis-vision-2026-08.md) — Vision vs. Codebase Gap Analysis (synthesis)
- [`docs/explore-report-01-llm-routing-inference.md`](docs/explore-report-01-llm-routing-inference.md) — Explore report: LLM routing & local inference layer
- [`docs/explore-report-02-context-memory-caching.md`](docs/explore-report-02-context-memory-caching.md) — Explore report: context, memory & caching layer
- [`docs/explore-report-03-agent-tools-validation-security.md`](docs/explore-report-03-agent-tools-validation-security.md) — Explore report: agent loop, tools, validation & security
