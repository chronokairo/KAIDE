/**
 * Quick smoke test — verifies the server is alive and models are listed.
 *
 * Usage:
 *   node scripts/test-smoke.mjs [base_url]
 *
 * Default base URL: http://127.0.0.1:11434
 */

const BASE = process.argv[2] || 'http://127.0.0.1:11434';

let passed = 0;
let failed = 0;

function log(label, ok, detail = '') {
    const mark = ok ? '[PASS]' : '[FAIL]';
    console.log(`${mark} ${label}${detail ? ' -- ' + detail : ''}`);
    ok ? passed++ : failed++;
}

async function main() {
    console.log('=== Smoke Test ===');
    console.log(`Target: ${BASE}\n`);

    // 1. Ping
    try {
        const res = await fetch(`${BASE}/`);
        const body = await res.text();
        log('GET / (ping)', res.status === 200 && body.includes('Ollama'), `"${body}"`);
    } catch (err) {
        console.error(`Cannot reach ${BASE} -- is the server running?`);
        console.error(err.message);
        process.exit(1);
    }

    // 2. Version
    {
        const res = await fetch(`${BASE}/api/version`);
        const json = await res.json();
        log('GET /api/version', res.status === 200 && json.version, `v${json.version}`);
    }

    // 3. List models (Ollama)
    {
        const res = await fetch(`${BASE}/api/tags`);
        const json = await res.json();
        const count = json.models?.length ?? 0;
        log('GET /api/tags', res.status === 200 && count > 0, `${count} model(s)`);
        if (count > 0) {
            console.log('  Available models:');
            for (const m of json.models) {
                console.log(`    - ${m.name} (family=${m.details.family}, ctx=${m.details.parameter_size})`);
            }
        }
    }

    // 4. List models (OpenAI)
    {
        const res = await fetch(`${BASE}/v1/models`);
        const json = await res.json();
        log('GET /v1/models', res.status === 200 && json.object === 'list', `${json.data?.length} model(s)`);
    }

    // 5. HEAD /
    {
        const res = await fetch(`${BASE}/`, { method: 'HEAD' });
        log('HEAD / (liveness)', res.status === 200);
    }

    // 6. CORS headers
    {
        const res = await fetch(`${BASE}/`, { method: 'OPTIONS' });
        const allow = res.headers.get('access-control-allow-origin');
        log('OPTIONS / (CORS)', res.status === 204 && allow === '*', `ACAO=${allow}`);
    }

    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Smoke: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
