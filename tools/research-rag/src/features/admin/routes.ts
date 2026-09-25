/**
 * @layer features/admin
 * @description Rotas de administração
 */

import { Router, Request, Response } from 'express';
import { adminAuthMiddleware } from '../auth/middleware.js';
import { getSystemInfo } from './system-info.js';
import { getLogs, getLogStats, clearLogs, logger } from '../../shared/lib/logger.js';

export const adminRouter: Router = Router();

/**
 * GET /system-info - Informações do sistema
 */
adminRouter.get('/system-info', adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await getSystemInfo();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /logs - Consultar logs
 */
adminRouter.get('/logs', adminAuthMiddleware, (req: Request, res: Response) => {
    const { level, category, limit, since } = req.query;
    const options: any = {};
    if (level) options.level = level as string;
    if (category) options.category = category as string;
    if (limit) options.limit = parseInt(limit as string);
    if (since) options.since = new Date(since as string);

    const logs = getLogs(options);
    res.json({ success: true, count: logs.length, logs });
});

/**
 * GET /logs/stats - Estatísticas de logs
 */
adminRouter.get('/logs/stats', adminAuthMiddleware, (req: Request, res: Response) => {
    res.json({ success: true, stats: getLogStats() });
});

/**
 * POST /logs/clear - Limpar logs
 */
adminRouter.post('/logs/clear', adminAuthMiddleware, (req: Request, res: Response) => {
    clearLogs();
    res.json({ success: true, message: 'Logs limpos com sucesso' });
});

/**
 * POST /logs/error - Log de erros do frontend
 */
adminRouter.post('/logs/error', (req: Request, res: Response) => {
    const { category, message, details } = req.body;

    if (!category || !message) {
        return res.status(400).json({ success: false, error: 'category e message são obrigatórios' });
    }

    logger.error(category, message, {
        ...details,
        source: 'frontend',
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    res.json({ success: true });
});
