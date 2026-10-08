import type { AiToolDefinition, DomainToolMetadata } from './types';
import { customersRepository } from '@/modules/crm/repositories/customers.repository';
import { leadsRepository } from '@/modules/crm/repositories/leads.repository';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'crm', sensitivity: 'confidential', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;
const writeRoles = ['owner', 'admin', 'operator'] as const;

export const crmWriteTools: AiToolDefinition[] = [
  {
    name: 'crm.customer.create',
    description: 'Cria um novo cliente na organização.',
    domain: 'CRM',
    executionType: 'ACTION',
    requiredRole: [...writeRoles],
    metadata: metadata('crm.customer.create'),
    policy: { requiresHumanApproval: true, requiredPermissions: ['crm.write'], riskLevel: 'medium' },
    handler: async (rawInput, ctx) => {
      const input = rawInput as { name: string; email?: string; phone?: string; tax_id?: string };
      if (!input.name) throw new Error('name é obrigatório.');
      return customersRepository.create({
        organization_id: ctx.organizationId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        status: 'Ativo',
        estimated_value: 0,
        tipo: 'PJ',
        contrato_ativo: false,
        valor_mensal: 0,
        empresa_ids: [],
      });
    },
  },
  {
    name: 'crm.customer.update',
    description: 'Atualiza dados de um cliente existente.',
    domain: 'CRM',
    executionType: 'ACTION',
    requiredRole: [...writeRoles],
    metadata: metadata('crm.customer.update'),
    policy: { requiresHumanApproval: true, requiredPermissions: ['crm.write'], riskLevel: 'medium' },
    handler: async (rawInput, ctx) => {
      const input = rawInput as { customerId: string; name?: string; email?: string; phone?: string };
      if (!input.customerId) throw new Error('customerId é obrigatório.');
      const { customerId, ...updates } = input;
      return customersRepository.update(customerId, updates);
    },
  },
  {
    name: 'crm.lead.search',
    description: 'Busca leads por nome, empresa ou status.',
    domain: 'CRM',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('crm.lead.search'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { query?: string; status?: string };
      let rows = await leadsRepository.getByOrganizationId(ctx.organizationId);
      if (input.query) {
        const q = input.query.toLowerCase();
        rows = rows.filter((r: any) =>
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.company && r.company.toLowerCase().includes(q))
        );
      }
      if (input.status) rows = rows.filter((r: any) => r.status === input.status);
      return rows;
    },
  },
  {
    name: 'crm.lead.create',
    description: 'Cria um novo lead no pipeline comercial.',
    domain: 'CRM',
    executionType: 'ACTION',
    requiredRole: [...writeRoles],
    metadata: metadata('crm.lead.create'),
    policy: { requiresHumanApproval: false, requiredPermissions: ['crm.write'], riskLevel: 'low' },
    handler: async (rawInput, ctx) => {
      const input = rawInput as { name: string; company?: string; email?: string; source: string };
      if (!input.name || !input.source) throw new Error('name e source são obrigatórios.');
      return leadsRepository.create({
        organization_id: ctx.organizationId,
        name: input.name,
        company: input.company,
        email: input.email,
        source: input.source as any,
        status: 'Novo',
        estimated_value: 0,
      });
    },
  },
];

export const CRM_WRITE_DOMAIN_TOOLS = crmWriteTools;
