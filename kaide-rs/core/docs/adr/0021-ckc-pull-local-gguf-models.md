# ADR 0021 — Local GGUF Model Pulling and Resolution (`ckc pull`)

- **Status:** Accepted (2026-09-10)
- **Related ADRs:** ADR-0007 GGUF Safety, ADR-0020 Rebrand ChronoKairo CKC
- **Scope:** Zero-lib local model download, trusted GGUF catalog, model resolver, GPU auto-activation

## Context

ChronoKairo Coder (`ckc`) supports 100% local, zero-lib inference via its native GGUF reader and OpenCL execution engine. To operate entirely offline without reliance on third-party cloud APIs or external daemons like Ollama, users need a straightforward way to download and manage verified GGUF models directly to their local machine (targeting 4GB VRAM edge hardware such as the NVIDIA GeForce GTX 1650).

## Decision

1. **`ckc pull <model>` Subcommand**:
   - Implemented `ckc pull` to download verified, quantized (Q4_K_M) GGUF models directly from Hugging Face into `$HOME/.chronokairo/models/`.
   - Supports curated model names (e.g. `qwen2.5-coder:3b`, `nemotron-mini:4b`, `ministral:3b`, `phi-4-mini:3.8b`, `gemma3:1b`, `llama-3.2:3b`), Hugging Face shorthand (`owner/repo/filename.gguf`), or direct HTTPS URLs.
   - Leverages zero-dependency download strategy: uses `curl.exe` with progress bar and resume capabilities (`-C -`) if available, falling back to internal HTTP client.

2. **Model Storage & Aliases**:
   - Saved models are stored in `~/.chronokairo/models/` following standard naming.
   - Generates `.alias` symlink/pointer files (e.g. `qwen2.5-coder-3b.alias`) enabling execution via `ckc --local --model qwen2.5-coder:3b`.

3. **Enhanced Model Resolver**:
   - Updated `model_resolver` candidate search roots to include `~/.chronokairo/models/` and legacy `~/.anamnesic/models/`.
   - Resolution prioritizes direct files, `.alias` mappings, trusted catalog filename lookups, and filename substrings, while retaining backward compatibility with Ollama manifest formats.
   - `ckc models` lists pulled GGUF models alongside Ollama models.

4. **GPU Auto-Activation with Disabling Flags**:
   - GPU acceleration is auto-activated when compiled with `--features gpu`.
   - Added `--no-gpu` flag (alias `--cpu`) and `CKC_NO_GPU=1` environment variable to explicitly disable OpenCL offloading and force CPU execution when desired.

## Consequences

- Users can bootstrap a complete offline agentic coding setup with a single command: `ckc pull qwen2.5-coder:3b` followed by `ckc --local --model qwen2.5-coder:3b`.
- Zero-Lib Policy is strictly preserved with zero new external dependencies in `Cargo.toml`.
- Tested and verified on Windows with all test suites passing.
