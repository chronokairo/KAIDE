# ADR-0005: Remove Legacy Gateway and Agent Scaffolding

**Date:** 2026-09-21  
**Status:** Accepted  
**Deciders:** Forgepair maintainers

## Context

The initial repository included a Node.js reverse-proxy gateway
(`gateway/gateway.js`, `gateway/claude-gw.ps1`), agent markdown descriptors
(`agents/`), skill files (`skills/`), and a hook configuration (`hooks/`) from
an earlier prototype phase. These were kept as a "reference for migration"
while the Common Lisp core was being built.

Now that:
- The hexagonal Lisp core is complete and self-tested,
- All provider HTTP calls go through `src/adapters.lisp` via plain curl,
- The legacy files are no longer loaded or referenced by any Lisp source, and
- `GOAL.md` (the legacy work-assignment file) has been superseded by
  `--prompt` / stdin input,

the legacy scaffolding has become dead weight: it misleads readers about the
project's current architecture and creates maintenance confusion.

## Decision

Delete:
- `gateway/` — Node.js reverse-proxy (superseded by curl in adapters.lisp)
- `agents/` — kilo-code, kilo-gateway, opencode agent descriptors
- `hooks/hooks.json` — hook wiring for the old gateway
- `skills/` — configure-provider, kilo-gateway, kilo, opencode skill files
- `settings.json` — IDE settings for the old agent tooling
- `GOAL.md` — replaced by `--prompt` / stdin

`src/forgepair.lisp` is **kept** (not deleted) as a legacy reference; it
receives only the minimal patches required to keep it syntactically valid and
consistent with the new slurp/curl improvements.

## Consequences

**Good:**
- Repository surface area shrinks by ~15 files; new contributors see only
  the active Lisp architecture.
- No accidental loading: entrypoint no longer has a path to the legacy code.

**Neutral:**
- Git history preserves the legacy files for archaeology.

**Bad / watch for:**
- Anyone who references the old gateway or skill workflow must be pointed to
  the Lisp adapters instead. Update any external documentation.
