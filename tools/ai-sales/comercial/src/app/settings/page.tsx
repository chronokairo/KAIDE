'use client';

import { useEffect, useMemo, useState } from 'react';

/* ─── types ──────────────────────────────────────────────── */
interface ModelInfo {
  id: string;
  name: string;
  family?: string;
  reasoning?: boolean;
  tool_call?: boolean;
  attachment?: boolean;
  open_weights?: boolean;
  modalities?: { input: string[]; output: string[] };
  limit?: { context?: number; output?: number };
  cost?: { input?: number; output?: number };
}

interface ProviderInfo {
  id: string;
  name: string;
  env?: string[];
  npm?: string;
  api?: string;
  doc?: string;
  models: Record<string, ModelInfo>;
}

type ProvidersMap = Record<string, ProviderInfo>;

/** Resposta do endpoint GET /models (padrão OpenAI) */
interface LiveModel {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

/* ─── helpers ────────────────────────────────────────────── */
const LOCAL_APIS = ['localhost', '127.0.0.1', '0.0.0.0'];
const SUPPORTED_IDS = new Set(['ollama', 'lmstudio', 'ollama-remote']);

const OLLAMA_PROVIDER: ProviderInfo = {
  id: 'ollama',
  name: 'Ollama',
  api: 'http://localhost:11434/v1',
  doc: 'https://ollama.com',
  models: {},
};

const OLLAMA_REMOTE_PROVIDER: ProviderInfo = {
  id: 'ollama-remote',
  name: 'Ollama (Remoto)',
  api: 'https://ciesa-ollama.fyczn4.easypanel.host/v1',
  doc: 'https://ollama.com',
  models: {},
};

function isLocalProvider(p: ProviderInfo): boolean {
  return LOCAL_APIS.some((h) => p.api?.includes(h));
}

function formatCtx(n?: number): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function formatCost(n?: number): string {
  if (n === undefined || n === null) return '—';
  if (n === 0) return 'Free';
  return `$${n.toFixed(n < 0.01 ? 3 : 2)}`;
}

const BADGE_BASE =
  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none';

/* ─── saved config ───────────────────────────────────────── */
const STORAGE_KEY = 'anna:model-config';

interface SavedConfig {
  providerId: string;
  modelId: string;
  apiKey: string;
  baseUrl: string;
}

function loadConfig(): Partial<SavedConfig> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveConfig(cfg: SavedConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

/* ─── component ──────────────────────────────────────────── */
export default function SettingsPage() {
  const [providers, setProviders] = useState<ProvidersMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* filters */
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'api' | 'local'>('local');
  const [capFilter, setCapFilter] = useState<string[]>([]);

  /* selection */
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [saved, setSaved] = useState(false);

  /* dynamic model list (fetched from provider API) */
  const [liveModels, setLiveModels] = useState<ModelInfo[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  /* fetch provider catalog (metadata only – models used as fallback) */
  useEffect(() => {
    fetch('https://models.dev/api.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ProvidersMap>;
      })
      .then((data) => {
        // Inject Ollama providers (not in api.json)
        if (!data['ollama']) data['ollama'] = OLLAMA_PROVIDER;
        if (!data['ollama-remote']) data['ollama-remote'] = OLLAMA_REMOTE_PROVIDER;
        // Keep only supported providers
        const filtered: ProvidersMap = {};
        for (const id of SUPPORTED_IDS) { if (data[id]) filtered[id] = data[id]; }
        setProviders(filtered);
        setLoading(false);

        const cfg = loadConfig();
        if (cfg.providerId && filtered[cfg.providerId]) {
          // use filtered instead of data below
          const data = filtered;
          setSelectedProvider(cfg.providerId);
          setSelectedModel(cfg.modelId ?? '');
          setApiKey(cfg.apiKey ?? '');
          setBaseUrl(cfg.baseUrl ?? data[cfg.providerId].api ?? '');
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
  }, []);

  /* fetch live model list from provider when key or url changes */
  useEffect(() => {
    if (!selectedProvider || !baseUrl) {
      setLiveModels(null);
      return;
    }

    const key = apiKey.trim();
    const staticModels = providers[selectedProvider]
      ? Object.values(providers[selectedProvider].models)
      : [];

    // For local providers or when no key is needed, skip live fetch
    const provider = providers[selectedProvider];
    const needsKey = !isLocalProvider(provider ?? { api: baseUrl } as ProviderInfo);
    if (needsKey && !key) {
      setLiveModels(null);
      setLiveError(null);
      return;
    }

    setLiveLoading(true);
    setLiveError(null);

    const modelsUrl = baseUrl.replace(/\/$/, '') + '/models';
    const proxyUrl = `/api/proxy-models?url=${encodeURIComponent(modelsUrl)}`;
    const proxyHeaders: Record<string, string> = {};
    if (key) proxyHeaders['x-api-key'] = key;

    fetch(proxyUrl, { headers: proxyHeaders })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ data?: LiveModel[]; models?: LiveModel[] } | LiveModel[]>;
      })
      .then((raw) => {
        const list: LiveModel[] = Array.isArray(raw)
          ? raw
          : (raw as { data?: LiveModel[]; models?: LiveModel[] }).data ??
            (raw as { models?: LiveModel[] }).models ??
            [];

        // Enrich with static metadata where IDs match
        const staticMap = new Map(staticModels.map((m) => [m.id, m]));
        const enriched: ModelInfo[] = list.map((lm) => {
          const base = staticMap.get(lm.id);
          return base ?? { id: lm.id, name: lm.id };
        });

        setLiveModels(enriched);
        setLiveLoading(false);
      })
      .catch((e: unknown) => {
        setLiveModels(null);
        setLiveError(e instanceof Error ? e.message : String(e));
        setLiveLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, apiKey, baseUrl]);

  /* derived lists */
  const filteredProviders = useMemo(() => {
    return Object.values(providers).filter((p) => {
      const q = search.toLowerCase();
      return !q || p.name.toLowerCase().includes(q) || p.id.includes(q);
    });
  }, [providers, search, modeFilter]);

  const currentProvider = selectedProvider ? providers[selectedProvider] : null;

  /* Use live models if available, else fall back to static from api.json */
  const baseModels = useMemo<ModelInfo[]>(() => {
    if (liveModels) return liveModels;
    if (!currentProvider) return [];
    return Object.values(currentProvider.models);
  }, [liveModels, currentProvider]);

  const filteredModels = useMemo(() => {
    return baseModels.filter((m) => {
      const q = search.toLowerCase();
      if (q && !m.name.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q))
        return false;
      if (capFilter.includes('reasoning') && !m.reasoning) return false;
      if (capFilter.includes('tool_call') && !m.tool_call) return false;
      if (capFilter.includes('attachment') && !m.attachment) return false;
      if (capFilter.includes('open_weights') && !m.open_weights) return false;
      return true;
    });
  }, [baseModels, search, capFilter]);

  const selectedModelInfo = currentProvider?.models[selectedModel] ?? null;

  /* handlers */
  function toggleCap(cap: string) {
    setCapFilter((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    );
  }

  function handleProviderSelect(id: string) {
    setSelectedProvider(id);
    setSelectedModel('');
    setBaseUrl(providers[id]?.api ?? '');
    setApiKey('');
    setSaved(false);
    setLiveModels(null);
    setLiveError(null);
  }

  function handleSave() {
    if (!selectedProvider || !selectedModel) return;
    saveConfig({ providerId: selectedProvider, modelId: selectedModel, apiKey, baseUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <main className="ml-64 flex h-screen flex-col overflow-hidden bg-surface">
      {/* header */}
      <div className="border-b border-outline-variant/40 bg-surface px-8 py-5">
        <h1 className="text-xl font-semibold text-on-surface">Configurações de IA</h1>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          Selecione o provider e modelo que a Anna usará para responder.
        </p>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          Carregando catálogo de modelos…
        </div>
      )}

      {error && (
        <div className="m-8 rounded-xl border border-error/30 bg-error-container px-5 py-4 text-sm text-on-error-container">
          <span className="material-symbols-outlined align-middle text-base">error</span>{' '}
          Erro ao carregar modelos: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-1 gap-0 overflow-hidden">
          {/* ── left: provider list ─────────────────────────── */}
          <aside className="flex w-72 flex-col border-r border-outline-variant/40 bg-surface">
            {/* search + filters */}
            <div className="space-y-2 border-b border-outline-variant/30 p-4">
              <div className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-variant/30 px-3 py-2">
                <span className="material-symbols-outlined text-base text-on-surface-variant">search</span>
                <input
                  className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
                  placeholder="Buscar provider ou modelo…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* mode pills */}

              {/* capability filters */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'reasoning', label: 'Raciocínio' },
                  { id: 'tool_call', label: 'Ferramentas' },
                  { id: 'attachment', label: 'Arquivos' },
                  { id: 'open_weights', label: 'Open' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => toggleCap(id)}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      capFilter.includes(id)
                        ? 'bg-secondary text-white'
                        : 'bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* provider list */}
            <div className="flex-1 overflow-y-auto">
              {filteredProviders.length === 0 && (
                <p className="p-4 text-center text-xs text-on-surface-variant">Nenhum resultado</p>
              )}
              {filteredProviders.map((p) => {
                const isLocal = isLocalProvider(p);
                const modelCount = Object.keys(p.models).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleProviderSelect(p.id)}
                    className={`flex w-full items-start gap-3 border-b border-outline-variant/20 px-4 py-3 text-left transition-colors hover:bg-surface-variant/30 ${
                      selectedProvider === p.id
                        ? 'bg-primary/8 border-l-2 border-l-primary'
                        : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-on-surface">
                          {p.name}
                        </span>
                        {isLocal && (
                          <span className={`${BADGE_BASE} bg-tertiary/10 text-tertiary`}>
                            <span className="material-symbols-outlined text-[10px]">computer</span>
                            local
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-on-surface-variant">
                        {modelCount} modelo{modelCount !== 1 ? 's' : ''}
                        {p.env?.length ? ` · ${p.env[0]}` : ''}
                      </p>
                    </div>
                    {selectedProvider === p.id && (
                      <span className="material-symbols-outlined text-base text-primary">
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── center: model list ──────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {!selectedProvider ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl opacity-30">psychology</span>
                <p className="text-sm">Selecione um provider à esquerda</p>
              </div>
            ) : (
              <>
                {/* provider header */}
                <div className="border-b border-outline-variant/40 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-on-surface">
                        {currentProvider?.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {isLocalProvider(currentProvider!) ? (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-tertiary">computer</span>
                            Execução local · {currentProvider?.api}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">cloud</span>
                            {currentProvider?.api}
                          </span>
                        )}
                      </p>
                    </div>
                    {currentProvider?.doc && (
                      <a
                        href={currentProvider.doc}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-outline-variant/50 px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-variant/30"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Docs
                      </a>
                    )}
                  </div>
                </div>

                {/* model grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* live fetch status bar */}
                  {liveLoading && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      Buscando modelos via API…
                    </div>
                  )}
                  {liveError && (
                    <div className="mb-3 rounded-lg border border-error/30 bg-error-container/50 px-3 py-2 text-xs text-on-error-container">
                      <span className="material-symbols-outlined align-middle text-sm">warning</span>{' '}
                      Não foi possível buscar modelos ao vivo: {liveError}. Exibindo catálogo estático.
                    </div>
                  )}
                  {liveModels && !liveLoading && (
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] text-secondary">
                      <span className="material-symbols-outlined text-sm">sync</span>
                      {liveModels.length} modelos obtidos via API
                    </div>
                  )}
                  {!liveModels && !liveLoading && !liveError && selectedProvider && !isLocalProvider(currentProvider!) && (
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">info</span>
                      Insira uma API key para buscar modelos ao vivo
                    </div>
                  )}

                  {filteredModels.length === 0 && !liveLoading && (
                    <p className="text-center text-sm text-on-surface-variant py-8">
                      Nenhum modelo com os filtros selecionados.
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {filteredModels.map((m) => {
                      const isSelected = selectedModel === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedModel(m.id); setSaved(false); }}
                          className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                              : 'border-outline-variant/40 bg-surface hover:border-outline-variant'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-on-surface">
                                {m.name}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">
                                {m.id}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="material-symbols-outlined shrink-0 text-base text-primary">
                                check_circle
                              </span>
                            )}
                          </div>

                          {/* capability badges */}
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {m.reasoning && (
                              <span className={`${BADGE_BASE} bg-secondary/10 text-secondary`}>
                                <span className="material-symbols-outlined text-[10px]">neurology</span>
                                raciocínio
                              </span>
                            )}
                            {m.tool_call && (
                              <span className={`${BADGE_BASE} bg-primary/10 text-primary`}>
                                <span className="material-symbols-outlined text-[10px]">build</span>
                                ferramentas
                              </span>
                            )}
                            {m.attachment && (
                              <span className={`${BADGE_BASE} bg-tertiary/10 text-tertiary`}>
                                <span className="material-symbols-outlined text-[10px]">attach_file</span>
                                arquivos
                              </span>
                            )}
                            {m.open_weights && (
                              <span className={`${BADGE_BASE} bg-surface-variant text-on-surface-variant`}>
                                open
                              </span>
                            )}
                          </div>

                          {/* stats */}
                          <div className="mt-2.5 flex gap-3 text-[11px] text-on-surface-variant">
                            <span title="Contexto">
                              <span className="material-symbols-outlined align-middle text-[11px]">data_object</span>{' '}
                              {formatCtx(m.limit?.context)}
                            </span>
                            <span title="Custo de entrada">
                              ↑ {formatCost(m.cost?.input)}/M
                            </span>
                            <span title="Custo de saída">
                              ↓ {formatCost(m.cost?.output)}/M
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── right: config panel ─────────────────────────── */}
          <aside className="flex w-80 flex-col border-l border-outline-variant/40 bg-surface">
            <div className="border-b border-outline-variant/40 px-5 py-4">
              <h3 className="text-sm font-semibold text-on-surface">Configuração</h3>
            </div>

            {!selectedModelInfo ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl opacity-25">tune</span>
                <p className="text-xs">Selecione um modelo para configurar</p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
                {/* model summary */}
                <div className="rounded-xl bg-surface-variant/30 p-4">
                  <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-2">
                    Modelo selecionado
                  </p>
                  <p className="text-sm font-semibold text-on-surface">
                    {selectedModelInfo.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-on-surface-variant break-all">
                    {selectedModelInfo.id}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-on-surface-variant">Contexto</p>
                      <p className="font-medium text-on-surface">
                        {formatCtx(selectedModelInfo.limit?.context)}
                      </p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Saída máx.</p>
                      <p className="font-medium text-on-surface">
                        {formatCtx(selectedModelInfo.limit?.output)}
                      </p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Entrada</p>
                      <p className="font-medium text-on-surface">
                        {formatCost(selectedModelInfo.cost?.input)}/M tok
                      </p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Saída</p>
                      <p className="font-medium text-on-surface">
                        {formatCost(selectedModelInfo.cost?.output)}/M tok
                      </p>
                    </div>
                  </div>

                  {selectedModelInfo.modalities && (
                    <div className="mt-3 text-[11px] text-on-surface-variant">
                      Entrada:{' '}
                      {selectedModelInfo.modalities.input.join(', ')}
                    </div>
                  )}
                </div>

                {/* api key / base url */}
                {!isLocalProvider(currentProvider!) && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-on-surface">
                        API Key
                        {currentProvider?.env?.[0] && (
                          <span className="ml-1.5 font-mono text-on-surface-variant">
                            ({currentProvider.env[0]})
                          </span>
                        )}
                      </label>
                      <input
                        type="password"
                        placeholder="sk-…"
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
                        className="w-full rounded-lg border border-outline-variant/50 bg-surface-variant/20 px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-on-surface">
                    Base URL
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => { setBaseUrl(e.target.value); setSaved(false); }}
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-variant/20 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* npm package info */}
                {currentProvider?.npm && (
                  <div className="rounded-lg border border-outline-variant/30 bg-surface-variant/20 px-3 py-2.5">
                    <p className="text-[11px] text-on-surface-variant mb-1">Pacote npm</p>
                    <code className="text-xs font-mono text-on-surface">{currentProvider.npm}</code>
                  </div>
                )}

                {/* save button */}
                <button
                  onClick={handleSave}
                  disabled={!selectedProvider || !selectedModel}
                  className={`mt-auto flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-40 ${
                    saved
                      ? 'bg-secondary text-white'
                      : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {saved ? 'check_circle' : 'save'}
                  </span>
                  {saved ? 'Salvo!' : 'Salvar configuração'}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
