import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { getEventBus } from './events';

const bus = getEventBus('pipeline-service');

// ─── Types ───────────────────────────────────────────────────

export type AgentRole =
  | 'product-manager'
  | 'architect'
  | 'organizer'
  | 'git'
  | 'dead-code'
  | 'troubleshooter'
  | 'backend'
  | 'frontend'
  | 'devops'
  | 'qa'
  | 'code-review';

export type PhaseStatus = 'pending' | 'in-progress' | 'awaiting-approval' | 'approved' | 'completed' | 'failed';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'blocked';
export type PipelineStatus = 'active' | 'completed' | 'failed';

/** Template the PM returns for each phase */
export interface PhaseTemplate {
  name: string;
  order: number;
  parallel: boolean;
  agents: AgentRole[];
  taskDescriptions?: Record<string, { title: string; description: string }>;
}

export interface AgentTask {
  id: string;
  agent: AgentRole;
  title: string;
  description: string;
  status: TaskStatus;
  output?: string;
  artifacts?: string[];
  startedAt?: string;
  completedAt?: string;
}

export interface PipelinePhase {
  id: string;
  name: string;
  order: number;
  parallel: boolean;
  requiresApproval: boolean;
  status: PhaseStatus;
  agents: AgentRole[];
  tasks: AgentTask[];
  approvedAt?: string;
  approvedBy?: string;
}

export interface Pipeline {
  id: string;
  projectId: string;
  workspace: string;
  objective: string;
  status: PipelineStatus;
  currentPhase: number;
  phases: PipelinePhase[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  /** If this is a diagnostic sub-pipeline, references the parent */
  parentPipelineId?: string;
  parentTaskId?: string;
}

// ─── Agent metadata ──────────────────────────────────────────

export const AGENT_META: Record<AgentRole, { label: string; description: string }> = {
  'product-manager': {
    label: 'Product Manager',
    description: 'Transforma o objetivo em requisitos estruturados, criterios de aceite e backlog priorizado.',
  },
  'architect': {
    label: 'Architect',
    description: 'Define stack, estrutura de pastas, contratos de API e modelo de dados.',
  },
  'backend': {
    label: 'Backend Engineer',
    description: 'Implementa endpoints, regras de negocio, migrations e integracoes.',
  },
  'frontend': {
    label: 'Frontend Engineer',
    description: 'Cria componentes, telas, integra com a API do backend.',
  },
  'devops': {
    label: 'DevOps Engineer',
    description: 'Configura CI/CD, Dockerfile, variaveis de ambiente, deploy.',
  },
  'qa': {
    label: 'QA Engineer',
    description: 'Escreve e roda testes unitarios e de integracao, reporta bugs.',
  },
  'code-review': {
    label: 'Code Reviewer',
    description: 'Revisao final: padroes de codigo, seguranca, performance, consistencia.',
  },
  'organizer': {
    label: 'Organizer',
    description: 'Consulta o PM para definir o design pattern ideal, organiza pastas e arquivos conforme o padrao escolhido.',
  },
  'git': {
    label: 'Git Agent',
    description: 'Gerencia o repositorio Git: cria branch, faz stage, commit com mensagem descritiva, push e abre PR no GitHub.',
  },
  'dead-code': {
    label: 'Dead Code Cleaner',
    description: 'Analisa o mapa de conexoes do codigo, identifica arquivos orfaos, exports nao usados, funcoes mortas e remove tudo que e lixo.',
  },
  'troubleshooter': {
    label: 'Troubleshooter',
    description: 'Agente especialista em diagnosticar e corrigir falhas. Analisa o feedback do PM, identifica o problema no workspace e aplica a correcao diretamente usando write_file. Resolve em uma unica execucao, sem loop.',
  },
};

// ─── Default phase templates ─────────────────────────────────

function createDefaultPhases(): PhaseTemplate[] {
  return [
    { name: 'Planning', order: 0, parallel: false, agents: ['product-manager'] },
    { name: 'Architecture', order: 1, parallel: false, agents: ['architect'] },
    { name: 'Implementation', order: 2, parallel: true, agents: ['backend', 'frontend', 'devops'] },
    { name: 'Testing', order: 3, parallel: false, agents: ['qa'] },
    { name: 'Code Review', order: 4, parallel: false, agents: ['code-review'] },
  ];
}

/** Default task descriptions per role (fallback when PM doesn't specify) */
const DEFAULT_TASK_DESCRIPTIONS: Record<AgentRole, (obj: string) => { title: string; description: string }> = {
  'product-manager': (obj) => ({
    title: 'Define requirements & backlog',
    description: `Analyze the objective: "${obj}"\n\nProduce:\n1. Structured requirements\n2. Acceptance criteria\n3. Prioritized backlog\n4. User stories`,
  }),
  'architect': () => ({
    title: 'Design technical architecture',
    description: 'Based on the PM requirements, design:\n1. Technology stack\n2. Folder/project structure\n3. API contracts\n4. Data model\n5. Integration points',
  }),
  'backend': () => ({
    title: 'Implement backend',
    description: 'Follow the architecture document to implement:\n1. API endpoints\n2. Business logic\n3. Database migrations\n4. External integrations',
  }),
  'frontend': () => ({
    title: 'Implement frontend',
    description: 'Follow the architecture document to implement:\n1. UI components\n2. Pages/screens\n3. API integration\n4. State management',
  }),
  'devops': () => ({
    title: 'Setup infrastructure',
    description: 'Configure:\n1. CI/CD pipeline\n2. Dockerfile / container setup\n3. Environment variables\n4. Deployment scripts',
  }),
  'qa': () => ({
    title: 'Test & validate',
    description: 'Write and execute:\n1. Unit tests\n2. Integration tests\n3. Bug reports with full context\n4. Test coverage report',
  }),
  'code-review': () => ({
    title: 'Final code review',
    description: 'Review for:\n1. Code patterns & standards\n2. Security vulnerabilities\n3. Performance issues\n4. Architecture consistency\n5. Merge readiness',
  }),
  'organizer': (obj) => ({
    title: 'Organize project structure',
    description: `Para o objetivo: "${obj}"\n\n1. Analise a estrutura atual de pastas e arquivos (list_files, read_file)\n2. Identifique a stack (package.json, tsconfig, etc) e DECIDA o design pattern ideal\n3. Reorganize pastas/arquivos conforme o pattern escolhido\n4. Corrija nomes inconsistentes, arquivos soltos, pastas baguncadas\n5. Atualize imports quebrados\n6. Escreva REORGANIZATION.md com as mudancas\nNOTA: NAO consulte o PM. Decida o pattern sozinho. NAO faca git add/commit/push.`,
  }),
  'git': (obj) => ({
    title: 'Git: commit, push, merge na main',
    description: `Finalize o repositorio para o objetivo: "${obj}"\n\n1. git add -A (stage todas as mudancas)\n2. Crie feature branch descritiva\n3. Commit com conventional commits (feat:, fix:, refactor:)\n4. git push -u origin <branch>\n5. Abra PR no GitHub usando gh cli\n6. Merge na main: git checkout main && git pull && git merge <branch> --no-ff && git push\n7. Se houver conflitos de merge, resolva-os (read_file + write_file)\n8. Delete feature branch local e remota\nIMPORTANTE: Use run_command para TODOS os comandos git.`,
  }),
  'dead-code': () => ({
    title: 'Remover codigo morto',
    description: 'Analise o CODE_MAP fornecido nos outputs anteriores e:\n1. Identifique arquivos orfaos (sem import de/para nenhum outro)\n2. Identifique exports que ninguem importa\n3. Identifique funcoes/classes/variaveis declaradas mas nunca referenciadas\n4. Delete arquivos inteiros se forem 100%% lixo (run_command: rm/del)\n5. Remova exports/funcoes mortas de arquivos que ainda tem codigo vivo (write_file)\n6. NAO delete arquivos de config, testes, ou entrypoints',
  }),
  'troubleshooter': (obj) => ({
    title: 'Diagnosticar e corrigir falha',
    description: `Analise o problema reportado pelo PM e corrija diretamente:\n1. Leia o feedback do PM e o output do agente que falhou\n2. Use list_files e read_file para entender o estado atual\n3. Identifique a causa raiz\n4. Use write_file para aplicar TODAS as correcoes necessarias\n5. Valide que os arquivos foram criados/corrigidos`,
  }),
};

function createTasksForPhase(
  agents: AgentRole[],
  objective: string,
  customDescriptions?: Record<string, { title: string; description: string }>,
): AgentTask[] {
  return agents.map(agent => {
    // Use PM-provided description if available, then fallback to defaults
    const custom = customDescriptions?.[agent];
    const { title, description } = custom || DEFAULT_TASK_DESCRIPTIONS[agent](objective);
    return {
      id: crypto.randomUUID(),
      agent,
      title,
      description,
      status: 'pending' as TaskStatus,
    };
  });
}

// ─── Storage ─────────────────────────────────────────────────

function getPipelinesDir(projectId: string): string {
  const dir = path.join(os.homedir(), '.anamnesic', 'pipelines', projectId);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.error(`[Anamnesic] Cannot create pipelines dir ${dir}: ${(err as Error).message}`);
  }
  return dir;
}

function savePipeline(p: Pipeline): void {
  const dir = getPipelinesDir(p.projectId);
  const file = path.join(dir, `${p.id}.json`);
  fs.writeFileSync(file, JSON.stringify(p, null, 2), 'utf-8');
}

function loadPipeline(projectId: string, pipelineId: string): Pipeline | null {
  const file = path.join(getPipelinesDir(projectId), `${pipelineId}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.error(`[Anamnesic] Failed to parse pipeline ${pipelineId}: ${(err as Error).message}`);
    return null;
  }
}

// ─── PipelineService ─────────────────────────────────────────

export class PipelineService {
  /** Create a new pipeline from an objective.
   *  If `customPhases` is provided (from PM planning), those are used instead of the default 5. */
  create(projectId: string, objective: string, workspace: string, customPhases?: PhaseTemplate[]): Pipeline {
    const id = crypto.randomUUID();
    const phaseTemplates = customPhases || createDefaultPhases();

    const phases: PipelinePhase[] = phaseTemplates.map((pt, idx) => {
      const phaseId = crypto.randomUUID();
      return {
        name: pt.name,
        order: pt.order ?? idx,
        parallel: pt.parallel,
        requiresApproval: true,
        status: 'pending' as PhaseStatus,
        agents: pt.agents,
        id: phaseId,
        tasks: createTasksForPhase(pt.agents, objective, pt.taskDescriptions),
      };
    });

    // First phase starts automatically
    phases[0].status = 'in-progress';
    phases[0].tasks.forEach(t => { t.status = 'pending'; });

    const pipeline: Pipeline = {
      id,
      projectId,
      workspace,
      objective,
      status: 'active',
      currentPhase: 0,
      phases,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    savePipeline(pipeline);
    bus.emit('pipeline:created', {
      projectId, pipelineId: id,
      data: { objective, phaseCount: phases.length },
    });
    return pipeline;
  }

  /** Get a pipeline by ID */
  get(projectId: string, pipelineId: string): Pipeline | null {
    return loadPipeline(projectId, pipelineId);
  }

  /** Persist a pipeline object to disk */
  save(pipeline: Pipeline): void {
    savePipeline(pipeline);
  }

  /** List all pipelines for a project */
  list(projectId: string): Pipeline[] {
    const dir = getPipelinesDir(projectId);
    let files: string[];
    try {
      files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    } catch {
      return [];
    }
    const results: Pipeline[] = [];
    for (const f of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        results.push(data);
      } catch (err) {
        console.error(`[Anamnesic] Skipping corrupted pipeline file ${f}: ${(err as Error).message}`);
      }
    }
    return results;
  }

  /** Get the active pipeline for a project (most recent non-completed) */
  getActive(projectId: string): Pipeline | null {
    const all = this.list(projectId);
    return all.find(p => p.status !== 'completed' && p.status !== 'failed') || null;
  }

  /** Get all failed pipelines for a project */
  getFailed(projectId: string): Pipeline[] {
    return this.list(projectId).filter(p => p.status === 'failed');
  }

  /** Resume a failed pipeline — reset status to active and prepare the failed phase for re-run */
  resumeFailed(projectId: string, pipelineId: string): Pipeline | null {
    const p = this.get(projectId, pipelineId);
    if (!p || p.status !== 'failed') return null;

    // Reset pipeline status
    p.status = 'active';

    // Find the failed phase (or current phase) and reset it
    const phase = p.phases[p.currentPhase];
    if (phase) {
      if (phase.status === 'failed') {
        phase.status = 'in-progress';
      }
      // Reset failed/in-progress tasks to pending so they re-run
      for (const task of phase.tasks) {
        if (task.status === 'failed' || task.status === 'in-progress') {
          task.status = 'pending';
          task.startedAt = undefined;
          task.completedAt = undefined;
          task.output = undefined;
        }
      }
    }

    p.updatedAt = new Date().toISOString();
    savePipeline(p);
    bus.emit('pipeline:resumed', {
      projectId, pipelineId,
      phaseIndex: p.currentPhase,
    });
    return p;
  }

  /** Get tasks for a specific agent role in the current phase */
  getAgentTasks(projectId: string, pipelineId: string, agent: AgentRole): AgentTask[] {
    const p = this.get(projectId, pipelineId);
    if (!p) return [];
    const phase = p.phases[p.currentPhase];
    if (!phase) return [];
    return phase.tasks.filter(t => t.agent === agent);
  }

  /** Reset in-progress tasks to pending so they can be re-run (for resume after restart) */
  resetStaleTasks(projectId: string, pipelineId: string): Pipeline | null {
    const p = this.get(projectId, pipelineId);
    if (!p) return null;

    const phase = p.phases[p.currentPhase];
    if (!phase || phase.status !== 'in-progress') return p;

    let changed = false;
    for (const task of phase.tasks) {
      if (task.status === 'in-progress') {
        task.status = 'pending';
        task.startedAt = undefined;
        changed = true;
      }
    }

    if (changed) {
      p.updatedAt = new Date().toISOString();
      savePipeline(p);
    }
    return p;
  }

  /** Start working on a task */
  startTask(projectId: string, pipelineId: string, taskId: string): Pipeline | null {
    const p = this.get(projectId, pipelineId);
    if (!p) return null;

    for (const phase of p.phases) {
      const task = phase.tasks.find(t => t.id === taskId);
      if (task) {
        if (task.status !== 'pending') return p; // already started
        task.status = 'in-progress';
        task.startedAt = new Date().toISOString();
        p.updatedAt = new Date().toISOString();
        savePipeline(p);
        bus.emit('pipeline:task:started', {
          projectId, pipelineId, taskId,
          data: { agent: task.agent, title: task.title },
        });
        return p;
      }
    }
    return p;
  }

  /** Complete a task with output and optionally list of artifacts (files) */
  completeTask(projectId: string, pipelineId: string, taskId: string, output: string, artifacts?: string[]): Pipeline | null {
    const p = this.get(projectId, pipelineId);
    if (!p) return null;

    const phase = p.phases[p.currentPhase];
    if (!phase) return p;

    const task = phase.tasks.find(t => t.id === taskId);
    if (!task) return p;

    task.status = 'completed';
    task.output = output;
    task.artifacts = artifacts;
    task.completedAt = new Date().toISOString();
    p.updatedAt = new Date().toISOString();

    // Check if all tasks in the phase are completed
    const allDone = phase.tasks.every(t => t.status === 'completed');
    if (allDone) {
      phase.status = phase.requiresApproval ? 'awaiting-approval' : 'completed';
      if (!phase.requiresApproval) {
        this._advancePhase(p);
      }
    }

    savePipeline(p);
    bus.emit('pipeline:task:completed', {
      projectId, pipelineId, taskId,
      phaseIndex: p.currentPhase,
      data: { agent: task.agent, allDone, phaseStatus: phase.status },
    });
    if (allDone) {
      bus.emit('pipeline:phase:completed', {
        projectId, pipelineId,
        phaseIndex: p.currentPhase,
        data: { phaseName: phase.name, status: phase.status },
      });
    }
    return p;
  }

  /** Fail a task with reason */
  failTask(projectId: string, pipelineId: string, taskId: string, reason: string): Pipeline | null {
    const p = this.get(projectId, pipelineId);
    if (!p) return null;

    for (const phase of p.phases) {
      const task = phase.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = 'failed';
        task.output = reason;
        task.completedAt = new Date().toISOString();
        phase.status = 'failed';
        p.status = 'failed';
        p.updatedAt = new Date().toISOString();
        savePipeline(p);
        bus.emit('pipeline:task:failed', {
          projectId, pipelineId, taskId,
          data: { agent: task.agent, reason },
        });
        bus.emit('pipeline:failed', {
          projectId, pipelineId,
          data: { reason, failedTask: task.agent },
        });
        return p;
      }
    }
    return p;
  }

  /** Programmer approves the current phase, advancing to the next */
  approvePhase(projectId: string, pipelineId: string, approver: string = 'programmer'): Pipeline | null {
    const p = this.get(projectId, pipelineId);
    if (!p) return null;

    const phase = p.phases[p.currentPhase];
    if (!phase || phase.status !== 'awaiting-approval') return p;

    phase.status = 'approved';
    phase.approvedAt = new Date().toISOString();
    phase.approvedBy = approver;
    p.updatedAt = new Date().toISOString();

    this._advancePhase(p);
    savePipeline(p);
    bus.emit('pipeline:phase:approved', {
      projectId, pipelineId,
      phaseIndex: p.currentPhase - 1,
      data: { approver, nextPhase: p.currentPhase, pipelineStatus: p.status },
    });
    if (p.status === 'completed') {
      bus.emit('pipeline:completed', { projectId, pipelineId });
    }
    return p;
  }

  /** Reject phase — sends it back to in-progress with feedback */
  rejectPhase(projectId: string, pipelineId: string, feedback: string): Pipeline | null {
    const p = this.get(projectId, pipelineId);
    if (!p) return null;

    const phase = p.phases[p.currentPhase];
    if (!phase || phase.status !== 'awaiting-approval') return p;

    // Reset tasks to pending so agents can redo them
    phase.status = 'in-progress';
    phase.tasks.forEach(t => {
      t.status = 'pending';
      t.output = (t.output || '') + `\n\n--- FEEDBACK ---\n${feedback}`;
      t.completedAt = undefined;
    });
    p.updatedAt = new Date().toISOString();
    savePipeline(p);
    bus.emit('pipeline:phase:rejected', {
      projectId, pipelineId,
      phaseIndex: p.currentPhase,
      data: { feedback },
    });
    return p;
  }

  /** Get a formatted status summary */
  getStatusSummary(projectId: string, pipelineId: string): string {
    const p = this.get(projectId, pipelineId);
    if (!p) return 'Pipeline not found.';

    const phaseStatusIcon: Record<PhaseStatus, string> = {
      'pending': '[ ]',
      'in-progress': '[>]',
      'awaiting-approval': '[?]',
      'approved': '[v]',
      'completed': '[v]',
      'failed': '[x]',
    };

    const taskStatusIcon: Record<TaskStatus, string> = {
      'pending': '[ ]',
      'in-progress': '[>]',
      'completed': '[v]',
      'failed': '[x]',
      'blocked': '[-]',
    };

    let out = `Pipeline: ${p.objective}\n`;
    out += `Status: ${p.status}\n`;
    out += `Created: ${p.createdAt}\n\n`;

    for (const phase of p.phases) {
      const icon = phaseStatusIcon[phase.status];
      out += `${icon} Phase ${phase.order + 1}: ${phase.name} (${phase.status})\n`;
      for (const task of phase.tasks) {
        const tIcon = taskStatusIcon[task.status];
        const agent = AGENT_META[task.agent].label;
        out += `    ${tIcon} ${agent}: ${task.title}\n`;
        if (task.output && phase.order === p.currentPhase) {
          const preview = task.output.length > 200 ? task.output.substring(0, 200) + '...' : task.output;
          out += `        Output: ${preview}\n`;
        }
      }
    }

    return out;
  }

  /**
   * Persist the completed task's output as a context entry + decision in the project DB.
   * Accepts service-like objects so it works without importing TypeORM directly.
   */
  async saveAgentHistory(
    projectId: string,
    pipelineId: string,
    taskId: string,
    contextService: { create(input: Record<string, any>): Promise<any> },
    decisionService: { create(input: Record<string, any>): Promise<any> },
  ): Promise<void> {
    const p = this.get(projectId, pipelineId);
    if (!p) return;

    let task: AgentTask | undefined;
    let phaseName = '';
    for (const phase of p.phases) {
      const t = phase.tasks.find(tk => tk.id === taskId);
      if (t) { task = t; phaseName = phase.name; break; }
    }
    if (!task || task.status !== 'completed' || !task.output) return;

    const agentLabel = AGENT_META[task.agent].label;

    // Context entry — full output for searchable history
    await contextService.create({
      projectId,
      key: `pipeline/${pipelineId}/${task.agent}`,
      value: task.output,
      category: 'agent-output',
      priority: 3,
      metadata: {
        pipelineId,
        phaseName,
        taskId: task.id,
        agent: task.agent,
        agentLabel,
        taskTitle: task.title,
        artifacts: task.artifacts || [],
        completedAt: task.completedAt,
        objective: p.objective,
      },
    });

    // Decision — records what the agent decided / did
    await decisionService.create({
      projectId,
      title: `[${agentLabel}] ${task.title}`,
      description: task.output.length > 4000 ? task.output.substring(0, 4000) + '\n\n... (truncated)' : task.output,
      rationale: {
        pipeline: pipelineId,
        phase: phaseName,
        agent: task.agent,
        objective: p.objective,
        artifacts: task.artifacts || [],
      },
    });
  }

  /** Delete a pipeline */
  delete(projectId: string, pipelineId: string): boolean {
    const file = path.join(getPipelinesDir(projectId), `${pipelineId}.json`);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      return true;
    }
    return false;
  }

  // ─── Internal ────────────────────────────────────────────

  private _advancePhase(p: Pipeline): void {
    p.phases[p.currentPhase].status = 'completed';
    p.currentPhase++;

    if (p.currentPhase >= p.phases.length) {
      p.status = 'completed';
      p.completedAt = new Date().toISOString();
    } else {
      p.status = 'active';
      p.phases[p.currentPhase].status = 'in-progress';
    }
  }
}
