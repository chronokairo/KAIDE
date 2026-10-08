/**
 * @layer features/chat
 * @description Serviço de chat com RAG baseado em documentos
 */

import type { ChatMessage, ChatResponse, ChatSource, StreamChunk } from './types.js';
import { DocumentRAGEngine } from '../rag/document-engine.js';
import { getSupabase, PROD_ORGANIZATION_ID } from '../../shared/lib/supabase.js';

export class ChatService {
  private ragEngine: DocumentRAGEngine;

  constructor() {
    this.ragEngine = new DocumentRAGEngine();
  }

  /**
   * Inicializa o sistema RAG
   */
  async initialize(): Promise<void> {
    await this.ragEngine.initialize();
  }

  /**
   * Indexa documentos
   */
  async indexDocuments(): Promise<any> {
    return await this.ragEngine.indexDocuments();
  }

  /**
   * Processa uma mensagem de chat
   */
  async processMessage(message: string): Promise<ChatResponse> {
    console.log(`[ChatService] Processing message: "${message}"`);
    const response = await this.ragEngine.query(message);
    console.log(`[ChatService] RAG response: "${response.answer?.substring(0, 100)}..."`);
    const sources = await this.ragEngine.getSourcesForQuery(message);

    return {
      response: response.answer,
      sources: sources.map((s) => ({
        source: s.source,
        endpoint: s.endpoint,
        dataPreview: s.dataPreview,
      })),
    };
  }

  /**
   * Gera resumo operacional para dashboard/KPI a partir do Supabase
   * (support_tickets + employees da organização).
   */
  async generateDashboard(message: string): Promise<ChatResponse> {
    console.log(`[ChatService] Generating dashboard for: "${message}"`);

    try {
      const supabase = getSupabase();
      const organizationId = process.env.CONTROL_PLANE_ORGANIZATION_ID || PROD_ORGANIZATION_ID;

      const [{ data: tickets }, { data: staff }] = await Promise.all([
        supabase
          .from('support_tickets')
          .select('id, status, priority, channel, category, created_at, resolved_at')
          .eq('organization_id', organizationId)
          .limit(500),
        supabase
          .from('employees')
          .select('id, full_name, job_title, status, department_id')
          .eq('organization_id', organizationId)
          .limit(200),
      ]);

      const ticketRows = (tickets || []) as Array<{
        status: string | null; priority: string | null; channel: string | null;
      }>;
      const staffRows = (staff || []) as Array<{ status: string | null; job_title: string | null }>;

      const countBy = (rows: Array<Record<string, unknown>>, key: string) => {
        const map: Record<string, number> = {};
        for (const row of rows) {
          const value = String(row[key] ?? 'indefinido');
          map[value] = (map[value] || 0) + 1;
        }
        return map;
      };

      const byStatus = countBy(ticketRows as Array<Record<string, unknown>>, 'status');
      const byPriority = countBy(ticketRows as Array<Record<string, unknown>>, 'priority');
      const byChannel = countBy(ticketRows as Array<Record<string, unknown>>, 'channel');
      const activeStaff = staffRows.filter((s) => (s.status || '').toLowerCase() === 'active').length;

      const lines = [
        '## Suporte — resumo operacional',
        '',
        `- Tickets: ${ticketRows.length} (colaboradores ativos: ${staffRows.length ? activeStaff : 0}/${staffRows.length})`,
        `- Por status: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}`,
        `- Por prioridade: ${Object.entries(byPriority).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}`,
        `- Por canal: ${Object.entries(byChannel).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}`,
      ];

      const sources = await this.ragEngine.getSourcesForQuery(message);

      return {
        response: lines.join('\n'),
        sources: [
          {
            source: 'supabase:support_tickets',
            endpoint: 'support_tickets',
            dataPreview: `${ticketRows.length} tickets`,
          },
          {
            source: 'supabase:employees',
            endpoint: 'employees',
            dataPreview: `${staffRows.length} colaboradores`,
          },
          ...sources.map((s) => ({
            source: s.source,
            endpoint: s.endpoint,
            dataPreview: s.dataPreview,
          })),
        ],
      };
    } catch (error) {
      console.error('[ChatService] Error generating dashboard:', error);
      return {
        response: `Erro ao gerar dashboard: ${error}. Verifique se o Supabase está acessível.`,
        sources: [],
      };
    }
  }

  /**
   * Processa uma mensagem com streaming
   */
  async *processMessageStream(message: string): AsyncGenerator<StreamChunk> {

    // Primeiro, enviar as fontes
    const sources = await this.ragEngine.getSourcesForQuery(message);
    yield { type: 'sources', data: sources };

    // Depois, stream da resposta
    for await (const chunk of this.ragEngine.queryStream(message)) {
      yield { type: 'chunk', data: chunk };
    }

    yield { type: 'done' };
  }





  /**
   * Verifica status do sistema
   */
  async getStatus(): Promise<Record<string, any>> {
    return this.ragEngine.getStatus();
  }

  /**
   * Obtém estatísticas
   */
  getStats(): any {
    return this.ragEngine.getStats();
  }

  /**
   * Busca semântica nos documentos indexados
   */
  async search(query: string, topK: number = 10): Promise<any[]> {
    const results = await this.ragEngine.retrieve(query, topK);
    return results.map((doc, idx) => ({
      file: doc.metadata.source,
      title: doc.metadata.title,
      content: doc.content.slice(0, 500),
      relevance: 1 - (idx * 0.1), // Aproximado baseado na ordem
    }));
  }
}

// Singleton para uso global
let chatService: ChatService | null = null;

export function getChatService(): ChatService {
  if (!chatService) {
    chatService = new ChatService();
  }
  return chatService;
}
