"use client";

import React, { useState, useEffect } from 'react';
import { Brain, Wrench, Eye } from 'lucide-react';
import { EFFORT_LEVELS, ENVIRONMENTS, type ModelInfo, fetchAvailableModels, NVIDIA_MODELS_FALLBACK } from './chat-types';

interface Props {
  inputText: string;
  setInputText: (text: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sendMessage: (text: string) => void;
  isRunning: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedEffort: string;
  setSelectedEffort: (effort: string) => void;
  selectedEnv: string;
  setSelectedEnv: (env: string) => void;
  showModelDropdown: boolean;
  setShowModelDropdown: (show: boolean) => void;
  showEffortDropdown: boolean;
  setShowEffortDropdown: (show: boolean) => void;
  showProviderDropdown?: boolean;
  setShowProviderDropdown?: (show: boolean) => void;
  selectedProvider?: string;
  setSelectedProvider?: (provider: string) => void;
  streamRunning: boolean;
  handleInterrupt: () => void;
}

export const ChatInput: React.FC<Props> = ({
  inputText,
  setInputText,
  textareaRef,
  handleTextareaChange,
  handleKeyDown,
  sendMessage,
  isRunning,
  selectedModel,
  setSelectedModel,
  selectedEffort,
  setSelectedEffort,
  selectedEnv,
  setSelectedEnv,
  showModelDropdown,
  setShowModelDropdown,
  showEffortDropdown,
  setShowEffortDropdown,
  streamRunning,
  handleInterrupt,
}) => {
  const [modelSearch, setModelSearch] = useState('');
  const [dynamicModels, setDynamicModels] = useState<ModelInfo[]>(NVIDIA_MODELS_FALLBACK);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAvailableModels().then((models) => {
      if (!cancelled) {
        setDynamicModels(models);
        setLoadingModels(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredModels = dynamicModels.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const currentModel =
    dynamicModels.find((m) => m.id === selectedModel) ||
    dynamicModels[0] || { id: selectedModel, name: selectedModel.split('/').pop() || selectedModel };

  return (
    <div className="p-3 md:p-4 bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 shrink-0">
      <div className="max-w-3xl mx-auto w-full">
        <div className="relative bg-surface border-2 border-outline-variant/50 rounded-2xl p-3 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 shadow-md transition-all">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none py-1.5 px-2 text-xs md:text-sm text-on-surface resize-none focus:ring-0 outline-none placeholder:text-on-surface-variant/50"
            placeholder="Pergunte ao Chronokairo IA, @ para arquivos, / para comandos…"
            rows={1}
            disabled={isRunning}
          />

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/15">
            {/* Left Controls: Attachments, Model Selector, Thinking / Effort */}
            <div className="flex items-center gap-1.5 relative">
              <button
                className="w-7 h-7 rounded-lg hover:bg-surface-container-high/60 text-on-surface-variant flex items-center justify-center transition-colors"
                title="Adicionar arquivos (@)"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>

              {/* Seletor de Modelo com Busca e Persistência */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowModelDropdown(!showModelDropdown);
                    setShowEffortDropdown(false);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-container-high/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors max-w-[190px] sm:max-w-[240px]"
                  title="Selecionar modelo de IA"
                >
                  <span className="truncate">
                    {loadingModels ? 'Carregando modelos…' : currentModel.name}
                  </span>
                  <span className="material-symbols-outlined text-[16px] shrink-0">
                    {showModelDropdown ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showModelDropdown && (
                  <div className="absolute bottom-full left-0 mb-1 w-80 bg-surface border border-outline-variant rounded-xl shadow-lg z-30 py-1 max-h-72 overflow-y-auto">
                    <div className="sticky top-0 bg-surface border-b border-outline-variant px-2 py-1">
                      <input
                        type="text"
                        placeholder="Buscar modelo…"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-outline-variant rounded-lg bg-surface-container-low focus:outline-none focus:border-primary"
                        autoFocus
                      />
                      <div className="text-[10px] text-on-surface-variant/60 mt-1 px-1">
                        {filteredModels.length} modelos disponíveis{loadingModels ? ' (carregando…)' : ''}
                      </div>
                    </div>

                    {filteredModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-surface-container-high transition-colors ${
                          selectedModel === m.id ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{m.name}</span>
                            <span className="text-[10px] text-on-surface-variant/40 shrink-0">
                              {m.contextWindow.toLocaleString()} ctx
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant/50">
                            <span className="font-mono truncate">{m.id}</span>
                            {m.capabilities.reasoning && (
                              <span className="text-primary" title="Thinking / Raciocínio Profundo">
                                <Brain className="w-2.5 h-2.5 inline" />
                              </span>
                            )}
                            {m.capabilities.toolCall && (
                              <span className="text-secondary" title="Tool Calling">
                                <Wrench className="w-2.5 h-2.5 inline" />
                              </span>
                            )}
                            {m.capabilities.vision && (
                              <span className="text-accent" title="Vision">
                                <Eye className="w-2.5 h-2.5 inline" />
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedModel === m.id && (
                          <span className="material-symbols-outlined text-[14px] shrink-0 text-secondary">
                            check
                          </span>
                        )}
                      </button>
                    ))}

                    {filteredModels.length === 0 && !loadingModels && (
                      <div className="px-3 py-4 text-center text-xs text-on-surface-variant/60">
                        Nenhum modelo encontrado.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Seletor de Modo de Thinking / Esforço com Persistência */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowEffortDropdown(!showEffortDropdown);
                    setShowModelDropdown(false);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-surface-container-high/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                  title="Esforço de Raciocínio (Thinking Level)"
                >
                  <Brain className="w-3 h-3 text-primary shrink-0" />
                  <span>{selectedEffort}</span>
                  <span className="material-symbols-outlined text-[16px] shrink-0">
                    {showEffortDropdown ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showEffortDropdown && (
                  <div className="absolute bottom-full left-0 mb-1 w-40 bg-surface border border-outline-variant rounded-xl shadow-lg z-30 py-1">
                    <div className="px-2.5 py-1 text-[10px] font-mono text-on-surface-variant border-b border-outline-variant/40">
                      Nível de Raciocínio
                    </div>
                    {EFFORT_LEVELS.map((ef) => (
                      <button
                        key={ef}
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
                          <span className="material-symbols-outlined text-[14px] text-secondary">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls: Voice, Lock, Send */}
            <div className="flex items-center gap-2">
              {streamRunning && (
                <button
                  onClick={handleInterrupt}
                  title="Interromper agente"
                  className="p-1 rounded-lg text-error hover:bg-error-container/50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                </button>
              )}
              <span
                className="material-symbols-outlined text-[16px] text-on-surface-variant/50"
                title="Privacidade garantida — processamento em ambiente isolado"
              >
                lock
              </span>
              <button
                className="p-1 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high/50 transition-colors"
                title="Ditado por voz"
              >
                <span className="material-symbols-outlined text-[18px]">mic</span>
              </button>
              <button
                onClick={() => sendMessage(inputText)}
                disabled={isRunning || !inputText.trim()}
                className="w-7 h-7 rounded-full bg-primary text-secondary-fixed flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="Enviar mensagem"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ambientes & Git Branch */}
        <div className="flex items-center justify-between mt-2 px-2 text-[11px]">
          <div className="flex items-center gap-3">
            {ENVIRONMENTS.map((env) => (
              <button
                key={env}
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
          <div className="flex items-center gap-1 text-on-surface-variant/70 font-mono">
            <span className="material-symbols-outlined text-[13px]">call_split</span>
            <span>main</span>
          </div>
        </div>
      </div>
    </div>
  );
};
