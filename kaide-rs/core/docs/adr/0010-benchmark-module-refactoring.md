# ADR 0010 — Benchmark Module Refactoring (Local / Cloud Split)

**Status:** Accepted  
**Date:** 2026-08-02  
**Author:** Antigravity + Luan  

## Context

The `bench` module contained a single `model_bench.rs` file that handled both local GGUF inference benchmarking and cloud provider benchmarking. This caused two problems:

1. **Result Overwrite (`TODO #31`)**: Local and cloud benchmark results were saved to the same JSON file via `save_ranking()`, making it impossible to compare local vs cloud performance without manual file separation.
2. **Mixed Concerns**: Local benchmarking requires GGUF model loading, hardware detection, and inference engine execution. Cloud benchmarking requires provider chain construction, API key handling, and async HTTP execution. Keeping both in one file created unnecessary coupling and compile-time dependencies.

## Decision

1. **Split `model_bench.rs` into `local.rs` and `cloud.rs`**:
   - `src/bench/local.rs`: Contains `benchmark_model()` and `rank_models()` for local GGUF inference benchmarking.
   - `src/bench/cloud.rs`: Contains `benchmark_cloud_model()` and `rank_cloud_models()` for cloud provider benchmarking via `FallbackChain`.

2. **Retain `model_bench.rs` as a shared-types module**:
   - Keeps `BenchResult` struct definition.
   - Exposes `pub(crate)` helpers (`names_match`, `estimate_tps_from_catalog`, `BenchResult::error`) used by both `local.rs` and `cloud.rs`.

3. **Update `mod.rs` exports**:
   - Added `pub mod local;` and `pub mod cloud;`.

4. **Made shared helpers `pub(crate)`**:
   - `error`, `names_match`, and `estimate_tps_from_catalog` changed from private to `pub(crate)` so both submodules can use them without making them part of the public API.

## Consequences

- Local and cloud benchmarks can now save to separate output files, fixing the overwrite issue.
- `main.rs` can be updated to call `bench::local::rank_models()` and `bench::cloud::rank_cloud_models()` independently.
- Reduces cognitive load: each file has a single responsibility.
- Future cloud providers can be added to `cloud.rs` without touching local inference code.
- All existing unit tests continue to pass.
