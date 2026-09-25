import { EventEmitter } from 'events';
import { IWorkflowManager, Workflow, WorkflowFilter, WorkflowProgress, WorkflowStatus, TaskPriority, WorkflowExecution, TaskStatus } from './tasks';

// ─── Workflow Manager Implementation ────────────────────────

export class WorkflowManager extends EventEmitter implements IWorkflowManager {
  private workflows = new Map<string, Workflow>();

  async createWorkflow(workflowData: Omit<Workflow, 'id' | 'createdAt' | 'status' | 'executionHistory'>): Promise<Workflow> {
    const workflow: Workflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: WorkflowStatus.DRAFT,
      executionHistory: [],
      createdAt: new Date(),
      ...workflowData,
      maxParallelTasks: workflowData.maxParallelTasks || 1,
      allowParallelExecution: workflowData.allowParallelExecution || false,
      failFast: workflowData.failFast || false,
      tags: workflowData.tags || [],
      metadata: workflowData.metadata || {},
      tasks: workflowData.tasks || [],
      taskOrder: workflowData.taskOrder || [],
    };

    this.workflows.set(workflow.id, workflow);
    this.emit('workflow_created', { type: 'workflow_created', workflowId: workflow.id, data: workflow, timestamp: new Date() });
    return workflow;
  }

  async getWorkflow(workflowId: string): Promise<Workflow | undefined> {
    return this.workflows.get(workflowId);
  }

  async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    Object.assign(workflow, updates);
    this.emit('workflow_updated', { type: 'workflow_updated', workflowId, data: updates, timestamp: new Date() });
    return workflow;
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    if (!this.workflows.delete(workflowId)) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
  }

  async listWorkflows(filter: WorkflowFilter = {}): Promise<Workflow[]> {
    let workflows = Array.from(this.workflows.values());

    if (filter.status) {
      workflows = workflows.filter(w => filter.status!.includes(w.status));
    }
    if (filter.priority) {
      workflows = workflows.filter(w => filter.priority!.includes(w.priority));
    }
    if (filter.tags) {
      workflows = workflows.filter(w => filter.tags!.some(tag => w.tags.includes(tag)));
    }
    if (filter.createdAfter) {
      workflows = workflows.filter(w => w.createdAt >= filter.createdAfter!);
    }
    if (filter.createdBefore) {
      workflows = workflows.filter(w => w.createdAt <= filter.createdBefore!);
    }

    if (filter.limit) {
      const offset = filter.offset || 0;
      workflows = workflows.slice(offset, offset + filter.limit);
    }

    return workflows;
  }

  async startWorkflow(workflowId: string): Promise<Workflow> {
    const workflow = await this.updateWorkflow(workflowId, {
      status: WorkflowStatus.RUNNING,
      startedAt: new Date()
    });
    this.emit('workflow_started', { type: 'workflow_started', workflowId, data: workflow, timestamp: new Date() });
    return workflow;
  }

  async pauseWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { status: WorkflowStatus.PAUSED });
  }

  async resumeWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { status: WorkflowStatus.RUNNING });
  }

  async cancelWorkflow(workflowId: string): Promise<Workflow> {
    const workflow = await this.updateWorkflow(workflowId, { status: WorkflowStatus.CANCELLED });
    this.emit('workflow_cancelled', { type: 'workflow_cancelled', workflowId, data: workflow, timestamp: new Date() });
    return workflow;
  }

  async addTaskToWorkflow(workflowId: string, task: any, position?: number): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    workflow.tasks.push(task);

    if (position !== undefined && position >= 0 && position < workflow.taskOrder.length) {
      workflow.taskOrder.splice(position, 0, task.id);
    } else {
      workflow.taskOrder.push(task.id);
    }

    return workflow;
  }

  async removeTaskFromWorkflow(workflowId: string, taskId: string): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    workflow.tasks = workflow.tasks.filter(t => t.id !== taskId);
    workflow.taskOrder = workflow.taskOrder.filter(id => id !== taskId);

    return workflow;
  }

  async reorderWorkflowTasks(workflowId: string, taskOrder: string[]): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    // Validate that all task IDs exist in the workflow
    const taskIds = new Set(workflow.tasks.map(t => t.id));
    const invalidIds = taskOrder.filter(id => !taskIds.has(id));
    if (invalidIds.length > 0) {
      throw new Error(`Invalid task IDs: ${invalidIds.join(', ')}`);
    }

    workflow.taskOrder = taskOrder;
    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<Workflow> {
    const workflow = await this.startWorkflow(workflowId);

    try {
      // Simple sequential execution for now
      // In a real implementation, this would handle parallel execution, dependencies, etc.
      for (const taskId of workflow.taskOrder) {
        const task = workflow.tasks.find(t => t.id === taskId);
        if (!task) continue;

        workflow.currentTaskId = taskId;

        // Simulate task execution
        // In a real implementation, this would call the task execution engine
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work

        // Mark task as completed
        task.status = TaskStatus.COMPLETED;
        task.completedAt = new Date();

        // Record execution
        const execution: WorkflowExecution = {
          id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          taskId,
          startedAt: new Date(),
          completedAt: new Date(),
          status: TaskStatus.COMPLETED
        };
        workflow.executionHistory.push(execution);
      }

      return await this.updateWorkflow(workflowId, {
        status: WorkflowStatus.COMPLETED,
        completedAt: new Date(),
        currentTaskId: undefined
      });

    } catch (error) {
      await this.updateWorkflow(workflowId, {
        status: WorkflowStatus.FAILED,
        currentTaskId: undefined
      });
      throw error;
    }
  }

  async getWorkflowProgress(workflowId: string): Promise<WorkflowProgress> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const totalTasks = workflow.tasks.length;
    const completedTasks = workflow.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const runningTasks = workflow.tasks.filter(t => t.status === TaskStatus.RUNNING).length;
    const failedTasks = workflow.tasks.filter(t => t.status === TaskStatus.FAILED).length;
    const pendingTasks = workflow.tasks.filter(t => t.status === TaskStatus.PENDING).length;

    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const currentTasks = workflow.tasks
      .filter(t => t.status === TaskStatus.RUNNING)
      .map(t => ({
        taskId: t.id,
        taskName: t.name,
        status: t.status,
        agentId: t.agentId
      }));

    return {
      totalTasks,
      completedTasks,
      runningTasks,
      failedTasks,
      pendingTasks,
      progress,
      currentTasks
    };
  }
}