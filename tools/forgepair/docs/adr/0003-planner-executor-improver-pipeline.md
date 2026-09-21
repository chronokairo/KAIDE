# ADR-0003: Planner–Executor–Improver Pipeline with Bounded Swap-on-Failure

**Date:** 2026-09-21  
**Status:** Accepted  
**Deciders:** Forgepair maintainers

## Context

The original two-agent design had a symmetric "peer review" loop: two models
alternated turns, each reading the other's last message and choosing the next
step. There was no role differentiation, no validation that a turn produced
real work, and no mechanism to recover from a model that returns a plausible-
looking but empty response.

As the goal became "fulfill the user's coding request AND improve the Forgepair
repository itself," having a single undifferentiated loop became insufficient:

- Neither model was responsible for judging whether work was actually done.
- There was no way to automatically try a different model when one underperformed.
- The two roles (task work vs. meta-improvement) were conflated.

## Decision

Replace the symmetric loop with a three-role pipeline executed every turn:

```
Planner (top model)
  ├─ assigns Executor model A (cost-benefit)
  ├─ assigns Improver model B (highest score)
  │
  ▼
Executor (model A) — fulfills the user's request, one shell command per turn
  ▼
Improver (model B) — improves ONLY the Forgepair repository (prompts, rules,
                     config, behavior). Never touches the user's target project.
  ▼
Planner validates both results
  ├─ executor_ok = false → swap model A → retry (bounded by *max-swaps*)
  ├─ improver_ok = false → swap model B → retry (bounded by *max-swaps*)
  └─ both ok (or swap limit reached) → accept turn, advance session
```

Key design points:

- **Planner never runs commands.** Its only output is a JSON validation object
  `{"executor_ok": bool, "improver_ok": bool, "note": "…"}`.
- **Executor is cost-aware.** The initial pick and each swap use `score/cost`
  ordering so cheaper-but-capable models are preferred.
- **Improver is capability-first.** Its initial pick and swaps use raw `:score`
  ordering; it touches only the Forgepair repo, never the user's project.
- **`*max-swaps*`** (default 2) bounds retries per turn so a consistently-
  failing provider doesn't block the session indefinitely.
- **`safe-provider-request`** wraps every HTTP call; a provider failure yields
  `(values "" error-string)` so the session logs the error and continues rather
  than aborting.
- **Planner unavailability is treated as "accept the turn"** so a planner
  outage degrades gracefully instead of halting the session.

## Consequences

**Good:**
- Clear separation of concerns: task work, meta-improvement, and orchestration
  are each owned by a distinct role.
- Automatic recovery: a model that returns a low-quality response is replaced
  within the same turn.
- Observable: every swap, acceptance, and rejection is rendered and logged.
- Mock path (`--mock`) exercises the full planner-validation-swap logic with
  deterministic closures and zero HTTP calls.

**Neutral:**
- Each turn may invoke up to `2 + 2*max-swaps + 1` provider calls (executor ×
  max, improver × max, planner once). With `*max-swaps* = 2` that is at most 7
  calls per turn.

**Bad / watch for:**
- If both executor and improver exhaust their swap budget in the same turn, the
  planner accepts the last attempt regardless of quality. Session quality
  degrades silently rather than aborting.
- The improver scope ("ONLY the Forgepair repository") is enforced by sandbox
  policy as well as by prompt: the improver's command port roots its Bubblewrap
  sandbox at the Forgepair repo (`*root*`), so it physically cannot write to the
  user's project. The executor's port is rooted at the project folder where
  forgepair was opened (`*work-dir*`) — indistinguishable from `*root*` when
  forgepair is run on its own repository, which is where the improver observes
  the executor's on-disk results in that case (an actual `--bind` of the same
  host directory, read-write for the executor, with only the Forgepair
  machinery read-only). Each sandbox still gets a private `--tmpfs /tmp`.
