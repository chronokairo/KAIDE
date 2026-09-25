#!/usr/bin/env node
// Shape probe for GetModelResponse — the direct model RPC.

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

async function call(tag, method, request) {
    try {
        const r = await client.unary({ method, request });
        console.log(`[OK ] ${tag}\n       ${JSON.stringify(r).slice(0, 500)}`);
    } catch (err) {
        console.log(`[err] ${tag} => ${err.message.slice(0, 300)}`);
    }
}

const M = 'MODEL_PLACEHOLDER_M47';

// Try variations with model_name / modelName (proto wire vs JSON camel)
await call('shape1', 'GetModelResponse', {
    modelName: M,
    prompt: 'Say PONG.',
});
await call('shape2', 'GetModelResponse', {
    model: M,
    prompt: 'Say PONG.',
});
await call('shape3', 'GetModelResponse', {
    modelName: M,
    contents: [{ role: 'user', parts: [{ text: 'Say PONG.' }] }],
});
await call('shape4', 'GetModelResponse', {
    model: M,
    contents: [{ role: 'user', parts: [{ text: 'Say PONG.' }] }],
});
await call('shape5', 'GetModelResponse', {
    modelName: M,
    inputMessages: [{ role: 'user', content: 'Say PONG.' }],
});
await call('shape6', 'GetModelResponse', {
    modelName: M,
    messages: [{ role: 'USER_INPUT', content: 'Say PONG.' }],
});
await call('shape7', 'GetModelResponse', {
    chatModelName: M,
    chatMessages: [{ role: 'user', content: 'Say PONG.' }],
});
await call('shape8', 'GetModelResponse', {
    modelName: 'chat_20706',
    chatMessages: [{ role: 'user', content: 'Say PONG.' }],
});
await call('shape9', 'GetModelResponse', {
    chatModelName: 'chat_20706',
    chatMessages: [{ role: 'user', text: 'Say PONG.' }],
});

// Try passing chatHistory / promptId type shapes
await call('shape10', 'GetModelResponse', {
    modelName: M,
    chatHistory: [{ role: 'USER', message: 'Say PONG.' }],
});

// Use full GenerateContentRequest-alike
await call('shape11', 'GetModelResponse', {
    modelName: M,
    request: {
        contents: [{ role: 'user', parts: [{ text: 'Say PONG.' }] }],
    },
});
await call('shape12', 'GetModelResponse', {
    generateContentRequest: {
        modelName: M,
        contents: [{ role: 'user', parts: [{ text: 'Say PONG.' }] }],
    },
});

// Probe whether GetModelResponse is actually a stream endpoint
console.log('\n--- try as stream ---');
try {
    let n = 0;
    for await (const msg of client.serverStream({
        method: 'GetModelResponse',
        request: {
            modelName: M,
            contents: [{ role: 'user', parts: [{ text: 'Say PONG.' }] }],
        },
    })) {
        n++;
        console.log(`  frame ${n}: ${JSON.stringify(msg).slice(0, 400)}`);
        if (n >= 20) break;
    }
    console.log(`  stream yielded ${n} frames`);
} catch (err) {
    console.log(`  stream err: ${err.message.slice(0, 300)}`);
}
