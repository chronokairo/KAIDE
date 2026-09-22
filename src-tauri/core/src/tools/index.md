# src/tools directory

This directory contains various helper tools used across the project.

## Files

- `background.rs` - Background detached process management
- `fs.rs` - Filesystem helper operations and atomic writes
- `git.rs` - Git workspace inspection and operations
- `mod.rs` - Module definition for tools
- `patch.rs` - Unified diff parser and robust patch applier (`apply_patch`)
- `sandbox.rs` - Sandbox policy engine, boundary validation, and environment scrubbing
- `shell.rs` - Shell process runner with timeout and interrupts
- `test.rs` - Verification runner and test detection
- `transaction.rs` - Workspace transaction snapshots and rollback
- `web.rs` - HTTP fetching and web search tools