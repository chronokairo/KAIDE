import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../_lib/auth';
import { getAudit, getOrganizationId, getStore } from '../_lib/dependencies';
import { createLead } from '@/application/use-cases/create-lead';
import type { LeadStatus } from '@/domain/control-plane';
import { LeadValidationError } from '@/domain/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/control-plane/leads — lista leads (filtro opcional: ?status=new,researching).
 */
export async function GET(request: NextRequest) {
  const unauthorized = checkAdminAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');
  const status = statusParam
    ? (statusParam.split(',').filter(Boolean) as LeadStatus[])
    : undefined;

  const leads = await getStore().listLeads(getOrganizationId(), { status });
  return NextResponse.json({ leads });
}

/**
 * POST /api/control-plane/leads — intake de lead (idempotente por companyName).
 * Body: { companyName, contactName?, contactEmail?, contactRole?, source?, notes?, requestedBy? }
 */
export async function POST(request: NextRequest) {
  const unauthorized = checkAdminAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  if (!body?.companyName || typeof body.companyName !== 'string') {
    return NextResponse.json({ error: 'Campo "companyName" é obrigatório.' }, { status: 400 });
  }

  try {
    const outcome = await createLead(
      { crm: getStore(), audit: getAudit() },
      {
        organizationId: getOrganizationId(),
        companyName: body.companyName,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactRole: body.contactRole,
        source: body.source,
        notes: body.notes,
        requestedBy: body.requestedBy,
      }
    );
    return NextResponse.json(outcome, { status: outcome.existing ? 200 : 201 });
  } catch (error) {
    if (error instanceof LeadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Erro ao criar lead:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
