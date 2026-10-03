import { describe, it, expect, vi } from 'vitest';
import { ExecuteCommercialDailyUseCase } from '../execute-commercial-daily';
import { LeadRepositoryPort } from '@/application/ports/lead-repository-port';
import { CompanyControlPlanePort } from '@/application/ports/company-control-plane-port';
import { JobEntity } from '@/domain/company';

describe('ExecuteCommercialDailyUseCase (commercial.daily)', () => {
  it('executes commercial.daily, performs company analysis, and opens human approval gate', async () => {
    const mockLeadRepo: LeadRepositoryPort = {
      listLeadsAwaitingFollowup: vi.fn().mockResolvedValue([]),
      getLeadById: vi.fn().mockResolvedValue(null),
      saveFollowupDraft: vi.fn().mockResolvedValue(undefined),
      updateDraftStatus: vi.fn().mockResolvedValue(undefined),
      updateLeadStatus: vi.fn().mockResolvedValue(undefined),
    };

    const submittedJobs: JobEntity[] = [];
    const mockControlPlane: CompanyControlPlanePort = {
      getSnapshot: vi.fn().mockResolvedValue({ agents: [], jobs: submittedJobs, telemetry: {} }),
      submitJob: vi.fn().mockImplementation(async (job: JobEntity) => {
        submittedJobs.push(job);
      }),
      approveJob: vi.fn(),
      rejectJob: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };

    const useCase = new ExecuteCommercialDailyUseCase(mockLeadRepo, mockControlPlane);
    const result = await useCase.execute();

    expect(result.stage).toBe('commercial');
    expect(result.leadsScannedCount).toBe(13);
    expect(result.analyses.length).toBe(13);
    expect(result.drafts.length).toBe(13);
    expect(result.requiresApproval).toBe(true);
    expect(result.approvalGateId).toBeDefined();

    // Verify job in Control Plane
    expect(submittedJobs.length).toBe(1);
    const job = submittedJobs[0];
    expect(job.status).toBe('waiting_approval');
    expect(job.requiresApproval).toBe(true);
    expect(job.approvalGate?.type).toBe('outbound_contact');
    expect(job.evidence.length).toBeGreaterThan(4);
  });
});
