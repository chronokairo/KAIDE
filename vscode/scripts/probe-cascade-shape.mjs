#!/usr/bin/env node
// Try trajectory + panel-init paths to understand how to read Cascade output.

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
console.log(`[probe] using :${await client.httpsPort()} ws=${client.info.workspaceId}`);

async function call(method, request = {}, service) {
    try {
        const r = await client.unary({ service, method, request });
        console.log(`[ok ] ${method} => ${JSON.stringify(r).slice(0, 400)}`);
        return r;
    } catch (err) {
        console.log(`[err] ${method} => ${err.message.slice(0, 300)}`);
        return null;
    }
}

// 1. Try initializing panel state first
await call('InitializeCascadePanelState', {});
await call('InitializeCascadePanelState', { workspaceId: client.info.workspaceId });

// 2. Try an idle / panel stream
async function shortStream(method, request = {}) {
    console.log(`--- stream ${method} ---`);
    const deadline = Date.now() + 5000;
    let n = 0;
    try {
        for await (const msg of client.serverStream({ method, request })) {
            n++;
            const keys = msg && typeof msg === 'object' ? Object.keys(msg).join(',') : '';
            console.log(`  [${method} #${n}] keys=[${keys}] ${JSON.stringify(msg).slice(0, 400)}`);
            if (n >= 3 || Date.now() > deadline) break;
        }
    } catch (err) {
        console.log(`  [err] ${method}: ${err.message.slice(0, 200)}`);
    }
    console.log(`--- ${method} yielded ${n} frames ---`);
}

await shortStream('StreamCascadePanelReactiveUpdates', {});
await shortStream('StreamCascadePanelReactiveUpdates', { workspaceId: client.info.workspaceId });

// 3. Full flow: start + send + try trajectory
const started = await LS.startCascade(client);
const cascadeId = started?.cascadeId;
console.log('[flow] cascadeId =', cascadeId);
await LS.sendUserCascadeMessage(client, {
    cascadeId,
    content: 'Respond with just the word PONG.',
});
console.log('[flow] sent — waiting 3s');
await new Promise((r) => setTimeout(r, 3000));

await call('GetCascadeTrajectory', { cascadeId });
await call('GetCascadeTrajectorySteps', { cascadeId });
await call('GetAllCascadeTrajectories', {});

// 4. Retry reactive streams with the active cascadeId
await shortStream('StreamCascadeReactiveUpdates', { cascadeId });
