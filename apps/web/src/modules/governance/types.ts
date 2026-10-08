/**
 * Safety Net, Governance & Model Routing Types
 * Portado e consolidado do ThinkCoffee para o Kaide.
 */

// ─── Tool & Execution Types ───────────────────────────────────────────────────

export type ToolName =
  | 'read_file'
  | 'write_file'
  | 'replace_file_content'
  | 'list_files'
  | 'delete_file'
  | 'run_command'
  | 'search_code';

export type ActionResult = 'success' | 'error' | 'rejected' | 'blocked';

export type FileAction = 'read' | 'write' | 'delete' | 'create';

export type CommandRiskLevel = 'safe' | 'moderate' | 'destructive' | 'blocked';

export type UserDecision = 'accepted' | 'rejected' | 'timeout';

// ─── Action Log (Audit Trail) ────────────────────────────────────────────────

export interface FileAffected {
  path: string;
  action: FileAction;
}

export interface CommandDetails {
  command: string;
  exitCode?: number;
  validationResult: CommandRiskLevel;
  userDecision?: UserDecision;
}

export interface ActionLogEntry {
  id: string; // UUID v4
  timestamp: string; // ISO 8601
  sessionId: string;
  phaseIndex?: number;
  taskId?: string;
  agentRole: string;
  toolName: ToolName;
  input: Record<string, unknown>;
  output: string;
  result: ActionResult;
  durationMs: number;
  dryRun: boolean;
  filesAffected?: FileAffected[];
  commandDetails?: CommandDetails;
}

// ─── Snapshot & Rollback ─────────────────────────────────────────────────────

export type SnapshotFileAction = 'modified' | 'deleted' | 'created';

export interface SnapshotFileMetadata {
  path: string; // Relative path from workspace root
  action: SnapshotFileAction;
  originalHash: string; // SHA-256 of the original content (empty string for 'created')
  originalSize: number; // Size in bytes (0 for 'created')
}

export interface SnapshotMetadata {
  sessionId: string;
  phaseIndex: number;
  phaseName: string;
  timestamp: string; // ISO 8601
  files: SnapshotFileMetadata[];
}

export interface SnapshotConfig {
  retentionDays: number;
  maxSizeMB: number;
}

export const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = {
  retentionDays: 7,
  maxSizeMB: 100,
};

export interface RollbackResult {
  restored: number;
  deleted: number;
  errors: string[];
}

// ─── Dry-Run / Simulação ─────────────────────────────────────────────────────

export interface PlannedAction {
  id: string;
  tool: ToolName;
  description: string;
  target?: string;
  diffPreview?: string;
  command?: string;
  riskLevel: CommandRiskLevel;
  timestamp: string;
}

export interface DryRunSummary {
  totalActions: number;
  writesPlanned: number;
  deletesPlanned: number;
  commandsPlanned: number;
  filesAffected: string[];
}

// ─── Command Validation ──────────────────────────────────────────────────────

export interface CommandValidationResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
  riskLevel: CommandRiskLevel;
}

// ─── Quality Presets & Cost Tiers ────────────────────────────────────────────

export type QualityPreset =
  | 'free-tier'
  | 'budget-tier'
  | 'lite-tier'
  | 'standard-tier'
  | 'premium-tier'
  | 'ultra-tier';

export interface QualityPresetConfig {
  id: QualityPreset;
  label: string;
  multiplier: number;
  description: string;
  defaultModel: string;
  fallbackModel: string;
  recommendedRoles: string[];
}
