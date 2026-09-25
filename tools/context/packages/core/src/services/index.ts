export { ProjectService } from './ProjectService';
export { ContextService } from './ContextService';
export { DecisionService } from './DecisionService';
export { ApiKeyService } from './ApiKeyService';
export { SyncConfigService } from './SyncConfigService';
export type { CreateSyncConfigInput, UpdateSyncConfigInput, SyncResult } from './SyncConfigService';
export { AutoSyncService } from './AutoSyncService';

// Safety Net Services
export { ActionLogService } from './ActionLogService';
export { SnapshotService } from './SnapshotService';
export { RollbackService } from './RollbackService';

// Chat History Service
export { ChatHistoryService } from './ChatHistoryService';
export type { SaveHistoryInput, HistoryFilter, BackupInfo, RecoveryResult } from './ChatHistoryService';

// Authentication & Authorization Services
export { AuthService } from './AuthService';
export type { AuthCredentials, SignupInput, TokenPayload, AuthResponse } from './AuthService';
export { UserService } from './UserService';
export type { CreateUserInput } from './UserService';
export { WorkspaceService } from './WorkspaceService';
export type { CreateWorkspaceInput } from './WorkspaceService';

// Advanced Agent Services
export { AgentService } from './AgentService';
export type { CreateAgentInput, UpdateAgentInput } from './AgentService';
export { TaskService } from './TaskService';
export type { CreateTaskInput, UpdateTaskInput } from './TaskService';
export { WorkflowService } from './WorkflowService';
export type { CreateWorkflowInput } from './WorkflowService';
export { SecurityAnalysisService } from './SecurityAnalysisService';
export type { CreateSecurityAnalysisInput } from './SecurityAnalysisService';
export { ExecutionLogService } from './ExecutionLogService';
export type { CreateExecutionLogInput } from './ExecutionLogService';

export {
	AdaptiveOrchestratorService,
	type OrchestratorRequest,
	type OrchestratorPlan,
	type OrchestratorPolicy,
	type PolicyEvaluation,
	type ContinuousOperationState,
	type StepExecutionFeedback,
} from './AdaptiveOrchestratorService';
export {
	OrchestratorRuntimeService,
	type CreateOrchestratorPlanInput,
	type StartOrchestratorRunInput,
} from './OrchestratorRuntimeService';

// ─── PHASE 8: Advanced Services (Execution, Persistence, Monitoring) ──────────

// Execution Services
export { PipelineTaskExecutionService } from './PipelineTaskExecutionService';
export type { TaskDefinition, TaskExecutionConfig } from './PipelineTaskExecutionService';

// Streaming & Real-time Services
export { StreamingChatService, createStreamingEndpoints } from './StreamingChatService';
export type { StreamConfig, StreamMessage } from './StreamingChatService';

// Persistence & Sync Services
export { PersistentEventStore, EventEntity } from './PersistentEventStore';
export type {} from './PersistentEventStore';

export { PersistentEventBus, getPersistentEventBus } from '../events/PersistentEventBus';
export { ChatSyncService } from './ChatSyncService';
export type { SyncStatus } from './ChatSyncService';

// Safety Net Services
export { SafetyNetIntegrationService } from './SafetyNetIntegrationService';
export type { PhaseSnapshot } from './SafetyNetIntegrationService';

// Resilience & Fallback Services
export { ModelFallbackService } from './ModelFallbackService';
export type {
	FallbackStrategy,
	ModelExecutionResult,
} from './ModelFallbackService';

// Monitoring & Metrics Services
export { MetricsService } from './MetricsService';
export type {
	ExecutionMetric,
	MetricsSnapshot,
	AgentMetrics,
	Alert,
} from './MetricsService';

// Retention & Cleanup Services
export { RetentionPolicyService } from './RetentionPolicyService';
export type {
	RetentionPolicy,
	CleanupResult,
} from './RetentionPolicyService';

// Diagnostic Services
export { DiagnosticPipelineService } from './DiagnosticPipelineService';
export type {
	DiagnosticPipeline,
	DiagnosticReason,
} from './DiagnosticPipelineService';

// Workflow Services
export { ParallelWorkflowExecutor } from './ParallelWorkflowExecutor';
export type {
	WorkflowStep,
	StepExecution,
	WorkflowExecution,
	StepStatus,
} from './ParallelWorkflowExecutor';

export { WorkflowTriggerService } from './WorkflowTriggerService';
export type {
	WorkflowTrigger,
	TriggerType,
	TriggerConfig,
	TriggerExecution,
	EventTriggerConfig,
	FileTriggerConfig,
	ScheduleTriggerConfig,
	WebhookTriggerConfig,
} from './WorkflowTriggerService';
