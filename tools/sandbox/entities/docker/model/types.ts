export interface ContainerConfig {
  id: string;
  name: string;
  image: string;
  mode: ContainerMode;
  status: ContainerStatus;
  ports: number[];
  volumes: string[];
  environment: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export type ContainerMode = 'debian' | 'ubuntu' | 'nixos';

export type ContainerStatus = 
  | 'pending'
  | 'running'
  | 'stopped'
  | 'paused'
  | 'error';

export interface ContainerExecutionResult {
  success: boolean;
  output: string;
  exitCode: number | null;
  duration: number;
}

export interface ContainerCommand {
  containerId: string;
  command: string;
  args?: string[];
  workingDir?: string;
  timeout?: number;
}

export interface SandboxPolicy {
  allowNetwork: boolean;
  allowFileSystem: boolean;
  allowedPaths: string[];
  maxMemory?: number;
  maxCpu?: number;
  allowedCommands?: string[];
  blockedCommands?: string[];
}
