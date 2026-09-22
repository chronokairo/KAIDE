export interface ProjectEntity {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  deadline: string;
  manager: string;
  organization_id?: string;
}

export const projectsRepository = {
  findMany: async () => [
    { id: 'proj-1', name: 'ERP 2.0 Core & DDD Migration', status: 'in_progress', progress: 78, budget: 150000, spent: 112000, deadline: '2026-10-30', manager: 'Luan Nery' },
    { id: 'proj-2', name: 'ChronoKairo AI Desktop Agent Suite', status: 'in_progress', progress: 92, budget: 85000, spent: 74000, deadline: '2026-09-15', manager: 'ChronoKairo Team' },
    { id: 'proj-3', name: 'Módulo Fiscal Automático NF-e/NFS-e', status: 'planning', progress: 30, budget: 45000, spent: 12000, deadline: '2026-11-20', manager: 'Equipe Fiscal' },
  ],
  getByOrganizationId: async (_orgId?: string): Promise<ProjectEntity[]> => [
    { id: 'proj-1', name: 'ERP 2.0 Core & DDD Migration', status: 'in_progress', progress: 78, budget: 150000, spent: 112000, deadline: '2026-10-30', manager: 'Luan Nery' },
    { id: 'proj-2', name: 'ChronoKairo AI Desktop Agent Suite', status: 'in_progress', progress: 92, budget: 85000, spent: 74000, deadline: '2026-09-15', manager: 'ChronoKairo Team' },
    { id: 'proj-3', name: 'Módulo Fiscal Automático NF-e/NFS-e', status: 'planning', progress: 30, budget: 45000, spent: 12000, deadline: '2026-11-20', manager: 'Equipe Fiscal' },
  ],
};
