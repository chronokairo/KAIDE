import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  construct: vi.fn(),
  send: vi.fn(),
  list: vi.fn(),
  insert: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/shared/supabase', () => ({ PROD_ORGANIZATION_ID: 'org-test' }));
vi.mock('@/infrastructure/persistence/supabase-admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ insert: mocks.insert }) }),
}));
vi.mock('resend', () => ({
  Resend: class {
    constructor(key: string) { mocks.construct(key); }
    emails = { send: mocks.send, list: mocks.list };
  },
}));

const params = { to: 'recipient@example.test', subject: 'Test', body: 'Draft', jobId: 'job-test' };

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('RESEND_API_KEY', '');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mocks.insert.mockResolvedValue({ error: null });
  mocks.send.mockResolvedValue({ data: { id: 'message-test' }, error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('Resend deployment credentials', () => {
  it('imports safely without configuration and refuses sending without constructing the SDK', async () => {
    const { defaultResendEmailService } = await import('../resend-email-service');
    expect(mocks.construct).not.toHaveBeenCalled();
    const result = await defaultResendEmailService.sendFollowupEmail(params);
    expect(result).toMatchObject({ success: false, error: 'RESEND_API_KEY is required for email operations' });
    expect(mocks.construct).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only configuration without falling back to a committed key', async () => {
    vi.stubEnv('RESEND_API_KEY', '   ');
    const { ResendEmailService } = await import('../resend-email-service');
    const result = await new ResendEmailService().sendFollowupEmail(params);
    expect(result.success).toBe(false);
    expect(mocks.construct).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('uses only the explicitly supplied server key and preserves successful dispatch', async () => {
    const { ResendEmailService } = await import('../resend-email-service');
    const service = new ResendEmailService('  test-key  ', 'Kaide <sender@example.test>');
    await expect(service.sendFollowupEmail(params)).resolves.toEqual({ success: true, messageId: 'message-test' });
    expect(mocks.construct).toHaveBeenCalledWith('test-key');
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: params.to, from: 'Kaide <sender@example.test>', text: params.body }));
  });

  it('resolves backend configuration when used and keeps SDK initialization lazy', async () => {
    const { defaultResendEmailService } = await import('../resend-email-service');
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    expect(mocks.construct).not.toHaveBeenCalled();
    await expect(defaultResendEmailService.sendFollowupEmail(params)).resolves.toMatchObject({ success: true });
    expect(mocks.construct).toHaveBeenCalledWith('test-key');
  });
});
