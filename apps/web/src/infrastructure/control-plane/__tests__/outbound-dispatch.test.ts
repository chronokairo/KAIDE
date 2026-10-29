import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobEntity } from '@/domain/company';
import type { FollowupDraft } from '@/domain/commercial';
import type { LeadRepositoryPort } from '@/application/ports/lead-repository-port';

const mocks = vi.hoisted(() => ({ send: vi.fn(), insert: vi.fn() }));
vi.mock('@/shared/supabase', () => ({ PROD_ORGANIZATION_ID: 'org-test', PROD_USER_ID: 'user-test' }));
vi.mock('@/infrastructure/persistence/supabase-admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ insert: mocks.insert }) }),
}));
vi.mock('@/infrastructure/email/resend-email-service', () => ({
  defaultResendEmailService: { sendFollowupEmail: mocks.send },
}));
import { SupabaseCompanyControlPlaneAdapter } from '../supabase-control-plane-adapter';

function job(): JobEntity {
  return {
    id: 'job-test', title: 'Outbound', client: 'test', project: 'test', stage: 'commercial', agentRole: 'commercial',
    status: 'waiting_approval', prompt: '', toolsUsed: [], changesSummary: '', testsSummary: '', evidence: [],
    costUsd: 0, durationSeconds: 0, requiresApproval: true, createdAt: new Date().toISOString(),
    approvalGate: { id: 'gate-test', jobId: 'job-test', type: 'outbound_contact', title: 'Approve', details: '', requestedBy: 'commercial', requestedAt: new Date().toISOString(), evidence: [], status: 'pending' },
  };
}
function draft(id = 'draft-test'): FollowupDraft {
  return { id, leadId: 'lead-test', companyName: 'Test', recipientName: 'Test', recipientRole: 'Test', recipientEmail: 'recipient@example.test', channel: 'email', subject: 'Test', body: 'Draft', callToAction: 'Reply', rationale: '', complianceCheck: { lgpdCompliant: true, hasOptOut: true, toneAppropriate: true }, status: 'pending_approval', createdAt: new Date().toISOString() };
}
async function setup(drafts: FollowupDraft[]) {
  const lead: LeadRepositoryPort = {
    listLeadsAwaitingFollowup: vi.fn(), getLeadById: vi.fn(), saveFollowupDraft: vi.fn(),
    getDraftsByJobId: vi.fn().mockResolvedValue(drafts), updateDraftStatus: vi.fn(), updateLeadStatus: vi.fn(),
  };
  const adapter = new SupabaseCompanyControlPlaneAdapter(lead);
  const current = job();
  vi.spyOn(adapter, 'getSnapshot').mockResolvedValue({ agents: [], jobs: [current], telemetry: {} } as never);
  await adapter.submitJob(current);
  return { adapter, lead, current };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
  mocks.send.mockResolvedValue({ success: false, error: 'RESEND_API_KEY is required for email operations' });
});

describe('approved outbound dispatch acknowledgement', () => {
  it('keeps unsent drafts pending and marks the job failed when configuration is missing', async () => {
    const { adapter, lead, current } = await setup([draft()]);
    await adapter.approveJob('gate-test');
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(lead.updateDraftStatus).not.toHaveBeenCalled();
    expect(lead.updateLeadStatus).not.toHaveBeenCalled();
    expect(current.status).toBe('failed');
    expect(current.approvalGate?.status).toBe('approved');
    expect(current.evidence.join(' ')).not.toContain('Messages successfully transmitted');
  });

  it('updates dispatch status only after successful provider acknowledgement', async () => {
    mocks.send.mockResolvedValue({ success: true, messageId: 'message-test' });
    const { adapter, lead, current } = await setup([draft()]);
    await adapter.approveJob('gate-test');
    expect(lead.updateDraftStatus).toHaveBeenCalledWith('draft-test', 'dispatched', expect.any(String));
    expect(vi.mocked(lead.updateDraftStatus).mock.invocationCallOrder[0]).toBeGreaterThan(mocks.send.mock.invocationCallOrder[0]);
    expect(current.status).toBe('completed');
    expect(current.evidence.join(' ')).toContain('Messages successfully transmitted');
  });

  it('does not send or mark as dispatched a draft with no recipient', async () => {
    const { adapter, lead, current } = await setup([{ ...draft(), recipientEmail: '' }]);
    await adapter.approveJob('gate-test');
    expect(mocks.send).not.toHaveBeenCalled();
    expect(lead.updateDraftStatus).not.toHaveBeenCalled();
    expect(current.status).toBe('failed');
  });
});
