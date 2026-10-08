import type { AiToolDefinition, DomainToolMetadata } from './types';
import { customersRepository } from '@/modules/crm/repositories/customers.repository';
import { opportunitiesRepository } from '@/modules/crm/repositories/opportunities.repository';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'crm', sensitivity: 'confidential', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;

export const crmTools: AiToolDefinition[] = [
  {
    name: 'crm.customers.list',
    description: 'Lista todos os clientes da organização com dados básicos e status.',
    domain: 'CRM',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('crm.customers.list'),
    handler: async (_input, ctx) => customersRepository.getByOrganizationId(ctx.organizationId),
  },
  {
    name: 'crm.customers.get',
    description: 'Busca um cliente específico por ID.',
    domain: 'CRM',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('crm.customers.get'),
    handler: async (rawInput, _ctx) => {
      const input = rawInput as { customerId: string };
      if (!input.customerId) throw new Error('customerId é obrigatório.');
      return customersRepository.getById(input.customerId);
    },
  },
  {
    name: 'crm.opportunities.list',
    description: 'Lista todas as oportunidades do pipeline comercial.',
    domain: 'CRM',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('crm.opportunities.list'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { status?: string };
      let rows = await opportunitiesRepository.getByOrganizationId(ctx.organizationId);
      if (input.status) rows = rows.filter((r) => r.status === input.status);
      return rows;
    },
  },
  {
    name: 'crm.pipeline.summary',
    description: 'Gera resumo do pipeline comercial com totais por estágio e valor ponderado.',
    domain: 'CRM',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('crm.pipeline.summary'),
    handler: async (_input, ctx) => {
      const [opportunities, context] = await Promise.all([
        opportunitiesRepository.getByOrganizationId(ctx.organizationId),
        opportunitiesRepository.getContext(ctx.organizationId),
      ]);

      const openOpps = opportunities.filter((o: any) => o.status === 'Open');
      const totalValue = openOpps.reduce((sum: number, o: any) => sum + (o.value || 0), 0);
      const weightedValue = openOpps.reduce((sum: number, o: any) => sum + (o.value || 0) * ((o.win_probability || 50) / 100), 0);

      const byStage = context.stages.map((stage: any) => {
        const stageOpps = openOpps.filter((o: any) => o.stage_id === stage.id);
        return {
          stage: stage.name,
          count: stageOpps.length,
          value: stageOpps.reduce((sum: number, o: any) => sum + (o.value || 0), 0),
          weightedValue: stageOpps.reduce((sum: number, o: any) => sum + (o.value || 0) * ((o.win_probability || 50) / 100), 0),
        };
      });

      return {
        totalOpportunities: openOpps.length,
        totalValue,
        weightedValue,
        wonCount: opportunities.filter((o: any) => o.status === 'Won').length,
        lostCount: opportunities.filter((o: any) => o.status === 'Lost').length,
        byStage,
      };
    },
  },
];

export const CRM_DOMAIN_TOOLS = crmTools;
