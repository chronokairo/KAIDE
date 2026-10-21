# ADR-0001: Hexagonal Architecture for Forgepair Core

**Date:** 2026-09-21  
**Status:** Accepted  
**Deciders:** Forgepair maintainers

## Context

The original `src/forgepair.lisp` was a single-file monolith mixing I/O,
provider HTTP calls, sandbox execution, JSON parsing, session logic, and TUI
rendering. Adding the three-role pipeline (planner / executor / improver)
required injecting different provider configurations per role and running the
same orchestration loop in a mock mode without any external effects.

A monolith makes this impossible to test in isolation and hard to reason about.

## Decision

Split the codebase into six files following hexagonal (ports-and-adapters)
architecture:

| File | Layer | Responsibility |
|------|-------|----------------|
| `src/package.lisp` | — | Single `FORGEPAIR` package declaration |
| `src/domain.lisp` | Domain | Pure functions: JSON parser/emitter, system-prompt builders, turn-prompt builders. Zero side effects. |
| `src/ports.lisp` | Port contracts | Defstruct-based port types: `provider-port`, `command-port`, `output-port`, `notes-port`, `credential-port`, `prompt-port`, `session-port`. |
| `src/providers.lisp` | Domain/Infra boundary | Provider catalog, Akita tier, `auto-select-roles`, `swap-model`, `cost-benefit`. Pure except `available-tier` (reads credentials). |
| `src/adapters.lisp` | Adapters | `make-http-provider-port`, `make-sandbox-command-port`, `make-cli-output-port`, `make-notes-port`, `make-prompt-port`, Telegram, dotenv, `verify-models`. All side effects live here. |
| `src/application.lisp` | Application | `run-session`: the single use case. Depends only on port interfaces. Runs identically with real adapters or mock closures. |
| `src/entrypoint.lisp` | Composition root | Wires adapters → ports → use case. Owns CLI parsing, `self-test`, and `auto-select-roles` invocation. |

`src/forgepair.lisp` is retained as a read-only legacy reference; the launcher
(`bin/forgepair`) now points to `src/entrypoint.lisp`.

## Consequences

**Good:**
- `run-session` can be exercised with `--mock` entirely offline, no curl calls.
- Each layer can be read and reasoned about independently.
- `self-test` validates all layers without provider credentials.
- Adding a new adapter (e.g. AWS Bedrock) requires only a new adapter function
  and no changes to `application.lisp`.

**Neutral:**
- Six files instead of one; `entrypoint.lisp` `load`s the others in order (no
  build system required — zero-lib principle preserved).

**Bad / watch for:**
- Load order must be respected: `package` → `domain` → `ports` → `providers`
  → `adapters` → `application`. Violating the order yields undefined-symbol
  errors at load time.
