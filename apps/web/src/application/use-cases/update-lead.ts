import type { AuditPort } from '../ports/audit-port';
import type { CrmPort } from '../ports/crm-port';
import type { LeadRecord, LeadStatus } from '../../domain/control-plane';
import { InvalidLeadTransitionError, LeadValidationError } from '../../domain/errors';

export interface UpdateLeadInput {
  readonly leadId: string;
  readonly organizationId: string;
  readonly updatedBy: string;
  readonly status?: LeadStatus;
  readonly notes?: string;
}

export interface UpdateLeadDeps {
  readonly crm: CrmPort;
  readonly audit: AuditPort;
  readonly now?: () => Date;
}

/**
 * Transições permitidas (agentes não pulam gates):
 * - contact_authorized → contacted: diretor confirma que a abordagem foi enviada.
 * Notas podem ser anexadas em qualquer status.
 */
const ALLOWED_TRANSITIONS: Partial<Record<LeadStatus, LeadStatus[]>> = {
  contact_authorized: ['contacted'],
};

export async function updateLead(
  deps: UpdateLeadDeps,
  input: UpdateLeadInput,
): Promise<LeadRecord> {
  const now = deps.now ?? (() => new Date());
  const { crm, audit } = deps;

  const lead = await crm.getLeadById(input.leadId);
  if (!lead || lead.organizationId !== input.organizationId) {
    throw new LeadValidationError(`Lead não encontrado: ${input.leadId}`);
  }

  const patch: { status?: LeadStatus; notes?: string } = {};
  if (input.status && input.status !== lead.status) {
    const allowed = ALLOWED_TRANSITIONS[lead.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new InvalidLeadTransitionError(lead.status, input.status);
    }
    patch.status = input.status;
  }
  if (input.notes?.trim()) {
    const stamp = now().toISOString();
    patch.notes = `${lead.notes ? lead.notes + '\n' : ''}[${stamp}] ${input.notes.trim()}`;
  }
  if (Object.keys(patch).length === 0) {
    return lead;
  }

  const updated = await crm.updateLead(lead.id, patch);
  await audit.record({
    organizationId: input.organizationId,
    actorId: input.updatedBy,
    action: 'crm.lead.updated',
    metadata: {
      resource: `lead:${lead.id}`,
      status: patch.status,
      notesAppended: Boolean(input.notes),
    },
  });

  return updated;
}
