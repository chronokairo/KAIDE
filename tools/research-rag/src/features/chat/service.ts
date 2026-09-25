import type { ChatMessage, ChatResponse, ChatSource, StreamChunk } from './types.js';
import { DocumentRAGEngine } from '../rag/document-engine.js';

export class ChatService {
  private ragEngine: DocumentRAGEngine;

  constructor() {
    this.ragEngine = new DocumentRAGEngine();
  }

  async initialize(): Promise<void> {
    await this.ragEngine.initialize();
  }

  async indexDocuments(): Promise<any> {
    return await this.ragEngine.indexDocuments();
  }

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

  async *processMessageStream(message: string): AsyncGenerator<StreamChunk> {
    const sources = await this.ragEngine.getSourcesForQuery(message);
    yield { type: 'sources', data: sources };

    for await (const chunk of this.ragEngine.queryStream(message)) {
      yield { type: 'chunk', data: chunk };
    }

    yield { type: 'done' };
  }

  async getStatus(): Promise<Record<string, any>> {
    return this.ragEngine.getStatus();
  }

  getStats(): any {
    return this.ragEngine.getStats();
  }

  async search(query: string, topK: number = 10): Promise<any[]> {
    const results = await this.ragEngine.retrieve(query, topK);
    return results.map((doc, idx) => ({
      file: doc.metadata.source,
      title: doc.metadata.title,
      content: doc.content.slice(0, 500),
      relevance: 1 - (idx * 0.1),
    }));
  }
}

let chatService: ChatService | null = null;

export function getChatService(): ChatService {
  if (!chatService) {
    chatService = new ChatService();
  }
  return chatService;
}
