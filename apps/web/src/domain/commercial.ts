/**
 * Entidades de Domínio para o Módulo Comercial da Empresa Virtual Kaide.
 * Arquitetura Hexagonal: Domínio Puro (sem dependências de frameworks, React ou SDKs).
 */

export type LeadStage =
  | 'inbound'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type FollowupPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Lead {
  id: string;
  name: string;
  company: string;
  contactPerson: string;
  contactRole: string;
  email: string;
  phone?: string;
  segment: string;
  score: number;
  stage: LeadStage;
  needsSummary: string;
  lastContactDate: string;
  daysWithoutContact: number;
  priority: FollowupPriority;
  status: 'awaiting_contact' | 'awaiting_followup' | 'in_dialogue' | 'closed';
}

export interface FollowupDraft {
  id: string;
  leadId: string;
  companyName: string;
  recipientName: string;
  recipientRole: string;
  recipientEmail: string;
  channel: 'email' | 'whatsapp';
  subject: string;
  body: string;
  callToAction: string;
  rationale: string;
  complianceCheck: {
    lgpdCompliant: boolean;
    hasOptOut: boolean;
    toneAppropriate: boolean;
  };
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'dispatched';
  createdAt: string;
  dispatchedAt?: string;
}

export interface CommercialFollowupJobResult {
  jobId: string;
  stage: 'commercial';
  leadsScannedCount: number;
  leadsNeedingFollowupCount: number;
  drafts: FollowupDraft[];
  requiresApproval: true;
  approvalGateId: string;
  createdAt: string;
}
