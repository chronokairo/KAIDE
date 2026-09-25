import React, { useState } from 'react';
import { 
  Radio, 
  Plus, 
  MessageSquare, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Shield,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Session, Agent } from '../types';

interface GatewayViewProps {
  sessions: Session[];
  agents: Agent[];
  onSelectSession: (id: string) => void;
  selectedSessionId: string;
}

export const GatewayView: React.FC<GatewayViewProps> = ({
  sessions,
  agents,
  onSelectSession,
  selectedSessionId
}) => {
  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-zinc-100">Gateway Sessions & Ingress Dispatcher</h2>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                REST / WS / RPC
              </span>
            </div>
            <p className="text-xs text-zinc-400">Section 7: Ingress multiplexing, protocol normalization, and session boundary broker</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <span className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            Active Sockets: <span className="text-emerald-400 font-semibold">12</span>
          </span>
          <span className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            RPC Latency: <span className="text-emerald-400 font-semibold">4.2ms</span>
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Sessions List (4 cols) */}
        <div className="lg:col-span-4 border-r border-zinc-800 flex flex-col h-full bg-zinc-900/20 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Sessions ({sessions.length})
            </h3>
            <span className="text-xs text-zinc-500 font-mono">/v1/sessions</span>
          </div>

          <div className="space-y-2.5">
            {sessions.map(s => {
              const isSelected = s.id === selectedSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-500/50 shadow-md shadow-black/40'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1">{s.title}</h4>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-zinc-800 text-zinc-400">
                      {s.runs.length} runs
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-zinc-500 mt-1">{s.id}</p>
                  
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-zinc-800/60 pt-2">
                    <span className="truncate max-w-[160px] text-zinc-400">{s.workspacePath}</span>
                    <span className="text-emerald-400">Online</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Gateway Session Inspector (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-zinc-950 overflow-y-auto p-6 space-y-6">
          {selectedSession && (
            <>
              {/* Session Overview Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{selectedSession.title}</h3>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">Session ID: {selectedSession.id}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    CANONICALIZED
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500">Workspace Root</div>
                    <div className="text-zinc-200 truncate mt-0.5">{selectedSession.workspacePath}</div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500">Caller Identity</div>
                    <div className="text-zinc-200 truncate mt-0.5">{selectedSession.identity}</div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500">Active Run ID</div>
                    <div className="text-emerald-400 truncate mt-0.5">{selectedSession.activeRunId || 'None'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500">Created At</div>
                    <div className="text-zinc-400 text-[11px] truncate mt-0.5">{selectedSession.createdAt.split(' ')[0]}</div>
                  </div>
                </div>
              </div>

              {/* Gateway Public API Endpoints Contract (Section 7) */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                  <span>Gateway HTTP & WebSocket Contract (Section 7)</span>
                  <span className="text-zinc-500 font-mono text-[11px]">v1 Protocol</span>
                </h4>

                <div className="space-y-2 font-mono text-xs">
                  {[
                    { method: 'POST', path: '/v1/sessions', desc: 'Create authenticated workspace session with budget' },
                    { method: 'POST', path: '/v1/agents/run', desc: 'Dispatch Plan-Act-Verify autonomous agent execution' },
                    { method: 'POST', path: '/v1/approvals/:id/approve', desc: 'Authorize suspended L2/L3 operation' },
                    { method: 'GET', path: '/v1/events', desc: 'Multiplexed SSE / WebSocket real-time event stream' },
                    { method: 'GET', path: '/v1/audit', desc: 'Query tamper-evident structured audit log' }
                  ].map(ep => (
                    <div key={ep.path} className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ep.method === 'POST' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="text-zinc-200">{ep.path}</span>
                      </div>
                      <span className="text-zinc-500 text-[11px] font-sans">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
