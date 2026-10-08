/**
 * Pure domain entities and types for the Financial Control & Invoicing Module (AI Finance / Ops).
 *
 * Directly mirrors the production schema from Supabase:
 * `accounts_receivable`, `accounts_payable`, `contracts`, `financial_accounts`,
 * `bank_statement_entries`, `service_invoices`, and `service_invoice_receivable_allocations`.
 *
 * Hexagonal Architecture: pure domain models completely independent of Supabase, Next.js, or SDKs.
 */

export type ReceivableStatus = 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado';

export interface Receivable {
  id: string;
  invoiceNumber: string;
  description: string;
  amountBrl: number;
  status: ReceivableStatus;
  dueDate: string;
  receivedAt?: string;
  receivedAmountBrl?: number;
  withheldAmountBrl?: number;
  customerId?: string;
  contractId?: string;
  fiscalAlert?: string;
}

export type PayableStatus = 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado';

export interface Payable {
  id: string;
  description: string;
  amountBrl: number;
  status: PayableStatus;
  dueDate?: string;
  paidAt?: string;
  paidAmountBrl?: number;
  category?: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  currentBalanceBrl: number;
  initialBalanceBrl: number;
  status: string;
  /** Entity nature for corporate (PJ) vs personal (PF) balance segregation. */
  entityNature: 'pj' | 'pf';
}

export interface BankStatementEntry {
  id: string;
  accountId: string;
  fitId?: string;
  transactionDate: string;
  description: string;
  amountBrl: number;
  entryType: string;
  reconciled: boolean;
}

export interface ContractSummary {
  id: string;
  contractNumber: string;
  title: string;
  status: string;
  totalValueBrl: number;
  customerId?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface ServiceInvoice {
  id: string;
  invoiceNumber: string;
  dpsNumber?: string;
  customerName: string;
  customerDocument?: string;
  providerName?: string;
  amountBrl: number;
  netAmountBrl?: number;
  issWithheldBrl?: number;
  nationalTaxCode?: string;
  status: string;
  paymentStatus: string;
  competenceDate: string;
  issuedAt?: string;
}

export interface ReceivableAllocation {
  id: string;
  serviceInvoiceId: string;
  accountReceivableId: string;
  allocatedAmountBrl: number;
}

export type DivergenceKind =
  | 'fatura_sem_nfse'
  | 'nfse_sem_fatura'
  | 'alocacao_orfana'
  | 'valor_divergente'
  | 'parcela_sem_contrato'
  | 'alerta_fiscal';

export type DivergenceSeverity = 'baixa' | 'media' | 'alta' | 'critica' | 'low' | 'medium' | 'high' | 'critical';

export interface BillingDivergence {
  kind: DivergenceKind;
  severity: DivergenceSeverity;
  description: string;
  evidence: string;
  references: string[];
  exposureBrl: number;
}

export interface DelinquencyForecast {
  referenceMonth: string;
  expectedAmountBrl: number;
  overdueAmountBrl: number;
  invoicesDue: string[];
}

export interface CashFlowLine {
  category: string;
  amountBrl: number;
  nature: 'entrada' | 'saida' | 'inflow' | 'outflow';
}

export interface ReconciliationReport {
  receivablesScannedCount: number;
  contractsScannedCount: number;
  pendingCount: number;
  overdueCount: number;
  overdueAmountBrl: number;
  receivedAmountBrl: number;
  divergences: BillingDivergence[];
  forecast: DelinquencyForecast[];
  generatedAt: string;
}

export interface CashFlowReport {
  payablesScannedCount: number;
  paidAmountBrl: number;
  openAmountBrl: number;
  openingBalanceBrl: number;
  projectedBalanceBrl: number;
  accounts: FinancialAccount[];
  bankEntriesScannedCount: number;
  reconciledCount: number;
  unreconciledCount: number;
  byEntityNature: { nature: 'pj' | 'pf'; amountBrl: number }[];
  lines: CashFlowLine[];
  generatedAt: string;
}

export interface NfeAllocationReport {
  serviceInvoicesScannedCount: number;
  allocationsScannedCount: number;
  divergences: BillingDivergence[];
  fiscalExposureBrl: number;
  conformity: 'conforme' | 'divergente' | 'compliant' | 'divergent';
  generatedAt: string;
}

export interface FinanceReconcileJobResult {
  jobId: string;
  stage: 'finance';
  requiresApproval: true;
  approvalGateId: string;
  report: ReconciliationReport;
  createdAt: string;
}

export interface FinanceCashFlowJobResult {
  jobId: string;
  stage: 'finance';
  requiresApproval: false;
  report: CashFlowReport;
  createdAt: string;
}

export interface FinanceNfeAllocationJobResult {
  jobId: string;
  stage: 'finance';
  requiresApproval: false;
  report: NfeAllocationReport;
  createdAt: string;
}