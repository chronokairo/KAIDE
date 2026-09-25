import { OllamaService, LLMMessage } from '../ollama/ollama-service';
import { RealDockerService } from '../docker/real-docker-service';
import { PolicyEngine } from '../policy/policy-engine';
import { AgentOrchestrator, TaskPlan, TaskStep } from '../orchestrator/agent-orchestrator';
import { ContainerMode } from '../../entities/docker/model/types';

export interface AgentConfig {
  containerMode: ContainerMode;
  ollamaModel: string;
  ollamaBaseUrl: string;
}

export interface AgentState {
  status: 'idle' | 'initializing' | 'ready' | 'error';
  currentTask?: TaskPlan;
  errorMessage?: string;
}

export interface TaskRequest {
  id: string;
  userMessage: string;
}

export class AgentService {
  private ollamaService: OllamaService;
  private dockerService: RealDockerService;
  private policyEngine: PolicyEngine;
  private orchestrator: AgentOrchestrator;
  private state: AgentState;
  private conversationHistory: LLMMessage[] = [];

  constructor(config?: AgentConfig) {
    this.ollamaService = new OllamaService({
      model: config?.ollamaModel,
      baseUrl: config?.ollamaBaseUrl,
    });

    this.dockerService = new RealDockerService();
    this.policyEngine = new PolicyEngine();
    this.orchestrator = new AgentOrchestrator(this.dockerService, {
      defaultMode: config?.containerMode || 'ubuntu',
    });

    this.state = {
      status: 'idle',
    };
  }

  async initialize(): Promise<void> {
    this.state = { status: 'initializing' };

    try {
      await this.orchestrator.initialize();
      this.state = { status: 'ready' };
    } catch (error) {
      this.state = {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to initialize',
      };
      throw error;
    }
  }

  async processRequest(request: TaskRequest): Promise<TaskPlan> {
    if (this.state.status !== 'ready') {
      throw new Error('Agent not ready. Call initialize() first.');
    }

    this.conversationHistory.push({
      role: 'user',
      content: request.userMessage,
    });

    let plan;
    try {
      plan = await this.ollamaService.generateStructuredPlan(request.userMessage);
    } catch (error) {
      // Fallback for when Ollama is not available
      plan = {
        description: `Process: ${request.userMessage}`,
        steps: [
          {
            command: `echo "Processing: ${request.userMessage}"`,
            description: 'Execute the requested task',
          },
        ],
      };
    }

    const taskPlan: TaskPlan = {
      id: request.id,
      description: plan?.description || `Process: ${request.userMessage}`,
      steps: (plan?.steps || []).map((step, index) => ({
        id: `step_${index}_${Date.now()}`,
        command: step.command,
        description: step.description,
        status: 'pending',
      })),
      status: 'pending',
    };

    const validatedSteps = this.validateTaskSteps(taskPlan.steps);
    if (!validatedSteps.allValid) {
      throw new Error(
        `Task contains blocked commands: ${validatedSteps.blockedCommands.join(', ')}`
      );
    }

    const result = await this.orchestrator.executeTask(taskPlan);

    if (result.status === 'completed') {
      this.conversationHistory.push({
        role: 'assistant',
        content: `Task completed: ${result.description}`,
      });
    }

    return result;
  }

  async chat(message: string): Promise<string> {
    return this.ollamaService.chat(message, this.conversationHistory);
  }

  getState(): AgentState {
    return this.state;
  }

  getConversationHistory(): LLMMessage[] {
    return this.conversationHistory;
  }

  clearConversation(): void {
    this.conversationHistory = [];
  }

  private validateTaskSteps(steps: TaskStep[]): {
    allValid: boolean;
    blockedCommands: string[];
  } {
    const blockedCommands: string[] = [];

    for (const step of steps) {
      const validation = this.policyEngine.validateCommand(step.command);
      if (!validation.valid) {
        blockedCommands.push(step.command);
      }
    }

    return {
      allValid: blockedCommands.length === 0,
      blockedCommands,
    };
  }
}
