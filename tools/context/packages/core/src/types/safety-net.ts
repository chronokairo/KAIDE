// packages/core/src/types/safety-net.ts

/**
 * Types for the Agent Safety Net feature (V3).
 * Covers Action Log, Snapshot, Rollback, Dry-Run, and Tool contracts.
 */

// ─── Tool Types ──────────────────────────────────────────────

export type ToolName = 'read_file' | 'write_file' | 'list_files' | 'delete_file' | 'run_command' | 'search_code';

export type ActionResult = 'success' | 'error' | 'rejected' | 'blocked';

export type FileAction = 'read' | 'write' | 'delete' | 'create';

export type CommandRiskLevel = 'safe' | 'moderate' | 'destructive' | 'blocked';

export type UserDecision = 'accepted' | 'rejected' | 'timeout';

// ─── Action Log ──────────────────────────────────────────────

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
  pipelineId: string;
  phaseIndex: number;
  taskId: string;
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

// ─── Snapshot ────────────────────────────────────────────────

export type SnapshotFileAction = 'modified' | 'deleted' | 'created';

export interface SnapshotFileMetadata {
  path: string; // Relative path from workspace root
  action: SnapshotFileAction;
  originalHash: string; // SHA-256 of the original content (empty string for 'created')
  originalSize: number; // Size in bytes (0 for 'created')
}

export interface SnapshotMetadata {
  pipelineId: string;
  phaseIndex: number;
  phaseName: string;
  timestamp: string; // ISO 8601
  files: SnapshotFileMetadata[];
}

// ─── Snapshot Config ─────────────────────────────────────────

export interface SnapshotConfig {
  retentionDays: number;
  maxSizeMB: number;
}

export const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = {
  retentionDays: 7,
  maxSizeMB: 50,
};

// ─── Tool Contracts ──────────────────────────────────────────

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  filesAffected?: FileAffected[];
}

// ─── Rollback ────────────────────────────────────────────────

export interface RollbackResult {
  restored: number;
  deleted: number;
  errors: string[];
}

// ─── Dry-Run ─────────────────────────────────────────────────

export interface DryRunSummary {
  totalActions: number;
  writesPlanned: number;
  deletesPlanned: number;
  commandsPlanned: number;
  filesAffected: string[];
}
