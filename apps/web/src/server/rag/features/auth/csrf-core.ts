/**
 * @layer features/auth
 * @description Núcleo de proteção CSRF — framework-agnostic (usado por rotas Next e pelo legado Express)
 */

import crypto from 'crypto';

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
