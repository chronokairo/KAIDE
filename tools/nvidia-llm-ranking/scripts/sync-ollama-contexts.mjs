#!/usr/bin/env node
/**
 * sync-ollama-contexts.mjs
 *
 * Queries local Ollama for real context_length values and:
 *   1. Writes/updates  data/ollama-context-cache.json  (runtime cache)
 *   2. Patches KNOWN_CONTEXT_SIZES in scripts/context-sizes.mjs  (persists to source)
 *
 * Usage:
 *   node scripts/sync-ollama-contexts.mjs
 *   OLLAMA_BASE_URL=http://my-host:11434 node scripts/sync-ollama-contexts.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const CACHE_FILE = path.join(ROOT, 'data', 'ollama-context-cache.json');
const SIZES_FILE = path.join(__dirname, 'context-sizes.mjs');

const BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// ── Step 1: list all Ollama models ────────────────────────────────────────────

async function listModels() {
  const res = await fetch(`${BASE}/api/tags`, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`Ollama /api/tags HTTP ${res.status}`);
  const json = await res.json();
  return (json.models || []).map((m) => m.name).filter(Boolean);
}

// ── Step 2: fetch context_length for a model ─────────────────────────────────

async function showModel(name) {
  try {
    const res = await fetch(`${BASE}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: name }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const info = json.model_info || {};
    // Architecture keys: llama.context_length, gemma.context_length, qwen2.context_length, etc.
    const ctx = Object.entries(info)
      .filter(([k]) => k.endsWith('.context_length'))
      .map(([, v]) => v)
      .find((v) => typeof v === 'number' && v > 0);
    return ctx ?? null;
  } catch {
    return null;
  }
}

// ── Step 3: patch KNOWN_CONTEXT_SIZES in context-sizes.mjs ───────────────────

function patchSourceDict(newEntries) {
  if (!Object.keys(newEntries).length) return;

  let src = fs.readFileSync(SIZES_FILE, 'utf8');

  // Find the closing brace of KNOWN_CONTEXT_SIZES
  const dictStart = src.indexOf('export const KNOWN_CONTEXT_SIZES = {');
  if (dictStart === -1) {
    console.warn('Could not find KNOWN_CONTEXT_SIZES in context-sizes.mjs — skipping source patch');
    return;
  }

  // Find section marker or inject before closing brace
  const OLLAMA_MARKER = '  // ── Ollama real values (auto-synced) ──';
  
  // Remove existing Ollama section if present
  const ollamaStart = src.indexOf(OLLAMA_MARKER);
  const dictEnd = src.indexOf('\n};\n', dictStart);
  
  let ollamaBlock = `\n${OLLAMA_MARKER}\n`;
  for (const [id, ctx] of Object.entries(newEntries).sort(([a], [b]) => a.localeCompare(b))) {
    // Pad for alignment
    const pad = Math.max(2, 44 - id.length);
    ollamaBlock += `  '${id}':${' '.repeat(pad)}${ctx},\n`;
  }

  if (ollamaStart !== -1 && ollamaStart < dictEnd) {
    // Replace existing Ollama section
    const ollamaEnd = dictEnd;
    src = src.slice(0, ollamaStart) + ollamaBlock + src.slice(ollamaEnd);
  } else {
    // Insert before closing brace
    src = src.slice(0, dictEnd) + ollamaBlock + src.slice(dictEnd);
  }

  fs.writeFileSync(SIZES_FILE, src, 'utf8');
  console.log(`[sync] Patched KNOWN_CONTEXT_SIZES with ${Object.keys(newEntries).length} Ollama entries`);
}

// ── Step 4: load/merge existing cache ────────────────────────────────────────

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(data) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[sync] Connecting to Ollama at ${BASE}...`);

  let models;
  try {
    models = await listModels();
  } catch (err) {
    console.error(`[sync] Ollama unavailable: ${err.message}`);
    console.error('[sync] Start Ollama and re-run to populate real context sizes.');
    process.exit(0);
  }

  if (!models.length) {
    console.log('[sync] No models found in Ollama. Pull some models first:');
    console.log('  ollama pull llama3.1:8b');
    console.log('  ollama pull qwen2.5:7b');
    console.log('  ollama pull mistral:7b');
    process.exit(0);
  }

  console.log(`[sync] Found ${models.length} model(s): ${models.join(', ')}`);

  const cache = loadCache();
  const newEntries = {};
  let updated = 0;

  for (const name of models) {
    process.stdout.write(`[sync] ${name} ... `);
    const ctx = await showModel(name);
    if (ctx) {
      const prev = cache[name];
      cache[name] = ctx;
      newEntries[name] = ctx;
      updated++;
      console.log(`${ctx.toLocaleString()} tokens${prev && prev !== ctx ? ` (was ${prev.toLocaleString()})` : ''}`);
    } else {
      console.log('context_length not found');
    }
  }

  if (!updated) {
    console.log('[sync] No context sizes resolved. Nothing to update.');
    process.exit(0);
  }

  // Save runtime cache
  saveCache(cache);
  console.log(`[sync] Cache saved → ${CACHE_FILE}`);

  // Patch source dictionary
  patchSourceDict(newEntries);

  console.log(`\n[sync] Done! ${updated}/${models.length} models updated.`);
  console.log('[sync] Re-run the ranking to apply: node scripts/generate-nvidia-ranking.mjs');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
