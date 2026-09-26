// src/bedrock.ts
// Operações AWS Bedrock: listar modelos, invocar, gerenciar
import {
  ListFoundationModelsCommand,
  GetFoundationModelCommand,
  FoundationModelSummary,
} from '@aws-sdk/client-bedrock';
import {
  ConverseCommand,
  ConverseStreamCommand,
  ConverseRequest,
  ConverseStreamRequest,
  Message,
  ToolConfiguration,
  ContentBlock,
  ToolResultBlock,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from './client';
import { bedrockClientFor, bedrockCredentialsFor } from './aws-clients';
import { getEffectiveAwsConfig } from './config';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface BedrockModelSummary {
  modelId: string;
  modelArn: string;
  modelName: string;
  providerName: string;
  modalities: string[];
  supportedUseCases: string[];
  responseStreamingSupported: boolean;
  customizationsSupported: string[];
}

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string | OpenAIContent[];
}

// OpenAI-compatible content types (tool_use, tool_result, etc.)
export type OpenAIContent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string | Array<{ type: 'text'; text: string }> };

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export interface BedrockCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

export interface BedrockConverseOptions {
  modelId: string;
  messages: BedrockMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  tools?: OpenAITool[];
  toolChoice?: 'auto' | 'any' | 'none';
  credentials?: BedrockCredentials;
  // Conta AWS alvo (multi-conta). Quando informada, resolve credenciais Bedrock
  // dedicadas (usuário por conta) ou assume a role de gestão — ignora o bearer.
  accountId?: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface BedrockConverseResult {
  content: string;
  toolUse?: ToolUseBlock[];
  stopReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface BedrockStreamChunk {
  content: string;
  toolUse?: ToolUseBlock;
  done: boolean;
  stopReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

// ─────────────────────────────────────────────
// OpenAI → Bedrock format converters
// ─────────────────────────────────────────────

function convertMessages(messages: BedrockMessage[]): Message[] {
  return messages.map(msg => {
    const role = msg.role;
    if (typeof msg.content === 'string') {
      return { role, content: [{ text: msg.content }] };
    }
    // Array of content blocks (tool_use / tool_result / text)
    const blocks: ContentBlock[] = [];
    for (const block of msg.content as OpenAIContent[]) {
      if (block.type === 'text') {
        blocks.push({ text: block.text });
      } else if (block.type === 'tool_use') {
        blocks.push({
          toolUse: {
            toolUseId: block.id,
            name: block.name,
            input: block.input as any,
          },
        });
      } else if (block.type === 'tool_result') {
        const resultContent: ToolResultBlock['content'] = [];
        if (typeof block.content === 'string') {
          resultContent.push({ text: block.content });
        } else {
          for (const c of block.content) {
            resultContent.push({ text: c.text });
          }
        }
        blocks.push({
          toolResult: {
            toolUseId: block.tool_use_id,
            content: resultContent,
          },
        });
      }
    }
    return { role, content: blocks };
  });
}

function convertTools(tools: OpenAITool[]): ToolConfiguration {
  return {
    tools: tools.map(t => ({
      toolSpec: {
        name: t.function.name,
        description: t.function.description,
        inputSchema: {
          json: (t.function.parameters ?? { type: 'object', properties: {} }),
        } as any,
      },
    })) as any,
    toolChoice: { auto: {} },
  };
}

// Build a Bedrock Converse request body (shared between SDK and Bearer paths)
function buildConverseBody(options: BedrockConverseOptions) {
  const { messages, system, maxTokens, temperature, topP, stopSequences, tools, toolChoice } = options;
  const body: any = {
    messages: convertMessages(messages),
    inferenceConfig: {
      maxTokens,
      temperature,
      topP,
      stopSequences,
    },
  };
  if (system) body.system = [{ text: system }];
  if (tools && tools.length > 0) {
    const toolConfig = convertTools(tools);
    if (toolChoice === 'none') toolConfig.toolChoice = undefined;
    else if (toolChoice === 'any') toolConfig.toolChoice = { any: {} };
    body.toolConfig = toolConfig;
  }
  return body;
}

// ─────────────────────────────────────────────
// Bearer token (ABSK) raw HTTP helpers
// ─────────────────────────────────────────────

function bedrockRuntimeUrl(region: string, modelId: string, streaming: boolean) {
  const encoded = encodeURIComponent(modelId);
  const path = streaming ? `/model/${encoded}/converse-stream` : `/model/${encoded}/converse`;
  return `https://bedrock-runtime.${region}.amazonaws.com${path}`;
}

function bearerHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ─────────────────────────────────────────────
// Listar modelos disponíveis no Bedrock
// ─────────────────────────────────────────────

export async function listBedrockModels(
  provider?: string,
  accountId?: string
): Promise<BedrockModelSummary[]> {
  const input: any = {};
  if (provider) input.byProvider = provider;

  const command = new ListFoundationModelsCommand(input);
  const client = accountId ? bedrockClientFor(accountId) : bedrockClient;
  const response = await client.send(command);

  return (response.modelSummaries || []).map(formatModelSummary);
}

function formatModelSummary(model: FoundationModelSummary): BedrockModelSummary {
  return {
    modelId: model.modelId || '',
    modelArn: model.modelArn || '',
    modelName: model.modelName || '',
    providerName: model.providerName || '',
    modalities: model.inferenceTypesSupported || [],
    supportedUseCases: model.inputModalities || [],
    responseStreamingSupported: model.responseStreamingSupported || false,
    customizationsSupported: model.customizationsSupported || [],
  };
}

// ─────────────────────────────────────────────
// Detalhes de um modelo específico
// ─────────────────────────────────────────────

export async function getBedrockModelDetails(
  modelId: string,
  accountId?: string
): Promise<BedrockModelSummary | null> {
  try {
    const command = new GetFoundationModelCommand({
      modelIdentifier: modelId,
    });
    const client = accountId ? bedrockClientFor(accountId) : bedrockClient;
    const response = await client.send(command);
    if (!response.modelDetails) return null;
    return formatModelSummary(response.modelDetails);
  } catch (error) {
    console.error(`Erro ao obter detalhes do modelo ${modelId}:`, error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Invocar modelo (Converse API — recomendada)
// Suporta Bearer (ABSK) token ou IAM SigV4
// ─────────────────────────────────────────────

export async function converseWithBedrock(
  options: BedrockConverseOptions
): Promise<BedrockConverseResult> {
  const config = await getEffectiveAwsConfig();
  const creds = await resolveConverseCredentials(options);
  const effectiveConfig = creds
    ? { ...config, ACCESS_KEY_ID: creds.accessKeyId, SECRET_ACCESS_KEY: creds.secretAccessKey, BEDROCK_REGION: creds.region ?? config.BEDROCK_REGION }
    : config;
  const bearerToken = creds ? null : effectiveConfig.BEDROCK_BEARER_TOKEN;

  if (bearerToken) {
    return converseWithBedrockBearer(options, bearerToken, effectiveConfig);
  }

  return converseWithBedrockSDK(options, effectiveConfig);
}

// Resolve credenciais Bedrock: credenciais explícitas > por accountId (multi-conta)
// > undefined (preserva o comportamento bearer/da conta de gestão).
async function resolveConverseCredentials(
  options: BedrockConverseOptions
): Promise<BedrockCredentials | undefined> {
  if (options.credentials) return options.credentials;
  if (!options.accountId) return undefined;
  const resolved = await bedrockCredentialsFor(options.accountId)();
  return {
    accessKeyId: resolved.accessKeyId,
    secretAccessKey: resolved.secretAccessKey,
  };
}

async function converseWithBedrockBearer(
  options: BedrockConverseOptions,
  token: string,
  config: Awaited<ReturnType<typeof getEffectiveAwsConfig>>,
): Promise<BedrockConverseResult> {
  const url = bedrockRuntimeUrl(config.BEDROCK_REGION, options.modelId, false);
  const body = buildConverseBody(options);

  const res = await fetch(url, {
    method: 'POST',
    headers: bearerHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Bedrock Bearer converse failed ${res.status}: ${text}`);
  }

  const data = await res.json() as any;
  const outputBlocks: any[] = data.output?.message?.content ?? [];
  const content = outputBlocks.map((b: any) => b.text ?? '').join('');
  const toolUse: ToolUseBlock[] = outputBlocks
    .filter((b: any) => b.toolUse)
    .map((b: any) => ({
      type: 'tool_use' as const,
      id: b.toolUse.toolUseId ?? '',
      name: b.toolUse.name ?? '',
      input: (b.toolUse.input ?? {}) as Record<string, unknown>,
    }));

  return {
    content,
    toolUse: toolUse.length > 0 ? toolUse : undefined,
    stopReason: data.stopReason,
    usage: data.usage
      ? {
          inputTokens: data.usage.inputTokens || 0,
          outputTokens: data.usage.outputTokens || 0,
          totalTokens: (data.usage.inputTokens || 0) + (data.usage.outputTokens || 0),
        }
      : undefined,
  };
}

async function converseWithBedrockSDK(
  options: BedrockConverseOptions,
  config: Awaited<ReturnType<typeof getEffectiveAwsConfig>>,
): Promise<BedrockConverseResult> {
  const { modelId, messages, system, maxTokens, temperature, topP, stopSequences, tools, toolChoice } = options;
  const runtimeClient = new BedrockRuntimeClient({
    region: config.BEDROCK_REGION,
    credentials: { accessKeyId: config.ACCESS_KEY_ID, secretAccessKey: config.SECRET_ACCESS_KEY },
  });

  const request: ConverseRequest = {
    modelId,
    messages: convertMessages(messages),
    inferenceConfig: {
      maxTokens,
      temperature,
      topP,
      stopSequences,
    },
  };

  if (system) {
    request.system = [{ text: system }];
  }

  if (tools && tools.length > 0) {
    request.toolConfig = convertTools(tools);
    if (toolChoice === 'none') {
      request.toolConfig.toolChoice = undefined;
    } else if (toolChoice === 'any') {
      request.toolConfig.toolChoice = { any: {} };
    }
  }

  const command = new ConverseCommand(request);
  const response = await runtimeClient.send(command);

  const outputBlocks = response.output?.message?.content ?? [];
  const content = outputBlocks.map(b => b.text ?? '').join('');
  const toolUse: ToolUseBlock[] = outputBlocks
    .filter(b => b.toolUse)
    .map(b => ({
      type: 'tool_use' as const,
      id: b.toolUse!.toolUseId ?? '',
      name: b.toolUse!.name ?? '',
      input: (b.toolUse!.input ?? {}) as Record<string, unknown>,
    }));

  return {
    content,
    toolUse: toolUse.length > 0 ? toolUse : undefined,
    stopReason: response.stopReason,
    usage: response.usage
      ? {
          inputTokens: response.usage.inputTokens || 0,
          outputTokens: response.usage.outputTokens || 0,
          totalTokens: (response.usage.inputTokens || 0) + (response.usage.outputTokens || 0),
        }
      : undefined,
  };
}

// ─────────────────────────────────────────────
// Invocar modelo com streaming
// Suporta Bearer (ABSK) token ou IAM SigV4
// ─────────────────────────────────────────────

export async function* converseWithBedrockStream(
  options: BedrockConverseOptions
): AsyncGenerator<BedrockStreamChunk> {
  const config = await getEffectiveAwsConfig();
  const creds = await resolveConverseCredentials(options);
  const effectiveConfig = creds
    ? { ...config, ACCESS_KEY_ID: creds.accessKeyId, SECRET_ACCESS_KEY: creds.secretAccessKey, BEDROCK_REGION: creds.region ?? config.BEDROCK_REGION }
    : config;
  const bearerToken = creds ? null : effectiveConfig.BEDROCK_BEARER_TOKEN;

  if (bearerToken) {
    yield* converseWithBedrockStreamBearer(options, bearerToken, effectiveConfig);
    return;
  }

  yield* converseWithBedrockStreamSDK(options, effectiveConfig);
}

async function* converseWithBedrockStreamBearer(
  options: BedrockConverseOptions,
  token: string,
  config: Awaited<ReturnType<typeof getEffectiveAwsConfig>>,
): AsyncGenerator<BedrockStreamChunk> {
  const url = bedrockRuntimeUrl(config.BEDROCK_REGION, options.modelId, true);
  const body = buildConverseBody(options);

  const res = await fetch(url, {
    method: 'POST',
    headers: bearerHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Bedrock Bearer stream failed ${res.status}: ${text}`);
  }

  if (!res.body) return;

  // Bedrock streaming uses AWS Event Stream protocol over HTTP/1.1.
  // Each event is: 4-byte total length, 4-byte header length, 4-byte prelude CRC,
  // headers, payload JSON, 4-byte message CRC.
  // We parse the payload JSON from each event to get the Converse stream events.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = new Uint8Array(0);
  const pendingToolUse = new Map<number, { id: string; name: string; inputJson: string }>();

  function appendBuffer(chunk: Uint8Array) {
    const next = new Uint8Array(buffer.length + chunk.length);
    next.set(buffer);
    next.set(chunk, buffer.length);
    buffer = next;
  }

  function readUint32(buf: Uint8Array, offset: number): number {
    return ((buf[offset] << 24) | (buf[offset+1] << 16) | (buf[offset+2] << 8) | buf[offset+3]) >>> 0;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    appendBuffer(value);

    // Process all complete messages in buffer
    while (buffer.length >= 12) {
      const totalLength = readUint32(buffer, 0);
      if (buffer.length < totalLength) break;

      const headerLength = readUint32(buffer, 4);
      // prelude CRC at bytes 8-11 (skip)
      const payloadStart = 12 + headerLength;
      const payloadEnd = totalLength - 4; // last 4 bytes are message CRC
      const payloadBytes = buffer.slice(payloadStart, payloadEnd);
      buffer = buffer.slice(totalLength);

      let payloadStr: string;
      try {
        payloadStr = decoder.decode(payloadBytes);
      } catch {
        continue;
      }

      // Each event payload is: headers + JSON event. The event itself is base64-encoded
      // inside a wrapper. Let's try to parse as the event wrapper first.
      let event: any;
      try {
        const wrapper = JSON.parse(payloadStr);
        // The payload may be { bytes: "<base64>" } wrapper
        if (wrapper.bytes) {
          const inner = Buffer.from(wrapper.bytes, 'base64').toString('utf-8');
          event = JSON.parse(inner);
        } else {
          event = wrapper;
        }
      } catch {
        continue;
      }

      // Now process the Converse stream event (same shape as SDK events)
      if (event.contentBlockDelta?.delta?.text) {
        yield { content: event.contentBlockDelta.delta.text, done: false };
      }

      if (event.contentBlockStart?.start?.toolUse) {
        const idx = event.contentBlockStart.contentBlockIndex ?? 0;
        const tu = event.contentBlockStart.start.toolUse;
        pendingToolUse.set(idx, { id: tu.toolUseId ?? '', name: tu.name ?? '', inputJson: '' });
      }

      if (event.contentBlockDelta?.delta?.toolUse?.input) {
        const idx = event.contentBlockDelta.contentBlockIndex ?? 0;
        const pending = pendingToolUse.get(idx);
        if (pending) pending.inputJson += event.contentBlockDelta.delta.toolUse.input;
      }

      if (event.contentBlockStop !== undefined) {
        const idx = event.contentBlockStop.contentBlockIndex ?? 0;
        const pending = pendingToolUse.get(idx);
        if (pending) {
          let input: Record<string, unknown> = {};
          try { input = JSON.parse(pending.inputJson); } catch { /* partial */ }
          yield { content: '', done: false, toolUse: { type: 'tool_use', id: pending.id, name: pending.name, input } };
          pendingToolUse.delete(idx);
        }
      }

      if (event.messageStop) {
        yield { content: '', done: true, stopReason: event.messageStop.stopReason };
      }

      if (event.metadata?.usage) {
        yield {
          content: '',
          done: false,
          usage: {
            inputTokens: event.metadata.usage.inputTokens || 0,
            outputTokens: event.metadata.usage.outputTokens || 0,
            totalTokens: (event.metadata.usage.inputTokens || 0) + (event.metadata.usage.outputTokens || 0),
          },
        };
      }
    }
  }
}

async function* converseWithBedrockStreamSDK(
  options: BedrockConverseOptions,
  config: Awaited<ReturnType<typeof getEffectiveAwsConfig>>,
): AsyncGenerator<BedrockStreamChunk> {
  const { modelId, messages, system, maxTokens, temperature, topP, stopSequences, tools, toolChoice } = options;
  const runtimeClient = new BedrockRuntimeClient({
    region: config.BEDROCK_REGION,
    credentials: { accessKeyId: config.ACCESS_KEY_ID, secretAccessKey: config.SECRET_ACCESS_KEY },
  });

  const request: ConverseStreamRequest = {
    modelId,
    messages: convertMessages(messages),
    inferenceConfig: {
      maxTokens,
      temperature,
      topP,
      stopSequences,
    },
  };

  if (system) {
    request.system = [{ text: system }];
  }

  if (tools && tools.length > 0) {
    request.toolConfig = convertTools(tools);
    if (toolChoice === 'none') {
      request.toolConfig.toolChoice = undefined;
    } else if (toolChoice === 'any') {
      request.toolConfig.toolChoice = { any: {} };
    }
  }

  const command = new ConverseStreamCommand(request);
  const response = await runtimeClient.send(command);

  if (!response.stream) return;

  const pendingToolUse = new Map<number, { id: string; name: string; inputJson: string }>();

  for await (const chunk of response.stream) {
    if (chunk.contentBlockDelta?.delta?.text) {
      yield { content: chunk.contentBlockDelta.delta.text, done: false };
    }

    if (chunk.contentBlockStart?.start?.toolUse) {
      const idx = chunk.contentBlockStart.contentBlockIndex ?? 0;
      const tu = chunk.contentBlockStart.start.toolUse;
      pendingToolUse.set(idx, { id: tu.toolUseId ?? '', name: tu.name ?? '', inputJson: '' });
    }

    if (chunk.contentBlockDelta?.delta?.toolUse?.input) {
      const idx = chunk.contentBlockDelta.contentBlockIndex ?? 0;
      const pending = pendingToolUse.get(idx);
      if (pending) pending.inputJson += chunk.contentBlockDelta.delta.toolUse.input;
    }

    if (chunk.contentBlockStop) {
      const idx = chunk.contentBlockStop.contentBlockIndex ?? 0;
      const pending = pendingToolUse.get(idx);
      if (pending) {
        let input: Record<string, unknown> = {};
        try { input = JSON.parse(pending.inputJson); } catch { /* partial */ }
        yield {
          content: '',
          done: false,
          toolUse: { type: 'tool_use', id: pending.id, name: pending.name, input },
        };
        pendingToolUse.delete(idx);
      }
    }

    if (chunk.messageStop) {
      yield { content: '', done: true, stopReason: chunk.messageStop.stopReason };
    }

    if (chunk.metadata?.usage) {
      yield {
        content: '',
        done: false,
        usage: {
          inputTokens: chunk.metadata.usage.inputTokens || 0,
          outputTokens: chunk.metadata.usage.outputTokens || 0,
          totalTokens: (chunk.metadata.usage.inputTokens || 0) + (chunk.metadata.usage.outputTokens || 0),
        },
      };
    }
  }
}
