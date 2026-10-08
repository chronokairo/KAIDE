// Porta (ADR-0028/0032): CRM de leads do Control Plane. Escopado por organização.
// Integra às tabelas reais da plataforma: `leads` + `crm_activities` (Supabase).

import type { LeadRecord, LeadStatus } from '@/domain/control-plane';

export interface CreateLeadInput {
  organizationId: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactRole?: string;
  source?: string;
  notes?: string;
  /** Contexto comercial do CRM real. */
  segment?: string;
  tier?: 'A' | 'B' | 'C';
  estimatedValue?: number;
  location?: string;
  /** Quem registrou o lead (para auditoria). */
  requestedBy?: string;
  /** Status inicial — default 'new' (o intake não cria leads fora do fluxo). */
  status?: LeadStatus;
}

export interface LogActivityInput {
  organizationId: string;
  leadId: string;
  /** Tipo da atividade no CRM real ('Email', 'Call', 'Meeting', 'Note', 'Task'). */
  type: string;
  summary: string;
  details?: string;
  dueDate?: string;
  /** null = rascunho pendente de envio manual; preenchido = transmitido. */
  completedAt?: string | null;
  /** user_id NOT NULL no CRM real — ator humano responsável. */
  actorUserId: string;
}

export interface CrmActivityRecord {
  id: string;
  organizationId: string;
  leadId: string;
  type: string;
  summary: string;
  details?: string;
  dueDate?: string;
  completedAt?: string | null;
  createdAt: string;
}

export interface CrmPort {
  createLead(input: CreateLeadInput): Promise<LeadRecord>;
  getLeadById(id: string): Promise<LeadRecord | null>;
  listLeads(organizationId: string, filter?: { status?: LeadStatus[] }): Promise<LeadRecord[]>;
  updateLead(
    id: string,
    patch: Partial<
      Pick<
        LeadRecord,
        | 'status'
        | 'score'
        | 'scoreRationale'
        | 'research'
        | 'approachDraft'
        | 'followUpDraft'
        | 'notes'
      >
    >
  ): Promise<LeadRecord>;
  /** Registra atividade no CRM real (crm_activities) — append-only de histórico. */
  logActivity(input: LogActivityInput): Promise<CrmActivityRecord>;
}
