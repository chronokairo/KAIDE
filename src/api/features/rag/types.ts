/**
 * @layer features/rag
 * @description Tipos e interfaces do sistema RAG
 */

export interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  query: string;
}

export interface RAGSource {
  source: string;
  endpoint: string;
  success: boolean;
  dataPreview?: string;
}

export interface RAGContext {
  context: string;
  sources: RAGSource[];
}

export interface LLMOptions {
  temperature?: number;
  topP?: number;
  numPredict?: number;
}

export const DEFAULT_LLM_OPTIONS: LLMOptions = {
  temperature: 0.3,
  topP: 0.9,
  numPredict: 2048,
};
