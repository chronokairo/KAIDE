#!/usr/bin/env node
// End-to-end smoke test for runChatViaLanguageServer + chunkText.
// Simulates what /api/chat does, without booting VS Code.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Module from 'node:module';

// Stub the 'vscode' module so modelBridge can import it without VS Code.
const originalResolve = Module._resolveFilename;
const stubPath = resolve(process.cwd(), '__vscode-stub.js');
const realRequire = createRequire(import.meta.url);

Module._resolveFilename = function (request, parent, ...rest) {
    if (request === 'vscode') return stubPath;
    return originalResolve.call(this, request, parent, ...rest);
};

// Write the stub on the fly.
import fs from 'node:fs';
fs.writeFileSync(
    stubPath,
    `module.exports = {
        lm: { selectChatModels: async () => [] },
        workspace: { workspaceFolders: [{ uri: { fsPath: ${JSON.stringify(process.cwd())} } }] },
        CancellationTokenSource: class { constructor() { this.token = {}; } dispose() {} },
        LanguageModelChatMessage: { User: (c) => ({c}), Assistant: (c) => ({c}) },
    };`,
);

try {
    const here = dirname(fileURLToPath(import.meta.url));
    const {
        resolveCascadeModel,
        runChatViaLanguageServer,
        routeAutoViaLanguageServer,
    } = realRequire(resolve(here, '..', 'dist', 'extension.js')) || {};

    // extension.js wraps everything; modelBridge helpers aren't reachable from
    // the activation bundle. Import modelBridge's source directly via the raw
    // path from antigravityClient (which IS exposed via dist/antigravityClient).
    // For a smoke test we re-use the small LS helpers from antigravityClient.
    const { LanguageServerClient, LS } = realRequire(
        resolve(here, '..', 'dist', 'antigravityClient.js'),
    );

    const client = LanguageServerClient.connect(process.cwd());
    await client.httpsPort();
    const models = await LS.cascadeModels(client);
    const configs = models.clientModelConfigs ?? [];
    const flash = configs.find((c) => /gemini.*flash/i.test(c.label));
    if (!flash) throw new Error('no Gemini Flash cascade model found');

    const modelId = flash.modelOrAlias?.model ?? flash.modelOrAlias?.alias;
    console.log(`[e2e] using ${flash.label} (${modelId})`);

    const ollamaMessages = [
        { role: 'system', content: 'You are concise. Answer in one short sentence.' },
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '4.' },
        { role: 'user', content: 'Now say the word PONG — and ONLY that word.' },
    ];

    // Replicate partitionMessages from modelBridge
    function partition(msgs) {
        const system = msgs.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n') || undefined;
        const turns = msgs.filter((m) => m.role === 'user' || m.role === 'assistant');
        let lastU = -1;
        for (let i = turns.length - 1; i >= 0; i--) if (turns[i].role === 'user') { lastU = i; break; }
        return { system, chatMessages: turns.slice(0, lastU), prompt: turns[lastU].content };
    }
    const { system, chatMessages, prompt } = partition(ollamaMessages);

    console.log('[e2e] system =', system);
    console.log('[e2e] history =', chatMessages.length, 'turns');
    console.log('[e2e] prompt =', prompt);

    const req = { model: modelId, prompt, chatMessages };
    if (system) req.system = system;
    const t0 = Date.now();
    const resp = await client.unary({ method: 'GetModelResponse', request: req });
    const ms = Date.now() - t0;
    console.log(`[e2e] got response in ${ms}ms:`);
    console.log('>>> ' + (resp.response ?? '').trim());

    // Chunk it the way the server would stream it.
    function* chunkText(text, target = 24) {
        if (!text) return;
        const parts = text.match(/\S+\s*|\s+/g) ?? [text];
        let buf = '';
        for (const p of parts) {
            buf += p;
            if (buf.length >= target) { yield buf; buf = ''; }
        }
        if (buf) yield buf;
    }
    console.log('\n[e2e] streamed chunks:');
    let i = 0;
    for (const c of chunkText(resp.response ?? '')) {
        console.log(`  #${++i} ${JSON.stringify(c)}`);
    }
    console.log(`[e2e] ${i} chunk(s) would be written as NDJSON`);
} finally {
    try { fs.unlinkSync(stubPath); } catch {}
}
