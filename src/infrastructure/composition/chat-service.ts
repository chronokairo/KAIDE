import { ChatUiPort } from '@/application/ports/chat-ui-port';
import { HttpChatUiAdapter } from '@/infrastructure/http/http-chat-ui-adapter';
import { TauriChatUiAdapter } from '@/infrastructure/tauri/tauri-chat-ui-adapter';

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);
}

export function createChatUiService(): ChatUiPort {
  if (isTauriEnvironment()) {
    return new TauriChatUiAdapter();
  }
  return new HttpChatUiAdapter();
}

export const chatUiService = createChatUiService();
