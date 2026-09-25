type RawStreamEvent = Record<string, unknown>

type CliContentBlock = {
  type?: string
  text?: string
  thinking?: string
  id?: string
  name?: string
  input?: unknown
  tool_use_id?: string
  content?: unknown
  is_error?: boolean
}

export type ParsedCliStreamEvent = {
  type: 'text' | 'thinking' | 'tool_call' | 'tool_result' | 'usage' | 'error' | 'done'
  payload: unknown
}

function asRecord(value: unknown): RawStreamEvent | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as RawStreamEvent
    : null
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .filter((block): block is CliContentBlock => !!block && typeof block === 'object')
    .filter(block => block.type === 'text')
    .map(block => block.text ?? '')
    .join('')
}

/**
 * Parses one line of kairos CLI stdout (NDJSON format).
 * Returns null for empty lines or unrecognized formats.
 * Safe for renderer (no Node built-ins).
 */
export function parseCliStreamLine(line: string): ParsedCliStreamEvent | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }

  const event = asRecord(parsed)
  if (!event || typeof event.type !== 'string') return null

  if (event.type === 'assistant') {
    const message = asRecord(event.message)
    const content = Array.isArray(message?.content) ? message.content as CliContentBlock[] : []
    if (content.length === 0) return null

    const text = content.filter(block => block.type === 'text').map(block => block.text ?? '').join('')
    const thinking = content.filter(block => block.type === 'thinking').map(block => block.thinking ?? '').join('')
    const toolCalls = content
      .filter(block => block.type === 'tool_use' && block.id)
      .map(block => ({
        id: String(block.id),
        name: block.name ?? 'unknown',
        args: block.input ?? {},
        status: 'running' as const,
      }))

    if (text) {
      return {
        type: 'text',
        payload: { text, thinking: thinking || undefined, toolCalls, raw: event, final: true },
      }
    }
    if (thinking) {
      return {
        type: 'thinking',
        payload: { thinking, phase: 'final', toolCalls, raw: event },
      }
    }
    if (toolCalls.length > 0) {
      return {
        type: 'tool_call',
        payload: { calls: toolCalls, raw: event },
      }
    }
    return null
  }

  if (event.type === 'user') {
    const message = asRecord(event.message)
    const content = Array.isArray(message?.content) ? message.content as CliContentBlock[] : []
    const toolResults = content
      .filter(block => block.type === 'tool_result' && block.tool_use_id)
      .map(block => {
        const text = extractTextContent(block.content)
        const value = text || (block.content == null ? '' : JSON.stringify(block.content))
        return {
          id: String(block.tool_use_id),
          status: block.is_error ? 'error' as const : 'done' as const,
          ...(block.is_error ? { error: value.slice(0, 2000) } : { output: value.slice(0, 2000) }),
        }
      })

    return toolResults.length > 0
      ? { type: 'tool_result', payload: { results: toolResults, raw: event } }
      : null
  }

  if (event.type === 'stream_event') {
    const streamEvent = asRecord(event.event)
    const delta = asRecord(streamEvent?.delta)

    if (streamEvent?.type === 'content_block_start' && asRecord(streamEvent.content_block)?.type === 'thinking') {
      return { type: 'thinking', payload: { phase: 'start', raw: event } }
    }

    if (streamEvent?.type === 'content_block_stop') {
      return { type: 'thinking', payload: { phase: 'stop', raw: event } }
    }

    if (streamEvent?.type === 'content_block_delta') {
      if (delta?.type === 'text_delta' && typeof delta.text === 'string' && delta.text) {
        return { type: 'text', payload: { text: delta.text, raw: event, final: false } }
      }
      if (delta?.type === 'thinking_delta' && typeof delta.thinking === 'string' && delta.thinking) {
        return { type: 'thinking', payload: { thinking: delta.thinking, phase: 'delta', raw: event } }
      }
    }

    return null
  }

  if (event.type === 'result') {
    const payload = {
      sessionId: typeof event.session_id === 'string' ? event.session_id : undefined,
      usage: asRecord(event.usage) ?? undefined,
      result: event.result,
      isError: event.is_error === true,
      totalCostUsd: typeof event.total_cost_usd === 'number' ? event.total_cost_usd : undefined,
      durationMs:
        typeof event.duration_api_ms === 'number'
          ? event.duration_api_ms
          : typeof event.total_duration_ms === 'number'
            ? event.total_duration_ms
            : undefined,
      numTurns: typeof event.num_turns === 'number' ? event.num_turns : undefined,
      raw: event,
    }

    if (payload.isError) {
      return {
        type: 'error',
        payload: {
          ...payload,
          message: typeof event.result === 'string' ? event.result : 'CLI request failed',
        },
      }
    }

    if (payload.usage) {
      return { type: 'usage', payload }
    }

    return { type: 'done', payload }
  }

  if (event.type === 'error') {
    return {
      type: 'error',
      payload: {
        message:
          typeof event.text === 'string'
            ? event.text
            : typeof event.message === 'string'
              ? event.message
              : 'CLI error',
        raw: event,
      },
    }
  }

  return null
}
