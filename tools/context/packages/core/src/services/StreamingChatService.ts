import { Context } from 'hono';
import { Logger } from '../utils/Logger';
import { AIProvider } from '../providers/AIProvider';
import { ChatMessage } from '../database';
import { getEventBus } from '../events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Streaming Chat Service
 * 
 * Fornece streaming em tempo real de respostas da LLM
 * usando Server-Sent Events (SSE) no HTTP
 * 
 * Alternativa de baixa latência ao WebSocket para chat
 */

export interface StreamConfig {
  channel: string;
  pipelineId?: string;
  userId: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StreamMessage {
  id: string;
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timestamp: string;
  error?: string;
}

export class StreamingChatService {
  private logger = Logger.getInstance();
  private activeStreams: Map<string, AbortController> = new Map();
  private bus = getEventBus('streaming-chat');

  constructor(private aiProvider: AIProvider) {}

  /**
   * Criar stream de resposta para requisição HTTP
   */
  async createStream(
    c: Context,
    messages: ChatMessage[],
    config: StreamConfig
  ): Promise<void> {
    const streamId = uuidv4();
    const abortController = new AbortController();

    this.activeStreams.set(streamId, abortController);

    this.logger.info('[StreamingChat] Stream created', {
      streamId,
      channel: config.channel,
      messageCount: messages.length,
    });

    // Configurar headers para SSE
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('Access-Control-Allow-Origin', '*');

    try {
      // Emitir evento de início
      const startMessage: StreamMessage = {
        id: streamId,
        type: 'start',
        timestamp: new Date().toISOString(),
      };

      c.text(`data: ${JSON.stringify(startMessage)}\n\n`);

      // Chamar LLM com streaming
      const response = await this.aiProvider.chat(
        messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        {
          streaming: true,
          signal: abortController.signal,
        }
      );

      // Se resposta for stream, consumir chunk por chunk
      if (typeof response === 'string') {
        // Resposta simples, enviar como single chunk
        const chunkMessage: StreamMessage = {
          id: streamId,
          type: 'chunk',
          content: response,
          timestamp: new Date().toISOString(),
        };

        c.text(`data: ${JSON.stringify(chunkMessage)}\n\n`);
      } else {
        // Resposta é iterável/stream
        for await (const chunk of response as AsyncIterable<string>) {
          if (abortController.signal.aborted) {
            break;
          }

          const chunkMessage: StreamMessage = {
            id: streamId,
            type: 'chunk',
            content: chunk,
            timestamp: new Date().toISOString(),
          };

          c.text(`data: ${JSON.stringify(chunkMessage)}\n\n`);

          // Pequeno delay para permitir client cancelar
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Emitir evento de conclusão
      const endMessage: StreamMessage = {
        id: streamId,
        type: 'end',
        timestamp: new Date().toISOString(),
      };

      c.text(`data: ${JSON.stringify(endMessage)}\n\n`);

      // Emitir evento no bus
      await this.bus.emit('chat:message:streamed', {
        streamId,
        channel: config.channel,
        pipelineId: config.pipelineId,
        userId: config.userId,
        timestamp: new Date().toISOString(),
      });

      this.logger.info('[StreamingChat] Stream completed', { streamId });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.info('[StreamingChat] Stream canceled', { streamId });
      } else {
        this.logger.error('[StreamingChat] Stream error', {
          streamId,
          error,
        });

        const errorMessage: StreamMessage = {
          id: streamId,
          type: 'error',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        };

        c.text(`data: ${JSON.stringify(errorMessage)}\n\n`);
      }
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Cancelar stream ativo
   */
  cancelStream(streamId: string): void {
    const controller = this.activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(streamId);
      this.logger.debug('[StreamingChat] Stream canceled', { streamId });
    }
  }

  /**
   * Obter status de streams ativos
   */
  getActiveStreamsCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Cancelar todos os streams
   */
  cancelAllStreams(): void {
    this.activeStreams.forEach(controller => {
      controller.abort();
    });
    this.activeStreams.clear();
  }
}

/**
 * Middleware para adicionar endpoints de streaming ao Hono
 */
export function createStreamingEndpoints(aiProvider: AIProvider) {
  const streamingService = new StreamingChatService(aiProvider);

  return {
    /**
     * POST /api/chat/stream/:channel
     * Iniciar stream de resposta para um canal
     */
    async handleStream(
      c: Context,
      messages: ChatMessage[],
      userId: string
    ): Promise<void> {
      const channel = c.req.param('channel');
      const pipelineId = c.req.query('pipelineId');

      await streamingService.createStream(c, messages, {
        channel,
        pipelineId,
        userId,
        maxTokens: c.req.query('maxTokens')
          ? parseInt(c.req.query('maxTokens')!, 10)
          : 2000,
        temperature: c.req.query('temperature')
          ? parseFloat(c.req.query('temperature')!)
          : 0.7,
      });
    },

    /**
     * DELETE /api/chat/stream/:streamId
     * Cancelar stream ativo
     */
    cancelStream: (streamId: string) => streamingService.cancelStream(streamId),

    /**
     * GET /api/chat/streams/active
     * Obter contagem de streams ativos
     */
    getActiveCount: () => streamingService.getActiveStreamsCount(),
  };
}
