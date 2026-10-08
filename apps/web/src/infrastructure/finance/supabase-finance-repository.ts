import { getSupabaseAdmin } from '@/infrastructure/persistence/supabase-admin';
import { FinanceRepositoryPort } from '@/application/ports/finance-repository-port';
import {
  Receivable,
  Payable,
  FinancialAccount,
  ContractSummary,
  ServiceInvoice,
  ReceivableAllocation,
  ReceivableStatus,
} from '@/domain/finance';
import { PROD_ORGANIZATION_ID } from '@/shared/supabase';

/**
 * Production secondary adapter for the Financial Repository backed by Supabase.
 *
 * Connected directly to official production database (`chronokairo-prod`).
 * Interacts with `accounts_receivable`, `accounts_payable`, `financial_accounts`,
 * `contracts`, `service_invoices`, and `service_invoice_receivable_allocations`.
 */
export class SupabaseFinanceRepository implements FinanceRepositoryPort {
  async listReceivables(): Promise<Receivable[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('accounts_receivable')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('due_date', { ascending: true });

    if (error || !data) {
      console.warn('[SupabaseFinanceRepository] Failed to list accounts receivable:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      description: row.description,
      amountBrl: Number(row.amount || 0),
      status: row.status as ReceivableStatus,
      dueDate: row.due_date,
      receivedAt: row.received_at || undefined,
      receivedAmountBrl: row.received_amount ? Number(row.received_amount) : undefined,
      withheldAmountBrl: row.withheld_amount ? Number(row.withheld_amount) : undefined,
      customerId: row.customer_id || undefined,
      contractId: row.contract_id || undefined,
      fiscalAlert: row.description?.includes('ALERTA:')
        ? row.description.split('ALERTA:')[1]?.trim()
        : undefined,
    }));
  }

  async listPayables(): Promise<Payable[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('accounts_payable')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('due_date', { ascending: true });

    if (error || !data) {
      console.warn('[SupabaseFinanceRepository] Failed to list accounts payable:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      description: row.description,
      amountBrl: Number(row.amount || 0),
      status: row.status as any,
      dueDate: row.due_date || undefined,
      paidAt: row.paid_at || undefined,
      paidAmountBrl: row.paid_amount ? Number(row.paid_amount) : undefined,
      category: row.category_id || undefined,
    }));
  }

  async listFinancialAccounts(): Promise<FinancialAccount[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('financial_accounts')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID);

    if (error || !data) {
      console.warn('[SupabaseFinanceRepository] Failed to list financial accounts:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      currency: row.currency,
      currentBalanceBrl: Number(row.current_balance || 0),
      initialBalanceBrl: Number(row.initial_balance || 0),
      status: row.status,
      entityNature: row.name?.toLowerCase().includes('nubank') ? 'pf' : 'pj',
    }));
  }

  async listContracts(): Promise<ContractSummary[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('contracts')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[SupabaseFinanceRepository] Failed to list contracts:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      contractNumber: row.contract_number,
      title: row.title,
      status: row.status,
      totalValueBrl: Number(row.total_value || 0),
      customerId: row.customer_id || undefined,
      startDate: row.start_date || undefined,
      endDate: row.end_date || undefined,
      notes: row.notes || undefined,
    }));
  }

  async listServiceInvoices(): Promise<ServiceInvoice[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('service_invoices')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('issued_at', { ascending: false });

    if (error || !data) {
      console.warn('[SupabaseFinanceRepository] Failed to list service invoices:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      dpsNumber: row.dps_number || undefined,
      customerName: row.customer_name,
      customerDocument: row.customer_document || undefined,
      providerName: row.provider_name || undefined,
      amountBrl: Number(row.amount || 0),
      netAmountBrl: row.net_amount ? Number(row.net_amount) : undefined,
      issWithheldBrl: row.iss_withheld ? Number(row.amount) - Number(row.net_amount) : 0,
      nationalTaxCode: row.national_tax_code || undefined,
      status: row.status,
      paymentStatus: row.payment_status,
      competenceDate: row.competence_date,
      issuedAt: row.issued_at || undefined,
    }));
  }

  async listReceivableAllocations(): Promise<ReceivableAllocation[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('service_invoice_receivable_allocations')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID);

    if (error || !data) {
      console.warn('[SupabaseFinanceRepository] Failed to list receivable allocations:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      serviceInvoiceId: row.service_invoice_id,
      accountReceivableId: row.account_receivable_id,
      allocatedAmountBrl: Number(row.allocated_amount || 0),
    }));
  }

  async updateReceivableStatus(
    id: string,
    status: ReceivableStatus,
    receivedAt?: string,
    receivedAmountBrl?: number
  ): Promise<void> {
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (receivedAt !== undefined) {
      updatePayload.received_at = receivedAt;
    }
    if (receivedAmountBrl !== undefined) {
      updatePayload.received_amount = receivedAmountBrl;
    }

    const { error } = await getSupabaseAdmin()
      .from('accounts_receivable')
      .update(updatePayload)
      .eq('id', id)
      .eq('organization_id', PROD_ORGANIZATION_ID);

    if (error) {
      throw new Error(`Failed to update receivable ${id}: ${error.message}`);
    }
  }
}
