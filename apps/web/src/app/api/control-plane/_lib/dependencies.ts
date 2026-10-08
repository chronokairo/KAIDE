// Composição das dependências do Control Plane para as rotas HTTP.
// Arquitetura Hexagonal: a rota (adapter primário) só fala com casos de uso.
// Segredos (service key, Resend) vêm EXCLUSIVAMENTE de variáveis de ambiente
// carregadas de .env.local (gitignored) — nunca hardcoded, nunca no cliente.

import { getAuditAdapter } from '@/infrastructure/audit/logger-audit-adapter';
import { getControlPlaneStore } from '@/infrastructure/persistence';
import { getCompanyResearchAdapter } from '@/infrastructure/research/web-company-research-adapter';
import { createResendEmailAdapter } from '@/infrastructure/email/resend-email-adapter';
import type { EmailOutreachPort } from '@/application/ports/email-outreach-port';
import type { RunJobByTypeDeps } from '@/application/use-cases/run-job-by-type';

/**
 * organizationId validado no servidor — nunca confiar no cliente.
 * Em produção é o UUID real da organização no Supabase (auth.organizations).
 */
export function getOrganizationId(): string {
  const orgId = process.env.CONTROL_PLANE_ORGANIZATION_ID;
  if (!orgId) {
    throw new Error(
      'CONTROL_PLANE_ORGANIZATION_ID não configurado — defina em .env.local (UUID da organização no Supabase).'
    );
  }
  return orgId;
}

/**
 * user_id NOT NULL em crm_activities — ator humano responsável pelas
 * atividades registradas pelo Control Plane (o diretor técnico).
 */
export function getActorUserId(): string {
  const actor = process.env.CONTROL_PLANE_ACTOR_USER_ID;
  if (!actor) {
    throw new Error(
      'CONTROL_PLANE_ACTOR_USER_ID não configurado — defina em .env.local (user_id do diretor no Supabase).'
    );
  }
  return actor;
}

/** Resend — ausente/desconfigurado degrada para envio manual pós-aprovação. */
export function getEmailOutreach(): EmailOutreachPort | undefined {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return undefined;
  }
  return createResendEmailAdapter({ apiKey, fromEmail });
}

export function getRunJobDeps(): RunJobByTypeDeps {
  const store = getControlPlaneStore();
  return {
    store,
    crm: store,
    research: getCompanyResearchAdapter(),
    audit: getAuditAdapter(),
    emailOutreach: getEmailOutreach(),
  };
}

export function getStore() {
  return getControlPlaneStore();
}

export function getAudit() {
  return getAuditAdapter();
}
