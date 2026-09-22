"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { SideNavBar } from '@/shared/components/dashboard/SideNavBar';
import { TopNavBar } from '@/shared/components/dashboard/TopNavBar';
import { BottomNavBar } from '@/shared/components/dashboard/BottomNavBar';
import { AiChatInterface } from './AiChatInterface';
import { AiAutomationAgentsPanel } from './AiAutomationAgentsPanel';
import { AiInsightsPanel } from './AiInsightsPanel';
import { DevSkillsTab } from '@/modules/ai/components/DevSkillsTab';

type AiTab = 'chat' | 'automacao' | 'analise' | 'alertas' | 'agentes' | 'skills';

export const AiLayout: React.FC = () => {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as AiTab) || 'chat';

  return (
    <div className="bg-background text-on-background font-body-md h-screen w-full flex overflow-hidden">
      {/* Primary SideNavBar (Left) */}
      <SideNavBar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        {/* Fixed TopNavBar */}
        <TopNavBar />

        {/* Dynamic IA Workspace Layout */}
        <main className="flex-1 flex overflow-hidden bg-background relative">
          {/* Default: Chat IA */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex w-full h-full overflow-hidden">
              <AiChatInterface />
            </div>
          )}

          {/* Automações & Agentes */}
          {(activeTab === 'automacao' || activeTab === 'agentes') && (
            <div className="flex-1 flex w-full h-full overflow-hidden">
              <AiAutomationAgentsPanel />
            </div>
          )}

          {/* Análise Preditiva */}
          {activeTab === 'analise' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="font-display-lg text-2xl font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">insights</span>
                    Análise Preditiva &amp; Diagnósticos
                  </h2>
                  <p className="text-on-surface-variant text-sm">
                    Inteligência financeira, comportamento de leads e projeção de receita.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-surface border border-outline-variant/60 rounded-xl p-5">
                    <span className="text-xs uppercase font-bold text-on-surface-variant">Previsão de Receita Q4</span>
                    <div className="text-2xl font-bold text-primary my-2">R$ 840.000,00</div>
                    <span className="text-secondary text-xs font-semibold">▲ +14.2% em relação a Q3</span>
                  </div>
                  <div className="bg-surface border border-outline-variant/60 rounded-xl p-5">
                    <span className="text-xs uppercase font-bold text-on-surface-variant">Score de Saúde Financeira</span>
                    <div className="text-2xl font-bold text-secondary my-2">92 / 100</div>
                    <span className="text-on-surface-variant text-xs">Baixo risco de inadimplência</span>
                  </div>
                  <div className="bg-surface border border-outline-variant/60 rounded-xl p-5">
                    <span className="text-xs uppercase font-bold text-on-surface-variant">Eficiência de Vendas</span>
                    <div className="text-2xl font-bold text-primary my-2">3.2x CAC / LTV</div>
                    <span className="text-secondary text-xs font-semibold">Ciclo médio de 18 dias</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alertas */}
          {activeTab === 'alertas' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="font-display-lg text-2xl font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-error">notifications_active</span>
                    Central de Alertas &amp; Anomalias
                  </h2>
                  <p className="text-on-surface-variant text-sm">
                    Alertas emitidos automaticamente pelas engines de fiscal, financeiro e contratos.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="bg-error-container/20 border border-error/30 rounded-xl p-4 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-error-container text-on-error-container shrink-0">
                      <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-on-surface">3 Contratos prestes a vencer em 15 dias</h4>
                        <span className="text-xs text-on-surface-variant">Hoje, 09:30</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">Os contratos da TechCorp e Global Logistics exigem aditivo de renovação.</p>
                    </div>
                  </div>

                  <div className="bg-surface border border-outline-variant/60 rounded-xl p-4 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-tertiary-container text-on-tertiary-container shrink-0">
                      <span className="material-symbols-outlined">trending_down</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-on-surface">Desvio no orçamento de Infraestrutura</h4>
                        <span className="text-xs text-on-surface-variant">Ontem, 14:15</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">Gastos com AWS excederam a meta mensal em 8.4%.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {activeTab === 'skills' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-display-lg text-2xl font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">extension</span>
                      Skills Globais do Sistema
                    </h2>
                    <p className="text-on-surface-variant text-sm">
                      Habilidades e capacidades compartilhadas entre todos os agentes e módulos do ERP.
                    </p>
                  </div>
                </div>
                <DevSkillsTab />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* BottomNavBar (Mobile) */}
      <BottomNavBar />
    </div>
  );
};
