'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  requestChat, useChatModels, useAttachments, useAiSuggestions,
  ChatAppBar, MessageBubble, ChatInputBar, SuggestionsSidebar,
} from '@ciesa/anna-shared';
import type { ChatQueueProgress, Message } from '@ciesa/anna-shared';
import {
  DEFAULT_PLACEHOLDER, GREETING_MESSAGE, PLACEHOLDERS, SUGGESTED,
} from './constants';

export default function VendasChatPage() {
  const searchParams = useSearchParams();
  const searchConversationId = searchParams.get('conversationId');

  const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [queueInfo, setQueueInfo] = useState<ChatQueueProgress | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef(false);
  const rotIndex = useRef(0);

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

  useEffect(() => {
    const id = setInterval(() => {
      if (!isFocused.current && !input) {
        setPlaceholder(`Tente: "${PLACEHOLDERS[rotIndex.current]}"`);
        rotIndex.current = (rotIndex.current + 1) % PLACEHOLDERS.length;
      }
    }, 4000);
    return () => clearInterval(id);
  }, [input]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const cfg = getActiveChatConfig();
    if (cfg?.baseUrl && cfg.modelId) {
      try {
        const history = [...messages, userMsg].map((m) => ({
          role: (m.role === 'anna' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: m.content,
        }));

        const systemContent =
          'Você é Anna Vendas, assistente de vendas do CIESA. ' +
          'Responda de forma clara, objetiva e em português. ' +
          'Use as ferramentas disponíveis para buscar leads, recomendar produtos, ' +
          'criar propostas, enviar e-mails e monitorar resultados. ' +
          'Nunca invente dados que não estejam no contexto ou retornados pelas ferramentas.';

        const res = await requestChat(
          {
            messages: [{ role: 'system', content: systemContent }, ...history],
            model: cfg.modelId,
            baseUrl: cfg.baseUrl,
            apiKey: cfg.apiKey ?? '',
          },
          (progress) => setQueueInfo(progress),
        );
        setQueueInfo(null);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const assistantContent = res.content.trim() || '…';
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: 'anna', content: assistantContent },
        ]);
        return;
      } catch {
        setQueueInfo(null);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'anna',
            content: 'Ocorreu um erro ao conectar ao modelo. Tente novamente em instantes.',
          },
        ]);
        return;
      }
    }

    await new Promise((r) => setTimeout(r, 800));
    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        role: 'anna',
        content: 'O serviço de IA está temporariamente indisponível. Tente novamente em instantes.',
      },
    ]);
  }, [chatModelId, chatProviderId, localProviders, messages, getActiveChatConfig]);

  const suggestions = aiSuggestions ?? SUGGESTED;

  return (
    <main className={`flex flex-col h-screen overflow-hidden relative bg-surface transition-all duration-300 ${suggestionsOpen ? 'mr-80' : 'mr-0'}`}>
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

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto chat-scrollbar pt-24 pb-44 px-margin-desktop">
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
              <span className="material-symbols-outlined text-sm">
                {queueInfo && !queueInfo.processing ? 'hourglass_top' : 'auto_awesome'}
              </span>
              <span className="font-body-sm text-body-sm">
                {queueInfo && !queueInfo.processing
                  ? `Na fila de atendimento — ${queueInfo.ahead} à frente`
                  : 'Anna Vendas está analisando…'}
              </span>
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
