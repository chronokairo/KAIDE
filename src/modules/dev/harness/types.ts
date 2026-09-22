// Harness Domain Types

export interface HarnessResult<T = unknown> {
  data: T;
  available: boolean;
}

export interface HarnessNodeIdentity {
  nodeId?: string;
  clusterId?: string;
  publicKey?: string;
  name?: string;
  version?: string;
  identity?: any;
  trustedPeerCount?: number;
  [key: string]: any;
}

export interface HarnessIdentityPayload {
  nodeId: string;
  signature: string;
  timestamp: number;
}

export interface HarnessSyncStatus {
  online?: boolean;
  peersCount?: number;
  lastSyncAt?: string;
  pendingChanges?: number;
  syncing?: boolean;
  peers_online?: number;
  peers_total?: number;
  [key: string]: any;
}

export interface OfflineMutation {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  payload: string;
  status: string;
  retry_count: number;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CachedEntity {
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  data: string;
  version: number;
  updated_at: string;
  synced_at: string;
}

export interface HarnessEnvStatus {
  isTauri: boolean;
  platform: string;
  arch: string;
}

export interface HarnessRepo {
  path: string;
  name: string;
  files?: number;
  branch?: string;
  tech_stack?: string[];
  ahead?: number;
  behind?: number;
  build_status?: string;
  last_activity?: string;
  [key: string]: any;
}

export interface LocalRepoStatus {
  path?: string;
  status?: string;
  branch?: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
  filesCount?: number;
  lastCommit?: string;
  clean?: boolean;
}

export interface HarnessOverview {
  sessionsCount?: number;
  activeAgents?: number;
  skillsCount?: number;
  status?: string;
  repos?: any[];
  [key: string]: any;
}

export interface HarnessSkill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tools?: string[];
  source?: string;
  body?: string;
}

export interface HarnessMemorySession {
  id: number;
  workspace?: string;
  title?: string;
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  messageCount?: number;
  message_count?: number;
  model?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface HarnessSessionMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface HarnessGitStatus {
  branch: string;
  clean: boolean;
  modified: string[];
  untracked: string[];
}

export interface HarnessProposal {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface HarnessContextFile {
  path: string;
  relativePath?: string;
  sizeBytes?: number;
  category?: string;
  name?: string;
  lines?: number;
  modified?: string;
  [key: string]: any;
}

export interface HarnessAutomation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export interface AgentEvent {
  type: string;
  payload: any;
}

export interface ToolCallDeltaPayload {
  index: number;
  name?: string;
  args_delta: string;
}

export interface ApprovalRequest {
  id: string;
  tool: string;
  command?: string;
  description?: string;
  summary?: string;
  risk?: string;
  params?: Record<string, unknown>;
}

export type ApprovalDecision = 'allow' | 'deny' | 'allow_always' | 'allow_session' | 'allow_once';

export interface DevToolExecutionResult {
  success?: boolean;
  output?: string;
  error?: string;
  tool_id?: string;
  exit_code?: number;
  duration_ms?: number;
  timestamp?: string;
  stdout?: string;
  stderr?: string;
  [key: string]: any;
}

export interface ExecPolicyRule {
  command: string;
  decision: 'allow' | 'prompt' | 'forbidden';
  scope?: string;
}

export interface ExecPolicyData {
  rules: ExecPolicyRule[];
}

export interface ExecPolicyEvaluation {
  allowed: boolean;
  decision: 'allow' | 'prompt' | 'forbidden';
  rule?: ExecPolicyRule;
}

export interface PatchFileChange {
  path: string;
  hunksCount?: number;
  addedLines?: number;
  deletedLines?: number;
  [key: string]: any;
}

export interface PatchFileChangeResult {
  path?: string;
  success?: boolean;
  error?: string;
  change?: any;
  [key: string]: any;
}

export interface PatchResult {
  success?: boolean;
  modifiedFiles?: string[];
  backupPath?: string;
  error?: string;
  patch_id?: number;
  summary?: any;
  applied?: any;
  [key: string]: any;
}

export interface DryRunResult {
  valid?: boolean;
  fileChanges?: PatchFileChange[];
  conflicts?: string[];
  summary?: any;
  changes?: any[];
  [key: string]: any;
}

export type FragmentCategory = 'agent_guide' | 'project_meta' | 'repo_map' | 'custom';

export interface ContextFragment {
  category?: FragmentCategory | string;
  title?: string;
  content?: string;
  tokenEstimate?: number;
  path?: string;
  lines?: number;
  name?: string;
  [key: string]: any;
}

export interface FragmentConfig {
  include_files?: string[];
  exclude_files?: string[];
  total_max_bytes?: number;
}

export interface AssembledContext {
  promptContext: string;
  fragmentsUsed: string[];
  totalBytes: number;
}

export interface MemorySearchResult {
  sessionId?: number;
  session_id?: number;
  messageId?: number;
  snippet?: string;
  summary?: string;
  score?: number;
  [key: string]: any;
}

export interface FileChangeEvent {
  path: string;
  kind: 'create' | 'modify' | 'remove' | 'rename';
}

export interface FileWatchSnapshot {
  events: FileChangeEvent[];
  timestamp: string;
}

export interface HardeningStatus {
  ptraceDisabled?: boolean;
  coreDumpsDisabled?: boolean;
  environmentSanitized?: boolean;
  applied?: boolean;
  platform?: string;
  timestamp?: string;
}

export interface ShellAnalysis {
  command?: string;
  isSafe?: boolean;
  isDangerous?: boolean;
  reasons?: string[];
  safety: string;
  reason: string;
  tokens: string[];
}

export interface SecretEntry {
  key?: string;
  name?: string;
  scope?: string;
  createdAt?: string;
  created_at?: string;
}

export interface FileSearchResult {
  path: string;
  score: number;
  isExact: boolean;
}

export interface FileSearchResponse {
  results: FileSearchResult[];
  totalMatches: number;
}

export interface LlmUsageStats {
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalCostUsd?: number;
  total_tokens?: number;
  total_prompt_tokens?: number;
  total_completion_tokens?: number;
  total_cost_usd?: number;
  call_count?: number;
  [key: string]: any;
}

export interface InvestigationParams {
  query?: string;
  targetName?: string;
  depth?: number;
}

export interface InvestigationDossier {
  id: string;
  title: string;
  summary: string;
  findings: string[];
}

export interface PublicSource {
  id: string;
  category: string;
  url: string;
  status: string;
}

export interface CategoryPublicSources {
  category: string;
  sources: PublicSource[];
}

export interface SourceHistoryLog {
  id: string;
  source: string;
  action: string;
  timestamp: string;
}

export interface WebSnapshotResult {
  url?: string;
  imagePath?: string;
  html?: string;
  success: boolean;
}

export interface HookInfo {
  name?: string;
  event: string;
  command: string;
  enabled?: boolean;
  matcher?: string | null;
  group_index?: number;
  handler_index?: number;
  [key: string]: any;
}

export interface HookDispatchResult {
  hookName?: string;
  success?: boolean;
  exitCode?: number;
  exit_code?: number | null;
  output?: string;
  [key: string]: any;
}

export interface ProviderInfo {
  id: string;
  name: string;
  baseUrl?: string;
  base_url?: string;
  wireApi?: string;
  wire_api?: string;
  configured?: boolean;
  has_store_key?: boolean;
  has_auth?: boolean;
  has_env_key?: boolean;
  store_base?: string | null;
  [key: string]: any;
}

export interface ProviderEnvStatus {
  ollama: boolean;
  openAi: boolean;
  anthropic: boolean;
  nvidiaNim: boolean;
}

export interface AcpProviderInfo {
  id: string;
  name: string;
  type: string;
  available: boolean;
  default_model?: string;
  display_name?: string;
  [key: string]: any;
}

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  sub_label?: string;
  node_type?: string;
  risk_score?: number;
  origin?: string;
  [key: string]: any;
}

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
  verified?: boolean;
  [key: string]: any;
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  target?: string;
  total_entities?: number;
  total_connections?: number;
  hidden_nexus_count?: number;
  [key: string]: any;
}

export interface VerifiedEvidenceItem {
  id: string;
  title: string;
  source: string;
  confidence: number;
}

export interface VerificationReport {
  targetName?: string;
  targetDoc?: string;
  score?: number;
  verified?: boolean;
  evidence?: VerifiedEvidenceItem[];
  target?: string;
  score_global_confiabilidade?: number;
  lgpd_compliance_status?: string;
  total_evidencias_auditadas?: number;
  evidencias_confirmadas?: number;
  alertas_inconsistencia?: number;
  evidencias?: any[];
  [key: string]: any;
}

export interface LocalFileChange {
  path: string;
  status: string;
}

export interface DebugContext {
  statusCode?: number;
  requestId?: string;
  cfRay?: string;
  errorMessage?: string;
}

export interface DiagnosticsGauge {
  name: string;
  value: number;
}

export interface DiagnosticsProcess {
  rssBytes?: number;
  cpuPercent?: number;
  threadsCount?: number;
  pid?: number;
  resident_memory_bytes?: number;
  physical_footprint_bytes?: number;
  [key: string]: any;
}

export interface DiagnosticsSnapshot {
  gauges: DiagnosticsGauge[];
  process: DiagnosticsProcess;
  timestamp: string;
}

