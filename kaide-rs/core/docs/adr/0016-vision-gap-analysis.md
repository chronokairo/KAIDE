# ADR 0016 — Vision Gap Analysis (2026-08-08)

**Status:** Accepted  
**Date:** 2026-08-08  
**Author:** Luan

## Context

The product vision document (local-first runtime for coding agents: router, context engine, categorized memory, local SLM workers, hardware-aware and cost-aware routing, validation gates, caching, escalation ladder, observability) was compared against the actual codebase. Three exploration reports were produced (`docs/explore-report-01-llm-routing-inference.md`, `docs/explore-report-02-context-memory-caching.md`, `docs/explore-report-03-agent-tools-validation-security.md`) and synthesized in `docs/gap-analysis-vision-2026-08.md`.

The comparison reveals that the codebase is a fully functional standalone coding harness, but many vision capabilities are either missing, partial, or detached from the runtime.

## Decision

Record the vision-vs-codebase gap status as of 2026-08-08 and accept the following top 5 priorities as the implementation direction:

### Implemented (with the vision)

| Vision pillar | Status | Notes |
|---|---|---|
| Core runtime, model abstraction, Ollama, local discovery, tool execution, git, MCP client/server | ✅ | Local foundation complete |
| Validation gates (tests, lint, build-check, repair loop, adversarial review) + workspace transactions | ✅ | Strongest area |
| Persistent sessions + resume, vector memory (`memory_search`) | ✅ | Partial: brute-force search, indexing opt-in |
| Deterministic compression (layer1) | ✅ | Only planner/executor path; layer2 dead |

### Partial (exists but detached or incomplete)

| Vision pillar | Status | Notes |
|---|---|---|
| Local SLM workers | ⚠️ | Fixed roles only (planner/coder/summarizer); no worker abstraction; no error-analysis/patch-gen/code-explain |
| Hardware-aware inference | ⚠️ | `hw_recommend` works but is CLI/bench-only, Linux-only; never consulted by the router |
| Cost-aware routing | ⚠️ | Cost priced + tracked per turn; never a routing input |
| Model fallback / escalation | ⚠️ | Same-tier cloud fallback + retry exist; `FallbackChain`/`CircuitBreaker` built but wired only into benchmarks; no local↔remote escalation |
| Security | ⚠️ | Strong path containment + approval; `allowed_commands` default `"*"`, relative-traversal gap, no sandbox/audit log, MCP auto-approves |

### Missing

| Vision pillar | Status |
|---|---|
| Task classification / intent extraction (deterministic → local → remote triage) | ❌ |
| Minimal-relevant context selection (`repo/context.rs` is empty) | ❌ |
| Tree-sitter / LSP symbol indexing | ❌ |
| File summaries | ❌ |
| Categorized long-term memory (architecture/decisions/conventions/failures/fixes/dependencies/summaries) | ❌ (`save_decision` dead; no `memory_save` tool) |
| Caching (repo analysis, symbols, summaries, embeddings, tests, errors, responses, context) | ❌ |
| Complexity estimation / confidence scoring | ❌ |
| Per-task observability metrics (route, model, latency, validation, files_changed) | ❌ |
| Minimal-diff enforcement / regression detection | ❌ |
| Granular MCP capability tools (`chronokairo.context`, `search`, `memory`, `review`, `validate`, `escalate`) | ❌ (only `run_coder`) |
| vLLM / llama.cpp-server integration | ❌ |
| A2A interoperability | ❌ (deferred per vision) |

## Consequences

- **Accepting ADR 0016** does not commit to any single implementation; it anchors the roadmap to the five priorities recorded in `docs/gap-analysis-vision-2026-08.md`:
  1. `repo/context.rs` minimal-context selection + persistent repo map / symbol cache.
  2. Task classifier routing (deterministic / local / remote).
  3. Wire `FallbackChain` / escalation into the runtime router.
  4. Cost as a routing signal + per-task metrics persistence.
  5. Categorized memory (decisions/failures/fixes) with a `memory_save` tool.
- The three exploration reports and the synthesis remain authoritative references for future ADRs implementing each priority.
- `TODO.md` gains a "Vision Gap Analysis (2026-08-08)" section referencing this ADR and the reports.
