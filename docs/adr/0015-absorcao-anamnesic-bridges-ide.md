# ADR 0015 — Absorção do Anamnesic Bridges (Bridges de IDE: VS Code e Antigravity para Ollama API)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time ChronoKairo
- **Tags:** `bridges`, `ide`, `antigravity`, `vscode`, `copilot`, `ollama-api`, `consolidacao`

---

## Contexto

O repositório `anamnesic/anamnesic-bridges` continha os servidores bridge que expõem os modelos internos dos IDEs (VS Code Copilot e Antigravity/Windsurf) como servidores locais HTTP compatíveis com a API do Ollama e OpenAI (`/api/generate`, `/api/chat`, `/api/tags`, `/api/raw-models`).

## Decisão

1. Integrar o servidor `antigravity-llm-server` em `chronokairo-ai/tools/llm-server/antigravity-llm-server`.
2. Sincronizar melhorias (como rota `/api/raw-models`) no `chronokairo-ai/tools/llm-server/vscode-llm-server`.
3. Deletar os repositórios remotos redundantes `anamnesic/anamnesic-bridges` e seu antecessor `anamnesic/anamnesic-bridge-copilot`.
