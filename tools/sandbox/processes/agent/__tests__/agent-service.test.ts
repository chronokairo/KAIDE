import { describe, it, expect, beforeEach } from 'vitest';
import { AgentService } from '../agent-service';

describe('AgentService', () => {
  let agentService: AgentService;

  beforeEach(() => {
    agentService = new AgentService({
      containerMode: 'ubuntu',
      ollamaModel: 'llama3.2',
      ollamaBaseUrl: 'http://localhost:11434',
    });
  });

  it('should initialize with idle status', () => {
    const state = agentService.getState();
    expect(state.status).toBe('idle');
  });

  it('should have empty conversation history initially', () => {
    const history = agentService.getConversationHistory();
    expect(history).toEqual([]);
  });

  it('should clear conversation history', () => {
    agentService.clearConversation();
    const history = agentService.getConversationHistory();
    expect(history).toEqual([]);
  });
});
