import type { AiToolDefinition, DomainToolMetadata } from './types';
import { supabase } from '@/shared/supabase';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'core', sensitivity: 'restricted', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;
const writeRoles = ['owner', 'admin'] as const;

export const fiscalTools: AiToolDefinition[] = [
  {
    name: 'fiscal.invoice.preview',
    description: 'Visualiza preview de uma nota fiscal antes da emissão.',
    domain: 'Fiscal',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('fiscal.invoice.preview'),
    handler: async (rawInput, ctx) => {
      const input = rawInput as { invoiceId: string };
      if (!input.invoiceId) throw new Error('invoiceId é obrigatório.');
      const { data, error } = await supabase.from('service_invoices').select('*, customers(name, tax_id)').eq('id', input.invoiceId).eq('organization_id', ctx.organizationId).single();
      if (error) throw error;
      return { ...data, preview: true, status: 'preview' };
    },
  },
  {
    name: 'fiscal.invoice.issue',
    description: 'Emite uma nota fiscal after validação.',
    domain: 'Fiscal',
    executionType: 'ACTION',
    requiredRole: [...writeRoles],
    metadata: metadata('fiscal.invoice.issue'),
    policy: { requiresHumanApproval: true, requiredPermissions: ['fiscal.write'], riskLevel: 'critical' },
    handler: async (rawInput, ctx) => {
      const input = rawInput as { invoiceId: string };
      if (!input.invoiceId) throw new Error('invoiceId é obrigatório.');
      const { data, error } = await supabase.from('service_invoices').update({ status: 'issued', issued_at: new Date().toISOString(), issued_by: ctx.userId }).eq('id', input.invoiceId).eq('organization_id', ctx.organizationId).select().single();
      if (error) throw error;
      return data;
    },
  },
  {
    name: 'fiscal.invoice.status',
    description: 'Consulta status de uma nota fiscal.',
    domain: 'Fiscal',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('fiscal.invoice.status'),
    handler: async (rawInput, ctx) => {
      const input = rawInput as { invoiceId?: string };
      let query = supabase.from('service_invoices').select('id, status, issued_at, canceled_at, customers(name)').eq('organization_id', ctx.organizationId);
      if (input.invoiceId) query = query.eq('id', input.invoiceId);
      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data || [];
    },
  },
];

export const FISCAL_DOMAIN_TOOLS = fiscalTools;
