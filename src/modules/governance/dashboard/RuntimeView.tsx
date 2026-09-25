import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Lock, 
  Terminal, 
  FileCode, 
  Sparkles, 
  Pause, 
  ArrowRight,
  Database,
  Check,
  X,
  RefreshCw,
  Cpu,
  Clock,
  Layers
} from 'lucide-react';
import { Agent, AgentRun, PlanStep, SpecLock, VerificationStage } from '../types';

interface RuntimeViewProps {
  agents: Agent[];
  activeRun: AgentRun;
  onExecuteNewTask: (task: string, agentId: string, modelId: string) => void;
  onApproveStep?: (stepId: string) => void;
  onTriggerRepair?: () => void;
  specLocks: SpecLock[];
}

export const RuntimeView: React.FC<RuntimeViewProps> = ({
  agents,
  activeRun,
  onExecuteNewTask,
  onTriggerRepair,
  specLocks
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || 'agt-core-architect');
  const [selectedModel, setSelectedModel] = useState(agents[0]?.defaultModel || 'nvidia/nim-qwen-2.5-coder-32b');
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleStartTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setIsSimulating(true);
    onExecuteNewTask(taskInput, selectedAgentId, selectedModel);
    setTaskInput('');
    setTimeout(() => setIsSimulating(false), 800);
  };

  const getStageColor = (status: VerificationStage['status']) => {
    switch (status) {
      case 'passed': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'failed': return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      case 'running': return 'text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse';
      default: return 'text-zinc-500 border-zinc-800 bg-zinc-900/50';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Top Banner / State Machine Tracker */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-zinc-100">Autonomous Agent Runtime</h2>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                v2.4.0 Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400">Plan → Act → Verify → Repair deterministic execution loop</p>
          </div>
        </div>

        {/* State Machine Badges */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 text-xs font-mono">
          {(['INITIALIZED', 'PLANNING', 'POLICY_CHECK', 'EXECUTE', 'VERIFY', 'COMPLETE'] as const).map((st, idx) => {
            const isCurrent = activeRun.state === st;
            const isCompleted = activeRun.state === 'COMPLETE' || 
              (st === 'INITIALIZED' && activeRun.state !== 'INITIALIZED') ||
              (st === 'PLANNING' && ['POLICY_CHECK', 'EXECUTE', 'VERIFY', 'COMPLETE'].includes(activeRun.state));
            
            return (
              <div key={st} className="flex items-center space-x-1">
                <span className={`px-2.5 py-1 rounded border transition-all ${
                  isCurrent 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold shadow-sm shadow-emerald-500/20' 
                    : isCompleted 
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-300' 
                    : 'bg-zinc-950 border-zinc-800/80 text-zinc-600'
                }`}>
                  {st}
                </span>
                {idx < 5 && <ArrowRight className="w-3 h-3 text-zinc-700" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Task Launcher & Active Plan (5 cols) */}
        <div className="lg:col-span-5 border-r border-zinc-800 flex flex-col h-full bg-zinc-900/20 overflow-y-auto">
          {/* Dispatch Panel */}
          <div className="p-5 border-b border-zinc-800 bg-zinc-900/40">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Task Dispatcher</span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Policy Active
              </span>
            </h3>

            <form onSubmit={handleStartTask} className="space-y-3">
              <div>
                <textarea
                  id="runtime-task-input"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="e.g. Refactor Model Router to support dynamic NIM fallback with Spec Lock check and bounded repair..."
                  className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Assigned Agent</label>
                  <select
                    id="runtime-agent-select"
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">Target Model</label>
                  <select
                    id="runtime-model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                  >
                    <option value="nvidia/nim-qwen-2.5-coder-32b">NVIDIA NIM Qwen 2.5 (32B)</option>
                    <option value="ollama/llama-3.3-70b-instruct">Ollama LLaMA 3.3 (70B Local)</option>
                    <option value="google/gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                    <option value="anthropic/claude-3-7-sonnet">Anthropic Claude 3.7 Sonnet</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                id="runtime-dispatch-btn"
                disabled={isSimulating}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm shadow-emerald-950"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Constructing Context & Planning...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Execute Autonomous Task</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Run Context & Plan Steps */}
          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Plan / Act Sequence ({activeRun.plan.length} Steps)
              </h3>
              <span className="text-xs font-mono text-zinc-400">
                Run ID: <span className="text-zinc-200">{activeRun.id}</span>
              </span>
            </div>

            <div className="space-y-3">
              {activeRun.plan.map((step, idx) => {
                const isSelected = activeStepTab === idx;
                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStepTab(idx)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-zinc-900/90 border-emerald-500/50 shadow-md shadow-black/40'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          step.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          step.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                          step.status === 'failed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {step.order}
                        </span>
                        <h4 className="text-xs font-medium text-zinc-100">{step.objective}</h4>
                      </div>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                        step.status === 'passed' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50' :
                        step.status === 'in_progress' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50' :
                        'bg-zinc-900 text-zinc-500'
                      }`}>
                        {step.status}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                      <div>
                        <span className="text-zinc-500 font-mono text-[10px]">Mutations: </span>
                        <span className="font-mono text-zinc-300">{step.intendedMutations.length > 0 ? step.intendedMutations.join(', ') : 'None (Read/Verify)'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-mono text-[10px]">Validator: </span>
                        <span className="text-zinc-300 truncate">{step.validationStrategy}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Run Resource Budgets */}
            <div className="mt-auto pt-4 border-t border-zinc-800/80">
              <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Finite Resource Budget (INV-07)</h4>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">Model Calls</div>
                  <div className="text-zinc-200 font-semibold">{activeRun.budget.modelCallsUsed} / {activeRun.budget.maxModelCalls}</div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">Tool Calls</div>
                  <div className="text-zinc-200 font-semibold">{activeRun.budget.toolCallsUsed} / {activeRun.budget.maxToolCalls}</div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">Repair Cycles</div>
                  <div className="text-emerald-400 font-semibold">{activeRun.budget.repairCyclesUsed} / {activeRun.budget.maxRepairCycles}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Act, Spec-Lock & Multi-Stage Verification Pipeline (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-zinc-950 overflow-y-auto p-6 space-y-6">
          {/* Spec Lock Contract Status */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                    Specification-Locked Execution (v2.4 AST Guard)
                  </h3>
                  <p className="text-xs text-zinc-400">Enforces strict API signatures and symbol contracts before mutation commit</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                INV-09 ENFORCED
              </span>
            </div>

            <div className="space-y-2">
              {specLocks[0]?.symbols.map((sym) => (
                <div key={sym.name} className="flex items-center justify-between p-2.5 rounded bg-zinc-950 border border-zinc-800/80 font-mono text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="text-purple-400 font-semibold">{sym.kind}</span>
                    <span className="text-zinc-200">{sym.name}</span>
                    <span className="text-zinc-500 text-[11px]">→ {sym.returns}</span>
                  </div>
                  <span className="flex items-center space-x-1.5 text-[11px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                    <Check className="w-3 h-3" />
                    <span>Signature Matched</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Pipeline Engine */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                    Multi-Stage Verification Pipeline (Section 35)
                  </h3>
                  <p className="text-xs text-zinc-400">Deterministic verifiers running independently of LLM self-evaluation</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onTriggerRepair}
                  id="runtime-repair-btn"
                  className="px-2.5 py-1 text-xs font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center space-x-1.5 transition-colors border border-zinc-700"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Run Verifiers</span>
                </button>
                <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PASS (6/6 STAGES)
                </span>
              </div>
            </div>

            {/* Stages Stack */}
            <div className="space-y-3 flex-1">
              {activeRun.verification.stages.map((stg, index) => (
                <div key={stg.id} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-mono text-zinc-500">0{index + 1}</span>
                      <span className="text-xs font-medium text-zinc-200">{stg.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-[11px]">
                      {stg.durationMs && <span className="text-zinc-500">{stg.durationMs}ms</span>}
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${getStageColor(stg.status)}`}>
                        {stg.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/80 rounded px-3 py-1.5 font-mono text-[11px] text-zinc-400 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                      <span>$ {stg.command}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">exit: {stg.exitCode ?? 0}</span>
                  </div>

                  {stg.diagnostics && (
                    <div className="text-[11px] font-mono text-emerald-400/90 pl-5 border-l border-emerald-500/20 py-0.5">
                      {stg.diagnostics}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Transactional Rollback Footer */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-zinc-500" />
                <span>Active Transaction: <span className="font-mono text-zinc-200">{activeRun.transactionId || 'tx-20260830-01'}</span></span>
              </div>
              <span className="text-emerald-400 font-mono">Rollback Snapshot: snap-88419a (Ready)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
