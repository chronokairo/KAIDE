#!/usr/bin/env node
// Hit the REAL routes discovered in the LS binary.
import https from 'node:https';

const TARGET = { port: 54586, csrf: '0d070d69-edce-4e01-b904-a05f07a94e43' };

const ROUTES = [
    // CloudCode Assist proxy (google style)
    { path: '/v1internal:listModelConfigs', method: 'POST', body: {} },
    { path: '/v1internal:listModelConfigs', method: 'GET',  body: null },
    { path: '/v1internal:fetchUserInfo',    method: 'POST', body: {} },
    { path: '/v1internal:retrieveUserQuota',method: 'POST', body: {} },
    { path: '/v1internal/cascadeNuxes',     method: 'GET',  body: null },
    { path: '/v1internal:countTokens',      method: 'POST', body: { contents: [{ role: 'user', parts: [{ text: 'hi' }] }] } },

    // Native connect-go handlers (from _LanguageServerService_X_Handler symbols)
    { path: '/exa.language_server_pb.LanguageServerService/GetModelStatuses', method: 'POST', body: {} },
    { path: '/exa.language_server_pb.LanguageServerService/GetModelResponse', method: 'POST', body: {} },

    // Connect variant (different path shape)
    { path: '/LanguageServerService/GetModelStatuses', method: 'POST', body: {} },
];

function call({ path, method, body }) {
    return new Promise((resolve) => {
        const payload = body ? Buffer.from(JSON.stringify(body)) : null;
        const headers = {
            'Authorization': TARGET.csrf,
            'x-csrf-token': TARGET.csrf,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (payload) headers['Content-Length'] = String(payload.byteLength);

        const req = https.request(
            { host: '127.0.0.1', port: TARGET.port, method, path, rejectUnauthorized: false, timeout: 6000, headers },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    const buf = Buffer.concat(chunks);
                    resolve({
                        status: res.statusCode,
                        ct: res.headers['content-type'],
                        headers: res.headers,
                        text: buf.toString('utf-8').slice(0, 2000),
                    });
                });
            },
        );
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.on('error', (err) => resolve({ error: err.message }));
        if (payload) req.write(payload);
        req.end();
    });
}

for (const r of ROUTES) {
    const resp = await call(r);
    console.log(`\n${r.method} ${r.path}`);
    if (resp.error) {
        console.log('  ERR', resp.error);
    } else {
        console.log(`  HTTP ${resp.status}  ct=${resp.ct}`);
        console.log('  body:', resp.text.replace(/\s+/g, ' ').slice(0, 600));
    }
}
