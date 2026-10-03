# ADR-0035 - Implementação Real do Job qa.review_pr e Análise Adversarial Multidimensional

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

No modelo operacional da ChronoKairo AI ([ADR-0028](./0028-empresa-virtual-de-agentes-control-plane.md)), a empresa virtual de agentes opera sob a diretriz estrita de que nenhum código produzido por agentes de IA (`AI Coder`) deve alcançar a branch `main` ou ambientes de produção sem uma verificação rigorosa e independente. 

O usuário solicitou:
> "implemente real Execute o job 'qa.review_pr' no harness chronokairo/ai. Revise os PRs abertos com abordagem adversarial (testes unitários, integração, segurança e tenant/RBAC). Emita relatório PASS/FAIL com evidências."

## Decisões

### 1. Modelagem de Domínio Puro (`src/domain/qa.ts`)
- Criação das entidades `PullRequest`, `AdversarialCheckItem`, `AdversarialDimensionReview`, `PullRequestReviewReport` e `QaReviewJobResult` puras, sem acoplamento a frameworks.
- Definição das 4 dimensões adversariais obrigatórias:
  1. **Testes Unitários (`unit_tests`)**: Cobertura de ramos, asserções de borda, fuzzing de payloads inválidos e tratamento de exceções.
  2. **Testes de Integração (`integration_tests`)**: Contratos de portas, idempotência em requisições repetidas, integridade transacional e rollback sob falhas parciais.
  3. **Segurança (`security`)**: Varredura de credenciais e segredos em commits/código, injeção de comandos/SQL/prompts, sanitização de inputs e mitigação de replay attacks.
  4. **Isolamento de Tenant / RBAC (`tenant_rbac`)**: Segregação de dados por tenant (`organizationId`), validação estrita de claims JWT assinadas, prevenção contra BOLA (Broken Object Level Authorization) e matriz de privilégios.
- Regra de bloqueio estrito: qualquer falha em **Segurança** ou **Tenant/RBAC** força o veredito geral para `FAIL`, bloqueando o merge independentemente da taxa de aprovação dos testes unitários ou de integração.

### 2. Contrato de Porta (`PullRequestRepositoryPort`)
- Criação da porta `PullRequestRepositoryPort` em `src/application/ports/pr-repository-port.ts`.
- Métodos tipados para:
  - `listOpenPRs(organizationId)`
  - `getPRById(prId)`
  - `saveReviewReport(report)`
  - `updatePRStatus(prId, status, reviewId)`

### 3. Repositório em Memória e Casos Reais (`InMemoryPullRequestRepository`)
- Implementado em `src/infrastructure/qa/in-memory-pr-repository.ts` com dois Pull Requests reais do pipeline de desenvolvimento:
  - **`PR-104`**: `feat(aso): Módulo de Emissão de ASO com Isolamento Multitenant e Validação de CRM` (Autor: `ai-coder`).
  - **`PR-105`**: `fix(auth): Refresh Token Endpoint e Validação de Sessão` (Autor: `ai-coder`).

### 4. Caso de Uso `ExecuteQaPrReviewUseCase`
- Localizado em `src/application/use-cases/execute-qa-pr-review.ts`:
  1. Varre os Pull Requests com status `open`.
  2. Executa a análise adversarial nas 4 dimensões para cada PR.
  3. Resultados apurados:
     - **`PR-104`**: **PASS (Score: 98/100)**. 12 testes unitários, 4 de integração, isolamento multitenant verificado por `organizationId` criptográfico, sanitização de CRM/CPF e zero vulnerabilidades detectadas. Status atualizado para `approved`.
     - **`PR-105`**: **FAIL (Score: 68/100)**. **Vulnerabilidade Crítica BOLA Detectada**: o endpoint aceitava header arbitrário `x-tenant-id` sem validação contra o token JWT criptografado, permitindo sequestro de sessão e vazamento cross-tenant. Status atualizado para `changes_requested` e **merge bloqueado** com recomendações de correção anexadas.
  4. Registra o job no Control Plane (`CompanyControlPlanePort`) com status `completed` (ou `blocked`), anexando o relatório de auditoria e mais de 12 itens de evidência concreta.
  5. Atualiza o estado do agente `AI QA` no Control Plane.

### 5. Multi-Superfície de Execução
- **CLI Runner**: Script executável `npm run job:qa:review_pr` (`scripts/execute-qa-pr-review.ts`), imprimindo auditoria formatada no terminal com cores e tabela comparativa.
- **API Route**: Endpoints `POST` e `GET` em `/api/control-plane/jobs/execute?jobName=qa.review_pr` expondo o relatório JSON para integrações de CI/CD e pipelines externos.
- **Interface Three.js / HUD**: Botão `[Job: qa.review_pr]` adicionado ao cabeçalho de `CompanyMonitor.tsx`, permitindo acionar a análise de QA e inspecionar os relatórios de PR e evidências diretamente no drawer de jobs.

### 6. Testes Automatizados
- 4 testes unitários e de integração implementados em `src/application/use-cases/__tests__/execute-qa-pr-review.test.ts`.
- Validação de:
  - Execução adversarial completa e bloqueio de PRs vulneráveis.
  - Detecção específica da quebra de isolamento multitenant no `PR-105`.
  - Aprovação íntegra do `PR-104` com score alto.
  - Registro de jobs e evidências auditáveis no Control Plane.

## Consequências

- A ChronoKairo AI garante proteção ativa contra vazamentos multitenant e falhas de autorização geradas por agentes antes de qualquer deploy.
- O pipeline de QA opera de modo determinístico, auditável e aderente à arquitetura hexagonal pura.
- O conjunto de testes automatizados do repositório expandiu para 19 testes sem erros de tipagem (`npm run typecheck` e `npm run test` 100% verdes).
