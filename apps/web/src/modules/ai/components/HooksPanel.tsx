'use client';

import React, { useState } from 'react';
import { useHooksSystem, useIsTauri } from '@/modules/dev/hooks/useHarness';
import type { HookInfo } from '@/modules/dev/harness-client';

const DEMO_EVENT_NAMES = [
  'session:start',
  'session:end',
  'tool:before_call',
  'tool:after_call',
  'patch:before_apply',
  'patch:after_apply',
  'error:runtime',
  'workspace:indexed',
];

const DEMO_HOOKS: HookInfo[] = [
  { name: 'patch:before_apply', event: 'patch:before_apply', enabled: true, matcher: '*.ts', group_index: 0, handler_index: 0, command: 'pnpm typecheck' },
  { name: 'session:start', event: 'session:start', enabled: true, matcher: undefined, group_index: 0, handler_index: 1, command: 'echo "Session started"' },
  { name: 'error:runtime', event: 'error:runtime', enabled: true, matcher: undefined, group_index: 1, handler_index: 0, command: 'npm run diagnostics' },
];

export const HooksPanel: React.FC = () => {
  const isTauri = useIsTauri();
  const { hooks: rawHooks, eventNames: rawEventNames, loading, error, loadFromFile, dispatch } = useHooksSystem();
  const [hooksPath, setHooksPath] = useState('.opencode/hooks.json');
  const [dispatchEvent, setDispatchEvent] = useState('session:start');
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; output: string; exit_code: number | null }[] | null>(null);

  const eventNames = rawEventNames.length > 0 ? rawEventNames : (!isTauri ? DEMO_EVENT_NAMES : []);
  const hooks = rawHooks.length > 0 ? rawHooks : (!isTauri ? DEMO_HOOKS : []);

  const handleLoad = async () => {
    if (!hooksPath.trim()) return;
    if (!isTauri) {
      setDispatchResult([{ success: true, output: `Hooks carregados de ${hooksPath} (modo demonstração)`, exit_code: 0 }]);
      return;
    }
    await loadFromFile(hooksPath);
  };

  const handleDispatch = async () => {
    if (!dispatchEvent.trim()) return;
    if (!isTauri) {
      setDispatchResult([
        {
          success: true,
          output: `[SIMULAÇÃO] Evento "${dispatchEvent}" disparado com sucesso no runtime.`,
          exit_code: 0,
        },
      ]);
      return;
    }
    const result = await dispatch(dispatchEvent);
    setDispatchResult(result ? (Array.isArray(result) ? result : [result as any]) : null);
  };

  return (
    <div className="space-y-3 text-primary">
      {/* Web Mode Banner */}
      {!isTauri && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
            <span className="truncate">
              <strong>Modo Web:</strong> Catálogo de hooks de ciclo de vida. O disparo de comandos no shell local requer o Tauri Desktop.
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-900 shrink-0">
            PREVIEW
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Event Names */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
          <h3 className="font-bold text-sm text-primary tracking-tight">Hook Events</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Eventos do ciclo de vida disponíveis para automação.
          </p>
        </div>
        <div className="p-3.5">
          {eventNames.length === 0 ? (
            <div className="text-xs text-on-surface-variant">Carregando eventos...</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {eventNames.map((name) => (
                <span
                  key={name}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-mono cursor-pointer transition-all ${
                    dispatchEvent === name
                      ? 'bg-primary text-on-primary font-bold shadow-2xs'
                      : 'bg-surface-container-low text-primary border border-outline-variant/40 hover:bg-surface-container'
                  }`}
                  onClick={() => setDispatchEvent(name)}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Load Hooks */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
          <h3 className="font-bold text-sm text-primary tracking-tight">Load Hooks</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Carregue hooks declarados em arquivo de configuração.
          </p>
        </div>
        <div className="p-3.5 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={hooksPath}
              onChange={(e) => setHooksPath(e.target.value)}
              placeholder="Caminho do arquivo de hooks"
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50"
            />
            <button
              onClick={handleLoad}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs"
            >
              {loading ? 'Carregando...' : 'Carregar'}
            </button>
          </div>

          {hooks.length > 0 && (
            <div className="divide-y divide-outline-variant/20 max-h-[220px] overflow-y-auto no-scrollbar">
              {hooks.map((h, i) => (
                <div key={i} className="py-2.5 px-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{h.event}</span>
                      {h.matcher && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-mono">
                          {h.matcher}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      g{h.group_index}:h{h.handler_index}
                    </span>
                  </div>
                  {h.command && (
                    <div className="mt-1 font-mono text-[10px] text-on-surface-variant truncate bg-surface-container-low/60 p-1.5 rounded-lg">
                      $ {h.command}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Event */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
          <h3 className="font-bold text-sm text-primary tracking-tight">Dispatch Event</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Dispare um evento para testar o comportamento dos handlers.
          </p>
        </div>
        <div className="p-3.5 space-y-3">
          <div className="flex gap-2">
            <select
              value={dispatchEvent}
              onChange={(e) => setDispatchEvent(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary"
            >
              <option value="">Selecione um evento...</option>
              {eventNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button
              onClick={handleDispatch}
              disabled={!dispatchEvent.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-2xs"
            >
              Disparar
            </button>
          </div>

          {dispatchResult && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              {dispatchResult.map((r, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl text-xs border ${
                    r.success
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900'
                      : 'bg-red-500/10 border-red-500/25 text-red-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">
                      {r.success ? 'check_circle' : 'error'}
                    </span>
                    <span className="font-semibold">{r.success ? 'Sucesso' : 'Falha'}</span>
                    {r.exit_code != null && (
                      <span className="font-mono text-[10px]">exit={r.exit_code}</span>
                    )}
                  </div>
                  {r.output && (
                    <div className="mt-1 font-mono text-[10px] opacity-80 truncate">{r.output}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
