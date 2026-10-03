import { Conversation, Message, Source, ChartData, TurnMetrics } from '@/domain/chat';

export interface SendMessageParams {
  content: string;
  conversationId?: string;
  signal?: AbortSignal;
  onChunk?: (delta: string) => void;
  onSources?: (sources: Source[]) => void;
  onCharts?: (charts: ChartData[]) => void;
  onMetrics?: (metrics: TurnMetrics) => void;
}

export interface SendMessageResponse {
  id: string;
  content: string;
  sources?: Source[];
  charts?: ChartData[];
  turnMetrics?: TurnMetrics;
}

export interface ChatUiPort {
  sendMessage(params: SendMessageParams): Promise<SendMessageResponse>;
  listConversations(): Promise<Conversation[]>;
  createConversation(title?: string): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  getMessages(conversationId: string): Promise<Message[]>;
}
