# Explore Report 01 — LLM Routing & Local Inference Layer

> Inventory produced 2026-08-08 for the vision-vs-codebase gap analysis.
> Scope: `src/llm/`, `src/llm/infer/`, `src/bench/`, `src/hw_recommend/`, `src/providers/`, `src/models_dev/` plus the routing call-sites in `src/agent/`, `src/main.rs`, `src/ui/`.

## 1. `src/llm/router.rs` (709 lines) — the central router

Runtime router between a local backend (Ollama HTTP or in-process GGUF `InferenceEngine`) and a lazily-built OpenAI-compatible cloud backend (NVIDIA NIM / Ollama Cloud). Decides per **model id** whether a request goes local or cloud, resolves provider-specific API ids, picks same-tier fallbacks, probes model latency, and estimates USD cost. Shared mutable state sits behind `Arc<Mutex<…>>` so the UI thread can hot-swap providers while the agent thread runs.

- `pub struct LlmRouter` — `router.rs:35-42`
- `DEFAULT_PROVIDER = "nvidia"` (`router.rs:9`), `DEFAULT_CLOUD_MODEL = "z-ai/glm-5.2"` (`router.rs:13`)
- `CostEstimate { input_usd, output_usd }` — `router.rs:46-56`
- `estimate_cost` — `router.rs:182-204` (prices from models.dev, zero for local/free; **post-hoc accounting, not a routing input**)
- `resolve` — `router.rs:213-225` (**model-id string match only; no task classification**)
- `client_for`, `generate`, `chat`, `stream` + retry/fallback wrappers — `router.rs:320-485`
- `supports_tool_calls` — `router.rs:397-408`
- `generate_with_retry_with_fallback` is a **no-op alias** for `generate_with_retry` (`router.rs:361-369`); `chat_meta_stream_with_fallback` calls `chat_meta_stream` directly with **no retry wrapper** (`router.rs:462`). **No local↔remote escalation at runtime.**

## 2. `src/llm/tier.rs` (315 lines)

Classifies models into `ModelTier { Dumb, Smart, Intelligent }` by regex rules over the model id, refined by catalog metadata (reasoning + tool_call + context); finds the cheapest same-tier fallback for the active provider.

- `classify_model_tier` — `tier.rs:38-99` (glm-5.2/deepseek/kimi→Intelligent; 30–70B→Smart; nano/7B/8B→Dumb; unknown→Smart)
- `find_same_tier_fallback` — `tier.rs:130-171` (same tier, different base id, tool-call match, **sorted by cheapest input cost**)
- Cost-aware in *fallback selection*; no confidence scoring, no hardware awareness.

## 3. `src/llm/provider_chain.rs` (504 lines)

Provider chain with token-bucket rate limiting, HTTP error classification, circuit breaking, and a `FallbackChain` walking a list of `CompletionProvider`s with per-provider retries + exponential backoff + jitter.

- `TokenBucket` (`:18`), `ProviderError` (`:57`), `CircuitBreaker` Closed/Open/HalfOpen (`:78-139`)
- `CompletionProvider` trait (`:144`); `NimProvider` (`:151`); `LocalProvider` (Ollama `/api/generate`, `:213-260`)
- `FallbackChain::complete` (`:316-369`): RateLimited/Transient → retry 3×; CreditExhausted → skip; Fatal → skip
- **NOT wired into `LlmRouter` or the agent loop.** Only production call-sites are cloud benchmarks (`bench/cloud.rs:55-70`, `bench/model_bench.rs:272-287`). Runtime path uses `LlmClient` retries instead.

## 4. `src/llm/model_resolver.rs` (179 lines)

Resolves a model name (`name:tag` or direct `.gguf` path) to an on-disk GGUF blob by reading Ollama manifests in candidate model roots; enumerates installed model names. Pure local-model discovery.

## 5. `src/llm/client.rs` (1656 lines)

`LlmClient` enum over `Ollama` (REST), `Local` (in-process `InferenceEngine`), and `Cloud` (OpenAI-compatible). Defines `ToolDef`, `ToolCall`, `TokenUsage`, `ResponseFormat`, `ToolChoice`. Exponential-backoff retry on 429/500/502/503 for cloud.

- `TokenUsage` — `client.rs:60-65`; Ollama fills from `prompt_eval_count`/`eval_count` (`:636-647`, `:880-901`); Cloud from `usage` (`:1072-1077`, `:1345-1363`)
- Local path flattens chat to a single prompt and always calls `eng.generate(prompt, 512, 0.8, 40)` — **hardcoded max_tokens=512 / temp=0.8 / top_k=40, `usage: None`** (`:425-449`, `:447`)
- Ollama fully supported; **vLLM: zero integration**; llama.cpp only via the in-process GGUF engine (no server).

## 6. `src/llm/embedder.rs` (245 lines)

Lazily-loaded local GGUF embedding engine (Qwen3-Embedding 0.6B Q8 default, Jina v5 fallback), Query/Passage instruction prefixes, last-token pooling, L2 normalization. Feeds `memory_search` semantic recall. A standalone embedding worker — not part of the routing path.

## 7. `src/llm/prompt.rs` (129 lines)

`PlannerPrompt` and `CoderPrompt` (Observe/Act/Verify/Repair, project-context assembly + repo map). Only planner/coder system prompts exist — **no prompts for error analysis, diff review, patch generation, or code explanation**.

## 8. `src/llm/infer/` — the local SLM runtime

- `engine.rs` (406): pure-Rust transformer `InferenceEngine` (RMSNorm, RoPE, MHA + KV cache, GQA, SwiGLU), token-by-token sampling, GEMV tries GPU first with CPU fallback. **Single-model-per-process, no streaming, no tool calling, no chat template, no confidence/logprobs, no token-usage reporting.**
- `model.rs` (336): GGUF `Model` loader + dequantization (F32/F16/Q4_0/Q8_0/Q4_K/Q5_0/Q6_K/Q8_K, llama.cpp `ggml-quants`-compatible).
- `gguf.rs` (287): bounds-checked GGUF parser.
- `tokenizer.rs` (229): BPE (gpt2) + SentencePiece-style unigram tokenizers.
- `ops.rs` (112): CPU kernels (RMSNorm, SiLU, matmul, RoPE, softmax) parallelized with rayon.
- `gpu/` (`mod.rs`, `context.rs`, `kernels.rs`): OpenCL 1.1+ acceleration aimed at legacy GPUs; all supported quantized weights uploaded to VRAM once; automatic CPU fallback. **No pre-flight VRAM sizing check.**

## 9. `src/bench/` — benchmarking

- `model_bench.rs` (303): local + cloud benchmark (load_ms/gen_ms/tps, hardware cross-reference, cloud match).
- `local.rs` (130) / `cloud.rs` (86): split implementations; `cloud.rs` is the **only place the NIM→local Ollama escalation chain is exercised** (`cloud.rs:62-69`), and only for benchmarking.

## 10. `src/hw_recommend/` — hardware detection & recommendation

- `detector.rs` (270): reads `/proc/cpuinfo`, `/proc/meminfo`, NVIDIA procfs, AMD/Intel DRM sysfs, `lspci -nn`. **Linux-only; Windows/macOS degrade to defaults.**
- `catalog.rs` (33): static local-model catalog (qwen3, qwen2.5-coder, llama3.x, granite3.3, deepseek-r1, mistral, gemma3, phi-4) with params/ctx/quant/size_gb.
- `scoring.rs` (132): quality/speed/fit/context scoring with VRAM/RAM fit, KV-cache estimates, TPS estimates keyed by GPU model.
- `recommender.rs` (82): VRAM-fit filter (VRAM × 0.85), top-10 ranking, hardware tier label.
- **Invoked only from CLI (`--recommend`, bench). The router/agent never consult hardware at runtime.**

## 11. `src/providers/` — credential store & verification

- `store.rs` (421): TOML-backed provider credentials (`~/.chronokairo/providers.toml`, chmod 600), env/.env discovery, base-URL + API-key resolution.
- `verify.rs` (57): `test_provider` via `GET {base}/models`, distinguishing 401/403/other. Default base list is a stub.

## 12. `src/models_dev/` — the pricing catalog

- `types.rs` (87): `Catalog`/`Provider`/`ModelInfo`/`Limits`/`Cost` (USD per M tokens)/`Modalities`/`CloudMatch`.
- `client.rs` (344): models.dev client (`https://models.dev/api.json`, 24h disk cache at `~/.cache/rustcode/models_dev.json`). `suggest_for_task` sorts by input cost; `match_local` family-prefix matching; `provider_model_api_id` id-rewriting used by the router.
- **The only place cost figures live.**

## Capability matrix (8 asked-for capabilities)

| Capability | Status | Where |
|---|---|---|
| a. Task classification / intent routing | **MISSING** | — |
| b. Local SLM workers (summarize) | **EXISTS** (summarizer role) | `agent_loop.rs:327`, `1543` (compact + adversarial review only) |
| b. SLM workers (error analysis, diff review, patch gen, code explain) | **MISSING** | — |
| c. Cost-aware routing (USD) | **PARTIAL** — priced + tracked, never a routing input | `router.rs:182`, `agent_loop.rs:469` |
| d. Hardware-aware routing (VRAM → model size) | **PARTIAL** — detector/scorer exist, detached from router, Linux-only | `hw_recommend/*` |
| e. Fallback/escalation (local→remote) | **PARTIAL** — cloud same-tier fallback + retry exist; local↔remote escalation not wired | `router.rs:166`, `provider_chain.rs:316` |
| f. Confidence scoring | **MISSING** | — |
| g. Ollama | **EXISTS** | `client.rs:512`, `provider_chain.rs:213` |
| g. llama.cpp | **PARTIAL** — GGUF-format engine in-process, no server | `infer/*` |
| g. vLLM | **MISSING** | — |
| h. Token/cost tracking | **EXISTS** per turn; local engine path reports none; not persisted | `client.rs:60`, `agent_loop.rs:468` |
