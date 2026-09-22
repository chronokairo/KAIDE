'use client';

import React from 'react';
import { useHarnessMode } from '@/providers/HarnessModeProvider';
import { useHarnessOverview, useIsTauri } from '@/modules/dev/hooks/useHarness';

export type HarnessViewMode = 'chat' | 'preview';

interface HarnessTopBarProps {
  activeSessionTitle?: string;
  viewMode: HarnessViewMode;
  onChangeViewMode: (mode: HarnessViewMode) => void;
}

export const HarnessTopBar: React.FC<HarnessTopBarProps> = ({
  activeSessionTitle,
  viewMode,
  onChangeViewMode,
}) => {
  const { exitHarnessMode } = useHarnessMode();
  const isTauri = useIsTauri();
  const { result } = useHarnessOverview();
  const repos = result?.data?.repos ?? [];

  return (
    <header className="hidden md:flex justify-between items-center px-4 w-full sticky top-0 z-40 h-12 bg-surface/90 backdrop-blur-md border-b border-outline-variant/60 shrink-0 select-none text-primary">
      {/* Left: Breadcrumbs + Session */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-sans">
          <span className="text-primary font-bold">Dev</span>
          <span className="text-on-surface-variant/40 font-mono">/</span>
          <span className="text-on-surface-variant font-semibold">Harness IA</span>
        </div>

        {activeSessionTitle && (
          <>
            <div className="w-px h-3.5 bg-outline-variant/60" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/50 text-primary text-xs font-medium truncate max-w-[280px] shadow-2xs">
              <span className="material-symbols-outlined text-[13px] text-primary">chat_bubble</span>
              <span className="truncate">{activeSessionTitle}</span>
            </div>
          </>
        )}
      </div>

      {/* Center: View Switcher (Preview Drawer Toggle) */}
      <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-container-low border border-outline-variant/50 shadow-2xs">
        <button
          onClick={() => onChangeViewMode('chat')}
          className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            viewMode === 'chat'
              ? 'bg-surface text-primary shadow-2xs border border-outline-variant/40 font-bold'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface/50'
          }`}
          title="Foco no Chat IA"
        >
          <span className="material-symbols-outlined text-[15px]">forum</span>
          <span>Chat</span>
        </button>

        <button
          onClick={() => onChangeViewMode(viewMode === 'preview' ? 'chat' : 'preview')}
          className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            viewMode === 'preview'
              ? 'bg-primary text-on-primary shadow-2xs font-bold'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface/50'
          }`}
          title="Abrir/Fechar Sidebar de Preview do Browser"
        >
          <span className="material-symbols-outlined text-[15px]">devices</span>
          <span>Preview Lateral</span>
        </button>
      </div>

      {/* Right: Status + Actions */}
      <div className="flex items-center gap-1.5">
        {/* Runtime badge */}
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
          isTauri
            ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/25'
            : 'bg-amber-500/10 text-amber-800 border border-amber-500/25'
        }`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isTauri ? 'bg-emerald-600' : 'bg-amber-600'}`} />
          {isTauri ? 'TAURI' : 'WEB'}
        </div>

        {/* Repos count */}
        {repos.length > 0 && (
          <div className="px-2 py-0.5 rounded-full text-[10px] font-mono text-on-surface-variant bg-surface-container-low border border-outline-variant/40">
            {repos.length} repo{repos.length > 1 ? 's' : ''}
          </div>
        )}

        <div className="w-px h-3.5 bg-outline-variant/60 mx-1" />

        {/* Exit Harness */}
        <button
          onClick={() => { exitHarnessMode(); window.location.href = '/'; }}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-all text-[15px]"
          title="Sair do Harness"
          aria-label="Sair do Harness"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
        </button>
      </div>
    </header>
  );
};
