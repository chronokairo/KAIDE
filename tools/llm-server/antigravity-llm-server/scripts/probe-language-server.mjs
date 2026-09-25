#!/usr/bin/env node
// Standalone probe — run while the Antigravity editor is open.
//   node scripts/probe-language-server.mjs
//
// Exercises the Connect RPC endpoints of the local language_server.exe so
// we can confirm the Cascade stack is reachable without booting VS Code.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

const distPath = resolve(here, '..', 'dist', 'antigravityClient.js');
let mod;
try {
    mod = require(distPath);
} catch (err) {
    console.error(
        `[probe] Could not load ${distPath}. Run \`pnpm run build\` first.\n`,
        err.message,
    );
    process.exit(2);
}

const { findRunningLanguageServers, LanguageServerClient, LS } = mod;

const servers = findRunningLanguageServers();
if (servers.length === 0) {
    console.error(
        '[probe] No running Antigravity language server found.\n' +
            '        Open the Antigravity editor at least once, then retry.',
    );
    process.exit(1);
}

for (const s of servers) {
    console.log(
        `[probe] pid=${s.pid} httpsPort=${s.httpsPort} workspace=${s.workspaceId ?? '(none)'} endpoint=${s.cloudCodeEndpoint ?? '(none)'}`,
    );
}
console.log();

const client = new LanguageServerClient(servers[0]);
console.log(`[probe] Using LS on :${client.info.httpsPort}`);

try {
    const hb = await LS.ping(client);
    console.log('[probe] Heartbeat OK :', JSON.stringify(hb));
} catch (err) {
    console.error('[probe] Heartbeat FAILED :', err.message);
    process.exit(1);
}

try {
    const u = await LS.userStatus(client);
    const email = u?.userStatus?.email ?? '(unknown)';
    const plan = u?.userStatus?.planStatus?.planInfo?.planName ?? '(unknown)';
    console.log(`[probe] User         : ${email} — ${plan}`);
} catch (err) {
    console.error('[probe] GetUserStatus FAILED :', err.message);
}

try {
    const resp = await LS.cascadeModels(client);
    const configs = resp.clientModelConfigs ?? [];
    console.log(`[probe] ${configs.length} Cascade model(s):`);
    for (const c of configs) {
        const modelId = c.modelOrAlias?.model ?? c.modelOrAlias?.alias ?? '?';
        const flag = c.isRecommended ? '  (recommended)' : '';
        console.log(`  - ${(c.label ?? '?').padEnd(28)} ${modelId}${flag}`);
    }
} catch (err) {
    console.error('[probe] GetCascadeModelConfigData FAILED :', err.message);
}

try {
    const start = await LS.startCascade(client);
    console.log('[probe] StartCascade :', JSON.stringify(start));
    if (start?.cascadeId) {
        await LS.sendUserCascadeMessage(client, {
            cascadeId: start.cascadeId,
            content: 'ping from probe-language-server.mjs',
        });
        console.log('[probe] SendUserCascadeMessage accepted');
    }
} catch (err) {
    console.error('[probe] Cascade flow FAILED :', err.message);
}
