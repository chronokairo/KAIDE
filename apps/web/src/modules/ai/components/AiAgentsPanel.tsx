"use client";

import React, { useState } from 'react';
import { useAcpProviders, useHarnessMemorySessions } from '@/modules/dev/hooks/useHarness';

const CTX_ICONS: Record<string, string> = {
  financeiro: 'payments',
  crm: 'group',
  projetos: 'task_alt',
  fiscal: 'receipt_long',
  contratos: 'history_edu',
  rh: 'badge',
  geral: 'smart_toy',
};

function detectCtx(summary: string): string {
  const lower = summary.toLowerCase();
  if (/financeiro|caixa|faturamento|conta|boleto|nf/.test(lower)) return 'financeiro';
  if (/crm|lead|cliente|funil|proposta/.test(lower)) return 'crm';
  if (/projeto|sprint|tarefa|kanban/.test(lower)) return 'projetos';
  if (/fiscal|sped|nfe|cfop|ncm/.test(lower)) return 'fiscal';
  if (/contrato|aditivo|cláusula/.test(lower)) return 'contratos';
  if (/rh|funcionário|folha/.test(lower)) return 'rh';
  return 'geral';
}

export const AiAgentsPanel: React.FC = () => {
  const { result: acpResult, loading: acpLoading } = useAcpProviders();
  const { result: sessionsResult, loading: sessLoading } = useHarnessMemorySessions(undefined, 8);
  const [search, setSearch] = useState('');

  const providers = acpResult?.data ?? [];
  const sessions = (sessionsResult?.data ?? []).filter(
    (s) => search === '' || (s.summary || s.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="hidden lg:flex flex-col w-[280px] bg-surface/50 border-r border-outline-variant overflow-y-auto shrink-0">
      {/* Active Agents */}
      <div className="p-4 border-b border-outline-variant/40">
        <div className="font-label-md text-label-md text-on-surface-variant mb-3 uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">smart_toy</span>
          Agentes ACP & Local
        </div>
        {acpLoading && (
          <div className="text-xs text-on-surface-variant animate-pulse px-1">Detectando...</div>
        )}
        <div className="flex flex-col gap-2">
          {/* Built-in ChronoKairo agent always shown */}
          <div className="bg-surface border border-secondary/30 p-3 rounded-lg flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sm">psychology</span>
            </div>
            <div className="min-w-0">
              <div className="font-body-md text-body-md font-semibold text-on-surface text-sm">ChronoKairo IA</div>
              <div className="text-on-surface-variant text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span>
                Ativo • NVIDIA NIM
              </div>
            </div>
          </div>
          {providers.map((p) => (
            <div key={p.id} className={`bg-surface border p-3 rounded-lg flex items-start gap-3 transition-all ${
              p.installed ? 'border-outline-variant hover:border-secondary cursor-pointer' : 'border-outline-variant/40 opacity-60'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                p.installed ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-sm">terminal</span>
              </div>
              <div className="min-w-0">
                <div className="font-body-md text-body-md font-semibold text-on-surface text-sm truncate">{p.display_name}</div>
                <div className="text-on-surface-variant text-xs flex items-center gap-1">
                  {p.installed ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span> Instalado</>
                  ) : (
                    <><span className="w-1.5 h-1.5 rounded-full bg-outline-variant inline-block"></span> Não instalado</>
                  )}
                  {p.default_model && <span className="truncate ml-1 font-mono">• {p.default_model.split('/').pop()}</span>}
                </div>
              </div>
            </div>
          ))}
          {!acpLoading && providers.length === 0 && (
            <div className="text-xs text-on-surface-variant px-1">Nenhum ACP externo detectado.</div>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="p-4 flex-1">
        <div className="font-label-md text-label-md text-on-surface-variant mb-3 uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">history</span>
          Sessões Recentes
        </div>
        <div className="relative mb-2">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-on-surface-variant pointer-events-none">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sessão…"
            className="w-full pl-7 pr-2 h-7 text-xs border border-outline-variant rounded bg-surface-container-low/50 focus:outline-none focus:border-secondary transition-colors"
          />
        </div>
        {sessLoading && (
          <div className="text-xs text-on-surface-variant animate-pulse">Carregando...</div>
        )}
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => {
            const ctx = detectCtx(s.summary || s.title || '');
            return (
              <li key={s.id} className="flex items-start gap-2 text-xs p-2 rounded hover:bg-surface-container-low/40 cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">{CTX_ICONS[ctx]}</span>
                <div className="min-w-0">
                  <span className="text-on-surface line-clamp-2 leading-snug">{s.summary || s.title || `Sessão #${s.id}`}</span>
                  <span className="text-on-surface-variant font-mono text-[10px] block mt-0.5">{ctx} · {s.message_count || s.messageCount || 0} msgs</span>
                </div>
              </li>
            );
          })}
          {!sessLoading && sessions.length === 0 && (
            <li className="text-xs text-on-surface-variant">Nenhuma sessão encontrada.</li>
          )}
        </ul>
      </div>
    </div>
  );
};
