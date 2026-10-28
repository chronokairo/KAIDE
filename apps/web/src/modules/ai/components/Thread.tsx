'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThreadPrimitive, ComposerPrimitive } from '@assistant-ui/react';
import { useTauriRuntimeContext } from './TauriRuntimeProvider';
import { NVIDIA_MODELS_FALLBACK, type ModelInfo, fetchAvailableModels } from '@/modules/ai/components/chat-types';
import { MarkdownRenderer } from '@/modules/ai/components/MarkdownRenderer';

export interface AgentTypeDef {
  id: 'coder' | 'researcher' | 'reviewer' | 'planner';
  name: string;
  icon: string;
  description: string;
  badgeColor: string;
}

export interface ThinkingMode {
  id: 'off' | 'low' | 'medium' | 'high' | 'max';
  label: string;
  shortLabel: string;
  description: string;
  budgetTokens: number;
}

export const THINKING_MODES: ThinkingMode[] = [
  { id: 'off', label: 'Thinking: Desativado', shortLabel: 'Desativado', description: 'Resposta direta sem cadeia de raciocínio estendida', budgetTokens: 0 },
  { id: 'low', label: 'Thinking: Rápido (1k)', shortLabel: 'Rápido (1k)', description: 'Raciocínio conciso para perguntas e comandos simples', budgetTokens: 1024 },
  { id: 'medium', label: 'Thinking: Padrão (4k)', shortLabel: 'Padrão (4k)', description: 'Equilíbrio ideal entre profundidade e velocidade', budgetTokens: 4096 },
  { id: 'high', label: 'Thinking: Profundo (8k)', shortLabel: 'Profundo (8k)', description: 'Análise detalhada de arquitetura e lógica complexa', budgetTokens: 8192 },
  { id: 'max', label: 'Thinking: Máximo (16k)', shortLabel: 'Máximo (16k)', description: 'Raciocínio exaustivo para refatorações e debugging crítico', budgetTokens: 16384 },
];

const AGENT_TYPES: AgentTypeDef[] = [
  { id: 'coder', name: 'Coder Agent', icon: 'code', description: 'Gera, edita e refatora código', badgeColor: 'bg-blue-500/10 text-blue-800 border-blue-500/25' },
  { id: 'researcher', name: 'Researcher Agent', icon: 'search', description: 'Pesquisa arquitetura e codebase', badgeColor: 'bg-purple-500/10 text-purple-800 border-purple-500/25' },
  { id: 'reviewer', name: 'Reviewer Agent', icon: 'rate_review', description: 'Audita qualidade, RLS e testes', badgeColor: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25' },
  { id: 'planner', name: 'Planner Agent', icon: 'checklist', description: 'Cria planos e tarefas estruturadas', badgeColor: 'bg-amber-500/10 text-amber-800 border-amber-500/25' },
];

const STARTER_PROMPTS = [
  {
    icon: 'account_tree',
    title: 'Analisar Arquitetura DDD',
    desc: 'Auditar slices, contratos e repositórios do ERP',
    prompt: 'Analise a estrutura atual dos bounded contexts em src/packages e a conformidade com as regras de AGENTS.md.',
  },
  {
    icon: 'verified_user',
    title: 'Verificar Contratos & RLS',
    desc: 'Auditar políticas de isolamento multi-tenant e Dual-JWT',
    prompt: 'Verifique as migrations RLS e as regras de segurança fail-closed do PostgreSQL/Supabase.',
  },
  {
    icon: 'terminal',
    title: 'Executar Validação de Build',
    desc: 'Testar typecheck, suite de testes e integridade de tipos',
    prompt: 'Verifique a saúde dos tipos TypeScript e execute a validação de contratos do projeto.',
  },
  {
    icon: 'travel_explore',
    title: 'Inspecionar UI no Browser',
    desc: 'Examinar telas no preview ao vivo e playbooks rápidos',
    prompt: 'Inspecione a interface atual do Dev Harness e sugira otimizações de fluxo e usabilidade.',
  },
];

export function HarnessThread() {
  const ctx = useTauriRuntimeContext();
  const [models, setModels] = useState<ModelInfo[]>(NVIDIA_MODELS_FALLBACK);
  const [selectedModelId, setSelectedModelId] = useState<string>('meta/llama-3.3-70b-instruct');
  const [selectedAgentTypeId, setSelectedAgentTypeId] = useState<string>('coder');
  const [selectedThinkingId, setSelectedThinkingId] = useState<ThinkingMode['id']>('off');

  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState<boolean>(false);
  const [showThinkingDropdown, setShowThinkingDropdown] = useState<boolean>(false);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const agentDropdownRef = useRef<HTMLDivElement>(null);
  const thinkingDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedModel = localStorage.getItem('chronokairo_ai_selected_model');
      if (savedModel) setSelectedModelId(savedModel);
      const savedAgent = localStorage.getItem('chronokairo_ai_selected_agent_type');
      if (savedAgent) setSelectedAgentTypeId(savedAgent);
      const savedThinking = localStorage.getItem('chronokairo_ai_thinking_mode') as ThinkingMode['id'];
      if (savedThinking && THINKING_MODES.some((t) => t.id === savedThinking)) {
        setSelectedThinkingId(savedThinking);
      }
    } catch {}

    fetchAvailableModels().then((res) => {
      if (res && res.length > 0) setModels(res);
    });
  }, []);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(e.target as Node)) {
        setShowAgentDropdown(false);
      }
      if (thinkingDropdownRef.current && !thinkingDropdownRef.current.contains(e.target as Node)) {
        setShowThinkingDropdown(false);
      }
    }
    if (showModelDropdown || showAgentDropdown || showThinkingDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModelDropdown, showAgentDropdown, showThinkingDropdown]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setShowModelDropdown(false);
    try {
      localStorage.setItem('chronokairo_ai_selected_model', modelId);
    } catch {}
  };

  const handleSelectAgentType = (agentId: string) => {
    setSelectedAgentTypeId(agentId);
    setShowAgentDropdown(false);
    try {
      localStorage.setItem('chronokairo_ai_selected_agent_type', agentId);
    } catch {}
  };

  const handleSelectThinking = (thinkingId: ThinkingMode['id']) => {
    setSelectedThinkingId(thinkingId);
    setShowThinkingDropdown(false);
    try {
      localStorage.setItem('chronokairo_ai_thinking_mode', thinkingId);
      const mode = THINKING_MODES.find((m) => m.id === thinkingId);
      localStorage.setItem('chronokairo_ai_thinking_budget', String(mode?.budgetTokens || 0));
    } catch {}
  };

  const currentModel = models.find((m) => m.id === selectedModelId) || models[0] || {
    id: selectedModelId,
    name: selectedModelId.split('/').pop() || selectedModelId,
    provider: 'NVIDIA',
  };

  const currentThinking = THINKING_MODES.find((t) => t.id === selectedThinkingId) || THINKING_MODES[0];

  const currentAgent = AGENT_TYPES.find((a) => a.id === selectedAgentTypeId) || AGENT_TYPES[0];

  return (
    <div className="flex flex-col h-full bg-surface/30 relative select-none">
      <ThreadPrimitive.Root className="flex flex-col h-full">
        <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 md:px-6 py-6 no-scrollbar">
          {/* Empty Hero State like Codex / Claude Code / Antigravity */}
          <ThreadPrimitive.Empty>
            <div className="flex flex-col items-center justify-center min-h-[70%] max-w-2xl mx-auto text-center px-4 py-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center mb-4 shadow-md">
                <span className="material-symbols-outlined text-[28px]">{currentAgent.icon}</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-primary tracking-tight">
                Chronokairo {currentAgent.name}
              </h2>
              <p className="text-xs text-on-surface-variant max-w-md mt-1.5 leading-relaxed">
                {currentAgent.description}. Ambiente de execução autônoma do ERP.
              </p>

              {/* Starter Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-6 text-left">
                {STARTER_PROMPTS.map((item, idx) => (
                  <ComposerPrimitive.Root key={idx} className="w-full">
                    <ComposerPrimitive.Input value={item.prompt} className="hidden" />
                    <ComposerPrimitive.Send className="w-full text-left p-3 rounded-xl border border-outline-variant/60 bg-surface hover:bg-surface-container hover:border-primary/50 transition-all shadow-2xs group flex items-start gap-2.5 cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-primary truncate group-hover:text-primary">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </ComposerPrimitive.Send>
                  </ComposerPrimitive.Root>
                ))}
              </div>
            </div>
          </ThreadPrimitive.Empty>

          <ThreadPrimitive.Messages>
            {({ message }) => {
              if (message.role === 'user') return <UserMessage message={message} />;
              return <AssistantMessage message={message} />;
            }}
          </ThreadPrimitive.Messages>
        </ThreadPrimitive.Viewport>

        {/* Input Composer estilo Antigravity / Claude Code */}
        <div className="p-3 md:p-4 border-t border-outline-variant/50 bg-surface/90 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto">
            <ComposerPrimitive.Root className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-2 shadow-2xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all flex flex-col gap-1.5">
              <ComposerPrimitive.Input
                className="w-full bg-transparent px-3 py-1 text-sm text-primary placeholder:text-on-surface-variant/50 resize-none focus:outline-none max-h-36 min-h-[44px] leading-relaxed font-sans"
                placeholder={`Instruções para o ${currentAgent.name} (@comandos, tarefas, patches)…`}
                rows={1}
              />

              {/* Composer Bottom Toolbar: Context Chip + Agent Type + Model Pill + Send */}
              <div className="flex items-center justify-between px-2 pt-1 border-t border-outline-variant/30 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-mono font-medium">
                    <span className="material-symbols-outlined text-[12px] text-primary">folder_open</span>
                    <span>@erp</span>
                  </div>

                  {/* Seletor do Tipo de Agente (Coder, Researcher, Reviewer, Planner) */}
                  <div className="relative" ref={agentDropdownRef}>
                    <button
                      type="button"
                      onClick={() => { setShowAgentDropdown(!showAgentDropdown); setShowModelDropdown(false); }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 border border-blue-500/20 text-[11px] font-mono font-semibold transition-all cursor-pointer shadow-2xs"
                      title="Alterar Tipo de Agente"
                    >
                      <span className="material-symbols-outlined text-[14px] text-blue-700">{currentAgent.icon}</span>
                      <span>{currentAgent.name.replace(' Agent', '')}</span>
                      <span className="material-symbols-outlined text-[13px] opacity-70">expand_more</span>
                    </button>

                    {showAgentDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-surface border border-outline-variant rounded-xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-150">
                        <div className="p-2 border-b border-outline-variant/50 bg-surface-container flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            Tipo de Agente
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-800 font-bold">
                            LOCAL
                          </span>
                        </div>
                        <div className="p-1 space-y-0.5">
                          {AGENT_TYPES.map((agent) => {
                            const isSelected = agent.id === selectedAgentTypeId;
                            return (
                              <button
                                key={agent.id}
                                type="button"
                                onClick={() => handleSelectAgentType(agent.id)}
                                className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-start gap-2.5 ${
                                  isSelected
                                    ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                                    : 'hover:bg-surface-container-low text-primary'
                                }`}
                              >
                                <span className={`material-symbols-outlined text-[16px] mt-0.5 ${isSelected ? 'text-on-primary' : 'text-primary'}`}>
                                  {agent.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-xs truncate">{agent.name}</div>
                                  <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'opacity-80' : 'text-on-surface-variant'}`}>
                                    {agent.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seletor de Modelo Real (NVIDIA NIM) com Dropdown e Persistência */}
                  <div className="relative" ref={modelDropdownRef}>
                    <button
                      type="button"
                      onClick={() => { setShowModelDropdown(!showModelDropdown); setShowAgentDropdown(false); setShowThinkingDropdown(false); }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 text-[11px] font-mono font-semibold transition-all cursor-pointer shadow-2xs"
                      title="Alterar Modelo e Provedor de IA"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="max-w-[130px] truncate">{currentModel.name}</span>
                      <span className="material-symbols-outlined text-[13px] opacity-70">expand_more</span>
                    </button>

                    {showModelDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-72 bg-surface border border-outline-variant rounded-xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-150">
                        <div className="p-2 border-b border-outline-variant/50 bg-surface-container flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            NVIDIA NIM & Modelos
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-800 font-bold">
                            LOCAL & PERSISTENTE
                          </span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 no-scrollbar">
                          {models.map((m) => {
                            const isSelected = m.id === selectedModelId;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelectModel(m.id)}
                                className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-start justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                                    : 'hover:bg-surface-container-low text-primary'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-medium">{m.name}</div>
                                  <div className={`text-[10px] font-mono mt-0.5 truncate ${isSelected ? 'opacity-80' : 'text-on-surface-variant'}`}>
                                    {m.id}
                                  </div>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'
                                }`}>
                                  {m.provider || 'NVIDIA'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dropdown de Thinking / Raciocínio */}
                  <div className="relative" ref={thinkingDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowThinkingDropdown(!showThinkingDropdown);
                        setShowModelDropdown(false);
                        setShowAgentDropdown(false);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-all cursor-pointer shadow-2xs ${
                        selectedThinkingId !== 'off'
                          ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 border-purple-500/25 font-bold'
                          : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant/60'
                      }`}
                      title="Configurar modo de raciocínio / Thinking budget"
                    >
                      <span className={`material-symbols-outlined text-[14px] ${selectedThinkingId !== 'off' ? 'text-purple-600' : 'text-on-surface-variant'}`}>
                        psychology
                      </span>
                      <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider opacity-70">Thinking:</span>
                      <span className="max-w-[100px] truncate">{currentThinking.shortLabel}</span>
                      <span className="material-symbols-outlined text-[13px] opacity-70">expand_more</span>
                    </button>

                    {showThinkingDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-72 bg-surface border border-outline-variant rounded-xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-150">
                        <div className="p-2 border-b border-outline-variant/50 bg-surface-container flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-purple-600">psychology</span>
                            Modo de Raciocínio (Thinking)
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-800 font-bold">
                            BUDGET
                          </span>
                        </div>
                        <div className="p-1 space-y-1">
                          {THINKING_MODES.map((t) => {
                            const isSelected = t.id === selectedThinkingId;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => handleSelectThinking(t.id)}
                                className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-start justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-purple-700 text-white font-semibold shadow-2xs'
                                    : 'hover:bg-surface-container-low text-primary'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-xs">{t.label}</div>
                                  <div className={`text-[10px] mt-0.5 leading-tight ${isSelected ? 'text-purple-100' : 'text-on-surface-variant'}`}>
                                    {t.description}
                                  </div>
                                </div>
                                {t.budgetTokens > 0 && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-purple-700'
                                  }`}>
                                    {t.budgetTokens}t
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline text-[10px] text-on-surface-variant/60 font-mono">
                    Enter ↵
                  </span>
                  <ComposerPrimitive.Send className="h-8 px-3 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-30 flex items-center gap-1 shadow-2xs">
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    <span>Enviar</span>
                  </ComposerPrimitive.Send>
                </div>
              </div>
            </ComposerPrimitive.Root>
          </div>
        </div>
      </ThreadPrimitive.Root>

      {ctx?.approvalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">shield</span>
              </div>
              <div>
                <h3 className="text-primary font-bold text-base">
                  Aprovação Necessária
                </h3>
                <p className="text-on-surface-variant text-xs">
                  O agente deseja executar uma ferramenta
                </p>
              </div>
            </div>

            <code className="block bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-xs text-primary font-mono overflow-x-auto">
              {ctx.approvalRequest.tool}
            </code>

            {ctx.approvalRequest.summary && (
              <p className="text-on-surface-variant text-xs">
                {ctx.approvalRequest.summary}
              </p>
            )}
            {ctx.approvalRequest.risk && (
              <p className="text-error text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Risco: {ctx.approvalRequest.risk}
              </p>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-outline-variant/30">
              <button
                onClick={ctx.deny}
                className="px-4 py-2 rounded-xl bg-error-container text-on-error-container text-xs font-semibold hover:bg-error-container/80 transition-colors"
              >
                Negar
              </button>
              <button
                onClick={ctx.approve}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Permitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMessage({ message }: { message: { content?: readonly { type: string; text?: string }[] } }) {
  const text = message.content
    ?.filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text!)
    .join('\n') ?? '';

  return (
    <div className="flex justify-end mb-4 animate-in fade-in slide-in-from-bottom-1 duration-150">
      <div className="bg-primary text-on-primary rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-[80%] text-sm shadow-2xs font-sans">
        {text}
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: { content?: readonly { type: string; text?: string }[] } }) {
  const [showThinking, setShowThinking] = useState(false);
  const text = message.content
    ?.filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text!)
    .join('\n') ?? '';

  // Extract <think> reasoning content if present
  let thinkingContent = '';
  let finalContent = text;
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    thinkingContent = thinkMatch[1].trim();
    finalContent = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
  } else if (text.startsWith('<think>')) {
    thinkingContent = text.replace('<think>', '').trim();
    finalContent = '';
  }

  return (
    <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-bottom-1 duration-150">
      <div className="bg-surface-container-lowest border border-outline-variant/60 text-primary rounded-2xl rounded-tl-xs px-4 py-3 max-w-[85%] text-sm shadow-2xs font-sans leading-relaxed space-y-2">
        {thinkingContent && (
          <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 overflow-hidden text-xs">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full px-3 py-1.5 flex items-center justify-between text-purple-800 font-semibold hover:bg-purple-500/10 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="material-symbols-outlined text-[14px] text-purple-600">psychology</span>
                Processo de Raciocínio ({showThinking ? 'Ocultar' : 'Expandir'})
              </span>
              <span className="material-symbols-outlined text-[14px]">
                {showThinking ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {showThinking && (
              <div className="p-3 pt-0 border-t border-purple-500/15 text-[11px] font-mono text-purple-950/80 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {thinkingContent}
              </div>
            )}
          </div>
        )}

        {finalContent ? (
          <MarkdownRenderer content={finalContent} />
        ) : (
          !thinkingContent && (
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-ping" />
              <span className="text-xs font-medium">Pensando…</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
