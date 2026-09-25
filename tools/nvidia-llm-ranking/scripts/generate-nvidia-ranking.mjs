#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchNimContextSizes, resolveContextSize } from './context-sizes.mjs';
import { fetchNvidiaModels, resolveContextSize as resolveModelsDevContext } from './models-dev-api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_FILE = path.join(DATA_DIR, 'nvidia-ranking.latest.json');
const TOGGLE_FILE = path.join(DATA_DIR, 'nvidia-tool-toggle.json');
const MODELS_DEV_CACHE_FILE = path.join(DATA_DIR, 'models-dev-cache.json');

/** Load models.dev metadata cache from disk */
function loadModelsDevCache() {
  try {
    const raw = JSON.parse(fs.readFileSync(MODELS_DEV_CACHE_FILE, 'utf8'));
    if (raw.models && Array.isArray(raw.models)) {
      console.log(`[models.dev] Loaded ${raw.models.length} models from cache`);
      return raw;
    }
    return { models: [], timestamp: 0 };
  } catch {
    return { models: [], timestamp: 0 };
  }
}

/** Save models.dev metadata cache to disk */
function saveModelsDevCache(data) {
  try {
    fs.writeFileSync(MODELS_DEV_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[models.dev] Saved ${data.models.length} models to cache`);
  } catch (err) {
    console.warn(`[models.dev] Failed to save cache: ${err.message}`);
  }
}

function loadDotEnv() {
  const envFile = path.join(ROOT, '.env');
  if (!fs.existsSync(envFile)) return;
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const API_KEY = process.env.NVIDIA_API_KEY;
const BASE = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const ROUNDS = Number(process.env.RANK_PROBE_ROUNDS || '3');
const TIMEOUT_MS = Number(process.env.RANK_PROBE_TIMEOUT_MS || '12000');
const MAX_TOKENS = Number(process.env.RANK_PROBE_MAX_TOKENS || '24');

if (!API_KEY) {
  console.error('Missing NVIDIA_API_KEY');
  process.exit(1);
}

const TOOL_TEST_USER_PROMPT = 'Liste os arquivos do diretório atual';

// ─── Vision detection ─────────────────────────────────────────────────────────
// Tiny 1×1 transparent PNG encoded as base64 — minimal payload for vision probe
const VISION_TEST_IMAGE_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function runVisionCheck(model) {
  console.log(`[vision] Checking vision for ${model}...`);
  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${VISION_TEST_IMAGE_B64}` },
          },
          { type: 'text', text: 'What color is the dominant pixel in this image? Reply with one word.' },
        ],
      },
    ],
    max_tokens: 16,
    stream: false,
    temperature: 0,
  };
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ms = Date.now() - t0;
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const reason = `HTTP ${res.status}: ${text.slice(0, 160)}`;
      console.log(`[vision] ${model} not supported: ${reason}`);
      return { supported: false, ms, reason };
    }
    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content ?? '';
    console.log(`[vision] ${model} supported (${ms}ms) — reply: ${String(reply).slice(0, 60)}`);
    return { supported: true, ms, reason: null };
  } catch (e) {
    const reason = String(e?.message || e);
    console.log(`[vision] ${model} error: ${reason}`);
    return { supported: false, ms: Date.now() - t0, reason };
  }
}

// ─── Effort / thinking detection ─────────────────────────────────────────────
function getNvidiaEffortMechanism(modelId) {
  const m = modelId.toLowerCase();
  if (/mistral-small-4/i.test(m)) return null;           // known 400
  if (/nemotron-3/i.test(m)) return 'chat_template';      // chat_template_kwargs
  if (/nemotron.*(super|ultra)/i.test(m)) return 'system_prompt'; // system prefix
  return 'reasoning_effort';                               // default for all other NVIDIA
}

function applyEffortToBody(body, modelId, effort) {
  const mech = getNvidiaEffortMechanism(modelId);
  if (!mech) return mech;
  const thinking = effort !== 'low';
  if (mech === 'reasoning_effort') {
    body.reasoning_effort = effort;
  } else if (mech === 'chat_template') {
    body.chat_template_kwargs = { thinking };
  } else if (mech === 'system_prompt') {
    const directive = thinking ? 'detailed thinking on' : 'detailed thinking off';
    body.messages = [{ role: 'system', content: directive }, ...body.messages];
  }
  return mech;
}

async function runEffortCheck(model) {
  const mechanism = getNvidiaEffortMechanism(model);
  if (!mechanism) {
    return { supported: false, mechanism: null, results: {} };
  }
  console.log(`[effort] Checking effort for ${model} (${mechanism})...`);
  const EFFORT_LEVELS = ['low', 'medium', 'high'];
  const results = {};
  for (const effort of EFFORT_LEVELS) {
    const body = {
      model,
      messages: [{ role: 'user', content: 'Say ok.' }],
      max_tokens: 20,
      stream: false,
      temperature: 0,
    };
    applyEffortToBody(body, model, effort);
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const ms = Date.now() - t0;
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        results[effort] = { ok: false, ms, error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
      } else {
        results[effort] = { ok: true, ms };
      }
    } catch (e) {
      results[effort] = { ok: false, ms: Date.now() - t0, error: String(e?.message || e) };
    }
    // brief pause to avoid rate-limit
    await new Promise(r => setTimeout(r, 250));
  }
  const passed = Object.values(results).filter(r => r.ok).length;
  const total = EFFORT_LEVELS.length;
  const allPassed = passed === total;
  console.log(`[effort] ${model}: ${passed}/${total} effort levels ok`);
  return { supported: passed > 0, mechanism, results, passed, total, allPassed };
}
const TOOL_TEST_FAKE_OUTPUT = 'main.py\nrequirements.txt\nREADME.md';
const TOOL_TEST_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Executa um comando bash e retorna o output',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Comando bash a executar' }
        },
        required: ['command']
      }
    }
  }
];

function canonicalizeNvidiaModelId(id) {
  return String(id || '').trim();
}

function readDisabledModelsSet() {
  try {
    const raw = fs.readFileSync(TOGGLE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed?.disabledModels) ? parsed.disabledModels : [];
    return new Set(arr.map(canonicalizeNvidiaModelId).filter(Boolean));
  } catch {
    return new Set();
  }
}

function saveDisabledModels(set) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(TOGGLE_FILE, JSON.stringify({ disabledModels: Array.from(set).sort() }, null, 2));
  } catch (err) {
    console.warn(`[toggle] Failed to save toggle file: ${err?.message || err}`);
  }
}

function normalize(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function detectCompany(modelId) {
  const id = String(modelId || '').trim();
  const [head] = id.split('/');
  if (head) return head.toLowerCase();
  const n = normalize(id);
  const [fallback] = n.split('-');
  return fallback || 'unknown';
}

function latencyStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = p => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
  return {
    p50: sorted.length ? Math.round(at(0.5)) : null,
    p95: sorted.length ? Math.round(at(0.95)) : null,
    min: sorted.length ? Math.round(sorted[0]) : null,
    max: sorted.length ? Math.round(sorted[sorted.length - 1]) : null
  };
}

function extractToolArguments(toolCall) {
  const argsRaw = toolCall?.function?.arguments;
  if (typeof argsRaw !== 'string') return null;
  try {
    return JSON.parse(argsRaw);
  } catch {
    return null;
  }
}

async function postChatCompletions(payload) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: ctrl.signal,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function runToolCallingCheck(model) {
  console.log(`[tool-test] Checking function calling for ${model}...`);
  try {
    const turn1 = await postChatCompletions({
      model,
      messages: [{ role: 'user', content: TOOL_TEST_USER_PROMPT }],
      tools: TOOL_TEST_TOOLS,
      tool_choice: 'auto',
      stream: false,
      temperature: 0,
      max_tokens: 256
    });

    const choice1 = turn1?.choices?.[0];
    const msg1 = choice1?.message;
    if (!choice1 || !msg1) {
      return { passed: false, reason: 'Tool test invalid turn1 response shape' };
    }
    if (choice1.finish_reason !== 'tool_calls') {
      return {
        passed: false,
        reason: `Tool test failed: finish_reason=${String(choice1.finish_reason)} (expected tool_calls)`
      };
    }

    const toolCall = msg1?.tool_calls?.[0];
    if (!toolCall) {
      return { passed: false, reason: 'Tool test failed: missing tool_calls[0]' };
    }
    if (toolCall?.function?.name !== 'bash') {
      return { passed: false, reason: `Tool test failed: wrong tool name (${String(toolCall?.function?.name)})` };
    }

    const parsedArgs = extractToolArguments(toolCall);
    if (!parsedArgs || typeof parsedArgs.command !== 'string' || !parsedArgs.command.trim()) {
      return { passed: false, reason: 'Tool test failed: invalid function arguments JSON' };
    }

    const turn2 = await postChatCompletions({
      model,
      messages: [
        { role: 'user', content: TOOL_TEST_USER_PROMPT },
        {
          role: 'assistant',
          content: msg1?.content ?? null,
          tool_calls: msg1?.tool_calls ?? []
        },
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: TOOL_TEST_FAKE_OUTPUT
        }
      ],
      tools: TOOL_TEST_TOOLS,
      stream: false,
      temperature: 0,
      max_tokens: 256
    });

    const finalText = String(turn2?.choices?.[0]?.message?.content ?? '');
    const expectedTokens = TOOL_TEST_FAKE_OUTPUT.split('\n').map((s) => s.trim()).filter(Boolean);
    const usedToolResult = expectedTokens.some((token) => finalText.includes(token));
    if (!usedToolResult) {
      return {
        passed: false,
        reason: 'Tool test failed: model ignored tool result (possible hallucination on turn 2)'
      };
    }

    console.log(`[tool-test] ${model} passed`);
    return { passed: true, reason: null };
  } catch (err) {
    return {
      passed: false,
      reason: `Tool test request error: ${String(err?.message || err)}`
    };
  }
}

async function fetchModels() {
  // Primary: NVIDIA NIM /v1/models API
  const apiModels = await fetchModelsFromNvidiaApi();
  if (apiModels.length > 0) {
    console.log(`[bench] Discovered ${apiModels.length} models from NVIDIA API (/v1/models)`);
    return apiModels;
  }

  // Secondary: re-use existing ranking file (no HTTP fallback)
  if (fs.existsSync(OUT_FILE)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
      const prevModels = (prev.models || []).map((m) => m.id).filter(Boolean);
      if (prevModels.length > 0) {
        console.log(`[bench] NVIDIA API unavailable. Re-using ${prevModels.length} models from existing ranking file.`);
        return prevModels;
      }
    } catch {
      // fall through
    }
  }

  throw new Error('No models discovered. Check NVIDIA_API_KEY and network access to integrate.api.nvidia.com.');
}

// Module-level context size maps populated during model discovery
const nimContextMap = new Map();
const modelsDevContextMap = new Map(); // Will be populated in main() from models.dev

/**
 * Resolves context size for a model by checking multiple sources:
 * 1. NIM API metadata
 * 2. models.dev metadata
 * 3. Fallback to 0
 */
function resolveModelContextSize(modelId) {
  if (nimContextMap.has(modelId)) {
    return nimContextMap.get(modelId);
  }
  if (modelsDevContextMap.has(modelId)) {
    return modelsDevContextMap.get(modelId);
  }
  return 0;
}

async function fetchModelsFromNvidiaApi() {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) return [];
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[bench] NVIDIA /v1/models returned HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    // Capture context_length per model while we have the full response
    for (const m of (json.data || [])) {
      const ctx = m.context_length ?? m.max_model_len ?? null;
      if (ctx && typeof ctx === 'number' && ctx > 0) {
        nimContextMap.set(m.id, ctx);
        // also store under canonical ID
        const canonical = canonicalizeNvidiaModelId(m.id);
        if (canonical) nimContextMap.set(canonical, ctx);
      }
    }
    const ids = (json.data || [])
      .map((m) => canonicalizeNvidiaModelId(m.id))
      .filter((id) => id && id.includes('/'));
    return Array.from(new Set(ids)); // deduplicate — API sometimes returns same model twice
  } catch (err) {
    console.warn(`[bench] NVIDIA /v1/models fetch failed: ${err?.message || err}`);
    return [];
  }
}

async function probeModel(model) {
  console.log(`[bench] Probing model: ${model}`);
  let ok = 0;
  const lat = [];
  const errors = [];
  let attempts = 0;
  let skippedForFirst404 = false;

  for (let i = 0; i < ROUNDS; i++) {
    const round = i + 1;
    attempts += 1;
    console.log(`[bench] ${model} round ${round}/${ROUNDS}...`);
    const started = Date.now();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          model,
          stream: false,
          max_tokens: MAX_TOKENS,
          temperature: 0,
          messages: [{ role: 'user', content: 'Ping. Respond with one short sentence.' }]
        })
      });
      if (!res.ok) {
        const msg = `HTTP ${res.status}`;
        errors.push(msg);
        console.log(`[bench] ${model} round ${round} failed: ${msg}`);
        if (round === 1 && res.status === 404) {
          skippedForFirst404 = true;
          console.log(`[bench] ${model} marked as possible removal (404 on first round). Skipping remaining rounds.`);
          break;
        }
      } else {
        const elapsed = Date.now() - started;
        ok += 1;
        lat.push(elapsed);
        console.log(`[bench] ${model} round ${round} ok in ${elapsed}ms`);
      }
    } catch (e) {
      const msg = String(e?.message || e);
      errors.push(msg);
      console.log(`[bench] ${model} round ${round} failed: ${msg}`);
    } finally {
      clearTimeout(t);
    }
  }

  return {
    attempts,
    successes: ok,
    availability: attempts > 0 ? ok / attempts : 0,
    latencyMs: latencyStats(lat),
    errors: errors.slice(0, 5),
    skippedForFirst404
  };
}

function scoreModel({ availability, p50, toolPassed }) {
  const availabilityScore = Math.round(availability * 120);
  const latencyScore = p50 == null ? 0 : Math.max(0, 120 - Math.round(p50 / 100));
  const toolScore = toolPassed ? 40 : -140;
  return availabilityScore + latencyScore + toolScore;
}

function isRecommendationEligible(row) {
  return (
    !row.removed &&
    !row.quarantined &&
    row.toolCheck?.passed === true &&
    row.availability > 0
  );
}

function assignDynamicTiers(rows) {
  const eligible = rows.filter(
    row => !row.removed && !row.quarantined && row.toolCheck.passed && row.availability > 0
  );
  const totalEligible = eligible.length;
  const tierById = new Map();
  eligible.forEach((row, idx) => {
    const pos = totalEligible <= 1 ? 0 : idx / (totalEligible - 1);
    let tier = 'C';
    if (pos <= 0.15) tier = 'S';
    else if (pos <= 0.45) tier = 'A';
    else if (pos <= 0.8) tier = 'B';
    tierById.set(row.id, tier);
  });

  for (const row of rows) {
    if (tierById.has(row.id)) {
      row.tier = tierById.get(row.id);
      continue;
    }
    if (row.disabledByToggle) row.tier = 'DISABLED';
    else if (row.removed) row.tier = 'REMOVED';
    else if (row.quarantined) row.tier = 'QUARANTINED';
    else if (!row.toolCheck.passed) row.tier = 'FAIL_TOOL';
    else if (row.availability <= 0) row.tier = 'UNAVAILABLE';
    else row.tier = 'C';
  }
}

async function main() {
  const models = await fetchModels();
  if (!models.length) throw new Error('No models discovered from "nim list all".');
  const disabledModels = readDisabledModelsSet();

  // Fetch models.dev metadata for enrichment
  const modelsDevData = loadModelsDevCache();
  let modelsDevModels = modelsDevData.models;
  
  // Try to refresh from API if cache is stale (> 1 hour)
  const cacheAge = Date.now() - (modelsDevData.timestamp || 0);
  if (cacheAge > 60 * 60 * 1000 || modelsDevModels.length === 0) {
    try {
      console.log('[models.dev] Fetching fresh NVIDIA models...');
      modelsDevModels = await fetchNvidiaModels();
      saveModelsDevCache({ models: modelsDevModels, timestamp: Date.now() });
    } catch (err) {
      console.warn(`[models.dev] Failed to fetch, using cache: ${err.message}`);
    }
  }
  
  // Build metadata map by model ID
  const modelsDevMap = new Map();
  for (const model of modelsDevModels) {
    modelsDevMap.set(model.id, model);
    // Populate context map
    if (model.context > 0) {
      modelsDevContextMap.set(model.id, model.context);
    }
  }

  const rows = [];
  const possibleModelsToRemoveMap = new Map();
  const addPossibleRemoval = (modelId, company, reason, attempts) => {
    const prev = possibleModelsToRemoveMap.get(modelId);
    if (!prev) {
      possibleModelsToRemoveMap.set(modelId, { id: modelId, company, reason, attempts });
      return;
    }
    if (!prev.reason.includes(reason)) {
      prev.reason = `${prev.reason}; ${reason}`;
    }
    if (typeof attempts === 'number') {
      prev.attempts = Math.max(prev.attempts ?? 0, attempts);
    }
  };

  for (const m of models) {
    const isDisabledByToggle = disabledModels.has(m);
    if (isDisabledByToggle) {
      console.log(`[bench] ${m} disabled by toggle; skipping entirely.`);
      continue;
    }

    const toolCheck = await runToolCallingCheck(m);
    if (!toolCheck.passed) {
      console.log(`[bench] ${m} tool calling failed; disabling for future runs and skipping.`);
      const company = detectCompany(m);
      // persist immediately so next run skips this model
      disabledModels.add(m);
      saveDisabledModels(disabledModels);
      addPossibleRemoval(m, company, toolCheck.reason || 'Tool check failed', 0);
      rows.push({
        id: m,
        company,
        tier: 'FAIL_TOOL',
        score: -500,
        availability: 0,
        attempts: 0,
        successes: 0,
        latencyMs: latencyStats([]),
        errors: [toolCheck.reason || 'Tool check failed'],
        toolCheck,
        effortCheck: { supported: false, mechanism: null, results: {} },
        visionCheck: { supported: false, ms: 0, reason: 'Skipped: tool check failed' },
        contextSize: resolveModelContextSize(m),
        quarantined: false,
        removed: false,
        disabledByToggle: true
      });
      continue;
    }

    const effortCheck = await runEffortCheck(m);
    const visionCheck = await runVisionCheck(m);

    const r = await probeModel(m);
    const company = detectCompany(m);
    const score = scoreModel({
      availability: r.availability,
      p50: r.latencyMs.p50,
      toolPassed: toolCheck.passed
    });
    const effectiveScore = score;
    console.log(
      `[bench] ${m} summary: availability=${r.availability.toFixed(3)}, p50=${r.latencyMs.p50 ?? 'n/a'}ms, tool=${toolCheck.passed ? 'ok' : 'fail'}, vision=${visionCheck.supported ? 'ok' : 'no'}, score=${effectiveScore}`
    );
    rows.push({
      id: m,
      company,
      tier: 'PENDING',
      score: effectiveScore,
      availability: Number(r.availability.toFixed(3)),
      attempts: r.attempts,
      successes: r.successes,
      latencyMs: r.latencyMs,
      errors: r.errors,
      toolCheck,
      effortCheck,
      visionCheck,
      contextSize: resolveModelContextSize(m),
      quarantined: false,
      removed: false,
      disabledByToggle: false
    });

    if (r.skippedForFirst404) {
      addPossibleRemoval(m, company, 'HTTP 404 on first probe round', r.attempts);
    }
  }

  // Add models from models.dev that weren't tested (for reference)
  for (const [modelId, metadata] of modelsDevMap) {
    // Only add if not already in rows
    if (!rows.find(r => r.id === modelId)) {
      rows.push({
        id: modelId,
        company: detectCompany(modelId),
        tier: 'PENDING',
        score: 0,
        availability: 0,
        attempts: 0,
        successes: 0,
        latencyMs: latencyStats([]),
        errors: [],
        toolCheck: { passed: false, reason: 'Not tested (from models.dev catalog)' },
        effortCheck: { supported: false, mechanism: null, results: {} },
        visionCheck: { supported: false, ms: 0, reason: 'Not tested' },
        contextSize: metadata.context || 0,
        quarantined: false,
        removed: false,
        disabledByToggle: false,
        metadata: {
          name: metadata.name,
          family: metadata.family,
          tool_call: metadata.tool_call,
          reasoning: metadata.reasoning,
        }
      });
    }
  }

  rows.sort((a, b) => b.score - a.score || b.availability - a.availability || (a.latencyMs.p50 ?? 999999) - (b.latencyMs.p50 ?? 999999));
  assignDynamicTiers(rows);

  const modelsByCompany = Object.entries(
    rows.reduce((acc, row) => {
      if (!acc[row.company]) acc[row.company] = [];
      acc[row.company].push(row);
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([company, companyModels]) => ({
      company,
      recommendedModel: companyModels.find(isRecommendationEligible)?.id ?? null,
      models: companyModels
    }));

  const possibleModelsToRemove = Array.from(possibleModelsToRemoveMap.values());
  const recommendedRow = rows.find(isRecommendationEligible) ?? null;

  // Top models that support vision, ranked by score (S/A/B tiers only)
  const topVisionModels = rows
    .filter(r => r.visionCheck?.supported && ['S', 'A', 'B'].includes(r.tier))
    .sort((a, b) => b.score - a.score)
    .map(r => ({ id: r.id, company: r.company, tier: r.tier, score: r.score }));

  const out = {
    generatedAt: new Date().toISOString(),
    provider: 'nvidia',
    recommendedModel: recommendedRow?.id ?? null,
    topVisionModels,
    models: rows,
    modelsByCompany,
    possibleModelsToRemove,
    disabledModels: Array.from(disabledModels)
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  console.log(`Ranking written to ${OUT_FILE}`);
  if (out.recommendedModel) {
    const best = recommendedRow;
    console.log(`Best model: ${best.id} (tier=${best.tier}, score=${best.score}, avail=${best.availability}, p50=${best.latencyMs.p50}ms)`);
  }
  if (topVisionModels.length > 0) {
    console.log(`Top vision models (${topVisionModels.length}): ${topVisionModels.slice(0, 5).map(m => `${m.id} [${m.tier}]`).join(', ')}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
