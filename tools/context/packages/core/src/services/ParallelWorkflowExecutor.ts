import { Logger } from '../utils/Logger';
import { getEventBus } from '../events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parallel Workflow Executor
 * 
 * Executa steps de workflows em paralelo com:
 * - Resolução de dependências
 * - Limitação de concorrência
 * - Tratamento de falhas
 * - Timeout handling
 */

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  executor: () => Promise<any>;
  dependencies?: string[];
  timeout?: number;
  retryCount?: number;
  parallel?: boolean;
}

export interface StepExecution {
  stepId: string;
  status: StepStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  output?: any;
  error?: string;
  retryCount: number;
}

export interface WorkflowExecution {
  id: string;
  steps: Map<string, StepExecution>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  totalDuration?: number;
  parallelSteps: number;
}

export class ParallelWorkflowExecutor {
  private logger = Logger.getInstance();
  private bus = getEventBus('parallel-workflow');
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private maxConcurrentSteps: number = 5;

  constructor(maxConcurrentSteps: number = 5) {
    this.maxConcurrentSteps = maxConcurrentSteps;
  }

  /**
   * Executar workflow com suporte a paralelismo
   */
  async executeWorkflow(steps: WorkflowStep[], maxParallel?: number): Promise<Map<string, StepExecution>> {
    const executionId = uuidv4();
    const concurrency = maxParallel || this.maxConcurrentSteps;

    this.logger.info('[ParallelWorkflow] Starting workflow execution', {
      executionId,
      stepCount: steps.length,
      maxConcurrency: concurrency,
    });

    // Inicializar execução
    const execution: WorkflowExecution = {
      id: executionId,
      steps: new Map(),
      status: 'running',
      startTime: new Date(),
      parallelSteps: 0,
    };

    // Inicializar status de cada step
    for (const step of steps) {
      execution.steps.set(step.id, {
        stepId: step.id,
        status: 'pending',
        retryCount: 0,
      });
    }

    this.activeExecutions.set(executionId, execution);

    try {
      // Construir grafo de dependências
      const dependencyGraph = this.buildDependencyGraph(steps);

      // Executar respeitando dependências e concorrência
      await this.executeWithDependencies(
        steps,
        dependencyGraph,
        execution,
        concurrency
      );

      execution.status = 'completed';
      execution.endTime = new Date();
      if (execution.startTime) {
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      }

      this.logger.info('[ParallelWorkflow] Workflow completed', {
        executionId,
        duration: execution.duration,
      });

      await this.bus.emit('workflow:completed', {
        executionId,
        duration: execution.duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();

      this.logger.error('[ParallelWorkflow] Workflow failed', {
        executionId,
        error,
      });

      await this.bus.emit('workflow:failed', {
        executionId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    } finally {
      this.activeExecutions.delete(executionId);
    }

    return execution.steps;
  }

  /**
   * Construir grafo de dependências dos steps
   */
  private buildDependencyGraph(steps: WorkflowStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const step of steps) {
      graph.set(step.id, step.dependencies || []);
    }

    return graph;
  }

  /**
   * Executar steps respeitando dependências e concorrência
   */
  private async executeWithDependencies(
    steps: WorkflowStep[],
    dependencyGraph: Map<string, string[]>,
    execution: WorkflowExecution,
    maxConcurrency: number
  ): Promise<void> {
    const executed = new Set<string>();
    const executing = new Map<string, Promise<void>>();
    const stepMap = new Map(steps.map(s => [s.id, s]));

    while (executed.size < steps.length) {
      // Encontrar steps prontos para executar
      const readySteps: WorkflowStep[] = [];

      for (const step of steps) {
        if (executed.has(step.id) || executing.has(step.id)) {
          continue;
        }

        const deps = dependencyGraph.get(step.id) || [];
        const allDepsMet = deps.every(dep => executed.has(dep));

        if (allDepsMet) {
          readySteps.push(step);
        }
      }

      if (readySteps.length === 0) {
        // Se não há steps prontos e nada está executando, há erro de dependência circular
        if (executing.size === 0) {
          throw new Error('Circular dependency detected or missing steps');
        }

        // Aguardar por qualquer execução terminar
        await Promise.race(Array.from(executing.values()));
        continue;
      }

      // Executar quantos steps forem possíveis dentro do limite de concorrência
      const slotsAvailable = Math.max(0, maxConcurrency - executing.size);

      for (let i = 0; i < Math.min(slotsAvailable, readySteps.length); i++) {
        const step = readySteps[i];

        const executionPromise = this.executeStep(step, execution);

        executing.set(step.id, executionPromise);

        executionPromise
          .then(() => {
            executed.add(step.id);
            executing.delete(step.id);
          })
          .catch((error) => {
            this.logger.error('[ParallelWorkflow] Step failed', {
              stepId: step.id,
              error,
            });

            // Não parar execução de outras steps, apenas marcar como falha
            executed.add(step.id);
            executing.delete(step.id);

            const exec = execution.steps.get(step.id);
            if (exec) {
              exec.status = 'failed';
              exec.error = error instanceof Error ? error.message : String(error);
            }
          });
      }

      // Aguardar por qualquer execução terminar se estamos no limite
      if (executing.size >= maxConcurrency) {
        await Promise.race(Array.from(executing.values()));
      } else if (executing.size > 0 && executed.size + executing.size < steps.length) {
        // Aguardar se há execuções em progresso mas nenhum slot disponível
        await Promise.race(Array.from(executing.values()));
      }
    }
  }

  /**
   * Executar um step individual com retry
   */
  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    const stepExec = execution.steps.get(step.id);
    if (!stepExec) return;

    const maxRetries = step.retryCount || 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt === 0) {
          stepExec.status = 'running';
          stepExec.startTime = new Date();

          await this.bus.emit('step:started', {
            stepId: step.id,
            stepName: step.name,
            timestamp: new Date().toISOString(),
          });
        } else {
          this.logger.debug('[ParallelWorkflow] Retrying step', {
            stepId: step.id,
            attempt,
          });

          // Backoff exponencial
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
          );
        }

        // Executar com timeout
        const timeoutMs = step.timeout || 60000;
        const output = await this.executeWithTimeout(step.executor, timeoutMs);

        stepExec.status = 'completed';
        stepExec.output = output;
        stepExec.endTime = new Date();
        if (stepExec.startTime) {
          stepExec.duration = stepExec.endTime.getTime() - stepExec.startTime.getTime();
        }

        await this.bus.emit('step:completed', {
          stepId: step.id,
          stepName: step.name,
          duration: stepExec.duration,
          timestamp: new Date().toISOString(),
        });

        return; // Sucesso, sair
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) {
          // Última tentativa falhou
          stepExec.status = 'failed';
          stepExec.error = lastError.message;
          stepExec.endTime = new Date();
          if (stepExec.startTime) {
            stepExec.duration = stepExec.endTime.getTime() - stepExec.startTime.getTime();
          }

          await this.bus.emit('step:failed', {
            stepId: step.id,
            stepName: step.name,
            error: lastError.message,
            attempts: attempt + 1,
            timestamp: new Date().toISOString(),
          });
        }

        stepExec.retryCount = attempt;
      }
    }
  }

  /**
   * Executar função com timeout
   */
  private executeWithTimeout(
    executor: () => Promise<any>,
    timeoutMs: number
  ): Promise<any> {
    return Promise.race([
      executor(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Step timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Obter status de execução
   */
  getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Listar execuções ativas
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }
}
