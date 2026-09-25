import { AgentService } from '@/processes/agent/agent-service';
import { config } from '@/shared/lib/config';
import { ContainerMode } from '@/entities/docker/model/types';

let agentInstance: AgentService | null = null;

export function getAgentService(): AgentService {
  if (!agentInstance) {
    agentInstance = new AgentService({
      containerMode: config.get('defaultContainerMode') as ContainerMode,
      ollamaModel: config.get('ollamaModel') as string,
      ollamaBaseUrl: config.get('ollamaBaseUrl') as string,
    });
  }
  return agentInstance;
}

export function resetAgentService(): void {
  agentInstance = null;
}