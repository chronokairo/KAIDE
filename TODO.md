# TODO.md — Kaide

## 🏢 Empresa Virtual de Agentes — Próximos Jobs com Dados Reais do Supabase (ADR-0036)

> Conforme verificado no Supabase oficial de produção (`chronokairo-prod` / `your-project-ref`), existem **24 tabelas com dados reais ativos**. Os seguintes jobs e integrações devem ser implementados para os agentes operarem sobre esses dados:

### 1. Controladoria & Faturamento (`AI Finance / Ops`) — CONCLUÍDO (ADR-0037)
- [x] **Job `finance.reconcile`** (Conciliação de Contas a Receber e Contratos):
  - Consumir tabela `accounts_receivable` (20 faturas cadastradas) e cruzar com `contracts` (9 contratos, incluindo `AUDIOMED-SAAS-001` de R$ 3.600 e CIESA de R$ 3.500).
  - Identificar faturas pendentes da Audiomed (R$ 300/mês para 2026-09, 2026-10, 2026-11 e 2026-12) e gerar relatório de inadimplência/previsão de caixa.
  - Requer aprovação humana do Diretor (`payment_release`) antes de emitir cobranças.
- [x] **Job `finance.cash_flow`** (Contas a Pagar e Conciliação Bancária):
  - Consumir tabela `accounts_payable` (8 contas pagas: honorários advocatícios R$ 1.000, domínios `chronokairo.com.br` R$ 80 e `manausdev.com.br` R$ 40).
  - Reconciliar com as 3 contas em `financial_accounts` (`Banco Inter ChronoKairo/RLV`, `Conta VLM`, `Nubank pessoal Riad`).
  - Gerar DRE preliminar e relatório de fluxo de caixa segregando PJ e PF.
- [x] **Job `finance.nfe_allocation`** (Alocação de NFS-e e Faturamento):
  - Consumir tabela `service_invoices` (6 notas fiscais emitidas) e mapear através de `service_invoice_receivable_allocations` (7 alocações).
  - Verificar se todas as faturas recebidas possuem NFS-e correspondente e apontar divergências fiscais.

### 2. Jurídico, Due Diligence & Propriedade Intelectual (`AI Analista / Jurídico`) — CONCLUÍDO (ADR-0038)
- [x] **Job `legal.audit_case`** (Auditoria de Casos Jurídicos e B.O.):
  - Consumir tabela `legal_cases` (Processo/B.O. `00215674/2026-A01` do 22º DIP / Polícia Civil AM envolvendo o Instituto WD Educacional e CIESA).
  - Auditar narrativa de apropriação indébita de códigos-fonte, site institucional do CIESA e RP Educacional.
  - Varrer o histórico dos repositórios locais para emitir relatório técnico pericial de conformidade e autoria de software.
- [x] **Job `legal.review_contracts`** (Auditoria de Minutas e Conformidade Contratual):
  - Analisar minutas em `contracts` com status `Draft` (ex: `MINUTA-CIESA-VLM-2025-10`).
  - Apontar cláusulas faltantes: ausência de assinaturas, falta de testemunhas, dados incompletos da contratada e ausência de comprovante de pagamento.

### 3. Engenharia de Software, Backlog & Sprints (`AI Coder` & `AI Product`) — CONCLUÍDO (ADR-0038)
- [x] **Job `coder.sync_sprint`** (Sincronização de Tarefas do Banco com Git):
  - Consumir tabela `project_tasks` (10 tarefas reais: `AUDIO-ASO-01`, `SECP-01` a `SECP-07`, `TSK-4EC62792`).
  - Vincular os códigos de tarefas aos commits do repositório e branches (`feature/aso-*`) via `gh` e `glab`.
  - Atualizar atomicamente `column_status` (`In Progress` -> `In Review` / `Done`) na tabela `project_tasks` após aprovação do Human Approval Gate (`scope_baseline`) pelo Diretor.
- [x] **Job `product.spec_milestones`** (Refinamento de Backlog e Requisitos):
  - Consumir tarefas com status `To Do` em `project_tasks` (ex: `SECP-PHASE2-TOTVS` — integração com TOTVS não executada).
  - Gerar especificação técnica detalhada com critérios de aceite em YAML e arquitetura hexagonal pura.

### 4. Suporte & Base de Conhecimento (`AI Support`) — CONCLUÍDO (ADR-0038)
- [x] **Job `support.triage_history`** (Triagem de Conversas e Geração de FAQ):
  - Varrer as 14 conversas em `ai_conversations` e 27 mensagens em `ai_messages`.
  - Classificar dúvidas e chamados recorrentes dos usuários, gerando artigos de base de conhecimento para o `AI Support`.

---

### Registro de Mudanças (Changelog ADR-0038) — 2026-10-03
- **Domínio & Porta de Controle de Versão (Source Control)**:
  - Criação de `apps/web/src/domain/source-control.ts` e `apps/web/src/application/ports/source-control-port.ts` em inglês puro.
  - Implementação de `apps/web/src/infrastructure/git/gh-glab-source-control.ts` conectando os CLIs autenticados `gh` (GitHub) e `glab` (GitLab) limitados à organização e grupo `chronokairo`.
- **Sincronização Real de Sprint com Evidência de Git**:
  - `coder.sync_sprint` vinculado a branches, commits convencionais e pull/merge requests reais.
  - Gravação atômica em `project_tasks.column_status` no Supabase prod ativada sob o gate humano `scope_baseline`.
- **Transição Completa para Inglês Puro**:
  - Módulos Legal, Support, Engineering, Finance e Control Plane reescritos em inglês puro em todas as tipagens, docstrings e contratos.
- **5 Novos Jobs Conectados no Control Plane**:
  - `coder.sync_sprint`, `product.spec_milestones`, `legal.audit_case`, `legal.review_contracts`, `support.triage_history`.
- **Validação de Testes**: 28/28 testes passando com dados reais do Supabase prod e TypeScript limpo.

### Registro de Mudanças (Changelog ADR-0038 Refactor, Dual-Forge & Resend) — 2026-10-03
- **Eliminação Total de Adapters Mock / In-Memory**:
  - Remoção definitiva de `apps/web/src/infrastructure/qa/in-memory-pr-repository.ts` e do adapter monolítico `apps/web/src/infrastructure/git/gh-glab-source-control.ts`.
  - Implementação de `ForgePullRequestRepository` (`apps/web/src/infrastructure/qa/forge-pull-request-repository.ts`) conectado diretamente ao forge GitHub via `GitHubPort`.
- **Desacoplamento e Domínio Puro Multi-Forge**:
  - `apps/web/src/domain/forge.ts`: Extração do domínio compartilhado para task codes (`extractTaskCodes`) e commits convencionais (`parseConventionalCommit`, `ConventionalCommit`).
  - `apps/web/src/domain/github.ts` e `apps/web/src/application/ports/github-port.ts`: Domínio e porta nativa do GitHub.
  - `apps/web/src/domain/gitlab.ts` e `apps/web/src/application/ports/gitlab-port.ts`: Domínio e porta nativa do GitLab.
  - `apps/web/src/application/ports/cli-runner-port.ts` e `apps/web/src/infrastructure/cli/node-cli-runner.ts`: Porta e runner de execução de processos com proteção contra command injection.
  - `apps/web/src/infrastructure/git/gh-cli-github-adapter.ts`: Adapter para o CLI autenticado `gh` (leitura de PR/branches/commits/files/checks e submissão de reviews).
  - `apps/web/src/infrastructure/git/glab-cli-gitlab-adapter.ts`: Adapter para o CLI autenticado `glab` (leitura de MR/branches/commits/changes/pipeline e criação de notas).
  - `apps/web/src/infrastructure/git/forge-source-control-adapter.ts`: Unificação dos forges com coletor de warnings resiliente (`safeFetch`).
- **Suporte Real Conectado a `support_tickets` e `support_incidents`**:
  - `apps/web/src/domain/support.ts`, `apps/web/src/application/ports/support-repository-port.ts` e `SupabaseSupportRepository` atualizados para consumir as tabelas de produção `support_tickets` e `support_incidents`.
  - `ExecuteSupportTriageUseCase` reescrito em inglês puro, sem conteúdo fabricado nem union types bilíngues.
- **Integração Oficial com Resend SDK & Eventos de Job**:
  - Adição do SDK oficial `resend` (`npm i resend`).
  - Configuração do serviço de email `ResendEmailService` com chave de API `re_ieVzmFiy_FX8qA9UWrqsgyPZPkmXojD2h` e janela de sincronização de 24h.
  - Adição dos tipos `JobEventType` (`'email.sent'`, `'email.synced'`, `'email.bounced'`) e persistência de eventos no Supabase.
  - Disparo real de emails via Resend ativado no Control Plane ao aprovar o gate humano `outbound_contact`.
- **Implementação do Job `commercial.daily` (AI Comercial / SDR)**:
  - Criação do caso de uso `ExecuteCommercialDailyUseCase` (`apps/web/src/application/use-cases/execute-commercial-daily.ts`) e script `scripts/execute-commercial-daily.ts` (`npm run job:commercial:daily`).
  - Auditoria e due diligence corporativa dos 13 leads qualificados reais do Supabase produção (`leads`), enriquecimento de notas de CRM e elaboração de rascunhos consultivos mantidos sob Human Approval Gate.
- **Revisão e Limpeza em Inglês Puro**:
  - Módulos Legal, Support e Engineering sem tipos em português ou validações artificiais.
- **Validação de Testes e Typecheck**:
  - 35/35 testes passando no Vitest em 8 suítes de teste; TypeScript compilando com zero erros.

---

## P0 — Coding agent de mercado (fundação) — CONCLUÍDO

Todos os P0s de fundação foram implementados e validados (19 capabilities + worktree/checkpoints,
tela de task supervision e distribuição/auto-update): 31 testes de integração em
`kaide-rs/core` → `tests/p0_*.rs`, suíte completa verde (519 unit + 31 integração).
Registro: [ADR-0024](docs/adr/0024-roadmap-p0-mercado-validacao-e-implementacao.md) ·
Entregas no [CHANGELOG](CHANGELOG.md) (2026-09-26).

## P1 — Coding agent de mercado (detalhe e fontes em `docs/market/TODO.md`; implementação como débito em [ADR-0026](docs/adr/0026-debito-implementacao-p1s-mercado.md))

Núcleo `kaide`:

- [ ] **A1** Classificador de risco no approval gate — risco da tool call avaliado por LLM (1 token), evidência persistente que sobreviva a compaction, aprovação invalidada ao ampliar permissões [Codex Guardian V2; Claude Code auto mode] — base: `AgentHooks.require_approval`, `tools/exec_policy.rs`
- [ ] **A2** Governança de subagentes — sem aninhamento por padrão, permissões próprias, allowlist de tools por subagente, caps de concorrência/spawns/WebSearch por sessão [OpenCode v1.18; Qwen 0.23.4; Claude Code 2.1.232] — base: `agent/subagent.rs`
- [ ] **A3** Compaction econômica — microcompactação preservando prompt-cache, resume por boundary de compaction, checkpoint no compaction, modelo dedicado configurável [Qwen 0.23.0; Codex 0.150/0.155; Zed `compaction_model`] — base: `compressor/`, `memory/short_term.rs`
- [ ] **A4** Cliente MCP 2026-07-28 — OAuth com refresh (RFC 9207/CIMD), tool search paginado + deferred loading, startup não bloqueante, `output_token_limit` por tool, resource templates, abort signals [Claude Code 2.1.274/2.1.283; Codex 0.147/0.152; Gemini CLI v0.60] — base: `mcp/mod.rs`
- [ ] **A5** Sandbox fail-closed — rede imposta em redirects/HTTP-WS contínuos com cancelamento na revogação, mascaramento de credenciais no egress (JWT/SigV4), regra "containment escape" [Codex 0.156/0.157; Claude Code 2.1.224] — base: `tools/sandbox.rs`, `tools/shell.rs`

Protocolo e multi-superfície:

- [ ] **B1** ACP como porta universal — expor o `kaide` como ACP server e consumir harnesses externos (Claude Code/Codex/goose) como backends orquestráveis; elicitação/question via ACP [Zed v1.12/v1.17; Goose ACP; Kiro Crew 0.7.0] — base: `mcp/server.rs`, `protocol/`
- [ ] **B2** Daemon app-server compartilhado — lifecycle de daemon (auto-start, updates geridos), sessões compartilhadas entre TUI/IDE/desktop [Codex 0.154–0.157] — base: `app_server/`

Shell desktop (Tauri):

- [ ] **C1** Console de supervisão/fleet — kanban de sessões com estados ("aguardando confirmação"), stop de subagente individual, indicador de subagentes ativos, modelo/reasoning por missão, milestones com validação [Windsurf Command Center 3.7–3.10; Factory Mission Control; Codex 0.156] — base: `TaskSupervisionScreen.tsx`
- [ ] **C2** UX de checkpoints/rewind — verificação de backups antes de restaurar, navegação anterior/próximo entre checkpoints no chat, "view changes" ao concluir task [Claude Code 2.1.265; Roo Code 3.53.0; Cline 4.1.7] — base: `agent/checkpoint.rs`

Autonomia e review:

- [ ] **D1** Fila durável de tasks/workflows — journal/WAL de sessão que sobreviva a restarts [Kiro Crew 0.7.0; Qwen Managed Runtime v2] — base: `protocol/event_log.rs`
- [ ] **D2** Gatilhos event-driven — watch de PR (GitHub/GitLab/Bitbucket/Azure DevOps) com comentários de review alimentando o agente, agendamentos, comentários do time [Cursor Subscriptions 2026-08-19; Kilo PR watches 7.5.16+; OpenHands automations]

Plataforma, segurança e governança:

- [ ] **E1** Supply-chain de plugins/skills — pin sha256 da origem, npm `--ignore-scripts` + verificação de integridade, validação de manifesto, evals de plugin com relatório pontuado, marketplace com allowlist enterprise [Claude Code 2.1.269–2.1.281; Codex 0.150; Cline 4.1.12] — base: `skills/mod.rs`
- [ ] **E2** Managed settings fail-closed — políticas geridas só apertam (nunca afrouxam), `availableModelsMatch: "exact"` + `deniedModels`, sandbox floor corporativo [Claude Code 2.1.283/2.1.280; Copilot CLI 1.0.76/1.0.87] — base: `config/settings.rs`
- [ ] **E3** Segredos e arquivos sensíveis — aprovação explícita para ler `.env`/chaves/certificados, não carregar `.env` automaticamente, redaction em telemetria [Augment 2026-09-14; Kiro CLI 2.24; Goose 1.49] — base: `tools/sandbox.rs` (`denied_patterns`)

## P0 — Refatoração Kaide

- [ ] Substituir o branding Athena pela identidade Kaide.
- [ ] Decompor `apps/web/src/App.tsx` em shell, chat, histórico, fontes, confirmações e resultados de ferramentas.
- [ ] Adotar componentes e tokens do `@chronokairo/ui` em toda a interface.
- [ ] Integrar Auth/SSO, organização e RBAC reais da Platform.
- [ ] Separar consulta e manipulação em casos de uso e contratos versionados.
- [ ] Exigir confirmação e auditoria para ferramentas de escrita sensíveis.
- [ ] Implementar `/health`, `/ready` e `/version`.
- [ ] Cobrir isolamento entre tenants, autorização, idempotência e tool calling com testes.

This document outlines identified issues, technical debt, and potential improvements for the Athena server codebase. Based on code analysis, these items should be prioritized for better maintainability, performance, security, and scalability.

## 🚨 Critical Issues

### Security Vulnerabilities
- [ ] **Input Validation**: Add comprehensive input sanitization for all API endpoints. Currently relies on basic Express middleware without schema validation.
- [ ] **Rate Limiting**: Current rate limiting is basic; implement more granular limits per endpoint and user.
- [ ] **Authentication**: No proper authentication system beyond basic session handling. Consider JWT or OAuth for API access.
- [ ] **Environment Variables**: Add validation and defaults for all env vars. Currently, missing vars could cause runtime errors.
- [ ] **CORS Configuration**: CORS is configured but may be too permissive in production. Add whitelist validation.
- [ ] **Helmet Security Headers**: Review and tighten CSP headers, especially for script-src and style-src.

### Error Handling & Reliability
- [ ] **Error Propagation**: Many async operations lack proper error boundaries. Implement centralized error handling middleware.
- [ ] **Graceful Shutdown**: Add signal handlers for SIGTERM/SIGINT to close connections cleanly.
- [ ] **Health Checks**: Current health endpoint is basic. Add dependency checks (Ollama, Supabase, vector store).
- [ ] **Circuit Breaker**: Implement circuit breaker pattern for Supabase/LLM calls to prevent cascading failures.
- [ ] **Retry Logic**: Add exponential backoff for failed API calls and LLM requests.

## ⚡ Performance Issues

### Caching & Optimization
- [ ] **Cache Invalidation**: Current cache doesn't handle API data changes. Implement cache versioning or TTL-based invalidation.
- [ ] **Memory Leaks**: Vector store loads everything into memory. Consider streaming or pagination for large datasets.
- [ ] **Database Connection Pooling**: If using databases, implement connection pooling (currently uses lowdb which is file-based).
- [ ] **Embedding Optimization**: Ollama embeddings are synchronous. Consider batch processing or async queues.
- [ ] **Response Compression**: Already enabled but could be optimized for different content types.

### API Efficiency
- [ ] **N+1 Query Problem**: Supabase queries should batch/parallelize where possible (see pessoa completa: customers + contacts + tickets).
- [ ] **Response Size**: Some API responses may be large. Add pagination and selective field retrieval.
- [ ] **Streaming Optimization**: Chat streaming works but could benefit from better backpressure handling.

## 🏗️ Architecture & Code Quality

### Code Structure
- [ ] **Layer Violations**: Some features import from other features directly, violating Feature-Sliced Design principles.
- [ ] **Circular Dependencies**: Check for circular imports between features (e.g., rag ↔ chat ↔ api-client).
- [ ] **Singleton Pattern Abuse**: Services use singletons, making testing difficult.
- [ ] **Type Safety**: Some `any` types remain. Add proper TypeScript interfaces throughout.
- [ ] **Code Duplication**: Similar API client patterns repeated. Extract common HTTP client utilities.

### Testing & Quality Assurance
- [ ] **Unit Tests**: No test suite exists. Add Jest/Vitest with coverage requirements.
- [ ] **Integration Tests**: Test API endpoints, RAG pipeline, and MCP server.
- [ ] **E2E Tests**: Test full chat flow from client to LLM response.
- [ ] **Load Testing**: Performance test with realistic workloads.
- [ ] **Linting**: Add stricter ESLint rules and Prettier configuration.

## 🔧 Operational Concerns

### Monitoring & Observability
- [ ] **Structured Logging**: Replace console.log with proper logging library (Winston, Pino) with log levels.
- [ ] **Metrics**: Add Prometheus metrics for request latency, error rates, cache hits.
- [ ] **Tracing**: Implement distributed tracing for API calls and LLM requests.
- [ ] **Alerting**: Set up alerts for API failures, high latency, or resource exhaustion.

### Configuration Management
- [ ] **Configuration Validation**: Use libraries like Joi or Zod to validate configuration at startup.
- [ ] **Environment-Specific Configs**: Separate dev/staging/prod configurations.
- [ ] **Secrets Management**: Move sensitive data to proper secret management (Vault, AWS Secrets Manager).

## 📊 Feature Gaps

### RAG System
- [ ] **Multi-Modal Support**: Currently text-only. Consider image/document processing.
- [ ] **Context Window Management**: LLM context limits not handled. Implement context truncation/summarization.
- [ ] **Model Selection**: Hard-coded to gemma3:1b. Allow dynamic model selection.
- [ ] **Fine-Tuning**: No mechanism for model fine-tuning on support/ops domain data.

### MCP Integration
- [ ] **Tool Discovery**: MCP tools are static. Implement dynamic tool registration.
- [ ] **State Management**: MCP server doesn't persist conversation state.
- [ ] **Authentication**: MCP protocol doesn't handle authentication. Add API key validation.

### API Client
- [ ] **Request Deduplication**: Prevent duplicate API calls for same request.
- [ ] **Response Caching**: Beyond basic TTL, implement smart cache invalidation.
- [ ] **API Versioning**: No versioning strategy for Supabase-backed endpoint changes.

## 🐳 DevOps & Deployment

### Containerization
- [ ] **Multi-Stage Builds**: Optimize Docker image size with proper multi-stage builds.
- [ ] **Health Checks**: Add Docker health checks for container orchestration.
- [ ] **Resource Limits**: Set CPU/memory limits for containers.

### CI/CD
- [ ] **Automated Testing**: Set up GitHub Actions for build, test, and deploy.
- [ ] **Security Scanning**: Add Snyk or similar for dependency vulnerability scanning.
- [ ] **Code Quality Gates**: Enforce code coverage and quality metrics.

### Production Readiness
- [ ] **Database Migration**: If moving beyond lowdb, implement proper migrations.
- [ ] **Backup Strategy**: Vector store and cache persistence needs backup/recovery.
- [ ] **Scaling**: Design for horizontal scaling (currently single-instance).

## 📈 User Experience

### API Design
- [ ] **RESTful Compliance**: Some endpoints don't follow REST conventions.
- [ ] **API Documentation**: Add OpenAPI/Swagger documentation.
- [ ] **Response Consistency**: Standardize error response formats across all endpoints.

### Chat Features
- [ ] **Conversation History**: Persistent chat history with search.
- [ ] **Multi-User Support**: Currently single-user. Add user isolation.
- [ ] **Real-time Updates**: WebSocket support for live updates.

## 🔍 Code Analysis Findings

### Dependencies
- [ ] **Unused Dependencies**: Audit package.json for unused packages (e.g., jspdf, html2canvas may not be used).
- [ ] **Version Pinning**: Use exact versions for production dependencies to avoid breaking changes.
- [ ] **Bundle Size**: Analyze and optimize bundle size for faster startup.

### Performance Bottlenecks
- [ ] **Synchronous Operations**: Some file I/O operations are synchronous. Convert to async.
- [ ] **Memory Usage**: Vector store loads all embeddings into memory. Consider disk-based alternatives.
- [ ] **CPU Intensive Tasks**: Embedding generation blocks event loop. Move to worker threads.

## 🎯 Priority Matrix

### High Priority (Fix Immediately)
- Security vulnerabilities (input validation, auth)
- Error handling improvements
- Basic testing setup
- Structured logging

### Medium Priority (Next Sprint)
- Performance optimizations
- Code quality improvements
- Monitoring setup
- API documentation

### Low Priority (Future Releases)
- Advanced features (multi-modal, fine-tuning)
- Scaling improvements
- DevOps enhancements

## 📋 Implementation Notes

- Start with security fixes before adding new features
- Implement tests alongside new code
- Use feature flags for gradual rollouts
- Document all API changes
- Consider backward compatibility for existing integrations

---

*Last updated: September 26, 2026*
*Generated from codebase analysis*</content>
<filePath">c:\Users\luann\Documents\GitHub\chronokairo_rag\TODO.md
