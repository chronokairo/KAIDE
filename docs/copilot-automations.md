# Automações do Copilot App

As automações são criadas **no GitHub Copilot App** (não ficam versionadas aqui) e associadas ao repositório `chronokairo/ai`. Este documento é o catálogo: o que criar e com qual prompt. Referência: [Using automations in the GitHub Copilot app](https://docs.github.com/en/copilot/how-tos/github-copilot-app/using-automations).

## Princípio

```text
Automação = gatilho (quando/por quê)   →  "execute o job <tipo>"
Agente    = capacidade (.github/agents)
Harness   = governa jobs, contexto, permissões, aprovação, auditoria
```

A automação **não** carrega lógica. Mudar horário ou modelo não exige alterar código. Oito tipos de agente, N automações, um harness.

## Prompt padrão de uma automação

```text
Execute o job "<tipo>" no harness chronokairo/ai.
Siga .github/copilot-instructions.md e o agente <agente>.
Crie o Job, registre eventos e evidências, e peça aprovação humana
para qualquer ação externa, financeira ou de produção.
Não decida escopo, permissões ou repositórios: o harness decide.
```

## Catálogo

| Automação | Gatilho | Agente | Job | Aprovação humana |
| --- | --- | --- | --- | --- |
| Commercial daily | Diário 08:00 | commercial | `commercial.daily` | Antes de enviar qualquer contato |
| Lead follow-up | Diário 09:00 | commercial | `commercial.followup` | Antes de enviar mensagem |
| Analyst on demand | Issue com label `discover` | analyst | `analyst.discover` | Fechamento de escopo |
| Implement issue | Issue com label `implement` | coder | `coder.implement` | Merge do PR |
| QA on PR | PR aberto/atualizado | qa | `qa.review_pr` | Merge do PR |
| Deploy request | Issue com label `deploy` | devops | `devops.deploy` | **Sempre**, antes de produção |
| Support triage | Issue com label `support` | support | `support.triage` | Casos críticos |
| Finance nightly | Diário 02:00 | finance | `finance.nightly` | Qualquer movimentação de dinheiro |
| Nightly maintenance | Diário 03:00 | coder | `coder.maintenance` | Merge do PR |

Horários em `America/New_York` ou o fuso que você escolher no app. Ajuste no app sem mexer em código.

## Passos para configurar

1. Abra o Copilot App e selecione o repositório `chronokairo/ai`.
2. Crie uma automação por linha do catálogo, com o gatilho indicado e o prompt padrão (trocando `<tipo>` e `<agente>`).
3. Garanta que as labels (`discover`, `implement`, `deploy`, `support`) existem no repositório.
4. Comece com uma só (sugestão: **QA on PR**) e valide antes de habilitar as demais.
5. Mantenha dinheiro e produção sempre com aprovação humana.

## Estado da implementação (ADR-0039)

O harness já expõe o Control Plane real (ver [ADR-0039](./adr/0039-control-plane-hexagonal-supabase-resend.md)):

- **Entidade `Job` + event log append-only** persistidos no Supabase prod (`cp_jobs`, `cp_job_events`).
- **Caso de uso por tipo de job**: `POST /api/control-plane/jobs` com `{"type":"commercial.daily"}` (idempotente por período — reexecutar no mesmo dia não duplica).
- **CRM real**: leitura/escrita nas tabelas `leads` e `crm_activities` do prod.
- **E-mail transacional via Resend** com sync de status (janela 24h) e match por lead.
- **Gate humano**: `GET /api/control-plane/approvals` e `POST /api/control-plane/approvals/{id}/resolve` — nenhum contato externo sai sem aprovação explícita do Diretor Técnico.
- Endpoints de consulta: `GET /api/control-plane/jobs`, `GET /api/control-plane/leads`.

Configuração necessária (ver `.env.example`): `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTROL_PLANE_ORGANIZATION_ID`, `CONTROL_PLANE_ACTOR_USER_ID` além das credenciais Supabase.
