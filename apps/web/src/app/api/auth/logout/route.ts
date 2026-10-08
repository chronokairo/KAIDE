import { NextRequest, NextResponse } from 'next/server';
import { getToken, invalidateToken, withClearedAuthCookies } from '../../_lib/auth';
import { getClientIp } from '../../_lib/http';
import { strictLimit } from '../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout - Logout e limpeza dos cookies httpOnly.
 */
export async function POST(request: NextRequest) {
    const limited = strictLimit(request);
    if (limited) return limited;

    const token = getToken(request);
    if (token) {
        invalidateToken(token);
    }

    logger.info('AUTH', 'User logged out', { ip: getClientIp(request) });
    const response = NextResponse.json({ success: true, message: 'Logout successful' });
    return withClearedAuthCookies(response);
}
