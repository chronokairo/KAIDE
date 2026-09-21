# ADR-0008: Agentic Multi-Tool Calling, No Fixed Turns, Unified Chat

**Date:** 2026-09-21  
**Status:** Accepted  
**Deciders:** Forgepair maintainers

## Context

Operating Forgepair exposed two defects in the fixed-turn pipeline (ADR-0003):

1. **Fixed turns without a feedback loop cannot "do and fix".** The session ran
   exactly `--turns` (default 6) executor/improver/planner cycles labelled
   `[N/6]`. When a model returned nothing actionable, the planner swapped its
   model, the counter advanced, and the loop could end with "both agents failed
   to perform any actionable work" even though a replacement model would have
   fixed nothing *within* a turn — the whole attempt was thrown away.
2. **One command per turn with no chaining.** The executor emitted exactly one
   shell command, saw one result, and stopped. Real coding work needs
   `read → edit → verify` sequences the model drives itself, not one shot per
   turn.

A third issue surfaced in the chat UI: the terminal "voce" channel (human notes
prompt) and the Telegram chat were separate surfaces. When Telegram was
attached, `session-port` was nil, so per-role events and tool calls were
rendered only through `render-turn`; the "one conversation" feel was split.

## Decision

1. **Replace the fixed `dotimes` turn loop with a continuous session loop**
   (bounded by `*max-attempts*`, default 6, and `*max-swaps*`, default 2). No
   `--turns` flag, no `:turns` config, no `[N/D]` counter in any output. The
   planner's validation `note` is threaded back to the failing role as guidance
   ("fix this") instead of valuing the turn counter.

2. **Make each role a tool-calling agent.** The executor and improver reply with
   JSON that is either `{"tools":[{name,command|path}, …]}` or
   `{"done":true,…}`. The harness executes each listed tool in order through the
   role's existing sandbox command port, appends the results to the model's
   context, and re-queries the model until it replies done (bounded by
   `*max-tool-steps*`, default 8). Supported tool names: `shell` (any command),
   `read` (cat a file), `list` (ls), all lowered into the sandbox.

3. **Unify the chat.** The entrypoint now wires `:session-port` to a new
   `make-telegram-session-port` bound to the **same** token and chat-id closure
   as the output port. `session-event` kinds map to icons/labels and are sent as
   normal chat messages, so the user's echo ("voce"), pairing line, every role
   message, every tool call, the planner verdict, and the closing summary all
   appear in one Telegram chat. With no token, all of these remain inert (nil
   port), so the CLI session is unchanged.

4. **Mocks and prompts updated together.** The mock executor performs a real
   tool call, receives its own output, then reports done; the mock improver and
   planner validate the result; the self-test still runs without HTTP or
   credentials. System prompts and `AGENTS.md` describe the
   tool-call/done protocol instead of "one command per turn".

## Consequences

**Good:**
- Coding-agent behavior: ask → the agent does (chaining tools), the planner
  checks, and on failure the next attempt fixes with concrete guidance —
  no wasted turn labels.
- Tool transcript is re-fed, so the model actually builds on its own results.
- One conversation on Telegram whether the user chats, types notes, or just
  watches the session.

**Neutral:**
- Each role run can consume more provider calls (one per tool reply) and more
  context (the raw transcript) than a single command per turn.
- `*max-tool-steps*` is a harness-made guarantee; a model that keeps emitting
  tools is forcibly finalised with a warning message.

**Bad / watch for:**
- Prompt injection: tool output is untrusted data fed back to the model. The
  system prompt and RULES treat it as such (rule 6), and tools stay inside the
  role sandbox.
- `session-event` now makes network calls in the happy path; each is wrapped in
  `handler-case` (via `telegram-send` in the session port) so a Telegram outage
  never aborts the session.