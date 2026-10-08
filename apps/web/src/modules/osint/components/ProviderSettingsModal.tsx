import React, { useState, useEffect } from 'react';
import { Settings, Key, Cpu, Globe, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, Terminal } from 'lucide-react';
import { AcpProviderInfo, ProviderSettings, EnvStatus } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ProviderSettings;
  envStatus?: EnvStatus | null;
  acpProviders: AcpProviderInfo[];
  acpLoading: boolean;
  onSaveSettings: (newSettings: ProviderSettings) => void;
  onTestConnection: (apiKey: string, model: string) => Promise<string>;
  onRefreshAcp: () => Promise<void>;
  onTestAcp: (providerId: 'kilo' | 'opencode', model: string) => Promise<string>;
}

export const ProviderSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  envStatus,
  acpProviders,
  acpLoading,
  onSaveSettings,
  onTestConnection,
  onRefreshAcp,
  onTestAcp,
}) => {
  const [formData, setFormData] = useState<ProviderSettings>(settings);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [acpTestStatus, setAcpTestStatus] = useState<Record<string, { loading: boolean; success?: boolean; message?: string }>>({});

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  useEffect(() => {
    if (isOpen && acpProviders.length === 0 && !acpLoading) {
      void onRefreshAcp();
    }
  }, [isOpen, acpProviders.length, acpLoading, onRefreshAcp]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestStatus({ loading: true });
    try {
      const msg = await onTestConnection(formData.nvidiaApiKey, formData.nvidiaExecutorModel);
      setTestStatus({ loading: false, success: true, message: msg });
    } catch (err: any) {
      setTestStatus({ loading: false, success: false, message: err?.toString() || 'Falha na conexão com NVIDIA NIM' });
    }
  };

  const handleAcpTest = async (providerId: 'kilo' | 'opencode', model: string) => {
    setAcpTestStatus((current) => ({ ...current, [providerId]: { loading: true } }));
    try {
      const message = await onTestAcp(providerId, model);
      setAcpTestStatus((current) => ({ ...current, [providerId]: { loading: false, success: true, message } }));
    } catch (err: any) {
      setAcpTestStatus((current) => ({
        ...current,
        [providerId]: { loading: false, success: false, message: err?.toString() || `Falha no ${providerId}` },
      }));
    }
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Configurações de Provedores & APIs</h3>
              <p className="text-xs text-slate-400">Provedor primário único de IA e Harness de Busca Web OSINT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Section 1: NVIDIA NIM AI Engine */}
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                <Cpu className="w-4 h-4" /> Provedor Primário de IA
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {formData.primaryAiProvider === 'nvidia' ? 'NVIDIA NIM' : formData.primaryAiProvider === 'kilo' ? 'Kilo ACP' : 'OpenCode ACP'}
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Backend principal</label>
              <select
                value={formData.primaryAiProvider}
                onChange={(event) => setFormData({ ...formData, primaryAiProvider: event.target.value as ProviderSettings['primaryAiProvider'] })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="nvidia">NVIDIA NIM — API em nuvem</option>
                <option value="kilo">Kilo Code — agente ACP local</option>
                <option value="opencode">OpenCode — agente ACP local</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                O backend selecionado será usado no chat e na análise principal das investigações.
              </p>
            </div>

            {formData.primaryAiProvider === 'nvidia' && <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-300 font-medium">NVIDIA API Key</label>
                {envStatus?.has_nvidia_env && !formData.nvidiaApiKey && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Chave detectada no .env
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={formData.nvidiaApiKey}
                  onChange={(e) => setFormData({ ...formData, nvidiaApiKey: e.target.value })}
                  placeholder={envStatus?.has_nvidia_env ? "Usando NVIDIA_API_KEY do arquivo .env" : "nvapi-..."}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono placeholder:text-emerald-500/60"
                />
                <Key className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Servidor: <code className="text-slate-400">https://integrate.api.nvidia.com</code>
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Modelo Planner (cria o plano de pesquisa)</label>
              <select
                value={formData.nvidiaPlannerModel}
                onChange={(e) => setFormData({ ...formData, nvidiaPlannerModel: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="z-ai/glm-5.2">z-ai/glm-5.2 (Flagship Agentico - 1M Contexto)</option>
                <option value="deepseek-ai/deepseek-v4-flash">deepseek-ai/deepseek-v4-flash (Fast High-Reasoning)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Modelo Executor (executa o plano)</label>
              <select
                value={formData.nvidiaExecutorModel}
                onChange={(e) => setFormData({ ...formData, nvidiaExecutorModel: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="nvidia/nemotron-3-ultra-550b-a55b">nvidia/nemotron-3-ultra-550b-a55b (Nemotron 3 Ultra - 1M Contexto)</option>
                <option value="z-ai/glm-5.2">z-ai/glm-5.2 (Flagship Agentico - 1M Contexto)</option>
                <option value="deepseek-ai/deepseek-v4-flash">deepseek-ai/deepseek-v4-flash (Fast High-Reasoning)</option>
                <option value="nvidia/nemotron-nano-9b-v2">nvidia/nemotron-nano-9b-v2 (Utility / Low Latency)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTest}
                disabled={testStatus.loading}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {testStatus.loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Testar Conexão NVIDIA NIM
                  </>
                )}
              </button>

              {testStatus.message && (
                <div className={`text-[11px] flex items-center gap-1 font-medium ${testStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {testStatus.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>
            </>}
          </div>

          {formData.primaryAiProvider !== 'nvidia' && (
          <div className="space-y-3 bg-slate-950/40 p-4 -mt-5 rounded-b-xl border border-t-0 border-slate-800/80">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wider">
                <Terminal className="w-4 h-4" /> Agente ACP primário
              </div>
              <button
                type="button"
                onClick={() => void onRefreshAcp()}
                disabled={acpLoading}
                className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 text-[11px] font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${acpLoading ? 'animate-spin' : ''}`} />
                Atualizar modelos
              </button>
            </div>

            {acpLoading && acpProviders.length === 0 && (
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Detectando Kilo Code e OpenCode...
              </div>
            )}

            {!acpLoading && !acpProviders.some((provider) => provider.id === formData.primaryAiProvider) && (
              <div className="text-xs text-amber-400 font-mono flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> O agente selecionado não foi detectado. Atualize os modelos.
              </div>
            )}

            {acpProviders
              .filter((provider) => provider.id === formData.primaryAiProvider)
              .map((provider) => {
              const selectedModel = provider.id === 'kilo' ? formData.kiloModel : formData.openCodeModel;
              const status = acpTestStatus[provider.id];
              return (
                <div key={provider.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        {provider.display_name}
                        <span className={`w-2 h-2 rounded-full ${provider.installed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[360px]" title={provider.binary_path}>
                        {provider.installed
                          ? `v${provider.version || '?'} • ${provider.model_count} modelos • ${provider.binary_path || ''}`
                          : provider.error}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleAcpTest(provider.id, selectedModel)}
                      disabled={!provider.installed || !selectedModel || status?.loading}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-[11px] font-medium flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {status?.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                      Testar IA
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-medium">
                      Modelo disponível no {provider.display_name}
                    </label>
                    <select
                      value={selectedModel}
                      disabled={!provider.installed || provider.models.length === 0}
                      onChange={(event) => {
                        if (provider.id === 'kilo') {
                          setFormData({ ...formData, kiloModel: event.target.value });
                        } else {
                          setFormData({ ...formData, openCodeModel: event.target.value });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono disabled:opacity-50"
                    >
                      {provider.models.length === 0 && <option value="">Nenhum modelo detectado</option>}
                      {provider.models.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  {provider.error && <div className="text-[10px] text-amber-400 font-mono">{provider.error}</div>}
                  {status?.message && (
                    <div className={`text-[10px] font-mono flex items-start gap-1 ${status.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {status.success ? <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" /> : <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />}
                      <span className="line-clamp-3 whitespace-pre-wrap">{status.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Section 3: Web Search Harness OSINT Providers */}
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <Globe className="w-4 h-4" /> Harness de Busca Web (OSINT Providers)
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Modo de Operação da Busca</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'local', name: 'Base Local', desc: 'Dados Offline' },
                  { id: 'web', name: 'Web Search', desc: 'Tavily / SerpAPI' },
                  { id: 'hybrid', name: 'Híbrido (Recomendado)', desc: 'Local + Web OSINT' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, searchMode: mode.id as any })}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      formData.searchMode === mode.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{mode.name}</div>
                    <div className="text-[10px] text-slate-500">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-300 font-medium">Tavily Search API Key</label>
                {envStatus?.has_tavily_env && !formData.tavilyApiKey && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Detectada no .env
                  </span>
                )}
              </div>
              <input
                type="password"
                value={formData.tavilyApiKey}
                onChange={(e) => setFormData({ ...formData, tavilyApiKey: e.target.value })}
                placeholder={envStatus?.has_tavily_env ? "Usando TAVILY_API_KEY do arquivo .env" : "tvly-..."}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono placeholder:text-emerald-500/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-300 font-medium font-mono">SerpAPI / Google Search Key (Opcional)</label>
                {envStatus?.has_serp_env && !formData.serpApiKey && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Detectada no .env
                  </span>
                )}
              </div>
              <input
                type="password"
                value={formData.serpApiKey}
                onChange={(e) => setFormData({ ...formData, serpApiKey: e.target.value })}
                placeholder={envStatus?.has_serp_env ? "Usando SERP_API_KEY do arquivo .env" : "serp_..."}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono placeholder:text-emerald-500/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-300 font-medium">Perplexity API Key (Opcional)</label>
                {envStatus?.has_perplexity_env && !formData.perplexityApiKey && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Detectada no .env
                  </span>
                )}
              </div>
              <input
                type="password"
                value={formData.perplexityApiKey}
                onChange={(e) => setFormData({ ...formData, perplexityApiKey: e.target.value })}
                placeholder={envStatus?.has_perplexity_env ? "Usando PERPLEXITY_API_KEY do arquivo .env" : "pplx-..."}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono placeholder:text-emerald-500/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-300 font-medium">Exa.ai API Key (Opcional)</label>
                {envStatus?.has_exa_env && !formData.exaApiKey && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Detectada no .env
                  </span>
                )}
              </div>
              <input
                type="password"
                value={formData.exaApiKey}
                onChange={(e) => setFormData({ ...formData, exaApiKey: e.target.value })}
                placeholder={envStatus?.has_exa_env ? "Usando EXA_API_KEY do arquivo .env" : "exa-..."}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono placeholder:text-emerald-500/60"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};
