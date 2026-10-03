import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../_lib/auth';
import { getRunJobDeps } from '../../_lib/dependencies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/control-plane/jobs/:id — job + event log append-only (evidência).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = checkAdminAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { store } = getRunJobDeps();
  const job = await store.getJobById(id);
  if (!job) {
    return NextResponse.json({ error: 'Job não encontrado.' }, { status: 404 });
  }
  const events = await store.listJobEvents(id);
  return NextResponse.json({ job, events });
}
