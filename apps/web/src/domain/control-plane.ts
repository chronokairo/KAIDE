/**
 * Domínio do Control Plane (ADR-0028/0032): Jobs, event log append-only,
 * leads do CRM e gates de aprovação humana.
 * Arquitetura Hexagonal: Domínio Puro — sem React, Next, Supabase ou SDKs.
 */

import type { AgentRole } from './company';

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/** Catálogo de automações (docs/copilot-automations.md). */
export type ControlPlaneJobType =
  | 'commercial.daily'
  | 'commercial.followup'
  | 'analyst.discover'
  | 'coder.implement'
  | 'qa.review_pr'
  | 'devops.deploy'
  | 'support.triage'
  | 'finance.nightly'
  | 'coder.maintenance';

export type JobStatus = 'queued' | 'in_progress' | 'completed' | 'failed';

export interface JobRecord {
  id: string;
  organizationId: string;
  type: ControlPlaneJobType;
  /** Chave de idempotência: reexecutar com a mesma chave não duplica efeitos. */
  idempotencyKey: string;
  status: JobStatus;
  attempts: number;
  input: Record<string, unknown>;
  /** Quem disparou (automação, endpoint, humano). */
  requestedBy?: string;
  result?: Record<string, unknown>;
  error?: string;
  costUsd: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Event log (append-only) ──────────────────────────────────────────────────

export type JobEventType =
  | 'job.created'
  | 'job.started'
  | 'job.completed'
  | 'job.failed'
  | 'lead.researched'
  | 'lead.research_failed'
  | 'crm.lead.updated'
  | 'approval.requested'
  | 'approval.resolved'
  | 'email.sent'
  | 'email.send_failed'
  | 'email.synced'
  | 'email.bounced';

export interface JobEventRecord {
  id: string;
  jobId: string;
  organizationId: string;
  type: JobEventType;
  payload: Record<string, unknown>;
  createdAt: string;
}

// ─── CRM — Leads ──────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'researching'
  | 'qualified'
  | 'disqualified'
  | 'awaiting_contact_approval'
  | 'contact_authorized'
  | 'contact_rejected'
  | 'contacted';

export interface LeadResearchSource {
  title: string;
  url: string;
}

export interface LeadResearch {
  summary: string;
  sector?: string;
  sizeHint?: string;
  signals: string[];
  sources: LeadResearchSource[];
  researchedAt: string;
}

export interface LeadRecord {
  id: string;
  organizationId: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactRole?: string;
  /** De onde o lead veio (site, indicação, evento, inbound…). */
  source?: string;
  notes?: string;
  status: LeadStatus;
  score?: number;
  scoreRationale?: string[];
  research?: LeadResearch;
  /** Rascunho de abordagem — envio exige aprovação humana. */
  approachDraft?: string;
  followUpDraft?: string;
  /** Contexto do CRM real (tabela `leads` da plataforma). */
  segment?: string;
  tier?: 'A' | 'B' | 'C';
  estimatedValue?: number;
  location?: string;
  priorityOrder?: number;
  /** Último contato registrado (ex.: e-mail em crm_activities). */
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── E-mail outreach (Resend) ──────────────────────────────────────────────────

/** Status de entrega normalizado a partir do `last_event` do Resend. */
export type EmailOutreachStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'bounced'
  | 'complained'
  | 'unknown';

export interface EmailOutreachRecord {
  id: string;
  organizationId: string;
  leadId?: string;
  resendId: string;
  toAddress: string;
  subject: string;
  status: EmailOutreachStatus;
  sentAt?: string;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Janela de sync: o job diário só busca no Resend e-mails novos das últimas 24h. */
export const EMAIL_SYNC_WINDOW_HOURS = 24;

/** Status a partir dos quais não vale a pena re-checar no Resend. */
export function isTerminalEmailStatus(status: EmailOutreachStatus): boolean {
  return (
    status === 'delivered' ||
    status === 'opened' ||
    status === 'bounced' ||
    status === 'complained'
  );
}

/** Normaliza o `last_event` do Resend para o status do Control Plane. */
export function normalizeEmailStatus(lastEvent: string | null | undefined): EmailOutreachStatus {
  switch ((lastEvent ?? '').toLowerCase()) {
    case 'queued':
    case 'delivery_delayed':
      return 'queued';
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'opened':
      return 'opened';
    case 'bounced':
      return 'bounced';
    case 'complained':
      return 'complained';
    default:
      return 'unknown';
  }
}

/**
 * Extrai o endereço nu de um recipient — provedores retornam tanto
 * "email@host" quanto "Nome <email@host>" (display name).
 */
export function extractEmailAddress(recipient: string): string {
  const match = /<([^>]+)>/.exec(recipient);
  return (match ? match[1] : recipient).trim().toLowerCase();
}

// ─── Aprovação humana ─────────────────────────────────────────────────────────

export type ApprovalType = 'outbound_contact';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalGateRecord {
  id: string;
  organizationId: string;
  jobId: string;
  leadId: string;
  type: ApprovalType;
  title: string;
  details: string;
  evidence: string[];
  status: ApprovalStatus;
  /** Papel do agente que solicitou (ex.: 'commercial'). */
  requestedBy: AgentRole | string;
  requestedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
}

// ─── Regras puras ─────────────────────────────────────────────────────────────

/** Operação: retry máximo de 3 tentativas com backoff; depois, failed + escalar. */
export const MAX_JOB_ATTEMPTS = 3;

/** Score mínimo para qualificar um lead (0–100). */
export const QUALIFY_SCORE_THRESHOLD = 60;

/** Cadência mínima entre contatos de um lead (dias) antes de um novo follow-up. */
export const FOLLOWUP_MIN_INTERVAL_DAYS = 7;

/** Follow-up é devido quando nunca houve contato ou o último passou da cadência. */
export function isFollowUpDue(lead: Pick<LeadRecord, 'lastContactedAt'>, now: Date): boolean {
  if (!lead.lastContactedAt) {
    return true;
  }
  const last = Date.parse(lead.lastContactedAt);
  if (Number.isNaN(last)) {
    return true;
  }
  return now.getTime() - last >= FOLLOWUP_MIN_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
}

export function isTerminalJobStatus(status: JobStatus): boolean {
  return status === 'completed';
}

export function canRetryJob(job: JobRecord): boolean {
  return job.status === 'failed' && job.attempts < MAX_JOB_ATTEMPTS;
}

/**
 * Chave de idempotência para jobs periódicos: `tipo:YYYY-MM-DD` (UTC).
 * Reexecutar o mesmo job no mesmo dia não duplica efeitos.
 */
export function buildPeriodicIdempotencyKey(type: ControlPlaneJobType, now: Date): string {
  const date = now.toISOString().slice(0, 10);
  return `${type}:${date}`;
}

export interface LeadScore {
  score: number;
  rationale: string[];
  qualified: boolean;
}

/**
 * Pontuação determinística de fit a partir da pesquisa e dos dados do lead.
 * Nada de LLM: regra auditável, testável e reproduzível.
 */
export function scoreLead(
  research: LeadResearch,
  lead: Pick<LeadRecord, 'contactEmail' | 'contactRole' | 'tier'>
): LeadScore {
  let score = 40;
  const rationale: string[] = ['base 40 (lead inbound registrado no CRM)'];

  if (lead.tier === 'A') {
    score += 10;
    rationale.push('+10 tier A (prioridade comercial alta)');
  } else if (lead.tier === 'B') {
    score += 5;
    rationale.push('+5 tier B (prioridade comercial média)');
  }

  if (research.sources.length >= 3) {
    score += 15;
    rationale.push(`+15 presença pública confirmada (${research.sources.length} fontes)`);
  } else if (research.sources.length > 0) {
    score += 5;
    rationale.push(`+5 presença pública limitada (${research.sources.length} fonte(s))`);
  }

  if (research.sector) {
    score += 10;
    rationale.push(`+10 setor identificado: ${research.sector}`);
  }

  if (research.sizeHint) {
    score += 5;
    rationale.push(`+5 porte estimado: ${research.sizeHint}`);
  }

  const seniorRole = (lead.contactRole ?? '').toLowerCase();
  if (/(diretor|diretora|ceo|cto|cio|sócio|socio|founder|gestor|gerente|head)/.test(seniorRole)) {
    score += 10;
    rationale.push(`+10 contato com poder de decisão (${lead.contactRole})`);
  }

  const email = lead.contactEmail ?? '';
  if (email && !/(gmail|hotmail|outlook|yahoo|icloud)\./i.test(email.split('@')[1] ?? '')) {
    score += 10;
    rationale.push('+10 e-mail corporativo (domínio próprio)');
  }

  if (research.signals.length >= 3) {
    score += 10;
    rationale.push(`+10 sinais de dor/orportunidade detectados (${research.signals.length})`);
  }

  score = Math.min(100, score);
  return { score, rationale, qualified: score >= QUALIFY_SCORE_THRESHOLD };
}

/**
 * Rascunho de abordagem consultiva. Determinístico a partir da pesquisa —
 * o envio continua bloqueado até aprovação humana (gate outbound_contact).
 */
export function buildApproachDraft(
  lead: Pick<LeadRecord, 'contactName' | 'companyName'>,
  research: LeadResearch
): string {
  const contact = lead.contactName ?? 'equipe';
  const topSignals = research.signals.slice(0, 3).join('; ');
  const sector = research.sector ? ` no setor de ${research.sector}` : '';
  return [
    `Olá, ${contact}!`,
    '',
    `Sou da Chronokairo — engenharia de software com time de agentes de IA${sector}.`,
    `Pesquisando sobre a ${lead.companyName}, identifiquei: ${topSignals || 'oportunidades de ganho de eficiência operacional com automação e IA'}.`,
    '',
    'Trabalhamos com discovery estruturado, entrega incremental e evidência verificável em cada etapa (plan → execute → verify → evidence → approval).',
    '',
    'Poderia 15 minutos nesta semana para entender seu contexto e dizer com honestidade se há fit?',
    '',
    '— Chronokairo · Software Engineering AI-first',
  ].join('\n');
}

/** Rascunho de follow-up (reengajamento), também sujeito a aprovação. */
export function buildFollowUpDraft(lead: Pick<LeadRecord, 'contactName' | 'companyName'>): string {
  const contact = lead.contactName ?? 'equipe';
  return [
    `Olá, ${contact}!`,
    '',
    `Passando para retomar a conversa sobre a ${lead.companyName}.`,
    'Se fizer sentido, posso preparar um diagnóstico rápido (sem custo) com 3 oportunidades concretas de automação para o seu operacional.',
    '',
    'Algum momento melhor para falarmos esta semana?',
    '',
    '— Chronokairo · Software Engineering AI-first',
  ].join('\n');
}
