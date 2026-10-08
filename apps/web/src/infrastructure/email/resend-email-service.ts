import { getSupabaseAdmin } from '@/infrastructure/persistence/supabase-admin';
import { Resend } from 'resend';
import { PROD_ORGANIZATION_ID } from '@/shared/supabase';
import { JobEventType } from '@/domain/company';

export const DEFAULT_RESEND_API_KEY =
  process.env.RESEND_API_KEY || 're_ieVzmFiy_FX8qA9UWrqsgyPZPkmXojD2h';

export const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM || 'Kaide <onboarding@resend.dev>';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
  jobId: string;
  draftId?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function recordJobEvent(
  jobId: string,
  eventType: JobEventType,
  payload: Record<string, any>
): Promise<void> {
  const timestamp = new Date().toISOString();
  const eventPayload = {
    organization_id: PROD_ORGANIZATION_ID,
    job_id: jobId,
    event_type: eventType,
    payload,
    created_at: timestamp,
  };

  try {
    const { error } = await getSupabaseAdmin().from('cp_job_events').insert(eventPayload);
    if (error) throw error;
  } catch {
    // If cp_job_events table is not yet migrated in Supabase, persist in audit_logs
    try {
      await getSupabaseAdmin().from('audit_logs').insert({
        organization_id: PROD_ORGANIZATION_ID,
        action: `CP_EVENT:${eventType}`,
        target: jobId,
        success: true,
        details: {
          jobId,
          eventType,
          ...payload,
        },
        created_at: timestamp,
      });
    } catch {
      // Non-blocking telemetry
    }
  }
}

export class ResendEmailService {
  private readonly client: Resend;
  private readonly from: string;

  constructor(apiKey: string = DEFAULT_RESEND_API_KEY, from: string = DEFAULT_FROM_EMAIL) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async sendFollowupEmail(params: SendEmailParams): Promise<EmailDispatchResult> {
    try {
      const response = await this.client.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        text: params.body,
        html: params.html || `<pre style="font-family: inherit; white-space: pre-wrap;">${params.body}</pre>`,
      });

      if (response.error) {
        console.warn('[ResendEmailService] Email dispatch error:', response.error);
        await recordJobEvent(params.jobId, 'email.bounced', {
          to: params.to,
          subject: params.subject,
          error: response.error.message,
          draftId: params.draftId,
        });

        return {
          success: false,
          error: response.error.message,
        };
      }

      const messageId = response.data?.id;

      await recordJobEvent(params.jobId, 'email.sent', {
        to: params.to,
        subject: params.subject,
        messageId,
        draftId: params.draftId,
      });

      return {
        success: true,
        messageId,
      };
    } catch (err: any) {
      console.warn('[ResendEmailService] Unexpected dispatch failure:', err?.message);
      await recordJobEvent(params.jobId, 'email.bounced', {
        to: params.to,
        subject: params.subject,
        error: err?.message || String(err),
        draftId: params.draftId,
      });

      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }

  /**
   * Syncs email statuses within a specified lookback window (default 24h).
   * Fetches new messages from Resend and re-checks delivery status.
   */
  async syncRecentEmails(windowHours = 24): Promise<{ syncedCount: number; bouncedCount: number }> {
    let syncedCount = 0;
    let bouncedCount = 0;

    try {
      const listResponse = await this.client.emails.list();
      if (listResponse.error) {
        console.warn('[ResendEmailService] Sync window list error:', listResponse.error);
        return { syncedCount, bouncedCount };
      }
      const emails = (listResponse.data as any)?.data || [];
      const cutoffTime = new Date(Date.now() - windowHours * 3600 * 1000);

      for (const email of emails) {
        const createdAt = email.created_at ? new Date(email.created_at) : new Date();
        if (createdAt >= cutoffTime) {
          try {
            const detailResponse = await this.client.emails.get(email.id);
            const detail = detailResponse.data as any;
            const lastEvent = detail?.last_event || 'sent';

            if (lastEvent === 'bounced' || lastEvent === 'complained') {
              bouncedCount++;
              await recordJobEvent('cron-sync-resend', 'email.bounced', {
                emailId: email.id,
                to: detail?.to,
                status: lastEvent,
              });
            } else {
              syncedCount++;
              await recordJobEvent('cron-sync-resend', 'email.synced', {
                emailId: email.id,
                to: detail?.to,
                status: lastEvent,
              });
            }
          } catch {
            // Safe per-item fallback
          }
        }
      }
    } catch (err) {
      console.warn('[ResendEmailService] Sync window error:', err);
    }

    return { syncedCount, bouncedCount };
  }
}

export const defaultResendEmailService = new ResendEmailService();
