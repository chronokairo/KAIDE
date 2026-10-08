'use client';

import React, { useState } from 'react';
import { AddFolderModal } from './AddFolderModal';
import { useHarnessMemorySessionsBatch } from '@/modules/dev/hooks/useHarness';
import type { HarnessRepo } from '@/modules/dev/harness-client';

interface DevProjectSessionsSidebarProps {
  selectedProjectName: string;
  selectedSessionId?: string;
  projects: HarnessRepo[];
  onSelectProjectAndSession: (projectName: string, sessionId: string, sessionTitle: string) => void;
  onNewSession: (projectName: string) => void;
}

export const DevProjectSessionsSidebar: React.FC<DevProjectSessionsSidebarProps> = ({
  selectedProjectName,
  selectedSessionId,
  projects,
  onSelectProjectAndSession,
  onNewSession,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() => {
    if (projects.length > 0) {
      return { [projects[0].path]: true };
    }
    return {};
  });

  const [projectsList, setProjectsList] = useState<HarnessRepo[]>([]);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState<boolean>(false);

  // Sync projects from parent
  React.useEffect(() => {
    setProjectsList(projects);
  }, [projects]);

  const workspacePaths = projectsList.map((p) => p.path);
  const { sessionsMap, loading: sessionsLoading, error: sessionsError } = useHarnessMemorySessionsBatch(workspacePaths);

  const toggleProject = (projPath: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projPath]: !prev[projPath],
    }));
  };

  const handleFolderAdded = (repo: HarnessRepo) => {
    setProjectsList((prev) => {
      const exists = prev.some((p) => p.path === repo.path);
      if (exists) return prev;
      return [...prev, repo];
    });
    setExpandedProjects((prev) => ({ ...prev, [repo.path]: true }));
    onSelectProjectAndSession(repo.name, `sess-${repo.name}-1`, `Sessão Inicial (${repo.name})`);
  };

  return (
    <>
      <aside className="w-72 xl:w-80 h-full border-r border-outline-variant/60 bg-surface/50 flex flex-col shrink-0 select-none overflow-hidden text-primary">
        {/* Header da Sidebar de Projetos: Workspaces + Nova Sessão */}
        <div className="p-3 border-b border-outline-variant/50 flex flex-col gap-2 bg-surface/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
              <span className="text-xs font-bold text-primary tracking-tight">Workspaces & Sessões</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/40">
              {projectsList.length}
            </span>
          </div>

          <button
            onClick={() => onNewSession(selectedProjectName || 'erp')}
            className="w-full h-8 px-3 rounded-xl bg-primary text-on-primary font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:bg-primary/90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nova Sessão</span>
            <span className="ml-auto text-[10px] opacity-70 font-mono">Ctrl+N</span>
          </button>
        </div>

        {sessionsError && (
          <div className="bg-red-50 border-b border-red-200 p-2.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500 text-[14px]">error</span>
            <p className="text-[10px] text-red-700 truncate">{sessionsError}</p>
          </div>
        )}

        {/* Árvore de Diretórios (Projetos da pasta) com Sublista de Sessões */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
          {projectsList.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] opacity-40">folder_off</span>
              <p className="text-xs">Nenhum repositório encontrado.</p>
            </div>
          )}
          {projectsList.map((proj) => {
            const isExpanded = expandedProjects[proj.path] ?? false;
            const isCurrentProject = proj.name === selectedProjectName || proj.path === selectedProjectName;
            const sessions = sessionsMap[proj.path] || [];

            return (
              <div
                key={proj.path}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isCurrentProject
                    ? 'bg-surface border-primary/40 shadow-2xs'
                    : 'bg-surface-container-lowest/60 border-outline-variant/30 hover:border-outline-variant/60'
                }`}
              >
                {/* Item Principal do Diretório */}
                <div
                  onClick={() => toggleProject(proj.path)}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors group ${
                    isCurrentProject ? 'bg-surface-container-low/40' : 'hover:bg-surface-container-low/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[15px] text-on-surface-variant transition-transform duration-150 ${
                        isExpanded ? 'rotate-90 text-primary' : ''
                      }`}
                    >
                      chevron_right
                    </span>
                    <span className="material-symbols-outlined text-[17px] text-primary">
                      {isExpanded ? 'folder_open' : 'folder'}
                    </span>
                    <span className="font-sans font-semibold text-xs text-primary truncate">
                      {proj.name}
                    </span>
                  </div>

                  {/* Contador e Botão [+] ao lado do nome do projeto para nova sessão */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono bg-surface-container px-1.5 py-0.2 rounded-full text-on-surface-variant">
                      {sessions.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewSession(proj.name);
                      }}
                      title={`Nova Sessão em ${proj.name}`}
                      className="p-1 rounded-md hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>
                </div>

                {/* Sublista de Sessões do Diretório */}
                {isExpanded && (
                  <div className="px-2 pb-2 space-y-0.5 border-t border-outline-variant/20 pt-1.5 bg-surface-container-low/10">
                    {sessionsLoading && (
                      <div className="px-2 py-1 text-[10px] text-on-surface-variant/60 font-sans">
                        Carregando sessões…
                      </div>
                    )}
                    {!sessionsLoading && sessions.length === 0 && (
                      <div className="px-2 py-1 text-[10px] text-on-surface-variant/60 font-sans">
                        Nenhuma sessão neste workspace.
                      </div>
                    )}
                    {sessions.map((sess) => (
                      <button
                        key={sess.id}
                        onClick={() => onSelectProjectAndSession(proj.name, String(sess.id), sess.summary || sess.title || '')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-start gap-2 group ${
                          selectedSessionId === String(sess.id) && isCurrentProject
                            ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                            : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[14px] mt-0.5 shrink-0 ${
                          selectedSessionId === String(sess.id) && isCurrentProject
                            ? 'text-on-primary'
                            : 'text-on-surface-variant/70 group-hover:text-primary'
                        }`}>
                          chat_bubble
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] leading-tight font-medium">
                            {sess.summary || `Sessão #${sess.id}`}
                          </p>
                          <div className={`flex items-center justify-between text-[9px] font-mono mt-0.5 ${
                            selectedSessionId === String(sess.id) && isCurrentProject
                              ? 'text-on-primary/80'
                              : 'text-on-surface-variant/60'
                          }`}>
                            <span>{sess.model}</span>
                            <span>{sess.message_count} msgs</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. Footer da Sidebar de Projetos: Botão Adicionar Projeto */}
        <div className="p-2.5 border-t border-outline-variant/60 bg-surface/90 shrink-0">
          <button
            onClick={() => setIsAddFolderOpen(true)}
            className="w-full h-8 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-primary font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs group"
          >
            <span className="material-symbols-outlined text-[16px] text-primary group-hover:scale-110 transition-transform">
              create_new_folder
            </span>
            <span>Adicionar Projeto / Pasta</span>
          </button>
        </div>
      </aside>

      {/* Modal de Adicionar Pasta Local Externa */}
      {isAddFolderOpen && (
        <AddFolderModal
          onClose={() => setIsAddFolderOpen(false)}
          onAdded={handleFolderAdded}
        />
      )}
    </>
  );
};
