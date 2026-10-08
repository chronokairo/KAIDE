import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/shared/supabase', () => ({ SUPABASE_URL: 'https://database.test' }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ from: vi.fn() })) }));

describe('backend administrative credentials', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.clearAllMocks(); });
  it('fails closed for missing or whitespace-only credentials', async () => {
    const { getSupabaseAdmin } = await import('../supabase-admin');
    for (const key of ['', '   ']) {
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', key);
      expect(() => getSupabaseAdmin()).toThrow('SUPABASE_SERVICE_ROLE_KEY is required');
    }
  });
  it('creates and caches a backend client using only the configured credential', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-server-key');
    const { getSupabaseAdmin } = await import('../supabase-admin');
    const { createClient } = await import('@supabase/supabase-js');
    expect(getSupabaseAdmin()).toBe(getSupabaseAdmin());
    expect(createClient).toHaveBeenCalledOnce();
    expect(createClient).toHaveBeenCalledWith('https://database.test', 'test-server-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });
});
