# ADR 0009 — Context Intelligence, Calibrated Token Estimation & Repo Map

**Status:** Accepted  
**Date:** 2026-08-02  
**Author:** Antigravity + Luan  

## Context

To achieve parity with SOTA coding agents (Aider, Claude Code, Cursor), three context intelligence capabilities were required:
1. **Calibrated BPE Token Estimator (`G4`)**: Previous token estimation was a naive length heuristic (`chars / 3 + non_ascii`), which miscalculated code tokens, punctuation, indentation, and subwords.
2. **Aider-Style Repo Map Generator (`G11`)**: The agent lacked a compact sitemap of the codebase symbols (functions, structs, traits, classes, modules), requiring expensive directory traversals.
3. **Automatic System Prompt Context Compaction (`G3`)**: Project context loading required seamless integration of repo maps alongside `AGENTS.md` and repository guidelines without blowing token budgets.

## Decision

1. **Subword & Punctuation Token Estimator (`src/memory/short_term.rs`)**:
   - Implemented subword length division, punctuation weighting (1 token per ASCII symbol), and multibyte UTF-8 handling (2 tokens per non-ASCII character).
   - Accurately reflects LLM tokenizers (cl100k, o200k, LLaMA BPE).

2. **Repository Symbol Map Scanner (`src/repo/scanner.rs`)**:
   - Created `RepoMapGenerator` which scans workspace source files (`.rs`, `.py`, `.js`, `.ts`, `.tsx`, `.jsx`, etc.), ignoring `target`, `.git`, `node_modules`, and `brain`.
   - Extracts regex-matched symbol definitions (functions, structs, traits, enums, classes) with line numbers into a compact ~1-2KB sitemap.

3. **Context Injection (`src/llm/prompt.rs`)**:
   - Updated `CoderPrompt::load_project_context()` to auto-generate and append the repo map to project instructions before passing to the model.

## Consequences

- The agent gains immediate zero-overhead situational awareness of repository symbols on turn initialization.
- Context window budgets are accurately managed by the calibrated token estimator.
- All 162 unit tests pass cleanly.
