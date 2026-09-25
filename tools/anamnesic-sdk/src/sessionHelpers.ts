import type { ContentBlock } from './types.js'
import type { ToolCall, UsageInfo } from './ipcTypes.js'

export type SessionEntry = {
  type: string
  [key: string]: unknown
}

export type SessionMessage = {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: number
  thinking?: string
  toolCalls?: ToolCall[]
  usage?: UsageInfo
  bakedSecs?: number
  isCompactSummary?: boolean
}

type SessionContentBlock = ContentBlock & {
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: unknown
  is_error?: boolean
}

function fallbackUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function stringifyToolResult(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return extractText(content)
  if (content == null) return ''
  return JSON.stringify(content)
}

function snapshotKey(entry: SessionEntry): string | undefined {
  const requestId = typeof entry.requestId === 'string' ? entry.requestId : undefined
  const parentUuid = typeof entry.parentUuid === 'string' ? entry.parentUuid : undefined
  return parentUuid ?? requestId
}

export function extractText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .filter((block): block is SessionContentBlock => !!block && typeof block === 'object')
    .filter(block => block.type === 'text')
    .map(block => block.text ?? '')
    .join('')
}

export function mergeToolCalls(
  existing: ToolCall[] | undefined,
  incoming: ToolCall[],
): ToolCall[] {
  const map = new Map<string, ToolCall>()
  for (const call of existing ?? []) map.set(call.id, call)
  for (const call of incoming) {
    const previous = map.get(call.id)
    map.set(
      call.id,
      previous
        ? {
            ...previous,
            ...call,
            name: call.name || previous.name,
            args: Object.keys(call.args ?? {}).length > 0 ? call.args : previous.args,
          }
        : call,
    )
  }
  return Array.from(map.values())
}

/** Convert CLI JSONL entries to app/session transcript messages. */
export function entriesToMessages(entries: SessionEntry[]): SessionMessage[] {
  const messages: Array<SessionMessage & { appSnapshotKey?: string }> = []
  let activeToolMessageIndex: number | null = null
  const snapshotIndexes = new Map<string, number>()

  const updateActiveToolCalls = (updates: ToolCall[]) => {
    if (updates.length === 0) return
    if (activeToolMessageIndex == null || !messages[activeToolMessageIndex]) {
      messages.push({
        id: fallbackUuid(),
        role: 'agent',
        content: '',
        timestamp: Date.now(),
        toolCalls: updates,
      })
      activeToolMessageIndex = messages.length - 1
      return
    }

    messages[activeToolMessageIndex].toolCalls = mergeToolCalls(
      messages[activeToolMessageIndex].toolCalls,
      updates,
    )
  }

  for (const entry of entries) {
    if (entry.type === 'user') {
      const message = entry.message as { content?: unknown } | undefined
      const blocks = Array.isArray(message?.content) ? message.content as SessionContentBlock[] : []
      const toolResults = blocks
        .filter(block => block.type === 'tool_result' && block.tool_use_id)
        .map(block => ({
          id: String(block.tool_use_id),
          name: '',
          args: {},
          status: block.is_error ? 'error' as const : 'done' as const,
          ...(!block.is_error ? { output: stringifyToolResult(block.content).slice(0, 2000) } : {}),
          ...(block.is_error ? { error: stringifyToolResult(block.content).slice(0, 2000) } : {}),
        }))
      updateActiveToolCalls(toolResults)

      const content = extractText(message?.content)
      if (content.trim()) {
        messages.push({
          id: typeof entry.uuid === 'string' ? entry.uuid : fallbackUuid(),
          role: 'user',
          content,
          timestamp: new Date(String(entry.timestamp ?? Date.now())).getTime(),
        })
        activeToolMessageIndex = null
      }
      continue
    }

    if (entry.type === 'app-assistant-snapshot') {
      const key = snapshotKey(entry)
      if (!key) continue
      const content = typeof entry.text === 'string' ? entry.text : ''
      const toolCalls = Array.isArray(entry.appToolCalls) ? entry.appToolCalls as ToolCall[] : []
      const thinking = typeof entry.appThinking === 'string' ? entry.appThinking : undefined
      if (!content.trim() && toolCalls.length === 0 && !thinking) continue

      const snapshotMessage = {
        id: typeof entry.uuid === 'string' ? entry.uuid : key,
        role: 'agent' as const,
        content,
        timestamp: new Date(String(entry.timestamp ?? Date.now())).getTime(),
        ...(toolCalls.length > 0 ? { toolCalls } : {}),
        ...(thinking ? { thinking } : {}),
        appSnapshotKey: key,
      }

      const existingIndex = snapshotIndexes.get(key)
      if (existingIndex != null && messages[existingIndex]) {
        messages[existingIndex] = {
          ...messages[existingIndex],
          ...snapshotMessage,
          toolCalls: mergeToolCalls(messages[existingIndex].toolCalls, toolCalls),
        }
      } else {
        messages.push(snapshotMessage)
        snapshotIndexes.set(key, messages.length - 1)
      }
      activeToolMessageIndex = null
      continue
    }

    if (entry.type !== 'assistant') continue

    const message = entry.message as { content?: unknown } | undefined
    const blocks = Array.isArray(message?.content) ? message.content as SessionContentBlock[] : []
    const content = extractText(message?.content)
    const thinking =
      blocks
        .filter(block => block.type === 'thinking')
        .map(block => block.thinking ?? '')
        .join('') || (typeof entry.appThinking === 'string' ? entry.appThinking : undefined)
    const toolUses = blocks
      .filter(block => block.type === 'tool_use' && block.id)
      .map(block => ({
        id: String(block.id),
        name: block.name ?? 'unknown',
        args: block.input ?? {},
        status: 'running' as const,
      }))
    const appToolCalls = Array.isArray(entry.appToolCalls) ? entry.appToolCalls as ToolCall[] : []
    const toolCalls = mergeToolCalls(toolUses, appToolCalls)

    if (toolCalls.length > 0 && !content.trim()) {
      updateActiveToolCalls(toolCalls)
      continue
    }

    if (!content.trim() && !thinking && toolCalls.length === 0) continue

    const key = snapshotKey(entry)
    const timestamp = new Date(String(entry.timestamp ?? Date.now())).getTime()
    const nextMessage = {
      id: typeof entry.uuid === 'string' ? entry.uuid : fallbackUuid(),
      role: 'agent' as const,
      content,
      timestamp,
      ...(toolCalls.length > 0 ? { toolCalls } : {}),
      ...(thinking ? { thinking } : {}),
      ...(entry.isCompactSummary ? { isCompactSummary: true } : {}),
    }

    if (key && snapshotIndexes.has(key)) {
      const existingIndex = snapshotIndexes.get(key)!
      messages[existingIndex] = {
        ...messages[existingIndex],
        ...nextMessage,
        toolCalls: mergeToolCalls(messages[existingIndex].toolCalls, toolCalls),
      }
      activeToolMessageIndex = null
      continue
    }

    if (activeToolMessageIndex != null && messages[activeToolMessageIndex] && !messages[activeToolMessageIndex].content) {
      messages[activeToolMessageIndex] = {
        ...messages[activeToolMessageIndex],
        content,
        timestamp,
        ...(thinking ? { thinking } : {}),
        toolCalls: mergeToolCalls(messages[activeToolMessageIndex].toolCalls, toolCalls),
        ...(entry.isCompactSummary ? { isCompactSummary: true } : {}),
      }
      activeToolMessageIndex = null
      continue
    }

    messages.push(nextMessage)
    activeToolMessageIndex = null
  }

  return messages.map(({ appSnapshotKey: _appSnapshotKey, ...message }) => message)
}
