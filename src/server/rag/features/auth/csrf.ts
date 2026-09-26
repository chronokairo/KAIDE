/**
 * @layer features/auth
 * @description Proteção CSRF
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/lib/logger.js';

// Núcleo framework-agnostic (compartilhado com as rotas Next)
export { generateCsrfToken, validateCsrfToken } from './csrf-core.js';

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
