# ADR 0012 — Absorção do Athena (RAG Unificado e Ecossistema Legado)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time ChronoKairo
- **Tags:** `athena`, `rag`, `ai`, `content`, `consolidacao`

---

## Contexto

O repositório `chronokairo/athena` representava a iniciativa monorepo de RAG unificado e serviços satélites (studio, portaria, vendas). Conforme documentado no [AGENTS.md](file:///home/luann/.chronokairo/repos/AGENTS.md), as iniciativas de IA foram consolidadas como fonte única no `chronokairo-ai`, as capacidades criativas de estúdio foram transferidas para o `chronokairo-content`, e os módulos de portaria física foram incorporados ao `chronokairo-people`.

## Decisão

1. Encerrar formalmente o repositório `athena`.
2. Preservar integrações de CMS e estúdio no repositório oficial `chronokairo-content`.
3. Centralizar toda a esteira de RAG e embeddings no `chronokairo-ai`.
4. Deletar o repositório remoto `chronokairo/athena`.

---

## Log de Débitos Técnicos para Implementar

- [ ] **[DEB-AI-011]** Homologar o pipeline de busca semântica e chunking do `ai` para suportar indexação em larga escala de documentos corporativos.
- [ ] **[DEB-AI-012]** Adicionar suporte a múltiplos namespaces de RAG por produto (WorkMed, Legal, Projects) via Supabase pgvector.
