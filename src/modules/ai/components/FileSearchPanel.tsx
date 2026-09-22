'use client';

import React, { useState } from 'react';
import { useFileSearch, useIsTauri } from '@/modules/dev/hooks/useHarness';

const DEMO_FILES = [
  { path: 'src/app/page.tsx', match_type: 'fuzzy', score: 98 },
  { path: 'src/components/dev/DevHarnessLayout.tsx', match_type: 'fuzzy', score: 95 },
  { path: 'src/lib/supabase.ts', match_type: 'fuzzy', score: 90 },
  { path: 'src-tauri/src/main.rs', match_type: 'fuzzy', score: 88 },
  { path: 'package.json', match_type: 'exact', score: 100 },
  { path: 'AGENTS.md', match_type: 'fuzzy', score: 92 },
  { path: 'docs/adr/0030-ui-domain-integration.md', match_type: 'fuzzy', score: 85 },
];

export const FileSearchPanel: React.FC = () => {
  const isTauri = useIsTauri();
  const { results: rawResults, loading, error, search } = useFileSearch();
  const [query, setQuery] = useState('');
  const [roots, setRoots] = useState('.');
  const [demoResults, setDemoResults] = useState<{ total_scanned: number; duration_ms: number; matches: typeof DEMO_FILES } | null>({
    total_scanned: 142,
    duration_ms: 8,
    matches: DEMO_FILES,
  });

  const handleSearch = async () => {
    if (!isTauri) {
      const q = query.toLowerCase().trim();
      const filtered = q
        ? DEMO_FILES.filter(f => f.path.toLowerCase().includes(q))
        : DEMO_FILES;
      setDemoResults({
        total_scanned: 142,
        duration_ms: 5,
        matches: filtered,
      });
      return;
    }
    if (!query.trim()) return;
    const rootList = roots.split(',').map((r) => r.trim()).filter(Boolean);
    await search(query, rootList);
  };

  const results = isTauri ? rawResults : demoResults;

  return (
    <div className="space-y-3 text-primary">
      {/* Web Mode Banner */}
      {!isTauri && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
            <span className="truncate">
              <strong>Modo Web:</strong> Busca fuzzy interativa em arquivos simulados. Escaneamento do disco local requer o Tauri Desktop.
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

      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80">
          <h3 className="font-bold text-sm text-primary tracking-tight">Busca Fuzzy em Arquivos</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Localize caminhos de arquivos do projeto respeitando regras do .gitignore.
          </p>
        </div>

        <div className="p-3.5 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isTauri) {
                  const q = e.target.value.toLowerCase().trim();
                  const filtered = q ? DEMO_FILES.filter(f => f.path.toLowerCase().includes(q)) : DEMO_FILES;
                  setDemoResults({ total_scanned: 142, duration_ms: 4, matches: filtered });
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar arquivos por nome ou caminho..."
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-2xs transition-colors"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          <input
            type="text"
            value={roots}
            onChange={(e) => setRoots(e.target.value)}
            placeholder="Diretórios raiz (ex: src, src-tauri, docs)"
            className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary"
          />

          {results && (
            <div className="text-[10px] text-on-surface-variant font-mono">
              {results.total_scanned} arquivos escaneados em {results.duration_ms}ms
            </div>
          )}

          {results && results.matches.length > 0 && (
            <div className="divide-y divide-outline-variant/20 max-h-[300px] overflow-y-auto no-scrollbar">
              {results.matches.map((m: any, i: number) => (
                <div key={i} className="py-2 px-1 hover:bg-surface-container-low/40 rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[15px] text-primary">description</span>
                      <span className="text-xs font-mono text-primary truncate">{m.path}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-mono">
                        {m.match_type}
                      </span>
                      <span className="text-[10px] font-bold text-primary font-mono">{m.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results && results.matches.length === 0 && query.trim() && (
            <div className="p-6 text-center text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-3xl opacity-30">search_off</span>
              <p className="mt-2">Nenhum resultado para &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
