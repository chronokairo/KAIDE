/**
 * @layer features/health
 * @description Rotas de health check
 */

import { Router, Request, Response } from 'express';
import { adminAuthMiddleware } from '../auth/middleware.js';
import { getSupabase } from '../../shared/lib/supabase.js';

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
 * GET /supabase - Test Supabase prod connectivity (ops_documents head)
 */
healthRouter.get('/supabase', adminAuthMiddleware, async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
        const supabase = getSupabase();
        const { error } = await supabase.from('ops_documents').select('id').limit(1);

        if (error) throw error;

        const duration = Date.now() - startTime;
        res.json({
            success: true,
            status: 'connected',
            duration: `${duration}ms`
        });
    } catch (error: any) {
        const duration = Date.now() - startTime;
        res.status(503).json({
            success: false,
            status: 'unreachable',
            duration: `${duration}ms`,
            error: error.message
        });
    }
});
