/**
 * Model catalog powered by https://models.dev/api.json
 *
 * Provides structured data for 4800+ models across 130+ providers:
 * capabilities (reasoning, tool_call, modalities), context/output limits,
 * cost per token, and provider config (env vars, base URL, npm package).
 *
 * Also provides generic model discovery via HTTP (curl) for providers
 * with OpenAI-compatible /v1/models endpoints, Ollama /api/tags,
 * and LM Studio /v1/models endpoints.
 *
 * Usage:
 *   const catalog = await fetchModelCatalog()
 *   const info = lookupModel(catalog, 'anthropic', 'claude-opus-4')
 *   const { context } = getContextWindow(catalog, 'nvidia', 'meta/llama-3.3-70b-instruct')
 *   const models = discoverProviderModelsSync('lmstudio')
 *   const cost = estimateCost(catalog, 'groq', 'llama-3.3-70b-versatile', 1000, 500)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { discoverModelsEndpoint, getProviderConfig, normalizeProviderId } from '../provider/providerRegistry.js'

// ─── Discovered Model Context Store ───────────────────────────────────────────

const discoveredModelContextStore = new Map<string, number>()

export function getDiscoveredModelContextWindow(modelId: string): number | undefined {
  return discoveredModelContextStore.get(modelId)
}

/** @internal for testing */
export function __resetDiscoveredModelContextStore(): void {
  discoveredModelContextStore.clear()
}

/** @internal for testing */
export function __populateDiscoveredModelContextStore(models: Array<{ id: string; contextWindow?: number }>): void {
  for (const m of models) {
    if (m.contextWindow && m.contextWindow > 0) {
      discoveredModelContextStore.set(m.id, m.contextWindow)
    }
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModelModalities = {
  input: Array<'text' | 'image' | 'audio' | 'video' | string>
  output: Array<'text' | 'image' | 'audio' | string>
}

export type ModelLimit = {
  context: number
  output: number
}

export type ModelCost = {
  /** Cost in USD per million input tokens */
  input: number
  /** Cost in USD per million output tokens */
  output: number
  /** Cost in USD per million cache-read tokens */
  cache_read?: number
  /** Cost in USD per million cache-write tokens */
  cache_write?: number
}

export type DiscoveredModel = {
  id: string
  displayName: string
  contextWindow?: number
  type?: 'llm' | 'embedding'
  format?: 'gguf' | 'mlx' | null
  vision?: boolean
  trainedForToolUse?: boolean
  supportsReasoning?: boolean
  loaded?: boolean
  loadedContextLength?: number
  paramsString?: string | null
  publisher?: string
}

export type DiscoveredModelsResult = {
  reachable: boolean
  models: DiscoveredModel[]
  error?: string
}

export type ModelInfo = {
  id: string
  name: string
  family: string
  /** Supports file/image attachments */
  attachment: boolean
  /** Has extended reasoning / thinking mode */
  reasoning: boolean
  /** Supports tool/function calling */
  tool_call: boolean
  /** Supports temperature parameter */
  temperature: boolean
  /** Training data knowledge cutoff (YYYY-MM) */
  knowledge: string
  release_date: string
  last_updated: string
  modalities: ModelModalities
  /** Model weights are publicly available */
  open_weights: boolean
  limit: ModelLimit
  cost: ModelCost
}

export type ProviderInfo = {
  id: string
  name: string
  /** Required environment variable names */
  env: string[]
  /** npm package for AI SDK integration */
  npm?: string
  /** API base URL (undefined for providers with dynamic URLs) */
  api?: string
  /** Documentation URL */
  doc?: string
  models: Record<string, ModelInfo>
}

export type ModelCatalog = Record<string, ProviderInfo>

// ─── Fetch ────────────────────────────────────────────────────────────────────

const MODELS_DEV_API = 'https://models.dev/api.json'
const MODELS_DEV_CACHE = path.join(homedir(), '.kairos', 'cache', 'models-dev.json')

let _catalogCache: ModelCatalog | null = null
let _catalogFetchedAt = 0
const CATALOG_TTL_MS = 60 * 60 * 1000 // 1 hour

function parseCatalog(raw: string): ModelCatalog | null {
  try {
    const parsed = JSON.parse(raw) as ModelCatalog
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeCatalogToDisk(data: ModelCatalog): void {
  try {
    mkdirSync(path.dirname(MODELS_DEV_CACHE), { recursive: true })
    writeFileSync(MODELS_DEV_CACHE, JSON.stringify(data), 'utf8')
  } catch {
    // ignore cache write failures
  }
}

function readCatalogFromDisk(staleOkay = false): { data: ModelCatalog; fetchedAt: number } | null {
  try {
    if (!existsSync(MODELS_DEV_CACHE)) return null
    const fetchedAt = statSync(MODELS_DEV_CACHE).mtimeMs
    if (!staleOkay && Date.now() - fetchedAt > CATALOG_TTL_MS) return null
    const data = parseCatalog(readFileSync(MODELS_DEV_CACHE, 'utf8'))
    return data ? { data, fetchedAt } : null
  } catch {
    return null
  }
}

function setCatalogCache(data: ModelCatalog, fetchedAt = Date.now()): ModelCatalog {
  _catalogCache = data
  _catalogFetchedAt = fetchedAt
  return data
}

/**
 * Fetch the full model catalog from models.dev.
 * Results are cached in memory and on disk for 1 hour.
 * Pass `forceRefresh: true` to bypass the fresh cache.
 */
export async function fetchModelCatalog(options?: {
  forceRefresh?: boolean
}): Promise<ModelCatalog> {
  const now = Date.now()
  if (
    !options?.forceRefresh &&
    _catalogCache &&
    now - _catalogFetchedAt < CATALOG_TTL_MS
  ) {
    return _catalogCache
  }

  if (!options?.forceRefresh) {
    const disk = readCatalogFromDisk(false)
    if (disk) return setCatalogCache(disk.data, disk.fetchedAt)
  }

  try {
    const res = await fetch(MODELS_DEV_API, {
      headers: { accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`models.dev API returned ${res.status}`)
    const data = (await res.json()) as ModelCatalog
    writeCatalogToDisk(data)
    return setCatalogCache(data)
  } catch (error) {
    const stale = readCatalogFromDisk(true)
    if (stale) return setCatalogCache(stale.data, stale.fetchedAt)
    if (_catalogCache) return _catalogCache
    throw error
  }
}

/** Return the cached catalog without fetching. Falls back to disk cache when available. */
export function getCachedModelCatalog(): ModelCatalog | null {
  if (_catalogCache) return _catalogCache
  const disk = readCatalogFromDisk(true)
  return disk ? setCatalogCache(disk.data, disk.fetchedAt) : null
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Look up a model by provider and model ID.
 * Tries exact match first, then case-insensitive substring match.
 */
export function lookupModel(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): ModelInfo | undefined {
  const provider = catalog[normalizeProviderId(providerId)]
  if (!provider) return undefined
  const exact = provider.models[modelId]
  if (exact) return exact
  const lower = modelId.toLowerCase()
  return Object.values(provider.models).find(
    m => m.id.toLowerCase() === lower || lower.includes(m.id.toLowerCase()),
  )
}

/**
 * Search for a model across ALL providers by model ID.
 * Returns the first match with its provider ID.
 */
export function findModel(
  catalog: ModelCatalog,
  modelId: string,
): { provider: ProviderInfo; model: ModelInfo } | undefined {
  const lower = modelId.toLowerCase()
  for (const provider of Object.values(catalog)) {
    const exact = provider.models[modelId]
    if (exact) return { provider, model: exact }
    const fuzzy = Object.values(provider.models).find(
      m => m.id.toLowerCase() === lower || lower.includes(m.id.toLowerCase()),
    )
    if (fuzzy) return { provider, model: fuzzy }
  }
  return undefined
}

/** Get a provider's config (env vars, base URL, npm package). */
export function getProvider(catalog: ModelCatalog, providerId: string): ProviderInfo | undefined {
  return catalog[normalizeProviderId(providerId)]
}

// ─── Capability helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the model has extended reasoning/thinking mode.
 * Uses models.dev `reasoning` field — no string matching.
 */
export function modelHasReasoning(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): boolean {
  return lookupModel(catalog, providerId, modelId)?.reasoning ?? false
}

/**
 * Returns true if the model supports tool/function calling.
 */
export function modelHasToolCall(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): boolean {
  return lookupModel(catalog, providerId, modelId)?.tool_call ?? false
}

/**
 * Returns true if the model supports image inputs.
 */
export function modelHasVision(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): boolean {
  const m = lookupModel(catalog, providerId, modelId)
  return m?.modalities.input.includes('image') ?? false
}

// ─── Context window ────────────────────────────────────────────────────────────

/**
 * Returns the context and output token limits for a model.
 * Falls back to sensible defaults when the model is not in the catalog.
 */
export function getContextWindow(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): { context: number; output: number } {
  const m = lookupModel(catalog, providerId, modelId)
  return m?.limit ?? { context: 8192, output: 4096 }
}

/**
 * Returns the approximate max context window for a model.
 * Uses the live catalog when available, falls back to regex heuristics.
 * Safe to call from renderer (no Node built-ins).
 */
export function getApproxMaxContext(modelId: string, catalog?: ModelCatalog): number {
  const liveCatalog = catalog ?? getCachedModelCatalog()
  const live = liveCatalog ? findModel(liveCatalog, modelId)?.model.limit.context : undefined
  if (live) return live

  const id = (modelId || '').toLowerCase()

  if (/claude.*(sonnet|opus)-4[.-]?[67]/.test(id)) return 1_000_000
  if (id.includes('claude')) return 200_000
  if (id.includes('gemini')) return 1_048_576
  if (/gpt-5[.-]?[45]/.test(id)) return 1_050_000
  if (/gpt-5/.test(id)) return 400_000
  if (/gpt-4[.-]?1/.test(id)) return 1_047_576
  if (/gpt-4/.test(id)) return 128_000
  if (/\bo[1234][-/]/.test(id) || /\bo[1234]$/.test(id)) return 200_000
  if (/deepseek.*v4/.test(id)) return 1_048_576
  if (/deepseek.*v3[.-]?2/.test(id)) return 163_840
  if (/deepseek.*v3/.test(id)) return 131_072
  if (/kimi.*k2/.test(id)) return 262_144
  if (/mistral.*large.*3/.test(id) || /devstral/.test(id)) return 262_144
  if (/mistral.*large/.test(id)) return 131_072
  if (/mixtral/.test(id)) return 32_768
  if (/mistral/.test(id)) return 131_072
  if (/qwen.*3[.-]?5/.test(id) || /qwen.*3/.test(id)) return 262_144
  if (/qwen/.test(id)) return 131_072
  if (/nemotron.*super/.test(id)) return 262_144
  if (/nemotron/.test(id)) return 131_072
  if (/llama/.test(id)) return 131_072
  if (/gemma.*4/.test(id)) return 262_144
  if (/gemma.*3/.test(id)) return 131_072
  if (/gemma/.test(id)) return 131_072
  if (/minimax/.test(id)) return 204_800
  if (/glm/.test(id)) return 204_800
  if (/grok/.test(id)) return 256_000
  if (/phi-?4/.test(id)) return 131_072
  return 128_000
}

// ─── Cost estimation ──────────────────────────────────────────────────────────

export type CostBreakdown = {
  inputCost: number
  outputCost: number
  totalCost: number
  currency: 'USD'
  /** Cost is per million tokens in models.dev — this is the actual dollar amount */
  note: string
}

/**
 * Estimate the cost of a request in USD.
 * Prices from models.dev are in USD per million tokens.
 *
 * @param inputTokens  Number of input tokens
 * @param outputTokens Number of output tokens
 * @param cacheReadTokens  Number of cache-read tokens (optional)
 */
export function estimateCost(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens = 0,
): CostBreakdown | null {
  const m = lookupModel(catalog, providerId, modelId)
  if (!m?.cost) return null

  const { cost } = m
  const inputCost = (inputTokens / 1_000_000) * cost.input
  const outputCost = (outputTokens / 1_000_000) * cost.output
  const cacheReadCost = cost.cache_read
    ? (cacheReadTokens / 1_000_000) * cost.cache_read
    : 0
  const totalCost = inputCost + outputCost + cacheReadCost

  return {
    inputCost,
    outputCost,
    totalCost,
    currency: 'USD',
    note: `Rates: $${cost.input}/$${cost.output} per million input/output tokens`,
  }
}

// ─── Provider helpers ─────────────────────────────────────────────────────────

const PROVIDER_ENV_FALLBACKS: ModelCatalog = {
  nvidia: { id: 'nvidia', name: 'NVIDIA', env: ['NVIDIA_API_KEY'], models: {} },
  groq: { id: 'groq', name: 'Groq', env: ['GROQ_API_KEY'], models: {} },
  mistral: { id: 'mistral', name: 'Mistral', env: ['MISTRAL_API_KEY'], models: {} },
  deepseek: { id: 'deepseek', name: 'DeepSeek', env: ['DEEPSEEK_API_KEY'], models: {} },
  cerebras: { id: 'cerebras', name: 'Cerebras', env: ['CEREBRAS_API_KEY'], models: {} },
  deepinfra: { id: 'deepinfra', name: 'DeepInfra', env: ['DEEPINFRA_API_KEY'], models: {} },
  togetherai: { id: 'togetherai', name: 'Together', env: ['TOGETHER_API_KEY'], models: {} },
  'fireworks-ai': { id: 'fireworks-ai', name: 'Fireworks', env: ['FIREWORKS_API_KEY'], models: {} },
  openai: { id: 'openai', name: 'OpenAI', env: ['OPENAI_API_KEY'], models: {} },
  google: { id: 'google', name: 'Google', env: ['GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'GEMINI_API_KEY'], models: {} },
  'ollama-cloud': { id: 'ollama-cloud', name: 'Ollama Cloud', env: ['OLLAMA_API_KEY'], models: {} },
  'github-copilot': {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    env: ['COPILOT_GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN'],
    models: {},
  },
  ollama: { id: 'ollama', name: 'Ollama', env: [], models: {} },
  lmstudio: { id: 'lmstudio', name: 'LM Studio', env: [], models: {} },
}

const PROVIDER_ENV_FLAG_MAP: Record<string, string | undefined> = {
  ollama: 'CHRONOKAIRO_USE_OLLAMA',
  'ollama-cloud': 'CHRONOKAIRO_USE_OLLAMA_CLOUD',
  lmstudio: 'CHRONOKAIRO_USE_LMSTUDIO',
  nvidia: 'CHRONOKAIRO_USE_NVIDIA',
  groq: 'CHRONOKAIRO_USE_GROQ',
  'github-copilot': 'CHRONOKAIRO_USE_GITHUB_COPILOT',
}

function getProviderEnvCatalog(): ModelCatalog {
  return getCachedModelCatalog() ?? PROVIDER_ENV_FALLBACKS
}

function hasOwnKey(record: Record<string, string>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

/**
 * Returns the env vars required to use a provider.
 * Useful for checking if a provider is configured.
 */
export function getProviderEnvVars(
  catalog: ModelCatalog,
  providerId: string,
): string[] {
  return catalog[normalizeProviderId(providerId)]?.env ?? []
}

/**
 * Builds the environment variable record to pass to the kairos CLI subprocess
 * for a given provider. Merges provider-specific keys with any home-dir overrides.
 * Safe for Node.js (main process only — reads process.env).
 */
export function buildProviderEnv(
  provider: string,
  extraEnv: Record<string, string> = {},
): Record<string, string> {
  const normalizedProvider = normalizeProviderId(provider)
  const catalog = getProviderEnvCatalog()
  const out: Record<string, string> = {}
  const recognizedProviders = new Set<string>([
    ...Object.keys(PROVIDER_ENV_FALLBACKS),
    ...Object.keys(catalog),
  ])

  const applyProvider = (providerId: string) => {
    const normalizedId = normalizeProviderId(providerId)
    if (!normalizedId) return

    const envVars = new Set(getProviderEnvVars(catalog, normalizedId))
    const providerFlag = PROVIDER_ENV_FLAG_MAP[normalizedId]
    const providerValue = extraEnv[providerId] ?? extraEnv[normalizedId]
    const shouldEnableProvider =
      normalizedProvider === normalizedId ||
      hasOwnKey(extraEnv, providerId) ||
      hasOwnKey(extraEnv, normalizedId)

    for (const envVar of envVars) {
      const explicitValue = extraEnv[envVar] ?? providerValue
      if (explicitValue?.trim()) {
        out[envVar] = explicitValue.trim()
      }
    }

    if (providerFlag && shouldEnableProvider) {
      out[providerFlag] = '1'
    }
  }

  if (normalizedProvider) applyProvider(normalizedProvider)

  for (const key of Object.keys(extraEnv)) {
    if (recognizedProviders.has(key)) applyProvider(key)
  }

  for (const [key, value] of Object.entries(extraEnv)) {
    if (!value?.trim() || recognizedProviders.has(key)) continue
    out[key] = value.trim()
  }

  return out
}

/**
 * Returns true if all required env vars for a provider are set in process.env.
 */
export function isProviderConfigured(
  catalog: ModelCatalog,
  providerId: string,
): boolean {
  const envVars = getProviderEnvVars(catalog, providerId)
  if (envVars.length === 0) return true // local providers (ollama) need no key
  return envVars.some(v => !!process.env[v])
}

/**
 * List all models for a provider.
 */
export function listModels(
  catalog: ModelCatalog,
  providerId: string,
): ModelInfo[] {
  const provider = catalog[normalizeProviderId(providerId)]
  if (!provider) return []
  return Object.values(provider.models)
}

/**
 * List all providers that support a given capability.
 */
export function findProvidersByCapability(
  catalog: ModelCatalog,
  capability: 'reasoning' | 'tool_call' | 'attachment',
): ProviderInfo[] {
  return Object.values(catalog).filter(provider =>
    Object.values(provider.models).some(m => m[capability]),
  )
}

// ─── Live model discovery via HTTP (curl, sync) ──────────────────────────────

function parseOpenAIModelsResponse(raw: string): DiscoveredModel[] {
  const data = JSON.parse(raw) as {
    data?: Array<{ id?: string; owned_by?: string; created?: number }>
  }
  if (!Array.isArray(data.data)) return []
  return data.data
    .map(m => {
      const id = m.id
      if (!id) return null
      return { id, displayName: id } satisfies DiscoveredModel
    })
    .filter((m): m is DiscoveredModel => m !== null)
}

function parseOllamaModelsResponse(raw: string): DiscoveredModel[] {
  const data = JSON.parse(raw) as {
    models?: Array<{ name?: string; model?: string; details?: { parameter_size?: string; family?: string }; size?: number }>
  }
  if (!Array.isArray(data.models)) return []
  return data.models
    .map(m => {
      const id = m.model ?? m.name
      if (!id) return null
      return { id, displayName: id } satisfies DiscoveredModel
    })
    .filter((m): m is DiscoveredModel => m !== null)
}

function parseLmstudioModelsResponse(raw: string): DiscoveredModel[] {
  const data = JSON.parse(raw) as {
    data?: Array<{ id?: string }>
  }
  if (Array.isArray(data.data)) {
    return parseOpenAIModelsResponse(raw)
  }
  const native = JSON.parse(raw) as {
    models?: Array<{
      key?: string
      display_name?: string
      type?: 'llm' | 'embedding'
      format?: 'gguf' | 'mlx' | null
      max_context_length?: number
      params_string?: string | null
      publisher?: string
      capabilities?: {
        vision?: boolean
        trained_for_tool_use?: boolean
        reasoning?: { allowed_options?: string[] }
      }
      loaded_instances?: Array<{
        config?: { context_length?: number }
      }>
    }>
  }
  if (Array.isArray(native.models)) {
    return native.models
      .filter(m => m.key?.trim())
      .map(m => {
        const loadedInsts = m.loaded_instances ?? []
        const loaded = loadedInsts.length > 0
        const loadedCtx = loadedInsts.find(i => i.config?.context_length)
        return {
          id: m.key!.trim(),
          displayName: m.display_name?.trim() || m.key!.trim(),
          type: m.type,
          format: m.format ?? undefined,
          contextWindow: loadedCtx
            ? loadedCtx.config!.context_length
            : m.max_context_length && m.max_context_length > 0
              ? Math.floor(m.max_context_length)
              : undefined,
          vision: m.capabilities?.vision,
          trainedForToolUse: m.capabilities?.trained_for_tool_use,
          supportsReasoning: Array.isArray(m.capabilities?.reasoning?.allowed_options) && m.capabilities!.reasoning!.allowed_options!.length > 0,
          loaded,
          loadedContextLength: loadedCtx ? loadedCtx.config!.context_length : undefined,
          paramsString: m.params_string,
          publisher: m.publisher,
        } satisfies DiscoveredModel
      })
  }
  return []
}

export type ParserFn = (raw: string) => DiscoveredModel[]

export function getParser(discoveryType: string): ParserFn {
  switch (discoveryType) {
    case 'ollama': return parseOllamaModelsResponse
    case 'lmstudio': return parseLmstudioModelsResponse
    default: return parseOpenAIModelsResponse
  }
}

function buildDiscoveryHeaders(providerId: string, apiKey?: string): string[] {
  const cfg = getProviderConfig(providerId)
  if (!cfg) return []

  const headers: string[] = []

  if (apiKey) {
    switch (cfg.authMethod) {
      case 'bearer':
        headers.push(`Authorization: Bearer ${apiKey}`)
        break
      case 'x-api-key':
        headers.push(`x-api-key: ${apiKey}`)
        break
      default:
        break
    }
  }

  for (const [name, value] of Object.entries(cfg.headers ?? {})) {
    headers.push(`${name}: ${value}`)
  }

  return headers
}

/**
 * Discover available models from a provider via its live HTTP endpoint.
 * Uses curl (sync) under the hood for compatibility with CLI sync contexts.
 *
 * @param providerId - Provider identifier (e.g. 'lmstudio', 'ollama', 'openai')
 * @param options - Optional overrides for base URL, API key, timeout
 * @returns Reachable status and list of models
 */
export function discoverProviderModelsSync(
  providerId: string,
  options?: { baseURL?: string; apiKey?: string; timeoutMs?: number },
): DiscoveredModelsResult {
  const pId = normalizeProviderId(providerId)
  const cfg = getProviderConfig(pId)
  const endpoint = discoverModelsEndpoint(pId)
  if (!endpoint) return { reachable: false, models: [], error: `No discovery endpoint for provider: ${pId}` }

  let url: string
  let apiKey: string | undefined

  if (options?.baseURL) {
    const discoveryType = cfg?.discoveryEndpoint ?? 'openai'
    const base = options.baseURL.replace(/\/$/, '').replace(/\/v1$/, '')
    url = discoveryType === 'ollama'
      ? `${base}/api/tags`
      : discoveryType === 'lmstudio'
        ? `${base}/api/v1/models`
        : `${base}/v1/models`
  } else {
    url = endpoint.url
  }

  apiKey = options?.apiKey
  if (!apiKey) {
    for (const v of cfg?.envVars ?? []) {
      const val = process.env[v]
      if (val?.trim()) { apiKey = val.trim(); break }
    }
  }

  const timeoutMs = options?.timeoutMs ?? 5000

  try {
    const args = ['-sS', '--max-time', String(Math.floor(timeoutMs / 1000)), url]
    for (const header of buildDiscoveryHeaders(pId, apiKey)) {
      args.push('-H', header)
    }
    const raw = execFileSync('curl', args, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', timeout: timeoutMs })
    const parser = getParser(cfg?.discoveryEndpoint ?? 'openai')
    const models = parser(raw)
    for (const m of models) {
      if (m.contextWindow && m.contextWindow > 0) {
        discoveredModelContextStore.set(m.id, m.contextWindow)
      }
    }
    return { reachable: true, models }
  } catch (error) {
    return { reachable: false, models: [], error: error instanceof Error ? error.message : String(error) }
  }
}
