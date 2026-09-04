/**
 * @layer app
 * @description Setup de rotas da aplicação
 */

import { Application, Request, Response } from 'express';
import { logger } from '../shared/lib/logger.js';

// Features
import { totvsRouter, setupTotvsProxies } from '../features/totvs/index.js';
import { healthRouter } from '../features/health/routes.js';
import { authRouter } from '../features/auth/routes.js';
import { adminRouter } from '../features/admin/routes.js';
import { chatRouter } from '../features/chat/routes.js';
import { getChatService } from '../features/chat/service.js';
import conversationsRouter from '../features/conversations/routes.js';

export function setupRoutes(app: Application): void {
    // Status endpoint (usado pelo frontend)
    app.get('/api/status', async (req: Request, res: Response) => {
        try {
            const service = getChatService();
            const status = await service.getStatus();
            const stats = service.getStats();

            res.json({
                status: 'online',
                indexed_documents: stats.totalDocuments || 0,
                ...status,
            });
        } catch (error) {
            res.status(500).json({ status: 'offline', error: String(error) });
        }
    });

    // API Routes
    app.use('/api/totvs', totvsRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/health', healthRouter);
    app.use('/api/chat', chatRouter);
    app.use('/api/conversations', conversationsRouter);

    // Alias para compatibilidade com frontend
    app.use('/api/index', chatRouter);

    // Rota de busca semântica
    app.post('/api/search', async (req: Request, res: Response) => {
        try {
            const { query, top_k = 10 } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }
            const service = getChatService();
            const results = await service.search(query, top_k);
            res.json({ results });
        } catch (error) {
            res.status(500).json({ error: String(error) });
        }
    });

    // Setup TOTVS proxies (ordem importa - depois das rotas especificas)
    setupTotvsProxies(app);

    logger.info('SERVER', 'API routes configuradas');

    // Inicializar sistema (carrega cache se disponível)
    setTimeout(async () => {
        try {
            logger.info('SERVER', 'Iniciando inicialização do sistema RAG...');
            const service = getChatService();
            await service.initialize();

            // Só indexar se necessário (cache não existe ou expirado)
            const stats = service.getStats();
            if (stats.totalDocuments === 0) {
                logger.info('SERVER', 'Cache não encontrado, iniciando indexação...');
                const result = await service.indexDocuments();
                logger.info('SERVER', `Indexação concluída: ${result.indexed} documentos, ${result.errors} erros`);
            } else {
                logger.info('SERVER', `Sistema pronto com ${stats.totalDocuments} documentos em cache`);
            }
        } catch (error) {
            logger.error('SERVER', 'Erro na inicialização:', { error: String(error) });
        }
    }, 2000); // Aguarda 2 segundos após o servidor iniciar
}
