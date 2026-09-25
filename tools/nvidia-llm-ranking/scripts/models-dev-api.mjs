/**
 * Fetches model metadata from models.dev API (https://models.dev/api.json)
 * Replaces Ollama integration with a comprehensive model catalog.
 */

const MODELS_DEV_API = 'https://models.dev/api.json';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedData = null;
let cacheTimestamp = 0;

/**
 * Fetches the full models.dev catalog with caching
 * @returns {Promise<Object>} Full API response
 */
export async function fetchModelsDevCatalog() {
  const now = Date.now();
  if (cachedData && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log('[models.dev] Using cached catalog');
    return cachedData;
  }

  try {
    console.log('[models.dev] Fetching catalog...');
    const res = await fetch(MODELS_DEV_API, {
      signal: AbortSignal.timeout(15_000),
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    cachedData = data;
    cacheTimestamp = now;
    
    const providerCount = Object.keys(data).length;
    console.log(`[models.dev] Fetched ${providerCount} providers`);
    return data;
  } catch (err) {
    console.error(`[models.dev] Failed to fetch catalog: ${err.message}`);
    if (cachedData) {
      console.warn('[models.dev] Using stale cache due to fetch error');
      return cachedData;
    }
    throw err;
  }
}

/**
 * Gets NVIDIA-specific models from models.dev
 * @returns {Promise<Array<Object>>} Array of NVIDIA model metadata
 */
export async function fetchNvidiaModels() {
  const catalog = await fetchModelsDevCatalog();
  const nvidia = catalog.nvidia;
  
  if (!nvidia) {
    throw new Error('NVIDIA provider not found in models.dev catalog');
  }
  
  const models = nvidia.models || {};
  const modelList = Object.values(models).map(model => ({
    id: model.id,
    name: model.name,
    family: model.family,
    tool_call: model.tool_call === true,
    reasoning: model.reasoning === true,
    attachment: model.attachment === true,
    temperature: model.temperature === true,
    context: model.limit?.context || 0,
    output: model.limit?.output || 0,
    knowledge: model.knowledge,
    release_date: model.release_date,
    last_updated: model.last_updated,
    modalities: model.modalities,
    cost: model.cost,
    open_weights: model.open_weights,
  }));
  
  console.log(`[models.dev] Loaded ${modelList.length} NVIDIA models`);
  return modelList;
}

/**
 * Gets all providers from models.dev
 * @returns {Promise<Array<Object>>} Array of provider metadata
 */
export async function fetchAllProviders() {
  const catalog = await fetchModelsDevCatalog();
  const providers = Object.entries(catalog).map(([id, data]) => ({
    id,
    name: data.name,
    api: data.api,
    doc: data.doc,
    env: data.env,
    modelCount: Object.keys(data.models || {}).length,
  }));
  
  console.log(`[models.dev] Loaded ${providers.length} providers`);
  return providers;
}

/**
 * Gets models by provider ID
 * @param {string} providerId - Provider ID (e.g., 'nvidia', 'openai', 'anthropic')
 * @returns {Promise<Array<Object>>} Array of model metadata
 */
export async function fetchModelsByProvider(providerId) {
  const catalog = await fetchModelsDevCatalog();
  const provider = catalog[providerId];
  
  if (!provider) {
    throw new Error(`Provider '${providerId}' not found in models.dev catalog`);
  }
  
  const models = provider.models || {};
  const modelList = Object.values(models);
  
  console.log(`[models.dev] Loaded ${modelList.length} models for ${providerId}`);
  return modelList;
}

/**
 * Resolves context size for a model from models.dev metadata
 * @param {string} modelId - Full model ID (e.g., 'nvidia/llama-3.1-8b-instruct')
 * @returns {Promise<number>} Context size in tokens (0 if not found)
 */
export async function resolveContextSize(modelId) {
  try {
    const catalog = await fetchModelsDevCatalog();
    
    // Try to find model in any provider
    for (const provider of Object.values(catalog)) {
      const models = provider.models || {};
      if (models[modelId]) {
        const context = models[modelId].limit?.context || 0;
        if (context > 0) {
          console.log(`[models.dev] Context for ${modelId}: ${context}`);
          return context;
        }
      }
    }
    
    console.warn(`[models.dev] No context info for ${modelId}`);
    return 0;
  } catch (err) {
    console.warn(`[models.dev] Failed to resolve context for ${modelId}: ${err.message}`);
    return 0;
  }
}

/**
 * Checks if a model supports tool calling
 * @param {string} modelId - Full model ID
 * @returns {Promise<boolean>} True if model supports tools
 */
export async function supportsToolCalling(modelId) {
  try {
    const catalog = await fetchModelsDevCatalog();
    
    for (const provider of Object.values(catalog)) {
      const models = provider.models || {};
      if (models[modelId]) {
        return models[modelId].tool_call === true;
      }
    }
    
    return false;
  } catch (err) {
    console.warn(`[models.dev] Failed to check tool support for ${modelId}: ${err.message}`);
    return false;
  }
}
