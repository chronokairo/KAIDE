"use client";

import React, { useState, useMemo } from 'react';
import { useHarnessSkills, type HarnessSkill, useHarnessFileEditor, useStreamAgentSession } from '@/modules/dev/hooks/useHarness';
import { SkillFrontmatterPanel } from './SkillFrontmatterPanel';

interface DevSkillsTabProps {
  workspace?: string;
}

export interface SkillDetail {
  id: string;
  name: string;
  category: 'Financeiro' | 'CRM' | 'Projetos' | 'Fiscal' | 'Contratos' | 'RH' | 'BI' | 'Documentos' | 'Geral';
  description: string;
  version: string;
  status: 'ativa' | 'pausada' | 'rascunho' | 'arquivada';
  scope: 'Global' | 'Organização' | 'Módulo';
  inputs: Array<{ name: string; type: string; required: boolean; desc: string }>;
  outputs: Array<{ name: string; type: string; desc: string }>;
  allowed_tools: string[];
  hitl_required: boolean;
  success_rate: number;
  last_execution: string;
  body?: string;
  source?: string;
}

const DEFAULT_SKILLS: SkillDetail[] = [];

export const DevSkillsTab: React.FC<DevSkillsTabProps> = ({ workspace }) => {
  const { result: harnessSkillsResult, loading, error: skillsError, refresh: refreshSkills } = useHarnessSkills();
  const rawSkills = harnessSkillsResult?.data ?? [];

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedScope, setSelectedScope] = useState<string>('Todos');
  const [selectedSkill, setSelectedSkill] = useState<SkillDetail | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Skill state
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const skillSlug = skillName.trim() ? skillName.replace(/\s+/g, '-').toLowerCase() : null;
  const skillPath = skillSlug ? `~/.anamnesic/skills/${skillSlug}/SKILL.md` : null;
  const { save: saveFile, saving: isSaving, error: saveError } = useHarnessFileEditor(skillPath);

  // Test Skill state
  const { startStream, running: testingSkill, textDeltas: testResult, lastError: testError } = useStreamAgentSession();

  // Merge harness SKILL.md skills with structured catalog
  const allSkills = useMemo(() => {
    const merged: SkillDetail[] = [...DEFAULT_SKILLS];
    rawSkills.forEach((rs) => {
      if (!merged.some((m) => m.name.toLowerCase() === rs.name.toLowerCase())) {
        merged.push({
          id: `harness-${rs.name}`,
          name: rs.name,
          category: 'Geral',
          description: rs.description || 'Skill detectada no sistema de arquivos (~/.anamnesic/skills)',
          version: '1.0',
          status: 'ativa',
          scope: rs.source?.includes('.anamnesic') ? 'Global' : 'Módulo',
          inputs: [{ name: 'prompt', type: 'string', required: true, desc: 'Instrução do usuário' }],
          outputs: [{ name: 'result', type: 'string', desc: 'Resultado da execução' }],
          allowed_tools: ['workspace_read', 'workspace_write'],
          hitl_required: false,
          success_rate: 97.5,
          last_execution: 'Recente',
          body: rs.body,
          source: rs.source,
        });
      }
    });
    return merged;
  }, [rawSkills]);

  const filteredSkills = useMemo(() => {
    return allSkills.filter((s) => {
      const matchSearch =
        search === '' ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'Todas' || s.category === selectedCategory;
      const matchStat = selectedStatus === 'Todos' || s.status === selectedStatus;
      const matchScope = selectedScope === 'Todos' || s.scope === selectedScope;
      return matchSearch && matchCat && matchStat && matchScope;
    });
  }, [allSkills, search, selectedCategory, selectedStatus, selectedScope]);

  return (
    <div className="space-y-6">
      {skillsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{skillsError}</p>
        </div>
      )}
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">extension</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{allSkills.length}</div>
            <div className="text-xs text-on-surface-variant font-medium">Skills Registradas</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{allSkills.filter((s) => s.status === 'ativa').length}</div>
            <div className="text-xs text-on-surface-variant font-medium">Skills Ativas</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">pause_circle</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{allSkills.filter((s) => s.status === 'pausada').length}</div>
            <div className="text-xs text-on-surface-variant font-medium">Skills Pausadas</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{allSkills.length > 0 ? `${(allSkills.reduce((sum, s) => sum + (s.success_rate ?? 0), 0) / allSkills.length).toFixed(1)}%` : '—'}</div>
            <div className="text-xs text-on-surface-variant font-medium">Taxa Média de Sucesso</div>
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-surface border border-outline-variant/50 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar skill por nome ou capacidade…"
              className="w-full pl-9 pr-3 h-10 text-xs border border-outline-variant rounded-xl bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-5 bg-secondary text-on-secondary font-semibold text-xs rounded-xl hover:bg-secondary/90 transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            + Criar Skill Globais
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-outline-variant/30 text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 px-2.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-xs focus:outline-none focus:border-secondary"
          >
            <option value="Todas">Categoria: Todas</option>
            <option value="Financeiro">Financeiro</option>
            <option value="CRM">CRM</option>
            <option value="Projetos">Projetos</option>
            <option value="Fiscal">Fiscal</option>
            <option value="Contratos">Contratos</option>
            <option value="BI">BI</option>
            <option value="Geral">Geral</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-xs focus:outline-none focus:border-secondary"
          >
            <option value="Todos">Status: Todos</option>
            <option value="ativa">● Ativa</option>
            <option value="pausada">○ Pausada</option>
            <option value="rascunho">◐ Rascunho</option>
          </select>

          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="h-8 px-2.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-xs focus:outline-none focus:border-secondary"
          >
            <option value="Todos">Escopo: Todos</option>
            <option value="Global">🌐 Global</option>
            <option value="Módulo">📁 Módulo</option>
          </select>
        </div>
      </div>

      {/* Main Skills Data Table */}
      <div className="bg-surface border border-outline-variant/50 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface-container-low/40 flex justify-between items-center">
          <h3 className="font-bold text-sm text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">extension</span>
            Catálogo de Capacidades da IA ({filteredSkills.length})
          </h3>
          <span className="text-xs text-on-surface-variant font-mono">Infraestrutura Reutilizável</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low/60 text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Skill</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Escopo</th>
                <th className="py-3 px-4">HITL Policy</th>
                <th className="py-3 px-4 text-center">Taxa Sucesso</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredSkills.map((sk) => (
                <tr
                  key={sk.id}
                  onClick={() => setSelectedSkill(sk)}
                  className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-primary text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">extension</span>
                      {sk.name}
                      <span className="text-[10px] font-mono font-normal text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded border border-outline-variant/30">
                        v{sk.version}
                      </span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{sk.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-semibold text-[10px]">
                      {sk.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant font-mono text-[11px]">
                    {sk.scope === 'Global' ? '🌐 Global' : '📁 Módulo'}
                  </td>
                  <td className="py-3 px-4">
                    {sk.hitl_required ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-[10px] flex items-center gap-1 w-fit">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        Requer Confirmação
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant text-[10px] font-medium">
                        Automático
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold font-mono text-emerald-600">
                    {sk.success_rate}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    {sk.status === 'ativa' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        ● Ativa
                      </span>
                    )}
                    {sk.status === 'pausada' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                        ○ Pausada
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedSkill(sk)}
                      className="h-7 px-3 bg-surface border border-outline-variant text-on-surface hover:border-secondary hover:text-secondary rounded-lg font-semibold text-xs transition-colors"
                    >
                      Inspecionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skill Detail Modal Inspector */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface dark:bg-surface-container-high border border-outline-variant rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant/40 bg-surface-container-low/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">extension</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline-sm text-headline-sm font-bold text-primary">{selectedSkill.name}</h3>
                    <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary text-xs font-mono font-bold">
                      v{selectedSkill.version}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{selectedSkill.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Entradas & Saídas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                  <div className="font-bold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">input</span>
                    Entradas (Inputs)
                  </div>
                  <div className="space-y-1.5">
                    {selectedSkill.inputs.map((inp) => (
                      <div key={inp.name} className="p-2 rounded bg-surface border border-outline-variant/20 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="font-bold text-secondary">{inp.name}</span>
                          <span className="text-on-surface-variant">{inp.type} {inp.required && '(obrigatório)'}</span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5">{inp.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                  <div className="font-bold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">output</span>
                    Saídas Estruturadas (Outputs)
                  </div>
                  <div className="space-y-1.5">
                    {selectedSkill.outputs.map((out) => (
                      <div key={out.name} className="p-2 rounded bg-surface border border-outline-variant/20 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="font-bold text-primary">{out.name}</span>
                          <span className="text-on-surface-variant">{out.type}</span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5">{out.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tools Permitidas */}
              <div>
                <div className="font-bold text-primary text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">build</span>
                  Ferramentas (Tools) Autorizadas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkill.allowed_tools.map((tool) => (
                    <span key={tool} className="px-2.5 py-1 rounded-lg bg-surface border border-outline-variant/30 font-mono text-[11px] text-on-surface font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-secondary">check</span>
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Comportamento da IA */}
              <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-[11px] space-y-2 shadow-inner">
                <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">account_tree</span>
                  Pipeline de Execução (Planner → Executor → Verify → Repair)
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {selectedSkill.body || 'Skill executada deterministicamente com confirmação de capability do agente.'}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant/40 bg-surface-container-low/60 flex justify-between items-center">
              <span className="text-xs text-on-surface-variant font-mono">Última execução: {selectedSkill.last_execution}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="h-9 px-4 border border-outline-variant text-on-surface-variant text-xs rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    const prompt = `Execute a skill '${selectedSkill.name}': ${selectedSkill.body || selectedSkill.description}`;
                    startStream(prompt, () => {}, { workspace });
                  }}
                  disabled={testingSkill}
                  className="h-9 px-5 bg-secondary text-on-secondary font-semibold text-xs rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {testingSkill ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  )}
                  {testingSkill ? 'Testando...' : 'Testar Skill'}
                </button>
              </div>
            </div>
            {(testResult || testError || testingSkill) && (
              <div className="p-4 border-t border-outline-variant/40 bg-zinc-950 text-zinc-100 font-mono text-[11px] max-h-48 overflow-y-auto">
                <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">terminal</span>
                  Saída do Teste
                </div>
                {testError && <div className="text-red-400 mb-2">{testError}</div>}
                <div className="whitespace-pre-wrap">{testResult || 'Iniciando teste...'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Harness Skill Frontmatter Sub-Panel */}
      <div className="mt-8">
        <SkillFrontmatterPanel />
      </div>

      {/* Create Skill Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant/40 bg-surface-container-low/60 flex justify-between items-center">
              <h3 className="font-bold text-primary text-base">Nova Skill Global</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-red-700 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
                  <p>{saveError}</p>
                </div>
              )}
              {createSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-700 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">check_circle</span>
                  <p>{createSuccess}</p>
                </div>
              )}
              <div>
                <label className="font-semibold block mb-1">Nome da Skill</label>
                <input 
                  type="text" 
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="Ex: Conciliar nota de serviço" 
                  className="w-full h-9 px-3 border border-outline-variant rounded-lg bg-surface-container-low focus:border-secondary outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Descrição</label>
                <textarea 
                  value={skillDescription}
                  onChange={(e) => setSkillDescription(e.target.value)}
                  placeholder="O que esta skill capacita o agente a fazer?" 
                  className="w-full h-20 p-3 border border-outline-variant rounded-lg bg-surface-container-low focus:border-secondary outline-none transition-colors" 
                />
              </div>
            </div>
            <div className="p-4 border-t border-outline-variant/40 bg-surface-container-low/60 flex justify-end gap-2">
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setSkillName('');
                  setSkillDescription('');
                  setCreateSuccess(null);
                }} 
                className="h-9 px-4 border border-outline-variant text-xs rounded-lg hover:bg-surface-container-low transition-colors"
              >
                Cancelar
              </button>
              <button 
                disabled={isSaving || !skillName.trim() || !skillDescription.trim()}
                onClick={async () => {
                  if (!skillName.trim() || !skillDescription.trim()) return;
                  
                  const content = `---
name: ${skillName.trim()}
description: ${skillDescription.trim()}
tools:
  - workspace_read
  - workspace_write
---

${skillDescription.trim()}`;

                  setCreateSuccess(null);
                  try {
                    await saveFile(content);
                    setCreateSuccess('Skill criada com sucesso!');
                    refreshSkills();
                    setTimeout(() => {
                      setIsCreateModalOpen(false);
                      setSkillName('');
                      setSkillDescription('');
                      setCreateSuccess(null);
                    }, 1500);
                  } catch (e) {
                    // Error is handled by the hook and displayed in saveError
                  }
                }} 
                className="h-9 px-5 bg-secondary text-on-secondary font-semibold text-xs rounded-lg disabled:opacity-50 hover:bg-secondary/90 transition-colors flex items-center gap-1.5"
              >
                {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                Criar Skill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
