"use client";

import React, { useState, useRef } from 'react';
import { useHarnessMemorySessions, useCreateHarnessSession, useStreamAgentSession } from '@/modules/dev/hooks/useHarness';
import { getDefaultLlmProvider, type LlmStreamChunk } from '@/modules/ai/core/providers/llm-provider';
import { isTauriRuntime, type AgentEvent } from '@/modules/dev/harness-client';

export function useAiWorkspace() {
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const streamedTextRef = useRef('');

  const { result: sessionsResult } = useHarnessMemorySessions(undefined, 50);
  const { create, creating } = useCreateHarnessSession();
  const { startStream, running } = useStreamAgentSession();

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setActiveTool('ask');

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);

    // Create assistant message placeholder
    const assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant' as const, text: '' };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      if (isTauriRuntime()) {
        // Use Tauri harness with proper streaming
        const session = await create({ title: `Chat ${new Date().toLocaleTimeString()}` });
        let fullResponse = '';
        streamedTextRef.current = '';

        await startStream(
          text.trim(),
          (event: AgentEvent) => {
            if (event.type === 'Status') {
              setActiveTool(event.payload);
            } else if (event.type === 'ToolCall') {
              setActiveTool(event.payload.name);
            } else if (event.type === 'Done' || event.type === 'Failed' || event.type === 'Interrupted') {
              setActiveTool(null);
            }
          },
          {
            session_id: session ? String(session) : undefined,
            onTextDelta: (delta: string) => {
              fullResponse += delta;
              streamedTextRef.current = fullResponse;
              // Update assistant message with streamed text
              setMessages((prev) => {
                const msgs = [...prev];
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  msgs[msgs.length - 1] = { ...lastMsg, text: fullResponse };
                }
                return msgs;
              });
            },
          },
        );
      } else {
        // Fallback to direct LLM call for web mode
        const provider = getDefaultLlmProvider();
        let fullResponse = '';
        streamedTextRef.current = '';
        setStreaming(true);

        if (provider.streamResponse) {
          await provider.streamResponse(
            text.trim(),
            (chunk: LlmStreamChunk) => {
              if (chunk.type === 'text_delta' && chunk.content) {
                fullResponse += chunk.content;
                streamedTextRef.current = fullResponse;
                // Update the last message if it's the assistant message
                setMessages((prev) => {
                  const msgs = [...prev];
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    msgs[msgs.length - 1] = { ...lastMsg, text: fullResponse };
                  }
                  return msgs;
                });
              } else if (chunk.type === 'tool_call' && chunk.data) {
                setActiveTool(chunk.data.name);
              } else if (chunk.type === 'completed') {
                setStreaming(false);
                setActiveTool(null);
              } else if (chunk.type === 'error') {
                setMessages((prev) => {
                  const msgs = [...prev];
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    msgs[msgs.length - 1] = { ...lastMsg, text: `Error: ${chunk.content}` };
                  }
                  return msgs;
                });
                setStreaming(false);
                setActiveTool(null);
              }
            },
            {
              systemPrompt: 'You are Kaide, an intelligent ERP assistant.',
            },
          );
        } else {
          const response = await provider.generateResponse(text.trim(), {
            systemPrompt: 'You are Kaide, an intelligent ERP assistant.',
          });
          fullResponse = response;

          // Update assistant message with final response
          setMessages((prev) => {
            const msgs = [...prev];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              msgs[msgs.length - 1] = { ...lastMsg, text: fullResponse };
            }
            return msgs;
          });
        }
      }
    } catch (error) {
      console.error('AI workspace error:', error);
      let errorMsg = 'Erro ao executar agente.';
      if (error instanceof Error && error.message === 'Failed to fetch') {
        errorMsg = 'Não foi possível conectar ao provedor de IA. Verifique sua conexão com a internet e a configuração da API key em Configurações > Integrações > NVIDIA NIM.';
      } else if (error instanceof Error) {
        errorMsg = `Erro: ${error.message}`;
      }
      setMessages((prev) => {
        const msgs = [...prev];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          msgs[msgs.length - 1] = { ...lastMsg, text: errorMsg };
        }
        return msgs;
      });
    } finally {
      setStreaming(false);
      setLoading(false);
      setActiveTool(null);
    }
  };

  return {
    messages,
    loading: loading || creating,
    streaming,
    activeTool,
    sendMessage,
    sessions: sessionsResult?.data ?? [],
  };
}
