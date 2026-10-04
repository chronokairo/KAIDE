'use client';

import React from 'react';
import { ThemeToggle, Button } from '@chronokairo/platform/ui';
import { 
  Sparkles, 
  PanelLeft, 
  PanelRight, 
  Plus, 
  FileText,
  Activity
} from 'lucide-react';

interface AppBarProps {
  leftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  rightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  onNewChat: () => void;
  hasMessages: boolean;
  onExportPdf?: () => void;
  activeTabTitle?: string;
}

export function AppBar({
  leftSidebarOpen,
  onToggleLeftSidebar,
  rightSidebarOpen,
  onToggleRightSidebar,
  onNewChat,
  hasMessages,
  onExportPdf,
  activeTabTitle = 'Chat',
}: AppBarProps) {
  return (
    <header className="h-14 px-4 flex items-center justify-between border-b border-outline-variant bg-surface-container-low/60 backdrop-blur-md select-none shrink-0 z-10">
      {/* Lado Esquerdo: Toggle da Sidebar e Identidade */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleLeftSidebar}
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          title={leftSidebarOpen ? "Recolher menu lateral" : "Expandir menu lateral"}
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest border border-outline flex items-center justify-center text-primary shadow-sm">
            <Sparkles className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-on-surface">Chronokairo AI Enterprise</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-secondary-fixed/20 text-secondary border border-secondary/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-none hidden sm:block">
              {activeTabTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Centro: Contexto / Status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/60 text-xs text-on-surface-variant">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium text-on-surface">Pronto</span>
        <span className="text-outline-variant">|</span>
        <span>RAG & Coding Agent</span>
      </div>

      {/* Lado Direito: Ações globais, ThemeToggle e Inspetor */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Nova Conversa"
        >
          <Plus className="w-5 h-5" />
        </button>

        {hasMessages && onExportPdf && (
          <Button
            onClick={onExportPdf}
            variant="secondary"
            size="sm"
            icon={<FileText className="w-3.5 h-3.5" />}
          >
            PDF
          </Button>
        )}

        {/* Alternador oficial de tema da plataforma ChronoKairo */}
        <ThemeToggle />

        {/* Botão de abrir/fechar o inspetor direito (fontes/ferramentas) */}
        <button
          onClick={onToggleRightSidebar}
          className={`p-1.5 rounded-lg transition-colors ${
            rightSidebarOpen 
              ? 'bg-surface-container-high text-on-surface' 
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
          title={rightSidebarOpen ? "Fechar painel de contexto" : "Abrir painel de contexto"}
        >
          <PanelRight className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
