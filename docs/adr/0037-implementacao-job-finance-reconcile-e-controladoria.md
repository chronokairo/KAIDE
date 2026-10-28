# ADR-0037: Implementação do Módulo de Finanças & Controladoria (AI Finance / Ops) Conectado ao Supabase de Produção

## Status

**Aceito** (2026-10-03)

## Contexto

Conforme estabelecido no [ADR-0028](0028-empresa-virtual-de-agentes-control-plane.md) e [ADR-0036](0036-conexao-oficial-supabase-prod-e-eliminacao-de-mocks.md), a Empresa Virtual de Agentes da Chronokairo opera sob o modelo rigoroso de governança **AI → AI → AI → HUMAN**, conectada diretamente ao banco de dados oficial de produção do Supabase (`chronokairo-prod` / `your-project-ref`).

Na auditoria das 24 tabelas com dados reais, o setor financeiro revelou um ecossistema ativo composto por:
- `accounts_receivable` (20 faturas cadastradas, sendo 16 quitadas e 4 pendentes de MRR da Audiomed de R$ 300,00/mês);
- `contracts` (9 contratos, incluindo `AUDIOMED-SAAS-001` de R$ 3.600 e minutas CIESA/Século);
- `accounts_payable` (8 pagamentos realizados: honorários advocatícios R$ 1.000, domínios `chronokairo.com.br` e `manausdev.com.br`, assinaturas de IA e salários);
- `financial_accounts` (3 contas ativas: Banco Inter Chronokairo/RLV, Conta VLM e Nubank pessoal Riad);
- `service_invoices` (6 NFS-e municipais emitidas somando R$ 32.500);
- `service_invoice_receivable_allocations` (7 alocações fiscais registradas).

Fazia-se necessária a implementação dos três jobs especializados do `AI Finance / Ops` com isolamento hexagonal puro e gate humano explícito para qualquer ação financeira ou cobrança externa.

## Decisão

1. **Domínio Puro (`src/domain/finance.ts`)**:
   - Definição estrita das entidades `Receivable`, `Payable`, `FinancialAccount`, `ContractSummary`, `ServiceInvoice`, `ReceivableAllocation`, `BillingDivergence`, `DelinquencyForecast`, `ReconciliationReport`, `CashFlowReport` e `NfeAllocationReport`.
   - Zero dependências de frameworks, React ou SDKs do Supabase na camada de domínio.

2. **Porta Secundária (`src/application/ports/finance-repository-port.ts`)**:
   - Contratos para listar faturas a receber, contas a pagar, contas financeiras, contratos, NFS-e e alocações, além da mutação segura de status de recebimento.

3. **Adaptador Supabase de Produção (`src/infrastructure/finance/supabase-finance-repository.ts`)**:
   - Consulta e persiste diretamente nas tabelas `accounts_receivable`, `accounts_payable`, `financial_accounts`, `contracts`, `service_invoices` e `service_invoice_receivable_allocations` utilizando `supabaseAdmin` com segregação estrita por `PROD_ORGANIZATION_ID` (`00000000-0000-4000-8000-000000000001`).

4. **Casos de Uso Implementados**:
   - **`ExecuteFinanceReconciliationUseCase` (`finance.reconcile`)**:
     - Audita faturas a receber e cruza com contratos ativos.
     - Identifica inadimplência (fatura `AUDIOMED-MRR-2026-09` vencida em 30/09/2026).
     - Emite alerta de cobrança com chave PIX do Banco Inter CNPJ 66.051.427/0001-27.
     - Gera `ApprovalGate` de tipo `payment_release`, exigindo aprovação manual do Diretor antes de qualquer comunicação externa.
   - **`ExecuteFinanceCashFlowUseCase` (`finance.cash_flow`)**:
     - Consolida entradas (R$ 78.340,00) e saídas (R$ 1.938,06), calculando resultado líquido e segregando movimentações por pessoa jurídica (`RLV` e `VLM`) e física (`Nubank Riad`).
   - **`ExecuteFinanceNfeAllocationUseCase` (`finance.nfe_allocation`)**:
     - Cruza notas fiscais municipais com contas a receber e aponta faturas quitadas sem nota fiscal vinculada.

5. **Interface de Acompanhamento (`CompanyMonitor.tsx`)**:
   - Botão interativo `Job: finance.reconcile` no cabeçalho minimalista da interface Three.js.
   - Modal de aprovação humana com suporte ao gate `payment_release`.

## Consequências

- O `AI Finance / Ops` opera de ponta a ponta sobre os dados reais da Chronokairo Corp.
- Nenhuma fatura é cobrada ou baixada sem o selo de auditoria humana do Diretor Técnico.
- Conformidade tributária e conciliação bancária monitoradas em tempo real na cena Three.js.
