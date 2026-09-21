# ADR-0006: Telegram Chat-Style I/O (Replace Single-Bubble Editing)

**Date:** 2026-09-21  
**Status:** Accepted  
**Deciders:** Forgepair maintainers

## Context

The previous Telegram integration used a single-message "session bubble":
`make-telegram-session` sent one message at the start of the session
("Forgepair: iniciando sessao...") and then called `editMessageText` every turn
to overwrite it with a compact summary. The user saw only the latest state.

Problems with this approach:

1. **No history.** Because the message was edited in-place, the user could not
   scroll back to see what the executor did three turns ago.
2. **No tool-call visibility.** Commands run by the executor (shell commands,
   their output, exit codes) were collapsed into the compact summary string —
   invisible to the user.
3. **One-way only.** The prompt still came from `--prompt` or stdin; the user
   could not drive the session by typing in Telegram.
4. **Single bubble is fragile.** Telegram aggressively rate-limits
   `editMessageText` on the same message_id; after ~20 edits the bot starts
   receiving 429s silently.

## Decision

Replace single-bubble editing with a **chat-style I/O model**:

### Input — `make-telegram-prompt-port`

When `TELEGRAM_BOT_TOKEN` is in `.env` and `--prompt` is not given:
1. `telegram-drain-updates` is called at startup to flush any stale pending
   updates (messages sent before the bot was running) so the session does not
   accidentally use old text.
2. `telegram-await-message` long-polls `getUpdates` with `timeout=25` /
   `max-time=60` until the user sends a text message to the bot.
3. That message becomes the session prompt, identically to `--prompt`.

The captured `chat-id` is stored in a closure and shared with the output port.

### Output — `make-telegram-output-port` + `make-combined-output-port`

Every `render-turn` call (one per executor/improver/planner per run) sends a
**new** `sendMessage` to the same chat. The message format is:

```
⚙️ Executor(Gemini 3.6)
<conclusion text>

$ git status
<last 1200 chars of terminal output>
[exit 0]
```

Role icons: ⚙️ Executor · 🔧 Improver · 🎯 Planner. There is no turn counter:
the line header is the role label only (see ADR-0003 for the turn-less loop).

`make-combined-output-port` fans every render-turn call to both the CLI and the
Telegram output port so local monitoring is not lost.

### Session events — `make-telegram-session-port`

The chat is unified: the session port is wired to the **same Telegram chat and
token** as the output port, so everything Forgepair says lands in one chat:

- the user-request echo (`"voce"`, 👤),
- the model pairing line (`"forgepair"`),
- every per-role message (⚙️ / 🔧),
- each tool call block (`"tool"`, 🖥️) with its command and output,
- the planner verdict (`"planner"`, 🎯),
- the final session summary (`"sessao"`).

The `kind` from `session-event` chooses the icon and label, so the conversation
reads like a chat app instead of dropping events when no chat is attached.

### Compatibility

- `--prompt` takes priority over Telegram input; the output port is still wired
  to Telegram even when `--prompt` is used.
- If `TELEGRAM_BOT_TOKEN` is absent, the session runs as before (CLI only), and
  `session-event` is a no-op (`session-port` is nil).
- `session-event` is safe when the port or its updater is nil; the application
  never depends on one being attached.

### Removed

- `make-telegram-session` (single-bubble creator).
- `telegram-chat-id` (used only by the old session; drain+await cover its job).
- `telegram-updates` / `telegram-wait-for-prompt` (superseded by
  `telegram-await-message`).
- `make-telegram-chat` (old closure-returning function, not a port).

### Kept

- `telegram-send` / `telegram-edit` — still useful for direct API calls.
- `telegram-api` — now accepts an optional `max-time` arg (default `"30"`;
  long-poll calls pass `"60"` to avoid curl timing out before the server
  responds).
- `telegram-test` / `--telegram-test` — unchanged.

## Consequences

**Good:**
- The Telegram chat now looks like a ChatGPT conversation: user sends a message,
  bot responds with one bubble per role per turn.
- Tool calls (commands + output) are visible inline in the chat.
- History is preserved — the user can scroll back.
- No more `editMessageText` rate-limit issues.
- `--telegram-test` still works as a lightweight connectivity check.

**Neutral:**
- The session produces messages per role run (executor + improver + planner)
  plus one per session event; a session's message count is bounded by
  `*max-attempts*` (default 6) rather than a fixed turn count. Telegram's
  default send rate limit is 30 messages/second; this is well within limits.
- Output is truncated to 4 096 chars per message (Telegram's API limit) and
  command output is further capped to the last 1 200 chars to leave room for
  the conclusion text.

**Bad / watch for:**
- Long-polling (`timeout=25`) means `telegram-await-message` occupies a curl
  process for up to 25 seconds per poll cycle. This is blocking; the bot cannot
  receive concurrent messages during a session. Acceptable for a single-user
  coding agent.
- `telegram-drain-updates` uses `max-time=10`. If the network is slow at
  startup, the drain may fail silently (falls back to offset=0). In the worst
  case one stale message is processed as the prompt. Re-run to recover.
