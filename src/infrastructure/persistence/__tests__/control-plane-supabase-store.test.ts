// Regressão do Supabase store (ADR-0039): valores de query já encodados pelos
// callers não podem ser re-encodados pelo request (double-encoding fazia o
// filtro por idempotency_key com ":" nunca bater → 409 no createJob).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlPlaneSupabaseStore } from '../control-plane-supabase-store';

const ORG = 'e0f6b749-d7b9-5ea8-9b80-c1d919bf7aaf';

let fetchMock: ReturnType<typeof vi.fn>;
let requestedUrls: string[];

beforeEach(() => {
  requestedUrls = [];
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    requestedUrls.push(String(input));
    return new Response(JSON.stringify([]), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeStore(): ControlPlaneSupabaseStore {
  return new ControlPlaneSupabaseStore('https://fake.supabase.co', 'sb_secret_test');
}

describe('ControlPlaneSupabaseStore — encoding de query', () => {
  it('getJobByIdempotencyKey não faz double-encoding do ":" da chave', async () => {
    const store = makeStore();
    await store.getJobByIdempotencyKey(ORG, 'commercial.daily:2026-10-03');

    expect(requestedUrls).toHaveLength(1);
    const url = requestedUrls[0]!;
    expect(url).toContain('idempotency_key=eq.commercial.daily%3A2026-10-03');
    expect(url).not.toContain('%253A');
    expect(url).not.toContain('%25');
  });

  it('getJobByIdempotencyKey retorna null quando não existe', async () => {
    const store = makeStore();
    const job = await store.getJobByIdempotencyKey(ORG, 'commercial.daily:2026-10-03');
    expect(job).toBeNull();
  });

  it('getJobByIdempotencyKey mapeia a linha para JobRecord', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: 'job-1',
            organization_id: ORG,
            type: 'commercial.daily',
            idempotency_key: 'commercial.daily:2026-10-03',
            status: 'completed',
            attempts: 1,
            input: {},
            requested_by: 'automation',
            result: { summary: 'ok' },
            cost_usd: 0,
            created_at: '2026-10-03T10:00:00Z',
            updated_at: '2026-10-03T10:00:05Z',
          },
        ]),
        { status: 200 },
      ),
    );

    const store = makeStore();
    const job = await store.getJobByIdempotencyKey(ORG, 'commercial.daily:2026-10-03');

    expect(job).not.toBeNull();
    expect(job?.id).toBe('job-1');
    expect(job?.idempotencyKey).toBe('commercial.daily:2026-10-03');
    expect(job?.status).toBe('completed');
  });

  it('listJobs encoda filtros uma única vez', async () => {
    const store = makeStore();
    await store.listJobs(ORG, { type: 'commercial.daily', status: 'completed' });

    const url = requestedUrls[0]!;
    expect(url).toContain('type=eq.commercial.daily');
    expect(url).toContain('status=eq.completed');
    expect(url).not.toContain('%25');
  });
});
