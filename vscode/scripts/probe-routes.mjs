#!/usr/bin/env node
// Enumerate REST routes on the LS httpsPort.

import https from 'node:https';

const TARGETS = [
    { pid: 1944,  csrf: '0d070d69-edce-4e01-b904-a05f07a94e43', port: 54586 }, // workspace LS
];

const PATHS = [
    '/',
    '/debug/pprof/',
    '/debug/pprof/goroutine?debug=1',
    '/proxy/unleash',
    '/client/streaming',
    '/version',
    '/healthz',
    '/models',
    '/api/models',
    '/api/chat',
    '/api/completions',
    '/exa.language_server_pb.LanguageServerService/GetProcessInfo',
    '/exa/language_server_pb/LanguageServerService/GetProcessInfo',
    '/GetProcessInfo',
    '/language_server/GetProcessInfo',
    '/rpc/GetProcessInfo',
    '/chat',
    '/generate',
    '/supercomplete',
    '/completions',
    '/list_models',
    '/openapi.json',
    '/openapi.yaml',
    '/swagger.json',
    '/routes',
];

function call(port, csrf, path, method = 'GET', body = null) {
    return new Promise((resolve) => {
        const headers = {
            'Authorization': csrf,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (body) headers['Content-Length'] = String(Buffer.byteLength(body));
        const req = https.request(
            { host: '127.0.0.1', port, method, path, rejectUnauthorized: false, timeout: 3000, headers },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    const buf = Buffer.concat(chunks);
                    resolve({
                        status: res.statusCode,
                        ct: res.headers['content-type'],
                        len: buf.byteLength,
                        head: buf.subarray(0, 400).toString('utf-8').replace(/[^\x20-\x7e\n]/g, '.'),
                    });
                });
            },
        );
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.on('error', (err) => resolve({ error: err.message }));
        if (body) req.write(body); req.end();
    });
}

for (const t of TARGETS) {
    console.log(`\n=== PID ${t.pid}  https://127.0.0.1:${t.port} ===`);
    for (const p of PATHS) {
        const r = await call(t.port, t.csrf, p, 'GET');
        const label = `GET  ${p}`;
        if (r.error) console.log(`  ${label.padEnd(60)} ERR ${r.error}`);
        else if (r.status !== 404) {
            console.log(`  ${label.padEnd(60)} ${r.status}  ct=${r.ct}  len=${r.len}`);
            if (r.len > 0 && r.len < 500) console.log(`      ${r.head.replace(/\n/g,' | ')}`);
        } else {
            // try POST too in case GET isn't allowed
            const rp = await call(t.port, t.csrf, p, 'POST', '{}');
            if (rp.status && rp.status !== 404) {
                console.log(`  POST ${p.padEnd(55)} ${rp.status}  ct=${rp.ct}  len=${rp.len}`);
                if (rp.len > 0 && rp.len < 500) console.log(`      ${rp.head.replace(/\n/g,' | ')}`);
            }
        }
    }
}
