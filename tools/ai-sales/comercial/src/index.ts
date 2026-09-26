export { ANNA } from './features/atendimento-ao-cliente';
export { createAnnaFrontendRouter, createAnnaBackendRouter } from './features/function-calling';
export type { AnnaIntent, AnnaRouteResult } from './features/function-calling';
export type { AnnaBackendDecision, AnnaBackendIntent, AnnaFileMeta } from './features/function-calling';

export {
  ToolSectorHarness, normalize, matchesAny, parseAccept, fileMatchesAccept, getToolsWithAnnaUpload,
  requestChat, loadConfig, saveConfig, STATIC_LOCAL_PROVIDERS,
  MarkdownRenderer, ChatInputBar, MessageBubble, SuggestionsSidebar,
  useAttachments, useChatModels, useAiSuggestions,
} from '@ciesa/anna-shared';

export type {
  SectorToolDefinition, SectorToolSet, SectorRouteResult,
  ChatQueueProgress, ChatRequestResult,
  SavedConfig, ProviderInfo, ActiveChatConfig,
  Attachment, UsedSource, Message,
  AnnaTranscriptDefaults, AnnaUploadConfig, AnnaUploadToolDefinition,
} from '@ciesa/anna-shared';