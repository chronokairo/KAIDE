"use client";

export type TriggerType =
  | 'event_driven'
  | 'cron_scheduled'
  | 'document_ocr'
  | 'webhook_api'
  | 'anomaly_telemetry';

export type ExecutionMode =
  | 'deterministic'
  | 'agentic_ai'
  | 'human_in_the_loop';

export type AutomationCategory =
  | 'financeiro'
  | 'crm'
  | 'contratos'
  | 'fiscal'
  | 'projetos';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  triggerType: TriggerType;
  triggerDetails: string;
  executionMode: ExecutionMode;
  assignedAgent: string;
  status: 'active' | 'paused' | 'running';
  executionsCount: number;
  successRate: string;
  lastExecutedAt?: string;
  icon: string;
  requiresApproval?: boolean;
}

export interface ExecutionLog {
  id: string;
  automationId: string;
  automationName: string;
  triggerType: TriggerType;
  executionMode: ExecutionMode;
  status: 'success' | 'failed' | 'waiting_approval' | 'running';
  timestamp: string;
  durationMs: number;
  details: string;
  payloadSummary?: string;
  assignedAgent?: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  triggerType: TriggerType;
  triggerLabel: string;
  executionMode: ExecutionMode;
  assignedAgent: string;
  icon: string;
  badge: string;
  popular?: boolean;
}

export const TRIGGER_META: Record<
  TriggerType,
  { label: string; icon: string; color: string; desc: string }
> = {
  event_driven: {
    label: 'Event-Driven (CDC)',
    icon: 'bolt',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    desc: 'Disparo imediato ao mudar status de registro no banco de dados.',
  },
  cron_scheduled: {
    label: 'Agendado (Cron Pro)',
    icon: 'schedule',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    desc: 'Execuções periódicas automatizadas com reprocessamento em falhas.',
  },
  document_ocr: {
    label: 'Ingestão Documental (OCR)',
    icon: 'document_scanner',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    desc: 'Processa arquivos (PDF, XML NF-e, extratos) e extrai entidades com IA.',
  },
  webhook_api: {
    label: 'Webhook / API Externa',
    icon: 'webhook',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Disparado por gateways bancários, Pix, Asaas, Stripe ou APIs externas.',
  },
  anomaly_telemetry: {
    label: 'Telemetria & Anomalia IA',
    icon: 'monitoring',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    desc: 'Regra de IA que detecta discrepâncias orçamentárias ou desvios de SLA.',
  },
};

export const EXECUTION_MODE_META: Record<
  ExecutionMode,
  { label: string; icon: string; badgeColor: string; desc: string }
> = {
  deterministic: {
    label: 'Determinística (Sem IA)',
    icon: 'code',
    badgeColor: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300',
    desc: 'Mutação direta de campos e disparos de webhook sem custo de tokens.',
  },
  agentic_ai: {
    label: 'Ação Agêntica IA',
    icon: 'psychology',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    desc: 'LLM analisa contexto e executa ferramentas especializadas no ERP.',
  },
  human_in_the_loop: {
    label: 'Human-in-the-Loop',
    icon: 'verified_user',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    desc: 'Exige confirmação formal de um gestor antes de persistir alterações sensíveis.',
  },
};
