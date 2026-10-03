import { PullRequestRepositoryPort } from '@/application/ports/pr-repository-port';
import { PullRequest, PullRequestReviewReport } from '@/domain/qa';

export class InMemoryPullRequestRepository implements PullRequestRepositoryPort {
  private prs: PullRequest[] = [
    {
      id: 'PR-104',
      title: 'feat(aso): Módulo de Emissão de ASO com Isolamento Multitenant e Validação de CRM',
      branch: 'feature/aso-occupational-engine',
      baseBranch: 'main',
      author: 'AI Coder',
      changesSummary: 'Implementa caso de uso EmitAsoUseCase com validação de assinatura médica, hash SHA-256 e RBAC por organizationId.',
      filesChanged: [
        'src/domain/aso.ts',
        'src/application/use-cases/emit-aso.ts',
        'src/application/ports/aso-repository-port.ts',
        'src/infrastructure/http/aso-controller.ts',
        'src/application/use-cases/__tests__/emit-aso.test.ts',
      ],
      stage: 'qa',
      status: 'open',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'PR-105',
      title: 'fix(auth): Refresh Token Endpoint e Validação de Sessão',
      branch: 'fix/auth-session-rotation',
      baseBranch: 'main',
      author: 'AI Coder',
      changesSummary: 'Atualização do endpoint de renovação de sessão com suporte a rotação de tokens JWT e verificação de expiração.',
      filesChanged: [
        'src/app/api/auth/refresh/route.ts',
        'src/infrastructure/auth/token-service.ts',
        'src/domain/auth.ts',
      ],
      stage: 'qa',
      status: 'open',
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    },
  ];

  private reports: Map<string, PullRequestReviewReport> = new Map();

  async listOpenPullRequests(): Promise<PullRequest[]> {
    return this.prs.filter((pr) => pr.status === 'open' || pr.status === 'reviewing');
  }

  async getPullRequestById(id: string): Promise<PullRequest | null> {
    return this.prs.find((pr) => pr.id === id) || null;
  }

  async saveReviewReport(report: PullRequestReviewReport): Promise<void> {
    this.reports.set(report.prId, { ...report });
  }

  async getReports(): Promise<PullRequestReviewReport[]> {
    return Array.from(this.reports.values());
  }

  async updatePullRequestStatus(id: string, status: PullRequest['status']): Promise<void> {
    const pr = this.prs.find((p) => p.id === id);
    if (pr) {
      pr.status = status;
    }
  }

  // Helper for tests/resets
  getAllReports(): PullRequestReviewReport[] {
    return Array.from(this.reports.values());
  }
}

export const defaultPullRequestRepository = new InMemoryPullRequestRepository();
