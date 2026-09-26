import { NextRequest } from 'next/server';
import { ToolSectorHarness } from '@ciesa/anna-shared';
import { vendasSector } from '@/features/function-calling/sectors/vendas';

const harness = new ToolSectorHarness();
harness.register(vendasSector);

interface WireMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface UpstreamChatResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: ToolCall[];
    };
  }>;
}

interface ChatBody {
  messages: ChatMessage[];
  model: string;
  baseUrl: string;
  apiKey?: string;
}

interface ChatJobResult {
  status: number;
  body: string;
}

const TEXTUAL_TOOL_CALL_RE = /<tool_call>\s*<function=([\w-]+)>([\s\S]*?)(?:<\/function>)?\s*<\/tool_call>/g;

function parseTextualToolCalls(content: string): ToolCall[] {
  const calls: ToolCall[] = [];
  let match: RegExpExecArray | null;
  TEXTUAL_TOOL_CALL_RE.lastIndex = 0;
  while ((match = TEXTUAL_TOOL_CALL_RE.exec(content)) !== null) {
    const [, name, body] = match;
    const args: Record<string, string> = {};
    const paramRe = /<parameter=([\w-]+)>\s*([\s\S]*?)(?=<parameter=|<\/|$)/g;
    let paramMatch: RegExpExecArray | null;
    while ((paramMatch = paramRe.exec(body)) !== null) {
      args[paramMatch[1]] = paramMatch[2].trim();
    }
    calls.push({
      id: `textual-${calls.length}-${Date.now()}`,
      type: 'function',
      function: { name, arguments: JSON.stringify(args) },
    });
  }
  return calls;
}

function stripToolCallArtifacts(content: string): string {
  return content.replace(TEXTUAL_TOOL_CALL_RE, '').replace(/<\/?tool_call>/g, '').trim();
}

function jsonResult(status: number, payload: unknown): ChatJobResult {
  return { status, body: JSON.stringify(payload) };
}

async function processChat(body: ChatBody): Promise<ChatJobResult> {
  const { messages, model, baseUrl, apiKey } = body;
  const parsed = new URL(baseUrl.replace(/\/$/, '') + '/chat/completions');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  async function callLLM(wireMessages: WireMessage[], withTools: boolean) {
    const reqBody: Record<string, unknown> = { model, messages: wireMessages, stream: false };
    if (withTools) {
      reqBody.tools = harness.getAllToolDefs();
      reqBody.tool_choice = 'auto';
    }
    try {
      const upstream = await fetch(parsed.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(90000),
      });
      if (!upstream.ok) return { error: { status: upstream.status, body: await upstream.text() } };
      return { data: (await upstream.json()) as UpstreamChatResponse };
    } catch (e) {
      return { error: { status: 503, body: JSON.stringify({ error: `Upstream unreachable: ${e instanceof Error ? e.message : String(e)}` }) } };
    }
  }

  const wireMessages: WireMessage[] = messages.map((m) => ({ ...m }));
  const sectorResult = harness.detectSectorFromHistory(messages);

  let instruction = '';
  if (sectorResult.sectorId) {
    instruction = harness.getSectorInstruction(sectorResult.sectorId);
  }

  if (instruction) {
    const sysIdx = wireMessages.findIndex((m) => m.role === 'system');
    if (sysIdx >= 0) {
      wireMessages[sysIdx] = {
        ...wireMessages[sysIdx],
        content: (wireMessages[sysIdx].content ?? '') + instruction,
      };
    } else {
      wireMessages.unshift({ role: 'system', content: instruction.trim() });
    }
  }

  try {
    const MAX_TOOL_ROUNDS = 5;
    let loopMessages: WireMessage[] = [...wireMessages];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const toolResp = await callLLM(loopMessages, true);
      if (toolResp.error) break;

      const choice = toolResp.data.choices?.[0];
      let toolCalls = choice?.message?.tool_calls;
      const rawContent = choice?.message?.content ?? '';

      if (!toolCalls?.length && rawContent.includes('<tool_call>')) {
        const parsedCalls = parseTextualToolCalls(rawContent);
        if (parsedCalls.length) toolCalls = parsedCalls;
      }

      if (toolCalls?.length) {
        const assistantWire: WireMessage = {
          role: 'assistant',
          content: choice?.message?.tool_calls?.length ? choice.message.content ?? null : null,
          tool_calls: toolCalls,
        };
        const toolResults: WireMessage[] = [];
        for (const tc of toolCalls) {
          const result = await harness.executeTool(tc.function.name, tc.function.arguments);
          toolResults.push({
            role: 'tool',
            content: result ?? 'Ferramenta não reconhecida.',
            tool_call_id: tc.id,
            name: tc.function.name,
          });
        }
        loopMessages = [...loopMessages, assistantWire, ...toolResults];
        continue;
      }

      const directContent = stripToolCallArtifacts(choice?.message?.content ?? '');
      if (directContent) return jsonResult(200, { content: directContent });
      break;
    }

    if (loopMessages.length > wireMessages.length) {
      const finalResp = await callLLM(loopMessages, false);
      if (!finalResp.error) {
        const grounded = stripToolCallArtifacts(finalResp.data.choices?.[0]?.message?.content ?? '');
        if (grounded) return jsonResult(200, { content: grounded });
      }
    }
  } catch {}

  const finalResp = await callLLM(wireMessages, false);
  if (finalResp.error) return finalResp.error;
  const content = finalResp.data.choices?.[0]?.message?.content?.trim() ?? '';
  return jsonResult(200, { content });
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { messages, model, baseUrl } = body;

  if (!baseUrl || !model) {
    return new Response(JSON.stringify({ error: 'Missing baseUrl or model' }), { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl.replace(/\/$/, '') + '/chat/completions');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid baseUrl' }), { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return new Response(JSON.stringify({ error: 'Invalid protocol' }), { status: 400 });
  }

  const result = await processChat(body);
  return new Response(result.body, {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
