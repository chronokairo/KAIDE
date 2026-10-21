# ADR-0010: Local Decider for Evidence-Based Validation

**Date:** 2026-09-30
**Status:** Accepted
**Deciders:** Forgepair maintainers

## Context

ADR-0009 removed the narrative planner and declared evidence-based validation
(rule 12) as the standard, but `validate-evidence` in `src/application.lisp`
has since been a placeholder: it only checks that the executor's output is
non-empty. It does not read `git diff` or exit codes, so a session can pass
validation on a run that touched nothing, or fail one that succeeded but
printed little.

Separately, the user has local GPU hardware (GTX 1650 / T1000, 4 GB VRAM
each) sufficient to run a small, purpose-built "decider" model — a calibrated
classifier fine-tuned for exactly this kind of one-pass typed decision
(Choice/Score/Noul), distinct from a chat LLM. Running the evidence check
through one of these, entirely locally, is free, fast, and matches rule 12
better than either the old narrative planner or the current stub.

## Decision

1. Add a `decider-port` (ports.lisp): a callable taking a state string and a
   list of typed questions, returning typed answers, or `NIL` if unavailable.
2. Add `make-local-decider-port` (adapters.lisp): a zero-lib adapter that
   calls a local llama.cpp server's native `/completion` endpoint with
   `n_predict=1` and `n_probs`, reading the option-letter probability from the
   returned candidates — the decider's actual readout contract, never
   treating its output as generated text. Any failure (server not running,
   model not loaded, unexpected response shape) is swallowed and returns
   `NIL`, never signals.
3. Rewrite `validate-evidence` to build real evidence (`git diff --stat` in
   the work dir + the tail of the tool transcript, which carries the
   `[exit N]` markers from `make-sandbox-command-port`) and, when a decider
   answers, ask it a single Noul question grounded in that evidence instead
   of checking for non-empty output. When the decider does not answer, fall
   back to the previous non-empty-output heuristic — the session never blocks
   on optional local infrastructure.
4. Document model choice and setup in `docs/decider.md`: `Mapika/decider-2b`
   quantized to Q8_0 GGUF (2.0 GB) is the recommended file for a 4 GB card;
   `decider-0.8b` is a lighter fallback.

This is not the commodity "model routing" that rule 10 excludes: the decider
never picks which remote LLM handles the user's request. It only answers one
typed yes/no question about evidence already produced — the same job rule 12
already assigns to `git diff`/exit codes, done by a calibrated local model
instead of string-emptiness.

## Consequences

**Good:**
- `validate-evidence` finally reads real evidence instead of a placeholder
  non-empty check, closing the gap ADR-0009 left open.
- Zero added latency/cost when the decider is not configured (default
  behavior is unchanged: the heuristic still runs).
- Zero-lib preserved: the decider is an external process (like Bubblewrap or
  the remote provider), reached over `curl`, not a Lisp or Python dependency.

**Neutral:**
- Requires the user to run `llama-server` separately; Forgepair does not
  manage that process.

**Bad / watch for:**
- The exact JSON field names of llama.cpp's `/completion` response have
  changed across versions before; `decider-candidate-prob` tries the known
  variants but may need a one-line fix on some builds (documented in
  `docs/decider.md`).
- A single Noul question is a coarse signal; it does not yet look at specific
  file paths or diff hunks, only the diff summary and transcript tail.

## Implementation (2026-09-30)

**Added to `src/ports.lisp`:** `decider-port` struct, `decide` helper.

**Added to `src/adapters.lisp`:** `decider-prompt`, `decider-candidate-prob`,
`decider-call`, `make-local-decider-port`.

**Added to `src/providers.lisp`:** `*default-decider-url*`, `decider-url`.

**Changed in `src/application.lisp`:** `validate-evidence` now takes
`decider-port` and `command-port`, builds evidence via `evidence-state`, and
only falls back to the non-empty-output heuristic when the decider does not
answer. `run-session` takes and threads a `decider-port` argument.

**Changed in `src/entrypoint.lisp`:** builds `decider-port` via
`(make-local-decider-port (decider-url credentials))` and passes it into
`run-session`. `--help` mentions `DECIDER_URL`. `self-test` covers
`decider-prompt`'s shape and both branches of `validate-evidence` (decider
absent: heuristic ok / heuristic not-ok) without requiring a running server.

**Added:** `docs/decider.md` (model choice, setup, manual curl check).

**Tests passing:** `./bin/forgepair --self-test` (extended with the decider
assertions above).
