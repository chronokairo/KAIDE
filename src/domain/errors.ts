// Camada de domínio (ADR-0022): erros que adapters traduzem para HTTP/protocolo.

export class UnauthorizedError extends Error {
  constructor() {
    super('UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class CredentialNotConfiguredError extends Error {
  constructor(userId: string) {
    super(`Credencial de LLM não configurada para ${userId}`);
    this.name = 'CredentialNotConfiguredError';
  }
}

export class UpstreamLlmError extends Error {
  constructor(readonly status: number) {
    super(`Provedor de LLM falhou com status ${status}`);
    this.name = 'UpstreamLlmError';
  }
}
