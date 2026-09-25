/**
 * GitHub Copilot OAuth device flow — pure fetch, no CLI or storage deps.
 *
 * Usage: call startDeviceFlow() → show user_code → poll pollDeviceFlow()
 * until success → persist the access_token however you like → pass it to
 * getCopilotSessionToken() before every chat request.
 */

export const COPILOT_CLIENT_ID = 'Ov23lijjOw35sdy0D8kc'

export const COPILOT_IDE_HEADERS: Record<string, string> = {
  'Editor-Version': 'vscode/1.96.2',
  'Editor-Plugin-Version': 'copilot-chat/0.35.0',
  'User-Agent': 'GitHubCopilotChat/0.26.7',
  'Copilot-Integration-Id': 'vscode-chat',
  'X-Github-Api-Version': '2025-04-01',
}

export const DEFAULT_COPILOT_API_BASE_URL = 'https://api.individual.githubcopilot.com'

// ─── Types ───────────────────────────────────────────────────────────────────

export type DeviceFlowStart = {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export type PollResult =
  | { status: 'pending'; interval?: number }
  | { status: 'slow_down'; interval?: number }
  | { status: 'success'; access_token: string }
  | { status: 'failed'; error?: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeDomain(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function githubBase(enterpriseDomain?: string): string {
  return enterpriseDomain ? `https://${normalizeDomain(enterpriseDomain)}` : 'https://github.com'
}

async function postJson(
  url: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'user-agent': 'code/1.0',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return (await res.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

// ─── Token parsing ────────────────────────────────────────────────────────────

/**
 * Derives the per-account Copilot API base URL from a session token.
 * Session tokens embed `proxy-ep=<host>` — swap `proxy.` for `api.` to get
 * the real tenant host. Returns null for OAuth tokens (gho_…).
 */
export function deriveCopilotApiBaseUrlFromToken(token: string): string | null {
  const trimmed = token.trim()
  if (!trimmed) return null
  const match = trimmed.match(/(?:^|;)\s*proxy-ep=([^;\s]+)/i)
  const proxyEp = match?.[1]?.trim()
  if (!proxyEp) return null
  const urlText = /^https?:\/\//i.test(proxyEp) ? proxyEp : `https://${proxyEp}`
  try {
    const url = new URL(urlText)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase().replace(/^proxy\./, 'api.')
    return `https://${host}`
  } catch {
    return null
  }
}

// ─── Device flow ──────────────────────────────────────────────────────────────

/**
 * Step 1: start the OAuth device flow.
 * Returns the codes to show the user, or null on network failure.
 */
export async function startDeviceFlow(
  enterpriseDomain?: string,
): Promise<DeviceFlowStart | null> {
  const base = githubBase(enterpriseDomain)
  for (const scope of ['read:user copilot', 'read:user']) {
    const json = await postJson(`${base}/login/device/code`, {
      client_id: COPILOT_CLIENT_ID,
      scope,
    })
    if (!json || typeof json.device_code !== 'string') continue
    return {
      device_code: json.device_code as string,
      user_code: json.user_code as string,
      verification_uri: json.verification_uri as string,
      expires_in: typeof json.expires_in === 'number' ? json.expires_in : 900,
      interval: typeof json.interval === 'number' ? json.interval : 5,
    }
  }
  return null
}

/**
 * Step 2: poll until the user authorizes (or it fails/expires).
 * Call this every `interval` seconds until status === 'success'.
 */
export async function pollDeviceFlow(
  device_code: string,
  enterpriseDomain?: string,
): Promise<PollResult> {
  const base = githubBase(enterpriseDomain)
  const json = await postJson(`${base}/login/oauth/access_token`, {
    client_id: COPILOT_CLIENT_ID,
    device_code,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  })
  if (!json) return { status: 'failed', error: 'network' }
  const tok = json.access_token
  if (typeof tok === 'string' && tok.length > 0) return { status: 'success', access_token: tok }
  const err = typeof json.error === 'string' ? json.error : undefined
  const interval = typeof json.interval === 'number' ? json.interval : undefined
  if (err === 'authorization_pending') return { status: 'pending', interval }
  if (err === 'slow_down') return { status: 'slow_down', interval }
  return { status: 'failed', error: err }
}

// ─── Session token exchange ───────────────────────────────────────────────────

type SessionCacheEntry =
  | { kind: 'token'; token: string; expiresAt: number; sourceToken: string }
  | { kind: 'unavailable'; sourceToken: string; until: number }

let _sessionCache: SessionCacheEntry | null = null

/**
 * Exchange a gho_ OAuth access token for a short-lived Copilot session token.
 * Session tokens grant the full model catalog (code, Gemini, o-series, etc.).
 * Returns null when the exchange isn't available — callers should fall back
 * to using the OAuth token directly as the Bearer.
 *
 * Results are cached in memory (~25 min TTL). Pass `forceRefresh: true` to
 * bypass the cache.
 */
export async function getCopilotSessionToken(
  oauthToken: string,
  options?: { forceRefresh?: boolean },
): Promise<string | null> {
  const oauth = oauthToken.trim()
  if (!oauth) return null
  const now = Math.floor(Date.now() / 1000)

  if (!options?.forceRefresh && _sessionCache && _sessionCache.sourceToken === oauth) {
    if (_sessionCache.kind === 'token' && _sessionCache.expiresAt - 60 > now) {
      return _sessionCache.token
    }
    if (_sessionCache.kind === 'unavailable' && _sessionCache.until > now) {
      return null
    }
  }

  try {
    const res = await fetch('https://api.github.com/copilot_internal/v2/token', {
      headers: {
        Authorization: `Bearer ${oauth}`,
        Accept: 'application/json',
        ...COPILOT_IDE_HEADERS,
      },
    })
    if (!res.ok) {
      _sessionCache = { kind: 'unavailable', sourceToken: oauth, until: now + 300 }
      return null
    }
    const json = (await res.json()) as { token?: unknown; expires_at?: unknown }
    if (typeof json.token !== 'string' || json.token.length === 0) {
      _sessionCache = { kind: 'unavailable', sourceToken: oauth, until: now + 300 }
      return null
    }

    let expiresAt: number
    if (typeof json.expires_at === 'number' && Number.isFinite(json.expires_at)) {
      expiresAt = json.expires_at > 100_000_000_000
        ? Math.floor(json.expires_at / 1000)
        : json.expires_at
    } else if (typeof json.expires_at === 'string') {
      const parsed = Number.parseInt(json.expires_at, 10)
      expiresAt = Number.isFinite(parsed)
        ? parsed > 100_000_000_000 ? Math.floor(parsed / 1000) : parsed
        : now + 25 * 60
    } else {
      expiresAt = now + 25 * 60
    }

    _sessionCache = { kind: 'token', token: json.token, expiresAt, sourceToken: oauth }
    return json.token
  } catch {
    _sessionCache = { kind: 'unavailable', sourceToken: oauth, until: now + 300 }
    return null
  }
}

/** Invalidate the in-memory session token cache (e.g., on 401). */
export function clearCopilotSessionCache(): void {
  _sessionCache = null
}

/**
 * Returns the best available bearer token for a Copilot chat request.
 * Tries to exchange the OAuth token for a session token first;
 * falls back to the OAuth token itself.
 */
export async function getCopilotBearer(oauthToken: string): Promise<string> {
  const session = await getCopilotSessionToken(oauthToken)
  return session ?? oauthToken
}

/**
 * Returns the Copilot API base URL for a given session token.
 * Falls back to DEFAULT_COPILOT_API_BASE_URL.
 */
export function copilotApiBaseFromSessionToken(sessionToken: string | null): string {
  if (sessionToken) {
    const derived = deriveCopilotApiBaseUrlFromToken(sessionToken)
    if (derived) return derived
  }
  return DEFAULT_COPILOT_API_BASE_URL
}
