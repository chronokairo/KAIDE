# Antigravity LLM Server

An Antigravity extension that exposes the LLMs available in Antigravity through an **Ollama-compatible HTTP API**.

Any tool that works with Ollama — Open WebUI, Continue.dev, Cursor, LangChain, llama-index, etc. — can use Antigravity's LLMs without any changes.

## Default URL

```
http://127.0.0.1:11434
```

## Implemented Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Returns `"Ollama is running"` |
| `HEAD` | `/` | 200 OK liveness check |
| `GET` | `/api/version` | Returns server version |
| `GET` | `/api/tags` | Lists available Antigravity LM models |
| `GET` | `/v1/models` | OpenAI-compatible model list |
| `POST` | `/api/generate` | Generate a completion (streaming + non-streaming) |
| `POST` | `/api/chat` | Chat completion (streaming + non-streaming) |
| `POST` | `/api/show` | Show model details |
| `POST` | `/api/embed` | Returns 501 (not supported) |

## Model Names

Models are exposed as `{family}:{vendor}`, for example:

- `gemini-3-flash:antigravity`
- `claude-sonnet-4.6:antigravity`
- `claude-opus-4.6:antigravity`

You can also use just the family name with `:latest` (e.g. `gemini-3-flash:latest`) and the server will resolve the correct model.

## Auto Model

Use `auto` as the model name to let the server automatically:
1. Improve your prompt for clarity and detail
2. Select the best available model for the task

The auto-router uses `gemini-3-flash` for routing decisions.

## Quick Start

```bash
# Check if server is running
curl http://127.0.0.1:11434

# List available models
curl http://127.0.0.1:11434/api/tags

# Chat (streaming)
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "gemini-3-flash:antigravity",
  "messages": [{"role": "user", "content": "Why is the sky blue?"}]
}'

# Generate (non-streaming)
curl http://127.0.0.1:11434/api/generate -d '{
  "model": "gemini-3-flash:antigravity",
  "prompt": "Why is the sky blue?",
  "stream": false
}'

# Auto-route (let the server pick the best model)
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "auto",
  "messages": [{"role": "user", "content": "Explain quantum computing"}]
}'
```

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `antigravity-llm-server.host` | `127.0.0.1` | Bind address |
| `antigravity-llm-server.port` | `11434` | Port number |
| `antigravity-llm-server.autoStart` | `true` | Start automatically on Antigravity open |

## Commands

- **LLM Server: Start** — Start the HTTP server
- **LLM Server: Stop** — Stop the HTTP server
- **LLM Server: Show Status** — Show current status and open output channel
- **LLM Server: List Available Models** — Print available models to the output channel

## Available Models

All models provided by Antigravity are automatically exposed:

- Gemini 3.1 Pro (High/Low)
- Gemini 3 Flash
- Claude Sonnet 4.6 (Thinking)
- Claude Opus 4.6 (Thinking)
- GPT-OSS 120B (Medium)

## Build

```bash
cd antigravity-llm-server
pnpm install
pnpm build
pnpm package   # creates .vsix
```
