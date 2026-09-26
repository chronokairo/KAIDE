import { NextRequest, NextResponse } from 'next/server';
import { getSystemInfo } from '@/server/rag/features/admin/system-info';
import { checkAdminAuth } from '../../_lib/auth';
import { generalLimit } from '../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/system-info - Informações do sistema.
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const unauthorized = checkAdminAuth(request);
    if (unauthorized) return unauthorized;

    try {
        const result = await getSystemInfo();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
