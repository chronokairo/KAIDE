"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SideNavBar, DEV_PROJECT_CHANGE_EVENT, DEV_SESSION_CHANGE_EVENT } from '@/shared/components/dashboard/SideNavBar';
import { TopNavBar } from '@/shared/components/dashboard/TopNavBar';
import { BottomNavBar } from '@/shared/components/dashboard/BottomNavBar';
import { TerminalBottomPanel } from '@/shared/components/dashboard/TerminalBottomPanel';
import { useLayoutPanels } from '@/providers/LayoutPanelsProvider';
import { useHarnessMode } from '@/providers/HarnessModeProvider';
import { useHarnessOverview } from '@/modules/dev/hooks/useHarness';

// Core View Components
import { AiChatInterface } from '@/modules/ai/components/AiChatInterface';
import { HarnessThread } from '@/modules/ai/components/Thread';
import { AiCommandPalette } from '@/modules/ai/components/AiCommandPalette';
import { DevProjectsTab } from '@/modules/ai/components/DevProjectsTab';
import { DevGitHubNotificationsTab } from '@/modules/github-notifications/components/DevGitHubNotificationsTab';
import { DevSessoesTab } from '@/modules/ai/components/DevSessoesTab';
import { DevAgentesTab } from '@/modules/ai/components/DevAgentesTab';
import { DevAutomacoesTab } from '@/modules/ai/components/DevAutomacoesTab';
import { DevSkillsTab } from '@/modules/ai/components/DevSkillsTab';
import { DevToolboxTab } from '@/modules/ai/components/DevToolboxTab';
import { DevMemoriaTab } from '@/modules/ai/components/DevMemoriaTab';
import { DevBrowserPanel } from '@/modules/ai/components/DevBrowserPanel';
import { IntelligencePanel } from '@/modules/ai/components/IntelligencePanel';
import { PatchPreviewPanel } from '@/modules/ai/components/PatchPreviewPanel';
import { ContextFragmentsPanel } from '@/modules/ai/components/ContextFragmentsPanel';
import { HooksPanel } from '@/modules/ai/components/HooksPanel';
import { PromptTemplatesPanel } from '@/modules/ai/components/PromptTemplatesPanel';
import { DiagnosticsPanel } from '@/modules/ai/components/DiagnosticsPanel';
import { GitAttributionPanel } from '@/modules/ai/components/GitAttributionPanel';
import { ExecPolicyPanel } from '@/modules/ai/components/ExecPolicyPanel';
import { FileSearchPanel } from '@/modules/ai/components/FileSearchPanel';
import { DevConfiguracoesTab } from '@/modules/ai/components/DevConfiguracoesTab';
import { PdfTranslatorTab } from '@/modules/ai/components/PdfTranslatorTab';

export default function DesktopHome() {
  const { activeNavTab, setActiveNavTab } = useLayoutPanels();
  const { isHarnessMode } = useHarnessMode();
  const { result: overviewResult } = useHarnessOverview();
  const projects = overviewResult?.data?.repos ?? [];

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{ id: string; numericId?: number; title: string }>({
    id: 'session-main',
    title: 'Sessão Principal de Inteligência',
  });

  // Sync initial tab and project from URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const projectParam = params.get('project');

    if (tabParam) {
      setActiveNavTab(tabParam);
    }
    if (projectParam) {
      setSelectedPath(projectParam);
    }

    const onProjectChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setSelectedPath(detail);
    };

    const onTabChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setActiveNavTab(detail);
    };

    const onSessionChange = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; title: string; project?: string }>).detail;
      if (detail) {
        if (detail.project) setSelectedPath(detail.project);
        setActiveSession({ id: detail.id, title: detail.title });
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
  }, [setActiveNavTab]);

  const selectedProject = useMemo(() => {
    return (
      projects.find((p) => p.path === selectedPath || p.name === selectedPath) ??
      projects[0] ?? { name: 'desktop', path: 'desktop', branch: 'main' }
    );
  }, [projects, selectedPath]);

  const handleSelectProject = useCallback((pathOrName: string) => {
    setSelectedPath(pathOrName);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('project', pathOrName);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  }, []);

  const renderActiveView = () => {
    switch (activeNavTab) {
      case 'chat':
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {isHarnessMode ? (
              <HarnessThread />
            ) : (
              <AiChatInterface
                sessionId={activeSession.numericId || null}
                selectedProjectName={selectedProject.name}
                availableProjects={projects.map((p) => p.name)}
                onSelectProjectName={handleSelectProject}
              />
            )}
          </div>
        );

      case 'projetos':
        return <DevProjectsTab />;

      case 'notifications':
      case 'github-notifications':
        return <DevGitHubNotificationsTab />;

      case 'sessoes':
        return <DevSessoesTab />;

      case 'agentes':
        return <DevAgentesTab />;

      case 'automacoes':
        return <DevAutomacoesTab />;

      case 'skills':
        return <DevSkillsTab />;

      case 'toolbox':
        return <DevToolboxTab />;

      case 'memoria':
        return <DevMemoriaTab />;

      case 'browser':
        return <DevBrowserPanel initialUrl="https://github.com/chronokairo/desktop" isCollapsible={false} />;

      case 'pdf-translator':
      case 'pdf':
      case 'tradutor-pdf':
        return <PdfTranslatorTab />;

      case 'intelligence':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <IntelligencePanel />
          </div>
        );

      case 'patches':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <PatchPreviewPanel />
          </div>
        );

      case 'contexto':
      case 'context':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <ContextFragmentsPanel />
          </div>
        );

      case 'hooks':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <HooksPanel />
          </div>
        );

      case 'prompts':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <PromptTemplatesPanel />
          </div>
        );

      case 'diagnostics':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <DiagnosticsPanel />
          </div>
        );

      case 'policy':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <ExecPolicyPanel />
          </div>
        );

      case 'files':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <FileSearchPanel />
          </div>
        );

      case 'attribution':
        return (
          <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <GitAttributionPanel />
          </div>
        );

      case 'configuracoes':
      case 'settings':
      case 'providers':
        return <DevConfiguracoesTab />;

      default:
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <AiChatInterface
              sessionId={activeSession.numericId || null}
              selectedProjectName={selectedProject.name}
              availableProjects={projects.map((p) => p.name)}
              onSelectProjectName={handleSelectProject}
            />
          </div>
        );
    }
  };

  return (
    <div className="bg-[#0d0f12] text-[#f2f2f2] min-h-screen h-screen flex font-sans overflow-hidden antialiased select-none">
      {/* 1. Canonical Collapsible Sidebar (Left) */}
      <SideNavBar />

      {/* 2. Main Application Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* 3. Top Navigation Bar */}
        <TopNavBar />

        {/* 4. Dynamic Workspace View */}
        <main className="flex-1 flex overflow-hidden bg-[#111318] relative">
          {renderActiveView()}
        </main>

        {/* 5. Mobile / Compact Bottom Bar */}
        <BottomNavBar />

        {/* 6. Global PTY Terminal & Harness Activity Stream (Ctrl+`) */}
        <TerminalBottomPanel />

        {/* 7. Global Spotlight Command Palette (Ctrl+K) */}
        <AiCommandPalette />
      </div>
    </div>
  );
}
