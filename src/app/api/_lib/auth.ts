import { NextRequest, NextResponse } from 'next/server';
import { timingSafeCompare } from '@/server/rag/shared/lib/crypto';
import { isProduction, ADMIN_API_KEY } from '@/server/rag/shared/config/environment';
import { logger } from '@/server/rag/shared/lib/logger';
import { getClientIp } from './http';
import {
    AUTH_COOKIE_NAME,
    SESSION_COOKIE_NAME,
    COOKIE_CONFIG,
    generateSecureToken,
    registerToken,
    invalidateToken,
    validateToken,
} from '@/server/rag/features/auth/session-core';

export {
    AUTH_COOKIE_NAME,
    SESSION_COOKIE_NAME,
    generateSecureToken,
    registerToken,
    invalidateToken,
    validateToken,
};

/**
 * Extrai o token de autenticação (cookie httpOnly ou header Bearer).
 */
export function getToken(request: NextRequest): string | null {
    const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (cookieToken && cookieToken.length >= 32) {
        return cookieToken;
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

/**
 * Autentica a requisição (equivalente ao requireAuth do Express).
 * Retorna o userId ou null (com log de auditoria).
 */
export function authenticate(request: NextRequest, path: string): string | null {
    const token = getToken(request);

    if (!token) {
        logger.warn('AUTH', `Unauthorized access attempt to ${path}`);
        return null;
    }

    if (token.length < 32 || !/^[a-f0-9]{64}$/.test(token)) {
        logger.warn('AUTH', `Invalid token format for ${path}`);
        return null;
    }

    const validation = validateToken(token);
    if (!validation.valid) {
        logger.warn('AUTH', `Token validation failed for ${path}: ${validation.error}`);
        return null;
    }

    logger.info('AUTH', 'Token validated', { path, userId: validation.userId });
    return validation.userId ?? null;
}

/**
 * Log de auditoria para acesso a dados sensíveis (equivalente ao auditLog do Express).
 */
export function auditLog(request: NextRequest): void {
    logger.info('AUDIT', `Sensitive data access: ${request.method} ${request.nextUrl.pathname}`, {
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
    });
}

export function authRequiredResponse(): NextResponse {
    return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
    );
}

/**
 * Admin API key (equivalente ao adminAuthMiddleware: skip em dev, X-Admin-Key em prod).
 * Retorna null quando autorizado, ou a resposta de erro.
 */
export function checkAdminAuth(request: NextRequest): NextResponse | null {
    if (!isProduction) return null;

    if (!ADMIN_API_KEY) {
        logger.warn('AUTH', 'Admin endpoint accessed but ADMIN_API_KEY not configured');
        return NextResponse.json(
            { success: false, error: 'Admin endpoints not configured', code: 'ADMIN_NOT_CONFIGURED' },
            { status: 503 }
        );
    }

    const adminKey = request.headers.get('x-admin-key') ?? '';
    if (!timingSafeCompare(adminKey, ADMIN_API_KEY)) {
        logger.warn('AUTH', 'Invalid admin key attempt', { path: request.nextUrl.pathname, method: request.method });
        return NextResponse.json(
            { success: false, error: 'Unauthorized - Invalid admin key', code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    logger.info('AUTH', 'Admin access granted', { path: request.nextUrl.pathname, method: request.method });
    return null;
}

export function withAuthCookie(response: NextResponse, token: string): NextResponse {
    response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: COOKIE_CONFIG.maxAge / 1000, // Next usa segundos
        path: '/',
    });
    return response;
}

export function withClearedAuthCookies(response: NextResponse): NextResponse {
    response.cookies.set(AUTH_COOKIE_NAME, '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
    });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
    });
    return response;
}

export function withSessionCookie(response: NextResponse, sessionId: string): NextResponse {
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 60 * 60, // 1 hora (segundos)
        path: '/',
    });
    return response;
}
