import { EngineeringRepositoryPort } from '@/application/ports/engineering-repository-port';
import { ProjectTask, Project, TaskColumnStatus, TaskPriority } from '@/domain/engineering';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

/**
 * Production secondary adapter for the Engineering Repository backed by Supabase.
 *
 * Connected directly to official production database (`chronokairo-prod`).
 * Queries `project_tasks` and `projects`. Status updates to `column_status`
 * occur only after the Control Plane human approval gate has been formally approved.
 */
export class SupabaseEngineeringRepository implements EngineeringRepositoryPort {
  async listTasks(): Promise<ProjectTask[]> {
    const { data, error } = await supabaseAdmin
      .from('project_tasks')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[SupabaseEngineeringRepository] Failed to query tasks:', error?.message);
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
      console.warn('[SupabaseEngineeringRepository] Failed to query projects:', error?.message);
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
      throw new Error(`Failed to update task ${id} status: ${error.message}`);
    }
  }
}