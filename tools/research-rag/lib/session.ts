/**
 * Session and token management (Next.js server-side)
 */

import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from './logger';
import { isProduction } from './environment';

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
 * Set authentication token as httpOnly cookie on a NextResponse
 */
export function setAuthCookie(response: NextResponse, token: string): void {
    response.cookies.set(AUTH_COOKIE_NAME, token, COOKIE_CONFIG);
}

/**
 * Clear authentication cookie on a NextResponse
 */
export function clearAuthCookie(response: NextResponse): void {
    response.cookies.set(AUTH_COOKIE_NAME, '', { ...COOKIE_CONFIG, maxAge: 0 });
    response.cookies.set(SESSION_COOKIE_NAME, '', { ...COOKIE_CONFIG, maxAge: 0 });
}

/**
 * Get token from cookies (using next/headers cookie store)
 */
export function getTokenFromRequestCookies(cookieStore: { get: (name: string) => { value: string } | undefined }): string | null {
    const cookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (cookie?.value && typeof cookie.value === 'string' && cookie.value.length >= 32) {
        return cookie.value;
    }
    return null;
}

/**
 * Get token from a NextRequest
 */
export function getTokenFromRequest(req: NextRequest): string | null {
    // First, try httpOnly cookie
    const cookieToken = req.cookies?.get(AUTH_COOKIE_NAME)?.value;
    if (cookieToken && typeof cookieToken === 'string' && cookieToken.length >= 32) {
        return cookieToken;
    }
    
    // Fallback to Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    return null;
}
