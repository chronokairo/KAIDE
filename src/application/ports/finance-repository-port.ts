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
 * Porta Secundária (Driven Port) do Repositório Financeiro.
 * Define os contratos para consulta e persistência de dados de faturamento, conciliação e fluxo de caixa.
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
