import type { ModelProviderConfig } from "code/plugin-sdk/provider-model-shared";
import {
  NVIDIA_DEFAULT_API_KEY_ENV_VAR,
  NVIDIA_DEFAULT_INFERENCE_BASE_URL,
  NVIDIA_DEFAULT_MODEL_ID,
} from "./src/defaults.js";
import { buildNvidiaSeedModels, normalizeNvidiaConfiguredCatalogEntries } from "./src/models.js";

export { NVIDIA_DEFAULT_MODEL_ID } from "./src/defaults.js";

export function buildNvidiaProvider(): ModelProviderConfig {
  return {
    api: "openai-completions",
    baseUrl: NVIDIA_DEFAULT_INFERENCE_BASE_URL,
    apiKey: NVIDIA_DEFAULT_API_KEY_ENV_VAR,
    auth: "api-key",
    models: normalizeNvidiaConfiguredCatalogEntries(buildNvidiaSeedModels()),
  };
}
