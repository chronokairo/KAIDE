# ADR 0011 — Consolidação Definitiva do Kairos-Dev (Coding Agent & Prompts)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time ChronoKairo
- **Tags:** `kairos-dev`, `prompts`, `coding-agent`, `ckc`, `ai`

---

## Contexto

O repositório `chronokairo/kairos-dev` representava a versão de desenvolvimento do agente de coding autônomo e sua engenharia de prompts. Esse agente foi reimplementado nativamente em Rust na crate `src-tauri/core/ckc` e na casca desktop Tauri (`src-tauri/shell`) dentro do repositório unificado `chronokairo-ai`.

## Decisão

1. Absorver o corpus completo de system prompts de coding agent (`system-prompt-completo.txt` e análise de personas) em `docs/prompts/`.
2. Absorver as ferramentas de busca rápida baseadas em ripgrep em `tools/rg/`.
3. Descontinuar e deletar o repositório remoto `chronokairo/kairos-dev`.

---

## Log de Débitos Técnicos para Implementar

- [ ] **[DEB-AI-009]** Integrar os prompts especializados de refatoração e arquitetura do `system-prompt-completo.txt` na configuração de runtime do CLI `ckc`.
- [ ] **[DEB-AI-010]** Avaliar a substituição do wrapper Node de ripgrep pela chamada direta da crate `ignore`/`grep` em Rust dentro do `ckc`.
