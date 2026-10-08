export interface SavedConfig {
  providerId: string;
  modelId: string;
  apiKey: string;
  baseUrl: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  api?: string;
}

const STORAGE_KEY = 'anna:model-config';

export function loadConfig(): Partial<SavedConfig> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveConfig(cfg: SavedConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export const STATIC_LOCAL_PROVIDERS: ProviderInfo[] = [
  { id: 'ollama-remote', name: 'Ollama (Remoto)', api: 'https://ciesa-ollama.fyczn4.easypanel.host/v1' },
  { id: 'ollama', name: 'Ollama', api: 'http://localhost:11434/v1' },
  { id: 'lmstudio', name: 'LMStudio', api: 'http://127.0.0.1:1234/v1' },
];

export const DEFAULT_PROVIDER_ID = 'ollama-remote';
