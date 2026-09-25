import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerProviderConfig } from '../provider/providerRegistry.js'

const { execFileSyncMock } = vi.hoisted(() => ({
  execFileSyncMock: vi.fn(),
}))

vi.mock('node:child_process', async () => {
  const actual = await import('node:child_process')
  return {
    ...actual,
    execFileSync: execFileSyncMock,
  }
})

import { discoverProviderModelsSync, getDiscoveredModelContextWindow, getParser, __populateDiscoveredModelContextStore, __resetDiscoveredModelContextStore } from './modelCatalog.js'
import type { DiscoveredModel } from './modelCatalog.js'

const LMSTUDIO_RESPONSE = {
  models: [
    {
      type: 'llm',
      publisher: 'nvidia',
      key: 'nvidia/nemotron-3-nano-4b',
      display_name: 'Nemotron 3 Nano 4B',
      max_context_length: 1048576,
      format: 'gguf',
      capabilities: {
        vision: false,
        trained_for_tool_use: true,
        reasoning: { allowed_options: ['off', 'on'], default: 'on' },
      },
      params_string: '4.0B',
      loaded_instances: [
        {
          id: 'nvidia/nemotron-3-nano-4b',
          config: { context_length: 4096 },
        },
      ],
    },
    {
      type: 'llm',
      publisher: 'nvidia',
      key: 'nvidia/nemotron-3-super-120b-a12b',
      display_name: 'Nemotron 3 Super 120B',
      max_context_length: 131072,
      format: 'gguf',
      capabilities: { vision: true, trained_for_tool_use: true },
      loaded_instances: [],
      params_string: '120B',
    },
    {
      type: 'embedding',
      publisher: 'nomic-ai',
      key: 'text-embedding-nomic-embed-text-v1.5',
      display_name: 'Nomic Embed Text v1.5',
      max_context_length: 2048,
      format: 'gguf',
      loaded_instances: [],
    },
  ],
}

function rawJson(): string {
  return JSON.stringify(LMSTUDIO_RESPONSE)
}

function openaiRawJson(): string {
  return JSON.stringify({
    object: 'list',
    data: [
      { id: 'gpt-4o', object: 'model', created: 1700000000, owned_by: 'openai' },
      { id: 'gpt-4o-mini', object: 'model', created: 1700000000, owned_by: 'openai' },
    ],
  })
}

describe('getParser', () => {
  it('returns the LM Studio parser for lmstudio type', () => {
    const parser = getParser('lmstudio')
    const models = parser(rawJson())
    expect(models).toHaveLength(3)
  })

  it('returns the OpenAI parser for openai type', () => {
    const parser = getParser('openai')
    const models = parser(openaiRawJson())
    expect(models).toHaveLength(2)
    expect(models[0].id).toBe('gpt-4o')
  })

  it('returns the OpenAI parser for unknown types', () => {
    const parser = getParser('unknown')
    const models = parser(openaiRawJson())
    expect(models).toHaveLength(2)
  })
})

describe('parseLmstudioModelsResponse (via getParser)', () => {
  it('parses model id, displayName, format, type', () => {
    const parser = getParser('lmstudio')
    const models = parser(rawJson())
    const m = models[0]
    expect(m.id).toBe('nvidia/nemotron-3-nano-4b')
    expect(m.displayName).toBe('Nemotron 3 Nano 4B')
    expect(m.format).toBe('gguf')
    expect(m.type).toBe('llm')
  })

  it('uses loadedContextLength as contextWindow when model is loaded', () => {
    const parser = getParser('lmstudio')
    const models = parser(rawJson())
    // nemotron-nano IS loaded with 4096 context
    const nano = models.find(m => m.id === 'nvidia/nemotron-3-nano-4b')
    expect(nano?.contextWindow).toBe(4096)
    expect(nano?.loadedContextLength).toBe(4096)
    expect(nano?.loaded).toBe(true)
  })

  it('falls back to max_context_length when model has no loaded instances', () => {
    const parser = getParser('lmstudio')
    const models = parser(rawJson())
    // nemotron-super has NO loaded instances, uses max_context_length: 131072
    const super120 = models.find(m => m.id === 'nvidia/nemotron-3-super-120b-a12b')
    expect(super120?.contextWindow).toBe(131072)
    expect(super120?.loaded).toBe(false)
    expect(super120?.loadedContextLength).toBeUndefined()
  })

  it('uses max_context_length for embedding models without loaded instances', () => {
    const parser = getParser('lmstudio')
    const models = parser(rawJson())
    const embed = models.find(m => m.id === 'text-embedding-nomic-embed-text-v1.5')
    expect(embed?.contextWindow).toBe(2048)
    expect(embed?.type).toBe('embedding')
    expect(embed?.loaded).toBe(false)
  })

  it('parses capabilities correctly', () => {
    const parser = getParser('lmstudio')
    const models = parser(rawJson())
    const nano = models.find(m => m.id === 'nvidia/nemotron-3-nano-4b')
    expect(nano?.trainedForToolUse).toBe(true)
    expect(nano?.vision).toBe(false)
    expect(nano?.supportsReasoning).toBe(true)

    const super120 = models.find(m => m.id === 'nvidia/nemotron-3-super-120b-a12b')
    expect(super120?.trainedForToolUse).toBe(true)
    expect(super120?.vision).toBe(true)
    expect(super120?.supportsReasoning).toBe(false)
  })

  it('parses paramsString and publisher', () => {
    const parser = getParser('lmstudio')
    const models = parser(rawJson())
    const nano = models.find(m => m.id === 'nvidia/nemotron-3-nano-4b')
    expect(nano?.paramsString).toBe('4.0B')
    expect(nano?.publisher).toBe('nvidia')
  })

  it('handles empty models gracefully', () => {
    const emptyJson = JSON.stringify({ models: [] })
    const parser = getParser('lmstudio')
    const models = parser(emptyJson)
    expect(models).toHaveLength(0)
  })

  it('handles invalid JSON gracefully', () => {
    const parser = getParser('lmstudio')
    expect(() => parser('not-json')).toThrow()
  })
})

describe('discoveredModelContextStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetDiscoveredModelContextStore()
    const models = getParser('lmstudio')(rawJson())
    __populateDiscoveredModelContextStore(models)
  })

  it('stores loaded context window for loaded models', () => {
    const ctx = getDiscoveredModelContextWindow('nvidia/nemotron-3-nano-4b')
    expect(ctx).toBe(4096)
  })

  it('stores max_context_length for unloaded models', () => {
    const ctx = getDiscoveredModelContextWindow('nvidia/nemotron-3-super-120b-a12b')
    expect(ctx).toBe(131072)
  })

  it('returns undefined for unknown models', () => {
    const ctx = getDiscoveredModelContextWindow('unknown-model')
    expect(ctx).toBeUndefined()
  })
})

describe('discoverProviderModelsSync (reachability)', () => {
  it('returns not reachable for unknown provider', () => {
    const result = discoverProviderModelsSync('nonexistent-provider')
    expect(result.reachable).toBe(false)
    expect(result.models).toHaveLength(0)
    expect(result.error).toBeTruthy()
  })

  it('uses bearer auth for openai-compatible providers', () => {
    registerProviderConfig({
      id: 'openai-live-test',
      name: 'OpenAI Live Test',
      baseURL: 'https://example.test/v1',
      requiresApiKey: true,
      discoveryEndpoint: 'openai',
      authMethod: 'bearer',
      envVars: [],
    })
    execFileSyncMock.mockReturnValueOnce(openaiRawJson())

    const result = discoverProviderModelsSync('openai-live-test', {
      apiKey: 'openai-secret',
      timeoutMs: 2345,
    })

    expect(result.reachable).toBe(true)
    expect(result.models.map((model) => model.id)).toEqual(['gpt-4o', 'gpt-4o-mini'])
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'curl',
      [
        '-sS',
        '--max-time',
        '2',
        'https://example.test/v1/models',
        '-H',
        'Authorization: Bearer openai-secret',
      ],
      expect.objectContaining({
        encoding: 'utf8',
        timeout: 2345,
      }),
    )
  })

  it('uses x-api-key auth and provider headers when configured', () => {
    registerProviderConfig({
      id: 'anthropic-live-test',
      name: 'Anthropic Live Test',
      baseURL: 'https://api.anthropic.com/v1',
      requiresApiKey: true,
      discoveryEndpoint: 'openai',
      authMethod: 'x-api-key',
      envVars: [],
      headers: {
        'anthropic-version': '2023-06-01',
      },
    })
    execFileSyncMock.mockReturnValueOnce(
      JSON.stringify({
        data: [
          { id: 'claude-sonnet-4-20250514' },
          { id: 'claude-opus-4-20250514' },
        ],
      }),
    )

    const result = discoverProviderModelsSync('anthropic-live-test', {
      apiKey: 'anthropic-secret',
      timeoutMs: 3456,
    })

    expect(result.reachable).toBe(true)
    expect(result.models.map((model) => model.id)).toEqual([
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514',
    ])
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'curl',
      [
        '-sS',
        '--max-time',
        '3',
        'https://api.anthropic.com/v1/models',
        '-H',
        'x-api-key: anthropic-secret',
        '-H',
        'anthropic-version: 2023-06-01',
      ],
      expect.objectContaining({
        encoding: 'utf8',
        timeout: 3456,
      }),
    )
  })

  it('uses the built-in anthropic provider config for live discovery', () => {
    execFileSyncMock.mockReturnValueOnce(
      JSON.stringify({
        data: [{ id: 'claude-sonnet-4-20250514' }],
      }),
    )

    const result = discoverProviderModelsSync('anthropic', {
      apiKey: 'anthropic-secret',
      timeoutMs: 4567,
    })

    expect(result.reachable).toBe(true)
    expect(result.models.map((model) => model.id)).toEqual(['claude-sonnet-4-20250514'])
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'curl',
      [
        '-sS',
        '--max-time',
        '4',
        'https://api.anthropic.com/v1/models',
        '-H',
        'x-api-key: anthropic-secret',
        '-H',
        'anthropic-version: 2023-06-01',
      ],
      expect.objectContaining({
        encoding: 'utf8',
        timeout: 4567,
      }),
    )
  })
})

describe('system prompt truncation for small context models', () => {
  function estimateInputTokens(flatSystem: string, messages: Array<{ content: string }>, tools: Array<{ name: string; description?: string }>): number {
    const msgsStr = messages.map(m => m.content).join(' ')
    const toolsStr = tools.map(t => `${t.name} ${t.description ?? ''}`).join(' ')
    return Math.ceil((flatSystem.length + msgsStr.length + toolsStr.length) / 4)
  }

  function truncateSystemPrompt(flatSystem: string, ctxWindow: number, messages: Array<{ content: string }>, tools: Array<{ name: string; description?: string }>): string {
    const maxInput = Math.floor(ctxWindow * 0.75)
    const estimatedInput = estimateInputTokens(flatSystem, messages, tools)
    if (estimatedInput <= maxInput || flatSystem.length === 0) return flatSystem

    const msgsStr = messages.map(m => m.content).join(' ')
    const toolsStr = tools.map(t => `${t.name} ${t.description ?? ''}`).join(' ')
    const maxSysChars = Math.max(256, maxInput * 4 - (msgsStr.length + toolsStr.length))
    return flatSystem.slice(0, Math.floor(maxSysChars)) + '\n... [truncated]'
  }

  it('does not truncate when input fits within 75% of context window', () => {
    const result = truncateSystemPrompt('small prompt', 4096, [{ content: 'hi' }], [])
    expect(result).toBe('small prompt')
  })

  it('truncates when input exceeds 75% of context window', () => {
    // 15000 chars = ~3750 tokens, 75% of 4096 = 3072 → exceeds threshold
    const bigPrompt = 'A'.repeat(15000)
    const result = truncateSystemPrompt(bigPrompt, 4096, [{ content: 'hi' }], [])
    expect(result).toContain('... [truncated]')
    expect(result.length).toBeLessThan(bigPrompt.length)
  })

  it('enforces minimum 256 chars for system prompt', () => {
    // ctx=1024 → maxInput=768 tokens → 3072 chars total
    // With 4000 chars of messages, system budget = max(256, 3072-4000) = 256 chars
    const result = truncateSystemPrompt('A'.repeat(10000), 1024, [{ content: 'B'.repeat(4000) }], [])
    expect(result).toContain('... [truncated]')
    // 256 system chars + '\n... [truncated]' (15 chars) = 271
    // maxSysChars = max(256, 768*4 - 4000) = max(256, -928) = 256
    // result = 'A'*256 + '\n... [truncated]' = 256 + 16 = 272
    expect(result.length).toBe(272)
  })

  it('does not truncate empty system prompt', () => {
    const result = truncateSystemPrompt('', 4096, [{ content: 'hi' }], [])
    expect(result).toBe('')
  })

  it('includes tool schemas in estimation', () => {
    // 15000 chars prompt + 2005 chars tools + 2 chars message = 17007 chars
    // estimated = ceil(17007/4) = 4252 tokens, maxInput = floor(4096*0.75) = 3072
    // 4252 > 3072 → truncation occurs
    // maxSysChars = max(256, 3072*4 - (2+2005)) = max(256, 12288-2007) = 10281
    // result = 'A'*10281 + '\n... [truncated]' = 10297
    const bigPrompt = 'A'.repeat(15000)
    const tools = [{ name: 'Bash', description: 'B'.repeat(2000) }]
    const result = truncateSystemPrompt(bigPrompt, 4096, [{ content: 'hi' }], tools)
    expect(result).toContain('... [truncated]')
    expect(result.length).toBe(10297)
  })
})
