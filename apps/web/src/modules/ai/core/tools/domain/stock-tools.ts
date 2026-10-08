import type { AiToolDefinition, DomainToolMetadata } from './types';
import { supabase } from '@/shared/supabase';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'core', sensitivity: 'confidential', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;
const writeRoles = ['owner', 'admin', 'operator'] as const;

export const stockTools: AiToolDefinition[] = [
  {
    name: 'stock.product.search',
    description: 'Busca produtos por nome, SKU ou categoria.',
    domain: 'Stock',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('stock.product.search'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { query?: string; category?: string };
      let query = supabase.from('products').select('*').eq('organization_id', ctx.organizationId);
      if (input.query) query = query.ilike('name', `%${input.query}%`);
      if (input.category) query = query.eq('category', input.category);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
  },
  {
    name: 'stock.balance.get',
    description: 'Consulta saldo de estoque por produto ou localização.',
    domain: 'Stock',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('stock.balance.get'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { productId?: string };
      let query = supabase.from('stock_balances').select('*, products(name, sku)').eq('organization_id', ctx.organizationId);
      if (input.productId) query = query.eq('product_id', input.productId);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
  },
  {
    name: 'stock.transfer.create',
    description: 'Cria uma transferência de estoque entre localizações.',
    domain: 'Stock',
    executionType: 'ACTION',
    requiredRole: [...writeRoles],
    metadata: metadata('stock.transfer.create'),
    policy: { requiresHumanApproval: true, requiredPermissions: ['stock.write'], riskLevel: 'high' },
    handler: async (rawInput, ctx) => {
      const input = rawInput as { productId: string; fromLocation: string; toLocation: string; quantity: number };
      if (!input.productId || !input.fromLocation || !input.toLocation || !Number.isFinite(input.quantity) || input.quantity <= 0) {
        throw new Error('productId, fromLocation, toLocation e quantity positivo são obrigatórios.');
      }
      const { data, error } = await supabase.from('stock_transfers').insert({
        organization_id: ctx.organizationId,
        product_id: input.productId,
        from_location: input.fromLocation,
        to_location: input.toLocation,
        quantity: input.quantity,
        status: 'pending',
        created_by: ctx.userId,
      }).select().single();
      if (error) throw error;
      return data;
    },
  },
];

export const STOCK_DOMAIN_TOOLS = stockTools;
