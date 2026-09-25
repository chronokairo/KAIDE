/**
 * Shared IPC types between Electron main and renderer.
 * Also used by VS Code extension.
 * Zero Node dependencies — safe for renderer and webview contexts.
 */

export interface UsageInfo {
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens?: number
  cacheReadInputTokens?: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
  costUsd?: number
  durationMs?: number
  numTurns?: number
}

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  input?: Record<string, unknown>
  output?: string
  error?: string
  status: 'running' | 'done' | 'error'
}

export interface StreamChunk {
  appSessionId?: string
  requestId: string
  text: string
  thinking?: string
  toolCall?: ToolCall
  usage?: UsageInfo
  done?: boolean
}
