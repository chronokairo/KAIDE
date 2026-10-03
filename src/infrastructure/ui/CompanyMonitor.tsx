'use client';

import React, { useState, useEffect } from 'react';
import { useCompanyMonitor } from '@/application/use-cases/use-company-monitor';
import { PokemonOfficeScene } from './PokemonOfficeScene';
import { AgentEntity, JobEntity } from '@/domain/company';
import {
  Users,
  Briefcase,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export function CompanyMonitor() {
  const {
    agents,
    jobs,
    telemetry,
    selectedAgent,
    setSelectedAgent,
    selectedJob,
    setSelectedJob,
    approveGate,
    rejectGate,
    executeJob,
  } = useCompanyMonitor();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [executingJobName, setExecutingJobName] = useState<string | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // Set default selected agent on mount
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const defaultAgent =
        agents.find((a) => a.role === 'commercial') ||
        agents.find((a) => a.role === 'coder') ||
        agents[0];
      setSelectedAgent(defaultAgent);
      const agentJob = jobs.find((j) => j.agentRole === defaultAgent.role);
      if (agentJob) setSelectedJob(agentJob);
    }
  }, [agents, selectedAgent, setSelectedAgent, jobs, setSelectedJob]);

  const pendingJob = jobs.find(
    (j) => j.status === 'waiting_approval' && j.approvalGate?.status === 'pending'
  );

  const handleApprove = async () => {
    if (!pendingJob?.approvalGate) return;
    setIsProcessingApproval(true);
    try {
      await approveGate(
        pendingJob.approvalGate.id,
        'Autorizado pelo Diretor Técnico após conferência das evidências de conformidade.'
      );
      setShowApprovalModal(false);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleReject = async () => {
    if (!pendingJob?.approvalGate) return;
    setIsProcessingApproval(true);
    try {
      await rejectGate(
        pendingJob.approvalGate.id,
        rejectReason || 'Rejeitado pelo Diretor Técnico para revisão.'
      );
      setShowApprovalModal(false);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleTriggerJob = async (jobName: string, targetRole: AgentEntity['role']) => {
    setExecutingJobName(jobName);
    try {
      const job = await executeJob(jobName);
      const targetAgent = agents.find((a) => a.role === targetRole);
      if (targetAgent) setSelectedAgent(targetAgent);
      setSelectedJob(job);

      if (job.requiresApproval && job.approvalGate) {
        setShowApprovalModal(true);
      } else {
        setShowDetailsPanel(true);
      }
    } catch (err) {
      console.error(`Erro ao disparar job ${jobName}:`, err);
    } finally {
      setExecutingJobName(null);
    }
  };

  const handleCamera = (action: 'zoom-in' | 'zoom-out' | 'reset') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('office-camera-action', { detail: { action } }));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F0EEE9] text-neutral-800 font-sans select-none">
      {/* Pure 3D Low-Poly Office View in Three.js (Pantone 2026 Cloud Dancer Background) */}
      <div className="absolute inset-0">
        <PokemonOfficeScene
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={(agent) => {
            setSelectedAgent(agent);
            const agentJob = jobs.find(
              (j) => j.agentRole === agent.role || j.id === agent.currentJobId
            );
            if (agentJob) setSelectedJob(agentJob);
          }}
        />
      </div>

      {/* Top Floating Master Header */}
      <header className="absolute top-4 inset-x-6 z-20 flex items-center justify-between pointer-events-none gap-3">
        {/* Brand & Live Connection Pill */}
        <div className="pointer-events-auto flex items-center space-x-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-neutral-200/90 shadow-sm shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xs tracking-tight text-neutral-900">CHRONOKAIRO AI</span>
            <span className="text-[10px] text-neutral-400 font-normal">|</span>
            <span className="text-[11px] text-neutral-600 font-medium">Supabase Prod Oficial</span>
          </div>
        </div>

        {/* Minimalist Metrics Pill */}
        <div className="pointer-events-auto hidden xl:flex items-center space-x-5 bg-white/90 backdrop-blur-md px-5 py-2 rounded-2xl border border-neutral-200/90 shadow-sm text-xs text-neutral-600 shrink-0">
          <div className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-semibold text-neutral-900">{telemetry.activeAgentsCount}</span>
            <span className="text-neutral-500">Agentes</span>
          </div>

          <span className="text-neutral-300">•</span>

          <div className="flex items-center space-x-1.5">
            <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-semibold text-neutral-900">{telemetry.totalJobsCompleted}</span>
            <span className="text-neutral-500">Entregas</span>
          </div>

          <span className="text-neutral-300">•</span>

          <div className="flex items-center space-x-1.5">
            <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-semibold text-neutral-900">${telemetry.totalCostUsd.toFixed(2)}</span>
            <span className="text-neutral-500">Custo</span>
          </div>
        </div>

        {/* Action Dock: Dispatch Buttons & Gate Status */}
        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
          {/* Segmented Job Dispatch Bar */}
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-neutral-200/90 shadow-sm">
            {/* Commercial Followup */}
            <button
              onClick={() => handleTriggerJob('commercial.followup', 'commercial')}
              disabled={executingJobName !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 hover:shadow-xs border border-emerald-200/60 transition cursor-pointer disabled:opacity-50"
              title="Executar varredura de leads e rascunho de follow-up (AI Comercial)"
            >
              {executingJobName === 'commercial.followup' ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Follow-up</span>
            </button>

            {/* QA PR Review */}
            <button
              onClick={() => handleTriggerJob('qa.review_pr', 'qa')}
              disabled={executingJobName !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-800 bg-blue-50/80 hover:bg-blue-100 hover:shadow-xs border border-blue-200/60 transition cursor-pointer disabled:opacity-50"
              title="Executar auditoria técnica adversarial nos PRs abertos (AI QA)"
            >
              {executingJobName === 'qa.review_pr' ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Review PR</span>
            </button>

            {/* Finance Reconcile */}
            <button
              onClick={() => handleTriggerJob('finance.reconcile', 'finance')}
              disabled={executingJobName !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50/80 hover:bg-amber-100 hover:shadow-xs border border-amber-200/60 transition cursor-pointer disabled:opacity-50"
              title="Executar conciliação de faturas, MRR e contratos (AI Finance / Ops)"
            >
              {executingJobName === 'finance.reconcile' ? (
                <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              ) : (
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>Conciliação</span>
            </button>
          </div>

          {/* Human Gate Alert Pill */}
          {telemetry.pendingApprovalsCount > 0 ? (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-2xl shadow-sm shadow-amber-500/20 transition text-xs font-semibold animate-pulse cursor-pointer shrink-0"
              title="Revisar e aprovar ações com impacto externo ou financeiro"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Aprovação Humana ({telemetry.pendingApprovalsCount})</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-neutral-200/90 shadow-sm text-xs text-neutral-600 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistemas OK</span>
            </div>
          )}
        </div>
      </header>

      {/* Floating 3D Camera Controls Tool Palette */}
      <div className="absolute right-6 top-20 z-20 flex flex-col gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-200/90 shadow-sm pointer-events-auto">
        <button
          onClick={() => handleCamera('zoom-in')}
          className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          title="Aproximar Câmera (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleCamera('zoom-out')}
          className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          title="Afastar Câmera (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-neutral-200 my-0.5" />
        <button
          onClick={() => handleCamera('reset')}
          className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          title="Centralizar Câmera Isométrica (⟲)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Command Bar & Quick Agent Selector */}
      <footer className="absolute bottom-5 inset-x-6 z-20 flex flex-col items-center gap-2 pointer-events-none">
        {/* Quick Agent Selector Carousel */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-neutral-200/80 shadow-sm text-xs overflow-x-auto max-w-3xl">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 shrink-0">
            Estações:
          </span>
          {agents.map((ag) => {
            const isSelected = selectedAgent?.id === ag.id;
            return (
              <button
                key={ag.id}
                onClick={() => {
                  setSelectedAgent(ag);
                  const agentJob = jobs.find(
                    (j) => j.agentRole === ag.role || j.id === ag.currentJobId
                  );
                  if (agentJob) setSelectedJob(agentJob);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ag.color }}
                />
                <span className="truncate max-w-[110px]">{ag.name.split(' ')[0]}</span>
                {ag.status === 'waiting_approval' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Master Dialogue Bar */}
        <div className="pointer-events-auto w-full max-w-3xl bg-white/95 backdrop-blur-lg border border-neutral-200/90 rounded-2xl shadow-lg p-3.5 flex items-center space-x-4">
          {/* Role Color Badge */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm font-bold text-white text-xs"
            style={{ backgroundColor: selectedAgent?.color || '#38BDF8' }}
          >
            {selectedAgent?.role.slice(0, 3).toUpperCase() || 'SYS'}
          </div>

          {/* Dialog Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-0.5">
              <span className="font-semibold text-xs text-neutral-900">
                {selectedAgent?.name || 'Central de Controle'}
              </span>
              <span className="text-[11px] text-neutral-500 font-normal">
                ({selectedAgent?.department})
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                  selectedAgent?.status === 'waiting_approval'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedAgent?.status === 'working'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {selectedAgent?.status === 'waiting_approval'
                  ? 'Aguardando Aprovação'
                  : selectedAgent?.status === 'working'
                  ? 'Processando'
                  : 'Ocioso'}
              </span>
            </div>
            <p className="text-xs text-neutral-700 font-mono truncate">
              {selectedAgent?.currentTask || 'Aguardando próxima instrução no Control Plane.'}
            </p>
          </div>

          {/* Action to view details */}
          <button
            onClick={() => setShowDetailsPanel(!showDetailsPanel)}
            className="flex items-center space-x-1 text-xs text-neutral-600 hover:text-neutral-900 font-medium px-3 py-1.5 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
          >
            <span>{showDetailsPanel ? 'Fechar' : 'Inspecionar'}</span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${showDetailsPanel ? 'rotate-90' : ''}`}
            />
          </button>
        </div>
      </footer>

      {/* Slide-out Details Drawer */}
      {showDetailsPanel && selectedAgent && (
        <aside className="absolute right-6 top-32 bottom-28 w-84 bg-white/95 backdrop-blur-xl border border-neutral-200 rounded-3xl shadow-xl z-20 flex flex-col pointer-events-auto overflow-hidden animate-slideIn">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedAgent.color }}
              />
              <h3 className="font-semibold text-xs text-neutral-900">{selectedAgent.title}</h3>
            </div>
            <button
              onClick={() => setShowDetailsPanel(false)}
              className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition"
              title="Fechar painel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
            {/* Telemetry Numbers */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Tokens Processados
                </span>
                <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                  {selectedAgent.tokensProcessed.toLocaleString()}
                </p>
              </div>
              <div className="bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Custo Computacional
                </span>
                <p className="text-sm font-semibold text-amber-600 mt-0.5">
                  ${selectedAgent.costUsd.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Authorized Tools */}
            <div className="bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200/80">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2 block">
                Ferramentas Autorizadas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.activeTools.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-lg bg-white border border-neutral-200/80 text-[10px] font-mono text-neutral-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Job & Evidences */}
            {selectedJob && (
              <div className="bg-neutral-50/80 p-3.5 rounded-2xl border border-blue-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                    Job em Execução
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">{selectedJob.id}</span>
                </div>
                <div className="font-semibold text-neutral-900">{selectedJob.title}</div>
                <div className="text-[11px] text-neutral-500">
                  Cliente / Contexto: {selectedJob.client}
                </div>

                <div className="pt-2 border-t border-neutral-200/60">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                    Evidências Verificadas
                  </span>
                  <ul className="space-y-1">
                    {selectedJob.evidence.map((ev, i) => (
                      <li
                        key={i}
                        className="flex items-start space-x-1.5 text-[11px] text-neutral-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Minimalist Human Approval Gate Modal (ADR-0028) */}
      {showApprovalModal && pendingJob && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowApprovalModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/35 backdrop-blur-md animate-fadeIn"
        >
          <div className="w-full max-w-xl bg-white border border-neutral-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Gate de Aprovação Humana</h2>
                  <p className="text-xs text-neutral-500">
                    Modelo AI → AI → AI → HUMAN (ADR-0028). Ações externas exigem aprovação explícita.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
                title="Fechar (decidir depois)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Ação / Gate:</span>
                <span className="font-semibold text-amber-600">
                  {pendingJob.approvalGate?.title || pendingJob.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Contexto / Projeto:</span>
                <span className="text-neutral-800 font-medium">{pendingJob.project || pendingJob.client}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Agente Solicitante:</span>
                <span className="font-medium text-emerald-700">
                  {pendingJob.agentRole === 'commercial'
                    ? 'AI Comercial (SDR)'
                    : pendingJob.agentRole === 'finance'
                    ? 'AI Finance / Ops (Controladoria)'
                    : pendingJob.agentRole === 'devops'
                    ? 'AI DevOps'
                    : pendingJob.agentRole}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Evidências Anexadas (Verify & Evidence)
              </span>
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/80 space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {pendingJob.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start space-x-2 text-neutral-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-3.5 py-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 font-medium text-xs transition cursor-pointer"
              >
                Decidir Depois
              </button>
              <div className="flex items-center space-x-2">
                <button
                  disabled={isProcessingApproval}
                  onClick={handleReject}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium text-xs transition cursor-pointer"
                >
                  Rejeitar & Solicitar Ajustes
                </button>
                <button
                  disabled={isProcessingApproval}
                  onClick={handleApprove}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {isProcessingApproval
                      ? 'Processando...'
                      : pendingJob.approvalGate?.type === 'outbound_contact'
                      ? 'Aprovar & Despachar Mensagens'
                      : pendingJob.approvalGate?.type === 'payment_release'
                      ? 'Aprovar & Liberar Cobrança/Conciliação'
                      : 'Aprovar & Executar Ação'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
