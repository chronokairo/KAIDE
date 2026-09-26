/**
 * HTTP Utilities
 * 
 * Helper functions for HTTP operations.
 */

import { Response as ExpressResponse } from 'express';

// Núcleo framework-agnostic (compartilhado com as rotas Next)
export { JSON_HEADERS, fetchWithTimeout } from './http-core.js';

/**
 * Send cached response with appropriate headers
 */
export function sendCachedResponse(
    res: ExpressResponse,
    data: unknown,
    options: { cached?: boolean; maxAge?: number } = {}
): void {
    const { cached = false, maxAge = 300 } = options;

    if (cached) {
        res.setHeader('X-Cache', 'HIT');
    } else {
        res.setHeader('X-Cache', 'MISS');
    }

    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    res.json(data);
}

/**
 * Standard error handler for routes
 */
export function handleError(
    res: ExpressResponse,
    error: unknown,
    defaultMessage = 'Internal server error'
): void {
    const message = error instanceof Error ? error.message : defaultMessage;
    const status = (error as { status?: number })?.status || 500;

    res.status(status).json({
        error: message,
        status,
    });
}
