import { Logger } from '../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Workflow Execution Engine (Phase 6)
 * 
 * Manages multi-step workflow execution with:
 * - Dependency resolution
 * - Error recovery and retries
 * - Task coordination
 * - State management
 * - Progress tracking
 */

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  taskId: string;
  description?: string;
  dependencies?: string[]; // Step IDs this step depends on
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
  timeout?: number;
  input?: Record<string, unknown>;
  expectedOutput?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  agentId: string;
  workspaceId: string;
  steps: WorkflowStep[];
  parallelSteps?: string[][]; // Groups of steps that can run in parallel
  errorHandling?: 'fail-fast' | 'continue-on-error' | 'collect-errors';
  timeout?: number; // Total workflow timeout in ms
  createdAt: number;
  updatedAt: number;
}

export interface StepExecution {
  stepId: string;
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  duration?: number;
  result?: unknown;
  error?: string;
  retryCount: number;
  logs: string[];
}

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  agentId: string;
  workspaceId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number; // 0-100
  startTime: number;
  endTime?: number;
  duration?: number;
  stepExecutions: Map<string, StepExecution>;
  errors: Array<{ stepId: string; error: string; timestamp: number }>;
  context: Record<string, unknown>; // Shared context across steps
  metadata: {
    createdBy: string;
    createdAt: number;
    tags?: string[];
  };
}

export interface StepResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

export type StepExecutor = (step: WorkflowStep, context: Record<string, unknown>) => Promise<StepResult>;

const logger = Logger.getInstance();

export class WorkflowExecutionEngine {
  private executions: Map<string, WorkflowExecution> = new Map();
  private definitions: Map<string, WorkflowDefinition> = new Map();
  private stepExecutors: Map<string, StepExecutor> = new Map();
  private eventHandlers: {
    onStepStart?: (execution: WorkflowExecution, step: StepExecution) => void;
    onStepComplete?: (execution: WorkflowExecution, step: StepExecution) => void;
    onStepFail?: (execution: WorkflowExecution, step: StepExecution) => void;
    onWorkflowProgress?: (execution: WorkflowExecution) => void;
  } = {};

  constructor() {
    this.registerDefaultExecutors();
  }

  /**
   * Register a workflow definition
   */
  registerWorkflow(definition: WorkflowDefinition): void {
    this.definitions.set(definition.id, definition);
    logger.info(`[WorkflowEngine] Workflow registered`, {
      workflowId: definition.id,
      name: definition.name,
      stepCount: definition.steps.length,
    });
  }

  /**
   * Register a step executor function
   */
  registerStepExecutor(stepType: string, executor: StepExecutor): void {
    this.stepExecutors.set(stepType, executor);
    logger.info(`[WorkflowEngine] Step executor registered`, { stepType });
  }

  /**
   * Register event handlers
   */
  onStepStart(handler: (execution: WorkflowExecution, step: StepExecution) => void): void {
    this.eventHandlers.onStepStart = handler;
  }

  onStepComplete(handler: (execution: WorkflowExecution, step: StepExecution) => void): void {
    this.eventHandlers.onStepComplete = handler;
  }

  onStepFail(handler: (execution: WorkflowExecution, step: StepExecution) => void): void {
    this.eventHandlers.onStepFail = handler;
  }

  onWorkflowProgress(handler: (execution: WorkflowExecution) => void): void {
    this.eventHandlers.onWorkflowProgress = handler;
  }

  /**
   * Start a workflow execution
   */
  async executeWorkflow(
    workflowId: string,
    agentId: string,
    workspaceId: string,
    initialContext?: Record<string, unknown>,
    createdBy?: string
  ): Promise<WorkflowExecution> {
    const definition = this.definitions.get(workflowId);
    if (!definition) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = uuidv4();
    const execution: WorkflowExecution = {
      executionId,
      workflowId,
      agentId,
      workspaceId,
      status: 'running',
      progress: 0,
      startTime: Date.now(),
      stepExecutions: new Map(),
      errors: [],
      context: initialContext || {},
      metadata: {
        createdBy: createdBy || 'system',
        createdAt: Date.now(),
      },
    };

    this.executions.set(executionId, execution);

    logger.info(`[WorkflowEngine] Workflow execution started`, {
      executionId,
      workflowId,
      stepCount: definition.steps.length,
    });

    try {
      // Resolve dependencies and create execution order
      const executionOrder = this.resolveDependencies(definition);

      // Execute steps based on resolved order
      for (const stepGroup of executionOrder) {
        if (execution.status === 'paused' || execution.status === 'cancelled') {
          break;
        }

        // Execute steps in parallel if they're in same group
        const stepPromises = stepGroup.map(stepId =>
          this.executeStep(execution, definition, stepId)
        );

        await Promise.allSettled(stepPromises);

        // Check if any step failed and error handling says to stop
        if (definition.errorHandling === 'fail-fast' && execution.errors.length > 0) {
          execution.status = 'failed';
          break;
        }

        // Update progress
        const completedSteps = Array.from(execution.stepExecutions.values()).filter(
          s => s.status === 'completed'
        ).length;
        execution.progress = Math.round((completedSteps / definition.steps.length) * 100);

        this.eventHandlers.onWorkflowProgress?.(execution);
      }

      // Finalize execution
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      execution.progress = 100;

      if (execution.status === 'running') {
        execution.status = 'completed';
      }

      logger.info(`[WorkflowEngine] Workflow execution completed`, {
        executionId,
        status: execution.status,
        duration: execution.duration,
        errorCount: execution.errors.length,
      });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.errors.push({
        stepId: 'workflow',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });

      logger.error(`[WorkflowEngine] Workflow execution failed`, {
        executionId,
        error: error instanceof Error ? error.message : String(error),
      });

      return execution;
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    execution: WorkflowExecution,
    definition: WorkflowDefinition,
    stepId: string
  ): Promise<StepExecution> {
    const step = definition.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    let stepExecution: StepExecution = {
      stepId,
      executionId: execution.executionId,
      status: 'running',
      startTime: Date.now(),
      retryCount: 0,
      logs: [],
    };

    execution.stepExecutions.set(stepId, stepExecution);
    this.eventHandlers.onStepStart?.(execution, stepExecution);

    const maxRetries = step.retryPolicy?.maxRetries || 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        stepExecution.logs.push(`[Attempt ${attempt + 1}] Starting step execution`);

        const executor = this.stepExecutors.get(step.type);
        if (!executor) {
          throw new Error(`No executor registered for step type: ${step.type}`);
        }

        // Execute with timeout
        const timeoutMs = step.timeout || definition.timeout || 60000;
        const result = await this.executeWithTimeout(
          executor(step, execution.context),
          timeoutMs
        );

        if (!result.success) {
          throw new Error(result.error || 'Step execution failed');
        }

        stepExecution.result = result.output;
        stepExecution.status = 'completed';
        stepExecution.endTime = Date.now();
        stepExecution.duration = stepExecution.endTime - stepExecution.startTime;

        // Store result in shared context
        execution.context[stepId] = result.output;

        stepExecution.logs.push(`[Success] Step completed in ${stepExecution.duration}ms`);
        this.eventHandlers.onStepComplete?.(execution, stepExecution);

        logger.info(`[WorkflowEngine] Step executed successfully`, {
          executionId: execution.executionId,
          stepId,
          duration: stepExecution.duration,
        });

        return stepExecution;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        stepExecution.retryCount = attempt + 1;
        stepExecution.logs.push(`[Error] ${lastError.message}`);

        if (attempt < maxRetries) {
          const backoffMs = step.retryPolicy!.backoffMs * Math.pow(
            step.retryPolicy!.backoffMultiplier,
            attempt
          );
          stepExecution.logs.push(`[Retry] Waiting ${backoffMs}ms before retry...`);
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries failed
    stepExecution.status = 'failed';
    stepExecution.error = lastError?.message || 'Unknown error';
    stepExecution.endTime = Date.now();
    stepExecution.duration = stepExecution.endTime - stepExecution.startTime;

    execution.errors.push({
      stepId,
      error: stepExecution.error,
      timestamp: Date.now(),
    });

    this.eventHandlers.onStepFail?.(execution, stepExecution);

    logger.error(`[WorkflowEngine] Step execution failed`, {
      executionId: execution.executionId,
      stepId,
      error: stepExecution.error,
      retries: stepExecution.retryCount,
    });

    return stepExecution;
  }

  /**
   * Resolve step dependencies and return execution order
   */
  private resolveDependencies(definition: WorkflowDefinition): string[][] {
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize adjacency list and in-degree
    for (const step of definition.steps) {
      adjacencyList.set(step.id, []);
      inDegree.set(step.id, 0);
    }

    // Build graph
    for (const step of definition.steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          adjacencyList.get(dep)!.push(step.id);
          inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
        }
      }
    }

    // Topological sort with levels (for parallel execution)
    const queue: string[] = [];
    const levels: string[][] = [];
    const currentLevel: string[] = [];

    // Find all steps with no dependencies
    for (const [stepId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(stepId);
        currentLevel.push(stepId);
      }
    }

    while (queue.length > 0) {
      const nextQueue: string[] = [];
      const nextLevel: string[] = [];
      const visited = new Set<string>();

      for (const stepId of queue) {
        for (const neighbor of adjacencyList.get(stepId) || []) {
          if (!visited.has(neighbor)) {
            inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
            if (inDegree.get(neighbor) === 0) {
              nextQueue.push(neighbor);
              nextLevel.push(neighbor);
              visited.add(neighbor);
            }
          }
        }
      }

      if (currentLevel.length > 0) {
        levels.push([...currentLevel]);
      }

      queue = nextQueue;
      currentLevel.length = 0;
      currentLevel.push(...nextLevel);
    }

    if (currentLevel.length > 0) {
      levels.push([...currentLevel]);
    }

    return levels;
  }

  /**
   * Execute promise with timeout
   */
  private executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Pause execution
   */
  pauseExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = 'paused';
      logger.info(`[WorkflowEngine] Execution paused`, { executionId });
    }
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = 'cancelled';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      logger.info(`[WorkflowEngine] Execution cancelled`, { executionId });
    }
  }

  /**
   * Register default executors
   */
  private registerDefaultExecutors(): void {
    // Default code execution
    this.registerStepExecutor('code-execution', async (step, context) => {
      logger.debug(`[WorkflowEngine] Executing code step`, { stepId: step.id });
      // Implementation would call TaskExecutorService
      return { success: true, output: { executed: true } };
    });

    // Default analysis
    this.registerStepExecutor('analysis', async (step, context) => {
      logger.debug(`[WorkflowEngine] Executing analysis step`, { stepId: step.id });
      return { success: true, output: { analyzed: true } };
    });

    // Default data transformation
    this.registerStepExecutor('transform', async (step, context) => {
      logger.debug(`[WorkflowEngine] Executing transform step`, { stepId: step.id });
      return { success: true, output: context };
    });
  }
}

export default WorkflowExecutionEngine;
