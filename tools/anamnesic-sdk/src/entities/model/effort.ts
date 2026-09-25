import { type ModelCatalog, findModel } from './modelCatalog.js'
import type { EffortLevel } from '@chronokairo/core'

export type { EffortLevel }

export const ALL_EFFORT_LEVELS: EffortLevel[] = ['low', 'medium', 'high', 'max']

/**
 * Returns true when the model supports effort levels.
 *
 * When a models.dev catalog is provided, uses the `reasoning` field for
 * an accurate answer. Falls back to string-matching heuristics otherwise.
 *
 * @param modelId  Model identifier (e.g. "claude-opus-4", "llama-3.3-70b-versatile")
 * @param catalog  Optional models.dev catalog from fetchModelCatalog()
 */
export function modelSupportsEffort(modelId: string, catalog?: ModelCatalog): boolean {
  if (!modelId) return false

  // Prefer data-driven answer when a catalog is available
  if (catalog) {
    const entry = findModel(catalog, modelId)
    if (entry) return entry.model.reasoning
  }

  // Fallback: string-matching heuristics
  const m = modelId.toLowerCase()

  // Anthropic: only the -4-6 generation supports effort
  if (m.includes('opus-4-6') || m.includes('sonnet-4-6')) return true
  if (m.includes('haiku') || m.includes('sonnet') || m.includes('opus')) return false

  // NVIDIA / open-weight families (including OpenAI-routed ids like openai/gpt-oss-120b)
  if (
    m.includes('nvidia') ||
    m.includes('gpt-oss') ||
    m.includes('nemotron') ||
    m.includes('llama') ||
    m.includes('mistral') ||
    m.includes('qwen') ||
    m.includes('deepseek') ||
    m.includes('phi') ||
    m.includes('gemma')
  ) {
    if (/mistral[-.]?small[-.]?4/i.test(m)) return false
    return true
  }

  return false
}

/** Returns true when the model supports the "max" effort level (opus-4.6 only). */
export function modelSupportsMaxEffort(modelId: string, catalog?: ModelCatalog): boolean {
  if (catalog) {
    const entry = findModel(catalog, modelId)
    // "max" = reasoning model from Anthropic Opus family
    if (entry) {
      return entry.model.reasoning && entry.model.family.includes('claude-opus')
    }
  }
  return modelId.toLowerCase().includes('opus-4-6')
}

/**
 * Returns the effort levels available for a given model.
 * Empty array means effort is not supported — hide the selector.
 *
 * @param catalog  Optional models.dev catalog for data-driven results
 */
export function availableEffortLevels(modelId: string, catalog?: ModelCatalog): EffortLevel[] {
  if (!modelSupportsEffort(modelId, catalog)) return []
  return modelSupportsMaxEffort(modelId, catalog)
    ? ALL_EFFORT_LEVELS
    : ALL_EFFORT_LEVELS.filter((l) => l !== 'max')
}
