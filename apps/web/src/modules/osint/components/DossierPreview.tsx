import React, { useState } from 'react';
import { 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  UserCheck, 
  Building2, 
  Sparkles, 
  Download, 
  Clock, 
  Lock, 
  Printer, 
  Cpu, 
  Award,
  ChevronRight,
  Zap,
  ShieldCheck,
  Code
} from 'lucide-react';
import { InvestigationDossier } from '../types';

interface DossierPreviewProps {
  dossier: InvestigationDossier | null;
  onExportMarkdown?: () => void;
}

export const DossierPreview: React.FC<DossierPreviewProps> = ({
  dossier,
  onExportMarkdown,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'pillars' | 'leads' | 'lgpd'>('summary');

  if (!dossier) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center space-y-4 border border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Nenhum Dossiê Consolidado</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Inicie uma investigação para que a pipeline (Ingest ➔ Graph ➔ Provedor Primário de IA ➔ Verification) gere o relatório completo.
        </p>
      </div>
    );
  }

  const {
    id,
    data_geracao,
    alvo_investigacao,
    documento_alvo,
    score_risco_numerico,
    resumo_executivo,
    ingest_data,
    researcher_analysis,
    verification_report,
    linha_do_tempo,
  } = dossier;

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Dossier_${alvo_investigacao.replace(/\s+/g, '_')}_Audit.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <span>CONFIDENCIAL & PRIVADO</span>
              {verification_report.hash_dossie_global && (
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800 font-mono">
                  SHA-256 Auditado
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-white">ID Dossiê: {id}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Code className="w-3.5 h-3.5 text-cyan-400" /> Exportar JSON
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>

          <button
            onClick={onExportMarkdown}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Exportar Markdown
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-medium">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'summary' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Resumo Executivo
        </button>
        <button
          onClick={() => setActiveTab('pillars')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'pillars' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          3 Pilares de Coleta
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'leads' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Hipóteses GLM-5.2 ({researcher_analysis.hipoteses_geradas.length})
        </button>
        <button
          onClick={() => setActiveTab('lgpd')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'lgpd' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Auditoria LGPD & SHA-256
        </button>
      </div>

      {/* Main Dossier Paper / Document */}
      <div className="glass-panel p-8 md:p-10 rounded-2xl border border-slate-800 space-y-8">
        {/* Document Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-slate-800 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Chronokairo Automated Intelligence Report
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{alvo_investigacao}</h1>
            <div className="text-xs text-slate-400 font-mono">
              CPF/CNPJ: <span className="text-slate-200">{documento_alvo}</span> | Data da Análise: {data_geracao}
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className="shrink-0 flex items-center gap-4 bg-slate-900/90 p-4 rounded-xl border border-rose-500/30">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score Global de Risco</div>
              <div className="text-2xl font-black text-rose-400 font-mono">{score_risco_numerico} / 100</div>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Executive Summary Section */}
        {(activeTab === 'summary' || activeTab === 'pillars' || activeTab === 'leads' || activeTab === 'lgpd') && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> 1. Resumo Executivo da Investigação
            </h3>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 leading-relaxed">
              {resumo_executivo}
            </div>
          </div>
        )}

        {/* 3 Pillars Ingest Breakdown */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" /> 2. Coleta dos 3 Pilares em Paralelo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Legal Research */}
            <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Scale className="w-4 h-4 text-indigo-400" /> Legal Research
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                  {ingest_data.legal_pillar.total_processos} Processos
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-300">
                <div>Tribunais: <strong className="text-white">{ingest_data.legal_pillar.tribunal_predominante}</strong></div>
                <div>Polo Passivo: <strong className="text-rose-300">{ingest_data.legal_pillar.polo_passivo_porcentagem}%</strong></div>
                <div className="pt-2 border-t border-indigo-900/50 font-mono text-indigo-200">
                  Contingência: <strong>R$ {(ingest_data.legal_pillar.valor_total_contingencia / 1000000).toFixed(1)}M</strong>
                </div>
              </div>
            </div>

            {/* Person Intelligence */}
            <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <UserCheck className="w-4 h-4 text-purple-400" /> Person Intel
                </div>
                <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                  {ingest_data.person_pillar.vinculos_familiares_empresariais.length} Vínculos Chave
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-300">
                <div>Holdings: <strong className="text-white">{ingest_data.person_pillar.holdings_patrimoniais.length} Entidades</strong></div>
                <div>Naturalidade: <strong className="text-slate-200">{ingest_data.person_pillar.naturalidade}</strong></div>
                <div className="pt-2 border-t border-purple-900/50">
                  Alerta PEP: <strong className="text-emerald-400">{ingest_data.person_pillar.alerta_pep ? 'SIM' : 'NÃO DETECTADO'}</strong>
                </div>
              </div>
            </div>

            {/* Company Intel */}
            <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Building2 className="w-4 h-4 text-amber-400" /> Company Intel
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                  {ingest_data.company_pillar.total_empresas_mapeadas} Empresas
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-300">
                <div>Ativas: <strong className="text-emerald-300">{ingest_data.company_pillar.empresas_ativas}</strong> | Inaptas: <strong className="text-rose-300">{ingest_data.company_pillar.empresas_inaptas_ou_baixadas}</strong></div>
                <div className="pt-2 border-t border-amber-900/50 font-mono text-amber-200">
                  Capital Social: <strong>R$ {(ingest_data.company_pillar.capital_social_acumulado / 1000000).toFixed(1)}M</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Researcher Hypotheses & Leads */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4" /> 3. Hipóteses Investigativas Formuladas por IA (GLM-5.2 Engine)
          </h3>

          <div className="space-y-4">
            {researcher_analysis.hipoteses_geradas.map((lead) => (
              <div key={lead.id} className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${lead.nivel_severidade === 'CRÍTICO' ? 'bg-rose-500 animate-ping' : 'bg-amber-400'}`}></span>
                    {lead.titulo}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">Confiança GLM-5.2: {lead.confianca_percentual}%</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      lead.nivel_severidade === 'CRÍTICO' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {lead.nivel_severidade}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{lead.descricao}</p>

                <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cyan-200">Recomendação de Compliance:</strong> {lead.recomendacao_due_diligence}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Verification Audit & LGPD */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4" /> 4. Checagem de Evidências & Cadeia de Custódia SHA-256 (LGPD)
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30">
              Confiabilidade: {(verification_report.score_global_confiabilidade * 100).toFixed(0)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-400">Status de Conformidade LGPD:</span>
              <span className="text-emerald-400 font-semibold">{verification_report.lgpd_compliance_status}</span>
            </div>
            {verification_report.lgpd_fundamento_legal && (
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <strong className="text-slate-300">Fundamento Legal:</strong> {verification_report.lgpd_fundamento_legal}
              </div>
            )}
            {verification_report.hash_dossie_global && (
              <div className="text-[11px] text-slate-400 pt-1 font-mono flex items-center gap-2">
                <strong className="text-slate-300">Hash SHA-256 do Dossiê:</strong>
                <code className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-[10px] select-all">
                  {verification_report.hash_dossie_global}
                </code>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {verification_report.evidencias.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-200">{item.item}</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.status_validacao}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Fonte: {item.fonte}</span>
                  {item.hash_sha256 && <span className="text-slate-500">SHA: {item.hash_sha256.substring(0, 12)}...</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" /> 5. Linha do Tempo Histórica
          </h3>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {linha_do_tempo.map((evt, idx) => (
              <div key={idx} className="relative flex items-start justify-between gap-4">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-950"></div>
                <div>
                  <div className="text-xs font-mono font-bold text-cyan-400">{evt.ano_data}</div>
                  <div className="text-xs text-slate-200 font-medium">{evt.evento}</div>
                </div>
                <span className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded ${
                  evt.impacto_risco === 'CRÍTICO' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {evt.categoria}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
