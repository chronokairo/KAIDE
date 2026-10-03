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
  } = useCompanyMonitor();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // Set default selected agent to Coder on mount
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const defaultAgent = agents.find((a) => a.role === 'coder') || agents[0];
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
      await approveGate(pendingJob.approvalGate.id, 'Autorizado pelo Diretor Técnico após verificação de evidências.');
      setShowApprovalModal(false);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleReject = async () => {
    if (!pendingJob?.approvalGate) return;
    setIsProcessingApproval(true);
    try {
      await rejectGate(pendingJob.approvalGate.id, rejectReason || 'Rejeitado para ajustes adicionais.');
      setShowApprovalModal(false);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F0EEE9] text-neutral-800 font-sans select-none">
      {/* 2D/3D Pokemon Office View in Three.js (Pantone 2026 Cloud Dancer Background) */}
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

        {/* Right Actions / Pending Gate Pill */}
        <div className="flex items-center space-x-2">
          {telemetry.pendingApprovalsCount > 0 ? (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-2xl shadow-sm transition text-xs font-semibold animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Aprovação Humana Pendente</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 bg-[#F0EEE9]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-neutral-300/80 shadow-sm text-xs text-neutral-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistemas Operacionais</span>
            </div>
          )}
        </div>
      </header>

      {/* Bottom Floating Minimalist Dialogue Bar (Pokemon NPC Speech Style) */}
      <footer className="absolute bottom-5 inset-x-6 z-20 flex justify-center pointer-events-auto">
        <div className="w-full max-w-3xl bg-[#F0EEE9]/95 backdrop-blur-lg border border-neutral-300/90 rounded-2xl shadow-lg p-3.5 flex items-center space-x-4">
          {/* Avatar Crop Preview */}
          <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 overflow-hidden relative shrink-0 shadow-inner flex items-center justify-center">
            <img
              src="/anime_8bit_color.png"
              alt="Avatar"
              className="pixel-art absolute max-w-none"
              style={{
                width: '120px',
                height: '75px',
                top: selectedAgent?.role === 'coder' ? '-2px' : selectedAgent?.role === 'devops' ? '-45px' : '-15px',
                left: '-2px',
              }}
            />
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
            <p className="text-xs text-neutral-700 truncate font-normal">
              &quot;{selectedAgent?.currentTask || 'Selecione um funcionário no escritório para inspecionar a atividade.'}&quot;
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowDetailsPanel(!showDetailsPanel)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 shadow-sm transition flex items-center space-x-1"
            >
              <span>{showDetailsPanel ? 'Fechar' : 'Detalhes'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {pendingJob && (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition flex items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Revisar Gate</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Slide-out Minimalist Details Drawer */}
      {showDetailsPanel && selectedAgent && (
        <aside className="absolute right-6 top-20 bottom-24 w-88 z-30 flex flex-col bg-[#F0EEE9]/95 backdrop-blur-xl border border-neutral-300 rounded-3xl shadow-2xl p-5 overflow-hidden pointer-events-auto animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3">
            <div>
              <h3 className="font-semibold text-sm text-neutral-900">{selectedAgent.name}</h3>
              <p className="text-xs text-neutral-500">{selectedAgent.title}</p>
            </div>
            <button
              onClick={() => setShowDetailsPanel(false)}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs">
            {/* Mission */}
            <div className="bg-white/80 p-3 rounded-2xl border border-neutral-200/80">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Missão & Escopo</span>
              <p className="text-neutral-700 mt-1 leading-relaxed">{selectedAgent.currentTask}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white/80 p-3 rounded-2xl border border-neutral-200/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tokens</span>
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
                <div className="text-[11px] text-neutral-500">Cliente: {selectedJob.client}</div>

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
                  Modelo AI → AI → AI → HUMAN (ADR-0028). Deploy em produção requer aprovação do Diretor Técnico.
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Ação:</span>
                <span className="font-semibold text-red-600">Deploy em Produção (v1.2.0)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Projeto:</span>
                <span className="text-neutral-800 font-medium">{pendingJob.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Solicitante:</span>
                <span className="font-medium text-purple-600">AI DevOps</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Evidências Anexadas (Verify & Evidence)
              </span>
              <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 space-y-1.5 max-h-40 overflow-y-auto">
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
                className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 font-medium text-xs transition"
              >
                Rejeitar & Solicitar Ajustes
              </button>
              <button
                disabled={isProcessingApproval}
                onClick={handleApprove}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isProcessingApproval ? 'Processando...' : 'Aprovar Deploy em Produção'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
