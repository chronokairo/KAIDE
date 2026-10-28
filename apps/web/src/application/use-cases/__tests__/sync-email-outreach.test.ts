import { describe, expect, it } from 'vitest';
import { syncEmailOutreach } from '../sync-email-outreach';
import type { JobHandlerContext } from '../run-job-by-type';
import { FakeCrm, FakeEmailOutreach, FakeJobStore } from './control-plane-fakes';
import type { JobEventType, JobRecord } from '@/domain/control-plane';
import type { ProviderEmailInfo } from '@/application/ports/email-outreach-port';

const ORG = 'org-teste';
const DAY_MS = 24 * 60 * 60 * 1000;

function makeCtx(overrides: Partial<JobHandlerContext> = {}): JobHandlerContext {
  const job: JobRecord = {
    id: 'job-1',
    organizationId: ORG,
    type: 'commercial.daily',
    idempotencyKey: 'commercial.daily:2026-10-03',
    status: 'in_progress',
    attempts: 1,
    input: {},
    costUsd: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return {
    job,
    organizationId: ORG,
    store: new FakeJobStore(),
    crm: new FakeCrm(),
    emailOutreach: new FakeEmailOutreach(),
    research: undefined as never,
    audit: undefined as never,
    now: () => new Date('2026-10-03T12:00:00.000Z'),
    emit: async () => {},
    ...overrides,
  };
}

describe('syncEmailOutreach', () => {
  it('retorna não configurado quando o Resend está ausente', async () => {
    const ctx = makeCtx({ emailOutreach: new FakeEmailOutreach(false) });
    const summary = await syncEmailOutreach(ctx);
    expect(summary.configured).toBe(false);
    expect(summary.fetched).toBe(0);
    expect(summary.saved).toBe(0);
  });

  it('busca e-mails da janela de 24h, casa com lead e salva no store', async () => {
    const crm = new FakeCrm();
    const lead = await crm.createLead({
      organizationId: ORG,
      companyName: 'Acme',
      contactEmail: 'marina@acme.com.br',
    });
    const email = new FakeEmailOutreach();
    // E-mail enviado há 2h (dentro da janela) para o contato do lead.
    await email.sendEmail({
      to: 'Marina <marina@acme.com.br>',
      subject: 'Chronokairo — Acme',
      text: 'abordagem',
      organizationId: ORG,
      leadId: lead.id,
    });

    const ctx = makeCtx({ crm, emailOutreach: email });
    const summary = await syncEmailOutreach(ctx);

    expect(summary.configured).toBe(true);
    expect(summary.fetched).toBe(1);
    expect(summary.saved).toBe(1);
    expect(summary.matchedToLeads).toBe(1);
    expect(ctx.store.emailOutreach).toHaveLength(1);
    expect(ctx.store.emailOutreach[0].leadId).toBe(lead.id);
    expect(ctx.store.emailOutreach[0].status).toBe('queued');
  });

  it('ignora e-mail fora da janela de 24h no list', async () => {
    const email = new FakeEmailOutreach();
    const old = await email.sendEmail({
      to: 'x@y.com',
      subject: 'antigo',
      text: 't',
      organizationId: ORG,
    });
    // Envelhece o e-mail para 3 dias atrás.
    email.emails[0] = { ...old, createdAt: new Date(Date.parse('2026-10-03T12:00:00.000Z') - 3 * DAY_MS).toISOString() };

    const ctx = makeCtx({ emailOutreach: email });
    const summary = await syncEmailOutreach(ctx);
    expect(summary.fetched).toBe(0);
    expect(summary.saved).toBe(0);
  });

  it('re-checa não-terminal antigo salvo e atualiza o status', async () => {
    const store = new FakeJobStore();
    const email = new FakeEmailOutreach();
    // Registro salvo há 3 dias, ainda 'sent' (não-terminal).
    await store.upsertEmailOutreach({
      organizationId: ORG,
      resendId: 're-old-1',
      leadId: 'lead-9',
      toAddress: 'contato@acme.com.br',
      subject: 'Chronokairo — Acme',
      status: 'sent',
      sentAt: new Date(Date.parse('2026-10-03T12:00:00.000Z') - 3 * DAY_MS).toISOString(),
    });
    // O provedor agora reporta delivered.
    email.emails.push({
      resendId: 're-old-1',
      to: 'contato@acme.com.br',
      subject: 'Chronokairo — Acme',
      status: 'delivered',
      createdAt: new Date(Date.parse('2026-10-03T12:00:00.000Z') - 3 * DAY_MS).toISOString(),
    } satisfies ProviderEmailInfo);

    const ctx = makeCtx({ store, emailOutreach: email });
    const summary = await syncEmailOutreach(ctx);

    expect(summary.rechecked).toBe(1);
    expect(summary.delivered).toBe(1);
    expect(store.emailOutreach[0].status).toBe('delivered');
  });

  it('emite evento email.bounced quando re-check confirma bounce', async () => {
    const store = new FakeJobStore();
    const email = new FakeEmailOutreach();
    const events: { type: JobEventType; payload: Record<string, unknown> }[] = [];
    await store.upsertEmailOutreach({
      organizationId: ORG,
      resendId: 're-bounce-1',
      toAddress: 'morto@acme.com.br',
      subject: 'Chronokairo — Acme',
      status: 'sent',
      sentAt: new Date(Date.parse('2026-10-03T12:00:00.000Z') - 5 * DAY_MS).toISOString(),
    });
    email.emails.push({
      resendId: 're-bounce-1',
      to: 'morto@acme.com.br',
      subject: 'Chronokairo — Acme',
      status: 'bounced',
      createdAt: new Date(Date.parse('2026-10-03T12:00:00.000Z') - 5 * DAY_MS).toISOString(),
    } satisfies ProviderEmailInfo);

    const ctx = makeCtx({ store, emailOutreach: email });
    (ctx as unknown as { emit: unknown }).emit = async (type: JobEventType, payload: Record<string, unknown>) => {
      events.push({ type, payload });
    };
    const summary = await syncEmailOutreach(ctx);

    expect(summary.bounced).toBe(1);
    expect(events.some((e) => e.type === 'email.bounced')).toBe(true);
    expect(store.emailOutreach[0].status).toBe('bounced');
  });

  it('não re-checa não-terminal dentro da janela (já vem fresco do list)', async () => {
    const store = new FakeJobStore();
    const email = new FakeEmailOutreach();
    await store.upsertEmailOutreach({
      organizationId: ORG,
      resendId: 're-fresh-1',
      toAddress: 'a@b.com',
      subject: 'recente',
      status: 'sent',
      sentAt: new Date(Date.parse('2026-10-03T12:00:00.000Z') - 2 * 60 * 60 * 1000).toISOString(),
    });

    const ctx = makeCtx({ store, emailOutreach: email });
    const summary = await syncEmailOutreach(ctx);
    expect(summary.rechecked).toBe(0);
  });

  it('emite evento email.synced com o resumo da janela', async () => {
    const email = new FakeEmailOutreach();
    await email.sendEmail({ to: 'a@b.com', subject: 's', text: 't', organizationId: ORG });
    const events: { type: JobEventType; payload: Record<string, unknown> }[] = [];
    const ctx = makeCtx({ emailOutreach: email });
    (ctx as unknown as { emit: unknown }).emit = async (type: JobEventType, payload: Record<string, unknown>) => {
      events.push({ type, payload });
    };

    await syncEmailOutreach(ctx);
    const synced = events.find((e) => e.type === 'email.synced');
    expect(synced).toBeDefined();
    expect(synced?.payload.windowHours).toBe(24);
    expect(synced?.payload.fetched).toBe(1);
  });
});
