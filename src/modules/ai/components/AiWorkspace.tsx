"use client";

import React, { useState, useEffect } from 'react';
import { useHarnessOverview, useHarnessMemorySessions, useHarnessSkills } from '@/modules/dev/hooks/useHarness';

export const AiWorkspace: React.FC = () => {
  const { result: overview } = useHarnessOverview();
  const { result: sessionsResult } = useHarnessMemorySessions(undefined, 20);
  const { result: skillsResult } = useHarnessSkills();

  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'skills'>('overview');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
      <div className="p-4 border-b border-outline-variant/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">psychology</span>
          <h1 className="text-lg font-bold text-primary">Workspace IA</h1>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/40">
          {(['overview', 'sessions', 'skills'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              {tab === 'overview' ? 'Visão Geral' : tab === 'sessions' ? 'Sessões' : 'Skills'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface border border-outline-variant/60 rounded-xl p-4">
                <div className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Repositórios</div>
                <div className="text-2xl font-bold text-primary">{overview?.data?.repos?.length ?? 0}</div>
              </div>
              <div className="bg-surface border border-outline-variant/60 rounded-xl p-4">
                <div className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Sessões</div>
                <div className="text-2xl font-bold text-primary">{overview?.data?.memory_sessions ?? 0}</div>
              </div>
              <div className="bg-surface border border-outline-variant/60 rounded-xl p-4">
                <div className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Skills</div>
                <div className="text-2xl font-bold text-primary">{overview?.data?.skills_count ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface border border-outline-variant/60 rounded-xl p-4">
              <h3 className="font-bold text-sm text-primary mb-3">Sessões Recentes</h3>
              <div className="space-y-2">
                {(sessionsResult?.data ?? []).map((session) => (
                  <div key={session.id} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <div className="text-xs font-bold text-primary">{session.summary || `Sessão #${session.id}`}</div>
                    <div className="text-[10px] text-on-surface-variant mt-1">{session.model} • {session.message_count} msgs</div>
                  </div>
                ))}
                {(!sessionsResult?.data || sessionsResult.data.length === 0) && (
                  <div className="text-xs text-on-surface-variant">Nenhuma sessão encontrada.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface border border-outline-variant/60 rounded-xl p-4">
              <h3 className="font-bold text-sm text-primary mb-3">Skills Disponíveis</h3>
              <div className="space-y-2">
                {(skillsResult?.data ?? []).map((skill) => (
                  <div key={skill.name} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-primary">{skill.name}</div>
                      <div className="text-[10px] text-on-surface-variant">{skill.description}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-800">Ativa</span>
                  </div>
                ))}
                {(!skillsResult?.data || skillsResult.data.length === 0) && (
                  <div className="text-xs text-on-surface-variant">Nenhuma skill encontrada.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
