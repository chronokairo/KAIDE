#!/usr/bin/env node
/**
 * Benchmark de modelos NVIDIA específicos usando o mesmo sistema de scoring
 * do generate-nvidia-ranking.mjs (probeModel + toolCheck + scoreModel + assignDynamicTiers)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

// ─── Load .env ───────────────────────────────────────────────────────────────
function loadDotEnv() {
  const envFile = path.join(ROOT, '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadDotEnv();

// ─── Config ───────────────────────────────────────────────────────────────────
const API_KEY = process.env.NVIDIA_API_KEY;
const BASE = (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '');
const ROUNDS = Number(process.env.RANK_PROBE_ROUNDS || '3');
const TIMEOUT_MS = Number(process.env.RANK_PROBE_TIMEOUT_MS || '15000');
const MAX_TOKENS = Number(process.env.RANK_PROBE_MAX_TOKENS || '24');

if (!API_KEY) { console.error('Missing NVIDIA_API_KEY'); process.exit(1); }

// ─── Target models ────────────────────────────────────────────────────────────
const MODELS = [
  'nvidia/llama-3.1-nemotron-ultra-253b-v1',
  'qwen/qwen3.5-coder-480b-a3b-instruct',
  'moonshotai/kimi-k2.6',
  'minimaxai/minimax-m2.7',
  'z-ai/glm-5.1',
  'deepseek-ai/deepseek-v4-pro',
  'openai/gpt-oss-120b',
  'mistralai/mistral-large-3-675b-instruct-2512',
  'nvidia/nemotron-nano-3-30b-a3b',
  'mistralai/mistral-small-4-119b-2603'
];

const OUTPUT_FILE = path.join(DATA_DIR, `nvidia-specific-ranking-${new Date().toISOString().slice(0, 10)}.json`);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function latencyStats(values) {
  const s = [...values].sort((a, b) => a - b);
  const at = p => s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))];
  return {
    p50: s.length ? Math.round(at(0.5)) : null,
    p95: s.length ? Math.round(at(0.95)) : null,
    min: s.length ? Math.round(s[0]) : null,
    max: s.length ? Math.round(s[s.length - 1]) : null,
  };
}

function extractToolArguments(toolCall) {
  const raw = toolCall?.function?.arguments;
  if (typeof raw !== 'string') return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function postChatCompletions(payload) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify(payload),
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

// ─── probeModel (latency + availability) ─────────────────────────────────────
async function probeModel(model) {
  console.log(`[bench] Probing ${model}`);
  let ok = 0;
  const lat = [];
  const errors = [];
  let skippedForFirst404 = false;

  for (let i = 0; i < ROUNDS; i++) {
    const round = i + 1;
    console.log(`[bench]   round ${round}/${ROUNDS}...`);
    const started = Date.now();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          model, stream: false, max_tokens: MAX_TOKENS, temperature: 0,
          messages: [{ role: 'user', content: 'Ping. Respond with one short sentence.' }],
        }),
      });
      if (!res.ok) {
        const msg = `HTTP ${res.status}`;
        errors.push(msg);
        console.log(`[bench]   round ${round} failed: ${msg}`);
        if (round === 1 && res.status === 404) {
          skippedForFirst404 = true;
          console.log(`[bench]   404 on first round — model not available`);
          break;
        }
      } else {
        const elapsed = Date.now() - started;
        ok += 1;
        lat.push(elapsed);
        console.log(`[bench]   round ${round} ok in ${elapsed}ms`);
      }
    } catch (e) {
      const msg = String(e?.message || e);
      errors.push(msg);
      console.log(`[bench]   round ${round} failed: ${msg}`);
    } finally {
      clearTimeout(t);
    }
  }

  return {
    attempts: ROUNDS,
    successes: ok,
    availability: ROUNDS > 0 ? ok / ROUNDS : 0,
    latencyMs: latencyStats(lat),
    errors: errors.slice(0, 5),
    skippedForFirst404,
  };
}

// ─── runToolCallingCheck ──────────────────────────────────────────────────────
const TOOL_TEST_USER_PROMPT = 'Liste os arquivos do diretório atual';
const TOOL_TEST_FAKE_OUTPUT = 'main.py\nrequirements.txt\nREADME.md';
const TOOL_TEST_TOOLS = [{
  type: 'function',
  function: {
    name: 'bash',
    description: 'Executa um comando bash e retorna o output',
    parameters: {
      type: 'object',
      properties: { command: { type: 'string', description: 'Comando bash a executar' } },
      required: ['command'],
    },
  },
}];

async function runToolCallingCheck(model) {
  console.log(`[tool] Checking tool calling for ${model}...`);
  try {
    const turn1 = await postChatCompletions({
      model,
      messages: [{ role: 'user', content: TOOL_TEST_USER_PROMPT }],
      tools: TOOL_TEST_TOOLS,
      tool_choice: 'auto',
      stream: false,
      temperature: 0,
      max_tokens: 256,
    });
    const choice1 = turn1?.choices?.[0];
    const msg1 = choice1?.message;
    if (!choice1 || !msg1) return { passed: false, reason: 'Invalid response shape' };
    if (choice1.finish_reason !== 'tool_calls')
      return { passed: false, reason: `finish_reason=${choice1.finish_reason} (expected tool_calls)` };
    const toolCall = msg1?.tool_calls?.[0];
    if (!toolCall) return { passed: false, reason: 'Missing tool_calls[0]' };
    if (toolCall?.function?.name !== 'bash')
      return { passed: false, reason: `Wrong tool name: ${toolCall?.function?.name}` };
    const parsedArgs = extractToolArguments(toolCall);
    if (!parsedArgs || typeof parsedArgs.command !== 'string' || !parsedArgs.command.trim())
      return { passed: false, reason: 'Invalid function arguments' };

    const turn2 = await postChatCompletions({
      model,
      messages: [
        { role: 'user', content: TOOL_TEST_USER_PROMPT },
        { role: 'assistant', content: msg1?.content ?? null, tool_calls: msg1?.tool_calls ?? [] },
        { role: 'tool', tool_call_id: toolCall.id, content: TOOL_TEST_FAKE_OUTPUT },
      ],
      tools: TOOL_TEST_TOOLS,
      stream: false,
      temperature: 0,
      max_tokens: 256,
    });

    const finalText = String(turn2?.choices?.[0]?.message?.content ?? '');
    const tokens = TOOL_TEST_FAKE_OUTPUT.split('\n').map(s => s.trim()).filter(Boolean);
    if (!tokens.some(t => finalText.includes(t)))
      return { passed: false, reason: 'Model ignored tool result on turn 2' };

    console.log(`[tool] ${model} passed ✓`);
    return { passed: true, reason: null };
  } catch (err) {
    return { passed: false, reason: `Request error: ${String(err?.message || err)}` };
  }
}

// ─── scoreModel (same formula as generate-nvidia-ranking.mjs) ────────────────
function scoreModel({ availability, p50, toolPassed }) {
  const availabilityScore = Math.round(availability * 120);
  const latencyScore = p50 == null ? 0 : Math.max(0, 120 - Math.round(p50 / 100));
  const toolScore = toolPassed ? 40 : -140;
  return availabilityScore + latencyScore + toolScore;
}

// ─── assignDynamicTiers (same as generate-nvidia-ranking.mjs) ─────────────────
function assignDynamicTiers(rows) {
  const eligible = rows.filter(r => !r.removed && r.toolCheck?.passed && r.availability > 0);
  eligible.forEach((r, idx) => {
    const pos = eligible.length <= 1 ? 0 : idx / (eligible.length - 1);
    if (pos <= 0.15) r.tier = 'S';
    else if (pos <= 0.45) r.tier = 'A';
    else if (pos <= 0.8) r.tier = 'B';
    else r.tier = 'C';
  });
  for (const r of rows) {
    if (r.tier) continue;
    if (r.removed) r.tier = 'REMOVED';
    else if (!r.toolCheck?.passed) r.tier = 'FAIL_TOOL';
    else if (r.availability <= 0) r.tier = 'UNAVAILABLE';
    else r.tier = 'C';
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('='.repeat(80));
console.log('Benchmark — Modelos NVIDIA Selecionados');
console.log('='.repeat(80));
console.log(`Modelos: ${MODELS.length}  |  Rounds: ${ROUNDS}  |  Timeout: ${TIMEOUT_MS}ms`);
console.log(`API: ${BASE}`);
console.log(`Output: ${OUTPUT_FILE}\n`);

const rows = [];

for (const model of MODELS) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`▶ ${model}`);

  const probe = await probeModel(model);
  const p50 = probe.latencyMs.p50;

  let toolCheck = { passed: false, reason: 'Skipped (not available)' };
  if (!probe.skippedForFirst404 && probe.availability > 0) {
    toolCheck = await runToolCallingCheck(model);
  }

  const score = scoreModel({ availability: probe.availability, p50, toolPassed: toolCheck.passed });

  const row = {
    id: model,
    availability: probe.availability,
    latencyMs: probe.latencyMs,
    toolCheck,
    score,
    removed: probe.skippedForFirst404,
    errors: probe.errors,
  };
  rows.push(row);

  const statusIcon = probe.skippedForFirst404 ? '❌' : probe.availability > 0 ? '✅' : '⚠️';
  console.log(`  ${statusIcon} avail=${(probe.availability * 100).toFixed(0)}%  p50=${p50 ?? 'N/A'}ms  tool=${toolCheck.passed ? '✓' : '✗'}  score=${score}`);
  if (!toolCheck.passed && toolCheck.reason) console.log(`     tool reason: ${toolCheck.reason}`);

  await new Promise(r => setTimeout(r, 500));
}

// Assign tiers + sort
assignDynamicTiers(rows);
rows.sort((a, b) => b.score - a.score);
rows.forEach((r, i) => { r.rank = i + 1; });

// Save
fs.mkdirSync(DATA_DIR, { recursive: true });
const output = { testDate: new Date().toISOString(), api: BASE, rounds: ROUNDS, models: rows };
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`\n✓ Resultados salvos em: ${OUTPUT_FILE}`);

// Print table
const PAD = 42;
console.log('\n' + '='.repeat(80));
console.log('Ranking Final');
console.log('='.repeat(80));
console.log(`${'Rank'.padEnd(5)} ${'Score'.padEnd(6)} ${'Tier'.padEnd(12)} ${'p50'.padEnd(8)} ${'Tool'.padEnd(6)} Modelo`);
console.log('-'.repeat(80));
for (const r of rows) {
  const tier = r.tier ?? '?';
  const p50 = r.latencyMs?.p50 != null ? `${r.latencyMs.p50}ms` : 'N/A';
  const tool = r.toolCheck?.passed ? '✓' : '✗';
  console.log(
    `${String(r.rank).padEnd(5)} ${String(r.score).padEnd(6)} ${tier.padEnd(12)} ${p50.padEnd(8)} ${tool.padEnd(6)} ${r.id}`
  );
}
console.log('='.repeat(80));

const best = rows.find(r => r.tier === 'S') ?? rows[0];
if (best) console.log(`\n🏆 Melhor: ${best.id}  (score=${best.score}, tier=${best.tier}, p50=${best.latencyMs?.p50 ?? 'N/A'}ms)`);
