/**
 * context-sizes.mjs
 *
 * Unified context window size resolver.
 * Priority: NIM /v1/models API → Ollama /api/show → known dictionary → pattern fallback
 *
 * All sizes in tokens (integers).
 */

// ── Known context sizes dictionary ────────────────────────────────────────────
// Source: official model cards / HuggingFace / provider docs (best-effort)
export const KNOWN_CONTEXT_SIZES = {
  // Meta Llama 3.x
  'meta/llama-3.1-8b-instruct':           131072,
  'meta/llama-3.1-70b-instruct':          131072,
  'meta/llama-3.1-405b-instruct':         131072,
  'meta/llama-3.2-1b-instruct':           131072,
  'meta/llama-3.2-3b-instruct':           131072,
  'meta/llama-3.2-11b-vision-instruct':   131072,
  'meta/llama-3.2-90b-vision-instruct':   131072,
  'meta/llama-3.3-70b-instruct':          131072,
  'meta/llama-4-scout-17b-16e-instruct':  10000000,
  'meta/llama-4-maverick-17b-128e-instruct': 1048576,

  // Mistral / Mixtral
  'mistralai/mistral-7b-instruct-v0.3':   32768,
  'mistralai/mixtral-8x7b-instruct-v0.1': 32768,
  'mistralai/mixtral-8x22b-instruct-v0.1':65536,
  'mistralai/mistral-large-2-instruct':   131072,
  'mistralai/mistral-large-3-675b-instruct-2512': 131072,
  'mistralai/ministral-14b-instruct-2512': 131072,
  'mistralai/mistral-small-4-119b-2603':  131072,
  'mistralai/mistral-nemo-12b-instruct':  131072,

  // Qwen
  'qwen/qwen2-7b-instruct':               131072,
  'qwen/qwen2.5-7b-instruct':             131072,
  'qwen/qwen2.5-72b-instruct':            131072,
  'qwen/qwen2.5-coder-7b-instruct':       131072,
  'qwen/qwen2.5-coder-32b-instruct':      131072,
  'qwen/qwen3-235b-a22b':                 131072,
  'qwen/qwen3.5-397b-a17b':              131072,
  'qwen/qwq-32b':                         131072,

  // DeepSeek
  'deepseek-ai/deepseek-r1':              131072,
  'deepseek-ai/deepseek-v3':              131072,
  'deepseek-ai/deepseek-v3-0324':         131072,
  'deepseek-ai/deepseek-r1-0528':         131072,
  'deepseek-ai/deepseek-v4-flash':        1048576,

  // NVIDIA / Nemotron
  'nvidia/llama-3.1-nemotron-70b-instruct': 131072,
  'nvidia/llama-3.1-nemotron-nano-8b-v1':   131072,
  'nvidia/nemotron-3-nano-30b-a3b':          131072,
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning': 131072,
  'nvidia/nemotron-3-super-120b-a12b':       131072,
  'nvidia/nvidia-nemotron-nano-9b-v2':       131072,
  'nvidia/ising-calibration-1-35b-a3b':      131072,

  // OpenAI (via NIM)
  'openai/gpt-4o':                        131072,
  'openai/gpt-4o-mini':                   131072,
  'openai/gpt-oss-120b':                  131072,
  'openai/gpt-oss-20b':                   131072,

  // Google
  'google/gemma-2-9b-it':                  8192,
  'google/gemma-2-27b-it':                 8192,
  'google/gemma-3-27b-it':               131072,

  // Microsoft
  'microsoft/phi-3-mini-4k-instruct':      4096,
  'microsoft/phi-3-mini-128k-instruct':  131072,
  'microsoft/phi-3.5-mini-instruct':     131072,
  'microsoft/phi-4':                     131072,
  'microsoft/phi-4-reasoning':           131072,

  // Z-AI
  'z-ai/glm-5.1':                        131072,
};

/**
 * Try to extract context_length from NIM /v1/models response.
 * Returns Map<canonicalId, contextLength>.
 */
export async function fetchNimContextSizes(apiKey, baseUrl = 'https://integrate.api.nvidia.com/v1') {
  if (!apiKey) return new Map();
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[ctx] NIM /v1/models HTTP ${res.status} — skipping context fetch`);
      return new Map();
    }
    const json = await res.json();
    const map = new Map();
    for (const m of (json.data || [])) {
      const ctx = m.context_length ?? m.max_model_len ?? null;
      if (ctx && typeof ctx === 'number' && ctx > 0) {
        map.set(m.id, ctx);
      }
    }
    console.log(`[ctx] NIM returned context_length for ${map.size}/${(json.data || []).length} models`);
    return map;
  } catch (err) {
    console.warn(`[ctx] NIM context fetch failed: ${err?.message || err}`);
    return new Map();
  }
}

/**
 * Try to extract context_length from Ollama /api/show for each model.
 * Returns Map<modelName, contextLength>.
 *
 * Reads model_info keys like "llama.context_length", "mamba.context_length", etc.
 */
export async function fetchOllamaContextSizes(ollamaBase = 'http://localhost:11434') {
  const map = new Map();
  try {
    // 1. List models
    const tagsRes = await fetch(`${ollamaBase}/api/tags`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!tagsRes.ok) {
      console.warn(`[ctx] Ollama /api/tags HTTP ${tagsRes.status}`);
      return map;
    }
    const tagsJson = await tagsRes.json();
    const models = (tagsJson.models || []).map((m) => m.name).filter(Boolean);
    console.log(`[ctx] Ollama has ${models.length} models — fetching context sizes...`);

    // 2. For each model, call /api/show
    await Promise.all(
      models.map(async (name) => {
        try {
          const showRes = await fetch(`${ollamaBase}/api/show`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: name }),
            signal: AbortSignal.timeout(10_000),
          });
          if (!showRes.ok) return;
          const showJson = await showRes.json();
          const info = showJson.model_info || {};
          // Try all architecture variants: llama, mamba, gemma, qwen, mistral, phi, etc.
          const ctx = Object.entries(info)
            .filter(([k]) => k.endsWith('.context_length'))
            .map(([, v]) => v)
            .find((v) => typeof v === 'number' && v > 0);
          if (ctx) map.set(name, ctx);
        } catch {
          // individual model failure is silent
        }
      })
    );
    console.log(`[ctx] Ollama resolved context_length for ${map.size}/${models.length} models`);
    return map;
  } catch (err) {
    console.warn(`[ctx] Ollama context fetch failed: ${err?.message || err} (is Ollama running?)`);
    return map;
  }
}

/**
 * Resolve context size for a model ID.
 * Priority: nimMap → ollamaMap → KNOWN_CONTEXT_SIZES → pattern fallback.
 * Returns size in tokens (number).
 */
export function resolveContextSize(modelId, nimMap = new Map(), ollamaMap = new Map()) {
  if (!modelId) return 128000;

  // API-sourced (most accurate)
  if (nimMap.has(modelId)) return nimMap.get(modelId);
  if (ollamaMap.has(modelId)) return ollamaMap.get(modelId);

  // Exact match in known dict
  const lc = modelId.toLowerCase();
  const exact = KNOWN_CONTEXT_SIZES[lc] ?? KNOWN_CONTEXT_SIZES[modelId];
  if (exact) return exact;

  // Pattern fallback
  if (lc.includes('llama-4'))                         return 10000000;
  if (lc.includes('gemini-2') || lc.includes('gemini-1.5-pro')) return 1000000;
  if (lc.includes('gemini-1.5-flash'))                return 1000000;
  if (lc.includes('deepseek-v4') || lc.includes('deepseek_v4')) return 1000000;
  if (lc.includes('claude'))                          return 200000;
  if (
    lc.includes('llama-3') || lc.includes('llama3') ||
    lc.includes('gpt-4o') || lc.includes('gpt-4-turbo') ||
    lc.includes('mistral-large') || lc.includes('mistral-nemo') ||
    lc.includes('mixtral-8x22') || lc.includes('deepseek') ||
    lc.includes('qwen') || lc.includes('nemotron') ||
    lc.includes('phi-4') || lc.includes('phi-3.5') || lc.includes('phi-3-mini-128') ||
    lc.includes('glm-') || lc.includes('gemma-3')
  ) return 131072;
  if (lc.includes('mixtral') || lc.includes('mistral-7') || lc.includes('mistral-small')) return 32768;
  if (lc.includes('gemma-2'))                         return 8192;
  if (lc.includes('gpt-3.5'))                         return 16384;
  if (lc.includes('phi-3-mini-4k'))                   return 4096;

  return 128000; // conservative default
}

/**
 * Format context size for display: 1000000 → "1M", 131072 → "128K", etc.
 */
export function formatContextSize(tokens) {
  if (!tokens || tokens <= 0) return '?';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1_000)     return `${Math.round(tokens / 1024)}K`;
  return String(tokens);
}
