/**
 * @layer features/health
 * @description Rotas de health check
 */

import { Router, Request, Response } from 'express';
import { fetchWithTimeout, JSON_HEADERS } from '../../shared/lib/http.js';
import { TOTVS_BASE_URL, TOTVS_AUTH } from '../../shared/config/environment.js';
import { adminAuthMiddleware } from '../auth/middleware.js';

export const healthRouter: Router = Router();

/**
 * GET / - Health check básico
 */
healthRouter.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /totvs - Test TOTVS connectivity
 */
healthRouter.get('/totvs', adminAuthMiddleware, async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
        const testUrl = `${TOTVS_BASE_URL}/api/framework/v1/consultaSQLServer/RealizaConsulta/E.NIVEL/0/S/?parameters=CODCOLIGADA%3D4%3B`;

        const response = await fetchWithTimeout(testUrl, {
            method: 'GET',
            headers: {
                ...JSON_HEADERS,
                'Authorization': `Basic ${TOTVS_AUTH}`,
                'login': '1'
            }
        }, 10000);

        const duration = Date.now() - startTime;

        res.json({
            success: true,
            status: 'connected',
            duration: `${duration}ms`,
            statusCode: response.status,
            totvs_url: TOTVS_BASE_URL
        });
    } catch (error: any) {
        const duration = Date.now() - startTime;

        res.status(503).json({
            success: false,
            status: 'unreachable',
            duration: `${duration}ms`,
            error: error.message,
            cause: error.cause?.code || error.cause?.message || 'unknown',
            totvs_url: TOTVS_BASE_URL
        });
    }
});
