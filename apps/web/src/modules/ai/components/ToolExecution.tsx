"use client";

import React from 'react';

interface ToolExecutionProps {
  toolName: string;
  status: 'running' | 'completed' | 'failed';
  resultData?: any;
}

export const ToolExecution: React.FC<ToolExecutionProps> = ({ toolName, status, resultData }) => {
  return (
    <div className="my-2 p-3 bg-zinc-900 border border-zinc-700/60 rounded-xl text-xs font-mono text-zinc-300">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-teal-400">⚡ Ferramenta Consultada: {toolName}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            status === 'completed'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : status === 'running'
              ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
              : 'bg-rose-950 text-rose-400 border border-rose-800'
          }`}
        >
          {status.toUpperCase()}
        </span>
      </div>
      {resultData && (
        <pre className="mt-2 p-2 bg-black/40 rounded border border-zinc-800 overflow-x-auto text-[11px] text-zinc-400">
          {JSON.stringify(resultData, null, 2)}
        </pre>
      )}
    </div>
  );
};
