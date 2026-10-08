// Porta (ADR-0022): resolução de credenciais de provedores de LLM.

import type { AuthContext } from '@/domain/auth';

export interface LlmCredential {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface CredentialPort {
  /** Credencial ativa do ator ou null quando não configurada. */
  resolve(actor: AuthContext): Promise<LlmCredential | null>;
}
