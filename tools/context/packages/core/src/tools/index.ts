/**
 * Core tools for Anamnesic agents.
 * Centralized, safe, and logged file/command operations.
 */

// File tools
export {
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  searchCode,
  type ToolContext,
  type ReadFileInput,
  type WriteFileInput,
  type DeleteFileInput,
  type ListFilesInput,
  type SearchCodeInput,
} from './file-tools';

// Command tools
export {
  runCommand,
  isCommandSafe,
  getCommandRiskLevel,
  type RunCommandInput,
  type RunCommandOptions,
} from './run-command';

// Re-export types
export type { ToolResult, ToolName, FileAction, CommandRiskLevel } from '../types/safety-net';
