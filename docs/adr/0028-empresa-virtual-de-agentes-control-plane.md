# ADR-0028 - Empresa virtual de agentes (AI-first): Control Plane, evidência e aprovação, UI Three.js

**Status:** Proposto
**Data:** 2026-10-03

## Contexto

A ChronoKairo quer operar como uma **software engineering company AI-first**: poucas pessoas (sócio/CTO, opcionalmente um Customer/Project Lead, e terceiros sob demanda como contador, jurídico e especialistas) e agentes especializados no lugar da maior parte dos cargos operacionais. O repositório `ai` deixa de ser apenas o chat de IA e passa a ser o sistema operacional dessa empresa.

## Decisão

### 1. Modelo operacional

`AI → AI → AI → HUMAN`, nunca `AI → produção`. Todo trabalho segue:

```text
plan → execute → verify → evidence → approval → merge/deploy
```

O humano é orquestrador e aprovador. Dinheiro real e produção exigem aprovação humana. Ambientes: `DEV → STAGING → aprovação humana → PRODUCTION`; agentes não têm acesso irrestrito à produção.

### 2. Agentes (papéis)

| Agente | Responsabilidade |
| --- | --- |
| Comercial | lead, pesquisa, fit, CRM, abordagem, follow-up, briefing, proposta e contrato |
| Analista | requisitos, escopo, épicos, histórias, tarefas, critérios de aceitação, arquitetura e estimativa |
| Product | UX/UI, especificação e design |
| Coder | clone, leitura da arquitetura, plano, edição, testes, correção, commit e PR |
| QA | tenta quebrar o código: unit, integração, E2E, API, segurança, regressão e performance; devolve bugs ao Coder |
| DevOps | Docker, CI/CD, deploy, logs, monitoramento, backup e rollback |
| Support | classifica chamados: conhecido (solução automática), simples (IA corrige), crítico (humano) |
| Finance/Ops | cobrança, contas a pagar e receber, conciliação, fluxo de caixa, DRE, relatórios; dinheiro real com aprovação humana |

### 3. Control Plane

Componente central de orquestração: `cliente → demanda → projeto → tasks → agentes → tools → evidências → aprovação → entrega`. Cada execução gera um `Job`:

```text
Job: contexto, agente, prompt, ferramentas usadas, alterações,
     testes, evidências, custo, duração, status
```

- O `Job` e seus eventos formam um **event log** append-only, base de auditoria e de evidência.
- Ferramentas são tipadas e autorizadas; o modelo nunca escolhe nem amplia permissões (regras do `AGENTS.md`).
- O **Chronokairo CLI (`ckc`)**, que vive em `chronokairo/cli` ([ADR-0027](./0027-extracao-core-ckc-para-repo-cli.md)), é a camada de execução do agente Coder (terminal, Git, testes, MCP, browser).

### 4. Base de conhecimento

Memória operacional consultada pelos agentes antes de agir: `/company`, `/projects`, `/clients`, `/repos`, `/architecture`, `/contracts`, `/decisions`, `/incidents`, `/runbooks`. Implementação inicial: PostgreSQL + pgvector + object storage + Git + event log. Sem arquitetura gigantesca no começo.

### 5. UI

A interface é uma cena **Three.js** **somente de acompanhamento**: mostra agentes, jobs, handoffs, status, custo, evidências e pedidos de aprovação. A única ação permitida é aprovar ou rejeitar (gate humano), por casos de uso de aprovação. Substitui as 4 partes canônicas (`AppBar`, `LeftSidebar`, `Body`, `RightSidebar`); os componentes legados permanecem até a migração progressiva.

### 6. Fases de pessoal

1. Fundador/CTO + agentes + contador terceirizado + jurídico sob demanda.
2. Primeiros clientes recorrentes: + Customer/Project Lead.
3. Escala: CTO, Product/Delivery, Customer Success + agentes.

Papéis operacionais (programadores, designer, QA, DevOps, suporte, SDR, financeiro, PM) são modelados primeiro como processos e agentes.

## Consequências

- Novas camadas hexagonais: `domain` (Job, Task, Project, Evidence, Approval), `application/ports` (event log, execução de agente, aprovação, conhecimento) e `application/use-cases` do Control Plane.
- Auditoria, evidência e aprovação passam a ser requisitos de primeira classe, não opcionais.
- A UI Three.js é um novo adapter primário; a migração das telas legadas é progressiva e sob demanda.
- Pendente de decisão em ADRs futuros: modelo de eventos do Control Plane, escolha do renderer/camada de dados da cena, e política de aprovação por tipo de ação.
