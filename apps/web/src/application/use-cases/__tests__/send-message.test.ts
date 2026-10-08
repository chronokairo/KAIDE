import { describe, expect, it } from 'vitest';
import type { CredentialPort, LlmPort } from '@/application/ports';
import { SendMessageUseCase } from '@/application/use-cases/send-message';
import type { AuthContext } from '@/domain/auth';
import { CredentialNotConfiguredError } from '@/domain/errors';

const actor: AuthContext = { userId: 'user-1' };

const baseInput = {
  messages: [{ role: 'user' as const, content: 'oi' }],
  temperature: 0.6,
  maxTokens: 128,
};

function credentialPort(model: string): CredentialPort {
  return {
    async resolve() {
      return { apiKey: 'test-key', baseUrl: 'https://llm.test', model };
    },
  };
}

function recordingLlmPort(calls: Array<{ model: string }>): LlmPort {
  return {
    async complete(request) {
      calls.push({ model: request.model });
      return { id: 'cmpl-1', object: 'chat.completion', created: 0, model: request.model, choices: [] };
    },
  };
}

describe('SendMessageUseCase', () => {
  it('usa o model da credencial quando o input não define model', async () => {
    const calls: Array<{ model: string }> = [];
    const useCase = new SendMessageUseCase({ credentials: credentialPort('openai/gpt-oss-20b'), llm: recordingLlmPort(calls) });

    await useCase.execute(actor, baseInput);

    expect(calls).toEqual([{ model: 'openai/gpt-oss-20b' }]);
  });

  it('prefere o model do input sobre o model da credencial', async () => {
    const calls: Array<{ model: string }> = [];
    const useCase = new SendMessageUseCase({ credentials: credentialPort('openai/gpt-oss-20b'), llm: recordingLlmPort(calls) });

    await useCase.execute(actor, { ...baseInput, model: 'meta/llama-3.1-70b' });

    expect(calls).toEqual([{ model: 'meta/llama-3.1-70b' }]);
  });

  it('lança CredentialNotConfiguredError quando não há credencial configurada', async () => {
    const credentials: CredentialPort = {
      async resolve() {
        return null;
      },
    };
    const llm: LlmPort = {
      async complete() {
        throw new Error('não deve ser chamado');
      },
    };
    const useCase = new SendMessageUseCase({ credentials, llm });

    await expect(useCase.execute(actor, baseInput)).rejects.toBeInstanceOf(CredentialNotConfiguredError);
  });
});
