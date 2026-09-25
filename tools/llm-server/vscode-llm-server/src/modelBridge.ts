import * as vscode from 'vscode';
import type { OllamaChatMessage, OllamaModelInfo } from './types';

// ─── Curated model list ───────────────────────────────────────────────────────

/**
 * Curated list of model families exposed via this server.
 * Matches VS Code LM API family strings (case-insensitive).
 */
export const CURATED_FAMILIES: readonly string[] = [
    'claude-haiku-4.5',
    'claude-opus-4.7',
    'claude-sonnet-4',
    'claude-sonnet-4.5',
    'claude-sonnet-4.6',
    'gemini-2.5-pro',
    'gemini-3-flash',
    'gemini-3.1-pro',
    'gpt-4.1',
    'gpt-4o',
    'gpt-5-mini',
    'gpt-5.2',
    'gpt-5.2-codex',
    'gpt-5.3-codex',
    'gpt-5.4',
    'gpt-5.4-mini',
    'grok-code-fast-1',
    'raptor-mini',
] as const;

/** Virtual model name that triggers automatic prompt improvement and model selection. */
export const AUTO_MODEL_NAME = 'auto';

/** Model family used as the router to improve prompts and select the best model. */
export const ROUTER_MODEL_FAMILY = 'raptor-mini';

// ─── Model name utilities ─────────────────────────────────────────────────────

/**
 * Converts a VS Code LM model to an Ollama-compatible name.
 * Format: "{family}:{vendor}" — e.g. "gpt-4o:copilot"
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
 * Lists VS Code LM models filtered to the curated list, plus a virtual "auto" entry
 * at the top of the list.
 */
export async function listVSCodeModels(): Promise<OllamaModelInfo[]> {
    const all = await vscode.lm.selectChatModels();
    const now = new Date().toISOString();

    const curated = all.filter((m) =>
        CURATED_FAMILIES.some((f) => m.family.toLowerCase() === f.toLowerCase()),
    );

    const result: OllamaModelInfo[] = curated.map((m) => {
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
 * Finds a VS Code LM model by Ollama-style name.
 * Returns undefined for the virtual "auto" model name.
 *
 * Accepts:
 *  - "family"            e.g. "gpt-4o"
 *  - "family:latest"     treated same as "family"
 *  - "family:vendor"     e.g. "gpt-4o:copilot"
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
 * Routes a request automatically using Raptor mini to:
 * 1. Improve and clarify the user's prompt.
 * 2. Select the most appropriate model from the curated list.
 *
 * Falls back to claude-sonnet-4.6 if the selected model is unavailable.
 */
export async function routeAuto(
    ollamaMessages: OllamaChatMessage[],
    token: vscode.CancellationToken,
): Promise<AutoRouteResult> {
    const router = await findModel(ROUTER_MODEL_FAMILY);
    if (!router) {
        // Router model unavailable — pick first available curated model as direct fallback
        const all = await vscode.lm.selectChatModels();
        const fallback = all.find((m) =>
            CURATED_FAMILIES.some((f) => m.family.toLowerCase() === f.toLowerCase()),
        );
        if (!fallback) {
            throw new Error('No LM models available. Ensure GitHub Copilot is signed in.');
        }
        return {
            model: fallback,
            messages: toVSCodeMessages(ollamaMessages),
            selectedModelName: fallback.family,
        };
    }

    const availableList = CURATED_FAMILIES.join(', ');
    const lastUserMsg =
        [...ollamaMessages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const routingPrompt =
        `You are a model router for an AI API server. Analyze the user request and return JSON with the best model and an improved prompt.\n\n` +
        `Available models: ${availableList}\n\n` +
        `Model selection guidelines:\n` +
        `- claude-opus-4.7: complex multi-step reasoning, deep analysis, long documents, high-quality creative writing\n` +
        `- claude-sonnet-4.6: balanced general tasks, coding assistance, detailed instructions — default choice\n` +
        `- claude-sonnet-4.5: similar to claude-sonnet-4.6, slightly older\n` +
        `- claude-haiku-4.5: simple fast tasks, classification, short Q&A, summaries\n` +
        `- gemini-2.5-pro: multimodal inputs, very large context (173K), data analysis, scientific reasoning\n` +
        `- gemini-3.1-pro: general purpose with strong reasoning\n` +
        `- gemini-3-flash: fast lightweight Gemini responses\n` +
        `- gpt-5.4: latest OpenAI flagship, powerful general tasks and complex reasoning\n` +
        `- gpt-5.4-mini: efficient moderate-complexity tasks\n` +
        `- gpt-5.2: strong general OpenAI model\n` +
        `- gpt-5.2-codex: 400K context, large codebase analysis and code generation\n` +
        `- gpt-5.3-codex: 400K context, complex programming and architecture tasks\n` +
        `- gpt-4.1: precise instruction following, coding, tool use\n` +
        `- gpt-4o: fast multimodal, vision and image analysis\n` +
        `- gpt-5-mini: lightweight tasks with latest GPT generation\n` +
        `- grok-code-fast-1: fast code generation and code review\n` +
        `- raptor-mini: orchestration, routing, and simple lightweight tasks\n\n` +
        `User request:\n${lastUserMsg}\n\n` +
        `Respond ONLY with a JSON object (no markdown fences, no extra text):\n` +
        `{"model":"<chosen-family>","improvedPrompt":"<improved and detailed version of the user request>"}`;

    const metaMessages = [vscode.LanguageModelChatMessage.User(routingPrompt)];

    const routerResponse = await router.sendRequest(
        metaMessages,
        { justification: 'Auto model routing via VS Code LLM Server' },
        token,
    );

    let routingText = '';
    for await (const text of routerResponse.text) {
        routingText += text;
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
        } else if (msg.images?.length) {
            const parts: Array<vscode.LanguageModelTextPart | vscode.LanguageModelDataPart> = [];
            for (const b64 of msg.images) {
                const bytes = Buffer.from(b64, 'base64');
                parts.push(vscode.LanguageModelDataPart.image(new Uint8Array(bytes), 'image/png'));
            }
            if (msg.content) {
                parts.push(new vscode.LanguageModelTextPart(msg.content));
            }
            result.push(vscode.LanguageModelChatMessage.User(parts));
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
