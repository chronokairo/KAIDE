import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  Code, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  RotateCw, 
  StopCircle, 
  Layers, 
  ArrowUpRight,
  Shield,
  FileCode2,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Minimize2
} from 'lucide-react';
import { Session, Agent, ChatMessage, ToolCall } from '../types';

interface ChatViewProps {
  session: Session;
  agents: Agent[];
  activeAgent: Agent;
  onSelectAgent: (agentId: string) => void;
  onSendMessage: (content: string) => void;
  onCompactSession: () => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  session,
  agents,
  activeAgent,
  onSelectAgent,
  onSendMessage,
  onCompactSession,
  isStreaming,
  onStopStreaming
}) => {
  const [input, setInput] = useState('');
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isStreaming]);

  const toggleTool = (toolId: string) => {
    setExpandedTools(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const tokenPercent = Math.min(100, Math.round((session.tokenUsage / session.maxTokens) * 100));

  const promptSuggestions = [
    "Check gateway connection and diagnostic health for Discord and Slack",
    "Audit all SecretRef credential bindings across plugins",
    "Run AST diagnostics across /terminal/extensions/acpx",
    "Synthesize the current session transcript into active vector memory"
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-zinc-950">
      {/* Session Top Bar */}
      <div className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeAgent.avatar}</span>
            <select
              value={activeAgent.id}
              onChange={(e) => onSelectAgent(e.target.value)}
              className="bg-zinc-800 text-zinc-100 font-semibold text-xs rounded-lg px-2.5 py-1.5 border border-zinc-700 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          <span className="text-zinc-600">/</span>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
              {activeAgent.model}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {activeAgent.permissionMode}
            </span>
          </div>
        </div>

        {/* Context Usage Bar */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] font-mono text-zinc-300">
              {session.tokenUsage.toLocaleString()} / {session.maxTokens.toLocaleString()} tokens
            </div>
            <div className="w-32 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full transition-all duration-500 ${
                  tokenPercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
          </div>

          {tokenPercent >= 50 && (
            <button
              onClick={onCompactSession}
              title="Prune and compact session context"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition"
            >
              <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compact</span>
            </button>
          )}
        </div>
      </div>

      {/* Compaction Warning if Context is High */}
      {tokenPercent > 80 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>
              High context pressure ({tokenPercent}% capacity). Automated KAIROS compaction recommended to preserve performance.
            </span>
          </div>
          <button
            onClick={onCompactSession}
            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-medium transition"
          >
            Compact Transcript Now
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {session.messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1.5 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">
                  {isUser ? 'Operator' : msg.agentName || activeAgent.name}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">{msg.timestamp}</span>
                {msg.tokenCount && (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    ({msg.tokenCount.total} tokens)
                  </span>
                )}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`p-4 rounded-xl text-sm leading-relaxed border ${
                  isUser
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-100 rounded-tr-xs'
                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-100 rounded-tl-xs shadow-sm w-full'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Tool Execution Cards (Agent Action Streams) */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-4 space-y-2.5 pt-3 border-t border-zinc-800/80">
                    <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tool Execution Pipeline ({msg.toolCalls.length})</span>
                    </div>

                    {msg.toolCalls.map((tool) => {
                      const isExpanded = expandedTools[tool.id] !== false;

                      return (
                        <div
                          key={tool.id}
                          className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden text-xs"
                        >
                          {/* Tool Header */}
                          <div
                            onClick={() => toggleTool(tool.id)}
                            className="px-3 py-2 bg-zinc-900/80 flex items-center justify-between cursor-pointer hover:bg-zinc-800/60 transition"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                              )}
                              <span className="font-mono font-bold text-emerald-400">
                                {tool.name}
                              </span>
                              <span className="text-zinc-500 font-mono text-[11px] truncate max-w-xs">
                                {JSON.stringify(tool.args)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {tool.durationMs && (
                                <span className="font-mono text-[10px] text-zinc-400">
                                  {tool.durationMs}ms
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                tool.status === 'completed' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {tool.status}
                              </span>
                            </div>
                          </div>

                          {/* Tool Details / Output Body */}
                          {isExpanded && (
                            <div className="p-3 bg-zinc-950 space-y-2 border-t border-zinc-800/80 font-mono text-xs">
                              {/* Arguments */}
                              <div>
                                <div className="text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                                  Parameters
                                </div>
                                <pre className="p-2 rounded bg-zinc-900 text-zinc-300 overflow-x-auto">
                                  {JSON.stringify(tool.args, null, 2)}
                                </pre>
                              </div>

                              {/* Execution Result */}
                              {tool.result && (
                                <div>
                                  <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                                    <span>Output</span>
                                    <button
                                      onClick={() => handleCopy(tool.result!, tool.id)}
                                      className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition"
                                    >
                                      {copiedId === tool.id ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                  <pre className="p-2.5 rounded bg-zinc-900/90 text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-800/50">
                                    {tool.result}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Streaming Indicator */}
        {isStreaming && (
          <div className="flex flex-col items-start max-w-4xl mr-auto space-y-2 animate-pulse">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-semibold text-emerald-400">{activeAgent.name}</span>
              <span className="text-[10px] text-zinc-400">Executing agent turn...</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 text-zinc-200 text-sm flex items-center gap-3 w-full">
              <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Streaming token stream and resolving tool invocations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (if session has few messages) */}
      {session.messages.length <= 2 && (
        <div className="px-6 py-2 border-t border-zinc-800/60 bg-zinc-950/60">
          <div className="text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Suggested Agent Directives:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(s)}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition text-left cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Composer */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/70 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={`Message ${activeAgent.name}... (Press Enter to send, Shift+Enter for new line)`}
            rows={2}
            disabled={isStreaming}
            className="w-full bg-zinc-950 text-zinc-100 rounded-xl px-4 py-3 pr-24 border border-zinc-700/80 focus:outline-hidden focus:border-emerald-500 text-sm resize-none disabled:opacity-50"
          />

          <div className="absolute right-3 flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition cursor-pointer flex items-center gap-1 text-xs"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium transition cursor-pointer flex items-center justify-center shadow-lg shadow-emerald-950/50"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>Mode: <strong className="text-zinc-300 font-mono">Connected WebSocket</strong></span>
            <span>Auth: <strong className="text-emerald-400 font-mono">SecretRef Active</strong></span>
          </div>
          <div>
            Type <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">/stop</code> to abort running turn
          </div>
        </div>
      </div>
    </div>
  );
};
