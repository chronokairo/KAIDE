import {
  Receivable,
  Payable,
  FinancialAccount,
  ContractSummary,
  ServiceInvoice,
  ReceivableAllocation,
  ReceivableStatus,
} from '@/domain/finance';

/**
 * Driven port for the Financial & Billing Repository.
 *
 * Defines contracts for querying and updating receivables, payables, accounts,
 * contracts, and service invoices (NFS-e) from official production data sources.
 */
export interface FinanceRepositoryPort {
  listReceivables(): Promise<Receivable[]>;
  listPayables(): Promise<Payable[]>;
  listFinancialAccounts(): Promise<FinancialAccount[]>;
  listContracts(): Promise<ContractSummary[]>;
  listServiceInvoices(): Promise<ServiceInvoice[]>;
  listReceivableAllocations(): Promise<ReceivableAllocation[]>;
  updateReceivableStatus(
    id: string,
    status: ReceivableStatus,
    receivedAt?: string,
    receivedAmountBrl?: number
  ): Promise<void>;
}
