// ─── Credential Resolution & Token Cache ──────────────────────────────────────

export type CredentialProvider = {
  getCredentials: () => Promise<{ apiKey?: string; authToken?: string } | null>
}

export type CredentialCache = {
  get: (key: string) => string | null
  set: (key: string, value: string, expiresAt?: number) => void
  delete: (key: string) => void
}

export type CredentialOptions = {
  apiKey?: string
  authToken?: string
  profilePath?: string
  credentialProvider?: CredentialProvider
  cache?: CredentialCache
}

export type ResolvedCredentials = {
  apiKey?: string
  authToken?: string
  source: 'env' | 'profile' | 'provider' | 'explicit' | 'cache'
  expiresAt?: number
}

// ─── In-memory credential cache ───────────────────────────────────────────────

class MemoryCache implements CredentialCache {
  private store: Map<string, { value: string; expiresAt?: number }> = new Map()

  get(key: string): string | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  set(key: string, value: string, expiresAt?: number): void {
    this.store.set(key, { value, expiresAt })
  }

  delete(key: string): void {
    this.store.delete(key)
  }
}

// ─── Credential resolution ────────────────────────────────────────────────────

export async function resolveCredentials(
  options: CredentialOptions = {},
): Promise<ResolvedCredentials> {
  const { apiKey: explicitApiKey, authToken: explicitAuthToken } = options

  // 1. Explicit credentials take precedence
  if (explicitApiKey || explicitAuthToken) {
    return {
      apiKey: explicitApiKey,
      authToken: explicitAuthToken,
      source: 'explicit',
    }
  }

  // 2. Check credential provider
  if (options.credentialProvider) {
    const creds = await options.credentialProvider.getCredentials()
    if (creds?.apiKey || creds?.authToken) {
      return {
        apiKey: creds.apiKey,
        authToken: creds.authToken,
        source: 'provider',
      }
    }
  }

  // 3. Check environment variables
  const envApiKey = process.env.CHRONOKAIRO_API_KEY ?? process.env.ANTHROPIC_API_KEY
  const envAuthToken = process.env.CHRONOKAIRO_AUTH_TOKEN ?? process.env.ANTHROPIC_AUTH_TOKEN

  if (envApiKey || envAuthToken) {
    return {
      apiKey: envApiKey,
      authToken: envAuthToken,
      source: 'env',
    }
  }

  // 4. Profile-based credentials (if profilePath provided)
  if (options.profilePath) {
    try {
      // TODO: Implement profile file reading
      // For now, return empty - profile loading not implemented
      return {
        apiKey: undefined,
        authToken: undefined,
        source: 'profile',
      }
    } catch {
      // Profile loading failed, continue to next method
    }
  }

  return {
    apiKey: undefined,
    authToken: undefined,
    source: 'env',
  }
}

// ─── Token refresh helper ─────────────────────────────────────────────────────

export async function refreshCredentials(
  credentials: ResolvedCredentials,
  options: CredentialOptions = {},
): Promise<ResolvedCredentials> {
  if (options.credentialProvider) {
    const creds = await options.credentialProvider.getCredentials()
    if (creds?.apiKey || creds?.authToken) {
      return {
        apiKey: creds.apiKey,
        authToken: creds.authToken,
        source: 'provider',
        expiresAt: creds.authToken ? Date.now() + 3600000 : undefined, // 1 hour TTL
      }
    }
  }

  return credentials
}

// ─── Default cache instance ───────────────────────────────────────────────────

export const defaultCredentialCache = new MemoryCache()
