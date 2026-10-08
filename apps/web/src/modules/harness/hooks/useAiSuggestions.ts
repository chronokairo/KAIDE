'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { requestChat } from '../chat-client';
import type { Message } from '../chat/types';
import type { ActiveChatConfig } from './useChatModels';

interface UseAiSuggestionsArgs {
  suggestionsOpen: boolean;
  messages: Message[];
  conversationId: string | null;
  getActiveChatConfig: () => ActiveChatConfig | null;
}

export function useAiSuggestions({
  suggestionsOpen,
  messages,
  conversationId,
  getActiveChatConfig,
}: UseAiSuggestionsArgs) {
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestionsKeyRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(conversationId);
  conversationIdRef.current = conversationId;

  const conversationMessages = messages.slice(1);
  const annaCount = conversationMessages.filter((m) => m.role === 'anna').length;
  const lastMessage = conversationMessages[conversationMessages.length - 1] ?? null;
  const lastAnnaReply = lastMessage?.role === 'anna' ? lastMessage.content : null;
  const precedingUserPrompt = lastAnnaReply
    ? [...conversationMessages.slice(0, -1)].reverse().find((m) => m.role === 'user')?.content ?? null
    : null;

  const restoreSuggestions = useCallback((items: string[], assistantCount: number) => {
    setAiSuggestions(items);
    suggestionsKeyRef.current = `${assistantCount}`;
  }, []);

  const resetSuggestions = useCallback(() => {
    setAiSuggestions(null);
    suggestionsKeyRef.current = null;
  }, []);

  useEffect(() => {
    if (!suggestionsOpen || !lastAnnaReply || annaCount === 0) return;

    const key = `${annaCount}`;
    if (suggestionsKeyRef.current === key) return;

    const cfg = getActiveChatConfig();
    if (!cfg?.baseUrl || !cfg.modelId) return;

    suggestionsKeyRef.current = key;
    setSuggestionsLoading(true);

    (async () => {
      try {
        const res = await requestChat({
          messages: [
              {
                role: 'system',
                content:
                  'Você gera sugestões de próximas perguntas para um chat de matrícula do CIESA. ' +
                  'Com base na RESPOSTA mais recente da assistente Anna abaixo, gere exatamente 4 perguntas curtas (máx. 60 caracteres) ' +
                  'de follow-up que o usuário provavelmente fará sobre essa resposta, na voz do usuário, em português. ' +
                  'Responda SOMENTE com um array JSON de 4 strings, sem texto adicional.\n\n' +
                  (precedingUserPrompt ? `Pergunta do usuário: ${precedingUserPrompt}\n\n` : '') +
                  `Resposta da Anna: ${lastAnnaReply.slice(0, 1200)}`,
              },
              { role: 'user', content: 'Gere as 4 sugestões agora.' },
          ],
          model: cfg.modelId,
          baseUrl: cfg.baseUrl,
          apiKey: cfg.apiKey ?? '',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const match = res.content.match(/\[[\s\S]*?\]/);
        if (!match) throw new Error('Sem JSON na resposta');
        const parsed = JSON.parse(match[0]) as unknown;
        const list = (Array.isArray(parsed) ? parsed : [])
          .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
          .map((s) => s.trim())
          .slice(0, 4);
        if (!list.length) throw new Error('Lista vazia');
        setAiSuggestions(list);
        const cid = conversationIdRef.current;
        if (cid) {
          fetch(`/api/conversations/${cid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggestions: list, assistantCount: annaCount }),
          }).catch(() => null);
        }
      } catch {
        suggestionsKeyRef.current = null;
      } finally {
        setSuggestionsLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestionsOpen, annaCount, lastAnnaReply]);

  return { aiSuggestions, suggestionsLoading, restoreSuggestions, resetSuggestions };
}
