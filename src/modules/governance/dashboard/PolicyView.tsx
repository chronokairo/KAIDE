import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  KeyRound, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  SlidersHorizontal,
  FileCheck
} from 'lucide-react';
import { PolicyRule, RiskLevel } from '../types';

interface PolicyViewProps {
  policies: PolicyRule[];
  onTogglePolicy: (id: string) => void;
  onAddPolicy: (newPolicy: Omit<PolicyRule, 'id' | 'order'>) => void;
}

export const PolicyView: React.FC<PolicyViewProps> = ({
  policies,
  onTogglePolicy,
  onAddPolicy
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newToolPattern, setNewToolPattern] = useState('*');
  const [newAction, setNewAction] = useState<'ALLOW' | 'REQUIRE_APPROVAL' | 'DENY'>('REQUIRE_APPROVAL');
  const [selectedRisks, setSelectedRisks] = useState<RiskLevel[]>(['L2', 'L3', 'L4']);

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    onAddPolicy({
      name: newRuleName,
      description: newRuleDesc,
      matchIdentity: '*',
      matchTool: newToolPattern,
      matchRisk: selectedRisks,
      action: newAction,
      enabled: true
    });

    setShowAddModal(false);
    setNewRuleName('');
    setNewRuleDesc('');
  };

  const getActionBadge = (action: PolicyRule['action']) => {
    switch (action) {
      case 'ALLOW': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'REQUIRE_APPROVAL': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DENY': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-zinc-100">Deterministic Policy Engine & Invariant Guard</h2>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                INV-01 to INV-10
              </span>
            </div>
            <p className="text-xs text-zinc-400">Deterministic evaluation rules: The model proposes, the control plane decides</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Policy Rule</span>
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Core Invariant Non-Negotiables (Section 74) */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
            <span>Runtime Invariant Matrix (Section 74)</span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 10 / 10 Enforced
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { code: 'INV-01', text: 'LLM cannot grant itself additional permissions.' },
              { code: 'INV-02', text: 'Tool cannot execute before schema argument validation.' },
              { code: 'INV-03', text: 'Mutation cannot bypass policy engine evaluation.' },
              { code: 'INV-04', text: 'Workspace operations strictly canonicalized against ../ escape.' },
              { code: 'INV-05', text: 'Secrets strictly isolated via secret:// references.' },
              { code: 'INV-09', text: 'Specification drift fails validation when Spec Lock exists.' }
            ].map(inv => (
              <div key={inv.code} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <span className="font-mono text-amber-400 font-bold block mb-1">{inv.code}</span>
                <p className="text-zinc-400 font-sans">{inv.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Configured Policy Rules Table */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Active Policy Rule Chain ({policies.length} Rules)
          </h3>

          <div className="space-y-3">
            {policies.map((pol) => (
              <div key={pol.id} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start justify-between">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono text-zinc-500">#{pol.order}</span>
                    <h4 className="text-xs font-semibold text-zinc-100">{pol.name}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${getActionBadge(pol.action)}`}>
                      {pol.action}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">{pol.description}</p>
                  
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-zinc-500 pt-1">
                    <span>Tool Pattern: <span className="text-zinc-300">{pol.matchTool}</span></span>
                    <span>•</span>
                    <span>Risk Levels: <span className="text-amber-400">{pol.matchRisk.join(', ')}</span></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onTogglePolicy(pol.id)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      pol.enabled ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-300' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {pol.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100">Create New Policy Rule</h3>

            <form onSubmit={handleCreatePolicy} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Require approval for cloud resource creation"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Description</label>
                <textarea
                  placeholder="Explains what operations this rule governs..."
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Tool Pattern Match</label>
                <input
                  type="text"
                  placeholder="e.g. git.push, mcp.cloud.*"
                  value={newToolPattern}
                  onChange={(e) => setNewToolPattern(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Enforcement Action</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 font-mono"
                >
                  <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (Suspend until human review)</option>
                  <option value="ALLOW">ALLOW (Execute silently)</option>
                  <option value="DENY">DENY (Strictly reject)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium"
                >
                  Save Policy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
