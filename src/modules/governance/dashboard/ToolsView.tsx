import React, { useState } from 'react';
import { 
  Wrench, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  Plug, 
  Search, 
  Plus, 
  Filter, 
  Terminal, 
  FileCode, 
  GitBranch, 
  Database,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ToolDefinition, RiskLevel } from '../types';

interface ToolsViewProps {
  tools: ToolDefinition[];
  onToggleTool: (id: string) => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({
  tools,
  onToggleTool
}) => {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToolId, setSelectedToolId] = useState<string>(tools[0]?.id);

  const filteredTools = tools.filter(tool => {
    const matchesRisk = selectedRiskFilter === 'ALL' || tool.risk === selectedRiskFilter;
    const matchesCategory = selectedCategory === 'ALL' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesCategory && matchesSearch;
  });

  const selectedTool = tools.find(t => t.id === selectedToolId) || tools[0];

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'L0': return { label: 'L0 - Read-only', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'L1': return { label: 'L1 - Local Reversible', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      case 'L2': return { label: 'L2 - External Mutation', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'L3': return { label: 'L3 - Privileged', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'L4': return { label: 'L4 - Destructive', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-zinc-100">Tool Gateway & MCP Registry</h2>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                L0–L4 Matrix
              </span>
            </div>
            <p className="text-xs text-zinc-400">Schema validation, permission enforcement, and MCP client bridges</p>
          </div>
        </div>

        {/* Risk Level Matrix Summary */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          {(['L0', 'L1', 'L2', 'L3', 'L4'] as const).map(risk => {
            const count = tools.filter(t => t.risk === risk).length;
            const badge = getRiskBadge(risk);
            return (
              <button
                key={risk}
                onClick={() => setSelectedRiskFilter(selectedRiskFilter === risk ? 'ALL' : risk)}
                className={`px-2.5 py-1 rounded border transition-colors ${
                  selectedRiskFilter === risk 
                    ? 'bg-zinc-800 border-zinc-500 text-white font-semibold' 
                    : `${badge.color} hover:bg-zinc-900`
                }`}
              >
                {risk}: {count}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Filter & Tools List (5 cols) */}
        <div className="lg:col-span-5 border-r border-zinc-800 flex flex-col h-full bg-zinc-900/20 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search tools, schemas, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none font-mono"
            >
              <option value="ALL">All Categories</option>
              <option value="fs">Filesystem</option>
              <option value="shell">Shell / Execution</option>
              <option value="git">Git</option>
              <option value="mcp">MCP Servers</option>
              <option value="system">System / OS</option>
            </select>
          </div>

          <div className="space-y-2.5 flex-1">
            {filteredTools.map((tool) => {
              const isSelected = tool.id === selectedToolId;
              const badge = getRiskBadge(tool.risk);

              return (
                <div
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900/90 border-purple-500/50 shadow-md shadow-black/40'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-semibold text-zinc-100">{tool.name}</h4>
                        {tool.source === 'mcp_server' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            MCP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{tool.id}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${badge.color}`}>
                      {tool.risk}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 mt-2 font-sans">{tool.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Tool Contract & Input Schema (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-zinc-950 overflow-y-auto p-6 space-y-6">
          {selectedTool && (
            <>
              {/* Tool Top Header Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-semibold text-zinc-100">{selectedTool.name}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-mono rounded border ${getRiskBadge(selectedTool.risk).color}`}>
                      {getRiskBadge(selectedTool.risk).label}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400 mt-1">{selectedTool.id}</p>
                  <p className="text-xs text-zinc-300 mt-2">{selectedTool.description}</p>
                </div>

                <button
                  onClick={() => onToggleTool(selectedTool.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedTool.enabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {selectedTool.enabled ? 'Tool Enabled' : 'Tool Disabled'}
                </button>
              </div>

              {/* Input Schema Parameters Contract */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                  <span>Input JSON Schema (Section 18)</span>
                  <span className="text-zinc-500 font-mono text-[11px]">Strict Contract</span>
                </h4>

                <div className="space-y-2">
                  {selectedTool.inputSchema.map(param => (
                    <div key={param.name} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-start justify-between font-mono text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-400 font-semibold">{param.name}</span>
                          <span className="text-zinc-500">({param.type})</span>
                          {param.required && (
                            <span className="px-1.5 py-0.2 text-[10px] rounded bg-rose-500/20 text-rose-300">required</span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 font-sans">{param.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capability Permissions Required */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Required Capability Permissions
                </h4>

                <div className="flex flex-wrap gap-2">
                  {selectedTool.permissions.map(perm => (
                    <span key={perm} className="px-2.5 py-1 text-xs font-mono rounded bg-zinc-950 border border-zinc-700 text-emerald-400">
                      {perm}
                    </span>
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
