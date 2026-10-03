import { ProjectTask, Project } from '@/domain/engineering';

/**
 * Porta Secundária (Driven Port) do Repositório de Engenharia.
 *
 * A leitura é livre; a escrita em `project_tasks.column_status` é a única
 * mutação autorizada e continua sendo gated por aprovação humana no Control
 * Plane (ADR-0028) — a porta não decide, apenas persiste o que foi aprovado.
 */
export interface EngineeringRepositoryPort {
  listTasks(): Promise<ProjectTask[]>;
  listProjects(): Promise<Project[]>;
  updateTaskStatus(id: string, status: ProjectTask['columnStatus']): Promise<void>;
}