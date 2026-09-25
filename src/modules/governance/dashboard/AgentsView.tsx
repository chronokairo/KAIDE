import React, { useState } from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Cpu, 
  Sliders, 
  Save, 
  Plus, 
  Check, 
  Flame, 
  Key, 
  Layers,
  Sparkles,
  Terminal
} from 'lucide-react';
import { Agent, ToolDefinition } from '../types';

interface AgentsViewProps {
  agents: Agent[];
  tools: ToolDefinition[];
  onUpdateAgent: (updatedAgent: Agent) => void;
  onSelectAgentForChat: (agentId: string) => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  tools,
  onUpdateAgent,
  onSelectAgentForChat
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0].id);
  const [saveToast, setSaveToast] = useState(false);

  const currentAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const [editForm, setEditForm] = useState<Agent>(currentAgent);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setEditForm(agent);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAgent(editForm);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const toggleTool = (toolId: string) => {
    setEditForm(prev => {
      const exists = prev.tools.includes(toolId);
      return {
        ...prev,
        tools: exists ? prev.tools.filter(t => t !== toolId) : [...prev.tools, toolId]
      };
    });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden">
      {/* Left: Agent Fleet List */}
      <div className="w-full md:w-80 border-r border-zinc-800/80 bg-zinc-900/50 p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Agent Fleet ({agents.length})</span>
          </h2>
        </div>

        <div className="space-y-2">
          {agents.map((a) => {
            const isSelected = a.id === selectedAgentId;
            return (
              <div
                key={a.id}
                onClick={() => handleSelectAgent(a)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                  isSelected
                    ? 'bg-zinc-800 border-emerald-500/50 text-white shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800/70 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    {a.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-zinc-100 truncate">{a.name}</div>
                    <div className="text-xs text-zinc-400 truncate">{a.role}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2 font-mono">
                  <span>{a.model.split('/')[1] || a.model}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 uppercase font-semibold text-emerald-400">
                    {a.permissionMode}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Agent Configurator Form */}
      <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
        <form onSubmit={handleSave} className="max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{editForm.avatar}</span>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">{editForm.name}</h2>
                <p className="text-xs text-zinc-400">{editForm.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectAgentForChat(editForm.id)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>Launch Chat</span>
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
              >
                {saveToast ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saveToast ? 'Saved!' : 'Save Config'}</span>
              </button>
            </div>
          </div>

          {/* Model Chain Setup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">Primary Model</label>
              <select
                value={editForm.model}
                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                className="w-full bg-zinc-950 text-zinc-100 text-xs rounded-lg p-2.5 border border-zinc-700 font-mono focus:border-emerald-500"
              >
                <option value="anthropic/claude-3-7-sonnet">anthropic/claude-3-7-sonnet</option>
                <option value="google/gemini-2.0-flash">google/gemini-2.0-flash</option>
                <option value="openai/gpt-4o">openai/gpt-4o</option>
                <option value="deepseek/deepseek-r1">deepseek/deepseek-r1</option>
                <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct</option>
              </select>
              <p className="text-[11px] text-zinc-400">Primary reasoning model for agent execution loops.</p>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">Fallback Chain Model</label>
              <select
                value={editForm.fallbackModel}
                onChange={(e) => setEditForm({ ...editForm, fallbackModel: e.target.value })}
                className="w-full bg-zinc-950 text-zinc-100 text-xs rounded-lg p-2.5 border border-zinc-700 font-mono focus:border-emerald-500"
              >
                <option value="google/gemini-2.0-flash">google/gemini-2.0-flash</option>
                <option value="anthropic/claude-3-5-haiku">anthropic/claude-3-5-haiku</option>
                <option value="openai/gpt-4o-mini">openai/gpt-4o-mini</option>
                <option value="deepseek/deepseek-r1">deepseek/deepseek-r1</option>
              </select>
              <p className="text-[11px] text-zinc-400">Automated fallback when provider rate-limits or times out.</p>
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">System Persona & Identity (SOUL)</label>
            <textarea
              value={editForm.systemPrompt}
              onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })}
              rows={4}
              className="w-full bg-zinc-950 text-zinc-100 text-xs rounded-xl p-3.5 border border-zinc-700 font-mono leading-relaxed focus:border-emerald-500"
            />
          </div>

          {/* Sliders: Temperature & Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">Temperature</span>
                <span className="text-emerald-400 font-mono">{editForm.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={editForm.temperature}
                onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>Deterministic (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">Permission Execution Policy</span>
                <span className="text-amber-400 font-mono uppercase text-[10px]">{editForm.permissionMode}</span>
              </div>
              <select
                value={editForm.permissionMode}
                onChange={(e) => setEditForm({ ...editForm, permissionMode: e.target.value as any })}
                className="w-full bg-zinc-950 text-zinc-100 text-xs rounded-lg p-2 border border-zinc-700 font-mono"
              >
                <option value="interactive">Interactive (Ask User for risky tools)</option>
                <option value="owner-only">Owner-Only (Strict approval queue)</option>
                <option value="always-allow">Always-Allow (Autonomous sandbox)</option>
                <option value="yolo">YOLO Mode (Dangerous - unrestricted)</option>
              </select>
            </div>
          </div>

          {/* Assigned Tools */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-300 block flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Assigned Sandbox Tools ({editForm.tools.length} active)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {tools.map((t) => {
                const isAssigned = editForm.tools.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTool(t.id)}
                    className={`p-3 rounded-lg border text-left text-xs transition cursor-pointer ${
                      isAssigned
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-semibold">
                      <span>{t.id}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded uppercase ${
                        t.riskLevel === 'high' ? 'text-rose-400 bg-rose-950/50' : 'text-zinc-400 bg-zinc-800'
                      }`}>
                        {t.riskLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{t.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
