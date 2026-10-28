# ADR 0010 — Absorção dos Módulos Sala e Core (Capacidades de IA, Multiagente e MCP)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time Chronokairo
- **Tags:** `sala`, `core`, `mcp`, `multiagente`, `rag`, `ai`

---

## Contexto

Os pacotes legados `sala` e `core` (do monorepo Kairos/Anna) continham orquestração multiagente, catálogo de ferramentas MCP, workflows determinísticos, persistência de memória e planejamento de agentes. Em conformidade com o [AGENTS.md](file:///home/luann/.chronokairo/repos/AGENTS.md), o `chronokairo-ai` é a fonte única oficial de todas as capacidades de IA do ecossistema.

## Decisão

1. **Orquestração & Agentes (Sala):** Absorvido em `src/modules/orchestration/` (features de RAG, MCP, memória persistente, multiagente, orquestrador de ferramentas e workflows).
2. **Catálogo de Ferramentas MCP & Planejamento (Core):** Absorvido em `src/modules/mcp-catalog/` e `src/modules/agent-planner/`.
3. **Exclusão de Repositórios Legados:** Os repositórios remotos `chronokairo/sala` e `chronokairo/core` foram descontinuados e deletados.

---

## Log de Débitos Técnicos para Implementar

- [ ] **[DEB-AI-005]** Integrar o catálogo MCP (`src/modules/mcp-catalog/catalog.ts`) com o executor nativo em Rust (`src-tauri/core/ckc`).
- [ ] **[DEB-AI-006]** Conectar a memória persistente (`src/modules/orchestration/memoria-persistente`) ao banco Supabase vetorial do `@chronokairo/platform/database`.
- [ ] **[DEB-AI-007]** Adaptar o conversor `to-openai-tools.ts` para suportar os schemas dos modelos Anthropic e Gemini via AI SDK.
- [ ] **[DEB-AI-008]** Adicionar testes unitários com Vitest para a orquestração multiagente.
