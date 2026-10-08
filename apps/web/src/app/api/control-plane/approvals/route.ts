import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../_lib/auth';
import { getOrganizationId, getStore } from '../_lib/dependencies';
import type { ApprovalStatus } from '@/domain/control-plane';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/control-plane/approvals — lista gates de aprovação.
 * Filtros: ?status=pending|approved|rejected, ?leadId=…
 */
export async function GET(request: NextRequest) {
  const unauthorized = checkAdminAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const status = url.searchParams.get('status') as ApprovalStatus | null;
  const leadId = url.searchParams.get('leadId');

  const approvals = await getStore().listApprovalGates(getOrganizationId(), {
    ...(status ? { status } : {}),
    ...(leadId ? { leadId } : {}),
  });
  return NextResponse.json({ approvals });
}
