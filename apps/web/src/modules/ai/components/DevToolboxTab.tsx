"use client";

import React, { useState } from 'react';
import { useExecuteDevTool } from '@/modules/dev/hooks/useHarness';
import type { DevToolExecutionResult } from '@/modules/dev/harness-client';

interface DevToolboxTabProps {
  workspace?: string;
}

interface ToolCategory {
  category: string;
  icon: string;
  description: string;
  tools: Array<{
    id: string;
    name: string;
    icon: string;
    desc: string;
    cmd?: string;
    badge?: string;
    priority: 'P0' | 'P1';
  }>;
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    category: '1. Projeto',
    icon: 'folder',
    description: 'Navegação, busca, edição e inspeção de código fonte',
    tools: [
      { id: 'git_status', name: 'File Explorer & Git Status', icon: 'folder_open', desc: 'Status de arquivos modificados e estrutura', priority: 'P0' },
      { id: 'custom', cmd: 'rg "TODO" .', name: 'Code Search (Ripgrep)', icon: 'search', desc: 'Buscar texto e símbolos no projeto', priority: 'P0' },
      { id: 'git_status', name: 'Code Editor & Diff', icon: 'edit_note', desc: 'Revisar e editar arquivos com diff', priority: 'P0' },
    ],
  },
  {
    category: '2. Execução',
    icon: 'terminal',
    description: 'Comandos CLI determinísticos e gerenciamento de processos',
    tools: [
      { id: 'custom', cmd: 'npm run dev', name: 'Command Runner (Dev)', icon: 'play_arrow', desc: 'Preset dev server do Next.js / Vite', priority: 'P0' },
      { id: 'custom', cmd: 'git log -n 5', name: 'Terminal Output Capture', icon: 'data_object', desc: 'Captura de stdout/stderr com timeout', priority: 'P0' },
      { id: 'custom', cmd: 'npm --version', name: 'Process & Package Scripts', icon: 'account_tree', desc: 'Executar scripts do package.json', priority: 'P1' },
    ],
  },
  {
    category: '3. Qualidade & Verification',
    icon: 'verified',
    description: 'Builds, testes unitários, linter e typechecking',
    tools: [
      { id: 'typecheck', name: 'Typecheck (TypeScript)', icon: 'spellcheck', desc: 'tsc --noEmit em modo estrito', badge: 'TSC', priority: 'P0' },
      { id: 'cargo_check', name: 'Cargo Check (Rust)', icon: 'settings_suggest', desc: 'Checagem de compilação do Rust', badge: 'RUST', priority: 'P1' },
      { id: 'test', name: 'Test Runner (Frontend)', icon: 'checklist', desc: 'Suíte de testes automatizados', priority: 'P0' },
      { id: 'cargo_test', name: 'Test Runner (Rust)', icon: 'task_alt', desc: 'cargo test do sidecar Tauri', priority: 'P0' },
      { id: 'lint', name: 'Lint & Format (ESLint / Rustfmt)', icon: 'cleaning_services', desc: 'Verificação de estilo de código', priority: 'P0' },
      { id: 'clippy', name: 'Cargo Clippy (Linter Rust)', icon: 'bug_report', desc: 'Análise estática avançada em Rust', priority: 'P1' },
      { id: 'build', name: 'Build Runner (Production Bundle)', icon: 'package_2', desc: 'Build completo de artefatos', priority: 'P0' },
    ],
  },
  {
    category: '4. Git Ops',
    icon: 'account_tree',
    description: 'Operações de controle de versão determinísticas',
    tools: [
      { id: 'git_status', name: 'Git Status & Staging', icon: 'rule', desc: 'Verificar arquivos modificados e staged', priority: 'P0' },
      { id: 'custom', cmd: 'git log --oneline -n 10', name: 'Git Log History', icon: 'history', desc: 'Histórico de commits recente', priority: 'P0' },
      { id: 'custom', cmd: 'git branch -a', name: 'Git Branch Manager', icon: 'alt_route', desc: 'Listagem e verificação de branches', priority: 'P0' },
    ],
  },
  {
    category: '5. Runtime & Diagnostics',
    icon: 'dns',
    description: 'Portas ocupadas, variáveis de ambiente e diagnósticos de saúde',
    tools: [
      { id: 'custom', cmd: 'netstat -ano | findstr 3000', name: 'Port Manager (Porta 3000)', icon: 'lan', desc: 'Descobrir e liberar portas em uso', priority: 'P1' },
      { id: 'custom', cmd: 'npm run env', name: 'Environment Viewer (Sanitized)', icon: 'key', desc: 'Visualizar env vars sem expor secrets', priority: 'P1' },
      { id: 'custom', cmd: 'npm audit', name: 'Project Diagnostics', icon: 'health_and_safety', desc: 'Auditoria de segurança e dependências', priority: 'P1' },
    ],
  },
  {
    category: '6. Tauri Engine',
    icon: 'desktop_windows',
    description: 'Runners e bundlers do runtime desktop Tauri',
    tools: [
      { id: 'tauri_dev', name: 'Tauri Dev Runner', icon: 'rocket_launch', desc: 'Inicia frontend + sidecar Rust no desktop', badge: 'TAURI', priority: 'P1' },
      { id: 'custom', cmd: 'npm run tauri -- info', name: 'Tauri Info & Environment', icon: 'info', desc: 'Diagnóstico da stack Tauri e Rust', priority: 'P1' },
    ],
  },
  {
    category: '7. Backend & Data',
    icon: 'database',
    description: 'Inspeção de banco de dados, migrations e testes de API',
    tools: [
      { id: 'custom', cmd: 'sqlite3 ~/.anamnesic/memory.db ".tables"', name: 'Database Console (SQLite)', icon: 'table_view', desc: 'Inspecionar tabelas da memória local', priority: 'P1' },
      { id: 'custom', cmd: 'curl -I http://localhost:3000', name: 'API & HTTP Inspector', icon: 'api', desc: 'Testar endpoints e checar respostas HTTP', priority: 'P1' },
    ],
  },
];

export const DevToolboxTab: React.FC<DevToolboxTabProps> = ({ workspace }) => {
  const { run, running: hookRunning, error: toolError } = useExecuteDevTool();
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<DevToolExecutionResult | null>(null);
  const [customCmd, setCustomCmd] = useState('');
  const [executionHistory, setExecutionHistory] = useState<DevToolExecutionResult[]>([]);

  const handleRunTool = async (toolId: string, cmd?: string) => {
    setRunningTool(toolId);
    try {
      const res = await run(toolId, { workspace, cmd: cmd || customCmd });
      if (res) {
        setLastResult(res);
        setExecutionHistory((prev) => [res, ...prev.slice(0, 19)]);
      }
    } catch (err) {
      setLastResult({
        tool_id: toolId,
        success: false,
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        exit_code: -1,
        duration_ms: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setRunningTool(null);
    }
  };

  return (
    <div className="space-y-6">
      {toolError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{toolError}</p>
        </div>
      )}
      {/* Category Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TOOL_CATEGORIES.map((cat) => (
          <div key={cat.category} className="bg-surface border border-outline-variant/50 rounded-xl p-4 flex flex-col shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-secondary text-[20px]">{cat.icon}</span>
              <h4 className="font-bold text-sm text-primary">{cat.category}</h4>
            </div>
            <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{cat.description}</p>
            <div className="mt-auto pt-2 border-t border-outline-variant/30 flex justify-between items-center text-[11px] text-on-surface-variant">
              <span>{cat.tools.length} ferramentas</span>
              <span className="font-semibold text-secondary">Determinístico</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Tool Launcher Grid */}
      <div className="space-y-6">
        {TOOL_CATEGORIES.map((cat) => (
          <div key={cat.category} className="bg-surface border border-outline-variant/50 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">{cat.icon}</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-primary">{cat.category}</h3>
              </div>
              <span className="text-xs text-on-surface-variant font-mono">{cat.tools.length} Ferramentas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {cat.tools.map((t) => {
                const isRunning = runningTool === t.id && (!t.cmd || customCmd === t.cmd);
                return (
                  <div
                    key={`${cat.category}-${t.name}`}
                    className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 hover:border-secondary/50 hover:bg-surface-container-low transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-secondary">{t.icon}</span>
                          <span className="font-bold text-xs text-on-surface">{t.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {t.badge && (
                            <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary text-[10px] font-bold">
                              {t.badge}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-surface border text-[10px] font-mono text-on-surface-variant">
                            {t.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mb-3">{t.desc}</p>
                    </div>

                    <button
                      onClick={() => handleRunTool(t.id, t.cmd)}
                      disabled={isRunning}
                      className="w-full h-8 bg-surface border border-outline-variant text-on-surface hover:border-secondary hover:text-secondary font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      {isRunning ? (
                        <>
                          <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                          Executando…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                          Executar {t.id}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Command Bar */}
      <div className="bg-surface border border-outline-variant/50 rounded-xl p-4 shadow-xs">
        <div className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
          Executar Comando Personalizado (PowerShell / Shell)
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCmd}
            onChange={(e) => setCustomCmd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunTool('custom', customCmd);
            }}
            placeholder="Ex: npm run typecheck && cargo check"
            className="flex-1 h-10 px-3 font-mono text-xs border border-outline-variant rounded-xl bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
          />
          <button
            onClick={() => handleRunTool('custom', customCmd)}
            disabled={!customCmd.trim() || runningTool === 'custom'}
            className="h-10 px-5 bg-secondary text-on-secondary font-semibold text-xs rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            Executar
          </button>
        </div>
      </div>

      {/* Execution Console / Output Viewer */}
      {lastResult && (
        <div className="bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-2xl p-4 font-mono text-xs shadow-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${lastResult.success ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span className="font-bold text-sm text-zinc-100">
                Resultado: {lastResult.tool_id || 'tool'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                lastResult.success ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {lastResult.success ? 'PASS (0)' : `FAIL (${lastResult.exit_code ?? 1})`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
              <span>Duração: {(((lastResult.duration_ms ?? 0)) / 1000).toFixed(2)}s</span>
              <span>{new Date(lastResult.timestamp || Date.now()).toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>

          {/* Console output */}
          <pre className="max-h-72 overflow-y-auto bg-zinc-900/60 p-3 rounded-xl text-zinc-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            {lastResult.stdout || lastResult.output || lastResult.stderr || lastResult.error || '(Nenhuma saída no stdout/stderr)'}
          </pre>
        </div>
      )}

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <div className="bg-surface border border-outline-variant/50 rounded-xl p-5 shadow-xs">
          <h4 className="font-bold text-sm text-primary mb-3">Histórico de Execuções Determinísticas</h4>
          <div className="space-y-2">
            {executionHistory.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-outline-variant/30 bg-surface-container-low/40 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${h.success ? 'bg-secondary' : 'bg-error'}`} />
                  <span className="font-bold text-on-surface">{h.tool_id || 'tool'}</span>
                </div>
                <div className="flex items-center gap-4 text-on-surface-variant text-[11px]">
                  <span>{(((h.duration_ms ?? 0)) / 1000).toFixed(2)}s</span>
                  <span>{new Date(h.timestamp || Date.now()).toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
