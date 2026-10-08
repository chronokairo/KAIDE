// Porta (ADR-0022): trilha de auditoria exigida para ferramentas de escrita (Fase 3+).

export interface AuditEvent {
  actorId: string;
  organizationId?: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export interface AuditPort {
  record(event: AuditEvent): Promise<void>;
}
