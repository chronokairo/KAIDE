import type { AuditPort } from '../ports/audit-port';
import type { CrmPort } from '../ports/crm-port';
import type { EmailOutreachPort } from '../ports/email-outreach-port';
import type { JobStorePort } from '../ports/control-plane-store-port';
import type { ApprovalGateRecord } from '../../domain/control-plane';
import {
  ApprovalAlreadyResolvedError,
  ApprovalGateNotFoundError,
  LeadValidationError,
} from '../../domain/errors';

export interface ResolveApprovalInput {
  readonly approvalId: string;
  readonly decision: 'approved' | 'rejected';
  readonly resolvedBy: string;
  /** Motivo — obrigatório ao rejeitar. */
  readonly rationale?: string;
}

export interface ResolveApprovalDeps {
  readonly store: JobStorePort;
  readonly crm: CrmPort;
  readonly audit: AuditPort;
  /** Resend — ausente/desconfigurado degrada para envio manual pelo diretor. */
  readonly emailOutreach?: EmailOutreachPort;
  /** user_id NOT NULL em crm_activities — ator humano responsável. */
  readonly actorUserId: string;
  readonly now?: () => Date;
}

/**
 * Gate humano do outbound: a aprovação É a autorização explícita de contato.
 * - Aprovado + Resend configurado + e-mail + rascunho → envia agora, salva o
 *   outreach no Supabase, registra atividade concluída no CRM e move o lead
 *   para `contacted`.
 * - Aprovado sem Resend (ou falha de envio) → atividade de e-mail fica
 *   PENDENTE (completed_at null) para envio manual; lead → `contact_authorized`.
 * - Rejeitado → lead → `contact_rejected`.
 * Eventos append-only + audit em todos os caminhos.
 */
export async function resolveApproval(
  deps: ResolveApprovalDeps,
  input: ResolveApprovalInput,
): Promise<ApprovalGateRecord> {
  const now = deps.now ?? (() => new Date());
  const { store, crm, audit } = deps;

  const gate = await store.getApprovalGate(input.approvalId);
  if (!gate) {
    throw new ApprovalGateNotFoundError(input.approvalId);
  }
  if (gate.status !== 'pending') {
    throw new ApprovalAlreadyResolvedError(input.approvalId);
  }
  if (input.decision === 'rejected' && !input.rationale?.trim()) {
    throw new LeadValidationError('Rejeição exige um motivo (rationale).');
  }

  const resolved = await store.resolveApprovalGate(input.approvalId, {
    status: input.decision,
    resolvedBy: input.resolvedBy,
    resolvedAt: now().toISOString(),
    resolution: input.rationale,
  });

  const lead = await crm.getLeadById(gate.leadId);
  let emailSent = false;
  let sendError: string | undefined;

  if (lead && input.decision === 'approved') {
    const draft = lead.followUpDraft ?? lead.approachDraft;
    const email = deps.emailOutreach;

    if (email?.isConfigured() && lead.contactEmail && draft) {
      try {
        const sent = await email.sendEmail({
          to: lead.contactEmail,
          subject: `ChronoKairo — ${lead.companyName}`,
          text: draft,
          organizationId: gate.organizationId,
          leadId: lead.id,
        });
        emailSent = true;

        await store.upsertEmailOutreach({
          organizationId: gate.organizationId,
          resendId: sent.resendId,
          leadId: lead.id,
          toAddress: sent.to,
          subject: sent.subject,
          status: sent.status,
          sentAt: sent.createdAt,
          lastCheckedAt: now().toISOString(),
        });
        await crm.logActivity({
          organizationId: gate.organizationId,
          leadId: lead.id,
          type: 'Email',
          summary: `Outbound transmitido via Resend — ${lead.companyName}`,
          details: draft,
          completedAt: now().toISOString(),
          actorUserId: deps.actorUserId,
        });
        await crm.updateLead(lead.id, { status: 'contacted' });
        await store.appendJobEvent({
          jobId: gate.jobId,
          organizationId: gate.organizationId,
          type: 'email.sent',
          payload: {
            approvalId: gate.id,
            leadId: lead.id,
            resendId: sent.resendId,
            to: sent.to,
            subject: sent.subject,
          },
        });
      } catch (error) {
        // Envio falhou: a decisão humana fica registrada; degrada para manual.
        sendError = error instanceof Error ? error.message : String(error);
        await crm.logActivity({
          organizationId: gate.organizationId,
          leadId: lead.id,
          type: 'Email',
          summary: `Outbound aprovado — envio manual pendente — ${lead.companyName}`,
          details: draft,
          dueDate: now().toISOString(),
          completedAt: null,
          actorUserId: deps.actorUserId,
        });
        await crm.updateLead(lead.id, { status: 'contact_authorized' });
        await store.appendJobEvent({
          jobId: gate.jobId,
          organizationId: gate.organizationId,
          type: 'email.send_failed',
          payload: {
            approvalId: gate.id,
            leadId: lead.id,
            error: sendError,
          },
        });
      }
    } else {
      // Sem Resend configurado, sem e-mail de contato ou sem rascunho:
      // rascunho fica pendente de envio manual pelo diretor.
      await crm.logActivity({
        organizationId: gate.organizationId,
        leadId: lead.id,
        type: 'Email',
        summary: `Outbound aprovado — envio manual pendente — ${lead.companyName}`,
        details: draft ?? 'Rascunho indisponível; abordagem definida na aprovação.',
        dueDate: now().toISOString(),
        completedAt: null,
        actorUserId: deps.actorUserId,
      });
      await crm.updateLead(lead.id, { status: 'contact_authorized' });
    }
  } else if (lead && input.decision === 'rejected') {
    await crm.updateLead(lead.id, { status: 'contact_rejected' });
  }

  await store.appendJobEvent({
    jobId: gate.jobId,
    organizationId: gate.organizationId,
    type: 'approval.resolved',
    payload: {
      approvalId: gate.id,
      leadId: gate.leadId,
      decision: input.decision,
      resolvedBy: input.resolvedBy,
      rationale: input.rationale,
      emailSent,
    },
  });
  await audit.record({
    organizationId: gate.organizationId,
    actorId: input.resolvedBy,
    action: 'control_plane.approval.resolved',
    metadata: {
      resource: `approval:${gate.id}`,
      decision: input.decision,
      leadId: gate.leadId,
      rationale: input.rationale,
      emailSent,
      sendError,
    },
  });

  return resolved;
}
