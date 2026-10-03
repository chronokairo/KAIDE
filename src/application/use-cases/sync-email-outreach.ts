// Caso de uso (ADR-0032): sincronizar e-mails de outreach do Resend para o
// Supabase (cp_email_outreach). Dados são SALVOS, não cacheados — o histórico
// de envios fica no banco. Janela de 24h para e-mails novos; não-terminais
// antigos são re-checados individualmente.

import type { EmailOutreachRecord } from '../../domain/control-plane';
import {
  EMAIL_SYNC_WINDOW_HOURS,
  extractEmailAddress,
  isTerminalEmailStatus,
} from '../../domain/control-plane';
import type { JobHandlerContext } from './run-job-by-type';

export interface EmailSyncSummary {
  /** Resend configurado (RESEND_API_KEY presente). */
  configured: boolean;
  /** E-mails novos listados na janela de 24h. */
  fetched: number;
  /** E-mails salvos/atualizados no Supabase. */
  saved: number;
  /** Não-terminais antigos re-checados individualmente. */
  rechecked: number;
  /** Entregues/abertos confirmados nesta execução. */
  delivered: number;
  /** Bounces confirmados nesta execução. */
  bounced: number;
  /** E-mails novos associados a um lead do CRM. */
  matchedToLeads: number;
  /** Erros individuais (não abortam o job). */
  errors: string[];
}

/** Re-checa apenas não-terminais fora da janela — os recentes já vêm frescos do list. */
function needsIndividualRecheck(record: EmailOutreachRecord, windowStartMs: number): boolean {
  if (!record.sentAt) {
    return true;
  }
  const sentMs = Date.parse(record.sentAt);
  if (Number.isNaN(sentMs)) {
    return true;
  }
  return sentMs < windowStartMs;
}

export async function syncEmailOutreach(
  ctx: JobHandlerContext,
): Promise<EmailSyncSummary> {
  const { store, crm, organizationId, emailOutreach, now } = ctx;
  const summary: EmailSyncSummary = {
    configured: false,
    fetched: 0,
    saved: 0,
    rechecked: 0,
    delivered: 0,
    bounced: 0,
    matchedToLeads: 0,
    errors: [],
  };

  if (!emailOutreach?.isConfigured()) {
    return summary;
  }
  summary.configured = true;

  const nowMs = now().getTime();
  const windowStartMs = nowMs - EMAIL_SYNC_WINDOW_HOURS * 60 * 60 * 1000;

  // 1) Re-checar não-terminais salvos (fora da janela de 24h).
  const nonTerminal = await store.listEmailOutreach(organizationId, {
    nonTerminalOnly: true,
    limit: 50,
  });
  for (const record of nonTerminal) {
    if (!needsIndividualRecheck(record, windowStartMs)) {
      continue;
    }
    try {
      const info = await emailOutreach.getEmail(record.resendId);
      if (!info) {
        continue;
      }
      summary.rechecked++;
      await store.upsertEmailOutreach({
        organizationId,
        resendId: record.resendId,
        leadId: record.leadId,
        toAddress: record.toAddress,
        subject: record.subject,
        status: info.status,
        sentAt: record.sentAt,
        lastCheckedAt: now().toISOString(),
      });
      if (info.status === 'delivered' || info.status === 'opened') {
        summary.delivered++;
      }
      if (info.status === 'bounced') {
        summary.bounced++;
        await ctx.emit('email.bounced', {
          resendId: record.resendId,
          leadId: record.leadId,
          to: record.toAddress,
        });
      }
    } catch (error) {
      summary.errors.push(`recheck ${record.resendId}: ${String(error)}`);
    }
  }

  // 2) Novos e-mails da janela de 24h → match com leads → salvar no Supabase.
  try {
    const recent = await emailOutreach.listRecentEmails(EMAIL_SYNC_WINDOW_HOURS, 100);
    summary.fetched = recent.length;

    if (recent.length > 0) {
      const leads = await crm.listLeads(organizationId);
      const leadByEmail = new Map<string, string>();
      for (const lead of leads) {
        if (lead.contactEmail) {
          leadByEmail.set(lead.contactEmail.toLowerCase(), lead.id);
        }
      }

      for (const info of recent) {
        const leadId = leadByEmail.get(extractEmailAddress(info.to));
        if (leadId) {
          summary.matchedToLeads++;
        }
        await store.upsertEmailOutreach({
          organizationId,
          resendId: info.resendId,
          leadId,
          toAddress: info.to,
          subject: info.subject,
          status: info.status,
          sentAt: info.createdAt,
          lastCheckedAt: now().toISOString(),
        });
        summary.saved++;
      }
    }

    await ctx.emit('email.synced', {
      windowHours: EMAIL_SYNC_WINDOW_HOURS,
      fetched: summary.fetched,
      saved: summary.saved,
      rechecked: summary.rechecked,
      delivered: summary.delivered,
      bounced: summary.bounced,
    });
  } catch (error) {
    summary.errors.push(`list recent: ${String(error)}`);
  }

  return summary;
}
