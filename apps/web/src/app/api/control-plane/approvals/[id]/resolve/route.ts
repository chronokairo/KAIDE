import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../../_lib/auth';
import { getActorUserId, getAudit, getEmailOutreach, getStore } from '../../../_lib/dependencies';
import { resolveApproval } from '@/application/use-cases/resolve-approval';
import {
  ApprovalAlreadyResolvedError,
  ApprovalGateNotFoundError,
  LeadValidationError,
} from '@/domain/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/control-plane/approvals/:id/resolve — gate humano.
 * Body: { decision: 'approved' | 'rejected', resolvedBy, rationale? }
 * Rejeitar exige motivo. Aprovar autoriza o contato externo (não o envia).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = checkAdminAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const decision = body?.decision;
  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json(
      { error: 'Campo "decision" deve ser "approved" ou "rejected".' },
      { status: 400 }
    );
  }
  if (!body?.resolvedBy || typeof body.resolvedBy !== 'string') {
    return NextResponse.json({ error: 'Campo "resolvedBy" é obrigatório.' }, { status: 400 });
  }

  try {
    const approval = await resolveApproval(
      {
        store: getStore(),
        crm: getStore(),
        audit: getAudit(),
        emailOutreach: getEmailOutreach(),
        actorUserId: getActorUserId(),
      },
      {
        approvalId: id,
        decision,
        resolvedBy: body.resolvedBy,
        rationale: typeof body.rationale === 'string' ? body.rationale : undefined,
      }
    );
    return NextResponse.json({ approval });
  } catch (error) {
    if (error instanceof ApprovalGateNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ApprovalAlreadyResolvedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof LeadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Erro ao resolver aprovação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
