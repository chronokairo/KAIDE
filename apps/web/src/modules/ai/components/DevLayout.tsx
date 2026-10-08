'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SideNavBar, DEV_PROJECT_CHANGE_EVENT, DEV_SESSION_CHANGE_EVENT } from '@/shared/components/dashboard/SideNavBar';
import { TopNavBar } from '@/shared/components/dashboard/TopNavBar';
import { useHarnessOverview } from '@/modules/dev/hooks/useHarness';
import { useLayoutPanels } from '@/providers/LayoutPanelsProvider';
import { useHarnessMode } from '@/providers/HarnessModeProvider';
import { DevBrowserPanel } from './DevBrowserPanel';
import { AiChatInterface } from '@/modules/ai/components/AiChatInterface';
import { HarnessThread } from '@/modules/ai/components/Thread';
import { HarnessTopBar, HarnessViewMode } from './HarnessTopBar';
import { DevConfiguracoesTab } from './DevConfiguracoesTab';
import { DevSkillsTab } from './DevSkillsTab';
import { DevAgentesTab } from './DevAgentesTab';
import { DevAutomacoesTab } from './DevAutomacoesTab';
import { DevMemoriaTab } from './DevMemoriaTab';
import { DevSessoesTab } from './DevSessoesTab';
import { DevGitHubNotificationsTab } from '@/modules/github-notifications/components/DevGitHubNotificationsTab';
import { PatchPreviewPanel } from './PatchPreviewPanel';
import { ContextFragmentsPanel } from './ContextFragmentsPanel';
import { HooksPanel } from './HooksPanel';
import { PromptTemplatesPanel } from './PromptTemplatesPanel';

type DevTabId = 'chat' | 'dev';

const TABS: { id: DevTabId; label: string; icon: string }[] = [
  { id: 'chat', label: 'Chat', icon: 'forum' },
  { id: 'dev', label: 'Dev', icon: 'terminal' },
];

function readSearchParams() {
  if (typeof window === 'undefined') return { project: null, tab: 'chat' as DevTabId, rawTab: null as string | null };
  const params = new URLSearchParams(window.location.search);
  const project = params.get('project');
  const rawTab = params.get('tab');
  const tabParam = rawTab as DevTabId | null;
  const tab = tabParam && (tabParam === 'chat' || tabParam === 'dev') ? tabParam : 'chat';
  return { project, tab, rawTab };
}

export const DevLayout: React.FC = () => {
  const { result } = useHarnessOverview();
  const overview = result?.data;
  const projects = overview?.repos ?? [];
  const { isLeftSidebarOpen, toggleLeftSidebar } = useLayoutPanels();
  const { isHarnessMode } = useHarnessMode();

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DevTabId>('chat');
  const [activeNavTab, setActiveNavTab] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<HarnessViewMode>('chat');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [activeThread, setActiveThread] = useState<{ id: string; numericId?: number; title: string }>({
    id: 'sess-erp-1',
    title: 'Refatoração da Arquitetura DDD e Navegação',
  });

  useEffect(() => {
    const initial = readSearchParams();
    setSelectedPath(initial.project);
    setActiveTab(initial.tab);
    setActiveNavTab(initial.rawTab);

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    setActiveNavTab(tabParam);

    if (tabParam === 'preview' || tabParam === 'browser') {
      setViewMode('preview');
    } else if (tabParam === 'chat' || !tabParam) {
      setViewMode('chat');
    }

    const onProjectChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setSelectedPath(detail);
    };
    const onTabChange = (e: Event) => {
      const detail = (e as CustomEvent<DevTabId>).detail;
      if (typeof detail === 'string') setActiveTab(detail);
    };
    const onSessionChange = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; title: string; project?: string }>).detail;
      if (detail) {
        if (detail.project) setSelectedPath(detail.project);
        setActiveThread({ id: detail.id, title: detail.title });
      }
    };

    window.addEventListener(DEV_PROJECT_CHANGE_EVENT, onProjectChange);
    window.addEventListener('dev:tab-change', onTabChange);
    window.addEventListener(DEV_SESSION_CHANGE_EVENT, onSessionChange);
    return () => {
      window.removeEventListener(DEV_PROJECT_CHANGE_EVENT, onProjectChange);
      window.removeEventListener('dev:tab-change', onTabChange);
      window.removeEventListener(DEV_SESSION_CHANGE_EVENT, onSessionChange);
    };
  }, []);

  const syncUrl = useCallback((project: string | null, tab: DevTabId) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (project) params.set('project', project);
    params.set('tab', tab);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => p.path === selectedPath || p.name === selectedPath) ?? (projects[0] || { name: 'erp', path: 'erp' }),
    [projects, selectedPath],
  );

  const handleSelectProject = (pathOrName: string) => {
    const matched = projects.find((p) => p.path === pathOrName || p.name === pathOrName);
    const path = matched ? matched.path : pathOrName;
    setSelectedPath(path);
    syncUrl(path, activeTab);
  };

  const handleToggleTheater = (theater: boolean) => {
    setIsTheaterMode(theater);
    if (theater && isLeftSidebarOpen) {
      toggleLeftSidebar();
    }
  };

  const isSettingsActive = activeNavTab === 'configuracoes' || activeNavTab === 'settings' || activeNavTab === 'providers';

  const renderSubView = () => {
    switch (activeNavTab) {
      case 'sessoes':
        return <DevSessoesTab />;
      case 'notifications':
      case 'github-notifications':
        return <DevGitHubNotificationsTab />;
      case 'patches':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-5xl">
            <PatchPreviewPanel />
          </div>
        );
      case 'contexto':
      case 'context':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-5xl">
            <ContextFragmentsPanel />
          </div>
        );
      case 'skills':
        return <DevSkillsTab />;
      case 'agentes':
        return <DevAgentesTab />;
      case 'automacoes':
        return <DevAutomacoesTab />;
      case 'hooks':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-5xl">
            <HooksPanel />
          </div>
        );
      case 'prompts':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-5xl">
            <PromptTemplatesPanel />
          </div>
        );
      case 'memoria':
        return <DevMemoriaTab />;
      default:
        return null;
    }
  };

  const isDedicatedSubView = activeNavTab && [
    'notifications', 'github-notifications', 'sessoes', 'patches', 'contexto', 'context', 'skills',
    'agentes', 'automacoes', 'hooks', 'prompts', 'memoria'
  ].includes(activeNavTab);

  return (
    <div className="bg-surface text-primary min-h-screen flex font-sans overflow-x-hidden antialiased">
      {/* 1. Canonical SideNavBar (Minimizável) */}
      <SideNavBar />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* 3. TopBar — HarnessTopBar quando em harnessMode, TopNavBar caso contrário */}
        {isHarnessMode ? (
          <HarnessTopBar
            activeSessionTitle={activeThread.title}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
          />
        ) : (
          <TopNavBar />
        )}

        {/* 4. Área de Trabalho Principal */}
        <main className="flex-1 flex overflow-hidden bg-background">
          {isSettingsActive ? (
            <div className="flex-1 h-full overflow-hidden">
              <DevConfiguracoesTab />
            </div>
          ) : isDedicatedSubView ? (
            <div className="flex-1 h-full overflow-hidden">
              {renderSubView()}
            </div>
          ) : (
            <>
              {/* Chat / Transcript central */}
              <div className="flex flex-col h-full overflow-hidden flex-1 min-w-0">
                {isHarnessMode ? (
                  <HarnessThread />
                ) : (
                  <AiChatInterface
                    sessionId={activeThread.numericId || null}
                    selectedProjectName={selectedProject?.name || 'erp'}
                    availableProjects={[]}
                    onSelectProjectName={handleSelectProject}
                  />
                )}
              </div>

              {/* Sidebar Lateral de Preview do Browser (Expansível / Drawer) */}
              {viewMode === 'preview' && (
                <div className={`h-full border-l border-outline-variant/60 bg-surface transition-all duration-300 overflow-hidden flex flex-col shrink-0 ${
                  isTheaterMode ? 'w-[640px] xl:w-[820px]' : 'w-[420px] xl:w-[500px]'
                }`}>
                  <DevBrowserPanel
                    initialUrl="http://localhost:3000/"
                    isCollapsible={true}
                    isTheaterMode={isTheaterMode}
                    onToggleTheaterMode={handleToggleTheater}
                    onClose={() => setViewMode('chat')}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
