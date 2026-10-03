import type { JobHandlerContext, JobHandlerResult } from './run-job-by-type';
import { prepareFollowUps } from './prepare-followups';

/**
 * commercial.followup — prepara follow-up para leads já contatados que estão
 * FORA da cadência mínima (7 dias sem contato). Regenera o rascunho de
 * reengajamento e abre gate de aprovação (um por lead, sem duplicar gates
 * pendentes). Nenhum envio acontece sem aprovação humana.
 */
export async function runCommercialFollowupJob(ctx: JobHandlerContext): Promise<JobHandlerResult> {
  const contactedLeads = await ctx.crm.listLeads(ctx.organizationId, { status: ['contacted'] });
  const outcome = await prepareFollowUps(ctx, contactedLeads);

  const summary =
    contactedLeads.length === 0
      ? 'Nenhum lead no status "contacted" para follow-up.'
      : outcome.followUpsDue.length === 0
        ? `${contactedLeads.length} lead(s) contatado(s) — todos dentro da cadência de 7 dias; nenhum follow-up devido.`
        : `Follow-up devido para ${outcome.followUpsDue.length} de ${contactedLeads.length} ` +
          `lead(s) contatado(s); ${outcome.approvalsCreated.length} nova(s) aprovação(ões) solicitada(s).`;

  return {
    result: {
      contactedLeads: contactedLeads.length,
      ...outcome,
      summary,
    },
    costUsd: 0,
  };
}
