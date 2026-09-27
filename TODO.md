# TODO.md - Athena Server Improvements

## P0 — Coding agent de mercado (fundação, dos changelogs em `docs/market/changelogs/`)

Concluído (implementado no núcleo `ckc` / shell / Next; débitos de integração ficam nas seções abaixo):

- [x] Loop do agente com tool calling (chat → tools → resultado → continuação) — `src-tauri/core/src/agent/agent_loop.rs`, `tool_registry.rs`
- [x] Ferramentas básicas de coding: fs, find/replace, shell, git, patch, busca de arquivos, web — `src-tauri/core/src/tools/`
- [x] Política de execução e sandbox com aprovação (`on_approval`) — `tools/exec_policy.rs`, `tools/sandbox.rs`, `agent/loop.rs`
- [x] Streaming de resposta (deltas de texto e tool) — `llm/client.rs`, hooks `on_text_delta`/`on_tool_call_delta`
- [x] Multi-providers de LLM com roteamento e seleção de modelo — `providers/catalog.rs`, `llm/router.rs`, `llm/provider_chain.rs`, `llm/model_resolver.rs`
- [x] Sessões persistentes e retomada (transcript em disco com watermark) — `agent/state.rs`, `app_server/runtime_api.rs`
- [x] Compactação de contexto em camadas (layer1/layer2 + resumo persistido) — `compressor/`, `agent/state.rs`
- [x] TUI interativa (composer, diff render, pager, busca, mouse SGR) — `ui/` (ADR-0027)
- [x] Cliente MCP (spawn stdio, initialize, list_tools) — `mcp/mod.rs`
- [x] Subagentes e execução paralela — `agent/subagent.rs`
- [x] Memória de agente (curto prazo + log) — `memory/short_term.rs`, `memory/log.rs`
- [x] Skills — `skills/mod.rs`
- [x] Leitura de `AGENTS.md` como contexto do projeto — `llm/prompt.rs`, `repo/chrono_context.rs`
- [x] Hooks de runtime do agente (evento, delta, aprovação) — `agent/loop.rs` (`AgentHooks`)
- [x] Modo headless/app-server com eventos (SSE) — `app_server/runtime_api.rs`
- [x] Protocolo versionado com event log — `protocol/mod.rs`, `protocol/event_log.rs`
- [x] Preview/aplicação de patch e diff no desktop — `tools/patch.rs`, `ui/diff_render.rs`, `src/modules/ai/components/PatchPreviewPanel.tsx`
- [x] Shell desktop com streaming, interrupção e aprovação via IPC — `useHarnessAgent.ts`, `interrupt_agent`, `resolve_approval`, `TerminalBottomPanel.tsx`

Pendente (P0 de mercado ainda não implementado):

- [x] Worktree por task e checkpoints/recuperação durável (padrão Codex/Claude Code/Cursor) — `src-tauri/core/src/tools/worktree.rs` (WorktreeManager: create/list/remove, branch `ck/task/<id>`, `.git/info/exclude` para metadados) + `src-tauri/core/src/agent/checkpoint.rs` (CheckpointStore: snapshot git + manifest `.chronokairo/checkpoints.json` atômico, restore pós-crash, ids de correlação sessão/turno/event-seq); tools `worktree`/`checkpoint` no ToolRegistry; 6 métodos novos no runtime_api (`create_task_worktree`, `list_task_worktrees`, `remove_task_worktree`, `create_checkpoint`, `restore_checkpoint`, `list_checkpoints`); testes em `src-tauri/core/tests/p0_worktree.rs`
- [x] Tela canônica de task supervision (timeline, árvore de agentes, approvals, terminal, checks, diff) — `src/modules/ai/components/TaskSupervisionScreen.tsx`: status derivado (`running/attention/failed/complete`), timeline de eventos, subagentes, checks, arquivos alterados, tokens, approvals inline (allow_once/allow_session/deny), diff/patch embutido e worktrees/checkpoints via runtime; nav `tasks` em NAV_GROUPS + case em `src/app/page.tsx`; cliente em `src/modules/dev/harness/agent.ts`
- [x] Distribuição e auto-update validados (NSIS/updater) — `src-tauri/tauri.conf.json`: targets nsis+appimage+deb, `createUpdaterArtifacts`, `plugins.updater` com pubkey real (keypair em `~/.chronokairo/keys/chronokairo-updater.key[.pub]`, privado fora do repo); casca: `tauri-plugin-updater`+`tauri-plugin-process`, comandos `check_for_updates`/`install_update` (`src-tauri/shell/src/lib.rs`); permissão `updater:default`. Débitos remanescentes registrados no ADR_LOG (cargo check Linux precisa libdbus-1-dev; build estático Tauri ainda incompatível com API routes)

## P1 — Coding agent de mercado (detalhe e fontes em `docs/market/TODO.md`)

Núcleo `ckc`:

- [ ] **A1** Classificador de risco no approval gate — risco da tool call avaliado por LLM (1 token), evidência persistente que sobreviva a compaction, aprovação invalidada ao ampliar permissões [Codex Guardian V2; Claude Code auto mode] — base: `AgentHooks.require_approval`, `tools/exec_policy.rs`
- [ ] **A2** Governança de subagentes — sem aninhamento por padrão, permissões próprias, allowlist de tools por subagente, caps de concorrência/spawns/WebSearch por sessão [OpenCode v1.18; Qwen 0.23.4; Claude Code 2.1.232] — base: `agent/subagent.rs`
- [ ] **A3** Compaction econômica — microcompactação preservando prompt-cache, resume por boundary de compaction, checkpoint no compaction, modelo dedicado configurável [Qwen 0.23.0; Codex 0.150/0.155; Zed `compaction_model`] — base: `compressor/`, `memory/short_term.rs`
- [ ] **A4** Cliente MCP 2026-07-28 — OAuth com refresh (RFC 9207/CIMD), tool search paginado + deferred loading, startup não bloqueante, `output_token_limit` por tool, resource templates, abort signals [Claude Code 2.1.274/2.1.283; Codex 0.147/0.152; Gemini CLI v0.60] — base: `mcp/mod.rs`
- [ ] **A5** Sandbox fail-closed — rede imposta em redirects/HTTP-WS contínuos com cancelamento na revogação, mascaramento de credenciais no egress (JWT/SigV4), regra "containment escape" [Codex 0.156/0.157; Claude Code 2.1.224] — base: `tools/sandbox.rs`, `tools/shell.rs`

Protocolo e multi-superfície:

- [ ] **B1** ACP como porta universal — expor o `ckc` como ACP server e consumir harnesses externos (Claude Code/Codex/goose) como backends orquestráveis; elicitação/question via ACP [Zed v1.12/v1.17; Goose ACP; Kiro Crew 0.7.0] — base: `mcp/server.rs`, `protocol/`
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

## P0 — Refatoração ChronoKairo AI

- [ ] Substituir o branding Athena pela identidade ChronoKairo AI.
- [ ] Decompor `src/App.tsx` em shell, chat, histórico, fontes, confirmações e resultados de ferramentas.
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
- [ ] **Health Checks**: Current health endpoint is basic. Add dependency checks (Ollama, TOTVS APIs, vector store).
- [ ] **Circuit Breaker**: Implement circuit breaker pattern for TOTVS API calls to prevent cascading failures.
- [ ] **Retry Logic**: Add exponential backoff for failed API calls and LLM requests.

## ⚡ Performance Issues

### Caching & Optimization
- [ ] **Cache Invalidation**: Current cache doesn't handle API data changes. Implement cache versioning or TTL-based invalidation.
- [ ] **Memory Leaks**: Vector store loads everything into memory. Consider streaming or pagination for large datasets.
- [ ] **Database Connection Pooling**: If using databases, implement connection pooling (currently uses lowdb which is file-based).
- [ ] **Embedding Optimization**: Ollama embeddings are synchronous. Consider batch processing or async queues.
- [ ] **Response Compression**: Already enabled but could be optimized for different content types.

### API Efficiency
- [ ] **N+1 Query Problem**: TOTVS client makes multiple sequential API calls. Implement parallel requests where possible.
- [ ] **Response Size**: Some API responses may be large. Add pagination and selective field retrieval.
- [ ] **Streaming Optimization**: Chat streaming works but could benefit from better backpressure handling.

## 🏗️ Architecture & Code Quality

### Code Structure
- [ ] **Layer Violations**: Some features import from other features directly, violating Feature-Sliced Design principles.
- [ ] **Circular Dependencies**: Check for circular imports between features (e.g., rag ↔ chat ↔ api-client).
- [ ] **Singleton Pattern Abuse**: TOTVSClient and other services use singletons, making testing difficult.
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
- [ ] **Fine-Tuning**: No mechanism for model fine-tuning on TOTVS domain data.

### MCP Integration
- [ ] **Tool Discovery**: MCP tools are static. Implement dynamic tool registration.
- [ ] **State Management**: MCP server doesn't persist conversation state.
- [ ] **Authentication**: MCP protocol doesn't handle authentication. Add API key validation.

### API Client
- [ ] **Request Deduplication**: Prevent duplicate API calls for same request.
- [ ] **Response Caching**: Beyond basic TTL, implement smart cache invalidation.
- [ ] **API Versioning**: No versioning strategy for TOTVS API changes.

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
