/**
 * @layer features/auth
 * @description Proteção CSRF
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/lib/logger.js';

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
 * Middleware to validate CSRF token
 */
export function requireCsrf(req: Request, res: Response, next: NextFunction) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const csrfToken = req.headers['x-csrf-token'] as string;
    const sessionId = req.cookies?.sessionId;

    if (!csrfToken || !sessionId) {
        logger.warn('CSRF', `Missing CSRF token or session from ${req.ip}`, { path: req.path });
        return res.status(403).json({
            success: false,
            error: 'CSRF validation failed',
            code: 'CSRF_INVALID'
        });
    }

    if (!validateCsrfToken(csrfToken, sessionId)) {
        logger.warn('CSRF', `Invalid CSRF token from ${req.ip}`, { path: req.path });
        return res.status(403).json({
            success: false,
            error: 'CSRF validation failed',
            code: 'CSRF_INVALID'
        });
    }

    next();
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
