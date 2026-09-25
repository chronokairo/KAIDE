'use client';

import MarkdownRenderer from './MarkdownRenderer';
import type { Message } from '../chat/types';

export default function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'anna') {
    return (
      <div>
        <div className="rounded-lg rounded-bl-none p-3 shadow-sm" style={{ maxWidth: '50%', backgroundColor: '#eef2ff' }}>
          <MarkdownRenderer content={msg.content} className="text-sm text-gray-800" />

          {msg.usedSources && msg.usedSources.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Anexos usados:</span>
              {msg.usedSources.map((src) => (
                <span
                  key={src.id}
                  title={src.name}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px]"
                >
                  <span className="material-symbols-outlined text-[12px]">description</span>
                  {src.name.length > 24 ? src.name.slice(0, 24) + '\u2026' : src.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="mt-1 ml-1 text-[10px] text-gray-400">Anna AI</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <div className="bg-primary text-white rounded-lg rounded-br-none p-3 shadow-sm" style={{ maxWidth: '50%' }}>
        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
      </div>
      <span className="mt-1 mr-1 text-[10px] text-gray-400">Você</span>
    </div>
  );
}
