import * as vscode from 'vscode';
import type { OllamaChatMessage, OllamaModelInfo } from './types';
import {
    LanguageServerClient,
    LS,
    type CascadeModelConfig,
} from './antigravityClient';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Virtual model name that triggers automatic prompt improvement and model selection. */
export const AUTO_MODEL_NAME = 'auto';

/** Model family used as the router to improve prompts and select the best model. */
export const ROUTER_MODEL_FAMILY = 'gemini-3-flash';

// ─── Model name utilities ─────────────────────────────────────────────────────

/**
 * Converts a VS Code LM model to an Ollama-compatible name.
 * Format: "{family}:{vendor}" — e.g. "gemini-3-flash:antigravity"
 */
export function modelToOllamaName(model: vscode.LanguageModelChat): string {
    return `${model.family}:${model.vendor}`;
}

/** Returns true when the model name refers to the virtual auto-routing model. */
export function isAutoModel(name: string): boolean {
    return name.toLowerCase() === AUTO_MODEL_NAME;
}

// ─── Model discovery ──────────────────────────────────────────────────────────

/**
 * Lists all available Antigravity LM models, plus a virtual "auto" entry
 * at the top of the list.
 *
 * Unlike the VS Code version, this exposes ALL available models rather than
 * filtering to a curated list, since Antigravity already provides a curated set.
 */
/** Slugifies a Cascade model label ("Gemini 3 Flash" -> "gemini-3-flash"). */
export function cascadeLabelToFamily(label: string): string {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/** Listing source used when building /api/tags (for logging/debugging). */
export type ModelListSource = 'vscode.lm' | 'language-server' | 'empty';

function cascadeConfigsToOllamaModels(
    configs: readonly CascadeModelConfig[],
    now: string,
): OllamaModelInfo[] {
    return configs.map((c) => {
        const family = cascadeLabelToFamily(c.label);
        const name = `${family}:antigravity`;
        const modelId = c.modelOrAlias?.model ?? c.modelOrAlias?.alias ?? family;
        const digest = `sha256:${Buffer.from(`${family}antigravity${modelId}`)
            .toString('hex')
            .padEnd(64, '0')
            .slice(0, 64)}`;
        return {
            name,
            model: name,
            modified_at: now,
            size: 0,
            digest,
            details: {
                parent_model: '',
                format: 'api',
                family,
                families: [family],
                parameter_size: 'cascade',
                quantization_level: 'none',
            },
        };
    });
}

export async function listAntigravityModels(): Promise<OllamaModelInfo[]> {
    const all = await vscode.lm.selectChatModels();
    const now = new Date().toISOString();

    // When running inside the Antigravity editor, vscode.lm.selectChatModels()
    // returns empty (the core extension never registers chat models). Fall
    // back to the local language_server.exe which knows about Cascade models.
    if (all.length === 0) {
        try {
            const workspaceFs = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            const client = LanguageServerClient.connect(workspaceFs);
            const resp = await LS.cascadeModels(client);
            const configs = resp.clientModelConfigs ?? [];
            if (configs.length > 0) {
                const result = cascadeConfigsToOllamaModels(configs, now);
                result.unshift({
                    name: AUTO_MODEL_NAME,
                    model: AUTO_MODEL_NAME,
                    modified_at: now,
                    size: 0,
                    digest: `sha256:${'61757465'.padEnd(64, '0')}`,
                    details: {
                        parent_model: ROUTER_MODEL_FAMILY,
                        format: 'router',
                        family: AUTO_MODEL_NAME,
                        families: [AUTO_MODEL_NAME],
                        parameter_size: 'router',
                        quantization_level: 'none',
                    },
                });
                return result;
            }
        } catch {
            // Fall through to empty list — upstream will surface a friendly error.
        }
    }

    const result: OllamaModelInfo[] = all.map((m) => {
        const digest = `sha256:${Buffer.from(`${m.family}${m.vendor}${m.version}`).toString('hex').padEnd(64, '0').slice(0, 64)}`;
        return {
            name: modelToOllamaName(m),
            model: modelToOllamaName(m),
            modified_at: now,
            size: 0,
            digest,
            details: {
                parent_model: '',
                format: 'api',
                family: m.family,
                families: [m.family],
                parameter_size: m.maxInputTokens > 0 ? `${m.maxInputTokens}ctx` : 'unknown',
                quantization_level: 'none',
            },
        };
    });

    // Prepend virtual "auto" model
    result.unshift({
        name: AUTO_MODEL_NAME,
        model: AUTO_MODEL_NAME,
        modified_at: now,
        size: 0,
        digest: `sha256:${'61757465'.padEnd(64, '0')}`,
        details: {
            parent_model: ROUTER_MODEL_FAMILY,
            format: 'router',
            family: AUTO_MODEL_NAME,
            families: [AUTO_MODEL_NAME],
            parameter_size: 'router',
            quantization_level: 'none',
        },
    });

    return result;
}

/**
 * Finds an Antigravity LM model by Ollama-style name.
 * Returns undefined for the virtual "auto" model name.
 *
 * Accepts:
 *  - "family"            e.g. "gemini-3-flash"
 *  - "family:latest"     treated same as "family"
 *  - "family:vendor"     e.g. "gemini-3-flash:antigravity"
 */
export async function findModel(
    ollamaModelName: string,
): Promise<vscode.LanguageModelChat | undefined> {
    if (isAutoModel(ollamaModelName)) {
        return undefined;
    }

    const [family, tag] = ollamaModelName.split(':');
    const vendor = tag && tag !== 'latest' ? tag : undefined;

    const selector: vscode.LanguageModelChatSelector = { family };
    if (vendor) {
        selector.vendor = vendor;
    }

    const matched = await vscode.lm.selectChatModels(selector);
    if (matched.length > 0) {
        return matched[0];
    }

    // Fallback: case-insensitive search across all models
    const all = await vscode.lm.selectChatModels();
    const lower = family.toLowerCase();
    return all.find(
        (m) =>
            m.family.toLowerCase() === lower ||
            m.id.toLowerCase() === lower ||
            m.name.toLowerCase().includes(lower),
    );
}

// ─── Auto routing ─────────────────────────────────────────────────────────────

export interface AutoRouteResult {
    model: vscode.LanguageModelChat;
    messages: vscode.LanguageModelChatMessage[];
    selectedModelName: string;
}

/**
 * Routes a request automatically using Gemini 3 Flash to:
 * 1. Improve and clarify the user's prompt.
 * 2. Select the most appropriate model from the available models.
 *
 * Falls back to claude-sonnet-4.6 if the selected model is unavailable.
 */
export async function routeAuto(
    ollamaMessages: OllamaChatMessage[],
    token: vscode.CancellationToken,
): Promise<AutoRouteResult> {
    const router = await findModel(ROUTER_MODEL_FAMILY);
    if (!router) {
        throw new Error(
            `Router model '${ROUTER_MODEL_FAMILY}' not available. Ensure Gemini 3 Flash is enabled in Antigravity.`,
        );
    }

    // Discover all available model families dynamically
    const allModels = await vscode.lm.selectChatModels();
    const availableFamilies = [...new Set(allModels.map((m) => m.family))];
    const availableList = availableFamilies.join(', ');

    const lastUserMsg =
        [...ollamaMessages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const routingPrompt =
        `You are a model router for an AI API server. Analyze the user request and return JSON with the best model and an improved prompt.\n\n` +
        `Available models: ${availableList}\n\n` +
        `Model selection guidelines:\n` +
        `- claude-opus-4.6: complex multi-step reasoning, deep analysis, long documents, high-quality creative writing\n` +
        `- claude-sonnet-4.6: balanced general tasks, coding assistance, detailed instructions — default choice\n` +
        `- gemini-3.1-pro: general purpose with strong reasoning, large context\n` +
        `- gemini-3-flash: fast lightweight responses, simple Q&A, classification\n` +
        `- gpt-oss-120b: strong open-source model, good for general tasks\n` +
        `- For any other model, use your best judgment based on the model name.\n\n` +
        `User request:\n${lastUserMsg}\n\n` +
        `Respond ONLY with a JSON object (no markdown fences, no extra text):\n` +
        `{"model":"<chosen-family>","improvedPrompt":"<improved and detailed version of the user request>"}`;

    const metaMessages = [vscode.LanguageModelChatMessage.User(routingPrompt)];

    const routerResponse = await router.sendRequest(
        metaMessages,
        { justification: 'Auto model routing via Antigravity LLM Server' },
        token,
    );

    let routingText = '';
    for await (const chunk of routerResponse.stream) {
        const text = getChunkText(chunk);
        if (text) routingText += text;
    }

    // Strip markdown code fences if the model wrapped the JSON
    const cleaned = routingText
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');

    let routing: { model: string; improvedPrompt: string };
    try {
        routing = JSON.parse(cleaned);
    } catch {
        throw new Error(
            `Auto router returned invalid JSON. Raw response: ${routingText.slice(0, 300)}`,
        );
    }

    const targetModel = await findModel(routing.model);
    const resolvedModel = targetModel ?? (await findModel('claude-sonnet-4.6'));
    if (!resolvedModel) {
        throw new Error(`Routed model '${routing.model}' not found and fallback unavailable`);
    }

    const selectedModelName = targetModel ? routing.model : 'claude-sonnet-4.6';
    const messages = buildImprovedMessages(ollamaMessages, routing.improvedPrompt);
    return { model: resolvedModel, messages, selectedModelName };
}

// ─── Message conversion ───────────────────────────────────────────────────────

/**
 * Replaces the last user message with an improved prompt while preserving
 * prior conversation history.
 */
function buildImprovedMessages(
    originalMessages: OllamaChatMessage[],
    improvedLastPrompt: string,
): vscode.LanguageModelChatMessage[] {
    let lastUserIdx = -1;
    for (let i = originalMessages.length - 1; i >= 0; i--) {
        if (originalMessages[i].role === 'user') {
            lastUserIdx = i;
            break;
        }
    }

    const result: vscode.LanguageModelChatMessage[] = [];
    for (let i = 0; i < originalMessages.length; i++) {
        const msg = originalMessages[i];
        if (msg.role === 'tool') continue;
        if (i === lastUserIdx) {
            result.push(vscode.LanguageModelChatMessage.User(improvedLastPrompt));
        } else if (msg.role === 'assistant') {
            result.push(vscode.LanguageModelChatMessage.Assistant(msg.content));
        } else {
            result.push(vscode.LanguageModelChatMessage.User(msg.content));
        }
    }
    return result;
}

/**
 * Converts Ollama chat messages to VS Code LM chat messages.
 * - "system" and "user" roles map to User messages
 * - "assistant" role maps to Assistant messages
 * - "tool" role is ignored (not supported by VS Code LM API)
 */
export function toVSCodeMessages(
    messages: OllamaChatMessage[],
): vscode.LanguageModelChatMessage[] {
    const result: vscode.LanguageModelChatMessage[] = [];
    for (const msg of messages) {
        if (msg.role === 'tool') {
            continue;
        }
        if (msg.role === 'assistant') {
            result.push(vscode.LanguageModelChatMessage.Assistant(msg.content));
        } else {
            result.push(vscode.LanguageModelChatMessage.User(msg.content));
        }
    }
    return result;
}

/**
 * Extracts text value from a VS Code LM stream chunk.
 * Returns undefined if the chunk is not a text part.
 */
export function getChunkText(chunk: unknown): string | undefined {
    // vscode.LanguageModelTextPart has a `value` string property
    if (chunk && typeof (chunk as { value?: unknown }).value === 'string') {
        return (chunk as { value: string }).value;
    }
    return undefined;
}

/**
 * Computes total character count across Ollama chat messages (used as a
 * rough prompt_eval_count proxy since token counts are unavailable).
 */
export function countMessageChars(messages: OllamaChatMessage[]): number {
    return messages.reduce((sum, m) => sum + m.content.length, 0);
}

// ─── Language-server (Cascade) backend ────────────────────────────────────────

/**
 * Resolved Antigravity Cascade model — the model id the LS accepts
 * for `GetModelResponse`.
 */
export interface ResolvedCascadeModel {
    /** The Cascade model id, e.g. "MODEL_PLACEHOLDER_M47". */
    modelId: string;
    /** Original Cascade label, e.g. "Gemini 3 Flash". */
    label: string;
    /** Ollama-style family slug, e.g. "gemini-3-flash". */
    family: string;
}

let cachedCascadeConfigs: { at: number; configs: CascadeModelConfig[] } | undefined;

async function getCascadeConfigs(): Promise<CascadeModelConfig[]> {
    const now = Date.now();
    if (cachedCascadeConfigs && now - cachedCascadeConfigs.at < 30_000) {
        return cachedCascadeConfigs.configs;
    }
    try {
        const workspaceFs = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const client = LanguageServerClient.connect(workspaceFs);
        const resp = await LS.cascadeModels(client);
        const configs = resp.clientModelConfigs ?? [];
        cachedCascadeConfigs = { at: now, configs };
        return configs;
    } catch {
        return [];
    }
}

/**
 * Maps an Ollama-style model name (e.g. "gemini-3-flash:antigravity" or just
 * "gemini-3-flash") to a Cascade model — returns `undefined` if no match.
 */
export async function resolveCascadeModel(
    ollamaName: string,
): Promise<ResolvedCascadeModel | undefined> {
    const [family] = ollamaName.split(':');
    const target = family.toLowerCase();
    const configs = await getCascadeConfigs();
    for (const c of configs) {
        const fam = cascadeLabelToFamily(c.label);
        const modelId = c.modelOrAlias?.model ?? c.modelOrAlias?.alias;
        if (!modelId) continue;
        if (fam === target || modelId.toLowerCase() === target) {
            return { modelId, label: c.label, family: fam };
        }
    }
    return undefined;
}

/** Picks the router model for LS-backed auto routing (Gemini 3 Flash preferred). */
export async function resolveRouterCascadeModel(): Promise<ResolvedCascadeModel | undefined> {
    const preferred = await resolveCascadeModel(ROUTER_MODEL_FAMILY);
    if (preferred) return preferred;
    const configs = await getCascadeConfigs();
    const first = configs[0];
    if (!first) return undefined;
    const modelId = first.modelOrAlias?.model ?? first.modelOrAlias?.alias;
    if (!modelId) return undefined;
    return { modelId, label: first.label, family: cascadeLabelToFamily(first.label) };
}

/**
 * Splits Ollama chat messages into the shape `GetModelResponse` expects:
 *   - `system` — joined text of all system turns (optional)
 *   - `chatMessages` — prior turns (alternating user/assistant) as history
 *   - `prompt` — the final user turn's content
 */
function partitionMessages(messages: OllamaChatMessage[]): {
    system?: string;
    chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
    prompt: string;
} {
    const systemParts: string[] = [];
    const turns: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const m of messages) {
        if (m.role === 'system') {
            systemParts.push(m.content);
        } else if (m.role === 'user') {
            turns.push({ role: 'user', content: m.content });
        } else if (m.role === 'assistant') {
            turns.push({ role: 'assistant', content: m.content });
        }
        // tool messages are ignored — LS backend has no tool support
    }

    let prompt = '';
    let lastUserIdx = -1;
    for (let i = turns.length - 1; i >= 0; i--) {
        if (turns[i].role === 'user') {
            lastUserIdx = i;
            break;
        }
    }
    const chatMessages =
        lastUserIdx >= 0 ? turns.slice(0, lastUserIdx) : turns.slice();
    if (lastUserIdx >= 0) {
        prompt = turns[lastUserIdx].content;
    }
    return {
        system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
        chatMessages,
        prompt,
    };
}

/**
 * Calls `GetModelResponse` on the local Antigravity language server and
 * returns the assistant's response text. This is the same RPC Cascade uses
 * under the hood, so every Cascade-accessible model is reachable.
 *
 * The endpoint is unary — there is no streaming variant of `GetModelResponse`
 * exposed by the language server; callers that want token streaming must
 * chunk the returned string themselves.
 */
export async function runChatViaLanguageServer(opts: {
    cascadeModelId: string;
    messages: OllamaChatMessage[];
    signal?: AbortSignal;
}): Promise<string> {
    const workspaceFs = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const client = LanguageServerClient.connect(workspaceFs);

    const { system, chatMessages, prompt } = partitionMessages(opts.messages);
    if (!prompt) {
        throw new Error('no user message to send to the language server');
    }

    const request: Record<string, unknown> = {
        model: opts.cascadeModelId,
        prompt,
    };
    if (system) request.system = system;
    if (chatMessages.length > 0) request.chatMessages = chatMessages;

    const resp = await client.unary<{ response?: string }>({
        method: 'GetModelResponse',
        request,
        signal: opts.signal,
    });
    return resp.response ?? '';
}

/**
 * Splits text into streaming-friendly chunks without letting a single chunk
 * become too large. Used to emulate token streaming over the unary LS RPC so
 * that Ollama clients receive progressive NDJSON output.
 */
export function* chunkText(text: string, targetChars = 24): Generator<string> {
    if (!text) return;
    // Break on word boundaries to keep chunks natural-looking.
    const parts = text.match(/\S+\s*|\s+/g) ?? [text];
    let buf = '';
    for (const p of parts) {
        buf += p;
        if (buf.length >= targetChars) {
            yield buf;
            buf = '';
        }
    }
    if (buf) yield buf;
}

/**
 * LS-backed "auto" router: uses a short, low-cost Cascade model to pick the
 * best available Cascade model for the user's request and returns both the
 * chosen model and the messages to send.
 */
export async function routeAutoViaLanguageServer(
    messages: OllamaChatMessage[],
    signal?: AbortSignal,
): Promise<{
    model: ResolvedCascadeModel;
    messages: OllamaChatMessage[];
    selectedModelName: string;
}> {
    const router = await resolveRouterCascadeModel();
    if (!router) {
        throw new Error(
            'No Cascade models available from the language server — cannot route "auto".',
        );
    }

    const configs = await getCascadeConfigs();
    const families = [...new Set(configs.map((c) => cascadeLabelToFamily(c.label)))];

    const lastUserMsg =
        [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const routingPrompt =
        `You are a model router. Pick the best model for the user's request and return JSON only.\n\n` +
        `Available models: ${families.join(', ')}\n\n` +
        `User request:\n${lastUserMsg}\n\n` +
        `Respond ONLY with JSON (no fences):\n` +
        `{"model":"<family-from-list>","improvedPrompt":"<improved prompt>"}`;

    const routingText = await runChatViaLanguageServer({
        cascadeModelId: router.modelId,
        messages: [{ role: 'user', content: routingPrompt }],
        signal,
    });

    const cleaned = routingText
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');

    let routing: { model: string; improvedPrompt: string };
    try {
        routing = JSON.parse(cleaned);
    } catch {
        throw new Error(
            `Router returned invalid JSON. Raw response: ${routingText.slice(0, 300)}`,
        );
    }

    const resolved =
        (await resolveCascadeModel(routing.model)) ?? router;

    // Replace the last user message with the improved prompt.
    const outMessages: OllamaChatMessage[] = [];
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
            lastUserIdx = i;
            break;
        }
    }
    for (let i = 0; i < messages.length; i++) {
        if (i === lastUserIdx) {
            outMessages.push({ role: 'user', content: routing.improvedPrompt });
        } else {
            outMessages.push(messages[i]);
        }
    }

    return {
        model: resolved,
        messages: outMessages,
        selectedModelName: resolved.family,
    };
}

