"use client";

import React from 'react';
import { useHarnessMemorySessions, useHarnessOverview } from '@/modules/dev/hooks/useHarness';

export const AiInsightsPanel: React.FC = () => {
  const { result: overview } = useHarnessOverview();
  const { result: sessions } = useHarnessMemorySessions(undefined, 100);

  const data = overview?.data;
  const syncStatus = data?.sync;
  const providers = data?.providers;
  const sessionList = sessions?.data ?? [];
  const totalMessages = sessionList.reduce((a, s) => a + (s.message_count || s.messageCount || 0), 0);

  const envKeys = [
    { name: 'NVIDIA NIM', has: !!providers?.has_nvidia_env },
    { name: 'Tavily', has: !!providers?.has_tavily_env },
    { name: 'SerpAPI', has: !!providers?.has_serp_env },
    { name: 'Perplexity', has: !!providers?.has_perplexity_env },
    { name: 'Exa', has: !!providers?.has_exa_env },
  ];
  const configuredKeys = envKeys.filter((k) => k.has).length;

  return (
    <div className="hidden xl:flex flex-col w-[320px] bg-surface/50 border-l border-outline-variant overflow-y-auto shrink-0 p-4 gap-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">insights</span>
        <div className="font-headline-sm text-headline-sm font-semibold text-on-surface">Status do Harness</div>
      </div>

      {/* Sessions metric */}
      <div className="bg-surface border border-outline-variant rounded-lg p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
        <div className="flex justify-between items-start mb-2">
          <div className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            Sessões de Agentes
          </div>
        </div>
        <div className="font-body-md text-body-md text-on-surface">
          <span className="font-bold text-2xl text-primary">{sessionList.length}</span> sessões ·{' '}
          <span className="font-bold text-primary">{totalMessages}</span> mensagens persistidas
        </div>
        <p className="text-xs text-on-surface-variant mt-1">~/.anamnesic/memory.db</p>
      </div>

      {/* Sync status */}
      <div className="bg-surface border border-outline-variant rounded-lg p-4 shadow-sm relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${
          (syncStatus?.peers_online ?? 0) > 0 ? 'bg-secondary' : 'bg-outline-variant'
        }`}></div>
        <div className="flex justify-between items-start mb-2">
          <div className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-secondary">sync</span>
            Sincronização P2P
          </div>
        </div>
        <div className="font-body-md text-body-md text-on-surface">
          <span className="font-bold text-lg text-primary">{syncStatus?.peers_online ?? 0}</span>
          <span className="text-on-surface-variant">/{syncStatus?.peers_total ?? 0} peers online</span>
        </div>
        {syncStatus?.last_sync && (
          <p className="text-xs text-on-surface-variant mt-1">
            Último sync: {new Date(syncStatus.last_sync).toLocaleTimeString('pt-BR')}
          </p>
        )}
      </div>

      {/* Provider keys */}
      <div className="bg-surface border border-outline-variant rounded-lg p-4 shadow-sm">
        <div className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1 mb-3">
          <span className="material-symbols-outlined text-[16px] text-secondary">key</span>
          Provedores Configurados
          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold ${
            configuredKeys > 0 ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-low text-on-surface-variant'
          }`}>
            {configuredKeys}/{envKeys.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {envKeys.map((k) => (
            <span key={k.name} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              k.has
                ? 'bg-secondary/10 text-secondary border-secondary/30'
                : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
            }`}>
              {k.has ? '✓' : '○'} {k.name}
            </span>
          ))}
        </div>
      </div>

      {/* Prompt suggestions */}
      <div className="bg-surface border border-outline-variant/60 rounded-lg p-4 shadow-sm">
        <div className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 mb-2">
          <span className="material-symbols-outlined text-[16px]">lightbulb</span>
          Sugestão
        </div>
        <p className="text-xs text-on-surface-variant mb-3">Experimente perguntar ao Chronokairo:</p>
        {[
          'Analise o fluxo de caixa do mês atual',
          'Quais contratos vencem nos próximos 30 dias?',
          'Resuma o pipeline de vendas do CRM',
        ].map((s) => (
          <div key={s} className="text-xs text-on-surface px-2 py-1 rounded bg-surface-container-low border border-outline-variant/20 mb-1.5 cursor-pointer hover:border-secondary/40 transition-colors font-mono">
            "{s}"
          </div>
        ))}
      </div>

      {/* Context scope */}
      <div className="mt-auto">
        <div className="font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider">Escopo Ativo</div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-surface-container border border-outline-variant px-2 py-1 rounded text-xs font-data-tabular text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">folder</span>
            Chronokairo ERP
          </span>
          <span className="bg-surface-container border border-outline-variant px-2 py-1 rounded text-xs font-data-tabular text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
};
