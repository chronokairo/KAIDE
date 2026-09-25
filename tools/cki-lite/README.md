# cki-lite

Terminal display supports Markdown headings, emphasis, inline and fenced code,
lists, links, tables and common LaTeX symbols/fractions/superscripts. Shell executable positions and inline code are cyan;
stdout is green, stderr is red, and exit status is shown separately. Raw Markdown
and tool output are preserved in session exports. Pipe output is plain by default.
Use `--renderer auto|ansi|plain`. Auto enables formatted output on an interactive
UTF-8 terminal and preserves plain streaming for pipes or limited terminals. Use
`--color always` to force colors or `--color never` / `NO_COLOR=1` to disable
automatic colors.

The NVIDIA catalog is cached after its first successful fetch. Use `--refresh-models`
to refresh it. A locally measured shortlist in `~/.cki-lite/cache/selected.json`
overrides the family filter and orders the menu by measured tool-call latency.
Benchmark success validates a basic tool call, not general intelligence or every
Alpine operation. Timeouts are inconclusive, not proof that a model is unavailable.

Minimal open-source terminal agent for NVIDIA NIM. It uses only Python's standard library, works on Alpine Linux, exposes a CLI chat, supports OpenAI-compatible tool calling, and can execute shell commands requested by the agent.

## Requirements

- Python 3.8+
- An NVIDIA NIM API key

## Setup

```sh
export NVIDIA_API_KEY='nvapi-...'
chmod +x cki-lite.py
./cki-lite.py --list-models
./cki-lite.py
./cki-lite.py --verbose
./cki-lite.py --version
./cki-lite.py --model MODEL --prompt 'inspect the current directory'
./cki-lite.py --resume
```

Providers OpenAI-compatible adicionais podem ser selecionados sem dependências
extras:

```sh
./cki-lite.py --provider ollama
./cki-lite.py --provider openrouter --model openai/gpt-oss-120b
./cki-lite.py --provider groq --model openai/gpt-oss-120b
./cki-lite.py --provider gemini --model gemini-2.5-flash
```

Use `OLLAMA_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY` ou `GEMINI_API_KEY`.
Ollama local usa `ollama` como credencial padrão e normalmente não requer chave.
Também é possível definir `CKI_LITE_PROVIDER` e o `*_BASE_URL` correspondente.

Para uso sem prompt, crie um `.env` ao lado do script ou em `~/.cki-lite/.env`:

```dotenv
NVIDIA_API_KEY=nvapi-...
NIM_BASE_URL=https://integrate.api.nvidia.com/v1
```

O `.env` é carregado automaticamente e ignorado pelo Git.

The default endpoint is `https://integrate.api.nvidia.com/v1`. Override it with `NIM_BASE_URL` or `--base-url` for a self-hosted NIM deployment.

Only Gemma 3/4, OpenAI GPT-OSS and text-oriented Nemotron instruct/super/ultra/lightning/nano models are shown. Embedding, vision, safety, parser, reward and other specialized models are filtered out.

## CLI commands

- `/help` — show all chat commands.
- `/model [number|name]` — switch model while preserving conversation history.
- `/models` — list available models and mark the active one.
- `/provider [name]` — list or switch provider and select one of its models.
- `/renderer [auto|ansi|plain]` — inspect or change output rendering.
- `/status` — show provider, model, session and renderer.
- `/terminal` — execute a shell command directly.
- `/clear` — clear conversation history.
- `/quit` — exit.

If a selected model fails, cki-lite automatically tries another visible Gemma/Nemotron model while preserving the task history.

Use `--verbose` to see the observable agent trace: loop number, active model, message count, request latency, tool calls, command execution, exit codes, timeouts and model fallback. Provider hidden chain-of-thought is not exposed; the trace shows actions and results instead.

Use `--prompt` for a single non-interactive task. Tool output is bounded to
12,000 characters and the oldest conversation messages are removed when the
serialized history exceeds 60,000 characters.

Use `--benchmark-models` to measure visible models and persist their latency order
in `~/.cki-lite/cache/selected.json`. Use `--install` to copy the executable to
`~/.local/bin/cki-lite` on Unix.

## Saved conversations and debug export

Sessions are saved automatically as JSON under `~/.cki-lite/` (override with `CKI_LITE_HOME`). The session ID is printed when chat starts.

Use `--resume` or `--session` without an ID to see recent conversations and
select one by number. The menu shows the update time, model and latest user prompt.
`--session ID` remains available for scripts.

```sh
./cki-lite.py --session 20260908-120000-a1b2c3  # resume
./cki-lite.py --export debug.json                # export all sessions
./cki-lite.py --session 20260908-120000-a1b2c3 --export debug.json
```

Inside a chat, `/save` saves immediately and `/export` exports the current session. Export files contain messages, tool calls, command output, model changes and loop context, but never the API key.

## Security

The terminal tool runs commands with the same permissions as the `cki-lite` process. Run it only on a machine you control. Never commit API keys; use `NVIDIA_API_KEY` or an interactive prompt.

Commands recognized as read-only run automatically. Mutating commands require an
interactive `y/N` confirmation; destructive commands require typing
`yes, I understand`. Unknown commands are treated as mutating, and all commands
requiring confirmation are blocked when stdin is not a terminal. These guardrails
are a confirmation layer, not a sandbox or privilege boundary.

## License

MIT. See [LICENSE](LICENSE).
