#!/usr/bin/env node
// Probe StreamCascadeReactiveUpdates using the client's serverStream.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const { LanguageServerClient, LS } = require(
    resolve(here, '..', 'dist', 'antigravityClient.js'),
);

const client = LanguageServerClient.connect(process.cwd());
console.log(
    `[stream] pid=${client.info.pid} ports=[${client.info.ports}] ws=${client.info.workspaceId ?? '-'}`,
);

const hb = await LS.ping(client);
console.log(`[stream] https resolved to :${await client.httpsPort()}`);
console.log(`[stream] heartbeat ok: ${JSON.stringify(hb).slice(0, 80)}`);

let cascadeId = process.argv[2];
if (!cascadeId) {
    const started = await LS.startCascade(client);
    cascadeId = started.cascadeId;
    console.log('[stream] StartCascade ->', cascadeId);
    await LS.sendUserCascadeMessage(client, {
        cascadeId,
        content: 'Respond with exactly one word: PONG.',
    });
    console.log('[stream] SendUserCascadeMessage sent');
}

const deadline = Date.now() + 25000;
let frames = 0;
try {
    for await (const msg of client.serverStream({
        method: 'StreamCascadeReactiveUpdates',
        request: { cascadeId },
    })) {
        frames++;
        const keys = msg && typeof msg === 'object' ? Object.keys(msg).join(',') : '';
        console.log(`[frame #${frames}] keys=[${keys}]`);
        console.log('  ' + JSON.stringify(msg).slice(0, 800));
        if (Date.now() > deadline) break;
    }
} catch (err) {
    console.error('[stream] error:', err.message);
}
console.log(`[stream] ${frames} data frames total`);
