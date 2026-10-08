'use client';

import React from 'react';

export interface AiInsight {
  id: string;
  type: 'growth' | 'warning';
  title: string;
  description: string;
  actionLabel: string;
  module: string;
}

interface AIInsightsWidgetProps {
  insights: AiInsight[];
  loading?: boolean;
}

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ insights, loading }) => (
  <div className="bg-surface rounded-2xl flex flex-col border border-outline-variant/60 relative overflow-hidden shadow-2xs">
    <div className="p-5 border-b border-outline-variant/60 flex justify-between items-center bg-surface">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
        <h3 className="font-bold text-base text-primary">Insights da IA</h3>
      </div>
      {!loading && (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block" />
          Dados Reais
        </span>
      )}
    </div>

    <div className="p-5 flex flex-col gap-4">
      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-container-low/60 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && insights.length === 0 && (
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-on-surface-variant text-[32px]">lightbulb</span>
          <p className="text-xs text-on-surface-variant mt-2">
            Nenhum insight gerado. Dados insuficientes no Supabase.
          </p>
        </div>
      )}

      {!loading &&
        insights.map((insight, index) => (
          <React.Fragment key={insight.id}>
            <div className="flex gap-3 items-start">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  insight.type === 'growth'
                    ? 'bg-emerald-500/10 text-emerald-800'
                    : 'bg-amber-500/10 text-amber-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {insight.type === 'growth' ? 'trending_up' : 'warning'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-primary mb-1">{insight.title}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                  {insight.description}
                </p>
              </div>
            </div>
            {index < insights.length - 1 && <div className="h-px w-full bg-outline-variant/30" />}
          </React.Fragment>
        ))}
    </div>
  </div>
);