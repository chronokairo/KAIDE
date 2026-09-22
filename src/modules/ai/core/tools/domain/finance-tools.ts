import type { AiToolDefinition, DomainToolMetadata } from './types';
import { financeAccountsRepository, type FinancialAccountEntity } from '@/modules/financeiro/repositories/finance-accounts.repository';
import { accountsPayableRepository, type AccountPayableEntity } from '@/modules/financeiro/repositories/accounts-payable.repository';
import { accountsReceivableRepository, type AccountReceivableEntity } from '@/modules/financeiro/repositories/accounts-receivable.repository';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'finance', sensitivity: 'confidential', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;

export const financeTools: AiToolDefinition[] = [
  {
    name: 'finance.accounts.list', description: 'Lista as contas financeiras reais da organização ativa.', domain: 'FinanceCore', executionType: 'READ',
    requiredRole: [...readRoles], metadata: metadata('finance.accounts.list'),
    handler: async (_input, ctx) => financeAccountsRepository.getByOrganizationId(ctx.organizationId),
  },
  {
    name: 'finance.accounts_payable.list', description: 'Lista contas a pagar, com filtros opcionais.', domain: 'FinanceCore', executionType: 'READ',
    requiredRole: [...readRoles], metadata: metadata('finance.accounts_payable.list'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { status?: string; due_within_days?: number };
      let rows: any[] = await accountsPayableRepository.getByOrganizationId(ctx.organizationId);
      if (input.status) rows = rows.filter((row: any) => row.status === input.status);
      if (input.due_within_days !== undefined) {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + input.due_within_days);
        rows = rows.filter((row: any) => new Date(row.dueDate || row.due_date) <= cutoff);
      }
      return rows;
    },
  },
  {
    name: 'finance.accounts_receivable.list', description: 'Lista contas a receber, com filtros opcionais.', domain: 'FinanceCore', executionType: 'READ',
    requiredRole: [...readRoles], metadata: metadata('finance.accounts_receivable.list'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { status?: string; due_within_days?: number };
      let rows: any[] = await accountsReceivableRepository.getByOrganizationId(ctx.organizationId);
      if (input.status) rows = rows.filter((row: any) => row.status === input.status);
      if (input.due_within_days !== undefined) {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + input.due_within_days);
        rows = rows.filter((row: any) => new Date(row.dueDate || row.due_date) <= cutoff);
      }
      return rows;
    },
  },
  {
    name: 'finance.summary.generate', description: 'Gera resumo financeiro com dados persistidos.', domain: 'FinanceCore', executionType: 'READ',
    requiredRole: [...readRoles], metadata: metadata('finance.summary.generate'),
    handler: async (_input, ctx) => {
      const [accounts, payables, receivables] = await Promise.all([
        financeAccountsRepository.getByOrganizationId(ctx.organizationId), accountsPayableRepository.getByOrganizationId(ctx.organizationId), accountsReceivableRepository.getByOrganizationId(ctx.organizationId),
      ]);
      const payable = (payables as any[]).filter((row: any) => !['Pago', 'Cancelado'].includes(row.status)).reduce((sum: number, row: any) => sum + Number(row.amount || 0) - Number(row.paid_amount ?? 0), 0);
      const receivable = (receivables as any[]).filter((row: any) => !['Pago', 'Cancelado'].includes(row.status)).reduce((sum: number, row: any) => sum + Number(row.amount || 0) - Number(row.received_amount ?? 0), 0);
      const balance = (accounts as any[]).reduce((sum: number, row: any) => sum + Number(row.balance ?? row.current_balance ?? 0), 0);
      return { balance, payable, receivable, netPosition: balance + receivable - payable, accountCount: accounts.length };
    },
  },
  {
    name: 'finance.payment.create', description: 'Registra baixa em conta a pagar após aprovação humana.', domain: 'FinanceCore', executionType: 'ACTION',
    requiredRole: ['owner', 'admin', 'operator', 'billing'], metadata: metadata('finance.payment.create'),
    policy: { requiresHumanApproval: true, requiredPermissions: ['finance.write'], riskLevel: 'high' },
    handler: async (rawInput, ctx) => {
      const input = rawInput as { accountPayableId: string; amount: number; paymentDate: string; financialAccountId?: string };
      if (!input.accountPayableId || !Number.isFinite(input.amount) || input.amount <= 0 || !input.paymentDate) throw new Error('Conta, valor positivo e data são obrigatórios.');
      return accountsPayableRepository.settle(input.accountPayableId, { organizationId: ctx.organizationId, amount: input.amount, paymentDate: input.paymentDate, financialAccountId: input.financialAccountId });
    },
  },
];

export const FINANCE_DOMAIN_TOOLS = financeTools;
