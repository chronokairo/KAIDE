# Changelog

All notable changes to the NVIDIA LLM Ranking project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release
- Integration with models.dev API for comprehensive model metadata
- Automated benchmarking for 92+ NVIDIA NIM models
- Professional Next.js dashboard with light/dark mode
- Tool calling detection and verification
- Vision/multimodal support testing
- Reasoning effort mechanism detection
- Dynamic S/A/B/C tier assignment based on performance
- Real-time latency metrics (p50, p95, min, max)
- Availability scoring over multiple probe rounds
- Company-grouped model organization
- Model toggle/disable functionality
- models.dev metadata caching system
- Comprehensive README with usage examples

### Changed
- **BREAKING**: Replaced Ollama integration with models.dev API
  - Removed `scripts/ollama-models.mjs`
  - Removed `scripts/sync-ollama-contexts.mjs`
  - Removed `data/ollama-context-cache.json`
  - Added `scripts/models-dev-api.mjs` for models.dev integration
  - Added `scripts/sync-models-dev.mjs` for metadata syncing
  - Updated `generate-nvidia-ranking.mjs` to use models.dev metadata
- Updated package.json scripts:
  - `ollama:sync` → `models:sync`
  - `rank:full` now syncs models.dev instead of Ollama

### Removed
- Ollama API dependencies and integration
- `OLLAMA_BASE_URL` environment variable (no longer needed)
- Ollama-specific context size resolution

## [0.1.0] - 2026-05-24

### Added
- Initial project structure
- NVIDIA NIM API integration
- Basic benchmarking engine
- Tool calling tests
- Vision support detection
- Effort/reasoning mechanism tests
- Latency measurement
- Availability scoring
- Next.js dashboard
- API routes for ranking data

[Unreleased]: https://github.com/chronokairo/nvidia-llm-ranking/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/chronokairo/nvidia-llm-ranking/releases/tag/v0.1.0
