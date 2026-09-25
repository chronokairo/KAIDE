import fs from 'fs';
import path from 'path';
import os from 'os';
import type { AgentRole } from './pipeline';

// ─── Types ───────────────────────────────────────────────────

/**
 * Quality presets — um modo por multiplicador de custo Copilot:
 *
 * - free-tier (0x):           Totalmente gratuito. GPT-4.1, GPT-4o, GPT-5 mini, Raptor mini.
 * - budget-tier (0x):          Mesmo conjunto de modelos gratuitos, mantido apenas por compatibilidade.
 * - lite-tier (0x):            Mesmo conjunto de modelos gratuitos, mantido apenas por compatibilidade.
 * - standard-tier (0x):        Mesmo conjunto de modelos gratuitos, mantido apenas por compatibilidade.
 * - premium-tier (0x):         Mesmo conjunto de modelos gratuitos, mantido apenas por compatibilidade.
 * - ultra-tier (0x):           Mesmo conjunto de modelos gratuitos, mantido apenas por compatibilidade.
 */
export type QualityPreset = 'free-tier' | 'budget-tier' | 'lite-tier' | 'standard-tier' | 'premium-tier' | 'ultra-tier';

const FREE_TIER_MODELS: Record<AgentRole, string> = {
  'product-manager': 'gpt-4.1',
  'architect': 'gpt-4o',
  'organizer': 'gpt-4.1',
  'git': 'gpt-4.1',
  'dead-code': 'gpt-4.1',
  'troubleshooter': 'gpt-4.1',
  'backend': 'gpt-5-mini',
  'frontend': 'gpt-4.1',
  'devops': 'gpt-5-mini',
  'qa': 'raptor-mini',
  'code-review': 'gpt-5-mini',
};

export const QUALITY_PRESETS: Record<QualityPreset, {
  label: string;
  subtitle: string;
  description: string;
  costRange: { min: CostMultiplier; max: CostMultiplier };
  models: Record<AgentRole, string>;
  ranking: string[]; // Modelos do tier em ordem de preferencia (melhor → pior)
}> = {
  // ─── TIER 0x: FREE (Copilot Free / Included) ─────────────────────────────
  'free-tier': {
    label: 'Café Solúvel',
    subtitle: 'Gratuito (0x)',
    description: 'Zero custo. So modelos inclusos no plano gratuito. Ideal pra hotfix rapido, POC descartavel, ou quando o budget ja era. Nenhuma credencial de API necessaria!',
    costRange: { min: 0, max: 0 },
    models: { ...FREE_TIER_MODELS },
    ranking: [
      'gpt-4o',             // Forte raciocinio
      'gpt-4.1',            // Solido
      'gpt-5-mini',         // Mini capaz
      'raptor-mini',        // Alternativo
    ],
  },
  // ─── TIER 0x: BUDGET (Compatibilidade) ──────────────────────────────────
  'budget-tier': {
    label: 'Pingado',
    subtitle: 'Gratuito (0x)',
    description: 'Compatibilidade apenas. Usa os mesmos modelos gratuitos do tier free.',
    costRange: { min: 0, max: 0 },
    models: { ...FREE_TIER_MODELS },
    ranking: [
      'gpt-4o',
      'gpt-4.1',
      'gpt-5-mini',
      'raptor-mini',
    ],
  },
  // ─── TIER 0x: LITE (Compatibilidade) ───────────────────────────────────
  'lite-tier': {
    label: 'Cafe com Leite',
    subtitle: 'Gratuito (0x)',
    description: 'Compatibilidade apenas. Usa os mesmos modelos gratuitos do tier free.',
    costRange: { min: 0, max: 0 },
    models: { ...FREE_TIER_MODELS },
    ranking: [
      'gpt-4o',
      'gpt-4.1',
      'gpt-5-mini',
      'raptor-mini',
    ],
  },
  // ─── TIER 0x: STANDARD (Compatibilidade) ───────────────────────────────
  'standard-tier': {
    label: 'Café Coado',
    subtitle: 'Gratuito (0x)',
    description: 'Compatibilidade apenas. Usa os mesmos modelos gratuitos do tier free.',
    costRange: { min: 0, max: 0 },
    models: { ...FREE_TIER_MODELS },
    ranking: [
      'gpt-4o',
      'gpt-4.1',
      'gpt-5-mini',
      'raptor-mini',
    ],
  },
  // ─── TIER 0x: PREMIUM (Compatibilidade) ─────────────────────────────────
  'premium-tier': {
    label: 'Espresso Duplo',
    subtitle: 'Gratuito (0x)',
    description: 'Compatibilidade apenas. Usa os mesmos modelos gratuitos do tier free.',
    costRange: { min: 0, max: 0 },
    models: { ...FREE_TIER_MODELS },
    ranking: [
      'gpt-4o',
      'gpt-4.1',
      'gpt-5-mini',
      'raptor-mini',
    ],
  },
  // ─── TIER 0x: ULTRA (Compatibilidade) ──────────────────────────────────
  'ultra-tier': {
    label: 'Ristretto',
    subtitle: 'Gratuito (0x)',
    description: 'Compatibilidade apenas. Usa os mesmos modelos gratuitos do tier free.',
    costRange: { min: 0, max: 0 },
    models: { ...FREE_TIER_MODELS },
    ranking: [
      'gpt-4o',
      'gpt-4.1',
      'gpt-5-mini',
      'raptor-mini',
    ],
  },
};

export interface AgentModelConfig {
  /** 'auto' = PM (Opus) decides mode + models, 'manual' = user picks, or a quality preset */
  mode: 'auto' | 'manual' | QualityPreset;
  /** Model family per agent role */
  models: Record<AgentRole, string>;
  /** System prompt overrides per agent (optional) */
  promptOverrides?: Partial<Record<AgentRole, string>>;
}

/**
 * Copilot cost multipliers (planos pagos):
 * - 0    = free / included (nao conta no consumo)
 * - 0.25 = lite models (Grok Code Fast 1)
 * - 0.33 = fast/mini models (Haiku, Gemini 3 Flash, GPT-5.4 mini, etc)
 * - 1    = standard tier (Sonnet, Gemini Pro, GPT-5.x, etc)
 * - 3    = premium tier (Opus 4.5, Opus 4.6)
 * - 30   = ultra premium (Opus 4.6 fast mode)
 */
export type CostMultiplier = 0 | 0.25 | 0.33 | 1 | 3 | 30;

/**
 * Model families grouped by Copilot cost multiplier tier:
 * 
 * TIER 0x (Café Solúvel):      Free / Included in Copilot Free
 * TIER 0.25x-0.33x (Café com Leite): Light / Mini models
 * TIER 1x (Café Coado):        Standard / Baseline models
 * TIER 3x (Espresso Duplo):    Premium / Opus models
 * TIER 30x (Lungo Premium):    Ultra Premium / Opus Fast mode
 */
/** Model families available via VS Code Language Model API (Copilot) - grouped by multiplier */
export const AVAILABLE_MODELS = [
  // ═════════════════════════════════════════════════════════════════════════
  // TIER 0x (Free / Included in Copilot Free) — Multiplier: 0
  // ═════════════════════════════════════════════════════════════════════════
  { family: 'gpt-4.1', label: 'GPT-4.1', tier: 'free', vendor: 'copilot', cost: 0 as CostMultiplier },
  { family: 'gpt-4o', label: 'GPT-4o', tier: 'free', vendor: 'copilot', cost: 0 as CostMultiplier },
  { family: 'gpt-5-mini', label: 'GPT-5 mini', tier: 'free', vendor: 'copilot', cost: 0 as CostMultiplier },
  { family: 'raptor-mini', label: 'Raptor mini (Preview)', tier: 'free', vendor: 'copilot', cost: 0 as CostMultiplier },
  { family: 'goldeneye', label: 'Goldeneye', tier: 'free', vendor: 'copilot', cost: 0 as CostMultiplier },
] as const;

export type ModelFamily = typeof AVAILABLE_MODELS[number]['family'];

/** Legacy preset aliases — map old names to new tier names */
const LEGACY_PRESET_MAP: Record<string, QualityPreset> = {
  'cafe-soluvel': 'free-tier',
  'coado-com-carinho': 'standard-tier',
  'espresso-duplo': 'premium-tier',
  'ultra-premium-tier': 'ultra-tier',
};

/** Resolve legacy preset name to current tier name */
export function resolvePreset(mode: string): QualityPreset | string {
  return LEGACY_PRESET_MAP[mode] ?? mode;
}

// ─── Config file management ──────────────────────────────────

function getConfigPath(): string {
  return path.join(os.homedir(), '.anamnesic', 'agent-config.json');
}

/** Load agent model configuration (creates default if missing) */
export function loadAgentConfig(): AgentModelConfig {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const loaded = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AgentModelConfig;
      // Enforce fixed free-tier configuration regardless of persisted mode.
      return {
        ...loaded,
        mode: 'free-tier',
        models: { ...QUALITY_PRESETS['free-tier'].models },
      };
    }
  } catch (err) {
    console.error(`[Anamnesic] Failed to load agent config: ${(err as Error).message}`);
  }
  // Return default — cafe-soluvel (gratuito, zero credenciais necessarias) para nao gastar sem querer
  return applyQualityPreset('free-tier');
}

/** Save agent model configuration */
export function saveAgentConfig(config: AgentModelConfig): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const normalized: AgentModelConfig = {
    ...config,
    mode: 'free-tier',
    models: { ...QUALITY_PRESETS['free-tier'].models },
  };
  fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2), 'utf-8');
}

/** Get model family for a specific agent — respects active preset, falls back to free-tier */
export function getModelForAgent(role: AgentRole, config?: AgentModelConfig): string {
  const cfg = config || loadAgentConfig();
  const candidate = cfg.models[role];
  if (candidate && getModelCost(candidate) === 0) return candidate;

  // Resolve legacy preset names
  const resolved = resolvePreset(cfg.mode) as QualityPreset;
  if (isQualityPreset(resolved)) {
    const presetModel = QUALITY_PRESETS[resolved]?.models[role];
    if (presetModel && getModelCost(presetModel) === 0) return presetModel;
  }

  // Final fallback: free-tier only
  return QUALITY_PRESETS['free-tier'].models[role];
}

/** Update a single agent's model */
export function setAgentModel(role: AgentRole, modelFamily: string): AgentModelConfig {
  const config = loadAgentConfig();
  config.models[role] = modelFamily;
  saveAgentConfig(config);
  return config;
}

/** PM auto-assigns models based on task complexity */
export interface PMModelAssignment {
  role: AgentRole;
  model: string;
  reason: string;
}

/** Apply a quality preset — updates config and saves (resolves legacy names) */
export function applyQualityPreset(preset: QualityPreset | string): AgentModelConfig {
  const resolved = resolvePreset(preset) as QualityPreset;
  const presetData = QUALITY_PRESETS[resolved];
  if (!presetData) throw new Error(`Preset desconhecido: ${preset}`);

  // Enforce free-only configuration: qualquer preset diferente de free-tier resolve para free-tier.
  const safePreset = resolved === 'free-tier' ? 'free-tier' : 'free-tier';
  const config: AgentModelConfig = {
    mode: safePreset,
    models: { ...QUALITY_PRESETS['free-tier'].models },
  };
  saveAgentConfig(config);
  return config;
}

/** Check if mode is a quality preset (supports legacy names) */
export function isQualityPreset(mode: string): mode is QualityPreset {
  const resolved = resolvePreset(mode);
  return resolved in QUALITY_PRESETS;
}

// ─── Cost Tier Helpers ───────────────────────────────────────

/** Get cost multiplier for a model family */
export function getModelCost(family: string): CostMultiplier {
  const model = AVAILABLE_MODELS.find(m => m.family === family);
  return (model?.cost ?? 0) as CostMultiplier;
}

/** Get models within a cost range */
export function getModelsByCostRange(min: number, max: number): typeof AVAILABLE_MODELS[number][] {
  return [...AVAILABLE_MODELS.filter(m => m.cost >= min && m.cost <= max)];
}

/** Get the ranking list for a preset (fallback order for model swaps) */
export function getPresetRanking(preset: QualityPreset): string[] {
  return QUALITY_PRESETS[preset]?.ranking ?? [];
}

/** Get the PM model for a given preset */
export function getPMModelForPreset(preset: QualityPreset | string): string {
  const resolved = resolvePreset(preset) as QualityPreset;
  if (resolved !== 'free-tier') {
    return QUALITY_PRESETS['free-tier'].models['product-manager'];
  }
  return QUALITY_PRESETS[resolved]?.models['product-manager'] ?? QUALITY_PRESETS['free-tier'].models['product-manager'];
}

// ─── Model Failure History ───────────────────────────────────

/** A record of a model failing/being rejected for a role */
export interface ModelFailureEntry {
  model: string;
  role: string;
  taskTitle: string;
  feedback: string;
  timestamp: string;
}

/** Full failure history keyed by model family */
export interface ModelFailureHistory {
  /** model family -> array of failures */
  failures: Record<string, ModelFailureEntry[]>;
}

function getFailureHistoryPath(): string {
  return path.join(os.homedir(), '.anamnesic', 'model-failures.json');
}

/** Load model failure history */
export function loadModelFailures(): ModelFailureHistory {
  const p = getFailureHistoryPath();
  try {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch { /* ignore */ }
  return { failures: {} };
}

/** Record a model failure/rejection */
export function recordModelFailure(
  model: string,
  role: string,
  taskTitle: string,
  feedback: string,
): void {
  const history = loadModelFailures();
  if (!history.failures[model]) history.failures[model] = [];

  history.failures[model].push({
    model,
    role,
    taskTitle,
    feedback: feedback.substring(0, 500),
    timestamp: new Date().toISOString(),
  });

  // Keep at most 50 entries per model to avoid unbounded growth
  if (history.failures[model].length > 50) {
    history.failures[model] = history.failures[model].slice(-50);
  }

  const filePath = getFailureHistoryPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8');
}

/** Get failure count per model, optionally filtered by role */
export function getModelFailureCounts(role?: string): Record<string, number> {
  const history = loadModelFailures();
  const counts: Record<string, number> = {};
  for (const [model, entries] of Object.entries(history.failures)) {
    const filtered = role ? entries.filter(e => e.role === role) : entries;
    if (filtered.length > 0) {
      counts[model] = filtered.length;
    }
  }
  return counts;
}

// ─── Ollama Configuration ────────────────────────────────────

export interface OllamaConfig {
  /** Whether Ollama is enabled as provider */
  enabled: boolean;
  /** Ollama API endpoint (default: http://localhost:11434) */
  endpoint: string;
  /** Model to use for all agents when Ollama is enabled (e.g. llama3, codellama, mistral) */
  model: string;
}

const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  enabled: false,
  endpoint: 'http://localhost:11434',
  model: 'llama3',
};

function getOllamaConfigPath(): string {
  return path.join(os.homedir(), '.anamnesic', 'ollama-config.json');
}

/** Load Ollama configuration */
export function loadOllamaConfig(): OllamaConfig {
  const p = getOllamaConfigPath();
  try {
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return { ...DEFAULT_OLLAMA_CONFIG, ...raw };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_OLLAMA_CONFIG };
}

/** Save Ollama configuration */
export function saveOllamaConfig(config: OllamaConfig): void {
  const p = getOllamaConfigPath();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf-8');
}
