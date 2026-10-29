# ADR-0038: Source Control Domain, Dual-Forge Linkage (GitHub & GitLab), Projects v2 Scope Baseline, and Pure-English Domain Transition

## Status

**Accepted** (2026-10-03)

## Context

Following [ADR-0028](0028-empresa-virtual-de-agentes-control-plane.md), [ADR-0036](0036-conexao-oficial-supabase-prod-e-eliminacao-de-mocks.md), and [ADR-0037](0037-implementacao-job-finance-reconcile-e-controladoria.md), the Chronokairo Virtual Agent Company operates strictly under pure hexagonal architecture (Ports & Adapters) and the **AI → AI → AI → HUMAN** governance model.

To ensure that autonomous software engineering, customer operations, and commercial outreach remain auditable, verifiable, and free of synthetic hallucinations:

1. **Elimination of Mock and In-Memory Adapters**: Legacy in-memory adapters (such as `InMemoryPullRequestRepository`) and monolithic merged adapters (`gh-glab-source-control.ts`) violate the zero-mock policy. All production paths must interact with live forge CLIs and official Supabase production tables.
2. **Projects v2 Scope Baseline Decision**: Backlog synchronization (`coder.sync_sprint`) cannot rely on opinions or unverified agent claims. All sprint status transitions (`project_tasks.column_status`) must cite immutable git branches, conventional commits, pull requests, and merge requests. Crucially, mutations to `project_tasks.column_status` must **never** occur autonomously; the AI Coder formulates alignment proposals held behind a `scope_baseline` Human Approval Gate, and database mutations occur strictly upon formal approval by the Human Technical Director.
3. **Decoupled Dual-Forge Architecture**: Chronokairo mirrors its repositories across both GitHub (`https://github.com/chronokairo/ai.git`) and GitLab (`https://gitlab.com/chronokairo/ai.git`). Both remotes must be decoupled into native domain models and secondary ports (`GitHubPort`, `GitLabPort`), backed by authenticated CLI adapters (`gh` and `glab`) operating through a shared, injection-safe `CliRunnerPort`.
4. **Real Support Operations**: Automated support triage (`support.triage_history`) must query official Supabase tables `support_tickets` and `support_incidents` in addition to conversation histories (`ai_conversations`, `ai_messages`).
5. **Real Outbound Communication via Resend**: Inbound and daily commercial lead workflows (`commercial.daily`, `commercial.followup`) require real email delivery upon human approval. Outbound emails are sent via the official `resend` SDK, telemetry is tracked with dedicated `JobEventType`s (`email.sent`, `email.synced`, `email.bounced`), and a 24-hour sync window is maintained.
6. **Pure-English Domain Standard**: All enterprise domains, ports, use cases, docstrings, and control plane telemetry must adhere strictly to pure English, eliminating bilingual union types and synthetic Portuguese placeholders.

## Decision

### 1. Pure Domain & Secondary Port Architecture
- **Shared Pure Domain (`src/domain/forge.ts`)**: Encapsulates common forge abstractions, backlog task code extraction (`extractTaskCodes`, filtering reserved codes), and conventional commit parsing (`parseConventionalCommit`, `ConventionalCommit`).
- **Native GitHub Domain & Port (`src/domain/github.ts`, `src/application/ports/github-port.ts`)**: Declares native pull requests, branches, commits, status checks, and review submissions.
- **Native GitLab Domain & Port (`src/domain/gitlab.ts`, `src/application/ports/gitlab-port.ts`)**: Declares native merge requests, branches, commits, changes, pipelines, and note submissions.
- **Process Execution Port (`src/application/ports/cli-runner-port.ts`)**: Declares `CliRunnerPort` and `CliExecutionResult`, implemented by `NodeCliRunner` (`src/infrastructure/cli/node-cli-runner.ts`) with array-based arguments, strict timeouts, and shell injection prevention (`shell: false`).

### 2. Secondary Forge CLI Adapters
- **`GhCliGitHubAdapter` (`src/infrastructure/git/gh-cli-github-adapter.ts`)**: Connects to the authenticated `gh` CLI. Implements real reads for open PRs, branches, commits, changed files, and status checks, as well as authorized review writes (`gh pr review`).
- **`GlabCliGitLabAdapter` (`src/infrastructure/git/glab-cli-gitlab-adapter.ts`)**: Connects to the authenticated `glab` CLI. Implements real reads for MRs, branches, commits, diff changes, and CI pipelines, as well as authorized note writes (`glab mr note`).
- **`ForgeSourceControlAdapter` (`src/infrastructure/git/forge-source-control-adapter.ts`)**: Implements `SourceControlPort` by composing `GitHubPort` and `GitLabPort`, safely aggregating cross-forge activity via `safeFetch` (`src/infrastructure/git/forge-utils.ts`).
- **`ForgePullRequestRepository` (`src/infrastructure/qa/forge-pull-request-repository.ts`)**: Replaces the deleted `InMemoryPullRequestRepository`. Queries open pull requests directly from the GitHub forge, records adversarial QA reviews in Supabase `audit_logs`, and synchronizes status with the forge.

### 3. Projects v2 Scope Baseline & Human Gate
- In `ExecuteCoderSprintSyncUseCase`, every backlog item in `project_tasks` is cross-referenced with forge branches, commits, and pull requests.
- Proposed transitions are recorded as `TaskSyncProposal`s held in `SupabaseCompanyControlPlaneAdapter` under `pendingSprintSync`.
- When the Director executes `approveJob(approvalId)`, the Control Plane iterates through approved proposals and atomically updates `project_tasks.column_status` in Supabase production, logging an immutable audit record in `audit_logs`.
- If `rejectJob(approvalId)` is invoked, proposals are safely discarded with zero database mutations.

### 4. Real Support Operations (`support.triage_history`)
- `SupabaseSupportRepository` queries real production tables `support_tickets` and `support_incidents` in addition to `ai_conversations` and `ai_messages`.
- `ExecuteSupportTriageUseCase` consolidates tickets, active incidents, and recurring conversation patterns into pure English `SupportTriageReport`s with proposed FAQ knowledge base entries.

### 5. Resend SDK & Real Outbound Dispatch
- Integrated official SDK `resend` with backend-only `RESEND_API_KEY` configuration; no embedded credential or API key fallback.
- Defined `JobEventType` in `src/domain/company.ts` with `'email.sent'`, `'email.synced'`, `'email.bounced'`.
- Implemented `ResendEmailService` (`src/infrastructure/email/resend-email-service.ts`) with a 24-hour sync window and event logging to `cp_job_events` (falling back to `audit_logs`).
- In `SupabaseCompanyControlPlaneAdapter`, approving an `outbound_contact` Human Gate triggers real email dispatch through `ResendEmailService`.

### 6. Commercial Daily Due Diligence (`commercial.daily`)
- Implemented `ExecuteCommercialDailyUseCase` (`src/application/use-cases/execute-commercial-daily.ts`) and script `scripts/execute-commercial-daily.ts` (`npm run job:commercial:daily`).
- Scans the 13 qualified enterprise leads in Supabase production (`leads`), conducts sector due diligence analysis, enriches CRM approach notes, and prepares consultative outreach drafts held behind an `outbound_contact` Human Gate.

### 7. Pure-English Domain Transition
- All domain entities (`src/domain/legal.ts`, `src/domain/support.ts`, `src/domain/engineering.ts`, `src/domain/forge.ts`) and use cases were refactored to pure English, removing Portuguese union types and fabricated checks.

## Consequences

- Zero mock or in-memory repositories remain in the codebase: all operations execute directly against official Supabase production and real forge remotes (`gh` / `glab`).
- Backlog board state is strictly grounded in cryptographic Git commit hashes and pull/merge requests.
- External communications and database scope baselines are guarded by Human Approval Gates.
- Clean separation of concerns allows GitHub and GitLab capabilities to evolve independently without violating hexagonal boundaries.
