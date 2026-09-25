#!/usr/bin/env node
// Live test — exercises /api/chat's exact pipeline against the running LS.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const { LanguageServerClient, LS } = require(
    resolve(here, '..', 'dist', 'antigravityClient.js'),
);

function partition(msgs) {
    const system =
        msgs.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n') ||
        undefined;
    const turns = msgs.filter((m) => m.role === 'user' || m.role === 'assistant');
    let lastU = -1;
    for (let i = turns.length - 1; i >= 0; i--)
        if (turns[i].role === 'user') { lastU = i; break; }
    const chatMessages = lastU >= 0 ? turns.slice(0, lastU) : turns.slice();
    const prompt = lastU >= 0 ? turns[lastU].content : '';
    return { system, chatMessages, prompt };
}

const client = LanguageServerClient.connect(process.cwd());
await client.httpsPort();

const models = await LS.cascadeModels(client);
const byFamily = new Map();
for (const c of models.clientModelConfigs ?? []) {
    const fam = c.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    byFamily.set(fam, {
        label: c.label,
        modelId: c.modelOrAlias?.model ?? c.modelOrAlias?.alias,
    });
}

console.log('── Cascade models exposed as /api/tags ──');
for (const [fam, info] of byFamily) console.log(`  ${fam}:antigravity  →  ${info.label} (${info.modelId})`);

const tests = [
    {
        name: 'single-turn',
        family: 'gemini-3-flash',
        messages: [{ role: 'user', content: 'Reply with exactly: HELLO' }],
    },
    {
        name: 'with-system',
        family: 'gemini-3-flash',
        messages: [
            { role: 'system', content: 'You are a pirate. Start every reply with "Arr!"' },
            { role: 'user', content: 'Say hi.' },
        ],
    },
    {
        name: 'multi-turn-history',
        family: 'gemini-3-flash',
        messages: [
            { role: 'user', content: 'My name is Luan. Remember it.' },
            { role: 'assistant', content: 'Got it, Luan.' },
            { role: 'user', content: 'What is my name?' },
        ],
    },
    {
        name: 'code-generation',
        family: 'gemini-3-flash',
        messages: [
            {
                role: 'user',
                content:
                    'Write a JavaScript one-liner that returns the sum of an array. Only the code, no explanation.',
            },
        ],
    },
    {
        name: 'gemini-3.1-pro',
        family: 'gemini-3-1-pro-low',
        messages: [
            { role: 'user', content: 'In one sentence: what is the capital of Brazil?' },
        ],
    },
];

let pass = 0;
let fail = 0;
for (const t of tests) {
    const info = byFamily.get(t.family);
    if (!info) { console.log(`[skip] ${t.name} — no model for ${t.family}`); continue; }

    const { system, chatMessages, prompt } = partition(t.messages);
    const req = { model: info.modelId, prompt };
    if (system) req.system = system;
    if (chatMessages.length) req.chatMessages = chatMessages;

    const t0 = Date.now();
    try {
        const resp = await client.unary({ method: 'GetModelResponse', request: req });
        const ms = Date.now() - t0;
        const body = (resp.response ?? '').trim();
        console.log(`\n[PASS] ${t.name}  (${info.label}, ${ms}ms)`);
        console.log('       ' + body.slice(0, 300).replace(/\n/g, '\n       '));
        pass++;
    } catch (err) {
        console.log(`\n[FAIL] ${t.name}  (${info.label}): ${err.message.slice(0, 200)}`);
        fail++;
    }
}

console.log(`\n── Summary: ${pass} pass, ${fail} fail ──`);
process.exit(fail === 0 ? 0 : 1);
