// Composition da feature ai-chat (ADR-0022): liga adapters de infraestrutura ao caso
// de uso. Único ponto que conhece os dois lados (mesmo padrão de ai-credentials).

import type { IdentityPort } from '@/application/ports';
import { SendMessageUseCase } from '@/application/use-cases/send-message';
import { NvidiaCredentialAdapter } from '@/infrastructure/credentials/nvidia-credential-adapter';
import { SupabaseIdentityAdapter } from '@/infrastructure/identity/supabase-identity-adapter';
import { NvidiaLlmAdapter } from '@/infrastructure/llm/nvidia-adapter';

export interface ChatComposition {
  identity: IdentityPort;
  sendMessage: SendMessageUseCase;
}

export function createChatComposition(): ChatComposition {
  return {
    identity: new SupabaseIdentityAdapter(),
    sendMessage: new SendMessageUseCase({
      credentials: new NvidiaCredentialAdapter(),
      llm: new NvidiaLlmAdapter(),
    }),
  };
}
