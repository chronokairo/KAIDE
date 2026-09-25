export type ProviderId =
  | 'chronokairo'
  | 'anthropic'
  | 'ollama'
  | 'ollama-cloud'
  | 'lmstudio'
  | 'nvidia'
  | 'groq'
  | 'mistral'
  | 'together'
  | 'deepseek'
  | 'cerebras'
  | 'deepinfra'
  | 'fireworks'
  | 'openai'
  | 'google'
  | 'bedrock'
  | 'vertex'
  | 'azure'
  | 'github-copilot'
  | 'vscode'
  | string

export type DiscoveryEndpoint = 'openai' | 'ollama' | 'lmstudio' | 'none'

export type AuthMethod = 'bearer' | 'x-api-key' | 'none'

export type ProviderConfig = {
  id: ProviderId
  name: string
  baseURL: string
  requiresApiKey: boolean
  requiresAuthToken?: boolean
  defaultModel?: string
  headers?: Record<string, string>
  chatPath?: string
  /** Discovery endpoint type. 'openai' = GET /v1/models, 'ollama' = GET /api/tags, 'lmstudio' = GET /api/v1/models, 'none' = no live discovery */
  discoveryEndpoint: DiscoveryEndpoint
  authMethod: AuthMethod
  envVars: string[]
  /** Env flag to enable this provider (e.g. CHRONOKAIRO_USE_OLLAMA) */
  envFlag?: string
  /** Provider logo URL template */
  logoUrl?: string
  docsPath?: string
}

const PROVIDER_STORE: Record<string, ProviderConfig> = {}

function register(cfg: ProviderConfig): ProviderConfig {
  PROVIDER_STORE[cfg.id] = cfg
  return cfg
}

register({ id: 'chronokairo', name: 'Chronokairo API', baseURL: 'https://api.chronokairo.com.br/v1', requiresApiKey: true, defaultModel: 'default', discoveryEndpoint: 'none', authMethod: 'bearer', envVars: ['CHRONOKAIRO_API_KEY'] })
register({ id: 'anthropic', name: 'Anthropic API', baseURL: 'https://api.anthropic.com/v1', requiresApiKey: true, requiresAuthToken: true, defaultModel: 'claude-sonnet-4-20250514', discoveryEndpoint: 'openai', authMethod: 'x-api-key', envVars: ['ANTHROPIC_API_KEY'], headers: { 'anthropic-version': '2023-06-01' } })
register({ id: 'ollama', name: 'Ollama (Local)', baseURL: 'http://localhost:11434', requiresApiKey: false, defaultModel: 'llama3.2', discoveryEndpoint: 'ollama', authMethod: 'none', envVars: [], envFlag: 'CHRONOKAIRO_USE_OLLAMA', docsPath: '/providers/ollama' })
register({ id: 'ollama-cloud', name: 'Ollama Cloud', baseURL: 'https://ollama.com/v1', requiresApiKey: true, defaultModel: 'llama3.2', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['OLLAMA_API_KEY'], envFlag: 'CHRONOKAIRO_USE_OLLAMA_CLOUD', docsPath: '/providers/ollama-cloud' })
register({ id: 'lmstudio', name: 'LM Studio (Local)', baseURL: 'http://localhost:1234', requiresApiKey: false, defaultModel: 'qwen2.5-coder-7b-instruct', discoveryEndpoint: 'lmstudio', authMethod: 'none', envVars: ['LMSTUDIO_API_KEY'], envFlag: 'CHRONOKAIRO_USE_LMSTUDIO', docsPath: '/providers/lmstudio' })
register({ id: 'nvidia', name: 'NVIDIA NIM', baseURL: 'https://integrate.api.nvidia.com/v1', requiresApiKey: true, defaultModel: 'meta/llama-3.3-70b-instruct', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['NVIDIA_API_KEY'], envFlag: 'CHRONOKAIRO_USE_NVIDIA', docsPath: '/providers/nvidia', logoUrl: '/logos/nvidia.svg' })
register({ id: 'groq', name: 'Groq Cloud', baseURL: 'https://api.groq.com/openai/v1', requiresApiKey: true, defaultModel: 'llama-3.2-90b-vision-preview', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['GROQ_API_KEY'], envFlag: 'CHRONOKAIRO_USE_GROQ', logoUrl: '/logos/groq.svg' })
register({ id: 'mistral', name: 'Mistral AI', baseURL: 'https://api.mistral.ai/v1', requiresApiKey: true, defaultModel: 'mistral-large-latest', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['MISTRAL_API_KEY'] })
register({ id: 'together', name: 'Together AI', baseURL: 'https://api.together.xyz/v1', requiresApiKey: true, defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['TOGETHER_API_KEY'] })
register({ id: 'deepseek', name: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', requiresApiKey: true, defaultModel: 'deepseek-chat', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['DEEPSEEK_API_KEY'] })
register({ id: 'cerebras', name: 'Cerebras', baseURL: 'https://api.cerebras.ai/v1', requiresApiKey: true, defaultModel: 'llama3.1-8b', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['CEREBRAS_API_KEY'] })
register({ id: 'deepinfra', name: 'DeepInfra', baseURL: 'https://api.deepinfra.com/v1/openai', requiresApiKey: true, defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['DEEPINFRA_API_KEY'] })
register({ id: 'fireworks', name: 'Fireworks AI', baseURL: 'https://api.fireworks.ai/inference/v1', requiresApiKey: true, defaultModel: 'accounts/fireworks/models/llama-v3p1-8b-instruct', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['FIREWORKS_API_KEY'] })
register({ id: 'openai', name: 'OpenAI API', baseURL: 'https://api.openai.com/v1', requiresApiKey: true, defaultModel: 'gpt-4o', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['OPENAI_API_KEY'] })
register({ id: 'google', name: 'Google AI', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', requiresApiKey: true, defaultModel: 'gemini-2.0-flash', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'] })
register({ id: 'bedrock', name: 'AWS Bedrock', baseURL: 'https://bedrock-runtime.{region}.amazonaws.com', requiresApiKey: true, requiresAuthToken: true, discoveryEndpoint: 'none', authMethod: 'none', envVars: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] })
register({ id: 'vertex', name: 'Google Vertex AI', baseURL: 'https://{region}-aiplatform.googleapis.com/v1', requiresApiKey: true, requiresAuthToken: true, discoveryEndpoint: 'none', authMethod: 'none', envVars: ['GOOGLE_APPLICATION_CREDENTIALS'] })
register({ id: 'azure', name: 'Azure OpenAI', baseURL: 'https://{resource}.openai.azure.com', requiresApiKey: true, requiresAuthToken: true, discoveryEndpoint: 'none', authMethod: 'x-api-key', envVars: ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_KEY'] })
register({ id: 'github-copilot', name: 'GitHub Copilot', baseURL: 'https://api.githubcopilot.com', requiresApiKey: true, defaultModel: 'gpt-4o:copilot', discoveryEndpoint: 'openai', authMethod: 'bearer', envVars: ['COPILOT_GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN'], envFlag: 'CHRONOKAIRO_USE_GITHUB_COPILOT', docsPath: '/providers/github-copilot' })
register({ id: 'vscode', name: 'VS Code', baseURL: '', requiresApiKey: true, discoveryEndpoint: 'none', authMethod: 'none', envVars: [] })

/** Provider ID aliases for normalization */
const PROVIDER_ID_ALIASES: Record<string, string> = {
  'lm-studio': 'lmstudio',
  together: 'togetherai',
  fireworks: 'fireworks-ai',
}

/** SDK provider ID to models.dev provider ID mapping */
const MODELS_DEV_PROVIDER_MAP: Record<string, string> = {
  together: 'togetherai',
  fireworks: 'fireworks-ai',
}

export function normalizeProviderId(id: string): string {
  const normalized = id.trim().toLowerCase()
  return PROVIDER_ID_ALIASES[normalized] ?? normalized
}

export function toModelsDevProviderId(id: string): string {
  return MODELS_DEV_PROVIDER_MAP[id] ?? id
}

export function getProviderConfig(id: ProviderId | string): ProviderConfig | undefined {
  return PROVIDER_STORE[normalizeProviderId(id)]
}

export function listProviderConfigs(): ProviderConfig[] {
  return Object.values(PROVIDER_STORE)
}

export function registerProviderConfig(cfg: ProviderConfig): void {
  register(cfg)
}

export function getProviderStaticEnvVars(id: ProviderId | string): string[] {
  return PROVIDER_STORE[normalizeProviderId(id)]?.envVars ?? []
}

export function providerRequiresApiKey(id: ProviderId | string): boolean {
  return PROVIDER_STORE[normalizeProviderId(id)]?.requiresApiKey ?? true
}

export function getDefaultModel(id: ProviderId | string): string | undefined {
  return PROVIDER_STORE[normalizeProviderId(id)]?.defaultModel
}

export function getProviderDiscoveryEndpoint(id: ProviderId | string): DiscoveryEndpoint {
  return PROVIDER_STORE[normalizeProviderId(id)]?.discoveryEndpoint ?? 'none'
}

export function getProviderAuthMethod(id: ProviderId | string): AuthMethod {
  return PROVIDER_STORE[normalizeProviderId(id)]?.authMethod ?? 'bearer'
}

export function getProviderBaseURL(id: ProviderId | string, options?: { region?: string; resource?: string }): string {
  const cfg = PROVIDER_STORE[normalizeProviderId(id)]
  if (!cfg) throw new Error(`Unknown provider: ${id}`)
  let baseURL = cfg.baseURL
  if (options?.region) baseURL = baseURL.replace('{region}', options.region)
  if (options?.resource) baseURL = baseURL.replace('{resource}', options.resource)
  return baseURL
}

export function resolveBaseURL(id: ProviderId | string, env?: NodeJS.ProcessEnv): string {
  const cfg = PROVIDER_STORE[normalizeProviderId(id)]
  if (!cfg) throw new Error(`Unknown provider: ${id}`)
  const pId = normalizeProviderId(id)
  if (pId === 'ollama') {
    return (env?.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '') + '/v1'
  }
  if (pId === 'lmstudio') {
    return (env?.LMSTUDIO_HOST || 'http://localhost:1234').replace(/\/$/, '') + '/v1'
  }
  return getProviderBaseURL(id)
}

export function resolveProviderApiKeyFromEnv(id: ProviderId | string): string | undefined {
  const envVars = getProviderStaticEnvVars(id)
  for (const v of envVars) {
    const val = process.env[v]
    if (val?.trim()) return val.trim()
  }
  return undefined
}

export interface ResolvedProvider {
  id: ProviderId
  baseURL: string
  apiKey?: string
  authToken?: string
  model?: string
  extraHeaders?: Record<string, string>
}

export function resolveProvider(id: ProviderId | string, options?: { apiKey?: string; authToken?: string; baseURL?: string; model?: string; region?: string; resource?: string }): ResolvedProvider {
  const cfg = getProviderConfig(id)
  if (!cfg) throw new Error(`Unknown provider: ${id}`)
  const apiKey = options?.apiKey ?? resolveProviderApiKeyFromEnv(id)
  const authToken = options?.authToken ?? process.env[`${cfg.id.toUpperCase()}_AUTH_TOKEN`]
  const baseURL = options?.baseURL ?? resolveBaseURL(id)
  const model = options?.model ?? cfg.defaultModel
  return { id: normalizeProviderId(id), baseURL, apiKey, authToken, model, extraHeaders: cfg.headers }
}

export function discoverModelsEndpoint(id: ProviderId | string): { url: string; authMethod: AuthMethod } | null {
  const cfg = PROVIDER_STORE[normalizeProviderId(id)]
  if (!cfg) return null
  const pId = normalizeProviderId(id)
  switch (cfg.discoveryEndpoint) {
    case 'openai': {
      const base = pId === 'ollama' ? resolveBaseURL(id) : cfg.baseURL.replace(/\/$/, '')
      return { url: `${base}/models`, authMethod: cfg.authMethod }
    }
    case 'ollama': {
      const base = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '')
      return { url: `${base}/api/tags`, authMethod: 'none' }
    }
    case 'lmstudio': {
      const base = (process.env.LMSTUDIO_HOST || 'http://localhost:1234').replace(/\/$/, '')
      return { url: `${base}/api/v1/models`, authMethod: cfg.authMethod }
    }
    default:
      return null
  }
}
