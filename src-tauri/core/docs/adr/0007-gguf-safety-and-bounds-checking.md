# ADR 0007 — GGUF & Dequantization Memory Safety

**Status:** Accepted  
**Date:** 2026-08-02  
**Author:** Antigravity + Luan  

## Context

The GGUF parsing and dequantization module (`src/llm/infer/gguf.rs` & `src/llm/infer/model.rs`) had four memory safety vulnerabilities:
1. **`unsafe transmute` on untrusted integer (`TODO #4`)**: `std::mem::transmute::<i32, GgmlType>(ty_i)` converted untrusted integer values into enum variants. An invalid integer caused undefined behavior.
2. **Unchecked slice parsing panics (`TODO #5`)**: Reader helpers (`read_u16`, `read_u32`, `read_string`, etc.) used `unwrap()` on slice conversions without bounds checking. Truncated or corrupt GGUF headers caused thread panics.
3. **Dequantization panics (`TODO #6`)**: `dequantize_q4_0_row`, `dequantize_q8_0_row`, and `dequantize_f16_row` indexed into slice buffers with `.unwrap()`. Corrupt tensor data caused panics.
4. **Out-of-bounds `tensor_data` access (`TODO #7`)**: `tensor_data` did not check `start + nbytes <= data.len()`, risking out-of-bounds panics or slices on malformed offsets.

## Decision

1. **Implement `TryFrom<i32>` for `GgmlType` (`src/llm/infer/gguf.rs`):**
   - Replaced `unsafe transmute` with safe `TryFrom<i32>` matching all valid GGUF tensor type IDs. Returns `anyhow::Error` for unknown type IDs.

2. **Bounds-Checked Binary Reader (`src/llm/infer/gguf.rs`):**
   - Implemented `read_bytes(pos, len) -> Result<&[u8]>` with overflow-checked addition and explicit EOF errors.
   - Converted all `read_*` methods to return `Result<T>`.

3. **Safe Tensor Data Slicing (`src/llm/infer/gguf.rs`):**
   - `tensor_data()` uses `checked_add` and `checked_mul` and verifies `end <= self.data.len()`, returning `None` on invalid offsets.

4. **Safe Row Dequantization (`src/llm/infer/model.rs`):**
   - `dequantize_q4_0_row`, `dequantize_q8_0_row`, and `dequantize_f16_row` check block slice boundaries before accessing elements and guard against out-of-bounds writes to `out`.

## Consequences

- The GGUF inference engine is memory-safe against corrupted, malicious, or truncated GGUF files.
- Eliminates undefined behavior and panics during local GGUF model loading.
- Added unit tests in `src/llm/infer/gguf.rs` testing `TryFrom<i32>` validation and truncated GGUF file handling.
