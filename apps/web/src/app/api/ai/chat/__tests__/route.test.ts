import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../route';

vi.mock('@/shared/supabase', () => ({
  supabase: { auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'authorized-user' } }, error: null })) } },
}));

describe('POST /api/ai/chat', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('uses the server NVIDIA credential after verifying a bearer session', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'nvapi-test');
    vi.stubEnv('NVIDIA_NIM_BASE_URL', 'https://nim.test/v1');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      id: 'chat-1', choices: [{ message: { role: 'assistant', content: '**ok**' } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-session' } }));

    const response = await POST(new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-session' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Olá' }], model: 'nvidia/test' }),
    }) as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ choices: [{ message: { content: '**ok**' } }] });
  });

  it('rejects missing bearer identity even when a server NVIDIA key is configured', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'nvapi-test');
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const response = await POST(new Request('http://localhost/api/ai/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    }) as never);
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('translates an upstream NVIDIA failure instead of returning an internal error', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'nvapi-test');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    const response = await POST(new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-session' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Olá' }] }),
    }) as never);
    expect(response.status).toBe(401);
  });
});
