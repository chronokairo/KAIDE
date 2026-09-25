#!/usr/bin/env node
// GetModelResponse works with {model, prompt}. Probe multi-turn / streaming / system.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const { LanguageServerClient } = require(
    resolve(here, '..', 'dist', 'antigravityClient.js'),
);

const client = LanguageServerClient.connect(process.cwd());
await client.httpsPort();

async function call(tag, request) {
    try {
        const r = await client.unary({ method: 'GetModelResponse', request });
        console.log(`[OK ] ${tag}\n       ${JSON.stringify(r).slice(0, 800)}`);
    } catch (err) {
        console.log(`[err] ${tag} => ${err.message.slice(0, 300)}`);
    }
}

const M = 'MODEL_PLACEHOLDER_M47';

// 1. Baseline (confirmed working)
await call('base', { model: M, prompt: 'Say PONG.' });

// 2. With system
await call('sys-top', {
    model: M,
    prompt: 'Who are you?',
    systemPrompt: 'You are a pirate. Start every reply with "Arr!"',
});
await call('sys-nested', {
    model: M,
    prompt: 'Who are you?',
    system: 'You are a pirate. Start every reply with "Arr!"',
});
await call('sys-instructions', {
    model: M,
    prompt: 'Who are you?',
    instructions: 'You are a pirate.',
});

// 3. Multi-turn with history
await call('history-messages', {
    model: M,
    prompt: 'What did I just ask?',
    history: [
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '4' },
    ],
});
await call('history-messages2', {
    model: M,
    messages: [
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '4' },
        { role: 'user', content: 'What did I just ask?' },
    ],
});
await call('history-chat', {
    model: M,
    chatHistory: [
        { role: 'USER', message: 'What is 2+2?' },
        { role: 'MODEL', message: '4' },
    ],
    prompt: 'What did I just ask?',
});
await call('history-chatMessages', {
    model: M,
    prompt: 'What did I just ask?',
    chatMessages: [
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '4' },
    ],
});

// 4. Other models
for (const m of [
    'MODEL_PLACEHOLDER_M37', // Gemini 3.1 Pro High
    'MODEL_PLACEHOLDER_M26', // Claude Opus 4.6
    'MODEL_PLACEHOLDER_M35', // Claude Sonnet 4.6
    'MODEL_OPENAI_GPT_OSS_120B_MEDIUM',
]) {
    await call(`model=${m}`, { model: m, prompt: 'Reply with exactly: READY' });
}

// 5. Streaming probes — try Connect streaming against different method names
console.log('\n--- streaming probes ---');
const streamMethods = [
    'StreamModelResponse',
    'StreamGetModelResponse',
    'StreamModelResponseChunks',
    'GetModelResponseStream',
];
for (const m of streamMethods) {
    console.log(`[stream ${m}]`);
    try {
        let n = 0;
        for await (const msg of client.serverStream({
            method: m,
            request: { model: M, prompt: 'Count to 3 slowly.' },
        })) {
            n++;
            console.log(`   frame ${n}: ${JSON.stringify(msg).slice(0, 400)}`);
            if (n >= 40) break;
        }
        console.log(`   => ${n} frames`);
    } catch (err) {
        console.log(`   err: ${err.message.slice(0, 200)}`);
    }
}
