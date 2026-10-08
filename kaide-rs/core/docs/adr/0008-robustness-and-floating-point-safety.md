# ADR 0008 — Robustness, Floating Point Safety & Store Key Masking

**Status:** Accepted  
**Date:** 2026-08-02  
**Author:** Antigravity + Luan  

## Context

Four code quality and robustness issues were identified during audit:
1. **NaN Panics on `partial_cmp().unwrap()` (`TODO #10 & #11`)**: `models_dev/client.rs` and `engine.rs` sorted candidates using `partial_cmp().unwrap()`. If a cost or logit contained `NaN`, the thread panicked.
2. **Double I/O on GPU Detection (`TODO #21`)**: `detect_gpu_nvidia` in `hw_recommend/detector.rs` read `/proc/driver/nvidia/gpus/0/information` twice.
3. **Short Key Masking Exposure (`TODO #23`)**: `mask_key("ab")` in `providers/store.rs` returned `"ab****"`, exposing short keys.

## Decision

1. **Floating-Point Comparison Safety (`src/models_dev/client.rs` & `src/llm/infer/engine.rs`):**
   - Replaced all `.partial_cmp().unwrap()` calls with `.partial_cmp().unwrap_or(std::cmp::Ordering::Equal)`.

2. **Single-Read GPU Info Detection (`src/hw_recommend/detector.rs`):**
   - Refactored `detect_gpu_nvidia()` to read `/proc/driver/nvidia/gpus/0/information` once into an `info` string and parse both model name and VRAM from it.

3. **Complete Short Key Masking (`src/providers/store.rs`):**
   - Keys $\le 4$ characters are completely masked as `"****"`.
   - Keys $> 4$ characters show at most $\min(4, \text{len}/2)$ prefix characters followed by asterisks.

## Consequences

- Completely eliminates potential thread panics caused by `NaN` float comparisons during model resolution or top-K sampling.
- Reduces system call overhead during hardware recommendation scanning.
- Ensures short API keys are never leaked in terminal logs or status displays.
- All 161 unit tests pass cleanly.
