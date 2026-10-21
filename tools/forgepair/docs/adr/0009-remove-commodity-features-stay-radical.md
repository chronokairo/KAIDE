# ADR-0009: Remove Commodity Features — Stay Radical

**Date:** 2026-09-21  
**Status:** Accepted  
**Deciders:** Forgepair maintainers

## Context

Comparing Forgepair to the 2026 market (Claude Code, Codex CLI, Cursor, Aider,
OpenHands, Devin) showed that most of the agent surface was already a commodity:
planner/executor/improver pipelines, automatic model selection against a coding
tier, model-swapping on validation failure, multi-provider catalogs, live model
probes, and LLM validators that judge results by narrative. Competitors do these
better, faster, and with more polish — Forgepair cannot win there, and carrying
them only grows the maintenance surface while diluting what is actually unique.

Operating Forgepair on Telegram also exposed that these commodity pieces *fail*
in ways the unique core does not: model swaps picked providers already out of
quota (`429 RESOURCE_EXHAUSTED`), the planner validated with placeholder
`[tool chain]` output instead of real evidence, and `curl --retry-all-errors`
retried permanent errors, amplifying rate limits.

## Decision

1. **Codify the constitution in one file, `AGENTS.md`.** The project's rules
   (previously `AGENTS.md` meta-rules + `.forgepair/RULES.md` constitution) are
   now a single file with 13 numbered rules, including explicit **scope rules**:

   - rule 10: never implement commodity features (model routing, multi-provider
     catalogs, planned model swaps, LLM validators that judge by narrative);
   - rule 11: stay radical — keep only the unique core (zero-library Common Lisp
     agent over chat inside a Bubblewrap sandbox that improves itself);
   - rule 12: judge work by real evidence — `git diff`, tool exit codes, files
     changed — never by a planner-model guessing whether a role "looked busy";
   - rule 13: when a feature cannot be justified against rule 10, remove it
     rather than growing the surface.

2. **Move the constitution from `.forgepair/RULES.md` into `AGENTS.md`** so it
   is both the agent instructions and the runtime-served rules. Code and docs
   that read or mount changes from `.forgepair/RULES.md` to `AGENTS.md`:
   session rules slurp (`application.lisp`), the improver's read-only self-mount
   (`adapters.lisp` `readonly-self-args`), README structure, ADR-0008, and the
   legacy `forgepair.lisp` reference. `.forgepair/RULES.md` is deleted;
   `.forgepair/` now holds only the git-ignored `runtime/` dir.

3. **Direction (no code carrying it yet):** the commodity surface is slated for
   removal or replacement by real evidence — the LLM planner validator gives way
   to `git diff`/exit-code based completion, and multi-provider/tier/swap
   machinery is pruned rather than defended.

## Consequences

**Good:**
- One rules file is the single source of truth for both the human/other agent and
  the runtime roles; no drift between `AGENTS.md` and `RULES.md`.
- The anti-commodity rule is now enforced in-repo: any further feature must be
  justified as unique to Forgepair or it is removed.
- Validation-by-evidence is declared as the standard, replacing narrative
  judgement.

**Neutral:**
- `.forgepair/RULES.md` removal touches the legacy `forgepair.lisp` reference
  paths, which remain maintained-but-not-loaded (ADR-0005).

**Bad / watch for:**
- The constitution file is mountable/readable by agents, so it must continue to
  be treated as untrusted input in prompts (rule 6) and mounted read-only for
  the improver so it cannot rewrite its own rules.
- Scope rules 10-13 are aspirational until the platform's session loop actually
  drops the planner/swap machinery; that work is tracked separately.

## Implementation (2026-09-21)

**Removed from `src/providers.lisp`:**
- `*model-providers*` (6-provider catalog with 50+ models)
- `*akita-tier*` (7 curated entries with scores/costs)
- `*verify-candidates*` (23 provider/model pairs for probing)
- `provider-definition` (catalog lookup)
- `available-tier`, `credential-available-p`, `tier-entry->role-provider`
- `auto-select-roles` (planner/executor/improver + pool selection)
- `swap-model` (model swapping on validation failure)
- `cost-benefit` (score/cost calculation)
- `current-year-model-p`, `model-year`, `current-year` (model freshness checks)

**Removed from `src/application.lisp`:**
- Planner role, improver role, model-swapping loop
- `run-planner`, `run-improver`, `mock-planner-call`, `mock-improver-call`
- `*max-swaps*`, `*max-attempts*` (swap/attempt bounds)
- 3-role validation loop with planner verdicts

**Removed from `src/entrypoint.lisp`:**
- CLI flags: `--verify-models`, `--list-providers`
- `print-provider-catalogs`, `verify-models` invocation
- Multi-role provider selection and pool passing to `run-session`
- Telegram notify with planner/executor/improver labels

**Removed from `src/adapters.lisp`:**
- `list-provider-models` (live /models catalog fetch)
- `probe-model` (per-model availability probe)
- `verify-models` (bulk candidate probing)

**Simplified to single-provider architecture:**
- `config.sexp` / `config.example.sexp`: single provider with name, url, key-env, model, label
- `src/providers.lisp`: minimal `provider-definition(config)` + `*default-provider*`
- `src/application.lisp`: single executor role, evidence-based validation (non-empty output)
- `src/entrypoint.lisp`: loads provider from config, passes to `run-session`
- `src/adapters.lisp`: unchanged HTTP/sandbox/Telegram adapters

**Tests passing:**
- `./bin/forgepair --self-test`
- `./bin/forgepair --mock --cli --prompt "test"`
- `./bin/forgepair --telegram-test`