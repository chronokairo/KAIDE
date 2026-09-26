import { NextRequest } from 'next/server';
import { ToolSectorHarness } from '@ciesa/anna-shared';
import { analyzeMatriculaText, buildMatriculaAssistantReply, isMatriculaIntent } from '@/lib/matricula';
import { searchCalendar } from '@/lib/calendar-rag';
import { enqueueChatJob, type ChatJobResult } from '@/lib/chat-queue';
import { comercialSector } from '@/features/function-calling/sectors/comercial';

const harness = new ToolSectorHarness();
harness.register(comercialSector);

const CALENDAR_KEYWORDS = [
  'data', 'prazo', 'calendário', 'calendario', 'semestre', 'aula', 'feriado',
  'prova', 'exame', 'recesso', 'férias', 'ferias',
  'início', 'inicio', 'término', 'termino', 'período', 'periodo', 'quando',
  'mês', 'mes', 'semana', 'janeiro', 'fevereiro', 'março', 'abril', 'maio',
  'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  'npc', 'nef', 'avaliação', 'avaliacao', 'monitoria', 'colação', 'colacao',
  'vestibular', 'grau', 'formatura', 'recess', 'letivo',
];

function isCalendarQuestion(text: string): boolean {
  const lc = text.toLowerCase();
  return CALENDAR_KEYWORDS.some((kw) => lc.includes(kw));
}

function isBolsistasQuestion(text: string): boolean {
  const lc = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /bolsista|bolsa universidade|bolsas? da prefeitura|sgbu/.test(lc);
}

const SECRETARIA_KEYWORDS = [
  'boleto',
  'secretaria',
  'coordenação',
  'coordenacao',
  'formatura',
  'diploma',
];

const SECRETARIA_PAYMENT_PATTERNS = [
  /quero\s+pagar\s+(minha\s+)?mensalidade/,
  /pagar\s+(a\s+)?mensalidade/,
  /como\s+est[aá]\s+o\s+meu\s+boleto/,
  /segunda\s+via\s+do\s+boleto/,
  /emitir\s+boleto/,
  /pagar\s+boleto/,
  /quero\s+pagar\s+o\s+boleto/,
  /renegocia[cç][aã]o/,
  /quit[ae]r\s+mensalidade/,
];

function isSecretaryQuestion(text: string): boolean {
  const lc = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (SECRETARIA_PAYMENT_PATTERNS.some((re) => re.test(lc))) return true;
  return SECRETARIA_KEYWORDS.some((kw) => lc.includes(kw));
}

function isMonthlyValueQuestion(text: string): boolean {
  const lc = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (!lc.includes('mensal')) return false;
  if (SECRETARIA_PAYMENT_PATTERNS.some((re) => re.test(lc))) return false;
  return /valor|preco|preço|quanto|mensalidade|valor da mensalidade|quanto custa|custa/.test(lc);
}

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
      reasoning_content?: string;
      tool_calls?: ToolCall[];
    };
  }>;
}

interface ChatBody {
  messages: ChatMessage[];
  model: string;
  baseUrl: string;
  apiKey?: string;
  isAuthenticated?: boolean;
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
  return content
    .replace(TEXTUAL_TOOL_CALL_RE, '')
    .replace(/<\/?tool_call>/g, '')
    .trim();
}

function jsonResult(status: number, payload: unknown): ChatJobResult {
  return { status, body: JSON.stringify(payload) };
}

async function processChat(body: ChatBody): Promise<ChatJobResult> {
  const { messages, model, baseUrl, apiKey, isAuthenticated = false } = body;

  const parsed = new URL(baseUrl.replace(/\/$/, '') + '/chat/completions');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  async function executeTool(name: string, argsJson: string): Promise<string> {
    const result = await harness.executeTool(name, argsJson);
    if (result !== null) return result;
    return 'Ferramenta não reconhecida.';
  }

  async function callLLM(wireMessages: WireMessage[], withTools: boolean) {
    const reqBody: Record<string, unknown> = {
      model,
      messages: wireMessages,
      stream: false,
    };
    if (withTools) {
      reqBody.tools = harness.getAllToolDefs();
      reqBody.tool_choice = 'auto';
    }

    let upstream: Response;
    try {
      upstream = await fetch(parsed.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(90000),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: jsonResult(503, { error: `Upstream unreachable: ${msg}` }) };
    }

    if (!upstream.ok) {
      const err = await upstream.text();
      return { error: { status: upstream.status, body: err } };
    }

    return { data: (await upstream.json()) as UpstreamChatResponse };
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const hasMatriculaIntent = messages.some((m) => m.role === 'user' && isMatriculaIntent(m.content));
  const needsMatricula = isAuthenticated && hasMatriculaIntent;
  const guestMatriculaAttempt = !isAuthenticated && hasMatriculaIntent;
  const needsBolsistas = !needsMatricula && !!lastUserMsg && isBolsistasQuestion(lastUserMsg.content);
  const isMonthlyValue = !!lastUserMsg && isMonthlyValueQuestion(lastUserMsg.content);
  const needsCalendar =
    !needsMatricula && !needsBolsistas && !!lastUserMsg && isCalendarQuestion(lastUserMsg.content);
  const needsSecretary =
    !needsMatricula &&
    !needsBolsistas &&
    !!lastUserMsg &&
    isSecretaryQuestion(lastUserMsg.content) &&
    !isMonthlyValue;

  const TOOL_INSTRUCTION =
    '\n\nREGRA OBRIGATÓRIA: Para qualquer pergunta sobre datas, prazos, semestres, avaliações ' +
    'ou eventos acadêmicos, você DEVE chamar a ferramenta buscar_calendario ANTES de responder. ' +
    'NUNCA invente ou assuma datas. Se a ferramenta não retornar dados, informe que não há ' +
    'informação disponível no calendário oficial.';

  const MATRICULA_INSTRUCTION =
    '\n\nFLUXO DE MATRÍCULA (OBRIGATÓRIO): Você é a Anna, assistente de matrícula do CIESA. ' +
    'Conduza a matrícula por etapas usando as ferramentas disponíveis:\n' +
    '1. Use consultar_cursos para encontrar o curso desejado e mostrar opções reais (curso, turno, modalidade, campus, valor). NUNCA invente cursos ou valores.\n' +
    '2. Colete os dados do candidato: nome completo, CPF, data de nascimento, e-mail e telefone. Peça um dado de cada vez, de forma natural.\n' +
    '3. Use buscar_candidato_por_cpf para verificar se o candidato já tem cadastro.\n' +
    '4. Se não tiver, confirme os dados com o usuário e use cadastrar_candidato.\n' +
    '5. Confirme curso + turno + dados pessoais e SÓ ENTÃO use realizar_inscricao com os códigos da oferta (IDPS, IDAREAINTERESSE, IDHABILITACAOFILIAL) retornados por consultar_cursos.\n' +
    '6. Informe o número da inscrição ao final.\n' +
    'NUNCA invente códigos de oferta, números de inscrição ou resultados — use SEMPRE as ferramentas. ' +
    'Se uma ferramenta retornar erro, explique ao usuário e peça correção dos dados.';

  const BOLSISTAS_INSTRUCTION =
    '\n\nREGRA OBRIGATÓRIA: Para qualquer pergunta sobre bolsistas do CIESA (quem é bolsista, ' +
    'quantos bolsistas existem, bolsistas por curso ou turno), você DEVE chamar a ferramenta ' +
    'consultar_bolsistas ANTES de responder. Se o usuário mencionar um curso ou turno, passe-os ' +
    'nos parâmetros curso/turno da ferramenta. Responda usando SOMENTE os dados retornados, ' +
    'respeitando o escopo informado no resultado. NUNCA invente nomes ou quantidades de bolsistas. ' +
    'Os dados vêm do portal público de Bolsas Universitárias da Prefeitura de Manaus.';

  const SECRETARIA_INSTRUCTION =
    '\n\nASSUNTO DE SECRETARIA: O usuário perguntou sobre algo da secretaria ' +
    '(boletos, mensalidades, coordenação, formatura, diploma, contato etc.). ' +
    'DADOS OFICIAIS — use apenas estes:\n' +
    '- Secretaria do CIESA: (92) 99254-4746\n' +
    '- E-mail da secretaria: secretaria@ciesa.edu.br\n' +
    'IMPORTANTE: o número (92) 99350-2810 é do Comercial (este canal). O usuário já está falando conosco, ' +
    'então NÃO cite esse número. Apenas forneça os dados da secretaria de forma natural e objetiva.';

  if (guestMatriculaAttempt && lastUserMsg) {
    return jsonResult(200, {
      content:
        'Para iniciar o processo de matrícula, você precisa estar autenticado. ' +
        'Acesse a página de login para liberar a matrícula. ' +
        'Enquanto isso, posso tirar dúvidas sobre os cursos e o CIESA.',
    });
  }

  let wireMessages: WireMessage[] = messages.map((m) => ({ ...m }));

  const instruction = needsMatricula
    ? MATRICULA_INSTRUCTION
    : needsBolsistas
      ? BOLSISTAS_INSTRUCTION
      : needsSecretary
        ? SECRETARIA_INSTRUCTION
        : needsCalendar
          ? TOOL_INSTRUCTION
          : guestMatriculaAttempt
            ? '\n\nO usuário não está autenticado. Explique que ele pode conversar normalmente sem login, mas a matrícula só pode ser concluída após entrar na Anna. Não use ferramentas de matrícula e não prometa concluir o cadastro.'
          : '';
  if (instruction) {
    const sysIdx = wireMessages.findIndex((m) => m.role === 'system');
    if (sysIdx >= 0) {
      wireMessages[sysIdx] = {
        ...wireMessages[sysIdx],
        content: (wireMessages[sysIdx].content ?? '') + instruction,
      };
    } else {
      wireMessages = [{ role: 'system', content: instruction.trim() }, ...wireMessages];
    }
  }

  if (needsCalendar || needsMatricula || needsBolsistas || needsSecretary) {
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
            const result = await executeTool(tc.function.name, tc.function.arguments);
            toolResults.push({
              role: 'tool',
              content: result,
              tool_call_id: tc.id,
              name: tc.function.name,
            });
          }

          loopMessages = [...loopMessages, assistantWire, ...toolResults];
          continue;
        }

        const directContent = stripToolCallArtifacts(choice?.message?.content ?? '');
        if (directContent) {
          return jsonResult(200, { content: directContent });
        }

        break;
      }

      if (loopMessages.length > wireMessages.length) {
        const finalResp = await callLLM(loopMessages, false);
        if (!finalResp.error) {
          const grounded = stripToolCallArtifacts(
            finalResp.data.choices?.[0]?.message?.content ?? '',
          );
          if (grounded) {
            return jsonResult(200, { content: grounded });
          }
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (needsMatricula && lastUserMsg) {
    const matricula = analyzeMatriculaText(lastUserMsg.content);
    const content = buildMatriculaAssistantReply(matricula);
    return jsonResult(200, { content, matricula });
  }

  let finalMessages: WireMessage[] = messages.map((m) => ({ ...m }));

  if (needsCalendar) {
    try {
      const calendarContext = await searchCalendar(lastUserMsg!.content, baseUrl, 5);
      if (calendarContext) {
        const STRICT_PREFIX =
          'ATENÇÃO — USE APENAS OS DADOS ABAIXO DO CALENDÁRIO OFICIAL DO CIESA. ' +
          'NÃO INVENTE DATAS. NÃO USE CONHECIMENTO PRÓPRIO. ' +
          'Se a informação não estiver nos dados abaixo, diga que não está disponível.\n\n';

        const sysIdx = finalMessages.findIndex((m) => m.role === 'system');
        if (sysIdx >= 0) {
          finalMessages[sysIdx] = {
            ...finalMessages[sysIdx],
            content: (finalMessages[sysIdx].content ?? '') + '\n\n' + STRICT_PREFIX + calendarContext,
          };
        } else {
          finalMessages = [
            { role: 'system', content: STRICT_PREFIX + calendarContext },
            ...finalMessages,
          ];
        }
      }
    } catch {
      /* non-fatal */
    }
  }

  const first = await callLLM(finalMessages, false);
  if (first.error) return first.error;

  let content = first.data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    const compact = finalMessages.filter((m) => m.role !== 'assistant');
    const second = await callLLM(compact, false);
    if (second.error) return second.error;
    content = second.data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      content = second.data.choices?.[0]?.message?.reasoning_content?.trim() ?? '';
    }
  }

  return jsonResult(200, { content: content ?? '' });
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

  const job = enqueueChatJob(() => processChat(body));

  return new Response(
    JSON.stringify({ jobId: job.id, position: job.position, total: job.total }),
    { status: 202, headers: { 'Content-Type': 'application/json' } },
  );
}
