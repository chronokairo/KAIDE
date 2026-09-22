/**
 * @layer features/auth
 * @description Gerenciamento de sessões e tokens
 */

import crypto from 'crypto';
import { Response, Request } from 'express';
import { logger } from '../../shared/lib/logger.js';
import { isProduction } from '../../shared/config/environment.js';

// Cookie configuration
export const COOKIE_CONFIG = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
};

export const AUTH_COOKIE_NAME = 'authToken';
export const SESSION_COOKIE_NAME = 'sessionId';

// In-memory token store (em produção usar Redis)
const validTokens = new Map<string, { userId: string; expiresAt: number }>();

// Limpar tokens expirados a cada 5 minutos
setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    validTokens.forEach((data, token) => {
        if (now > data.expiresAt) {
            keysToDelete.push(token);
        }
    });
    keysToDelete.forEach(key => validTokens.delete(key));
}, 5 * 60 * 1000);

/**
 * Generate a secure random token
 */
export function generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Register a valid token
 */
export function registerToken(token: string, userId: string, ttlMs: number = 24 * 60 * 60 * 1000): void {
    validTokens.set(token, {
        userId,
        expiresAt: Date.now() + ttlMs
    });
}

/**
 * Invalidate a token
 */
export function invalidateToken(token: string): boolean {
    return validTokens.delete(token);
}

/**
 * Validate a token
 */
export function validateToken(token: string | null): { valid: boolean; userId?: string; error?: string } {
    if (!token) {
        return { valid: false, error: 'No token provided' };
    }

    if (!/^[a-f0-9]{64}$/.test(token)) {
        return { valid: false, error: 'Invalid token format' };
    }

    const tokenData = validTokens.get(token);
    if (!tokenData) {
        return { valid: false, error: 'Token not found' };
    }

    if (Date.now() > tokenData.expiresAt) {
        validTokens.delete(token);
        return { valid: false, error: 'Token expired' };
    }

    return { valid: true, userId: tokenData.userId };
}

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
