#!/usr/bin/env node
/**
 * Syncs NVIDIA model metadata from models.dev API and caches it locally.
 * This prepopulates the cache used by generate-nvidia-ranking.mjs for model enrichment.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchNvidiaModels } from './models-dev-api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const CACHE_FILE = path.join(DATA_DIR, 'models-dev-cache.json');

async function main() {
  console.log('[models.dev] Fetching NVIDIA models from https://models.dev/api.json...');
  
  try {
    const models = await fetchNvidiaModels();
    
    const cacheData = {
      models,
      timestamp: Date.now(),
      synced_at: new Date().toISOString(),
      source: 'https://models.dev/api.json',
      provider: 'nvidia',
      count: models.length
    };
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
    console.log(`[models.dev] ✅ Saved ${models.length} NVIDIA models to ${CACHE_FILE}`);
    
    // Print summary
    const toolCallModels = models.filter(m => m.tool_call).length;
    const reasoningModels = models.filter(m => m.reasoning).length;
    const visionModels = models.filter(m => m.attachment).length;
    
    console.log('\nSummary:');
    console.log(`  Total models: ${models.length}`);
    console.log(`  Tool calling: ${toolCallModels}`);
    console.log(`  Reasoning: ${reasoningModels}`);
    console.log(`  Vision: ${visionModels}`);
    
    // Print sample models
    console.log('\nSample models:');
    models.slice(0, 5).forEach(m => {
      console.log(`  - ${m.id} (${m.name})`);
      console.log(`    Context: ${m.context}, Tool: ${m.tool_call}, Reasoning: ${m.reasoning}`);
    });
    
  } catch (err) {
    console.error(`[models.dev] ❌ Failed to sync: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
