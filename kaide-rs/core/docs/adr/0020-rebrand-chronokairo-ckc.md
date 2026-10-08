# ADR 0020 — ChronoKairo Rebranding and CKC Binary Transition

- **Status:** Accepted (2026-09-10)
- **Related ADRs:** ADR-0002 Harness Parity (GLM-5.2), ADR-0015 Competitive Backlog
- **Scope:** Repository branding, package identity, binary rename, config paths, backward compatibility fallbacks

## Context

The repository was migrated to the chronokairo/cli GitHub namespace. However, the codebase retained legacy namnesic identifiers across source code, configurations, logs, temporary directory prefixes, user agents, and documentation. Furthermore, the binary name in Cargo.toml remained cki, whereas the project's canonical binary name is ckc (ChronoKairo Coder).

## Decision

1. **Rebrand to ChronoKairo**:
   - Update all occurrences of ANAMNESIC / Anamnesic / namnesic to CHRONOKAIRO / ChronoKairo / chronokairo.
   - Update user paths from ~/.anamnesic to ~/.chronokairo (including settings.json, providers.toml, models/, skills/, and memory.db).
   - Rename default log file to chronokairo.log.
   - Update GitHub repository description/About to reflect ChronoKairo Coder (CKC).

2. **Binary Name Transition (ckc)**:
   - Set package name and binary name in Cargo.toml to ckc.
   - Update CLI help strings, user agents (ckc/{version}), MCP server/client identifiers, and benchmark scripts (ench/run_hbattery.ps1) to ckc.

3. **Backward Compatibility & Legacy Fallbacks**:
   - Provide seamless fallbacks for user configurations:
     - If ~/.chronokairo/providers.toml does not exist, check ~/.anamnesic/providers.toml.
     - If ~/.chronokairo/settings.json does not exist, check ~/.anamnesic/settings.json.
     - Discover skills in ~/.anamnesic/skills alongside ~/.chronokairo/skills.
     - Resolve downloaded embedding models from ~/.anamnesic/models/embeddings/ if present.
     - Fall back to ~/.anamnesic/memory.db for long-term memory if the new path does not exist.

4. **Lint and Lifetime Cleanups**:
   - Fix elided lifetime ambiguities in src/ui/diff_render.rs and src/ui/line_truncation.rs.
   - Eliminate unused imports in src/ui/engine/mod.rs and src/async_rt/executor.rs.
   - Add #![allow(async_fn_in_trait)] in src/async_rt/io.rs to keep trait ergonomics clean.

## Consequences

- The repository and binary cleanly align with the chronokairo organization and ckc binary identity.
- Existing user installations with keys, models, or memory in ~/.anamnesic continue working without manual migration.
- Clean compilation: cargo check outputs 0 warnings.
- Test suite passes completely (415 tests passed, 0 failed).

## Verification

- cargo check: 0 warnings, 0 errors.
- cargo test: 415 passed, 0 failed, 3 ignored.
- Clean repository status and successful build.
