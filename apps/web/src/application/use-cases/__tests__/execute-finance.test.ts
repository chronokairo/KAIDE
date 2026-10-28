import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecuteFinanceReconciliationUseCase } from '../execute-finance-reconciliation';
import { ExecuteFinanceCashFlowUseCase } from '../execute-finance-cash-flow';
import { ExecuteFinanceNfeAllocationUseCase } from '../execute-finance-nfe-allocation';
import { FinanceRepositoryPort } from '@/application/ports/finance-repository-port';
import { CompanyControlPlanePort } from '@/application/ports/company-control-plane-port';
import {
  Receivable,
  Payable,
  FinancialAccount,
  ContractSummary,
  ServiceInvoice,
  ReceivableAllocation,
} from '@/domain/finance';

describe('Módulo de Finanças & Controladoria (ADR-0037)', () => {
  let mockFinanceRepo: FinanceRepositoryPort;
  let mockControlPlane: CompanyControlPlanePort;

  const sampleReceivables: Receivable[] = [
    {
      id: 'rec-01',
      invoiceNumber: 'AUDIOMED-MRR-2026-09',
      description: 'Mensalidade da plataforma de gestão de saúde ocupacional — Audiomed',
      amountBrl: 300,
      status: 'Pendente',
      dueDate: '2026-09-30',
      customerId: 'cust-audiomed',
    },
    {
      id: 'rec-02',
      invoiceNumber: 'AUDIOMED-MRR-2026-10',
      description: 'Mensalidade da plataforma de gestão de saúde ocupacional — Audiomed',
      amountBrl: 300,
      status: 'Pendente',
      dueDate: '2026-10-31',
      customerId: 'cust-audiomed',
    },
    {
      id: 'rec-03',
      invoiceNumber: 'NFSE-RLV-1-SECPROVA-2026',
      description: '1ª parcela recebida do SecProvas',
      amountBrl: 5000,
      status: 'Pago',
      dueDate: '2026-05-04',
      receivedAt: '2026-05-12T16:00:00Z',
      receivedAmountBrl: 5000,
      customerId: 'cust-seculo',
    },
  ];

  const sampleContracts: ContractSummary[] = [
    {
      id: 'cont-01',
      contractNumber: 'AUDIOMED-SAAS-001',
      title: 'Plataforma de gestão de atendimentos e faturamento',
      status: 'Active',
      totalValueBrl: 3600,
      customerId: 'cust-audiomed',
      startDate: '2026-08-14',
      notes: 'Contrato recorrente de 300.00 BRL/mês.',
    },
  ];

  const samplePayables: Payable[] = [
    {
      id: 'pay-01',
      description: 'Pagamento de honorários advocatícios',
      amountBrl: 1000,
      status: 'Pago',
      dueDate: '2026-08-15',
      paidAt: '2026-08-15T16:00:00Z',
      paidAmountBrl: 1000,
      category: 'cat-legal',
    },
    {
      id: 'pay-02',
      description: 'Compra do domínio manausdev.com.br',
      amountBrl: 40,
      status: 'Pago',
      dueDate: '2026-08-15',
      paidAt: '2026-08-15T16:00:00Z',
      paidAmountBrl: 40,
      category: 'cat-infra',
    },
  ];

  const sampleAccounts: FinancialAccount[] = [
    {
      id: 'acc-inter',
      name: 'Banco Inter — Chronokairo/RLV — CNPJ 66.051.427/0001-27',
      type: 'Checking',
      currency: 'BRL',
      initialBalanceBrl: 0,
      currentBalanceBrl: 0,
      status: 'Active',
      entityNature: 'pj',
    },
    {
      id: 'acc-vlm',
      name: 'Conta VLM — CNPJ 59.399.090/0001-88',
      type: 'Checking',
      currency: 'BRL',
      initialBalanceBrl: 0,
      currentBalanceBrl: 0,
      status: 'Active',
      entityNature: 'pj',
    },
  ];

  const sampleInvoices: ServiceInvoice[] = [
    {
      id: 'inv-01',
      invoiceNumber: '1',
      customerName: 'Centro Educacional Século Ltda',
      customerDocument: '18.621.830/0001-00',
      amountBrl: 5000,
      netAmountBrl: 5000,
      status: 'Issued',
      paymentStatus: 'Paid',
      competenceDate: '2026-05-01',
    },
  ];

  const sampleAllocations: ReceivableAllocation[] = [
    {
      id: 'alloc-01',
      serviceInvoiceId: 'inv-01',
      accountReceivableId: 'rec-03',
      allocatedAmountBrl: 5000,
    },
  ];

  beforeEach(() => {
    mockFinanceRepo = {
      listReceivables: vi.fn().mockResolvedValue(sampleReceivables),
      listPayables: vi.fn().mockResolvedValue(samplePayables),
      listFinancialAccounts: vi.fn().mockResolvedValue(sampleAccounts),
      listContracts: vi.fn().mockResolvedValue(sampleContracts),
      listServiceInvoices: vi.fn().mockResolvedValue(sampleInvoices),
      listReceivableAllocations: vi.fn().mockResolvedValue(sampleAllocations),
      updateReceivableStatus: vi.fn().mockResolvedValue(undefined),
    };

    mockControlPlane = {
      getSnapshot: vi.fn(),
      submitJob: vi.fn().mockResolvedValue(undefined),
      approveJob: vi.fn().mockResolvedValue(undefined),
      rejectJob: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };
  });

  describe('ExecuteFinanceReconciliationUseCase (finance.reconcile)', () => {
    it('deve identificar fatura vencida da Audiomed e criar Human Approval Gate', async () => {
      const useCase = new ExecuteFinanceReconciliationUseCase(mockFinanceRepo, mockControlPlane);
      const result = await useCase.execute('2026-10-03');

      expect(result.stage).toBe('finance');
      expect(result.report.receivablesScannedCount).toBe(3);
      expect(result.report.receivedAmountBrl).toBe(5000);
      expect(result.report.pendingCount).toBe(2);
      expect(result.report.overdueCount).toBe(1);
      expect(result.report.overdueAmountBrl).toBe(300);

      // Valida alerta de inadimplência da fatura de setembro
      expect(result.report.divergences.length).toBeGreaterThan(0);
      const div = result.report.divergences.find((d) => d.references.includes('AUDIOMED-MRR-2026-09'));
      expect(div).toBeDefined();
      expect(div?.exposureBrl).toBe(300);

      // Valida Human Gate obrigatório (ADR-0028)
      expect(result.requiresApproval).toBe(true);
      expect(result.approvalGateId).toBeDefined();

      // Valida que o job foi submetido ao Control Plane com status waiting_approval
      expect(mockControlPlane.submitJob).toHaveBeenCalledTimes(1);
      const submittedJob = (mockControlPlane.submitJob as any).mock.calls[0][0];
      expect(submittedJob.status).toBe('waiting_approval');
      expect(submittedJob.approvalGate?.type).toBe('payment_release');
      expect(submittedJob.approvalGate?.requestedBy).toBe('finance');
    });
  });

  describe('ExecuteFinanceCashFlowUseCase (finance.cash_flow)', () => {
    it('deve calcular receita realizada, despesas e fluxo de caixa segregado', async () => {
      const useCase = new ExecuteFinanceCashFlowUseCase(mockFinanceRepo, mockControlPlane);
      const result = await useCase.execute();

      expect(result.stage).toBe('finance');
      expect(result.report.paidAmountBrl).toBe(1040);
      expect(result.report.projectedBalanceBrl).toBe(3960);
      expect(result.report.accounts).toHaveLength(2);
      expect(result.report.lines.length).toBeGreaterThan(0);

      expect(mockControlPlane.submitJob).toHaveBeenCalledTimes(1);
      const submittedJob = (mockControlPlane.submitJob as any).mock.calls[0][0];
      expect(submittedJob.status).toBe('completed');
    });
  });

  describe('ExecuteFinanceNfeAllocationUseCase (finance.nfe_allocation)', () => {
    it('deve auditar notas fiscais e calcular score de conformidade tributária', async () => {
      const useCase = new ExecuteFinanceNfeAllocationUseCase(mockFinanceRepo, mockControlPlane);
      const result = await useCase.execute();

      expect(result.stage).toBe('finance');
      expect(result.report.serviceInvoicesScannedCount).toBe(1);
      expect(result.report.allocationsScannedCount).toBe(1);
      expect(result.report.conformity).toBe('conforme');

      expect(mockControlPlane.submitJob).toHaveBeenCalledTimes(1);
      const submittedJob = (mockControlPlane.submitJob as any).mock.calls[0][0];
      expect(submittedJob.status).toBe('completed');
    });
  });

  describe('SupabaseFinanceRepository (Integração Oficial com chronokairo-prod)', () => {
    it('deve carregar 20 contas a receber reais e dados financeiros do Supabase oficial', async () => {
      const { SupabaseFinanceRepository } = await import('@/infrastructure/finance/supabase-finance-repository');
      const repo = new SupabaseFinanceRepository();

      const [receivables, contracts, payables, accounts, invoices, allocations] = await Promise.all([
        repo.listReceivables(),
        repo.listContracts(),
        repo.listPayables(),
        repo.listFinancialAccounts(),
        repo.listServiceInvoices(),
        repo.listReceivableAllocations(),
      ]);

      expect(receivables.length).toBe(20);
      expect(contracts.length).toBe(9);
      expect(payables.length).toBe(8);
      expect(accounts.length).toBe(3);
      expect(invoices.length).toBe(6);
      expect(allocations.length).toBe(7);

      // Verifica dados específicos da Audiomed
      const audiomedOverdue = receivables.find((r) => r.invoiceNumber === 'AUDIOMED-MRR-2026-09');
      expect(audiomedOverdue).toBeDefined();
      expect(audiomedOverdue?.amountBrl).toBe(300);
      expect(audiomedOverdue?.status).toBe('Pendente');

      // Verifica segregação das contas
      const nubank = accounts.find((a) => a.entityNature === 'pf');
      expect(nubank).toBeDefined();
      expect(nubank?.name).toContain('Nubank');

      const inter = accounts.find((a) => a.entityNature === 'pj' && a.name.includes('Inter'));
      expect(inter).toBeDefined();
    });
  });
});
