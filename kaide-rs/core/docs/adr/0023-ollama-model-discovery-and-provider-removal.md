# ADR 0023 — Local Ollama Model Discovery and Zero-Lib Provider Decoupling

- **Status:** Accepted (2026-09-10)
- **Related ADRs:** ADR-0001 LLM Router, ADR-0020 Rebrand ChronoKairo CKC, ADR-0021 Local GGUF Model Pulling, ADR-0022 Local Model Lifecycle Management
- **Scope:** Transparent zero-copy recognition of Ollama-managed GGUF weights, local inference as the default execution mode, and removal of remote provider dependencies.

## Context

ChronoKairo has fully evolved its local inference capabilities with custom GGUF parsing, BPE/WordPiece tokenization, and an OpenCL/CPU GEMV matrix engine. Users frequently maintain existing model weights downloaded via Ollama in `~/.ollama/models` (or `%LOCALAPPDATA%\Ollama\models` / `OLLAMA_MODELS`), requiring gigabytes of storage per model.

Previously, using these weights required running the Ollama HTTP daemon or re-downloading identical GGUF weights into `~/.chronokairo/models`. Additionally, the harness defaulted to online cloud providers unless `--local` was explicitly passed.

To fulfill ChronoKairo's zero-lib and self-contained vision, the harness needed to:
1. Automatically discover, inspect, and execute existing Ollama GGUF models directly from disk without running Ollama or any background daemon.
2. Make local execution the first-class default (`use_local: true`), auto-resolving local models when `--model` is omitted.
3. Decouple from external cloud providers in standard CLI and TUI loops, treating local GGUF execution as primary.

## Decision

1. **Multi-Root Transparent Model Discovery (`src/llm/model_resolver.rs`)**:
   - `candidate_roots()` queries both ChronoKairo roots (`~/.chronokairo/models`) and standard Ollama directories (`OLLAMA_MODELS`, `~/.ollama/models`, `%LOCALAPPDATA%\Ollama\models`, `/usr/share/ollama/.ollama/models`).
   - For Ollama manifests (`manifests/registry.ollama.ai/...`), CKC inspects layer manifests for `application/vnd.ollama.image.model` digest pointers (`sha256-<hash>`) in `blobs/`.
   - Validates that the blob exists on disk, filtering out cloud-only manifests.
   - Allows flexible tag matching: specifying `qwen3.5` automatically resolves `qwen3.5:2b` if that is the available on-disk variant.

2. **Unified Model Table & Inspection (`src/llm/manage.rs`)**:
   - `ckc models` produces a clean table detailing `NAME`, `ID / BLOB`, `SIZE`, `FORMAT`, and `SOURCE` (`Local` vs `Ollama`).
   - `ckc show <model>`, `ckc run <model>`, and standard agent loops load the GGUF blob directly using zero-copy memory mapping (`std::fs::File`).

3. **Zero-Lib Local Inference as Default (`src/config/settings.rs`, `src/main.rs`)**:
   - `Settings::default().use_local` defaults to `true`.
   - `build_router()` directs execution to `InferenceEngine::new` unless `--cloud` is explicitly supplied.
   - When `--model` is omitted, CKC auto-detects the first available local GGUF model from `~/.chronokairo` or `~/.ollama`.
   - The interactive TUI launches into local inference directly without forcing remote cloud provider initialization.

## Consequences

- Users can seamlessly use existing Ollama models (`ckc show qwen3.5:2b`, `ckc run qwen3.5:2b`, `ckc models`) without duplicating weights or launching daemons.
- Zero network traffic or cloud tokens required for standard operation.
- Complete compliance with the Zero-Lib Policy: implemented using standard library file operations and JSON parsing primitives.
