/**
 * Anamnesic Core Package
 * 
 * Re-exports de todos os modulos para backward compatibility.
 */

// ─── Database & Storage ──────────────────────────────────────
export { getDatabase, DataSource } from './database';
export * from './export';

// ─── Services ────────────────────────────────────────────────
export * from './services/ActionLogService';
export * from './services/SnapshotService';
export * from './services/RollbackService';
export * from './utils/safePath';
export * from './chat';
export * from './services';
export * from './events';

// ─── Legacy Pipeline (deprecated - use ./pipeline) ───────────
export * from './pipeline';

// ─── Legacy Agent Config (deprecated - use ./agents) ─────────
export * from './agent-config';

// ─── NEW: Agent System v2 ────────────────────────────────────
export * as AgentsV2 from './agents';

// Re-export principais tipos do novo sistema para facilitar migracao
export {
  type IAgent,
  type IAgentContext,
  type IAgentRegistry,
  type AgentMetadata,
  type AgentCapability,
  type AgentResult,
  BaseAgent,
  AgentRegistry,
  AgentContextBuilder,
  getAgentRegistry,
  setAgentRegistry,
  type IAgentLifecycleHook,
  type IAgentLifecycleManager,
  type LifecycleEvent,
  type LifecyclePhase,
  AgentLifecycleManager,
  getLifecycleManager,
} from './agents/contracts';

export {
  type AgentTool,
  type ToolResult,
  type ToolContext,
  type IToolRegistry,
  ToolBuilder,
  ToolRegistry,
  getToolRegistry,
} from './agents/tools';

export {
  type AgentSettings,
  type AnamnesicConfig,
  DEFAULT_AGENT_SETTINGS,
  CONFIG_VERSION,
} from './agents/config';

// ─── NEW: Pipeline System v2 ─────────────────────────────────
export * as PipelineV2 from './pipeline';

export {
  type PhaseConfig,
  type PipelineTemplate,
  type PipelineSettings,
  type TaskDescription,
  type PipelineEvent,
  type PipelineEventType,
} from './pipeline/contracts';

// ─── API Types ───────────────────────────────────────────────
export type { ApiResponse, PaginatedResponse, ApiErrorResponse, AuthenticatedRequest } from './types/api';

// ─── Validation Schemas ───────────────────────────────────────
export {
  signupSchema,
  loginSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  createProjectSchema,
  updateProjectSchema,
  createContextEntrySchema,
  updateContextEntrySchema,
  createDecisionSchema,
  updateDecisionSchema,
  createApiKeySchema,
} from './validation/schemas';

// ─── Experimental Advanced Runtime Modules ───────────────────
// Intentionally not exported from the stable core entrypoint.

// ─── Validation Schemas ──────────────────────────────────────
export type {
  SignupInput,
  LoginInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateContextEntryInput,
  UpdateContextEntryInput,
  CreateDecisionInput,
  UpdateDecisionInput,
  CreateApiKeyInput,
} from './validation/schemas';
