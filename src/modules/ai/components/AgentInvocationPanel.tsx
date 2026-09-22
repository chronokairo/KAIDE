'use client';

import React, { useState } from 'react';
import { useCreateHarnessSession, useStreamAgentSession, useAcpProviders } from '@/modules/dev/hooks/useHarness';
import { isTauriRuntime } from '@/modules/dev/harness-client';
import { ApprovalDialog } from './ApprovalDialog';
import { SessionStreamingView } from './SessionStreamingView';

interface AgentInvocationPanelProps {
  onSessionCreated?: (sessionId: string) => void;
}

const AGENT_TYPES = [
  { id: 'coder', label: 'Coder', icon: 'code', description: 'Gera e modifica código' },
  { id: 'researcher', label: 'Researcher', icon: 'search', description: 'Pesquisa e analisa informações' },
  { id: 'reviewer', label: 'Reviewer', icon: 'rate_review', description: 'Revisa código e documentação' },
  { id: 'planner', label: 'Planner', icon: 'checklist', description: 'Cria planos e tarefas' },
];

export const AgentInvocationPanel: React.FC<AgentInvocationPanelProps> = ({ onSessionCreated }) => {
  const [selectedAgent, setSelectedAgent] = useState(AGENT_TYPES[0]);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('GPT-5.2-Codex');

  const { create, creating } = useCreateHarnessSession();
  const {
    startStream,
    interrupt,
    resolveApproval,
    running,
    events,
    textDeltas,
    toolCallDeltas,
    approvalRequest,
    sessionId,
    lastError,
  } = useStreamAgentSession();

  const { result: acpResult } = useAcpProviders();
  const acpProviders = acpResult?.data ?? [];
  const isTauri = isTauriRuntime();

  const handleInvoke = async () => {
    if (!prompt.trim() || running) return;

    try {
      const session = await create({
        title: `${selectedAgent.label} - ${new Date().toLocaleTimeString()}`,
        model,
      });

      if (session) {
        onSessionCreated?.(String(session));
        await startStream(prompt, () => {}, {
          model,
          session_id: String(session),
        });
      }
    } catch (error) {
      console.error('Failed to invoke agent:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleInvoke();
    }
  };

  return (
    <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs text-primary">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary tracking-tight">Invocar Agente</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Configure e lance um agente para executar uma tarefa.
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            isTauri ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-800 border border-amber-500/25'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isTauri ? 'bg-emerald-600' : 'bg-amber-600'}`} />
            {isTauri ? 'Tauri Conectado' : 'Web Mode'}
          </div>
        </div>
      </div>

      {/* Agent Type Selection */}
      <div className="p-4 border-b border-outline-variant/30 bg-surface/40">
        <label className="text-[10px] font-mono uppercase font-bold text-on-surface-variant block mb-2">
          Tipo de Agente
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {AGENT_TYPES.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`p-3 rounded-xl border transition-all text-left group ${
                selectedAgent.id === agent.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-2xs'
                  : 'border-outline-variant/40 bg-surface-container-lowest hover:border-outline-variant/80 hover:bg-surface-container-low/40'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${
                selectedAgent.id === agent.id ? 'text-primary' : 'text-on-surface-variant'
              }`}>{agent.icon}</span>
              <div className="font-bold text-xs text-primary mt-1">{agent.label}</div>
              <div className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">{agent.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="p-4 border-b border-outline-variant/30">
        <label className="text-[10px] font-mono uppercase font-bold text-on-surface-variant block mb-2">
          Instrução
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descreva a tarefa que o agente deve executar..."
          className="w-full h-24 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50 transition-all"
          disabled={running}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-on-surface-variant font-mono">
            {isTauri ? 'Ctrl+Enter para enviar' : 'Modo web - resposta via LLM local'}
          </span>
          {running && (
            <span className="text-[10px] text-primary font-semibold animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Executando...
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-3.5 bg-surface-container-low/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary"
            disabled={running}
          >
            <option value="GPT-5.2-Codex">GPT-5.2-Codex</option>
            <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
            <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {running && (
            <button
              onClick={interrupt}
              className="h-9 px-3.5 rounded-xl bg-error-container text-on-error-container font-semibold text-xs hover:bg-error-container/80 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">stop_circle</span>
              Interromper
            </button>
          )}
          <button
            onClick={handleInvoke}
            disabled={!prompt.trim() || running || creating}
            className="h-9 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs"
          >
            {creating ? (
              <>
                <span className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                <span>Criando...</span>
              </>
            ) : running ? (
              <>
                <span className="material-symbols-outlined text-[14px] animate-spin">hourglass_top</span>
                <span>Executando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                <span>Invocar Agente</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {lastError && (
        <div className="p-3 bg-red-50 border-t border-red-200 text-xs text-red-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600 text-[14px]">error</span>
          <span>{lastError}</span>
        </div>
      )}

      {/* Streaming View */}
      {running && (
        <SessionStreamingView
          events={events}
          textDeltas={textDeltas}
          toolCallDeltas={toolCallDeltas}
        />
      )}

      {/* Approval Dialog */}
      {approvalRequest && (
        <ApprovalDialog
          request={approvalRequest}
          onResolve={resolveApproval}
          onClose={() => {}}
        />
      )}
    </div>
  );
};
