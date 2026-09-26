import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

type ChatRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
    role: ChatRole;
    content: string;
}

export interface LlmResponse {
    text: string;
    provider: string;
    model: string;
    usage?: {
        inputTokens?: number;
        outputTokens?: number;
    };
}

export interface LlmProvider {
    name: string;
    chat(messages: LlmMessage[], options?: { model?: string; temperature?: number }): Promise<LlmResponse>;
}

const VSCODE_LLM_AGENT_URL = (process.env.VSCODE_LLM_AGENT_URL || 'http://localhost:11434').replace(/\/+$/, '');
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_PROVIDER = process.env.AI_PROVIDER?.toLowerCase() || '';
const AI_MODEL = process.env.AI_MODEL || 'auto';
const AWS_BEDROCK_REGION = process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'sa-east-1';

// Resolve ciesa_ia CLI path (monorepo: packages/ciesa_ia/cli.js).
// Allow override via CIESA_IA_CLI env var (absolute path to cli.js).
function resolveCiesaIaCliPath(): string {
    if (process.env.CIESA_IA_CLI) return process.env.CIESA_IA_CLI;
    const here = path.dirname(fileURLToPath(import.meta.url));
    // Source: packages/backend/features/ai/llm-provider.ts          ÔåÆ ../../../ciesa_ia/cli.js
    // Built:  packages/backend/dist/features/ai/llm-provider.js     ÔåÆ ../../../../ciesa_ia/cli.js
    const candidates = [
        path.resolve(here, '..', '..', '..', 'ciesa_ia', 'cli.js'),
        path.resolve(here, '..', '..', '..', '..', 'ciesa_ia', 'cli.js'),
    ];
    for (const candidate of candidates) {
        if (existsSync(candidate)) return candidate;
    }
    return candidates[0]!;
}

const CIESA_IA_CLI_PATH = resolveCiesaIaCliPath();
const CIESA_IA_TIMEOUT_MS = Number(process.env.CIESA_IA_TIMEOUT_MS || 180_000);

function resolveModel(fallback: string | undefined): string {
    return fallback || AI_MODEL;
}

function extractJsonObject(value: string): string {
    const match = value.match(/```(?:json)?\s*([\s\S]*?)```/) ?? value.match(/(\{[\s\S]*\})/);
    return (match ? (match[1] ?? match[0]) : value).trim();
}

class VsCodeLlmProvider implements LlmProvider {
    name = 'vscode';
    private cachedModel: string | null = null;
    private cachedEndpoint: 'ollama' | 'openai' | null = null;

    /** Try /api/tags (Ollama-style); fall back to /v1/models (OpenAI-style). */
    private async resolveEndpointAndModel(requested: string): Promise<{ model: string; endpoint: 'ollama' | 'openai' }> {
        if (this.cachedModel && this.cachedEndpoint) {
            const override = requested && requested !== 'auto' ? requested : this.cachedModel;
            return { model: override, endpoint: this.cachedEndpoint };
        }

        // --- Try Ollama-style ---
        try {
            const tagsResp = await fetch(`${VSCODE_LLM_AGENT_URL}/api/tags`, {
                signal: AbortSignal.timeout(5000),
            });
            if (tagsResp.ok) {
                const payload = await tagsResp.json() as { models?: Array<{ name?: string; model?: string }> };
                const first = payload.models?.[0]?.name || payload.models?.[0]?.model;
                if (first) {
                    this.cachedModel = first;
                    this.cachedEndpoint = 'ollama';
                    return { model: requested && requested !== 'auto' ? requested : first, endpoint: 'ollama' };
                }
            }
        } catch { /* fall through */ }

        // --- Try OpenAI-style ---
        try {
            const modelsResp = await fetch(`${VSCODE_LLM_AGENT_URL}/v1/models`, {
                signal: AbortSignal.timeout(5000),
            });
            if (modelsResp.ok) {
                const payload = await modelsResp.json() as { data?: Array<{ id?: string }> };
                const first = payload.data?.[0]?.id;
                if (first) {
                    this.cachedModel = first;
                    this.cachedEndpoint = 'openai';
                    return { model: requested && requested !== 'auto' ? requested : first, endpoint: 'openai' };
                }
            }
        } catch { /* fall through */ }

        // No model discovered ÔÇö use model as-is on Ollama endpoint
        const fallbackModel = requested && requested !== 'auto' ? requested : 'llama3';
        return { model: fallbackModel, endpoint: 'ollama' };
    }

    async chat(messages: LlmMessage[], options?: { model?: string }): Promise<LlmResponse> {
        const { model, endpoint } = await this.resolveEndpointAndModel(resolveModel(options?.model));

        if (endpoint === 'openai') {
            const response = await fetch(`${VSCODE_LLM_AGENT_URL}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ model, stream: false, messages }),
                signal: AbortSignal.timeout(120000),
            });
            if (!response.ok) {
                const body = await response.text().catch(() => '');
                throw new Error(`VSCode provider (openai) HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
            }
            const payload = await response.json() as Record<string, unknown>;
            const choices = Array.isArray(payload.choices) ? payload.choices as Array<Record<string, unknown>> : [];
            const msg = (choices[0]?.message && typeof choices[0].message === 'object') ? choices[0].message as Record<string, unknown> : {};
            return {
                text: extractJsonObject(typeof msg.content === 'string' ? msg.content : '{}'),
                provider: this.name,
                model: typeof payload.model === 'string' ? payload.model : model,
            };
        }

        // Ollama-style
        const response = await fetch(`${VSCODE_LLM_AGENT_URL}/api/chat`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ model, stream: false, messages }),
            signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`VSCode provider (ollama) HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
        }
        const payload = await response.json() as Record<string, unknown>;
        const message = (payload.message && typeof payload.message === 'object') ? payload.message as Record<string, unknown> : {};
        return {
            text: extractJsonObject(typeof message.content === 'string' ? message.content : '{}'),
            provider: this.name,
            model: typeof payload.model === 'string' ? payload.model : model,
        };
    }
}

class OpenAiProvider implements LlmProvider {
    name = 'openai';
    async chat(messages: LlmMessage[], options?: { model?: string; temperature?: number }): Promise<LlmResponse> {
        if (!AI_API_KEY) throw new Error('AI_API_KEY nao configurada para OpenAI');
        const model = resolveModel(options?.model || 'gpt-4o-mini');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${AI_API_KEY}`,
            },
            body: JSON.stringify({
                model,
                temperature: options?.temperature ?? 0.2,
                messages,
            }),
            signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
        const payload = await response.json() as Record<string, unknown>;
        const choices = Array.isArray(payload.choices) ? payload.choices as Array<Record<string, unknown>> : [];
        const first = choices[0] ?? {};
        const message = (first.message && typeof first.message === 'object') ? first.message as Record<string, unknown> : {};
        const usage = (payload.usage && typeof payload.usage === 'object') ? payload.usage as Record<string, unknown> : {};
        return {
            text: extractJsonObject(typeof message.content === 'string' ? message.content : '{}'),
            provider: this.name,
            model,
            usage: {
                inputTokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : undefined,
                outputTokens: typeof usage.completion_tokens === 'number' ? usage.completion_tokens : undefined,
            },
        };
    }
}

class AnthropicProvider implements LlmProvider {
    name = 'anthropic';
    async chat(messages: LlmMessage[], options?: { model?: string; temperature?: number }): Promise<LlmResponse> {
        if (!AI_API_KEY) throw new Error('AI_API_KEY nao configurada para Anthropic');
        const model = resolveModel(options?.model || 'claude-sonnet-4-6');
        const system = messages.find((m) => m.role === 'system')?.content || '';
        const reqMessages = messages.filter((m) => m.role !== 'system').map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
        }));
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': AI_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 1200,
                temperature: options?.temperature ?? 0.2,
                system,
                messages: reqMessages,
            }),
            signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}`);
        const payload = await response.json() as Record<string, unknown>;
        const content = Array.isArray(payload.content) ? payload.content as Array<Record<string, unknown>> : [];
        const textChunk = content.find((c) => c.type === 'text');
        const usage = (payload.usage && typeof payload.usage === 'object') ? payload.usage as Record<string, unknown> : {};
        return {
            text: extractJsonObject(typeof textChunk?.text === 'string' ? textChunk.text : '{}'),
            provider: this.name,
            model,
            usage: {
                inputTokens: typeof usage.input_tokens === 'number' ? usage.input_tokens : undefined,
                outputTokens: typeof usage.output_tokens === 'number' ? usage.output_tokens : undefined,
            },
        };
    }
}

class OllamaProvider implements LlmProvider {
    name = 'ollama';
    private cachedAutoModel: string | null = null;

    private async resolveOllamaModel(requested: string): Promise<string> {
        if (requested && requested !== 'auto') return requested;
        if (this.cachedAutoModel) return this.cachedAutoModel;
        const tagsResp = await fetch(`${VSCODE_LLM_AGENT_URL}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });
        if (!tagsResp.ok) throw new Error(`Ollama /api/tags HTTP ${tagsResp.status}`);
        const payload = await tagsResp.json() as { models?: Array<{ name?: string; model?: string }> };
        const models = payload.models || [];
        if (models.length === 0) {
            throw new Error(
                `Ollama em ${VSCODE_LLM_AGENT_URL} nao tem modelos instalados. ` +
                'Rode `ollama pull llama3.1` (ou outro) OU configure AI_PROVIDER=anthropic com AI_API_KEY.'
            );
        }
        const first = models[0]?.name || models[0]?.model;
        if (!first) throw new Error('Ollama retornou lista de modelos invalida.');
        this.cachedAutoModel = first;
        return first;
    }

    async chat(messages: LlmMessage[], options?: { model?: string }): Promise<LlmResponse> {
        const model = await this.resolveOllamaModel(resolveModel(options?.model));
        const response = await fetch(`${VSCODE_LLM_AGENT_URL}/api/chat`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ model, stream: false, messages }),
            signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Ollama HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
        }
        const payload = await response.json() as Record<string, unknown>;
        const message = (payload.message && typeof payload.message === 'object') ? payload.message as Record<string, unknown> : {};
        return {
            text: extractJsonObject(typeof message.content === 'string' ? message.content : '{}'),
            provider: this.name,
            model,
        };
    }
}

class BedrockProvider implements LlmProvider {
    name = 'bedrock';

    async chat(messages: LlmMessage[], options?: { model?: string; temperature?: number }): Promise<LlmResponse> {
        const modelId = resolveModel(options?.model || 'global.anthropic.claude-haiku-4-5-20251001-v1:0');
        const client = new BedrockRuntimeClient({ region: AWS_BEDROCK_REGION });

        const system = messages.find((m) => m.role === 'system')?.content || '';
        const reqMessages = messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

        const body = JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 1200,
            temperature: options?.temperature ?? 0.2,
            ...(system ? { system } : {}),
            messages: reqMessages,
        });

        const command = new InvokeModelCommand({
            modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: Buffer.from(body),
        });

        const result = await client.send(command);
        const payload = JSON.parse(new TextDecoder().decode(result.body)) as Record<string, unknown>;
        const content = Array.isArray(payload.content) ? payload.content as Array<Record<string, unknown>> : [];
        const textChunk = content.find((c) => c.type === 'text');
        const usage = (payload.usage && typeof payload.usage === 'object') ? payload.usage as Record<string, unknown> : {};

        return {
            text: extractJsonObject(typeof textChunk?.text === 'string' ? textChunk.text : '{}'),
            provider: this.name,
            model: modelId,
            usage: {
                inputTokens: typeof usage.input_tokens === 'number' ? usage.input_tokens : undefined,
                outputTokens: typeof usage.output_tokens === 'number' ? usage.output_tokens : undefined,
            },
        };
    }
}

class CiesaIaProvider implements LlmProvider {
    name = 'ciesa_ia';

    private flattenMessages(messages: LlmMessage[]): string {
        // Kairos/claude-code CLI takes a single prompt string in -p mode.
        // Render system+history as a labeled transcript so the model sees full context.
        const parts: string[] = [];
        for (const m of messages) {
            const label = m.role === 'system' ? 'SYSTEM' : m.role === 'assistant' ? 'ASSISTANT' : 'USER';
            parts.push(`[${label}]\n${m.content}`);
        }
        parts.push('[ASSISTANT]');
        return parts.join('\n\n');
    }

    async chat(messages: LlmMessage[], options?: { model?: string }): Promise<LlmResponse> {
        const model = resolveModel(options?.model);
        const prompt = this.flattenMessages(messages);

        const args = ['-p', prompt];
        if (model && model !== 'auto') {
            args.push('--model', model);
        }

        return await new Promise<LlmResponse>((resolve, reject) => {
            const child = spawn(process.execPath, [CIESA_IA_CLI_PATH, ...args], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env },
                windowsHide: true,
            });

            let stdout = '';
            let stderr = '';
            const timer = setTimeout(() => {
                child.kill('SIGKILL');
                reject(new Error(`ciesa_ia CLI timeout after ${CIESA_IA_TIMEOUT_MS}ms`));
            }, CIESA_IA_TIMEOUT_MS);

            child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
            child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
            child.on('error', (err) => {
                clearTimeout(timer);
                reject(new Error(`ciesa_ia CLI spawn error: ${err.message}`));
            });
            child.on('close', (code) => {
                clearTimeout(timer);
                if (code !== 0) {
                    reject(new Error(`ciesa_ia CLI exit ${code}${stderr ? `: ${stderr.slice(0, 300)}` : ''}`));
                    return;
                }
                resolve({
                    text: extractJsonObject(stdout.trim() || '{}'),
                    provider: this.name,
                    model: model || 'auto',
                });
            });
        });
    }
}

function providersByPriority(): LlmProvider[] {
    if (AI_PROVIDER === 'bedrock')   return [new BedrockProvider(), new AnthropicProvider(), new OpenAiProvider()];
    if (AI_PROVIDER === 'ciesa_ia' || AI_PROVIDER === 'ciesa-ia' || AI_PROVIDER === 'kairos')
                                     return [new CiesaIaProvider(), new BedrockProvider(), new AnthropicProvider(), new OpenAiProvider(), new VsCodeLlmProvider()];
    if (AI_PROVIDER === 'openai')    return [new OpenAiProvider(), new BedrockProvider(), new AnthropicProvider(), new VsCodeLlmProvider()];
    if (AI_PROVIDER === 'anthropic') return [new AnthropicProvider(), new BedrockProvider(), new OpenAiProvider(), new VsCodeLlmProvider()];
    if (AI_PROVIDER === 'vscode')    return [new VsCodeLlmProvider(), new BedrockProvider(), new AnthropicProvider(), new OpenAiProvider()];
    if (AI_PROVIDER === 'ollama')    return [new OllamaProvider(), new VsCodeLlmProvider(), new BedrockProvider(), new AnthropicProvider(), new OpenAiProvider()];
    // Default: Bedrock first, then Anthropic direct, OpenAI, local fallbacks.
    return [new BedrockProvider(), new AnthropicProvider(), new OpenAiProvider(), new CiesaIaProvider(), new OllamaProvider(), new VsCodeLlmProvider()];
}

export async function runLlmWithFallback(messages: LlmMessage[], options?: { model?: string; temperature?: number }): Promise<LlmResponse> {
    const providers = providersByPriority();
    let lastError: unknown = null;
    for (const provider of providers) {
        try {
            return await provider.chat(messages, options);
        } catch (error) {
            lastError = error;
        }
    }
    throw new Error(`Nenhum provider LLM disponivel: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
