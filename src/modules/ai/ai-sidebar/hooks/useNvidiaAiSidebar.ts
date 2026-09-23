'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@chronokairo/platform/auth';

export interface AiSidebarMessage { role: 'user' | 'assistant'; content: string }

interface CredentialStatus { configured: boolean; model: string }
interface ModelsResponse { models: string[]; selectedModel: string }
interface ChatResponse { choices?: Array<{ message?: { content?: string } }>; error?: string }

export function useNvidiaAiSidebar() {
  const { session } = useSession();
  const token = session?.access_token;
  const [configured, setConfigured] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('openai/gpt-oss-20b');
  const [messages, setMessages] = useState<AiSidebarMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    if (!token) throw new Error('Sessão indisponível');
    const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers } });
    const data = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(data.error || 'Falha na solicitação');
    return data;
  }, [token]);

  const loadModels = useCallback(async () => {
    const data = await request<ModelsResponse>('/api/ai/models');
    setModels(data.models);
    setModel((current) => data.selectedModel || data.models[0] || current);
  }, [request]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const status = await request<CredentialStatus>('/api/ai/credentials/nvidia');
      setConfigured(status.configured);
      setModel(status.model);
      if (status.configured) await loadModels();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Falha ao carregar IA');
    }
  }, [loadModels, request, token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const saveCredential = useCallback(async (apiKey: string) => {
    setLoading(true); setError(null);
    try {
      await request('/api/ai/credentials/nvidia', { method: 'PUT', body: JSON.stringify({ apiKey, model }) });
      setConfigured(true);
      await loadModels();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Falha ao salvar a key');
      throw saveError;
    } finally { setLoading(false); }
  }, [loadModels, model, request]);

  const deleteCredential = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await request('/api/ai/credentials/nvidia', { method: 'DELETE' });
      setConfigured(false); setModels([]); setMessages([]);
    } finally { setLoading(false); }
  }, [request]);

  const sendMessage = useCallback(async (content: string) => {
    const nextMessages: AiSidebarMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages); setLoading(true); setError(null);
    try {
      const result = await request<ChatResponse>('/api/ai/chat', { method: 'POST', body: JSON.stringify({ messages: nextMessages, model }) });
      const answer = result.choices?.[0]?.message?.content;
      if (!answer) throw new Error('Resposta vazia da NVIDIA');
      setMessages([...nextMessages, { role: 'assistant', content: answer }]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Falha no chat');
    } finally { setLoading(false); }
  }, [messages, model, request]);

  return { configured, models, model, setModel, messages, loading, error, saveCredential, deleteCredential, sendMessage };
}
