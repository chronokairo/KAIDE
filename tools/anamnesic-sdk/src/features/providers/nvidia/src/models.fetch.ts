import type { ModelDefinitionConfig } from "code/plugin-sdk/provider-model-shared";
import {
  mapNvidiaWireModelsToConfig,
  resolveNvidiaInferenceBase,
  resolveNvidiaModelCatalog,
  type NvidiaModelWire,
} from "./models.js";
import { buildNvidiaAuthHeaders } from "./runtime.js";

type NvidiaModelsResponseWire = {
  data?: NvidiaModelWire[];
};

export type FetchNvidiaModelsResult = {
  reachable: boolean;
  status?: number;
  models: NvidiaModelWire[];
  error?: unknown;
};

export async function fetchNvidiaModels(params: {
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<FetchNvidiaModelsResult> {
  const baseUrl = resolveNvidiaInferenceBase(params.baseUrl);
  const timeoutMs = params.timeoutMs ?? 5000;

  try {
    const fetchFn = params.fetchImpl ?? fetch;
    const response = await fetchFn(`${baseUrl}/models`, {
      headers: buildNvidiaAuthHeaders({
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

    const payload = (await response.json()) as NvidiaModelsResponseWire;
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

export async function discoverNvidiaModels(params: {
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  quiet?: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<ModelDefinitionConfig[]> {
  const fetched = await fetchNvidiaModels(params);
  if (!fetched.reachable) {
    return [];
  }
  if (fetched.status !== undefined && fetched.status >= 400) {
    return [];
  }
  if (fetched.models.length === 0) {
    return [];
  }

  const catalog = await resolveNvidiaModelCatalog();
  return mapNvidiaWireModelsToConfig(fetched.models, catalog);
}