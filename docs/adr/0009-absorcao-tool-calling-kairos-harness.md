# ADR 0009 — Absorção do ToolSectorHarness e Motor de Agentes Kairos

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time Chronokairo
- **Tags:** `kairos`, `harness`, `tool-calling`, `ai`, `setores`

---

## Contexto

O repositório `chronokairo-kairos` continha o motor `ToolSectorHarness`, responsável pelo registro modular de ferramentas por setor (comercial, vendas, marketing, cobrança, operacional), detecção de intenção do usuário e orquestração de chamadas de LLM. Conforme a diretriz do [AGENTS.md](file:///home/luann/.chronokairo/repos/AGENTS.md), o `ai` é a fonte única de IA do ecossistema Chronokairo.

## Decisão

1. **Absorção no `ai`:** O motor do Harness, contratos e hooks de chat foram integrados em `src/modules/harness/`.
2. **Distribuição das Ferramentas Especializadas:** As tools de vendas e comercial foram migradas para o `crm`, a automação de marketing para o `marketing`, e as integrações omnichannel para o `support`.
3. **Desativação do Kairos:** O repositório temporário `kairos` foi deletado.

---

## Log de Débitos Técnicos para Implementar

- [ ] **[DEB-AI-001]** Integrar o `ToolSectorHarness` (`src/modules/harness/harness/harness.ts`) ao pipeline de MCP e CLI Rust `ckc` do `ai`.
- [ ] **[DEB-AI-002]** Unificar os componentes de chat do harness com o Design System `@chronokairo/platform/ui`.
- [ ] **[DEB-AI-003]** Conectar as definições de provedores locais (`STATIC_LOCAL_PROVIDERS`) ao módulo de Vault e secrets do `platform`.
- [ ] **[DEB-AI-004]** Testar a execução de function-calling em streaming usando os providers OpenAI/Anthropic/Nvidia do `ai`.
