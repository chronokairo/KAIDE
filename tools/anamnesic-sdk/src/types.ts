// ─── Client Options ───────────────────────────────────────────────────────────

export interface ClientOptions {
  authToken?: string;
  apiKey?: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  dangerouslyAllowBrowser?: boolean;
  defaultHeaders?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
  fetchOptions?: Record<string, unknown>;
  logger?: {
    error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
  };
  rateLimit?: {
    tokensPerInterval?: number;
    interval?: 'millisecond' | 'second' | 'minute' | 'hour';
  };
}

// ─── Retry Options ────────────────────────────────────────────────────────────

export interface RetryOptions {
  maxRetries?: number;
  shouldRetry?: (error: unknown) => boolean;
  calculateDelay?: (attempt: number, error: unknown) => number;
}

// ─── ChronoKairoError Options ─────────────────────────────────────────────────

export interface ChronoKairoErrorOptions {
  status?: number;
  error?: {
    type?: string;
    message?: string;
  };
  message?: string;
  headers?: Record<string, string>;
  requestId?: string | null;
}

// ─── Sandbox Options ──────────────────────────────────────────────────────────

export interface SandboxOptions {
  timeout?: number;
  restrictGlobals?: boolean;
  restrictFileSystem?: boolean;
  restrictNetwork?: boolean;
  allowedHosts?: NetworkHostPattern[];
  fsReadRestrictions?: FsReadRestrictionConfig;
  fsWriteRestrictions?: FsWriteRestrictionConfig;
  ignoreViolations?: IgnoreViolationsConfig;
  runtimeConfig?: SandboxRuntimeConfig;
  onViolation?: (event: SandboxViolationEvent) => void;
}

// ─── Content block types ──────────────────────────────────────────────────────

export type Base64ImageSource = { type: 'base64'; media_type: string; data: string }
export type URLImageSource = { type: 'url'; url: string }
export type ImageSource = Base64ImageSource | URLImageSource

export type TextBlockParam = {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' }
}

export type ImageBlockParam = {
  type: 'image'
  source: Base64ImageSource
}

export type ToolUseBlockParam = {
  type: 'tool_use'
  id: string
  name: string
  input: unknown
}

export type ToolResultBlockParam = {
  type: 'tool_result'
  tool_use_id: string
  content: string | Array<TextBlockParam | ImageBlockParam>
  is_error?: boolean
}

export type ThinkingBlockParam = {
  type: 'thinking'
  thinking: string
  signature?: string
}

export type RedactedThinkingBlockParam = {
  type: 'redacted_thinking'
  data: string
}

export type ContentBlockParam =
  | TextBlockParam
  | ImageBlockParam
  | ToolUseBlockParam
  | ToolResultBlockParam

export type ContentBlock =
  | TextBlockParam
  | ToolUseBlockParam
  | ToolResultBlockParam
  | ImageBlockParam
  | ThinkingBlockParam
  | RedactedThinkingBlockParam

export type ThinkingBlock = { type: 'thinking'; thinking: string; signature?: string }
export type RedactedThinkingBlock = { type: 'redacted_thinking'; data: string }
export type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: unknown }
export type TextBlock = { type: 'text'; text: string }

export type MessageParam = {
  role: 'user' | 'assistant'
  content: string | ContentBlockParam[]
}

export type StopReason = 'end_turn' | 'max_tokens' | 'tool_use' | 'error' | 'stop_sequence'

export type Usage = {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export type Message = {
  id: string
  type: 'message'
  role: 'assistant'
  content: ContentBlock[]
  model: string
  stop_reason: StopReason
  stop_sequence?: string | null
  usage: Usage
}

// ─── Tool types ───────────────────────────────────────────────────────────────

export type Tool = {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
}

export type ToolChoice =
  | { type: 'auto'; disable_parallel_tool_use?: boolean }
  | { type: 'any'; disable_parallel_tool_use?: boolean }
  | { type: 'tool'; name: string; disable_parallel_tool_use?: boolean }

// ─── Beta types ───────────────────────────────────────────────────────────────

export type BetaContentBlock = ContentBlock
export type BetaContentBlockParam = ContentBlockParam
export type BetaImageBlockParam = ImageBlockParam
export type BetaMessage = {
  id: string
  type: 'message'
  role: 'assistant'
  content: BetaContentBlock[]
  model: string
  stop_reason: BetaStopReason
  usage: BetaUsage
}
export type BetaMessageParam = MessageParam
export type BetaMessageDeltaUsage = { input_tokens: number; output_tokens: number }
export type BetaMessageStreamParams = {
  stream: true
  max_tokens: number
  messages: MessageParam[]
  model: string
  system?: string | TextBlockParam[]
  tools?: BetaToolUnion[]
  tool_choice?: { type: 'auto' | 'any' | 'tool'; name?: string }
  metadata?: Record<string, string>
  stop_sequences?: string[]
  temperature?: number
  top_p?: number
  top_k?: number
  thinking?: { type: 'enabled'; budget_tokens: number } | { type: 'disabled' }
  betas?: string[]
}
export type BetaOutputConfig = unknown
export type BetaRawMessageStreamEvent = {
  type: string
  message?: BetaMessage
  index?: number
  content_block?: BetaContentBlock
  delta?: Record<string, unknown>
  usage?: BetaMessageDeltaUsage
}
export type BetaRequestDocumentBlock = unknown
export type BetaStopReason = 'end_turn' | 'max_tokens' | 'tool_use' | 'error' | 'stop_sequence'
export type BetaToolChoiceAuto = { type: 'auto'; disable_parallel_tool_use?: boolean }
export type BetaToolChoiceTool = { type: 'tool'; name: string; disable_parallel_tool_use?: boolean }
export type BetaToolResultBlockParam = ToolResultBlockParam
export type BetaTool = {
  name: string
  description: string
  input_schema: Record<string, unknown>
}
export type BetaToolUnion =
  | BetaTool
  | { type: 'custom'; name: string; description?: string; input_schema: Record<string, unknown> }
  | BetaWebSearchTool20250305
export type BetaToolUseBlock = ToolUseBlock
export type BetaUsage = {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}
export type BetaRedactedThinkingBlock = RedactedThinkingBlock
export type BetaThinkingBlock = ThinkingBlock
export type BetaWebSearchTool20250305 = {
  type: 'web_search_20250305'
  name?: string
  user_location?: {
    type: 'approximate'
    country?: string
    city?: string
    region?: string
  }
}

// ─── Stream type ──────────────────────────────────────────────────────────────

export type Stream<T> = AsyncIterable<T> & { [Symbol.asyncIterator](): AsyncIterator<T> }

// ─── Stream classes for token streaming ───────────────────────────────────────

export interface TokenStreamOptions {
  onToken?: (token: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

export class TokenStream implements AsyncIterable<string> {
  private tokens: string[] = []
  private isComplete: boolean = false
  private error: Error | null = null
  private listeners: ((token: string) => void)[] = []
  private resolveComplete?: () => void
  private promise: Promise<void>

  constructor(private options?: TokenStreamOptions) {
    this.promise = new Promise<void>((resolve) => {
      this.resolveComplete = resolve
    })
  }

  addToken(token: string): void {
    this.tokens.push(token)
    this.listeners.forEach(listener => listener(token))
    this.options?.onToken?.(token)
  }

  complete(): void {
    this.isComplete = true
    this.options?.onComplete?.(this.tokens.join(''))
    this.resolveComplete?.()
  }

  setError(err: Error): void {
    this.error = err
    this.options?.onError?.(err)
    this.resolveComplete?.()
  }

  getFullText(): string {
    return this.tokens.join('')
  }

  [Symbol.asyncIterator](): AsyncIterator<string> {
    let index = 0
    const self = this

    return {
      async next() {
        while (index >= self.tokens.length) {
          if (self.error) {
            throw self.error
          }
          if (self.isComplete) {
            return { done: true, value: undefined } as const
          }
          await new Promise(resolve => setTimeout(resolve, 10))
        }
        return { done: false, value: self.tokens[index++] }
      },
    }
  }
}

// ─── Sandbox types ────────────────────────────────────────────────────────────

export type FsReadRestrictionConfig = Record<string, unknown>
export type FsWriteRestrictionConfig = Record<string, unknown>
export type IgnoreViolationsConfig = Record<string, unknown>
export type NetworkHostPattern = string
export type NetworkRestrictionConfig = Record<string, unknown>
export type SandboxAskCallback = (...args: unknown[]) => unknown
export type SandboxDependencyCheck = {
  errors: string[]
  warnings?: string[]
}
export type SandboxRuntimeConfig = Record<string, unknown>
export type SandboxViolationEvent = Record<string, unknown>

// ─── MCPB types ───────────────────────────────────────────────────────────────

export type McpbManifest = Record<string, unknown>
export type McpbUserConfigurationOption = Record<string, unknown>
