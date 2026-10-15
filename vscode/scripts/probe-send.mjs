#!/usr/bin/env node
import https from 'node:https';

const TARGET = { port: 54586, csrf: 'f2ba3518-0176-4118-bbf9-30aae6609d67' };
const SERVICE = 'exa.language_server_pb.LanguageServerService';

function call(method, body) {
    return new Promise((resolve) => {
        const payload = Buffer.from(JSON.stringify(body ?? {}));
        const req = https.request(
            { host: '127.0.0.1', port: TARGET.port, method: 'POST',
              path: `/${SERVICE}/${method}`,
              rejectUnauthorized: false, timeout: 30000,
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Connect-Protocol-Version': '1',
                  'x-codeium-csrf-token': TARGET.csrf,
                  'Content-Length': String(payload.byteLength),
              } },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve({
                    status: res.statusCode,
                    ct: res.headers['content-type'],
                    text: Buffer.concat(chunks).toString('utf-8'),
                }));
            },
        );
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.on('error', (err) => resolve({ error: err.message }));
        req.write(payload); req.end();
    });
}

// 1) Start a cascade
const start = await call('StartCascade', {});
console.log('[StartCascade]', start.text.slice(0, 300));
const startJson = JSON.parse(start.text);
const cascadeId = startJson.cascadeId;
console.log('cascadeId =', cascadeId);

// 2) Try sending with different field names
const attempts = [
    { cascadeId, content: 'Hello from probe' },
    { cascadeId, content: 'Hello from probe', userMessage: { content: 'Hello' } },
    { cascadeId, message: { content: 'Hello' } },
    { cascadeId, content: 'Hello', inputType: 'INPUT_TYPE_USER' },
    { cascadeId, content: 'Hello', model: 'MODEL_PLACEHOLDER_M47' },
    { cascadeId, content: 'Hello', modelConfig: { model: 'MODEL_PLACEHOLDER_M47' } },
];
for (const body of attempts) {
    const r = await call('SendUserCascadeMessage', body);
    console.log('\n[SendUserCascadeMessage]', JSON.stringify(body).slice(0,120));
    console.log('  ', r.status, r.text.slice(0, 350));
}

// 3) Try the StreamCascadeReactiveUpdates subscription endpoint (just check it answers)
const stream = await call('StreamCascadeReactiveUpdates', { cascadeId });
console.log('\n[StreamCascadeReactiveUpdates]', stream.status, stream.text.slice(0, 600));
