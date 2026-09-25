/**
 * Chat system types and interfaces
 */

import type { ChartData } from '../rag/kpi-processor';

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
