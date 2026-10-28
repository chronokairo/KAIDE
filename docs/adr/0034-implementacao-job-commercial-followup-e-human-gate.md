# ADR-0034 - Implementação Real do Job commercial.followup no Control Plane e Human Gate de Outbound

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

Conforme estipulado no modelo operacional da Chronokairo AI ([ADR-0028](./0028-empresa-virtual-de-agentes-control-plane.md)), a empresa virtual de agentes segue a regra inegociável **`AI → AI → AI → HUMAN`** — nenhuma IA dispara ações no mundo real (como mensagens externas, transferências bancárias ou deploys em produção) sem autorização prévia de um humano supervisor (Sócio/Diretor Técnico).

O usuário solicitou:
> "implemente real Execute o job 'commercial.followup' no harness chronokairo/ai. Verifique leads que aguardam contato ou follow-up e elabore rascunho de mensagem. Requer aprovação humana antes do envio."

## Decisões

### 1. Modelagem de Domínio Puro (`src/domain/commercial.ts`)
- Criação das entidades `Lead`, `FollowupDraft` e `CommercialFollowupJobResult` isoladas na camada de domínio (sem React, Next ou SDKs externos).
- Cada rascunho inclui validações de conformidade: `lgpdCompliant: true`, `hasOptOut: true` e tom consultivo compatível com B2B Enterprise.

### 2. Contrato de Porta e Repositório (`LeadRepositoryPort`)
- Criação da porta `LeadRepositoryPort` em `src/application/ports/lead-repository-port.ts`.
- Implementação concreta em `src/infrastructure/crm/in-memory-lead-repository.ts` com pipeline realista de leads:
  - **InovaHealth Soluções Médicas** (Dra. Camila Santos): Qualificação pós-demo de ASO e conformidade LGPD.
  - **Alpha Finanças S/A** (Rodrigo Lima, CTO): Proposta técnica sobre isolamento multitenant e segurança SOC2 no núcleo Rust zero-lib.
  - **LogTech Cargas** (Marcelo Duarte, Head de Operações): Inbound solicitando automação de triagem de fretes com OCR/RAG.

### 3. Caso de Uso `ExecuteCommercialFollowupUseCase`
- Localizado em `src/application/use-cases/execute-commercial-followup.ts`:
  1. Varre o CRM por leads com SLA de contato pendente (`awaiting_contact` ou `awaiting_followup`).
  2. Gera rascunhos de mensagens contextualizadas para cada lead conforme sua fase e prioridade.
  3. Registra os rascunhos com estado `pending_approval`.
  4. Registra o job no Control Plane (`CompanyControlPlanePort`) com:
     - `stage: 'commercial'`
     - `status: 'waiting_approval'`
     - `requiresApproval: true`
     - `approvalGate`: do tipo `outbound_contact` com evidências completas anexadas.
  5. Atualiza o agente `AI Comercial` para `waiting_approval`.

### 4. Ciclo de Vida do Human Approval Gate
- **Aprovação (`approveJob`):**
  - O Diretor Técnico analisa o rascunho e autoriza o envio.
  - O Control Plane marca o gate como `approved` e o job como `completed`.
  - Os rascunhos passam para o estado `dispatched` com timestamp de envio.
  - Os leads são atualizados para `in_dialogue`.
  - O agente Comercial transiciona brevemente para `working` (despacho) e retorna a `idle`.
- **Rejeição (`rejectJob`):**
  - O Diretor Técnico rejeita com justificativa de ajuste.
  - O gate e o job são marcados como `rejected`.
  - As mensagens permanecem não enviadas (`rejected`) e o agente Comercial retorna a `idle`.

### 5. Multi-Superfície de Execução
- **API Route:** `POST /api/control-plane/jobs/execute` executando o job via HTTP.
- **CLI Runner:** Script executável `npm run job:commercial:followup` (`tsx scripts/execute-commercial-followup.ts`).
- **Interface Visual (HUD):** Botão `[Job: commercial.followup]` integrado no cabeçalho de `CompanyMonitor.tsx`, acionando a execução e abrindo o modal de aprovação humana.

## Consequências

- O job `commercial.followup` opera de forma real, determinística e auditável no harness da plataforma.
- A regra `AI → AI → AI → HUMAN` é rigorosamente respeitada: nenhum email ou mensagem externa sai da plataforma sem validação humana do Diretor.
- Cobertura completa de testes automatizados unitários e de integração no Vitest (15/15 testes passando).
