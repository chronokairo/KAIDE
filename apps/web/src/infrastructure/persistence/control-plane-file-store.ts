// Adapter de persistência do Control Plane (ADR-0028/0032): arquivo JSON local.
// DEV real — sem dados mockados. Em PROD, o adapter Supabase (PostgREST) assume.
// Arquitetura Hexagonal: Infrastructure — implementa JobStorePort + CrmPort.

import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, copyFileSync, unlinkSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  CrmActivityRecord,
  CrmPort,
  CreateLeadInput,
  LogActivityInput,
} from '@/application/ports/crm-port';
import type { JobStorePort, CreateJobInput } from '@/application/ports/control-plane-store-port';
import type {
  ApprovalGateRecord,
  ApprovalStatus,
  ControlPlaneJobType,
  EmailOutreachRecord,
  EmailOutreachStatus,
  JobEventRecord,
  JobEventType,
  JobRecord,
  JobStatus,
  LeadRecord,
  LeadStatus,
} from '@/domain/control-plane';

interface StoreDocument {
  version: 1;
  jobs: JobRecord[];
  jobEvents: JobEventRecord[];
  leads: LeadRecord[];
  approvalGates: ApprovalGateRecord[];
  emailOutreach: EmailOutreachRecord[];
  activities: CrmActivityRecord[];
}

const EMPTY_DOC: StoreDocument = {
  version: 1,
  jobs: [],
  jobEvents: [],
  leads: [],
  approvalGates: [],
  emailOutreach: [],
  activities: [],
};

export class ControlPlaneFileStore implements JobStorePort, CrmPort {
  private doc: StoreDocument | null = null;

  constructor(private readonly filePath: string) {}

  // ─── JobStorePort ───────────────────────────────────────────────────────────

  async createJob(input: CreateJobInput): Promise<{ job: JobRecord; created: boolean }> {
    const doc = this.load();
    const existing = doc.jobs.find(
      (j) =>
        j.organizationId === input.organizationId && j.idempotencyKey === input.idempotencyKey
    );
    if (existing) {
      return { job: existing, created: false };
    }
    const now = new Date().toISOString();
    const job: JobRecord = {
      id: randomUUID(),
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
    doc.jobs.push(job);
    this.persist();
    return { job, created: true };
  }

  async getJobById(id: string): Promise<JobRecord | null> {
    return this.load().jobs.find((j) => j.id === id) ?? null;
  }

  async getJobByIdempotencyKey(organizationId: string, idempotencyKey: string): Promise<JobRecord | null> {
    return (
      this.load().jobs.find(
        (j) => j.organizationId === organizationId && j.idempotencyKey === idempotencyKey
      ) ?? null
    );
  }

  async updateJob(
    id: string,
    patch: Partial<Pick<JobRecord, 'status' | 'attempts' | 'result' | 'error' | 'costUsd' | 'startedAt' | 'completedAt'>>
  ): Promise<JobRecord> {
    const doc = this.load();
    const job = doc.jobs.find((j) => j.id === id);
    if (!job) {
      throw new Error(`Job não encontrado: ${id}`);
    }
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    this.persist();
    return job;
  }

  async listJobs(
    organizationId: string,
    filter?: { type?: ControlPlaneJobType; status?: JobStatus }
  ): Promise<JobRecord[]> {
    return this.load().jobs.filter(
      (j) =>
        j.organizationId === organizationId &&
        (!filter?.type || j.type === filter.type) &&
        (!filter?.status || j.status === filter.status)
    );
  }

  async appendJobEvent(event: {
    jobId: string;
    organizationId: string;
    type: JobEventType;
    payload: Record<string, unknown>;
  }): Promise<JobEventRecord> {
    const doc = this.load();
    const record: JobEventRecord = {
      id: randomUUID(),
      jobId: event.jobId,
      organizationId: event.organizationId,
      type: event.type,
      payload: event.payload,
      createdAt: new Date().toISOString(),
    };
    doc.jobEvents.push(record);
    this.persist();
    return record;
  }

  async listJobEvents(jobId: string): Promise<JobEventRecord[]> {
    return this.load().jobEvents.filter((e) => e.jobId === jobId);
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
    const doc = this.load();
    const record: ApprovalGateRecord = {
      id: randomUUID(),
      ...gate,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    doc.approvalGates.push(record);
    this.persist();
    return record;
  }

  async getApprovalGate(id: string): Promise<ApprovalGateRecord | null> {
    return this.load().approvalGates.find((g) => g.id === id) ?? null;
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
    const doc = this.load();
    const gate = doc.approvalGates.find((g) => g.id === id);
    if (!gate) {
      throw new Error(`Gate de aprovação não encontrado: ${id}`);
    }
    if (gate.status !== 'pending') {
      throw new Error(`Gate de aprovação já resolvido: ${id}`);
    }
    Object.assign(gate, {
      status: resolution.status,
      resolvedBy: resolution.resolvedBy,
      resolvedAt: resolution.resolvedAt ?? new Date().toISOString(),
      resolution: resolution.resolution,
    });
    this.persist();
    return gate;
  }

  async listApprovalGates(
    organizationId: string,
    filter?: { status?: ApprovalStatus; leadId?: string }
  ): Promise<ApprovalGateRecord[]> {
    return this.load().approvalGates.filter(
      (g) =>
        g.organizationId === organizationId &&
        (!filter?.status || g.status === filter.status) &&
        (!filter?.leadId || g.leadId === filter.leadId)
    );
  }

  // ─── CrmPort ────────────────────────────────────────────────────────────────

  async createLead(input: CreateLeadInput): Promise<LeadRecord> {
    const doc = this.load();
    const now = new Date().toISOString();
    const lead: LeadRecord = {
      id: randomUUID(),
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
    doc.leads.push(lead);
    this.persist();
    return lead;
  }

  async getLeadById(id: string): Promise<LeadRecord | null> {
    return this.load().leads.find((l) => l.id === id) ?? null;
  }

  async listLeads(organizationId: string, filter?: { status?: LeadStatus[] }): Promise<LeadRecord[]> {
    return this.load().leads.filter(
      (l) =>
        l.organizationId === organizationId &&
        (!filter?.status || filter.status.includes(l.status))
    );
  }

  async updateLead(
    id: string,
    patch: Partial<
      Pick<
        LeadRecord,
        'status' | 'score' | 'scoreRationale' | 'research' | 'approachDraft' | 'followUpDraft' | 'notes'
      >
    >
  ): Promise<LeadRecord> {
    const doc = this.load();
    const lead = doc.leads.find((l) => l.id === id);
    if (!lead) {
      throw new Error(`Lead não encontrado: ${id}`);
    }
    Object.assign(lead, patch, { updatedAt: new Date().toISOString() });
    this.persist();
    return lead;
  }

  // ─── EmailOutreach (dados salvos do Resend — não cache) ─────────────────────

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
    const doc = this.load();
    const now = new Date().toISOString();
    const existing = doc.emailOutreach.find(
      (e) => e.organizationId === input.organizationId && e.resendId === input.resendId
    );
    if (existing) {
      // leadId undefined não zera associação existente (paridade com Supabase).
      if (input.leadId !== undefined) {
        existing.leadId = input.leadId;
      }
      existing.toAddress = input.toAddress;
      existing.subject = input.subject;
      existing.status = input.status;
      existing.sentAt = input.sentAt;
      existing.lastCheckedAt = input.lastCheckedAt ?? now;
      existing.updatedAt = now;
      this.persist();
      return existing;
    }
    const record: EmailOutreachRecord = {
      id: randomUUID(),
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
    doc.emailOutreach.push(record);
    this.persist();
    return record;
  }

  async listEmailOutreach(
    organizationId: string,
    filter?: { nonTerminalOnly?: boolean; limit?: number }
  ): Promise<EmailOutreachRecord[]> {
    const doc = this.load();
    let rows = doc.emailOutreach.filter((e) => e.organizationId === organizationId);
    if (filter?.nonTerminalOnly) {
      rows = rows.filter(
        (e) => !['delivered', 'opened', 'bounced', 'complained'].includes(e.status)
      );
    }
    rows = rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return filter?.limit ? rows.slice(0, filter.limit) : rows;
  }

  // ─── CrmPort: atividades ───────────────────────────────────────────────────

  async logActivity(input: LogActivityInput): Promise<CrmActivityRecord> {
    const doc = this.load();
    const record: CrmActivityRecord = {
      id: randomUUID(),
      organizationId: input.organizationId,
      leadId: input.leadId,
      type: input.type,
      summary: input.summary,
      details: input.details,
      dueDate: input.dueDate,
      completedAt: input.completedAt ?? null,
      createdAt: new Date().toISOString(),
    };
    doc.activities.push(record);
    this.persist();
    return record;
  }

  // ─── Persistência atômica ──────────────────────────────────────────────────

  private load(): StoreDocument {
    if (this.doc) {
      return this.doc;
    }
    if (existsSync(this.filePath)) {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf-8')) as Partial<StoreDocument>;
      this.doc = {
        ...EMPTY_DOC,
        ...raw,
        // Arrays frescos: documentos legados podem omitir coleções novas — herdar
        // as referências de EMPTY_DOC vazaria estado entre instâncias.
        jobs: raw.jobs ?? [],
        jobEvents: raw.jobEvents ?? [],
        leads: raw.leads ?? [],
        approvalGates: raw.approvalGates ?? [],
        emailOutreach: raw.emailOutreach ?? [],
        activities: raw.activities ?? [],
      };
    } else {
      this.doc = {
        ...EMPTY_DOC,
        jobs: [],
        jobEvents: [],
        leads: [],
        approvalGates: [],
        emailOutreach: [],
        activities: [],
      };
    }
    return this.doc;
  }

  private persist(): void {
    const doc = this.load();
    const dir = dirname(this.filePath);
    mkdirSync(dir, { recursive: true });
    const tmpPath = join(dir, `.tmp-${Date.now()}-${process.pid}.json`);
    writeFileSync(tmpPath, JSON.stringify(doc, null, 2), 'utf-8');
    try {
      renameSync(tmpPath, this.filePath);
    } catch {
      // Windows pode recusar rename sobre arquivo aberto — fallback cópia+delete.
      copyFileSync(tmpPath, this.filePath);
      unlinkSync(tmpPath);
    }
  }
}
