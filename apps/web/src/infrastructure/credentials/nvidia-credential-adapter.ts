// Adapter (ADR-0022): implementa CredentialPort envolvendo createNvidiaCredentialService.

import type { CredentialPort, LlmCredential } from '@/application/ports';
import type { AuthContext } from '@/domain/auth';
import { createNvidiaCredentialService } from '@/features/ai-credentials/composition/server';

export class NvidiaCredentialAdapter implements CredentialPort {
  async resolve(actor: AuthContext): Promise<LlmCredential | null> {
    const { service } = createNvidiaCredentialService();
    return service.resolve(actor.userId);
  }
}
