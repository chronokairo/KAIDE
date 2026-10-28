// Regressão do adapter Resend (ADR-0039): o parâmetro `after` da API é um
// cursor UUID — passar timestamp ISO era rejeitado ("must be a valid UUID").
// A janela de 24h é filtrada localmente (lista ordenada por created_at desc).

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  send: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { list: mocks.list, get: mocks.get, send: mocks.send };
  },
}));

import { createResendEmailAdapter } from '../resend-email-adapter';

function item(id: string, createdAt: string, to = 'lead@corp.com') {
  return { id, to, subject: `s-${id}`, created_at: createdAt, last_event: 'delivered' };
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createResendEmailAdapter', () => {
  it('isConfigured reflete a presença da apiKey', () => {
    expect(createResendEmailAdapter({ apiKey: '', fromEmail: 'a@b.c' }).isConfigured()).toBe(false);
    expect(createResendEmailAdapter({ apiKey: 're_x', fromEmail: 'a@b.c' }).isConfigured()).toBe(true);
  });

  it('primeira página lista SEM after (nunca timestamp) e filtra a janela localmente', async () => {
    mocks.list.mockResolvedValue({
      data: { data: [item('id-1', hoursAgo(1)), item('id-2', hoursAgo(30))], has_more: false },
    });

    const adapter = createResendEmailAdapter({ apiKey: 're_x', fromEmail: 'a@b.c' });
    const recent = await adapter.listRecentEmails(24, 100);

    expect(mocks.list).toHaveBeenCalledTimes(1);
    expect(mocks.list).toHaveBeenCalledWith({ limit: 100 });
    expect(recent).toHaveLength(1);
    expect(recent[0]?.resendId).toBe('id-1');
  });

  it('pagina com after = UUID do último item quando hasMore', async () => {
    mocks.list
      .mockResolvedValueOnce({
        data: { data: [item('uuid-a', hoursAgo(1)), item('uuid-b', hoursAgo(2))], has_more: true },
      })
      .mockResolvedValueOnce({
        data: { data: [item('uuid-c', hoursAgo(3))], has_more: false },
      });

    const adapter = createResendEmailAdapter({ apiKey: 're_x', fromEmail: 'a@b.c' });
    const recent = await adapter.listRecentEmails(24, 100);

    expect(mocks.list).toHaveBeenCalledTimes(2);
    expect(mocks.list).toHaveBeenNthCalledWith(2, { after: 'uuid-b', limit: 100 });
    expect(recent.map((r) => r.resendId)).toEqual(['uuid-a', 'uuid-b', 'uuid-c']);
  });

  it('lança erro do SDK em falha de listagem', async () => {
    mocks.list.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const adapter = createResendEmailAdapter({ apiKey: 're_x', fromEmail: 'a@b.c' });
    await expect(adapter.listRecentEmails(24, 100)).rejects.toThrow(/boom/);
  });

  it('sendEmail devolve info com status queued em sucesso', async () => {
    mocks.send.mockResolvedValue({ data: { id: 'resend-123' }, error: null });

    const adapter = createResendEmailAdapter({ apiKey: 're_x', fromEmail: 'Chronokairo <a@b.c>' });
    const info = await adapter.sendEmail({
      to: 'lead@corp.com',
      subject: 'Hi',
      text: 'Body',
    });

    expect(mocks.send).toHaveBeenCalledWith({
      from: 'Chronokairo <a@b.c>',
      to: 'lead@corp.com',
      subject: 'Hi',
      text: 'Body',
    });
    expect(info).toMatchObject({ resendId: 'resend-123', status: 'queued' });
  });

  it('sendEmail lança quando o SDK retorna erro', async () => {
    mocks.send.mockResolvedValue({ data: null, error: { message: 'invalid from' } });

    const adapter = createResendEmailAdapter({ apiKey: 're_x', fromEmail: 'a@b.c' });
    await expect(
      adapter.sendEmail({ to: 'lead@corp.com', subject: 'Hi', text: 'Body' }),
    ).rejects.toThrow(/invalid from/);
  });

  it('getEmail normaliza status e preserva destinatário com display name', async () => {
    mocks.get.mockResolvedValue({
      data: item('resend-9', hoursAgo(1), 'Marina <marina@acme.com.br>'),
    });

    const adapter = createResendEmailAdapter({ apiKey: 're_x', fromEmail: 'a@b.c' });
    const info = await adapter.getEmail('resend-9');

    expect(info?.to).toBe('Marina <marina@acme.com.br>');
    expect(info?.status).toBe('delivered');
  });
});
