#!/usr/bin/env node
// Connect-go client for the LS with correct CSRF header.
import https from 'node:https';

const TARGET = { port: 54586, csrf: 'f2ba3518-0176-4118-bbf9-30aae6609d67' };
const SERVICE = 'exa.language_server_pb.LanguageServerService';

const CANDIDATES = [
    'GetProcessInfo','Heartbeat',
    'GetModelStatuses','GetModelResponse',
    'ListMcpResources','GetSidecarEvents','ForkConversation',
    'SendAgentMessage','GetRevertPreview','ImportFromCursor',
    'CheckoutWorktree','GetTranscription','SmartOpenBrowser','JetboxWriteState',
    'CompleteMcpOAuth','SimulateSegFault',
];

function call(method, body) {
    return new Promise((resolve) => {
        const payload = Buffer.from(JSON.stringify(body ?? {}));
        const req = https.request(
            {
                host: '127.0.0.1', port: TARGET.port, method: 'POST',
                path: `/${SERVICE}/${method}`,
                rejectUnauthorized: false, timeout: 8000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Connect-Protocol-Version': '1',
                    'x-codeium-csrf-token': TARGET.csrf,
                    'Content-Length': String(payload.byteLength),
                },
            },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    const buf = Buffer.concat(chunks);
                    resolve({ status: res.statusCode, ct: res.headers['content-type'], text: buf.toString('utf-8') });
                });
            },
        );
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.on('error', (err) => resolve({ error: err.message }));
        req.write(payload); req.end();
    });
}

for (const m of CANDIDATES) {
    const r = await call(m, {});
    if (r.error) { console.log(`${m.padEnd(22)} ERR ${r.error}`); continue; }
    const snippet = (r.text || '').replace(/\s+/g, ' ').slice(0, 260);
    console.log(`${m.padEnd(22)} ${r.status}  ${snippet}`);
}
