/**
 * Fetches the list of Ollama model names from the /api/tags endpoint.
 * Returns an array of model names (strings). Used for merging basic model info
 * into the ranking output.
 */
export async function fetchOllamaModels(ollamaBase = 'http://localhost:11434') {
  try {
    const tagsRes = await fetch(`${ollamaBase}/api/tags`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!tagsRes.ok) {
      console.warn(`[ollama] /api/tags responded with HTTP ${tagsRes.status}`);
      return [];
    }
    const tagsJson = await tagsRes.json();
    const models = (tagsJson.models || []).map((m) => m.name).filter(Boolean);
    console.log(`[ollama] Fetched ${models.length} model names`);
    return models;
  } catch (err) {
    console.warn(`[ollama] Failed to fetch model names: ${err?.message || err}`);
    return [];
  }
}
