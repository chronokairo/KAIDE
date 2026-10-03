# ChronoKairo AI — Harness da empresa virtual de agentes

Este repositório (`chronokairo/ai`) é o **harness**: o sistema operacional dos agentes da ChronoKairo. As regras completas estão em [`AGENTS.md`](../AGENTS.md) e na [ADR-0028](../docs/adr/0028-empresa-virtual-de-agentes-control-plane.md). Leia-os antes de alterar código.

## Papéis

| Peça | Papel |
| --- | --- |
| **Copilot App → Automations** | Gatilho (horário, evento de issue/PR). Só diz *quando* e *qual job*. Não contém lógica de negócio. |
| **Custom agents** (`.github/agents/`) | Capacidades: *o que* cada papel sabe fazer. |
| **Harness (este repo)** | Governa a execução: jobs, contexto, permissões, ordem, aprovação, auditoria, retry. |
| **PostgreSQL** | Estado, jobs, eventos e auditoria. |
| **GitHub** | Código, PRs e issues. |

Uma automação deve ser pequena: *"execute o job `<tipo>`"*. O harness decide repositórios, tarefas, contexto e permissões.

## Regras que valem sempre

- Modelo operacional: **AI → AI → AI → HUMAN**, nunca AI → produção. Fluxo: `plan → execute → verify → evidence → approval → merge/deploy`.
- Todo trabalho é um `Job` (tipo, agente, repositório, projeto, entrada, contexto, permissões, status, tentativas, resultado) com eventos append-only.
- Dinheiro real, produção, ações destrutivas e irreversíveis exigem aprovação humana explícita.
- Ferramentas de escrita: autenticação, `organizationId` validado no servidor, permissão específica, validação de entrada, idempotência e auditoria. O modelo nunca amplia permissões.
- Segredos só no backend. Nunca em prompts, issues, PRs ou logs.
- Arquitetura hexagonal: `domain` puro → `application/ports` → `application/use-cases` → `infrastructure`. Detalhes no `AGENTS.md`.
- Comandos via **npm**: `npm run typecheck`, `npm test`, `npm run build`. Não use pnpm/yarn.
- Next.js neste repo tem mudanças que quebram o que você conhece; consulte `node_modules/next/dist/docs/` antes de escrever código Next.

## Onde está cada coisa

- `.github/agents/` — um arquivo `*.agent.md` por papel (commercial, analyst, product, coder, qa, devops, support, finance).
- `.github/instructions/` — regras por tema, aplicadas por `applyTo` (arquitetura, segurança, git, operação).
- `.github/prompts/` — prompts reutilizáveis (`discover`, `implement`, `review`, `deploy`).
- [`docs/copilot-automations.md`](../docs/copilot-automations.md) — catálogo das automações a criar no Copilot App.
