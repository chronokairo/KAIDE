import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
vi.mock('@/shared/supabase', () => ({
  supabase: { auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'authorized-user' } }, error: null })) } },
}));
describe('authenticated model catalog', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  it('rejects anonymous requests before accessing the configured provider key', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const result = await GET(new Request('http://localhost/api/ai/models') as never);
    expect(result.status).toBe(401); expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['', 'https://integrate.api.nvidia.com/', 'https://integrate.api.nvidia.com/v1/'])('uses the versioned endpoint for base %s', async (base) => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key'); vi.stubEnv('NVIDIA_NIM_BASE_URL', base);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 'test-model' }] }), { status: 200 }));
    const result = await GET(new Request('http://localhost/api/ai/models', { headers: { Authorization: 'Bearer valid-test-session' } }) as never);
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith('https://integrate.api.nvidia.com/v1/models', expect.anything());
  });
});
