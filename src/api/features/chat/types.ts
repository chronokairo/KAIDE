/**
 * @layer features/chat
 * @description Tipos e interfaces do sistema de chat
 */

import type { ChartData } from '../rag/kpi-processor.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  sources: ChatSource[];
  charts?: ChartData[];
}

export interface ChatSource {
  source: string;
  endpoint: string;
  dataPreview?: string;
}

export interface StreamChunk {
  type: 'sources' | 'chunk' | 'charts' | 'done' | 'error';
  data?: string | ChatSource[] | ChartData[];
}
