# ADR-0039 - Control Plane Hexagonal Puro: Supabase Prod, Resend e Suíte de Testes

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

A [ADR-0028](./0028-empresa-virtual-de-agentes-control-plane.md) definiu a empresa virtual de agentes com Control Plane (`plan → execute → verify → evidence → approval → merge/deploy`). A [ADR-0029](./0029-implementacao-ui-threejs-e-automacoes-copilot.md) implementou a UI Three.js e as automações do Copilot.

O usuário exigiu que o job `commercial.daily` deixasse de ser mockado e operasse sobre dados reais:
> "esses fake e mock remova, só dados do supabase prod oficial"

Em paralelo, os ADRs [0036](./0036-conexao-oficial-supabase-prod-e-eliminacao-de-mocks.md) e [0038](./0038-source-control-forge-linkage-and-english-domain.md) (branch `main`) conectaram o Control Plane ao Supabase prod por um caminho próprio (`src/infrastructure/control-plane/supabase-control-plane-adapter.ts`). Esta ADR documenta o **rework hexagonal puro** do mesmo problema, executado em branch paralelo, e a **decisão de convergência pendente** entre as duas implementações.

## Decisões

### 1. Rework Hexagonal Puro do Control Plane
- **Domínio puro** (`src/domain/control-plane.ts`): regras sem SDKs — `scoreLead`, `isFollowUpDue`, `normalizeEmailStatus`, `isTerminalEmailStatus`, `extractEmailAddress`, `buildPeriodicIdempotencyKey`, `canRetryJob`, rascunhos de abordagem/follow-up.
- **Ports** (`src/application/ports/`): `JobStorePort`, `CrmPort`, `EmailOutreachPort`, `CompanyResearchPort`, `AuditPort` — contratos de entrada/saída; nenhum use-case importa `supabaseAdmin` ou SDK diretamente.
- **Use cases** (`src/application/use-cases/`): `run-commercial-daily` (scan de leads, follow-ups devidos, sync de e-mail, gates de aprovação), `sync-email-outreach` (janela de 24h), `resolve-approval` (gate humano: envio via Resend ou degradação manual).
- **Idempotência real**: `buildPeriodicIdempotencyKey` deriva a chave do período (`commercial.daily:2026-10-03`), ao contrário do jobId com `Date.now()` — reexecutar no mesmo dia não duplica jobs nem efeitos.

### 2. Persistência Supabase Prod
- Migration `supabase/migrations/20261003151824_control_plane.sql` aplicada ao prod (`your-project-ref`): tabelas `cp_jobs`, `cp_job_events` (append-only), `cp_leads`, `cp_approval_gates`, `cp_email_outreach`, todas com `organization_id` para isolamento multitenant.
- Adapter `src/infrastructure/persistence/control-plane-supabase-store.ts` via PostgREST (service role, server-side only).
- CRM real: leitura/escrita nas tabelas existentes `leads` e `crm_activities` (13 leads reais da organização Chronokairo).

### 3. Envio de E-mail via Resend
- Adapter oficial `src/infrastructure/email/resend-email-adapter.ts` (SDK `resend`), atrás de `EmailOutreachPort`.
- **Sync de status com janela de 24h**: `sync-email-outreach` consulta `emails.list` do Resend, faz **match por endereço de e-mail do lead** e atualiza status/atividade no CRM. O adapter do `main` (`resend-email-service.ts`) apenas registra eventos genéricos sem match de lead.
- **Fix de bug real — display name**: o Resend retorna `to` como `"Nome <email@host>"`; o match por e-mail exigia `extractEmailAddress()` (função pura do domínio, regex `<([^>]+)>`). Descoberto por teste de integração.
- **Fix de bug latente — file store**: `load()` de docs legados herdava referências compartilhadas dos arrays de `EMPTY_DOC`, vazando estado entre instâncias; substituído por arrays frescos (`raw.X ?? []`).
- Envio só ocorre após aprovação humana do gate `outbound_contact`; sem Resend configurado, o gate degrada para contato manual registrado.

### 4. Suíte de Testes (56 testes, 6 arquivos)
- `src/domain/__tests__/control-plane.test.ts` — regras puras (score, follow-up, idempotência, retry, e-mail).
- `src/application/use-cases/__tests__/sync-email-outreach.test.ts` — janela 24h, match de lead, bounce, re-check.
- `src/application/use-cases/__tests__/resolve-approval.test.ts` — gate humano: envio, degradação manual, falha, rejeição, dupla resolução.
- `src/infrastructure/persistence/__tests__/control-plane-file-store.test.ts` — fs real em tmpdir, append-only, regressão do vazamento de arrays.
- Fakes in-memory completos (`control-plane-fakes.ts`) implementando os ports.

### 5. Segurança e Governança
- `organizationId` e `actorUserId` validados no servidor (composition root lança se ausentes) em toda ferramenta de escrita.
- Segredos (`RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) somente em `.env.local` (gitignored); documentados sem valores em `.env.example`.
- Nenhum envio externo sem aprovação humana explícita (AI → AI → AI → HUMAN).

## Consequências

### Positivas
- `commercial.daily` executa sobre dados reais do prod com idempotência, testes e isolamento hexagonal.
- Bugs reais (display name do Resend, vazamento do file store) corrigidos com regressão coberta.
- O sync de e-mail atualiza o CRM por lead, não apenas registra eventos.

### Negativas / Pendências
- **Convergência com o `main` (ADR-0036/0038) — decisão humana pendente**: existem dois caminhos para o mesmo objetivo. Este rework é hexagonal puro, idempotente e testado; o do `main` está integrado à UI e aos 5 jobs enterprise. O merge exige escolher a espinha dorsal (recomendado: ports/use-cases deste rework como núcleo, absorvendo os adapters do `main`) — a decisão é do Diretor Técnico.
- **Dependência git morta**: `@chronokairo/platform` aponta para GitHub (`github:chronokairo/platform#master`) mas o repo vive no GitLab; `npm install` limpo falha (exit 128). Corrigir exige regenerar o lock com credenciais.
- **`mockData.ts` gitignored importado por código tracked** (`ConfigView.tsx`): typecheck quebra em checkout limpo (regra `data/` do `.gitignore`).
