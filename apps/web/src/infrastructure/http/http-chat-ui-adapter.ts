import { ChatUiPort, SendMessageParams, SendMessageResponse } from '@/application/ports/chat-ui-port';
import { Conversation, Message, Source, ChartData, TurnMetrics } from '@/domain/chat';

export class HttpChatUiAdapter implements ChatUiPort {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    const { content, conversationId, signal, onChunk, onSources, onCharts, onMetrics } = params;

    const response = await fetch(`${this.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, conversationId }),
      signal,
    });

    if (!response.ok) {
      const err = await response.text().catch(() => 'Erro na requisição');
      throw new Error(`Erro na API (${response.status}): ${err}`);
    }

    if (!response.body) {
      throw new Error('Resposta sem corpo de streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let sources: Source[] = [];
    let charts: ChartData[] = [];
    let metrics: TurnMetrics | undefined;
    let messageId = Math.random().toString(36).substring(2, 15);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'chunk' && data.content) {
                fullContent += data.content;
                onChunk?.(data.content);
              } else if (data.type === 'sources' && data.sources) {
                sources = data.sources;
                onSources?.(sources);
              } else if (data.type === 'charts' && data.charts) {
                charts = data.charts;
                onCharts?.(charts);
              } else if (data.type === 'metrics' && data.metrics) {
                metrics = data.metrics;
                if (metrics) onMetrics?.(metrics);
              } else if (data.content && !data.type) {
                fullContent += data.content;
                onChunk?.(data.content);
              }
            } catch {
              // chunk de texto simples
              fullContent += dataStr;
              onChunk?.(dataStr);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      id: messageId,
      content: fullContent,
      sources: sources.length > 0 ? sources : undefined,
      charts: charts.length > 0 ? charts : undefined,
      turnMetrics: metrics,
    };
  }

  async listConversations(): Promise<Conversation[]> {
    const res = await fetch(`${this.baseUrl}/api/conversations`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.conversations || [];
  }

  async createConversation(title?: string): Promise<Conversation> {
    const res = await fetch(`${this.baseUrl}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'Nova Conversa' }),
    });
    if (!res.ok) {
      return { id: Math.random().toString(36).substring(2, 15), title: title || 'Nova Conversa', createdAt: new Date().toISOString() };
    }
    return await res.json();
  }

  async deleteConversation(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/conversations/${id}`, { method: 'DELETE' });
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/messages`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.messages || []).map((m: any) => ({
      id: m.id || Math.random().toString(36).substring(2, 15),
      role: m.role || 'assistant',
      content: m.content || '',
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      sources: m.sources,
      charts: m.charts,
    }));
  }
}
