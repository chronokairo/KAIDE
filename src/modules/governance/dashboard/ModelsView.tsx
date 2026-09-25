import React, { useState } from 'react';
import { 
  Network, 
  Radio, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sliders, 
  RefreshCw, 
  Check, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Server
} from 'lucide-react';
import { ModelCapability } from '../types';

interface ModelsViewProps {
  models: ModelCapability[];
  onToggleModelStatus: (id: string) => void;
  defaultModelId: string;
  onSetDefaultModel: (id: string) => void;
}

export const ModelsView: React.FC<ModelsViewProps> = ({
  models,
  onToggleModelStatus,
  defaultModelId,
  onSetDefaultModel
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModelId || models[0]?.id);
  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  const [simulatingRouter, setSimulatingRouter] = useState(false);
  const [routerTestRequirement, setRouterTestRequirement] = useState<'coding_complex' | 'coding_simple' | 'vision' | 'high_risk'>('coding_complex');
  const [routedResult, setRoutedResult] = useState<string | null>(null);

  const handleTestRouter = () => {
    setSimulatingRouter(true);
    setRoutedResult(null);
    setTimeout(() => {
      if (routerTestRequirement === 'coding_complex') {
        setRoutedResult('nvidia/nim-qwen-2.5-coder-32b (Primary NIM Coding Engine)');
      } else if (routerTestRequirement === 'coding_simple') {
        setRoutedResult('ollama/llama-3.3-70b-instruct (Local 0-latency worker)');
      } else if (routerTestRequirement === 'vision') {
        setRoutedResult('google/gemini-2.0-flash (1M Context + Multimodal)');
      } else {
        setRoutedResult('anthropic/claude-3-7-sonnet + Spec Lock Verifier');
      }
      setSimulatingRouter(false);
    }, 450);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-zinc-100">Model Gateway & Capability Router</h2>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Capability-Driven
              </span>
            </div>
            <p className="text-xs text-zinc-400">Provider-independent abstraction (NVIDIA NIM, Ollama, OpenRouter, Anthropic)</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-300">Local Providers: 2 Online</span>
          </div>
          <div className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span className="text-zinc-300">Remote APIs: 3 Ready</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Models List (5 cols) */}
        <div className="lg:col-span-5 border-r border-zinc-800 flex flex-col h-full bg-zinc-900/20 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Registered Model Providers ({models.length})
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Section 13-16</span>
          </div>

          <div className="space-y-3">
            {models.map((model) => {
              const isSelected = model.id === selectedModelId;
              const isDefault = model.id === defaultModelId;

              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900/90 border-sky-500/50 shadow-md shadow-black/40'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-semibold text-zinc-100">{model.name}</h4>
                        {isDefault && (
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{model.id}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase border ${
                      model.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      {model.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-800/60 pt-2.5">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Context</span>
                      <span className="text-zinc-200">{(model.contextLength / 1000).toFixed(0)}k toks</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Avg Latency</span>
                      <span className="text-zinc-200">{model.latencyMs}ms</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Provider</span>
                      <span className="text-zinc-200 uppercase">{model.provider}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Model Router Testing Playground */}
          <div className="mt-auto bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Model Router Evaluation</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-500">Section 15</span>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] text-zinc-400">Incoming Task Complexity / Signals</label>
              <select
                value={routerTestRequirement}
                onChange={(e) => setRouterTestRequirement(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500/50 font-mono"
              >
                <option value="coding_complex">coding/complex (Multi-file Refactoring)</option>
                <option value="coding_simple">coding/simple (Local Quick Patch)</option>
                <option value="vision">multimodal/vision (UI Screenshot & Diagrams)</option>
                <option value="high_risk">high_risk/mutation (Kernel Trait Overhaul)</option>
              </select>
            </div>

            <button
              onClick={handleTestRouter}
              disabled={simulatingRouter}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-1.5 px-3 rounded text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              {simulatingRouter ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Evaluating Capability Matrix...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  <span>Test Router Decision</span>
                </>
              )}
            </button>

            {routedResult && (
              <div className="p-2.5 rounded bg-sky-950/40 border border-sky-800/40 text-xs font-mono text-sky-300">
                <span className="text-[10px] text-sky-500 block uppercase">Selected Route</span>
                {routedResult}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Model Details & Capabilities Spec (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-zinc-950 overflow-y-auto p-6 space-y-6">
          {selectedModel && (
            <>
              {/* Header card */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-semibold text-zinc-100">{selectedModel.name}</h3>
                    <span className="px-2.5 py-0.5 text-xs font-mono rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {selectedModel.provider}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400 mt-1">{selectedModel.id}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSetDefaultModel(selectedModel.id)}
                    disabled={selectedModel.id === defaultModelId}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 text-white transition-colors"
                  >
                    {selectedModel.id === defaultModelId ? 'Default Active' : 'Set as Default'}
                  </button>
                  <button
                    onClick={() => onToggleModelStatus(selectedModel.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                  >
                    {selectedModel.status === 'online' ? 'Disable Provider' : 'Enable Provider'}
                  </button>
                </div>
              </div>

              {/* Capabilities Grid (Section 14) */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                  <span>Model Capabilities Matrix (Section 14)</span>
                  <span className="text-zinc-500 font-mono text-[11px]">ModelCapabilities struct</span>
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <div className="text-[11px] text-zinc-500 font-mono">Tool Calling</div>
                    <div className="mt-1 flex items-center space-x-1.5 font-semibold text-xs text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>{selectedModel.tools ? 'Supported' : 'Unsupported'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <div className="text-[11px] text-zinc-500 font-mono">Structured Output</div>
                    <div className="mt-1 flex items-center space-x-1.5 font-semibold text-xs text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>{selectedModel.structuredOutput ? 'Strict JSON' : 'None'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <div className="text-[11px] text-zinc-500 font-mono">Deep Reasoning</div>
                    <div className="mt-1 flex items-center space-x-1.5 font-semibold text-xs text-purple-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{selectedModel.reasoning ? 'CoT Enabled' : 'Standard'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <div className="text-[11px] text-zinc-500 font-mono">Vision / Multimodal</div>
                    <div className="mt-1 flex items-center space-x-1.5 font-semibold text-xs text-zinc-300">
                      <span>{selectedModel.vision ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
                  <div className="text-[11px] text-zinc-500 uppercase">Rust Adapter Trait Contract:</div>
                  <pre className="text-[11px] text-sky-400 overflow-x-auto">
{`#[async_trait]
pub trait ModelProvider: Send + Sync {
    async fn complete(&self, req: ModelRequest) -> Result<ModelResponse, ModelError>;
    async fn stream(&self, req: ModelRequest) -> Result<ModelStream, ModelError>;
    fn capabilities(&self) -> ModelCapabilities;
}`}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
