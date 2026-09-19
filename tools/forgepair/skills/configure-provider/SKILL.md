---
description: Configure Claude Code to use Kilo Gateway and other model providers
---

# Multi-Provider Model Configuration

Configure Claude Code to use models from Kilo Gateway, OpenCode providers, or any Anthropic-compatible API.

## Quick Setup

Run the configuration command to set up provider routing:

```bash
# Using Kilo Gateway (342+ models, 29 free)
claude-code-multi-agent:configure-provider kilo

# Using a custom Anthropic-compatible endpoint
claude-code-multi-agent:configure-provider custom
```

## Environment Variables

The plugin sets these variables in `~/.claude/settings.json`:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_BASE_URL` | API endpoint (omit `/v1`) |
| `ANTHROPIC_AUTH_TOKEN` | Provider API key |
| `ANTHROPIC_MODEL` | Default model |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Sonnet tier mapping |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Opus tier mapping |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Haiku tier mapping |

## Provider: Kilo Gateway

Kilo Gateway provides access to 342+ models including free tier options.

**Endpoint:** `https://api.kilocode.ai`

Setup:
1. Install Kilo CLI: `npm install -g @kilocode/cli`
2. Authenticate: `kilo auth login`
3. Get your API key from Kilo Console

Config:
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.kilocode.ai",
    "ANTHROPIC_AUTH_TOKEN": "your-kilo-api-key",
    "ANTHROPIC_API_KEY": "",
    "ANTHROPIC_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

## Provider: OpenRouter

Access to multiple LLMs (GPT, Gemini, Llama, etc.).

**Endpoint:** `https://openrouter.ai/api`

Config:
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
    "ANTHROPIC_AUTH_TOKEN": "your-openrouter-key",
    "ANTHROPIC_API_KEY": "",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "anthropic/claude-sonnet-4",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "anthropic/claude-opus-4",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "anthropic/claude-haiku-4"
  }
}
```

## Provider: DeepSeek

Cheap, capable models with Anthropic-compatible endpoint.

**Endpoint:** `https://api.deepseek.com/anthropic`

Config:
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your-deepseek-key",
    "ANTHROPIC_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-pro",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_SUBAGENT_MODEL": "deepseek-v4-flash"
  }
}
```

## Provider: Z.ai (GLM)

Z.ai's GLM models with Anthropic-compatible API.

**Endpoint:** `https://api.z.ai/api/anthropic`

Config:
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your-zai-key",
    "ANTHROPIC_MODEL": "zai-org/glm-5.1",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "zai-org/glm-5.1",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "zai-org/glm-5.1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "zai-org/glm-5.1-flash"
  }
}
```

## Provider: Ollama (Local)

Run models locally with zero cost.

**Endpoint:** `http://localhost:11434`

Config:
```bash
export ANTHROPIC_AUTH_TOKEN=ollama
export ANTHROPIC_API_KEY=""
export ANTHROPIC_BASE_URL=http://localhost:11434
claude --model qwen3.5
```

## Switching Between Providers

Use shell aliases to switch quickly:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias claude-kilo='ANTHROPIC_BASE_URL="https://api.kilo-code.ai" ANTHROPIC_AUTH_TOKEN="kilo-key" ANTHROPIC_API_KEY="" claude'
alias claude-openrouter='ANTHROPIC_BASE_URL="https://openrouter.ai/api" ANTHROPIC_AUTH_TOKEN="or-key" ANTHROPIC_API_KEY="" claude'
alias claude-deepseek='ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic" ANTHROPIC_AUTH_TOKEN="ds-key" ANTHROPIC_API_KEY="" claude'
alias claude-glm='ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic" ANTHROPIC_AUTH_TOKEN="zai-key" ANTHROPIC_API_KEY="" claude'
```

## Notes

- Always set `ANTHROPIC_API_KEY=""` when using third-party providers to prevent fallback
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` prevents telemetry to Anthropic
- Model names must be valid for the target provider
- For Kilo Gateway, use Anthropic-native model names (e.g., `claude-sonnet-4-6`)
