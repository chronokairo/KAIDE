/**
 * @layer features/chat
 * @description Rotas do chat para Express
 */

import { Router, Request, Response } from 'express';
import { getChatService } from './service.js';
import type { ChatRequest } from './types.js';

export const chatRouter: Router = Router();

/**
 * GET /chat/status - Status do sistema de chat
 */
chatRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const service = getChatService();
    const status = await service.getStatus();

    res.json({
      status: 'online',
      ...status,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

/**
 * POST /chat/index - Indexa os documentos
 */
chatRouter.post('/index', async (req: Request, res: Response) => {
  try {
    const service = getChatService();
    const result = await service.indexDocuments();

    res.json({
      success: true,
      indexed: result.indexed,
      errors: result.errors,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * POST /chat/index/rebuild - Reconstrói o índice (limpa cache + reindexar)
 * Com streaming de progresso
 */
chatRouter.post('/index/rebuild', async (req: Request, res: Response) => {
  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (type: string, message: string, value?: number) => {
    res.write(`data: ${JSON.stringify({ type, message, value })}\n\n`);
  };

  try {
    sendEvent('log', '🗑️ Limpando cache anterior...');
    
    // Limpar cache
    const { clearCache } = await import('../documents/persistence.js');
    await clearCache();
    sendEvent('progress', '✓ Cache limpo', 10);

    sendEvent('log', '🔄 Inicializando sistema...');
    const service = getChatService();
    await service.initialize();
    sendEvent('progress', '✓ Sistema inicializado', 30);

    sendEvent('log', '📚 Carregando dados das APIs TOTVS...');
    sendEvent('log', '  - Buscando áreas de conhecimento...');
    sendEvent('log', '  - Buscando ofertas de cursos...');
    sendEvent('log', '  - Buscando ranking de cursos...');
    sendEvent('log', '  - Buscando histórico de matrículas...');
    sendEvent('progress', '🔍 Coletando dados...', 50);

    sendEvent('log', '🧠 Gerando embeddings e indexando documentos...');
    const result = await service.indexDocuments();
    sendEvent('progress', `✓ Indexados ${result.indexed} documentos`, 90);

    if (result.errors > 0) {
      sendEvent('log', `⚠️ ${result.errors} erro(s) durante indexação`);
    }

    sendEvent('done', `✅ Concluído! ${result.indexed} documentos indexados.`, 100);
    
  } catch (error) {
    sendEvent('log', `❌ Erro: ${String(error)}`);
  } finally {
    res.end();
  }
});

/**
 * DELETE /chat/cache - Limpa o cache persistido
 */
chatRouter.delete('/cache', async (req: Request, res: Response) => {
  try {
    const { clearCache } = await import('../documents/persistence.js');
    await clearCache();

    res.json({
      success: true,
      message: 'Cache limpo com sucesso. Próxima requisição irá re-indexar.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * POST /chat/dashboard - Gera dados para dashboard/KPI
 */
chatRouter.post('/dashboard', async (req: Request, res: Response) => {
  try {
    const body = req.body as ChatRequest;

    if (!body.message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const service = getChatService();
    const response = await service.generateDashboard(body.message);

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /chat - Chat simples (não streaming)
 */
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as ChatRequest;

    if (!body.message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const service = getChatService();
    const response = await service.processMessage(body.message);

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /chat/stream - Chat com streaming SSE
 */
chatRouter.post('/stream', async (req: Request, res: Response) => {
  const body = req.body as ChatRequest;

  if (!body.message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Configurar headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const service = getChatService();

    for await (const chunk of service.processMessageStream(body.message)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: String(error) })}\n\n`);
    res.end();
  }
});

/**
 * POST /chat/turmas - Consulta específica sobre turmas e matrículas
 * Busca dados em tempo real das APIs e usa NLP para responder
 */
chatRouter.post('/turmas', async (req: Request, res: Response) => {
  const body = req.body as ChatRequest;

  if (!body.message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Configurar headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const service = getChatService();

    for await (const chunk of service.processMessageTurmas(body.message)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: String(error) })}\n\n`);
    res.end();
  }
});
