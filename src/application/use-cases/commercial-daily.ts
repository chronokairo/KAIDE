import {
  QUALIFY_SCORE_THRESHOLD,
  buildApproachDraft,
  buildFollowUpDraft,
  scoreLead,
} from '../../domain/control-plane';
import type { JobHandlerContext, JobHandlerResult } from './run-job-by-type';
import { prepareFollowUps } from './prepare-followups';
import { syncEmailOutreach } from './sync-email-outreach';

/**
 * commercial.daily — varredura diária do CRM:
 * 1. lista leads `new`, pesquisa cada empresa, pontua com regra determinística,
 *    atualiza o CRM e abre gate `outbound_contact` para qualificados;
 * 2. prepara follow-ups de leads contatados FORA da cadência (7 dias);
 * 3. sincroniza e-mails de outreach do Resend para o Supabase (janela 24h);
 * 4. resume o pipeline e os gates pendentes.
 * Contato externo só acontece com aprovação humana explícita.
 */
export async function runCommercialDailyJob(ctx: JobHandlerContext): Promise<JobHandlerResult> {
  const { crm, store, organizationId, job } = ctx;

  const newLeads = await crm.listLeads(organizationId, { status: ['new'] });

  const qualified: string[] = [];
  const disqualified: string[] = [];
  const researchFailed: string[] = [];
  const approvalsCreated: string[] = [];

  for (const lead of newLeads) {
    await crm.updateLead(lead.id, { status: 'researching' });

    let research;
    try {
      research = await ctx.research.researchCompany(lead);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await crm.updateLead(lead.id, { status: 'new' });
      await ctx.emit('lead.research_failed', {
        leadId: lead.id,
        companyName: lead.companyName,
        error: message,
      });
      researchFailed.push(lead.companyName);
      continue;
    }

    const { score, rationale, qualified: isQualified } = scoreLead(research, lead);
    const approachDraft = buildApproachDraft(lead, research);
    const followUpDraft = buildFollowUpDraft(lead);

    await crm.updateLead(lead.id, {
      research,
      score,
      scoreRationale: rationale,
      approachDraft,
      followUpDraft,
      status: isQualified ? 'qualified' : 'disqualified',
    });
    await ctx.emit('lead.researched', {
      leadId: lead.id,
      companyName: lead.companyName,
      score,
      qualified: isQualified,
      sources: research.sources.length,
    });
    await ctx.emit('crm.lead.updated', {
      leadId: lead.id,
      status: isQualified ? 'qualified' : 'disqualified',
      score,
    });

    if (isQualified) {
      qualified.push(lead.companyName);
      const gate = await store.createApprovalGate({
        organizationId,
        jobId: job.id,
        leadId: lead.id,
        type: 'outbound_contact',
        title: `Aprovação de contato externo — ${lead.companyName}`,
        details:
          `Lead qualificado (score ${score}/100, mínimo ${QUALIFY_SCORE_THRESHOLD}). ` +
          `Aprovar autoriza o envio da abordagem para ${lead.contactEmail ?? 'o contato do lead'}.`,
        evidence: [
          `Score ${score}/100 — ${rationale.join('; ')}`,
          ...research.sources.map((s) => `${s.title} — ${s.url}`),
        ],
        requestedBy: 'commercial',
      });
      await crm.updateLead(lead.id, { status: 'awaiting_contact_approval' });
      await ctx.emit('approval.requested', {
        approvalId: gate.id,
        leadId: lead.id,
        companyName: lead.companyName,
        type: gate.type,
      });
      approvalsCreated.push(gate.id);
    } else {
      disqualified.push(lead.companyName);
    }
  }

  // ── Passo 2: follow-ups devidos (leads contatados fora da cadência de 7 dias) ──
  const contactedLeads = await crm.listLeads(organizationId, { status: ['contacted'] });
  const followUps = await prepareFollowUps(ctx, contactedLeads);

  // ── Passo 3: sync Resend → Supabase (e-mails novos das últimas 24h) ──
  const emailSync = await syncEmailOutreach(ctx);

  // ── Passo 4: resumo do pipeline ──
  const allLeads = await crm.listLeads(organizationId);
  const pipeline: Record<string, number> = {};
  for (const lead of allLeads) {
    pipeline[lead.status] = (pipeline[lead.status] ?? 0) + 1;
  }
  const pendingApprovals = await store.listApprovalGates(organizationId, { status: 'pending' });

  const summary =
    `Novos: ${newLeads.length} (${qualified.length} qualificado(s), ${disqualified.length} ` +
    `desqualificado(s), ${researchFailed.length} falha(s) de pesquisa). ` +
    `Follow-ups devidos: ${followUps.followUpsDue.length} de ${contactedLeads.length} ` +
    `contatado(s) (${followUps.skippedByCadence} dentro da cadência de 7 dias). ` +
    (emailSync.configured
      ? `Sync Resend (24h): ${emailSync.fetched} novo(s), ${emailSync.saved} salvo(s), ` +
        `${emailSync.rechecked} re-checado(s), ${emailSync.delivered} entregue(s), ` +
        `${emailSync.bounced} bounce(s).`
      : 'Sync Resend: não configurado (RESEND_API_KEY ausente). ') +
    `Gates pendentes: ${pendingApprovals.length}.`;

  return {
    result: {
      newLeads: newLeads.length,
      qualified,
      disqualified,
      researchFailed,
      approvalsCreated,
      followUps,
      emailSync,
      pipeline,
      pendingApprovals: pendingApprovals.length,
      summary,
    },
    costUsd: 0,
  };
}
