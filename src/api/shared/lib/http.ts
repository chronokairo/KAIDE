/**
 * HTTP Utilities
 * 
 * Helper functions for HTTP operations.
 */

import { Response as ExpressResponse } from 'express';

export const JSON_HEADERS = {
    'Content-Type': 'application/json',
};

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = 800
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

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
