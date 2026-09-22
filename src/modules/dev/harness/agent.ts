import { invokeHarness, invokeRuntime } from './transport';
import type { AcpProviderInfo, AgentEvent, ApprovalDecision, ToolCallDeltaPayload, ApprovalRequest } from './types';

export const agentClient = {
  acpProviders: async () => invokeHarness<AcpProviderInfo[]>('get_acp_providers'),
  runAcpAgent: async (providerId: string, model: string, prompt: string, opts?: Record<string, unknown>) =>
    invokeHarness<any>('run_acp_agent', { providerId, model, prompt, ...opts }),
  askIntelligenceAgent: async (query: string, opts?: Record<string, unknown>) =>
    invokeHarness<any>('ask_intelligence_agent', { query, ...opts }),
  createSession: async (opts?: { workspace?: string; model?: string; title?: string; initialPrompt?: string }) =>
    invokeRuntime<any>('create_harness_session', opts),
  streamAgentSession: async (
    prompt: string,
    onEvent?: (event: AgentEvent) => void,
    opts?: {
      workspace?: string;
      model?: string;
      session_id?: string;
      onTextDelta?: (text: string) => void;
      onToolCallDelta?: (delta: ToolCallDeltaPayload) => void;
      onApproval?: (request: ApprovalRequest) => void;
    },
  ) => {
    const { Channel } = await import('@tauri-apps/api/core');
    const eventChannel = new Channel<AgentEvent>();
    const textDeltaChannel = new Channel<string>();
    const toolCallDeltaChannel = new Channel<ToolCallDeltaPayload>();
    const approvalChannel = new Channel<ApprovalRequest>();
    eventChannel.onmessage = (event) => onEvent?.(event);
    textDeltaChannel.onmessage = (text) => opts?.onTextDelta?.(text);
    toolCallDeltaChannel.onmessage = (delta) => opts?.onToolCallDelta?.(delta);
    approvalChannel.onmessage = (request) => opts?.onApproval?.(request);
    return invokeHarness<any>('stream_agent_session', {
      prompt,
      workspace: opts?.workspace,
      model: opts?.model,
      sessionId: opts?.session_id,
      onEvent: eventChannel,
      onTextDelta: textDeltaChannel,
      onToolCallDelta: toolCallDeltaChannel,
      onApproval: approvalChannel,
    });
  },
  interruptAgent: async (sessionId: string) =>
    invokeHarness<any>('interrupt_agent', { sessionId }),
  resolveApproval: async (sessionId: string, requestId: string, decision: ApprovalDecision) =>
    invokeHarness<any>('resolve_approval', { sessionId, requestId: Number(requestId), decision }),
};
