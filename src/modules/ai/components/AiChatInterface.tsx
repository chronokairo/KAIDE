"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAskIntelligenceAgent, useStreamAgentSession, useHarnessSessionMessages, useHarnessMemorySessions } from '@/modules/dev/hooks/useHarness';
import { isTauriRuntime, type AgentEvent } from '@/modules/dev/harness-client';
import { useAiDomainBridge } from '@/modules/ai/hooks/useAiDomainBridge';
import { useAiChat, type AiChatMessage } from '@/modules/ai/hooks/useAiChat';
import { ChatMessage, detectCtx, MODELS, EFFORT_LEVELS, ENVIRONMENTS, MODELS_DEV_PROVIDERS, NVIDIA_MODELS_FALLBACK } from './chat-types';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatMessageList } from './ChatMessageList';
import { ApprovalModal } from './ApprovalModal';
import { ChatInput } from './ChatInput';
import { AiChatHistorySidebar, type ChatHistoryItem } from './AiChatHistorySidebar';

interface AiChatInterfaceProps {
  sessionId?: number | null;
  selectedProjectName?: string;
  availableProjects?: Array<{ name: string; path: string }>;
  onSelectProjectName?: (projectName: string) => void;
  onMessageSent?: () => void;
  showSidebar?: boolean;
}

interface LocalSavedConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    toolCalls?: Array<{ name: string; status: 'completed' | 'running' | 'pending' | 'error' }>;
  }>;
}

const LOCAL_STORAGE_KEY = 'chronokairo_ai_chat_sessions';

function loadLocalSessions(): LocalSavedConversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: LocalSavedConversation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save chat sessions to localStorage:', err);
  }
}

export const AiChatInterface: React.FC<AiChatInterfaceProps> = ({
  sessionId = null,
  selectedProjectName = 'ChronoKairo ERP',
  availableProjects = [],
  onSelectProjectName,
  onMessageSent,
  showSidebar = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [pendingCtx, setPendingCtx] = useState<{ label: string; icon: string } | null>(null);

  const [selectedModel, setSelectedModelRaw] = useState<string>('meta/llama-3.3-70b-instruct');
  const [selectedEffort, setSelectedEffortRaw] = useState<string>(EFFORT_LEVELS[0] || 'High');
  const [selectedEnv, setSelectedEnv] = useState(ENVIRONMENTS[0]);
  const [selectedProvider, setSelectedProvider] = useState('nvidia');

  useEffect(() => {
    try {
      const savedModel = localStorage.getItem('chronokairo_ai_selected_model');
      if (savedModel) setSelectedModelRaw(savedModel);
      const savedEffort = localStorage.getItem('chronokairo_ai_selected_effort');
      if (savedEffort) setSelectedEffortRaw(savedEffort);
    } catch {}
  }, []);

  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelRaw(model);
    try { localStorage.setItem('chronokairo_ai_selected_model', model); } catch {}
  }, []);

  const setSelectedEffort = useCallback((effort: string) => {
    setSelectedEffortRaw(effort);
    try { localStorage.setItem('chronokairo_ai_selected_effort', effort); } catch {}
  }, []);

  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showEffortDropdown, setShowEffortDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(showSidebar);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId ? String(sessionId) : null);
  const [localConversations, setLocalConversations] = useState<LocalSavedConversation[]>([]);
  const [activeLocalMessages, setActiveLocalMessages] = useState<ChatMessage[] | null>(null);

  const { ask, lastError } = useAskIntelligenceAgent();
  const { enrichPrompt } = useAiDomainBridge();

  useEffect(() => {
    if (sessionId !== undefined) {
      setActiveSessionId(sessionId ? String(sessionId) : null);
    }
  }, [sessionId]);

  const numericSessionId = activeSessionId && !isNaN(Number(activeSessionId)) ? Number(activeSessionId) : null;
  const { result: sessionMsgsResult, loading: loadingSessionMsgs } = useHarnessSessionMessages(numericSessionId);

  const {
    startStream,
    interrupt,
    resolveApproval,
    running: streamRunning,
    events,
    textDeltas,
    toolCallDeltas,
    approvalRequest,
    sessionId: streamSessionId,
    lastError: streamLastError,
  } = useStreamAgentSession();

  const {
    messages: aiMessages,
    sendMessage: sendAiMessage,
    streaming: aiStreaming,
    activeTool: aiActiveTool,
    error: aiError,
    clearError,
    conversations: supabaseConversations,
    loadConversations,
    selectConversation,
  } = useAiChat(selectedModel);

  const [preparing, setPreparing] = useState(false);
  const isTauri = isTauriRuntime();

  useEffect(() => {
    setLocalConversations(loadLocalSessions());
    loadConversations();
  }, [loadConversations]);

  const unifiedConversations = useMemo((): ChatHistoryItem[] => {
    const list: ChatHistoryItem[] = [];
    const seenIds = new Set<string>();

    if (supabaseConversations && supabaseConversations.length > 0) {
      supabaseConversations.forEach((sc) => {
        if (!sc || !sc.id) return;
        seenIds.add(sc.id);
        list.push({
          id: sc.id,
          title: sc.title || 'Conversa sem título',
          updatedAt: sc.updated_at || sc.created_at,
          isLocal: false,
        });
      });
    }

    localConversations.forEach((lc) => {
      if (!seenIds.has(lc.id)) {
        seenIds.add(lc.id);
        list.push({
          id: lc.id,
          title: lc.title,
          updatedAt: lc.updatedAt,
          messageCount: lc.messages.length,
          isLocal: true,
        });
      }
    });

    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }, [supabaseConversations, localConversations]);

  const mappedAiMessages = useMemo((): ChatMessage[] => {
    return (aiMessages || []).map((m) => ({
      id: m.id,
      sender: m.role === 'user' ? 'user' : 'ai',
      text: m.content,
      isStreaming: m.isStreaming,
      toolCalls: m.toolCalls ? m.toolCalls.map((t) => ({ name: t.name })) : undefined,
    }));
  }, [aiMessages]);

  const messages: ChatMessage[] = useMemo(() => {
    if (activeLocalMessages && activeLocalMessages.length > 0) return activeLocalMessages;
    if (isTauri && numericSessionId && sessionMsgsResult?.data && sessionMsgsResult.data.length > 0) {
      return sessionMsgsResult.data.map((m) => ({
        id: `harness-msg-${m.id}`,
        sender: m.role === 'user' ? 'user' : 'ai',
        text: m.content,
      }));
    }
    return mappedAiMessages;
  }, [activeLocalMessages, isTauri, numericSessionId, sessionMsgsResult, mappedAiMessages]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, textDeltas, scrollToBottom]);

  useEffect(() => {
    if (aiMessages.length > 0 && activeSessionId) {
      setLocalConversations((prev) => {
        const idStr = String(activeSessionId);
        const title = aiMessages[0]?.content.slice(0, 45) || 'Conversa sem título';
        const existingIdx = prev.findIndex((p) => p.id === idStr);
        const updatedEntry: LocalSavedConversation = {
          id: idStr,
          title: existingIdx >= 0 ? prev[existingIdx].title : title,
          updatedAt: new Date().toISOString(),
          messages: aiMessages.map((m) => ({
            id: m.id,
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
            timestamp: m.timestamp,
            toolCalls: m.toolCalls,
          })),
        };
        const updatedList = existingIdx >= 0
          ? [updatedEntry, ...prev.filter((_, idx) => idx !== existingIdx)]
          : [updatedEntry, ...prev];
        saveLocalSessions(updatedList);
        return updatedList;
      });
    }
  }, [aiMessages, activeSessionId]);

  useEffect(() => {
    if (events.length === 0) return;
    const lastEvent = events[events.length - 1];
    if (lastEvent.type === 'Done' || lastEvent.type === 'Failed' || lastEvent.type === 'Interrupted') {
      setPreparing(false);
      setPendingCtx(null);
    }
  }, [events, textDeltas, toolCallDeltas]);

  useEffect(() => {
    if (approvalRequest) setShowApprovalModal(true);
  }, [approvalRequest]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H' || e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Listen for prompt injection from GitHub Notifications or other tools
    const onInjectPrompt = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt: string; project?: string; title?: string }>).detail;
      if (detail && detail.prompt) {
        setInputText(detail.prompt);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
            textareaRef.current.focus();
          }
        }, 100);
      }
    };

    // Check if there's any pending prompt saved in localStorage
    try {
      const pending = localStorage.getItem('chronokairo_pending_chat_prompt');
      if (pending) {
        setInputText(pending);
        localStorage.removeItem('chronokairo_pending_chat_prompt');
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
            textareaRef.current.focus();
          }
        }, 150);
      }
    } catch {}

    window.addEventListener('dev:chat-inject-prompt', onInjectPrompt);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dev:chat-inject-prompt', onInjectPrompt);
    };
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (val.startsWith('/')) {
      const match = val.match(/^\/(\w+)/);
      if (match) setPendingCtx(detectCtx(match[1]));
    } else if (pendingCtx) {
      setPendingCtx(null);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleNewConversation = useCallback(() => {
    setActiveSessionId(null);
    setActiveLocalMessages(null);
    clearError();
    textareaRef.current?.focus();
  }, [clearError]);

  const handleSelectConversation = useCallback(
    async (id: string | number) => {
      setActiveSessionId(String(id));
      setActiveLocalMessages(null);
      clearError();

      const sc = supabaseConversations?.find((c) => c.id === String(id));
      if (sc) {
        await selectConversation(sc);
        return;
      }

      const local = localConversations.find((c) => c.id === String(id));
      if (local) {
        setActiveLocalMessages(
          local.messages.map((m) => ({
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'ai',
            text: m.content,
            timestamp: m.timestamp,
            toolCalls: m.toolCalls?.map((tc) => ({ name: tc.name, summary: tc.status })),
          }))
        );
      }
    },
    [supabaseConversations, localConversations, selectConversation, clearError]
  );

  const handleDeleteConversation = useCallback(
    (id: string | number) => {
      const idStr = String(id);
      setLocalConversations((prev) => {
        const next = prev.filter((c) => c.id !== idStr);
        saveLocalSessions(next);
        return next;
      });
      if (String(activeSessionId) === idStr) handleNewConversation();
    },
    [activeSessionId, handleNewConversation]
  );

  const handleRenameConversation = useCallback((id: string | number, newTitle: string) => {
    const idStr = String(id);
    setLocalConversations((prev) => {
      const next = prev.map((c) => (c.id === idStr ? { ...c, title: newTitle } : c));
      saveLocalSessions(next);
      return next;
    });
  }, []);

  const handleClearAllConversations = useCallback(() => {
    if (window.confirm('Tem certeza de que deseja limpar todo o histórico de conversas?')) {
      setLocalConversations([]);
      saveLocalSessions([]);
      handleNewConversation();
    }
  }, [handleNewConversation]);

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const content = textToSend || inputText;
      if (!content.trim()) return;

      const rawContent = content.trim();
      setInputText('');
      setPendingCtx(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        currentSessionId = `chat-${Date.now()}`;
        setActiveSessionId(currentSessionId);
      }

      if (activeLocalMessages !== null) setActiveLocalMessages(null);

      if (isTauri && isTauriRuntime()) {
        try {
          const finalPrompt = await enrichPrompt(rawContent, currentSessionId).catch(() => rawContent);
          await startStream(
            finalPrompt,
            () => {},
            {
              workspace: selectedProjectName !== 'ChronoKairo ERP' ? selectedProjectName : undefined,
              model: selectedModel,
              session_id: currentSessionId,
            }
          );
        } catch (err) {
          console.error('Failed to stream in Tauri:', err);
        }
      } else {
        await sendAiMessage(rawContent, `You are ChronoKairo AI, an intelligent ERP assistant built into the ChronoKairo ERP system. You help users manage their business operations including finance, CRM, projects, billing, contracts, and more. Current model: ${selectedModel}. Respond in Portuguese when the user writes in Portuguese. Be helpful, concise, and professional.`);
      }

      onMessageSent?.();
    },
    [inputText, isTauri, enrichPrompt, startStream, selectedModel, activeSessionId, activeLocalMessages, selectedProjectName, sendAiMessage, onMessageSent]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInterrupt = () => interrupt();

  const handleResolveApproval = (decision: 'allow_once' | 'allow_session' | 'deny') => {
    if (approvalRequest) {
      resolveApproval(decision);
      setShowApprovalModal(false);
    }
  };

  const isRunning = streamRunning || preparing || aiStreaming;

  return (
    <div className="flex-1 flex h-full relative overflow-hidden bg-surface select-none">
      {/* History Sidebar */}
      {showSidebar && (
        <AiChatHistorySidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
          conversations={unifiedConversations}
          activeConversationId={activeSessionId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onClearAllConversations={handleClearAllConversations}
          isLoading={loadingSessionMsgs}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0 bg-surface">
        {showSidebar && !isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-3.5 left-3.5 z-20 w-8 h-8 rounded-xl bg-surface/90 backdrop-blur-md border border-outline-variant/60 shadow-xs flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
            title="Abrir histórico (Ctrl+H)"
          >
            <span className="material-symbols-outlined text-[18px]">dock_to_left</span>
          </button>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col no-scrollbar">
          {aiError && messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <span className="material-symbols-outlined text-[48px] mb-3 block text-error">error</span>
                <p className="font-medium text-on-surface">Erro na IA</p>
                <p className="text-sm text-on-surface-variant mt-2">{aiError}</p>
                <button
                  onClick={() => { clearError(); window.location.reload(); }}
                  className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 text-xs font-semibold"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : messages.length === 0 && !isRunning ? (
            <ChatEmptyState
              selectedProjectName={selectedProjectName}
              availableProjects={availableProjects}
              showProjectDropdown={showProjectDropdown}
              setShowProjectDropdown={setShowProjectDropdown}
              onSelectProjectName={onSelectProjectName}
              sendMessage={sendMessage}
            />
          ) : (
            <ChatMessageList
              messages={messages}
              isTauri={isTauri}
              streamRunning={streamRunning || aiStreaming}
              isThinking={preparing && !aiStreaming && !streamRunning}
              textDeltas={textDeltas}
              toolCallDeltas={toolCallDeltas}
              events={events}
              handleInterrupt={handleInterrupt}
              chatEndRef={chatEndRef}
            />
          )}
        </div>

        {showApprovalModal && approvalRequest && (
          <ApprovalModal approvalRequest={approvalRequest as any} onResolve={handleResolveApproval} />
        )}

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          textareaRef={textareaRef}
          handleTextareaChange={handleTextareaChange}
          handleKeyDown={handleKeyDown}
          sendMessage={sendMessage}
          isRunning={isRunning}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          selectedEffort={selectedEffort}
          setSelectedEffort={setSelectedEffort}
          selectedEnv={selectedEnv}
          setSelectedEnv={setSelectedEnv}
          showModelDropdown={showModelDropdown}
          setShowModelDropdown={setShowModelDropdown}
          showEffortDropdown={showEffortDropdown}
          setShowEffortDropdown={setShowEffortDropdown}
          showProviderDropdown={showProviderDropdown}
          setShowProviderDropdown={setShowProviderDropdown}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          streamRunning={streamRunning}
          handleInterrupt={handleInterrupt}
        />
      </div>
    </div>
  );
};
