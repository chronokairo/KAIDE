import { EngineeringRepositoryPort } from '@/application/ports/engineering-repository-port';
import { ProjectTask, Project, TaskColumnStatus, TaskPriority } from '@/domain/engineering';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

/**
 * Adaptador Secundário Real do Supabase para o Repositório de Engenharia.
 *
 * Conectado ao Supabase de Produção (chronokairo-prod / eufyppwpnxmxeinabwyi).
 * Consome `project_tasks` e `projects`. A única escrita — `column_status` —
 * só ocorre quando o Control Plane já marcou o gate como `approved`.
 */
export class SupabaseEngineeringRepository implements EngineeringRepositoryPort {
  async listTasks(): Promise<ProjectTask[]> {
    const { data, error } = await supabaseAdmin
      .from('project_tasks')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[SupabaseEngineeringRepository] Falha ao listar tarefas:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      code: row.code || row.id.slice(0, 8),
      title: row.title || '',
      columnStatus: (row.column_status || 'To Do') as TaskColumnStatus,
      priority: (row.priority || 'MED') as TaskPriority,
      projectId: row.project_id || undefined,
      assignedUserId: row.assigned_user_id || undefined,
      updatedAt: row.updated_at || undefined,
    }));
  }

  async listProjects(): Promise<Project[]> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('code', { ascending: true });

    if (error || !data) {
      console.warn('[SupabaseEngineeringRepository] Falha ao listar projetos:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      code: row.code || row.id.slice(0, 8),
      name: row.name || '',
      status: row.status || 'Active',
      customerId: row.customer_id || undefined,
      description: row.description || undefined,
      startDate: row.start_date || undefined,
      endDate: row.end_date || undefined,
    }));
  }

  async updateTaskStatus(id: string, status: TaskColumnStatus): Promise<void> {
    const { error } = await supabaseAdmin
      .from('project_tasks')
      .update({ column_status: status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', PROD_ORGANIZATION_ID);

    if (error) {
      throw new Error(`Falha ao sincronizar status da tarefa ${id}: ${error.message}`);
    }
  }
}