export const ANNA_MODEL_CONFIG_KEY = 'anna:model-config';

export interface AnnaChatModelConfig {
  providerId: string;
  providerName: string;
  baseUrl: string;
  model: string;
  label: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  api: string;
}

export const BEDROCK_MODELS: AnnaChatModelConfig[] = [
  { providerId: 'bedrock', providerName: 'AWS Bedrock', baseUrl: 'bedrock', model: 'global.anthropic.claude-haiku-4-5-20251001-v1:0', label: 'Haiku 4.5' },
  { providerId: 'bedrock', providerName: 'AWS Bedrock', baseUrl: 'bedrock', model: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0', label: 'Sonnet 4.5' },
  { providerId: 'bedrock', providerName: 'AWS Bedrock', baseUrl: 'bedrock', model: 'global.anthropic.claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { providerId: 'bedrock', providerName: 'AWS Bedrock', baseUrl: 'bedrock', model: 'global.anthropic.claude-opus-4-5-20251101-v1:0', label: 'Opus 4.5' },
  { providerId: 'bedrock', providerName: 'AWS Bedrock', baseUrl: 'bedrock', model: 'global.anthropic.claude-opus-4-6-v1', label: 'Opus 4.6' },
  { providerId: 'bedrock', providerName: 'AWS Bedrock', baseUrl: 'bedrock', model: 'global.anthropic.claude-opus-4-8', label: 'Opus 4.8' },
];

export const STATIC_LOCAL_PROVIDERS: ProviderInfo[] = [
  { id: 'bedrock', name: 'AWS Bedrock', api: 'bedrock' },
];

export function loadSavedModelConfig(): AnnaChatModelConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(ANNA_MODEL_CONFIG_KEY) ?? 'null') as Partial<AnnaChatModelConfig> | null;
    const restored = saved ? BEDROCK_MODELS.find((m) => m.model === saved.model) : undefined;
    return restored ?? BEDROCK_MODELS[0];
  } catch {
    return BEDROCK_MODELS[0];
  }
}

export function saveModelConfig(config: AnnaChatModelConfig): void {
  localStorage.setItem(ANNA_MODEL_CONFIG_KEY, JSON.stringify(config));
}
