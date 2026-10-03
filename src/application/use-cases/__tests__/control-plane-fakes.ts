// Fakes in-memory para testes de casos de uso do Control Plane (ADR-0028/0032).
// Implementam as portas completas — sem fs, sem rede, sem Supabase/Resend.

import type { JobStorePort, CreateJobInput } from '@/application/ports/control-plane-store-port';
import type { CrmPort, CreateLeadInput, LogActivityInput, CrmActivityRecord } from '@/application/ports/crm-port';
import type { EmailOutreachPort, SendEmailInput, ProviderEmailInfo } from '@/application/ports/email-outreach-port';
import type { AuditPort, AuditEvent } from '@/application/ports/audit-port';
import type {
  ApprovalGateRecord,
  ApprovalStatus,
  ControlPlaneJobType,
  EmailOutreachRecord,
  EmailOutreachStatus,
  JobEventRecord,
  JobRecord,
  JobStatus,
  LeadRecord,
  LeadStatus,
} from '@/domain/control-plane';
import { isTerminalEmailStatus } from '@/domain/control-plane';

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export class FakeJobStore implements JobStorePort {
  jobs: JobRecord[] = [];
  jobEvents: JobEventRecord[] = [];
  approvalGates: ApprovalGateRecord[] = [];
  emailOutreach: EmailOutreachRecord[] = [];

  async createJob(input: CreateJobInput): Promise<{ job: JobRecord; created: boolean }> {
    const existing = this.jobs.find(
      (j) => j.organizationId === input.organizationId && j.idempotencyKey === input.idempotencyKey
    );
    if (existing) return { job: existing, created: false };
    const now = new Date().toISOString();
    const job: JobRecord = {
      id: nextId('job'),
      organizationId: input.organizationId,
      type: input.type,
      idempotencyKey: input.idempotencyKey,
      status: input.status ?? 'queued',
      attempts: input.attempts ?? 1,
      input: input.input ?? {},
      requestedBy: input.requestedBy,
      costUsd: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.push(job);
    return { job, created: true };
  }

  async getJobById(id: string): Promise<JobRecord | null> {
    return this.jobs.find((j) => j.id === id) ?? null;
  }

  async getJobByIdempotencyKey(organizationId: string, idempotencyKey: string): Promise<JobRecord | null> {
    return (
      this.jobs.find(
        (j) => j.organizationId === organizationId && j.idempotencyKey === idempotencyKey
      ) ?? null
    );
  }

  async updateJob(
    id: string,
    patch: Partial<Pick<JobRecord, 'status' | 'attempts' | 'result' | 'error' | 'costUsd' | 'startedAt' | 'completedAt'>>
  ): Promise<JobRecord> {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) throw new Error(`Job não encontrado: ${id}`);
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    return job;
  }

  async listJobs(
    organizationId: string,
    filter?: { type?: ControlPlaneJobType; status?: JobStatus }
  ): Promise<JobRecord[]> {
    return this.jobs.filter(
      (j) =>
        j.organizationId === organizationId &&
        (!filter?.type || j.type === filter.type) &&
        (!filter?.status || j.status === filter.status)
    );
  }

  async appendJobEvent(event: {
    jobId: string;
    organizationId: string;
    type: JobEventRecord['type'];
    payload: Record<string, unknown>;
  }): Promise<JobEventRecord> {
    const record: JobEventRecord = {
      id: nextId('evt'),
      jobId: event.jobId,
      organizationId: event.organizationId,
      type: event.type,
      payload: event.payload,
      createdAt: new Date().toISOString(),
    };
    this.jobEvents.push(record);
    return record;
  }

  async listJobEvents(jobId: string): Promise<JobEventRecord[]> {
    return this.jobEvents.filter((e) => e.jobId === jobId);
  }

  async createApprovalGate(gate: {
    organizationId: string;
    jobId: string;
    leadId: string;
    type: ApprovalGateRecord['type'];
    title: string;
    details: string;
    evidence: string[];
    requestedBy: ApprovalGateRecord['requestedBy'];
  }): Promise<ApprovalGateRecord> {
    const record: ApprovalGateRecord = {
      id: nextId('gate'),
      ...gate,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    this.approvalGates.push(record);
    return record;
  }

  async getApprovalGate(id: string): Promise<ApprovalGateRecord | null> {
    return this.approvalGates.find((g) => g.id === id) ?? null;
  }

  async resolveApprovalGate(
    id: string,
    resolution: {
      status: Exclude<ApprovalStatus, 'pending'>;
      resolvedBy: string;
      resolvedAt?: string;
      resolution?: string;
    }
  ): Promise<ApprovalGateRecord> {
    const gate = this.approvalGates.find((g) => g.id === id);
    if (!gate) throw new Error(`Gate não encontrado: ${id}`);
    if (gate.status !== 'pending') throw new Error(`Gate já resolvido: ${id}`);
    Object.assign(gate, {
      status: resolution.status,
      resolvedBy: resolution.resolvedBy,
      resolvedAt: resolution.resolvedAt ?? new Date().toISOString(),
      resolution: resolution.resolution,
    });
    return gate;
  }

  async listApprovalGates(
    organizationId: string,
    filter?: { status?: ApprovalStatus; leadId?: string }
  ): Promise<ApprovalGateRecord[]> {
    return this.approvalGates.filter(
      (g) =>
        g.organizationId === organizationId &&
        (!filter?.status || g.status === filter.status) &&
        (!filter?.leadId || g.leadId === filter.leadId)
    );
  }

  async upsertEmailOutreach(input: {
    organizationId: string;
    resendId: string;
    leadId?: string;
    toAddress: string;
    subject: string;
    status: EmailOutreachStatus;
    sentAt?: string;
    lastCheckedAt?: string;
  }): Promise<EmailOutreachRecord> {
    const existing = this.emailOutreach.find(
      (e) => e.organizationId === input.organizationId && e.resendId === input.resendId
    );
    const now = new Date().toISOString();
    if (existing) {
      if (input.leadId !== undefined) existing.leadId = input.leadId;
      existing.toAddress = input.toAddress;
      existing.subject = input.subject;
      existing.status = input.status;
      existing.sentAt = input.sentAt;
      existing.lastCheckedAt = input.lastCheckedAt ?? now;
      existing.updatedAt = now;
      return existing;
    }
    const record: EmailOutreachRecord = {
      id: nextId('outreach'),
      organizationId: input.organizationId,
      leadId: input.leadId,
      resendId: input.resendId,
      toAddress: input.toAddress,
      subject: input.subject,
      status: input.status,
      sentAt: input.sentAt,
      lastCheckedAt: input.lastCheckedAt ?? now,
      createdAt: now,
      updatedAt: now,
    };
    this.emailOutreach.push(record);
    return record;
  }

  async listEmailOutreach(
    organizationId: string,
    filter?: { nonTerminalOnly?: boolean; limit?: number }
  ): Promise<EmailOutreachRecord[]> {
    let rows = this.emailOutreach.filter((e) => e.organizationId === organizationId);
    if (filter?.nonTerminalOnly) {
      rows = rows.filter((e) => !isTerminalEmailStatus(e.status));
    }
    return filter?.limit ? rows.slice(0, filter.limit) : rows;
  }
}

export class FakeCrm implements CrmPort {
  leads: LeadRecord[] = [];
  activities: CrmActivityRecord[] = [];

  async createLead(input: CreateLeadInput): Promise<LeadRecord> {
    const now = new Date().toISOString();
    const lead: LeadRecord = {
      id: nextId('lead'),
      organizationId: input.organizationId,
      companyName: input.companyName,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactRole: input.contactRole,
      source: input.source,
      notes: input.notes,
      segment: input.segment,
      tier: input.tier,
      estimatedValue: input.estimatedValue,
      location: input.location,
      status: input.status ?? 'new',
      createdAt: now,
      updatedAt: now,
    };
    this.leads.push(lead);
    return lead;
  }

  async getLeadById(id: string): Promise<LeadRecord | null> {
    return this.leads.find((l) => l.id === id) ?? null;
  }

  async listLeads(organizationId: string, filter?: { status?: LeadStatus[] }): Promise<LeadRecord[]> {
    return this.leads.filter(
      (l) => l.organizationId === organizationId && (!filter?.status || filter.status.includes(l.status))
    );
  }

  async updateLead(
    id: string,
    patch: Partial<
      Pick<LeadRecord, 'status' | 'score' | 'scoreRationale' | 'research' | 'approachDraft' | 'followUpDraft' | 'notes'>
    >
  ): Promise<LeadRecord> {
    const lead = this.leads.find((l) => l.id === id);
    if (!lead) throw new Error(`Lead não encontrado: ${id}`);
    Object.assign(lead, patch, { updatedAt: new Date().toISOString() });
    return lead;
  }

  async logActivity(input: LogActivityInput): Promise<CrmActivityRecord> {
    const record: CrmActivityRecord = {
      id: nextId('act'),
      organizationId: input.organizationId,
      leadId: input.leadId,
      type: input.type,
      summary: input.summary,
      details: input.details,
      dueDate: input.dueDate,
      completedAt: input.completedAt ?? null,
      createdAt: new Date().toISOString(),
    };
    this.activities.push(record);
    return record;
  }
}

/** Fake do provedor Resend — e-mails em memória, janela de 24h respeitada. */
export class FakeEmailOutreach implements EmailOutreachPort {
  private counter = 0;
  readonly emails: ProviderEmailInfo[] = [];
  sendError: Error | null = null;

  constructor(private readonly configured = true) {}

  isConfigured(): boolean {
    return this.configured;
  }

  async sendEmail(input: SendEmailInput): Promise<ProviderEmailInfo> {
    if (this.sendError) throw this.sendError;
    this.counter += 1;
    const info: ProviderEmailInfo = {
      resendId: `re-fake-${this.counter}`,
      to: input.to,
      subject: input.subject,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    this.emails.push(info);
    return info;
  }

  async getEmail(resendId: string): Promise<ProviderEmailInfo | null> {
    return this.emails.find((e) => e.resendId === resendId) ?? null;
  }

  async listRecentEmails(windowHours: number, limit?: number): Promise<ProviderEmailInfo[]> {
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    const rows = this.emails.filter((e) => Date.parse(e.createdAt) >= cutoff);
    return limit ? rows.slice(0, limit) : rows;
  }
}

export class FakeAudit implements AuditPort {
  readonly events: AuditEvent[] = [];
  async record(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }
}
