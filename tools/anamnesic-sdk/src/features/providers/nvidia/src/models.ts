import type {
  ModelDefinitionConfig,
  ModelProviderConfig,
} from "code/plugin-sdk/provider-model-shared";
import {
  fetchModelCatalog,
  getCachedModelCatalog,
  lookupModel,
  type ModelCatalog,
  type ModelInfo,
} from "../../../../entities/model/modelCatalog.js";
import {
  NVIDIA_DEFAULT_INFERENCE_BASE_URL,
  NVIDIA_DEFAULT_MODEL_ID,
  NVIDIA_DISCOVERY_PREFERRED_MODEL_IDS,
  NVIDIA_PROVIDER_ID,
} from "./defaults.js";

const NVIDIA_SEED_MODEL_IDS = [
  NVIDIA_DEFAULT_MODEL_ID,
  "moonshotai/kimi-k2.5",
  "minimaxai/minimax-m2.5",
  "z-ai/glm5",
] as const;

export type NvidiaModelWire = {
  id?: string;
  owned_by?: string;
};

function resolveCatalogModel(catalog: ModelCatalog | null, modelId: string): ModelInfo | undefined {
  return catalog ? lookupModel(catalog, NVIDIA_PROVIDER_ID, modelId) : undefined;
}

function toSupportedInput(modelInfo: ModelInfo | undefined, modelId: string): Array<"text" | "image"> {
  const inputs = modelInfo?.modalities.input.filter(
    (value): value is "text" | "image" => value === "text" || value === "image",
  );
  if (inputs && inputs.length > 0) {
    return inputs;
  }
  return /vision|vlm/i.test(modelId) ? ["text", "image"] : ["text"];
}

function toConfigCost(modelInfo: ModelInfo | undefined) {
  return {
    input: modelInfo?.cost.input ?? 0,
    output: modelInfo?.cost.output ?? 0,
    cacheRead: modelInfo?.cost.cache_read ?? 0,
    cacheWrite: modelInfo?.cost.cache_write ?? 0,
  };
}

function toCompat(compat: ModelDefinitionConfig["compat"] | undefined) {
  return {
    ...(compat ?? {}),
    requiresStringContent: true,
    supportsUsageInStreaming: true,
  };
}

export function resolveNvidiaInferenceBase(baseUrl?: string): string {
  const trimmed = (baseUrl ?? NVIDIA_DEFAULT_INFERENCE_BASE_URL).trim().replace(/\/+$/, "");
  if (!trimmed) {
    return NVIDIA_DEFAULT_INFERENCE_BASE_URL;
  }
  return /\/v1$/i.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

export async function resolveNvidiaModelCatalog(): Promise<ModelCatalog | null> {
  const cached = getCachedModelCatalog();
  if (cached) {
    return cached;
  }

  try {
    return await fetchModelCatalog();
  } catch {
    return getCachedModelCatalog();
  }
}

export function mapNvidiaWireModelToConfig(
  entry: NvidiaModelWire,
  catalog: ModelCatalog | null,
): ModelDefinitionConfig | null {
  const id = entry.id?.trim();
  if (!id) {
    return null;
  }

  const modelInfo = resolveCatalogModel(catalog, id);
  return {
    id,
    name: modelInfo?.name || id,
    reasoning: modelInfo?.reasoning ?? false,
    input: toSupportedInput(modelInfo, id),
    cost: toConfigCost(modelInfo),
    compat: toCompat(undefined),
    contextWindow: modelInfo?.limit.context,
    contextTokens: modelInfo?.limit.context,
    maxTokens: modelInfo?.limit.output,
  };
}

export function mapNvidiaWireModelsToConfig(
  entries: NvidiaModelWire[],
  catalog: ModelCatalog | null,
): ModelDefinitionConfig[] {
  const seen = new Set<string>();
  const mapped: ModelDefinitionConfig[] = [];
  for (const entry of entries) {
    const model = mapNvidiaWireModelToConfig(entry, catalog);
    if (!model || seen.has(model.id)) {
      continue;
    }
    seen.add(model.id);
    mapped.push(model);
  }
  return mapped;
}

export function normalizeNvidiaConfiguredCatalogEntries(
  models: ModelProviderConfig["models"] | undefined,
): ModelDefinitionConfig[] {
  if (!Array.isArray(models)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: ModelDefinitionConfig[] = [];
  for (const model of models) {
    if (!model || typeof model !== "object") {
      continue;
    }
    const id = typeof model.id === "string" ? model.id.trim() : "";
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    const input = Array.isArray(model.input)
      ? model.input.filter((entry): entry is "text" | "image" => entry === "text" || entry === "image")
      : [];
    normalized.push({
      ...model,
      id,
      name: typeof model.name === "string" && model.name.trim() ? model.name.trim() : id,
      input: input.length > 0 ? input : ["text"],
      compat: toCompat(model.compat),
    });
  }
  return normalized;
}

export function buildNvidiaSeedModels(): ModelDefinitionConfig[] {
  const catalog = getCachedModelCatalog();
  return NVIDIA_SEED_MODEL_IDS.map((id) => {
    const modelInfo = resolveCatalogModel(catalog, id);
    return {
      id,
      name: modelInfo?.name || id,
      reasoning: modelInfo?.reasoning ?? false,
      input: toSupportedInput(modelInfo, id),
      cost: toConfigCost(modelInfo),
      compat: toCompat(undefined),
      contextWindow: modelInfo?.limit.context,
      contextTokens: modelInfo?.limit.context,
      maxTokens: modelInfo?.limit.output,
    };
  });
}

export function selectDefaultNvidiaModelId(
  discoveredModels: ModelDefinitionConfig[],
): string | undefined {
  const ids = discoveredModels.map((model) => model.id.trim()).filter(Boolean);
  if (ids.length === 0) {
    return undefined;
  }
  for (const preferredId of NVIDIA_DISCOVERY_PREFERRED_MODEL_IDS) {
    if (ids.includes(preferredId)) {
      return preferredId;
    }
  }
  return ids[0];
}