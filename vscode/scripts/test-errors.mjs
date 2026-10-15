/**
 * Error handling and edge case tests — no LLM calls needed.
 *
 * Usage:
 *   node scripts/test-errors.mjs [base_url]
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

async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    });
    return { status: res.status, body: await res.text() };
}

async function main() {
    console.log('=== Error Handling Tests ===');
    console.log(`Target: ${BASE}\n`);

    try {
        await fetch(`${BASE}/`);
    } catch {
        console.error(`Cannot reach ${BASE}`);
        process.exit(1);
    }

    // 1. Unknown model -> 404
    {
        const r = await post('/api/generate', { model: 'nonexistent-model-xyz', prompt: 'hi', stream: false });
        const json = JSON.parse(r.body);
        log('Unknown model -> 404', r.status === 404 && json.error, `error="${json.error?.slice(0, 60)}"`);
    }

    // 2. Bad JSON -> 400
    {
        const res = await fetch(`${BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'this is not json',
        });
        log('Bad JSON -> 400', res.status === 400);
    }

    // 3. Empty messages array -> 400
    {
        const r = await post('/api/chat', { model: 'auto', messages: [] });
        log('Empty messages -> 400', r.status === 400);
    }

    // 4. Missing messages -> 400
    {
        const r = await post('/api/chat', { model: 'auto' });
        log('Missing messages -> 400', r.status === 400);
    }

    // 5. Embed -> 501
    {
        const r = await post('/api/embed', { model: 'gemini-3-flash', input: 'hello' });
        log('Embed -> 501', r.status === 501);
    }

    // 6. Pull -> 501
    {
        const r = await post('/api/pull', { name: 'llama3' });
        log('Pull -> 501', r.status === 501);
    }

    // 7. Push -> 501
    {
        const r = await post('/api/push', { name: 'test' });
        log('Push -> 501', r.status === 501);
    }

    // 8. Copy -> 501
    {
        const r = await post('/api/copy', { source: 'a', destination: 'b' });
        log('Copy -> 501', r.status === 501);
    }

    // 9. Create -> 501
    {
        const r = await post('/api/create', { name: 'test', modelfile: 'FROM test' });
        log('Create -> 501', r.status === 501);
    }

    // 10. Delete -> 501
    {
        const res = await fetch(`${BASE}/api/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'test' }),
        });
        log('Delete -> 501', res.status === 501);
    }

    // 11. Unknown endpoint -> 404
    {
        const res = await fetch(`${BASE}/api/nonexistent`);
        log('Unknown endpoint -> 404', res.status === 404);
    }

    // 12. Show missing model field -> 400
    {
        const r = await post('/api/show', {});
        log('Show no model -> 400', r.status === 400);
    }

    // 13. Show unknown model -> 404
    {
        const r = await post('/api/show', { model: 'nonexistent-xyz' });
        log('Show unknown model -> 404', r.status === 404);
    }

    // 14. Show "auto" model -> 200
    {
        const r = await post('/api/show', { model: 'auto' });
        const json = JSON.parse(r.body);
        log('Show auto model -> 200',
            r.status === 200 && json.details?.family === 'auto',
            `family=${json.details?.family}`);
    }

    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Errors: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
