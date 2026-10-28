# ADR 0017 — Absorção do Anamnesic Context (Memória de Agentes, Context Engine e MCP Server)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time Chronokairo
- **Tags:** `context`, `memory`, `mcp-server`, `guardrails`, `agent-runtime`, `consolidacao`

---

## Contexto

A retenção de memória de longo prazo, contexto entre sessões e endpoints de integração via Model Context Protocol (MCP) foram desenvolvidos no repositório `anamnesic/anamnesic-context`. O sistema implementa pipelines de ingestão de contexto, guardrails, sincronização de decisões de arquitetura e servidores de endpoints MCP (`projectEndpoints`, `resourceEndpoints`, `promptEndpoints`).

Com a aquisição integral dos direitos da organização `anamnesic`, os ativos foram integrados internamente.

## Decisão

1. Absorver o módulo em `chronokairo-ai/tools/context`.
2. Integrar suas capacidades de MCP server ao catálogo oficial de MCP do Chronokairo.
3. Deletar o repositório remoto redundante `anamnesic/anamnesic-context`.
