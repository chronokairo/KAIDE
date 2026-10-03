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

// ─── Control Plane (ADR-0028/0032) ─────────────────────────────────────────────

export class JobTypeNotImplementedError extends Error {
  constructor(readonly type: string) {
    super(`Tipo de job não implementado no harness: ${type}`);
    this.name = 'JobTypeNotImplementedError';
  }
}

export class ApprovalGateNotFoundError extends Error {
  constructor(readonly approvalId: string) {
    super(`Gate de aprovação não encontrado: ${approvalId}`);
    this.name = 'ApprovalGateNotFoundError';
  }
}

export class ApprovalAlreadyResolvedError extends Error {
  constructor(readonly approvalId: string) {
    super(`Gate de aprovação já resolvido: ${approvalId}`);
    this.name = 'ApprovalAlreadyResolvedError';
  }
}

export class LeadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeadValidationError';
  }
}

export class InvalidLeadTransitionError extends Error {
  constructor(readonly from: string, readonly to: string) {
    super(`Transição de lead inválida: ${from} → ${to}`);
    this.name = 'InvalidLeadTransitionError';
  }
}
