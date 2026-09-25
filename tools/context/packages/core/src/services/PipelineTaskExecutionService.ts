import { Logger } from '../utils/Logger';
import { Pipeline, AgentTask, PipelinePhase } from '../pipeline';
import { TaskExecutorService, ExecutionResult } from './TaskExecutorService';
import { AIProvider } from '../providers/AIProvider';
import { getEventBus } from '../events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Pipeline Task Execution Service
 * 
 * Integra TaskExecutorService com o Pipeline para execução automática
 * de tarefas por agentes. Coordena:
 * 
 * - Geração de prompts específicos para cada agente
 * - Execução via LLM ou sandbox
 * - Captura de artifacts (código, documentação, etc.)
 * - Sincronização com pipeline status
 * - Emissão de eventos
 */

export interface TaskDefinition {
  taskId: string;
  agentRole: string;
  pipelineId: string;
  phaseId: string;
  title: string;
  description: string;
  context?: string;
  artifacts?: any[];
}

export interface TaskExecutionConfig {
  timeout?: number;
  retryCount?: number;
  sandboxed?: boolean;
  streaming?: boolean;
}

export class PipelineTaskExecutionService {
  private logger = Logger.getInstance();
  private taskExecutor: TaskExecutorService;
  private activeExecutions: Map<string, Promise<ExecutionResult>> = new Map();
  private bus = getEventBus('pipeline-executor');

  constructor(private aiProvider: AIProvider) {
    this.taskExecutor = new TaskExecutorService(aiProvider);
  }

  /**
   * Executar uma tarefa do pipeline
   */
  async executeTask(
    task: TaskDefinition,
    config: TaskExecutionConfig = {}
  ): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();

    this.logger.info('[PipelineExecutor] Starting task execution', {
      taskId: task.taskId,
      agentRole: task.agentRole,
      pipelineId: task.pipelineId,
      executionId,
    });

    // Emitir evento de início
    await this.bus.emit('pipeline:task:started', {
      taskId: task.taskId,
      pipelineId: task.pipelineId,
      phaseId: task.phaseId,
      executionId,
      agentRole: task.agentRole,
      timestamp: new Date().toISOString(),
    });

    try {
      // Gerar prompt específico para o agente
      const agentPrompt = this.generateAgentPrompt(task);

      // Executar via LLM (modo padrão)
      const result = await this.executeLLMTask(agentPrompt, task, executionId, config);

      const duration = Date.now() - startTime;

      // Emitir evento de conclusão
      await this.bus.emit('pipeline:task:completed', {
        taskId: task.taskId,
        pipelineId: task.pipelineId,
        phaseId: task.phaseId,
        executionId,
        duration,
        success: true,
        output: result.output,
        timestamp: new Date().toISOString(),
      });

      this.logger.info('[PipelineExecutor] Task execution completed', {
        taskId: task.taskId,
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Emitir evento de erro
      await this.bus.emit('pipeline:task:failed', {
        taskId: task.taskId,
        pipelineId: task.pipelineId,
        phaseId: task.phaseId,
        executionId,
        duration,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      this.logger.error('[PipelineExecutor] Task execution failed', {
        taskId: task.taskId,
        error: errorMessage,
        duration,
      });

      return {
        success: false,
        error: errorMessage,
        metrics: {
          startTime,
          endTime: Date.now(),
          duration,
          tokensUsed: 0,
          successfulSteps: 0,
          failedSteps: 1,
        },
        executionId,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Executar tarefa via LLM (interface com AIProvider)
   */
  private async executeLLMTask(
    prompt: string,
    task: TaskDefinition,
    executionId: string,
    config: TaskExecutionConfig
  ): Promise<ExecutionResult> {
    if (!this.aiProvider) {
      throw new Error('AIProvider not initialized');
    }

    // Chamar LLM com timeout
    const controller = new AbortController();
    const timeoutMs = config.timeout || 120000; // 2 minutos por padrão

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Construir mensagem com contexto
      const systemMessage = `You are a ${task.agentRole} in a software development pipeline.
Your task: ${task.title}
Description: ${task.description}

Generate a response that includes:
1. Analysis of the task
2. Concrete output/code/documentation
3. Artifacts created (file paths, references)
4. Status (completed/in-progress/blocked)

Format your response as JSON with fields: analysis, output, artifacts, status`;

      // Chamar completion via AIProvider
      const response = await this.aiProvider.chat([
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      // Tentar fazer parse como JSON, senão usar como texto
      let parsed = { output: response };
      try {
        parsed = JSON.parse(response);
      } catch {
        // Se não for JSON válido, continuar com texto
        parsed = { output: response, artifacts: [] };
      }

      return {
        success: true,
        output: parsed,
        metrics: {
          startTime: Date.now(),
          tokensUsed: 0, // TODO: extrair do response metadata
          successfulSteps: 1,
          failedSteps: 0,
        },
        executionId,
        timestamp: Date.now(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Gerar prompt específico para cada agente/papel
   */
  private generateAgentPrompt(task: TaskDefinition): string {
    const basePrompt = `${task.description}

Context: ${task.context || 'No additional context provided'}

Requirements:
- Follow coding best practices
- Include error handling
- Add comments for complex logic
- Ensure code is testable
- Consider performance implications`;

    // Prompt customizado por role
    const rolePrompts: Record<string, string> = {
      'product-manager': `As a Product Manager, analyze the task and provide:
1. User story breakdown
2. Acceptance criteria
3. Priority and dependencies
4. Success metrics
${basePrompt}`,

      architect: `As an Architect, design the solution:
1. Architecture diagram (ASCII or description)
2. Component breakdown
3. Design patterns to use
4. Trade-offs and decisions
${basePrompt}`,

      backend: `As a Backend Engineer, implement:
1. API endpoints needed
2. Database schema changes
3. Business logic implementation
4. Error handling and validation
${basePrompt}`,

      frontend: `As a Frontend Engineer, implement:
1. Component structure
2. State management approach
3. UI/UX implementation
4. Responsive design considerations
${basePrompt}`,

      'code-review': `As a Code Reviewer, analyze:
1. Code quality issues
2. Performance concerns
3. Security vulnerabilities
4. Test coverage
5. Documentation gaps
${basePrompt}`,

      devops: `As DevOps Engineer, provide:
1. Deployment strategy
2. Infrastructure requirements
3. CI/CD pipeline setup
4. Monitoring and alerting
${basePrompt}`,

      qa: `As QA Engineer, create:
1. Test plan and test cases
2. Edge cases to cover
3. Performance requirements
4. Acceptance criteria validation
${basePrompt}`,
    };

    return rolePrompts[task.agentRole] || basePrompt;
  }

  /**
   * Executar múltiplas tarefas em paralelo
   */
  async executeTasksInPhase(
    phase: PipelinePhase,
    pipelineId: string,
    config: TaskExecutionConfig = {}
  ): Promise<Map<string, ExecutionResult>> {
    this.logger.info('[PipelineExecutor] Executing phase tasks', {
      phaseId: phase.id,
      pipelineId,
      taskCount: phase.tasks.length,
      parallel: phase.parallel,
    });

    const results = new Map<string, ExecutionResult>();

    if (phase.parallel) {
      // Executar em paralelo
      const promises = phase.tasks.map(task => {
        const taskDef: TaskDefinition = {
          taskId: task.id,
          agentRole: task.agent,
          pipelineId,
          phaseId: phase.id,
          title: task.title,
          description: task.description,
        };

        return this.executeTask(taskDef, config).then(result => ({
          taskId: task.id,
          result,
        }));
      });

      const executions = await Promise.allSettled(promises);

      executions.forEach(execution => {
        if (execution.status === 'fulfilled') {
          results.set(execution.value.taskId, execution.value.result);
        }
      });
    } else {
      // Executar sequencialmente
      for (const task of phase.tasks) {
        const taskDef: TaskDefinition = {
          taskId: task.id,
          agentRole: task.agent,
          pipelineId,
          phaseId: phase.id,
          title: task.title,
          description: task.description,
        };

        const result = await this.executeTask(taskDef, config);
        results.set(task.id, result);
      }
    }

    return results;
  }

  /**
   * Cancelar execução de tarefa
   */
  async cancelTask(taskId: string): Promise<void> {
    this.logger.info('[PipelineExecutor] Canceling task', { taskId });
    this.activeExecutions.delete(taskId);
  }

  /**
   * Obter status de execução
   */
  getExecutionStatus(): {
    activeExecutions: number;
    queuedTasks: number;
  } {
    return {
      activeExecutions: this.activeExecutions.size,
      queuedTasks: 0, // TODO: implementar fila
    };
  }
}
