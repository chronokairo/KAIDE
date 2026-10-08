/**
 * Adaptadores Next para o backend RAG (portado do Express — ADR-0005 débito 2).
 * Arquivos em `_lib` não são rotas: o prefixo `_` é ignorado pelo App Router.
 */

import { getChatService } from '@/server/rag/features/chat/service';
import { clearCache } from '@/server/rag/features/documents/persistence';

let readyPromise: Promise<void> | null = null;

/**
 * Inicializa o sistema RAG de forma lazy (equivalente ao setTimeout do main Express):
 * carrega o cache persistido e, se não houver documentos, dispara a indexação em background.
 */
export function ensureRagReady(): Promise<void> {
    if (!readyPromise) {
        const init = (async () => {
            const service = getChatService();
            await service.initialize();

            const stats = service.getStats();
            if (!stats.totalDocuments) {
                void service.indexDocuments().catch((error) => {
                    console.error('[RAG] Falha na indexação automática:', error);
                });
            }
        })();
        readyPromise = init.catch((error) => {
            readyPromise = null;
            throw error;
        });
    }
    return readyPromise;
}

/**
 * Eventos SSE do rebuild do índice (compartilhado por /api/chat/index/rebuild e /api/index/rebuild).
 */
export async function* rebuildEvents(): AsyncGenerator<{
    type: string;
    message: string;
    value?: number;
}> {
    yield { type: 'log', message: '🗑️ Limpando cache anterior...' };

    await clearCache();
    yield { type: 'progress', message: '✓ Cache limpo', value: 10 };

    yield { type: 'log', message: '🔄 Inicializando sistema...' };
    const service = getChatService();
    await service.initialize();
    yield { type: 'progress', message: '✓ Sistema inicializado', value: 30 };

    yield { type: 'log', message: '📚 Carregando documentos da base Supabase (ops_documents)...' };
    yield { type: 'progress', message: '🔍 Coletando documentos...', value: 50 };

    yield { type: 'log', message: '🧠 Gerando embeddings e indexando documentos...' };
    const result = await service.indexDocuments();
    yield { type: 'progress', message: `✓ Indexados ${result.indexed} documentos`, value: 90 };

    if (result.errors > 0) {
        yield { type: 'log', message: `⚠️ ${result.errors} erro(s) durante indexação` };
    }

    yield { type: 'done', message: `✅ Concluído! ${result.indexed} documentos indexados.`, value: 100 };
}
