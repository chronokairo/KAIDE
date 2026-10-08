import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../_lib/auth';
import { getAudit, getOrganizationId, getStore } from '../../_lib/dependencies';
import { updateLead } from '@/application/use-cases/update-lead';
import type { LeadStatus } from '@/domain/control-plane';
import { InvalidLeadTransitionError, LeadValidationError } from '@/domain/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/control-plane/leads/:id — transição controlada de status + notas.
 * Body: { status?, notes?, updatedBy? }
 * Regra: agentes não pulam gates — apenas contact_authorized → contacted.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = checkAdminAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.status && !body?.notes) {
    return NextResponse.json(
      { error: 'Informe "status" e/ou "notes" para atualizar.' },
      { status: 400 }
    );
  }

  try {
    const lead = await updateLead(
      { crm: getStore(), audit: getAudit() },
      {
        leadId: id,
        organizationId: getOrganizationId(),
        updatedBy: typeof body.updatedBy === 'string' ? body.updatedBy : 'director',
        status: body.status as LeadStatus | undefined,
        notes: body.notes,
      }
    );
    return NextResponse.json({ lead });
  } catch (error) {
    if (error instanceof InvalidLeadTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof LeadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
