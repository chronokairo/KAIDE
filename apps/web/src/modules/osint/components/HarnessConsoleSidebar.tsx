import { useEffect, useRef, useState } from 'react';

import {
  Activity,
  AlertTriangle,
  Bot,
  Check,
  Copy,
  ListTree,
  Radio,
  Search,
  Settings,
  Terminal,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { HarnessActivity, ProviderSettings } from '../types';
import { AgentActivityTimeline } from './AgentActivityTimeline';

export interface HarnessLogEntry {
  id: string;
  timestamp: string;
  category: 'INFO' | 'IPC' | 'PLANNER' | 'WEB_OSINT' | 'GRAPH' | 'LGPD' | 'WARN' | 'ERROR';
  message: string;
  details?: string;
}

interface HarnessConsoleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  logs: HarnessLogEntry[];
  activities: HarnessActivity[];
  onClearLogs: () => void;
  onClearActivities: () => void;
  isProcessing: boolean;
  onStartInvestigation: (targetType: string, targetName: string, targetDoc: string, settings: ProviderSettings) => Promise<void>;
  providerSettings: ProviderSettings;
  onOpenSettings: () => void;
}

type TraceFilter = 'all' | 'agent' | 'tools' | 'errors';

export const HarnessConsoleSidebar: React.FC<HarnessConsoleSidebarProps> = ({
  isOpen,
  onClose,
  logs,
  activities,
  onClearLogs,
  onClearActivities,
  isProcessing,
  onStartInvestigation,
  providerSettings,
  onOpenSettings,
}) => {
  const [view, setView] = useState<'trace' | 'console'>('trace');
  const [filter, setFilter] = useState<TraceFilter>('all');
  const [copied, setCopied] = useState(false);
  const [searchTarget, setSearchTarget] = useState('');
  const [searchDoc, setSearchDoc] = useState('');
  const [targetType, setTargetType] = useState('person');
  const [detectedFormat, setDetectedFormat] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activities, logs, view]);

  if (!isOpen) return null;

  const runningCount = new Set(activities.filter((item) => item.status === 'running').map((item) => item.run_id)).size;
  const toolCount = new Set(activities.filter((item) => item.tool_name).map((item) => `${item.run_id}:${item.tool_name}`)).size;
  const errorCount = new Set(activities.filter((item) => item.status === 'failed').map((item) => item.run_id)).size;
  const runCount = new Set(activities.filter((item) => item.source !== 'system').map((item) => item.run_id)).size;
  const isRuntimeActive = isProcessing || runningCount > 0;

  const filteredActivities = activities.filter((item) => {
    if (filter === 'agent') return item.kind === 'plan' || item.kind === 'model' || item.kind === 'observation';
    if (filter === 'tools') return item.kind === 'tool' || item.kind === 'evidence';
    if (filter === 'errors') return item.status === 'failed' || item.kind === 'error';
    return true;
  });

  const handleCopy = () => {
    const traceText = activities
      .map((item) => `[${item.timestamp}] [${item.run_id}] [${item.kind}/${item.status}] ${item.title}${item.detail ? ` — ${item.detail}` : ''}`)
      .join('\n');
    const consoleText = logs
      .map((item) => `[${item.timestamp}] [${item.category}] ${item.message}${item.details ? ` — ${item.details}` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(view === 'trace' ? traceText : consoleText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleClear = () => {
    if (view === 'trace') onClearActivities();
    else onClearLogs();
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTarget(value);
    const clean = value.replace(/\D/g, '');
    if (clean.length === 11) {
      setDetectedFormat('CPF detectado');
      setTargetType('person');
      setSearchDoc(value.trim());
    } else if (clean.length === 14) {
      setDetectedFormat('CNPJ detectado');
      setTargetType('company');
      setSearchDoc(value.trim());
    } else if (value.trim()) {
      setDetectedFormat('Nome / razão social');
      setTargetType('person');
      setSearchDoc('');
    } else {
      setDetectedFormat('');
      setSearchDoc('');
    }
  };

  const handleRunSearch = () => {
    if (!searchTarget.trim() || isProcessing) return;
    void onStartInvestigation(targetType, searchTarget.trim(), searchDoc.trim(), providerSettings);
  };

  return (
    <aside className="fixed right-0 top-[61px] z-50 flex h-[calc(100vh-61px)] w-[min(94vw,430px)] shrink-0 flex-col border-l border-slate-800 bg-slate-950/98 font-mono shadow-2xl shadow-black/40 backdrop-blur-xl xl:sticky xl:z-20">
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${isRuntimeActive ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
              {isRuntimeActive ? <Activity className="h-4 w-4 animate-pulse" /> : <Terminal className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                Agent Runtime
                <span className={`flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider ${isRuntimeActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Radio className={`h-2.5 w-2.5 ${isRuntimeActive ? 'animate-pulse' : ''}`} />
                  {isRuntimeActive ? 'live' : 'idle'}
                </span>
              </div>
              <div className="truncate text-[9px] text-slate-500">Plan → Act → Observe → Verify → Result</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleCopy} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-cyan-300" title="Copiar visão atual">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button onClick={handleClear} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400" title="Limpar visão atual">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white" title="Fechar runtime">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ['Runs', runCount],
            ['Ativos', runningCount],
            ['Tools', toolCount],
            ['Erros', errorCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-1.5 text-center">
              <div className="text-xs font-bold text-slate-200">{value}</div>
              <div className="text-[8px] uppercase tracking-wider text-slate-600">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-3 py-2">
        <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
          <button onClick={() => setView('trace')} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold ${view === 'trace' ? 'bg-slate-800 text-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}>
            <ListTree className="h-3 w-3" /> Agent trace
          </button>
          <button onClick={() => setView('console')} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold ${view === 'console' ? 'bg-slate-800 text-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}>
            <Terminal className="h-3 w-3" /> Console
          </button>
        </div>
        {view === 'trace' && (
          <div className="flex items-center gap-0.5">
            {(['all', 'agent', 'tools', 'errors'] as TraceFilter[]).map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-1.5 py-1 text-[9px] capitalize ${filter === item ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-600 hover:text-slate-300'}`}>
                {item === 'all' ? 'todos' : item === 'agent' ? 'agente' : item === 'tools' ? 'tools' : 'erros'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-slate-800">
        {view === 'trace' ? (
          <AgentActivityTimeline activities={filteredActivities} />
        ) : logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[11px] text-slate-600">
            <Terminal className="h-7 w-7" />
            Console vazio
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className={`rounded-xl border p-2.5 ${log.category === 'ERROR' ? 'border-rose-500/30 bg-rose-500/5' : log.category === 'WARN' ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 bg-slate-900/45'}`}>
                <div className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-wide text-slate-600">
                  <span className="flex items-center gap-1.5">
                    {log.category === 'ERROR' ? <AlertTriangle className="h-3 w-3 text-rose-400" /> : log.category === 'PLANNER' ? <Bot className="h-3 w-3 text-violet-400" /> : log.category === 'IPC' ? <Wrench className="h-3 w-3 text-cyan-400" /> : <Terminal className="h-3 w-3" />}
                    {log.category}
                  </span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="mt-1.5 break-words text-[10px] leading-relaxed text-slate-300">{log.message}</div>
                {log.details && <pre className="mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-2 text-[9px] text-slate-500">{log.details}</pre>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2.5 border-t border-slate-800 bg-slate-900/90 p-3 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-200">
            <Search className="h-3.5 w-3.5 text-cyan-400" /> Nova investigação
          </div>
          <button onClick={onOpenSettings} className="flex items-center gap-1 text-[9px] font-mono text-slate-500 hover:text-cyan-300">
            <Settings className="h-3 w-3" /> provider
          </button>
        </div>
        <div className="relative">
          <input
            value={searchTarget}
            onChange={(event) => handleSearchInputChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleRunSearch()}
            placeholder="Nome, razão social, CPF ou CNPJ"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 pr-24 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
          {detectedFormat && <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[8px] text-cyan-300">{detectedFormat}</span>}
        </div>
        <button onClick={handleRunSearch} disabled={isProcessing || !searchTarget.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/10 transition-colors hover:bg-cyan-300 disabled:opacity-40">
          {isProcessing ? <Activity className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {isProcessing ? 'Executando pipeline...' : 'Iniciar investigação'}
        </button>
      </div>
    </aside>
  );
};
