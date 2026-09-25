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
  ANTHROPIC_DEFAULT_INFERENCE_BASE_URL,
  ANTHROPIC_DEFAULT_MODEL_ID,
  ANTHROPIC_PROVIDER_ID,
} from "./defaults.js";

export type AnthropicModelWire = {
  id?: string;
  display_name?: string;
  type?: string;
  created_at?: string;
};

function toSupportedInput(
  modelInfo: ModelInfo | undefined,
  modelId: string,
): Array<"text" | "image"> {
  const inputs = modelInfo?.modalities.input.filter(
    (value): value is "text" | "image" => value === "text" || value === "image",
  );
  if (inputs && inputs.length > 0) {
    return inputs;
  }
  return /claude/i.test(modelId) ? ["text", "image"] : ["text"];
}

function toConfigCost(modelInfo: ModelInfo | undefined) {
  return {
    input: modelInfo?.cost.input ?? 0,
    output: modelInfo?.cost.output ?? 0,
    cacheRead: modelInfo?.cost.cache_read ?? 0,
    cacheWrite: modelInfo?.cost.cache_write ?? 0,
  };
}

function resolveCatalogModel(catalog: ModelCatalog | null, modelId: string): ModelInfo | undefined {
  return catalog ? lookupModel(catalog, ANTHROPIC_PROVIDER_ID, modelId) : undefined;
}

export function resolveAnthropicInferenceBase(baseUrl?: string): string {
  const trimmed = (baseUrl ?? ANTHROPIC_DEFAULT_INFERENCE_BASE_URL).trim().replace(/\/+$/, "");
  if (!trimmed) {
    return ANTHROPIC_DEFAULT_INFERENCE_BASE_URL;
  }
  return /\/v1$/i.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

export async function resolveAnthropicModelCatalog(): Promise<ModelCatalog | null> {
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

export function mapAnthropicWireModelToConfig(
  entry: AnthropicModelWire,
  catalog: ModelCatalog | null,
): ModelDefinitionConfig | null {
  const id = entry.id?.trim();
  if (!id) {
    return null;
  }

  const modelInfo = resolveCatalogModel(catalog, id);
  return {
    id,
    name: entry.display_name?.trim() || modelInfo?.name || id,
    reasoning: modelInfo?.reasoning ?? false,
    input: toSupportedInput(modelInfo, id),
    cost: toConfigCost(modelInfo),
    compat: { supportsUsageInStreaming: true },
    contextWindow: modelInfo?.limit.context ?? 200000,
    contextTokens: modelInfo?.limit.context,
    maxTokens: modelInfo?.limit.output ?? 8192,
  };
}

export function mapAnthropicWireModelsToConfig(
  entries: AnthropicModelWire[],
  catalog: ModelCatalog | null,
): ModelDefinitionConfig[] {
  const seen = new Set<string>();
  const mapped: ModelDefinitionConfig[] = [];
  for (const entry of entries) {
    const model = mapAnthropicWireModelToConfig(entry, catalog);
    if (!model || seen.has(model.id)) {
      continue;
    }
    seen.add(model.id);
    mapped.push(model);
  }
  return mapped;
}

export function normalizeAnthropicConfiguredCatalogEntries(
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
    normalized.push({
      ...model,
      id,
      name: typeof model.name === "string" && model.name.trim() ? model.name.trim() : id,
      compat: { ...(model.compat ?? {}), supportsUsageInStreaming: true },
    });
  }
  return normalized;
}

export function selectDefaultAnthropicModelId(
  discoveredModels: ModelDefinitionConfig[],
): string | undefined {
  const ids = discoveredModels.map((model) => model.id.trim()).filter(Boolean);
  if (ids.length === 0) {
    return undefined;
  }
  return ids.includes(ANTHROPIC_DEFAULT_MODEL_ID) ? ANTHROPIC_DEFAULT_MODEL_ID : ids[0];
}