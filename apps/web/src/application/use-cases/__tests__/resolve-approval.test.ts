import { describe, expect, it } from 'vitest';
import { resolveApproval } from '../resolve-approval';
import { FakeAudit, FakeCrm, FakeEmailOutreach, FakeJobStore } from './control-plane-fakes';
import {
  ApprovalAlreadyResolvedError,
  ApprovalGateNotFoundError,
  LeadValidationError,
} from '@/domain/errors';

const ORG = 'org-teste';
const ACTOR = 'user-diretor';

async function setup(opts: { email?: FakeEmailOutreach } = {}) {
  const store = new FakeJobStore();
  const crm = new FakeCrm();
  const audit = new FakeAudit();
  const email = opts.email ?? new FakeEmailOutreach();

  const lead = await crm.createLead({
    organizationId: ORG,
    companyName: 'Acme',
    contactName: 'Marina',
    contactEmail: 'marina@acme.com.br',
    contactRole: 'Diretora de Operações',
  });
  await crm.updateLead(lead.id, {
    approachDraft: 'Olá, Marina! Sou da ChronoKairo…',
  });

  const { job } = await store.createJob({
    organizationId: ORG,
    type: 'commercial.daily',
    idempotencyKey: 'commercial.daily:2026-10-03',
    input: {},
  });
  const gate = await store.createApprovalGate({
    organizationId: ORG,
    jobId: job.id,
    leadId: lead.id,
    type: 'outbound_contact',
    title: 'Aprovar abordagem — Acme',
    details: 'Envio de e-mail de abordagem para Marina (Acme).',
    evidence: ['research: 3 fontes', 'score: 85'],
    requestedBy: 'commercial',
  });

  const deps = {
    store,
    crm,
    audit,
    emailOutreach: email,
    actorUserId: ACTOR,
    now: () => new Date('2026-10-03T12:00:00.000Z'),
  };
  return { deps, store, crm, audit, email, lead, gate, jobId: job.id };
}

describe('resolveApproval', () => {
  it('rejeita gate inexistente', async () => {
    const { deps } = await setup();
    await expect(
      resolveApproval(deps, { approvalId: 'gate-fantasma', decision: 'approved', resolvedBy: ACTOR })
    ).rejects.toBeInstanceOf(ApprovalGateNotFoundError);
  });

  it('exige motivo ao rejeitar', async () => {
    const { deps, gate } = await setup();
    await expect(
      resolveApproval(deps, { approvalId: gate.id, decision: 'rejected', resolvedBy: ACTOR })
    ).rejects.toBeInstanceOf(LeadValidationError);
  });

  it('aprova com Resend: envia, salva outreach, registra atividade concluída e move para contacted', async () => {
    const { deps, store, crm, email, lead, gate, jobId } = await setup();
    const resolved = await resolveApproval(deps, {
      approvalId: gate.id,
      decision: 'approved',
      resolvedBy: ACTOR,
    });

    expect(resolved.status).toBe('approved');
    expect(email.emails).toHaveLength(1);
    expect(store.emailOutreach).toHaveLength(1);
    expect(store.emailOutreach[0].leadId).toBe(lead.id);
    expect(store.emailOutreach[0].resendId).toBe(email.emails[0].resendId);

    const updated = await crm.getLeadById(lead.id);
    expect(updated?.status).toBe('contacted');

    expect(crm.activities).toHaveLength(1);
    expect(crm.activities[0].type).toBe('Email');
    expect(crm.activities[0].completedAt).toBe('2026-10-03T12:00:00.000Z');

    const events = await store.listJobEvents(jobId);
    expect(events.map((e) => e.type)).toContain('email.sent');
    expect(events.map((e) => e.type)).toContain('approval.resolved');
    expect(deps.audit.events).toHaveLength(1);
  });

  it('aprova sem Resend configurado: degrada para envio manual (atividade pendente)', async () => {
    const { deps, crm, lead, gate } = await setup({ email: new FakeEmailOutreach(false) });
    await resolveApproval(deps, { approvalId: gate.id, decision: 'approved', resolvedBy: ACTOR });

    const updated = await crm.getLeadById(lead.id);
    expect(updated?.status).toBe('contact_authorized');
    expect(crm.activities).toHaveLength(1);
    expect(crm.activities[0].completedAt).toBeNull();
    expect(crm.activities[0].summary).toContain('envio manual pendente');
  });

  it('aprova com falha de envio: registra erro, degrada para manual e mantém autorização', async () => {
    const email = new FakeEmailOutreach();
    email.sendError = new Error('Resend 429 rate limit');
    const { deps, crm, lead, gate, store, jobId } = await setup({ email });

    await resolveApproval(deps, { approvalId: gate.id, decision: 'approved', resolvedBy: ACTOR });

    const updated = await crm.getLeadById(lead.id);
    expect(updated?.status).toBe('contact_authorized');
    expect(crm.activities[0].completedAt).toBeNull();

    const events = await store.listJobEvents(jobId);
    const failed = events.find((e) => e.type === 'email.send_failed');
    expect(failed?.payload.error).toContain('429');
  });

  it('rejeita com motivo: lead vai para contact_rejected sem envio', async () => {
    const { deps, crm, email, lead, gate } = await setup();
    const resolved = await resolveApproval(deps, {
      approvalId: gate.id,
      decision: 'rejected',
      resolvedBy: ACTOR,
      rationale: 'Sem fit no momento — reengajar no próximo trimestre.',
    });

    expect(resolved.status).toBe('rejected');
    expect(email.emails).toHaveLength(0);
    const updated = await crm.getLeadById(lead.id);
    expect(updated?.status).toBe('contact_rejected');
  });

  it('não resolve o mesmo gate duas vezes', async () => {
    const { deps, gate } = await setup();
    await resolveApproval(deps, { approvalId: gate.id, decision: 'approved', resolvedBy: ACTOR });
    await expect(
      resolveApproval(deps, { approvalId: gate.id, decision: 'approved', resolvedBy: ACTOR })
    ).rejects.toBeInstanceOf(ApprovalAlreadyResolvedError);
  });
});
