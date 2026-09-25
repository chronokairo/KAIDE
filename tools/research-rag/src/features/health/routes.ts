/**
 * @layer features/health
 * @description Rotas de health check
 */

import { Router, Request, Response } from 'express';

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
