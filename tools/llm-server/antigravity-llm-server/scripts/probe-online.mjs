#!/usr/bin/env node
// Online probe — uses info scraped from the running LS process argv.
// Pass the PID/csrf/ports via env or discover from `wmic`/`Get-CimInstance`.

import https from 'node:https';
import http from 'node:http';

const PID_PORTS = {
    // pid: { csrf, ports: [...] }
    1944:  { csrf: '0d070d69-edce-4e01-b904-a05f07a94e43', ports: [54586, 54587, 54594] },
    4248:  { csrf: 'eec78acd-063b-4215-b411-7e8275d4f522', ports: [52229, 52230] },
    58100: { csrf: '595840bb-625a-4d6a-af94-87d80116552e', ports: [49998, 49999, 50065] },
};

const SERVICES = [
    'exa.language_server_pb.LanguageServerService',
    'exa.chat_pb.ChatService',
    'exa.chat_web_server_pb.ChatWebServerService',
    'exa.cascade_pb.CascadeService',
    'exa.seat_management_pb.SeatManagementService',
    'exa.api_server_pb.ApiServerService',
];
const METHODS = ['GetProcessInfo', 'Heartbeat', 'ListModels', 'GetUserStatus', 'GetChatMessage'];

function encodeFrame(jsonBody) {
    const payload = Buffer.from(JSON.stringify(jsonBody));
    const header = Buffer.alloc(5);
    header[0] = 0;
    header.writeUInt32BE(payload.byteLength, 1);
    return Buffer.concat([header, payload]);
}

function tryCall(scheme, port, csrf, service, method) {
    return new Promise((resolve) => {
        const body = encodeFrame({});
        const lib = scheme === 'https' ? https : http;
        const req = lib.request(
            {
                host: '127.0.0.1',
                port,
                method: 'POST',
                path: `/${service}/${method}`,
                rejectUnauthorized: false,
                timeout: 2500,
                headers: {
                    'Content-Type': 'application/grpc-web+json',
                    'Accept': 'application/grpc-web+json',
                    'X-Grpc-Web': '1',
                    'Authorization': csrf,
                    'Content-Length': String(body.byteLength),
                },
            },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    const buf = Buffer.concat(chunks);
                    const grpcStatus = res.headers['grpc-status'] ?? res.trailers?.['grpc-status'];
                    const grpcMsg = res.headers['grpc-message'] ?? res.trailers?.['grpc-message'];
                    resolve({
                        httpStatus: res.statusCode,
                        contentType: res.headers['content-type'],
                        grpcStatus,
                        grpcMsg,
                        bodyHead: buf.subarray(0, 200).toString('utf-8').replace(/[^\x20-\x7e]/g, '.'),
                    });
                });
            },
        );
        req.on('timeout', () => { req.destroy(new Error('timeout')); });
        req.on('error', (err) => resolve({ error: err.message }));
        req.end(body);
    });
}

// 1) Probe ports: which scheme do they accept?
for (const [pid, info] of Object.entries(PID_PORTS)) {
    console.log(`\n### PID ${pid}  csrf=${info.csrf.slice(0,8)}...`);
    for (const port of info.ports) {
        for (const scheme of ['https', 'http']) {
            const r = await tryCall(scheme, port, info.csrf,
                'exa.language_server_pb.LanguageServerService', 'GetProcessInfo');
            if (r.error) {
                console.log(`  ${scheme}://127.0.0.1:${port}  → ${r.error}`);
            } else {
                console.log(`  ${scheme}://127.0.0.1:${port}  HTTP ${r.httpStatus}  ct=${r.contentType}  grpc=${r.grpcStatus} msg="${r.grpcMsg}"  body="${r.bodyHead.slice(0,120)}"`);
            }
        }
    }
}
