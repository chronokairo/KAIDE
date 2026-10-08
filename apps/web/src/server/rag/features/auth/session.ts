/**
 * @layer features/auth
 * @description Gerenciamento de sessões e tokens
 */

import { Response, Request } from 'express';

// Núcleo framework-agnostic (compartilhado com as rotas Next)
export {
    COOKIE_CONFIG,
    AUTH_COOKIE_NAME,
    SESSION_COOKIE_NAME,
    generateSecureToken,
    registerToken,
    invalidateToken,
    validateToken
} from './session-core.js';

/**
 * Set authentication token as httpOnly cookie
 */
export function setAuthCookie(res: Response, token: string): void {
    res.cookie(AUTH_COOKIE_NAME, token, COOKIE_CONFIG);
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Get token from request
 */
export function getTokenFromRequest(req: Request): string | null {
    // First, try httpOnly cookie
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
    if (cookieToken && typeof cookieToken === 'string' && cookieToken.length >= 32) {
        return cookieToken;
    }
    
    // Fallback to Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    return null;
}
