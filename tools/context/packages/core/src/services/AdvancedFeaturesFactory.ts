import { Logger } from '../utils/Logger';
import TaskExecutorService from './TaskExecutorService';
import WebSocketServer from './WebSocketServer';
import WorkflowExecutionEngine from './WorkflowExecutionEngine';
import AdvancedSecurityAnalysisService from './AdvancedSecurityAnalysisService';
import AttackSimulationFramework from './AttackSimulationFramework';
import { Server as HTTPServer } from 'http';
import { AIProvider } from '../providers/AIProvider';
import { PipelineTaskExecutionService } from './PipelineTaskExecutionService';
import { StreamingChatService } from './StreamingChatService';
import { PersistentEventStore } from './PersistentEventStore';
import { ChatSyncService } from './ChatSyncService';
import { SafetyNetIntegrationService } from './SafetyNetIntegrationService';
import { ModelFallbackService } from './ModelFallbackService';
import { MetricsService } from './MetricsService';
import { RetentionPolicyService } from './RetentionPolicyService';
import { DiagnosticPipelineService } from './DiagnosticPipelineService';
import { ParallelWorkflowExecutor } from './ParallelWorkflowExecutor';
import { WorkflowTriggerService } from './WorkflowTriggerService';
import { ChatHistoryService } from './ChatHistoryService';
import { ChatService } from '../chat';
import { DataSource } from 'typeorm';

/**
 * Advanced Features Factory (Phase 5-8)
 * 
 * Integrates and orchestrates:
 * - Phase 5: Task executor with sandboxing & WebSocket real-time updates
 * - Phase 6: Workflow execution engine with dependency resolution
 * - Phase 7: Advanced security analysis & attack simulation
 * - Phase 8: Execution, persistence, monitoring & automation
 */

export interface AdvancedFeaturesConfig {
  httpServer: HTTPServer;
  jwtSecret: string;
  aiProvider: AIProvider;
  db?: DataSource;
  projectPath?: string;
  enableTaskExecutor?: boolean;
  enableWebSocket?: boolean;
  enableWorkflowEngine?: boolean;
  enableSecurityAnalysis?: boolean;
  enableAttackSimulation?: boolean;
  enablePipelineExecution?: boolean;
  enableStreaming?: boolean;
  enablePersistence?: boolean;
  enableMonitoring?: boolean;
  enableAutomation?: boolean;
}

export class AdvancedFeaturesFactory {
  private taskExecutor: TaskExecutorService;
  private webSocketServer: WebSocketServer;
  private workflowEngine: WorkflowExecutionEngine;
  private securityAnalysis: AdvancedSecurityAnalysisService;
  private attackSimulation: AttackSimulationFramework;
  private pipelineExecutor: PipelineTaskExecutionService;
  private streamingChat: StreamingChatService;
  private eventStore: PersistentEventStore;
  private chatSync: ChatSyncService;
  private safetyNet: SafetyNetIntegrationService;
  private modelFallback: ModelFallbackService;
  private metrics: MetricsService;
  private retentionPolicy: RetentionPolicyService;
  private diagnosticPipelines: DiagnosticPipelineService;
  private workflowExecutor: ParallelWorkflowExecutor;
  private workflowTriggers: WorkflowTriggerService;
  private logger = Logger.getInstance();

  constructor(config: AdvancedFeaturesConfig) {
    this.logger.info('[AdvancedFeatures] Initializing Phase 5-8 features');

    // Phase 5: Task Executor
    if (config.enableTaskExecutor !== false) {
      this.taskExecutor = new TaskExecutorService(config.aiProvider);
      this.logger.info('[AdvancedFeatures] Task Executor initialized');
    }

    // Phase 5: WebSocket Server
    if (config.enableWebSocket !== false) {
      this.webSocketServer = new WebSocketServer(config.httpServer, config.jwtSecret);
      this.logger.info('[AdvancedFeatures] WebSocket Server initialized');
    }

    // Phase 6: Workflow Engine
    if (config.enableWorkflowEngine !== false) {
      this.workflowEngine = new WorkflowExecutionEngine();
      this.logger.info('[AdvancedFeatures] Workflow Execution Engine initialized');
    }

    // Phase 7: Security Analysis
    if (config.enableSecurityAnalysis !== false) {
      this.securityAnalysis = new AdvancedSecurityAnalysisService(config.aiProvider);
      this.logger.info('[AdvancedFeatures] Advanced Security Analysis Service initialized');
    }

    // Phase 7: Attack Simulation
    if (config.enableAttackSimulation !== false) {
      this.attackSimulation = new AttackSimulationFramework();
      this.logger.info('[AdvancedFeatures] Attack Simulation Framework initialized');
    }

    // Phase 8: Pipeline Task Execution
    if (config.enablePipelineExecution !== false) {
      this.pipelineExecutor = new PipelineTaskExecutionService(config.aiProvider);
      this.logger.info('[AdvancedFeatures] Pipeline Task Executor initialized');
    }

    // Phase 8: Streaming Chat
    if (config.enableStreaming !== false) {
      this.streamingChat = new StreamingChatService(config.aiProvider);
      this.logger.info('[AdvancedFeatures] Streaming Chat Service initialized');
    }

    // Phase 8: Persistent Event Store
    if (config.enablePersistence !== false && config.db) {
      this.eventStore = new PersistentEventStore(config.db);
      this.logger.info('[AdvancedFeatures] Persistent Event Store initialized');
    }

    // Phase 8: Chat Sync (requires ChatHistoryService - will be injected later)
    if (config.enablePersistence !== false) {
      this.logger.info('[AdvancedFeatures] Chat Sync Service prepared (requires injection)');
    }

    // Phase 8: Safety Net Integration
    if (config.enablePersistence !== false) {
      this.safetyNet = new SafetyNetIntegrationService(config.projectPath);
      this.logger.info('[AdvancedFeatures] Safety Net Integration Service initialized');
    }

    // Phase 8: Model Fallback Service
    if (config.enablePersistence !== false) {
      this.modelFallback = new ModelFallbackService(config.aiProvider);
      this.logger.info('[AdvancedFeatures] Model Fallback Service initialized');
    }

    // Phase 8: Metrics Service
    if (config.enableMonitoring !== false) {
      this.metrics = new MetricsService(config.db);
      this.logger.info('[AdvancedFeatures] Metrics Service initialized');
    }

    // Phase 8: Retention Policy Service
    if (config.enableMonitoring !== false) {
      this.retentionPolicy = new RetentionPolicyService();
      this.logger.info('[AdvancedFeatures] Retention Policy Service initialized');
    }

    // Phase 8: Diagnostic Pipeline Service
    if (config.enableAutomation !== false) {
      this.diagnosticPipelines = new DiagnosticPipelineService();
      this.logger.info('[AdvancedFeatures] Diagnostic Pipeline Service initialized');
    }

    // Phase 8: Parallel Workflow Executor
    if (config.enableAutomation !== false) {
      this.workflowExecutor = new ParallelWorkflowExecutor(5);
      this.logger.info('[AdvancedFeatures] Parallel Workflow Executor initialized');
    }

    // Phase 8: Workflow Trigger Service
    if (config.enableAutomation !== false) {
      this.workflowTriggers = new WorkflowTriggerService();
      this.logger.info('[AdvancedFeatures] Workflow Trigger Service initialized');
    }
  }

  // ─── Phase 5 Getters ──────────────────────────────────────
  getTaskExecutor(): TaskExecutorService {
    return this.taskExecutor;
  }

  getWebSocketServer(): WebSocketServer {
    return this.webSocketServer;
  }

  getWorkflowEngine(): WorkflowExecutionEngine {
    return this.workflowEngine;
  }

  getSecurityAnalysis(): AdvancedSecurityAnalysisService {
    return this.securityAnalysis;
  }

  getAttackSimulation(): AttackSimulationFramework {
    return this.attackSimulation;
  }

  // ─── Phase 8 Getters ──────────────────────────────────────
  getPipelineExecutor(): PipelineTaskExecutionService {
    return this.pipelineExecutor;
  }

  getStreamingChat(): StreamingChatService {
    return this.streamingChat;
  }

  getEventStore(): PersistentEventStore {
    return this.eventStore;
  }

  getChatSync(): ChatSyncService {
    return this.chatSync;
  }

  getSafetyNet(): SafetyNetIntegrationService {
    return this.safetyNet;
  }

  getModelFallback(): ModelFallbackService {
    return this.modelFallback;
  }

  getMetrics(): MetricsService {
    return this.metrics;
  }

  getRetentionPolicy(): RetentionPolicyService {
    return this.retentionPolicy;
  }

  getDiagnosticPipelines(): DiagnosticPipelineService {
    return this.diagnosticPipelines;
  }

  getWorkflowExecutor(): ParallelWorkflowExecutor {
    return this.workflowExecutor;
  }

  getWorkflowTriggers(): WorkflowTriggerService {
    return this.workflowTriggers;
  }

  /**
   * Injetar ChatHistoryService e ChatService para ChatSync
   */
  injectChatServices(
    chatHistoryService: ChatHistoryService,
    chatService: ChatService
  ): void {
    if (!this.chatSync && chatHistoryService && chatService) {
      this.chatSync = new ChatSyncService(chatService, chatHistoryService);
      this.logger.info('[AdvancedFeatures] Chat Sync Service injected');
    }
  }

  /**
   * Injetar RetentionPolicy nas services apropriadas
   */
  injectRetentionPolicy(
    chatHistoryService: ChatHistoryService
  ): void {
    if (this.retentionPolicy && chatHistoryService) {
      this.logger.info('[AdvancedFeatures] Retention Policy injected');
    }
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      phase5: {
        taskExecutor: this.taskExecutor?.getResourceStats() || null,
        websocket: this.webSocketServer?.getStats() || null,
        workflowEngine: {
          initialized: !!this.workflowEngine,
        },
        securityAnalysis: {
          initialized: !!this.securityAnalysis,
        },
        attackSimulation: {
          initialized: !!this.attackSimulation,
        },
      },
      phase8: {
        pipelineExecutor: {
          initialized: !!this.pipelineExecutor,
        },
        streamingChat: {
          initialized: !!this.streamingChat,
          activeStreams: this.streamingChat?.getActiveStreamsCount() || 0,
        },
        persistence: {
          eventStore: !!this.eventStore,
          chatSync: !!this.chatSync,
        },
        resilience: {
          safetyNet: !!this.safetyNet,
          modelFallback: !!this.modelFallback,
        },
        monitoring: {
          metrics: !!this.metrics,
          retentionPolicy: !!this.retentionPolicy,
        },
        automation: {
          diagnosticPipelines: !!this.diagnosticPipelines,
          workflowExecutor: !!this.workflowExecutor,
          workflowTriggers: !!this.workflowTriggers,
        },
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    this.logger.info('[AdvancedFeatures] Shutting down all services');

    try {
      if (this.webSocketServer) {
        await this.webSocketServer.close();
      }

      if (this.streamingChat) {
        this.streamingChat.cancelAllStreams();
      }

      if (this.retentionPolicy) {
        await this.retentionPolicy.stop();
      }

      if (this.workflowTriggers) {
        await this.workflowTriggers.cleanup();
      }
    } catch (error) {
      this.logger.error('[AdvancedFeatures] Error during shutdown', { error });
    }

    this.logger.info('[AdvancedFeatures] All services shut down');
  }
}

// Export all service types and interfaces
export {
  TaskExecutorService,
  SandboxConfig,
  ExecutionContext,
  ExecutionMetrics,
  ExecutionResult,
  SandboxedCode,
} from './TaskExecutorService';

export {
  WebSocketServer,
  WebSocketMessage,
  TaskUpdateMessage,
  AgentStatusMessage,
  WorkflowProgressMessage,
  ClientSubscription,
} from './WebSocketServer';

export {
  WorkflowExecutionEngine,
  WorkflowStep,
  WorkflowDefinition,
  StepExecution,
  WorkflowExecution,
  StepResult,
} from './WorkflowExecutionEngine';

export {
  AdvancedSecurityAnalysisService,
  Vulnerability,
  AttackVector,
  SecurityAnalysisResult,
  SecurityRecommendation,
  ThreatModel,
} from './AdvancedSecurityAnalysisService';

export {
  AttackSimulationFramework,
  AttackSimulation,
  AttackPayload,
  SimulationResult,
  DetectionEvent,
  SimulationMetrics,
} from './AttackSimulationFramework';

// Phase 8 Exports
export {
  PipelineTaskExecutionService,
  TaskDefinition,
  TaskExecutionConfig,
} from './PipelineTaskExecutionService';

export {
  StreamingChatService,
  createStreamingEndpoints,
  StreamConfig,
  StreamMessage,
} from './StreamingChatService';

export {
  PersistentEventStore,
  EventEntity,
} from './PersistentEventStore';

export {
  ChatSyncService,
  SyncStatus,
} from './ChatSyncService';

export {
  SafetyNetIntegrationService,
  PhaseSnapshot,
} from './SafetyNetIntegrationService';

export {
  ModelFallbackService,
  FallbackStrategy,
  ModelExecutionResult,
} from './ModelFallbackService';

export {
  MetricsService,
  ExecutionMetric,
  MetricsSnapshot,
  AgentMetrics,
  Alert,
} from './MetricsService';

export {
  RetentionPolicyService,
  RetentionPolicy,
  CleanupResult,
} from './RetentionPolicyService';

export {
  DiagnosticPipelineService,
  DiagnosticReason,
  DiagnosticPipeline,
} from './DiagnosticPipelineService';

export {
  ParallelWorkflowExecutor,
  WorkflowStep,
  StepStatus,
  StepExecution,
  WorkflowExecution,
} from './ParallelWorkflowExecutor';

export {
  WorkflowTriggerService,
  WorkflowTrigger,
  TriggerType,
  TriggerConfig,
  TriggerExecution,
  EventTriggerConfig,
  FileTriggerConfig,
  ScheduleTriggerConfig,
  WebhookTriggerConfig,
} from './WorkflowTriggerService';

export default AdvancedFeaturesFactory;
