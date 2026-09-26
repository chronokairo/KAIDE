// Ollama local LLM integration
// Proxy: /ollama → http://localhost:11434

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatOptions {
  model?: string;
  messages: OllamaMessage[];
  /** Called with each text chunk while streaming */
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

export interface OllamaChatResult {
  content: string;
  model: string;
  done: boolean;
}

export const DEFAULT_MODEL = 'llama3';

/**
 * Calls Ollama /api/chat via the Vite dev proxy (/ollama).
 * Uses streaming so the UI can show tokens as they arrive.
 */
export async function ollamaChat({
  model = DEFAULT_MODEL,
  messages,
  onChunk,
  signal,
}: OllamaChatOptions): Promise<OllamaChatResult> {
  let res: Response;
  try {
    res = await fetch('/ollama/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: !!onChunk }),
      signal,
    });
  } catch (err: any) {
    // NetworkError when Ollama is not running
    if (err.name === 'TypeError' && err.message?.includes('NetworkError')) {
      throw new Error('Ollama não está rodando ou não é acessível');
    }
    throw err;
  }

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }

  if (!onChunk) {
    // Non-streaming
    const json = await res.json();
    return {
      content: json.message?.content ?? '',
      model: json.model ?? model,
      done: true,
    };
  }

  // Streaming — each line is a JSON object
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');
  const decoder = new TextDecoder();
  let full = '';
  let lastModel = model;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value, { stream: true }).split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.model) lastModel = obj.model;
        const chunk: string = obj.message?.content ?? '';
        if (chunk) {
          full += chunk;
          onChunk(chunk);
        }
      } catch {
        // ignore malformed lines
      }
    }
  }

  return { content: full, model: lastModel, done: true };
}

/** System prompt with CRM context so the model can answer questions about the system */
export const CRM_SYSTEM_PROMPT = `Você é um assistente de CRM especializado para empresas de desenvolvimento de software.
Você tem acesso ao contexto do sistema CRM e pode responder perguntas sobre leads, funil de vendas,
follow-ups, propostas, clientes, projetos e métricas do negócio.

Contexto do sistema:
- CRM focado em vendas B2B para empresa de desenvolvimento de software
- Módulos: Leads, Funil de Vendas, Follow-ups, Atendimentos, Propostas, Clientes, GestãoLeads
- Ciclo de vendas B2B: Prospecção → Reunião de Descoberta → Proposta Enviada → Negociação → Contrato Assinado
- Responda sempre em português brasileiro
- Seja objetivo e direto; use tabelas e listas quando ajudar a visualizar dados
- Quando não tiver dados específicos, diga claramente e ofereça ajuda com o que for possível`;
