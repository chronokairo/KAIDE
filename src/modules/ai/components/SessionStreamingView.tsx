'use client';

import React, { useRef, useEffect } from 'react';
import type { AgentEvent, ToolCallDeltaPayload } from '@/modules/dev/hooks/useHarness';
import { MarkdownRenderer } from '@/modules/ai/components/MarkdownRenderer';

interface SessionStreamingViewProps {
  events: AgentEvent[];
  textDeltas: string;
  toolCallDeltas: ToolCallDeltaPayload[];
}

export const SessionStreamingView: React.FC<SessionStreamingViewProps> = ({
  events,
  textDeltas,
  toolCallDeltas,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [textDeltas, events]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Status':
        return 'info';
      case 'PlanStep':
        return 'checklist';
      case 'ToolCall':
        return 'build';
      case 'ToolResult':
        return 'check_circle';
      case 'Verification':
        return 'verified';
      case 'TextDelta':
        return 'chat';
      case 'Done':
        return 'task_alt';
      case 'Failed':
        return 'error';
      case 'Interrupted':
        return 'stop_circle';
      default:
        return 'circle';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'Status':
        return 'text-blue-600 bg-blue-50';
      case 'PlanStep':
        return 'text-purple-600 bg-purple-50';
      case 'ToolCall':
        return 'text-amber-600 bg-amber-50';
      case 'ToolResult':
        return 'text-emerald-600 bg-emerald-50';
      case 'Verification':
        return 'text-emerald-600 bg-emerald-50';
      case 'Done':
        return 'text-emerald-600 bg-emerald-50';
      case 'Failed':
        return 'text-red-600 bg-red-50';
      case 'Interrupted':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="border-t border-outline-variant/30 bg-surface-container-low/30">
      {/* Header */}
      <div className="px-4 py-2 border-b border-outline-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">terminal</span>
          <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
            Activity Stream
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-surface-container text-on-surface-variant">
            {events.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-[10px] text-secondary font-semibold">Live</span>
        </div>
      </div>

      {/* Events List */}
      <div
        ref={scrollRef}
        className="max-h-64 overflow-y-auto p-3 space-y-2"
      >
        {events.map((event, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 p-2 rounded-lg ${getEventColor(event.type)}`}
          >
            <span className="material-symbols-outlined text-[12px] mt-0.5 shrink-0">
              {getEventIcon(event.type)}
            </span>
            <div className="min-w-0 flex-1">
               <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase">{event.type}</span>
              </div>
              {event.type === 'Status' && (
                <div className="text-[11px] mt-0.5">{event.payload}</div>
              )}
              {event.type === 'PlanStep' && (
                <div className="text-[11px] mt-0.5">
                  Step {event.payload.index}/{event.payload.total}: {event.payload.description}
                </div>
              )}
               {event.type === 'ToolCall' && (
                <div className="text-[11px] mt-0.5 font-mono">
                  {event.payload.name}({event.payload.summary?.substring(0, 50)}...)
                </div>
              )}
              {event.type === 'Verification' && (
                <div className="text-[11px] mt-0.5">
                  [{event.payload.status}] {event.payload.summary}
                </div>
              )}
              {event.type === 'Failed' && (
                <div className="text-[11px] mt-0.5">{event.payload.message}</div>
              )}
            </div>
          </div>
        ))}

        {/* Tool Call Deltas */}
        {toolCallDeltas.length > 0 && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-[10px] font-bold text-amber-800 mb-1">Ferramentas em execução:</div>
            {toolCallDeltas.map((delta, idx) => (
              <div key={idx} className="text-[11px] font-mono text-amber-700">
                {delta.name || `tool #${delta.index}`}: {delta.args_delta.substring(0, 80)}
              </div>
            ))}
          </div>
        )}

        {/* Streaming Text */}
        {textDeltas && (
          <div className="p-2.5 rounded-lg bg-surface border border-outline-variant/30">
            <div className="text-[10px] font-bold text-on-surface-variant mb-1">Resposta:</div>
            <MarkdownRenderer content={textDeltas} isStreaming={true} />
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 && !textDeltas && (
          <div className="py-8 text-center text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-2xl opacity-30">hourglass_top</span>
            <p className="mt-1">Aguardando eventos do agente...</p>
          </div>
        )}
      </div>
    </div>
  );
};
