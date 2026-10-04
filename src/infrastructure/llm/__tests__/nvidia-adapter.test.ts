import { describe, expect, it, vi, afterEach } from 'vitest';
import { NvidiaLlmAdapter } from '../nvidia-adapter';
import { UpstreamLlmError } from '@/domain/errors';

describe('NvidiaLlmAdapter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends the dynamically selected model and provider credential', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      id: 'chat-1', object: 'chat.completion', created: 1, model: 'meta/llama-3.3-70b-instruct',
      choices: [{ index: 0, message: { role: 'assistant', content: 'ok' } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await new NvidiaLlmAdapter().complete({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Olá' }],
      temperature: 0.4,
      maxTokens: 512,
    }, { apiKey: 'nvapi-test', baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.3-70b-instruct' });

    expect(result.choices[0].message.content).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith('https://integrate.api.nvidia.com/v1/chat/completions', expect.objectContaining({
      headers: { Authorization: 'Bearer nvapi-test', 'Content-Type': 'application/json' },
      body: expect.stringContaining('meta/llama-3.3-70b-instruct'),
    }));
  });

  it('raises a typed error when NVIDIA rejects the request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    await expect(new NvidiaLlmAdapter().complete({ model: 'nvidia/test', messages: [{ role: 'user', content: 'x' }], temperature: 0, maxTokens: 1 }, { apiKey: 'bad', baseUrl: 'https://nim.test', model: 'nvidia/test' })).rejects.toBeInstanceOf(UpstreamLlmError);
  });
});
