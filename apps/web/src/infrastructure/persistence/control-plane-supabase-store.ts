// Adapter de persistência do Control Plane (ADR-0028/0032): Supabase/PostgreSQL
// via PostgREST (service role). PROD — integra às tabelas REAIS da plataforma:
//   `leads` (CRM) + `crm_activities` (histórico) + `cp_lead_state` (estado do
//   pipeline do Control Plane) + `cp_email_outreach` (e-mails Resend SALVOS —
//   dados, não cache). RLS habilitado sem policies públicas; acesso
//   exclusivamente server-side com service key (nunca no cliente).
// Arquitetura Hexagonal: Infrastructure — implementa JobStorePort + CrmPort.

import { randomUUID } from 'node:crypto';
import type {
  CrmActivityRecord,
  CreateLeadInput,
  CrmPort,
  LogActivityInput,
} from '@/application/ports/crm-port';
import type { CreateJobInput, JobStorePort } from '@/application/ports/control-plane-store-port';
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

// ─── Row mapping (snake_case ↔ camelCase) ─────────────────────────────────────

type JobRow = Record<string, unknown>;

function jobFromRow(row: JobRow): JobRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    type: row.type as ControlPlaneJobType,
    idempotencyKey: String(row.idempotency_key),
    status: row.status as JobStatus,
    attempts: Number(row.attempts),
    input: (row.input ?? {}) as Record<string, unknown>,
    requestedBy: row.requested_by as string | undefined,
    result: (row.result ?? undefined) as Record<string, unknown> | undefined,
    error: (row.error ?? undefined) as string | undefined,
    costUsd: Number(row.cost_usd ?? 0),
    startedAt: (row.started_at ?? undefined) as string | undefined,
    completedAt: (row.completed_at ?? undefined) as string | undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function eventFromRow(row: JobRow): JobEventRecord {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    organizationId: String(row.organization_id),
    type: row.type as JobEventType,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    createdAt: String(row.created_at),
  };
}

function gateFromRow(row: JobRow): ApprovalGateRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    jobId: String(row.job_id),
    leadId: String(row.lead_id),
    type: row.type as ApprovalGateRecord['type'],
    title: String(row.title),
    details: String(row.details),
    evidence: (row.evidence ?? []) as string[],
    status: row.status as ApprovalGateRecord['status'],
    requestedBy: String(row.requested_by),
    requestedAt: String(row.requested_at),
    resolvedBy: (row.resolved_by ?? undefined) as string | undefined,
    resolvedAt: (row.resolved_at ?? undefined) as string | undefined,
    resolution: (row.resolution ?? undefined) as string | undefined,
  };
}

function emailOutreachFromRow(row: JobRow): EmailOutreachRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    leadId: (row.lead_id ?? undefined) as string | undefined,
    resendId: String(row.resend_id),
    toAddress: String(row.to_address),
    subject: String(row.subject),
    status: row.status as EmailOutreachStatus,
    sentAt: (row.sent_at ?? undefined) as string | undefined,
    lastCheckedAt: (row.last_checked_at ?? undefined) as string | undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// ─── Mapeamento CRM real ↔ pipeline do Control Plane ──────────────────────────

/**
 * Status do pipeline → status de negócio da tabela `leads`
 * (CHECK: 'Novo','Em Contato','Qualificado','Desqualificado','Convertido').
 */
function pipelineToBusinessStatus(pipeline: LeadStatus): string {
  switch (pipeline) {
    case 'contacted':
      return 'Em Contato';
    case 'disqualified':
      return 'Desqualificado';
    case 'qualified':
    case 'awaiting_contact_approval':
    case 'contact_authorized':
    case 'contact_rejected':
      return 'Qualificado';
    case 'new':
    case 'researching':
    default:
      return 'Novo';
  }
}

/**
 * Status de negócio → status do pipeline, usado quando o Control Plane ainda
 * não tocou o lead (sem linha em cp_lead_state). Leads 'Qualificado' com
 * atividade de e-mail no CRM derivam para `contacted` (contato existente).
 */
function businessToPipelineStatus(business: string, hasEmailActivity: boolean): LeadStatus {
  switch (business) {
    case 'Em Contato':
    case 'Convertido':
      return 'contacted';
    case 'Desqualificado':
      return 'disqualified';
    case 'Qualificado':
      return hasEmailActivity ? 'contacted' : 'qualified';
    case 'Novo':
    default:
      return 'new';
  }
}

/**
 * Merge das três fontes em um LeadRecord do Control Plane:
 * `leads` (dados comerciais) + `cp_lead_state` (estado do pipeline — fonte da
 * verdade após o Control Plane tocar o lead) + última atividade de e-mail
 * (lastContactedAt para a cadência de follow-up).
 */
function leadFromRows(
  leadRow: JobRow,
  stateRow: JobRow | undefined,
  lastEmailActivityAt: string | undefined,
): LeadRecord {
  const businessStatus = String(leadRow.status ?? 'Novo');
  const pipelineStatus = stateRow
    ? (stateRow.status as LeadStatus)
    : businessToPipelineStatus(businessStatus, Boolean(lastEmailActivityAt));
  return {
    id: String(leadRow.id),
    organizationId: String(leadRow.organization_id),
    companyName: String(leadRow.company ?? ''),
    contactName: (leadRow.name ?? undefined) as string | undefined,
    contactEmail: (leadRow.email ?? undefined) as string | undefined,
    contactRole: undefined,
    source: (leadRow.source ?? undefined) as string | undefined,
    notes: (leadRow.notes ?? undefined) as string | undefined,
    segment: (leadRow.segment ?? undefined) as string | undefined,
    tier: (leadRow.tier ?? undefined) as LeadRecord['tier'],
    estimatedValue: (leadRow.estimated_value ?? undefined) as number | undefined,
    location: (leadRow.location ?? undefined) as string | undefined,
    priorityOrder: (leadRow.priority_order ?? undefined) as number | undefined,
    status: pipelineStatus,
    score: (stateRow?.score ?? undefined) as number | undefined,
    scoreRationale: (stateRow?.score_rationale ?? undefined) as string[] | undefined,
    research: (stateRow?.research ?? undefined) as LeadRecord['research'],
    approachDraft: (stateRow?.approach_draft ?? leadRow.approach ?? undefined) as
      | string
      | undefined,
    followUpDraft: (stateRow?.follow_up_draft ?? undefined) as string | undefined,
    lastContactedAt: lastEmailActivityAt,
    createdAt: String(leadRow.created_at),
    updatedAt: String(leadRow.updated_at),
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class ControlPlaneSupabaseStore implements JobStorePort, CrmPort {
  constructor(
    private readonly supabaseUrl: string,
    private readonly serviceRoleKey: string
  ) {}

  private async request(
    table: string,
    init: { method: string; query?: string[]; body?: unknown; prefer?: string }
  ): Promise<JobRow[]> {
    const url = new URL(`${this.supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}`);
    // Callers já encodam os valores (encodeURIComponent) — montar a search
    // manualmente evita o double-encoding de url.searchParams.append
    // (ex.: %3A virava %253A e filtros por idempotency_key nunca batiam).
    const params = init.query ?? [];
    if (params.length > 0) {
      url.search = params.join('&');
    }
    const response = await fetch(url, {
      method: init.method,
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
        ...(init.prefer ? { Prefer: init.prefer } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase ${table} ${init.method} falhou (${response.status}): ${text}`);
    }
    const text = await response.text();
    return text ? (JSON.parse(text) as JobRow[]) : [];
  }

  // ─── JobStorePort ───────────────────────────────────────────────────────────

  async createJob(input: CreateJobInput): Promise<{ job: JobRecord; created: boolean }> {
    const rows = await this.request('cp_jobs', {
      method: 'POST',
      prefer: 'resolution=ignore-duplicates,return=representation',
      body: {
        id: randomUUID(),
        organization_id: input.organizationId,
        type: input.type,
        idempotency_key: input.idempotencyKey,
        status: input.status ?? 'queued',
        attempts: input.attempts ?? 1,
        input: input.input ?? {},
        requested_by: input.requestedBy,
      },
    });
    if (rows.length > 0) {
      return { job: jobFromRow(rows[0]), created: true };
    }
    // Duplicata ignorada (unique org+key) — busca o existente.
    const existing = await this.request('cp_jobs', {
      method: 'GET',
      query: [
        `organization_id=eq.${encodeURIComponent(input.organizationId)}`,
        `idempotency_key=eq.${encodeURIComponent(input.idempotencyKey)}`,
        'select=*',
      ],
    });
    if (existing.length === 0) {
      throw new Error('Upsert de job não retornou registro existente.');
    }
    return { job: jobFromRow(existing[0]), created: false };
  }

  async getJobById(id: string): Promise<JobRecord | null> {
    const rows = await this.request('cp_jobs', {
      method: 'GET',
      query: [`id=eq.${encodeURIComponent(id)}`, 'select=*'],
    });
    return rows[0] ? jobFromRow(rows[0]) : null;
  }

  async getJobByIdempotencyKey(organizationId: string, idempotencyKey: string): Promise<JobRecord | null> {
    const rows = await this.request('cp_jobs', {
      method: 'GET',
      query: [
        `organization_id=eq.${encodeURIComponent(organizationId)}`,
        `idempotency_key=eq.${encodeURIComponent(idempotencyKey)}`,
        'select=*',
      ],
    });
    return rows[0] ? jobFromRow(rows[0]) : null;
  }

  async updateJob(
    id: string,
    patch: Partial<Pick<JobRecord, 'status' | 'attempts' | 'result' | 'error' | 'costUsd' | 'startedAt' | 'completedAt'>>
  ): Promise<JobRecord> {
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.attempts !== undefined) body.attempts = patch.attempts;
    if (patch.result !== undefined) body.result = patch.result;
    if (patch.error !== undefined) body.error = patch.error;
    if (patch.costUsd !== undefined) body.cost_usd = patch.costUsd;
    if (patch.startedAt !== undefined) body.started_at = patch.startedAt;
    if (patch.completedAt !== undefined) body.completed_at = patch.completedAt;

    const rows = await this.request('cp_jobs', {
      method: 'PATCH',
      prefer: 'return=representation',
      query: [`id=eq.${encodeURIComponent(id)}`],
      body,
    });
    if (rows.length === 0) {
      throw new Error(`Job não encontrado: ${id}`);
    }
    return jobFromRow(rows[0]);
  }

  async listJobs(
    organizationId: string,
    filter?: { type?: ControlPlaneJobType; status?: JobStatus }
  ): Promise<JobRecord[]> {
    const query = [`organization_id=eq.${encodeURIComponent(organizationId)}`, 'select=*'];
    if (filter?.type) query.push(`type=eq.${encodeURIComponent(filter.type)}`);
    if (filter?.status) query.push(`status=eq.${encodeURIComponent(filter.status)}`);
    query.push('order=created_at.desc');
    const rows = await this.request('cp_jobs', { method: 'GET', query });
    return rows.map(jobFromRow);
  }

  async appendJobEvent(event: {
    jobId: string;
    organizationId: string;
    type: JobEventType;
    payload: Record<string, unknown>;
  }): Promise<JobEventRecord> {
    const rows = await this.request('cp_job_events', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        id: randomUUID(),
        job_id: event.jobId,
        organization_id: event.organizationId,
        type: event.type,
        payload: event.payload,
      },
    });
    return eventFromRow(rows[0]);
  }

  async listJobEvents(jobId: string): Promise<JobEventRecord[]> {
    const rows = await this.request('cp_job_events', {
      method: 'GET',
      query: [
        `job_id=eq.${encodeURIComponent(jobId)}`,
        'select=*',
        'order=created_at.asc',
      ],
    });
    return rows.map(eventFromRow);
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
    const rows = await this.request('cp_approval_gates', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        id: randomUUID(),
        organization_id: gate.organizationId,
        job_id: gate.jobId,
        lead_id: gate.leadId,
        type: gate.type,
        title: gate.title,
        details: gate.details,
        evidence: gate.evidence,
        requested_by: gate.requestedBy,
        status: 'pending',
      },
    });
    return gateFromRow(rows[0]);
  }

  async getApprovalGate(id: string): Promise<ApprovalGateRecord | null> {
    const rows = await this.request('cp_approval_gates', {
      method: 'GET',
      query: [`id=eq.${encodeURIComponent(id)}`, 'select=*'],
    });
    return rows[0] ? gateFromRow(rows[0]) : null;
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
    const rows = await this.request('cp_approval_gates', {
      method: 'PATCH',
      prefer: 'return=representation',
      query: [
        `id=eq.${encodeURIComponent(id)}`,
        'status=eq.pending',
      ],
      body: {
        status: resolution.status,
        resolved_by: resolution.resolvedBy,
        resolved_at: resolution.resolvedAt ?? new Date().toISOString(),
        resolution: resolution.resolution,
      },
    });
    if (rows.length === 0) {
      throw new Error(`Gate de aprovação não encontrado ou já resolvido: ${id}`);
    }
    return gateFromRow(rows[0]);
  }

  async listApprovalGates(
    organizationId: string,
    filter?: { status?: ApprovalStatus; leadId?: string }
  ): Promise<ApprovalGateRecord[]> {
    const query = [`organization_id=eq.${encodeURIComponent(organizationId)}`, 'select=*'];
    if (filter?.status) query.push(`status=eq.${encodeURIComponent(filter.status)}`);
    if (filter?.leadId) query.push(`lead_id=eq.${encodeURIComponent(filter.leadId)}`);
    query.push('order=requested_at.desc');
    const rows = await this.request('cp_approval_gates', { method: 'GET', query });
    return rows.map(gateFromRow);
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
    const nowIso = new Date().toISOString();
    const lastCheckedAt = input.lastCheckedAt ?? nowIso;

    if (input.leadId !== undefined) {
      // lead_id conhecido → upsert completo por (organization_id, resend_id).
      const rows = await this.request('cp_email_outreach', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=representation',
        body: {
          id: randomUUID(),
          organization_id: input.organizationId,
          resend_id: input.resendId,
          lead_id: input.leadId,
          to_address: input.toAddress,
          subject: input.subject,
          status: input.status,
          sent_at: input.sentAt,
          last_checked_at: lastCheckedAt,
          updated_at: nowIso,
        },
      });
      return emailOutreachFromRow(rows[0]);
    }

    // lead_id desconhecido: PATCH primeiro para não zerar associação existente.
    const patched = await this.request('cp_email_outreach', {
      method: 'PATCH',
      prefer: 'return=representation',
      query: [
        `organization_id=eq.${encodeURIComponent(input.organizationId)}`,
        `resend_id=eq.${encodeURIComponent(input.resendId)}`,
      ],
      body: {
        to_address: input.toAddress,
        subject: input.subject,
        status: input.status,
        sent_at: input.sentAt,
        last_checked_at: lastCheckedAt,
        updated_at: nowIso,
      },
    });
    if (patched.length > 0) {
      return emailOutreachFromRow(patched[0]);
    }
    const inserted = await this.request('cp_email_outreach', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        id: randomUUID(),
        organization_id: input.organizationId,
        resend_id: input.resendId,
        to_address: input.toAddress,
        subject: input.subject,
        status: input.status,
        sent_at: input.sentAt,
        last_checked_at: lastCheckedAt,
      },
    });
    return emailOutreachFromRow(inserted[0]);
  }

  async listEmailOutreach(
    organizationId: string,
    filter?: { nonTerminalOnly?: boolean; limit?: number }
  ): Promise<EmailOutreachRecord[]> {
    const query = [`organization_id=eq.${encodeURIComponent(organizationId)}`, 'select=*'];
    if (filter?.nonTerminalOnly) {
      query.push('status=not.in.("delivered","opened","bounced","complained")');
    }
    query.push('order=created_at.desc');
    if (filter?.limit) {
      query.push(`limit=${filter.limit}`);
    }
    const rows = await this.request('cp_email_outreach', { method: 'GET', query });
    return rows.map(emailOutreachFromRow);
  }

  // ─── CrmPort (tabelas reais: leads + cp_lead_state + crm_activities) ────────

  private async fetchLeadBundle(id: string): Promise<LeadRecord | null> {
    const leadRows = await this.request('leads', {
      method: 'GET',
      query: [`id=eq.${encodeURIComponent(id)}`, 'select=*'],
    });
    if (leadRows.length === 0) {
      return null;
    }
    const stateRows = await this.request('cp_lead_state', {
      method: 'GET',
      query: [`lead_id=eq.${encodeURIComponent(id)}`, 'select=*'],
    });
    const activityRows = await this.request('crm_activities', {
      method: 'GET',
      query: [
        `lead_id=eq.${encodeURIComponent(id)}`,
        'type=eq.Email',
        'select=created_at',
        'order=created_at.desc',
        'limit=1',
      ],
    });
    return leadFromRows(
      leadRows[0],
      stateRows[0],
      activityRows[0] ? String(activityRows[0].created_at) : undefined,
    );
  }

  async getLeadById(id: string): Promise<LeadRecord | null> {
    return this.fetchLeadBundle(id);
  }

  async listLeads(organizationId: string, filter?: { status?: LeadStatus[] }): Promise<LeadRecord[]> {
    const leadRows = await this.request('leads', {
      method: 'GET',
      query: [
        `organization_id=eq.${encodeURIComponent(organizationId)}`,
        'select=*',
        'order=created_at.desc',
      ],
    });
    if (leadRows.length === 0) {
      return [];
    }
    const stateRows = await this.request('cp_lead_state', {
      method: 'GET',
      query: [`organization_id=eq.${encodeURIComponent(organizationId)}`, 'select=*'],
    });
    const stateByLead = new Map(stateRows.map((row) => [String(row.lead_id), row]));
    const activityRows = await this.request('crm_activities', {
      method: 'GET',
      query: [
        `organization_id=eq.${encodeURIComponent(organizationId)}`,
        'type=eq.Email',
        'select=lead_id,created_at',
      ],
    });
    const lastEmailByLead = new Map<string, string>();
    for (const row of activityRows) {
      const leadId = String(row.lead_id);
      const at = String(row.created_at);
      const prev = lastEmailByLead.get(leadId);
      if (!prev || at > prev) {
        lastEmailByLead.set(leadId, at);
      }
    }
    const all = leadRows.map((row) =>
      leadFromRows(
        row,
        stateByLead.get(String(row.id)),
        lastEmailByLead.get(String(row.id)),
      ),
    );
    if (!filter?.status?.length) {
      return all;
    }
    const wanted = new Set(filter.status);
    return all.filter((lead) => wanted.has(lead.status));
  }

  async createLead(input: CreateLeadInput): Promise<LeadRecord> {
    const id = randomUUID();
    const pipeline = input.status ?? 'new';
    // Constraints reais da tabela `leads`:
    // - name NOT NULL (fallback: nome da empresa)
    // - estimated_value NOT NULL CHECK >= 0 (fallback: 0)
    // - created_by FK → auth.users(id) (só UUID válido; senão null)
    // - source CHECK IN ('Website','Indicação','Outbound','Evento','Parceiro')
    const ALLOWED_SOURCES = ['Website', 'Indicação', 'Outbound', 'Evento', 'Parceiro'] as const;
    const source = ALLOWED_SOURCES.includes(input.source as (typeof ALLOWED_SOURCES)[number])
      ? input.source
      : 'Outbound';
    const createdBy =
      input.requestedBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestedBy)
        ? input.requestedBy
        : null;
    await this.request('leads', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        id,
        organization_id: input.organizationId,
        name: input.contactName ?? input.companyName,
        company: input.companyName,
        email: input.contactEmail,
        source,
        notes: input.notes,
        segment: input.segment,
        tier: input.tier,
        estimated_value: input.estimatedValue ?? 0,
        location: input.location,
        status: pipelineToBusinessStatus(pipeline),
        created_by: createdBy,
      },
    });
    await this.request('cp_lead_state', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        lead_id: id,
        organization_id: input.organizationId,
        status: pipeline,
      },
    });
    const created = await this.fetchLeadBundle(id);
    if (!created) {
      throw new Error(`Lead criado não encontrado: ${id}`);
    }
    return created;
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
    const current = await this.fetchLeadBundle(id);
    if (!current) {
      throw new Error(`Lead não encontrado: ${id}`);
    }

    // 1) Tabela real `leads`: status de negócio + notes.
    const leadBody: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.status !== undefined) {
      leadBody.status = pipelineToBusinessStatus(patch.status);
    }
    if (patch.notes !== undefined) {
      leadBody.notes = patch.notes;
    }
    await this.request('leads', {
      method: 'PATCH',
      prefer: 'return=representation',
      query: [`id=eq.${encodeURIComponent(id)}`],
      body: leadBody,
    });

    // 2) cp_lead_state: estado do pipeline (fonte da verdade do Control Plane).
    const stateBody: Record<string, unknown> = {
      lead_id: id,
      organization_id: current.organizationId,
      updated_at: new Date().toISOString(),
    };
    if (patch.status !== undefined) stateBody.status = patch.status;
    if (patch.score !== undefined) stateBody.score = patch.score;
    if (patch.scoreRationale !== undefined) stateBody.score_rationale = patch.scoreRationale;
    if (patch.research !== undefined) stateBody.research = patch.research;
    if (patch.approachDraft !== undefined) stateBody.approach_draft = patch.approachDraft;
    if (patch.followUpDraft !== undefined) stateBody.follow_up_draft = patch.followUpDraft;
    await this.request('cp_lead_state', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: stateBody,
    });

    const updated = await this.fetchLeadBundle(id);
    if (!updated) {
      throw new Error(`Lead não encontrado após update: ${id}`);
    }
    return updated;
  }

  async logActivity(input: LogActivityInput): Promise<CrmActivityRecord> {
    const rows = await this.request('crm_activities', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        id: randomUUID(),
        organization_id: input.organizationId,
        lead_id: input.leadId,
        user_id: input.actorUserId,
        type: input.type,
        summary: input.summary,
        details: input.details,
        due_date: input.dueDate,
        completed_at: input.completedAt ?? null,
      },
    });
    const row = rows[0];
    return {
      id: String(row.id),
      organizationId: String(row.organization_id),
      leadId: String(row.lead_id),
      type: String(row.type),
      summary: String(row.summary),
      details: (row.details ?? undefined) as string | undefined,
      dueDate: (row.due_date ?? undefined) as string | undefined,
      completedAt: (row.completed_at ?? null) as string | null,
      createdAt: String(row.created_at),
    };
  }
}
