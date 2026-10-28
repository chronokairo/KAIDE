"use client";

import { useState, useCallback } from 'react';
import { useHarnessAutomations } from './useHarnessAutomations';
import type { TriggerType, ExecutionMode, AutomationCategory } from '@/modules/ai/components/automations-types';

export interface AutomationRuleEntity {
  id: string;
  name: string;
  description?: string;
  category: AutomationCategory;
  trigger_type: TriggerType;
  trigger_details?: string;
  execution_mode: ExecutionMode;
  assigned_agent?: string;
  status: 'active' | 'paused' | 'running';
  config?: {
    executionsCount?: number;
    successRate?: string;
    lastExecutedAt?: string | null;
    icon?: string;
    condition?: string;
    action?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface AutomationExecutionLogEntity {
  id: string;
  automation_id: string;
  automation_name: string;
  trigger_type: TriggerType;
  execution_mode: ExecutionMode;
  status: 'success' | 'failed' | 'waiting_approval' | 'running';
  executed_at: string;
  duration_ms: number;
  details?: string;
  output_summary?: string;
  error_message?: string;
}

const DEFAULT_RULES: AutomationRuleEntity[] = [
  {
    id: 'rule-ofx-reconcile',
    name: 'Conciliação Bancária Automática OFX',
    description: 'Verificação diária de extratos bancários e matching automático no ERP',
    category: 'financeiro',
    trigger_type: 'cron_scheduled',
    trigger_details: 'Diariamente às 06:00',
    execution_mode: 'agentic_ai',
    assigned_agent: 'Agente Financeiro',
    status: 'active',
    config: {
      executionsCount: 142,
      successRate: '98.5%',
      lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
      icon: 'payments',
    },
  },
  {
    id: 'rule-billing-d3',
    name: 'Cobrança Preventiva D-3 via WhatsApp',
    description: 'Avisa clientes sobre faturas a vencer em 3 dias com link Pix',
    category: 'financeiro',
    trigger_type: 'event_driven',
    trigger_details: '3 dias antes do vencimento do título',
    execution_mode: 'deterministic',
    assigned_agent: 'Agente Billing',
    status: 'active',
    config: {
      executionsCount: 89,
      successRate: '100%',
      lastExecutedAt: new Date(Date.now() - 86400000).toISOString(),
      icon: 'receipt_long',
    },
  },
  {
    id: 'rule-lead-enrich',
    name: 'Enriquecimento Automático de Leads CNPJ',
    description: 'Busca dados cadastrais na Receita Federal e sócios ao cadastrar lead',
    category: 'crm',
    trigger_type: 'document_ocr',
    trigger_details: 'Novo lead inserido no CRM com CNPJ',
    execution_mode: 'human_in_the_loop',
    assigned_agent: 'Agente OSINT & CRM',
    status: 'active',
    config: {
      executionsCount: 310,
      successRate: '96.2%',
      lastExecutedAt: new Date(Date.now() - 7200000).toISOString(),
      icon: 'manage_accounts',
    },
  },
];

const DEFAULT_LOGS: AutomationExecutionLogEntity[] = [
  {
    id: 'log-1',
    automation_id: 'rule-ofx-reconcile',
    automation_name: 'Conciliação Bancária Automática OFX',
    trigger_type: 'cron_scheduled',
    execution_mode: 'agentic_ai',
    status: 'success',
    executed_at: new Date(Date.now() - 3600000).toISOString(),
    duration_ms: 4200,
    details: '32 lançamentos conciliados com sucesso em Itaú e Bradesco.',
  },
  {
    id: 'log-2',
    automation_id: 'rule-lead-enrich',
    automation_name: 'Enriquecimento Automático de Leads CNPJ',
    trigger_type: 'document_ocr',
    execution_mode: 'human_in_the_loop',
    status: 'success',
    executed_at: new Date(Date.now() - 7200000).toISOString(),
    duration_ms: 1850,
    details: 'Dados societários e CNAE extraídos para TechCorp Brasil.',
  },
];

export function useAutomations() {
  const { result: harnessAuto } = useHarnessAutomations();
  const [rules, setRules] = useState<AutomationRuleEntity[]>(DEFAULT_RULES);
  const [logs, setLogs] = useState<AutomationExecutionLogEntity[]>(DEFAULT_LOGS);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const createRule = useCallback(async (data: Partial<AutomationRuleEntity>) => {
    const newRule: AutomationRuleEntity = {
      id: `rule-${Date.now()}`,
      name: data.name || 'Nova Automação',
      description: data.description || '',
      category: data.category || 'financeiro',
      trigger_type: data.trigger_type || 'event_driven',
      trigger_details: data.trigger_details || '',
      execution_mode: data.execution_mode || 'agentic_ai',
      assigned_agent: data.assigned_agent || 'Chronokairo Assistant',
      status: 'active',
      config: {
        executionsCount: 0,
        successRate: '—',
        lastExecutedAt: null,
        icon: 'settings',
        ...data.config,
      },
      created_at: new Date().toISOString(),
      ...data,
    };
    setRules((prev) => [newRule, ...prev]);
    return newRule;
  }, []);

  const updateRule = useCallback(async (id: string, data: Partial<AutomationRuleEntity>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...data, updated_at: new Date().toISOString() } : r)));
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleRule = useCallback(async (id: string, currentStatus?: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: (currentStatus || r.status) === 'active' ? 'paused' : 'active',
            }
          : r
      )
    );
  }, []);

  const toggleRuleActive = toggleRule;

  return {
    rules,
    logs,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    toggleRuleActive,
  };
}
