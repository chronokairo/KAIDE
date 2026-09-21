# ADR-0002: Curated Akita Tier for Automatic Model Selection

**Date:** 2026-09-21  
**Status:** Accepted  
**Deciders:** Forgepair maintainers

## Context

The original design required the user to manually configure two named agents
with explicit URLs and model identifiers in `config.sexp`. This had two
problems:

1. **Discovery burden:** the user had to know which models are available, good
   at coding, and reachable with the credentials at hand.
2. **Stale config:** model availability changes; a hard-coded model may stop
   responding (HTTP 402, 429, credit exhaustion) with no automatic fallback.

The three-role pipeline (planner / executor / improver) further requires
selecting *three* models with distinct criteria: top capability for the planner,
best cost-benefit for the executor, and best raw score for the improver.

## Decision

Introduce a curated tier (`*akita-tier*` in `src/providers.lisp`) derived from
Fábio Akita's LLM coding benchmark
([akitaonrails/llm-coding-benchmark](https://github.com/akitaonrails/llm-coding-benchmark)),
which uses a holistic 0–100 rubric with live runtime-viability validation.

Each entry carries:

```lisp
(:label "…" :score <0-100> :cost <relative-index> :provider "…" :model "…")
```

`auto-select-roles` consults only entries whose provider credential is present
in `.env`, then assigns:

| Role | Selection criterion |
|------|---------------------|
| **Planner** | Highest `:score` (top of available tier) |
| **Executor** | Best `score/cost` ratio (cost-benefit) |
| **Improver** | Highest `:score`, preferring a provider ≠ executor |

Roles prefer distinct providers where the available pool permits.

`swap-model` applies the same per-role ordering when the planner rejects a
result and needs a replacement candidate.

`--verify-models` probes every candidate with a real HTTP call so the tier can
be re-audited at any time without relying on the curated snapshot.

## Consequences

**Good:**
- Zero config for model selection; one `.env` file is enough.
- Executor selection is cost-aware: cheaper models are preferred when their
  capability/cost ratio is highest.
- Re-audit is one command: `bin/forgepair --verify-models`.
- `config.sexp` shrinks to `(:mode :pipeline :turns 6)`.

**Neutral:**
- The tier is a snapshot (probe date recorded in `src/providers.lisp`).
  Models that appear after the snapshot require a manual tier update and
  re-verification.

**Bad / watch for:**
- A provider that returns HTTP 200 on the probe but 429 at session time will
  still cause a `safe-provider-request` error (logged, session continues).
- OpenRouter is excluded from the current tier because this account's credits
  are exhausted. Re-add after topping up and re-running `--verify-models`.
