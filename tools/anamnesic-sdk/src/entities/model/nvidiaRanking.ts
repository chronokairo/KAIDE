/**
 * NVIDIA LLM Ranking — native implementation.
 *
 * Ported from nvidia-llm-ranking/app/api/ranking/route.ts so the CLI and app
 * can read ranking data directly from disk without running a Next.js server.
 *
 * File resolution order (first match wins):
 *   1. CHRONOKAIRO_NVIDIA_RANKING_FILE   — explicit path to ranking JSON
 *   2. CHRONOKAIRO_NVIDIA_RANKING_DIR    — directory, uses default filenames
 *   3. ~/.kairos/cache/nvidia-ranking.json
 *
 * Toggle file (controls which models are disabled at runtime):
 *   1. CHRONOKAIRO_NVIDIA_TOGGLE_FILE    — explicit path
 *   2. Same directory as the ranking file, named nvidia-tool-toggle.json
 */

import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

// ─── Raw types (as stored in nvidia-ranking.latest.json) ────────────────────

export type RawRankingModel = {
  id: string
  company?: string
  tier: string
  availability: number
  score: number
  contextSize?: number
  latencyMs?: { p50?: number | null; p95?: number | null; min?: number | null; max?: number | null }
  toolCheck?: { passed?: boolean; reason?: string | null }
  effortCheck?: {
    supported?: boolean
    mechanism?: string | null
    passed?: number
    total?: number
    allPassed?: boolean
    results?: Record<string, { ok: boolean; ms: number; error?: string }>
  }
  visionCheck?: { supported?: boolean; ms?: number; reason?: string | null }
  quarantined?: boolean
  removed?: boolean
  disabledByToggle?: boolean
}

type RawCompanyGroup = {
  company: string
  recommendedModel?: string | null
  models?: RawRankingModel[]
}

type RawRemovalCandidate = { id: string; reason?: string }

type RawRankingFile = {
  generatedAt?: string | null
  provider?: string | null
  recommendedModel?: string | null
  topVisionModels?: Array<{ id: string; company: string; tier: string; score: number }>
  models?: RawRankingModel[]
  modelsByCompany?: RawCompanyGroup[]
  possibleModelsToRemove?: RawRemovalCandidate[]
  disabledModels?: string[]
}

// ─── Normalized types (public API) ──────────────────────────────────────────

export type NvidiaRankingModel = {
  /** Full model ID, e.g. "meta/llama-3.1-8b-instruct" */
  model: string
  company: string
  tier: string
  context_size: number | null
  available: boolean
  latency_ms: number | null
  score: number
  tool_check_passed: boolean
  tool_check_reason: string | null
  effort_check: {
    supported: boolean
    mechanism: string | null
    passed: number
    total: number
    all_passed: boolean
    results: Record<string, { ok: boolean; ms: number; error?: string }>
  } | null
  vision_check: { supported: boolean; ms: number | null; reason: string | null } | null
  quarantined: boolean
  removed: boolean
  disabled_by_toggle: boolean
}

export type NvidiaRankingResponse = {
  generated_at: string
  provider: string
  best_model: NvidiaRankingModel | null
  top_vision_models: Array<{ id: string; company: string; tier: string; score: number }>
  models: NvidiaRankingModel[]
  models_by_company: Array<{
    company: string
    best_model: NvidiaRankingModel | null
    models: NvidiaRankingModel[]
  }>
  possible_models_to_remove: Array<{ model: string; reason: string }>
  disabled_models: string[]
}

const EMPTY_RESPONSE: NvidiaRankingResponse = {
  generated_at: new Date(0).toISOString(),
  provider: 'nvidia',
  best_model: null,
  top_vision_models: [],
  models: [],
  models_by_company: [],
  possible_models_to_remove: [],
  disabled_models: [],
}

// ─── File path resolution ────────────────────────────────────────────────────

function resolveRankingPath(): string | null {
  if (process.env['CHRONOKAIRO_NVIDIA_RANKING_FILE']?.trim()) {
    return process.env['CHRONOKAIRO_NVIDIA_RANKING_FILE'].trim()
  }
  if (process.env['CHRONOKAIRO_NVIDIA_RANKING_DIR']?.trim()) {
    return path.join(process.env['CHRONOKAIRO_NVIDIA_RANKING_DIR'].trim(), 'nvidia-ranking.latest.json')
  }
  const cache = path.join(homedir(), '.kairos', 'cache', 'nvidia-ranking.json')
  if (existsSync(cache)) return cache
  return null
}

function resolveTogglePath(rankingFilePath: string | null): string | null {
  if (process.env['CHRONOKAIRO_NVIDIA_TOGGLE_FILE']?.trim()) {
    return process.env['CHRONOKAIRO_NVIDIA_TOGGLE_FILE'].trim()
  }
  if (process.env['CHRONOKAIRO_NVIDIA_RANKING_DIR']?.trim()) {
    return path.join(process.env['CHRONOKAIRO_NVIDIA_RANKING_DIR'].trim(), 'nvidia-tool-toggle.json')
  }
  if (rankingFilePath) {
    const sibling = path.join(path.dirname(rankingFilePath), 'nvidia-tool-toggle.json')
    if (existsSync(sibling)) return sibling
  }
  return null
}

// ─── Normalization (same logic as route.ts) ──────────────────────────────────

function normalizeModel(m: RawRankingModel, disabledSet: Set<string>): NvidiaRankingModel {
  return {
    model: m.id,
    company: m.company ?? 'unknown',
    tier: m.tier,
    context_size: m.contextSize ?? null,
    available: m.availability > 0,
    latency_ms: m.latencyMs?.p50 ?? null,
    score: m.score,
    tool_check_passed: Boolean(m.toolCheck?.passed),
    tool_check_reason: m.toolCheck?.reason ?? null,
    effort_check: m.effortCheck
      ? {
          supported: Boolean(m.effortCheck.supported),
          mechanism: m.effortCheck.mechanism ?? null,
          passed: m.effortCheck.passed ?? 0,
          total: m.effortCheck.total ?? 3,
          all_passed: Boolean(m.effortCheck.allPassed),
          results: m.effortCheck.results ?? {},
        }
      : null,
    vision_check: m.visionCheck
      ? {
          supported: Boolean(m.visionCheck.supported),
          ms: m.visionCheck.ms ?? null,
          reason: m.visionCheck.reason ?? null,
        }
      : null,
    quarantined: Boolean(m.quarantined),
    removed: Boolean(m.removed),
    disabled_by_toggle: disabledSet.has(m.id.trim()),
  }
}

function buildResponse(json: RawRankingFile, disabledSet: Set<string>): NvidiaRankingResponse {
  const benchmarked = (json.models ?? []).map((m) => normalizeModel(m, disabledSet))

  const benchmarkedIds = new Set(benchmarked.map((m) => m.model))
  const toggleOnly = Array.from(disabledSet)
    .filter((id) => !benchmarkedIds.has(id))
    .sort()
    .map((id): NvidiaRankingModel => ({
      model: id,
      company: id.includes('/') ? id.split('/')[0] : 'unknown',
      tier: 'DISABLED',
      context_size: null,
      available: false,
      latency_ms: null,
      score: -700,
      tool_check_passed: false,
      tool_check_reason: 'Disabled by toggle',
      effort_check: null,
      vision_check: null,
      quarantined: false,
      removed: false,
      disabled_by_toggle: true,
    }))

  const allModels = [...benchmarked, ...toggleOnly]
  allModels.sort((a, b) => b.score - a.score)

  const bestModel = benchmarked.find((m) => m.model === (json.recommendedModel ?? null)) ?? null

  const byCompany = new Map<string, NvidiaRankingModel[]>()
  for (const m of allModels) {
    const list = byCompany.get(m.company) ?? []
    list.push(m)
    byCompany.set(m.company, list)
  }
  const companyOrder = new Map((json.modelsByCompany ?? []).map((g, i) => [g.company, i]))
  const modelsByCompany = Array.from(byCompany.entries())
    .sort(([a], [b]) => {
      const ai = companyOrder.get(a) ?? 9999
      const bi = companyOrder.get(b) ?? 9999
      return ai !== bi ? ai - bi : a.localeCompare(b)
    })
    .map(([company, models]) => {
      const group = (json.modelsByCompany ?? []).find((g) => g.company === company)
      const best = models.find((m) => m.model === group?.recommendedModel) ?? null
      return { company, best_model: best, models }
    })

  return {
    generated_at: json.generatedAt ?? new Date(0).toISOString(),
    provider: json.provider ?? 'nvidia',
    best_model: bestModel,
    top_vision_models: json.topVisionModels ?? [],
    models: allModels,
    models_by_company: modelsByCompany,
    possible_models_to_remove: (json.possibleModelsToRemove ?? []).map((m) => ({
      model: m.id,
      reason: m.reason ?? 'No reason provided',
    })),
    disabled_models: Array.from(disabledSet).sort(),
  }
}

// ─── Sync API (for CLI) ───────────────────────────────────────────────────────

function readDisabledSetSync(togglePath: string | null): Set<string> {
  if (!togglePath) return new Set()
  try {
    const parsed = JSON.parse(readFileSync(togglePath, 'utf8')) as { disabledModels?: string[] }
    return new Set((parsed.disabledModels ?? []).map((s) => s.trim()).filter(Boolean))
  } catch {
    return new Set()
  }
}

/**
 * Load and normalize the NVIDIA ranking synchronously.
 * Returns an empty response if the ranking file is not found.
 */
export function loadNvidiaRankingSync(): NvidiaRankingResponse {
  const rankingPath = resolveRankingPath()
  if (!rankingPath || !existsSync(rankingPath)) return EMPTY_RESPONSE

  try {
    const json = JSON.parse(readFileSync(rankingPath, 'utf8')) as RawRankingFile
    const togglePath = resolveTogglePath(rankingPath)
    const disabledSet = readDisabledSetSync(togglePath)
    return buildResponse(json, disabledSet)
  } catch {
    return EMPTY_RESPONSE
  }
}

// ─── Async API (for Electron app) ────────────────────────────────────────────

async function readDisabledSetAsync(togglePath: string | null): Promise<Set<string>> {
  if (!togglePath) return new Set()
  try {
    const parsed = JSON.parse(await readFile(togglePath, 'utf8')) as { disabledModels?: string[] }
    return new Set((parsed.disabledModels ?? []).map((s) => s.trim()).filter(Boolean))
  } catch {
    return new Set()
  }
}

/**
 * Load and normalize the NVIDIA ranking asynchronously.
 * Returns an empty response if the ranking file is not found.
 */
export async function loadNvidiaRankingAsync(): Promise<NvidiaRankingResponse> {
  const rankingPath = resolveRankingPath()
  if (!rankingPath || !existsSync(rankingPath)) return EMPTY_RESPONSE

  try {
    const togglePath = resolveTogglePath(rankingPath)
    const [raw, disabledSet] = await Promise.all([
      readFile(rankingPath, 'utf8'),
      readDisabledSetAsync(togglePath),
    ])
    const json = JSON.parse(raw) as RawRankingFile
    return buildResponse(json, disabledSet)
  } catch {
    return EMPTY_RESPONSE
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Filter models that are ready for use in the CLI/picker:
 * tool_check passed + effort supported + not quarantined/removed/disabled.
 */
export function getActiveNvidiaModels(ranking: NvidiaRankingResponse): NvidiaRankingModel[] {
  return ranking.models.filter(
    (m) =>
      m.tool_check_passed &&
      m.effort_check?.supported &&
      !m.quarantined &&
      !m.removed &&
      !m.disabled_by_toggle,
  )
}

/** Best vision model from the ranking, with a sensible hardcoded fallback. */
export function getTopVisionModelId(ranking: NvidiaRankingResponse): string {
  return ranking.top_vision_models[0]?.id ?? 'meta/llama-3.2-90b-vision-instruct'
}

/** Returns true if any ranking data is available on disk. */
export function hasNvidiaRankingData(): boolean {
  return resolveRankingPath() !== null
}
