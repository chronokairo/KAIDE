/**
 * Auto-routing model test — verifies the "auto" virtual model works.
 *
 * Usage:
 *   node scripts/test-auto.mjs [base_url]
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
    console.log('=== Auto-Routing Tests ===');
    console.log(`Target: ${BASE}\n`);

    try {
        await fetch(`${BASE}/`);
    } catch {
        console.error(`Cannot reach ${BASE}`);
        process.exit(1);
    }

    // 1. Verify "auto" appears in model list
    {
        const res = await fetch(`${BASE}/api/tags`);
        const json = await res.json();
        const hasAuto = json.models?.some((m) => m.name === 'auto');
        log('Auto model in /api/tags', hasAuto, `found=${hasAuto}`);
    }

    // 2. Show auto model details
    {
        const res = await fetch(`${BASE}/api/show`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'auto' }),
        });
        const json = await res.json();
        log('Show auto model', res.status === 200 && json.details?.format === 'router',
            `format=${json.details?.format}, parent=${json.details?.parent_model}`);
    }

    // 3. Auto-routed chat (non-streaming)
    {
        console.log('  [3] Auto-routing chat request...');
        const t0 = Date.now();
        const res = await fetch(`${BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'auto',
                messages: [{ role: 'user', content: 'What is 2+2? Reply with just the number.' }],
                stream: false,
            }),
        });
        const json = await res.json();
        const elapsed = Date.now() - t0;
        const ok = res.status === 200 && json.done === true && json.message?.content;
        log('POST /api/chat auto (non-stream)', ok,
            `${elapsed}ms, model=${json.model}, content="${json.message?.content?.slice(0, 60)}"`);
    }

    // 4. Auto-routed generate (non-streaming)
    {
        console.log('  [4] Auto-routing generate request...');
        const t0 = Date.now();
        const res = await fetch(`${BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'auto',
                prompt: 'Write a haiku about coffee.',
                stream: false,
            }),
        });
        const json = await res.json();
        const elapsed = Date.now() - t0;
        const ok = res.status === 200 && json.done === true && json.response?.length > 0;
        log('POST /api/generate auto (non-stream)', ok,
            `${elapsed}ms, model=${json.model}, response="${json.response?.slice(0, 80)}"`);
    }

    // 5. Auto-routed chat (streaming)
    {
        console.log('  [5] Auto-routing chat streaming...');
        let chunks = 0;
        let assembled = '';
        let finalChunk = null;
        const t0 = Date.now();

        const res = await fetch(`${BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'auto',
                messages: [{ role: 'user', content: 'Say hello in three languages.' }],
                stream: true,
            }),
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
                    chunks++;
                    assembled += chunk.message?.content ?? '';
                    if (chunk.done) finalChunk = chunk;
                }
            }
        }

        const elapsed = Date.now() - t0;
        const ok = res.status === 200 && finalChunk?.done === true && assembled.length > 0;
        log('POST /api/chat auto (stream)', ok,
            `${elapsed}ms, chunks=${chunks}, model=${finalChunk?.model}`);
    }

    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Auto: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
