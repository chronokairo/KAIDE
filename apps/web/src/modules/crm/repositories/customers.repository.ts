export interface OpportunityEntity {
  id: string;
  title: string;
  value: number;
  stage: string;
  stage_id?: string;
  probability: number;
  win_probability?: number;
  status?: string;
  customer: string;
  organization_id?: string;
}

export interface CustomerEntity {
  id: string;
  name: string;
  email: string;
  status: string;
  segment?: string;
  organization_id?: string;
  created_at: string;
}

export interface LeadEntity {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  score?: number;
  stage?: string;
  organization_id?: string;
}

export const customersRepository = {
  findMany: async () => [
    { id: 'cust-1', name: 'TechCorp Brasil', email: 'contato@techcorp.com.br', status: 'active', segment: 'Enterprise', created_at: new Date().toISOString() },
    { id: 'cust-2', name: 'Global Logistics S/A', email: 'adm@globallog.com', status: 'active', segment: 'Logística', created_at: new Date().toISOString() },
    { id: 'cust-3', name: 'Varejo Express', email: 'financeiro@varejoexp.com.br', status: 'active', segment: 'Varejo', created_at: new Date().toISOString() },
  ],
  getByOrganizationId: async (_orgId?: string): Promise<CustomerEntity[]> => [
    { id: 'cust-1', name: 'TechCorp Brasil', email: 'contato@techcorp.com.br', status: 'active', segment: 'Enterprise', created_at: new Date().toISOString() },
    { id: 'cust-2', name: 'Global Logistics S/A', email: 'adm@globallog.com', status: 'active', segment: 'Logística', created_at: new Date().toISOString() },
    { id: 'cust-3', name: 'Varejo Express', email: 'financeiro@varejoexp.com.br', status: 'active', segment: 'Varejo', created_at: new Date().toISOString() },
  ],
  getById: async (id: string): Promise<CustomerEntity | null> => ({
    id,
    name: 'TechCorp Brasil',
    email: 'contato@techcorp.com.br',
    status: 'active',
    segment: 'Enterprise',
    created_at: new Date().toISOString(),
  }),
  create: async (data: any): Promise<CustomerEntity> => ({ id: `cust-${Date.now()}`, name: data.name || 'Novo Cliente', email: data.email || '', status: 'active', created_at: new Date().toISOString(), ...data }),
  update: async (id: string, data: any): Promise<CustomerEntity> => ({ id, name: data.name || 'Cliente Atualizado', email: data.email || '', status: 'active', created_at: new Date().toISOString(), ...data }),
};

export const leadsRepository = {
  findMany: async () => [
    { id: 'lead-1', name: 'InovaHealth', contact: 'Dra. Camila', email: 'camila@inovahealth.com.br', score: 85, stage: 'Qualificação' },
    { id: 'lead-2', name: 'Alpha Finanças', contact: 'Rodrigo Lima', email: 'rodrigo@alphafin.com', score: 92, stage: 'Negociação' },
  ],
  getByOrganizationId: async (_orgId?: string): Promise<LeadEntity[]> => [
    { id: 'lead-1', name: 'InovaHealth', contact: 'Dra. Camila', email: 'camila@inovahealth.com.br', score: 85, stage: 'Qualificação' },
    { id: 'lead-2', name: 'Alpha Finanças', contact: 'Rodrigo Lima', email: 'rodrigo@alphafin.com', score: 92, stage: 'Negociação' },
  ],
  create: async (data: any): Promise<LeadEntity> => ({ id: `lead-${Date.now()}`, ...data }),
};

export const opportunitiesRepository = {
  findMany: async () => [
    { id: 'opp-1', title: 'Implantação ERP SaaS Multi-empresa', value: 120000, stage: 'Proposta Enviada', stage_id: 'stage-1', probability: 0.8, win_probability: 80, status: 'Open', customer: 'TechCorp Brasil' },
    { id: 'opp-2', title: 'Módulo de BI e Análise Preditiva', value: 45000, stage: 'Negociação', stage_id: 'stage-2', probability: 0.9, win_probability: 90, status: 'Open', customer: 'Global Logistics' },
    { id: 'opp-3', title: 'Consultoria de Migração Cloud', value: 28000, stage: 'Fechado Ganho', stage_id: 'stage-3', probability: 1.0, win_probability: 100, status: 'Won', customer: 'Varejo Express' },
  ],
  getByOrganizationId: async (_orgId?: string): Promise<OpportunityEntity[]> => [
    { id: 'opp-1', title: 'Implantação ERP SaaS Multi-empresa', value: 120000, stage: 'Proposta Enviada', stage_id: 'stage-1', probability: 0.8, win_probability: 80, status: 'Open', customer: 'TechCorp Brasil' },
    { id: 'opp-2', title: 'Módulo de BI e Análise Preditiva', value: 45000, stage: 'Negociação', stage_id: 'stage-2', probability: 0.9, win_probability: 90, status: 'Open', customer: 'Global Logistics' },
    { id: 'opp-3', title: 'Consultoria de Migração Cloud', value: 28000, stage: 'Fechado Ganho', stage_id: 'stage-3', probability: 1.0, win_probability: 100, status: 'Won', customer: 'Varejo Express' },
  ],
  getContext: async (_orgId?: string) => ({
    stages: [
      { id: 'stage-1', name: 'Qualificação' },
      { id: 'stage-2', name: 'Proposta / Negociação' },
      { id: 'stage-3', name: 'Fechado Ganho' },
    ],
  }),
  create: async (data: any): Promise<OpportunityEntity> => ({ id: `opp-${Date.now()}`, stage: 'Proposta Enviada', status: 'Open', win_probability: 50, ...data }),
};
