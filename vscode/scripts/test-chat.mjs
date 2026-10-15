/**
 * Chat endpoint tests — streaming and non-streaming using actual LLM calls.
 *
 * Usage:
 *   node scripts/test-chat.mjs [model] [base_url]
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
    // Skip the "auto" virtual model, pick the first real one
    const real = models.find((m) => m.name !== 'auto');
    if (!real) {
        console.error('No models available. Ensure the LLM server is running with models.');
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
    console.log('=== Chat Endpoint Tests ===');
    console.log(`Target: ${BASE}`);

    // Check connectivity
    try {
        await fetch(`${BASE}/`);
    } catch {
        console.error(`Cannot reach ${BASE}`);
        process.exit(1);
    }

    await resolveModel();
    console.log(`Model: ${MODEL}\n`);

    // 1. Chat non-streaming
    {
        console.log('  [1] Chat non-streaming...');
        const t0 = Date.now();
        const res = await fetch(`${BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: 'Reply with exactly one word: OK' }],
                stream: false,
            }),
        });
        const json = await res.json();
        const elapsed = Date.now() - t0;
        const ok = res.status === 200 && json.done === true && json.message?.role === 'assistant';
        log('POST /api/chat (non-stream)', ok,
            `${elapsed}ms, content="${json.message?.content?.slice(0, 80)}"`);
    }

    // 2. Chat streaming
    {
        console.log('  [2] Chat streaming...');
        let chunks = 0;
        let finalChunk = null;
        let assembled = '';
        const t0 = Date.now();

        const status = await postStream('/api/chat', {
            model: MODEL,
            messages: [{ role: 'user', content: 'Reply with exactly one word: OK' }],
            stream: true,
        }, (chunk) => {
            chunks++;
            assembled += chunk.message?.content ?? '';
            if (chunk.done) finalChunk = chunk;
        });

        const elapsed = Date.now() - t0;
        const ok = status === 200 && finalChunk?.done === true && assembled.length > 0;
        log('POST /api/chat (stream)', ok,
            `${elapsed}ms, chunks=${chunks}, assembled="${assembled.slice(0, 80)}"`);
    }

    // 3. Chat with system message
    {
        console.log('  [3] Chat with system message...');
        const res = await fetch(`${BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: 'You are a calculator. Only output numbers.' },
                    { role: 'user', content: 'What is 2+2?' },
                ],
                stream: false,
            }),
        });
        const json = await res.json();
        const ok = res.status === 200 && json.done === true;
        log('POST /api/chat (system msg)', ok,
            `content="${json.message?.content?.slice(0, 80)}"`);
    }

    // 4. Chat multi-turn
    {
        console.log('  [4] Chat multi-turn...');
        const res = await fetch(`${BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'user', content: 'My name is Alice.' },
                    { role: 'assistant', content: 'Nice to meet you, Alice!' },
                    { role: 'user', content: 'What is my name?' },
                ],
                stream: false,
            }),
        });
        const json = await res.json();
        const hasAlice = json.message?.content?.toLowerCase().includes('alice');
        log('POST /api/chat (multi-turn)', res.status === 200 && json.done && hasAlice,
            `content="${json.message?.content?.slice(0, 80)}"`);
    }

    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Chat: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
