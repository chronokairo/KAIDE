import { container } from '../container';
import type { AiChatMessage, AiProvider, AiThinkingLevel, AiToolCall } from '../../core/application/ports/out/IGateways';

export type AgentMode = 'strategy' | 'build' | 'auto';
export type AgentContext = { repoFullName: string; branch: string; focus?: string };

// Eventos emitidos pelo loop do agente em streaming.
export type AgentEvent =
  | { type: 'tool'; name: string; status: 'start' | 'done' | 'error'; risk?: string; ms?: number; detail?: string }
  | { type: 'delta'; text: string }
  | { type: 'approval'; call: AiToolCall; preview: unknown }
  | { type: 'done'; audit: Array<{ tool: string; risk: string }>; mutatedRemote: boolean }
  | { type: 'error'; message: string };

function buildSystemPrompt(mode: AgentMode, context?: AgentContext) {
  const contextInstruction = context ? ` Contexto obrigatório: trabalhe exclusivamente no repositório selecionado ${context.repoFullName}, na branch ${context.branch}. O nome identifica o repositório inteiro em qualquer provider Git; caminhos como profile/README.md são relativos à raiz do clone e estão dentro do escopo. ${context.focus ? `O item selecionado para investigação é: ${context.focus}. Diagnostique esse item primeiro e proponha a resolução adequada.` : ''} Você pode consultar o estado Git e, com aprovação, trocar ou mesclar branches no clone. Não consulte nem altere outro repositório. Antes de propor qualquer apply_patch, leia o arquivo atual com read_repository_file e gere o diff somente contra o conteúdo lido nesta conversa. Nunca diga que uma alteração foi aplicada sem receber o resultado da tool com status patched.` : ' Nenhum repositório está selecionado. Quando o usuário perguntar quais repositórios existem, use a tool list_repositories para responder com dados reais do workspace, em vez de pedir que ele forneça a lista. Não invente repositórios.';
  const modeInstruction = mode === 'strategy' ? ' Modo strategy: produza plano e diagnóstico; não execute escrita.' : mode === 'build' ? ' Modo build: proponha escrita, mas aguarde aprovação para cada mutação.' : ' Modo auto at risk: pode executar escrita local aprovada pela policy, mas nunca faça push ou PR sem aprovação forte.';
  return `Você é um agente de entrega seguro.${modeInstruction} Nunca peça secrets e explique evidências. Nunca afirme que um PR foi fechado, reaberto, alterado ou que qualquer ação foi concluída sem receber o resultado correspondente da tool com status verificável.${contextInstruction}`;
}

const REMOTE_MUTATION_TOOLS = new Set(['create_pull_request', 'update_pull_request', 'push_branch']);

/**
 * Executa o loop do agente emitindo eventos ao vivo (status de tools + streaming do texto final).
 * O texto da resposta final é transmitido token-a-token via streamChat quando o modelo para de chamar tools.
 */
export async function* runAgentStream(
  provider: AiProvider,
  messages: AiChatMessage[],
  options: { model?: string; thinking?: AiThinkingLevel },
  context: AgentContext | undefined,
  mode: AgentMode,
): AsyncGenerator<AgentEvent> {
  const gateway = container.aiChatGateway;
  const registry = container.aiToolRegistry;
  const sanitized = messages.slice(-12).map((message) => ({ role: message.role, content: message.content.trim().slice(0, 8000) })).filter((message) => message.content);
  if (!sanitized.length || sanitized[sanitized.length - 1].role !== 'user') { yield { type: 'error', message: 'Envie uma mensagem válida.' }; return; }

  const conversation: Array<Record<string, unknown>> = [{ role: 'system', content: buildSystemPrompt(mode, context) }, ...sanitized];
  const audit: Array<{ tool: string; risk: string }> = [];
  let mutatedRemote = false;

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const response = await gateway.chatWithTools(provider, conversation, registry.definitionsForMode(mode), options);
    conversation.push(response.assistantMessage);

    if (!response.toolCalls.length) {
      // Sem mais tools: transmite o texto final token-a-token.
      const finalMessages: AiChatMessage[] = conversation
        .filter((message) => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string' && message.content)
        .map((message) => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.content as string }));
      // Garante a instrução de sistema como primeira mensagem de contexto.
      const streamMessages: AiChatMessage[] = finalMessages.length ? finalMessages : [{ role: 'user', content: sanitized[sanitized.length - 1].content }];
      let streamed = '';
      try {
        for await (const delta of gateway.streamChat(provider, streamMessages, options)) { streamed += delta; yield { type: 'delta', text: delta }; }
      } catch {
        // Fallback: usa o conteúdo já retornado pela última resposta se o streaming falhar.
        if (!streamed && response.content) yield { type: 'delta', text: response.content };
      }
      if (!streamed && response.content) yield { type: 'delta', text: response.content };
      yield { type: 'done', audit, mutatedRemote };
      return;
    }

    for (const call of response.toolCalls) {
      const startedAt = Date.now();
      yield { type: 'tool', name: call.name, status: 'start' };
      let result;
      try {
        result = await registry.execute(call, context, { mode });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha desconhecida ao executar a tool.';
        yield { type: 'tool', name: call.name, status: 'error', ms: Date.now() - startedAt, detail: message };
        conversation.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: message }) });
        continue;
      }
      if ('approvalRequired' in result && result.approvalRequired) { yield { type: 'approval', call, preview: result.preview }; return; }
      audit.push({ tool: result.tool, risk: result.risk });
      if (REMOTE_MUTATION_TOOLS.has(result.tool)) mutatedRemote = true;
      yield { type: 'tool', name: result.tool, status: 'done', risk: result.risk, ms: Date.now() - startedAt };
      conversation.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result.data).slice(0, 12000) });
    }
  }
  yield { type: 'error', message: 'O agente atingiu o limite de 6 rodadas de tools sem concluir.' };
}
