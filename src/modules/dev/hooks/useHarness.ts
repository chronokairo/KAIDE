"use client";

// Barrel re-export — mantém compatibilidade com todos os 34+ consumidores.
// Cada hook vive em ./<hook-name>.ts dentro deste mesmo diretório.

export { useIsTauri } from './useHarnessRuntime';
export { useHarnessOverview } from './useHarnessOverview';
export { useHarnessSkills } from './useHarnessSkills';
export { useHarnessSkillFrontmatter } from './useHarnessSkillFrontmatter';
export { useHarnessMemorySessions, useHarnessSessionMessages, useHarnessMemorySessionsBatch, useMemoriesSearch } from './useHarnessMemory';
export { useHarnessGitScan, useCloneRepo, useHarnessGitRepoStatus } from './useHarnessGit';
export {
  useHarnessNodeIdentity,
  useHarnessSyncStatus,
  useHarnessQuorum,
  useHarnessQuorumOpenCount,
  useOfflineMutationQueue,
  useCachedErpEntities,
} from './useHarnessSync';
export { useHarnessContextFiles, useContextFragments, useAssembledContext } from './useHarnessContext';
export { useHarnessAutomations } from './useHarnessAutomations';
export { useAcpProviders, useRunAcpAgent, useAskIntelligenceAgent, useCreateHarnessSession, useStreamAgentSession } from './useHarnessAgent';
export { useExecuteDevTool } from './useHarnessDevTools';
export { useAddWorkspaceFolder } from './useHarnessWorkspace';
export { useFileWatchSnapshot, useApplyPatch, useHarnessFileEditor, useFileSearch } from './useHarnessFileOps';
export {
  useGraphData, useVerificationReport,
  useExecuteInvestigation, useGenerateDossier,
  usePublicSources, usePublicSourcesHistory, useAddPublicSource, useRemovePublicSource,
  useCaptureWebSnapshot, useCapturedSnapshots,
} from './useHarnessIntelligence';
export { useExecPolicy } from './useHarnessExecPolicy';
export { useHardeningStatus, useApplyProcessHardening, useShellCommandSafety } from './useHarnessSecurity';
export { useSecretsManager, useRedactSecretValue } from './useHarnessSecrets';
export { useHooksSystem } from './useHarnessHooksSystem';
export { useModelProviders, useModelProviderApiKey, useValidateModelProvider, useSetModelProviderApiKey, useSetModelProviderBase, useRemoveModelProvider, useProviderEnvStatus, useTestNvidiaNim } from './useHarnessModelProviders';
export { useResponseDebugContext, useDiagnostics, useLlmUsageStats, useResetLlmUsageStats } from './useHarnessDiagnostics';
export { usePromptTemplates, usePromptTemplate, useReviewContext, useGoalBudgetPrompt } from './useHarnessPromptTemplates';
export { useHarnessGitInfo } from './useHarnessGitInfo';
export { useHarnessBrowser } from './useHarnessBrowser';

export type {
  ExtractedContacts,
  BrowserScrapeResult,
  CnpjValidationResult,
  AcpProviderInfo,
  AgentEvent,
  ApprovalDecision,
  ApprovalRequest,
  AssembledContext,
  ContextFragment,
  DebugContext,
  DiagnosticsSnapshot,
  DryRunResult,
  ExecPolicyData,
  ExecPolicyEvaluation,
  FileSearchResponse,
  FileWatchSnapshot,
  HardeningStatus,
  HarnessAutomation,
  HarnessContextFile,
  HarnessEnvStatus,
  HarnessGitStatus,
  HarnessIdentityPayload,
  HarnessMemorySession,
  HarnessSessionMessage,
  HarnessOverview,
  HarnessProposal,
  HarnessRepo,
  HarnessSkill,
  HarnessSyncStatus,
  OfflineMutation,
  CachedEntity,
  HookDispatchResult,
  HookInfo,
  LlmUsageStats,
  LocalRepoStatus,
  MemorySearchResult,
  PatchFileChangeResult,
  PatchResult,
  ProviderInfo,
  RelationshipGraph,
  SecretEntry,
  ShellAnalysis,
  ToolCallDeltaPayload,
  VerificationReport,
  GitInfo,
  GitInfoCommit,
  FsmonitorOverride,
  ReviewContext,
  ReviewScope,
  SkillFrontmatter,
  ProviderEnvStatus,
  InvestigationParams,
  InvestigationDossier,
  PublicSource,
  CategoryPublicSources,
  SourceHistoryLog,
  WebSnapshotResult,
} from '@/modules/dev/harness-client';
