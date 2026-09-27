"use client";

import React, { useState } from 'react';
import { useLayoutPanels } from '@/providers/LayoutPanelsProvider';
import { useHarnessOverview, useHarnessSyncStatus, useIsTauri } from '@/modules/dev/hooks/useHarness';
import { ERP_MODULES } from '@/shared/config/erp-modules';

export const DEV_PROJECT_CHANGE_EVENT = 'dev:project-change';
export const DEV_SESSION_CHANGE_EVENT = 'dev:session-change';

interface NavGroup {
  title: string;
  items: { id: string; label: string; icon: string; badge?: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { id: 'chat', label: 'Chat IA & Reasoning', icon: 'psychology' },
      { id: 'projetos', label: 'Projetos & Git', icon: 'folder_open' },
      { id: 'notifications', label: 'Notificações GitHub', icon: 'notifications', badge: '25 Falhas' },
      { id: 'sessoes', label: 'Sessões & Histórico', icon: 'history' },
      { id: 'agentes', label: 'Agentes Autônomos', icon: 'smart_toy', badge: 'Active' },
      { id: 'automacoes', label: 'Automações & Workflows', icon: 'precision_manufacturing' },
    ],
  },
  {
    title: 'Capacidades',
    items: [
      { id: 'skills', label: 'Skills & Ferramentas', icon: 'extension' },
      { id: 'toolbox', label: 'Toolbox de Domínio', icon: 'handyman' },
      { id: 'memoria', label: 'Memória Semântica', icon: 'database' },
      { id: 'browser', label: 'Navegador & Scraping', icon: 'travel_explore' },
      { id: 'pdf-translator', label: 'Tradutor PDF & OCR', icon: 'picture_as_pdf', badge: 'Ollama' },
      { id: 'intelligence', label: 'Inteligência & Dossiê', icon: 'policy', badge: 'OSINT' },
    ],
  },
  {
    title: 'Engenharia & Harness',
    items: [
      { id: 'tasks', label: 'Task Supervision', icon: 'monitor_heart', badge: 'Novo' },
      { id: 'patches', label: 'Patches & Diff Viewer', icon: 'difference' },
      { id: 'contexto', label: 'Contexto & Fragmentos', icon: 'format_list_bulleted' },
      { id: 'hooks', label: 'Sistema de Hooks', icon: 'webhook' },
      { id: 'prompts', label: 'Templates de Prompts', icon: 'text_snippet' },
      { id: 'diagnostics', label: 'Diagnósticos & Performance', icon: 'monitoring' },
      { id: 'policy', label: 'Políticas de Execução', icon: 'security' },
      { id: 'files', label: 'Busca de Arquivos', icon: 'search' },
      { id: 'attribution', label: 'Atribuição Git', icon: 'commit' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'configuracoes', label: 'Configurações & Provedores', icon: 'settings' },
    ],
  },
];

export const SideNavBar: React.FC = () => {
  const { isLeftSidebarOpen, toggleLeftSidebar, activeNavTab, setActiveNavTab, toggleBottomTerminal, setCommandPaletteOpen } = useLayoutPanels();
  const { result: overview } = useHarnessOverview();
  const { result: syncResult } = useHarnessSyncStatus();
  const isTauri = useIsTauri();

  const repos = overview?.data?.repos ?? [];
  const [selectedRepo, setSelectedRepo] = useState<string>(repos[0]?.name || 'desktop');

  const handleSelectTab = (tabId: string) => {
    setActiveNavTab(tabId);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tabId);
      window.history.replaceState(null, '', `?${params.toString()}`);
      window.dispatchEvent(new CustomEvent('dev:tab-change', { detail: tabId }));
    }
  };

  const handleRepoChange = (repoPathOrName: string) => {
    setSelectedRepo(repoPathOrName);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('project', repoPathOrName);
      window.history.replaceState(null, '', `?${params.toString()}`);
      window.dispatchEvent(new CustomEvent(DEV_PROJECT_CHANGE_EVENT, { detail: repoPathOrName }));
    }
  };

  return (
    <aside
      className={`h-screen bg-[#0d0f12] text-zinc-300 border-r border-white/10 flex flex-col shrink-0 select-none transition-all duration-200 z-30 font-sans ${
        isLeftSidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0d0f12]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
            CK
          </div>
          {isLeftSidebarOpen && (
            <div className="min-w-0">
              <div className="font-bold text-xs text-white tracking-wide truncate">ChronoKairo</div>
              <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                <span>Desktop v1.0</span>
                {isTauri && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleLeftSidebar}
          title={isLeftSidebarOpen ? 'Recolher menu lateral (Ctrl+B)' : 'Expandir menu lateral (Ctrl+B)'}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isLeftSidebarOpen ? 'menu_open' : 'menu'}
          </span>
        </button>
      </div>

      {/* Workspace / Project Quick Switcher */}
      {isLeftSidebarOpen ? (
        <div className="p-3 border-b border-white/5 bg-white/[0.02]">
          <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5 px-1 font-mono tracking-wider">
            Workspace Ativo
          </div>
          <select
            value={selectedRepo}
            onChange={(e) => handleRepoChange(e.target.value)}
            className="w-full bg-[#16181d] border border-white/10 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            {repos.map((r) => (
              <option key={r.path} value={r.name}>
                {r.name} ({r.branch || 'main'})
              </option>
            ))}
            {repos.length === 0 && <option value="desktop">desktop (main)</option>}
          </select>
        </div>
      ) : (
        <div className="p-2 border-b border-white/5 flex justify-center">
          <div
            title={`Workspace: ${selectedRepo}`}
            className="w-8 h-8 rounded-lg bg-[#16181d] border border-white/10 flex items-center justify-center text-teal-400 font-mono text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">folder</span>
          </div>
        </div>
      )}

      {/* Navigation Group List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {isLeftSidebarOpen && (
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1 font-mono">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = activeNavTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  title={!isLeftSidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold shadow-2xs'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] shrink-0 ${
                      isActive ? 'text-teal-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {isLeftSidebarOpen && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Quick Actions */}
      <div className="p-2.5 border-t border-white/10 bg-[#0d0f12] space-y-1.5 shrink-0">
        {/* Terminal Toggle Button */}
        <button
          onClick={toggleBottomTerminal}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-mono cursor-pointer"
          title="Alternar Terminal Embutido (Ctrl+`)"
        >
          <span className="material-symbols-outlined text-[16px] text-teal-400 shrink-0">terminal</span>
          {isLeftSidebarOpen && <span className="truncate">Terminal (Ctrl+`)</span>}
        </button>

        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-mono cursor-pointer"
          title="Abrir Command Palette (Ctrl+K)"
        >
          <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0">keyboard_command_key</span>
          {isLeftSidebarOpen && <span className="truncate">Comandos (Ctrl+K)</span>}
        </button>

        {/* P2P Sync Status */}
        {isLeftSidebarOpen && (
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Local Sidecar</span>
            </div>
            <span>{syncResult?.data?.peers_online ?? 1} peer</span>
          </div>
        )}
      </div>
    </aside>
  );
};
