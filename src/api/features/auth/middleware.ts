/**
 * @layer features/auth
 * @description Middlewares de autenticação
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/lib/logger.js';
import { timingSafeCompare } from '../../shared/lib/crypto.js';
import { isProduction, ADMIN_API_KEY } from '../../shared/config/environment.js';
import { getTokenFromRequest, validateToken } from './session.js';

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = getTokenFromRequest(req);

    if (!token) {
        logger.warn('AUTH', `Unauthorized access attempt to ${req.path} from ${req.ip}`);
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }

    if (!token || token.length < 32) {
        logger.warn('AUTH', `Invalid token format for ${req.path} from ${req.ip}`);
        return res.status(401).json({
            success: false,
            error: 'Invalid authentication token',
            code: 'INVALID_TOKEN'
        });
    }

    if (!/^[a-f0-9]{64}$/.test(token)) {
        logger.warn('AUTH', `Malformed token for ${req.path} from ${req.ip}`);
        return res.status(401).json({
            success: false,
            error: 'Invalid authentication token',
            code: 'INVALID_TOKEN'
        });
    }

    const validation = validateToken(token);
    if (!validation.valid) {
        logger.warn('AUTH', `Token validation failed for ${req.path} from ${req.ip}: ${validation.error}`);
        return res.status(401).json({
            success: false,
            error: validation.error === 'Token expired' ? 'Token expired' : 'Invalid or expired token',
            code: validation.error === 'Token expired' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
        });
    }

    (req as any).userId = validation.userId;
    
    logger.info('AUTH', 'Token validated', { path: req.path, userId: validation.userId });
    next();
}

/**
 * Middleware to require admin API key
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
    const adminKey = req.headers['x-admin-key'] as string;

    if (!ADMIN_API_KEY) {
        logger.warn('AUTH', 'Admin endpoint accessed but ADMIN_API_KEY not configured');
        return res.status(503).json({
            success: false,
            error: 'Admin endpoints not configured',
            code: 'ADMIN_NOT_CONFIGURED'
        });
    }

    if (!timingSafeCompare(adminKey, ADMIN_API_KEY)) {
        logger.warn('AUTH', `Invalid admin key attempt from ${req.ip}`, {
            path: req.path,
            method: req.method
        });
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - Invalid admin key',
            code: 'UNAUTHORIZED'
        });
    }

    logger.info('AUTH', 'Admin access granted', { path: req.path, method: req.method });
    next();
}

/**
 * Audit log middleware for sensitive data access
 */
export function auditLog(req: Request, res: Response, next: NextFunction) {
    logger.info('AUDIT', `Sensitive data access: ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    });
    next();
}

/**
 * Admin auth middleware - skip in development
 */
export const adminAuthMiddleware = isProduction 
    ? requireAdminAuth 
    : (req: Request, res: Response, next: NextFunction) => next();
