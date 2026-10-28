"use client";

import React from 'react';
import { type AgentEvent } from '@/modules/dev/harness-client';
import { type ChatMessage } from './chat-types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Props {
  messages: ChatMessage[];
  isTauri: boolean;
  streamRunning: boolean;
  isThinking: boolean;
  textDeltas: string;
  toolCallDeltas: Array<{ index: number; name?: string; args_delta: string }>;
  events: AgentEvent[];
  handleInterrupt: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessageList: React.FC<Props> = ({
  messages,
  isTauri,
  streamRunning,
  isThinking,
  textDeltas,
  toolCallDeltas,
  events,
  handleInterrupt,
  chatEndRef,
}) => {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4">
      {/* System Status Pill */}
      <div className="flex justify-center mb-2">
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-full px-4 py-1 text-xs text-on-surface-variant flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isTauri ? 'bg-secondary animate-pulse' : 'bg-accent animate-pulse'}`} />
          {isTauri ? 'Chronokairo IA Sidecar Conectado' : 'Modo Web (NVIDIA NIM)'}
        </div>
      </div>

      {messages.map((msg) => {
        if (msg.sender === 'user') {
          return (
            <div key={msg.id} className="flex gap-3 justify-end">
              <div className="flex flex-col items-end gap-1 max-w-2xl">
                <div className="bg-surface-container-high/60 border border-outline-variant/40 p-4 rounded-2xl rounded-tr-xs shadow-2xs">
                  <p className="text-xs md:text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex gap-3.5">
            <div className="w-7 h-7 rounded-full bg-primary text-secondary-fixed flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
            </div>
            <div className="flex flex-col gap-1 max-w-3xl flex-1">
              <div className="bg-surface border border-outline-variant/40 p-4 rounded-2xl rounded-tl-xs shadow-xs">
                <MarkdownRenderer content={msg.text} />

                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 mt-3">
                    <div className="text-xs font-bold text-on-surface mb-1">Ferramentas:</div>
                    <ul className="list-disc pl-4 text-xs text-on-surface-variant space-y-1">
                      {msg.toolCalls.map((t, i) => (<li key={i}>{t.name}</li>))}
                    </ul>
                  </div>
                )}

                {msg.planSteps && msg.planSteps.length > 0 && (
                  <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 mt-3">
                    <div className="text-xs font-bold text-on-surface mb-1">Plano:</div>
                    <ul className="list-decimal pl-4 text-xs text-on-surface-variant space-y-1">
                      {msg.planSteps.map((step, i) => (
                        <li key={i}>{step.index}/{step.total}: {step.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.verifications && msg.verifications.length > 0 && (
                  <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 mt-3">
                    <div className="text-xs font-bold text-on-surface mb-1">Verificações:</div>
                    <ul className="list-disc pl-4 text-xs text-on-surface-variant space-y-1">
                      {msg.verifications.map((v, i) => (
                        <li key={i}>
                          [{v.status}] {v.summary}
                          {v.command && <span className="font-mono opacity-70"> — {v.command}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Live streaming text delta */}
      {streamRunning && textDeltas && (
        <div className="flex gap-3.5">
          <div className="w-7 h-7 rounded-full bg-primary text-secondary-fixed flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <span className="material-symbols-outlined text-sm">smart_toy</span>
          </div>
          <div className="flex flex-col gap-1 max-w-3xl flex-1">
            <div className="bg-surface border border-outline-variant/40 p-4 rounded-2xl rounded-tl-xs shadow-xs">
              <MarkdownRenderer content={textDeltas} isStreaming={true} />
            </div>
          </div>
        </div>
      )}

      {/* Tool calls in progress */}
      {streamRunning && toolCallDeltas.length > 0 && (
        <div className="flex gap-3.5">
          <div className="w-7 h-7 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">build</span>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 max-w-3xl">
            <div className="text-xs font-bold text-on-surface mb-1">Executando ferramentas:</div>
            {toolCallDeltas.map((delta) => (
              <div key={delta.index} className="text-xs text-on-surface-variant font-mono">
                {delta.name || `tool #${delta.index}`}: {delta.args_delta}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan steps in progress */}
      {streamRunning &&
        events
          .filter((e): e is AgentEvent & { type: 'PlanStep' } => e.type === 'PlanStep')
          .map((step) => (
            <div key={`plan-${step.payload.index}`} className="flex gap-3.5">
              <div className="w-7 h-7 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">checklist</span>
              </div>
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 max-w-3xl">
                <div className="text-xs text-on-surface-variant">
                  Plano {step.payload.index}/{step.payload.total}: {step.payload.description}
                </div>
              </div>
            </div>
          ))}

      {/* Verification in progress */}
      {streamRunning &&
        events
          .filter((e): e is AgentEvent & { type: 'Verification' } => e.type === 'Verification')
          .slice(-1)
          .map((v) => (
            <div key={`verif-${v.payload.command || v.payload.summary}`} className="flex gap-3.5">
              <div className="w-7 h-7 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">verified</span>
              </div>
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 max-w-3xl">
                <div className="text-xs text-on-surface-variant">
                  [{v.payload.status}] {v.payload.summary}
                  {v.payload.command && <span className="font-mono opacity-70"> — {v.payload.command}</span>}
                </div>
              </div>
            </div>
          ))}

      {/* Thinking indicator for non-streaming */}
      {isThinking && !streamRunning && (
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-primary text-secondary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-sm">smart_toy</span>
          </div>
          <div className="bg-surface border border-outline-variant/40 p-4 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
            <span className="text-xs text-on-surface-variant">Chronokairo está processando…</span>
          </div>
        </div>
      )}

      {/* Interrupt button while streaming */}
      {streamRunning && (
        <div className="flex justify-center">
          <button
            onClick={handleInterrupt}
            className="px-4 py-1.5 rounded-xl bg-error-container text-error text-xs font-bold border border-error/30 hover:bg-error-container/80 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">stop_circle</span>
            Interromper
          </button>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
};
