"use client";

import React, { useState, useMemo } from 'react';
import { useHarnessMemorySessions, useHarnessSessionMessages, useStreamAgentSession, type HarnessMemorySession } from '@/modules/dev/hooks/useHarness';
import { NewSessionModal } from './NewSessionModal';

interface DevSessoesTabProps {
  workspace?: string;
}

const DATE_FILTERS = ['Todas', 'Hoje', '7 dias', '30 dias'] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function filterByDate(session: HarnessMemorySession, filter: DateFilter): boolean {
  if (filter === 'Todas') return true;
  const updatedTime = session.updated_at || session.updatedAt || session.created_at || session.createdAt;
  if (!updatedTime) return true;
  const diff = (Date.now() - new Date(updatedTime).getTime()) / 1000;
  if (filter === 'Hoje') return diff < 86400;
  if (filter === '7 dias') return diff < 7 * 86400;
  if (filter === '30 dias') return diff < 30 * 86400;
  return true;
}

function TranscriptPanel({ sessionId, resumeMode, onClose }: { sessionId: number; resumeMode?: boolean; onClose: () => void }) {
  const { result, loading, error, refresh } = useHarnessSessionMessages(sessionId);
  const messages = result?.data ?? [];
  const { startStream, running, events, textDeltas } = useStreamAgentSession();
  const [prompt, setPrompt] = useState('');
  const [optimisticUserMsg, setOptimisticUserMsg] = useState('');

  const handleSend = async () => {
    if (!prompt.trim() || running) return;
    const msg = prompt;
    setPrompt('');
    setOptimisticUserMsg(msg);
    await startStream(msg, () => {}, { session_id: sessionId.toString() });
    setOptimisticUserMsg('');
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-outline-variant/30 animate-[slideUp_0.2s_ease]">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[22px]">terminal</span>
            <h3 className="font-headline-sm text-headline-sm text-primary">Transcript da Sessão #{sessionId}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-on-surface-variant text-sm py-4 justify-center">
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              Carregando mensagens…
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant text-sm">
              Nenhuma mensagem encontrada para esta sessão.
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold ${
                  msg.role === 'assistant'
                    ? 'bg-secondary text-on-secondary'
                    : msg.role === 'user'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                {msg.role === 'assistant' ? 'A' : msg.role === 'user' ? 'U' : 'S'}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-surface-container-low text-on-surface rounded-tl-sm'
                    : msg.role === 'user'
                    ? 'bg-primary/10 text-primary rounded-tr-sm'
                    : 'bg-tertiary-container/20 text-on-tertiary-container rounded-sm'
                }`}
              >
                {msg.content}
                <div className="text-[10px] opacity-50 mt-1">{relTime(msg.timestamp || msg.created_at || msg.createdAt || '')}</div>
              </div>
            </div>
          ))}
          {optimisticUserMsg && (
            <div className="flex gap-3 flex-row-reverse">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold bg-primary text-on-primary">
                U
              </div>
              <div className="rounded-2xl px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap leading-relaxed bg-primary/10 text-primary rounded-tr-sm">
                {optimisticUserMsg}
              </div>
            </div>
          )}
          {running && (
            <div className="flex gap-3 flex-row">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold bg-secondary text-on-secondary">
                A
              </div>
              <div className="rounded-2xl px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap leading-relaxed bg-surface-container-low text-on-surface rounded-tl-sm flex flex-col gap-2">
                {events.map((ev, i) => {
                  if (ev.type === 'Status') return <div key={i} className="text-[11px] text-on-surface-variant italic">⏳ {ev.payload}</div>;
                  if (ev.type === 'Failed') return <div key={i} className="text-[11px] text-red-600 font-medium">❌ Falha: {ev.payload.message}</div>;
                  if (ev.type === 'Done') return <div key={i} className="text-[11px] text-emerald-600 font-medium">✅ Concluído: {ev.payload.message}</div>;
                  return null;
                })}
                {textDeltas && <div className="mt-2 pt-2 border-t border-outline-variant/20">{textDeltas}</div>}
              </div>
            </div>
          )}
        </div>
        {resumeMode && (
          <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/30">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Envie uma mensagem para retomar a sessão…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={running}
                className="flex-1 h-10 px-4 text-sm border border-outline-variant rounded-full bg-white focus:outline-none focus:border-secondary transition-colors disabled:opacity-50 disabled:bg-surface-container-low"
              />
              <button
                onClick={handleSend}
                disabled={!prompt.trim() || running}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-on-secondary disabled:opacity-50 transition-all hover:bg-secondary/90 shadow-sm disabled:shadow-none"
              >
                {running ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const DevSessoesTab: React.FC<DevSessoesTabProps> = ({ workspace }) => {
  const { result, loading, error, refresh } = useHarnessMemorySessions(workspace);
  const sessions = result?.data ?? [];
  const demo = result?.available === false;

  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('Todas');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [transcriptId, setTranscriptId] = useState<number | null>(null);
  const [resumeMode, setResumeMode] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const models = useMemo(() => Array.from(new Set(sessions.map((s) => s.model).filter(Boolean))), [sessions]);

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) =>
          (search === '' || (s.summary || s.title || '').toLowerCase().includes(search.toLowerCase())) &&
          (modelFilter === '' || s.model === modelFilter) &&
          filterByDate(s, dateFilter),
      ),
    [sessions, search, modelFilter, dateFilter],
  );

  const active = sessions.filter((s) => (s.summary || s.title || '').trim().length > 0).length;
  const totalMsgs = sessions.reduce((acc, s) => acc + (s.message_count || s.messageCount || 0), 0);

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 mb-4">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter mb-xl">
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Sessões Registradas</span>
          <div className="font-display-lg text-[28px] font-bold text-primary my-2 font-data-tabular">{loading ? '…' : `${sessions.length} Sessões`}</div>
          <span className="text-secondary text-xs font-data-tabular">Na memória local do harness</span>
        </div>
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Retomáveis</span>
          <div className="font-display-lg text-[28px] font-bold text-secondary my-2 font-data-tabular">{loading ? '…' : `${active} Sessões`}</div>
          <span className="text-secondary text-xs font-data-tabular">Com resumo salvo</span>
        </div>
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Mensagens</span>
          <div className="font-display-lg text-[28px] font-bold text-primary my-2 font-data-tabular">{loading ? '…' : totalMsgs}</div>
          <span className="text-on-surface-variant text-xs font-data-tabular">Persistidas no banco SQLite</span>
        </div>
        <div className="bg-surface border border-outline-variant/50 rounded-lg p-5 flex flex-col">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">Fonte</span>
          <div className="font-display-lg text-[28px] font-bold text-primary my-2 font-data-tabular">{demo ? 'Demo' : 'Harness'}</div>
          <span className="text-on-surface-variant text-xs font-data-tabular">{demo ? 'Navegador sem shell Tauri' : '~/.anamnesic/memory.db'}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-outline-variant/50 rounded-lg overflow-hidden flex flex-col">
        {/* Header + search */}
        <div className="p-5 border-b border-outline-variant/30 bg-white space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-primary">Sessões de Agentes</h3>
            <div className="flex gap-2">
              <button
                onClick={refresh}
                className="h-8 px-3 border border-outline-variant text-on-surface-variant text-xs rounded hover:bg-surface-container-low transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Atualizar
              </button>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="h-8 px-3 bg-secondary text-on-secondary text-xs rounded hover:bg-secondary/90 transition-colors flex items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Nova Sessão
              </button>
            </div>
          </div>
          {/* Filters row */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[180px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">search</span>
              <input
                type="text"
                placeholder="Buscar por resumo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 h-8 text-xs border border-outline-variant rounded bg-surface-container-low/50 focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="h-8 px-2 text-xs border border-outline-variant rounded bg-surface-container-low/50 focus:outline-none focus:border-secondary transition-colors"
            >
              <option value="">Todos os modelos</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="flex gap-1">
              {DATE_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`h-8 px-3 text-xs rounded border transition-colors ${
                    dateFilter === f
                      ? 'bg-secondary text-on-secondary border-secondary'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {demo && (
          <div className="px-5 py-2 bg-tertiary-container/10 text-on-tertiary-container text-xs font-medium">
            Modo demo — execute pelo shell Tauri (tauri dev) para ler o harness Rust real.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low/50 font-label-md text-[12px] text-on-surface-variant">
                <th className="py-3 px-5">Resumo</th>
                <th className="py-3 px-5">Modelo</th>
                <th className="py-3 px-5 text-center">Mensagens</th>
                <th className="py-3 px-5">Atualizada</th>
                <th className="py-3 px-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="font-data-tabular text-[14px]">
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 px-5 text-center text-on-surface-variant">
                    {sessions.length === 0 ? 'Nenhuma sessão registrada ainda pelo harness.' : 'Nenhuma sessão corresponde aos filtros.'}
                  </td>
                </tr>
              )}
              {filtered.map((session) => (
                <React.Fragment key={session.id}>
                  <tr
                    className={`border-b border-outline-variant/10 transition-colors cursor-pointer ${
                      expandedId === session.id ? 'bg-secondary/5' : 'hover:bg-surface-container-low/30'
                    }`}
                    onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform ${expandedId === session.id ? 'rotate-90' : ''}`}>
                          chevron_right
                        </span>
                        <span className="font-medium text-primary">{session.summary || `Sessão #${session.id}`}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-mono text-xs text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/20 inline-block max-w-[160px] truncate">
                        {session.model || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-semibold border border-outline-variant/30">
                        {session.message_count || session.messageCount || 0} msgs
                      </span>
                    </td>
                    <td className="py-3 px-5 text-on-surface-variant text-xs">
                      <span title={new Date(session.updated_at || session.updatedAt || Date.now()).toLocaleString('pt-BR')}>{relTime(session.updated_at || session.updatedAt || '')}</span>
                    </td>
                    <td className="py-3 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setTranscriptId(session.id); setResumeMode(false); }}
                          title="Ver transcript"
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-low transition-colors text-on-surface-variant"
                        >
                          <span className="material-symbols-outlined text-[16px]">forum</span>
                        </button>
                        <button
                          title="Retomar sessão"
                          onClick={() => { setTranscriptId(session.id); setResumeMode(true); }}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary/10 transition-colors text-secondary"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === session.id && (
                    <tr className="bg-secondary/5 border-b border-outline-variant/10">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-on-surface-variant uppercase font-semibold block mb-1">ID</span>
                            <span className="font-mono text-primary">#{session.id}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant uppercase font-semibold block mb-1">Criada em</span>
                            <span className="text-on-surface">{new Date(session.timestamp || session.created_at || session.createdAt || Date.now()).toLocaleString('pt-BR')}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant uppercase font-semibold block mb-1">Última atividade</span>
                            <span className="text-on-surface">{new Date(session.updated_at || session.updatedAt || Date.now()).toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-on-surface-variant uppercase font-semibold block mb-1">Modelo</span>
                            <span className="font-mono text-on-surface">{session.model || '—'}</span>
                          </div>
                          <div className="flex gap-2 items-end">
                            <button
                              onClick={() => { setTranscriptId(session.id); setResumeMode(false); }}
                              className="h-8 px-3 border border-outline-variant text-on-surface-variant text-xs rounded hover:bg-surface-container-low transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">forum</span>
                              Ver transcript
                            </button>
                            <button
                              onClick={() => { setTranscriptId(session.id); setResumeMode(true); }}
                              className="h-8 px-3 bg-secondary text-on-secondary text-xs rounded hover:bg-secondary/90 transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                              Retomar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-2 border-t border-outline-variant/20 text-xs text-on-surface-variant bg-surface-container-low/30">
            {filtered.length} sessão(ões) · {filtered.reduce((a, s) => a + (s.message_count || s.messageCount || 0), 0)} mensagens
          </div>
        )}
      </div>

      {/* Transcript modal */}
      {transcriptId !== null && (
        <TranscriptPanel sessionId={transcriptId} resumeMode={resumeMode} onClose={() => setTranscriptId(null)} />
      )}

      {/* New Session modal (Copilot / Codex style) */}
      {isNewModalOpen && (
        <NewSessionModal
          workspace={workspace}
          onClose={() => setIsNewModalOpen(false)}
          onCreated={(newId) => {
            refresh();
            setTranscriptId(newId);
          }}
        />
      )}
    </div>
  );
};
