import { describe, it, expect, vi } from 'vitest';
import { ExecuteCoderSprintSyncUseCase } from '../execute-coder-sprint-sync';
import { ExecuteProductMilestoneSpecUseCase } from '../execute-product-milestone-spec';
import { ExecuteSupportTriageUseCase } from '../execute-support-triage';
import { ExecuteLegalCaseAuditUseCase } from '../execute-legal-case-audit';
import { ExecuteLegalContractReviewUseCase } from '../execute-legal-contract-review';
import { EngineeringRepositoryPort } from '@/application/ports/engineering-repository-port';
import { SupportRepositoryPort } from '@/application/ports/support-repository-port';
import { LegalRepositoryPort } from '@/application/ports/legal-repository-port';
import { SourceControlPort } from '@/application/ports/source-control-port';
import { CompanyControlPlanePort } from '@/application/ports/company-control-plane-port';
import { ProjectTask, Project, TaskSyncProposal } from '@/domain/engineering';
import { ConversationThread } from '@/domain/support';
import { LegalCase, LegalContract } from '@/domain/legal';
import { ForgeActivity } from '@/domain/source-control';
import { JobEntity } from '@/domain/company';

describe('Enterprise AI Agent Jobs (ADR-0038)', () => {
  const sampleTasks: ProjectTask[] = [
    {
      id: 'task-01',
      code: 'SECP-01',
      title: 'Implement authentication RBAC middleware',
      columnStatus: 'In Progress',
      priority: 'HIGH',
      assignedUserId: 'user-01',
    },
    {
      id: 'task-02',
      code: 'AUDIO-ASO-01',
      title: 'Occupational health medical examination report generator',
      columnStatus: 'In Progress',
      priority: 'URGENT',
      assignedUserId: 'user-02',
    },
    {
      id: 'task-03',
      code: 'TSK-4EC62792',
      title: 'Legacy database index optimization',
      columnStatus: 'To Do',
      priority: 'MED',
    },
  ];

  const sampleProjects: Project[] = [
    {
      id: 'proj-01',
      code: 'PRJ-CHRONO',
      name: 'ChronoKairo AI Platform',
      status: 'Active',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    },
  ];

  const sampleForgeActivity: ForgeActivity = {
    providers: ['github', 'gitlab'],
    branches: [
      {
        provider: 'github',
        name: 'feature/secp-01-auth',
        headSha: 'a1b2c3d',
        taskCodes: ['SECP-01'],
        isDefault: false,
      },
      {
        provider: 'gitlab',
        name: 'feature/tsk-4ec62792-opt',
        headSha: 'e5f6a7b',
        taskCodes: ['TSK-4EC62792'],
        isDefault: false,
      },
    ],
    changeRequests: [
      {
        provider: 'github',
        id: 'gh-101',
        number: 101,
        title: 'feat(auth): SECP-01 RBAC verification',
        state: 'open',
        headBranch: 'feature/secp-01-auth',
        baseBranch: 'main',
        author: 'coder-bot',
        isDraft: false,
        reviewVerdict: 'pending',
        taskCodes: ['SECP-01'],
        url: 'https://github.com/chronokairo/ai/pull/101',
        updatedAt: '2026-10-03T10:00:00Z',
      },
    ],
    commits: [
      {
        provider: 'github',
        sha: 'a1b2c3d4e5f6',
        subject: 'feat(auth): SECP-01 implement tenant check',
        author: 'Luan Nery',
        committedAt: '2026-10-03T09:00:00Z',
        taskCodes: ['SECP-01'],
      },
      {
        provider: 'gitlab',
        sha: 'e5f6a7b8c9d0',
        subject: 'perf(db): TSK-4EC62792 add composite index',
        author: 'Luan Nery',
        committedAt: '2026-10-02T15:00:00Z',
        taskCodes: ['TSK-4EC62792'],
      },
    ],
    authStatus: [
      { provider: 'github', authenticated: true, account: 'chronokairo-bot', host: 'github.com' },
      { provider: 'gitlab', authenticated: true, account: 'chronokairo-bot', host: 'gitlab.com' },
    ],
    taskEvidence: {
      'SECP-01': {
        taskCode: 'SECP-01',
        branches: ['github:feature/secp-01-auth'],
        changeRequests: [
          {
            provider: 'github',
            id: 'gh-101',
            number: 101,
            title: 'feat(auth): SECP-01 RBAC verification',
            state: 'open',
            headBranch: 'feature/secp-01-auth',
            baseBranch: 'main',
            author: 'coder-bot',
            isDraft: false,
            reviewVerdict: 'pending',
            taskCodes: ['SECP-01'],
            url: 'https://github.com/chronokairo/ai/pull/101',
            updatedAt: '2026-10-03T10:00:00Z',
          },
        ],
        commits: [
          {
            provider: 'github',
            sha: 'a1b2c3d4e5f6',
            subject: 'feat(auth): SECP-01 implement tenant check',
            author: 'Luan Nery',
            committedAt: '2026-10-03T09:00:00Z',
            taskCodes: ['SECP-01'],
          },
        ],
        conventionalCommits: [
          {
            type: 'feat',
            scope: 'auth',
            subject: 'SECP-01 implement tenant check',
            breaking: false,
            references: [],
            raw: 'feat(auth): SECP-01 implement tenant check',
          },
        ],
        isLinked: true,
      },
      'TSK-4EC62792': {
        taskCode: 'TSK-4EC62792',
        branches: ['gitlab:feature/tsk-4ec62792-opt'],
        changeRequests: [],
        commits: [
          {
            provider: 'gitlab',
            sha: 'e5f6a7b8c9d0',
            subject: 'perf(db): TSK-4EC62792 add composite index',
            author: 'Luan Nery',
            committedAt: '2026-10-02T15:00:00Z',
            taskCodes: ['TSK-4EC62792'],
          },
        ],
        conventionalCommits: [
          {
            type: 'perf',
            scope: 'db',
            subject: 'TSK-4EC62792 add composite index',
            breaking: false,
            references: [],
            raw: 'perf(db): TSK-4EC62792 add composite index',
          },
        ],
        isLinked: true,
      },
    },
    collectedAt: '2026-10-03T14:00:00Z',
    warnings: [],
  };

  const createMockControlPlane = (): CompanyControlPlanePort & {
    submittedJobs: JobEntity[];
    pendingSprintSync: Map<string, TaskSyncProposal[]>;
  } => {
    const submittedJobs: JobEntity[] = [];
    const pendingSprintSync = new Map<string, TaskSyncProposal[]>();
    return {
      submittedJobs,
      pendingSprintSync,
      getSnapshot: vi.fn().mockResolvedValue({ agents: [], jobs: submittedJobs, telemetry: {} }),
      submitJob: vi.fn().mockImplementation(async (job: JobEntity) => {
        submittedJobs.push(job);
      }),
      registerPendingSprintSync: vi.fn().mockImplementation((approvalId: string, proposals: TaskSyncProposal[]) => {
        pendingSprintSync.set(approvalId, proposals);
      }),
      approveJob: vi.fn(),
      rejectJob: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };
  };

  it('coder.sync_sprint: links backlog tasks to real GitHub and GitLab forge evidence', async () => {
    const mockEngRepo: EngineeringRepositoryPort = {
      listTasks: vi.fn().mockResolvedValue(sampleTasks),
      listProjects: vi.fn().mockResolvedValue(sampleProjects),
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
    };

    const mockSourceControl: SourceControlPort = {
      getAuthStatus: vi.fn().mockResolvedValue(sampleForgeActivity.authStatus),
      listBranches: vi.fn().mockResolvedValue(sampleForgeActivity.branches),
      listChangeRequests: vi.fn().mockResolvedValue(sampleForgeActivity.changeRequests),
      listCommits: vi.fn().mockResolvedValue(sampleForgeActivity.commits),
      collectActivity: vi.fn().mockResolvedValue(sampleForgeActivity),
    };

    const mockControlPlane = createMockControlPlane();
    const useCase = new ExecuteCoderSprintSyncUseCase(mockEngRepo, mockControlPlane, mockSourceControl);

    const result = await useCase.execute();

    expect(result.stage).toBe('coder');
    expect(result.requiresApproval).toBe(true);
    expect(result.report.tasksScannedCount).toBe(3);

    // SECP-01 has an open PR -> proposed 'In Review'
    const secpProposal = result.report.proposals.find((p) => p.code === 'SECP-01');
    expect(secpProposal).toBeDefined();
    expect(secpProposal?.currentStatus).toBe('In Progress');
    expect(secpProposal?.proposedStatus).toBe('In Review');
    expect(secpProposal?.linkedChangeRequests?.length).toBeGreaterThan(0);

    // TSK-4EC62792 has active commits/branch -> proposed 'In Progress'
    const tskProposal = result.report.proposals.find((p) => p.code === 'TSK-4EC62792');
    expect(tskProposal).toBeDefined();
    expect(tskProposal?.currentStatus).toBe('To Do');
    expect(tskProposal?.proposedStatus).toBe('In Progress');

    // Job submitted to control plane with scope_baseline approval gate
    expect(mockControlPlane.submittedJobs.length).toBe(1);
    const submitted = mockControlPlane.submittedJobs[0];
    expect(submitted.status).toBe('waiting_approval');
    expect(submitted.approvalGate?.type).toBe('scope_baseline');
  });

  it('product.spec_milestones: generates YAML milestone spec with Gherkin acceptance criteria', async () => {
    const mockEngRepo: EngineeringRepositoryPort = {
      listTasks: vi.fn().mockResolvedValue(sampleTasks),
      listProjects: vi.fn().mockResolvedValue(sampleProjects),
      updateTaskStatus: vi.fn(),
    };

    const mockControlPlane = createMockControlPlane();
    const useCase = new ExecuteProductMilestoneSpecUseCase(mockEngRepo, mockControlPlane);

    const result = await useCase.execute();

    expect(result.stage).toBe('product');
    expect(result.requiresApproval).toBe(false);
    expect(result.report.specSections.length).toBeGreaterThan(0);
    expect(result.report.yaml).toContain('project:');
    expect(result.report.yaml).toContain('PRJ-CHRONO');
    expect(result.report.yaml).toContain('acceptanceCriteria:');
  });

  it('support.triage_history: categorizes support conversations and synthesizes FAQ drafts', async () => {
    const sampleConversations: ConversationThread[] = [
      {
        id: 'conv-01',
        title: 'Como redefinir permissão de acesso no RBAC?',
        status: 'active',
        createdAt: '2026-10-01T10:00:00Z',
        messages: [
          {
            id: 'msg-01',
            conversationId: 'conv-01',
            role: 'user',
            content: 'Não consigo acessar o módulo financeiro erro 403 perfil negado',
            createdAt: '2026-10-01T10:00:00Z',
          },
          {
            id: 'msg-02',
            conversationId: 'conv-01',
            role: 'assistant',
            content: 'Seu usuário precisa do papel finance_viewer atribuído pelo administrador.',
            createdAt: '2026-10-01T10:01:00Z',
          },
        ],
      },
      {
        id: 'conv-02',
        title: 'Erro 403 ao acessar faturamento',
        status: 'active',
        createdAt: '2026-10-02T11:00:00Z',
        messages: [
          {
            id: 'msg-03',
            conversationId: 'conv-02',
            role: 'user',
            content: 'Não consigo acessar o módulo financeiro erro 403 perfil negado',
            createdAt: '2026-10-02T11:00:00Z',
          },
        ],
      },
    ];

    const mockSupportRepo: SupportRepositoryPort = {
      listConversations: vi.fn().mockResolvedValue(sampleConversations),
      saveFaqEntry: vi.fn().mockResolvedValue(undefined),
    };

    const mockControlPlane = createMockControlPlane();
    const useCase = new ExecuteSupportTriageUseCase(mockSupportRepo, mockControlPlane);

    const result = await useCase.execute(2);

    expect(result.stage).toBe('support');
    expect(result.report.conversationsScannedCount).toBe(2);
    expect(result.report.messagesScannedCount).toBe(2);
    expect(result.report.recurringIssues.length).toBeGreaterThan(0);
    expect(result.report.faqs.length).toBeGreaterThan(0);
    expect(result.report.faqs[0].status).toBe('proposed');
  });

  it('legal.audit_case: generates technical evidence matrix and assesses software authorship', async () => {
    const sampleCases: LegalCase[] = [
      {
        id: 'case-01',
        caseNumber: '00215674/2026-A01',
        kind: 'PoliceReport',
        authority: '22º DIP / Polícia Civil AM',
        status: 'Open',
        narrative: 'Alegação de apropriação indevida de código-fonte e plataforma educacional.',
        source: 'boletim_ocorrencia.pdf',
        firstRecordedAt: '2026-02-01T12:00:00Z',
      },
    ];

    const sampleContracts: LegalContract[] = [
      {
        id: 'ctr-01',
        contractNumber: 'CTR-CIESA-001',
        title: 'Prestação de Serviços de Desenvolvimento de Software',
        status: 'Active',
        totalValueBrl: 3500,
      },
    ];

    const mockLegalRepo: LegalRepositoryPort = {
      listCases: vi.fn().mockResolvedValue(sampleCases),
      listContracts: vi.fn().mockResolvedValue(sampleContracts),
    };

    const mockControlPlane = createMockControlPlane();
    const useCase = new ExecuteLegalCaseAuditUseCase(mockLegalRepo, mockControlPlane);

    const result = await useCase.execute();

    expect(result.stage).toBe('analyst');
    expect(result.casesScannedCount).toBe(1);
    expect(result.reports[0].evidence.length).toBeGreaterThan(0);
    expect(result.reports[0].findings.length).toBe(5);
    expect(result.reports[0].verdict).toBe('defensible');
  });

  it('legal.review_contracts: flags missing clauses and unsigned draft instruments', async () => {
    const sampleContracts: LegalContract[] = [
      {
        id: 'ctr-draft-01',
        contractNumber: 'MINUTA-CIESA-VLM-2025-10',
        title: 'Minuta de Desenvolvimento CIESA',
        status: 'Draft',
        totalValueBrl: 15000,
        structuredNotes: {
          signatureStatus: 'Não assinado',
          reviewFlags: ['Anexo I não fornecido', 'Sem testemunhas qualificadas'],
        },
      },
    ];

    const mockLegalRepo: LegalRepositoryPort = {
      listCases: vi.fn().mockResolvedValue([]),
      listContracts: vi.fn().mockResolvedValue(sampleContracts),
    };

    const mockControlPlane = createMockControlPlane();
    const useCase = new ExecuteLegalContractReviewUseCase(mockLegalRepo, mockControlPlane);

    const result = await useCase.execute(false);

    expect(result.stage).toBe('analyst');
    expect(result.contractsScannedCount).toBe(1);
    expect(result.reports[0].verdict).toBe('bloqueado');
    expect(result.reports[0].blockingIssues.length).toBeGreaterThan(0);
  });
});
