# ADR 0019 — Provider-Native Model Catalog

- **Status:** Accepted (2026-09-08)
- **Related ADRs:** ADR-0001 LLM Router, ADR-0003 Resilient Routing
- **Scope:** Provider discovery, model metadata cache, CLI provider configuration

## Context

The CLI previously depended on `models.dev` for provider metadata and model
lists. That introduced an external catalog as a source of truth, even though
each provider exposes an official model-listing endpoint. It also made model
availability and provider configuration diverge from the provider itself.

The project follows a zero-lib policy and already contains a native blocking
HTTP client, so provider discovery must not add a new dependency.

## Decision

- Remove the `ModelsDevClient` and the `models.dev` catalog client entirely.
- Add `ProviderCatalog` with a built-in registry of supported providers and
  their official API bases and environment variable names.
- Discover models on first use through official routes:
  - Ollama: `GET /api/tags`
  - Gemini: `GET /models?key=...`
  - OpenAI-compatible providers: `GET /models` with Bearer authentication
- Cache the resulting catalog at
  `~/.cache/rustcode/provider_catalog.json` for 24 hours.
- Remove the obsolete `models_dev.json` cache when loading the new catalog.
- Keep discovery best-effort: unavailable providers contribute no models while
  the remaining providers and metadata-only registry entries remain usable.
- Resolve credentials from the provider store first, then environment,
  global settings, and `.env`.

## Consequences

- Model lists reflect the provider's current official API instead of a third
  party catalog.
- The CLI can operate from cached provider metadata when offline.
- Pricing metadata is no longer supplied by `models.dev`; undiscovered or
  free/local models default to zero cost.
- Provider discovery requires valid credentials for authenticated APIs.
- The native blocking HTTP client now captures curl output and supports Bearer
  authentication, preventing response leakage and empty-body parsing failures.

## Verification

- `cargo check` passes.
- `cargo build` passes.
- `cargo test` passes: 415 passed, 0 failed, 3 ignored.
