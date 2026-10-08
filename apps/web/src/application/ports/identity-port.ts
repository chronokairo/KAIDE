// Porta (ADR-0022): autenticação de requisições. Implementada por adapters de identidade.

import type { AuthContext } from '@/domain/auth';

export interface IdentityPort {
  authenticate(authorizationHeader: string | null): Promise<AuthContext>;
}
