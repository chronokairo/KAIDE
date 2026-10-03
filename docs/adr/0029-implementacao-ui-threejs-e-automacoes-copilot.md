# ADR-0029 - Implementação da UI Three.js da Empresa Virtual e Automações do Copilot

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

A [ADR-0028](./0028-empresa-virtual-de-agentes-control-plane.md) definiu a ChronoKairo como uma software engineering company AI-first com supervisão humana, estabelecendo o repositório `chronokairo/ai` como o harness central da operação e definindo que a interface principal seria um adapter primário Three.js somente de acompanhamento com um gate de aprovação humana.

Era necessário:
1. Migrar a fonte de código para o GitHub corporativo (`chronokairo/ai`).
2. Configurar os custom agents e automações agendadas no ecossistema do GitHub Copilot App (`.copilot/`).
3. Implementar a arquitetura hexagonal para o domínio da empresa virtual e construir a cena Three.js espacial com as estações dos funcionários/agentes, partículas de handoff e o modal do Human Approval Gate.

## Decisões

### 1. Migração do Repositório para o GitHub
- Criado o repositório privado `https://github.com/chronokairo/ai.git` como `origin`.
- O repositório GitLab foi mantido como espelho secundário (`gitlab`) para contingência e rastreabilidade.
- O branch `main` foi sincronizado em ambos os remotos.

### 2. Integração com GitHub Copilot App e Automações no `.copilot/`
- Criado backup preventivo do SQLite do app (`data.db.backup-before-automations`).
- Identificada e mantida intacta a automação de usuário existente (`Issue triage`).
- Cadastradas no `data.db` (tabela `workflows`) as 6 automações diárias do harness vinculadas ao projeto `chronokairo/ai`:
  - `Commercial daily` (08:00) — Agente `commercial`
  - `Lead follow-up` (09:00) — Agente `commercial`
  - `Support triage` (09:30) — Agente `support`
  - `QA on PR` (10:00) — Agente `qa`
  - `Finance nightly` (02:00) — Agente `finance`
  - `Nightly maintenance` (03:00) — Agente `coder`
- Versionados no repositório:
  - `.github/copilot-instructions.md` (diretrizes operacionais e papéis).
  - 8 custom agents em `.github/agents/*.agent.md`.
  - 4 regras modulares em `.github/instructions/*.instructions.md` (`architecture`, `security`, `git`, `operations`).
  - 4 prompts padronizados em `.github/prompts/*.prompt.md`.
  - Catálogo documental em `docs/copilot-automations.md`.

### 3. Domínio e Casos de Uso Hexagonais
- **`src/domain/company.ts`**: Domínio puro definindo `AgentRole`, `AgentEntity`, `JobEntity`, `ApprovalGate` e `CompanyTelemetry`.
- **`src/application/ports/company-control-plane-port.ts`**: Contrato para consulta de snapshot e ações de aprovação/rejeição de gates humanos.
- **`src/application/use-cases/use-company-monitor.ts`**: Hook de orquestração consumido pela UI.
- **`src/infrastructure/control-plane/in-memory-control-plane.ts`**: Adaptador de telemetria em tempo real com eventos reativos.

### 4. Adapter Primário de Apresentação (Three.js)
- Instalado `three` e `@types/three`.
- **`src/infrastructure/ui/CompanyScene3D.tsx`**: Cena 3D interativa contendo:
  - Console Central Executivo: Sócio / Diretor Técnico (Humano Orquestrador e Aprovador).
  - 8 Estações de Trabalho dos Agentes Especializados dispostas em layout octogonal com halos temáticos e crachás de status em tempo real.
  - Tubos e fluxo de partículas representando handoffs (`AI → AI → AI → HUMAN`).
  - Raycaster para seleção com clique e controles de órbita (rotação, zoom e pan).
- **`src/infrastructure/ui/CompanyMonitor.tsx`**: HUD completo sobre a cena 3D contendo:
  - Barra de telemetria corporativa (agentes ativos, jobs entregues, custo computacional acumulado, tempo médio).
  - Lista de funcionários/agentes com filtro e visualização rápida de tarefas ativas.
  - Painel de inspeção lateral com histórico de tokens, custo e evidências de entrega.
  - **Human Approval Gate Modal**: Bloqueio de segurança quando um agente (ex: DevOps) solicita deploy em produção, exigindo verificação das evidências e aprovação humana explícita.
- **`src/app/page.tsx`**: Atualizado para carregar o `CompanyMonitor`.

## Consequências

- A interface atende estritamente à ADR-0028 como um adapter de acompanhamento visual 3D sobre o Control Plane.
- O modelo operacional `AI → AI → AI → HUMAN` possui validação visual e lógica ativa.
- Zero erros de tipagem (`npm run typecheck` validado).
