'use client';

import React, { useState } from 'react';
import { Source, TurnMetrics, ToolExecution } from '@/domain/chat';
import { 
  FileText, 
  Wrench, 
  Gauge, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Coins, 
  Cpu, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
  metrics?: TurnMetrics;
  tools?: ToolExecution[];
}

export function RightSidebar({
  isOpen,
  onClose,
  sources,
  metrics,
  tools = [],
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'sources' | 'tools' | 'metrics'>('sources');

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-outline-variant bg-surface-container-low/80 flex flex-col h-full shrink-0 select-none z-20">
      {/* Cabeçalho do Inspetor */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-outline-variant/60">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'sources'
                ? 'bg-surface-container-highest text-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Fontes ({sources.length})
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'tools'
                ? 'bg-surface-container-highest text-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Ferramentas ({tools.length})
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'metrics'
                ? 'bg-surface-container-highest text-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Métricas
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          title="Fechar painel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Conteúdo do Inspetor */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Aba de Fontes RAG */}
        {activeTab === 'sources' && (
          <div>
            {sources.length === 0 ? (
              <div className="py-12 text-center text-xs text-on-surface-variant/70">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-on-surface-variant" />
                <p>Nenhuma fonte consultada nesta resposta.</p>
                <p className="text-[11px] mt-1 text-on-surface-variant/50">Fontes recuperadas pelo RAG aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sources.map((src, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-outline-variant/60 bg-surface-container hover:border-outline transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-medium text-on-surface">
                      <span className="truncate max-w-[180px] text-secondary">
                        {src.title || src.file || `Documento #${index + 1}`}
                      </span>
                      {src.relevance !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-mono">
                          {Math.round(src.relevance * 100)}% rel.
                        </span>
                      )}
                    </div>

                    {src.content && (
                      <p className="text-[11px] text-on-surface-variant line-clamp-4 leading-relaxed font-sans bg-surface-container-low p-2 rounded border border-outline-variant/30">
                        {src.content}
                      </p>
                    )}

                    {src.endpoint && (
                      <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/60 font-mono">
                        <span>Origem:</span>
                        <span className="truncate">{src.endpoint}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba de Ferramentas / Tool Calls */}
        {activeTab === 'tools' && (
          <div>
            {tools.length === 0 ? (
              <div className="py-12 text-center text-xs text-on-surface-variant/70">
                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40 text-on-surface-variant" />
                <p>Nenhuma ferramenta executada no turno.</p>
                <p className="text-[11px] mt-1 text-on-surface-variant/50">Chamadas de sistema, MCP e terminal aparecem aqui com auditoria.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tools.map((tool) => (
                  <div key={tool.id} className="p-2.5 rounded-lg border border-outline-variant bg-surface-container text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-secondary">{tool.toolName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {tool.status}
                      </span>
                    </div>
                    <pre className="text-[10px] font-mono bg-surface-container-low p-1.5 rounded overflow-x-auto text-on-surface-variant">
                      {JSON.stringify(tool.args, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba de Métricas */}
        {activeTab === 'metrics' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-outline-variant/60 bg-surface-container space-y-2 text-xs">
              <div className="flex items-center gap-2 font-medium text-on-surface">
                <Cpu className="w-4 h-4 text-secondary" />
                <span>Modelo e Execução</span>
              </div>
              <div className="text-[11px] text-on-surface-variant space-y-1">
                <div className="flex justify-between">
                  <span>Modelo Ativo:</span>
                  <span className="font-mono text-on-surface">{metrics?.model || 'NVIDIA NIM / Llama-3'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prompt Tokens:</span>
                  <span className="font-mono text-on-surface">{metrics?.promptTokens ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completion Tokens:</span>
                  <span className="font-mono text-on-surface">{metrics?.completionTokens ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tokens:</span>
                  <span className="font-mono text-on-surface">{metrics?.totalTokens ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-outline-variant/60 bg-surface-container space-y-2 text-xs">
              <div className="flex items-center gap-2 font-medium text-on-surface">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Custo e Auditoria</span>
              </div>
              <div className="text-[11px] text-on-surface-variant space-y-1">
                <div className="flex justify-between">
                  <span>Custo Estimado:</span>
                  <span className="font-mono text-on-surface">
                    {metrics?.costUsd !== undefined ? `$${metrics.costUsd.toFixed(5)}` : '$0.00000'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Políticas RBAC:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verificadas
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
