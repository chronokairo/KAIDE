"use client";

import React from 'react';
import { useLayoutPanels } from '@/providers/LayoutPanelsProvider';
import { useHarnessOverview, useIsTauri } from '@/modules/dev/hooks/useHarness';
import { ERP_MODULES } from '@/shared/config/erp-modules';
import { useHarnessMode } from '@/providers/HarnessModeProvider';

export const TopNavBar: React.FC = () => {
  const { activeNavTab, toggleBottomTerminal, setCommandPaletteOpen } = useLayoutPanels();
  const { result: overview } = useHarnessOverview();
  const { isHarnessMode, toggleHarnessMode } = useHarnessMode();
  const isTauri = useIsTauri();

  const currentModule = ERP_MODULES.find((m) => m.id === activeNavTab) || {
    id: activeNavTab,
    name: activeNavTab ? activeNavTab.toUpperCase() : 'ChronoKairo IA',
    icon: 'dashboard',
    description: '',
  };

  const repos = overview?.data?.repos ?? [];
  const activeRepo = repos[0]?.name || 'desktop';

  return (
    <header className="h-14 bg-[#111318] border-b border-white/10 px-5 flex items-center justify-between shrink-0 select-none z-20 font-sans">
      {/* Left: Active Screen Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-teal-400">
            {currentModule.icon}
          </span>
          <h1 className="text-sm font-bold text-white tracking-wide">
            {currentModule.name}
          </h1>
        </div>

        <span className="text-zinc-600">•</span>

        {/* Project Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
          <span className="material-symbols-outlined text-[14px] text-amber-400">folder_open</span>
          <span>{activeRepo}</span>
        </div>
      </div>

      {/* Center: Global Search & Command Palette Trigger */}
      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all w-72 max-w-sm justify-between font-mono cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px]">search</span>
          <span>Buscar ou executar comando...</span>
        </div>
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] text-zinc-300 font-bold">
          Ctrl+K
        </kbd>
      </button>

      {/* Right: Actions & Status */}
      <div className="flex items-center gap-2">
        {/* Harness Mode Switch */}
        <button
          type="button"
          onClick={toggleHarnessMode}
          title={isHarnessMode ? 'Modo Harness Ativo (Alternar para Modo Assistente)' : 'Modo Assistente Ativo (Alternar para Modo Harness)'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isHarnessMode
              ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
              : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {isHarnessMode ? 'developer_board' : 'chat'}
          </span>
          <span className="font-mono text-[11px]">{isHarnessMode ? 'Harness Mode' : 'Chat Mode'}</span>
        </button>

        {/* Terminal Trigger */}
        <button
          type="button"
          onClick={toggleBottomTerminal}
          title="Terminal Integrado (Ctrl+`)"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">terminal</span>
        </button>

        {/* Platform Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>{isTauri ? 'Tauri Desktop' : 'Web Dev'}</span>
        </div>
      </div>
    </header>
  );
};
