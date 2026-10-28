"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLayoutPanels } from '@/providers/LayoutPanelsProvider';
import { useHarnessOverview, useHarnessNodeIdentity } from '@/modules/dev/hooks/useHarness';
import { useIsTauri } from '@/modules/dev/hooks/useHarness';

const TERMINAL_PORT = 17890;
const TERMINAL_URL = `http://localhost:${TERMINAL_PORT}`;

export const TerminalBottomPanel: React.FC = () => {
  const { isBottomTerminalOpen, toggleBottomTerminal } = useLayoutPanels();
  const { result: overview, refresh } = useHarnessOverview();
  const { result: nodeResult } = useHarnessNodeIdentity();
  const isTauri = useIsTauri();

  const [activeTab, setActiveTab] = useState<'terminal' | 'harness' | 'node'>('terminal');
  const [terminalReady, setTerminalReady] = useState(false);
  const [terminalError, setTerminalError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleTerminalLoad = useCallback(() => {
    setTerminalReady(true);
    setTerminalError(false);
  }, []);

  const handleTerminalError = useCallback(() => {
    setTerminalReady(false);
    setTerminalError(true);
  }, []);

  useEffect(() => {
    if (!isBottomTerminalOpen) return;
    setTerminalReady(false);
    setTerminalError(false);
  }, [isBottomTerminalOpen]);

  const data = overview?.data as any;
  const repos: any[] = data?.repos ?? [];
  const sync = data?.sync;
  const identity = (nodeResult?.data as any)?.identity;

  if (!isBottomTerminalOpen) return null;

  return (
    <aside className="fixed bottom-0 left-0 right-0 h-64 z-50 bg-zinc-950 text-zinc-100 border-t border-zinc-800 shadow-2xl flex flex-col font-mono text-xs select-none animate-in slide-in-from-bottom duration-200">
      {/* Panel Header */}
      <div className="h-9 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-zinc-200">
            <span className="material-symbols-outlined text-[16px] text-teal-400">terminal</span>
            <span>Terminal & Harness</span>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800 text-[11px]">
            {isTauri && (
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                  activeTab === 'terminal' ? 'bg-zinc-800 text-teal-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Terminal
              </button>
            )}
            <button
              onClick={() => setActiveTab('harness')}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                activeTab === 'harness' ? 'bg-zinc-800 text-teal-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Harness Activity
            </button>
            <button
              onClick={() => setActiveTab('node')}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                activeTab === 'node' ? 'bg-zinc-800 text-teal-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Node Identity
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            title="Recarregar dados do harness"
            className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </button>
          <button
            onClick={toggleBottomTerminal}
            title="Fechar Terminal (Bottom Panel)"
            className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-hidden bg-zinc-950 text-zinc-300 relative">
        {/* Terminal Tab - xterm.js via iframe */}
        {activeTab === 'terminal' && isTauri && (
          <div className="w-full h-full relative">
            {!terminalReady && !terminalError && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                  Conectando ao terminal...
                </div>
              </div>
            )}
            {terminalError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-[11px] gap-2">
                <span className="material-symbols-outlined text-[20px] text-zinc-600">terminal</span>
                <div className="text-center">
                  <div className="font-bold text-zinc-400">Terminal PTY indisponível</div>
                  <div className="text-zinc-600 mt-1">O servidor PTY não está rodando na porta {TERMINAL_PORT}</div>
                  <div className="text-zinc-600 mt-0.5">Inicie com: <code className="text-amber-400/80">pnpm tauri dev</code></div>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={TERMINAL_URL}
              className="w-full h-full border-0 bg-black"
              onLoad={handleTerminalLoad}
              onError={handleTerminalError}
              title="Terminal PTY"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}

        {/* Fallback for non-Tauri terminal tab */}
        {activeTab === 'terminal' && !isTauri && (
          <div className="flex items-center justify-center h-full text-zinc-500 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
              Terminal interativo disponível apenas no desktop Tauri
            </div>
          </div>
        )}

        {/* Harness Activity Tab */}
        {activeTab === 'harness' && (
          <div className="h-full overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1">
            <div className="space-y-2">
              <div className="text-teal-400 font-bold">
                [SYSTEM] Harness Rust Sidecar Online · SQLite memory db ready
              </div>
              <div className="text-zinc-400">
                Repositórios rastreados: {repos.length} · Sync status: {sync?.peers_online ?? 0} peers online
              </div>
              {repos.map((r: any) => (
                <div key={r.path} className="flex items-center gap-2 text-zinc-300 hover:bg-zinc-900/60 p-1 rounded">
                  <span className="text-teal-500">{'>'}</span>
                  <span className="text-amber-300 font-bold">{r.name}</span>
                  <span className="text-zinc-500">{r.path}</span>
                  <span className="ml-auto text-zinc-400">{r.branch || 'main'} · {r.files} arquivos</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Node Identity Tab */}
        {activeTab === 'node' && (
          <div className="h-full overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1.5">
            <div className="text-teal-400 font-bold">[NODE IDENTITY] Chronokairo Local Peer</div>
            <div>Node ID: <span className="text-amber-300">{identity?.node_id || 'N/A'}</span></div>
            <div>Public Key: <span className="text-zinc-400 font-mono text-[10px] break-all">{identity?.public_key || 'N/A'}</span></div>
            <div>Peers Confiáveis: <span className="text-teal-400">{(nodeResult?.data as any)?.trustedPeerCount ?? 0}</span></div>
          </div>
        )}
      </div>
    </aside>
  );
};
