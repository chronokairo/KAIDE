"use client";

import React from 'react';
import { useLayoutPanels } from '@/providers/LayoutPanelsProvider';

export const BottomNavBar: React.FC = () => {
  const { activeNavTab, setActiveNavTab, toggleBottomTerminal, setCommandPaletteOpen } = useLayoutPanels();

  const mainTabs = [
    { id: 'chat', label: 'Chat', icon: 'psychology' },
    { id: 'projetos', label: 'Projetos', icon: 'folder_open' },
    { id: 'agentes', label: 'Agentes', icon: 'smart_toy' },
    { id: 'skills', label: 'Skills', icon: 'extension' },
    { id: 'configuracoes', label: 'Ajustes', icon: 'settings' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0d0f12] border-t border-white/10 flex items-center justify-around px-2 z-30 font-sans">
      {mainTabs.map((tab) => {
        const isActive = activeNavTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveNavTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
              isActive ? 'text-teal-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
            <span className="text-[10px]">{tab.label}</span>
          </button>
        );
      })}
      <button
        onClick={toggleBottomTerminal}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-zinc-500 hover:text-zinc-300"
      >
        <span className="material-symbols-outlined text-[20px]">terminal</span>
        <span className="text-[10px]">Term</span>
      </button>
    </nav>
  );
};
