import { Lead, FollowupDraft } from '@/domain/commercial';

export interface LeadRepositoryPort {
  listLeadsAwaitingFollowup(): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | null>;
  saveFollowupDraft(draft: FollowupDraft): Promise<void>;
  getDraftsByJobId?(jobId: string): Promise<FollowupDraft[]>;
  updateDraftStatus(draftId: string, status: FollowupDraft['status'], dispatchedAt?: string): Promise<void>;
  updateLeadStatus(leadId: string, status: Lead['status'], notes?: string): Promise<void>;
}
