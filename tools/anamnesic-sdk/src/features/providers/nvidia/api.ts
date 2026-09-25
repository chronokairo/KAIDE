export { buildNvidiaProvider, NVIDIA_DEFAULT_MODEL_ID } from "./provider-catalog.js";
export {
  applyNvidiaConfig,
  applyNvidiaProviderConfig,
  NVIDIA_DEFAULT_MODEL_REF,
} from "./onboard.js";
export {
  NVIDIA_DEFAULT_API_KEY_ENV_VAR,
  NVIDIA_DEFAULT_BASE_URL,
  NVIDIA_DEFAULT_INFERENCE_BASE_URL,
  NVIDIA_PROVIDER_ID,
  NVIDIA_PROVIDER_LABEL,
} from "./src/defaults.js";
export {
  buildNvidiaSeedModels,
  mapNvidiaWireModelToConfig,
  mapNvidiaWireModelsToConfig,
  normalizeNvidiaConfiguredCatalogEntries,
  resolveNvidiaInferenceBase,
  resolveNvidiaModelCatalog,
  selectDefaultNvidiaModelId,
  type NvidiaModelWire,
} from "./src/models.js";
export {
  discoverNvidiaModels,
  fetchNvidiaModels,
  type FetchNvidiaModelsResult,
} from "./src/models.fetch.js";
export {
  buildNvidiaAuthHeaders,
  resolveNvidiaConfiguredApiKey,
  resolveNvidiaRequestContext,
  resolveNvidiaRuntimeApiKey,
} from "./src/runtime.js";
export {
  configureNvidiaNonInteractive,
  discoverNvidiaProvider,
  prepareNvidiaDynamicModels,
  promptAndConfigureNvidiaInteractive,
} from "./src/setup.js";
