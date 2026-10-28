"use client";

import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface ChatMessageBubbleProps {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: string;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ role, content, timestamp }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full my-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-primary text-on-primary rounded-tr-none'
            : 'bg-surface text-on-surface border border-outline-variant/40 rounded-tl-none'
        }`}
      >
        <div className="text-[11px] font-semibold mb-1 opacity-75 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[13px]">
            {isUser ? 'person' : 'smart_toy'}
          </span>
          <span>{isUser ? 'Você' : 'Chronokairo IA'}</span>
        </div>
        {isUser ? (
          <div className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{content}</div>
        ) : (
          <MarkdownRenderer content={content} />
        )}
        {timestamp && (
          <div className="text-[10px] opacity-60 text-right mt-1 font-mono">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};
