#!/usr/bin/env node
// Probe the most promising chat/model-related handlers.
import https from 'node:https';

const TARGET = { port: 54586, csrf: 'f2ba3518-0176-4118-bbf9-30aae6609d67' };
const SERVICE = 'exa.language_server_pb.LanguageServerService';

const METHODS = [
    'GetAvailableModels',
    'GetCascadeModelConfigs',
    'GetCascadeModelConfigData',
    'GetCommandModelConfigs',
    'GetUserSettings',
    'GetUserStatus',
    'GetStatus',
    'FetchUserInfo',
    'GetUnleashData',
    'GetTokenBase',
    'GetAllRules',
    'GetAllSkills',
    'GetAllWorkflows',
    'GetAllPlugins',
    'GetWorkspaceInfos',
    'GetCascadeNuxes',
    'StartCascade',
    'SendUserCascadeMessage',
    'GetAllCascadeTrajectories',
    'LoadTrajectory',
];

function call(method, body) {
    return new Promise((resolve) => {
        const payload = Buffer.from(JSON.stringify(body ?? {}));
        const req = https.request(
            {
                host: '127.0.0.1', port: TARGET.port, method: 'POST',
                path: `/${SERVICE}/${method}`,
                rejectUnauthorized: false, timeout: 10000,
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
                    resolve({
                        status: res.statusCode,
                        text: Buffer.concat(chunks).toString('utf-8'),
                    });
                });
            },
        );
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.on('error', (err) => resolve({ error: err.message }));
        req.write(payload); req.end();
    });
}

for (const m of METHODS) {
    const r = await call(m, {});
    if (r.error) { console.log(`${m.padEnd(30)} ERR ${r.error}`); continue; }
    const snippet = (r.text || '').replace(/\s+/g, ' ').slice(0, 500);
    console.log(`${m.padEnd(30)} ${r.status}  ${snippet}`);
}
