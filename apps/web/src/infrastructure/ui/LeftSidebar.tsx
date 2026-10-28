'use client';

import React from 'react';
import { Conversation } from '@/domain/chat';
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Bot, 
  Settings, 
  Trash2, 
  Layers,
  ChevronLeft
} from 'lucide-react';

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'chat' | 'search' | 'agentes' | 'settings';
  onTabChange: (tab: 'chat' | 'search' | 'agentes' | 'settings') => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function LeftSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: LeftSidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-72 border-r border-outline-variant bg-surface-container-low/80 flex flex-col h-full shrink-0 select-none z-20">
      {/* Botão Nova Conversa e Vistas Rápidas */}
      <div className="p-3 space-y-2 border-b border-outline-variant/60">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium text-xs border border-outline transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 text-secondary" />
          <span>Nova Conversa</span>
        </button>

        {/* Abas de Navegação */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-surface-container rounded-lg border border-outline-variant/40">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-md text-[10px] font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-surface-container-highest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Chat Principal"
          >
            <MessageSquare className="w-3.5 h-3.5 mb-0.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onTabChange('search')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-md text-[10px] font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-surface-container-highest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Busca Semântica"
          >
            <Search className="w-3.5 h-3.5 mb-0.5" />
            <span>Busca</span>
          </button>

          <button
            onClick={() => onTabChange('agentes')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-md text-[10px] font-medium transition-colors ${
              activeTab === 'agentes'
                ? 'bg-surface-container-highest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Agentes & Automações"
          >
            <Bot className="w-3.5 h-3.5 mb-0.5" />
            <span>Agentes</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-md text-[10px] font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-surface-container-highest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Configurações"
          >
            <Settings className="w-3.5 h-3.5 mb-0.5" />
            <span>Config</span>
          </button>
        </div>
      </div>

      {/* Seção de Histórico de Conversas */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1.5 text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">
          Histórico
        </div>

        {conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-on-surface-variant/60">
            Nenhuma conversa recente
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-surface-container-highest text-primary font-medium border border-outline'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-secondary' : 'text-on-surface-variant'}`} />
                  <span className="truncate">{conv.title || 'Conversa sem título'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error-container hover:text-error text-on-surface-variant transition-opacity"
                  title="Deletar conversa"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-3 border-t border-outline-variant/60 flex items-center justify-between text-[11px] text-on-surface-variant bg-surface-container-low">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-secondary" />
          <span>Chronokairo Suite</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
          title="Recolher"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
