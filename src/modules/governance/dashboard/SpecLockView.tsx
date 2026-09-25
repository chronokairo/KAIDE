import React, { useState } from 'react';
import { 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Plus, 
  Check, 
  X, 
  RefreshCw,
  GitCommit,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SpecLock, MutationTransaction } from '../types';

interface SpecLockViewProps {
  specLocks: SpecLock[];
  transactions: MutationTransaction[];
  onRollbackTransaction: (txId: string) => void;
  onAddNewSpecLock: (lock: SpecLock) => void;
}

export const SpecLockView: React.FC<SpecLockViewProps> = ({
  specLocks,
  transactions,
  onRollbackTransaction,
  onAddNewSpecLock
}) => {
  const [selectedLockId, setSelectedLockId] = useState<string>(specLocks[0]?.id);
  const [activeSubTab, setActiveSubTab] = useState<'speclocks' | 'transactions'>('speclocks');

  const selectedLock = specLocks.find(l => l.id === selectedLockId) || specLocks[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-zinc-100">Specification-Locked Execution & Transactions</h2>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v2.4 Spec Guard
              </span>
            </div>
            <p className="text-xs text-zinc-400">Section 11 & 12: Prevents symbol drift & guarantees transactional rollback</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('speclocks')}
            className={`px-3 py-1 rounded transition-colors ${activeSubTab === 'speclocks' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Spec Locks ({specLocks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-3 py-1 rounded transition-colors ${activeSubTab === 'transactions' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Mutation Transactions ({transactions.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeSubTab === 'speclocks' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Spec Lock Left List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Active Specification Locks
              </h3>

              {specLocks.map((lock) => {
                const isSelected = lock.id === selectedLockId;
                return (
                  <div
                    key={lock.id}
                    onClick={() => setSelectedLockId(lock.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-zinc-900 border-purple-500/50 shadow-md shadow-black/40'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-100">{lock.name}</h4>
                        <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{lock.id}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        LOCKED
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                      <span>Symbols: {lock.symbols.length}</span>
                      <span>Target Files: {lock.targetFiles.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spec Lock Symbol Breakdown (7 cols) */}
            <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
              {selectedLock && (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">{selectedLock.name}</h3>
                      <p className="text-xs text-zinc-400 font-mono">Workspace: {selectedLock.workspaceId}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-mono rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      INV-09 STRICT
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Locked Symbols & Signatures</h4>
                    <div className="space-y-2.5">
                      {selectedLock.symbols.map(sym => (
                        <div key={sym.name} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-purple-400 font-semibold">{sym.kind}</span>
                              <span className="text-zinc-100 font-bold">{sym.name}</span>
                            </div>
                            <span className="text-emerald-400 text-[11px] flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                              <Check className="w-3 h-3" /> Validated
                            </span>
                          </div>

                          <div className="text-[11px] text-zinc-400 bg-zinc-900/80 p-2 rounded">
                            <span className="text-zinc-500 block">Returns: <span className="text-sky-300">{sym.returns}</span></span>
                            <span className="text-zinc-500 block mt-1">Target File: <span className="text-zinc-300">{sym.file}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Transactional Workspace Mutation View (Section 12) */
          <div className="space-y-4">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                <span>Transactional Mutation Engine (Section 12)</span>
                <span className="text-xs font-mono text-zinc-400">Snapshot & Rollback Broker</span>
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Every agent filesystem mutation is staged inside an isolated transaction. If verification fails or symbol drift is detected, changes are rolled back cleanly to the pre-run snapshot.
              </p>
            </div>

            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400">
                        <GitCommit className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-semibold text-zinc-100">Transaction {tx.id}</h4>
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {tx.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400">Snapshot ID: {tx.snapshotId} • Run ID: {tx.runId}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onRollbackTransaction(tx.id)}
                      className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-rose-300 flex items-center space-x-1.5 border border-zinc-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback to Snapshot</span>
                    </button>
                  </div>

                  {/* Staged Operations */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    {tx.operations.map(op => (
                      <div key={op.id} className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 font-mono text-xs flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-400 uppercase font-semibold text-[10px]">{op.type}</span>
                          <span className="text-zinc-200">{op.path}</span>
                        </div>
                        <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          Spec Lock: Compliant
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
