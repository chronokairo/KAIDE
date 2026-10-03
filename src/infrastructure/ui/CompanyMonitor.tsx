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
  ExternalLink,
  Send,
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
  const [isExecutingJob, setIsExecutingJob] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // Set default selected agent to Commercial or Coder on mount
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const defaultAgent = agents.find((a) => a.role === 'commercial') || agents.find((a) => a.role === 'coder') || agents[0];
      setSelectedAgent(defaultAgent);
      const agentJob = jobs.find((j) => j.agentRole === defaultAgent.role);
      if (agentJob) setSelectedJob(agentJob);
    }
  }, [agents, selectedAgent, setSelectedAgent, jobs, setSelectedJob]);

  const pendingJob = jobs.find((j) => j.status === 'waiting_approval' && j.approvalGate?.status === 'pending');

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
      await rejectGate(pendingJob.approvalGate.id, rejectReason || 'Rejeitado pelo Diretor Técnico para revisão.');
      setShowApprovalModal(false);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleTriggerCommercialFollowup = async () => {
    setIsExecutingJob(true);
    try {
      const job = await executeJob('commercial.followup');
      const commAgent = agents.find((a) => a.role === 'commercial');
      if (commAgent) setSelectedAgent(commAgent);
      setSelectedJob(job);
      setShowApprovalModal(true);
    } catch (err) {
      console.error('Erro ao disparar commercial.followup:', err);
    } finally {
      setIsExecutingJob(false);
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
            const agentJob = jobs.find((j) => j.agentRole === agent.role || j.id === agent.currentJobId);
            if (agentJob) setSelectedJob(agentJob);
          }}
        />
      </div>

      {/* Top Floating Minimalist Header */}
      <header className="absolute top-4 inset-x-6 z-20 flex items-center justify-between pointer-events-auto">
        {/* Brand & Status Pill */}
        <div className="flex items-center space-x-3 bg-[#F0EEE9]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-neutral-300/80 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xs tracking-tight text-neutral-900">CHRONOKAIRO AI</span>
            <span className="text-[10px] text-neutral-400 font-normal">|</span>
            <span className="text-[11px] text-neutral-600 font-medium">Empresa Virtual</span>
          </div>
        </div>

        {/* Minimalist Metrics Pill */}
        <div className="hidden md:flex items-center space-x-5 bg-[#F0EEE9]/90 backdrop-blur-md px-5 py-2 rounded-2xl border border-neutral-300/80 shadow-sm text-xs text-neutral-600">
          <div className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-medium text-neutral-900">{telemetry.activeAgentsCount}</span>
            <span className="text-neutral-500">Agentes</span>
          </div>

          <span className="text-neutral-300">•</span>

          <div className="flex items-center space-x-1.5">
            <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-medium text-neutral-900">{telemetry.totalJobsCompleted}</span>
            <span className="text-neutral-500">Entregas</span>
          </div>

          <span className="text-neutral-300">•</span>

          <div className="flex items-center space-x-1.5">
            <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-medium text-neutral-900">${telemetry.totalCostUsd.toFixed(2)}</span>
            <span className="text-neutral-500">Custo</span>
          </div>
        </div>

        {/* Right Actions / Pending Gate & Job Trigger Pill */}
        <div className="flex items-center space-x-2">
          {/* Commercial Followup Trigger Button */}
          <button
            onClick={handleTriggerCommercialFollowup}
            disabled={isExecutingJob}
            className="flex items-center space-x-1.5 bg-[#F0EEE9]/90 hover:bg-neutral-200/80 text-neutral-800 px-3.5 py-2 rounded-2xl border border-neutral-300/80 shadow-sm transition text-xs font-semibold cursor-pointer"
            title="Executar varredura de leads e rascunho de follow-up"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isExecutingJob ? 'Processando...' : 'Job: commercial.followup'}</span>
          </button>

          {telemetry.pendingApprovalsCount > 0 ? (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-2xl shadow-sm transition text-xs font-semibold animate-pulse cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Aprovação Humana Pendente ({telemetry.pendingApprovalsCount})</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 bg-[#F0EEE9]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-neutral-300/80 shadow-sm text-xs text-neutral-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistemas Operacionais</span>
            </div>
          )}
        </div>
      </header>

      {/* Bottom Floating Minimalist Dialogue Bar */}
      <footer className="absolute bottom-5 inset-x-6 z-20 flex justify-center pointer-events-auto">
        <div className="w-full max-w-3xl bg-[#F0EEE9]/95 backdrop-blur-lg border border-neutral-300/90 rounded-2xl shadow-lg p-3.5 flex items-center space-x-4">
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
              <span className="font-semibold text-xs text-neutral-900">{selectedAgent?.name || 'Central de Controle'}</span>
              <span className="text-[11px] text-neutral-500 font-normal">({selectedAgent?.department})</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                  selectedAgent?.status === 'waiting_approval'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedAgent?.status === 'working'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-neutral-200 text-neutral-700'
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
            className="flex items-center space-x-1 text-xs text-neutral-600 hover:text-neutral-900 font-medium px-3 py-1.5 rounded-xl hover:bg-neutral-200/60 transition cursor-pointer"
          >
            <span>{showDetailsPanel ? 'Fechar' : 'Inspecionar'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDetailsPanel ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </footer>

      {/* Slide-out Details Drawer */}
      {showDetailsPanel && selectedAgent && (
        <aside className="absolute right-6 top-20 bottom-24 w-80 bg-[#F0EEE9]/95 backdrop-blur-xl border border-neutral-300 rounded-3xl shadow-xl z-20 flex flex-col pointer-events-auto overflow-hidden animate-slideIn">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedAgent.color }} />
              <h3 className="font-semibold text-xs text-neutral-900">{selectedAgent.title}</h3>
            </div>
            <button
              onClick={() => setShowDetailsPanel(false)}
              className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
            {/* Telemetry Numbers */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/80 p-3 rounded-2xl border border-neutral-200/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tokens Processados</span>
                <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                  {selectedAgent.tokensProcessed.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-2xl border border-neutral-200/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Custo Computacional</span>
                <p className="text-sm font-semibold text-amber-600 mt-0.5">${selectedAgent.costUsd.toFixed(2)}</p>
              </div>
            </div>

            {/* Authorized Tools */}
            <div className="bg-white/80 p-3 rounded-2xl border border-neutral-200/80">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2 block">
                Ferramentas Autorizadas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.activeTools.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-lg bg-neutral-100 border border-neutral-200/80 text-[10px] font-mono text-neutral-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Job & Evidences */}
            {selectedJob && (
              <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Job em Execução</span>
                  <span className="text-[10px] font-mono text-neutral-400">{selectedJob.id}</span>
                </div>
                <div className="font-semibold text-neutral-900">{selectedJob.title}</div>
                <div className="text-[11px] text-neutral-500">Cliente / Contexto: {selectedJob.client}</div>

                <div className="pt-2 border-t border-neutral-100">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                    Evidências Verificadas
                  </span>
                  <ul className="space-y-1">
                    {selectedJob.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start space-x-1.5 text-[11px] text-neutral-700">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-[#F0EEE9] border border-neutral-300 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-neutral-200">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Gate de Aprovação Humana</h2>
                <p className="text-xs text-neutral-500">
                  Modelo AI → AI → AI → HUMAN (ADR-0028). Ações com impacto externo ou produção exigem aprovação explícita.
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 space-y-1.5 text-xs">
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
              <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {pendingJob.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start space-x-2 text-neutral-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                disabled={isProcessingApproval}
                onClick={handleReject}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 font-medium text-xs transition cursor-pointer"
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
                    : 'Aprovar & Executar Ação'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
