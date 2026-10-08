// Caso de uso (ADR-0032): preparar follow-ups devidos para leads contatados.
// Compartilhado entre commercial.daily e commercial.followup — a cadência
// (FOLLOWUP_MIN_INTERVAL_DAYS) é a mesma regra de domínio nos dois jobs.

import type { LeadRecord } from '../../domain/control-plane';
import { buildFollowUpDraft, isFollowUpDue } from '../../domain/control-plane';
import type { JobHandlerContext } from './run-job-by-type';

export interface FollowUpOutcome {
  /** Leads dentro da cadência de contato (não mexer). */
  skippedByCadence: number;
  /** Leads com follow-up devido (sem contato há 7+ dias ou nunca). */
  followUpsDue: string[];
  /** Leads com rascunho de follow-up pronto (salvo no CRM). */
  followUpsPrepared: string[];
  /** Gates criados nesta execução (os já pendentes são reaproveitados). */
  approvalsCreated: string[];
}

export async function prepareFollowUps(
  ctx: JobHandlerContext,
  leads: LeadRecord[],
): Promise<FollowUpOutcome> {
  const { crm, store, organizationId, job } = ctx;
  const outcome: FollowUpOutcome = {
    skippedByCadence: 0,
    followUpsDue: [],
    followUpsPrepared: [],
    approvalsCreated: [],
  };

  for (const lead of leads) {
    if (!isFollowUpDue(lead, ctx.now())) {
      outcome.skippedByCadence++;
      continue;
    }

    outcome.followUpsDue.push(lead.companyName);

    const followUpDraft = lead.followUpDraft ?? buildFollowUpDraft(lead);
    await crm.updateLead(lead.id, { followUpDraft });
    await ctx.emit('crm.lead.updated', {
      leadId: lead.id,
      company: lead.companyName,
      followUpDraft: true,
    });

    // Gate já pendente para este lead → não duplicar pedido de aprovação.
    const pendingGates = await store.listApprovalGates(organizationId, {
      leadId: lead.id,
      status: 'pending',
    });
    if (pendingGates.length > 0) {
      outcome.followUpsPrepared.push(lead.companyName);
      continue;
    }

    const gate = await store.createApprovalGate({
      organizationId,
      jobId: job.id,
      leadId: lead.id,
      type: 'outbound_contact',
      title: `Follow-up — ${lead.companyName}`,
      details:
        `Follow-up devido (último contato há 7+ dias ou sem contato registrado). ` +
        `Rascunho pronto no CRM. Aprovação humana obrigatória antes de qualquer envio.`,
      evidence: [
        `Lead: ${lead.companyName} (${lead.contactEmail ?? 'sem e-mail'})`,
        `Rascunho: ${followUpDraft.slice(0, 200)}${followUpDraft.length > 200 ? '…' : ''}`,
      ],
      requestedBy: 'commercial',
    });
    await ctx.emit('approval.requested', {
      approvalId: gate.id,
      leadId: lead.id,
      companyName: lead.companyName,
      type: gate.type,
    });
    outcome.approvalsCreated.push(gate.id);
    outcome.followUpsPrepared.push(lead.companyName);
  }

  return outcome;
}
