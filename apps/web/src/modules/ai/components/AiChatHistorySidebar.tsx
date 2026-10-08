"use client";

import React, { useState, useMemo } from 'react';

export interface ChatHistoryItem {
  id: string | number;
  title: string;
  updatedAt: string | Date;
  messageCount?: number;
  context?: string;
  model?: string;
  isLocal?: boolean;
}

interface AiChatHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: ChatHistoryItem[];
  activeConversationId: string | number | null;
  onSelectConversation: (id: string | number) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: string | number) => void;
  onRenameConversation?: (id: string | number, newTitle: string) => void;
  onClearAllConversations?: () => void;
  isLoading?: boolean;
}

const CTX_ICONS: Record<string, string> = {
  financeiro: 'payments',
  crm: 'group',
  projetos: 'task_alt',
  fiscal: 'receipt_long',
  contratos: 'history_edu',
  rh: 'badge',
  geral: 'chat_bubble',
};

function detectContext(summary: string): string {
  const lower = summary.toLowerCase();
  if (/financeiro|caixa|faturamento|conta|boleto|nf|receita|despesa/.test(lower)) return 'financeiro';
  if (/crm|lead|cliente|funil|proposta|venda/.test(lower)) return 'crm';
  if (/projeto|sprint|tarefa|kanban|backlog/.test(lower)) return 'projetos';
  if (/fiscal|sped|nfe|cfop|ncm|tribut/.test(lower)) return 'fiscal';
  if (/contrato|aditivo|cláusula|juridico/.test(lower)) return 'contratos';
  if (/rh|funcionário|folha|colaborador/.test(lower)) return 'rh';
  return 'geral';
}

function getDateGroup(dateInput: string | Date): 'Hoje' | 'Ontem' | 'Últimos 7 dias' | 'Últimos 30 dias' | 'Mais antigas' {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Mais antigas';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOf7Days = startOfToday - 7 * 86400000;
  const startOf30Days = startOfToday - 30 * 86400000;
  const itemTime = date.getTime();

  if (itemTime >= startOfToday) return 'Hoje';
  if (itemTime >= startOfYesterday) return 'Ontem';
  if (itemTime >= startOf7Days) return 'Últimos 7 dias';
  if (itemTime >= startOf30Days) return 'Últimos 30 dias';
  return 'Mais antigas';
}

function formatItemTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export const AiChatHistorySidebar: React.FC<AiChatHistorySidebarProps> = ({
  isOpen,
  onToggle,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onClearAllConversations,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  const groupedConversations = useMemo(() => {
    const groups: Record<string, ChatHistoryItem[]> = {
      'Hoje': [],
      'Ontem': [],
      'Últimos 7 dias': [],
      'Últimos 30 dias': [],
      'Mais antigas': [],
    };

    filteredConversations.forEach((item) => {
      const groupKey = getDateGroup(item.updatedAt);
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredConversations]);

  const handleStartRename = (e: React.MouseEvent, item: ChatHistoryItem) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditingTitle(item.title);
  };

  const handleSaveRename = (id: string | number) => {
    if (editingTitle.trim() && onRenameConversation) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDownRename = (e: React.KeyboardEvent, id: string | number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      onDeleteConversation?.(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId((curr) => (curr === id ? null : curr));
      }, 3000);
    }
  };

  if (!isOpen) {
    return null;
  }

  const groupOrder: Array<keyof typeof groupedConversations> = [
    'Hoje',
    'Ontem',
    'Últimos 7 dias',
    'Últimos 30 dias',
    'Mais antigas',
  ];

  return (
    <aside
      className="w-72 sm:w-80 h-full bg-surface/95 border-r border-outline-variant/60 flex flex-col shrink-0 select-none z-20 transition-all duration-200"
      aria-label="Histórico de conversas da IA"
    >
      {/* Top Header */}
      <div className="p-3.5 border-b border-outline-variant/50 flex flex-col gap-3 shrink-0 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </div>
            <h2 className="font-semibold text-sm text-on-surface">Histórico</h2>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
              {conversations.length}
            </span>
          </div>

          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Ocultar barra de histórico"
            aria-label="Ocultar histórico"
          >
            <span className="material-symbols-outlined text-[18px]">dock_to_left</span>
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewConversation}
          className="w-full h-9 px-3 bg-primary text-on-primary hover:bg-primary/90 font-label-md text-xs font-semibold rounded-xl flex items-center justify-between transition-all shadow-xs group"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform">add</span>
            <span>Nova Conversa</span>
          </span>
          <span className="text-[10px] font-mono opacity-70 bg-on-primary/15 px-1.5 py-0.5 rounded">Ctrl+N</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversas…"
            className="w-full pl-8 pr-7 h-8 text-xs bg-surface-container-low/70 border border-outline-variant/50 rounded-lg text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary focus:bg-surface transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
        {isLoading && conversations.length === 0 && (
          <div className="p-4 flex flex-col items-center justify-center text-center gap-2 text-on-surface-variant animate-pulse">
            <span className="material-symbols-outlined text-[24px]">sync</span>
            <p className="text-xs">Carregando histórico…</p>
          </div>
        )}

        {!isLoading && filteredConversations.length === 0 && (
          <div className="p-6 flex flex-col items-center justify-center text-center gap-2 text-on-surface-variant">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] opacity-60">forum</span>
            </div>
            <p className="text-xs font-medium text-on-surface">
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
            <p className="text-[11px] text-on-surface-variant/80">
              {search ? 'Tente outros termos de busca' : 'Inicie um novo chat com o assistente.'}
            </p>
          </div>
        )}

        {groupOrder.map((groupName) => {
          const items = groupedConversations[groupName];
          if (!items || items.length === 0) return null;

          return (
            <div key={groupName} className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/80 flex items-center justify-between">
                <span>{groupName}</span>
                <span className="font-mono text-[9px]">{items.length}</span>
              </div>

              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = String(item.id) === String(activeConversationId);
                  const ctx = item.context || detectContext(item.title);
                  const iconName = CTX_ICONS[ctx] || 'chat_bubble';
                  const isEditing = editingId === item.id;
                  const isDeleting = confirmDeleteId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isEditing && onSelectConversation(item.id)}
                      className={`group relative w-full p-2 rounded-xl text-left transition-all flex items-start gap-2.5 cursor-pointer border ${
                        isActive
                          ? 'bg-surface-container border-primary/30 shadow-2xs text-on-surface'
                          : 'border-transparent hover:bg-surface-container-low/80 hover:border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-secondary rounded-r" />
                      )}

                      {/* Context Icon */}
                      <span
                        className={`material-symbols-outlined text-[16px] shrink-0 mt-0.5 ${
                          isActive ? 'text-secondary font-semibold' : 'text-on-surface-variant/70 group-hover:text-primary'
                        }`}
                      >
                        {iconName}
                      </span>

                      {/* Content / Title */}
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => handleKeyDownRename(e, item.id)}
                              onBlur={() => handleSaveRename(item.id)}
                              autoFocus
                              className="w-full text-xs bg-surface border border-secondary rounded px-1.5 py-0.5 text-on-surface focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveRename(item.id)}
                              className="p-0.5 text-secondary hover:text-secondary/80"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <p
                              className={`text-xs font-medium truncate leading-snug ${
                                isActive ? 'text-on-surface font-semibold' : 'text-on-surface'
                              }`}
                              title={item.title}
                            >
                              {item.title || 'Conversa sem título'}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70 mt-1 font-mono">
                          <span className="capitalize">{ctx}</span>
                          <div className="flex items-center gap-1.5">
                            {item.messageCount !== undefined && (
                              <span>{item.messageCount} msg{item.messageCount === 1 ? '' : 's'}</span>
                            )}
                            <span>{formatItemTime(item.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons on Hover */}
                      {!isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                          {onRenameConversation && (
                            <button
                              onClick={(e) => handleStartRename(e, item)}
                              className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface transition-colors"
                              title="Renomear conversa"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                          )}
                          {onDeleteConversation && (
                            <button
                              onClick={(e) => handleDeleteClick(e, item.id)}
                              className={`p-1 rounded-md transition-colors ${
                                isDeleting
                                  ? 'bg-error text-on-error'
                                  : 'text-on-surface-variant hover:text-error hover:bg-error-container/20'
                              }`}
                              title={isDeleting ? 'Clique para confirmar exclusão' : 'Excluir conversa'}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isDeleting ? 'check' : 'delete'}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-2.5 border-t border-outline-variant/50 bg-surface flex items-center justify-between text-xs text-on-surface-variant shrink-0">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
          <span>Sincronizado</span>
        </div>

        {conversations.length > 0 && onClearAllConversations && (
          <button
            onClick={onClearAllConversations}
            className="text-[11px] text-on-surface-variant hover:text-error transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-container"
            title="Limpar histórico completo"
          >
            <span className="material-symbols-outlined text-[13px]">delete_sweep</span>
            <span>Limpar</span>
          </button>
        )}
      </div>
    </aside>
  );
};
