/**
 * CIESA Site Server - Feature-Sliced Design
 * 
 * Estrutura:
 * - app/       - Bootstrap e configuração do servidor Express
 * - features/  - Funcionalidades de negócio (cms, auth, admin, health)
 * - entities/  - Modelos de domínio (atendente)
 * - shared/    - Código compartilhado (config, lib, types)
 */

// IMPORTANTE: carregar .env ANTES de importar qualquer outro módulo
import './env.js';

import { createApp, setupRoutes, setupStaticFiles } from './app/index.js';
import { logger } from './shared/lib/logger.js';
import { PORT } from './shared/config/environment.js';

async function startServer() {
    const { app, server } = createApp();

    // Setup all routes
    setupRoutes(app);

    // Setup static files and SPA fallback
    setupStaticFiles(app);

    // Start server
    server.listen(PORT, () => {
        logger.info('SERVER', `Servidor iniciado na porta ${PORT}`, { port: PORT });
        console.log(`Server running on http://localhost:${PORT}/`);
    });
}

startServer().catch(console.error);
