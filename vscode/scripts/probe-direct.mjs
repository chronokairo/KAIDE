#!/usr/bin/env node
// Test direct model RPCs: GetModelResponse, SendAgentMessage+Stream, etc.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const { LanguageServerClient, LS } = require(
    resolve(here, '..', 'dist', 'antigravityClient.js'),
);

const client = LanguageServerClient.connect(process.cwd());
await client.httpsPort();

async function call(method, request = {}) {
    try {
        const r = await client.unary({ method, request });
        console.log(`[ok ] ${method} => ${JSON.stringify(r).slice(0, 500)}`);
        return r;
    } catch (err) {
        console.log(`[err] ${method} => ${err.message.slice(0, 400)}`);
        return null;
    }
}

async function tryStream(method, request = {}, maxMs = 8000) {
    console.log(`--- stream ${method} ---`);
    const deadline = Date.now() + maxMs;
    let n = 0;
    try {
        for await (const msg of client.serverStream({ method, request })) {
            n++;
            const keys = msg && typeof msg === 'object' ? Object.keys(msg).join(',') : '';
            console.log(`  [${method} #${n}] keys=[${keys}] ${JSON.stringify(msg).slice(0, 500)}`);
            if (Date.now() > deadline) break;
        }
    } catch (err) {
        console.log(`  [err] ${method}: ${err.message.slice(0, 300)}`);
    }
    console.log(`--- ${method} done: ${n} frames ---`);
}

// 1. Try direct model response — no cascade needed
console.log('## GetModelResponse shape probes');
await call('GetModelResponse', {});
await call('GetModelResponse', { prompt: 'Say PONG' });
await call('GetModelResponse', {
    messages: [{ role: 'user', content: 'Say PONG' }],
});
await call('GetModelResponse', {
    model: 'MODEL_PLACEHOLDER_M47',
    messages: [{ role: 'user', content: 'Say PONG' }],
});
await call('GetModelResponse', {
    modelName: 'chat_20706',
    messages: [{ role: 'user', content: 'Say PONG' }],
});

// 2. SendAgentMessage variants
console.log('\n## SendAgentMessage shape probes');
await call('SendAgentMessage', {});
await call('SendAgentMessage', { content: 'hi' });
await call('SendAgentMessage', { content: 'hi', cascadeId: 'x' });

// 3. Fresh cascade + trajectory readout
console.log('\n## Fresh cascade — check trajectory after user interaction');
const started = await LS.startCascade(client);
const cascadeId = started?.cascadeId;
console.log('cascadeId =', cascadeId);

await call('HandleCascadeUserInteraction', { cascadeId });
await call('HandleCascadeUserInteraction', {
    cascadeId,
    message: { content: 'Say PONG' },
});

// 4. Send message then stream
await LS.sendUserCascadeMessage(client, {
    cascadeId,
    content: 'Respond with only: PONG',
});
console.log('sent, streaming agent/trajectory updates…');

await tryStream('StreamAgentStateUpdates', { cascadeId }, 6000);
await tryStream('StreamUserTrajectoryReactiveUpdates', { cascadeId }, 6000);

// 5. Poll trajectory
await new Promise((r) => setTimeout(r, 3000));
await call('GetCascadeTrajectory', { cascadeId });
await call('GetCascadeTrajectorySteps', { cascadeId });

// 6. Send all queued messages?
await call('SendAllQueuedMessages', { cascadeId });
await new Promise((r) => setTimeout(r, 2000));
await call('GetCascadeTrajectory', { cascadeId });
await call('GetCascadeTrajectorySteps', { cascadeId });
