import { NextRequest, NextResponse } from 'next/server';
import { getToken, validateToken } from '../../_lib/auth';
import { getClientIp } from '../../_lib/http';
import { strictLimit } from '../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/verify - Verifica se a sessão atual é válida.
 */
export async function GET(request: NextRequest) {
    const limited = strictLimit(request);
    if (limited) return limited;

    const token = getToken(request);

    if (!token) {
        return NextResponse.json(
            { success: false, error: 'Not authenticated', code: 'AUTH_REQUIRED' },
            { status: 401 }
        );
    }

    const validation = validateToken(token);

    if (!validation.valid) {
        logger.warn('AUTH', `Invalid session verification attempt: ${validation.error}`, {
            ip: getClientIp(request),
        });
        return NextResponse.json(
            { success: false, error: 'Session invalid or expired', code: 'INVALID_TOKEN' },
            { status: 401 }
        );
    }

    logger.info('AUTH', 'Session verified', { ip: getClientIp(request), userId: validation.userId });
    return NextResponse.json({ success: true, message: 'Session valid' });
}
