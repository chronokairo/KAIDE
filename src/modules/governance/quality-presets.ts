/**
 * Quality Presets & Model Routing
 * Portado e adaptado do ThinkCoffee para o ChronoKairo AI.
 *
 * Estratégia de roteamento de modelos com base em multiplicadores de custo.
 * Impede que tarefas triviais queimem tokens caros desnecessariamente.
 */

import type { QualityPreset, QualityPresetConfig } from './types';

export const QUALITY_PRESETS: Record<QualityPreset, QualityPresetConfig> = {
  'free-tier': {
    id: 'free-tier',
    label: 'Gratuito (0x)',
    multiplier: 0,
    description: 'Zero custo. Modelos gratuitos ou inclusos. Ideal para leituras, sumarizações e drafts.',
    defaultModel: 'gemini-2.5-flash',
    fallbackModel: 'gpt-4o-mini',
    recommendedRoles: ['reader', 'linter', 'docs-summary'],
  },
  'budget-tier': {
    id: 'budget-tier',
    label: 'Econômico (0.25x)',
    multiplier: 0.25,
    description: 'Custo mínimo. Modelos ultrarrápidos para iterações contínuas, hotfixes e scripts.',
    defaultModel: 'grok-code-fast-1',
    fallbackModel: 'gemini-2.5-flash',
    recommendedRoles: ['bugfix', 'code-review-fast', 'refactor-small'],
  },
  'lite-tier': {
    id: 'lite-tier',
    label: 'Rápido (0.33x)',
    multiplier: 0.33,
    description: 'Modelos rápidos e com raciocínio balanceado.',
    defaultModel: 'claude-3-5-haiku',
    fallbackModel: 'gpt-4.1-mini',
    recommendedRoles: ['developer-fast', 'unit-test-generator'],
  },
  'standard-tier': {
    id: 'standard-tier',
    label: 'Padrão (1x)',
    multiplier: 1.0,
    description: 'Tier recomendado para desenvolvimento de features completas e raciocínio profundo.',
    defaultModel: 'claude-3-5-sonnet',
    fallbackModel: 'gpt-5',
    recommendedRoles: ['fullstack-developer', 'backend-engineer', 'frontend-engineer'],
  },
  'premium-tier': {
    id: 'premium-tier',
    label: 'Avançado (3x)',
    multiplier: 3.0,
    description: 'Modelos topo de linha com máxima capacidade de resolução de problemas complexos.',
    defaultModel: 'claude-3-7-sonnet',
    fallbackModel: 'claude-opus',
    recommendedRoles: ['software-architect', 'security-auditor', 'system-designer'],
  },
  'ultra-tier': {
    id: 'ultra-tier',
    label: 'Ultra (30x)',
    multiplier: 30.0,
    description: 'Modo de máxima precisão sem restrição de orçamento para decisões críticas de infraestrutura.',
    defaultModel: 'claude-opus-4-6',
    fallbackModel: 'gpt-5-pro',
    recommendedRoles: ['enterprise-architect', 'disaster-recovery'],
  },
};

/**
 * Retorna o modelo recomendado de acordo com o preset e a complexidade da tarefa.
 */
export function getRecommendedModel(tier: QualityPreset = 'standard-tier'): string {
  const preset = QUALITY_PRESETS[tier] || QUALITY_PRESETS['standard-tier'];
  return preset.defaultModel;
}

/**
 * Retorna o multiplicador de custo para cálculos de orçamento e telemetria.
 */
export function getCostMultiplier(tier: QualityPreset): number {
  return QUALITY_PRESETS[tier]?.multiplier ?? 1.0;
}
