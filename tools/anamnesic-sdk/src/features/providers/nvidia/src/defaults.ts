export const NVIDIA_PROVIDER_ID = "nvidia";
export const NVIDIA_PROVIDER_LABEL = "NVIDIA";
export const NVIDIA_DEFAULT_API_KEY_ENV_VAR = "NVIDIA_API_KEY";
export const NVIDIA_DEFAULT_BASE_URL = "https://integrate.api.nvidia.com";
export const NVIDIA_DEFAULT_INFERENCE_BASE_URL = `${NVIDIA_DEFAULT_BASE_URL}/v1`;
export const NVIDIA_DEFAULT_MODEL_ID = "nvidia/nemotron-3-super-120b-a12b";
export const NVIDIA_DISCOVERY_PREFERRED_MODEL_IDS = [
  "meta/llama-3.3-70b-instruct",
  NVIDIA_DEFAULT_MODEL_ID,
] as const;