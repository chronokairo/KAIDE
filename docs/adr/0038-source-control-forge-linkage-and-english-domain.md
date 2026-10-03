# ADR-0038: Source Control Domain, Dual-Forge Linkage (GitHub & GitLab), and Pure-English Domain Transition

## Status

**Accepted** (2026-10-03)

## Context

Following [ADR-0028](0028-empresa-virtual-de-agentes-control-plane.md), [ADR-0036](0036-conexao-oficial-supabase-prod-e-eliminacao-de-mocks.md), and [ADR-0037](0037-implementacao-job-finance-reconcile-e-controladoria.md), the ChronoKairo Virtual Agent Company operates strictly under hexagonal architecture (Ports & Adapters) and the **AI → AI → AI → HUMAN** governance model.

To ensure that autonomous software engineering workflows remain verifiable and auditable:

1. **Forge Linkage**: Backlog synchronization (`coder.sync_sprint`) cannot rely on opinions or unverified agent claims. Backlog status transitions must cite immutable git branches, conventional commits, pull requests, and merge requests.
2. **Dual-Forge Architecture**: ChronoKairo mirrors its repositories across both GitHub (`https://github.com/chronokairo/ai.git`) and GitLab (`https://gitlab.com/chronokairo/ai.git`). Both remotes must be unified behind a clean secondary driven port and authenticated CLI adapters (`gh` and `glab`), preventing third-party SDK lock-in and avoiding shell injection vulnerabilities.
3. **Human Gate on Scope Baseline**: Backlog status writes to `project_tasks.column_status` must never occur autonomously. The AI Coder proposes status alignments held behind a `scope_baseline` Human Approval Gate, and database mutations occur strictly upon formal approval by the Human Director.
4. **5 Enterprise Jobs**: The remaining real-data jobs identified across production tables in Supabase (`project_tasks`, `projects`, `legal_cases`, `contracts`, `ai_conversations`, `ai_messages`) must be fully wired into the Supabase Control Plane.
5. **Pure-English Codebase**: All domain models, application use cases, repository ports, docstrings, and control plane logs must adhere to pure English.

## Decision

1. **Pure Domain & Secondary Port**:
   - `src/domain/source-control.ts`: Pure domain entities (`ForgeBranch`, `ForgeChangeRequest`, `ForgeCommit`, `ConventionalCommit`, `ForgeAuthStatus`, `ForgeActivity`, `TaskForgeEvidence`, `ForgeLinkageReport`). Decoupled from any runtime or I/O.
   - `src/application/ports/source-control-port.ts`: Driven port declaring contracts for authentication status, branches, change requests, commits, and multi-forge activity aggregation.

2. **Dual-Forge CLI Adapter**:
   - `src/infrastructure/git/gh-glab-source-control.ts`: Secondary adapter executing authenticated `gh` and `glab` CLI commands scoped to the `chronokairo` organization and group. Commands use array-based parameter execution (`execFile`) to prevent shell injection, enforce timeouts, and gracefully emit warnings if a forge remote is temporarily unreachable.

3. **Implementation of the 5 Enterprise Agent Jobs**:
   - **`coder.sync_sprint` (`ExecuteCoderSprintSyncUseCase`)**: Scans `project_tasks`, queries live GitHub/GitLab forge remotes, extracts backlog codes (`SECP-*`, `AUDIO-ASO-*`, `TSK-*`), binds branches/commits/PRs, and formulates status alignment proposals (`In Progress` -> `In Review` on open PR; `In Review` -> `Done` on merged PR; `To Do` -> `In Progress` on active branches/commits).
   - **`product.spec_milestones` (`ExecuteProductMilestoneSpecUseCase`)**: Compiles formal milestone specifications with Gherkin acceptance criteria formatted as versionable YAML, strictly derived from persisted backlog tasks.
   - **`legal.audit_case` (`ExecuteLegalCaseAuditUseCase`)**: Cross-references official legal proceedings (`legal_cases`) and active contracts (`contracts`) to construct multidimensional evidence matrices and software authorship defenses.
   - **`legal.review_contracts` (`ExecuteLegalContractReviewUseCase`)**: Verifies contract draft notes against mandatory statutory clauses and signing authority, blocking unsigned or non-compliant instruments.
   - **`support.triage_history` (`ExecuteSupportTriageUseCase`)**: Analyzes conversation histories (`ai_conversations`, `ai_messages`), groups recurrent question signatures, and synthesizes draft FAQ entries for human editorial review.

4. **Human Gate & Scope Baseline Atomic Write-Back**:
   - In `SupabaseCompanyControlPlaneAdapter`, proposals from `coder.sync_sprint` are stored under `pendingSprintSync` indexed by `approvalId`.
   - When the Director executes `approveJob(approvalId)`, the Control Plane iterates through the approved proposals and atomically updates `project_tasks.column_status` in Supabase production, logging a verified audit trail in `audit_logs`.
   - When `rejectJob(approvalId)` is invoked, proposals are safely discarded with zero database mutations.

5. **Codebase-Wide Pure-English Standard**:
   - Engineering, Support, Legal, Finance, and Source Control layers rewritten in pure English across all docstrings, comments, error messages, and control plane telemetry.

## Consequences

- Sprint status updates are grounded in cryptographic Git commit hashes and pull/merge request numbers.
- Zero mock or synthetic data in production paths: all operations execute directly against official Supabase production and real forge remotes.
- Backlog board integrity is guarded by the Human Director approval gate.
