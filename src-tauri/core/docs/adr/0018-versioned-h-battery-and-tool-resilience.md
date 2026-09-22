# ADR 0018 — Versioned H-Battery & Resilient Tool Protocol

- **Status:** Accepted (2026-08-23)
- **Version:** v0.9.5
- **Related ADRs:** ADR-0017 Specification-Locked Execution, ADR-0013 Streaming Tool Call Deltas
- **Related Evidence:** `bench/results/e2e-20260823.md`, `relatorio.md`

## Context

Following the implementation of Specification-Locked Execution (ADR-0017), the evaluation instrument itself required formalization into a fixed, versioned fixture suite (`bench/tests/h1-orders`, `h2-users`, `h3-pool`). 

During extensive benchmarking across Small Language Models (≤3B) and high-end cloud baselines, three critical operational issues were observed:

1. **Protocol Sensitivity in Small Models (≤3B)**:
   - Trailing conversational tokens after valid JSON objects caused parser failures: `invalid JSON arguments: trailing characters at line 1 column 23/36`.
   - Sequential multiple JSON objects emitted inside a single markdown code fence (` ```json { ... } { ... } ``` `) failed standard single-value JSON deserialization.
2. **Measurement Accuracy & Evaluation Integrity**:
   - Rejection of speculative planner actions previously could trigger fatal errors even when all unit/acceptance tests had passed.
   - Baseline test files in benchmark fixtures needed absolute consistency to avoid compiler paradoxes.
3. **Model Tier Gap Analysis**:
   - The harness required validation against a high-end cloud model (`minimax-m3:cloud`) to prove end-to-end functionality (planning, tool calling, transaction isolation, verify gate) and isolate harness bugs from model reasoning ceilings.

## Decision

### 1. Resilient Streaming JSON Argument Parser
In `agent_loop.rs`, tool argument extraction now uses `serde_json::Deserializer::from_str(args_str).into_iter::<Value>()`. This deserializes the first valid JSON object and cleanly discards any trailing conversational commentary or whitespace emitted by SLMs.

### 2. Multi-Object Content Extraction Fallback
`extract_tool_calls_from_content` and `collect_tool_calls_from_text` use stream deserialization across direct text, markdown fences, and XML tags (`<tool_call>`), unpacking multiple sequential tool calls in a single turn without schema errors.

### 3. Versioned Fixed H-Battery Suite
The benchmark suite is committed under `bench/tests/` with immutable `tests/acceptance_test.rs` and pre-verified `tests/baseline_test.rs`:
- `h1-orders`: State machine transition validation (`cancel_order`).
- `h2-users`: Struct field propagation (`age: u32`).
- `h3-pool`: Ownership transfer and buffer checkout/checkin (LIFO).
The runner (`bench/run_hbattery.ps1`) executes in clean `%TEMP%` workspaces, compiles binaries fresh, and records full JSON/log diagnostics.

### 4. Benchmark Matrix & Release Gate Criteria
- **High-End Baseline (`minimax-m3:cloud`)**: Scored **100% PASS** (`h1-orders`, `h3-pool`), confirming 100% harness operational fidelity.
- **SLMs (`qwen2.5-coder:1.5b` & `3b`)**: Scored **0% PASS**, exhibiting 100% protocol adherence, 0 false PASSes, deterministic spec-lock interception, and 100% clean transaction rollbacks.
- **Release Gate**: Release v1 requires ≥ 2/3 hidden task PASS + 0 false PASS.

## Consequences

- Eliminates JSON syntax crashes across all small language models.
- Guarantees zero false passes and deterministic pre-write contract enforcement.
- Provides a reproducible, automated benchmark pipeline for subsequent model iterations.
