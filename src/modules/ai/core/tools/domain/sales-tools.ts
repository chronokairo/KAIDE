import type { AiToolDefinition, DomainToolMetadata } from './types';
import { opportunitiesRepository } from '@/modules/crm/repositories/opportunities.repository';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'crm', sensitivity: 'confidential', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;
const writeRoles = ['owner', 'admin', 'operator'] as const;

export const salesTools: AiToolDefinition[] = [
  {
    name: 'sales.quote.search',
    description: 'Busca cotações/propostas comerciais por cliente, status ou período.',
    domain: 'Sales',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('sales.quote.search'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { customerId?: string; status?: string };
      let rows: any[] = await opportunitiesRepository.getByOrganizationId(ctx.organizationId);
      if (input.customerId) rows = rows.filter((r: any) => (r.customer_id === input.customerId || r.customer === input.customerId));
      if (input.status) rows = rows.filter((r: any) => r.status === input.status);
      return rows;
    },
  },
  {
    name: 'sales.quote.create',
    description: 'Cria uma nova cotação/proposta comercial.',
    domain: 'Sales',
    executionType: 'ACTION',
    requiredRole: [...writeRoles],
    metadata: metadata('sales.quote.create'),
    policy: { requiresHumanApproval: true, requiredPermissions: ['sales.write'], riskLevel: 'medium' },
    handler: async (rawInput, ctx) => {
      const input = rawInput as { customerId: string; name: string; value: number; stageId: string; pipelineId: string };
      if (!input.customerId || !input.name || !Number.isFinite(input.value)) throw new Error('customerId, name e value são obrigatórios.');
      return opportunitiesRepository.create({
        organization_id: ctx.organizationId,
        customer_id: input.customerId,
        title: input.name,
        value: input.value,
        stage_id: input.stageId || 'default',
        pipeline_id: input.pipelineId || 'default',
        lead_source: 'AI',
        commercial_owner_id: ctx.userId,
        technical_owner_id: ctx.userId,
        legal_owner_id: ctx.userId,
        win_probability: 0,
        status: 'Open',
      });
    },
  },
  {
    name: 'sales.order.search',
    description: 'Busca pedidos de venda por cliente, status ou período.',
    domain: 'Sales',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('sales.order.search'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { customerId?: string; status?: string };
      let rows: any[] = await opportunitiesRepository.getByOrganizationId(ctx.organizationId);
      if (input.customerId) rows = rows.filter((r: any) => (r.customer_id === input.customerId || r.customer === input.customerId));
      if (input.status) rows = rows.filter((r: any) => r.status === input.status);
      return rows;
    },
  },
  {
    name: 'sales.order.create',
    description: 'Cria um pedido de venda a partir de uma oportunidade.',
    domain: 'Sales',
    executionType: 'ACTION',
    requiredRole: [...writeRoles],
    metadata: metadata('sales.order.create'),
    policy: { requiresHumanApproval: true, requiredPermissions: ['sales.write'], riskLevel: 'medium' },
    handler: async (rawInput, ctx) => {
      const input = rawInput as { customerId: string; name: string; value: number };
      if (!input.customerId || !input.name || !Number.isFinite(input.value)) throw new Error('customerId, name e value são obrigatórios.');
      return opportunitiesRepository.create({
        organization_id: ctx.organizationId,
        customer_id: input.customerId,
        title: input.name,
        value: input.value,
        stage_id: 'order',
        pipeline_id: 'default',
        lead_source: 'AI',
        commercial_owner_id: ctx.userId,
        technical_owner_id: ctx.userId,
        legal_owner_id: ctx.userId,
        win_probability: 100,
        status: 'Open',
      });
    },
  },
];

export const SALES_DOMAIN_TOOLS = salesTools;
