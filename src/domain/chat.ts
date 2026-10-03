// Camada de domínio (ADR-0022): tipos de chat puros, sem dependências de infraestrutura.

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason?: string;
}

export interface ChatCompletionResult {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  [key: string]: unknown;
}

export interface Source {
  file?: string;
  title?: string;
  content?: string;
  relevance?: number;
  source?: string;
  endpoint?: string;
  dataPreview?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Source[];
  timestamp: Date;
  isStreaming?: boolean;
  charts?: ChartData[];
  turnMetrics?: TurnMetrics;
}

export interface TurnMetrics {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  latencyMs?: number;
}

export interface ToolExecution {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'requires_confirmation';
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  messages?: Message[];
}

