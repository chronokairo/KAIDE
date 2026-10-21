# ADR-0003: Planner–Executor–Improver Pipeline with Bounded Swap-on-Failure

**Date:** 2026-09-21 (amended: continuous agent loop, no fixed turns)  
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

A later fixed-turn-count wrapper (`dotimes` over `--turns`, default 6) still
miscarried in practice: when a model produced no actionable work, the loop just
advanced the turn counter and swapped models in `[N/6]`, generating noise and a
final "no actionable work" verdict instead of fixing anything.

## Decision

Replace the symmetric loop with a three-role pipeline executed continuously —
**no fixed number of turns**. The session loops until the planner validates the
request, or a safety bound stops it:

```
Planner (top model)
  ├─ assigns Executor model A (cost-benefit)
  ├─ assigns Improver model B (highest score)
  │
  ▼
Executor (model A) — a tool-calling agent in the user's project dir
  ▼
Improver (model B) — a tool-calling agent, improves ONLY the Forgepair repo
  ▼
Planner validates both results
  ├─ executor_ok = false → swap model A, feed planner guidance → retry
  ├─ improver_ok = false → swap model B, feed planner guidance → retry
  └─ both ok → session concludes
```

Each role follows an agentic tool protocol instead of "one command per turn":

- While working it replies `{"tools":[{"name":"shell","command":"…"},
  {"name":"read","path":"…"}, …]}`; the harness executes every tool in order
  through the role's sandbox and appends each result back to the model's
  context, then re-queries the model.
- When finished it replies `{"done":true,"message":"…"}` (improver:
  `{"done":true,"improvement":"…","rationale":"…"}`).
- `*max-tool-steps*` (default 8) bounds a role's chain so a model that keeps
  emitting tool calls cannot run forever.

Key design points:

- **Planner never runs commands.** Its only output is a JSON validation object
  `{"executor_ok": bool, "improver_ok": bool, "note": "…"}`.
- **No visible turn counter.** The UI has no `[N/D]`; the planner's `note` is
  threaded back as instructions to the failing role on the next attempt, so it
  actually fixes rather than re-swapping blindly.
- **Executor is cost-aware.** The initial pick and each swap use `score/cost`
  ordering so cheaper-but-capable models are preferred.
- **Improver is capability-first.** Its initial pick and swaps use raw `:score`
  ordering; it touches only the Forgepair repo, never the user's project.
- **`*max-swaps*`** (default 2) per role bounds model churn; **`*max-attempts*`**
  (default 6) bounds the whole session so an unsatisfiable request still
  terminates with a warning instead of looping forever.
- **`safe-provider-request`** wraps every HTTP call; a provider failure yields
  `(values "" error-string)` so the session logs the error and continues rather
  than aborting. A planner outage **fails closed** (both flags false) so the
  session retries the roles instead of reporting an unverifiable result.

## Consequences

**Good:**
- Clear separation of concerns: task work, meta-improvement, and orchestration
  are each owned by a distinct role.
- Coding-agent feel ("ask — do — fix"): the executor chains real tool calls, the
  improver improves Forgepair, and the planner steers corrective guidance until
  the request is genuinely fulfilled.
- Automatic recovery: a model that returns a low-quality response is replaced
  within the session, and the planner's note tells its replacement what to fix.
- Observable: every swap, tool call, acceptance, and rejection is rendered and
  logged.
- Mock path (`--mock`) exercises the full multi-tool agent loop and planner
  validation with deterministic closures and zero HTTP calls.

**Neutral:**
- A single executor run may invoke up to `*max-tool-steps* + 1` provider calls
  (tool replies plus the final done); a session is bounded by
  `*max-attempts*` cycles.
- Model news are re-requested with the full accumulated tool transcript, so
  longer chains cost more tokens than a single shot.

**Bad / watch for:**
- If both executor and improver exhaust their swap budget, the session ends with
  a warning that the request was not validated, rather than silently accepting.
- Tool results are appended to the prompt as text; a badly-behaved model could
  emit a tool call whose output then influences its own next reply. This is
  inherent to text-agent loops and is why every tool runs inside its sandbox.
