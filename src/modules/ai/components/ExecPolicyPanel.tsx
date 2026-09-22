'use client';

import React, { useState } from 'react';
import { useExecPolicy, useIsTauri } from '@/modules/dev/hooks/useHarness';

interface ExecPolicyPanelProps {
  workspace?: string;
}

const COMMON_COMMANDS = [
  { cmd: 'cargo test', label: 'Cargo Test', icon: 'science' },
  { cmd: 'cargo build', label: 'Cargo Build', icon: 'build' },
  { cmd: 'cargo clippy', label: 'Cargo Clippy', icon: 'style' },
  { cmd: 'npm run build', label: 'NPM Build', icon: 'build' },
  { cmd: 'npm run test', label: 'NPM Test', icon: 'science' },
  { cmd: 'npm run lint', label: 'NPM Lint', icon: 'style' },
  { cmd: 'pnpm typecheck', label: 'TypeCheck', icon: 'check_circle' },
  { cmd: 'git status', label: 'Git Status', icon: 'info' },
];

const DEMO_RULES = [
  { command: 'npm run typecheck', decision: 'allow' as const, scope: 'workspace:erp' },
  { command: 'git status', decision: 'allow' as const, scope: 'global' },
  { command: 'cargo test', decision: 'allow' as const, scope: 'global' },
  { command: 'pnpm build', decision: 'prompt' as const, scope: 'workspace:erp' },
  { command: 'rm -rf *', decision: 'forbidden' as const, scope: 'global' },
];

export const ExecPolicyPanel: React.FC<ExecPolicyPanelProps> = ({ workspace }) => {
  const isTauri = useIsTauri();
  const { policy, loading, error, addRule, removeRule, allowAlways, refresh } = useExecPolicy();
  const [newCommand, setNewCommand] = useState('');
  const [newDecision, setNewDecision] = useState<'allow' | 'prompt' | 'forbidden'>('allow');
  const [localRules, setLocalRules] = useState(DEMO_RULES);

  const rawRules = policy?.rules ?? [];
  const rules = rawRules.length > 0 ? rawRules : (!isTauri ? localRules : []);

  const handleAddRule = async () => {
    if (!newCommand.trim()) return;
    if (!isTauri) {
      setLocalRules(prev => [...prev, { command: newCommand.trim(), decision: newDecision, scope: workspace ? `workspace:${workspace}` : 'workspace' }]);
      setNewCommand('');
      return;
    }
    await addRule(newCommand.trim(), newDecision, workspace ? `workspace:${workspace}` : undefined);
    setNewCommand('');
    refresh();
  };

  const handleQuickAllow = async (cmd: string) => {
    if (!isTauri) {
      setLocalRules(prev => prev.some(r => r.command === cmd) ? prev.map(r => r.command === cmd ? { ...r, decision: 'allow' } : r) : [...prev, { command: cmd, decision: 'allow', scope: 'workspace' }]);
      return;
    }
    await allowAlways(cmd, workspace ? `workspace:${workspace}` : undefined);
    refresh();
  };

  const handleRemove = async (cmd: string) => {
    if (!isTauri) {
      setLocalRules(prev => prev.filter(r => r.command !== cmd));
      return;
    }
    await removeRule(cmd);
    refresh();
  };

  return (
    <div className="space-y-3 text-primary">
      {/* Web Mode Banner */}
      {!isTauri && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
            <span className="truncate">
              <strong>Modo Web:</strong> Gerenciamento de políticas interativo. A aplicação no runtime exige o Tauri Desktop.
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-900 shrink-0">
            PREVIEW
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-primary tracking-tight">Políticas de Execução</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Defina quais comandos podem rodar automaticamente pelo agente.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[18px]">policy</span>
            </div>
          </div>
        </div>

        {/* Quick Allow */}
        <div className="p-3.5 border-b border-outline-variant/30 bg-surface/40">
          <label className="text-[10px] font-mono uppercase font-bold text-on-surface-variant block mb-2">
            Permissão Rápida
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COMMON_COMMANDS.map((item) => {
              const isAllowed = rules.some(
                (r) => r.command === item.cmd && r.decision === 'allow'
              );
              return (
                <button
                  key={item.cmd}
                  onClick={() => handleQuickAllow(item.cmd)}
                  disabled={isAllowed}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isAllowed
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800'
                      : 'border-outline-variant/40 bg-surface-container-lowest hover:border-outline-variant/80 hover:bg-surface-container-low/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] text-primary">{item.label}</div>
                      <div className="text-[9px] font-mono text-on-surface-variant truncate">
                        {item.cmd}
                      </div>
                    </div>
                  </div>
                  {isAllowed && (
                    <span className="text-[9px] text-emerald-700 font-bold mt-1 block">
                      ✓ Permitido
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Custom Rule */}
        <div className="p-3.5 border-b border-outline-variant/30">
          <label className="text-[10px] font-mono uppercase font-bold text-on-surface-variant block mb-2">
            Adicionar Regra
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              placeholder="Ex: my-script.sh"
              className="flex-1 h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
            />
            <select
              value={newDecision}
              onChange={(e) => setNewDecision(e.target.value as typeof newDecision)}
              className="h-9 px-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary"
            >
              <option value="allow">Permitir</option>
              <option value="prompt">Perguntar</option>
              <option value="forbidden">Bloquear</option>
            </select>
            <button
              onClick={handleAddRule}
              disabled={!newCommand.trim()}
              className="h-9 px-3.5 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        {/* Rules List */}
        <div className="max-h-64 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="p-6 text-center text-on-surface-variant text-xs">
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="mt-2">Carregando políticas...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="p-6 text-center text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-3xl opacity-30">policy</span>
              <p className="mt-2">Nenhuma regra definida</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {rules.map((rule, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between hover:bg-surface-container-low/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      rule.decision === 'allow' ? 'bg-emerald-500' :
                      rule.decision === 'forbidden' ? 'bg-red-500' :
                      'bg-amber-500'
                    }`} />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-primary font-mono truncate">{rule.command}</div>
                      {rule.scope && (
                        <div className="text-[9px] text-on-surface-variant font-mono">{rule.scope}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      rule.decision === 'allow' ? 'bg-emerald-100 text-emerald-800' :
                      rule.decision === 'forbidden' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {rule.decision === 'allow' ? 'Permitido' :
                       rule.decision === 'forbidden' ? 'Bloqueado' : 'Perguntar'}
                    </span>
                    <button
                      onClick={() => handleRemove(rule.command)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-red-100 hover:text-red-700 transition-colors"
                      title="Remover regra"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
