// Porta (ADR-0032): envio e verificação de e-mails de outreach via Resend.
// O envio só acontece APÓS aprovação humana (gate outbound_contact).
// Os dados buscados são persistidos no Supabase (cp_email_outreach) — o job
// diário só re-checa no Resend o que é novo (janela 24h) ou não-terminal.

import type { EmailOutreachStatus } from '@/domain/control-plane';

export interface SendEmailInput {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly organizationId: string;
  readonly leadId?: string;
}

/** Informação de e-mail vinda do provedor (Resend). */
export interface ProviderEmailInfo {
  readonly resendId: string;
  readonly to: string;
  readonly subject: string;
  readonly status: EmailOutreachStatus;
  readonly createdAt: string;
}

export interface EmailOutreachPort {
  /** true quando RESEND_API_KEY está configurada (habilita envio pós-aprovação). */
  isConfigured(): boolean;
  /** Envia o e-mail — chamado somente após gate aprovado. */
  sendEmail(input: SendEmailInput): Promise<ProviderEmailInfo>;
  /** Recupera um e-mail específico (status de entrega atual). */
  getEmail(resendId: string): Promise<ProviderEmailInfo | null>;
  /**
   * Lista e-mails criados nas últimas `windowHours` horas (novos do provedor).
   * Pagina internamente até esgotar a janela ou o limite.
   */
  listRecentEmails(windowHours: number, limit?: number): Promise<ProviderEmailInfo[]>;
}
