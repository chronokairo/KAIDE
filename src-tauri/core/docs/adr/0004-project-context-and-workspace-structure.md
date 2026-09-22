# ADR 0004 — Project Context Auto-Loading & Workspace Directory Discovery

**Status:** Accepted  
**Date:** 2026-08-02  
**Author:** Antigravity + Luan  

## Context

Prior to this change:
1. `list_files` in `src/tools/fs.rs` only listed files (`entry.is_file()`), filtering out directories. This prevented the model from discovering directory structure in unfamiliar or deeply nested projects (Gap G10).
2. Project instruction files (such as `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `CONTEXT.md`) located in the workspace root were ignored by the harness. The agent loop had no native awareness of repository rules or guidelines (Gap G8).

## Decision

1. **Include Directories in `list_files` (`src/tools/fs.rs`):**
   - `list_files` now includes both files and directories.
   - Directories are formatted with a trailing `/` (e.g. `src/`, `docs/`) so the LLM can easily differentiate folders from files.

2. **Auto-Load Project Instructions (`src/llm/prompt.rs`, `src/agent/loop.rs`):**
   - Added `CoderPrompt::load_project_context(workspace_dir)` to check for standard instruction files (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `CONTEXT.md`).
   - Content is capped at 4,000 characters per file to preserve context budget.
   - Project instructions are automatically appended to the system prompt in `run_tool_use_iteration`.

## Consequences

- The LLM receives repository conventions automatically without requiring explicit user instructions on every prompt.
- Directory structures are now visible in `list_files` results without needing a separate `list_tree` invocation.
- All unit tests pass.
