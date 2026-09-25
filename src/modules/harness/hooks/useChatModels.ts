'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  STATIC_LOCAL_PROVIDERS,
  DEFAULT_PROVIDER_ID,
  loadConfig,
  saveConfig,
  type ProviderInfo,
} from '../model-config';

export interface ActiveChatConfig {
  providerId: string;
  modelId: string;
  baseUrl: string;
  apiKey: string;
}

export function useChatModels() {
  const [localProviders, setLocalProviders] = useState<ProviderInfo[]>([]);
  const [chatProviderId, setChatProviderId] = useState('');
  const [chatModels, setChatModels] = useState<string[]>([]);
  const [chatModelId, setChatModelId] = useState('');
  const [chatModelsLoading, setChatModelsLoading] = useState(false);

  const loadChatModels = useCallback(async (providerId: string, preferredModelId?: string) => {
    const provider = STATIC_LOCAL_PROVIDERS.find((item) => item.id === providerId);
    if (!provider?.api) {
      setChatModels([]);
      setChatModelId('');
      return;
    }

    setChatProviderId(providerId);
    setChatModelsLoading(true);
    setChatModels([]);

    try {
      const url = provider.api.replace(/\/$/, '') + '/models';
      const res = await fetch(`/api/proxy-models?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = (await res.json()) as { data?: { id: string }[]; models?: { id: string }[] } | { id: string }[];
      const list: { id: string }[] = Array.isArray(raw) ? raw : raw.data ?? raw.models ?? [];
      const ids = list.filter((item) => !item.id.includes('embed')).map((item) => item.id);

      setChatModels(ids);

      const cfg = loadConfig();
      if (preferredModelId && ids.includes(preferredModelId)) {
        setChatModelId(preferredModelId);
        saveConfig({ providerId, modelId: preferredModelId, apiKey: '', baseUrl: provider.api });
      } else if (cfg.modelId && ids.includes(cfg.modelId)) {
        setChatModelId(cfg.modelId);
      } else if (ids.length > 0) {
        setChatModelId(ids[0]);
        saveConfig({ providerId, modelId: ids[0], apiKey: '', baseUrl: provider.api });
      } else {
        setChatModelId('');
      }
    } catch {
      setChatModels([]);
      setChatModelId('');
    } finally {
      setChatModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLocalProviders(STATIC_LOCAL_PROVIDERS);
    const cfg = loadConfig();
    const saved = STATIC_LOCAL_PROVIDERS.find((p) => p.id === cfg.providerId);
    if (saved) {
      void loadChatModels(saved.id);
      return;
    }
    void loadChatModels(DEFAULT_PROVIDER_ID);
  }, [loadChatModels]);

  const selectProvider = useCallback((id: string) => {
    void loadChatModels(id);
  }, [loadChatModels]);

  const selectModel = useCallback((modelId: string) => {
    const p = localProviders.find((x) => x.id === chatProviderId);
    if (!p) return;
    setChatModelId(modelId);
    saveConfig({ providerId: chatProviderId, modelId, apiKey: '', baseUrl: p.api ?? '' });
  }, [localProviders, chatProviderId]);

  const getActiveChatConfig = useCallback((): ActiveChatConfig | null => {
    const activeProvider = localProviders.find((provider) => provider.id === chatProviderId);
    if (activeProvider?.api && chatModelId) {
      return { providerId: chatProviderId, modelId: chatModelId, baseUrl: activeProvider.api, apiKey: '' };
    }

    const cfg = loadConfig();
    if (cfg.providerId && cfg.modelId && cfg.baseUrl) {
      return { providerId: cfg.providerId, modelId: cfg.modelId, baseUrl: cfg.baseUrl, apiKey: cfg.apiKey ?? '' };
    }

    return null;
  }, [localProviders, chatProviderId, chatModelId]);

  return {
    localProviders,
    chatProviderId,
    chatModels,
    chatModelId,
    chatModelsLoading,
    loadChatModels,
    selectProvider,
    selectModel,
    getActiveChatConfig,
  };
}
