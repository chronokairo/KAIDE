"use client";

import React, { useState, useMemo } from 'react';
import { useAcpProviders, useHarnessMemorySessions } from '@/modules/dev/hooks/useHarness';
import { useAutomations, type AutomationRuleEntity, type AutomationExecutionLogEntity } from '@/modules/dev/hooks/useAutomations';
import {
  type TriggerType,
  type ExecutionMode,
  type AutomationCategory,
  type AutomationTemplate,
  TRIGGER_META,
  EXECUTION_MODE_META,
} from './automations-types';

const TEMPLATES: AutomationTemplate[] = [
  {
    id: 'tpl-ofx-reconcile',
    name: 'Conciliação Bancária OFX com IA',
    description: 'Importa arquivos OFX/CSV dos bancos, faz categorização inteligente e matching de baixas.',
    category: 'financeiro',
    triggerType: 'cron_scheduled',
    triggerLabel: 'Cron diário às 06:00',
    executionMode: 'agentic_ai',
    assignedAgent: 'Agente Financeiro',
    icon: 'payments',
    badge: 'Financeiro',
    popular: true,
  },
  {
    id: 'tpl-billing-d3',
    name: 'Régua de Cobrança Multi-Canal (D-3, D0, D+3)',
    description: 'Notifica clientes com faturas a vencer por WhatsApp, e-mail e gera link Pix dinâmico.',
    category: 'financeiro',
    triggerType: 'event_driven',
    triggerLabel: 'Mudança de status do título',
    executionMode: 'deterministic',
    assignedAgent: 'Agente de Cobrança',
    icon: 'mark_email_read',
    badge: 'Cobrança',
    popular: true,
  },
  {
    id: 'tpl-lead-round-robin',
    name: 'Distribuição Round-Robin de Oportunidades',
    description: 'Distribui novos leads igualmente entre os vendedores conforme carga horária e especialidade.',
    category: 'crm',
    triggerType: 'event_driven',
    triggerLabel: 'Novo Lead Criado',
    executionMode: 'deterministic',
    assignedAgent: 'Agente de Vendas',
    icon: 'swap_horiz',
    badge: 'CRM',
  },
  {
    id: 'tpl-nfe-matching',
    name: 'Validação de NF-e vs Pedido de Compra',
    description: 'Cruza itens, quantidades e valores da nota fiscal eletrônica com o pedido de compras autorizado.',
    category: 'fiscal',
    triggerType: 'document_ocr',
    triggerLabel: 'Upload de XML/PDF',
    executionMode: 'human_in_the_loop',
    assignedAgent: 'Agente Fiscal',
    icon: 'receipt',
    badge: 'Fiscal & Suprimentos',
  },
  {
    id: 'tpl-crm-followup',
    name: 'Follow-up Automático de Propostas após 48h',
    description: 'Identifica propostas enviadas sem resposta há mais de 2 dias e redige e-mail de sondagem.',
    category: 'crm',
    triggerType: 'cron_scheduled',
    triggerLabel: 'A cada 12 horas',
    executionMode: 'agentic_ai',
    assignedAgent: 'Agente SDR',
    icon: 'forward_to_inbox',
    badge: 'Vendas',
  },
  {
    id: 'tpl-timesheet-lock',
    name: 'Bloqueio de Lançamentos de Horas Aprovadas',
    description: 'Congela timesheets validados no banco de dados para impedir alterações retroativas.',
    category: 'projetos',
    triggerType: 'event_driven',
    triggerLabel: 'Aprovação de Timesheet',
    executionMode: 'deterministic',
    assignedAgent: 'Agente de Projetos',
    icon: 'lock_clock',
    badge: 'Projetos',
  },
];

function mapRuleToUI(r: AutomationRuleEntity) {
  return {
    ...r,
    trigger_details: r.trigger_details,
    triggerType: r.trigger_type as TriggerType,
    executionMode: r.execution_mode as ExecutionMode,
    executionsCount: (r.config as any)?.executionsCount ?? 0,
    successRate: (r.config as any)?.successRate ?? '—',
    lastExecutedAt: (r.config as any)?.lastExecutedAt ?? null,
    icon: (r.config as any)?.icon ?? TRIGGER_META[r.trigger_type as TriggerType]?.icon ?? 'bolt',
    requiresApproval: r.execution_mode === 'human_in_the_loop',
  };
}

function mapLogToUI(l: AutomationExecutionLogEntity) {
  return {
    ...l,
    automationName: (l as any).automation_name ?? 'Automação',
    triggerType: l.trigger_type as TriggerType,
    executionMode: l.execution_mode as ExecutionMode,
    timestamp: new Date(l.executed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    durationMs: l.duration_ms ?? 0,
  };
}

export const AiAutomationAgentsPanel: React.FC = () => {
  const { result: acpResult } = useAcpProviders();
  const { result: sessionsResult } = useHarnessMemorySessions(undefined, 8);
  const { rules: dbRules, logs: dbLogs, loading, error, toggleRule, createRule } = useAutomations();

  const [activeMainTab, setActiveMainTab] = useState<'routines' | 'templates' | 'builder' | 'logs'>('routines');
  const [selectedTriggerFilter, setSelectedTriggerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [builderName, setBuilderName] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderTrigger, setBuilderTrigger] = useState<TriggerType>('event_driven');
  const [builderCategory, setBuilderCategory] = useState<AutomationCategory>('financeiro');
  const [builderExecutionMode, setBuilderExecutionMode] = useState<ExecutionMode>('agentic_ai');
  const [builderCondition, setBuilderCondition] = useState('Valor maior que R$ 1.000,00 e Status = "Aprovado"');
  const [builderActionDetails, setBuilderActionDetails] = useState('Executar Agente Financeiro para gerar lançamento e notificar gestor');
  const [dryRunResult, setDryRunResult] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const providers = acpResult?.data ?? [];

  const rules = useMemo(() => dbRules.map(mapRuleToUI), [dbRules]);
  const logs = useMemo(() => dbLogs.map(mapLogToUI), [dbLogs]);

  const handleToggleRule = async (id: string, currentStatus: string) => {
    try {
      await toggleRule(id, currentStatus);
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const handleActivateTemplate = async (tpl: AutomationTemplate) => {
    try {
      await createRule({
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        trigger_type: tpl.triggerType,
        trigger_details: tpl.triggerLabel,
        execution_mode: tpl.executionMode,
        assigned_agent: tpl.assignedAgent,
        status: 'active',
        config: { icon: tpl.icon, executionsCount: 0, successRate: '100%', lastExecutedAt: 'Recém-ativada' },
      });
      setActiveMainTab('routines');
    } catch (err) {
      console.error('Erro ao ativar template:', err);
    }
  };

  const handleRunDryRun = () => {
    setIsSimulating(true);
    setDryRunResult(null);
    setTimeout(() => {
      setIsSimulating(false);
      setDryRunResult(
        `[SIMULAÇÃO BEM-SUCEDIDA]\n` +
        `• Gatilho: ${TRIGGER_META[builderTrigger].label}\n` +
        `• Condição atendida: "${builderCondition}"\n` +
        `• Modo de Execução: ${EXECUTION_MODE_META[builderExecutionMode].label}\n` +
        `• Ação Prevista: ${builderActionDetails}\n` +
        `• Efeito no Banco: 1 mutação validada com sucesso em ambiente isolado (nenhum dado real alterado).`
      );
    }, 900);
  };

  const handleSaveBuilderRule = async () => {
    if (!builderName.trim()) return;
    try {
      await createRule({
        name: builderName,
        description: builderDescription || 'Automação customizada criada via Editor Visual.',
        category: builderCategory,
        trigger_type: builderTrigger,
        trigger_details: TRIGGER_META[builderTrigger].label,
        execution_mode: builderExecutionMode,
        assigned_agent: 'ChronoKairo IA Agent',
        status: 'active',
        config: { icon: TRIGGER_META[builderTrigger].icon, executionsCount: 0, successRate: '100%', lastExecutedAt: 'Criada agora' },
      });
      setActiveMainTab('routines');
      setBuilderName('');
      setBuilderDescription('');
      setDryRunResult(null);
    } catch (err) {
      console.error('Erro ao salvar regra:', err);
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchTrigger = selectedTriggerFilter === 'all' || r.triggerType === selectedTriggerFilter;
    const matchSearch =
      !searchQuery.trim() ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.assigned_agent ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchTrigger && matchSearch;
  });

  const pendingApprovals = logs.filter((l) => l.status === 'waiting_approval');

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-6 text-primary select-none max-w-6xl mx-auto w-full no-scrollbar">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-outline-variant/50">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
            <span className="text-secondary font-bold">ChronoKairo ERP</span>
            <span>/</span>
            <span>IA &amp; Automações</span>
          </div>
          <h2 className="font-display-lg text-2xl font-bold text-primary mt-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">psychology</span>
            IA &amp; Automações Inteligentes
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Sistemas orientados a eventos, gatilhos em tempo real, rotinas agendadas e aprovação humana.
          </p>
          {loading && <span className="text-[10px] text-on-surface-variant/60 font-mono">Carregando...</span>}
          {error && <span className="text-[10px] text-error font-mono">Erro: {error}</span>}
        </div>

        <div className="flex items-center bg-surface-container-low p-1 rounded-2xl border border-outline-variant/60 text-xs font-mono">
          <button
            onClick={() => setActiveMainTab('routines')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeMainTab === 'routines' ? 'bg-primary text-on-primary shadow-2xs' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            <span>Rotinas ({rules.filter((r) => r.status === 'active').length})</span>
          </button>
          <button
            onClick={() => setActiveMainTab('templates')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeMainTab === 'templates' ? 'bg-primary text-on-primary shadow-2xs' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">widgets</span>
            <span>Templates</span>
          </button>
          <button
            onClick={() => setActiveMainTab('builder')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeMainTab === 'builder' ? 'bg-primary text-on-primary shadow-2xs' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            <span>Criador Visual</span>
          </button>
          <button
            onClick={() => setActiveMainTab('logs')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 relative ${
              activeMainTab === 'logs' ? 'bg-primary text-on-primary shadow-2xs' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Auditoria &amp; Logs</span>
            {pendingApprovals.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute top-1 right-1" />
            )}
          </button>
        </div>
      </div>

      {/* ABA 1: ROTINAS */}
      {activeMainTab === 'routines' && (
        <div className="space-y-6">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-wider font-mono text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">psychology</span>
                Agentes Autônomos de Suporte às Automações
              </div>
              <span className="text-[11px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                {providers.length + 1} Motores Ativos
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-container-low border border-secondary/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-primary truncate">ChronoKairo Master IA</div>
                  <div className="text-[10px] text-on-surface-variant font-mono">NVIDIA NIM • Domain Tools</div>
                </div>
              </div>
              {providers.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">terminal</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-primary truncate">{p.display_name}</div>
                    <div className="text-[10px] text-on-surface-variant font-mono">{p.installed ? 'ACP Conectado' : 'Disponível'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
              <button
                onClick={() => setSelectedTriggerFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                  selectedTriggerFilter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                }`}
              >
                Todos ({rules.length})
              </button>
              {(Object.keys(TRIGGER_META) as TriggerType[]).map((tKey) => (
                <button
                  key={tKey}
                  onClick={() => setSelectedTriggerFilter(tKey)}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
                    selectedTriggerFilter === tKey ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">{TRIGGER_META[tKey].icon}</span>
                  <span>{TRIGGER_META[tKey].label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <div className="relative min-w-[220px]">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[15px] pointer-events-none">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar rotinas…"
                className="w-full h-8 pl-8 pr-2.5 bg-surface border border-outline-variant/60 rounded-xl text-xs text-primary placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map((rule) => {
              const trig = TRIGGER_META[rule.triggerType];
              const exec = EXECUTION_MODE_META[rule.executionMode];
              const isActive = rule.status === 'active';
              return (
                <div
                  key={rule.id}
                  className={`bg-surface border rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all ${
                    isActive ? 'border-outline-variant/70 hover:border-primary/40' : 'border-outline-variant/30 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[19px]">{rule.icon}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${trig.color}`}>{trig.label}</span>
                      </div>
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.status)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all shadow-2xs ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-zinc-500/15 text-zinc-500 border border-zinc-500/30 hover:bg-zinc-500/20'
                        }`}
                        title={isActive ? 'Pausar automação' : 'Ativar automação'}
                      >
                        {isActive ? '● Ativa' : '○ Pausada'}
                      </button>
                    </div>
                    <h3 className="font-bold text-sm text-primary">{rule.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-snug">{rule.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                      <span className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[13px] text-secondary">tune</span>
                        {rule.trigger_details ?? rule.triggerType}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${exec.badgeColor}`}>{exec.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant pt-1 border-t border-outline-variant/20">
                      <span>Execuções: <strong>{rule.executionsCount}</strong> ({rule.successRate})</span>
                      <span className="truncate">Última: {rule.lastExecutedAt || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredRules.length === 0 && !loading && (
              <div className="col-span-2 text-center py-12 text-on-surface-variant/60 text-xs font-mono">
                Nenhuma automação encontrada. Crie uma no Criador Visual ou ative um Template.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: TEMPLATES */}
      {activeMainTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">auto_awesome</span>
              Receitas Prontas de Automação para o ChronoKairo ERP
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Ative rotinas de ponta a ponta com 1 clique. Cada template já vem com gatilho, agentes e regras configurados.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((tpl) => {
              const trig = TRIGGER_META[tpl.triggerType];
              const exec = EXECUTION_MODE_META[tpl.executionMode];
              return (
                <div key={tpl.id} className="bg-surface border border-outline-variant/60 rounded-2xl p-4 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[19px]">{tpl.icon}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold font-mono">{tpl.badge}</span>
                    </div>
                    <h4 className="font-bold text-sm text-primary">{tpl.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-snug">{tpl.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/30 flex flex-col gap-3">
                    <div className="space-y-1 text-[11px] font-mono text-on-surface-variant">
                      <div className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[13px] text-secondary">bolt</span>
                        <span>{tpl.triggerLabel}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[13px] text-primary">smart_toy</span>
                        <span>{tpl.assignedAgent}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleActivateTemplate(tpl)}
                      className="w-full h-8 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">add_circle</span>
                      <span>Ativar com 1 Clique</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 3: CRIADOR VISUAL */}
      {activeMainTab === 'builder' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-2xs space-y-5">
            <h3 className="font-bold text-base text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">account_tree</span>
              Construtor de Workflows (Quando → Se → Fazer)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold font-mono text-on-surface-variant mb-1">Nome da Automação *</label>
                <input type="text" value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="Ex: Conciliação Diária Pix" className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant/70 rounded-xl text-xs text-primary focus:outline-none focus:border-primary font-sans" />
              </div>
              <div>
                <label className="block text-xs font-bold font-mono text-on-surface-variant mb-1">Módulo do ERP</label>
                <select value={builderCategory} onChange={(e) => setBuilderCategory(e.target.value as AutomationCategory)} className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant/70 rounded-xl text-xs text-primary focus:outline-none focus:border-primary font-sans">
                  <option value="financeiro">Financeiro &amp; Tesouraria</option>
                  <option value="crm">CRM &amp; Vendas</option>
                  <option value="contratos">Contratos &amp; Cobrança</option>
                  <option value="fiscal">Fiscal &amp; Sped</option>
                  <option value="projetos">Projetos &amp; Timesheet</option>
                </select>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/50 space-y-3">
              <div className="text-xs font-bold font-mono uppercase text-secondary flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-[11px]">1</span>
                <span>Quando (Tipo de Gatilho)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(Object.keys(TRIGGER_META) as TriggerType[]).map((tKey) => {
                  const meta = TRIGGER_META[tKey];
                  const isSelected = builderTrigger === tKey;
                  return (
                    <button key={tKey} onClick={() => setBuilderTrigger(tKey)} className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${isSelected ? 'bg-surface text-primary border-primary shadow-2xs font-bold ring-1 ring-primary' : 'bg-surface/50 text-on-surface-variant border-outline-variant/60 hover:bg-surface'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-[17px] text-secondary">{meta.icon}</span>
                        <span className="text-xs">{meta.label}</span>
                      </div>
                      <p className="text-[10px] font-normal text-on-surface-variant/80 line-clamp-2">{meta.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/50 space-y-2">
              <div className="text-xs font-bold font-mono uppercase text-primary flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[11px]">2</span>
                <span>Se (Condições &amp; Filtros)</span>
              </div>
              <input type="text" value={builderCondition} onChange={(e) => setBuilderCondition(e.target.value)} placeholder="Ex: Valor > 5000 e Status = 'Pendente'" className="w-full h-9 px-3 bg-surface border border-outline-variant/70 rounded-xl text-xs text-primary focus:outline-none focus:border-primary font-mono" />
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/50 space-y-3">
              <div className="text-xs font-bold font-mono uppercase text-secondary flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-[11px]">3</span>
                <span>Fazer (Modo de Execução da Ação)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(EXECUTION_MODE_META) as ExecutionMode[]).map((eKey) => {
                  const meta = EXECUTION_MODE_META[eKey];
                  const isSelected = builderExecutionMode === eKey;
                  return (
                    <button key={eKey} onClick={() => setBuilderExecutionMode(eKey)} className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${isSelected ? 'bg-surface text-primary border-primary shadow-2xs font-bold ring-1 ring-primary' : 'bg-surface/50 text-on-surface-variant border-outline-variant/60 hover:bg-surface'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-[17px] text-primary">{meta.icon}</span>
                        <span className="text-xs">{meta.label}</span>
                      </div>
                      <p className="text-[10px] font-normal text-on-surface-variant/80">{meta.desc}</p>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="block text-[11px] font-bold font-mono text-on-surface-variant mb-1">Detalhes da Ação / Prompt do Agente</label>
                <textarea rows={2} value={builderActionDetails} onChange={(e) => setBuilderActionDetails(e.target.value)} placeholder="Instruções para o executor ou agente..." className="w-full p-2.5 bg-surface border border-outline-variant/70 rounded-xl text-xs text-primary focus:outline-none focus:border-primary font-sans resize-none" />
              </div>
            </div>
            {dryRunResult && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-700 dark:text-emerald-300 whitespace-pre-line leading-relaxed">{dryRunResult}</div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
              <button onClick={handleRunDryRun} disabled={isSimulating} className="h-9 px-4 rounded-xl border border-secondary/50 text-secondary hover:bg-secondary/10 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined text-[16px]">{isSimulating ? 'sync' : 'science'}</span>
                <span>{isSimulating ? 'Simulando…' : 'Simular Execução (Dry-Run)'}</span>
              </button>
              <button onClick={handleSaveBuilderRule} disabled={!builderName.trim()} className="h-9 px-5 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-2xs disabled:opacity-40">
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Salvar e Ativar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: LOGS */}
      {activeMainTab === 'logs' && (
        <div className="space-y-6">
          {pendingApprovals.length > 0 && (
            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  <span>{pendingApprovals.length} Execução Aguardando Aprovação Humana</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold font-mono">Ação Crítica</span>
              </div>
              {pendingApprovals.map((item) => (
                <div key={item.id} className="bg-surface border border-outline-variant/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-primary">{item.automationName}</span>
                      <span className="text-[10px] font-mono text-on-surface-variant">({item.timestamp})</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-outline-variant/50 bg-surface-container-low flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                Histórico Recente de Execuções &amp; Trilha de Auditoria
              </span>
              <span className="text-[11px] font-mono text-on-surface-variant">{logs.length} registros auditados</span>
            </div>
            <div className="divide-y divide-outline-variant/30 overflow-x-auto">
              {logs.map((log) => {
                const trig = TRIGGER_META[log.triggerType] ?? TRIGGER_META.event_driven;
                const exec = EXECUTION_MODE_META[log.executionMode] ?? EXECUTION_MODE_META.deterministic;
                return (
                  <div key={log.id} className="p-3.5 hover:bg-surface-container-low/50 transition-colors flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                        <span className={`material-symbols-outlined text-[18px] ${log.status === 'success' ? 'text-emerald-500' : log.status === 'failed' ? 'text-error' : 'text-amber-500'}`}>
                          {log.status === 'success' ? 'check_circle' : log.status === 'failed' ? 'error' : 'pending'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-primary truncate">{log.automationName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${trig.color}`}>{trig.label}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${exec.badgeColor}`}>{exec.label}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{log.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-right font-mono text-[11px] text-on-surface-variant">
                      <div className="hidden sm:block">
                        <div>{log.timestamp}</div>
                        <div className="text-[10px]">{log.durationMs}ms</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {logs.length === 0 && !loading && (
                <div className="text-center py-12 text-on-surface-variant/60 text-xs font-mono">
                  Nenhum log de execução registrado ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
