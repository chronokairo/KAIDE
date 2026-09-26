// Adapter (ADR-0022): implementa LlmPort chamando a API de chat completions da NVIDIA.
// Movido de src/app/api/ai/chat/route.ts sem mudança de comportamento.

import type { LlmCredential, LlmPort } from '@/application/ports';
import type { ChatCompletionRequest, ChatCompletionResult } from '@/domain/chat';
import { UpstreamLlmError } from '@/domain/errors';

export class NvidiaLlmAdapter implements LlmPort {
  async complete(request: ChatCompletionRequest, credential: LlmCredential): Promise<ChatCompletionResult> {
    const response = await fetch(`${credential.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${credential.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature, max_tokens: request.maxTokens, stream: false }),
    });
    const payload = await response.json();
    if (!response.ok) throw new UpstreamLlmError(response.status);
    return payload as ChatCompletionResult;
  }
}
