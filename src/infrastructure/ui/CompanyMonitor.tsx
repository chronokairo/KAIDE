'use client';

import React, { useState } from 'react';
import { useCompanyMonitor } from '@/application/use-cases/use-company-monitor';
import { CompanyScene3D } from './CompanyScene3D';
import { AgentEntity, JobEntity } from '@/domain/company';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Layers,
  Terminal,
  Activity,
  ChevronRight,
  Eye,
  Check,
  X,
  FileCheck,
  Send,
  HelpCircle,
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
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-mono">
      {/* 3D WebGL Canvas */}
      <div className="absolute inset-0">
        <CompanyScene3D
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={(agent) => {
            setSelectedAgent(agent);
            const agentJob = jobs.find((j) => j.agentRole === agent.role || j.id === agent.currentJobId);
            if (agentJob) setSelectedJob(agentJob);
          }}
        />
      </div>

      {/* Top Header & Telemetry Bar (8-bit Monochrome) */}
      <header className="absolute top-0 inset-x-0 z-20 flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-black/85 backdrop-blur-md border-b border-white/20 pointer-events-auto">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 border border-white bg-black flex items-center justify-center shadow-sm">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-wider text-white">CHRONOKAIRO AI</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white text-black">
                8-BIT VIRTUAL CO
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              AI-First Engineering • GitHub & GitLab chronokairo • <span className="text-neutral-200">ADR-0028/0029</span>
            </p>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center space-x-6 text-xs mt-3 md:mt-0">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-slate-400">Agentes</div>
              <div className="font-semibold text-slate-100">
                {telemetry.activeAgentsCount} ativos / {agents.length} total
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-400">Jobs Entregues</div>
              <div className="font-semibold text-slate-100">{telemetry.totalJobsCompleted}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-slate-400">Custo Total</div>
              <div className="font-semibold text-slate-100">${telemetry.totalCostUsd.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-slate-400">Tempo Médio</div>
              <div className="font-semibold text-slate-100">{telemetry.averageCycleTimeMinutes}m</div>
            </div>
          </div>

          {/* Pending Approval Badge Button */}
          {telemetry.pendingApprovalsCount > 0 && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition animate-pulse"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-bold">{telemetry.pendingApprovalsCount} Gate Humano Pendente</span>
            </button>
          )}
        </div>
      </header>

      {/* Left Employee Roster (Collapsible) */}
      <aside className="absolute left-6 top-24 bottom-24 w-80 z-10 flex flex-col bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden pointer-events-auto">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Equipe de Agentes</span>
          </div>
          <span className="text-xs text-slate-400">{agents.length} cargos</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {agents.map((agent) => {
            const isSelected = selectedAgent?.id === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent);
                  const agentJob = jobs.find((j) => j.agentRole === agent.role || j.id === agent.currentJobId);
                  if (agentJob) setSelectedJob(agentJob);
                }}
                className={`w-full text-left p-3 rounded-xl transition border ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-500/60 shadow-md ring-1 ring-sky-500/30'
                    : 'bg-slate-900/40 hover:bg-slate-800/50 border-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
                    <span className="text-sm font-semibold text-white">{agent.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      agent.status === 'waiting_approval'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-700/60 animate-pulse'
                        : agent.status === 'working'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/40'
                    }`}
                  >
                    {agent.status === 'waiting_approval'
                      ? 'GATE'
                      : agent.status === 'working'
                      ? 'ATIVO'
                      : 'OCIOSO'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">{agent.title}</div>
                <div className="text-[11px] text-slate-300 mt-1 line-clamp-2 bg-slate-950/50 p-1.5 rounded-md border border-slate-800/40">
                  {agent.currentTask}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Modelo Operacional:</span>
          <span className="text-sky-400 font-semibold">AI → AI → AI → HUMAN</span>
        </div>
      </aside>

      {/* Right Inspector Drawer (Agent Details & Job Evidences) */}
      {selectedAgent && (
        <aside className="absolute right-6 top-24 bottom-24 w-96 z-10 flex flex-col bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedAgent.color }} />
              <div>
                <h3 className="text-sm font-bold text-white">{selectedAgent.name}</h3>
                <span className="text-[11px] text-slate-400">{selectedAgent.department}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Role & Mission */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Missão & Papel</div>
              <div className="text-slate-200">{selectedAgent.title}</div>
            </div>

            {/* Current Activity */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tarefa em Execução</div>
              <div className="text-slate-100 font-medium">{selectedAgent.currentTask}</div>
              <div className="mt-2 text-[10px] text-slate-400">Última atividade: {selectedAgent.lastActivity}</div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div className="text-[10px] text-slate-400">Tokens Processados</div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {selectedAgent.tokensProcessed.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div className="text-[10px] text-slate-400">Custo Computacional</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">${selectedAgent.costUsd.toFixed(2)}</div>
              </div>
            </div>

            {/* Authorized Tools */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Ferramentas Tipadas Autorizadas</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.activeTools.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Linked Job Details */}
            {selectedJob && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase font-bold text-sky-400">Job Ativo</div>
                  <span className="text-[10px] font-mono text-slate-400">{selectedJob.id}</span>
                </div>
                <div className="font-semibold text-white mb-1">{selectedJob.title}</div>
                <div className="text-[11px] text-slate-400 mb-2">Cliente: {selectedJob.client}</div>

                <div className="text-[10px] uppercase font-bold text-slate-400 mt-2 mb-1">Evidências de Entrega</div>
                <ul className="space-y-1">
                  {selectedJob.evidence.map((ev, i) => (
                    <li key={i} className="flex items-start space-x-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>

                {selectedJob.requiresApproval && selectedJob.approvalGate?.status === 'pending' && (
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="w-full mt-3 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Revisar & Aprovar Gate</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Bottom Pipeline Stages Bar */}
      <footer className="absolute bottom-4 inset-x-6 z-20 flex items-center justify-between px-6 py-3 bg-slate-950/75 backdrop-blur-md rounded-2xl border border-slate-800/80 pointer-events-auto">
        <div className="flex items-center space-x-3 overflow-x-auto text-xs py-1">
          <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider shrink-0">Pipeline:</span>

          {[
            { label: 'Comercial', role: 'commercial', color: '#10b981' },
            { label: 'Analista', role: 'analyst', color: '#6366f1' },
            { label: 'Product', role: 'product', color: '#ec4899' },
            { label: 'Coder', role: 'coder', color: '#f59e0b' },
            { label: 'QA', role: 'qa', color: '#ef4444' },
            { label: 'DevOps', role: 'devops', color: '#8b5cf6' },
            { label: 'HUMAN APPROVAL', role: 'human_director', color: '#38bdf8', isGate: true },
            { label: 'Suporte', role: 'support', color: '#06b6d4' },
            { label: 'Financeiro', role: 'finance', color: '#eab308' },
          ].map((stage, i, arr) => (
            <React.Fragment key={stage.role}>
              <div
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border font-medium ${
                  stage.isGate
                    ? 'bg-sky-950/80 text-sky-300 border-sky-500/60 shadow-lg shadow-sky-500/20 ring-1 ring-sky-400/40'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                <span>{stage.label}</span>
              </div>
              {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 ml-4 shrink-0 hidden md:block">
          Use o mouse para <span className="text-slate-200">girar</span>, <span className="text-slate-200">zoom</span> e{' '}
          <span className="text-slate-200">clicar</span> nos agentes.
        </div>
      </footer>

      {/* Human Approval Gate Modal (ADR-0028) */}
      {showApprovalModal && pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">HUMAN APPROVAL GATE — APROVAÇÃO OBRIGATÓRIA</h2>
                <p className="text-xs text-amber-300">
                  Conforme ADR-0028: Produção e dinheiro real exigem aprovação explícita do Diretor Técnico.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Job:</span>
                <span className="font-semibold text-white">{pendingJob.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Cliente / Projeto:</span>
                <span className="text-slate-200">
                  {pendingJob.client} ({pendingJob.project})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Agente Solicitante:</span>
                <span className="font-bold text-purple-400">AI DevOps</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tipo de Ação:</span>
                <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 font-mono text-[10px] border border-red-800/40">
                  PRODUÇÃO (DEPLOY EM PROD)
                </span>
              </div>
            </div>

            {/* Evidences list */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Evidências Geradas pelos Agentes (Verify & Evidence):
              </span>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 max-h-40 overflow-y-auto space-y-1.5">
                {pendingJob.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start space-x-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                disabled={isProcessingApproval}
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700"
              >
                Rejeitar & Solicitar Correção
              </button>
              <button
                disabled={isProcessingApproval}
                onClick={handleApprove}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessingApproval ? 'Processando...' : 'Aprovar Deploy em Produção'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
