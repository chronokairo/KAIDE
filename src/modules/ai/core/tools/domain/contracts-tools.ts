import type { AiToolDefinition, DomainToolMetadata } from './types';
import { contractsRepository } from '@/modules/financeiro/repositories/contracts.repository';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'contracts', sensitivity: 'confidential', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;

export const contractsTools: AiToolDefinition[] = [
  {
    name: 'contracts.list',
    description: 'Lista todos os contratos da organização com status e valores.',
    domain: 'ContractsBilling',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('contracts.list'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { status?: string };
      let rows = await contractsRepository.getByOrganizationId(ctx.organizationId);
      if (input.status) rows = rows.filter((r) => r.status === input.status);
      return rows;
    },
  },
  {
    name: 'contracts.summary',
    description: 'Gera resumo dos contratos com totais por status e valor.',
    domain: 'ContractsBilling',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('contracts.summary'),
    handler: async (_input, ctx) => {
      const contracts: any[] = await contractsRepository.getByOrganizationId(ctx.organizationId);

      const byStatus = {
        Draft: contracts.filter((c: any) => c.status === 'Draft'),
        PendingSignature: contracts.filter((c: any) => c.status === 'PendingSignature'),
        Active: contracts.filter((c: any) => c.status === 'Active'),
        Suspended: contracts.filter((c: any) => c.status === 'Suspended'),
        Expired: contracts.filter((c: any) => c.status === 'Expired'),
        Terminated: contracts.filter((c: any) => c.status === 'Terminated'),
      };

      const activeContracts = byStatus.Active;
      const totalActiveValue = activeContracts.reduce((sum: number, c: any) => sum + (c.total_value || c.value || 0), 0);
      const totalAllValue = contracts.reduce((sum: number, c: any) => sum + (c.total_value || c.value || 0), 0);

      return {
        totalContracts: contracts.length,
        totalActiveValue,
        totalAllValue,
        byStatus: Object.entries(byStatus).map(([status, items]) => ({
          status,
          count: items.length,
          value: items.reduce((sum: number, c: any) => sum + (c.total_value || c.value || 0), 0),
        })),
        expiringSoon: activeContracts.filter((c: any) => {
          const dateStr = c.end_date || c.endDate;
          if (!dateStr) return false;
          const endDate = new Date(dateStr);
          const now = new Date();
          const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 30 && diffDays > 0;
        }).map((c: any) => ({
          id: c.id,
          title: c.title,
          customer: c.customers?.name || c.client || 'N/A',
          endDate: c.end_date || c.endDate,
          value: c.total_value || c.value || 0,
        })),
      };
    },
  },
  {
    name: 'contracts.upcoming_renewals',
    description: 'Lista contratos que vencerão nos próximos 90 dias.',
    domain: 'ContractsBilling',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('contracts.upcoming_renewals'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { days?: number };
      const days = input.days || 90;

      const contracts: any[] = await contractsRepository.getByOrganizationId(ctx.organizationId);
      const now = new Date();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);

      return contracts
        .filter((c: any) => (c.status === 'Active' || !c.status) && (c.end_date || c.endDate))
        .filter((c: any) => {
          const endDate = new Date(c.end_date || c.endDate);
          return endDate >= now && endDate <= cutoff;
        })
        .map((c: any) => {
          const endDate = new Date(c.end_date || c.endDate);
          return {
            id: c.id,
            title: c.title,
            customer: c.customers?.name || c.client || 'N/A',
            endDate: c.end_date || c.endDate,
            value: c.total_value || c.value || 0,
            daysUntilExpiry: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          };
        });
    },
  },
];

export const CONTRACTS_DOMAIN_TOOLS = contractsTools;
