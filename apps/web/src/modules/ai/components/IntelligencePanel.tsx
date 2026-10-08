'use client';

import React, { useState } from 'react';
import { useGraphData, useVerificationReport, useAskIntelligenceAgent, useIsTauri } from '@/modules/dev/hooks/useHarness';
import { MarkdownRenderer } from '@/modules/ai/components/MarkdownRenderer';

interface IntelligencePanelProps {
  defaultTargetName?: string;
  defaultTargetDoc?: string;
}

const DEMO_GRAPH = {
  target: 'N.L. Serviços Médicos LTDA',
  total_entities: 6,
  total_connections: 8,
  hidden_nexus_count: 1,
  nodes: [
    { id: '1', label: 'Audiomed Manaus (N.L. Serviços)', sub_label: '04.281.930/0001-99', node_type: 'company', risk_score: 0.15, origin: 'Receita Federal' },
    { id: '2', label: 'Dra. Laura Nery', sub_label: 'Sócia Administradora', node_type: 'person', risk_score: 0.10, origin: 'JCEAM' },
    { id: '3', label: 'Unidade Ocupacional Adrianópolis', sub_label: 'Filial Operacional', node_type: 'company', risk_score: 0.18, origin: 'CNES' },
    { id: '4', label: 'Auditoria Notificação TJAM', sub_label: 'BO-08491/2026', node_type: 'legal_case', risk_score: 0.45, origin: 'TJAM/DIP' },
  ],
  edges: [
    { id: 'e1', source: 'Dra. Laura Nery', target: 'Audiomed Manaus (N.L. Serviços)', label: 'Sócia / Diretora Técnica', verified: true },
    { id: 'e2', source: 'Audiomed Manaus (N.L. Serviços)', target: 'Unidade Ocupacional Adrianópolis', label: 'Matriz / Unidade', verified: true },
    { id: 'e3', source: 'Audiomed Manaus (N.L. Serviços)', target: 'Auditoria Notificação TJAM', label: 'Contra-Notificação', verified: true },
  ],
};

const DEMO_VERIFICATION = {
  target: 'N.L. Serviços Médicos LTDA',
  score_global_confiabilidade: 0.95,
  lgpd_compliance_status: 'CONFORME (Art. 7º, IX - Legítimo Interesse)',
  total_evidencias_auditadas: 6,
  evidencias_confirmadas: 5,
  alertas_inconsistencia: 1,
  evidencias: [
    { id: 'ev1', fonte: 'Receita Federal / CNPJ', item: 'Situação Cadastral: ATIVA - Manaus/AM', status_validacao: 'CONFIRMADO', score_confianca: 0.99, hash_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' },
    { id: 'ev2', fonte: 'Junta Comercial do AM', item: 'Quadro de Sócios e Administradores regular', status_validacao: 'CONFIRMADO', score_confianca: 0.97, hash_sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' },
    { id: 'ev3', fonte: 'Tribunal de Justiça do AM', item: 'Certidão Distribuidores Cíveis', status_validacao: 'AUDITADO', score_confianca: 0.92, hash_sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a' },
  ],
};

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  defaultTargetName = 'Audiomed Manaus',
  defaultTargetDoc = '04.281.930/0001-99',
}) => {
  const isTauri = useIsTauri();
  const [targetName, setTargetName] = useState(defaultTargetName);
  const [targetDoc, setTargetDoc] = useState(defaultTargetDoc);
  const [activeView, setActiveView] = useState<'graph' | 'verification'>('graph');

  const { result: graphResult, loading: loadingGraph, error: graphError, refresh: refreshGraph } = useGraphData(targetName, targetDoc);
  const { result: verificationResult, loading: loadingVerification, error: verificationError, refresh: refreshVerification } = useVerificationReport(targetName, targetDoc);
  const { ask, sending, lastError: askError } = useAskIntelligenceAgent();
  const [askQuery, setAskQuery] = useState('');
  const [askResult, setAskResult] = useState<string | null>(null);

  const rawGraph = graphResult?.data;
  const graph = rawGraph ?? (!isTauri ? DEMO_GRAPH : undefined);

  const rawVerification = verificationResult?.data;
  const verification = rawVerification ?? (!isTauri ? DEMO_VERIFICATION : undefined);

  const handleAsk = async () => {
    if (!askQuery.trim() || sending) return;
    if (!isTauri) {
      setAskResult(`[SIMULAÇÃO IA] Com base no grafo de inteligência de "${targetName}", a entidade possui situação cadastral ativa e 1 vínculo societário auditado com conformidade LGPD.`);
      return;
    }
    const res = await ask(askQuery, { targetName, targetDoc });
    setAskResult(res?.data ?? null);
  };

  return (
    <div className="space-y-3 text-primary">
      {/* Web Mode Banner */}
      {!isTauri && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
            <span className="truncate">
              <strong>Modo Web:</strong> Grafo e auditoria de inteligência em modo demonstração. Varredura OSINT nativa requer o Tauri Desktop.
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-900 shrink-0">
            PREVIEW
          </span>
        </div>
      )}

      {(graphError || verificationError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{graphError || verificationError}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-surface/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary tracking-tight">Inteligência & OSINT</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Grafo de relacionamentos, nexos ocultos e verificação de evidências.
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[18px]">hub</span>
          </div>
        </div>

        {/* Target Input */}
        <div className="p-3.5 border-b border-outline-variant/30 space-y-3 bg-surface/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-on-surface-variant block mb-1">
                Nome do Alvo
              </label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="Ex: Audiomed Manaus"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-on-surface-variant block mb-1">
                Documento / CNPJ
              </label>
              <input
                type="text"
                value={targetDoc}
                onChange={(e) => setTargetDoc(e.target.value)}
                placeholder="Ex: 04.281.930/0001-99"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (isTauri) {
                  refreshGraph();
                  refreshVerification();
                }
              }}
              disabled={!targetName || loadingGraph || loadingVerification}
              className="h-8 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs"
            >
              {(loadingGraph || loadingVerification) ? (
                <>
                  <span className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  <span>Analisando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">search</span>
                  <span>Analisar Alvo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="p-3 border-b border-outline-variant/30 bg-surface/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('graph')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'graph'
                  ? 'bg-primary text-on-primary shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">hub</span>
              <span>Grafo de Vínculos</span>
            </button>
            <button
              onClick={() => setActiveView('verification')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'verification'
                  ? 'bg-primary text-on-primary shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>Auditoria de Evidências</span>
            </button>
          </div>
        </div>

        {/* Ask Intelligence Agent */}
        <div className="p-3.5 border-b border-outline-variant/30 space-y-2 bg-surface-container-low/20">
          <div className="text-xs font-bold text-primary">Consultar Agente de Inteligência</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Faça uma pergunta sobre o alvo (ex: Quais os riscos trabalhistas?)"
              className="flex-1 px-3 h-8 text-xs bg-surface-container-lowest border border-outline-variant/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary"
            />
            <button
              onClick={handleAsk}
              disabled={sending || !askQuery.trim()}
              className="h-8 px-3.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-2xs"
            >
              {sending ? '...' : 'Perguntar'}
            </button>
          </div>
          {askError && <p className="text-xs text-error">{askError}</p>}
          {askResult && (
            <div className="p-3 rounded-xl bg-surface-container-low text-xs text-primary leading-relaxed animate-in fade-in duration-150">
              <MarkdownRenderer content={askResult} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          {activeView === 'graph' ? (
            <div className="space-y-4">
              {/* Graph Stats */}
              {graph && (
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-surface-container-low/60 rounded-xl p-3 text-center">
                    <div className="font-bold text-base text-primary">{graph.total_entities}</div>
                    <div className="text-[10px] text-on-surface-variant font-mono uppercase">Entidades</div>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-xl p-3 text-center">
                    <div className="font-bold text-base text-primary">{graph.total_connections}</div>
                    <div className="text-[10px] text-on-surface-variant font-mono uppercase">Conexões</div>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-xl p-3 text-center">
                    <div className="font-bold text-base text-amber-700">{graph.hidden_nexus_count}</div>
                    <div className="text-[10px] text-on-surface-variant font-mono uppercase">Nexos Ocultos</div>
                  </div>
                </div>
              )}

              {/* Nodes List */}
              {graph && graph.nodes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-primary">Entidades Identificadas</h4>
                  <div className="divide-y divide-outline-variant/20 max-h-56 overflow-y-auto no-scrollbar">
                    {graph.nodes.map((node) => (
                      <div key={node.id} className="py-2.5 flex items-center justify-between hover:bg-surface-container-low/30 rounded-lg px-1 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            node.node_type === 'person' ? 'bg-blue-500' :
                            node.node_type === 'company' ? 'bg-emerald-500' :
                            node.node_type === 'legal_case' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`} />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-primary truncate">{node.label}</div>
                            <div className="text-[10px] text-on-surface-variant font-mono">{node.sub_label}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className={`text-[10px] font-bold ${
                            (node.risk_score ?? 0) > 0.4 ? 'text-red-700' : 'text-emerald-700'
                          }`}>
                            Score: {((node.risk_score ?? 0) * 100).toFixed(0)}%
                          </div>
                          <div className="text-[9px] text-on-surface-variant font-mono">{node.origin}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edges List */}
              {graph && graph.edges.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                  <h4 className="text-xs font-bold text-primary">Relacionamentos & Vínculos</h4>
                  <div className="divide-y divide-outline-variant/20 max-h-40 overflow-y-auto no-scrollbar">
                    {graph.edges.map((edge) => (
                      <div key={edge.id} className="py-2 flex items-center justify-between text-xs">
                        <div className="text-primary truncate">
                          {edge.source} → {edge.target}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono">
                            {edge.label}
                          </span>
                          {edge.verified && (
                            <span className="material-symbols-outlined text-emerald-600 text-[14px]">check_circle</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Verification Stats */}
              {verification && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="bg-surface-container-low/60 rounded-xl p-3">
                    <div className="text-[10px] text-on-surface-variant mb-1 font-mono uppercase">Score de Confiabilidade</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: `${(verification.score_global_confiabilidade ?? 0) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-sm text-primary font-mono">
                        {((verification.score_global_confiabilidade ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-xl p-3">
                    <div className="text-[10px] text-on-surface-variant mb-1 font-mono uppercase">Status LGPD</div>
                    <div className="font-bold text-xs text-emerald-700">
                      {verification.lgpd_compliance_status}
                    </div>
                  </div>
                </div>
              )}

              {/* Evidence List */}
              {verification && (verification.evidencias || []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-primary">Evidências Auditadas ({verification.total_evidencias_auditadas})</h4>
                  <div className="divide-y divide-outline-variant/20 max-h-56 overflow-y-auto no-scrollbar">
                    {(verification.evidencias || []).map((ev: any) => (
                      <div key={ev.id} className="py-2.5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs text-primary">{ev.fonte}</div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            ev.status_validacao.includes('CONFIRMADO') ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/25' :
                            'bg-blue-500/10 text-blue-800 border border-blue-500/25'
                          }`}>
                            {ev.status_validacao}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{ev.item}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-on-surface-variant font-mono">
                          <span>Confiança: {(ev.score_confianca * 100).toFixed(0)}%</span>
                          {ev.hash_sha256 && (
                            <span className="truncate max-w-[200px]">SHA: {ev.hash_sha256.substring(0, 16)}...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
