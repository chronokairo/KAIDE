// Camada de domínio (ADR-0022): contexto de autenticação resolvido por adapters.

export interface AuthContext {
  userId: string;
  organizationId?: string;
}
