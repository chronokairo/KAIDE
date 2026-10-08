import { ChatUiPort, SendMessageParams, SendMessageResponse } from '@/application/ports/chat-ui-port';
import { Conversation, Message } from '@/domain/chat';

export class TauriChatUiAdapter implements ChatUiPort {
  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      // Invocação dinâmica para não quebrar em ambiente web sem Tauri instalado
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<any>('kaide_run_prompt', {
        prompt: params.content,
        conversationId: params.conversationId,
      });

      return {
        id: Math.random().toString(36).substring(2, 15),
        content: typeof result === 'string' ? result : result?.output || JSON.stringify(result),
      };
    } catch (e) {
      console.warn('[TauriChatUiAdapter] Fallback para erro de comando Tauri:', e);
      throw new Error(`Comando Tauri kaide indisponível: ${String(e)}`);
    }
  }

  async listConversations(): Promise<Conversation[]> {
    return [];
  }

  async createConversation(title?: string): Promise<Conversation> {
    return {
      id: Math.random().toString(36).substring(2, 15),
      title: title || 'Nova Conversa Nativa',
      createdAt: new Date().toISOString(),
    };
  }

  async deleteConversation(_id: string): Promise<void> {
    // Implementação desktop
  }

  async getMessages(_conversationId: string): Promise<Message[]> {
    return [];
  }
}
