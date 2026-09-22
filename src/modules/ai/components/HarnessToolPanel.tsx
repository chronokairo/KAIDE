'use client';

import React, { useState } from 'react';
import { PatchPreviewPanel } from './PatchPreviewPanel';
import { ContextFragmentsPanel } from './ContextFragmentsPanel';
import { HooksPanel } from './HooksPanel';
import { PromptTemplatesPanel } from './PromptTemplatesPanel';

export type ToolTab = 'patches' | 'context' | 'hooks' | 'prompts';

interface TabDef {
  id: ToolTab;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'patches', label: 'Diff & Patches', icon: 'code' },
  { id: 'context', label: 'Contexto', icon: 'description' },
  { id: 'hooks', label: 'Hooks', icon: 'webhook' },
  { id: 'prompts', label: 'Prompts', icon: 'chat' },
];

export const HarnessToolPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('patches');

  const renderPanel = () => {
    switch (activeTab) {
      case 'patches': return <PatchPreviewPanel />;
      case 'context': return <ContextFragmentsPanel />;
      case 'hooks': return <HooksPanel />;
      case 'prompts': return <PromptTemplatesPanel />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-outline-variant/60 overflow-hidden select-none">
      {/* Header: Clean Segmented Tab Bar estilo Codex / Claude Code / Antigravity */}
      <div className="px-3 py-2 border-b border-outline-variant/50 bg-surface/90 backdrop-blur-md shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-surface-container text-primary font-bold shadow-2xs border border-outline-variant/50'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
                title={tab.label}
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-3">
        {renderPanel()}
      </div>
    </div>
  );
};
