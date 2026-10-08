'use client';

import { useState, useCallback, useRef } from 'react';
import { getDefaultLlmProvider, type LlmStreamChunk, type NvidiaNimProviderConfig } from '@/modules/ai/core/providers/llm-provider';
import { aiSessionService, type AiConversationEntity, type AiMessageEntity } from '@/modules/ai/core/services/ai-session.service';
import { useOrganizationContext } from '@/providers/OrganizationProvider';
import { getAuthSession } from '@/shared/supabase';
import { isTauriRuntime, harnessClient, type AgentEvent, type ApprovalRequest } from '@/modules/dev/harness-client';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  toolCalls?: Array<{ name: string; status: 'pending' | 'running' | 'completed' | 'error' }>;
}

export interface UseAiChatState {
  conversations: AiConversationEntity[];
  activeConversation: AiConversationEntity | null;
  messages: AiChatMessage[];
  loading: boolean;
  streaming: boolean;
  error: string | null;
  activeTool: string | null;
  approvalRequest: ApprovalRequest | null;
  sessionId: string | null;
}

export function useAiChat(model?: string, providerConfig?: NvidiaNimProviderConfig) {
  const { currentOrganization } = useOrganizationContext();
  const [state, setState] = useState<UseAiChatState>({
    conversations: [],
    activeConversation: null,
    messages: [],
    loading: false,
    streaming: false,
    error: null,
    activeTool: null,
    approvalRequest: null,
    sessionId: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<AiChatMessage[]>([]);
  const sessionIdRef = useRef<string | null>(null);

  const getProviderConfig = useCallback((): NvidiaNimProviderConfig => {
    return {
      ...providerConfig,
      organizationId: currentOrganization?.id,
      model: model || providerConfig?.model,
    };
  }, [currentOrganization?.id, model, providerConfig]);

  const loadConversations = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const authSession = await getAuthSession();
      if (!authSession?.user) return;

      const conversations = await aiSessionService.listConversations(
        currentOrganization.id,
        authSession.user.id,
      );

      setState((prev) => ({ ...prev, conversations }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load conversations',
      }));
    }
  }, [currentOrganization]);

  const createConversation = useCallback(async (title: string) => {
    if (!currentOrganization) throw new Error('No organization selected');

    const authSession = await getAuthSession();
    if (!authSession?.user) throw new Error('Not authenticated');

    const conversation = await aiSessionService.createConversation(
      currentOrganization.id,
      authSession.user.id,
      title,
    );

    setState((prev) => ({
      ...prev,
      activeConversation: conversation,
      messages: [],
      conversations: [conversation, ...prev.conversations],
    }));

    return conversation;
  }, [currentOrganization]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const messages = await aiSessionService.listMessages(conversationId);
      const chatMessages: AiChatMessage[] = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
      }));

      messagesRef.current = chatMessages;
      setState((prev) => ({
        ...prev,
        messages: chatMessages,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages',
      }));
    }
  }, []);

  const sendMessage = useCallback(async (content: string, systemPrompt?: string) => {
    if (!content.trim()) return;
    if (!currentOrganization) {
      setState((prev) => ({ ...prev, error: 'Selecione uma organização antes de enviar a mensagem.' }));
      return;
    }

    const authSession = await getAuthSession();
    if (!authSession?.user) {
      setState((prev) => ({ ...prev, error: 'Não autenticado. Faça login novamente.' }));
      return;
    }

    const userMessage: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    messagesRef.current = [...messagesRef.current, userMessage];
    setState((prev) => ({
      ...prev,
      messages: [...messagesRef.current],
      loading: true,
      streaming: true,
      error: null,
      approvalRequest: null,
    }));

    const assistantMessage: AiChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    messagesRef.current = [...messagesRef.current, assistantMessage];
    setState((prev) => ({
      ...prev,
      messages: [...messagesRef.current],
    }));

    let conversation = state.activeConversation;
    if (!conversation) {
      conversation = await createConversation(content.slice(0, 50));
    }

    try {
      await aiSessionService.appendMessage(
        conversation.id,
        currentOrganization.id,
        'user',
        content.trim(),
      );
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    const sessionId = `chat-${Date.now()}`;
    sessionIdRef.current = sessionId;
    setState((prev) => ({ ...prev, sessionId }));

    let fullResponse = '';

    try {
      if (isTauriRuntime()) {
        await harnessClient.streamAgentSession(
          content.trim(),
          (event: AgentEvent) => {
            switch (event.type) {
              case 'Status':
                setState((prev) => ({ ...prev, activeTool: event.payload }));
                break;
              case 'ToolCall':
                messagesRef.current = messagesRef.current.map((msg) =>
                  msg.id === assistantMessage.id
                    ? {
                        ...msg,
                        toolCalls: [
                          ...(msg.toolCalls || []),
                          { name: event.payload.name, status: 'running' as const },
                        ],
                      }
                    : msg,
                );
                setState((prev) => ({
                  ...prev,
                  messages: [...messagesRef.current],
                }));
                break;
              case 'ToolCallDelta':
                break;
              case 'Failed':
                messagesRef.current = messagesRef.current.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: `Error: ${event.payload.message}`, isStreaming: false }
                    : msg,
                );
                setState((prev) => ({
                  ...prev,
                  messages: [...messagesRef.current],
                  streaming: false,
                  activeTool: null,
                }));
                break;
              case 'Done':
                messagesRef.current = messagesRef.current.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, isStreaming: false }
                    : msg,
                );
                setState((prev) => ({
                  ...prev,
                  messages: [...messagesRef.current],
                  streaming: false,
                  activeTool: null,
                }));
                break;
            }
          },
          {
            session_id: sessionId,
            model: model || 'nvidia/nemotron-3-ultra-550b-a55b',
            onTextDelta: (text: string) => {
              fullResponse += text;
              messagesRef.current = messagesRef.current.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: fullResponse }
                  : msg,
              );
              setState((prev) => ({
                ...prev,
                messages: [...messagesRef.current],
              }));
            },
            onApproval: (request: ApprovalRequest) => {
              setState((prev) => ({ ...prev, approvalRequest: request }));
            },
          },
        );
      } else {
        const config = getProviderConfig();
        const provider = getDefaultLlmProvider(config);

        const contextMessages = messagesRef.current
          .filter((msg) => msg.role !== 'tool')
          .slice(-10)
          .map((msg) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          }));

        abortControllerRef.current = new AbortController();

        if (provider.streamResponse) {
          await provider.streamResponse(
            content.trim(),
            (chunk: LlmStreamChunk) => {
              if (chunk.type === 'text_delta' && chunk.content) {
                fullResponse += chunk.content;
                messagesRef.current = messagesRef.current.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: fullResponse }
                    : msg,
                );
                setState((prev) => ({
                  ...prev,
                  messages: [...messagesRef.current],
                }));
              } else if (chunk.type === 'tool_call' && chunk.data) {
                setState((prev) => ({
                  ...prev,
                  activeTool: chunk.data.name,
                }));
              } else if (chunk.type === 'completed') {
                messagesRef.current = messagesRef.current.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, isStreaming: false }
                    : msg,
                );
                setState((prev) => ({
                  ...prev,
                  messages: [...messagesRef.current],
                  streaming: false,
                  activeTool: null,
                }));
              } else if (chunk.type === 'error') {
                messagesRef.current = messagesRef.current.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: `Error: ${chunk.content}`, isStreaming: false }
                    : msg,
                );
                setState((prev) => ({
                  ...prev,
                  messages: [...messagesRef.current],
                  streaming: false,
                  activeTool: null,
                }));
              }
            },
            {
              systemPrompt,
              messages: contextMessages,
            },
          );
        } else {
          const response = await provider.generateResponse(content.trim(), {
            systemPrompt,
            messages: contextMessages,
          });
          fullResponse = response;

          messagesRef.current = messagesRef.current.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullResponse, isStreaming: false }
              : msg,
          );
          setState((prev) => ({
            ...prev,
            messages: [...messagesRef.current],
            streaming: false,
          }));
        }
      }

      if (conversation && fullResponse) {
        try {
          await aiSessionService.appendMessage(
            conversation.id,
            currentOrganization.id,
            'assistant',
            fullResponse,
          );
        } catch (error) {
          console.error('Failed to save assistant message:', error);
        }
      }
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      if (errorMessage === 'Failed to fetch') {
        errorMessage = 'Não foi possível conectar ao provedor de IA. Verifique sua conexão com a internet e a configuração da API key em Configurações > Integrações > NVIDIA NIM.';
      }
      messagesRef.current = messagesRef.current.map((msg) =>
        msg.id === assistantMessage.id
          ? { ...msg, content: `Error: ${errorMessage}`, isStreaming: false }
          : msg,
      );
      setState((prev) => ({
        ...prev,
        messages: [...messagesRef.current],
        streaming: false,
        error: errorMessage,
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
      abortControllerRef.current = null;
    }
  }, [currentOrganization, state.activeConversation, createConversation, getProviderConfig, model]);

  const stopStreaming = useCallback(() => {
    if (isTauriRuntime() && sessionIdRef.current) {
      harnessClient.interruptAgent(sessionIdRef.current);
    }
    abortControllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      streaming: false,
      activeTool: null,
    }));
  }, []);

  const resolveApproval = useCallback((decision: 'allow_once' | 'allow_session' | 'deny') => {
    if (isTauriRuntime() && sessionIdRef.current && state.approvalRequest) {
      harnessClient.resolveApproval(
        sessionIdRef.current,
        state.approvalRequest.id,
        decision,
      );
      setState((prev) => ({ ...prev, approvalRequest: null }));
    }
  }, [state.approvalRequest]);

  const selectConversation = useCallback(async (conversation: AiConversationEntity) => {
    setState((prev) => ({
      ...prev,
      activeConversation: conversation,
      messages: [],
      loading: true,
      error: null,
    }));

    await loadMessages(conversation.id);
  }, [loadMessages]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadConversations,
    createConversation,
    loadMessages,
    sendMessage,
    stopStreaming,
    resolveApproval,
    selectConversation,
    clearError,
  };
}
