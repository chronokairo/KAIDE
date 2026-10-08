'use client';

import React, { useState } from 'react';
import { ProvidersPanel } from './ProvidersPanel';
import { SecurityPanel } from './SecurityPanel';
import { ExecPolicyPanel } from './ExecPolicyPanel';

export type ConfigSubTab = 'providers' | 'security' | 'policy';

interface SubTabDef {
  id: ConfigSubTab;
  label: string;
  icon: string;
  description: string;
}

const CONFIG_TABS: SubTabDef[] = [
  { id: 'providers', label: 'Provedores de IA', icon: 'cloud', description: 'Chaves de API, base URLs e catálogo NVIDIA NIM / LLMs' },
  { id: 'security', label: 'Segurança & Sandbox', icon: 'shield', description: 'Hardening de processos, chaves de ambiente e segurança de shell' },
  { id: 'policy', label: 'Políticas de Execução', icon: 'policy', description: 'Permissões de filesystem, limites de tokens e auto-aprovações' },
];

export const DevConfiguracoesTab: React.FC<{ initialTab?: ConfigSubTab }> = ({ initialTab = 'providers' }) => {
  const [activeTab, setActiveTab] = useState<ConfigSubTab>(initialTab);

  return (
    <div className="flex flex-col h-full bg-surface select-none overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-outline-variant/50 bg-surface-container-lowest shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">settings_suggest</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary tracking-tight">
              Configurações do Dev Harness
            </h1>
            <p className="text-xs text-on-surface-variant">
              Gerenciamento de provedores de IA, segurança de execução e políticas do agente.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4">
          {CONFIG_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar max-w-5xl">
        {activeTab === 'providers' && <ProvidersPanel />}
        {activeTab === 'security' && <SecurityPanel />}
        {activeTab === 'policy' && <ExecPolicyPanel />}
      </div>
    </div>
  );
};
