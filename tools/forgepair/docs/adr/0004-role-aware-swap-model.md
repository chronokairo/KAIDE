# ADR-0004: Role-Aware swap-model Ordering

**Date:** 2026-09-21  
**Status:** Accepted  
**Deciders:** Forgepair maintainers

## Context

When the planner rejects a result and calls `swap-model`, the original
implementation took `(first alternatives)` — the first entry in the pool that
was not the current model. The pool is ordered best-first by Akita score, so
this was effectively always "the next highest-scoring model."

This is wrong for the executor role: the executor is *not* selected by raw
score — it is selected by cost-benefit (`score/cost`). Swapping to the next
highest-scoring model on an executor failure means ignoring the cost dimension
entirely, potentially choosing a much more expensive model when a cheaper one
with a better cost-benefit ratio exists.

## Decision

Make `swap-model` apply the same ordering criterion that `auto-select-roles`
uses for each role:

| Role | Swap ordering |
|------|---------------|
| `:executor` | `sort alternatives by score/cost descending` |
| `:improver` | `sort alternatives by score descending` |
| any other | pool order (best-first by score, unchanged) |

This is a one-line change per branch in the `cond` inside `swap-model`.

Additionally, `tier-entry->role-provider` now carries `:score` and `:cost`
into the resulting plist so `self-test` can assert that the planner's score
equals the top score in the pool without needing the raw tier entry.

## Consequences

**Good:**
- Swap policy is consistent with selection policy: the model chosen as a
  replacement under pressure uses the same quality criterion as the initial
  pick.
- `self-test` can now verify the planner invariant (`planner score == max pool
  score`) without any live provider calls.

**Neutral:**
- The cost of one `sort` call per swap is negligible; the pool is at most
  ~7 entries.

**Bad / watch for:**
- If the pool has only one entry, `alternatives` is empty and `swap-model`
  returns the current provider unchanged. The planner will set `executor_ok =
  false` again next iteration and the swap budget will be exhausted. This is
  expected behaviour — log it clearly so the operator knows to add credentials.
