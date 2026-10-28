"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getActiveModuleFromPathname } from '@/shared/config/erp-modules';
import { useOrganizationContext } from '@/providers/OrganizationProvider';
import { useLayoutPanels } from '@/providers/LayoutPanelsProvider';
import { useAiChat } from '@/modules/ai/hooks/useAiChat';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ContextAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  module: string;
  prompt: string;
}

const MODULE_QUICK_ACTIONS: Record<string, ContextAction[]> = {
  financeiro: [
    {
      id: 'fin-fluxo',
      title: 'Analisar Fluxo de Caixa do Mês',
      subtitle: 'Projeta saldo dos próximos 30 dias e alerta sobre descasamentos',
      icon: 'trending_up',
      module: 'Financeiro',
      prompt: 'Analise o fluxo de caixa atual da organização, projete as entradas e saídas para os próximos 30 dias e liste alertas de liquidez.',
    },
    {
      id: 'fin-dre',
      title: 'Gerar Resumo DRE e Margens',
      subtitle: 'Consolida receitas, deduções e margem operacional',
      icon: 'table_chart',
      module: 'Financeiro',
      prompt: 'Gere um resumo estruturado do DRE deste mês com receitas líquidas, custos operacionais e margem EBITDA.',
    },
    {
      id: 'fin-inadimplencia',
      title: 'Auditar Contas a Receber Vencidas',
      subtitle: 'Filtra títulos em atraso e sugere régua de cobrança',
      icon: 'warning',
      module: 'Financeiro',
      prompt: 'Identifique os principais títulos vencidos a receber e recomende ações de cobrança imediata.',
    },
  ],
  crm: [
    {
      id: 'crm-pipeline',
      title: 'Diagnosticar Funil de Oportunidades',
      subtitle: 'Analisa taxas de conversão e gargalos nas etapas do pipeline',
      icon: 'filter_alt',
      module: 'CRM',
      prompt: 'Analise o funil de vendas atual no CRM, destacando oportunidades estagnadas há mais de 15 dias.',
    },
    {
      id: 'crm-proposta',
      title: 'Minutar Proposta Comercial para Cliente',
      subtitle: 'Cria estrutura de proposta com escopo e valores',
      icon: 'description',
      module: 'CRM',
      prompt: 'Estruture uma minuta de proposta comercial padrão para prestação de serviços no ERP.',
    },
  ],
  billing: [
    {
      id: 'bill-recorrencia',
      title: 'Previsão de Faturamento Recorrente (MRR)',
      subtitle: 'Calcula MRR esperado e renovações do mês',
      icon: 'receipt_long',
      module: 'Billing',
      prompt: 'Calcule a receita recorrente (MRR) projetada para este ciclo de faturamento e liste contratos a renovar.',
    },
  ],
  contratos: [
    {
      id: 'cont-vigencia',
      title: 'Auditar Vencimentos de Contratos',
      subtitle: 'Verifica contratos com reajuste pelo IPCA/IGP-M',
      icon: 'history_edu',
      module: 'Contratos',
      prompt: 'Liste contratos próximos ao término de vigência e identifique cláusulas de reajuste automático de índice.',
    },
  ],
  projects: [
    {
      id: 'proj-sprints',
      title: 'Relatório de Progresso da Sprint',
      subtitle: 'Calcula burndown e tempo lançado em timesheets',
      icon: 'sprint',
      module: 'Projetos',
      prompt: 'Resuma o progresso da sprint ativa, horas registradas no timesheet e tarefas em atraso.',
    },
  ],
  bi: [
    {
      id: 'bi-kpis',
      title: 'Consolidar KPIs Executivos do ERP',
      subtitle: 'Visão unificada de Receita, CAC, LTV e Churn',
      icon: 'analytics',
      module: 'BI & Métricas',
      prompt: 'Gere um relatório executivo com os principais indicadores de desempenho (KPIs) da organização.',
    },
  ],
  fiscal: [
    {
      id: 'fisc-tributos',
      title: 'Conferência de Obrigações e DAS/ICMS',
      subtitle: 'Apura impostos do período e vencimentos fiscais',
      icon: 'account_balance',
      module: 'Fiscal',
      prompt: 'Revise o calendário de obrigações tributárias e apuração de notas fiscais emitidas no período.',
    },
  ],
  ativos: [
    {
      id: 'atv-licencas',
      title: 'Inventário de Licenças e Equipamentos',
      subtitle: 'Auditoria de software, hardware e termos de custódia',
      icon: 'inventory_2',
      module: 'Ativos',
      prompt: 'Liste os equipamentos alocados e licenças de software com vencimento nos próximos 60 dias.',
    },
  ],
};

const DEFAULT_GLOBAL_ACTIONS: ContextAction[] = [
  {
    id: 'global-gh-notifications',
    title: 'Notificações do GitHub & Triagem de CI',
    subtitle: 'Exibe workflows com falhas, diagnósticos de IA e comandos de correção',
    icon: 'notifications_active',
    module: 'GitHub CI/CD',
    prompt: 'Analise as notificações recentes do GitHub e me apresente o plano consolidado de correção das pipelines com falha.',
  },
  {
    id: 'global-assistant',
    title: 'Consultar Assistente Geral Chronokairo IA',
    subtitle: 'Pergunte qualquer dúvida sobre processos, relatórios ou dados do ERP',
    icon: 'psychology',
    module: 'Chronokairo IA',
    prompt: 'Olá Chronokairo IA! Como você pode me ajudar a gerenciar a organização hoje?',
  },
  {
    id: 'global-browser',
    title: 'Pesquisa e Análise de Mercado',
    subtitle: 'Pesquisar informações públicas, CNPJs ou notícias de mercado',
    icon: 'travel_explore',
    module: 'Pesquisa Web',
    prompt: 'Faça um levantamento das tendências de mercado para ERPs SaaS B2B no Brasil.',
  },
];

export const AiCommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const activeModule = getActiveModuleFromPathname(pathname);
  const { currentOrganization } = useOrganizationContext();

  const {
    messages,
    loading: isAiLoading,
    streaming: isAiStreaming,
    error: aiError,
    sendMessage: sendAiMessage,
    clearError,
  } = useAiChat();

  // Shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened & scroll to bottom on message
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiStreaming]);

  // Contextual actions based on current module
  const currentModuleKey = activeModule.id.toLowerCase();
  const moduleActions = MODULE_QUICK_ACTIONS[currentModuleKey] || [];
  const allAvailableActions = useMemo(() => {
    return [...moduleActions, ...DEFAULT_GLOBAL_ACTIONS];
  }, [moduleActions]);

  const handleSendQuery = async (promptToSend: string) => {
    if (!promptToSend.trim() || isAiLoading) return;
    setInputQuery('');
    await sendAiMessage(promptToSend);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      handleSendQuery(inputQuery);
    }
  };

  const handleOpenFullChat = () => {
    setIsOpen(false);
    router.push('/ai');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-20 px-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => setIsOpen(false)}
      />

      {/* Conversational Spotlight Window */}
      <div className="relative w-full max-w-3xl bg-surface border border-outline-variant/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150 text-primary font-sans">
        {/* Search & Prompt Composer Header */}
        <form onSubmit={handleSubmit} className="flex items-center px-4 py-3.5 border-b border-outline-variant/50 gap-3 bg-surface shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-[18px]">
              {isAiStreaming || isAiLoading ? 'autorenew' : 'psychology'}
            </span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              messages.length === 0
                ? `Pergunte à IA no contexto de ${activeModule.name}…`
                : `Faça uma pergunta de acompanhamento ou comando…`
            }
            disabled={isAiLoading && !isAiStreaming}
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-on-surface-variant/60 focus:outline-none font-sans"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {inputQuery.trim() && (
              <button
                type="submit"
                className="h-7 px-3 bg-primary text-on-primary rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-primary/90 transition-colors shadow-2xs"
              >
                <span>Enviar</span>
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              </button>
            )}

            <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-surface-container border border-outline-variant/50 text-on-surface-variant">
              ESC
            </kbd>
          </div>
        </form>

        {/* Current Screen Context Bar */}
        <div className="px-4 py-2 bg-surface-container-low/60 border-b border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant font-mono shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[15px] text-secondary shrink-0">explore</span>
            <span className="truncate">Contexto: <strong className="text-primary">{activeModule.name}</strong></span>
            <span>•</span>
            <span className="truncate">{currentOrganization?.name || 'Chronokairo ERP'}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenFullChat}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Abrir no Chat Completo</span>
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content Area: Suggestions when empty, Messages when chatting */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 no-scrollbar">
          {messages.length === 0 ? (
            <div className="space-y-4 py-2">
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-mono">
                Ações Rápidas Sugeridas para {activeModule.name}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {allAvailableActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleSendQuery(action.prompt)}
                    className="p-3 text-left rounded-xl border border-outline-variant/50 bg-surface-container-low/50 hover:bg-surface-container hover:border-primary/40 transition-all flex items-start gap-3 group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-[17px]">{action.icon}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-primary truncate flex items-center justify-between">
                        <span>{action.title}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 leading-snug">
                        {action.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-primary text-secondary-fixed flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <span className="material-symbols-outlined text-sm">smart_toy</span>
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs ${
                        isUser
                          ? 'bg-primary text-on-primary rounded-tr-xs text-xs md:text-sm whitespace-pre-wrap leading-relaxed'
                          : 'bg-surface border border-outline-variant/50 rounded-tl-xs text-on-surface'
                      }`}
                    >
                      {isUser ? (
                        msg.content
                      ) : (
                        <MarkdownRenderer
                          content={msg.content}
                          isStreaming={msg.isStreaming && isAiStreaming}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {aiError && (
                <div className="p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{aiError}</span>
                  </div>
                  <button
                    onClick={clearError}
                    className="text-[11px] font-bold underline hover:opacity-80"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info & quick shortcuts */}
        <div className="px-4 py-2.5 bg-surface-container border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant font-mono shrink-0">
          <div className="flex items-center gap-3">
            <span>↵ Enviar</span>
            <span>ESC Fechar</span>
            <span>Ctrl+K Alternar</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenFullChat}
              className="text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>Ir para Chat Completo (/ai)</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
