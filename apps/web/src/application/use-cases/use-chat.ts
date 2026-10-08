'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Conversation, Source, ChartData, TurnMetrics, ToolExecution } from '@/domain/chat';
import { chatUiService } from '@/infrastructure/composition/chat-service';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'agentes' | 'settings'>('chat');

  // Sidebars visibility
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Context inspector for right sidebar
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [activeMetrics, setActiveMetrics] = useState<TurnMetrics | undefined>(undefined);
  const [activeTools, setActiveTools] = useState<ToolExecution[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversations on mount
  useEffect(() => {
    chatUiService.listConversations()
      .then((list) => {
        setConversations(list);
        if (list.length > 0 && !activeConversationId) {
          setActiveConversationId(list[0].id);
        }
      })
      .catch((err) => console.error('[useChat] Erro ao carregar conversas:', err));
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    chatUiService.getMessages(activeConversationId)
      .then((msgs) => setMessages(msgs))
      .catch((err) => console.error('[useChat] Erro ao carregar mensagens:', err));
  }, [activeConversationId]);

  const selectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setActiveTab('chat');
  }, []);

  const newConversation = useCallback(async () => {
    try {
      const conv = await chatUiService.createConversation('Nova Conversa');
      setConversations((prev) => [conv, ...prev]);
      setActiveConversationId(conv.id);
      setMessages([]);
      setActiveSources([]);
      setActiveMetrics(undefined);
      setActiveTab('chat');
    } catch (err) {
      console.error('[useChat] Erro ao criar conversa:', err);
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await chatUiService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('[useChat] Erro ao deletar conversa:', err);
    }
  }, [activeConversationId]);

  const sendMessage = useCallback(async (customText?: string) => {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    const assistantId = Math.random().toString(36).substring(2, 15);
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    abortControllerRef.current = new AbortController();

    try {
      let currentConvId = activeConversationId;
      if (!currentConvId) {
        const created = await chatUiService.createConversation(textToSend.slice(0, 30));
        setConversations((prev) => [created, ...prev]);
        setActiveConversationId(created.id);
        currentConvId = created.id;
      }

      const response = await chatUiService.sendMessage({
        content: textToSend,
        conversationId: currentConvId ?? undefined,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        },
        onSources: (srcs) => {
          setActiveSources(srcs);
          if (srcs.length > 0) setRightSidebarOpen(true);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, sources: srcs } : msg
            )
          );
        },
        onCharts: (charts) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, charts } : msg
            )
          );
        },
        onMetrics: (metrics) => {
          setActiveMetrics(metrics);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, turnMetrics: metrics } : msg
            )
          );
        },
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: response.content || msg.content,
                sources: response.sources || msg.sources,
                charts: response.charts || msg.charts,
                turnMetrics: response.turnMetrics || msg.turnMetrics,
                isStreaming: false,
              }
            : msg
        )
      );

      if (response.sources && response.sources.length > 0) {
        setActiveSources(response.sources);
        setRightSidebarOpen(true);
      }
      if (response.turnMetrics) {
        setActiveMetrics(response.turnMetrics);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[useChat] Erro no envio da mensagem:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: msg.content || `Ocorreu um erro ao comunicar com a IA: ${err.message}`,
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeConversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveSources([]);
    setActiveMetrics(undefined);
  }, []);

  return {
    messages,
    conversations,
    activeConversationId,
    isLoading,
    input,
    setInput,
    activeTab,
    setActiveTab,
    leftSidebarOpen,
    setLeftSidebarOpen,
    rightSidebarOpen,
    setRightSidebarOpen,
    activeSources,
    activeMetrics,
    activeTools,
    sendMessage,
    selectConversation,
    newConversation,
    deleteConversation,
    clearMessages,
  };
}
