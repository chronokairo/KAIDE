// Porta (ADR-0028/0032): persistência de Jobs, event log append-only e gates
// de aprovação. Implementada por adapters (arquivo local em DEV, Supabase em PROD).

import type {
  ApprovalGateRecord,
  ApprovalStatus,
  ControlPlaneJobType,
  EmailOutreachRecord,
  EmailOutreachStatus,
  JobEventRecord,
  JobRecord,
  JobStatus,
} from '@/domain/control-plane';

export interface CreateJobInput {
  organizationId: string;
  type: ControlPlaneJobType;
  idempotencyKey: string;
  input: Record<string, unknown>;
  status?: JobStatus;
  attempts?: number;
  requestedBy?: string;
}

export interface JobStorePort {
  /** Cria respeitando idempotência: mesma (org, key) retorna o job existente. */
  createJob(input: CreateJobInput): Promise<{ job: JobRecord; created: boolean }>;
  getJobById(id: string): Promise<JobRecord | null>;
  getJobByIdempotencyKey(organizationId: string, idempotencyKey: string): Promise<JobRecord | null>;
  updateJob(
    id: string,
    patch: Partial<Pick<JobRecord, 'status' | 'attempts' | 'result' | 'error' | 'costUsd' | 'startedAt' | 'completedAt'>>
  ): Promise<JobRecord>;
  listJobs(organizationId: string, filter?: { type?: ControlPlaneJobType; status?: JobStatus }): Promise<JobRecord[]>;

  /** Event log append-only: eventos nunca são alterados nem removidos. */
  appendJobEvent(event: {
    jobId: string;
    organizationId: string;
    type: JobEventRecord['type'];
    payload: Record<string, unknown>;
  }): Promise<JobEventRecord>;
  listJobEvents(jobId: string): Promise<JobEventRecord[]>;

  createApprovalGate(gate: {
    organizationId: string;
    jobId: string;
    leadId: string;
    type: ApprovalGateRecord['type'];
    title: string;
    details: string;
    evidence: string[];
    requestedBy: ApprovalGateRecord['requestedBy'];
  }): Promise<ApprovalGateRecord>;
  getApprovalGate(id: string): Promise<ApprovalGateRecord | null>;
  resolveApprovalGate(
    id: string,
    resolution: {
      status: Exclude<ApprovalStatus, 'pending'>;
      resolvedBy: string;
      resolvedAt?: string;
      resolution?: string;
    }
  ): Promise<ApprovalGateRecord>;
  listApprovalGates(
    organizationId: string,
    filter?: { status?: ApprovalStatus; leadId?: string }
  ): Promise<ApprovalGateRecord[]>;

  /** Persistência de e-mails de outreach (dados salvos do Resend — não cache). */
  upsertEmailOutreach(input: {
    organizationId: string;
    resendId: string;
    leadId?: string;
    toAddress: string;
    subject: string;
    status: EmailOutreachStatus;
    sentAt?: string;
    lastCheckedAt?: string;
  }): Promise<EmailOutreachRecord>;
  listEmailOutreach(
    organizationId: string,
    filter?: { nonTerminalOnly?: boolean; limit?: number }
  ): Promise<EmailOutreachRecord[]>;
}
