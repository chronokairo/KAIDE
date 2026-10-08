# ADR 0022 — Local GGUF Model Lifecycle Management (`rm`, `show`, `cp`, `ps`, `run`)

- **Status:** Accepted (2026-09-10)
- **Related ADRs:** ADR-0020 Rebrand ChronoKairo CKC, ADR-0021 Local GGUF Model Pulling
- **Scope:** Full local model lifecycle management commands mimicking Ollama ergonomics under zero-lib std-first constraints

## Context

With `ckc pull` delivering GGUF model binaries directly into `~/.chronokairo/models/`, developers operating on edge hardware (such as an NVIDIA GeForce GTX 1650 4GB VRAM) require complete local model lifecycle tools:
- Deleting weights and associated aliases to reclaim SSD space.
- Inspecting GGUF metadata, parameters, context limits, and hardware fit.
- Creating aliases and logical copies without duplicating gigabyte-sized files.
- Inspecting system hardware, GPU/OpenCL readiness, CPU workers, and VRAM utilization.
- Running direct one-shot completions and streaming interactive chat without spinning up the full agent state machine.

## Decision

We implemented five dedicated CLI subcommands and enhanced model discovery in `src/llm/manage.rs`:

1. **`ckc rm <model>` (alias: `remove`)**:
   - Deletes target `.gguf` file and cleans up all pointing `.alias` files in `~/.chronokairo/models/`.
   - Reports exact disk space reclaimed in gigabytes.

2. **`ckc show <model>` (alias: `inspect`)**:
   - Parses GGUF metadata via `GgufReader` to report architecture, exact parameter count (sum of tensor elements), context length, embedding dimension, block count, attention head topology, quantization format, and GTX 1650 (4GB VRAM) fit evaluation.

3. **`ckc cp <source> <target>` (alias: `copy`)**:
   - Creates a lightweight, zero-copy `.alias` pointer file, allowing instant access under custom identifiers (e.g. `ckc cp qwen2.5-coder:3b coder` enables `ckc --local --model coder`).

4. **`ckc ps`**:
   - Queries and reports local hardware acceleration status (OpenCL GPU device, available CPU threads for matrix workers), model storage usage, and runtime configuration flags.

5. **`ckc run <model> [prompt]`**:
   - Directly initializes `Model`, `Tokenizer`, and `InferenceEngine` to execute inference.
   - If `prompt` is provided: generates completion with real-time token streaming to stdout and prints generation statistics (`tok/s`).
   - If `prompt` is omitted: launches a lightweight interactive REPL chat session (`>>>`).

6. **Enhanced `ckc models`**:
   - Formats a clean tabular summary showing model name, filename, size in GB, quantization format, and last modified date.

## Consequences

- Full Ollama-like local command parity is achieved without running background daemons or external tools.
- Strict adherence to Zero-Lib Policy: implemented using standard library primitives (`std::fs`, `std::io`, `std::time`, `std::thread`).
- All 426 tests pass with 0 compiler warnings.
