/**
 * CSRF protection (standalone, no Express middleware)
 */

import crypto from 'crypto';
import { logger } from './logger';

// CSRF token store
const csrfTokens = new Map<string, { sessionId: string; expiresAt: number }>();

/**
 * Generate a CSRF token for a session
 */
export function generateCsrfToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    csrfTokens.set(token, {
        sessionId,
        expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
    });
    return token;
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(token: string, sessionId: string): boolean {
    const data = csrfTokens.get(token);
    if (!data) return false;
    if (Date.now() > data.expiresAt) {
        csrfTokens.delete(token);
        return false;
    }
    if (data.sessionId !== sessionId) return false;
    // Delete after use (single-use tokens)
    csrfTokens.delete(token);
    return true;
}

/**
 * Standalone CSRF request validation (alternative to Express middleware)
 */
export function validateCsrfRequest(token: string, sessionId: string): { valid: boolean; error?: string } {
    if (!token || !sessionId) {
        logger.warn('CSRF', 'Missing CSRF token or session');
        return { valid: false, error: 'CSRF validation failed' };
    }

    if (!validateCsrfToken(token, sessionId)) {
        logger.warn('CSRF', 'Invalid CSRF token');
        return { valid: false, error: 'CSRF validation failed' };
    }

    return { valid: true };
}

// Clean up expired CSRF tokens every 10 minutes
setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    csrfTokens.forEach((data, token) => {
        if (now > data.expiresAt) {
            keysToDelete.push(token);
        }
    });
    keysToDelete.forEach(key => csrfTokens.delete(key));
}, 10 * 60 * 1000);
