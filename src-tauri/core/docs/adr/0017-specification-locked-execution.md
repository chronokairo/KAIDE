# ADR 0017 — Specification-Locked Execution (v0.9.5)

- **Status:** Accepted (2026-08-23)
- **Version:** v0.9.5
- **Supersedes (partially):** ADR-0009 context intelligence; refines the Contract-Guard portion of the v0.9.4 work
- **Related evidence:** `bench/results/e2e-20260823.md` — Hidden Battery H1/H2/H3

## Context

The v0.9.4 hidden battery (H1/H2/H3) revealed that the most dangerous failure mode of small local models is **not** incapacity — it is *silently redefining the requested API and then validating its own reinterpretation*:

| Task | Observed drift | Why v0.9.4 missed it |
|------|----------------|----------------------|
| **H1** | `cancel_order(...) -> Result<(), String>` became `-> Option<Order>` | Return-type drift not compared; model wrote tests confirming its own wrong API (`cargo test ✅`) |
| **H2** | `age` placed on `UserService::new(age: u8)` instead of `User::new(..., age: u32)` | Parameter-placement and baseline-API drift not checked |
| **H3** | `checkout(&mut self) -> Result<Buffer, String>` reinterpreted as `checkout(&mut self, index: usize) -> &Buffer` | Full-signature comparison absent; per-param line heuristic only |

Two structural defects enabled this:

1. **The contract was derived from mutable session context.** `executor.rs` extracted `TaskContract` from `state.session.get_context()` at every write — a source that is compacted, summarized, interleaved with reasoning, and rewritten mid-turn. Repair #4 could receive a different contract than the planner saw.
2. **The model graded its own exam.** Acceptance behavior was checked by tests the model itself wrote *after* implementing, producing the classic false positive `wrong implementation + wrong tests = cargo test ✅`.

## Decision

### 1. The spec is compiled once per turn and becomes immutable

```text
RAW USER TASK → Spec Compiler → immutable TaskSpec (Arc)
                                   ├── raw_task        (verbatim original task)
                                   ├── contract        (TaskContract: signatures + type invariants + behavior notes)
                                   ├── baseline        (every pre-existing repo signature at turn start)
                                   └── oracle          (locked acceptance tests, written before implementation)
```

- `TaskSpec::compile_task_spec` runs once in `run_agent_loop_with_hooks`, immediately after the workspace snapshot.
- Stored as `state.task_spec: Option<Arc<TaskSpec>>`; planner, coder, repair and verification all read this frozen copy.
- All `state.session.get_context()` contract extraction sites are removed.

### 2. Deterministic signature gate BEFORE compilation and before any disk write

`TaskSpec::check_patch(code, file)` enforces two rules with a real signature parser (multi-line signatures, generics with nested commas, receiver kinds):

- **Rule 1 — Required API exactness:** any occurrence of a required method name must match the required signature exactly: parameter count, names, placement/order, types, receiver kind, return type.
- **Rule 2 — Baseline preservation:** any pre-existing method whose signature the patch silently changes is rejected unless the contract explicitly redefines that exact shape. Drift messages include the required placement from the contract (e.g. ``User::new(name: String, age: u32) -> User``).

This kills H1/H2/H3-style drift *before* `cargo check`, let alone `cargo test`.

### 3. The model never writes its own exam

When the contract contains explicit API material, one LLM call synthesizes an **acceptance oracle** (integration test file under `tests/chronokairo_oracle_<nanos>.rs`) *before implementation starts*. The file is:

- written inside the turn transaction (rollback cleans it up);
- registered in `state.locked_paths`;
- refused on every mutation path (`write_file`/`edit_file`/`replace_exact`/`multi_edit_file` tool calls and planner-driven writes) with an `ORACLE LOCKED` message;
- referenced by repair prompts via a directive explaining that diagnostics pointing into the oracle mean the *implementation* must change.

Verification success now implicitly requires passing the locked behavioral tests.

### 4. The harness judges; the model synthesizes

No "LLM judge" pass. Every enforced requirement maps to a deterministic checker:

| Requirement | Checker |
|---|---|
| signature exactness | `spec::check_patch` Rule 1 (parser comparison) |
| existing-API preservation | `spec::check_patch` Rule 2 (baseline diff) |
| symbol existence | `semantic_guard` (RepoMap) |
| behavior | locked acceptance oracle + `cargo test` |
| compilation / lint / regression | rustc / clippy / existing tests |

Behavioral requirements found verbatim in the task ("somente Pending pode ser cancelado…") are extracted as `behavior_notes` and rendered into prompts and into the oracle-synthesis prompt; enforcement of them is the oracle's job, not an LLM's opinion.

### 5. Configuration

- `SPEC_LOCK` (default `true`) — master switch for the immutable per-turn spec.
- `SPEC_ORACLE` (default `true`) — generate the locked acceptance oracle when explicit signatures exist. Degrades gracefully (turn proceeds without oracle if synthesis or write fails).

## Consequences

**Positive**

- H1/H2/H3-class drift is structurally impossible to reach disk.
- Self-referential validation ("model grades itself") is eliminated for tasks with explicit contracts.
- The experimental story stays honest: specification understanding vs. repository understanding vs. language problem-solving become separable axes (T6H borrow-checker failures remain a genuine capability limit, not a spec-compliance failure).

**Negative / accepted costs**

- One extra LLM call per turn (oracle synthesis) when explicit signatures exist.
- Strict param-name equality can over-constrain legitimate internal renames; `_` wildcards are tolerated, everything else must match the task text. This is intentional: the task is law.
- The signature parser is heuristic (brace-depth owner attribution); exotic Rust may need parser extensions. Generated-code shapes are well within its coverage.

## Revision of the v0.9.4 record

Per the H-battery data, the earlier blanket claim "Contract Guard ✅" is corrected in `bench/results/e2e-20260823.md` to:

> Symbol Guard ✅ / Contract Enforcement ⚠️ incomplete

Interceptions achieved in v0.9.4: invented symbols ✅, primitive type grounding ✅.
Not intercepted: return-type drift ❌, parameter placement ❌, semantic state-transition reinterpretation ❌ — all addressed by this ADR.
