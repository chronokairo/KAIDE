import { EventEmitter } from 'events';
import { IAgent, IAgentContext, AgentResult, AgentCapability } from './contracts';

// ─── Task Types ─────────────────────────────────────────────

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Task {
  id: string;
  name: string;
  description: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;

  // Agent assignment
  agentId?: string;
  requiredCapabilities?: AgentCapability[];

  // Execution context
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;

  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  estimatedDuration?: number;

  // Dependencies
  dependencies: string[]; // Task IDs this task depends on
  dependents: string[]; // Task IDs that depend on this task

  // Retry logic
  retryCount: number;
  maxRetries: number;
  retryDelay: number;

  // Metadata
  tags: string[];
  metadata: Record<string, any>;

  // Progress tracking
  progress: number; // 0-100
  steps: TaskStep[];
  currentStep?: string;
}

export interface TaskStep {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  output?: Record<string, any>;
  error?: string;
}

// ─── Workflow Types ─────────────────────────────────────────

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  priority: TaskPriority;

  // Tasks
  tasks: Task[];
  taskOrder: string[]; // Ordered list of task IDs

  // Execution
  currentTaskId?: string;
  executionHistory: WorkflowExecution[];

  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;

  // Configuration
  maxParallelTasks: number;
  allowParallelExecution: boolean;
  failFast: boolean; // Stop on first failure

  // Metadata
  tags: string[];
  metadata: Record<string, any>;

  // Context
  workspaceId?: string;
  userId?: string;
  sessionId?: string;
}

export interface WorkflowExecution {
  id: string;
  taskId: string;
  agentId?: string;
  startedAt: Date;
  completedAt?: Date;
  status: TaskStatus;
  result?: AgentResult;
  error?: string;
  duration?: number;
}

// ─── Task Manager Interface ──────────────────────────────────

export interface ITaskManager {
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'status' | 'retryCount' | 'progress' | 'steps'>): Promise<Task>;
  getTask(taskId: string): Promise<Task | undefined>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  listTasks(filter?: TaskFilter): Promise<Task[]>;

  assignAgent(taskId: string, agentId: string): Promise<Task>;
  startTask(taskId: string): Promise<Task>;
  completeTask(taskId: string, output?: Record<string, any>): Promise<Task>;
  failTask(taskId: string, error: string): Promise<Task>;
  cancelTask(taskId: string): Promise<Task>;
  pauseTask(taskId: string): Promise<Task>;
  resumeTask(taskId: string): Promise<Task>;

  addTaskStep(taskId: string, step: Omit<TaskStep, 'id' | 'status'>): Promise<TaskStep>;
  updateTaskStep(taskId: string, stepId: string, updates: Partial<TaskStep>): Promise<TaskStep>;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  agentId?: string;
  type?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

// ─── Workflow Manager Interface ─────────────────────────────

export interface IWorkflowManager {
  createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'status' | 'executionHistory'>): Promise<Workflow>;
  getWorkflow(workflowId: string): Promise<Workflow | undefined>;
  updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow>;
  deleteWorkflow(workflowId: string): Promise<void>;
  listWorkflows(filter?: WorkflowFilter): Promise<Workflow[]>;

  startWorkflow(workflowId: string): Promise<Workflow>;
  pauseWorkflow(workflowId: string): Promise<Workflow>;
  resumeWorkflow(workflowId: string): Promise<Workflow>;
  cancelWorkflow(workflowId: string): Promise<Workflow>;

  addTaskToWorkflow(workflowId: string, task: Task, position?: number): Promise<Workflow>;
  removeTaskFromWorkflow(workflowId: string, taskId: string): Promise<Workflow>;
  reorderWorkflowTasks(workflowId: string, taskOrder: string[]): Promise<Workflow>;

  executeWorkflow(workflowId: string): Promise<Workflow>;
  getWorkflowProgress(workflowId: string): Promise<WorkflowProgress>;
}

export interface WorkflowFilter {
  status?: WorkflowStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface WorkflowProgress {
  totalTasks: number;
  completedTasks: number;
  runningTasks: number;
  failedTasks: number;
  pendingTasks: number;
  progress: number; // 0-100
  estimatedTimeRemaining?: number;
  currentTasks: Array<{
    taskId: string;
    taskName: string;
    status: TaskStatus;
    agentId?: string;
  }>;
}

// ─── Task Scheduler Interface ───────────────────────────────

export interface ITaskScheduler {
  scheduleTask(taskId: string, schedule: TaskSchedule): Promise<ScheduledTask>;
  unscheduleTask(scheduledTaskId: string): Promise<void>;
  listScheduledTasks(): Promise<ScheduledTask[]>;
  pauseScheduler(): Promise<void>;
  resumeScheduler(): Promise<void>;
}

export interface TaskSchedule {
  type: 'once' | 'recurring';
  startTime?: Date;
  cronExpression?: string; // For recurring tasks
  interval?: number; // In milliseconds, for simple intervals
  endTime?: Date;
  maxRuns?: number;
}

export interface ScheduledTask {
  id: string;
  taskId: string;
  schedule: TaskSchedule;
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  isActive: boolean;
  createdAt: Date;
}

// ─── Task Queue Interface ───────────────────────────────────

export interface ITaskQueue {
  enqueue(taskId: string, priority?: TaskPriority): Promise<void>;
  dequeue(): Promise<string | undefined>;
  peek(): Promise<string | undefined>;
  remove(taskId: string): Promise<void>;
  getQueueLength(): Promise<number>;
  getQueuedTasks(): Promise<string[]>;
  clear(): Promise<void>;
}

// ─── Task Execution Engine ──────────────────────────────────

export interface ITaskExecutionEngine {
  executeTask(taskId: string): Promise<AgentResult>;
  executeWorkflow(workflowId: string): Promise<Workflow>;
  stopExecution(executionId: string): Promise<void>;
  getExecutionStatus(executionId: string): Promise<ExecutionStatus>;
}

export interface ExecutionStatus {
  id: string;
  type: 'task' | 'workflow';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  currentTaskId?: string;
  error?: string;
}

// ─── Dependency Resolver ────────────────────────────────────

export interface ITaskDependencyResolver {
  resolveDependencies(taskId: string): Promise<string[]>;
  getDependentTasks(taskId: string): Promise<string[]>;
  canExecuteTask(taskId: string): Promise<boolean>;
  getExecutionOrder(tasks: string[]): Promise<string[]>;
}

// ─── Event Types ────────────────────────────────────────────

export interface TaskEvent {
  type: 'task_created' | 'task_updated' | 'task_started' | 'task_completed' | 'task_failed' | 'task_cancelled';
  taskId: string;
  data: Partial<Task>;
  timestamp: Date;
}

export interface WorkflowEvent {
  type: 'workflow_created' | 'workflow_updated' | 'workflow_started' | 'workflow_completed' | 'workflow_failed';
  workflowId: string;
  data: Partial<Workflow>;
  timestamp: Date;
}

// ─── Task Manager Implementation ────────────────────────────

export class TaskManager extends EventEmitter implements ITaskManager {
  private tasks = new Map<string, Task>();

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'retryCount' | 'progress' | 'steps'>): Promise<Task> {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: TaskStatus.PENDING,
      retryCount: 0,
      progress: 0,
      steps: [],
      createdAt: new Date(),
      ...taskData,
      dependencies: taskData.dependencies || [],
      dependents: [],
      retryDelay: 1000,
      maxRetries: 3,
      tags: taskData.tags || [],
      metadata: taskData.metadata || {},
    };

    this.tasks.set(task.id, task);
    this.emit('task_created', { type: 'task_created', taskId: task.id, data: task, timestamp: new Date() });
    return task;
  }

  async getTask(taskId: string): Promise<Task | undefined> {
    return this.tasks.get(taskId);
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    Object.assign(task, updates);
    this.emit('task_updated', { type: 'task_updated', taskId, data: updates, timestamp: new Date() });
    return task;
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!this.tasks.delete(taskId)) {
      throw new Error(`Task ${taskId} not found`);
    }
  }

  async listTasks(filter: TaskFilter = {}): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());

    if (filter.status) {
      tasks = tasks.filter(t => filter.status!.includes(t.status));
    }
    if (filter.priority) {
      tasks = tasks.filter(t => filter.priority!.includes(t.priority));
    }
    if (filter.agentId) {
      tasks = tasks.filter(t => t.agentId === filter.agentId);
    }
    if (filter.type) {
      tasks = tasks.filter(t => t.type === filter.type);
    }
    if (filter.tags) {
      tasks = tasks.filter(t => filter.tags!.some(tag => t.tags.includes(tag)));
    }
    if (filter.createdAfter) {
      tasks = tasks.filter(t => t.createdAt >= filter.createdAfter!);
    }
    if (filter.createdBefore) {
      tasks = tasks.filter(t => t.createdAt <= filter.createdBefore!);
    }

    if (filter.limit) {
      const offset = filter.offset || 0;
      tasks = tasks.slice(offset, offset + filter.limit);
    }

    return tasks;
  }

  async assignAgent(taskId: string, agentId: string): Promise<Task> {
    return this.updateTask(taskId, { agentId });
  }

  async startTask(taskId: string): Promise<Task> {
    const task = await this.updateTask(taskId, {
      status: TaskStatus.RUNNING,
      startedAt: new Date()
    });
    this.emit('task_started', { type: 'task_started', taskId, data: task, timestamp: new Date() });
    return task;
  }

  async completeTask(taskId: string, output?: Record<string, any>): Promise<Task> {
    const task = await this.updateTask(taskId, {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      output,
      progress: 100
    });
    this.emit('task_completed', { type: 'task_completed', taskId, data: task, timestamp: new Date() });
    return task;
  }

  async failTask(taskId: string, error: string): Promise<Task> {
    const task = await this.updateTask(taskId, {
      status: TaskStatus.FAILED,
      error
    });
    this.emit('task_failed', { type: 'task_failed', taskId, data: task, timestamp: new Date() });
    return task;
  }

  async cancelTask(taskId: string): Promise<Task> {
    const task = await this.updateTask(taskId, { status: TaskStatus.CANCELLED });
    this.emit('task_cancelled', { type: 'task_cancelled', taskId, data: task, timestamp: new Date() });
    return task;
  }

  async pauseTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, { status: TaskStatus.PAUSED });
  }

  async resumeTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, { status: TaskStatus.RUNNING });
  }

  async addTaskStep(taskId: string, stepData: Omit<TaskStep, 'id' | 'status'>): Promise<TaskStep> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const step: TaskStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: TaskStatus.PENDING,
      ...stepData
    };

    task.steps.push(step);
    return step;
  }

  async updateTaskStep(taskId: string, stepId: string, updates: Partial<TaskStep>): Promise<TaskStep> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const step = task.steps.find(s => s.id === stepId);
    if (!step) throw new Error(`Step ${stepId} not found in task ${taskId}`);

    Object.assign(step, updates);
    return step;
  }
}