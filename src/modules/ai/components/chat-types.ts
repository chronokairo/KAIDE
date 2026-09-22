export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
  tasksList?: string[];
  riskAssessment?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  context?: string;
  elapsed_ms?: number;
  toolCalls?: Array<{ name: string; summary?: string }>;
  planSteps?: Array<{ index: number; total: number; description: string }>;
  verifications?: Array<{ status: string; command?: string; summary: string }>;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutput: number;
  pricing?: { input: number; output: number };
  capabilities: {
    reasoning: boolean;
    toolCall: boolean;
    structuredOutput: boolean;
    vision: boolean;
  };
  isOpenWeights: boolean;
}

export const CTX_MAP: Array<{ pattern: RegExp; label: string; icon: string }> = [
  { pattern: /financeiro|fluxo de caixa|faturamento|conta a pagar|conta a receber|boleto|nota fiscal/i, label: 'Financeiro', icon: 'payments' },
  { pattern: /crm|lead|cliente|funil|proposta|oportunidade/i, label: 'CRM', icon: 'group' },
  { pattern: /projeto|sprint|tarefa|kanban|epic|milestone/i, label: 'Projetos', icon: 'task_alt' },
  { pattern: /fiscal|sped|nfe|cfop|ncm|icms|pis|cofins/i, label: 'Fiscal', icon: 'receipt_long' },
  { pattern: /contrato|aditivo|cláusula|rescisão|vigência/i, label: 'Contratos', icon: 'history_edu' },
  { pattern: /rh|funcionário|colaborador|folha|holerite|benefício/i, label: 'RH', icon: 'badge' },
];

export function detectCtx(text: string): { label: string; icon: string } | null {
  for (const { pattern, label, icon } of CTX_MAP) {
    if (pattern.test(text)) return { label, icon };
  }
  return null;
}

export const REFERENCE_CARDS = [
  { icon: 'person_add', title: 'Prospectar & Cadastrar Leads B2B', prompt: '@browser Navegue no site da Audiomed Manaus, extraia os dados corporativos e cadastre o lead no CRM' },
  { icon: 'gavel', title: 'Auditar Processos & Notificações', prompt: '@browser Acesse o portal do TJAM/DIP, audite a notificação do Grupo Waldery Areosa e anexe ao Jurídico' },
  { icon: 'rocket_launch', title: 'Estruturar Projeto & Sprints', prompt: '@browser Analise os requisitos do cliente e estruture o backlog de sprints no módulo Projetos' },
];

export const MODELS = ['NVIDIA NIM'];
export const EFFORT_LEVELS = ['Extra high', 'High', 'Medium', 'Low'];
export const ENVIRONMENTS = ['Local', 'Worktree', 'Cloud'];

export const MODELS_DEV_PROVIDERS = [
  { id: 'nvidia', name: 'NVIDIA', models: 13 },
  { id: 'openai', name: 'OpenAI', models: 39 },
  { id: 'anthropic', name: 'Anthropic', models: 39 },
  { id: 'google', name: 'Google', models: 23 },
  { id: 'meta', name: 'Meta', models: 18 },
  { id: 'mistralai', name: 'Mistral AI', models: 18 },
  { id: 'deepseek', name: 'DeepSeek', models: 28 },
  { id: 'alibaba', name: 'Alibaba', models: 18 },
  { id: 'xai', name: 'xAI', models: 15 },
  { id: 'microsoft', name: 'Microsoft', models: 1 },
  { id: 'upstage', name: 'Upstage', models: 6 },
  { id: 'thinkingmachines', name: 'Thinking Machines', models: 11 },
  { id: 'zhipuai', name: 'Zhipu AI', models: 6 },
  { id: 'poolside', name: 'Poolside', models: 1 },
  { id: 'minimaxai', name: 'MiniMax AI', models: 2 },
  { id: 'stepfun-ai', name: 'StepFun AI', models: 2 },
  { id: 'sarvamai', name: 'Sarvam AI', models: 1 },
  { id: 'baai', name: 'BAAI', models: 1 },
  { id: 'black-forest-labs', name: 'Black Forest Labs', models: 4 },
  { id: 'bytedance', name: 'ByteDance', models: 1 },
  { id: 'abacusai', name: 'Abacus AI', models: 1 },
];

export const NVIDIA_MODELS_FALLBACK: ModelInfo[] = [
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra 550B', provider: 'NVIDIA', contextWindow: 1000000, maxOutput: 65536, pricing: { input: 0.50, output: 2.50 }, capabilities: { reasoning: true, toolCall: true, structuredOutput: true, vision: false }, isOpenWeights: false },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 3 Super 120B', provider: 'NVIDIA', contextWindow: 262144, maxOutput: 262144, pricing: { input: 0.20, output: 0.80 }, capabilities: { reasoning: true, toolCall: true, structuredOutput: false, vision: false }, isOpenWeights: false },
  { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'Nemotron 3 Nano 30B', provider: 'NVIDIA', contextWindow: 131072, maxOutput: 131072, pricing: { input: 0, output: 0 }, capabilities: { reasoning: true, toolCall: true, structuredOutput: false, vision: false }, isOpenWeights: false },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', provider: 'Meta', contextWindow: 128000, maxOutput: 8192, pricing: { input: 0, output: 0 }, capabilities: { reasoning: false, toolCall: true, structuredOutput: false, vision: false }, isOpenWeights: true },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Llama 3.1 Nemotron 70B', provider: 'NVIDIA', contextWindow: 128000, maxOutput: 8192, pricing: { input: 0, output: 0 }, capabilities: { reasoning: false, toolCall: true, structuredOutput: false, vision: false }, isOpenWeights: false },
  { id: 'nvidia/nemotron-3.5-lightning', name: 'Nemotron 3.5 Lightning 30B', provider: 'NVIDIA', contextWindow: 262144, maxOutput: 262144, pricing: { input: 0, output: 0 }, capabilities: { reasoning: true, toolCall: true, structuredOutput: true, vision: false }, isOpenWeights: false },
];

import { getAuthSession } from '@/shared/supabase';

let _cachedModels: ModelInfo[] | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchAvailableModels(): Promise<ModelInfo[]> {
  const now = Date.now();
  if (_cachedModels && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _cachedModels;
  }

  try {
    const headers: Record<string, string> = {};
    const session = await getAuthSession().catch(() => null);
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch('/api/settings/integrations/nvidia-nim/models', { headers });
    if (!res.ok) return NVIDIA_MODELS_FALLBACK;

    const data = await res.json();
    if (!data.configured || !data.models?.length) return NVIDIA_MODELS_FALLBACK;

    const models: ModelInfo[] = data.models.map((m: any) => ({
      id: m.id,
      name: m.name,
      provider: m.provider || 'NVIDIA',
      contextWindow: m.contextWindow || 128000,
      maxOutput: m.maxOutput || 8192,
      capabilities: m.capabilities || { reasoning: false, toolCall: false, structuredOutput: false, vision: false },
      isOpenWeights: m.isOpenWeights || false,
    }));

    _cachedModels = models;
    _cacheTimestamp = now;
    return models;
  } catch {
    return NVIDIA_MODELS_FALLBACK;
  }
}

export function invalidateModelsCache(): void {
  _cachedModels = null;
  _cacheTimestamp = 0;
}
