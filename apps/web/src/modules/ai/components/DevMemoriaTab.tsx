"use client";

import React, { useState, useMemo } from 'react';
import { useHarnessContextFiles, useHarnessFileEditor, useMemoriesSearch, type HarnessContextFile } from '@/modules/dev/hooks/useHarness';

interface DevMemoriaTabProps {
  workspace?: string;
}

const FILE_META: Record<string, { scope: string; desc: string; agents: string[] }> = {
  'AGENTS.md': { scope: 'Projeto', desc: 'Instruções para agentes (Claude, Antigravity, etc.)', agents: ['Claude Code', 'Antigravity', 'Kilo Code'] },
  'CLAUDE.md': { scope: 'Projeto', desc: 'Configuração específica do Claude Code', agents: ['Claude Code'] },
  'MEMORY.md': { scope: 'Projeto', desc: 'Memória semântica do projeto', agents: ['Goose', 'Cline'] },
  '.github/copilot-instructions.md': { scope: 'Projeto', desc: 'Instruções para GitHub Copilot', agents: ['GitHub Copilot'] },
};

// Candidate files that SHOULD exist but may not — shown as "missing"
const ALL_CANDIDATES = ['AGENTS.md', 'CLAUDE.md', 'MEMORY.md', '.github/copilot-instructions.md'];

function EditorModal({
  file,
  onClose,
  onSaved,
}: {
  file: HarnessContextFile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { content, loading, saving, error, save, setContent } = useHarnessFileEditor(file.path);
  const [draft, setDraft] = useState<string | null>(null);
  const current = draft ?? content ?? '';

  const handleSave = async () => {
    await save(current);
    setDraft(null);
    onSaved();
  };

  const changed = draft !== null && draft !== content;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col border border-outline-variant/30">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[22px]">edit_document</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary">{file.name || file.path.split('/').pop() || file.path}</h3>
              <p className="text-on-surface-variant font-mono text-xs mt-0.5 truncate max-w-sm">{file.path}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {changed && (
              <span className="text-xs text-secondary font-medium animate-pulse">Alterações não salvas</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !changed}
              className="h-8 px-3 bg-secondary text-on-secondary text-xs rounded hover:bg-secondary/90 disabled:opacity-40 transition-colors flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">{saving ? 'progress_activity' : 'save'}</span>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="px-5 py-2 bg-error/10 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </div>
        )}

        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center h-full text-on-surface-variant text-sm gap-2">
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              Carregando arquivo…
            </div>
          ) : (
            <textarea
              className="w-full h-full p-5 font-mono text-xs resize-none border-0 outline-none bg-surface-container-low/30 text-on-surface leading-relaxed"
              value={current}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
            />
          )}
        </div>

        <div className="px-5 py-2 border-t border-outline-variant/20 text-xs text-on-surface-variant flex items-center gap-4 bg-surface-container-low/30">
          <span>{current.split('\n').length} linhas</span>
          <span>{new TextEncoder().encode(current).length} bytes</span>
          {file.name && FILE_META[file.name] && (
            <span className="ml-auto">
              Lido por: {FILE_META[file.name].agents.join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const DevMemoriaTab: React.FC<DevMemoriaTabProps> = ({ workspace }) => {
  const { result, loading, error: contextError, refresh } = useHarnessContextFiles(workspace);
  const memories = result?.data ?? [];
  const demo = result?.available === false;

  const { results: memorySearchResults, loading: searchingMemories, search: searchMemories } = useMemoriesSearch();
  const [memoryQuery, setMemoryQuery] = useState('');

  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<HarnessContextFile | null>(null);

  const existingNames = new Set(memories.map((m) => m.name || m.path.split('/').pop() || m.path));
  const missingCandidates = ALL_CANDIDATES.filter((c) => !existingNames.has(c));

  const filtered = useMemo(
    () =>
      memories.filter(
        (m) =>
          search === '' ||
          (m.name || m.path).toLowerCase().includes(search.toLowerCase()) ||
          m.path.toLowerCase().includes(search.toLowerCase()),
      ),
    [memories, search],
  );

  const totalLines = memories.reduce((acc, m) => acc + (m.lines || 0), 0);

  return (
    <div>
      {contextError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 mb-4">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{contextError}</p>
        </div>
      )}
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter mb-xl">
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Arquivos de Memória</span>
          <div className="font-display-lg text-[28px] font-bold text-primary my-2 font-data-tabular">{loading ? '…' : `${memories.length} Arquivos`}</div>
          <span className="text-secondary text-xs font-data-tabular">AGENTS.md, CLAUDE.md, MEMORY.md</span>
        </div>
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Linhas Totais</span>
          <div className="font-display-lg text-[28px] font-bold text-secondary my-2 font-data-tabular">{loading ? '…' : totalLines}</div>
          <span className="text-secondary text-xs font-data-tabular">Instruções carregadas pelos agentes</span>
        </div>
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Ausentes</span>
          <div className={`font-display-lg text-[28px] font-bold my-2 font-data-tabular ${missingCandidates.length > 0 ? 'text-error' : 'text-secondary'}`}>
            {loading ? '…' : missingCandidates.length}
          </div>
          <span className="text-on-surface-variant text-xs font-data-tabular">Candidatos não encontrados</span>
        </div>
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Workspace</span>
          <div className="font-display-lg text-[28px] font-bold text-primary my-2 font-data-tabular">{demo ? 'Demo' : 'Ativo'}</div>
          <span className="text-on-surface-variant text-xs font-data-tabular">{demo ? 'Sem shell Tauri' : 'Harness Rust conectado'}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-outline-variant/50 rounded-lg overflow-hidden flex flex-col">
        <div className="p-5 border-b border-outline-variant/30 bg-white space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-primary">Instruções & Memória</h3>
            <button
              onClick={refresh}
              className="h-8 px-3 border border-outline-variant text-on-surface-variant text-xs rounded hover:bg-surface-container-low transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Atualizar
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">search</span>
            <input
              type="text"
              placeholder="Buscar por nome ou caminho…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-8 text-xs border border-outline-variant rounded bg-surface-container-low/50 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          {/* BM25 Memory Search */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Busca BM25 nas memórias…"
              value={memoryQuery}
              onChange={(e) => setMemoryQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && memoryQuery.trim()) searchMemories(memoryQuery); }}
              className="flex-1 px-3 h-8 text-xs border border-outline-variant rounded bg-surface-container-low/50 focus:outline-none focus:border-secondary transition-colors"
            />
            <button
              onClick={() => { if (memoryQuery.trim()) searchMemories(memoryQuery); }}
              disabled={searchingMemories || !memoryQuery.trim()}
              className="h-8 px-3 rounded bg-secondary text-on-secondary text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {searchingMemories ? '...' : 'BM25'}
            </button>
          </div>
          {memorySearchResults.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {memorySearchResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-surface-container-low/50">
                  <div className="min-w-0 flex-1">
                    <span className="text-on-surface-variant truncate block">{r.summary || `Sessão #${r.session_id}`}</span>
                    {r.snippet && <span className="text-[10px] text-on-surface-variant/70 truncate block">{r.snippet}</span>}
                  </div>
                  <span className="text-secondary font-semibold ml-2 whitespace-nowrap">score: {r.score?.toFixed(2) ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {demo && (
          <div className="px-5 py-2 bg-tertiary-container/10 text-on-tertiary-container text-xs font-medium">
            Modo demo — execute pelo shell Tauri (tauri dev) para ler arquivos de memória reais.
          </div>
        )}

        {/* Hierarchy: Active files */}
        {filtered.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-5 py-2 bg-surface-container-low/60 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Ativos no projeto</span>
              <span className="ml-auto text-xs text-on-surface-variant">{filtered.length} arquivo(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low/50 font-label-md text-[12px] text-on-surface-variant">
                    <th className="py-3 px-5">Arquivo</th>
                    <th className="py-3 px-5">Escopo</th>
                    <th className="py-3 px-5">Caminho</th>
                    <th className="py-3 px-5 text-center">Linhas</th>
                    <th className="py-3 px-5">Última Atualização</th>
                    <th className="py-3 px-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-[14px]">
                  {filtered.map((memory) => {
                    const fileName = memory.name || memory.path.split('/').pop() || memory.path;
                    const meta = FILE_META[fileName];
                    return (
                      <tr key={memory.path} className="border-b border-outline-variant/10 hover:bg-surface-container-low/30 transition-colors">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-[20px]">memory</span>
                            <div>
                              <span className="font-medium text-primary">{fileName}</span>
                              {meta && (
                                <p className="text-[10px] text-on-surface-variant mt-0.5">{meta.desc}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-on-secondary-container text-xs font-semibold border border-secondary-container/30">
                            {meta?.scope ?? 'Projeto'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-on-surface-variant font-mono text-xs max-w-[200px]">
                          <span className="truncate block" title={memory.path}>{memory.path}</span>
                        </td>
                        <td className="py-3 px-5 text-center font-medium text-primary">{memory.lines || 0}</td>
                        <td className="py-3 px-5 text-on-surface-variant text-xs">
                          {memory.modified ? new Date(memory.modified).toLocaleString('pt-BR') : '—'}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <button
                            onClick={() => setEditor(memory)}
                            className="h-7 px-3 border border-outline-variant text-on-surface-variant text-xs rounded hover:bg-surface-container-low transition-colors flex items-center gap-1 mx-auto"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Missing candidates */}
        {missingCandidates.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-5 py-2 bg-surface-container-low/60 border-b border-outline-variant/20 border-t border-outline-variant/20 mt-0">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">info</span>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Candidatos ausentes</span>
              <span className="ml-auto text-xs text-on-surface-variant">Não encontrados no workspace</span>
            </div>
            <div className="px-5 py-3 space-y-2">
              {missingCandidates.map((name) => {
                const meta = FILE_META[name];
                return (
                  <div key={name} className="flex items-center gap-3 py-2 text-sm">
                    <span className="material-symbols-outlined text-[18px] text-outline-variant">radio_button_unchecked</span>
                    <div>
                      <span className="text-on-surface-variant font-medium">{name}</span>
                      {meta && <span className="text-xs text-on-surface-variant ml-2">— {meta.desc}</span>}
                    </div>
                    {meta && (
                      <div className="ml-auto flex gap-1">
                        {meta.agents.map((a) => (
                          <span key={a} className="text-[10px] px-1.5 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant font-mono">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {memories.length === 0 && !loading && (
          <div className="py-8 px-5 text-center text-on-surface-variant">
            Nenhum arquivo de memória encontrado no workspace.
          </div>
        )}
      </div>

      {editor && (
        <EditorModal
          file={editor}
          onClose={() => setEditor(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
};
