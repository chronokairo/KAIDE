"use client";

import { usePromptTemplates, usePromptTemplate, useGoalBudgetPrompt } from '@/modules/dev/hooks/useHarness';
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function PromptTemplatesPanel() {
  const { result: templatesResult, loading, error, refresh } = usePromptTemplates();
  const templates = templatesResult?.data ?? null;
  const available = loading === false && !error;
  const { getPrompt, loading: loadingPrompt } = useGoalBudgetPrompt();
  
  const [budgetPrompt, setBudgetPrompt] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { result: templateResult, loading: templateLoading, error: templateError } = usePromptTemplate(selectedTemplate);
  const templateContent = templateResult?.data ?? null;

  if (!available) {
    return (
      <div className="bg-surface border border-outline-variant/60 rounded-2xl p-6 text-center shadow-2xs">
        <span className="material-symbols-outlined text-3xl opacity-30">desktop_windows</span>
        <p className="text-xs text-on-surface-variant mt-2 font-medium">Prompt Templates Indisponíveis</p>
        <p className="text-[11px] text-on-surface-variant/60">Disponível no runtime desktop Tauri.</p>
      </div>
    );
  }

  const handleTestBudget = async () => {
    const res = await getPrompt(5, 10);
    setBudgetPrompt(res);
  };

  return (
    <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs text-primary space-y-4">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
        <h3 className="font-bold text-sm text-primary tracking-tight">Prompt Templates</h3>
        <p className="text-xs text-on-surface-variant mt-0.5">Modelos de prompts disponíveis no codex-rs</p>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-outline-variant/40 rounded-xl p-4 bg-surface-container-lowest">
          <h4 className="font-bold text-xs text-primary mb-3">Lista de Templates</h4>
          {!templates ? (
            <div className="flex items-center justify-center p-8 text-on-surface-variant text-xs">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Carregando templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-xs text-on-surface-variant p-4 bg-surface-container-low rounded-xl text-center">
              Nenhum template encontrado.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto no-scrollbar pr-1">
              {templates?.map((tpl: any) => (
                <div 
                  key={tpl} 
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex justify-between items-center text-xs font-mono ${
                    selectedTemplate === tpl
                      ? 'bg-primary text-on-primary font-bold border-primary'
                      : 'bg-surface-container-low/50 hover:bg-surface-container text-primary border-outline-variant/40'
                  }`}
                >
                  {tpl}
                </div>
              ))}
            </div>
          )}
          
          {selectedTemplate && (
            <div className="mt-4 border-t border-outline-variant/30 pt-3">
              <div className="flex justify-between items-center mb-2">
                <h5 className="font-semibold text-xs text-primary truncate max-w-[200px]">Template: {selectedTemplate}</h5>
              </div>
              {templateLoading && (
                <div className="flex items-center justify-center p-4 text-on-surface-variant text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Carregando conteúdo...
                </div>
              )}
              {templateError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {templateError}
                </div>
              )}
              {!templateLoading && !templateError && templateContent && (
                <pre className="p-3 bg-surface-container-low text-primary rounded-xl text-[11px] whitespace-pre-wrap font-mono overflow-auto max-h-[220px]">
                  {typeof templateContent === 'string' ? templateContent : (templateContent as any)?.template || JSON.stringify(templateContent, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="border border-outline-variant/40 rounded-xl p-4 bg-surface-container-lowest">
          <h4 className="font-bold text-xs text-primary mb-2">Goal Budget Generator</h4>
          <p className="text-xs text-on-surface-variant mb-4">Gere e teste o prompt de orçamento de metas (Usados 5 de 10):</p>
          <button 
            onClick={handleTestBudget}
            disabled={loadingPrompt}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-xs font-semibold transition-all shadow-2xs"
          >
            {loadingPrompt && <Loader2 className="w-4 h-4 animate-spin" />}
            Gerar Prompt
          </button>
          {budgetPrompt && (
            <div className="mt-3 p-3 bg-surface-container-low rounded-xl text-[11px] whitespace-pre-wrap font-mono text-primary">
              {budgetPrompt}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
