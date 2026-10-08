export { ToolSectorHarness } from './harness';
export type { SectorToolDefinition, SectorToolSet, SectorRouteResult } from './harness';

export { normalize, matchesAny, parseAccept, fileMatchesAccept, getToolsWithAnnaUpload } from './shared';

export { requestChat } from './chat-client';
export type { ChatQueueProgress, ChatRequestResult } from './chat-client';

export { loadConfig, saveConfig, STATIC_LOCAL_PROVIDERS } from './model-config';
export type { SavedConfig, ProviderInfo } from './model-config';

export type { AnnaTranscriptDefaults, AnnaUploadConfig, AnnaUploadToolDefinition } from './contracts';

export type { Attachment, UsedSource, Message } from './chat/types';

export { default as MarkdownRenderer } from './components/MarkdownRenderer';
export { default as ChatInputBar } from './components/ChatInputBar';
export { default as ChatAppBar } from './components/ChatAppBar';
export { default as MessageBubble } from './components/MessageBubble';
export { default as SuggestionsSidebar } from './components/SuggestionsSidebar';

export { useAttachments } from './hooks/useAttachments';
export { useChatModels } from './hooks/useChatModels';
export { useAiSuggestions } from './hooks/useAiSuggestions';
export type { ActiveChatConfig } from './hooks/useChatModels';
