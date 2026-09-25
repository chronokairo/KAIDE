import type { ModelDefinitionConfig } from "code/plugin-sdk/provider-model-shared";
import {
  mapAnthropicWireModelsToConfig,
  resolveAnthropicInferenceBase,
  resolveAnthropicModelCatalog,
  type AnthropicModelWire,
} from "./models.js";
import { buildAnthropicAuthHeaders } from "./runtime.js";

type AnthropicModelsResponseWire = {
  data?: AnthropicModelWire[];
};

export type FetchAnthropicModelsResult = {
  reachable: boolean;
  status?: number;
  models: AnthropicModelWire[];
  error?: unknown;
};

export async function fetchAnthropicModels(params: {
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<FetchAnthropicModelsResult> {
  const baseUrl = resolveAnthropicInferenceBase(params.baseUrl);
  const timeoutMs = params.timeoutMs ?? 5000;

  try {
    const fetchFn = params.fetchImpl ?? fetch;
    const response = await fetchFn(`${baseUrl}/models`, {
      headers: buildAnthropicAuthHeaders({
        apiKey: params.apiKey,
        headers: params.headers,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      return {
        reachable: true,
        status: response.status,
        models: [],
      };
    }

    const payload = (await response.json()) as AnthropicModelsResponseWire;
    return {
      reachable: true,
      status: response.status,
      models: Array.isArray(payload.data) ? payload.data : [],
    };
  } catch (error) {
    return {
      reachable: false,
      models: [],
      error,
    };
  }
}

export async function discoverAnthropicModels(params: {
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  quiet?: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<ModelDefinitionConfig[]> {
  const fetched = await fetchAnthropicModels(params);
  if (!fetched.reachable) {
    return [];
  }
  if (fetched.status !== undefined && fetched.status >= 400) {
    return [];
  }
  if (fetched.models.length === 0) {
    return [];
  }

  const catalog = await resolveAnthropicModelCatalog();
  return mapAnthropicWireModelsToConfig(fetched.models, catalog);
}