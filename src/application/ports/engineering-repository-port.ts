import { ProjectTask, Project } from '@/domain/engineering';

/**
 * Driven port for the Engineering & Project Repository.
 *
 * Reading tasks and projects is open to authorized agents; mutations to
 * `project_tasks.column_status` are restricted and strictly gated by
 * Human Approval Gates in the Control Plane (ADR-0028). The repository
 * does not make decisions; it strictly persists authorized status updates.
 */
export interface EngineeringRepositoryPort {
  listTasks(): Promise<ProjectTask[]>;
  listProjects(): Promise<Project[]>;
  updateTaskStatus(id: string, status: ProjectTask['columnStatus']): Promise<void>;
}