---
description: Run OpenCode CLI as a sub-agent for coding tasks
---

# OpenCode Sub-Agent

Use the OpenCode CLI (`opencode`) to execute coding tasks. OpenCode is an open-source CLI coding agent with native TUI.

## When to use

- When the user wants to delegate a coding task to OpenCode
- When they want to use OpenCode's native agents (build, plan, explore)
- When they want to run OpenCode in autonomous mode for automated tasks

## How to invoke

Run OpenCode with the task description:

```bash
opencode run "$ARGUMENTS"
```

For autonomous mode (auto-approve permissions not explicitly denied):

```bash
opencode run --auto "$ARGUMENTS"
```

To continue the last session:

```bash
opencode run --continue "$ARGUMENTS"
```

To use a specific model:

```bash
opencode run --model "anthropic/claude-sonnet-4-6" "$ARGUMENTS"
```

To use a specific agent:

```bash
opencode run --agent "plan" "$ARGUMENTS"
```

## Examples

- `/claude-code-multi-agent:opencode implement user authentication`
- `/claude-code-multi-agent:opencode --auto refactor the database layer`
- `/claude-code-multi-agent:opencode --continue add unit tests`

## Notes

- OpenCode must be installed: `npm install -g opencode` or `bun install -g opencode`
- Run `opencode auth login` to configure API keys
- OpenCode supports models from Models.dev (OpenAI, Anthropic, Google, etc.)
- Use `--format json` for structured output suitable for piping
