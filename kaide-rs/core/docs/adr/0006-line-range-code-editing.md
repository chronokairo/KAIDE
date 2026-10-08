# ADR 0006 — Line-Range Code Editing (`edit_file` / `multi_edit_file`)

**Status:** Accepted  
**Date:** 2026-08-02  
**Author:** Antigravity + Luan  

## Context

The agent harness previously supported only `write_file` (full file overwrite) and `replace_exact` (exact string match anywhere in the file). This caused model editing failures in real-world benchmarks (SWE-bench / LiveCodeBench) due to:
1. Slight whitespace or indentation mismatches causing `replace_exact` to fail.
2. Duplicate strings across a file causing `replace_exact` ambiguity errors (refusing to edit if >1 match).
3. Full file rewrites (`write_file`) wasting output tokens and increasing latency.

All competitive 2026 harnesses (Claude Code `Edit`, Antigravity `replace_file_content`, Cursor Composer) use line-range anchored editing.

## Decision

1. **Implement `edit_file` in `FileTools` (`src/tools/fs.rs`):**
   - Accepts `path`, optional `start_line` and `end_line` (1-based inclusive), optional `old_content`, and `new_content`.
   - When `start_line` and `end_line` are provided, surgically replaces lines `[start_line-1..end_line]` with `new_content`.
   - Validates `old_content` against actual lines at specified range if provided (with helpful error reporting on mismatch).
   - Falls back to `replace_exact` if line numbers are omitted.

2. **Implement `multi_edit_file` in `FileTools` (`src/tools/fs.rs`):**
   - Accepts `path` and an array of `MultiEdit` structs (each with `start_line`, `end_line`, optional `old_content`, required `new_content`).
   - Applies edits in descending line order so earlier edits don't shift the line numbers of later edits.
   - Rejects overlapping ranges with a descriptive error before any mutation occurs.
   - Validates `old_content` per range when provided.

3. **Register both in Tool Registry & Dispatch (`src/agent/agent_loop.rs`):**
   - Classified as `ToolEffect::Mutation` (invalidates prior verification, subject to `write_tool_policy` approval gate).
   - Registered in `coding_tools()` schema with full JSON Schema definitions.
   - Dispatched in `execute_tool()` with full argument parsing from tool-call JSON.

## Consequences

- The model can now perform surgical edits without rewriting entire files or failing on string ambiguity.
- `multi_edit_file` enables batch fixes (e.g., rename a symbol across multiple call sites) in a single tool call, reducing round-trips.
- Significantly reduces output token consumption and turn latency on multi-line edits.
- Unit tests in `src/tools/fs.rs` and `src/agent/agent_loop.rs` verify surgical line-range replacement, overlap rejection, content validation, and tool dispatch.
- All 169 unit tests pass cleanly.
