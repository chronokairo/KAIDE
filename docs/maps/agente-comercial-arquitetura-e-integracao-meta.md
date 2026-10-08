# Mapa de Código — Agente Comercial, Control Plane e Integração Meta Business SDK

> Documento gerado por exploração do repositório. Caminhos e números de linha refletem o estado em `5e55d03` (+ alterações de trabalho em `apps/web/src/domain/commercial.ts`, `apps/web/src/application/ports/lead-repository-port.ts`, `apps/web/src/application/use-cases/execute-commercial-followup.ts`, `apps/web/src/infrastructure/crm/`).
>
> Objetivo do documento: responder às 10 perguntas da exploratory task e entregar o plano de encaixe do SDK `facebook-nodejs-business-sdk` no agente **Comercial** respeitando a arquitetura hexagonal e o Human Gate (`AI → AI → AI → HUMAN`).

---

## Índice

1. [Estado do repositório](#1-estado-do-repositório)
2. [Camadas do domínio](#2-camadas-do-domínio)
3. [Ports](#3-ports)
4. [Use cases](#4-use-cases)
5. [Infraestrutura e adapters](#5-infraestrutura-e-adapters)
6. [Catálogo de tools](#6-catálogo-de-tools)
7. [Testes](#7-testes)
8. [package.json, toolchain e scripts](#8-packagejson-toolchain-e-scripts)
9. [Env e configuração](#9-env-e-configuração)
10. [O papel Comercial hoje](#10-o-papel-comercial-hoje)
11. [Plano de integração do Facebook Business SDK](#11-plano-de-integração-do-facebook-business-sdk)
12. [Débitos e riscos encontrados](#12-débitos-e-riscos-encontrados)

---

## 1. Estado do repositório

### 1.1 `package.json` (`package.json:1-63`)

**Identidade**

| Campo | Valor |
| --- | --- |
| `name` | `@chronokairo/kaide` |
| `private` | `true` |
| `version` | `1.0.0` |
| `exports` | `./froia`, `./rapunzel`, `./data-screens`, `./governance`, `./osint` |

**Scripts** (`package.json:12-23`)

| Script | Comando | Nota |
| --- | --- | --- |
| `dev` | `next dev --webpack -p 3010` | porta 3010 |
| `build` | `node scripts/build-tauri.mjs` | invólucra Tauri |
| `build:web` | `next build --webpack` | build web puro |
| `start` | `next start -p 3010` | |
| `test` | `npx vitest run` | **não** usa `--run` via binário local |
| `typecheck` | `tsc --noEmit` | |
| `job:commercial:followup` | `tsx scripts/execute-commercial-followup.ts` | runner CLI |
| `job:qa:review_pr` | `tsx scripts/execute-qa-pr-review.ts` | runner CLI |
| `tauri` / `tauri:dev` | `tauri` / `tauri dev` | |

> **Dédito**: **não existe script `lint`** no `package.json`, embora o `AGENTS.md` exija "Lint, typecheck, testes e build executados via npm".

**Runtime e libs relevantes** (`package.json:24-62`)

- `next ^16.3.6` (com bloco `next dev` injetando `<!-- BEGIN:nextjs-agent-rules -->` em `AGENTS.md`).
- `react` / `react-dom` `^19.2.8`.
- `@chronokairo/platform` via git: `github:chronokairo/platform#master` — pacote de UI compartilhada.
- `@supabase/supabase-js ^2.117.0` — persistência + auth.
- `three ^0.186.1` — cena 3D de acompanhamento.
- `ai ^7.0.90` e `@ai-sdk/react` — streaming de chat.
- `lowdb`, `node-cache`, `chart.js`, `jspdf`, `html2canvas` — legados/módulos.
- Dev: `vitest ^5.0.2`, `typescript ^6.0.2`, `tsx ^4.23.15`, `@tailwindcss/postcss`.

> **Dédito crítico**: **`zod` não está declarado** em `dependencies` nem `devDependencies` (`npm ls zod --depth=0` → `(empty)`), mas é importado em pelo menos 3 arquivos:
> - `apps/web/src/app/api/ai/chat/route.ts:2`
> - `apps/web/src/app/api/ai/credentials/nvidia/route.ts:2`
> - `apps/web/src/modules/mcp-catalog/catalog.ts:1-2`
>
> Hoje resolve por *hoist* transitivo via `@chronokairo/platform`. Um novo adapter que dependa de `zod` para validar entrada criaria fragilidade de build.

### 1.2 `tsconfig.json` (`tsconfig.json:1-44`)

- `strict: true`, `noEmit: true`, `module: esnext`, `moduleResolution: bundler`, `target: ES2022`.
- Alias: `@/* → ./src/*` (`tsconfig.json:23-25`).
- `include`: `next-env.d.ts`, `apps/web/src/**/*.ts(x)`, `.next/types`, `.next/dev/types`.
- `exclude` (`tsconfig.json:38-43`): `node_modules`, **`apps/web/src/server`**, `apps/web/src/modules/ai/legacy-kairos-screens`, **`apps/web/src/**/__tests__/*`**.
  - `apps/web/src/server` (Express legado do RAG, ver [ADR-0001](../adr/0001-unificacao-monorepo-ai.md:35)) está **fora do typecheck**.
  - Testes também estão **fora do typecheck**.

### 1.3 `vitest.config.ts` (`vitest.config.ts:1-13`)

```ts
resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
test: { include: ['src/**/__tests__/**/*.test.{ts,tsx}'] }
```

Padrão de teste: `apps/web/src/**/__tests__/**/*.test.ts` — apenas Unitários de use case/adapters de infra in-memory.

### 1.4 Arquivos de topo

`.env.example`, `.env.local`, `.gitattributes`, `.gitignore`, `.npmrc`, `AGENTS.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `LICENSE`, `README.md`, `SECURITY.md`, `TODO.md`, `next.config.mjs`, `postcss.config.mjs`, `tsconfig.tsbuildinfo`.

Scripts em `scripts/`: `build-tauri.mjs`, `execute-commercial-followup.ts`, `execute-qa-pr-review.ts`.

### 1.5 Inventário de `apps/web/src/` (arquivos `.ts`/`.tsx`)

- `apps/web/src/domain/` — 6 arquivos: `auth.ts`, `chat.ts`, `commercial.ts`, `company.ts`, `errors.ts`, `qa.ts`.
- `apps/web/src/application/ports/` — 9 arquivos + barrel `index.ts`.
- `apps/web/src/application/use-cases/` — 5 use cases/hooks + 3 testes.
- `apps/web/src/features/` — 2 composition roots (`ai-chat`, `ai-credentials`).
- `apps/web/src/infrastructure/` — subpastas `control-plane/`, `credentials/`, `crm/`, `http/`, `identity/`, `llm/`, `qa/`, `tauri/`, `ui/`, `composition/`.
- `apps/web/src/modules/` — legado absorvido: `ai/` (tools de domínio, governance), `crm/`, `bi/`, `financeiro/`, `projetos/`, `github-notifications/`, `governance/`, `harness/`, `mcp-catalog/`, `ocr/`, `orchestration/`, `osint/`, `agent-planner/`, `dev/`.
- `apps/web/src/server/rag/` — Express legado, fora do typecheck.
- `apps/web/src/shared/` — `components/ui/{button,card,input}.tsx`, `config/erp-modules.ts`, `crypto-vault.ts`, `supabase.ts`.
- `apps/web/src/app/` — App Router; `(ia)/ia/*`, `rag/`, `api/**` (~60 routes).

---

## 2. Camadas do domínio

### 2.1 `apps/web/src/domain/company.ts` (`apps/web/src/domain/company.ts:1-79`) — núcleo da Empresa Virtual

```ts
export type AgentRole =
  | 'human_director' | 'commercial' | 'analyst' | 'product'
  | 'coder' | 'qa' | 'devops' | 'support' | 'finance';   // :6-15

export type AgentStatus = 'idle' | 'working' | 'waiting_approval' | 'handoff' | 'offline'; // :17

export interface AgentEntity {
  id: string; role: AgentRole; name: string; title: string;
  department: string; status: AgentStatus; currentTask: string;
  currentJobId?: string; tokensProcessed: number; costUsd: number;
  lastActivity: string; activeTools: string[];
  coordinates: [number, number, number];
  color: string; accentColor: string;
}                                                              // :19-35

export type JobStatus = 'queued' | 'in_progress' | 'waiting_approval'
                      | 'completed' | 'rejected' | 'failed';   // :37

export interface ApprovalGate {
  id: string; jobId: string;
  type: 'production_deploy' | 'payment_release' | 'scope_baseline' | 'outbound_contact';
  title: string; details: string; requestedBy: AgentRole;
  requestedAt: string; evidence: string[];
  status: 'pending' | 'approved' | 'rejected';
}                                                              // :39-49

export interface JobEntity {
  id: string; title: string; client: string; project: string;
  stage: AgentRole; agentRole: AgentRole; status: JobStatus;
  prompt: string; toolsUsed: string[];
  changesSummary: string; testsSummary: string; evidence: string[];
  costUsd: number; durationSeconds: number;
  requiresApproval: boolean; approvalGate?: ApprovalGate;
  handoffTo?: AgentRole; createdAt: string;
}                                                              // :51-70

export interface CompanyTelemetry {
  totalJobsCompleted: number; totalCostUsd: number;
  activeAgentsCount: number; pendingApprovalsCount: number;
  averageCycleTimeMinutes: number; handoffsInFlight: number;
}                                                              // :72-79
```

> **Ponto de atenção para a integração Meta**: o gate `outbound_contact` (`:42`) existe exatamente para comunicações externas — é o gancho para gating de anúncios/lead ads/Messenger.

### 2.2 `apps/web/src/domain/commercial.ts` (`apps/web/src/domain/commercial.ts:1-65`)

```ts
export type LeadStage =
  | 'inbound' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';  // :6-12
export type FollowupPriority = 'urgent' | 'high' | 'medium' | 'low';              // :14

export interface Lead {
  id: string; name: string; company: string;
  contactPerson: string; contactRole: string;
  email: string; phone?: string;
  segment: string; score: number; stage: LeadStage;
  needsSummary: string;
  lastContactDate: string; daysWithoutContact: number;
  priority: FollowupPriority;
  status: 'awaiting_contact' | 'awaiting_followup' | 'in_dialogue' | 'closed';
}                                                                    // :16-32

export interface FollowupDraft {
  id: string; leadId: string; companyName: string;
  recipientName: string; recipientRole: string; recipientEmail: string;
  channel: 'email' | 'whatsapp';          // ← sem canal Messenger/Instagram
  subject: string; body: string; callToAction: string; rationale: string;
  complianceCheck: { lgpdCompliant: boolean; hasOptOut: boolean; toneAppropriate: boolean };
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'dispatched';
  createdAt: string; dispatchedAt?: string;
}                                                                    // :34-54

export interface CommercialFollowupJobResult {
  jobId: string; stage: 'commercial';
  leadsScannedCount: number; leadsNeedingFollowupCount: number;
  drafts: FollowupDraft[];
  requiresApproval: true; approvalGateId: string; createdAt: string;
}                                                                    // :56-65
```

> **Lacunas para Meta**: `channel` não contempla `messenger`/`instagram`; `Lead` não tem `metaLeadId`, `adAccountId`, `pageId`, `igAccountId`, `fbclid`/`fbc`/`fbp`, nem `source: 'meta_ads' | ...`.

### 2.3 `apps/web/src/domain/qa.ts` (`apps/web/src/domain/qa.ts:1-59`)

`PRStatus`, `PullRequest`, `ReviewVerdict = 'PASS' | 'FAIL' | 'WARNING'`, `AdversarialCheckItem`, `AdversarialDimensionReview` (`unit_tests | integration_tests | security | tenant_rbac`), `PullRequestReviewReport`, `QaReviewJobResult`. Serve de **template estrutural** para qualquer novo domínio (mesma anatomia: entidade → relatório → resultado de job).

### 2.4 Outros

- `apps/web/src/domain/chat.ts` — `ChatCompletionRequest`, `ChatCompletionResult`.
- `apps/web/src/domain/auth.ts` — `AuthContext` (`userId`, …).
- `apps/web/src/domain/errors.ts` — `UnauthorizedError` e demais erros de domínio.

**Confirmação de pureza**: nenhum dos arquivos em `apps/web/src/domain/` importa React, Next, Supabase ou SDKs. ✅

---

## 3. Ports

9 arquivos existem; o barrel exporta **apenas 5**.

### 3.1 Conteúdo de cada port

| Port | Arquivo | Assinatura |
| --- | --- | --- |
| `IdentityPort` | `identity-port.ts:5-7` | `authenticate(authorizationHeader: string \| null): Promise<AuthContext>` |
| `CredentialPort` | `credential-port.ts:5-14` | `LlmCredential { apiKey; baseUrl; model }`; `resolve(actor: AuthContext): Promise<LlmCredential \| null>` |
| `LlmPort` | `llm-port.ts:6-8` | `complete(request: ChatCompletionRequest, credential: LlmCredential): Promise<ChatCompletionResult>` |
| `SecretsPort` | `secrets-port.ts:3-6` | `encrypt(secret)`, `decrypt(vault)` |
| `AuditPort` | `audit-port.ts:3-12` | `AuditEvent { actorId; organizationId?; action; metadata? }`; `record(event)` |
| `CompanyControlPlanePort` | `company-control-plane-port.ts:3-16` | `getSnapshot()`, `approveJob(approvalId, rationale?)`, `rejectJob(approvalId, reason)`, `submitJob(job)`, `executeJob?(jobName, params?)`, `subscribe(cb)` |
| `LeadRepositoryPort` | `lead-repository-port.ts:3-10` | ver abaixo |
| `PullRequestRepositoryPort` | `pr-repository-port.ts:3` | criado em `b92bc77` |

**`LeadRepositoryPort`** (`apps/web/src/application/ports/lead-repository-port.ts:3-10`)

```ts
export interface LeadRepositoryPort {
  listLeadsAwaitingFollowup(): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | null>;
  saveFollowupDraft(draft: FollowupDraft): Promise<void>;
  getDraftsByJobId?(jobId: string): Promise<FollowupDraft[]>;
  updateDraftStatus(draftId: string, status: FollowupDraft['status'], dispatchedAt?: string): Promise<void>;
  updateLeadStatus(leadId: string, status: Lead['status'], notes?: string): Promise<void>;
}
```

> Note o **método opcional** `getDraftsByJobId?` — o Control Plane sempre chama com `?.()` e `|| []` (`in-memory-control-plane.ts:309`, `:361`). É o padrão para operações cujo adapter pode não suportar a extensão.

### 3.2 `apps/web/src/application/ports/index.ts` (`index.ts:1-7`) — **incompleto**

```ts
export type { IdentityPort } from './identity-port';
export type { CredentialPort, LlmCredential } from './credential-port';
export type { LlmPort } from './llm-port';
export type { SecretsPort } from './secrets-port';
export type { AuditPort, AuditEvent } from './audit-port';
```

**Não exportados**: `chat-ui-port.ts`, `company-control-plane-port.ts`, `lead-repository-port.ts`, `pr-repository-port.ts`.

### 3.3 Padrão observado

- Sufixo `-port.ts`, no singular.
- Todo port importa tipos com `@/domain/...`.
- Métodos assíncronos retornam `Promise<T>`; `null` para ausência; erros via `throw` de `domain/errors`.
- Nenhuma port importa infraestrutura (regra hexagonal respeitada). ✅

---

## 4. Use cases

### 4.1 Padrão

Classes `XxxUseCase` com **injeção por construtor** de ports, um método público `execute(): Promise<Resultado>`, e helpers privados. Sem decorators, sem container DI.

**Exemplo canônico — `ExecuteCommercialFollowupUseCase`** (`apps/web/src/application/use-cases/execute-commercial-followup.ts:6-134`)

```ts
export class ExecuteCommercialFollowupUseCase {
  constructor(
    private readonly leadRepo: LeadRepositoryPort,
    private readonly controlPlane: CompanyControlPlanePort
  ) {}

  async execute(): Promise<CommercialFollowupJobResult> {
    const leads = await this.leadRepo.listLeadsAwaitingFollowup();          // :14
    const drafts = leads.map((lead) => this.generateDraft(lead));            // :17
    for (const draft of drafts) await this.leadRepo.saveFollowupDraft(draft); // :20-22

    const jobId = `job-comm-followup-${Date.now()}`;                         // :25
    const approvalId = `appr-comm-${Date.now()}`;                            // :26
    const evidenceList: string[] = [ /* ... */ ];                            // :29-37

    const approvalGate: ApprovalGate = {
      id: approvalId, jobId, type: 'outbound_contact',
      title: 'Aprovação de Envio de Follow-up Comercial',
      details: '...AI → AI → AI → HUMAN...',
      requestedBy: 'commercial', requestedAt: timestamp,
      evidence: evidenceList, status: 'pending',
    };                                                                       // :39-49

    const jobEntity: JobEntity = { /* ...costUsd: 0.14, requiresApproval: true... */ }; // :51-69

    if (this.controlPlane.submitJob) await this.controlPlane.submitJob(jobEntity);      // :72-74
    return { /* ... */ };                                                                 // :76-85
  }

  private generateDraft(lead: Lead): FollowupDraft { /* switch por stage */ }             // :88-133
}
```

**Observações relevantes para Meta**:
- A geração de rascunho é **determinística e hardcoded** (`generateDraft` com 3 ramos `if` por `lead.stage`) — **não usa `LlmPort`**. Não há chamada de LLM no job Comercial hoje.
- `costUsd: 0.14` e `durationSeconds: 15` são **constantes inventadas** (`:64-65`).
- `toolsUsed` (`:60`) é um array de **strings livres** (`'crm_leads_scanner'`, `'context_synthesizer'`, `'compliance_checker'`, `'followup_composer'`) — não referencia tools reais do registry.
- `createdAt` usa `toLocaleTimeString('pt-BR', { hour, minute })` (`:68`) — inconsistente com os demais campos ISO.

### 4.2 Outros use cases / hooks

| Arquivo | Tipo |
| --- | --- |
| `send-message.ts` | use case (DI por objeto: `{ credentials, llm }`) |
| `execute-qa-pr-review.ts` | use case (mesmo padrão de `commercial.followup`) |
| `use-chat.ts`, `use-company-monitor.ts` | hooks React (camada application consumida pela UI) |

### 4.3 Composition roots (padrão de DI do projeto)

`apps/web/src/features/ai-chat/composition/server.ts:15-23`

```ts
export function createChatComposition(): ChatComposition {
  return {
    identity: new SupabaseIdentityAdapter(),
    sendMessage: new SendMessageUseCase({
      credentials: new NvidiaCredentialAdapter(),
      llm: new NvidiaLlmAdapter(),
    }),
  };
}
```

`apps/web/src/features/ai-credentials/composition/server.ts` — idem para credenciais.

> Hoje **não existe** composition root para o Control Plane. O wiring de `commercial.followup` é feito de forma **ad-hoc** em 3 lugares (route HTTP, `executeJob` do adapter in-memory, script CLI), cada um instanciando os use cases na mão.

---

## 5. Infraestrutura e adapters

### 5.1 Subpastas

| Subpasta | Conteúdo |
| --- | --- |
| `infrastructure/control-plane/` | `in-memory-control-plane.ts` (395 linhas) |
| `infrastructure/credentials/` | `nvidia-credential-adapter.ts` |
| `infrastructure/crm/` | `in-memory-lead-repository.ts` (101 linhas) |
| `infrastructure/http/` | `http-chat-ui-adapter.ts` |
| `infrastructure/identity/` | `supabase-identity-adapter.ts` |
| `infrastructure/llm/` | `nvidia-adapter.ts` |
| `infrastructure/qa/` | `in-memory-pr-repository.ts` |
| `infrastructure/tauri/` | `tauri-chat-ui-adapter.ts` |
| `infrastructure/ui/` | `AppShell.tsx`, `AppBar.tsx`, `Body.tsx`, `LeftSidebar.tsx`, `RightSidebar.tsx`, `CompanyMonitor.tsx`, `CompanyScene2D.tsx`, `CompanyScene3D.tsx`, `PokemonOfficeScene.tsx`, `index.ts` |
| `infrastructure/composition/` | `chat-service.ts` |

### 5.2 Exemplos completos de adapter

**`InMemoryLeadRepository`** (`apps/web/src/infrastructure/crm/in-memory-lead-repository.ts:1-101`)

- 3 leads seed em memória (`lead-001` InovaHealth, `lead-002` Alpha Finanças, `lead-003` LogTech) com `needsSummary`, `score`, `priority`.
- `drafts: Map<string, FollowupDraft>` (`:59`).
- Filtra `awaiting_contact | awaiting_followup` em `listLeadsAwaitingFollowup()` (`:61-65`).
- `getDraftsByJobId` **ignora** o `jobId` e devolve todos os drafts (`:75-77`) — bug latente: aprovação de um job despacha drafts de todos os jobs anteriores.
- Exporta singleton `defaultLeadRepository` (`:101`).
- Expõe `getAllDrafts()` "helper for tests/reset" (`:95-98`).

**`SupabaseIdentityAdapter`** (`apps/web/src/infrastructure/identity/supabase-identity-adapter.ts:8-18`) — delega para `authenticateRequest` da feature e traduz erro em `UnauthorizedError`.

**`NvidiaCredentialAdapter`** (`apps/web/src/infrastructure/credentials/nvidia-credential-adapter.ts:7-12`) — delega para `createNvidiaCredentialService()`.

**`InMemoryCompanyControlPlaneAdapter`** (`apps/web/src/infrastructure/control-plane/in-memory-control-plane.ts:10-395`)

- Construtor recebe repositórios com default (`:14-17`).
- Seed de **9 `AgentEntity`** (`:18-167`), um por papel, com coordenadas 3D para a cena Three.js. O Comercial (`:35-50`): `id: 'agent-commercial'`, `title: 'SDR & Qualificação de Leads'`, `activeTools: ['crm_search', 'company_due_diligence', 'meeting_notes_extractor', 'followup_composer']`.
- Seed de 2 `JobEntity` (`:169-227`).
- `submitJob` (`:245-271`) faz upsert por id, atualiza status do agente, soma `costUsd`, incrementa `pendingApprovalsCount`, notifica.
- `executeJob(jobName, params?)` (`:273-295`) — **dispatcher por string**:
  ```ts
  if (jobName === 'commercial.followup') { /* new ExecuteCommercialFollowupUseCase(this.leadRepository, this) */ }
  if (jobName === 'qa.review_pr')       { /* new ExecuteQaPrReviewUseCase(this.prRepository, this) */ }
  throw new Error(`Job '${jobName}' não reconhecido pelo Control Plane.`);
  ```
- `approveJob` (`:297-350`) — trata `outbound_contact` (despacha drafts, `in_dialogue`, agente vai `working` → `idle` via `setTimeout(2000)`) e `production_deploy` (agente DevOps com `setTimeout(3000)`).
- `rejectJob` (`:352-380`) — marca drafts `rejected`.
- `subscribe` (`:382-386`) — chama o callback imediatamente com o snapshot atual.
- Exporta singleton `defaultCompanyControlPlane` (`:395`).

> **Problemas**: estado **global em processo** (singleton mutável, sem persistência); `setTimeout` simulando trabalho assíncrono; `executeJob` mixe orquestração com persistência. É o candidato natural a receber um adapter **real** (Supabase) e um **dispatcher por registry**.

### 5.3 Camada HTTP (adapters primários)

- `apps/web/src/app/api/control-plane/jobs/execute/route.ts:1-94` — `POST` e `GET` com `jobName` no body/query; instancia use cases na mão (`:16`, `:32`, `:65`); default `'qa.review_pr'` (`:13`, `:61`).
- `apps/web/src/app/api/_lib/` — `auth.ts`, `http.ts`, `rag.ts`, `rate-limit.ts`, `sse.ts`, `totvs-proxy.ts`.
- **Não existe route de aprovação/rejeição**. A UI consome `approveJob`/`rejectJob` direto do adapter in-memory via hook (`use-company-monitor.ts`), sem passar por HTTP. Isso significa que **aprovação humana não é auditada no servidor** — gap relevante de governança.

---

## 6. Catálogo de tools

### 6.1 Dois catálogos coexistem

**(a) Novo/hexagonal** — `JobEntity.toolsUsed: string[]` apenas descritivo. Não é executável.

**(b) Legado `apps/web/src/modules/ai/core/tools/`** — registry real e executável.

### 6.2 `apps/web/src/modules/ai/core/tools/types.ts` e `domain/types.ts`

```ts
export type AiUserRole = 'owner' | 'admin' | 'operator' | 'viewer' | 'billing';  // domain/types.ts:1

export interface AiExecutionContext {          // domain/types.ts:3-9
  organizationId: string; userId: string; userRole: AiUserRole;
  sessionId: string; permissions: string[];
}

export interface DomainToolMetadata {          // domain/types.ts:11-16
  namespace: string;
  domain: 'finance' | 'crm' | 'contracts' | 'projects' | 'timesheet' | 'bi' | 'core';
  sensitivity: 'public' | 'internal' | 'restricted' | 'confidential';
  contractVersion: string;
}

export interface ActionPolicy {                // domain/types.ts:18-22
  requiresHumanApproval: boolean;
  requiredPermissions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AiToolDefinition<TInput, TOutput> {   // domain/types.ts:24-33
  name: string; description: string; domain: string;
  executionType: 'READ' | 'ACTION';
  requiredRole?: readonly AiUserRole[];
  metadata: DomainToolMetadata;
  policy?: ActionPolicy;
  handler: (input: TInput, ctx: AiExecutionContext) => Promise<TOutput>;
}

export interface AiToolAuditEvent { /* sessionId, organizationId, userId, toolName,
  executionType: 'READ'|'CAPABILITY_PROPOSAL'|'ACTION_EXECUTION', durationMs,
  result: 'success'|'error'|'denied', humanApproval, error, timestamp */ }        // :35-46

export interface AiToolResult<TData> { toolName, definitionVersion, organizationId,
  timestamp, data, audit }                                                         // :48-55
```

> **Ressalva**: `DomainToolMetadata.domain` é uma **union fechada sem `'ads'`/`'marketing'`**. Para tools Meta seria preciso ampliar (ou usar `'core'`).

### 6.3 `registry.ts` (`apps/web/src/modules/ai/core/tools/registry.ts:22-127`)

Fluxo de `execute(name, input, ctx, requestApproval?)` (`:54-94`):

1. `tools.get(name)` → 404 lógico: `throw new Error('Ferramenta de IA não encontrada: ...')` (`:62`).
2. `authorizeToolExecution(tool.requiredRole, ctx)` → audita `denied` e lança (`:64-67`).
3. Se `executionType === 'ACTION'`:
   - checa `requiredPermissions` ⊂ `ctx.permissions` (`:71-75`);
   - se `policy.requiresHumanApproval` → chama `requestApproval(tool, input)`; sem handler ⇒ `false` ⇒ **bloqueia** (`:76-82`).
4. Executa `handler`; audita `success`/`error` (`:85-93`).
5. `audit()` (`:100-124`) grava em `ai_tool_executions` no Supabase; **se a auditoria falhar, o resultado é bloqueado** (`:122`) — fail-closed correto.

`HumanApprovalHandler = (tool, input) => Promise<boolean>` (`:20`).

### 6.4 `permissions.ts` (`apps/web/src/modules/ai/core/tools/permissions.ts:3-6`)

```ts
export function authorizeToolExecution(requiredRoles, ctx): boolean {
  if (!ctx.organizationId || !ctx.userId || !ctx.sessionId) return false;   // fail-closed
  return !requiredRoles?.length || requiredRoles.includes(ctx.userRole);
}
```

### 6.5 Domínios registrados (`registry.ts:25-36`)

`FINANCE_DOMAIN_TOOLS`, `CRM_DOMAIN_TOOLS`, `CRM_WRITE_DOMAIN_TOOLS`, `SALES_DOMAIN_TOOLS`, `STOCK_DOMAIN_TOOLS`, `FISCAL_DOMAIN_TOOLS`, `CONTRACTS_DOMAIN_TOOLS`, `PROJECTS_DOMAIN_TOOLS`, `BI_DOMAIN_TOOLS`, `WEB_DOMAIN_TOOLS`.

Arquivos: `finance-tools.ts`, `crm-tools.ts`, `crm-write-tools.ts`, `sales-tools.ts`, `stock-tools.ts`, `fiscal-tools.ts`, `contracts-tools.ts`, `projects-tools.ts`, `bi-tools.ts`, `web-tools.ts`, `register-finance.ts`, `index.ts` (barrel parcial — exporta só `types`, `finance-tools`, `domain-tool-executor`).

### 6.6 Exemplos concretos

**Leitura + escrita autorizada** (`apps/web/src/modules/ai/core/tools/domain/sales-tools.ts:8-95`)

```ts
const metadata = (namespace: string): DomainToolMetadata =>
  ({ namespace, domain: 'crm', sensitivity: 'confidential', contractVersion: 'v1' });   // :4
const readRoles  = ['owner','admin','operator','viewer','billing'] as const;             // :5
const writeRoles = ['owner','admin','operator'] as const;                                 // :6

{
  name: 'sales.quote.search',
  executionType: 'READ',
  requiredRole: [...readRoles],
  metadata: metadata('sales.quote.search'),
  handler: async (rawInput, ctx) => {
    const input = (rawInput ?? {}) as { customerId?: string; status?: string };
    let rows: any[] = await opportunitiesRepository.getByOrganizationId(ctx.organizationId);  // ← tenant filter
    ...
  },
},
{
  name: 'sales.quote.create',
  executionType: 'ACTION',
  requiredRole: [...writeRoles],
  metadata: metadata('sales.quote.create'),
  policy: { requiresHumanApproval: true, requiredPermissions: ['sales.write'], riskLevel: 'medium' }, // :31
  handler: async (rawInput, ctx) => { /* valida entrada, persiste com organization_id e user_id */ },
}
```

**Tool de rede externa** (`apps/web/src/modules/ai/core/tools/domain/web-tools.ts:1-130`)

- `web.search` (`:8-27`) — **placeholder que retorna vazio** e pede `NEXT_PUBLIC_WEB_SEARCH_API_KEY`. Exemplo de dívida: tool registrada mas não implementada.
- `web.fetch` (`:29-67`) — `fetch` real com `User-Agent`, `AbortSignal.timeout(10000)`, extração texto por regex, `slice(0, 5000)`.
- `browser.scrape`, `browser.validate_cnpj`, `browser.extract_contacts` (`:69-127`) — carregam `harnessClient` via `await import(...)` dinâmico para evitar acoplamento no bundle.

> Este é o **precedente mais próximo** para integrar um SDK HTTP externo atrás de uma tool do agente.

### 6.7 `domain-tool-executor.ts` (`domain-tool-executor.ts:4-16`)

Fachada fina sobre o registry, com singleton `domainToolExecutor`.

---

## 7. Testes

Framework: **vitest** (`npx vitest run`). Apenas 4 arquivos de teste existem:

| Arquivo | Alvo |
| --- | --- |
| `apps/web/src/application/use-cases/__tests__/execute-commercial-followup.test.ts` | 4 testes do job Comercial (98 linhas) |
| `apps/web/src/application/use-cases/__tests__/execute-qa-pr-review.test.ts` | job QA |
| `apps/web/src/application/use-cases/__tests__/send-message.test.ts` | use case de chat |
| `apps/web/src/modules/governance/__tests__/governance.test.ts` | governança |

**Estrutura do teste do Comercial** (`execute-commercial-followup.test.ts:6-98`)

```ts
let leadRepo: InMemoryLeadRepository;
let controlPlane: InMemoryCompanyControlPlaneAdapter;
let useCase: ExecuteCommercialFollowupUseCase;

beforeEach(() => {
  leadRepo    = new InMemoryLeadRepository();
  controlPlane = new InMemoryCompanyControlPlaneAdapter(leadRepo);   // injeta repo no CP
  useCase      = new ExecuteCommercialFollowupUseCase(leadRepo, controlPlane);
});
```

Os 4 cenários (`:17`, `:40`, `:65`, `:83`):

1. ** elabora rascunhos personalizados** — conta, stage, conteúdo do assunto, `complianceCheck`, `status === 'pending_approval'`.
2. ** registra job `waiting_approval` e NÃO envia** — `job.agentRole === 'commercial'`, `approvalGate.type === 'outbound_contact'`, agente `waiting_approval`, nenhum draft `dispatched`.
3. ** aprovação humana ⇒ dispatch** — `approveJob(...)` ⇒ `job.status === 'completed'`, evidence contém `'Disparo Externo Concluído'`, todos os drafts `dispatched`.
4. ** rejeição humana ⇒ nada enviado** — `rejectJob(...)` ⇒ `job.status === 'rejected'`, nenhum draft `dispatched`.

**Cobertura do fluxo de aprovação = manual/in-memory.** Não há teste de tenant/RBAC, idempotência ou route HTTP — apesar do `AGENTS.md` exigir "testes de integração para consulta, escrita autorizada, negação por tenant/RBAC e idempotência".

**Débitos**: `tsconfig.json:42` exclui `apps/web/src/**/__tests__/*` ⇒ **testes não são typecheckados**.

---

## 8. package.json, toolchain e scripts

Ver seção [1.1](#11-packagejson-toolchain-e-scripts).

Comandos canônicos:

```bash
npm run typecheck          # tsc --noEmit
npm test                   # npx vitest run
npm run build:web          # next build --webpack
npm run build              # node scripts/build-tauri.mjs
npm run job:commercial:followup
npm run job:qa:review_pr
```

**Não existe `npm run lint`.**

### 8.1 Script CLI do job Comercial (`scripts/execute-commercial-followup.ts:1-78`)

Runner standalone em 4 etapas com `console.log` formatado: varredura de leads → geração de drafts → registro do job/gate → verificação de segurança. Importa os singletons de infraestrutura diretamente (`:8-10`) — acoplamento direto, sem composition root.

---

## 9. Env e configuração

### 9.1 `.env.example` (`.env.example:1-28`)

| Grupo | Variáveis |
| --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID_DEV`, `SUPABASE_PROJECT_ID_PROD` |
| GitHub | `GITHUB_ORG`, `GITHUB_AI_REPO`, `GITHUB_TOKEN` |
| GitLab | `GITLAB_GROUP`, `GITLAB_AI_REPO`, `GITLAB_CLI_REPO`, `GITLAB_TOKEN` |
| LLM | `OLLAMA_BASE_URL`, `NVIDIA_NIM_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` |
| Web search (usado, não documentado) | `NEXT_PUBLIC_WEB_SEARCH_API_KEY`, `NEXT_PUBLIC_WEB_SEARCH_PROVIDER` (`web-tools.ts:23-24`) |

Existe `.env.local` (não versionado). Não há `zod` para validação de env.

> **Ponto crítico de segurança**: o `AGENTS.md` determina "Segredos e credenciais de provedores ficam somente no backend". Tokens da Meta (`META_AD_ACCOUNT_ID`, `META_ACCESS_TOKEN`, `META_PAGE_ID`, `META_INSTAGRAM_ACCOUNT_ID`, `META_APP_SECRET`, `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`) devem ser **server-only**, sem prefixo `NEXT_PUBLIC_`.

### 9.2 Validação de env

**Inexistente.** `apps/web/src/server/rag/env.ts` e `apps/web/src/server/rag/shared/config/environment.ts` usam defaults inline e estão **fora do typecheck** (`tsconfig.json:40`). `apps/web/src/shared/supabase.ts` e `apps/web/src/shared/crypto-vault.ts` são os pontos de acesso a chaves.

---

## 10. O papel Comercial hoje

### 10.1 Fluxo completo

```
[UI] CompanyMonitor.tsx  botão "Job: commercial.followup"
      → executeJob('commercial.followup')  (:82)
      → POST /api/control-plane/jobs/execute
          → new ExecuteCommercialFollowupUseCase(defaultLeadRepository, defaultCompanyControlPlane)
          → useCase.execute()                       (varre → rascunha → submitJob)
          → JobEntity status=waiting_approval + ApprovalGate(outbound_contact)
      ← JSON { jobId, status, requiresApproval, approvalGateId, leadsCheckedCount, draftsGenerated }

[Human] modal de aprovação → controlPlane.approveJob(approvalId, rationale)
      → drafts → 'dispatched', leads → 'in_dialogue'
      → JobEntity → 'completed', telemetry.totalJobsCompleted += 1

[CLI]  npm run job:commercial:followup  (mesmo use case, singletons)
[CP]   InMemoryCompanyControlPlaneAdapter.executeJob('commercial.followup')
```

### 10.2 Documentação existente

- [ADR-0028](../adr/0028-empresa-virtual-de-agentes-control-plane.md) — Control Plane, evidência, aprovação.
- [ADR-0029](../adr/0029-implementacao-ui-threejs-e-automacoes-copilot.md) — UI Three.js + automações.
- [ADR-0034](../adr/0034-implementacao-job-commercial-followup-e-human-gate.md) — job `commercial.followup` e Human Gate de outbound (detalha `domain/commercial.ts`, `LeadRepositoryPort`, use case, ciclo de vida do gate, 3 superfícies de execução).
- [ADR-0035](../adr/0035-implementacao-job-qa-review-pr-e-analise-adversarial.md) — job `qa.review_pr` (template para novos jobs).

### 10.3 Referências a Meta/Facebook hoje

**Nenhuma.** Nenhum arquivo menciona `facebook`, `meta`, `graph.facebook.com`, `ads_management`, `conversions api`, `pixel`, `lead ads` ou `messenger` fora de conteúdo genérico. O lead mais próximo é `web-tools.ts` (`web.fetch` genérico).

---

## 11. Plano de integração do Facebook Business SDK

### 11.1 O que é o SDK

`facebook-nodejs-business-sdk` (620★, npm, Apache/BSD do Meta) — SDK único para Marketing API + Pages + Business Manager + Instagram + **Conversions API** (CAPI).

**Superfície de API relevante (extraída do README oficial):**

```js
const adsSdk = require('facebook-nodejs-business-sdk');
const api = adsSdk.FacebookAdsApi.init(accessToken);
api.setDebug(true);                                  // logging de requests

const account = new adsSdk.AdAccount('act_<ID>');
account.read([adsSdk.AdAccount.Fields.name]);       // READ
account.getCampaigns([adsSdk.Campaign.Fields.name], { limit: 20 }); // paginado (Cursor)
campaigns.hasNext(); await campaigns.next();

account.createCampaign([adsSdk.Campaign.Fields.name], {
  [adsSdk.Campaign.Fields.status]:   adsSdk.Campaign.Status.paused,   // ← criar pausado!
  [adsSdk.Campaign.Fields.objective]: adsSdk.Campaign.Objective.page_likes,
});

new adsSdk.Campaign(campaignId).update({ [adsSdk.Campaign.Fields.name]: '...' });
new adsSdk.Campaign(campaignId).delete();

// Conversions API
bizSdk.FacebookAdsApi.init(accessToken);
const userData = (new bizSdk.UserData())
  .setEmail('joe@eg.com')
  .setClientIpAddress(req.socket.remoteAddress)
  .setClientUserAgent(req.headers['user-agent']);      // hash SHA-256 automático
const customData = (new bizSdk.CustomData()).setCurrency('usd').setValue(123.45);
const serverEvent = (new bizSdk.ServerEvent())
  .setEventName('Purchase').setEventTime(Math.floor(Date.now()/1000))
  .setUserData(userData).setCustomData(customData)
  .setEventSourceUrl('http://...').setActionSource('website');
await (new bizSdk.EventRequest(accessToken, pixelId)).setEvents([serverEvent]).execute();
```

Pré-requisitos: App no developers.facebook.com com produto **Marketing API**, permissão `ads_management` (User token) ou `manage_page` (Page token), **App Secret Proof** ligado, e access token de longa duração.

### 11.2 Encaixe na arquitetura hexagonal

```
src/domain/meta-ads.ts                              ← entidades puras (NO SDK types)
src/application/ports/meta-ads-port.ts              ← contrato (NOVO)
src/infrastructure/meta/facebook-business-sdk-adapter.ts  ← adapter (SDK isolado)
src/infrastructure/meta/credentials.ts               ← env server-only
src/modules/ai/core/tools/domain/meta-ads-tools.ts  ← tools tipadas p/ o registry
src/app/api/control-plane/jobs/execute/route.ts      ← novo jobName
docs/adr/0036-*.md                                   ← ADR
```

**Regra de ouro**: `apps/web/src/domain/meta-ads.ts` **não importa** `facebook-nodejs-business-sdk`. O SDK só aparece em `apps/web/src/infrastructure/`. Isso é exigível pelo `AGENTS.md` ("Camadas estritas").

### 11.3 Passos de implementação propostos

**Passo 1 — `apps/web/src/domain/meta-ads.ts`** (domínio puro)

- `MetaAdAccount { id: string; businessId: string; currency: string; timezone: string; spendCapUsd?: number }`
- `MetaCampaign { id; adAccountId; name; objective: MetaObjective; status: 'ACTIVE'|'PAUSED'|'ARCHIVED'; dailyBudgetCents; createdTime; updatedTime }`
- `MetaLeadAdsLead { metaLeadId; adAccountId; campaignId; adsetId; adId; formId; createdTime; fields: Record<string,string>; syncedAt? }`
- `MetaConversionsEvent { eventName: MetaEventName; eventTimeUnix; emailHashed?; phoneHashed?; fbc?; fbp?; valueCents?; currency; actionSource; eventSourceUrl? }`
- Estender `LeadStage` de `commercial.ts` para aceitar `meta_lead` ou adicionar `source: 'meta_ads' | ...` + `metaLeadId?` em `Lead`.
- Ampliar `FollowupDraft.channel` para `'email' | 'whatsapp' | 'messenger' | 'instagram'`.

**Passo 2 — `apps/web/src/application/ports/meta-ads-port.ts`**

```ts
export interface MetaAdsCredential {
  accessToken: string; appSecret: string;   // App Secret Proof
  adAccountId: string; pageId?: string; instagramAccountId?: string; pixelId?: string;
}
export interface MetaCredentialPort { resolve(ctx: MetaAuthContext): Promise<MetaAdsCredential | null>; }
export interface MetaAdsPort {
  listCampaigns(c: MetaAdsCredential): Promise<MetaCampaign[]>;
  pauseCampaign(c: MetaAdsCredential, campaignId: string, idempotencyKey: string): Promise<{ campaignId: string; status: string }>;
  fetchLeadAdsLeads(c: MetaAdsCredential, since: string): Promise<MetaLeadAdsLead[]>;
  sendConversionsEvent(c: MetaAdsCredential, e: MetaConversionsEvent): Promise<{ eventsReceived: number; matches: number }>;
}
```

**Passo 3 — `apps/web/src/infrastructure/meta/facebook-business-sdk-adapter.ts`**

- `import * as adsSdk from 'facebook-nodejs-business-sdk'` — import **estático e server-only** (`import 'server-only'` se disponível).
- Cliente por tenant, memoizado por `organizationId` (o SDK é stateful por token).
- `getApi(accessToken, appSecret)` — `FacebookAdsApi.init(token)`; implementar `appsecret_proof` (hash HMAC-SHA256 de `appsecret|token`).
- **Paginação**: iterar `Cursor` até `hasNext() === false`.
- **Erros**: normalizar para `apps/web/src/domain/errors.ts`; nunca vazar token em logs/mensagens.
- **Idempotência**: chave determinística por operação; mapear retry de rede.

**Passo 4 — Tools tipadas** (`meta-ads-tools.ts`), no padrão de `sales-tools.ts` + `web-tools.ts`:

| Tool | Tipo | Política |
| --- | --- | --- |
| `meta.campaign.list` | READ | `requiredRole: readRoles`, `sensitivity: 'restricted'` |
| `meta.lead_ads.sync` | ACTION | `permissions: ['crm.write']`, `requiresHumanApproval: false`, `riskLevel: 'low'` (ingestão) |
| `meta.campaign.pause` | ACTION | `permissions: ['ads.write']`, `requiresHumanApproval: true`, `riskLevel: 'high'` |
| `meta.campaign.upsert` | ACTION | `requiresHumanApproval: true`, `riskLevel: 'critical'` — **sempre cria `PAUSED`** |
| `meta.conversions.send` | ACTION | `requiresHumanApproval: true`, `riskLevel: 'high'` |

Ampliar `DomainToolMetadata['domain']` (`domain/types.ts:13`) com `'ads' | 'marketing'`.

**Passo 5 — Novo job `commercial.meta_leads`**

`apps/web/src/application/use-cases/execute-commercial-meta-leads.ts`:
1. `meta.lead_ads.sync` → importa Lead Ads como `Lead` (`source: 'meta_ads'`, `stage: 'inbound'`).
2. Qualifica via `LlmPort` (aqui sim usar LLM, em vez do `generateDraft` hardcoded atual).
3. Rascunhos com `channel: 'messenger'`.
4. `submitJob` com `approvalGate.type: 'outbound_contact'` — **nenhum envio sem gate humano**.

Registrar em `executeJob()` (`in-memory-control-plane.ts:273`), na route HTTP, e criar `scripts/execute-commercial-meta-leads.ts` + script npm.

**Passo 6 — Env, ADR e testes**

```
# Meta / Facebook Business SDK (server-only, NUNCA NEXT_PUBLIC_)
META_APP_ID=
META_APP_SECRET=
META_AD_ACCOUNT_ID=
META_PAGE_ID=
META_INSTAGRAM_ACCOUNT_ID=
META_PIXEL_ID=
META_ADS_ACCESS_TOKEN=
META_CAPI_ACCESS_TOKEN=
```

- ADR-0036 documentando a decisão.
- Testes vitest com um `FakeMetaAdsAdapter` (in-memory, nunca rede em CI):
  - sync cria `Lead` com `source: 'meta_ads'`;
  - job fica `waiting_approval` e **zero** eventos enviados antes do gate;
  - aprovação ⇒ exatamente 1 envio por draft (idempotência);
  - rejeição ⇒ zero envios;
  - negação por tenant: `organizationId` diferente ⇒ `Access denied`;
  - token nunca aparece em `job.evidence`.

### 11.4 Riscos e precautions específicas

1. **`ads_management` exige app review** da Meta; testes em produção exigem Business Manager verificado. O adapter deve degradar para `not_configured` sem quebrar o Control Plane.
2. **Verificação `appsecret_proof`** é obrigatória para chamadas server-side; sem ela a Meta pode rejeitar.
3. **Tokens de longa duração** precisam de rotina de refresh/rotação — implementar no `MetaCredentialPort`, alinhado ao `CredentialPort` existente.
4. **CAPI exige hash** de `email`/`phone`/`fbc`/`fbp` (o SDK já faz, mas apenas quando o Parameter Builder roda).
5. **LGPD**: Lead Ads traz PII. `commercial.ts` já tem `complianceCheck.lgpdCompliant`;Lead importado da Meta deve exigir opt-in explícito e `hasOptOut`.
6. **Versionamento da Graph API**: a Marketing API v23+ remove `Facebook Marketing API` legado. Fixar a versão no adapter e documentar.
7. **Políticas de anúncios**: qualquer `ACTION` de escrita (`create/update/pause`) **deve** passar por `policy.requiresHumanApproval: true`, coerente com ADR-0028/0034.
8. **Estado global**: o SDK é stateful; o adapter **não** deve ser um singleton compartilhado entre tenants — instanciar por `organizationId`.

---

## 12. Débitos e riscos encontrados

| # | Débito | Evidência | Impacto |
| --- | --- | --- | --- |
| 1 | **Barrel de ports incompleto** — 9 ports, 5 exportadas | `apps/web/src/application/ports/index.ts:1-7` | Imports inconsistentes; adapters importam o path direto |
| 2 | **`zod` é dependência fantasma** | não em `package.json`; usado em `api/ai/chat/route.ts:2`, `api/ai/credentials/nvidia/route.ts:2`, `mcp-catalog/catalog.ts:1-2` | Build pode quebrar |
| 3 | **Testes fora do typecheck** | `tsconfig.json:42` | Erros de tipo em testes passam despercebidos |
| 4 | **Sem script `lint`** | `package.json:12-23` vs. `AGENTS.md` | Critério mínimo não cumprível |
| 5 | **`apps/web/src/server/rag` fora do typecheck** | `tsconfig.json:40` + `docs/adr/0001:35` | Defaults de env não validados (débito já registrado) |
| 6 | **Aprovação humana não passa por HTTP** | não há route de approve/reject em `apps/web/src/app/api/**`; UI chama o singleton | Gate humano não é auditado no servidor |
| 7 | **Estado global mutável em singleton** | `defaultCompanyControlPlane` (`in-memory-control-plane.ts:395`), `defaultLeadRepository` (`in-memory-lead-repository.ts:101`) | Estado compartilhado entre requisições; sem persistência |
| 8 | **`getDraftsByJobId` ignora `jobId`** | `in-memory-lead-repository.ts:75-77` | Aprovar um job despacha drafts de jobs anteriores |
| 9 | **`web.search` é placeholder que retorna vazio** | `web-tools.ts:8-27` | Tool registrada e não funcional |
| 10 | **`costUsd`/`durationSeconds` inventados** | `execute-commercial-followup.ts:64-65` | Telemetria de custo não é real |
| 11 | **`toolsUsed` são strings livres** | `execute-commercial-followup.ts:60`; `JobEntity.toolsUsed: string[]` | Sem rastreabilidade工具 real |
| 12 | **Nenhum LLM no job Comercial** | `generateDraft` hardcoded (`:88-133`) | Rascunhos não são contextualizados |
| 13 | **Wiring manual em 3 lugares** | route HTTP + `executeJob` + script CLI | Risco de divergência |
| 14 | **Ausência de teste de tenant/RBAC/idempotência** | só 4 arquivos de teste unitário | `AGENTS.md` pede teste de integração |
| 15 | **`DomainToolMetadata['domain']` sem `ads`/`marketing`** | `domain/types.ts:13` | Union fechada bloqueia tools Meta |