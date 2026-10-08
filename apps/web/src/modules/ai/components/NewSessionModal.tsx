"use client";

import React, { useState } from 'react';
import { useCreateHarnessSession, useAcpProviders, useHarnessOverview } from '@/modules/dev/hooks/useHarness';

interface NewSessionModalProps {
  workspace?: string;
  onClose: () => void;
  onCreated: (sessionId: number) => void;
}

const MODELS = ['GPT-5.2-Codex', 'ChronoKairo Auto (NVIDIA NIM)', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro'];
const EFFORT_LEVELS = ['Extra high', 'High', 'Medium', 'Low'];
const ENVIRONMENTS = ['Local', 'Worktree', 'Cloud'];

const SUGGESTION_CARDS = [
  { icon: 'sports_esports', title: 'Create a classic snake game', prompt: 'Create a classic snake game in HTML and JS' },
  { icon: 'search', title: 'Find and fix a bugs in my code', prompt: 'Find and fix potential bugs in my current codebase' },
  { icon: 'description', title: 'Summarize this app in a $pdf', prompt: 'Summarize the architecture and capabilities of this application' },
];

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  workspace,
  onClose,
  onCreated,
}) => {
  const { create, creating, error } = useCreateHarnessSession();
  const { result: acpResult } = useAcpProviders();
  const { result: overviewResult } = useHarnessOverview();

  const acpProviders = acpResult?.data ?? [];
  const repos: Array<{ path: string; name: string }> = overviewResult?.data?.repos ?? [];

  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedEffort, setSelectedEffort] = useState(EFFORT_LEVELS[0]);
  const [selectedEnv, setSelectedEnv] = useState(ENVIRONMENTS[0]);
  const [selectedWs, setSelectedWs] = useState(workspace || repos[0]?.path || '');
  const [title, setTitle] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');

  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showEffortDropdown, setShowEffortDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const handleCreate = async () => {
    const finalTitle = title.trim() || initialPrompt.slice(0, 40) || 'New thread';
    const id = await create({
      workspace: selectedWs,
      model: selectedModel,
      title: finalTitle,
      initialPrompt,
    });
    if (id) {
      onCreated(id);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-surface border border-outline-variant/40 rounded-2xl shadow-2xl w-full max-w-2xl min-h-[520px] max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Header Bar with macOS Window Dots */}
        <div className="p-3.5 px-4 bg-surface-container-low/70 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span onClick={onClose} className="w-3 h-3 rounded-full bg-rose-500/80 hover:opacity-100 cursor-pointer inline-block" title="Close" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:opacity-100 cursor-pointer inline-block" title="Minimize" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 hover:opacity-100 cursor-pointer inline-block" title="Expand" />
            </div>
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">edit_square</span>
              New thread / Nova Sessão
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 bg-error-container/30 text-error text-xs border-b border-error/20 flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[15px]">error</span>
            {error}
          </div>
        )}

        {/* Modal Main Workspace Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {/* Centered Hero Heading with Interactive Project Dropdown */}
          <div className="flex flex-col items-center justify-center text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-surface border-2 border-outline-variant/40 flex items-center justify-center text-primary shadow-2xs mb-2">
              <span className="material-symbols-outlined text-[28px]">cloud</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">Let’s build</h2>

            {/* Interactive Project Dropdown */}
            <div className="relative mt-1 mb-1">
              <button
                type="button"
                onClick={() => {
                  setShowProjectDropdown(!showProjectDropdown);
                  setShowModelDropdown(false);
                  setShowEffortDropdown(false);
                }}
                className="flex items-center gap-1 text-xl md:text-2xl font-bold text-on-surface-variant/80 hover:text-primary transition-colors focus:outline-none"
              >
                <span>
                  {repos.find((r) => r.path === selectedWs)?.name || selectedWs || 'Selecione o Projeto'}
                </span>
                <span className="material-symbols-outlined text-[24px]">expand_more</span>
              </button>

              {showProjectDropdown && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-surface border border-outline-variant rounded-2xl shadow-2xl z-40 py-1 font-sans text-left max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20 mb-1">
                    Selecione o Projeto / Workspace
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWs('');
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
                      !selectedWs ? 'bg-secondary/10 text-secondary font-bold' : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">home_storage</span>
                    <span>(Workspace Padrão / Raiz)</span>
                  </button>

                  {repos.map((r) => (
                    <button
                      key={r.path}
                      type="button"
                      onClick={() => {
                        setSelectedWs(r.path);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
                        selectedWs === r.path
                          ? 'bg-secondary/10 text-secondary font-bold'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        folder
                      </span>
                      <span className="truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-on-surface-variant/70">
              Configure a nova thread e envie a instrução inicial
            </p>
          </div>

          {/* Reference Suggestion Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                Sugestões Rápidas
              </span>
              <span className="text-xs text-on-surface-variant/60">Explore more</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {SUGGESTION_CARDS.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => setInitialPrompt(card.prompt)}
                  className="p-3 bg-surface-container-low/40 hover:bg-surface-container-high/60 border border-outline-variant/30 rounded-xl text-left transition-colors group flex flex-col justify-between"
                >
                  <div className="w-7 h-7 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-center mb-2 text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">{card.icon}</span>
                  </div>
                  <span className="text-[11px] font-medium text-on-surface leading-snug">
                    {card.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Floating Prompt Card Container */}
          <div className="relative bg-surface border-2 border-outline-variant/50 rounded-2xl p-3 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 shadow-md transition-all">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da thread (opcional)"
              className="w-full bg-transparent border-b border-outline-variant/20 pb-1.5 px-2 text-xs font-semibold text-primary outline-none placeholder:text-on-surface-variant/40 mb-2"
            />

            <textarea
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="Ask Codex anything, @ to add files, / for commands"
              rows={3}
              className="w-full bg-transparent border-none py-1 px-2 text-xs md:text-sm text-on-surface resize-none focus:ring-0 outline-none placeholder:text-on-surface-variant/50"
            />

            {/* Inner Bottom Controls Row */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/15">
              {/* Left Group: Attach +, Model Selector, Effort Selector */}
              <div className="flex items-center gap-2 relative">
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg hover:bg-surface-container-high/60 text-on-surface-variant flex items-center justify-center transition-colors"
                  title="Adicionar arquivos (@)"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>

                {/* Model Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModelDropdown(!showModelDropdown);
                      setShowEffortDropdown(false);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-container-high/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <span>{selectedModel}</span>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>

                  {showModelDropdown && (
                    <div className="absolute bottom-full left-0 mb-1 w-52 bg-surface border border-outline-variant rounded-xl shadow-lg z-30 py-1">
                      {MODELS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between ${
                            selectedModel === m
                              ? 'bg-secondary/10 text-secondary'
                              : 'text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          <span className="truncate">{m}</span>
                          {selectedModel === m && (
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          )}
                        </button>
                      ))}
                      {acpProviders.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(p.default_model || p.id);
                            setShowModelDropdown(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high truncate"
                        >
                          {p.display_name || p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Effort Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEffortDropdown(!showEffortDropdown);
                      setShowModelDropdown(false);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-container-high/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <span>{selectedEffort}</span>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>

                  {showEffortDropdown && (
                    <div className="absolute bottom-full left-0 mb-1 w-36 bg-surface border border-outline-variant rounded-xl shadow-lg z-30 py-1">
                      {EFFORT_LEVELS.map((ef) => (
                        <button
                          key={ef}
                          type="button"
                          onClick={() => {
                            setSelectedEffort(ef);
                            setShowEffortDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between ${
                            selectedEffort === ef
                              ? 'bg-secondary/10 text-secondary'
                              : 'text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          <span>{ef}</span>
                          {selectedEffort === ef && (
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Group: Lock, Mic, Submit Arrow */}
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-[16px] text-on-surface-variant/50"
                  title="Conexão criptografada e ambiente isolado"
                >
                  lock
                </span>

                <button
                  type="button"
                  className="p-1 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high/50 transition-colors"
                  title="Ditado por voz"
                >
                  <span className="material-symbols-outlined text-[18px]">mic</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-7 h-7 rounded-full bg-primary text-secondary-fixed flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 shadow-2xs"
                  title="Criar thread"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Environment Footer Bar */}
        <div className="p-3 px-5 bg-surface-container-low/70 border-t border-outline-variant/30 flex items-center justify-between text-[11px] shrink-0">
          {/* Environment switches */}
          <div className="flex items-center gap-3">
            {ENVIRONMENTS.map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setSelectedEnv(env)}
                className={`font-semibold transition-colors ${
                  selectedEnv === env
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant/60 hover:text-on-surface'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-on-surface-variant/60 font-mono hidden sm:inline">
              Ctrl+Enter para enviar
            </span>
            <div className="flex items-center gap-1 text-on-surface-variant/70 font-mono">
              <span className="material-symbols-outlined text-[13px]">call_split</span>
              <span>main</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
