// Harness transport — fala com o motor Rust (src-tauri) via Tauri IPC.
// Fora do shell Tauri (navegador), features ficam ocultas — sem dados demo.
//
// Decomposed into domain modules under src/lib/harness/.
// This file re-exports everything for backward compatibility.

export {
  isTauriRuntime,
  invokeHarness,
  ok,
  unavailable,
} from './harness/transport';

export type {
  HarnessNodeIdentity,
  HarnessIdentityPayload,
  HarnessSyncStatus,
  OfflineMutation,
  CachedEntity,
  HarnessEnvStatus,
  HarnessRepo,
  HarnessOverview,
  HarnessSkill,
  HarnessMemorySession,
  HarnessSessionMessage,
  HarnessGitStatus,
  HarnessProposal,
  HarnessContextFile,
  HarnessAutomation,
  HarnessResult,
  AgentEvent,
  ToolCallDeltaPayload,
  ApprovalRequest,
  ApprovalDecision,
  DevToolExecutionResult,
  ExecPolicyRule,
  ExecPolicyData,
  ExecPolicyEvaluation,
  PatchFileChange,
  PatchFileChangeResult,
  PatchResult,
  DryRunResult,
  ContextFragment,
  FragmentCategory,
  FragmentConfig,
  AssembledContext,
  MemorySearchResult,
  FileChangeEvent,
  FileWatchSnapshot,
  HardeningStatus,
  ShellAnalysis,
  SecretEntry,
  FileSearchResult,
  FileSearchResponse,
  HookInfo,
  HookDispatchResult,
  ProviderInfo,
  AcpProviderInfo,
  RelationshipGraph,
  GraphNode,
  GraphEdge,
  VerifiedEvidenceItem,
  VerificationReport,
  LocalFileChange,
  LocalRepoStatus,
  DebugContext,
  DiagnosticsGauge,
  DiagnosticsProcess,
  DiagnosticsSnapshot,
  LlmUsageStats,
} from './harness/types';

export type { ReviewContext, ReviewScope } from './harness/prompt-templates';

export type {
  GitInfo,
  GitInfoCommit,
  FsmonitorOverride,
} from './harness/git-info';

export type { SkillFrontmatter } from './harness/skill-frontmatter';
export type {
  ExtractedContacts,
  BrowserScrapeResult,
  CnpjValidationResult,
} from './harness/browser';
export type { ProviderEnvStatus } from './harness/model-providers';
export type {
  InvestigationParams,
  InvestigationDossier,
  PublicSource,
  CategoryPublicSources,
  SourceHistoryLog,
  WebSnapshotResult,
} from './harness/intelligence';

import { coreClient } from './harness/core';
import { agentClient } from './harness/agent';
import { intelligenceClient } from './harness/intelligence';
import { execPolicyClient } from './harness/exec-policy';
import { patchClient } from './harness/patch';
import { contextClient } from './harness/context';
import { memoryClient } from './harness/memory';
import { fileWatcherClient } from './harness/file-watcher';
import { securityClient } from './harness/security';
import { fileSearchClient } from './harness/file-search';
import { hooksClient } from './harness/hooks';
import { modelProvidersClient } from './harness/model-providers';
import { debugClient } from './harness/debug';
import { promptTemplatesClient } from './harness/prompt-templates';
import { gitInfoClient } from './harness/git-info';
import { gitAttributionClient } from './harness/git-attribution';
import { skillFrontmatterClient } from './harness/skill-frontmatter';
import { browserClient } from './harness/browser';

import type { HarnessResult, HarnessRepo, LocalRepoStatus, DevToolExecutionResult } from './harness/types';
import { isTauriRuntime } from './harness/transport';

// ─── Composed client (merges all domain clients) ───────────────────────────

export const harnessClient = {
  ...coreClient,
  ...agentClient,
  ...intelligenceClient,
  ...execPolicyClient,
  ...patchClient,
  ...contextClient,
  ...memoryClient,
  ...fileWatcherClient,
  ...securityClient,
  ...fileSearchClient,
  ...hooksClient,
  ...modelProvidersClient,
  ...debugClient,
  ...promptTemplatesClient,
  ...gitInfoClient,
  ...gitAttributionClient,
  ...skillFrontmatterClient,
  ...browserClient,
};

export type HarnessClient = typeof harnessClient;
