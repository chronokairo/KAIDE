export interface AiStreamEvent {
  id: string;
  type: 'text_delta' | 'tool_call' | 'tool_result' | 'verification' | 'transaction' | 'error';
  payload: any;
  timestamp: string;
}
