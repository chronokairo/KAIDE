import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  ShieldAlert, 
  Database, 
  Server, 
  RefreshCw, 
  Check, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  Copy,
  Terminal,
  FileCode
} from 'lucide-react';
import { INITIAL_CONFIG } from '../data/mockData';

export const ConfigView: React.FC = () => {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [showSecrets, setShowSecrets] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-zinc-100">Control Plane Configuration & Secrets (Section 41 & 57)</h2>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Layered Resolution
              </span>
            </div>
            <p className="text-xs text-zinc-400">Default settings, server socket bindings, and secret:// reference resolution broker</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center space-x-1.5 shadow-sm shadow-emerald-950 transition-colors"
        >
          {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedSuccess ? 'Configuration Saved' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Secret Reference Isolation Broker (INV-05 & Section 41) */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Secret Reference Isolation (INV-05)
                </h3>
                <p className="text-xs text-zinc-400">
                  Secrets never enter prompts or logs. Agents reference secret:// URIs resolved only within the trusted execution sandbox.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="px-2.5 py-1 text-xs font-mono rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
            >
              {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showSecrets ? 'Hide URIs' : 'Inspect URIs'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-mono text-xs">
            {[
              { label: 'NVIDIA NIM Token', ref: 'secret://nvidia/nim-token' },
              { label: 'GitHub MCP Token', ref: 'secret://github/default' },
              { label: 'SQLite Encryption Key', ref: 'secret://database/master' }
            ].map(sec => (
              <div key={sec.label} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase">{sec.label}</span>
                <div className="text-emerald-400 font-semibold truncate">
                  {showSecrets ? sec.ref : 'secret://••••••••••••••••'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Server & Runtime Config Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server Networking */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Server & IPC Bindings</h3>

            <div>
              <label className="block text-zinc-400 mb-1 font-mono">Control Plane Bind Address</label>
              <input
                type="text"
                value={config.server.bind}
                onChange={(e) => setConfig({ ...config, server: { ...config.server, bind: e.target.value } })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-mono">IPC Unix Domain Socket</label>
              <input
                type="text"
                value={config.server.rpc_socket}
                onChange={(e) => setConfig({ ...config, server: { ...config.server, rpc_socket: e.target.value } })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 font-mono"
              />
            </div>
          </div>

          {/* Execution Limits & Budgets */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Default Execution Limits</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1 font-mono">Max Iterations Cap</label>
                <input
                  type="number"
                  value={config.agent.max_iterations}
                  onChange={(e) => setConfig({ ...config, agent: { ...config.agent, max_iterations: parseInt(e.target.value) || 50 } })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-mono">Max Repair Cycles</label>
                <input
                  type="number"
                  value={config.agent.max_repair_cycles}
                  onChange={(e) => setConfig({ ...config, agent: { ...config.agent, max_repair_cycles: parseInt(e.target.value) || 5 } })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-mono">Default Execution Isolation</label>
              <select
                value={config.agent.default_isolation}
                onChange={(e) => setConfig({ ...config, agent: { ...config.agent, default_isolation: e.target.value } })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 font-mono"
              >
                <option value="local_sandbox">local_sandbox (OS Restricted Subprocess)</option>
                <option value="docker_isolated">docker_isolated (Container Boundary)</option>
                <option value="host_restricted">host_restricted (Non-privileged)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
