# ADR-0007: Root Launcher Script and Predefined `*work-dir*`

**Date:** 2026-09-21  
**Status:** Accepted  
**Deciders:** Forgepair maintainers

## Context

The only documented way to start Forgepair was `bin/forgepair`. Starting a
session required knowing the repo-relative path of the launcher, and there was
no one-file entry point at the repository root.

Separately, role selection was constrained by a "distinct providers" rule (see
ADR-0002): the executor and improver had to come from different providers. This
unnecessarily filtered the curated tier and could force a weaker model into a
role even though models are provider-agnostic (what matters is the model + its
system prompt, not who bills it).

Finally, the sandbox for agent commands was a single Bubblewrap root mounted at
`*root*` (the Forgepair repo). This meant the improver and the executor shared
filesystem scope: the executor could, in principle, touch the Forgepair
machinery, and the improver could touch the user's project.

## Decision

1. **Add `forgepair.sh` at the repository root.** A thin `#!/bin/sh` wrapper
   that resolves `ROOT` from its own location and execs
   `$ROOT/src/entrypoint.lisp`, forwarding all arguments. It keeps the process's
   current working directory unchanged.

2. **Define `*work-dir*` at load time** as `(truename ".")` — the directory the
   binary was opened in (the launch `pwd`), which the launcher preserves. The
   Forgepair repo itself remains `*root*`, derived from `*load-truename*`.

3. **No provider-distinctness constraint** in `auto-select-roles`: the executor
   (best cost-benefit) and improver (best score) are both drawn from the pool,
   ranked purely by their criteria. They may share a provider.

4. **Split the sandbox by role** (`make-sandbox-command-port` now takes a `base`
   directory):
   - **Executor** gets a writable root at `*work-dir*` (the user's project
     folder) with `.env*` masked and `.git/` read-only when present.
   - **Improver** gets a writable root at `*root*` (the Forgepair repo) with the
     Forgepair machinery (`src/`, `config.sexp`, `bin/`, RULES) mounted
     read-only via `readonly-self-args`.

   When `base` is the Forgepair repo (i.e. forgepair is running on itself),
   `forgepair-p` is true and the self-protection rules apply to the
   executor's sandbox too.

## Consequences

**Good:**
- `./forgepair.sh [args]` works from the repo root or any directory; the launch
  folder becomes the executor's workspace, so a session started in a user's
  project improves that project while the improver still only touches the
  Forgepair repo.
- Role selection no longer discards a perfectly good model just because the
  same provider already holds the planner or executor role.
- Filesystem scope is now role-aware: the executor cannot rewrite the
  Forgepair machinery, and the improver physically cannot write outside
  `*root*` (sandbox policy, not just prompt instruction — closing the ADR-0003
  "watch for" item).

**Neutral:**
- `*work-dir*` is the launch `pwd`. If that is not the directory the executor
  should work on, `cd` first, then run `./forgepair.sh`.
- Two sandboxes are created per session (one per role) instead of one shared
  sandbox; Bubblewrap setup cost is proportional to the number of bind mounts,
  not the number of sandboxes.

**Bad / watch for:**
- When forgepair runs on its own repository (`*work-dir*` == `*root*`), both
  roles share the same bind root; the executor's writable root is the repo and
  its self-protection rules (read-only machinery) still apply, but the improver
  and executor read/write the same folders. This is intentional for
  self-hosting sessions and matches the historical single-sandbox behavior.
- `.git/` is bound read-only per base directory; on a fresh clone without a
  `.git/` folder the `probe-file` guard skips the bind instead of failing.