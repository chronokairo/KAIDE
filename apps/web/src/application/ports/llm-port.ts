// Porta (ADR-0022): geração de completions. Implementada por adapters de provedores.

import type { ChatCompletionRequest, ChatCompletionResult } from '@/domain/chat';
import type { LlmCredential } from './credential-port';

export interface LlmPort {
  complete(request: ChatCompletionRequest, credential: LlmCredential): Promise<ChatCompletionResult>;
}
