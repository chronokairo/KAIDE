# ADR-0007 — Absorção dos Ativos de Governança e Segurança do ThinkCoffee

- **Data:** 2026-09-24
- **Status:** Aceito
- **Contexto:** Decisão de extrair a propriedade intelectual de alto valor do `thinkcoffee` (SafetyNet, guardrails, dry-run, snapshots e controle de custos) e integrá-la no `chronokairo-ai`.

---

## 1. Contexto

O projeto legado `thinkcoffee` tentou atuar como um assistente autônomo baseado em extensão do VS Code e pipeline encadeado de múltiplos agentes (`PM` → `Arquiteto` → `Backend` → `Frontend` → `QA`). O formato original foi descontinuado devido ao consumo excessivo e descontrolado de tokens de IA e à redundância com o runtime nativo da Chronokairo (Tauri + Rust `ckc` e CLI).

Entretanto, o `thinkcoffee` desenvolveu mecanismos avançados de segurança, reversibilidade de operações e roteamento de custos que resolvem carências críticas de operação de coding agents.

---

## 2. Decisão

Absorver seletivamente os seguintes componentes do `thinkcoffee` no novo módulo `@chronokairo/ai/governance` (`src/modules/governance/`):

1. **Guardrails & Command Validator (`command-validator.ts`):**
   - Blacklist regex de comandos catastróficos/bloqueados (`fork bombs`, `crypto miners`, reverse shells, gravação direta em partições).
   - Lista canônica de comandos destrutivos que exigem aprovação humana explícita (`rm -rf`, formatação de disco, `sudo`, `git push --force`, `git reset --hard`, `DROP DATABASE`, `kill -9`).
   - Integrado diretamente ao `SecurityPanel.tsx` do chat de IA.

2. **Snapshot e Rollback Atômico (`snapshot.service.ts` e `rollback.service.ts`):**
   - Criação de snapshots determinísticos indexados por SHA-256 em `~/.chronokairo/snapshots/` antes de mutações de arquivos.
   - Planejamento e execução de reversão instantânea de arquivos criados, alterados ou deletados pelo agente.

3. **Modo Dry-Run / Simulação (`dry-run.manager.ts`):**
   - Execução simulada sem gravação em disco para visualização prévia de diffs e planos de ação antes de conceder permissão real.

4. **Trilha de Auditoria Forense (`action-log.service.ts`):**
   - Gravação em `.jsonl` por sessão com cada chamada de ferramenta, diffs gerados, tempos de execução e status.

5. **Quality Presets & Cost Tiers (`quality-presets.ts`):**
   - Roteamento de modelos com base em multiplicadores de custo (Free 0x, Budget 0.25x, Lite 0.33x, Standard 1x, Premium 3x, Ultra 30x), eliminando a queima de tokens caros em tarefas rotineiras.

---

## 3. O que foi Descartado do ThinkCoffee

- **Extensão do VS Code (`packages/vscode`):** O projeto adota oficialmente o app Tauri e CLI Rust.
- **Pipeline Rígido (`pipeline.ts`):** Substituído pelo modelo de pairing conversacional sob demanda.
- **Servidor Hono / TypeORM (`packages/mcp-server`):** Eliminado para não inflar consumo de RAM nem criar daemons concorrentes com o Rust `ckc`.

---

## 4. Validação

- Módulo exposto em `package.json` (`./governance`).
- Suíte de testes unitários criada em `src/modules/governance/__tests__/governance.test.ts` (8 testes passando com 100% de sucesso via Vitest).
- `npm run typecheck` passando com 0 erros.
