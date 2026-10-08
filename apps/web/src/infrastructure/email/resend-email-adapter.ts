// Adapter (ADR-0032): Resend via SDK oficial npm `resend`.
// O SDK retorna {data, error} sem lançar — erros são convertidos em throw
// para o use case decidir (degradação manual, nunca perde a aprovação).

import { Resend } from 'resend';
import type {
  EmailOutreachPort,
  ProviderEmailInfo,
  SendEmailInput,
} from '@/application/ports/email-outreach-port';
import { normalizeEmailStatus } from '@/domain/control-plane';

export interface ResendEmailAdapterConfig {
  readonly apiKey: string;
  /** Ex.: 'ChronoKairo <contato@chronokairo.com.br>' */
  readonly fromEmail: string;
}

/** Item de e-mail do Resend — campos que usamos (to pode ser array). */
interface ResendEmailItem {
  id: string;
  to?: string[] | string | null;
  subject?: string | null;
  created_at?: string | null;
  last_event?: string | null;
}

interface ResendListPayload {
  object?: string;
  has_more?: boolean;
  data?: ResendEmailItem[];
}

function firstRecipient(to: string[] | string | null | undefined): string {
  if (Array.isArray(to)) {
    return to[0] ?? '';
  }
  return to ?? '';
}

function toInfo(item: ResendEmailItem): ProviderEmailInfo {
  return {
    resendId: item.id,
    to: firstRecipient(item.to),
    subject: item.subject ?? '',
    status: normalizeEmailStatus(item.last_event),
    createdAt: item.created_at ?? new Date().toISOString(),
  };
}

/** SDK pode devolver {data: {data: [...]}} ou {data: [...]} — normaliza. */
function extractList(payload: unknown): { items: ResendEmailItem[]; hasMore: boolean } {
  if (Array.isArray(payload)) {
    return { items: payload as ResendEmailItem[], hasMore: false };
  }
  const list = (payload ?? {}) as ResendListPayload;
  return {
    items: Array.isArray(list.data) ? list.data : [],
    hasMore: Boolean(list.has_more),
  };
}

export function createResendEmailAdapter(config: ResendEmailAdapterConfig): EmailOutreachPort {
  const resend = new Resend(config.apiKey);

  return {
    isConfigured() {
      return Boolean(config.apiKey);
    },

    async sendEmail(input: SendEmailInput): Promise<ProviderEmailInfo> {
      const { data, error } = await resend.emails.send({
        from: config.fromEmail,
        to: input.to,
        subject: input.subject,
        text: input.text,
      });
      if (error || !data?.id) {
        const message = error?.message ?? 'Resend não retornou id de e-mail';
        throw new Error(`Falha ao enviar e-mail via Resend: ${message}`);
      }
      return {
        resendId: data.id,
        to: input.to,
        subject: input.subject,
        status: 'queued',
        createdAt: new Date().toISOString(),
      };
    },

    async getEmail(resendId: string): Promise<ProviderEmailInfo | null> {
      const { data, error } = await resend.emails.get(resendId);
      if (error || !data) {
        return null;
      }
      return toInfo(data as ResendEmailItem);
    },

    async listRecentEmails(windowHours: number, limit = 100): Promise<ProviderEmailInfo[]> {
      const out: ProviderEmailInfo[] = [];
      const windowStartMs = Date.now() - windowHours * 60 * 60 * 1000;

      // Pagina com cursor UUID (`after` = id do último item); a API rejeita
      // valores não-UUID. A lista vem ordenada por created_at desc — paramos
      // ao cruzar o início da janela ou esgotar páginas (máx. 5 defensivo).
      let after: string | undefined;
      for (let page = 0; page < 5 && out.length < limit; page++) {
        const { data, error } = await resend.emails.list(
          after ? { after, limit: 100 } : { limit: 100 },
        );
        if (error) {
          throw new Error(`Falha ao listar e-mails do Resend: ${error.message}`);
        }
        const { items, hasMore } = extractList(data);
        if (items.length === 0) {
          break;
        }
        for (const item of items) {
          const createdAtMs = item.created_at ? Date.parse(item.created_at) : NaN;
          if (!Number.isNaN(createdAtMs) && createdAtMs < windowStartMs) {
            return out.slice(0, limit);
          }
          out.push(toInfo(item));
        }
        if (!hasMore) {
          break;
        }
        after = items[items.length - 1]?.id;
        if (!after) {
          break;
        }
      }
      return out.slice(0, limit);
    },
  };
}
