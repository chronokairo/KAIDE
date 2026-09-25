import React, { useState, useEffect } from 'react';
import { 
  ScrollText, 
  Search, 
  Trash2, 
  Download, 
  Play, 
  Pause, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { LogEntry } from '../types';

interface LogsViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onClearLogs }) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(true);

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesSearch = 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kairos-gateway-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-zinc-950">
      {/* Top Filter Bar */}
      <div className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Gateway Daemon Log Stream
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            {['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-zinc-800 text-emerald-400 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-950 text-zinc-100 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-zinc-700 w-44 focus:w-60 transition-all font-mono"
            />
          </div>

          {/* Live Pause/Play */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isLive ? 'Tailing Live' : 'Paused'}</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            title="Export Logs"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear */}
          <button
            onClick={onClearLogs}
            title="Clear Log Buffer"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Terminal View */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 bg-zinc-950">
        {filteredLogs.map((log) => {
          const levelColor = 
            log.level === 'ERROR' ? 'text-rose-400 bg-rose-950/60 border-rose-800' :
            log.level === 'WARN' ? 'text-amber-400 bg-amber-950/60 border-amber-800' :
            log.level === 'DEBUG' ? 'text-zinc-500 bg-zinc-900 border-zinc-800' :
            'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';

          return (
            <div
              key={log.id}
              className="px-3 py-1.5 rounded-md hover:bg-zinc-900/60 flex items-start gap-3 transition"
            >
              <span className="text-zinc-400 shrink-0 select-none">{log.timestamp}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border shrink-0 ${levelColor}`}>
                {log.level}
              </span>
              <span className="text-sky-400 font-semibold shrink-0">[{log.source}]</span>
              <span className="text-zinc-200 flex-1 leading-relaxed">{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
