import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  RotateCcw,
  Sparkles,
  Terminal
} from 'lucide-react';
import { AuditEvent } from '../types';

interface AuditViewProps {
  logs: AuditEvent[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [filterResult, setFilterResult] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string>(logs[0]?.id);

  const filteredLogs = logs.filter(log => {
    const matchesResult = filterResult === 'ALL' || log.result === filterResult;
    const matchesSearch = log.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.identity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.tool && log.tool.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (log.resource && log.resource.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesResult && matchesSearch;
  });

  const selectedLog = logs.find(l => l.id === selectedLogId) || logs[0];

  const getResultBadge = (res: AuditEvent['result']) => {
    switch (res) {
      case 'SUCCESS':
      case 'ALLOWED':
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DENIED':
      case 'FAILURE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'REPAIR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-zinc-100">Structured Audit Trail & Telemetry (Section 40)</h2>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tamper-Evident
              </span>
            </div>
            <p className="text-xs text-zinc-400">Answers: Who? What? When? Why? Model? Tool? Resource? Result?</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          {(['ALL', 'ALLOWED', 'SUCCESS', 'DENIED', 'REPAIR'] as const).map(res => (
            <button
              key={res}
              onClick={() => setFilterResult(res)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                filterResult === res
                  ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Audit Event Feed (7 cols) */}
        <div className="lg:col-span-7 border-r border-zinc-800 flex flex-col h-full bg-zinc-900/20 overflow-y-auto p-5 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search audit trail by event type, identity, tool..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-2 flex-1">
            {filteredLogs.map(log => {
              const isSelected = log.id === selectedLogId;

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`p-3 rounded-lg border cursor-pointer font-mono text-xs transition-all ${
                    isSelected
                      ? 'bg-zinc-900/90 border-emerald-500/50 shadow-md shadow-black/40'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-zinc-500 text-[10px]">{log.timestamp.split(' ')[1]}</span>
                      <span className="font-semibold text-zinc-200">{log.type}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] rounded border ${getResultBadge(log.result)}`}>
                      {log.result}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Identity: <span className="text-zinc-200">{log.identity}</span></span>
                    {log.tool && <span>Tool: <span className="text-purple-400">{log.tool}</span></span>}
                    {log.resource && <span>Target: <span className="text-emerald-400 truncate max-w-[150px]">{log.resource}</span></span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Event Envelope (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full bg-zinc-950 overflow-y-auto p-6 space-y-4">
          {selectedLog && (
            <>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Audit Event Envelope (Section 38)
                    </h3>
                    <p className="text-xs font-mono text-zinc-500">{selectedLog.id}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-mono rounded border ${getResultBadge(selectedLog.result)}`}>
                    {selectedLog.result}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Timestamp</span>
                    <span className="text-zinc-200">{selectedLog.timestamp}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Event Type</span>
                    <span className="text-emerald-400">{selectedLog.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Actor Identity</span>
                    <span className="text-zinc-200">{selectedLog.identity}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Session ID</span>
                    <span className="text-zinc-200">{selectedLog.sessionId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Agent ID</span>
                    <span className="text-zinc-200">{selectedLog.agentId}</span>
                  </div>
                  {selectedLog.tool && (
                    <div className="flex justify-between py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-500">Invoked Tool</span>
                      <span className="text-purple-400">{selectedLog.tool}</span>
                    </div>
                  )}
                </div>

                {/* Structured Payload JSON */}
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Payload Details</span>
                  <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
