import { describe, it, expect, beforeEach } from 'vitest';
import { ExecuteQaPrReviewUseCase } from '../execute-qa-pr-review';
import { InMemoryPullRequestRepository } from '@/infrastructure/qa/in-memory-pr-repository';
import { InMemoryCompanyControlPlaneAdapter } from '@/infrastructure/control-plane/in-memory-control-plane';

describe('ExecuteQaPrReviewUseCase', () => {
  let prRepo: InMemoryPullRequestRepository;
  let controlPlane: InMemoryCompanyControlPlaneAdapter;
  let useCase: ExecuteQaPrReviewUseCase;

  beforeEach(() => {
    prRepo = new InMemoryPullRequestRepository();
    controlPlane = new InMemoryCompanyControlPlaneAdapter(undefined, prRepo);
    useCase = new ExecuteQaPrReviewUseCase(prRepo, controlPlane);
  });

  it('deve varrer PRs abertos e auditar as 4 dimensões adversariais obrigatórias', async () => {
    const result = await useCase.execute();

    expect(result.prsScannedCount).toBe(2);
    expect(result.reports.length).toBe(2);
    expect(result.stage).toBe('qa');

    // Cada relatório deve conter exatamente as 4 dimensões obrigatórias
    result.reports.forEach((report) => {
      const dimensions = report.adversarialDimensions.map((d) => d.dimension);
      expect(dimensions).toContain('unit_tests');
      expect(dimensions).toContain('integration_tests');
      expect(dimensions).toContain('security');
      expect(dimensions).toContain('tenant_rbac');
    });
  });

  it('deve aprovar PR-104 (ASO) com PASS e autorizar merge', async () => {
    const result = await useCase.execute();

    const pr104Report = result.reports.find((r) => r.prId === 'PR-104');
    expect(pr104Report).toBeDefined();
    expect(pr104Report?.overallVerdict).toBe('PASS');
    expect(pr104Report?.overallScore).toBeGreaterThanOrEqual(95);
    expect(pr104Report?.canMerge).toBe(true);
    expect(pr104Report?.blockers.length).toBe(0);

    const pr104 = await prRepo.getPullRequestById('PR-104');
    expect(pr104?.status).toBe('approved');
  });

  it('deve bloquear PR-105 (Auth) com FAIL devido a vulnerabilidade de tenant/RBAC', async () => {
    const result = await useCase.execute();

    const pr105Report = result.reports.find((r) => r.prId === 'PR-105');
    expect(pr105Report).toBeDefined();
    expect(pr105Report?.overallVerdict).toBe('FAIL');
    expect(pr105Report?.canMerge).toBe(false);
    expect(pr105Report?.blockers.length).toBeGreaterThan(0);
    expect(pr105Report?.blockers.some((b) => b.toLowerCase().includes('isolamento'))).toBe(true);

    // Dimensão tenant_rbac deve ter falhado
    const rbacDim = pr105Report?.adversarialDimensions.find((d) => d.dimension === 'tenant_rbac');
    expect(rbacDim?.verdict).toBe('FAIL');
    expect(rbacDim?.score).toBeLessThan(50);

    const pr105 = await prRepo.getPullRequestById('PR-105');
    expect(pr105?.status).toBe('changes_requested');
  });

  it('deve registrar o job qa.review_pr com evidências completas no Control Plane', async () => {
    const result = await useCase.execute();

    const snapshot = await controlPlane.getSnapshot();
    const job = snapshot.jobs.find((j) => j.id === result.jobId);

    expect(job).toBeDefined();
    expect(job?.agentRole).toBe('qa');
    expect(job?.evidence.length).toBeGreaterThan(5);
    expect(job?.toolsUsed).toContain('rbac_verifier');
    expect(job?.toolsUsed).toContain('fuzz_tester');
    expect(job?.toolsUsed).toContain('security_scanner');
  });
});
