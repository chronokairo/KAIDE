export interface NvidiaNimModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutput: number;
  capabilities: {
    reasoning: boolean;
    toolCall: boolean;
    structuredOutput: boolean;
    vision: boolean;
  };
  isOpenWeights: boolean;
}

interface NvidiaNimApiResponse {
  data: Array<{
    id: string;
    owned_by: string;
    created?: number;
    root?: string;
  }>;
}

const CAPABILITY_MAP: Record<string, { reasoning: boolean; toolCall: boolean; structuredOutput: boolean; vision: boolean }> = {
  'nemotron': { reasoning: true, toolCall: true, structuredOutput: true, vision: false },
  'llama': { reasoning: true, toolCall: true, structuredOutput: false, vision: false },
  'mistral': { reasoning: false, toolCall: true, structuredOutput: false, vision: false },
  'cosmos': { reasoning: true, toolCall: false, structuredOutput: false, vision: false },
  'gliner': { reasoning: false, toolCall: false, structuredOutput: false, vision: false },
  'nv-embed': { reasoning: false, toolCall: false, structuredOutput: false, vision: false },
  'bevformer': { reasoning: false, toolCall: false, structuredOutput: false, vision: true },
  'studiovoice': { reasoning: false, toolCall: false, structuredOutput: false, vision: false },
  'usdcode': { reasoning: false, toolCall: false, structuredOutput: false, vision: false },
};

function inferCapabilities(modelId: string): { reasoning: boolean; toolCall: boolean; structuredOutput: boolean; vision: boolean } {
  const lower = modelId.toLowerCase();
  if (lower.includes('vl') || lower.includes('vision')) {
    return { reasoning: true, toolCall: true, structuredOutput: false, vision: true };
  }
  for (const [key, caps] of Object.entries(CAPABILITY_MAP)) {
    if (lower.includes(key)) return caps;
  }
  if (lower.includes('nano')) return { reasoning: true, toolCall: true, structuredOutput: false, vision: false };
  if (lower.includes('ultra') || lower.includes('super')) return { reasoning: true, toolCall: true, structuredOutput: true, vision: false };
  return { reasoning: false, toolCall: false, structuredOutput: false, vision: false };
}

function isChatModel(modelId: string): boolean {
  const skip = ['embed', 'rerank', 'tts', 'safety', 'detect', 'predict', 'transfer', 'validate', 'drive', 'petr', 'sparsedrive', 'synthetic'];
  const lower = modelId.toLowerCase();
  return !skip.some(s => lower.includes(s));
}

function modelDisplayName(modelId: string): string {
  const parts = modelId.split('/');
  const short = parts.length > 1 ? parts.slice(1).join('/') : modelId;
  return short
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export async function fetchNvidiaNimModels(apiKey: string, baseUrl: string = 'https://integrate.api.nvidia.com/v1'): Promise<NvidiaNimModel[]> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) return [];

    const data: NvidiaNimApiResponse = await response.json();
    if (!data?.data) return [];

    return data.data
      .filter(m => isChatModel(m.id))
      .map(m => {
        const caps = inferCapabilities(m.id);
        return {
          id: m.id,
          name: modelDisplayName(m.id),
          provider: m.owned_by || 'NVIDIA',
          contextWindow: 128000,
          maxOutput: 8192,
          capabilities: caps,
          isOpenWeights: m.id.includes('llama') || m.id.includes('mistral'),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
