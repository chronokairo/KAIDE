'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ANNA } from '@/index';
import { useAnnaAuth } from '@/lib/anna-auth';
import { fetchCiesaContext } from '@/lib/ciesa-context';
import {
  requestChat, useChatModels, useAttachments, useAiSuggestions,
  ChatAppBar, MessageBubble, ChatInputBar, SuggestionsSidebar,
} from '@ciesa/anna-shared';
import type { Message, UsedSource } from '@ciesa/anna-shared';
import { DEFAULT_PLACEHOLDER, GREETING_MESSAGE, PLACEHOLDERS, SUGGESTED } from './constants';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useAnnaAuth();
  const searchConversationId = searchParams.get('conversationId');
  const resetParam = searchParams.get('reset');
  const promptFromDashboard = searchParams.get('prompt');

  const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef(false);
  const rotIndex = useRef(0);
  const ciesaContextRef = useRef<string>('');
  const autoPromptSentRef = useRef<string | null>(null);

  const {
    localProviders,
    chatProviderId,
    chatModels,
    chatModelId,
    chatModelsLoading,
    loadChatModels,
    selectProvider,
    selectModel,
    getActiveChatConfig,
  } = useChatModels();

  const { attachments, attachFiles, removeAttachment, clearAttachments } =
    useAttachments(searchConversationId);

  const { aiSuggestions, suggestionsLoading, restoreSuggestions, resetSuggestions } =
    useAiSuggestions({ suggestionsOpen, messages, conversationId, getActiveChatConfig });

  /* contexto institucional para o system prompt */
  useEffect(() => {
    fetchCiesaContext().then((ctx) => { ciesaContextRef.current = ctx; }).catch(() => {});
  }, []);

  /* rotação do placeholder */
  useEffect(() => {
    const id = setInterval(() => {
      if (!isFocused.current && !input) {
        setPlaceholder(`Tente: "${PLACEHOLDERS[rotIndex.current]}"`);
        rotIndex.current = (rotIndex.current + 1) % PLACEHOLDERS.length;
      }
    }, 4000);
    return () => clearInterval(id);
  }, [input]);

  /* novo chat quando ?reset=<ts> está presente */
  useEffect(() => {
    if (!resetParam) return;
    setMessages([GREETING_MESSAGE]);
    setConversationId(null);
    setInput('');
    setIsTyping(false);
    // Limpa as fontes para o novo chat começar limpo
    fetch('/api/sources?all=true', { method: 'DELETE' }).catch(() => null);
    clearAttachments();
    resetSuggestions();
    router.replace('/chat');
  }, [resetParam, router, clearAttachments, resetSuggestions]);

  /* auto-scroll — rola o container de mensagens diretamente */
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  /* carrega a conversa da URL */
  useEffect(() => {
    let cancelled = false;

    resetSuggestions();

    if (!searchConversationId) {
      setConversationId(null);
      setConversationLoading(false);
      setMessages([GREETING_MESSAGE]);
      return;
    }

    setConversationLoading(true);
    fetch(`/api/conversations/${searchConversationId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{
          id: string;
          providerId: string;
          modelId: string;
          messages: Array<{ id: number; role: 'user' | 'assistant'; content: string }>;
          suggestions?: { items: string[]; assistantCount: number } | null;
        }>;
      })
      .then((conversation) => {
        if (cancelled) return;
        setConversationId(conversation.id);
        const loadedMessages: Message[] = conversation.messages.map((message) => ({
          id: message.id,
          role: message.role === 'assistant' ? 'anna' : 'user',
          content: message.content,
        }));
        setMessages([GREETING_MESSAGE, ...loadedMessages]);
        // Restaura sugestões salvas se nenhuma msg nova da IA chegou desde a geração
        const assistantCount = conversation.messages.filter((m) => m.role === 'assistant').length;
        if (
          conversation.suggestions?.items.length &&
          conversation.suggestions.assistantCount === assistantCount
        ) {
          restoreSuggestions(conversation.suggestions.items, assistantCount);
        }
        void loadChatModels(conversation.providerId, conversation.modelId);
      })
      .catch(() => {
        if (cancelled) return;
        setConversationId(null);
        setMessages([GREETING_MESSAGE]);
      })
      .finally(() => {
        if (cancelled) return;
        setConversationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchConversationId]);

  async function persistTurn(userContent: string, assistantContent: string) {
    const activeConfig = getActiveChatConfig();
    if (!activeConfig) return;

    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversationId ?? undefined,
        providerId: activeConfig.providerId,
        modelId: activeConfig.modelId,
        userContent,
        assistantContent,
      }),
    });

    if (!res.ok) return;

    const payload = (await res.json()) as { conversationId?: string };
    if (!payload.conversationId || payload.conversationId === conversationId) return;

    const wasNew = !conversationId;
    setConversationId(payload.conversationId);
    window.history.replaceState(null, '', `/chat?conversationId=${payload.conversationId}`);

    // Se foi a primeira mensagem, adota as fontes de sessão para esta conversa
    if (wasNew) {
      fetch('/api/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adopt', conversationId: payload.conversationId }),
      }).catch(() => null);
    }
  }

  /** Busca contexto e citações dos documentos anexados para a pergunta atual. */
  async function searchAttachedSources(query: string) {
    let sourcesContext = '';
    const usedSourcesList: UsedSource[] = [];
    if (attachments.length === 0) return { sourcesContext, usedSourcesList };

    try {
      const srcRes = await fetch('/api/sources/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: [query], topK: 5 }),
      });
      if (srcRes.ok) {
        const srcData = (await srcRes.json()) as {
          context: string;
          results: Array<{ sourceId: string; name: string; type: string; content: string }>;
        };
        if (srcData.context) sourcesContext = srcData.context;
        if (srcData.results?.length) {
          const seen = new Set<string>();
          for (const r of srcData.results) {
            if (!seen.has(r.sourceId)) {
              seen.add(r.sourceId);
              usedSourcesList.push({ id: r.sourceId, name: r.name, type: r.type as UsedSource['type'] });
            }
          }
        }
      }
    } catch { /* não fatal */ }

    return { sourcesContext, usedSourcesList };
  }

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: text };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    /* matrícula - resposta padrão */
    const lower = text.toLowerCase();
    const matriculas = [
      'quero me matricular', 'me matricule', 'quero fazer matrícula',
      'quero me inscrever', 'quero fazer inscrição', 'quero uma matrícula',
      'quero iniciar minha matrícula', 'iniciar matrícula', 'fazer matrícula',
      'me inscreva', 'quero ingressar', 'quero entrar no curso',
    ];
    if (matriculas.some((p) => lower.includes(p))) {
      if (!auth.isAuthenticated) {
        const msg =
          'Para iniciar o processo de matrícula, você precisa estar autenticado. ' +
          'Acesse a página de login para liberar a matrícula. ' +
          'Enquanto isso, posso tirar dúvidas sobre os cursos e o CIESA.';
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: 'anna', content: msg },
        ]);
        await persistTurn(userMsg.content, msg);
        return;
      }

      setIsTyping(false);
      const template =
        'Formulário de Matrícula CIESA:\n' +
        '<br><br>Nome completo:\n' +
        '<br>Data de Nascimento:\n' +
        '<br>Cidade e Estado de Nascimento:\n' +
        '<br>Estado Civil:\n' +
        '<br>E-mail:\n' +
        '<br>RG:\n' +
        '<br>CPF:\n' +
        '<br>Endereço completo:\n' +
        '<br>CEP:\n' +
        '<br>Telefone Celular:\n' +
        '<br><br>Você pode digitar ou enviar os arquivos dos documentos.';
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'anna', content: template },
      ]);
      await persistTurn(userMsg.content, template);
      return;
    }

    const cfg = getActiveChatConfig();
    if (cfg?.baseUrl && cfg.modelId) {
      try {
        const history = [...messages, userMsg].map((m) => ({
          role: (m.role === 'anna' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: m.content,
        }));

        const { sourcesContext, usedSourcesList } = await searchAttachedSources(text);

        const systemContent =
          'Você é a Anna, assistente acadêmica do CIESA. ' +
          'Seja acolhedora, prestativa e converse de forma natural — como uma pessoa real que trabalha no atendimento, não como um robô. ' +
          'Use linguagem simples e amigável, pode usar expressões como "claro!", "é isso aí", "vamos lá". ' +
          'Responda em português de forma clara, mas sem ser fria ou robótica. ' +
          'Use as informações institucionais abaixo para responder sobre cursos, contato, endereços, bolsas, links e notícias do CIESA. ' +
          'Não invente informações que não estejam no contexto.\n\n' +
          '## Formatação das respostas\n' +
          '- SEMPRE que listar itens (cursos, opções, documentos, passos, horários, contatos, etc.), use lista markdown com um item por linha, prefixado com "- " (hífen + espaço).\n' +
          '- **REGRA DE ESPAÇAMENTO**: Deixe sempre uma linha em branco entre o texto informativo (ex: "Claro! Aqui estão...") e o início da lista. Exemplo:\n' +
          '  Claro! Aqui estão os cursos:\n\n' +
          '  - Curso 1\n' +
          '  - Curso 2\n' +
          '- Nunca junte itens em um único parágrafo separado por vírgulas; cada item deve estar em sua própria linha.\n' +
          '- Use **negrito** para destacar termos importantes (nomes de cursos, seções, palavras-chave).\n' +
          '- Use listas numeradas (1., 2., 3.) apenas quando a ordem for relevante (passos, procedimentos).\n\n' +
          '## Categorias de cursos (use estas definições para filtrar quando o usuário pedir por área)\n' +
          '- **Tecnologia**: Ciência da Computação (Bacharelado), Inteligência Artificial (Bacharelado), Engenharia da Computação (Bacharelado), Tecnólogo em Análise e Desenvolvimento de Sistemas, Tecnólogo em Jogos Digitais, Tecnólogo em Construção Naval.\n' +
          '- **Saúde**: Enfermagem, Farmácia, Fisioterapia, Psicologia, Educação Física, Tecnólogo em Estética e Cosmética.\n' +
          '- **Engenharias / Arquitetura**: Engenharia Civil, Arquitetura e Urbanismo.\n' +
          '- **Humanas / Sociais / Gestão**: Direito, Administração, Ciências Contábeis, Pedagogia, Marketing, Logística, Gestão de Recursos Humanos.\n' +
          'REGRAS DE FILTRAGEM:\n' +
          '1. Quando o usuário pedir "cursos de tecnologia", "área de TI", "computação", etc., você DEVE listar TODOS os itens da categoria **Tecnologia** acima.\n' +
          '2. NUNCA restrinja a categoria apenas a itens que contenham a palavra-chave no nome.\n' +
          '3. Se o usuário pedir por uma área, liste SOMENTE os cursos daquela área, seguindo exatamente a lista acima e respeitando a **REGRA DE ESPAÇAMENTO** (linha em branco antes da lista).\n\n' +
          '## Respostas objetivas e sem repetição\n' +
          '- Responda APENAS o que foi perguntado. Não repita listas ou informações já ditas na mesma resposta.\n' +
          '- Se o usuário fizer uma pergunta específica (ex: "cite só os cursos de tecnologia"), liste SOMENTE o que foi pedido, sem antes listar todos os cursos disponíveis.\n' +
          '- Se o usuário perguntar sobre **formas de ingresso**, explique os métodos de entrada (Vestibular, ENEM, etc.) descritos no contexto, em vez de listar os cursos.\n' +
          '- **Preços e Valores**: Sempre que citar um curso, mencione o preço "a partir de" presente no contexto. Explique que os valores podem variar conforme o turno e bolsa, e ofereça uma cotação detalhada usando as ferramentas se o usuário desejar.\n' +
          '- Seja concisa: 1 a 3 frases de contexto + a lista pedida. Evite introduções longas ou repetitivas.\n' +
          '- Não esqueça da linha em branco entre a introdução e a lista.\n\n' +
          ciesaContextRef.current +
          (sourcesContext
            ? '\n\n## Documentos anexados pelo usuário\n' +
              'O usuário anexou documentos. Use as informações abaixo para preencher os dados do candidato ' +
              '(nome, CPF, data de nascimento, e-mail, telefone, endereço etc.) e responder perguntas sobre os documentos. ' +
              'Sempre confirme com o usuário os dados extraídos antes de cadastrar ou inscrever.\n\n' +
              sourcesContext
            : '');

        const res = await requestChat({
          messages: [{ role: 'system', content: systemContent }, ...history],
          model: cfg.modelId,
          baseUrl: cfg.baseUrl,
          apiKey: cfg.apiKey ?? '',
          isAuthenticated: auth.isAuthenticated,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const assistantContent = res.content.trim() || '…';
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'anna',
            content: assistantContent,
            usedSources: usedSourcesList.length > 0 ? usedSourcesList : undefined,
          },
        ]);
        await persistTurn(userMsg.content, assistantContent);
        return;
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        const is503 = errMsg.includes('503');
        setIsTyping(false);
        const errContent = is503
          ? 'O servidor de IA não está respondendo agora. Tente novamente mais tarde.'
          : 'Ocorreu um erro ao conectar ao modelo. Tente novamente em instantes.';
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: 'anna', content: errContent },
        ]);
        return;
      }
    }

    // Fallback (nenhum modelo configurado)
    await new Promise((r) => setTimeout(r, 800));
    setIsTyping(false);
    const assistantContent = 'O serviço de IA está temporariamente indisponível. Tente novamente em instantes.';
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, role: 'anna', content: assistantContent },
    ]);
    await persistTurn(userMsg.content, assistantContent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatModelId, chatProviderId, localProviders, messages, attachments]);

  /* auto-envio do prompt vindo do dashboard (?prompt=...) */
  useEffect(() => {
    if (!promptFromDashboard?.trim()) return;
    if (conversationLoading || isTyping) return;
    if (!chatModelId) return;
    if (autoPromptSentRef.current === promptFromDashboard) return;

    autoPromptSentRef.current = promptFromDashboard;

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('prompt');
    const nextSearch = currentUrl.searchParams.toString();
    window.history.replaceState(
      null,
      '',
      nextSearch ? `${currentUrl.pathname}?${nextSearch}` : currentUrl.pathname,
    );

    void handleSend(promptFromDashboard);
  }, [promptFromDashboard, conversationLoading, isTyping, chatModelId, handleSend]);

  const suggestions = aiSuggestions ?? SUGGESTED;

  return (
    <main className={`ml-64 flex flex-col h-screen overflow-hidden bg-surface transition-[margin] duration-300 ${suggestionsOpen ? 'mr-80' : 'mr-0'}`}>
      <ChatAppBar
        localProviders={localProviders}
        chatProviderId={chatProviderId}
        chatModels={chatModels}
        chatModelId={chatModelId}
        chatModelsLoading={chatModelsLoading}
        suggestionsOpen={suggestionsOpen}
        onProviderSelect={selectProvider}
        onModelSelect={selectModel}
        onToggleSuggestions={() => setSuggestionsOpen((v) => !v)}
      />

      {/* ── Mensagens ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto chat-scrollbar px-margin-desktop">
        <div className="max-w-[800px] mx-auto space-y-8">
          {conversationLoading && (
            <div className="flex items-center gap-2 text-on-surface-variant px-2">
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              <span className="font-body-sm text-body-sm">Carregando conversa...</span>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-secondary animate-pulse px-2">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span className="font-body-sm text-body-sm">{ANNA.pendingText}</span>
            </div>
          )}
        </div>
      </div>

      <ChatInputBar
        input={input}
        placeholder={placeholder}
        isTyping={isTyping}
        attachments={attachments}
        inputRef={inputRef}
        onInputChange={setInput}
        onSubmit={() => handleSend(input)}
        onFocusChange={(focused) => {
          isFocused.current = focused;
          if (focused) setPlaceholder(DEFAULT_PLACEHOLDER);
        }}
        onAttachFiles={(files) => void attachFiles(files, conversationId)}
        onRemoveAttachment={(id) => void removeAttachment(id)}
      />

      {suggestionsOpen && (
        <SuggestionsSidebar
          isAiGenerated={!!aiSuggestions}
          loading={suggestionsLoading}
          suggestions={suggestions}
          onClose={() => setSuggestionsOpen(false)}
          onPick={(s) => {
            setInput(s);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        />
      )}
    </main>
  );
}
