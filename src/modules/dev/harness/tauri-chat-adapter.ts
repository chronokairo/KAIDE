// Minimal tauri-chat-adapter stub for build compatibility.
// TODO: replace with real adapter or remove unused imports.

export interface TauriChatAdapterOptions {
  workspace?: string;
  model?: string;
  onApproval?: (request: any) => void;
}

export function createTauriChatAdapter(_options: TauriChatAdapterOptions): any {
  return {
    sendMessage: async (_message: unknown): Promise<unknown> => ({ content: '' }),
    interrupt: async (): Promise<void> => {},
  };
}
