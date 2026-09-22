# ChronoKairo Coder (`ckc`)

> **ChronoKairo CLI (CKC)** — Zero-Lib coding agent & context harness.

---

## 1. Overview & Philosophy

ChronoKairo Coder (`ckc`) is an autonomous, high-resilience AI coding agent and context harness built in Rust following a strict **Zero-Lib (Std-First)** architectural policy.

- **Zero-Lib Policy**: Avoids external framework bloat. The async runtime, HTTP/SSE client, terminal UI engine, diff rendering, argument parsing, and test runners are implemented exclusively using Rust standard library primitives (`std::*`) and minimal serialization (`serde`, `serde_json`).
- **In-Process GGUF Inference Engine**: Includes a native, pure-Rust GGUF parser, tokenizer, transformer runtime, and dequantization engine (`F32`, `F16`, `Q4_0`, `Q8_0`, `Q4_K`, `Q5_0`, `Q6_K`, `Q8_K`) with optional OpenCL GPU acceleration.
- **Per-Turn Transactional Safety**: Every mutating agent step is captured in a workspace snapshot with cryptographic change-tracking, diff preview, verification gates, repair budget, and automatic rollback on failure.
- **Universal Protocol Boundary**: Core agent orchestration communicates over an async queue-pair protocol (`Op` / `EventMsg`), allowing the same engine to drive the interactive TUI, headless execution, JSON-RPC app-server, and MCP server.

---

## 2. Architecture & Modules

```
src/
├── main.rs                    # Entry point, CLI routing, REPL
├── cli_args.rs                # Zero-lib argument parsing and CLI flags
├── async_rt/                  # Native cooperative async runtime & executor
│   ├── executor.rs            # Thread-parking waker and task polling
│   ├── io.rs                  # AsyncReadExt / AsyncWriteExt traits
│   └── task.rs                # Task spawning and join handles
├── http/                      # Zero-lib HTTP client (async, blocking, SSE)
├── protocol/                  # Queue-pair protocol & session abstraction
│   ├── event_log.rs           # Append-only canonical event persistence & replay
│   ├── session.rs             # Session { submit(Op), next_event() }
│   └── types.rs               # Op & EventMsg definitions
├── agent/                     # Pure orchestration loop & state machine
│   ├── agent_loop.rs          # Core tool loop, approval gates, verification
│   ├── executor.rs            # Tool execution and step dispatcher
│   ├── planner.rs             # Multi-step task planning and verification
│   ├── state.rs               # AgentState, todos, and session persistence
│   └── subagent.rs           # Parallel sub-agent task delegation
├── llm/                       # LLM routing, tier classification, and inference
│   ├── router.rs              # Multi-provider router with latency & cost tracking
│   ├── catalog.rs             # Provider-native model discovery (official APIs)
│   ├── client.rs              # Unified LlmClient (Ollama, Cloud, Native GGUF)
│   ├── embedder.rs            # Dense vector embeddings for semantic memory
│   └── infer/                 # Native pure-Rust GGUF inference runtime
│       ├── engine.rs          # Transformer runtime (KV-cache, attention, RoPE)
│       ├── model.rs           # GGUF weights loader & dequantization
│       ├── gguf.rs            # Bounds-checked GGUF parser
│       ├── tokenizer.rs       # Native BPE tokenizer
│       ├── ops.rs             # Multithreaded CPU tensor operations
│       └── gpu/               # OpenCL kernels for GPU acceleration
├── mcp/                       # Model Context Protocol support
│   ├── mod.rs                 # MCP stdio JSON-RPC client
│   └── server.rs              # MCP server exposing `run_coder`
├── app_server/                # JSON-RPC 2.0 stdio server (Codex pattern)
├── memory/                    # Short-term (context) & Long-term memory
│   ├── short_term.rs          # Conversation window & token budget
│   └── log.rs                 # Long-term memory store & vector search
├── skills/                    # Specialized Markdown skill packs (`./skills`)
├── tools/                     # Capabilities & verification engine
│   ├── fs.rs                  # Sandboxed FileTools (path-scoped permissions)
│   ├── transaction.rs         # Workspace snapshot, diff, rollback/keep
│   ├── patch.rs               # Unified patch generation & hunk application
│   ├── shell.rs               # Safe cross-platform shell command runner
│   ├── git.rs                 # Git tools & change inspection
│   ├── test.rs                # Verification gates (cargo test, pytest, npm)
│   └── background.rs          # Background task manager
└── ui/                        # Native Zero-Lib Terminal UI engine
    ├── engine/                # Custom buffer, framebuffer, vt terminal, widgets
    ├── file_search.rs         # Fuzzy file search (Ctrl+P)
    ├── diff_render.rs         # Pager diff highlighter
    └── mod.rs                 # Reactive TUI lifecycle & event loop
```

---

## 3. Getting Started

### Prerequisites

- **Rust**: 2021 edition (`rustc` and `cargo` installed).
- Optional: OpenCL drivers if building with GPU acceleration.

### Building from Source

```bash
# Clone repository
git clone https://github.com/chronokairo/cli.git
cd cli

# Build release binary (ckc)
cargo build --release

# The compiled binary will be located at target/release/ckc (or ckc.exe on Windows)
```

To enable GPU acceleration for local GGUF inference:
```bash
cargo build --release --features gpu
```

---

## 4. Usage

### Interactive TUI

Launch the full interactive terminal interface:
```bash
ckc
```
- **Slash Commands**: `/model`, `/provider`, `/info`, `/status`, `/reset`, `/resume`.
- **Keybindings**: `Ctrl+P` (fuzzy file finder), `Ctrl+O` (active tools overlay), `Ctrl+L` (clear screen), `Esc` (interrupt generation).

### Headless Execution (`exec`)

Execute a task autonomously with verification and rollback protection:
```bash
# Run task directly
ckc exec "Fix memory leak in connection pool and run tests"

# Auto-approve tool permissions
ckc exec "Add documentation to public API" --yes

# Output streaming JSONL events for programmatic consumers
ckc exec "Refactor error handling" --jsonl
```

### Downloading Embedding Model

Download the default GGUF embedding model (`Qwen3-Embedding 0.6B Q8`) for local semantic code search:
```bash
ckc --download-embedding-model
```

### Local GGUF Model Lifecycle (`pull`, `models`, `run`, `show`, `cp`, `rm`, `ps`)

ChronoKairo operates **100% locally and zero-lib by default**. It natively discovers models stored in `~/.chronokairo/models/` as well as any existing models in Ollama (`~/.ollama/models`, `OLLAMA_MODELS`, `%LOCALAPPDATA%\Ollama\models`) without requiring background daemons:

```bash
# 1. Pull verified SLMs for edge hardware (e.g. GTX 1650 4GB VRAM)
ckc pull qwen2.5-coder:3b

# 2. List all local and Ollama models with size, format, and source
ckc models

# 3. Inspect model architecture, layers, parameters, and VRAM fit (works with Ollama blobs too!)
ckc show qwen3.5:2b

# 4. Create lightweight, zero-copy alias
ckc cp qwen2.5-coder:3b coder

# 5. Direct inference or interactive streaming chat (without agent tools)
ckc run qwen3.5:2b "Write a binary search algorithm in Rust"
ckc run qwen3.5:2b

# 6. Check system hardware, GPU/OpenCL readiness, CPU workers, and VRAM utilization
ckc ps

# 7. Delete model and associated aliases to reclaim disk space
ckc rm coder

# 8. Launch full autonomous agent loop (defaults to local execution automatically!)
ckc
ckc "Refactor error handling in src/llm"
```

### Provider Configuration

Configure cloud LLM providers (keys stored securely at `~/.chronokairo/providers.toml`):
```bash
# Set provider credentials
ckc providers set nvidia --key nvapi-xxxx

# List configured providers
ckc providers list

# Test provider connection and list available models
ckc providers test nvidia
```

### Server Modes

- **App Server (JSON-RPC 2.0 stdio)**:
  ```bash
  ckc app-server
  ```
- **MCP Server (Model Context Protocol)**:
  ```bash
  ckc mcp-server
  ```

---

## 5. Configuration & Paths

ChronoKairo maintains its configuration in the user home directory with seamless backward-compatibility for legacy `.anamnesic` installations:

| Configuration / Data | Primary Path | Legacy Fallback |
|----------------------|--------------|-----------------|
| Global Settings | `~/.chronokairo/settings.json` | `~/.anamnesic/settings.json` |
| Provider Credentials | `~/.chronokairo/providers.toml` | `~/.anamnesic/providers.toml` |
| Embedding Models | `~/.chronokairo/models/embeddings/` | `~/.anamnesic/models/embeddings/` |
| Global Skills | `~/.chronokairo/skills/` | `~/.anamnesic/skills/` |
| Execution Policy | `~/.chronokairo/exec_policy.toml` | `~/.anamnesic/exec_policy.toml` |
| Long-term Memory DB | `~/.chronokairo/memory.db` | `~/.anamnesic/memory.db` |

---

## 6. Testing & Quality Assurance

The codebase includes an extensive suite of unit and integration tests across all modules:

```bash
# Run all unit and integration tests
cargo test

# Fast compilation check
cargo check
```

- **Zero-Warning Guarantee**: The project compiles with zero compiler warnings under standard targets.
- **Test Suite**: 415+ unit and integration tests covering path-scoped security, sandbox isolation, GGUF parsing, diff engines, and multi-agent coordination.

---

## 7. Architectural Decisions (ADRs)

Detailed architectural decision records are maintained in [`docs/adr/`](docs/adr/):
- `0001–0010`: LLM router, parity benchmarks, routing resilience, context intelligence, token tracking.
- `0011–0015`: Sub-agent task delegation, MCP client, streaming deltas, circuit breaker, competitive backlog.
- `0016–0019`: Vision gap analysis, specification-locked execution, versioned H-battery, provider-native model catalog.
- `0020`: Rebranding to ChronoKairo and `ckc` binary transition with backward compatibility fallbacks.
- `0021`: Local GGUF model pulling and resolution (`ckc pull`).
- `0022`: Local GGUF model lifecycle management (`rm`, `show`, `cp`, `ps`, `run`).
