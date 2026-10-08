import type { AiToolDefinition, DomainToolMetadata } from './types';
import { projectsRepository } from '@/modules/projetos/repositories/projects.repository';

const metadata = (namespace: string): DomainToolMetadata => ({ namespace, domain: 'projects', sensitivity: 'confidential', contractVersion: 'v1' });
const readRoles = ['owner', 'admin', 'operator', 'viewer', 'billing'] as const;

export const projectsTools: AiToolDefinition[] = [
  {
    name: 'projects.list',
    description: 'Lista todos os projetos da organização com status e receita.',
    domain: 'ProjectsTimesheet',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('projects.list'),
    handler: async (rawInput, ctx) => {
      const input = (rawInput ?? {}) as { status?: string };
      let rows = await projectsRepository.getByOrganizationId(ctx.organizationId);
      if (input.status) rows = rows.filter((r: any) => r.status === input.status);
      return rows;
    },
  },
  {
    name: 'projects.summary',
    description: 'Gera resumo dos projetos com totais por status e receita.',
    domain: 'ProjectsTimesheet',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('projects.summary'),
    handler: async (_input, ctx) => {
      const projects: any[] = await projectsRepository.getByOrganizationId(ctx.organizationId);

      const byStatus = {
        Active: projects.filter((p: any) => p.status === 'Active' || p.status === 'in_progress'),
        'On Hold': projects.filter((p: any) => p.status === 'On Hold' || p.status === 'planning'),
        Completed: projects.filter((p: any) => p.status === 'Completed'),
        Archived: projects.filter((p: any) => p.status === 'Archived'),
      };

      const activeProjects = byStatus.Active;
      const totalRevenue = projects.reduce((sum: number, p: any) => sum + (p.known_revenue || p.budget || 0), 0);
      const activeRevenue = activeProjects.reduce((sum: number, p: any) => sum + (p.known_revenue || p.budget || 0), 0);

      return {
        totalProjects: projects.length,
        totalRevenue,
        activeRevenue,
        byStatus: Object.entries(byStatus).map(([status, items]) => ({
          status,
          count: items.length,
          revenue: items.reduce((sum: number, p: any) => sum + (p.known_revenue || p.budget || 0), 0),
        })),
      };
    },
  },
  {
    name: 'projects.at_risk',
    description: 'Lista projetos com possíveis problemas (sem receita ou em standby).',
    domain: 'ProjectsTimesheet',
    executionType: 'READ',
    requiredRole: [...readRoles],
    metadata: metadata('projects.at_risk'),
    handler: async (_input, ctx) => {
      const projects: any[] = await projectsRepository.getByOrganizationId(ctx.organizationId);

      return projects
        .filter((p: any) => p.status === 'in_progress' || p.status === 'Active')
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          customer: p.customers?.name || p.manager || 'N/A',
          revenue: p.known_revenue || p.budget || 0,
          startDate: p.start_date || p.deadline,
          endDate: p.end_date || p.deadline,
        }));
    },
  },
];

export const PROJECTS_DOMAIN_TOOLS = projectsTools;
