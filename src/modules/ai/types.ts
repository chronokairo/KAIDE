export interface AutonomousAgent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'paused' | 'error';
  capabilities: string[];
  last_execution: string;
  tokens_used: number;
}

export interface AiAutomationTask {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  success_rate: number;
}
