// @chronokairo/sdk — embedded provider client and sandbox runtime
// This package replaces the @chronokairo/sdk stub with a real implementation.

// ─── Error classes ────────────────────────────────────────────────────────────
export {
  APIError,
  APIUserAbortError,
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  InternalServerError,
  BadRequestError,
  UnprocessableEntityError,
  OverloadedError,
  ContentFilterError,
  ContextWindowExceededError,
  ModelNotFoundError,
  InvalidRequestError,
  JsonSerializationError,
  LinkAuthenticationError,
} from './src/errors.js'

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ClientOptions,
  Base64ImageSource,
  URLImageSource,
  ImageSource,
  TextBlockParam,
  ImageBlockParam,
  ToolUseBlockParam,
  ToolResultBlockParam,
  ThinkingBlockParam,
  RedactedThinkingBlockParam,
  ContentBlockParam,
  ContentBlock,
  ThinkingBlock,
  RedactedThinkingBlock,
  ToolUseBlock,
  TextBlock,
  MessageParam,
  StopReason,
  Usage,
  Message,
  Tool,
  ToolChoice,
  // Beta
  BetaContentBlock,
  BetaContentBlockParam,
  BetaImageBlockParam,
  BetaMessage,
  BetaMessageParam,
  BetaMessageDeltaUsage,
  BetaMessageStreamParams,
  BetaOutputConfig,
  BetaRawMessageStreamEvent,
  BetaRequestDocumentBlock,
  BetaStopReason,
  BetaToolChoiceAuto,
  BetaToolChoiceTool,
  BetaToolResultBlockParam,
  BetaTool,
  BetaToolUnion,
  BetaToolUseBlock,
  BetaUsage,
  BetaRedactedThinkingBlock,
  BetaThinkingBlock,
  BetaWebSearchTool20250305,
  // Stream
  Stream,
  // Sandbox
  FsReadRestrictionConfig,
  FsWriteRestrictionConfig,
  IgnoreViolationsConfig,
  NetworkHostPattern,
  NetworkRestrictionConfig,
  SandboxAskCallback,
  SandboxDependencyCheck,
  SandboxRuntimeConfig,
  SandboxViolationEvent,
  // MCPB
  McpbManifest,
  McpbUserConfigurationOption,
} from './src/types.js'

// ─── Sandbox runtime ──────────────────────────────────────────────────────────
// NOTE: SandboxManager is intentionally NOT exported from the main entry point.
// It requires vm2 (Node.js only) and must NOT be bundled into browser/renderer
// contexts. Import it from '@chronokairo/sdk/sandbox' in Node.js-only code.

// ─── MCPB compat ─────────────────────────────────────────────────────────────
export { getMcpConfigForManifest } from './src/mcpb.js'

// ─── Default export: Chronokairo API client ───────────────────────────────────
export { ChronokairosClient as default, ChronokairosClient, ChronokairosAsyncClient } from './src/client.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
export * from './src/helpers.js'

// ─── Credentials ──────────────────────────────────────────────────────────────
export * from './src/features/auth/credentials.js'

// ─── Retry utilities ──────────────────────────────────────────────────────────
export { withRetry, withTransientRetry, shouldRetryError, calculateDelay, sleep, retry } from './src/retry.js'

// ─── Hooks & Policies ─────────────────────────────────────────────────────────
export * from './src/hooks.js'

// ─── Tools ────────────────────────────────────────────────────────────────────
export * from './src/tools.js'

// ─── Triggers ─────────────────────────────────────────────────────────────────
export * from './src/triggers.js'

// ─── Multimodal ───────────────────────────────────────────────────────────────
export * from './src/multimodal.js'

// ─── Providers ────────────────────────────────────────────────────────────────
export type {
  ProviderId,
  DiscoveryEndpoint,
  AuthMethod,
  ProviderConfig,
  ResolvedProvider,
} from './src/entities/provider/providerRegistry.js'
export {
  normalizeProviderId,
  toModelsDevProviderId,
  getProviderConfig,
  listProviderConfigs,
  registerProviderConfig,
  providerRequiresApiKey,
  getDefaultModel,
  getProviderDiscoveryEndpoint,
  getProviderAuthMethod,
  getProviderBaseURL,
  resolveBaseURL,
  resolveProviderApiKeyFromEnv,
  resolveProvider,
  discoverModelsEndpoint,
  getProviderStaticEnvVars,
} from './src/entities/provider/providerRegistry.js'

// ─── OpenAI-compat translation layer ─────────────────────────────────────────
export {
  OpenAICompatClient,
  OpenAICompatError,
  chronoMessagesToOpenAI,
  chronoToolsToOpenAI,
  chronoToolChoiceToOpenAI,
  openAIFinishReasonTochrono,
  buildChronoRequestBody,
  buildOpenAIRequestBody,
  passthroughChronoStream,
  translateStream,
  translateNonStreamingResponse,
} from './src/features/openai-compat/openaiCompat.js'
export type {
  OpenAICompatClientOptions,
  ChronoMessage,
  ChronoTool,
  ChronoToolChoice,
  ChronoCreateParams,
} from './src/features/openai-compat/openaiCompat.js'

// ─── Stream types ─────────────────────────────────────────────────────────────
export type { TokenStreamOptions } from './src/types.js'
export { TokenStream } from './src/types.js'

// ─── CLI stream helpers ───────────────────────────────────────────────────────
export type { ParsedCliStreamEvent } from './src/cliStream.js'
export { parseCliStreamLine } from './src/cliStream.js'

// ─── Shared IPC types ─────────────────────────────────────────────────────────
export type { UsageInfo, ToolCall, StreamChunk } from './src/ipcTypes.js'

// ─── Session helpers ───────────────────────────────────────────────────────────
export type { SessionEntry, SessionMessage } from './src/sessionHelpers.js'
export { entriesToMessages, extractText, mergeToolCalls } from './src/sessionHelpers.js'

// ─── Model catalog (models.dev) ───────────────────────────────────────────────
export type {
  ModelInfo,
  ModelModalities,
  ModelLimit,
  ModelCost,
  ProviderInfo,
  ModelCatalog,
  CostBreakdown,
} from './src/entities/model/modelCatalog.js'
export {
  fetchModelCatalog,
  getCachedModelCatalog,
  lookupModel,
  findModel,
  getProvider,
  modelHasReasoning,
  modelHasToolCall,
  modelHasVision,
  getContextWindow,
  getApproxMaxContext,
  estimateCost,
  getProviderEnvVars,
  buildProviderEnv,
  isProviderConfigured,
  listModels,
  findProvidersByCapability,
  discoverProviderModelsSync,
  getDiscoveredModelContextWindow,
} from './src/entities/model/modelCatalog.js'

// ─── Effort level utilities ──────────────────────────────────────────────
export type { EffortLevel } from './src/entities/model/effort.js'
export { ALL_EFFORT_LEVELS, modelSupportsEffort, modelSupportsMaxEffort, availableEffortLevels } from './src/entities/model/effort.js'

// ─── NVIDIA LLM Ranking ────────────────────────────────────────────────
export type { NvidiaRankingModel, NvidiaRankingResponse, RawRankingModel } from './src/entities/model/nvidiaRanking.js'
export {
  loadNvidiaRankingSync,
  loadNvidiaRankingAsync,
  getActiveNvidiaModels,
  getTopVisionModelId,
  hasNvidiaRankingData,
} from './src/entities/model/nvidiaRanking.js'

// ─── GitHub Copilot OAuth ──────────────────────────────────────────────
export type { DeviceFlowStart, PollResult } from './src/features/auth/copilotAuth.js'
export {
  COPILOT_CLIENT_ID,
  COPILOT_IDE_HEADERS,
  DEFAULT_COPILOT_API_BASE_URL,
  deriveCopilotApiBaseUrlFromToken,
  startDeviceFlow,
  pollDeviceFlow,
  getCopilotSessionToken,
  clearCopilotSessionCache,
  getCopilotBearer,
  copilotApiBaseFromSessionToken,
} from './src/features/auth/copilotAuth.js'
