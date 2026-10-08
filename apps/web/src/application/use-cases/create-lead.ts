import type { AuditPort } from '../ports/audit-port';
import type { CrmPort, CreateLeadInput } from '../ports/crm-port';
import type { LeadRecord } from '../../domain/control-plane';
import { LeadValidationError } from '../../domain/errors';

export interface CreateLeadDeps {
  readonly crm: CrmPort;
  readonly audit: AuditPort;
}

export interface CreateLeadOutcome {
  readonly lead: LeadRecord;
  readonly existing: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Intake de leads. Idempotente por nome de empresa (case-insensitive, por org):
 * reenviar o mesmo lead não duplica — retorna o existente.
 */
export async function createLead(
  deps: CreateLeadDeps,
  input: CreateLeadInput,
): Promise<CreateLeadOutcome> {
  const { crm, audit } = deps;

  const companyName = input.companyName?.trim();
  if (!companyName) {
    throw new LeadValidationError('companyName é obrigatório.');
  }
  if (input.contactEmail && !EMAIL_RE.test(input.contactEmail)) {
    throw new LeadValidationError(`E-mail inválido: ${input.contactEmail}`);
  }

  const allLeads = await crm.listLeads(input.organizationId);
  const duplicate = allLeads.find(
    (l) => l.companyName.toLowerCase() === companyName.toLowerCase()
  );
  if (duplicate) {
    return { lead: duplicate, existing: true };
  }

  const lead = await crm.createLead({
    ...input,
    companyName,
    status: 'new',
  });

  await audit.record({
    organizationId: input.organizationId,
    actorId: input.requestedBy ?? 'intake',
    action: 'crm.lead.created',
    metadata: { resource: `lead:${lead.id}`, companyName, source: input.source },
  });

  return { lead, existing: false };
}
