// Adapter de auditoria (ADR-0022/0028): JSON line via logger compartilhado.
// Arquitetura Hexagonal: Infrastructure — implementa AuditPort.

import type { AuditEvent, AuditPort } from '@/application/ports/audit-port';
import { logger } from '@/server/rag/shared/lib/logger';

export class LoggerAuditAdapter implements AuditPort {
  async record(event: AuditEvent): Promise<void> {
    logger.info('audit', event.action, {
      actorId: event.actorId,
      organizationId: event.organizationId,
      ...event.metadata,
    });
  }
}

let audit: AuditPort | null = null;

export function getAuditAdapter(): AuditPort {
  if (!audit) {
    audit = new LoggerAuditAdapter();
  }
  return audit;
}
