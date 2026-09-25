/**
 * OpenAI-compatible transport layer for Chronokairo SDK.
 *
 * Translates between the Anthropic Messages API shape (used by the rest of
 * the codebase) and the OpenAI Chat Completions shape (used by Ollama,
 * LM Studio, NVIDIA NIM, GitHub Copilot, Groq, etc.).
 *
 * This module has zero CLI dependencies — all auth and provider routing is
 * handled by the caller.
 */
// Use Web Crypto API (works in Electron renderer, Node 18+, and browser).
// Never import from 'crypto' — it breaks Vite renderer builds.
import { getDiscoveredModelContextWindow } from '../../entities/model/modelCatalog.js'
const randomUUID = (): string => globalThis.crypto.randomUUID()

// ─── Types: Anthropic (chronokairo) side ─────────────────────────────────────

type AnyContent =
  | string
  | Array<{
      type: string
      text?: string
      id?: string
      name?: string
      input?: unknown
      tool_use_id?: string
      content?: unknown
      source?: { type?: string; data?: string; media_type?: string; url?: string }
      [k: string]: unknown
    }>

export type ChronoMessage = {
  role: 'user' | 'assistant'
  content: AnyContent
}

export type ChronoTool = {
  name: string
  description?: string
  input_schema?: Record<string, unknown>
  type?: string
}

export type ChronoToolChoice =
  | { type: 'auto' | 'any' | 'none' }
  | { type: 'tool'; name: string }

export type ChronoCreateParams = {
  model: string
  max_tokens?: number
  messages: ChronoMessage[]
  system?: string | Array<{ type: 'text'; text: string }>
  temperature?: number
  top_p?: number
  top_k?: number
  stop_sequences?: string[]
  tools?: ChronoTool[]
  tool_choice?: ChronoToolChoice
  stream?: boolean
  metadata?: Record<string, unknown>
  [k: string]: unknown
}

// ─── Types: OpenAI side ───────────────────────────────────────────────────────

type OpenAIMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> }
  | {
      role: 'assistant'
      content: string | null
      tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>
    }
  | { role: 'tool'; tool_call_id: string; content: string }

type ChronoEvent = { type: string; [k: string]: unknown }

// ─── Message / tool format translators ───────────────────────────────────────

function flattenSystem(system: ChronoCreateParams['system']): string | undefined {
  if (!system) return undefined
  if (typeof system === 'string') return system
  return system.map(s => s.text).filter(Boolean).join('\n\n') || undefined
}

function stringifyToolResultContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(c => {
        if (typeof c === 'string') return c
        if (c && typeof c === 'object' && 'type' in c) {
          const block = c as { type: string; text?: string }
          if (block.type === 'text' && typeof block.text === 'string') return block.text
        }
        try { return JSON.stringify(c) } catch { return String(c) }
      })
      .join('\n')
  }
  if (content == null) return ''
  try { return JSON.stringify(content) } catch { return String(content) }
}

export function chronoMessagesToOpenAI(
  messages: ChronoMessage[],
  system: ChronoCreateParams['system'],
): OpenAIMessage[] {
  const out: OpenAIMessage[] = []
  const sys = flattenSystem(system)
  if (sys) out.push({ role: 'system', content: sys })

  for (const msg of messages) {
    const content = msg.content

    if (typeof content === 'string') {
      out.push({ role: msg.role, content } as OpenAIMessage)
      continue
    }

    if (msg.role === 'user') {
      const userParts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = []
      const toolResults: Array<{ tool_use_id: string; content: string }> = []
      for (const part of content) {
        if (part.type === 'tool_result') {
          toolResults.push({
            tool_use_id: part.tool_use_id || '',
            content: stringifyToolResultContent(part.content),
          })
        } else if (part.type === 'text' && typeof part.text === 'string') {
          userParts.push({ type: 'text', text: part.text })
        } else if (part.type === 'image' && part.source) {
          const src = part.source
          let url: string | undefined
          if (src.type === 'base64' && src.data && src.media_type) {
            url = `data:${src.media_type};base64,${src.data}`
          } else if (src.type === 'url' && src.url) {
            url = src.url
          }
          if (url) userParts.push({ type: 'image_url', image_url: { url } })
        }
        // document and other block types: silently dropped
      }
      for (const tr of toolResults) {
        out.push({ role: 'tool', tool_call_id: tr.tool_use_id, content: tr.content })
      }
      if (userParts.length > 0) {
        const allText = userParts.every(p => p.type === 'text')
        out.push({
          role: 'user',
          content: allText ? userParts.map(p => ('text' in p ? p.text : '')).join('') : userParts,
        })
      }
      continue
    }

    // assistant
    const textParts: string[] = []
    const toolCalls: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> = []
    for (const part of content) {
      if (part.type === 'text' && typeof part.text === 'string') {
        // Strip Gemma 4 channel thought blocks from conversation history per spec.
        const stripped = part.text.replace(/<\|channel>thought\n[\s\S]*?(?:<channel\|>|$)/g, '').trim()
        textParts.push(stripped)
      } else if (part.type === 'tool_use') {
        let argStr: string
        try { argStr = JSON.stringify(part.input ?? {}) } catch { argStr = '{}' }
        toolCalls.push({
          id: part.id || randomUUID(),
          type: 'function',
          function: { name: part.name || '', arguments: argStr },
        })
      }
    }
    out.push({
      role: 'assistant',
      content: textParts.length > 0 ? textParts.join('') : null,
      ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
    })
  }

  return out
}

export function chronoToolsToOpenAI(
  tools: ChronoTool[] | undefined,
): Array<{ type: 'function'; function: { name: string; description?: string; parameters: Record<string, unknown> } }> | undefined {
  if (!tools || tools.length === 0) return undefined
  const out: Array<{ type: 'function'; function: { name: string; description?: string; parameters: Record<string, unknown> } }> = []
  for (const t of tools) {
    if (t.type && t.type !== 'custom' && !t.input_schema) continue
    out.push({
      type: 'function',
      function: {
        name: t.name,
        ...(t.description ? { description: t.description } : {}),
        parameters: (t.input_schema as Record<string, unknown>) || { type: 'object', properties: {} },
      },
    })
  }
  return out.length > 0 ? out : undefined
}

export function chronoToolChoiceToOpenAI(
  choice: ChronoToolChoice | undefined,
): 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } } | undefined {
  if (!choice) return undefined
  switch (choice.type) {
    case 'auto': return 'auto'
    case 'any': return 'required'
    case 'none': return 'none'
    case 'tool': return { type: 'function', function: { name: (choice as { type: 'tool'; name: string }).name } }
    default: return undefined
  }
}

export function openAIFinishReasonTochrono(reason: string | null | undefined): string {
  switch (reason) {
    case 'stop': return 'end_turn'
    case 'length': return 'max_tokens'
    case 'tool_calls':
    case 'function_call': return 'tool_use'
    case 'content_filter': return 'end_turn'
    default: return 'end_turn'
  }
}

// ─── Request builders ─────────────────────────────────────────────────────────

export function buildChronoRequestBody(params: ChronoCreateParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    max_tokens: params.max_tokens ?? 4096,
  }
  if (params.system !== undefined) body.system = params.system
  if (params.temperature !== undefined) body.temperature = params.temperature
  if (params.top_p !== undefined) body.top_p = params.top_p
  if (params.top_k !== undefined) body.top_k = params.top_k
  if (params.stop_sequences !== undefined) body.stop_sequences = params.stop_sequences
  if (params.tools !== undefined) body.tools = params.tools
  if (params.tool_choice !== undefined) body.tool_choice = params.tool_choice
  if (params.stream !== undefined) body.stream = params.stream
  if (params.metadata !== undefined) body.metadata = params.metadata
  return body
}

// ─── Gemma 4 / Gemma 3n helpers ──────────────────────────────────────────────

/**
 * Returns true for Gemma 4 and Gemma 3n (E2B/E4B) model names.
 * These use the <|think|> / <|channel>thought\n…<channel|> protocol.
 */
export function isGemma4Model(model: string | undefined): boolean {
  return /gemma[-_]?4|gemma-4|gemma3[-_]?n|gemma-3n/i.test(model ?? '')
}

/** Strip Gemma 4 special tokens that occasionally leak into API responses. */
function stripGemma4Artifacts(text: string): string {
  return text.replace(/<\|file_separator\|>/g, '').replace(/<\|channel>thought\n[\s\S]*?(?:<channel\|>|$)/g, '').trim()
}

export function buildOpenAIRequestBody(params: ChronoCreateParams, providerId?: string): Record<string, unknown> {
  const isGemma4 = isGemma4Model(params.model)

  // For Gemma 4, inject <|think|> at the start of the system prompt to enable
  // thinking mode — unless NVIDIA handles it via applyNvidiaEffort below.
  let systemForConversion = params.system
  if (isGemma4 && providerId !== 'nvidia') {
    const flat = flattenSystem(params.system)
    systemForConversion = `<|think|>\n${flat ?? ''}`
  }

  const messages = chronoMessagesToOpenAI(params.messages, systemForConversion)
  const tools = chronoToolsToOpenAI(params.tools)
  const toolChoice = chronoToolChoiceToOpenAI(params.tool_choice)

  // Gemma 4 best-practice sampling defaults (override only if caller didn't set them)
  const temperature = typeof params.temperature === 'number' ? params.temperature : (isGemma4 ? 1.0 : undefined)
  const top_p = typeof params.top_p === 'number' ? params.top_p : (isGemma4 ? 0.95 : undefined)
  const top_k = typeof params.top_k === 'number' ? params.top_k : (isGemma4 ? 64 : undefined)

  const body: Record<string, unknown> = {
    model: params.model,
    messages,
    ...(typeof params.max_tokens === 'number' ? { max_tokens: params.max_tokens } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    ...(top_p !== undefined ? { top_p } : {}),
    ...(top_k !== undefined ? { top_k } : {}),
    ...(Array.isArray(params.stop_sequences) && params.stop_sequences.length > 0
      ? { stop: params.stop_sequences }
      : {}),
    ...(tools ? { tools } : {}),
    ...(toolChoice !== undefined ? { tool_choice: toolChoice } : {}),
  }
  if (params.stream) body.stream = true

  if (providerId === 'nvidia') {
    const effortStr = (params.output_config as Record<string, unknown> | undefined)?.effort
    if (typeof effortStr === 'string') {
      applyNvidiaEffort(body, params.model, effortStr)
    }
  }

  return body
}

// ─── NVIDIA effort mechanism ──────────────────────────────────────────────────

type NvidiaEffortMechanism = 'reasoning_effort' | 'system_prompt' | 'chat_template' | null

function getNvidiaEffortMechanism(modelId: string): NvidiaEffortMechanism {
  const m = modelId.toLowerCase()
  if (/mistral-small-4/i.test(m)) return null
  if (isGemma4Model(m)) return 'system_prompt'
  if (/nemotron-3/i.test(m)) return 'chat_template'
  if (/nemotron.*(super|ultra)/i.test(m)) return 'system_prompt'
  return 'reasoning_effort'
}

function effortToThinkingBool(effort: string | undefined): boolean {
  return effort !== 'low'
}

function applyNvidiaEffort(body: Record<string, unknown>, modelId: string, effort: string | undefined): void {
  if (effort === undefined) return
  const mechanism = getNvidiaEffortMechanism(modelId)
  if (!mechanism) return

  if (mechanism === 'reasoning_effort') {
    body.reasoning_effort = effort
  } else if (mechanism === 'chat_template') {
    body.chat_template_kwargs = { thinking: effortToThinkingBool(effort) }
  } else if (mechanism === 'system_prompt') {
    const thinking = effortToThinkingBool(effort)
    const msgs = body.messages as Array<{ role: string; content: string }>
    if (isGemma4Model(modelId)) {
      // Gemma 4: thinking is triggered by <|think|> token in system prompt.
      // When effort is low (thinking off), remove any existing <|think|> prefix.
      if (msgs.length > 0 && msgs[0].role === 'system') {
        const current = msgs[0].content
        if (thinking) {
          if (!current.startsWith('<|think|>')) {
            msgs[0] = { ...msgs[0], content: `<|think|>\n${current}` }
          }
        } else {
          msgs[0] = { ...msgs[0], content: current.replace(/^<\|think\|>\n?/, '') }
        }
      } else if (thinking) {
        msgs.unshift({ role: 'system', content: '<|think|>\n' })
      }
    } else {
      const directive = thinking ? 'detailed thinking on' : 'detailed thinking off'
      if (msgs.length > 0 && msgs[0].role === 'system') {
        msgs[0] = { ...msgs[0], content: `${directive}\n\n${msgs[0].content}` }
      } else {
        msgs.unshift({ role: 'system', content: directive })
      }
    }
  }
}

// ─── SSE parsers ──────────────────────────────────────────────────────────────

async function* parseSSEFrames(response: Response): AsyncGenerator<unknown> {
  if (!response.body) return
  const reader = (response.body as ReadableStream<Uint8Array>).getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() || ''
      for (const evt of events) {
        const lines = evt.split(/\r?\n/)
        const dataLines: string[] = []
        for (const ln of lines) {
          if (ln.startsWith('data:')) dataLines.push(ln.slice(5).trimStart())
        }
        if (dataLines.length === 0) continue
        const data = dataLines.join('\n')
        if (data === '[DONE]') return
        try { yield JSON.parse(data) } catch { /* ignore malformed */ }
      }
    }
  } finally {
    try { reader.releaseLock() } catch { /* noop */ }
  }
}

export async function* passthroughChronoStream(response: Response): AsyncGenerator<ChronoEvent> {
  for await (const evt of parseSSEFrames(response)) {
    if (evt && typeof evt === 'object' && typeof (evt as { type?: unknown }).type === 'string') {
      yield evt as ChronoEvent
    }
  }
}

export async function* translateStream(response: Response, model: string): AsyncGenerator<ChronoEvent> {
  const messageId = `msg_${randomUUID().replace(/-/g, '').slice(0, 24)}`
  let textBlockStarted = false
  let textBlockClosed = false
  const toolBlocks = new Map<number, { blockIdx: number; id: string; name: string; args: string }>()
  let nextBlockIdx = 1
  let stopReason = 'end_turn'
  let usage: { input_tokens?: number; output_tokens?: number } = {}

  yield {
    type: 'message_start',
    message: {
      id: messageId,
      type: 'message',
      role: 'assistant',
      model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    },
  }

  try {
    for await (const evt of parseSSEFrames(response)) {
      if (!evt || typeof evt !== 'object') continue
      const e = evt as {
        error?: { message?: string; code?: string | number } | string
        choices?: Array<{
          delta?: {
            content?: string | null
            reasoning_content?: string | null
            tool_calls?: Array<{
              index?: number
              id?: string
              type?: string
              function?: { name?: string; arguments?: string }
            }>
          }
          finish_reason?: string | null
        }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }

      // Surface upstream error frames (e.g. LM Studio context overflow) instead of
      // silently yielding an empty assistant message.
      if (e.error) {
        const msg = typeof e.error === 'string' ? e.error : (e.error.message ?? 'Unknown upstream error')
        throw new OpenAICompatError(`${model}: ${msg}`, 0)
      }

      if (e.usage) {
        if (typeof e.usage.prompt_tokens === 'number') usage.input_tokens = e.usage.prompt_tokens
        if (typeof e.usage.completion_tokens === 'number') usage.output_tokens = e.usage.completion_tokens
      }

      const choice = e.choices?.[0]
      if (!choice) continue

      const txt = choice.delta?.content
      if (typeof txt === 'string' && txt.length > 0) {
        const clean = isGemma4Model(model) ? txt.replace(/<\|file_separator\|>/g, '') : txt
        if (clean.length === 0) continue
        if (!textBlockStarted) {
          yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
          textBlockStarted = true
        }
        yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: clean } }
      }

      const tcDeltas = choice.delta?.tool_calls
      if (tcDeltas && tcDeltas.length > 0) {
        if (textBlockStarted && !textBlockClosed) {
          yield { type: 'content_block_stop', index: 0 }
          textBlockClosed = true
        }
        for (const td of tcDeltas) {
          const idx = td.index ?? 0
          let entry = toolBlocks.get(idx)
          if (!entry) {
            const id = td.id || `toolu_${randomUUID().replace(/-/g, '').slice(0, 24)}`
            const name = td.function?.name || ''
            entry = { blockIdx: nextBlockIdx++, id, name, args: '' }
            toolBlocks.set(idx, entry)
            yield {
              type: 'content_block_start',
              index: entry.blockIdx,
              content_block: { type: 'tool_use', id: entry.id, name: entry.name, input: {} },
            }
          } else if (td.function?.name && !entry.name) {
            entry.name = td.function.name
          }
          const argChunk = td.function?.arguments
          if (typeof argChunk === 'string' && argChunk.length > 0) {
            entry.args += argChunk
            yield {
              type: 'content_block_delta',
              index: entry.blockIdx,
              delta: { type: 'input_json_delta', partial_json: argChunk },
            }
          }
        }
      }

      if (choice.finish_reason) {
        stopReason = openAIFinishReasonTochrono(choice.finish_reason)
      }
    }
  } finally {
    if (textBlockStarted && !textBlockClosed) {
      yield { type: 'content_block_stop', index: 0 }
    }
    for (const entry of toolBlocks.values()) {
      yield { type: 'content_block_stop', index: entry.blockIdx }
    }
    yield {
      type: 'message_delta',
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: { input_tokens: usage.input_tokens ?? 0, output_tokens: usage.output_tokens ?? 0 },
    }
    yield { type: 'message_stop' }
  }
}

export function translateNonStreamingResponse(
  json: unknown,
  model: string,
): {
  id: string
  type: 'message'
  role: 'assistant'
  model: string
  content: unknown[]
  stop_reason: string
  stop_sequence: null
  usage: { input_tokens: number; output_tokens: number }
} {
  const j = (json as {
    id?: string
    model?: string
    choices?: Array<{
      message?: {
        content?: string | null
        tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }>
      }
      finish_reason?: string | null
    }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }) || {}

  const choice = j.choices?.[0]
  const message = choice?.message
  const content: unknown[] = []
  if (typeof message?.content === 'string' && message.content.length > 0) {
    const text = isGemma4Model(model) ? stripGemma4Artifacts(message.content) : message.content
    if (text.length > 0) content.push({ type: 'text', text })
  }
  for (const tc of message?.tool_calls || []) {
    let parsed: unknown = {}
    try { parsed = JSON.parse(tc.function?.arguments || '{}') } catch { parsed = {} }
    content.push({
      type: 'tool_use',
      id: tc.id || `toolu_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      name: tc.function?.name || '',
      input: parsed,
    })
  }
  if (content.length === 0) content.push({ type: 'text', text: '' })

  return {
    id: j.id || `msg_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    type: 'message',
    role: 'assistant',
    model: j.model || model,
    content,
    stop_reason: openAIFinishReasonTochrono(choice?.finish_reason ?? null),
    stop_sequence: null,
    usage: {
      input_tokens: j.usage?.prompt_tokens ?? 0,
      output_tokens: j.usage?.completion_tokens ?? 0,
    },
  }
}

// ─── Public client ────────────────────────────────────────────────────────────

export type OpenAICompatClientOptions = {
  baseURL: string
  /** Provider identifier used for provider-specific logic (e.g. NVIDIA effort). */
  providerId?: string
  apiKey?: string
  authHeader?: 'bearer' | 'x-api-key'
  defaultHeaders?: Record<string, string>
  /** Override the default `${baseURL}/chat/completions` endpoint. */
  chatPath?: string
  /**
   * When true (or a function returning true for a given model), the client
   * sends requests using the Anthropic Messages format instead of OpenAI Chat
   * Completions. Used for providers like GitHub Copilot that support both.
   */
  useNativeTransport?: boolean | ((model: string) => boolean)
}

type CreateRequestOptions = {
  signal?: AbortSignal
  headers?: Record<string, string>
  timeout?: number
}

class MessagesCreateThenable<T> implements PromiseLike<T> {
  private _promise: Promise<T>
  private _responsePromise: Promise<{
    data: T | AsyncIterable<unknown>
    response: Response
    request_id: string | null
  }>

  constructor(
    promise: Promise<T>,
    responsePromise: Promise<{ data: T | AsyncIterable<unknown>; response: Response; request_id: string | null }>,
  ) {
    this._promise = promise
    this._responsePromise = responsePromise
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this._promise.catch(onrejected)
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this._promise.finally(onfinally)
  }

  withResponse(): Promise<{ data: T | AsyncIterable<unknown>; response: Response; request_id: string | null }> {
    return this._responsePromise
  }

  asResponse(): Promise<Response> {
    return this._responsePromise.then(r => r.response)
  }
}

function parseMaxTokensCapFromError(detail: string): number | null {
  if (!detail) return null
  const lower = detail.toLowerCase()
  if (!lower.includes('max_tokens')) return null
  const m =
    detail.match(/max_tokens[^0-9]*(?:less than or equal to|<=|cannot exceed|at most|no greater than|maximum (?:value )?(?:is|of))[^0-9]*?(\d+)/i) ||
    detail.match(/maximum value for `?max_tokens`?[^0-9]*?(\d+)/i)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Detects vLLM/NVIDIA NIM context overflow errors.
 * vLLM computes available_tokens = context_window - input_tokens and when
 * this is negative reports: "max_tokens must be at least 1, got -N"
 * This means the input prompt exceeds the model's context window.
 */
function isVllmContextOverflowError(detail: string): boolean {
  if (!detail) return false
  return /max_tokens\s+must\s+be\s+at\s+least\s+1,\s+got\s+-\d+/i.test(detail)
}

export class OpenAICompatClient {
  private opts: OpenAICompatClientOptions

  constructor(opts: OpenAICompatClientOptions) {
    this.opts = opts
  }

  get messages() { return this.beta.messages }
  get models() {
    return {
      list: async function* (): AsyncGenerator<unknown> {
        // Intentionally empty — modelCapabilities gated to firstParty.
      },
    }
  }

  beta = {
    messages: {
      create: (params: ChronoCreateParams, reqOpts?: CreateRequestOptions): MessagesCreateThenable<unknown> => {
        const { baseURL, providerId, authHeader, defaultHeaders = {}, chatPath, useNativeTransport } = this.opts
        const isStream = !!params.stream

        const useNative = typeof useNativeTransport === 'function'
          ? useNativeTransport(params.model)
          : !!useNativeTransport

        const url = useNative
          ? `${baseURL}/v1/messages`
          : `${baseURL}${chatPath || '/chat/completions'}`

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...defaultHeaders,
          ...(reqOpts?.headers || {}),
        }
        // Drop Anthropic-specific headers the upstream won't recognize
        delete headers['x-api-key']
        delete headers['chronokairo-version']
        delete headers['chronokairo-beta']
        delete headers['chronokairo-dangerous-direct-browser-access']

        if (useNative) {
          headers['chronokairo-version'] = '2023-06-01'
        }

        const fetchPromise = (async () => {
          const ctrl = new AbortController()
          const cleanup: Array<() => void> = []
          if (reqOpts?.signal) {
            if (reqOpts.signal.aborted) ctrl.abort(reqOpts.signal.reason)
            else {
              const onAbort = () => ctrl.abort(reqOpts.signal?.reason)
              reqOpts.signal.addEventListener('abort', onAbort)
              cleanup.push(() => reqOpts.signal?.removeEventListener('abort', onAbort))
            }
          }
          let timeoutId: ReturnType<typeof setTimeout> | undefined
          if (reqOpts?.timeout && reqOpts.timeout > 0) {
            timeoutId = setTimeout(() => ctrl.abort(new Error('Request timed out')), reqOpts.timeout)
            cleanup.push(() => timeoutId && clearTimeout(timeoutId))
          }

          const ctxWindow = getDiscoveredModelContextWindow(params.model)
          if (ctxWindow && ctxWindow < 200_000) {
            const sysStr = flattenSystem(params.system) ?? ''
            const msgsStr = params.messages.map(m => typeof m.content === 'string' ? m.content : '').join(' ')
            const toolsStr = (params.tools ?? []).map(t => `${t.name} ${t.description ?? ''}`).join(' ')
            const estimatedInput = Math.ceil((sysStr.length + msgsStr.length + toolsStr.length) / 4)
            const maxInput = Math.floor(ctxWindow * 0.75)
            if (estimatedInput > maxInput && sysStr.length > 0) {
              const maxSysChars = Math.max(256, maxInput * 4 - (msgsStr.length + toolsStr.length) / 4 * 4)
              const truncated = sysStr.slice(0, Math.floor(maxSysChars)) + '\n... [truncated]'
              params = { ...params, system: truncated }
            }
          }

          const send = async (effectiveParams: ChronoCreateParams): Promise<Response> => {
            const body = useNative
              ? JSON.stringify(buildChronoRequestBody(effectiveParams))
              : JSON.stringify(buildOpenAIRequestBody(effectiveParams, providerId))
            return fetch(url, { method: 'POST', headers, body, signal: ctrl.signal })
          }

          let response: Response
          try {
            response = await send(params)
          } catch (err) {
            cleanup.forEach(c => c())
            const msg = err instanceof Error ? err.message : String(err)
            throw new OpenAICompatError(`Request to ${providerId ?? baseURL} failed: ${msg}`, 0)
          }

          if (!response.ok && response.status === 400) {
            let detail = ''
            try { detail = await response.text() } catch { /* ignore */ }
            // Detect vLLM/NVIDIA context overflow: "max_tokens must be at least 1, got -N"
            // This means input tokens exceed the model's context window.
            if (isVllmContextOverflowError(detail)) {
              cleanup.forEach(c => c())
              throw new OpenAICompatError(
                `Prompt is too long for model ${params.model ?? ''} (${providerId ?? baseURL}): ${detail.slice(0, 300)}`,
                response.status, response.headers.get('x-request-id') || null,
              )
            }
            const cap = parseMaxTokensCapFromError(detail)
            if (cap !== null && typeof params.max_tokens === 'number' && params.max_tokens > cap) {
              try {
                response = await send({ ...params, max_tokens: cap })
              } catch (err) {
                cleanup.forEach(c => c())
                const msg = err instanceof Error ? err.message : String(err)
                throw new OpenAICompatError(`Request to ${providerId ?? baseURL} failed on retry: ${msg}`, 0)
              }
            } else {
              cleanup.forEach(c => c())
              const reqId = response.headers.get('x-request-id') || null
              throw new OpenAICompatError(
                `${providerId ?? baseURL} returned ${response.status}: ${detail.slice(0, 500)}`,
                response.status, reqId,
              )
            }
          }

          if (!response.ok) {
            let detail = ''
            try { detail = await response.text() } catch { /* ignore */ }
            cleanup.forEach(c => c())
            const reqId = response.headers.get('x-request-id') || null
            throw new OpenAICompatError(
              `${providerId ?? baseURL} returned ${response.status}: ${detail.slice(0, 500)}`,
              response.status, reqId,
            )
          }
          if (!isStream) cleanup.forEach(c => c())
          return response
        })()

        const responsePromise = fetchPromise.then(response => {
          const reqId = response.headers.get('x-request-id') || null
          if (isStream) {
            return {
              data: useNative
                ? passthroughChronoStream(response)
                : translateStream(response, params.model),
              response,
              request_id: reqId,
            }
          }
          return response.json().then(json => ({
            data: useNative
              ? (json as unknown)
              : translateNonStreamingResponse(json, params.model),
            response,
            request_id: reqId,
          }))
        })

        const dataPromise = responsePromise.then(r => r.data) as Promise<unknown>
        return new MessagesCreateThenable<unknown>(
          dataPromise,
          responsePromise as Promise<{ data: unknown; response: Response; request_id: string | null }>,
        )
      },

      countTokens: async (params: ChronoCreateParams): Promise<{ input_tokens: number }> => {
        let chars = 0
        const sys = flattenSystem(params.system)
        if (sys) chars += sys.length
        for (const m of params.messages) {
          if (typeof m.content === 'string') chars += m.content.length
          else for (const p of m.content) {
            if (p.type === 'text' && typeof p.text === 'string') chars += p.text.length
            else if (p.type === 'tool_use' && p.input) {
              try { chars += JSON.stringify(p.input).length } catch { /* noop */ }
            } else if (p.type === 'tool_result' && p.content != null) {
              chars += stringifyToolResultContent(p.content).length
            }
          }
        }
        for (const t of params.tools || []) {
          if (t.description) chars += t.description.length
          chars += t.name.length
          if (t.input_schema) {
            try { chars += JSON.stringify(t.input_schema).length } catch { /* noop */ }
          }
        }
        return { input_tokens: Math.ceil(chars / 4) }
      },
    },
  }
}

export class OpenAICompatError extends Error {
  status: number
  request_id: string | null
  constructor(message: string, status: number, request_id?: string | null) {
    super(message)
    this.name = 'OpenAICompatError'
    this.status = status
    this.request_id = request_id ?? null
  }
}
