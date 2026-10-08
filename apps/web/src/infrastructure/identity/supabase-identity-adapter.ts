// Adapter (ADR-0022): implementa IdentityPort envolvendo authenticateRequest existente.

import type { IdentityPort } from '@/application/ports';
import type { AuthContext } from '@/domain/auth';
import { UnauthorizedError } from '@/domain/errors';
import { authenticateRequest } from '@/features/ai-credentials/composition/server';

export class SupabaseIdentityAdapter implements IdentityPort {
  async authenticate(authorizationHeader: string | null): Promise<AuthContext> {
    try {
      const { id } = await authenticateRequest(authorizationHeader);
      return { userId: id };
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') throw new UnauthorizedError();
      throw error;
    }
  }
}
