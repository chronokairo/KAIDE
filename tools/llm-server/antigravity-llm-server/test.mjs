/**
 * Test script for the Ollama-compatible LLM Server extension (Antigravity).
 *
 * Prerequisites:
 *   - Antigravity must be running with the antigravity-llm-server extension active
 *   - An LM provider must be configured
 *   - The server must be listening on 127.0.0.1:11434
 *
 * Run:
 *   node test.mjs
 */

const BASE = 'http://127.0.0.1:11434';

let passed = 0;
let failed = 0;

function log(label, ok, detail = '') {
    const mark = ok ? '[PASS]' : '[FAIL]';
    console.log(`${mark} ${label}${detail ? ' — ' + detail : ''}`);
    ok ? passed++ : failed++;
}

async function get(path) {
    const res = await fetch(`${BASE}${path}`);
    return { status: res.status, body: await res.text() };
}

async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.text(), contentType: res.headers.get('content-type') ?? '' };
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
            if (line.trim()) {
                const chunk = JSON.parse(line);
                onChunk(chunk);
            }
        }
    }
    return res.status;
}

// ─── Test 1: Root ping ────────────────────────────────────────────────────────
async function testRoot() {
    const { status, body } = await get('/');
    log('GET / (ping)', status === 200 && body.includes('Ollama'), `status=${status} body="${body}"`);
}

// ─── Test 2: Version ──────────────────────────────────────────────────────────
async function testVersion() {
    const { status, body } = await get('/api/version');
    const json = JSON.parse(body);
    log('GET /api/version', status === 200 && typeof json.version === 'string', `version=${json.version}`);
}

// ─── Test 3: List models (/api/tags) ──────────────────────────────────────────
async function testTags() {
    const { status, body } = await get('/api/tags');
    const json = JSON.parse(body);
    const ok = status === 200 && Array.isArray(json.models);
    log('GET /api/tags', ok, `${json.models?.length ?? 0} model(s) found`);
    if (ok && json.models.length > 0) {
        console.log('  Models:');
        for (const m of json.models) {
            console.log(`    - ${m.name} (${m.details.family})`);
        }
    }
    return json.models ?? [];
}

// ─── Test 4: OpenAI-compat model list ────────────────────────────────────────
async function testV1Models() {
    const { status, body } = await get('/v1/models');
    const json = JSON.parse(body);
    log('GET /v1/models', status === 200 && json.object === 'list' && Array.isArray(json.data),
        `${json.data?.length ?? 0} model(s)`);
}

// ─── Test 5: Show model ───────────────────────────────────────────────────────
async function testShow(modelName) {
    const { status, body } = await post('/api/show', { model: modelName });
    const json = JSON.parse(body);
    log('POST /api/show', status === 200 && json.details?.family,
        `family=${json.details?.family}`);
}

// ─── Test 6: Generate (non-streaming) ────────────────────────────────────────
async function testGenerate(modelName) {
    console.log(`\n  [generate] Sending prompt to ${modelName} (stream=false)...`);
    const { status, body } = await post('/api/generate', {
        model: modelName,
        prompt: 'Reply with exactly one word: OK',
        stream: false,
    });
    const json = JSON.parse(body);
    const ok = status === 200 && typeof json.response === 'string' && json.done === true;
    log('POST /api/generate (non-stream)', ok,
        `done=${json.done} response="${json.response?.slice(0, 60)}"`);
}

// ─── Test 7: Generate (streaming) ────────────────────────────────────────────
async function testGenerateStream(modelName) {
    console.log(`\n  [generate-stream] Streaming from ${modelName}...`);
    let chunks = 0;
    let finalChunk = null;
    let assembled = '';

    const status = await postStream(
        '/api/generate',
        { model: modelName, prompt: 'Reply with exactly one word: OK', stream: true },
        (chunk) => {
            chunks++;
            assembled += chunk.response ?? '';
            if (chunk.done) finalChunk = chunk;
        },
    );

    const ok = status === 200 && finalChunk?.done === true && assembled.length > 0;
    log('POST /api/generate (stream)', ok,
        `chunks=${chunks} assembled="${assembled.slice(0, 60)}" done_reason=${finalChunk?.done_reason}`);
}

// ─── Test 8: Chat (non-streaming) ────────────────────────────────────────────
async function testChat(modelName) {
    console.log(`\n  [chat] Sending chat to ${modelName} (stream=false)...`);
    const { status, body } = await post('/api/chat', {
        model: modelName,
        messages: [{ role: 'user', content: 'Reply with exactly one word: OK' }],
        stream: false,
    });
    const json = JSON.parse(body);
    const ok = status === 200 && json.done === true && json.message?.role === 'assistant';
    log('POST /api/chat (non-stream)', ok,
        `done=${json.done} content="${json.message?.content?.slice(0, 60)}"`);
}

// ─── Test 9: Chat (streaming) ────────────────────────────────────────────────
async function testChatStream(modelName) {
    console.log(`\n  [chat-stream] Streaming chat from ${modelName}...`);
    let chunks = 0;
    let finalChunk = null;
    let assembled = '';

    const status = await postStream(
        '/api/chat',
        {
            model: modelName,
            messages: [{ role: 'user', content: 'Reply with exactly one word: OK' }],
            stream: true,
        },
        (chunk) => {
            chunks++;
            assembled += chunk.message?.content ?? '';
            if (chunk.done) finalChunk = chunk;
        },
    );

    const ok = status === 200 && finalChunk?.done === true && assembled.length > 0;
    log('POST /api/chat (stream)', ok,
        `chunks=${chunks} assembled="${assembled.slice(0, 60)}" done_reason=${finalChunk?.done_reason}`);
}

// ─── Test 10: Chat with system message ───────────────────────────────────────
async function testChatSystem(modelName) {
    console.log(`\n  [chat-system] Testing system message with ${modelName}...`);
    const { status, body } = await post('/api/chat', {
        model: modelName,
        messages: [
            { role: 'system', content: 'You are a helpful assistant. Always be concise.' },
            { role: 'user', content: 'What is 2+2?' },
        ],
        stream: false,
    });
    const json = JSON.parse(body);
    const ok = status === 200 && json.done === true;
    log('POST /api/chat (system msg)', ok,
        `content="${json.message?.content?.slice(0, 80)}"`);
}

// ─── Test 11: Error cases ─────────────────────────────────────────────────────
async function testErrors() {
    // Unknown model
    const r1 = await post('/api/generate', { model: 'nonexistent-model-xyz', prompt: 'hi', stream: false });
    log('POST /api/generate unknown model -> 404', r1.status === 404, `status=${r1.status}`);

    // Bad JSON
    const res = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
    });
    log('POST /api/chat bad JSON -> 400', res.status === 400, `status=${res.status}`);

    // Embed -> 501
    const r3 = await post('/api/embed', { model: 'gemini-3-flash', input: 'hello' });
    log('POST /api/embed -> 501', r3.status === 501, `status=${r3.status}`);

    // Unknown endpoint -> 404
    const r4 = await get('/api/nonexistent');
    log('GET /api/nonexistent -> 404', r4.status === 404, `status=${r4.status}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('=== Antigravity LLM Server — Ollama API Tests ===\n');
    console.log(`Target: ${BASE}\n`);

    // First check connectivity
    try {
        await get('/');
    } catch (err) {
        console.error(`\nERROR: Cannot reach ${BASE}`);
        console.error('Make sure Antigravity is running with the antigravity-llm-server extension active.');
        console.error(`Details: ${err.message}`);
        process.exit(1);
    }

    await testRoot();
    await testVersion();

    const models = await testTags();
    await testV1Models();

    if (models.length === 0) {
        console.log('\nNo models available — skipping LLM tests.');
        console.log('Make sure your LM provider is configured.\n');
    } else {
        const modelName = models[0].name;
        console.log(`\nUsing model: ${modelName}\n`);

        await testShow(modelName);
        await testGenerate(modelName);
        await testGenerateStream(modelName);
        await testChat(modelName);
        await testChatStream(modelName);
        await testChatSystem(modelName);
    }

    await testErrors();

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
