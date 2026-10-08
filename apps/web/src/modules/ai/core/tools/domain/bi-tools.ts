import type { AiToolDefinition, DomainToolMetadata } from './types';
import { biMetricsRepository } from '@/modules/bi/repositories/bi-metrics.repository';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'bi', sensitivity: 'confidential', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;

export const biTools: AiToolDefinition[] = [
  {
    name: 'bi.financial_summary',
    description: 'Consulta métricas financeiras consolidadas (saldo, recebíveis, pagáveis).',
    domain: 'BI',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('bi.financial_summary'),
    handler: async (_input, ctx) => biMetricsRepository.getFinancialSummary(ctx.organizationId),
  },
  {
    name: 'bi.crm_pipeline',
    description: 'Consulta métricas do pipeline comercial (oportunidades, valor, conversão).',
    domain: 'BI',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('bi.crm_pipeline'),
    handler: async (_input, ctx) => biMetricsRepository.getCrmPipeline(ctx.organizationId),
  },
  {
    name: 'bi.contract_revenue',
    description: 'Consulta métricas de receita de contratos (MRR, ARR, valor total).',
    domain: 'BI',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('bi.contract_revenue'),
    handler: async (_input, ctx) => biMetricsRepository.getContractRevenue(ctx.organizationId),
  },
  {
    name: 'bi.project_utilization',
    description: 'Consulta métricas de utilização de projetos (horas billable, taxa de utilização).',
    domain: 'BI',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('bi.project_utilization'),
    handler: async (_input, ctx) => biMetricsRepository.getProjectUtilization(ctx.organizationId),
  },
  {
    name: 'bi.executive_dashboard',
    description: 'Gera painel executivo consolidando métricas de todos os módulos.',
    domain: 'BI',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('bi.executive_dashboard'),
    handler: async (_input, ctx) => {
      const [financial, crm, contracts, projects] = await Promise.all([
        biMetricsRepository.getFinancialSummary(ctx.organizationId),
        biMetricsRepository.getCrmPipeline(ctx.organizationId),
        biMetricsRepository.getContractRevenue(ctx.organizationId),
        biMetricsRepository.getProjectUtilization(ctx.organizationId),
      ]);

      return {
        financial: financial || { total_balance: 0, outstanding_receivables: 0, outstanding_payables: 0, received_revenue: 0, known_total_revenue: 0 },
        crm: crm || { total_opportunities: 0, total_open_pipeline_value: 0, weighted_pipeline_value: 0, total_won_value: 0, won_count: 0, lost_count: 0 },
        contracts: contracts || { active_contracts_count: 0, total_contract_value: 0, mrr: 0, arr: 0 },
        projects: projects || { active_projects_count: 0, total_duration_minutes: 0, billable_duration_minutes: 0, billable_utilization_rate: 0 },
      };
    },
  },
];

export const BI_DOMAIN_TOOLS = biTools;
