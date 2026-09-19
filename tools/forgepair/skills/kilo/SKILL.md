---
description: Run Kilo Code CLI as a sub-agent for coding tasks
---

# Kilo Code Sub-Agent

Use the Kilo Code CLI (`kilo`) to execute coding tasks. Kilo Code is a fork of OpenCode with additional features like Kilo Gateway integration.

## When to use

- When the user wants to delegate a coding task to Kilo Code
- When they want to use Kilo-specific features (Kilo Gateway, Cloud Agent, etc.)
- When they want to run Kilo in autonomous mode for automated tasks

## How to invoke

Run Kilo Code with the task description:

```bash
kilo run "$ARGUMENTS"
```

For autonomous mode (no user interaction, auto-approve permissions):

```bash
kilo run --auto "$ARGUMENTS"
```

To continue the last session:

```bash
kilo run --continue "$ARGUMENTS"
```

## Examples

- `/claude-code-multi-agent:kilo implement a REST API for user management`
- `/claude-code-multi-agent:kilo --auto fix all linting errors in src/`
- `/claude-code-multi-agent:kilo --continue add error handling to the API`

## Notes

- Kilo Code must be installed: `npm install -g @kilocode/cli`
- The CLI will prompt for provider setup on first use
- Use `--auto` for CI/CD or automated workflows
- Kilo Code supports 500+ models through Kilo Gateway
