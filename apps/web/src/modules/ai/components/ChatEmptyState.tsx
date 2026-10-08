"use client";

import React from 'react';
import { REFERENCE_CARDS } from './chat-types';

interface Props {
  selectedProjectName: string;
  availableProjects: Array<{ name: string; path: string }>;
  showProjectDropdown: boolean;
  setShowProjectDropdown: (show: boolean) => void;
  onSelectProjectName?: (name: string) => void;
  sendMessage: (text: string) => void;
}

export const ChatEmptyState: React.FC<Props> = ({
  selectedProjectName,
  availableProjects,
  showProjectDropdown,
  setShowProjectDropdown,
  onSelectProjectName,
  sendMessage,
}) => {
  const renderProjectSelector = () => {
    if (availableProjects.length === 0) return null;

    return (
      <div className="relative mt-0.5 mb-4">
        <button
          onClick={() => setShowProjectDropdown(!showProjectDropdown)}
          className="flex items-center gap-1 text-xl md:text-2xl font-bold text-on-surface-variant/70 hover:text-primary transition-colors focus:outline-none"
        >
          <span>{selectedProjectName}</span>
          <span className="material-symbols-outlined text-[22px]">expand_more</span>
        </button>

        {showProjectDropdown && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-surface border border-outline-variant rounded-xl shadow-lg z-30 py-1 font-sans text-left">
            {availableProjects.map((proj) => (
              <button
                key={proj.path}
                onClick={() => {
                  onSelectProjectName?.(proj.name);
                  setShowProjectDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">folder</span>
                <span className="truncate">{proj.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2 min-h-[320px]">
      <div className="w-12 h-12 rounded-xl bg-surface border border-outline-variant/60 flex items-center justify-center text-primary shadow-xs mb-2">
        <span className="material-symbols-outlined text-[28px]">cloud</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight text-center">
        Let&apos;s build
      </h1>

      {renderProjectSelector()}

      <div className="w-full max-w-3xl mb-4">
        <div className="flex items-center justify-end mb-2 px-1">
          <button
            onClick={() => sendMessage('Liste exemplos de tarefas que posso executar')}
            className="text-xs font-semibold text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            Explore more
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REFERENCE_CARDS.map((card) => (
            <button
              key={card.title}
              onClick={() => sendMessage(card.prompt)}
              className="p-3.5 bg-surface-container-low/50 hover:bg-surface-container-high/60 border border-outline-variant/30 rounded-2xl text-left transition-all duration-200 group flex flex-col justify-between shadow-2xs hover:shadow-xs"
            >
              <div className="w-8 h-8 rounded-xl bg-surface border border-outline-variant/30 flex items-center justify-center mb-3 text-on-surface-variant group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">{card.icon}</span>
              </div>
              <span className="text-xs font-medium text-on-surface leading-snug">{card.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
