import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from '@/server/rag/features/auth/csrf-core';
import { SESSION_COOKIE_NAME, withSessionCookie } from '../../_lib/auth';
import { getClientIp } from '../../_lib/http';
import { strictLimit } from '../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/csrf - Gera um token CSRF para formulários de login.
 */
export async function GET(request: NextRequest) {
    const limited = strictLimit(request);
    if (limited) return limited;

    const existingSessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionId = existingSessionId ?? crypto.randomBytes(32).toString('hex');

    const response = withSessionCookie(
        NextResponse.json({ success: true, csrfToken: generateCsrfToken(sessionId) }),
        sessionId
    );

    logger.info('CSRF', 'CSRF token generated for login', { ip: getClientIp(request) });
    return response;
}
