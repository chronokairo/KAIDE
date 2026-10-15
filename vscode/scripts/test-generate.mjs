/**
 * Generate endpoint tests — streaming and non-streaming.
 *
 * Usage:
 *   node scripts/test-generate.mjs [model] [base_url]
 *
 * Default model: first model from /api/tags (or pass explicitly)
 * Default base URL: http://127.0.0.1:11434
 */

const BASE = process.argv[3] || 'http://127.0.0.1:11434';
let MODEL = process.argv[2] || '';

let passed = 0;
let failed = 0;

function log(label, ok, detail = '') {
    const mark = ok ? '[PASS]' : '[FAIL]';
    console.log(`${mark} ${label}${detail ? ' -- ' + detail : ''}`);
    ok ? passed++ : failed++;
}

async function resolveModel() {
    if (MODEL) return;
    const res = await fetch(`${BASE}/api/tags`);
    const json = await res.json();
    const models = json.models ?? [];
    const real = models.find((m) => m.name !== 'auto');
    if (!real) {
        console.error('No models available.');
        process.exit(1);
    }
    MODEL = real.name;
}

async function postStream(path, body, onChunk) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (line.trim()) onChunk(JSON.parse(line));
        }
    }
    return res.status;
}

async function main() {
    console.log('=== Generate Endpoint Tests ===');
    console.log(`Target: ${BASE}`);

    try {
        await fetch(`${BASE}/`);
    } catch {
        console.error(`Cannot reach ${BASE}`);
        process.exit(1);
    }

    await resolveModel();
    console.log(`Model: ${MODEL}\n`);

    // 1. Generate non-streaming
    {
        console.log('  [1] Generate non-streaming...');
        const t0 = Date.now();
        const res = await fetch(`${BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                prompt: 'Reply with exactly one word: OK',
                stream: false,
            }),
        });
        const json = await res.json();
        const elapsed = Date.now() - t0;
        const ok = res.status === 200 && typeof json.response === 'string' && json.done === true;
        log('POST /api/generate (non-stream)', ok,
            `${elapsed}ms, response="${json.response?.slice(0, 60)}"`);
    }

    // 2. Generate streaming
    {
        console.log('  [2] Generate streaming...');
        let chunks = 0;
        let finalChunk = null;
        let assembled = '';
        const t0 = Date.now();

        const status = await postStream('/api/generate', {
            model: MODEL,
            prompt: 'Reply with exactly one word: OK',
            stream: true,
        }, (chunk) => {
            chunks++;
            assembled += chunk.response ?? '';
            if (chunk.done) finalChunk = chunk;
        });

        const elapsed = Date.now() - t0;
        const ok = status === 200 && finalChunk?.done === true && assembled.length > 0;
        log('POST /api/generate (stream)', ok,
            `${elapsed}ms, chunks=${chunks}, assembled="${assembled.slice(0, 60)}"`);
    }

    // 3. Generate with system prompt
    {
        console.log('  [3] Generate with system prompt...');
        const res = await fetch(`${BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                system: 'You are a pirate. Always say "Arrr!"',
                prompt: 'How are you?',
                stream: false,
            }),
        });
        const json = await res.json();
        const ok = res.status === 200 && json.done === true && json.response.length > 0;
        log('POST /api/generate (system)', ok,
            `response="${json.response?.slice(0, 80)}"`);
    }

    // 4. Timing metadata
    {
        console.log('  [4] Checking timing metadata...');
        const res = await fetch(`${BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                prompt: 'Say hi',
                stream: false,
            }),
        });
        const json = await res.json();
        const hasTiming = json.total_duration > 0 && json.eval_count > 0;
        log('POST /api/generate (timing)', res.status === 200 && hasTiming,
            `total_duration=${json.total_duration}, eval_count=${json.eval_count}`);
    }

    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Generate: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
