import React from 'react';
import { 
  ShieldAlert, 
  Check, 
  X, 
  Clock, 
  FileCode, 
  Terminal, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { ApprovalRequest } from '../types';

interface ApprovalsViewProps {
  approvals: ApprovalRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  onApprove,
  onReject
}) => {
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const resolvedApprovals = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-zinc-100">High-Risk Operation Approval Queue</h2>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingApprovals.length} Pending
              </span>
            </div>
            <p className="text-xs text-zinc-400">Section 23: Human-in-the-loop permission gateway for L2, L3, and L4 operations</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Pending Approvals */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Pending Review ({pendingApprovals.length})</span>
          </h3>

          {pendingApprovals.length === 0 ? (
            <div className="p-8 rounded-xl bg-zinc-900/30 border border-zinc-800/80 text-center text-zinc-500 text-xs font-mono">
              ✓ No pending approvals. All active agent runs are executing within authorized boundaries.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map(apr => (
                <div key={apr.id} className="p-5 rounded-xl bg-zinc-900/70 border border-amber-500/40 space-y-4 shadow-lg shadow-black/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                          RISK {apr.risk}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-100">Action: {apr.toolId}</h4>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Agent: <span className="text-zinc-200">{apr.agentName}</span> • Run: <span className="text-zinc-200">{apr.runId}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-xs text-zinc-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{apr.timestamp}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-2 text-xs font-mono">
                    <div className="text-zinc-400 font-sans">{apr.justification}</div>
                    <div className="text-zinc-500 pt-1 border-t border-zinc-900">
                      Target Resource: <span className="text-emerald-400">{apr.targetResource}</span>
                    </div>
                    <pre className="text-[11px] text-zinc-300 overflow-x-auto pt-1">
                      {JSON.stringify(apr.arguments, null, 2)}
                    </pre>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={() => onReject(apr.id)}
                      className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-300 text-xs font-medium flex items-center space-x-1.5 border border-zinc-700 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject Operation</span>
                    </button>
                    <button
                      onClick={() => onApprove(apr.id)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center space-x-1.5 shadow-sm shadow-emerald-950 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Authorize & Resume</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Approvals History */}
        {resolvedApprovals.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Resolved Operations History ({resolvedApprovals.length})
            </h3>

            <div className="space-y-2">
              {resolvedApprovals.map(apr => (
                <div key={apr.id} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                      apr.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {apr.status}
                    </span>
                    <span className="text-zinc-200">{apr.toolId}</span>
                    <span className="text-zinc-500">by {apr.agentName}</span>
                  </div>

                  <span className="text-zinc-500 text-[11px]">{apr.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
