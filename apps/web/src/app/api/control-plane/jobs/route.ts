import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../_lib/auth';
import { getOrganizationId, getRunJobDeps } from '../_lib/dependencies';
import { runJobByType } from '@/application/use-cases/run-job-by-type';
import type { ControlPlaneJobType, JobStatus } from '@/domain/control-plane';
import { JobTypeNotImplementedError } from '@/domain/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/control-plane/jobs — lista jobs da organização.
 */
export async function GET(request: NextRequest) {
  const unauthorized = checkAdminAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const type = url.searchParams.get('type') as ControlPlaneJobType | null;
  const status = url.searchParams.get('status') as JobStatus | null;

  const jobs = await getRunJobDeps().store.listJobs(getOrganizationId(), {
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
  });
  return NextResponse.json({ jobs });
}

/**
 * POST /api/control-plane/jobs — dispara um job por tipo.
 * Body: { type, idempotencyKey?, requestedBy? }
 * Idempotente: jobs periódicos usam a chave `tipo:YYYY-MM-DD` (UTC).
 */
export async function POST(request: NextRequest) {
  const unauthorized = checkAdminAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const type = body?.type;
  if (!type || typeof type !== 'string') {
    return NextResponse.json({ error: 'Campo "type" é obrigatório.' }, { status: 400 });
  }

  try {
    const outcome = await runJobByType(getRunJobDeps(), {
      type: type as ControlPlaneJobType,
      organizationId: getOrganizationId(),
      requestedBy: typeof body.requestedBy === 'string' ? body.requestedBy : undefined,
      idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined,
    });
    return NextResponse.json(outcome, { status: outcome.alreadyRan ? 200 : 201 });
  } catch (error) {
    if (error instanceof JobTypeNotImplementedError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    console.error('Erro ao executar job:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
