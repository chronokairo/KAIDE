import { NextRequest, NextResponse } from 'next/server';
import { timingSafeCompare } from '@/server/rag/shared/lib/crypto';
import { ATTENDANT_INITIAL_PASSWORD, isProduction } from '@/server/rag/shared/config/environment';
import { validateCsrfToken } from '@/server/rag/features/auth/csrf-core';
import {
    SESSION_COOKIE_NAME,
    generateSecureToken,
    registerToken,
    withAuthCookie,
} from '../../../_lib/auth';
import { getClientIp } from '../../../_lib/http';
import { strictLimit } from '../../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/attendant/validate - Valida a senha inicial do atendente.
 */
export async function POST(request: NextRequest) {
    const limited = strictLimit(request);
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    const { code, password, csrfToken } = body ?? {};
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (csrfToken && sessionId) {
        if (!validateCsrfToken(csrfToken, sessionId)) {
            logger.warn('CSRF', 'Invalid CSRF token on attendant validate', { ip: getClientIp(request) });
            return NextResponse.json(
                { success: false, error: 'Sessão expirada. Recarregue a página.', code: 'CSRF_INVALID' },
                { status: 403 }
            );
        }
    } else if (isProduction) {
        logger.warn('CSRF', 'Missing CSRF token on attendant validate', { ip: getClientIp(request) });
    }

    if (!code || !password || typeof password !== 'string') {
        return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }

    if (!ATTENDANT_INITIAL_PASSWORD) {
        logger.warn('AUTH', 'Attendant validation attempt but ATTENDANT_INITIAL_PASSWORD not configured');
        return NextResponse.json(
            { success: false, error: 'Sistema de login não configurado' },
            { status: 503 }
        );
    }

    if (timingSafeCompare(password, ATTENDANT_INITIAL_PASSWORD)) {
        const token = generateSecureToken();
        registerToken(token, `attendant:${code}`);
        logger.info('AUTH', 'Attendant initial password validated', { code });
        return withAuthCookie(
            NextResponse.json({ success: true, message: 'Senha validada com sucesso' }),
            token
        );
    }

    logger.warn('AUTH', 'Failed attendant password validation', { code, ip: getClientIp(request) });
    return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 });
}
