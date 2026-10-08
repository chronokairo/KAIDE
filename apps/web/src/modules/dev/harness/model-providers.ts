import { invokeHarness } from './transport';
import type { ProviderInfo, ProviderEnvStatus } from './types';

export type { ProviderEnvStatus };

export const modelProvidersClient = {
  listModelProviders: async (workspace?: string) =>
    invokeHarness<ProviderInfo[]>('list_model_providers', { workspace }),
  getModelProviderApiKey: async (providerId: string, workspace?: string) =>
    invokeHarness<string | null>('get_model_provider_api_key', { providerId, workspace }),
  validateModelProvider: async (name: string, baseUrl?: string, wireApi?: string) =>
    invokeHarness<boolean>('validate_model_provider', { name, baseUrl, wireApi }),
  setModelProviderApiKey: async (providerId: string, apiKey: string, apiBase?: string) =>
    invokeHarness<any>('set_model_provider_api_key', { providerId, apiKey, apiBase }),
  setModelProviderBase: async (providerId: string, baseUrl: string) =>
    invokeHarness<any>('set_model_provider_base', { providerId, baseUrl }),
  removeModelProvider: async (providerId: string) =>
    invokeHarness<any>('remove_model_provider', { providerId }),
  getProviderEnvStatus: async () =>
    invokeHarness<ProviderEnvStatus>('get_provider_env_status'),
  testNvidiaNim: async (apiKey?: string, model?: string) =>
    invokeHarness<any>('test_nvidia_nim_connection', { apiKey, model }),
  testNvidiaNimConnection: async (apiKey?: string, model?: string) =>
    invokeHarness<any>('test_nvidia_nim_connection', { apiKey, model }),
};
