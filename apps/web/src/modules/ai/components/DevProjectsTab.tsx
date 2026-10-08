'use client';

import React, { useState, useMemo } from 'react';
import {
  useHarnessGitScan,
  useHarnessMemorySessions,
  useHarnessSkills,
  type HarnessRepo,
  type HarnessMemorySession,
  type HarnessSkill,
} from '@/modules/dev/hooks/useHarness';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DevProjectsTabProps {
  selectedProjectName?: string;
  onSelectProjectAndChat?: (projectName: string, sessionId?: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayPath(repo: HarnessRepo): string {
  const raw = repo.path;
  const sep = raw.includes('\\') ? '\\' : '/';
  const parts = raw.split(/[/\\]/);
  return parts.slice(-3).join(sep);
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'Agora mesmo';
    if (m < 60) return `Há ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Há ${h}h`;
    return `Há ${Math.floor(h / 24)}d`;
  } catch {
    return iso;
  }
}

// ─── Skeleton / Badge ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="p-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 animate-pulse flex flex-col gap-2">
      <div className="h-3 w-3/4 rounded bg-surface-container" />
      <div className="h-2 w-1/2 rounded bg-surface-container" />
    </div>
  );
}

function DemoBadge() {
  return (
    <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-700 border border-amber-400/20 px-1.5 py-0.5 rounded uppercase tracking-wide">
      demo
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DevProjectsTab: React.FC<DevProjectsTabProps> = ({
  selectedProjectName,
  onSelectProjectAndChat,
}) => {
  // Live Tauri data — falls back to demo automatically when outside Tauri shell
  const { result: gitResult, loading: gitLoading, error: gitError, refresh: gitRefresh } = useHarnessGitScan();

  const repos: HarnessRepo[] = gitResult?.data.repos ?? [];
  const isDemo = gitResult?.available === false;

  // Selected repo state
  const [activeRepoPath, setActiveRepoPath] = useState<string | null>(null);

  const activeRepo: HarnessRepo | null = useMemo(() => {
    if (repos.length === 0) return null;
    if (activeRepoPath) {
      const found = repos.find((r) => r.path === activeRepoPath);
      if (found) return found;
    }
    if (selectedProjectName) {
      const found = repos.find(
        (r) => r.name === selectedProjectName || r.path.endsWith(selectedProjectName),
      );
      if (found) return found;
    }
    return repos[0] ?? null;
  }, [repos, activeRepoPath, selectedProjectName]);

  // Sessions and skills scoped to active repo's workspace path
  const { result: sessResult, loading: sessLoading, error: sessError } = useHarnessMemorySessions(
    activeRepo?.path,
    50,
  );
  const { result: skillsResult, loading: skillsLoading, error: skillsError } = useHarnessSkills(activeRepo?.path);

  const sessions: HarnessMemorySession[] = sessResult?.data ?? [];
  const skills: HarnessSkill[] = skillsResult?.data ?? [];

  const [searchFilter, setSearchFilter] = useState('');

  const filteredSessions = useMemo(() => {
    if (!searchFilter.trim()) return sessions;
    const q = searchFilter.toLowerCase();
    return sessions.filter((s) => (s.summary || s.title || '').toLowerCase().includes(q));
  }, [sessions, searchFilter]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full bg-surface text-primary overflow-hidden">

      {(gitError || sessError || skillsError) && (
        <div className="bg-red-50 border-b border-red-200 p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
          <p className="text-xs text-red-700">{gitError || sessError || skillsError}</p>
        </div>
      )}

      {/* Header */}
      <div className="p-4 px-6 border-b border-outline-variant/60 bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">terminal</span>
            <h1 className="text-lg font-bold text-primary tracking-tight">
              Projetos Dev &amp; Repositórios Git
            </h1>
            {isDemo && <DemoBadge />}
          </div>
          {activeRepo && (
            <p className="text-xs text-on-surface-variant font-mono mt-0.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">folder_open</span>
              <span>Dir:</span>
              <span className="bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/40 text-primary font-bold">
                {formatDisplayPath(activeRepo)}
              </span>
              {gitResult?.data.scanned_dir && (
                <span className="text-on-surface-variant/50">
                  — scan: <span className="font-semibold">{gitResult.data.scanned_dir}</span>
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={gitRefresh}
            title="Reescanear repositórios"
            className="h-8 w-8 rounded-xl bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high flex items-center justify-center transition-all"
          >
            <span className={`material-symbols-outlined text-[17px] ${gitLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
          {activeRepo && (
            <button
              onClick={() => onSelectProjectAndChat?.(activeRepo.name)}
              className="h-8 px-3.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs hover:bg-primary/90 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">forum</span>
              <span>Abrir no Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: repo list */}
        <div className="w-80 border-r border-outline-variant/60 flex flex-col bg-surface-container-lowest/50 shrink-0 overflow-y-auto p-3 space-y-2">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
            <span>{gitLoading ? 'Escaneando…' : `Repositórios (${repos.length})`}</span>
            <span className="text-[10px] text-emerald-800 bg-emerald-500/10 px-1.5 py-0.2 rounded font-bold">
              Git local
            </span>
          </div>

          {gitLoading && [1, 2, 3].map((i) => <SkeletonRow key={i} />)}

          {!gitLoading && repos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] opacity-40">folder_off</span>
              <p className="text-xs">Nenhum repositório git encontrado.</p>
              <button
                onClick={gitRefresh}
                className="text-xs text-primary hover:underline font-semibold mt-1"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {repos.map((repo) => {
            const isSelected = activeRepo?.path === repo.path;
            const hasChanges = (repo.files ?? 0) > 0;
            return (
              <button
                key={repo.path}
                onClick={() => setActiveRepoPath(repo.path)}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-2 group ${
                  isSelected
                    ? 'bg-surface border-primary/50 shadow-xs ring-1 ring-primary/20'
                    : 'bg-surface border-outline-variant/40 hover:bg-surface-container-low hover:border-outline-variant'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`material-symbols-outlined text-[18px] shrink-0 ${isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>
                      folder_git
                    </span>
                    <span className="font-bold text-sm text-primary truncate">{repo.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant flex items-center gap-0.5 shrink-0 ml-1">
                    <span className="material-symbols-outlined text-[11px]">call_split</span>
                    {repo.branch || 'main'}
                  </span>
                </div>

                {repo.tech_stack && repo.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {repo.tech_stack.map((t) => (
                      <span key={t} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant border border-outline-variant/30">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1.5 border-t border-outline-variant/30 text-[10px] font-mono text-on-surface-variant">
                  <span className={hasChanges ? 'text-amber-700 font-bold' : ''}>
                    {hasChanges ? `${repo.files} modificados` : 'Clean'}
                  </span>
                  <span>↑{repo.ahead ?? 0} ↓{repo.behind ?? 0}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: details */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">

          {!activeRepo && !gitLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] opacity-30">source</span>
              <p className="text-sm font-semibold">Selecione um repositório</p>
            </div>
          )}

          {activeRepo && (
            <>
              {/* Repo card */}
              <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-primary tracking-tight">{activeRepo.name}</h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-500/20">
                        {activeRepo.branch || 'main'}
                      </span>
                      {(activeRepo.files ?? 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[11px] font-mono font-bold border border-amber-400/20">
                          {activeRepo.files} não commitados
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono mt-1 break-all">{activeRepo.path}</p>
                  </div>
                  <button
                    onClick={() => onSelectProjectAndChat?.(activeRepo.name)}
                    className="h-8 px-3 rounded-xl bg-surface-container border border-outline-variant text-primary hover:bg-surface-container-high text-xs font-semibold font-mono flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Nova Sessão</span>
                  </button>
                </div>

                {/* Git status bar */}
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
                    <span className="font-bold text-primary">Status</span>
                    <span>{activeRepo.build_status ?? 'Clean'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span>↑ {activeRepo.ahead} ahead</span>
                    <span>↓ {activeRepo.behind} behind</span>
                    {activeRepo.last_activity && (
                      <span className="text-on-surface-variant/60">{relativeTime(activeRepo.last_activity)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid: sessions + skills */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Sessions */}
                <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary">forum</span>
                      <h3 className="font-bold text-sm text-primary">Sessões de IA</h3>
                      {!sessLoading && (
                        <span className="text-xs font-mono bg-surface-container px-1.5 py-0.2 rounded text-on-surface-variant">
                          {sessions.length}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-on-surface-variant pointer-events-none">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Filtrar…"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="h-7 pl-7 pr-3 rounded-lg text-[11px] bg-surface-container border border-outline-variant/50 text-primary placeholder:text-on-surface-variant/50 outline-none focus:border-primary/50 w-28 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 min-h-[60px]">
                    {sessLoading && [1, 2].map((i) => <SkeletonRow key={i} />)}

                    {!sessLoading && filteredSessions.length === 0 && (
                      <div className="flex flex-col items-center py-8 text-center text-on-surface-variant gap-2">
                        <span className="material-symbols-outlined text-[28px] opacity-30">chat_bubble</span>
                        <p className="text-xs">Nenhuma sessão encontrada neste workspace.</p>
                      </div>
                    )}

                    {filteredSessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3 rounded-xl bg-surface-container-low/60 hover:bg-surface-container border border-outline-variant/30 transition-all flex flex-col gap-1.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-primary line-clamp-2 flex-1">
                            {sess.summary || `Sessão #${sess.id}`}
                          </h4>
                          <button
                            onClick={() => onSelectProjectAndChat?.(activeRepo.name, String(sess.id))}
                            className="text-[10px] font-mono font-bold text-primary hover:underline flex items-center gap-0.5 shrink-0 mt-0.5"
                          >
                            <span>Retomar</span>
                            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant/70">
                          <span className="truncate max-w-[120px]">{sess.model}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span>{sess.message_count || sess.messageCount || 0} msgs</span>
                            <span>{relativeTime(sess.updated_at || sess.updatedAt || '')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">extension</span>
                    <h3 className="font-bold text-sm text-primary">Skills do Workspace</h3>
                    {!skillsLoading && (
                      <span className="text-xs font-mono bg-surface-container px-1.5 py-0.2 rounded text-on-surface-variant">
                        {skills.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 min-h-[60px]">
                    {skillsLoading && [1, 2].map((i) => <SkeletonRow key={i} />)}

                    {!skillsLoading && skills.length === 0 && (
                      <div className="flex flex-col items-center py-8 text-center text-on-surface-variant gap-2">
                        <span className="material-symbols-outlined text-[28px] opacity-30">extension_off</span>
                        <p className="text-xs">Nenhuma skill neste workspace.</p>
                        <p className="text-[10px] opacity-60">
                          Adicione <code>.md</code> em <code>.anamnesic/skills/</code>
                        </p>
                      </div>
                    )}

                    {skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-surface border border-outline-variant/40 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[16px]">description</span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-xs text-primary truncate">{skill.name}</div>
                            <p className="text-[10px] text-on-surface-variant truncate">{skill.description}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-800 shrink-0">
                          Ativa
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
