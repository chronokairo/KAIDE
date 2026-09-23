# ADR Log — `chronokairo/ai`

Decisões arquiteturais do produto de IA (RAG, MCP, integrações, chat, desktop Tauri).

| ADR | Título | Data | Status |
| :--- | :--- | :---: | :---: |
| [ADR-0001](./adr/0001-unificacao-monorepo-ai.md) | Unificação do monorepo `ai` | — | Aceito |
| [ADR-0002](./adr/0002-centralizacao-ia-no-ai.md) | Centralização da IA do ecossistema no `ai` (recebe FroiaChat/proxy do froia; remove LLM providers p/ readição desacoplada) | 2026-09-23 | Aceito |

## Débitos técnicos abertos
- **Readicionar LLM providers desacoplados** (ADR-0002): 17 providers removidos por dependerem de `kairos/plugin-sdk` (não publicado). Padrão de desacoplamento validado no piloto `groq` (shim `_sdk/`). Providers pesados (google, github-copilot, ollama, deepinfra) exigem reimplementar runtime de image/video/speech/oauth/embeddings.
