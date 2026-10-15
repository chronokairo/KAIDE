import * as http from 'http';
import * as vscode from 'vscode';
import {
    findModel,
    isAutoModel,
    listAntigravityModels,
    modelToOllamaName,
    routeAuto,
    toVSCodeMessages,
    countMessageChars,
    AUTO_MODEL_NAME,
    ROUTER_MODEL_FAMILY,
    resolveCascadeModel,
    runChatViaLanguageServer,
    routeAutoViaLanguageServer,
    chunkText,
    type ResolvedCascadeModel,
} from './modelBridge';
import type {
    OllamaChatChunk,
    OllamaChatMessage,
    OllamaChatRequest,
    OllamaGenerateChunk,
    OllamaGenerateRequest,
    OllamaShowRequest,
    OllamaShowResponse,
    OllamaTagsResponse,
    OllamaVersionResponse,
} from './types';

const SERVER_VERSION = '0.1.0';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk: Buffer) => {
            data += chunk.toString();
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
    if (res.writableEnded) return;
    const json = JSON.stringify(body);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(json),
    });
    res.end(json);
}

function sendError(res: http.ServerResponse, status: number, message: string): void {
    sendJson(res, status, { error: message });
}

function nowNano(): number {
    return Number(process.hrtime.bigint());
}

// ─── Language-server (Cascade) backend ────────────────────────────────────────

/**
 * Runs a chat request against the local Antigravity language server and
 * writes an Ollama-compatible response (NDJSON stream or one-shot JSON).
 *
 * Used when the requested model resolves to a Cascade model, which covers
 * every scenario where the editor's `vscode.lm` registry is empty (as is
 * the case inside Antigravity itself).
 */
async function respondFromLanguageServer(opts: {
    res: http.ServerResponse;
    mode: 'chat' | 'generate';
    stream: boolean;
    model: ResolvedCascadeModel;
    modelOllamaName: string;
    messages: import('./types').OllamaChatMessage[];
    promptChars: number;
    startNs: number;
    signal?: AbortSignal;
    output: vscode.OutputChannel;
}): Promise<void> {
    const { res, mode, stream, model, modelOllamaName, messages, promptChars, startNs, signal, output } = opts;

    let text: string;
    try {
        text = await runChatViaLanguageServer({
            cascadeModelId: model.modelId,
            messages,
            signal,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        output.appendLine(`[/api/${mode}] LS backend error: ${msg}`);
        if (!res.headersSent) {
            sendError(res, 502, `language server call failed: ${msg}`);
        } else {
            res.end();
        }
        return;
    }

    if (!stream) {
        const totalNs = nowNano() - startNs;
        if (mode === 'chat') {
            const body: import('./types').OllamaChatChunk = {
                model: modelOllamaName,
                created_at: new Date().toISOString(),
                message: { role: 'assistant', content: text },
                done: true,
                done_reason: 'stop',
                total_duration: totalNs,
                load_duration: 0,
                prompt_eval_count: promptChars,
                prompt_eval_duration: Math.floor(totalNs * 0.1),
                eval_count: text.split(/\s+/).filter(Boolean).length,
                eval_duration: Math.floor(totalNs * 0.9),
            };
            sendJson(res, 200, body);
        } else {
            const body: import('./types').OllamaGenerateChunk = {
                model: modelOllamaName,
                created_at: new Date().toISOString(),
                response: text,
                done: true,
                done_reason: 'stop',
                total_duration: totalNs,
                load_duration: 0,
                prompt_eval_count: promptChars,
                prompt_eval_duration: Math.floor(totalNs * 0.1),
                eval_count: text.split(/\s+/).filter(Boolean).length,
                eval_duration: Math.floor(totalNs * 0.9),
            };
            sendJson(res, 200, body);
        }
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
    });

    let evalCount = 0;
    for (const piece of chunkText(text)) {
        evalCount++;
        if (mode === 'chat') {
            const part: import('./types').OllamaChatChunk = {
                model: modelOllamaName,
                created_at: new Date().toISOString(),
                message: { role: 'assistant', content: piece },
                done: false,
            };
            res.write(JSON.stringify(part) + '\n');
        } else {
            const part: import('./types').OllamaGenerateChunk = {
                model: modelOllamaName,
                created_at: new Date().toISOString(),
                response: piece,
                done: false,
            };
            res.write(JSON.stringify(part) + '\n');
        }
    }

    const totalNs = nowNano() - startNs;
    if (mode === 'chat') {
        const final: import('./types').OllamaChatChunk = {
            model: modelOllamaName,
            created_at: new Date().toISOString(),
            message: { role: 'assistant', content: '' },
            done: true,
            done_reason: 'stop',
            total_duration: totalNs,
            load_duration: 0,
            prompt_eval_count: promptChars,
            prompt_eval_duration: Math.floor(totalNs * 0.1),
            eval_count: evalCount,
            eval_duration: Math.floor(totalNs * 0.9),
        };
        res.write(JSON.stringify(final) + '\n');
    } else {
        const final: import('./types').OllamaGenerateChunk = {
            model: modelOllamaName,
            created_at: new Date().toISOString(),
            response: '',
            done: true,
            done_reason: 'stop',
            total_duration: totalNs,
            load_duration: 0,
            prompt_eval_count: promptChars,
            prompt_eval_duration: Math.floor(totalNs * 0.1),
            eval_count: evalCount,
            eval_duration: Math.floor(totalNs * 0.9),
        };
        res.write(JSON.stringify(final) + '\n');
    }
    res.end();
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleTags(res: http.ServerResponse): Promise<void> {
    const models = await listAntigravityModels();
    const body: OllamaTagsResponse = { models };
    sendJson(res, 200, body);
}

function handleVersion(res: http.ServerResponse): void {
    const body: OllamaVersionResponse = { version: SERVER_VERSION };
    sendJson(res, 200, body);
}

async function handleGenerate(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    output: vscode.OutputChannel,
): Promise<void> {
    const raw = await readBody(req);
    let payload: OllamaGenerateRequest;
    try {
        payload = JSON.parse(raw);
    } catch {
        sendError(res, 400, 'invalid JSON in request body');
        return;
    }

    const stream = payload.stream !== false;
    const startNs = nowNano();
    const cts = new vscode.CancellationTokenSource();

    // Build the message list once; we may dispatch it either to the LS
    // backend or to vscode.lm depending on which one knows the model.
    const ollamaMessages: import('./types').OllamaChatMessage[] = [];
    if (payload.system) {
        ollamaMessages.push({ role: 'system', content: payload.system });
    }
    ollamaMessages.push({ role: 'user', content: payload.prompt ?? '' });

    // LS-backed path: matches ALL Cascade models (and is the only backend
    // available when Antigravity's vscode.lm registry is empty).
    if (!isAutoModel(payload.model)) {
        const cascade = await resolveCascadeModel(payload.model);
        if (cascade) {
            output.appendLine(
                `[/api/generate] LS backend: ${cascade.family} (${cascade.modelId})`,
            );
            await respondFromLanguageServer({
                res,
                mode: 'generate',
                stream,
                model: cascade,
                modelOllamaName: `${cascade.family}:antigravity`,
                messages: ollamaMessages,
                promptChars: countMessageChars(ollamaMessages),
                startNs,
                output,
            });
            cts.dispose();
            return;
        }
    } else {
        // "auto" via LS backend whenever vscode.lm is empty.
        const lmModels = await vscode.lm.selectChatModels();
        if (lmModels.length === 0) {
            try {
                const routed = await routeAutoViaLanguageServer(ollamaMessages);
                output.appendLine(
                    `[/api/generate] LS auto-routed to '${routed.selectedModelName}'`,
                );
                await respondFromLanguageServer({
                    res,
                    mode: 'generate',
                    stream,
                    model: routed.model,
                    modelOllamaName: `${routed.model.family}:antigravity`,
                    messages: routed.messages,
                    promptChars: countMessageChars(routed.messages),
                    startNs,
                    output,
                });
                cts.dispose();
                return;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                output.appendLine(`[/api/generate] LS auto-route failed: ${msg}`);
                sendError(res, 500, `auto routing failed: ${msg}`);
                cts.dispose();
                return;
            }
        }
    }

    let model: vscode.LanguageModelChat;
    let messages: vscode.LanguageModelChatMessage[];

    try {
        if (isAutoModel(payload.model)) {
            const autoResult = await routeAuto(ollamaMessages, cts.token);
            model = autoResult.model;
            messages = autoResult.messages;
            output.appendLine(`[/api/generate] auto-routed to '${autoResult.selectedModelName}'`);
        } else {
            const found = await findModel(payload.model);
            if (!found) {
                sendError(res, 404, `model '${payload.model}' not found, try pulling it first`);
                cts.dispose();
                return;
            }
            model = found;
            messages = [];
            if (payload.system) {
                messages.push(vscode.LanguageModelChatMessage.User(payload.system));
                messages.push(vscode.LanguageModelChatMessage.Assistant('Understood.'));
            }
            messages.push(vscode.LanguageModelChatMessage.User(payload.prompt ?? ''));
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        output.appendLine(`[/api/generate] Routing error: ${msg}`);
        sendError(res, 500, `routing failed: ${msg}`);
        cts.dispose();
        return;
    }

    try {
        const lmResponse = await model.sendRequest(
            messages,
            { justification: 'Antigravity LLM Server /api/generate request' },
            cts.token,
        );

        const promptChars = messages.reduce((s, m) => s + String(m.content).length, 0);
        const modelName = modelToOllamaName(model);

        if (stream) {
            res.writeHead(200, {
                'Content-Type': 'application/x-ndjson',
                'Transfer-Encoding': 'chunked',
            });

            let evalCount = 0;
            for await (const text of lmResponse.text) {
                evalCount++;
                const part: OllamaGenerateChunk = {
                    model: modelName,
                    created_at: new Date().toISOString(),
                    response: text,
                    done: false,
                };
                res.write(JSON.stringify(part) + '\n');
            }

            const totalNs = nowNano() - startNs;
            const finalChunk: OllamaGenerateChunk = {
                model: modelName,
                created_at: new Date().toISOString(),
                response: '',
                done: true,
                done_reason: 'stop',
                total_duration: totalNs,
                load_duration: 0,
                prompt_eval_count: promptChars,
                prompt_eval_duration: Math.floor(totalNs * 0.1),
                eval_count: evalCount,
                eval_duration: Math.floor(totalNs * 0.9),
            };
            res.write(JSON.stringify(finalChunk) + '\n');
            res.end();
        } else {
            let fullText = '';
            for await (const text of lmResponse.text) {
                fullText += text;
            }

            const totalNs = nowNano() - startNs;
            const result: OllamaGenerateChunk = {
                model: modelName,
                created_at: new Date().toISOString(),
                response: fullText,
                done: true,
                done_reason: 'stop',
                total_duration: totalNs,
                load_duration: 0,
                prompt_eval_count: promptChars,
                prompt_eval_duration: Math.floor(totalNs * 0.1),
                eval_count: fullText.split(/\s+/).length,
                eval_duration: Math.floor(totalNs * 0.9),
            };
            sendJson(res, 200, result);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(`[/api/generate] Error: ${message}`);
        if (!res.headersSent) {
            sendError(res, 500, `generation failed: ${message}`);
        } else {
            res.end();
        }
    } finally {
        cts.dispose();
    }
}

async function handleChat(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    output: vscode.OutputChannel,
): Promise<void> {
    const raw = await readBody(req);
    let payload: OllamaChatRequest;
    try {
        payload = JSON.parse(raw);
    } catch {
        sendError(res, 400, 'invalid JSON in request body');
        return;
    }

    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
        sendError(res, 400, 'messages array is required and must not be empty');
        return;
    }

    const stream = payload.stream !== false;
    const startNs = nowNano();
    const cts = new vscode.CancellationTokenSource();

    // LS-backed path: takes priority for any Cascade-registered model, and
    // is the only backend available inside Antigravity (vscode.lm empty).
    if (!isAutoModel(payload.model)) {
        const cascade = await resolveCascadeModel(payload.model);
        if (cascade) {
            output.appendLine(
                `[/api/chat] LS backend: ${cascade.family} (${cascade.modelId})`,
            );
            await respondFromLanguageServer({
                res,
                mode: 'chat',
                stream,
                model: cascade,
                modelOllamaName: `${cascade.family}:antigravity`,
                messages: payload.messages,
                promptChars: countMessageChars(payload.messages),
                startNs,
                output,
            });
            cts.dispose();
            return;
        }
    } else {
        const lmModels = await vscode.lm.selectChatModels();
        if (lmModels.length === 0) {
            try {
                const routed = await routeAutoViaLanguageServer(payload.messages);
                output.appendLine(
                    `[/api/chat] LS auto-routed to '${routed.selectedModelName}'`,
                );
                await respondFromLanguageServer({
                    res,
                    mode: 'chat',
                    stream,
                    model: routed.model,
                    modelOllamaName: `${routed.model.family}:antigravity`,
                    messages: routed.messages,
                    promptChars: countMessageChars(routed.messages),
                    startNs,
                    output,
                });
                cts.dispose();
                return;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                output.appendLine(`[/api/chat] LS auto-route failed: ${msg}`);
                sendError(res, 500, `auto routing failed: ${msg}`);
                cts.dispose();
                return;
            }
        }
    }

    let model: vscode.LanguageModelChat;
    let messages: vscode.LanguageModelChatMessage[];

    try {
        if (isAutoModel(payload.model)) {
            const autoResult = await routeAuto(payload.messages, cts.token);
            model = autoResult.model;
            messages = autoResult.messages;
            output.appendLine(`[/api/chat] auto-routed to '${autoResult.selectedModelName}'`);
        } else {
            const found = await findModel(payload.model);
            if (!found) {
                sendError(res, 404, `model '${payload.model}' not found, try pulling it first`);
                cts.dispose();
                return;
            }
            model = found;
            messages = toVSCodeMessages(payload.messages);
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        output.appendLine(`[/api/chat] Routing error: ${msg}`);
        sendError(res, 500, `routing failed: ${msg}`);
        cts.dispose();
        return;
    }

    if (messages.length === 0) {
        sendError(res, 400, 'no valid messages after filtering');
        cts.dispose();
        return;
    }

    try {
        const lmResponse = await model.sendRequest(
            messages,
            { justification: 'Antigravity LLM Server /api/chat request' },
            cts.token,
        );

        const promptChars = countMessageChars(payload.messages);
        const modelName = modelToOllamaName(model);

        if (stream) {
            res.writeHead(200, {
                'Content-Type': 'application/x-ndjson',
                'Transfer-Encoding': 'chunked',
            });

            let evalCount = 0;
            for await (const text of lmResponse.text) {
                evalCount++;
                const part: OllamaChatChunk = {
                    model: modelName,
                    created_at: new Date().toISOString(),
                    message: { role: 'assistant', content: text },
                    done: false,
                };
                res.write(JSON.stringify(part) + '\n');
            }

            const totalNs = nowNano() - startNs;
            const finalChunk: OllamaChatChunk = {
                model: modelName,
                created_at: new Date().toISOString(),
                message: { role: 'assistant', content: '' },
                done: true,
                done_reason: 'stop',
                total_duration: totalNs,
                load_duration: 0,
                prompt_eval_count: promptChars,
                prompt_eval_duration: Math.floor(totalNs * 0.1),
                eval_count: evalCount,
                eval_duration: Math.floor(totalNs * 0.9),
            };
            res.write(JSON.stringify(finalChunk) + '\n');
            res.end();
        } else {
            let fullText = '';
            for await (const text of lmResponse.text) {
                fullText += text;
            }

            const totalNs = nowNano() - startNs;
            const result: OllamaChatChunk = {
                model: modelName,
                created_at: new Date().toISOString(),
                message: { role: 'assistant', content: fullText },
                done: true,
                done_reason: 'stop',
                total_duration: totalNs,
                load_duration: 0,
                prompt_eval_count: promptChars,
                prompt_eval_duration: Math.floor(totalNs * 0.1),
                eval_count: fullText.split(/\s+/).length,
                eval_duration: Math.floor(totalNs * 0.9),
            };
            sendJson(res, 200, result);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(`[/api/chat] Error: ${message}`);
        if (!res.headersSent) {
            sendError(res, 500, `chat failed: ${message}`);
        } else {
            res.end();
        }
    } finally {
        cts.dispose();
    }
}

async function handleShow(
    req: http.IncomingMessage,
    res: http.ServerResponse,
): Promise<void> {
    const raw = await readBody(req);
    let payload: OllamaShowRequest;
    try {
        payload = JSON.parse(raw || '{}');
    } catch {
        sendError(res, 400, 'invalid JSON in request body');
        return;
    }

    if (!payload.model) {
        sendError(res, 400, 'model field is required');
        return;
    }

    if (isAutoModel(payload.model)) {
        const body: OllamaShowResponse = {
            details: {
                parent_model: ROUTER_MODEL_FAMILY,
                format: 'router',
                family: AUTO_MODEL_NAME,
                families: [AUTO_MODEL_NAME],
                parameter_size: 'router',
                quantization_level: 'none',
            },
            modelfile: `# Auto model router\n# Uses ${ROUTER_MODEL_FAMILY} to improve prompts and select the best model\n`,
            template: '{{ .Prompt }}',
            modelinfo: {
                'general.architecture': 'router',
                'general.name': 'Auto Router',
                'general.family': AUTO_MODEL_NAME,
                'general.vendor': 'antigravity-llm-server',
                'general.version': '1',
                'llm.context_length': 0,
            },
        };
        sendJson(res, 200, body);
        return;
    }

    const model = await findModel(payload.model);
    if (!model) {
        // Fall back to the LS-backed Cascade model registry.
        const cascade = await resolveCascadeModel(payload.model);
        if (cascade) {
            const body: OllamaShowResponse = {
                details: {
                    parent_model: '',
                    format: 'api',
                    family: cascade.family,
                    families: [cascade.family],
                    parameter_size: 'cascade',
                    quantization_level: 'none',
                },
                modelfile: `# ${cascade.label} via Antigravity language server\nFROM antigravity/cascade/${cascade.modelId}\n`,
                template: '{{ .Prompt }}',
                modelinfo: {
                    'general.architecture': 'api',
                    'general.name': cascade.label,
                    'general.family': cascade.family,
                    'general.vendor': 'antigravity',
                    'general.version': '1',
                    'cascade.model_id': cascade.modelId,
                },
            };
            sendJson(res, 200, body);
            return;
        }
        sendError(res, 404, `model '${payload.model}' not found`);
        return;
    }

    const body: OllamaShowResponse = {
        details: {
            parent_model: '',
            format: 'api',
            family: model.family,
            families: [model.family],
            parameter_size: model.maxInputTokens > 0 ? `${model.maxInputTokens}ctx` : 'unknown',
            quantization_level: 'none',
        },
        modelfile: `# ${model.family} via Antigravity LM API\nFROM antigravity/${model.vendor}/${model.family}\n`,
        template: '{{ .Prompt }}',
        modelinfo: {
            'general.architecture': 'api',
            'general.name': model.name,
            'general.family': model.family,
            'general.vendor': model.vendor,
            'general.version': model.version,
            'llm.context_length': model.maxInputTokens,
        },
    };
    sendJson(res, 200, body);
}

function handleEmbed(res: http.ServerResponse): void {
    sendError(res, 501, 'embeddings are not supported via Antigravity LM API');
}

// ─── Server factory ───────────────────────────────────────────────────────────

export function createServer(output: vscode.OutputChannel): http.Server {
    const server = http.createServer(async (req, res) => {
        // Basic CORS for local tooling (e.g. Open WebUI, Ollama clients)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        const method = req.method ?? 'GET';
        const url = (req.url ?? '/').split('?')[0]; // strip query params

        output.appendLine(`[server] ${method} ${url}`);

        if (method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        try {
            // Root ping (Ollama compatibility check)
            if (method === 'GET' && url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Ollama is running');
                return;
            }

            if (method === 'HEAD' && url === '/') {
                res.writeHead(200);
                res.end();
                return;
            }

            if (method === 'GET' && url === '/api/version') {
                handleVersion(res);
                return;
            }

            // List models — Ollama uses /api/tags; OpenAI compat uses /v1/models
            if (method === 'GET' && (url === '/api/tags' || url === '/api/models')) {
                await handleTags(res);
                return;
            }

            // OpenAI-compatible models list (used by many Ollama clients)
            if (method === 'GET' && url === '/v1/models') {
                const models = await listAntigravityModels();
                sendJson(res, 200, {
                    object: 'list',
                    data: models.map((m) => ({
                        id: m.name,
                        object: 'model',
                        created: Math.floor(Date.now() / 1000),
                        owned_by: m.details.family,
                    })),
                });
                return;
            }

            if (method === 'POST' && url === '/api/generate') {
                await handleGenerate(req, res, output);
                return;
            }

            if (method === 'POST' && url === '/api/chat') {
                await handleChat(req, res, output);
                return;
            }

            if (method === 'POST' && url === '/api/show') {
                await handleShow(req, res);
                return;
            }

            if (method === 'POST' && url === '/api/embed') {
                handleEmbed(res);
                return;
            }

            // Debug endpoint — sends first 3 raw stream parts as JSON
            if (method === 'POST' && url === '/api/debug') {
                const raw = await readBody(req);
                let modelName = 'gemini-3-flash';
                try { modelName = (JSON.parse(raw) as { model?: string }).model ?? modelName; } catch { /* ignore */ }
                const m = await findModel(modelName);
                if (!m) { sendError(res, 404, `model '${modelName}' not found`); return; }
                const cts = new vscode.CancellationTokenSource();
                try {
                    const r = await m.sendRequest(
                        [vscode.LanguageModelChatMessage.User('Say hi')],
                        { justification: 'debug' }, cts.token,
                    );
                    const parts: unknown[] = [];
                    let n = 0;
                    for await (const chunk of r.stream) {
                        if (n++ >= 5) break;
                        const c = chunk as Record<string, unknown>;
                        parts.push({ type: c.constructor?.name ?? typeof c, keys: Object.keys(c), value: c['value'] });
                    }
                    const textParts: string[] = [];
                    const r2 = await m.sendRequest(
                        [vscode.LanguageModelChatMessage.User('Say hi')],
                        { justification: 'debug' }, cts.token,
                    );
                    for await (const t of r2.text) { textParts.push(t); if (textParts.length >= 5) break; }
                    sendJson(res, 200, { streamChunks: parts, textChunks: textParts });
                } finally { cts.dispose(); }
                return;
            }

            // Unsupported but recognized Ollama endpoints
            if (method === 'POST' && url === '/api/pull') {
                sendError(res, 501, 'model pulling is not supported; models are provided by Antigravity');
                return;
            }

            if (method === 'POST' && url === '/api/push') {
                sendError(res, 501, 'model pushing is not supported');
                return;
            }

            if (method === 'POST' && url === '/api/copy') {
                sendError(res, 501, 'model copying is not supported');
                return;
            }

            if (method === 'DELETE' && url === '/api/delete') {
                sendError(res, 501, 'model deletion is not supported');
                return;
            }

            if (method === 'POST' && url === '/api/create') {
                sendError(res, 501, 'model creation is not supported');
                return;
            }

            sendError(res, 404, `unknown endpoint: ${method} ${url}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            output.appendLine(`[server] Unhandled error: ${message}`);
            if (!res.headersSent) {
                sendError(res, 500, `internal server error: ${message}`);
            }
        }
    });

    return server;
}
