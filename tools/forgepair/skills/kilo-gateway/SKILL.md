---
description: Switch Claude Code to use Kilo Gateway with one command
---

# Kilo Gateway Quick Switch

Configure Claude Code to use Kilo Gateway for all model requests.

## What this does

Sets environment variables in `~/.claude/settings.json` to route Claude Code through Kilo Gateway, giving you access to 342+ models with your Kilo account.

## Prerequisites

1. Install Kilo CLI: `npm install -g @kilocode/cli`
2. Authenticate: `kilo auth login`
3. Get your API key from https://app.kilo.ai/console

## Quick Start

Run this command to configure:

```bash
claude-code-multi-agent:kilo-gateway
```

Or manually add to `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.kilo-code.ai",
    "ANTHROPIC_AUTH_TOKEN": "your-kilo-api-key",
    "ANTHROPIC_API_KEY": "",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

## Usage

After configuration, start Claude Code normally:
```bash
claude
```

Switch models with `/model` - all Kilo Gateway models will be available.

## Notes

- Kilo Gateway supports Anthropic-native model names
- Free tier models available (29+ options)
- No markup on model pricing
