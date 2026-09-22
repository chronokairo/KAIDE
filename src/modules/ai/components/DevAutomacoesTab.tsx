"use client";

import React, { useState, useMemo } from 'react';
import { useHarnessAutomations, useHarnessFileEditor } from '@/modules/dev/hooks/useHarness';

interface DevAutomacoesTabProps {
  workspace?: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  skill: string;
  action: string;
  status: 'ativa' | 'pausada' | 'com_erro';
  executions_count: number;
  last_run: string;
  owner: string;
}

const DEFAULT_WORKFLOWS: AutomationWorkflow[] = [];

export const DevAutomacoesTab: React.FC<DevAutomacoesTabProps> = ({ workspace }) => {
  const { result: harnessAutomationsResult, error: automationsError, refresh } = useHarnessAutomations(workspace);
  const githubWorkflows = harnessAutomationsResult?.data ?? [];

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedTab, setSelectedTab] = useState<'workflows' | 'execucoes'>('workflows');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  const [viewingWorkflow, setViewingWorkflow] = useState<{name: string, path: string} | null>(null);
  const { content: workflowContent, loading: workflowLoading, error: workflowError } = useHarnessFileEditor(viewingWorkflow?.path ?? null);

  const [builderTrigger, setBuilderTrigger] = useState('workflow_dispatch');
  const [builderCondition, setBuilderCondition] = useState('true');
  const [builderSkill, setBuilderSkill] = useState('Analisar dados');
  const [builderAction, setBuilderAction] = useState('Notificar sucesso');
  const [builderName, setBuilderName] = useState('nova-automacao');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { save: saveWorkflow, saving: isSavingWorkflow } = useHarnessFileEditor(`.github/workflows/${builderName}.yml`);

  const workflows = useMemo(() => {
    return DEFAULT_WORKFLOWS.filter((w) => {
      const matchSearch = search === '' || w.name.toLowerCase().includes(search.toLowerCase()) || w.trigger.toLowerCase().includes(search.toLowerCase());
      const matchStatus = selectedStatus === 'Todos' || w.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [search, selectedStatus]);

  return (
    <div className="space-y-6">
      {automationsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{automationsError}</p>
        </div>
      )}
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">bolt</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{DEFAULT_WORKFLOWS.length}</div>
            <div className="text-xs text-on-surface-variant font-medium">Automações Ativas</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">play_circle</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{(githubWorkflows as any[]).reduce((sum, w) => sum + ((w as any).executions_count ?? 0), 0).toLocaleString()}</div>
            <div className="text-xs text-on-surface-variant font-medium">Execuções no Mês</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{githubWorkflows.length > 0 ? '—' : '—'}</div>
            <div className="text-xs text-on-surface-variant font-medium">Taxa de Sucesso</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">hub</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{githubWorkflows.length}</div>
            <div className="text-xs text-on-surface-variant font-medium">Workflows GitHub</div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-outline-variant/30 bg-surface rounded-xl p-1 gap-1">
        <button
          onClick={() => setSelectedTab('workflows')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            selectedTab === 'workflows'
              ? 'bg-secondary text-on-secondary shadow-2xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">account_tree</span>
          Automações & Workflows
        </button>
        <button
          onClick={() => setSelectedTab('execucoes')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            selectedTab === 'execucoes'
              ? 'bg-secondary text-on-secondary shadow-2xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          Monitor de Execuções (Audit Trail)
        </button>
      </div>

      {selectedTab === 'workflows' ? (
        <>
          {/* Action & Filter Bar */}
          <div className="bg-surface border border-outline-variant/50 rounded-xl p-4 shadow-xs flex flex-col md:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar automação por gatilho ou nome…"
                className="w-full pl-9 pr-3 h-10 text-xs border border-outline-variant rounded-xl bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 px-3 border border-outline-variant rounded-xl bg-surface text-on-surface text-xs focus:outline-none focus:border-secondary"
              >
                <option value="Todos">Status: Todos</option>
                <option value="ativa">● Ativa</option>
                <option value="pausada">○ Pausada</option>
              </select>
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="h-10 px-5 bg-secondary text-on-secondary font-semibold text-xs rounded-xl hover:bg-secondary/90 transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                + Nova Automação
              </button>
            </div>
          </div>

          {/* Main Workflows Table */}
          <div className="bg-surface border border-outline-variant/50 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-outline-variant/40 bg-surface-container-low/40 flex justify-between items-center">
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">bolt</span>
                Motor de Eventos e Automação Operacional ({workflows.length})
              </h3>
              <span className="text-xs text-on-surface-variant font-mono">Execução Determinística + IA</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low/60 text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Automação</th>
                    <th className="py-3 px-4">Gatilho (Trigger)</th>
                    <th className="py-3 px-4">Skill Integrada</th>
                    <th className="py-3 px-4">Ação Resultante</th>
                    <th className="py-3 px-4 text-center">Execuções</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {workflows.map((w) => (
                    <tr key={w.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-primary text-sm flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-secondary">bolt</span>
                          {w.name}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">Dono: {w.owner} · {w.last_run}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-secondary font-semibold">
                        {w.trigger}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20 font-semibold text-[10px]">
                          {w.skill}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant text-[11px]">
                        {w.action}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-primary">
                        {w.executions_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {w.status === 'ativa' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            ● Ativa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                            ○ Pausada
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingWorkflow({ name: w.name, path: (w as any).path || `.github/workflows/${w.name}.yml` })}
                          className="h-7 px-3 bg-surface border border-outline-variant text-on-surface hover:border-secondary hover:text-secondary rounded-lg font-semibold text-xs transition-colors"
                        >
                          Ver YAML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Monitor de Execuções */
        <div className="bg-surface border border-outline-variant/50 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
            <div>
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">history</span>
                Trilha de Auditoria e Logs de Execução
              </h3>
              <p className="text-xs text-on-surface-variant">Inspeção detalhada de cada etapa (Planner → Executor → Verify → Repair)</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400">Execução #AUT-82931 (Cobrança de fatura vencida)</span>
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 font-bold text-[10px]">
                  FALHOU (4.8s)
                </span>
              </div>
              <div className="text-[11px] space-y-1 text-zinc-300">
                <div>✓ Trigger: Invoice.overdue</div>
                <div>✓ Condição: amount &gt; 1000</div>
                <div>✓ Skill: Analisar cobrança</div>
                <div>✗ Tool: create_charge — <span className="text-rose-400 font-bold">PermissionDenied</span></div>
                <div className="text-amber-400 font-bold">⚠ Requer intervenção humana ou aprovação de governança</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">Execução #AUT-82930 (Conciliação bancária)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-[10px]">
                  SUCESSO (1.2s)
                </span>
              </div>
              <div className="text-[11px] space-y-1 text-zinc-300">
                <div>✓ Trigger: Schedule 02:00</div>
                <div>✓ Skill: Conciliar pagamentos</div>
                <div>✓ Tool: match_payment (14 lançamentos conciliados)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Builder Visual Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant/40 bg-surface-container-low/60 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[22px]">account_tree</span>
                </div>
                <div>
                  <h3 className="font-bold text-primary text-base">Novo Workflow de Automação Visual</h3>
                  <p className="text-xs text-on-surface-variant">Conectores determinísticos, regras de negócio e skills de IA</p>
                </div>
              </div>
              <button onClick={() => setIsBuilderOpen(false)} className="text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Visual Flow Builder Nodes */}
              <div className="md:col-span-2 space-y-4 border-r border-outline-variant/30 pr-6">
                <div className="font-bold text-primary text-xs uppercase tracking-wider mb-2">Fluxo de Execução</div>

                {/* Node 1: Trigger */}
                <div className="p-3.5 rounded-xl border border-secondary/50 bg-secondary/10 flex items-center gap-3 shadow-2xs">
                  <span className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-bold shrink-0">1</span>
                  <div className="flex-1">
                    <div className="font-bold text-secondary text-xs">Gatilho (Trigger)</div>
                    <input 
                      value={builderTrigger} 
                      onChange={e => setBuilderTrigger(e.target.value)} 
                      className="w-full font-mono text-[11px] text-on-surface bg-transparent border-b border-secondary/30 focus:outline-none focus:border-secondary" 
                      placeholder="Ex: workflow_dispatch" 
                    />
                  </div>
                </div>

                <div className="flex justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                </div>

                {/* Node 2: Condition */}
                <div className="p-3.5 rounded-xl border border-outline-variant bg-surface-container-low flex items-center gap-3 shadow-2xs">
                  <span className="w-8 h-8 rounded-lg bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold shrink-0">2</span>
                  <div className="flex-1">
                    <div className="font-bold text-on-surface text-xs">Condição Determinística</div>
                    <input 
                      value={builderCondition} 
                      onChange={e => setBuilderCondition(e.target.value)} 
                      className="w-full font-mono text-[11px] text-on-surface bg-transparent border-b border-outline-variant focus:outline-none focus:border-secondary" 
                      placeholder="Ex: true" 
                    />
                  </div>
                </div>

                <div className="flex justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                </div>

                {/* Node 3: AI Skill */}
                <div className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-500/10 flex items-center gap-3 shadow-2xs">
                  <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">3</span>
                  <div className="flex-1">
                    <div className="font-bold text-purple-700 dark:text-purple-300 text-xs">Skill de IA</div>
                    <input 
                      value={builderSkill} 
                      onChange={e => setBuilderSkill(e.target.value)} 
                      className="w-full font-mono text-[11px] text-on-surface bg-transparent border-b border-purple-500/30 focus:outline-none focus:border-purple-500" 
                      placeholder="Ex: Analisar dados" 
                    />
                  </div>
                </div>

                <div className="flex justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                </div>

                {/* Node 4: Action */}
                <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center gap-3 shadow-2xs">
                  <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">4</span>
                  <div className="flex-1">
                    <div className="font-bold text-emerald-700 dark:text-emerald-300 text-xs">Ação Resultante</div>
                    <input 
                      value={builderAction} 
                      onChange={e => setBuilderAction(e.target.value)} 
                      className="w-full font-mono text-[11px] text-on-surface bg-transparent border-b border-emerald-500/30 focus:outline-none focus:border-emerald-500" 
                      placeholder="Ex: Notificar" 
                    />
                  </div>
                </div>
              </div>

              {/* Step Palette Sidebar */}
              <div className="space-y-4">
                <div className="font-bold text-primary text-xs uppercase tracking-wider">Paleta de Etapas</div>

                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Gatilhos (Triggers)</div>
                    <div className="space-y-1">
                      <button className="w-full text-left p-2 rounded bg-surface border border-outline-variant/30 hover:border-secondary font-mono text-[11px]">⚡ Evento do ERP</button>
                      <button className="w-full text-left p-2 rounded bg-surface border border-outline-variant/30 hover:border-secondary font-mono text-[11px]">⏰ Agendamento (Cron)</button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Lógica & IA</div>
                    <div className="space-y-1">
                      <button className="w-full text-left p-2 rounded bg-surface border border-outline-variant/30 hover:border-secondary font-mono text-[11px]">🔀 Condição If / Else</button>
                      <button className="w-full text-left p-2 rounded bg-surface border border-outline-variant/30 hover:border-secondary font-mono text-[11px]">🧠 Executar Skill de IA</button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Governança</div>
                    <div className="space-y-1">
                      <button className="w-full text-left p-2 rounded bg-surface border border-outline-variant/30 hover:border-secondary font-mono text-[11px]">🛡️ Solicitar Aprovação</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant/40 bg-surface-container-low/60 flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium">Nome do Arquivo:</span>
                <input 
                  value={builderName} 
                  onChange={e => setBuilderName(e.target.value)} 
                  className="px-3 py-1.5 text-xs bg-surface border border-outline-variant rounded" 
                />
                <span className="text-xs text-on-surface-variant font-mono">.yml</span>
              </div>
              <div className="flex gap-2 items-center">
                {saveSuccess && <span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span> Salvo!</span>}
                <button onClick={() => setIsBuilderOpen(false)} className="h-9 px-4 border border-outline-variant text-xs rounded-xl">Cancelar</button>
                <button 
                  onClick={async () => {
                    const yaml = `name: ${builderName}\non:\n  ${builderTrigger}:\njobs:\n  run-skill:\n    runs-on: ubuntu-latest\n    if: ${builderCondition}\n    steps:\n      - name: Run Skill\n        run: echo "Skill: ${builderSkill} | Action: ${builderAction}"\n`;
                    await saveWorkflow(yaml);
                    setSaveSuccess(true);
                    refresh();
                    setTimeout(() => {
                      setSaveSuccess(false);
                      setIsBuilderOpen(false);
                    }, 2000);
                  }}
                  disabled={isSavingWorkflow}
                  className="h-9 px-5 bg-secondary text-on-secondary font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {isSavingWorkflow && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
                  Salvar Automação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-outline-variant/40 bg-surface-container-low/60 flex justify-between items-center">
              <h3 className="font-bold text-primary text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
                Workflow: {viewingWorkflow.name}
              </h3>
              <button onClick={() => setViewingWorkflow(null)} className="text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-surface">
              {workflowLoading && (
                <div className="flex items-center justify-center p-8 text-secondary">
                  <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
                </div>
              )}
              {workflowError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
                  <p className="text-xs text-red-700">{workflowError}</p>
                </div>
              )}
              {!workflowLoading && !workflowError && workflowContent && (
                <pre className="text-[11px] font-mono p-4 bg-surface-container-low border border-outline-variant/40 rounded-xl whitespace-pre-wrap text-on-surface">
                  {workflowContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
