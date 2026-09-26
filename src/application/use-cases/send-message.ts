// Caso de uso (ADR-0022): orquestra o envio de mensagem dependendo apenas de portas.

import type { AuthContext } from '@/domain/auth';
import type { ChatCompletionRequest, ChatCompletionResult, ChatMessage } from '@/domain/chat';
import { CredentialNotConfiguredError } from '@/domain/errors';
import type { CredentialPort, LlmPort } from '../ports';

export interface SendMessageInput {
  messages: ChatMessage[];
  model?: string;
  temperature: number;
  maxTokens: number;
}

export interface SendMessageDeps {
  credentials: CredentialPort;
  llm: LlmPort;
}

export class SendMessageUseCase {
  constructor(private readonly deps: SendMessageDeps) {}

  async execute(actor: AuthContext, input: SendMessageInput): Promise<ChatCompletionResult> {
    const credential = await this.deps.credentials.resolve(actor);
    if (!credential) throw new CredentialNotConfiguredError(actor.userId);

    const request: ChatCompletionRequest = {
      model: input.model ?? credential.model,
      messages: input.messages,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    };
    return this.deps.llm.complete(request, credential);
  }
}
