'use client';

import React, { useState, useCallback } from 'react';
import { useContextFragments, useAssembledContext, useIsTauri } from '@/modules/dev/hooks/useHarness';
import type { ContextFragment } from '@/modules/dev/harness-client';

const categoryIcons: Record<string, string> = {
  Instructions: 'policy',
  Config: 'settings',
  Documentation: 'description',
  Metadata: 'info',
};

const categoryColors: Record<string, string> = {
  Instructions: 'bg-blue-100 text-blue-800',
  Config: 'bg-purple-100 text-purple-800',
  Documentation: 'bg-emerald-100 text-emerald-800',
  Metadata: 'bg-slate-100 text-slate-800',
};

const DEMO_FRAGMENTS: ContextFragment[] = [
  {
    name: 'AGENTS.md',
    path: 'AGENTS.md',
    lines: 152,
    truncated: false,
    category: 'Instructions',
    content: `# AGENTS.md — ChronoKairo ERP\n\nDiretrizes de arquitetura, design patterns oficiais e regras de conformidade estrita fail-closed.`,
  },
  {
    name: 'package.json',
    path: 'package.json',
    lines: 78,
    truncated: false,
    category: 'Config',
    content: `{\n  "name": "chronokairo-erp",\n  "version": "1.0.0",\n  "private": true,\n  "dependencies": {\n    "next": "^16.3.0",\n    "react": "^19.2.8",\n    "typescript": "^7.0.2"\n  }\n}`,
  },
  {
    name: 'ADR-0030.md',
    path: 'docs/adr/0030-ui-domain-integration.md',
    lines: 94,
    truncated: false,
    category: 'Documentation',
    content: `# ADR-0030: Integração Vertical da UI com os Domínios e Gates de Qualidade Executáveis\n\nFluxo canônico: UI -> Hook -> Repositório -> PostgreSQL/RLS.`,
  },
  {
    name: '.env.example',
    path: '.env.example',
    lines: 24,
    truncated: false,
    category: 'Metadata',
    content: `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=ey...`,
  },
];

export const ContextFragmentsPanel: React.FC = () => {
  const isTauri = useIsTauri();
  const { result: fragmentsResult, loading: loadingFragments, error: fragmentsError } = useContextFragments();
  const { assembled, loading: loadingAssembled, error: assembledError, assemble, preview } = useAssembledContext();
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [selectedFragment, setSelectedFragment] = useState<ContextFragment | null>(null);

  const rawFragments = Array.isArray(fragmentsResult?.data) ? fragmentsResult.data : [];
  const fragments = rawFragments.length > 0 ? rawFragments : (!isTauri ? DEMO_FRAGMENTS : []);

  const handleAssemble = useCallback(async () => {
    if (!isTauri) {
      setPreviewText(fragments.map(f => `--- ${f.name || f.title || f.path} (${typeof f.category === 'object' ? (f.category as any)?.type : f.category}) ---\n${f.content}`).join('\n\n'));
      return;
    }
    await assemble();
  }, [assemble, isTauri, fragments]);

  const handlePreview = useCallback(async () => {
    if (!isTauri) {
      setPreviewText(fragments.map(f => `### ${f.path || f.title}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n'));
      return;
    }
    const text = await preview(16 * 1024);
    setPreviewText(text);
  }, [preview, isTauri, fragments]);

  const grouped = fragments.reduce(
    (acc, frag) => {
      const cat = typeof frag.category === 'object' ? (frag.category as any)?.type || 'Custom' : String(frag.category || 'Custom');
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(frag);
      return acc;
    },
    {} as Record<string, ContextFragment[]>,
  );

  return (
    <div className="space-y-3 text-primary">
      {/* Web Mode Banner */}
      {!isTauri && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
            <span className="truncate">
              <strong>Modo Web:</strong> Visualização de contexto e templates. Acesso direto a disco requer Tauri.
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-900 shrink-0">
            PREVIEW
          </span>
        </div>
      )}

      {(fragmentsError || assembledError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{fragmentsError || assembledError}</p>
        </div>
      )}

      {/* Header + Actions */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-primary tracking-tight">Context Fragments</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {fragments.length} arquivo(s) de contexto disponíveis para o agente.
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleAssemble}
                disabled={loadingAssembled}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-primary transition-colors disabled:opacity-40 shadow-2xs"
              >
                {loadingAssembled ? 'Montando...' : 'Montar'}
              </button>
              <button
                onClick={handlePreview}
                disabled={loadingAssembled}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-40 shadow-2xs"
              >
                {loadingAssembled ? 'Gerando...' : 'Preview Prompt'}
              </button>
            </div>
          </div>
        </div>

        {/* Fragments List */}
        <div className="p-3.5">
          {loadingFragments ? (
            <div className="text-center py-6">
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-xs text-on-surface-variant mt-2">Carregando fragmentos...</p>
            </div>
          ) : fragments.length === 0 ? (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-3xl opacity-30">folder_open</span>
              <p className="text-xs text-on-surface-variant mt-2">Nenhum arquivo de contexto encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([category, frags]) => (
                <div key={category}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`material-symbols-outlined text-[14px] ${categoryColors[category]?.split(' ')[1] || ''}`}>
                      {categoryIcons[category] || 'description'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {category}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">({frags.length})</span>
                  </div>
                  <div className="space-y-1">
                    {frags.map((frag) => (
                      <button
                        key={frag.name}
                        onClick={() => setSelectedFragment(selectedFragment?.name === frag.name ? null : frag)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                          selectedFragment?.name === frag.name
                            ? 'border-primary bg-primary/5 shadow-2xs'
                            : 'border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${categoryColors[category] || ''}`}>
                              {frag.name || frag.title}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-mono truncate">
                              {frag.path || frag.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-mono shrink-0 ml-2">
                            {frag.lines ?? (frag.content ? frag.content.split('\n').length : 0)}L
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fragment Detail */}
      {selectedFragment && (
        <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs animate-in fade-in duration-150">
          <div className="p-3.5 border-b border-outline-variant/40 bg-surface/80 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-primary">{selectedFragment.name || selectedFragment.title}</h4>
              <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{selectedFragment.path || selectedFragment.title}</p>
            </div>
            <button
              onClick={() => setSelectedFragment(null)}
              className="text-on-surface-variant hover:text-primary transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div className="p-3">
            <pre className="text-[10px] font-mono bg-surface-container-low text-primary p-3 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-[220px] overflow-y-auto">
              {selectedFragment.content}
            </pre>
          </div>
        </div>
      )}

      {/* Preview Text */}
      {previewText && (
        <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs animate-in fade-in duration-150">
          <div className="p-3.5 border-b border-outline-variant/40 bg-surface/80 flex items-center justify-between">
            <h4 className="font-bold text-xs text-primary">Preview de Contexto</h4>
            <button
              onClick={() => setPreviewText(null)}
              className="text-on-surface-variant hover:text-primary transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div className="p-3">
            <pre className="text-[10px] font-mono bg-surface-container-low text-primary p-3 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-[220px] overflow-y-auto">
              {previewText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
