"use client";

import { useCallback } from 'react';
import { useOrganizationContext } from '@/providers/OrganizationProvider';
import { getAuthSession } from '@/shared/supabase';
import { aiToolRegistry } from '@/modules/ai/core/tools/registry';
import { isTauriRuntime, harnessClient, type AgentEvent } from '@/modules/dev/harness-client';
import type { AiExecutionContext } from '@/modules/ai/core/tools/domain/types';

// Domain patterns for auto-detection
const DOMAIN_PATTERNS = [
  {
    pattern: /financeiro|fluxo de caixa|saldo|contas? a pagar|contas? a receber|faturamento|pagamento/i,
    domain: 'finance',
    selectTool: (prompt: string): string => {
      if (/contas? a pagar/i.test(prompt)) return 'finance.accounts_payable.list';
      if (/contas? a receber/i.test(prompt)) return 'finance.accounts_receivable.list';
      if (/contas? financeiras?|saldos? bancários?/i.test(prompt)) return 'finance.accounts.list';
      return 'finance.summary.generate';
    },
    tauriCommand: 'get_harness_overview',
    permissions: ['finance.read', 'finance.write'],
  },
  {
    pattern: /crm|lead|cliente|oportunidade|pipeline|funil/i,
    domain: 'crm',
    selectTool: (prompt: string): string => {
      if (/oportunidade|pipeline/i.test(prompt)) return 'crm.pipeline.summary';
      if (/cliente/i.test(prompt)) return 'crm.customers.list';
      return 'crm.opportunities.list';
    },
    tauriCommand: 'get_harness_overview',
    permissions: ['crm.read'],
  },
  {
    pattern: /contrato|aditivo|vigência|renovação/i,
    domain: 'contracts',
    selectTool: (prompt: string): string => {
      if (/renovação|venc/i.test(prompt)) return 'contracts.upcoming_renewals';
      if (/resumo|total/i.test(prompt)) return 'contracts.summary';
      return 'contracts.list';
    },
    tauriCommand: 'get_harness_overview',
    permissions: ['contracts.read'],
  },
  {
    pattern: /projeto|sprint|tarefa|horas?|timesheet/i,
    domain: 'projects',
    selectTool: (prompt: string): string => {
      if (/risco|problema/i.test(prompt)) return 'projects.at_risk';
      if (/resumo|total/i.test(prompt)) return 'projects.summary';
      return 'projects.list';
    },
    tauriCommand: 'get_harness_overview',
    permissions: ['projects.read'],
  },
  {
    pattern: /bi|dashboard|métrica|indicador|painel/i,
    domain: 'bi',
    selectTool: (prompt: string): string => {
      if (/executivo|geral|consolidado/i.test(prompt)) return 'bi.executive_dashboard';
      if (/financeiro/i.test(prompt)) return 'bi.financial_summary';
      if (/crm|pipeline/i.test(prompt)) return 'bi.crm_pipeline';
      if (/contrato|receita/i.test(prompt)) return 'bi.contract_revenue';
      if (/projeto|utilização/i.test(prompt)) return 'bi.project_utilization';
      return 'bi.executive_dashboard';
    },
    tauriCommand: 'get_harness_overview',
    permissions: ['bi.read'],
  },
];

function detectDomain(prompt: string): typeof DOMAIN_PATTERNS[number] | null {
  for (const domain of DOMAIN_PATTERNS) {
    if (domain.pattern.test(prompt)) return domain;
  }
  return null;
}

export function useAiDomainBridge() {
  const { currentOrganization } = useOrganizationContext();

  const enrichPrompt = useCallback(async (prompt: string, sessionId: string): Promise<string> => {
    const detected = detectDomain(prompt);
    if (!detected) return prompt;
    if (!currentOrganization) throw new Error('Selecione uma organização autorizada antes de consultar o ERP pela IA.');

    const authSession = await getAuthSession();
    if (!authSession?.user) throw new Error('A IA operacional exige uma sessão Supabase autenticada.');

    const context: AiExecutionContext = {
      organizationId: currentOrganization.id,
      userId: authSession.user.id,
      userRole: (currentOrganization.role as any) || 'owner',
      sessionId,
      permissions: detected.permissions,
    };

    const toolName = detected.selectTool(prompt);
    const result = await aiToolRegistry.execute(toolName, {}, context);
    return `${prompt}\n\nContexto ERP autorizado e auditado (${toolName}):\n${JSON.stringify(result.data)}`;
  }, [currentOrganization]);

  const enrichViaTauri = useCallback(async (prompt: string, sessionId: string): Promise<string> => {
    const detected = detectDomain(prompt);
    if (!detected) return prompt;
    if (!currentOrganization) throw new Error('Selecione uma organização autorizada antes de consultar o ERP pela IA.');

    if (!isTauriRuntime()) {
      return enrichPrompt(prompt, sessionId);
    }

    // Use Tauri IPC to stream agent session with domain context
    let fullResponse = '';

    await harnessClient.streamAgentSession(
      `${prompt}\n\n[Dominio ERP: ${detected.domain}]`,
      (event: AgentEvent) => {
        if (event.type === 'ToolCall') {
          (window as any).setActiveTool?.(event.payload.name);
        }
      },
      {
        session_id: sessionId,
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        onTextDelta: (text: string) => {
          fullResponse += text;
        },
      },
    );

    return fullResponse || `${prompt}\n\nContexto ERP autorizado via Tauri (${detected.domain})`;
  }, [currentOrganization, enrichPrompt]);

  return { enrichPrompt, enrichViaTauri };
}
