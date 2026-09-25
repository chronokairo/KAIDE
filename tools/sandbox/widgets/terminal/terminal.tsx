'use client';

import { useEffect, useRef } from 'react';

export interface TerminalOutput {
  type: 'command' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

export interface TerminalProps {
  outputs: TerminalOutput[];
  isRunning?: boolean;
  className?: string;
}

export function Terminal({ outputs, isRunning = false, className = '' }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputs]);

  const formatContent = (content: string): string => {
    if (typeof content === 'object') {
      return JSON.stringify(content);
    }
    return String(content);
  };

  return (
    <div className={`terminal ${className}`}>
      <div className="terminal-header">
        <span className="terminal-title">Terminal</span>
        {isRunning && <span className="terminal-status running">Running</span>}
      </div>
      <div className="terminal-body" ref={scrollRef}>
        {outputs.length === 0 ? (
          <div className="terminal-empty">
            <p>No output yet. Start a task to see execution results.</p>
          </div>
        ) : (
          outputs.map((output, index) => (
            <div key={index} className={`terminal-line terminal-${output.type}`}>
              <span className="terminal-timestamp">
                {new Date(output.timestamp).toLocaleTimeString()}
              </span>
              <span className="terminal-content">
                {output.type === 'command' && '$ '}
                {formatContent(output.content)}
              </span>
            </div>
          ))
        )}
        {isRunning && (
          <div className="terminal-line terminal-info">
            <span className="terminal-timestamp">
              {new Date().toLocaleTimeString()}
            </span>
            <span className="terminal-content animate-pulse">▋</span>
          </div>
        )}
      </div>
    </div>
  );
}
