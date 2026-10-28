import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ControlPlaneFileStore } from '../control-plane-file-store';

let dir: string;
let store: ControlPlaneFileStore;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cp-file-store-'));
  store = new ControlPlaneFileStore(join(dir, 'control-plane.json'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const ORG = 'org-teste';

describe('ControlPlaneFileStore — jobs', () => {
  it('cria job idempotente por (org, idempotencyKey)', async () => {
    const input = {
      organizationId: ORG,
      type: 'commercial.daily' as const,
      idempotencyKey: 'commercial.daily:2026-10-03',
      input: {},
    };
    const first = await store.createJob(input);
    const second = await store.createJob(input);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.job.id).toBe(first.job.id);
    expect((await store.listJobs(ORG))).toHaveLength(1);
  });

  it('atualiza job e persiste em disco', async () => {
    const { job } = await store.createJob({
      organizationId: ORG,
      type: 'commercial.daily',
      idempotencyKey: 'k1',
      input: {},
    });
    await store.updateJob(job.id, { status: 'completed', result: { ok: true } });

    const reloaded = new ControlPlaneFileStore(join(dir, 'control-plane.json'));
    const persisted = await reloaded.getJobById(job.id);
    expect(persisted?.status).toBe('completed');
    expect(persisted?.result).toEqual({ ok: true });
  });

  it('event log é append-only: eventos acumulam', async () => {
    const { job } = await store.createJob({
      organizationId: ORG,
      type: 'commercial.daily',
      idempotencyKey: 'k1',
      input: {},
    });
    await store.appendJobEvent({
      jobId: job.id,
      organizationId: ORG,
      type: 'job.started',
      payload: {},
    });
    await store.appendJobEvent({
      jobId: job.id,
      organizationId: ORG,
      type: 'job.completed',
      payload: { summary: 'ok' },
    });
    const events = await store.listJobEvents(job.id);
    expect(events.map((e) => e.type)).toEqual(['job.started', 'job.completed']);
  });
});

describe('ControlPlaneFileStore — leads e atividades', () => {
  it('cria lead com contexto comercial e atualiza campos do Control Plane', async () => {
    const lead = await store.createLead({
      organizationId: ORG,
      companyName: 'Acme',
      contactEmail: 'marina@acme.com.br',
      tier: 'A',
      estimatedValue: 50000,
      segment: 'Indústria',
      location: 'São Paulo',
    });
    expect(lead.status).toBe('new');
    expect(lead.tier).toBe('A');

    await store.updateLead(lead.id, { status: 'qualified', score: 85 });
    const updated = await store.getLeadById(lead.id);
    expect(updated?.status).toBe('qualified');
    expect(updated?.score).toBe(85);
  });

  it('logActivity registra atividade com completedAt null por padrão', async () => {
    const lead = await store.createLead({ organizationId: ORG, companyName: 'Acme' });
    const activity = await store.logActivity({
      organizationId: ORG,
      leadId: lead.id,
      type: 'Email',
      summary: 'Outbound aprovado — envio manual pendente — Acme',
      completedAt: null,
      actorUserId: 'user-1',
    });
    expect(activity.completedAt).toBeNull();
    expect(activity.type).toBe('Email');
  });
});

describe('ControlPlaneFileStore — email outreach', () => {
  it('upsert cria e atualiza pelo resendId', async () => {
    await store.upsertEmailOutreach({
      organizationId: ORG,
      resendId: 're-1',
      leadId: 'lead-1',
      toAddress: 'a@b.com',
      subject: 'Chronokairo — Acme',
      status: 'queued',
    });
    await store.upsertEmailOutreach({
      organizationId: ORG,
      resendId: 're-1',
      toAddress: 'a@b.com',
      subject: 'Chronokairo — Acme',
      status: 'delivered',
    });
    const rows = await store.listEmailOutreach(ORG);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('delivered');
    expect(rows[0].leadId).toBe('lead-1'); // undefined não zera associação
  });

  it('listEmailOutreach filtra não-terminais e respeita limit', async () => {
    for (const [id, status] of [
      ['re-1', 'delivered'],
      ['re-2', 'queued'],
      ['re-3', 'bounced'],
      ['re-4', 'sent'],
    ] as const) {
      await store.upsertEmailOutreach({
        organizationId: ORG,
        resendId: id,
        toAddress: 'a@b.com',
        subject: 's',
        status,
      });
    }
    const nonTerminal = await store.listEmailOutreach(ORG, { nonTerminalOnly: true });
    expect(nonTerminal.map((e) => e.resendId).sort()).toEqual(['re-2', 're-4']);

    const limited = await store.listEmailOutreach(ORG, { limit: 2 });
    expect(limited).toHaveLength(2);
  });
});

describe('ControlPlaneFileStore — documento legado', () => {
  it('documento sem coleções novas não vaza arrays entre instâncias', async () => {
    // Simula doc salvo antes de existir emailOutreach/activities.
    const legacy = {
      version: 1,
      jobs: [
        {
          id: 'job-velho',
          organizationId: ORG,
          type: 'commercial.daily',
          idempotencyKey: 'k-velho',
          status: 'completed',
          attempts: 1,
          input: {},
          costUsd: 0,
          createdAt: '2026-10-01T00:00:00.000Z',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      ],
      jobEvents: [],
      leads: [],
      approvalGates: [],
    };
    writeFileSync(join(dir, 'control-plane.json'), JSON.stringify(legacy), 'utf-8');

    const first = new ControlPlaneFileStore(join(dir, 'control-plane.json'));
    await first.upsertEmailOutreach({
      organizationId: ORG,
      resendId: 're-1',
      toAddress: 'a@b.com',
      subject: 's',
      status: 'sent',
    });

    // Segunda instância (outro arquivo) não pode herdar o outreach da primeira.
    const otherDir = mkdtempSync(join(tmpdir(), 'cp-file-store-other-'));
    try {
      const second = new ControlPlaneFileStore(join(otherDir, 'control-plane.json'));
      const rows = await second.listEmailOutreach(ORG);
      expect(rows).toHaveLength(0);
    } finally {
      rmSync(otherDir, { recursive: true, force: true });
    }

    // E o doc legado ganhou a coleção nova sem corromper o job antigo.
    const raw = JSON.parse(readFileSync(join(dir, 'control-plane.json'), 'utf-8'));
    expect(raw.jobs).toHaveLength(1);
    expect(Array.isArray(raw.emailOutreach)).toBe(true);
    expect(raw.emailOutreach).toHaveLength(1);
  });
});
