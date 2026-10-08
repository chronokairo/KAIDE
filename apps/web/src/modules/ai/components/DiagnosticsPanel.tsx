'use client';

import React, { useState } from 'react';
import { useDiagnostics, useResponseDebugContext, useHarnessSyncStatus, useHarnessGitRepoStatus, useLlmUsageStats, useResetLlmUsageStats } from '@/modules/dev/hooks/useHarness';

const DEMO_DIAGNOSTICS = {
  process: {
    pid: 14920,
    resident_memory_bytes: 52 * 1024 * 1024,
    physical_footprint_bytes: 68 * 1024 * 1024,
  },
  gauges: [
    { name: 'llm_router_active_sessions', value: 1 },
    { name: 'context_fragments_loaded', value: 4 },
    { name: 'security_sandbox_level', value: 2 },
  ],
};

const DEMO_USAGE = {
  call_count: 18,
  total_tokens: 28450,
  total_prompt_tokens: 21900,
  total_completion_tokens: 6550,
  total_cost_usd: 0.01428,
};

export const DiagnosticsPanel: React.FC = () => {
  const { result, loading, error, refresh } = useDiagnostics();
  const { extract, format, loading: debugLoading } = useResponseDebugContext();
  const { result: syncResult } = useHarnessSyncStatus();
  const { result: gitRepoResult } = useHarnessGitRepoStatus(null);
  const { result: usageResult, refresh: refreshUsage } = useLlmUsageStats();
  const { execute: resetUsage, loading: resetLoading } = useResetLlmUsageStats();

  const [statusCode, setStatusCode] = useState('401');
  const [headers, setHeaders] = useState('x-request-id: req-123\ncf-ray: ray-abc\nx-ratelimit-remaining: 42');
  const [body, setBody] = useState('{"error": "Unauthorized API key"}');
  const [debugResult, setDebugResult] = useState<string | null>(null);

  const available = result?.available ?? false;
  const snapshot = result?.data ?? (!available ? DEMO_DIAGNOSTICS : undefined);
  const usage = usageResult?.data ?? (!available ? DEMO_USAGE : undefined);

  const handleExtract = async () => {
    const parsedHeaders: [string, string][] = headers
      .split('\n')
      .filter((l) => l.includes(':'))
      .map((l) => {
        const idx = l.indexOf(':');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      });
    const ctx = await extract(Number(statusCode) || 0, parsedHeaders, body || undefined);
    if (ctx) {
      const formatted = await format(ctx);
      setDebugResult(formatted);
    } else {
      setDebugResult(`Status: ${statusCode}\nHeaders:\n${headers}\nBody:\n${body}`);
    }
  };

  return (
    <div className="space-y-3 text-primary">
      {/* Web Mode Banner */}
      {!available && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
            <span className="truncate">
              <strong>Modo Web:</strong> Métricas e diagnósticos simulados. A telemetria de processo OS nativa requer o Tauri Desktop.
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-900 shrink-0">
            PREVIEW
          </span>
        </div>
      )}

      {/* Diagnostics */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary tracking-tight">Process Diagnostics</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Consumo de memória do processo e gauges de telemetria atômicos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono font-semibold">
              {available ? 'TAURI' : 'WEB'}
            </span>
            <button onClick={refresh} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors" title="Recarregar diagnósticos">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-xs text-on-surface-variant mt-2">Coletando métricas...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <span className="material-symbols-outlined text-error text-3xl">error</span>
            <p className="text-xs text-error mt-2">{error}</p>
          </div>
        ) : (
          <div className="p-3.5 space-y-3">
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="bg-surface-container-low/60 rounded-xl p-3">
                <div className="text-[10px] text-on-surface-variant mb-1 font-mono uppercase">PID</div>
                <div className="font-bold text-primary font-mono">{snapshot?.process.pid ?? 'Browser'}</div>
              </div>
              <div className="bg-surface-container-low/60 rounded-xl p-3">
                <div className="text-[10px] text-on-surface-variant mb-1 font-mono uppercase">RSS Memory</div>
                <div className="font-bold text-primary font-mono">
                  {snapshot?.process.resident_memory_bytes != null
                    ? `${(snapshot.process.resident_memory_bytes / 1024 / 1024).toFixed(1)} MB`
                    : 'N/A'}
                </div>
              </div>
              <div className="bg-surface-container-low/60 rounded-xl p-3">
                <div className="text-[10px] text-on-surface-variant mb-1 font-mono uppercase">Footprint</div>
                <div className="font-bold text-primary font-mono">
                  {snapshot?.process.physical_footprint_bytes != null
                    ? `${(snapshot.process.physical_footprint_bytes / 1024 / 1024).toFixed(1)} MB`
                    : 'N/A'}
                </div>
              </div>
            </div>

            {snapshot?.gauges && snapshot.gauges.length > 0 && (
              <div>
                <div className="text-xs font-bold text-primary mb-1.5">Gauges Atômicos</div>
                <div className="space-y-1">
                  {snapshot.gauges.map((g) => (
                    <div key={g.name} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-surface-container-low/40 border border-outline-variant/30">
                      <span className="font-mono text-on-surface-variant text-[11px]">{g.name}</span>
                      <span className="font-bold text-primary font-mono text-[11px]">{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sync Status */}
            <div className="pt-2 border-t border-outline-variant/20">
              <div className="text-xs font-bold text-primary mb-1.5">Sincronização & P2P</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface-container-low/60 rounded-xl p-2.5">
                  <div className="text-[10px] text-on-surface-variant font-mono uppercase">Sincronizando</div>
                  <div className="font-bold text-primary">{syncResult?.data?.syncing ? 'Sim' : 'Ativo (Local)'}</div>
                </div>
                <div className="bg-surface-container-low/60 rounded-xl p-2.5">
                  <div className="text-[10px] text-on-surface-variant font-mono uppercase">Peers Conectados</div>
                  <div className="font-bold text-primary">{syncResult?.data?.peers_online ?? 1}/{syncResult?.data?.peers_total ?? 1}</div>
                </div>
              </div>
            </div>

            {/* LLM Usage Stats */}
            {usage && (
              <div className="pt-2 border-t border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-primary">Consumo de LLM (Tokens & Custo)</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => refreshUsage()}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high text-primary font-medium"
                    >
                      Atualizar
                    </button>
                    <button
                      onClick={async () => { await resetUsage(); refreshUsage(); }}
                      disabled={resetLoading}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-error-container text-on-error-container hover:bg-error-container/80 font-medium disabled:opacity-50"
                    >
                      Zerar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-surface-container-low/60 rounded-xl p-2.5">
                    <div className="text-[10px] text-on-surface-variant font-mono uppercase">Chamadas</div>
                    <div className="font-bold text-primary font-mono">{(usage as any).call_count ?? (usage as any).callCount ?? 0}</div>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-xl p-2.5">
                    <div className="text-[10px] text-on-surface-variant font-mono uppercase">Tokens Totais</div>
                    <div className="font-bold text-primary font-mono">{Number((usage as any).total_tokens ?? (usage as any).totalTokens ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-xl p-2.5">
                    <div className="text-[10px] text-on-surface-variant font-mono uppercase">Prompt / Comp</div>
                    <div className="font-bold text-primary font-mono text-[11px]">
                      {(Number((usage as any).total_prompt_tokens ?? (usage as any).promptTokens ?? 0) / 1000).toFixed(1)}k / {(Number((usage as any).total_completion_tokens ?? (usage as any).completionTokens ?? 0) / 1000).toFixed(1)}k
                    </div>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-xl p-2.5">
                    <div className="text-[10px] text-on-surface-variant font-mono uppercase">Custo Est.</div>
                    <div className="font-bold text-primary font-mono">${Number((usage as any).total_cost_usd ?? (usage as any).totalCostUsd ?? 0).toFixed(4)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Debug Context */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
          <h3 className="font-bold text-sm text-primary tracking-tight">Response Debug Context</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Extraia e formate metadados de diagnóstico a partir de cabeçalhos e respostas HTTP.
          </p>
        </div>
        <div className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="number"
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value)}
              placeholder="Status (ex: 429)"
              className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary"
            />
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder="Headers (key: value por linha)"
              rows={2}
              className="md:col-span-2 px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary resize-none"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Corpo da resposta HTTP (opcional)"
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary"
            />
            <button
              onClick={handleExtract}
              disabled={debugLoading}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-2xs transition-colors"
            >
              {debugLoading ? 'Extraindo...' : 'Extrair Contexto'}
            </button>
          </div>

          {debugResult && (
            <div className="p-3 rounded-xl bg-surface-container-low text-xs font-mono text-primary whitespace-pre-wrap leading-relaxed border border-outline-variant/40 animate-in fade-in duration-150">
              {debugResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
