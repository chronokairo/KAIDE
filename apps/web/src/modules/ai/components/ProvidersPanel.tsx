'use client';

import React, { useState } from 'react';
import {
  useModelProviders,
  useValidateModelProvider,
  useSetModelProviderApiKey,
  useSetModelProviderBase,
  useRemoveModelProvider,
} from '@/modules/dev/hooks/useHarness';
import type { ProviderInfo } from '@/modules/dev/harness-client';

const PROVIDER_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  ollama: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'terminal' },
  lmstudio: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'science' },
  nvidia: { bg: 'bg-green-100', text: 'text-green-600', icon: 'memory' },
  openai: { bg: 'bg-slate-100', text: 'text-slate-600', icon: 'smart_toy' },
  anthropic: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'psychology' },
  google: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'cloud' },
};

function getProviderStyle(id: string) {
  return PROVIDER_COLORS[id] ?? { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'cloud' };
}

const KNOWN_PROVIDERS: ProviderInfo[] = [
  {
    id: 'nvidia',
    name: 'NVIDIA NIM (Nemotron / Llama / Qwen)',
    wire_api: 'chat',
    base_url: 'https://integrate.api.nvidia.com/v1',
    requires_openai_auth: true,
    supports_websockets: false,
    has_env_key: false,
    has_auth: false,
    has_aws: false,
    has_store_key: false,
    store_base: null,
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o / o3-mini)',
    wire_api: 'chat',
    base_url: 'https://api.openai.com/v1',
    requires_openai_auth: true,
    supports_websockets: false,
    has_env_key: false,
    has_auth: false,
    has_aws: false,
    has_store_key: false,
    store_base: null,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    wire_api: 'chat',
    base_url: 'https://api.anthropic.com/v1',
    requires_openai_auth: false,
    supports_websockets: false,
    has_env_key: false,
    has_auth: false,
    has_aws: false,
    has_store_key: false,
    store_base: null,
  },
  {
    id: 'google',
    name: 'Google Gemini',
    wire_api: 'chat',
    base_url: 'https://generativelanguage.googleapis.com/v1beta',
    requires_openai_auth: false,
    supports_websockets: false,
    has_env_key: false,
    has_auth: false,
    has_aws: false,
    has_store_key: false,
    store_base: null,
  },
  {
    id: 'ollama',
    name: 'Ollama Local (DeepSeek R1 / Llama 3.3)',
    wire_api: 'chat',
    base_url: 'http://localhost:11434',
    requires_openai_auth: false,
    supports_websockets: false,
    has_env_key: false,
    has_auth: false,
    has_aws: false,
    has_store_key: false,
    store_base: null,
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    wire_api: 'chat',
    base_url: 'http://localhost:1234/v1',
    requires_openai_auth: false,
    supports_websockets: false,
    has_env_key: false,
    has_auth: false,
    has_aws: false,
    has_store_key: false,
    store_base: null,
  },
];

export const ProvidersPanel: React.FC = () => {
  const { result, loading, error, refresh } = useModelProviders();
  const { validate, loading: validating, error: validateError } = useValidateModelProvider();
  const { setKey, loading: settingKey } = useSetModelProviderApiKey();
  const { setBase, loading: settingBase } = useSetModelProviderBase();
  const { remove, loading: removing } = useRemoveModelProvider();

  const [validateName, setValidateName] = useState('');
  const [validateResult, setValidateResult] = useState<string | null>(null);
  const [validatingLocal, setValidatingLocal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editApiKey, setEditApiKey] = useState('');
  const [editBaseUrl, setEditBaseUrl] = useState('');
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [showMasked, setShowMasked] = useState<Record<string, boolean>>({});

  // Chaves e Base URLs salvas localmente no navegador (localStorage)
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [localBases, setLocalBases] = useState<Record<string, string>>({});

  // Status de conectividade em tempo real dos servidores locais (Ollama / LM Studio)
  const [localStatus, setLocalStatus] = useState<Record<string, { online: boolean; models?: string[]; count?: number; checking?: boolean }>>({});

  const pingLocalProvider = async (providerId: string, customBaseUrl?: string) => {
    setLocalStatus((prev) => ({
      ...prev,
      [providerId]: { online: prev[providerId]?.online ?? false, checking: true },
    }));
    try {
      const targetUrl = customBaseUrl || localBases[providerId];
      const res = await fetch('/api/ai/probe-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          url: targetUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalStatus((prev) => ({
          ...prev,
          [providerId]: { online: data.online, models: data.models, count: data.count, checking: false },
        }));
        return data.online;
      }
    } catch {
      // offline
    }
    setLocalStatus((prev) => ({
      ...prev,
      [providerId]: { online: false, checking: false },
    }));
    return false;
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const keys: Record<string, string> = {};
    const bases: Record<string, string> = {};
    ['google', 'openai', 'anthropic', 'ollama', 'nvidia', 'lmstudio'].forEach((id) => {
      const savedKey = localStorage.getItem(`chronokairo_provider_key_${id}`) || (id === 'nvidia' ? localStorage.getItem('chronokairo_ai_nvidia_api_key') : null);
      const savedBase = localStorage.getItem(`chronokairo_provider_base_${id}`) || (id === 'nvidia' ? localStorage.getItem('chronokairo_ai_nvidia_base_url') : null);
      if (savedKey) keys[id] = savedKey;
      if (savedBase) bases[id] = savedBase;
    });
    setLocalKeys(keys);
    setLocalBases(bases);

    // Auto-ping servidores locais na inicialização
    pingLocalProvider('ollama', bases['ollama']);
    pingLocalProvider('lmstudio', bases['lmstudio']);
  }, []);

  const available = result?.available ?? false;
  const rawProviders = result?.data ?? [];
  const baseList = rawProviders.length > 0 ? rawProviders : KNOWN_PROVIDERS;
  const providers = baseList.map((p: any) => {
    const isLocal = p.id === 'ollama' || p.id === 'lmstudio';
    const isLocalOnline = localStatus[p.id]?.online;
    const hasLocalKey = Boolean(localKeys[p.id]);
    const localBase = localBases[p.id];
    return {
      ...p,
      has_store_key: Boolean(p.has_store_key || hasLocalKey),
      has_auth: Boolean(p.has_auth || hasLocalKey || p.has_env_key || (isLocal && isLocalOnline)),
      store_base: localBase || p.store_base,
    };
  });

  const startEdit = (p: any) => {
    setEditingId(p.id);
    const existingKey = localKeys[p.id] || '';
    setEditApiKey(existingKey);
    setEditBaseUrl(p.store_base ?? localBases[p.id] ?? p.base_url ?? '');
    setEditSuccess(null);
    setEditError(null);
  };

  const saveKey = async () => {
    if (!editingId || !editApiKey.trim()) return;
    setEditError(null);
    setEditSuccess(null);
    const key = editApiKey.trim();
    const base = editBaseUrl.trim();

    // 1. Salva localmente no navegador (localStorage) para consumo imediato do Chat
    if (typeof window !== 'undefined') {
      localStorage.setItem(`chronokairo_provider_key_${editingId}`, key);
      if (base) localStorage.setItem(`chronokairo_provider_base_${editingId}`, base);
      if (editingId === 'nvidia') {
        localStorage.setItem('chronokairo_ai_nvidia_api_key', key);
        if (base) localStorage.setItem('chronokairo_ai_nvidia_base_url', base);
      }
      setLocalKeys((prev) => ({ ...prev, [editingId]: key }));
      if (base) setLocalBases((prev) => ({ ...prev, [editingId]: base }));
    }

    // 2. Se backend Tauri estiver ativo, sincroniza com o sidecar Rust
    if (available) {
      const ok = await setKey(editingId, key, base || undefined);
      if (ok) refresh();
    }

    setEditSuccess('Chave de API salva com sucesso no navegador e pronta para uso no Chat!');
  };

  const saveBase = async () => {
    if (!editingId || !editBaseUrl.trim()) return;
    setEditError(null);
    setEditSuccess(null);
    const base = editBaseUrl.trim();

    if (typeof window !== 'undefined') {
      localStorage.setItem(`chronokairo_provider_base_${editingId}`, base);
      if (editingId === 'nvidia') {
        localStorage.setItem('chronokairo_ai_nvidia_base_url', base);
      }
      setLocalBases((prev) => ({ ...prev, [editingId]: base }));
    }

    if (available) {
      const ok = await setBase(editingId, base);
      if (ok) refresh();
    }

    setEditSuccess('Base URL atualizada com sucesso!');
  };

  const handleRemove = async (id: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`chronokairo_provider_key_${id}`);
      localStorage.removeItem(`chronokairo_provider_base_${id}`);
      if (id === 'nvidia') {
        localStorage.removeItem('chronokairo_ai_nvidia_api_key');
        localStorage.removeItem('chronokairo_ai_nvidia_base_url');
      }
      setLocalKeys((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setLocalBases((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

    if (available) {
      await remove(id);
      refresh();
    }

    setEditingId(null);
    setEditSuccess('Configuração do provedor removida.');
  };

  const handleRealValidate = async () => {
    if (!validateName.trim()) return;
    setValidatingLocal(true);
    setValidateResult(null);
    const targetId = validateName.trim().toLowerCase();
    const targetKey = localKeys[targetId] || (targetId === 'nvidia' ? localStorage.getItem('chronokairo_ai_nvidia_api_key') : null);
    const targetBase = localBases[targetId] || (targetId === 'nvidia' ? localStorage.getItem('chronokairo_ai_nvidia_base_url') : null);

    if (targetId === 'ollama' || targetId === 'lmstudio') {
      const online = await pingLocalProvider(targetId, targetBase || undefined);
      setValidateResult(online ? `${targetId}: Servidor local online e operacional!` : `${targetId}: Servidor local não respondeu (inicie o serviço).`);
      setValidatingLocal(false);
      return;
    }

    if (available) {
      const ok = await validate(targetId, targetBase || undefined);
      setValidateResult(ok ? `${targetId}: Endpoint operacional e autenticado no Tauri.` : `Falha: ${validateError || 'Endpoint não respondeu'}`);
      setValidatingLocal(false);
      return;
    }

    // Real probe via /api/ai/chat
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'ping',
          model: 'meta/llama-3.3-70b-instruct',
          apiKey: targetKey || undefined,
          baseUrl: targetBase || undefined,
        }),
      });
      if (res.ok) {
        setValidateResult(`${targetId}: Conexão com o provedor estabelecida com sucesso!`);
      } else {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setValidateResult(`Erro (${targetId}): ${err.error || 'Não foi possível autenticar'}`);
      }
    } catch (err: any) {
      setValidateResult(`Erro de rede (${targetId}): ${err.message || 'Falha de conexão'}`);
    } finally {
      setValidatingLocal(false);
    }
  };

  return (
    <div className="space-y-3 text-primary">
      {/* Web Mode Banner */}
      {!available && (
        <div className="bg-surface-container border border-outline-variant/60 text-primary rounded-xl p-3 flex items-center justify-between gap-2 text-xs shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-primary text-[17px] shrink-0">info</span>
            <span className="text-on-surface-variant">
              <strong>Modo Web Ativo:</strong> Chat IA, streaming de modelos e conexões remotas operam normalmente no navegador. A edição direta de arquivos do projeto no filesystem local requer o runtime Desktop Tauri.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
            WEB
          </span>
        </div>
      )}

      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary tracking-tight">Model Providers</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Provedores LLM configurados — chaves de API, base URLs e roteamento de modelos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono font-semibold">
              {available ? 'TAURI' : 'WEB'}
            </span>
            <button
              onClick={() => {
                refresh();
                pingLocalProvider('ollama');
                pingLocalProvider('lmstudio');
              }}
              className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
              title="Recarregar e pingar provedores"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-xs text-on-surface-variant mt-2">Carregando providers...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <span className="material-symbols-outlined text-error text-3xl">error</span>
            <p className="text-xs text-error mt-2">{error}</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="p-6 text-center text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-3xl opacity-30">cloud</span>
            <p className="mt-2">Nenhum provider configurado</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {providers.map((p: any) => {
              const style = getProviderStyle(p.id);
              const isEditing = editingId === p.id;
              const isLocal = p.id === 'ollama' || p.id === 'lmstudio';
              const localInfo = localStatus[p.id];
              const hasKey = p.has_store_key || p.has_env_key;

              return (
                <div key={p.id} className="p-3.5 hover:bg-surface-container-low/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${style.bg}`}>
                        <span className={`material-symbols-outlined text-[17px] ${style.text}`}>
                          {style.icon}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-primary">{p.name}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono mt-0.5 truncate max-w-[240px]">
                          {p.store_base ?? p.base_url ?? 'built-in'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {isLocal ? (
                            localInfo?.checking ? (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-bold border border-amber-500/20 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin" />
                                pingando...
                              </span>
                            ) : localInfo?.online ? (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-bold border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                online ({localInfo.count ?? 0} modelos)
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold">
                                não detectado (localhost)
                              </span>
                            )
                          ) : hasKey ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-800 font-bold border border-emerald-500/25">
                              {p.has_store_key ? 'chave salva' : 'env key ativa'}
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-semibold">
                              sem chave
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLocal && (
                        <button
                          onClick={() => pingLocalProvider(p.id)}
                          disabled={localInfo?.checking}
                          className="h-7 px-2 text-[10px] rounded-lg border border-outline-variant font-semibold text-primary hover:bg-surface-container flex items-center gap-1 transition-all"
                          title="Pingar servidor local"
                        >
                          <span className="material-symbols-outlined text-[13px]">cell_tower</span>
                          <span>Ping</span>
                        </button>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        p.wire_api === 'chat' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                      }`}>
                        {p.wire_api}
                      </span>
                      <button
                        onClick={() => isEditing ? setEditingId(null) : startEdit(p)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-semibold transition-all shadow-2xs ${
                          isEditing
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container hover:bg-surface-container-high text-primary'
                        }`}
                      >
                        {isEditing ? 'Fechar' : 'Configurar'}
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 space-y-3 animate-in fade-in duration-150">
                      {isLocal ? (
                        <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-primary">
                          <p className="text-[11px] font-semibold">
                            💡 <strong>Servidor Local:</strong> Ollama e LM Studio executam diretamente na máquina e <strong>não exigem chave de API</strong>. Basta iniciar o serviço localmente (ex: <code className="bg-surface-container px-1 py-0.2 rounded font-mono font-bold">ollama serve</code>).
                          </p>
                        </div>
                      ) : (
                        /* API Key para provedores em nuvem */
                        <div>
                          <label className="text-[10px] font-bold text-primary block mb-1">API Key</label>
                          <div className="flex gap-2">
                            <input
                              type={showMasked[p.id] ? 'text' : 'password'}
                              value={editApiKey}
                              onChange={(e) => setEditApiKey(e.target.value)}
                              placeholder={hasKey ? '•••••••• (chave existente)' : 'Insira a API key'}
                              className="flex-1 px-3 h-8 text-xs border border-outline-variant/60 rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary font-mono"
                            />
                            <button
                              onClick={() => setShowMasked(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                              className="h-8 px-2.5 rounded-xl border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {showMasked[p.id] ? 'visibility_off' : 'visibility'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Base URL */}
                      <div>
                        <label className="text-[10px] font-bold text-primary block mb-1">
                          Base URL {isLocal ? '(Endpoint Local)' : '(opcional)'}
                        </label>
                        <input
                          type="text"
                          value={editBaseUrl}
                          onChange={(e) => setEditBaseUrl(e.target.value)}
                          placeholder={isLocal ? (p.id === 'lmstudio' ? 'http://localhost:1234/v1' : 'http://localhost:11434') : 'https://integrate.api.nvidia.com/v1'}
                          className="w-full px-3 h-8 text-xs border border-outline-variant/60 rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary font-mono"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {isLocal ? (
                          <button
                            onClick={async () => {
                              saveBase();
                              const online = await pingLocalProvider(p.id, editBaseUrl);
                              if (online) {
                                setEditSuccess('Servidor local detectado e ativado!');
                              } else {
                                setEditError('Servidor local não respondeu neste endpoint.');
                              }
                            }}
                            disabled={localInfo?.checking}
                            className="h-8 px-3.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-2xs flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">cell_tower</span>
                            <span>{localInfo?.checking ? 'Testando...' : 'Salvar & Testar Conexão'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={saveKey}
                            disabled={settingKey || !editApiKey.trim()}
                            className="h-8 px-3.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-2xs"
                          >
                            {settingKey ? 'Salvando...' : 'Salvar Chave'}
                          </button>
                        )}

                        {!isLocal && editBaseUrl.trim() && (
                          <button
                            onClick={saveBase}
                            disabled={settingBase}
                            className="h-8 px-3 rounded-xl bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high disabled:opacity-50"
                          >
                            {settingBase ? 'Salvando...' : 'Salvar Base URL'}
                          </button>
                        )}
                        <div className="flex-1" />
                        <button
                          onClick={() => handleRemove(p.id)}
                          disabled={removing}
                          className="h-8 px-2.5 rounded-xl text-error text-xs font-semibold hover:bg-error-container/40 disabled:opacity-50"
                        >
                          {removing ? 'Removendo...' : 'Remover'}
                        </button>
                      </div>

                      {editSuccess && (
                        <p className="text-xs text-emerald-700 font-semibold">{editSuccess}</p>
                      )}
                      {editError && (
                        <p className="text-xs text-error font-semibold">{editError}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Validate Provider */}
        <div className="p-3.5 border-t border-outline-variant/40 bg-surface/40">
          <div className="text-xs font-bold text-primary mb-2">Validar Endpoint de Provedor</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={validateName}
              onChange={(e) => setValidateName(e.target.value)}
              placeholder="Nome do provider (ex: nvidia, openai, google, ollama)"
              className="flex-1 px-3 h-8 text-xs border border-outline-variant/60 rounded-xl bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary font-mono"
            />
            <button
              onClick={handleRealValidate}
              disabled={validating || validatingLocal || !validateName.trim()}
              className="h-8 px-3.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-2xs"
            >
              {validating || validatingLocal ? 'Testando...' : 'Validar'}
            </button>
          </div>
          {validateResult && (
            <p className={`text-xs mt-2 font-mono ${validateResult.includes('sucesso') || validateResult.includes('operacional') || validateResult.includes('online') ? 'text-emerald-700 font-bold' : 'text-error font-bold'}`}>{validateResult}</p>
          )}
        </div>
      </div>
    </div>
  );
};
