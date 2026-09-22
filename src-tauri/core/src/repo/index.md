# src/repo directory

This directory contains repository utilities used by the agent.

## Files

- `mod.rs` - Module definition for repo
- `context.rs` - RepoMap: per-file symbols/imports used for context injection
- `contract.rs` - TaskContract extraction (required signatures, type invariants, behavior notes)
- `scanner.rs` - RepoMapGenerator + SymbolIndex
- `spec.rs` - v0.9.5 Specification-Locked Execution: immutable TaskSpec, signature parser, deterministic pre-write gate (`check_patch`), acceptance-oracle compilation
