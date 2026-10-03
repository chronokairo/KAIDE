'use client';

import React, { useState, useEffect } from 'react';
import { useCompanyMonitor } from '@/application/use-cases/use-company-monitor';
import { CompanyScene2D } from './CompanyScene2D';
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
  Volume2,
  VolumeX,
  Gamepad2,
  Terminal,
  Activity,
  Zap,
} from 'lucide-react';

// Web Audio API 8-bit Sound Effects Synthesizer
class RetroSoundSynth {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playSelect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.15);
      });
    } catch {}
  }
}

const sfx = new RetroSoundSynth();

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
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Set default selected agent to Coder on mount for immediate dialog preview
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const defaultAgent = agents.find((a) => a.role === 'coder') || agents[0];
      setSelectedAgent(defaultAgent);
      const agentJob = jobs.find((j) => j.agentRole === defaultAgent.role);
      if (agentJob) setSelectedJob(agentJob);
    }
  }, [agents, selectedAgent, setSelectedAgent, jobs, setSelectedJob]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
    if (next) sfx.playSelect();
  };

  const pendingJob = jobs.find((j) => j.status === 'waiting_approval' && j.approvalGate?.status === 'pending');

  const handleApprove = async () => {
    if (!pendingJob?.approvalGate) return;
    setIsProcessingApproval(true);
    try {
      await approveGate(pendingJob.approvalGate.id, 'Autorizado pelo Diretor Técnico após verificação de evidências.');
      sfx.playSuccess();
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
      sfx.playSelect();
      setShowApprovalModal(false);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F0EEE9] text-[#1A1A1A] font-silkscreen select-none">
      {/* 2D Three.js WebGL Scene (Pantone 2026 Cloud Dancer Background) */}
      <div className="absolute inset-0">
        <CompanyScene2D
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={(agent) => {
            sfx.playSelect();
            setSelectedAgent(agent);
            const agentJob = jobs.find((j) => j.agentRole === agent.role || j.id === agent.currentJobId);
            if (agentJob) setSelectedJob(agentJob);
          }}
        />
      </div>

      {/* Retro 8-Bit Top HUD Bar */}
      <header className="absolute top-3 inset-x-4 z-20 flex flex-col md:flex-row items-center justify-between px-5 py-3 bg-[#F0EEE9] border-4 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] pointer-events-auto">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1A1A1A] text-[#F0EEE9] flex items-center justify-center border-2 border-[#1A1A1A]">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-wider text-[#1A1A1A]">CHRONOKAIRO 8-BIT VIRTUAL CO</h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#1A1A1A] text-[#F0EEE9]">PANTONE 2026</span>
            </div>
            <p className="text-[10px] text-neutral-600">
              AI-First Engineering Control Plane • <span className="text-blue-700 font-bold">ADR-0028/0029</span>
            </p>
          </div>
        </div>

        {/* 8-Bit Retro RPG Telemetry Meters */}
        <div className="flex items-center space-x-4 text-[10px] mt-2 md:mt-0 font-bold">
          {/* Operations HP Bar */}
          <div className="flex items-center space-x-1.5 bg-white px-2 py-1 border-2 border-[#1A1A1A]">
            <span className="text-emerald-700">HP:</span>
            <span className="tracking-tighter text-emerald-600">[██████████]</span>
            <span className="text-[#1A1A1A]">100%</span>
          </div>

          {/* Jobs Stat */}
          <div className="flex items-center space-x-1.5 bg-white px-2 py-1 border-2 border-[#1A1A1A]">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-neutral-600">JOBS:</span>
            <span className="text-blue-800">{telemetry.totalJobsCompleted}</span>
          </div>

          {/* Tokens Gold Stat */}
          <div className="flex items-center space-x-1.5 bg-white px-2 py-1 border-2 border-[#1A1A1A]">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-neutral-600">COST:</span>
            <span className="text-amber-800">${telemetry.totalCostUsd.toFixed(2)}</span>
          </div>

          {/* Pending Approval Badge */}
          {telemetry.pendingApprovalsCount > 0 ? (
            <button
              onClick={() => {
                sfx.playSelect();
                setShowApprovalModal(true);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-red-500 text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:bg-red-600 animate-bounce transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>[! HUMAN GATE PENDENTE !]</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-800 border-2 border-[#1A1A1A]">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>GATES OK</span>
            </div>
          )}

          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            className="p-1.5 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:bg-neutral-100"
            title="Toggle Retro SFX"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-700" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-400" />}
          </button>
        </div>
      </header>

      {/* Left Employee Roster (Retro RPG Party Menu) */}
      <aside className="absolute left-4 top-20 bottom-36 w-72 z-10 flex flex-col bg-[#F0EEE9] border-4 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] overflow-hidden pointer-events-auto">
        <div className="p-2.5 bg-[#1A1A1A] text-[#F0EEE9] flex items-center justify-between text-[11px] font-bold">
          <div className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>AGENTS ROSTER</span>
          </div>
          <span className="text-neutral-400">9 MEMBROS</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {agents.map((agent) => {
            const isSelected = selectedAgent?.id === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => {
                  sfx.playSelect();
                  setSelectedAgent(agent);
                  const agentJob = jobs.find((j) => j.agentRole === agent.role || j.id === agent.currentJobId);
                  if (agentJob) setSelectedJob(agentJob);
                }}
                className={`w-full text-left p-2 transition border-2 ${
                  isSelected
                    ? 'bg-amber-100 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A]'
                    : 'bg-white hover:bg-neutral-100 border-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 border border-[#1A1A1A]" style={{ backgroundColor: agent.color }} />
                    <span className="text-[11px] font-bold text-[#1A1A1A] truncate">{agent.name}</span>
                  </div>
                  <span
                    className={`text-[8px] px-1 py-0.2 border border-[#1A1A1A] ${
                      agent.status === 'waiting_approval'
                        ? 'bg-red-500 text-white animate-pulse'
                        : agent.status === 'working'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {agent.status === 'waiting_approval' ? 'GATE' : agent.status === 'working' ? 'ACT' : 'IDL'}
                  </span>
                </div>
                <div className="text-[9px] text-neutral-600 line-clamp-1">{agent.title}</div>
              </button>
            );
          })}
        </div>

        <div className="p-2 bg-[#E2DFD8] border-t-2 border-[#1A1A1A] text-[9px] text-neutral-700 flex items-center justify-between">
          <span>PIPELINE:</span>
          <span className="text-blue-800 font-bold">AI → AI → AI → HUMAN</span>
        </div>
      </aside>

      {/* Bottom Retro Dialogue Box (Classic RPG / Visual Novel Text Box) */}
      <footer className="absolute bottom-3 inset-x-4 h-30 z-20 bg-[#F0EEE9] border-4 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] p-3 flex items-center space-x-4 pointer-events-auto">
        {/* Character Portrait from Sprite */}
        <div className="w-20 h-20 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] flex items-center justify-center shrink-0 overflow-hidden relative">
          <img
            src="/anime_8bit_color.png"
            alt="Agent Sprite"
            className="pixel-art absolute max-w-none"
            style={{
              width: '160px',
              height: '100px',
              top: selectedAgent?.role === 'coder' ? '-3px' : selectedAgent?.role === 'devops' ? '-60px' : '-20px',
              left: '-2px',
            }}
          />
        </div>

        {/* Dialogue Content */}
        <div className="flex-1 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold bg-[#1A1A1A] text-[#F0EEE9] px-2 py-0.5">
                {selectedAgent ? selectedAgent.name.toUpperCase() : 'CENTRAL DE COMANDO'}
              </span>
              <span className="text-[10px] text-neutral-600">[{selectedAgent?.department || 'SISTEMA'}]</span>
            </div>
            {selectedJob && (
              <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-900 px-1.5 py-0.5">
                JOB: {selectedJob.title}
              </span>
            )}
          </div>

          <div className="text-[11px] text-[#1A1A1A] bg-white border-2 border-[#1A1A1A] p-2 leading-relaxed flex-1 mt-1 flex items-center justify-between">
            <span>
              &quot;{selectedAgent?.currentTask || 'Selecione um agente ou funcionário para acompanhar a tarefa ativa.'}&quot;
            </span>
            <span className="text-amber-600 animate-bounce ml-2 font-bold">▼</span>
          </div>
        </div>

        {/* Action Button for Pending Gate */}
        {pendingJob && (
          <button
            onClick={() => {
              sfx.playSelect();
              setShowApprovalModal(true);
            }}
            className="px-4 py-3 bg-amber-400 hover:bg-amber-300 text-[#1A1A1A] border-3 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] font-bold text-xs shrink-0 flex items-center space-x-1.5 animate-pulse"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ABRIR GATE</span>
          </button>
        )}
      </footer>

      {/* Right Details Drawer (When Agent Selected) */}
      {selectedAgent && (
        <aside className="absolute right-4 top-20 bottom-36 w-84 z-10 flex flex-col bg-[#F0EEE9] border-4 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] overflow-hidden pointer-events-auto text-[10px]">
          {/* Header */}
          <div className="p-2.5 bg-[#1A1A1A] text-[#F0EEE9] flex items-center justify-between font-bold">
            <span>FICHA DO FUNCIONÁRIO</span>
            <button
              onClick={() => {
                sfx.playSelect();
                setSelectedAgent(null);
              }}
              className="px-1 text-white hover:bg-neutral-800"
            >
              [X]
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F0EEE9]">
            {/* Identity */}
            <div className="p-2 bg-white border-2 border-[#1A1A1A]">
              <div className="text-[9px] text-neutral-500 font-bold mb-0.5">CARGO & DEPARTAMENTO</div>
              <div className="text-xs font-bold text-[#1A1A1A]">{selectedAgent.name}</div>
              <div className="text-[10px] text-blue-800">{selectedAgent.title}</div>
            </div>

            {/* RPG Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white border-2 border-[#1A1A1A]">
                <div className="text-[9px] text-neutral-500 font-bold">TOKENS EXP</div>
                <div className="text-xs font-bold text-neutral-900 mt-0.5">
                  {selectedAgent.tokensProcessed.toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-white border-2 border-[#1A1A1A]">
                <div className="text-[9px] text-neutral-500 font-bold">CUSTO GOLD</div>
                <div className="text-xs font-bold text-amber-700 mt-0.5">${selectedAgent.costUsd.toFixed(2)}</div>
              </div>
            </div>

            {/* Authorized Tools */}
            <div className="p-2 bg-white border-2 border-[#1A1A1A]">
              <div className="text-[9px] text-neutral-500 font-bold mb-1">EQUIPAMENTO (TOOLS)</div>
              <div className="flex flex-wrap gap-1">
                {selectedAgent.activeTools.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 bg-neutral-100 border border-[#1A1A1A] text-[9px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Job & Evidences */}
            {selectedJob && (
              <div className="p-2 bg-amber-50 border-2 border-[#1A1A1A] space-y-1.5">
                <div className="text-[9px] font-bold text-amber-900">JOB ATIVO: {selectedJob.id}</div>
                <div className="text-[10px] font-bold text-[#1A1A1A]">{selectedJob.title}</div>
                <div className="text-[9px] text-neutral-600">Cliente: {selectedJob.client}</div>

                <div className="text-[9px] font-bold text-neutral-700 mt-1">EVIDÊNCIAS DE ENTREGA:</div>
                <ul className="space-y-1">
                  {selectedJob.evidence.map((ev, i) => (
                    <li key={i} className="flex items-start space-x-1 text-[9px] text-neutral-800">
                      <span className="text-emerald-700 font-bold shrink-0">[V]</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Retro 8-Bit Human Approval Gate Modal (ADR-0028) */}
      {showApprovalModal && pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#F0EEE9] border-4 border-[#1A1A1A] shadow-[8px_8px_0_0_#1A1A1A] p-5 space-y-3 font-silkscreen">
            <div className="flex items-center space-x-2 text-red-700 border-b-2 border-[#1A1A1A] pb-2">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <h2 className="text-xs font-bold text-[#1A1A1A]">HUMAN APPROVAL GATE — ADR-0028</h2>
            </div>

            <div className="p-3 bg-white border-2 border-[#1A1A1A] space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">AÇÃO:</span>
                <span className="font-bold text-red-700">PRODUÇÃO (DEPLOY EM PROD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">JOB:</span>
                <span className="font-bold text-[#1A1A1A]">{pendingJob.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">SOLICITANTE:</span>
                <span className="font-bold text-purple-700">AI DEVOPS</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-neutral-700">EVIDÊNCIAS DE VERIFICAÇÃO (VERIFY):</span>
              <div className="p-2.5 bg-white border-2 border-[#1A1A1A] space-y-1 text-[9px] max-h-36 overflow-y-auto">
                {pendingJob.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start space-x-1.5 text-neutral-800">
                    <span className="text-emerald-700 font-bold">[OK]</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 bg-amber-100 border border-amber-400 text-[9px] text-amber-900 leading-tight">
              Regra de Segurança: AI → AI → AI → HUMAN. O agente DevOps não tem permissão para alterar produção sem o aval do Diretor Técnico.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                disabled={isProcessingApproval}
                onClick={handleReject}
                className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] text-[10px] font-bold"
              >
                [ REJEITAR ]
              </button>
              <button
                disabled={isProcessingApproval}
                onClick={handleApprove}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] text-[10px] font-bold flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isProcessingApproval ? 'PROCESSANDO...' : '[ APROVAR DEPLOY ]'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
