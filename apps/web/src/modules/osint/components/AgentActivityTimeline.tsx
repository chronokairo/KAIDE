import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleDot,
  Database,
  FileCheck2,
  Loader2,
  Search,
  TerminalSquare,
  Wrench,
} from 'lucide-react';
import { HarnessActivity, HarnessActivityKind } from '../types';

interface AgentActivityTimelineProps {
  activities: HarnessActivity[];
  compact?: boolean;
  emptyMessage?: string;
}

const kindIcon = (kind: HarnessActivityKind) => {
  const className = 'w-3.5 h-3.5';
  if (kind === 'plan') return <BrainCircuit className={className} />;
  if (kind === 'model') return <Bot className={className} />;
  if (kind === 'tool') return <Wrench className={className} />;
  if (kind === 'observation') return <Search className={className} />;
  if (kind === 'evidence') return <FileCheck2 className={className} />;
  if (kind === 'result') return <Database className={className} />;
  if (kind === 'error') return <AlertTriangle className={className} />;
  if (kind === 'run') return <Activity className={className} />;
  return <TerminalSquare className={className} />;
};

const formatElapsed = (elapsed?: number) => {
  if (elapsed === undefined) return null;
  if (elapsed < 1000) return `${elapsed}ms`;
  return `${(elapsed / 1000).toFixed(elapsed < 10_000 ? 1 : 0)}s`;
};

export const AgentActivityTimeline: React.FC<AgentActivityTimelineProps> = ({
  activities,
  compact = false,
  emptyMessage = 'Aguardando eventos do harness...',
}) => {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 px-3 py-5 text-center text-[11px] text-slate-500">
        <CircleDot className="mx-auto mb-2 h-4 w-4" />
        {emptyMessage}
      </div>
    );
  }

  const visible = compact ? activities.slice(-8) : activities;

  return (
    <div className="relative space-y-0.5" role="log" aria-live="polite">
      {visible.map((activity, index) => {
        const elapsed = formatElapsed(activity.elapsed_ms);
        const isRunning = activity.status === 'running';
        const isFailed = activity.status === 'failed';
        const isComplete = activity.status === 'completed';
        const progress = activity.step !== undefined && activity.total
          ? Math.min(100, Math.round((activity.step / activity.total) * 100))
          : null;

        return (
          <div key={activity.id} className="group relative flex gap-2.5 py-1.5">
            {index < visible.length - 1 && (
              <span className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-slate-800" />
            )}
            <div className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
              isFailed
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : isRunning
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}>
              {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isComplete ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : kindIcon(activity.kind)}
            </div>

            <div className="min-w-0 flex-1 rounded-xl border border-transparent px-2 py-1 transition-colors group-hover:border-slate-800 group-hover:bg-slate-900/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[11px] font-semibold ${isFailed ? 'text-rose-300' : isRunning ? 'text-cyan-200' : 'text-slate-200'}`}>
                      {activity.title}
                    </span>
                    {activity.tool_name && (
                      <code className="rounded-md border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[9px] text-violet-300">
                        {activity.tool_name}
                      </code>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[9px] uppercase tracking-wide text-slate-600">
                    <span>{activity.kind}</span>
                    <span>{activity.source}</span>
                    <span title={activity.run_id}>#{activity.run_id.slice(-6)}</span>
                    {activity.step !== undefined && activity.total !== undefined && (
                      <span>{activity.step}/{activity.total}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-[9px] text-slate-600">
                  <div>{new Date(activity.timestamp).toLocaleTimeString()}</div>
                  {elapsed && <div className="mt-0.5 text-slate-500">{elapsed}</div>}
                </div>
              </div>

              {progress !== null && isRunning && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              )}

              {activity.detail && (
                compact ? (
                  <p className="mt-1 line-clamp-2 break-words text-[10px] leading-relaxed text-slate-500">{activity.detail}</p>
                ) : (
                  <details className="mt-1.5 text-[10px] text-slate-500">
                    <summary className="flex cursor-pointer list-none items-center gap-1 text-slate-500 hover:text-slate-300">
                      <ChevronDown className="h-3 w-3" /> Detalhes
                    </summary>
                    <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono leading-relaxed text-slate-400">
                      {activity.detail}
                    </pre>
                  </details>
                )
              )}
            </div>
          </div>
        );
      })}
      {compact && activities.length > visible.length && (
        <div className="pl-10 text-[10px] text-slate-600">+ {activities.length - visible.length} eventos anteriores no terminal</div>
      )}
    </div>
  );
};
