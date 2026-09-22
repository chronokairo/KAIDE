'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { browserClient, type PageInfo, type StructuredData, type PageText } from '@/modules/dev/harness/browser';
import { isTauriRuntime } from '@/modules/dev/harness/transport';

interface AgentLog {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface AutomationAction {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const AUTOMATION_ACTIONS: AutomationAction[] = [
  { id: 'read-dom', label: 'Ler DOM Completo', icon: 'code', description: 'Extrai a árvore de acessibilidade e elementos visíveis da página atual' },
  { id: 'extract-structured', label: 'Dados Estruturados', icon: 'data_object', description: 'Tabelas, listas, imagens, metadados e JSON-LD da página' },
  { id: 'fill-form', label: 'Preencher Formulário', icon: 'edit_note', description: 'Preenche campos de formulário com dados do ERP automaticamente' },
  { id: 'extract-contacts', label: 'Extrair Contatos', icon: 'contacts', description: 'E-mails, telefones, CNPJs e links sociais da página' },
  { id: 'screenshot', label: 'Captura de Tela', icon: 'photo_camera', description: 'Captura a viewport visível como imagem PNG' },
  { id: 'scroll-capture', label: 'Scroll & Capturar', icon: 'swipe_down', description: 'Rola a página e captura dados de cada seção visível' },
  { id: 'network-monitor', label: 'Monitor de Rede', icon: 'radar', description: 'Intercepta chamadas fetch/XHR da página em tempo real' },
  { id: 'page-fetch', label: 'Fetch via Página', icon: 'cloud_download', description: 'Faz requisição HTTP pelo contexto da página (bypass CORS)' },
];

export const AiBrowserView: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [pageText, setPageText] = useState<PageText | null>(null);
  const [structuredData, setStructuredData] = useState<StructuredData | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'automation' | 'data' | 'logs'>('automation');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [fillFields, setFillFields] = useState('{}');
  const [fetchUrl, setFetchUrl] = useState('');
  const [fetchMethod, setFetchMethod] = useState('GET');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);

  const isTauri = isTauriRuntime();

  const addLog = useCallback((message: string, type: AgentLog['type'] = 'info') => {
    setAgentLogs((prev) => [
      ...prev.slice(-49),
      { time: new Date().toLocaleTimeString(), message, type },
    ]);
  }, []);

  const handleReadPage = useCallback(async () => {
    if (!isTauri) {
      addLog('Browser automation requer Tauri runtime', 'warning');
      return;
    }
    setIsLoading(true);
    addLog('Lendo informações da página...', 'info');
    try {
      const result = await browserClient.getPageInfo();
      if (result.available) {
        setPageInfo(result.data);
        addLog(`Página: ${result.data.title}`, 'success');
        addLog(`URL: ${result.data.url}`, 'info');
        addLog(`Links: ${result.data.links.length} | Formulários: ${result.data.forms.length}`, 'info');
      } else {
        addLog('Página não disponível (runtime não Tauri)', 'error');
      }
    } catch (e) {
      addLog(`Exceção: ${e}`, 'error');
    }
    setIsLoading(false);
  }, [isTauri, addLog]);

  const handleReadText = useCallback(async () => {
    if (!isTauri) return;
    setIsLoading(true);
    addLog('Extraindo texto da página...', 'info');
    try {
      const result = await browserClient.getPageText();
      if (result.available) {
        setPageText(result.data);
        addLog(`Texto extraído: ${result.data.wordCount} palavras`, 'success');
      } else {
        addLog('Texto não disponível', 'error');
      }
    } catch (e) {
      addLog(`Exceção: ${e}`, 'error');
    }
    setIsLoading(false);
  }, [isTauri, addLog]);

  const handleStructuredData = useCallback(async () => {
    if (!isTauri) return;
    setIsLoading(true);
    addLog('Extraindo dados estruturados...', 'info');
    try {
      const result = await browserClient.getStructuredData();
      if (result.available) {
        setStructuredData(result.data);
        const { headings, tables, images, lists, jsonLd } = result.data;
        addLog(`Headings: ${headings?.length ?? 0} | Tabelas: ${tables?.length ?? 0} | Imagens: ${images?.length ?? 0} | Listas: ${lists?.length ?? 0} | JSON-LD: ${jsonLd?.length ?? 0}`, 'success');
      } else {
        addLog('Dados não disponíveis', 'error');
      }
    } catch (e) {
      addLog(`Exceção: ${e}`, 'error');
    }
    setIsLoading(false);
  }, [isTauri, addLog]);

  const handleFillForm = useCallback(async () => {
    if (!isTauri) return;
    setIsLoading(true);
    addLog('Preenchendo formulário...', 'info');
    try {
      const fields = JSON.parse(fillFields);
      const result = await browserClient.fillForm(fields);
      if (result.available) {
        const filled = result.data.results.filter((r) => r.found).length;
        const total = result.data.results.length;
        addLog(`Formulário preenchido: ${filled}/${total} campos`, 'success');
        result.data.results.forEach((r) => {
          addLog(`  ${r.name}: ${r.found ? '✓' : '✗ não encontrado'}`, r.found ? 'success' : 'warning');
        });
      } else {
        addLog('Formulário não disponível', 'error');
      }
    } catch (e) {
      addLog(`JSON inválido ou erro: ${e}`, 'error');
    }
    setIsLoading(false);
  }, [isTauri, fillFields, addLog]);

  const handleScreenshot = useCallback(async () => {
    if (!isTauri) return;
    setIsLoading(true);
    addLog('Capturando viewport...', 'info');
    try {
      const result = await browserClient.screenshot();
      if (result.available && result.data.ok) {
        setScreenshotBase64(result.data.base64 ?? null);
        addLog(`Screenshot: ${result.data.width}x${result.data.height}`, 'success');
      } else {
        addLog(`Erro screenshot: ${result.data?.error || 'indisponível'}`, 'error');
      }
    } catch (e) {
      addLog(`Exceção: ${e}`, 'error');
    }
    setIsLoading(false);
  }, [isTauri, addLog]);

  const handleNetworkMonitor = useCallback(async () => {
    if (!isTauri) return;
    setIsLoading(true);
    addLog('Lendo log de rede...', 'info');
    try {
      const result = await browserClient.getFetchLog();
      if (result.available) {
        addLog(`Requisições capturadas: ${result.data.total}`, 'success');
        result.data.entries.slice(-10).forEach((e) => {
          addLog(`  ${e.method} ${e.url.slice(0, 80)}`, 'info');
        });
      } else {
        addLog('Log de rede não disponível', 'error');
      }
    } catch (e) {
      addLog(`Exceção: ${e}`, 'error');
    }
    setIsLoading(false);
  }, [isTauri, addLog]);

  const handlePageFetch = useCallback(async () => {
    if (!isTauri || !fetchUrl.trim()) return;
    setIsLoading(true);
    addLog(`Fetch ${fetchMethod}: ${fetchUrl}`, 'info');
    try {
      const result = await browserClient.pageFetch(fetchUrl, fetchMethod);
      if (result.available) {
        addLog(`Status: ${result.data.status} ${result.data.statusText}`, result.data.ok ? 'success' : 'warning');
        addLog(`Body (${result.data.body?.length ?? 0} chars): ${(result.data.body ?? '').slice(0, 200)}`, 'info');
      } else {
        addLog('Fetch não disponível', 'error');
      }
    } catch (e) {
      addLog(`Exceção: ${e}`, 'error');
    }
    setIsLoading(false);
  }, [isTauri, fetchUrl, fetchMethod, addLog]);

  const handleScrollCapture = useCallback(async () => {
    if (!isTauri) return;
    setIsLoading(true);
    addLog('Scroll-down e captura...', 'info');
    try {
      const scrollResult = await browserClient.scroll('down', 500);
      if (scrollResult.available) {
        addLog(`Scroll: Y=${scrollResult.data.scrollY} (atBottom=${scrollResult.data.atBottom})`, 'success');
        const info = await browserClient.getPageText();
        if (info.available) {
          setPageText(info.data);
          addLog(`Texto atualizado: ${info.data.wordCount} palavras`, 'success');
        }
      }
    } catch (e) {
      addLog(`Exceção: ${e}`, 'error');
    }
    setIsLoading(false);
  }, [isTauri, addLog]);

  const handleAction = useCallback((actionId: string) => {
    setSelectedAction(actionId);
    switch (actionId) {
      case 'read-dom': handleReadPage(); break;
      case 'extract-structured': handleStructuredData(); break;
      case 'fill-form': handleFillForm(); break;
      case 'extract-contacts': handleReadText(); break;
      case 'screenshot': handleScreenshot(); break;
      case 'scroll-capture': handleScrollCapture(); break;
      case 'network-monitor': handleNetworkMonitor(); break;
      case 'page-fetch': handlePageFetch(); break;
    }
  }, [handleReadPage, handleStructuredData, handleFillForm, handleReadText, handleScreenshot, handleScrollCapture, handleNetworkMonitor, handlePageFetch]);

  // Auto-read page on mount
  useEffect(() => {
    if (isTauri) {
      handleReadPage();
    }
  }, [isTauri, handleReadPage]);

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background text-primary">
      {/* Header */}
      <div className="p-2 border-b border-outline-variant/60 bg-surface flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">smart_toy</span>
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-primary">Browser Automation</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${isTauri ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20' : 'bg-amber-500/10 text-amber-800 border-amber-500/20'}`}>
            {isTauri ? 'Tauri — Nativo' : 'Web — Limitado'}
          </span>
          {isLoading && (
            <span className="material-symbols-outlined text-[14px] text-primary animate-spin">refresh</span>
          )}
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/40 text-[11px] font-semibold">
          {([
            { key: 'automation', icon: 'build', label: 'Ações' },
            { key: 'data', icon: 'data_object', label: 'Dados Extraídos' },
            { key: 'logs', icon: 'terminal', label: 'Log' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${activeView === tab.key ? 'bg-surface text-primary shadow-xs font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[13px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Automation Actions View */}
        {activeView === 'automation' && (
          <div className="space-y-2">
            {!isTauri && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs">
                <strong>Modo Web:</strong> A automação completa requer o runtime Tauri. Algumas funcionalidades estão disponíveis via scraping HTTP.
              </div>
            )}

            {/* Quick action grid */}
            <div className="grid grid-cols-2 gap-2">
              {AUTOMATION_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={isLoading || (!isTauri && action.id !== 'page-fetch')}
                  className={`p-3 rounded-xl border text-left transition-all ${selectedAction === action.id ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20' : 'bg-surface border-outline-variant/50 hover:border-primary/30 hover:bg-surface-container-low'} disabled:opacity-40`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">{action.icon}</span>
                    <span className="text-xs font-bold text-primary">{action.label}</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-snug">{action.description}</p>
                </button>
              ))}
            </div>

            {/* Fill form input */}
            {selectedAction === 'fill-form' && (
              <div className="p-3 rounded-2xl bg-surface border border-outline-variant/70 space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Campos JSON (name: value)</label>
                <textarea
                  value={fillFields}
                  onChange={(e) => setFillFields(e.target.value)}
                  rows={3}
                  className="w-full text-[11px] font-mono bg-surface-container-low border border-outline-variant/50 rounded-lg p-2 text-primary outline-none focus:border-primary"
                  placeholder='{"email": "user@example.com", "senha": "123456"}'
                />
                <button onClick={handleFillForm} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90">
                  Preencher
                </button>
              </div>
            )}

            {/* Page fetch input */}
            {selectedAction === 'page-fetch' && (
              <div className="p-3 rounded-2xl bg-surface border border-outline-variant/70 space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Fetch HTTP via WebView</label>
                <div className="flex gap-2">
                  <select
                    value={fetchMethod}
                    onChange={(e) => setFetchMethod(e.target.value)}
                    className="text-[11px] font-mono bg-surface-container-low border border-outline-variant/50 rounded-lg p-1.5 text-primary outline-none"
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                    <option>DELETE</option>
                  </select>
                  <input
                    type="text"
                    value={fetchUrl}
                    onChange={(e) => setFetchUrl(e.target.value)}
                    className="flex-1 text-[11px] font-mono bg-surface-container-low border border-outline-variant/50 rounded-lg p-1.5 text-primary outline-none focus:border-primary"
                    placeholder="https://api.example.com/data"
                  />
                </div>
                <button onClick={handlePageFetch} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90">
                  Executar Fetch
                </button>
              </div>
            )}

            {/* Screenshot preview */}
            {screenshotBase64 && (
              <div className="p-3 rounded-2xl bg-surface border border-outline-variant/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">photo_camera</span>
                    <span className="text-xs font-bold text-primary">Captura de Tela</span>
                  </div>
                  <button
                    onClick={async () => {
                      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                      const result = await (browserClient as any).downloadScreenshot?.(screenshotBase64, `screenshot-${ts}.png`);
                      if (result?.available) addLog(result.data?.message || 'Download OK', 'success');
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-on-primary text-[10px] font-bold hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-[12px]">download</span>
                    <span>Baixar PNG</span>
                  </button>
                </div>
                <img
                  src={`data:image/png;base64,${screenshotBase64}`}
                  alt="Screenshot"
                  className="w-full rounded-xl border border-outline-variant/50"
                />
              </div>
            )}
          </div>
        )}

        {/* Data View */}
        {activeView === 'data' && (
          <div className="space-y-3">
            {/* Page info */}
            {pageInfo && (
              <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary font-mono uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">public</span>
                    <span>Página Atual</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => {
                        const result = await (browserClient as any).downloadPageHtml?.(`${pageInfo.hostname || 'page'}.html`);
                        if (result?.available) addLog(result.data?.message || 'HTML baixado', 'success');
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container text-primary text-[10px] font-bold hover:bg-surface-container-high border border-outline-variant/50"
                    >
                      <span className="material-symbols-outlined text-[12px]">code</span>
                      <span>HTML</span>
                    </button>
                    <button
                      onClick={async () => {
                        const result = await (browserClient as any).downloadPageText?.(`${pageInfo.hostname || 'page'}.txt`);
                        if (result?.available) addLog(result.data?.message || 'Texto baixado', 'success');
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container text-primary text-[10px] font-bold hover:bg-surface-container-high border border-outline-variant/50"
                    >
                      <span className="material-symbols-outlined text-[12px]">article</span>
                      <span>TXT</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-primary font-bold">{pageInfo.title || '(sem título)'}</div>
                <div className="text-[11px] font-mono text-on-surface-variant break-all">{pageInfo.url}</div>

                {pageInfo.links && pageInfo.links.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Links ({pageInfo.links.length})</span>
                    <div className="max-h-32 overflow-y-auto space-y-0.5 text-[10px] font-mono">
                      {pageInfo.links.slice(0, 20).map((l, i) => (
                        <div key={i} className="text-on-surface-variant truncate">
                          <span className="text-primary">{l.text || '(sem texto)'}</span> &rarr; {l.href}
                        </div>
                      ))}
                      {pageInfo.links.length > 20 && (
                        <span className="text-on-surface-variant/70">... e mais {pageInfo.links.length - 20} links</span>
                      )}
                    </div>
                  </div>
                )}

                {pageInfo.forms && pageInfo.forms.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Formulários Detectados</span>
                    {pageInfo.forms.map((form: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[10px] font-mono">
                        <span className="text-primary font-bold">{(form.method || 'GET').toUpperCase()}</span> {form.action || '(action vazio)'}
                        <div className="mt-1 space-y-0.5">
                          {form.fields && form.fields.map((f: any, j: number) => (
                            <div key={j} className="text-on-surface-variant">
                              <span className="text-primary">{f.name || f.id || f.type}</span>
                              {f.placeholder && <span className="text-outline"> ({f.placeholder})</span>}
                              {f.value && <span className="text-emerald-700"> = {f.value.slice(0, 30)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Structured data */}
            {structuredData && (
              <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary font-mono uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">data_object</span>
                    <span>Dados Estruturados</span>
                  </div>
                  <button
                    onClick={async () => {
                      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                      const result = await (browserClient as any).downloadJson?.(structuredData, `dados-estruturados-${ts}.json`);
                      if (result?.available) addLog(result.data?.message || 'JSON baixado', 'success');
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-on-primary text-[10px] font-bold hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-[12px]">download</span>
                    <span>Baixar JSON</span>
                  </button>
                </div>

                {structuredData.headings && structuredData.headings.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Headings</span>
                    {structuredData.headings.map((h: any, i: number) => (
                      <div key={i} className="text-[11px] text-primary" style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                        <span className="font-mono text-outline-variant text-[10px]">H{h.level}</span> {h.text}
                      </div>
                    ))}
                  </div>
                )}

                {structuredData.tables && structuredData.tables.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Tabelas ({structuredData.tables.length})</span>
                    {structuredData.tables.map((t: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[10px] font-mono overflow-x-auto">
                        <div className="text-on-surface-variant mb-1">{t.rows} rows x {t.cols} cols</div>
                        {t.headers && t.headers.length > 0 && (
                          <div className="flex gap-2 font-bold text-primary border-b border-outline-variant/30 pb-1 mb-1">
                            {t.headers.map((h: any, j: number) => <span key={j}>{h}</span>)}
                          </div>
                        )}
                        {t.data && t.data.slice(0, 5).map((row: any[], j: number) => (
                          <div key={j} className="flex gap-2 text-on-surface-variant">
                            {row.map((cell: any, k: number) => <span key={k} className="truncate max-w-[120px]">{cell}</span>)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {structuredData.jsonLd && structuredData.jsonLd.length > 0 && (
                  <div className="p-2 rounded-lg bg-[#2B2C30] text-[#F8F7F4] font-mono text-[10px] overflow-x-auto">
                    <span className="text-zinc-400 font-bold">JSON-LD:</span>
                    <pre className="mt-1">{JSON.stringify(structuredData.jsonLd, null, 2).slice(0, 1000)}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Page text */}
            {pageText && (
              <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/70 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary font-mono uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">article</span>
                  <span>Texto da Página</span>
                  <span className="text-[10px] text-on-surface-variant">({pageText.wordCount || Math.round((pageText.text?.length || 0) / 5)} palavras)</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[11px] text-on-surface leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {pageText.text.slice(0, 5000)}
                  {pageText.text.length > 5000 && <span className="text-on-surface-variant">... ({pageText.length - 5000} chars restantes)</span>}
                </div>
              </div>
            )}

            {!pageInfo && !structuredData && !pageText && (
              <div className="p-6 rounded-2xl bg-surface border border-outline-variant/50 text-center space-y-2">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">visibility</span>
                <p className="text-xs text-on-surface-variant">Execute uma ação na aba "Ações" para extrair dados da página atual.</p>
              </div>
            )}
          </div>
        )}

        {/* Logs View */}
        {activeView === 'logs' && (
          <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                <span>Trilha de Execução</span>
              </span>
              <button onClick={() => setAgentLogs([])} className="text-[10px] font-mono text-on-surface-variant hover:text-primary">
                Limpar
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/50 font-mono text-[11px] space-y-1 max-h-96 overflow-y-auto">
              {agentLogs.length === 0 && (
                <p className="text-on-surface-variant text-[10px]">Nenhum log ainda.</p>
              )}
              {agentLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className={`font-bold ${
                    log.type === 'success' ? 'text-emerald-600' :
                    log.type === 'error' ? 'text-red-600' :
                    log.type === 'warning' ? 'text-amber-600' :
                    'text-on-surface-variant'
                  }`}>›</span>
                  <span className="text-on-surface-variant text-[10px] shrink-0">{log.time}</span>
                  <span className={`${
                    log.type === 'success' ? 'text-emerald-800' :
                    log.type === 'error' ? 'text-red-800' :
                    log.type === 'warning' ? 'text-amber-800' :
                    'text-primary'
                  }`}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
