# ADR 0001: Route LLM traffic through a runtime LlmRouter

**Status:** Accepted  
**Date:** 2026-08-01

## Context

The TUI and agent loop were started with a single fixed `LlmClient` built once
in `main`. Selecting a model with `/model` only changed `Config.coder_model`;
the backend itself never changed.

That caused a real bug: after picking a cloud model (e.g. an NVIDIA NIM model
like `nvidia/llama-3.3-nemotron-super-49b-v1.5`), the request was still sent to
the local Ollama server, which has no such model. The same problem applied to
plain-name cloud providers such as Ollama Cloud (`nemotron-3-nano:30b`), which
we now want as the default cloud provider using `OLLAMA_API_KEY`.

## Decision

Introduce `LlmRouter` (`src/llm/router.rs`) that holds:

- a **local** backend (`LlmClient::Ollama` or local GGUF engine), and
- a lazily-built **cloud** backend (`LlmClient::Cloud`, OpenAI-compatible),
  created from the models.dev catalog base URL + the configured/environment API
  key via `ProviderStore::resolve_cloud_credentials`.

Routing per model id:

1. catalog match: the id (exact or normalized base id, e.g. `glm-5.2` also matches
   `z-ai/glm-5.2`) present in the **active provider's** models.dev catalog → cloud,
   and the request uses the provider-specific catalog id (`z-ai/glm-5.2` on NVIDIA
   NIM, `glm-5.2` on Ollama Cloud). One model can thus be served by several
   providers from a single selection;
2. ids explicitly marked cloud (picked from `/model`'s cloud list, or the model
   set by `--cloud`) → cloud;
3. provider-qualified ids (`nvidia/…`) → cloud;
4. everything else → local.

`/provider` now rebuilds the cloud backend live; the default provider is
`ollama-cloud`, and `OLLAMA_API_KEY` lives in the global `~/.chronokairo/settings.json`
(Claude Code-style `env` block). The agent
loop, repl and TUI all use the router — planner, executor, summarizer and the
tool-use loop all resolve through `LlmRouter`, so the selected model drives the
whole lifecycle and retries reuse the same resolved client.

## Consequences

- Selecting a cloud model in the TUI now actually reaches the cloud backend,
  and the same base model (`glm-5.2`) works under any configured provider
  (NVIDIA NIM sends `z-ai/glm-5.2`, Ollama Cloud sends `glm-5.2`).
- Switching providers (`/provider`) works without restarting; the model
  picker lists each model once (base id) and routing picks the provider id.
- Local-first behavior is preserved: plain local models still go to Ollama.
- Planner and executor no longer resolve their own client — the router is the
  single source of truth for provider choice across the whole agent lifecycle.
- Added unit tests for router routing/resolution, provider store, tools,
  compressor, memory, models.dev queries and UI helpers (118 total, all passing).
