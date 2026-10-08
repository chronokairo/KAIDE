'use client';

import React from 'react';
import { ThemeProvider } from '@chronokairo/platform/ui';
import { useChat } from '@/application/use-cases/use-chat';
import { AppBar } from './AppBar';
import { LeftSidebar } from './LeftSidebar';
import { Body } from './Body';
import { RightSidebar } from './RightSidebar';

interface AppShellProps {
  initialTab?: 'chat' | 'search' | 'agentes' | 'settings';
}

function AppShellInner({ initialTab }: AppShellProps) {
  const {
    messages,
    conversations,
    activeConversationId,
    isLoading,
    input,
    setInput,
    activeTab,
    setActiveTab,
    leftSidebarOpen,
    setLeftSidebarOpen,
    rightSidebarOpen,
    setRightSidebarOpen,
    activeSources,
    activeMetrics,
    activeTools,
    sendMessage,
    selectConversation,
    newConversation,
    deleteConversation,
    clearMessages,
  } = useChat();

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, setActiveTab]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-on-background overflow-hidden font-sans antialiased">
      {/* 1. APPBAR (Topo) */}
      <AppBar
        leftSidebarOpen={leftSidebarOpen}
        onToggleLeftSidebar={() => setLeftSidebarOpen((prev) => !prev)}
        rightSidebarOpen={rightSidebarOpen}
        onToggleRightSidebar={() => setRightSidebarOpen((prev) => !prev)}
        onNewChat={newConversation}
        hasMessages={messages.length > 0}
        activeTabTitle={
          activeTab === 'chat'
            ? 'Chat & RAG'
            : activeTab === 'search'
            ? 'Busca Semântica'
            : activeTab === 'agentes'
            ? 'Central de Agentes'
            : 'Configurações'
        }
      />

      {/* ÁREA PRINCIPAL (Sidebars + Body) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* 2. SIDEBAR ESQUERDA (Navegação & Histórico) */}
        <LeftSidebar
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={newConversation}
          onDeleteConversation={deleteConversation}
        />

        {/* 3. BODY (Área de Trabalho / Chat / Visões) */}
        <Body
          activeTab={activeTab}
          messages={messages}
          isLoading={isLoading}
          input={input}
          onInputChange={setInput}
          onSendMessage={sendMessage}
          onClearChat={clearMessages}
          onInspectSources={() => setRightSidebarOpen(true)}
        />

        {/* 4. SIDEBAR DIREITA (Inspetor de Fontes & Ferramentas) */}
        <RightSidebar
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          sources={activeSources}
          metrics={activeMetrics}
          tools={activeTools}
        />
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <ThemeProvider>
      <AppShellInner {...props} />
    </ThemeProvider>
  );
}

export default AppShell;
