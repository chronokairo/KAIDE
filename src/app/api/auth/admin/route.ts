import { NextRequest, NextResponse } from 'next/server';
import { timingSafeCompare } from '@/server/rag/shared/lib/crypto';
import { ADMIN_PASSWORD, ADMIN_USERNAME, isProduction } from '@/server/rag/shared/config/environment';
import { validateCsrfToken } from '@/server/rag/features/auth/csrf-core';
import {
    SESSION_COOKIE_NAME,
    generateSecureToken,
    registerToken,
    withAuthCookie,
} from '../../_lib/auth';
import { getClientIp } from '../../_lib/http';
import { strictLimit } from '../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/admin - Login de administrador.
 */
export async function POST(request: NextRequest) {
    const limited = strictLimit(request);
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    const { username, password, csrfToken } = body ?? {};
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (csrfToken && sessionId) {
        if (!validateCsrfToken(csrfToken, sessionId)) {
            logger.warn('CSRF', 'Invalid CSRF token on admin login', { ip: getClientIp(request) });
            return NextResponse.json(
                { success: false, error: 'Sessão expirada. Recarregue a página.', code: 'CSRF_INVALID' },
                { status: 403 }
            );
        }
    } else if (isProduction) {
        logger.warn('CSRF', 'Missing CSRF token on admin login', { ip: getClientIp(request) });
    }

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 400 });
    }

    if (!ADMIN_PASSWORD) {
        logger.warn('AUTH', 'Admin login attempt but ADMIN_PASSWORD not configured');
        return NextResponse.json(
            { success: false, error: 'Sistema de login não configurado' },
            { status: 503 }
        );
    }

    const usernameValid = timingSafeCompare(username, ADMIN_USERNAME);
    const passwordValid = timingSafeCompare(password, ADMIN_PASSWORD);

    if (usernameValid && passwordValid) {
        const token = generateSecureToken();
        registerToken(token, `admin:${username}`);
        logger.info('AUTH', 'Admin login successful', { username });
        return withAuthCookie(
            NextResponse.json({ success: true, message: 'Login realizado com sucesso' }),
            token
        );
    }

    logger.warn('AUTH', 'Failed admin login attempt', { username, ip: getClientIp(request) });
    return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 });
}
