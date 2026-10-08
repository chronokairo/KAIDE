export interface FinancialAccountEntity {
  id: string;
  name: string;
  balance: number;
  type: string;
  currency: string;
  organization_id?: string;
}

export interface AccountPayableEntity {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  due_date?: string;
  status: string;
  supplier: string;
  organization_id?: string;
}

export interface AccountReceivableEntity {
  id: string;
  customer: string;
  amount: number;
  dueDate: string;
  due_date?: string;
  status: string;
  organization_id?: string;
}

export interface ContractEntity {
  id: string;
  client: string;
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  status: string;
}

export const financeAccountsRepository = {
  findMany: async () => [
    { id: 'acc-1', name: 'Itaú Empresas Principal', balance: 342500.0, type: 'checking', currency: 'BRL' },
    { id: 'acc-2', name: 'Bradesco Operacional', balance: 118400.0, type: 'checking', currency: 'BRL' },
    { id: 'acc-3', name: 'Reserva de Emergência Tesouro', balance: 500000.0, type: 'investment', currency: 'BRL' },
  ],
  getByOrganizationId: async (_orgId?: string): Promise<FinancialAccountEntity[]> => [
    { id: 'acc-1', name: 'Itaú Empresas Principal', balance: 342500.0, type: 'checking', currency: 'BRL' },
    { id: 'acc-2', name: 'Bradesco Operacional', balance: 118400.0, type: 'checking', currency: 'BRL' },
    { id: 'acc-3', name: 'Reserva de Emergência Tesouro', balance: 500000.0, type: 'investment', currency: 'BRL' },
  ],
};

export const accountsPayableRepository = {
  findMany: async () => [
    { id: 'ap-1', description: 'Servidores AWS Cloud', amount: 14500.0, dueDate: '2026-09-10', status: 'pending', supplier: 'Amazon AWS' },
    { id: 'ap-2', description: 'Licenças JetBrains & GitHub', amount: 3200.0, dueDate: '2026-09-15', status: 'pending', supplier: 'GitHub Inc' },
    { id: 'ap-3', description: 'Aluguel Escritório SP', amount: 18000.0, dueDate: '2026-09-05', status: 'paid', supplier: 'Imobiliária Prime' },
  ],
  getByOrganizationId: async (_orgId?: string): Promise<AccountPayableEntity[]> => [
    { id: 'ap-1', description: 'Servidores AWS Cloud', amount: 14500.0, dueDate: '2026-09-10', status: 'pending', supplier: 'Amazon AWS' },
    { id: 'ap-2', description: 'Licenças JetBrains & GitHub', amount: 3200.0, dueDate: '2026-09-15', status: 'pending', supplier: 'GitHub Inc' },
    { id: 'ap-3', description: 'Aluguel Escritório SP', amount: 18000.0, dueDate: '2026-09-05', status: 'paid', supplier: 'Imobiliária Prime' },
  ],
  settle: async (id: string, data: any) => ({ id, status: 'paid', ...data }),
};

export const accountsReceivableRepository = {
  findMany: async () => [
    { id: 'ar-1', customer: 'TechCorp Brasil', amount: 45000.0, dueDate: '2026-09-05', status: 'pending' },
    { id: 'ar-2', customer: 'Global Logistics S/A', amount: 32000.0, dueDate: '2026-09-12', status: 'pending' },
    { id: 'ar-3', customer: 'Varejo Express', amount: 12500.0, dueDate: '2026-08-25', status: 'overdue' },
  ],
  getByOrganizationId: async (_orgId?: string): Promise<AccountReceivableEntity[]> => [
    { id: 'ar-1', customer: 'TechCorp Brasil', amount: 45000.0, dueDate: '2026-09-05', status: 'pending' },
    { id: 'ar-2', customer: 'Global Logistics S/A', amount: 32000.0, dueDate: '2026-09-12', status: 'pending' },
    { id: 'ar-3', customer: 'Varejo Express', amount: 12500.0, dueDate: '2026-08-25', status: 'overdue' },
  ],
};

export const contractsRepository = {
  findMany: async () => [
    { id: 'cnt-1', client: 'TechCorp Brasil', title: 'Contrato Master de Licenciamento', value: 540000.0, startDate: '2025-01-01', endDate: '2026-12-31', status: 'active' },
    { id: 'cnt-2', client: 'Global Logistics S/A', title: 'Suporte 24/7 e SLA 99.9%', value: 180000.0, startDate: '2025-06-01', endDate: '2026-06-01', status: 'active' },
  ],
  getByOrganizationId: async (_orgId?: string): Promise<ContractEntity[]> => [
    { id: 'cnt-1', client: 'TechCorp Brasil', title: 'Contrato Master de Licenciamento', value: 540000.0, startDate: '2025-01-01', endDate: '2026-12-31', status: 'active' },
    { id: 'cnt-2', client: 'Global Logistics S/A', title: 'Suporte 24/7 e SLA 99.9%', value: 180000.0, startDate: '2025-06-01', endDate: '2026-06-01', status: 'active' },
  ],
};
