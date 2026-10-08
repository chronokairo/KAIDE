'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronRight, Loader2, Minus, Plus, RotateCcw, X, MessageSquare, Terminal, Paperclip, ShieldCheck, Mic, Send, Phone, PanelLeft, PanelsTopLeft, PanelRight } from 'lucide-react';
import { useCompanyMonitor } from '@/application/use-cases/use-company-monitor';
import { httpCompanyMonitor } from '@/infrastructure/control-plane/http-company-monitor-adapter';
import type { AgentEntity, AgentRole, AgentStatus, ApprovalGate } from '@/domain/company';
import { AtelierScene, type AtelierCamera } from './AtelierScene';
import styles from './CompanyMonitor.module.css';
import { fetchAvailableModels, type ModelInfo } from '@/modules/ai/components/chat-types';
import { sendNvidiaAgentMessage } from '@/infrastructure/llm/nvidia-agent-chat-adapter';

const ROLE_LABEL: Record<AgentRole, string> = {
  human_director: 'Diretoria Humana',
  commercial: 'AI Comercial',
  analyst: 'AI Analista',
  product: 'AI Product',
  coder: 'AI Coder',
  qa: 'AI QA',
  devops: 'AI DevOps',
  support: 'AI Support',
  finance: 'AI Finance / Ops',
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  working: 'Em execução',
  waiting_approval: 'Aguardando aprovação',
  idle: 'Disponível',
  handoff: 'Em transferência',
  offline: 'Offline',
};

const GATE_ACTION_LABEL: Record<ApprovalGate['type'], string> = {
  outbound_contact: 'Aprovar e liberar envio',
  payment_release: 'Aprovar e liberar cobrança',
  scope_baseline: 'Aprovar baseline de escopo',
  production_deploy: 'Aprovar e autorizar deploy',
};

const DISPATCH_JOBS: Array<{ name: string; role: AgentRole; label: string; detail: string }> = [
  {
    name: 'commercial.followup',
    role: 'commercial',
    label: 'Follow-up de leads',
    detail: 'Varre o CRM e retém rascunhos em gate',
  },
  {
    name: 'commercial.daily',
    role: 'commercial',
    label: 'Varredura diária',
    detail: 'Prospecção e qualificação de demanda',
  },
];

const CLI_JOBS: Array<{ label: string; script: string }> = [
  { label: 'Revisão adversarial de PR', script: 'npm run job:qa:review_pr' },
];

const pad = (value: number) => String(value).padStart(2, '0');

function StatusDot({ status }: { status: AgentStatus }) {
  if (status === 'working') {
    return <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-current" aria-label="Em execução" />;
  }
  if (status === 'waiting_approval') {
    return <span className="h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px] border-current" aria-label="Aguardando aprovação" />;
  }
  return <span className="h-2 w-2 shrink-0 rounded-full bg-current opacity-25" aria-label="Disponível" />;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="font-mono text-[13px] text-[#191919]">{value}</span>
      <span className="mt-1 text-[9px] uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[#6E6C66]">{children}</span>;
}

export function CompanyMonitor() {
  const {
    agents,
    jobs,
    telemetry,
    isLoading,
    error,
    updatedAt,
    selectedAgent,
    setSelectedAgent,
    selectedJob,
    setSelectedJob,
    approveGate,
    rejectGate,
    dispatchJob,
  } = useCompanyMonitor(httpCompanyMonitor);

  const camera = useRef<AtelierCamera>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [workspaceAgent, setWorkspaceAgent] = useState<AgentEntity | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [nvidiaModels, setNvidiaModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [permissionMode, setPermissionMode] = useState<'read' | 'request' | 'approve' | 'full'>('request');
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalPanelOpen, setTerminalPanelOpen] = useState(true);
  const [secondarySidebarOpen, setSecondarySidebarOpen] = useState(false);
  const [automationsOpen, setAutomationsOpen] = useState(false);
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [floatingInput, setFloatingInput] = useState('');
  const [floatingReply, setFloatingReply] = useState('');

  useEffect(() => { void fetchAvailableModels().then((models) => { setNvidiaModels(models); setSelectedModel(models[0]?.id ?? ''); }).catch((failure) => setChatError(failure instanceof Error ? failure.message : 'Falha ao consultar modelos NVIDIA NIM.')); }, []);

  const pendingJob = jobs.find(
    (job) => job.status === 'waiting_approval' && job.approvalGate?.status === 'pending'
  );
  const gate = pendingJob?.approvalGate;

  const activeJob =
    selectedJob ??
    (selectedAgent
      ? jobs.find(
          (job) =>
            job.agentRole === selectedAgent.role &&
            (job.status === 'in_progress' || job.status === 'waiting_approval')
        ) ?? null
      : null);

  const handleDispatch = async (jobName: string, role: AgentRole) => {
    setDispatching(jobName);
    setDispatchError(null);
    try {
      const job = await dispatchJob(jobName);
      const target = agents.find((agent) => agent.role === role);
      if (target) setSelectedAgent(target);
      setSelectedJob(job);
      if (job.requiresApproval && job.approvalGate) {
        setGateError(null);
        setRejectReason('');
        setModalOpen(true);
      }
    } catch (failure) {
      setDispatchError(failure instanceof Error ? failure.message : 'Falha ao disparar job.');
    } finally {
      setDispatching(null);
    }
  };

  const handleApprove = async () => {
    if (!gate) return;
    setProcessing(true);
    setGateError(null);
    try {
      await approveGate(
        gate.id,
        'Autorizado pelo Diretor Técnico após conferência das evidências.'
      );
      setModalOpen(false);
      setRejectReason('');
    } catch (failure) {
      setGateError(failure instanceof Error ? failure.message : 'Falha ao aprovar gate.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!gate) return;
    setProcessing(true);
    setGateError(null);
    try {
      await rejectGate(gate.id, rejectReason.trim() || 'Rejeitado pelo Diretor Técnico para revisão.');
      setModalOpen(false);
      setRejectReason('');
    } catch (failure) {
      setGateError(failure instanceof Error ? failure.message : 'Falha ao rejeitar gate.');
    } finally {
      setProcessing(false);
    }
  };

  const selectAgent = (agent: AgentEntity) => {
    setSelectedAgent(null);
    setWorkspaceAgent(agent);
    setSecondarySidebarOpen(true);
    setChatReply('');
    setChatError(null);
  };

  const sendAgentMessage = async () => {
    if (!chatInput.trim() || chatBusy) return;
    setChatBusy(true);
    setChatError(null);
    setChatReply('');
    try {
      if (!selectedModel) throw new Error('Nenhum modelo NVIDIA NIM disponível.');
      const attachment = selectedFile ? `\n[Anexo: ${selectedFile.name}]` : '';
      const mode = `\n[Permissão: ${permissionMode}]`;
      const reply = await sendNvidiaAgentMessage({ agentName: workspaceAgent?.name ?? 'Chronokairo AI Enterprise', content: `${chatInput.trim()}${attachment}${mode}`, model: selectedModel });
      setChatReply(reply);
      setChatInput('');
      setSelectedFile(null);
    } catch (failure) {
      setChatError(failure instanceof Error ? failure.message : 'Falha ao consultar NVIDIA NIM.');
    } finally {
      setChatBusy(false);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => { lang: string; start(): void; stop(): void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null } }).SpeechRecognition;
    if (!SpeechRecognition) { setChatError('Voice to text não é suportado neste navegador.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onresult = (event) => setChatInput((current) => `${current} ${event.results[0][0].transcript}`.trim());
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const askFloatingChat = async () => {
    if (!floatingInput.trim() || !selectedModel || chatBusy) return;
    setChatBusy(true);
    setChatError(null);
    try {
      const reply = await sendNvidiaAgentMessage({ agentName: 'Chronokairo AI Enterprise', content: floatingInput.trim(), model: selectedModel });
      setFloatingReply(reply);
      setFloatingInput('');
    } catch (failure) {
      setChatError(failure instanceof Error ? failure.message : 'Falha ao consultar NVIDIA NIM.');
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-[#F0EEE9] font-sans text-[#191919]">
      {/* Cabeçalho editorial */}
      <header className="z-10 grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-6 border-b border-[#DCD9D0] px-6">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="text-[15px] font-semibold tracking-tight">
            Chrono<span className="italic">kairo</span>
          </span>
          <span className="text-[#C7C4BB]">·</span>
          <span className="truncate text-[10px] uppercase tracking-[0.22em] text-[#6E6C66]">
            Empresa virtual — Control Plane
          </span>
        </div>

        <div className="flex items-center justify-center gap-8">
          {telemetry && (
            <div className="hidden items-center gap-6 text-[#6E6C66] lg:flex">
              <Stat value={`${telemetry.activeAgentsCount}/${agents.length}`} label="agentes ativos" />
              <span className="h-6 w-px bg-[#DCD9D0]" />
              <Stat value={`${telemetry.totalJobsCompleted}`} label="entregas" />
              <span className="h-6 w-px bg-[#DCD9D0]" />
              <Stat value={`$${telemetry.totalCostUsd.toFixed(2)}`} label="custo acumulado" />
              <span className="h-6 w-px bg-[#DCD9D0]" />
              <Stat value={`${telemetry.pendingApprovalsCount}`} label="gates pendentes" />
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#6E6C66]">
            {error ? (
              <span className="flex items-center gap-1.5" title={error}>
                <AlertTriangle className="h-3.5 w-3.5 text-[#191919]" />
                Falha de conexão
              </span>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[#191919]" />
                <span>
                  Sync {updatedAt ? updatedAt.toLocaleTimeString('pt-BR', { hour12: false }) : '—'}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 border-l border-[#DCD9D0] pl-3">
          <button onClick={() => setSidebarOpen((open) => !open)} className="rounded-full p-2 text-[#6E6C66] hover:bg-[#E7E4DC] hover:text-[#191919]" title="Mostrar/ocultar sidebar principal" aria-label="Mostrar ou ocultar sidebar principal"><PanelLeft className="h-4 w-4" /></button>
          <button onClick={() => setTerminalPanelOpen((open) => !open)} className={`rounded-full p-2 text-[#6E6C66] hover:bg-[#E7E4DC] hover:text-[#191919] ${terminalPanelOpen ? 'bg-[#E7E4DC] text-[#191919]' : ''}`} title="Mostrar/ocultar painel do terminal" aria-label="Mostrar ou ocultar painel do terminal"><PanelsTopLeft className="h-4 w-4" /></button>
          <button onClick={() => { setSecondarySidebarOpen((open) => !open); if (secondarySidebarOpen) setWorkspaceAgent(null); }} className={`rounded-full p-2 text-[#6E6C66] hover:bg-[#E7E4DC] hover:text-[#191919] ${secondarySidebarOpen ? 'bg-[#E7E4DC] text-[#191919]' : ''}`} title="Mostrar/ocultar sidebar secundário" aria-label="Mostrar ou ocultar sidebar secundário"><PanelRight className="h-4 w-4" /></button>
        </div>
      </header>

      <div className={`flex min-h-0 flex-1 ${secondarySidebarOpen ? 'sm:pr-[clamp(280px,24vw,360px)]' : ''}`}>
        {/* Rótulo de estações e disparo de jobs */}
        <aside className={`${sidebarOpen ? 'flex' : 'hidden'} w-full sm:w-[clamp(280px,24vw,360px)] shrink-0 flex-col border-r border-[#DCD9D0] bg-[#F5F3EE]`}>
          <div className="flex items-center justify-between border-b border-[#DCD9D0] px-5 py-4">
            <SectionLabel>Estações</SectionLabel>
            <span className="font-mono text-[11px] text-[#6E6C66]">{pad(agents.length)}</span>
          </div>

          <nav className="flex-1 overflow-y-auto" aria-label="Agentes da empresa virtual">
            {agents.map((agent, index) => {
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <div key={agent.id}>
                <button
                  onClick={() => selectAgent(agent)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`flex w-full cursor-pointer items-center gap-3 border-b border-[#DCD9D0]/60 px-5 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#191919] text-[#F0EEE9]'
                      : 'text-[#191919] hover:bg-[#ECE9E1]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] ${
                      isSelected ? 'text-[#F0EEE9]/50' : 'text-[#A19E95]'
                    }`}
                  >
                    {pad(index + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{agent.name}</span>
                    <span
                      className={`block truncate text-[10px] uppercase tracking-[0.14em] ${
                        isSelected ? 'text-[#F0EEE9]/55' : 'text-[#8B8880]'
                      }`}
                    >
                      {agent.department}
                    </span>
                  </span>
                  <StatusDot status={agent.status} />
                </button>
                {isSelected && jobs.filter((job) => job.agentRole === agent.role).slice(0, 4).map((session) => (
                  <button key={session.id} onClick={() => { setSelectedJob(session); setWorkspaceAgent(agent); setSecondarySidebarOpen(true); }} className="flex w-full items-center gap-2 border-b border-[#DCD9D0]/50 bg-[#ECE9E1] px-10 py-2 text-left hover:bg-[#E3E0D8]"><span className="h-1.5 w-1.5 rounded-full bg-[#8B8880]" /><span className="min-w-0 truncate text-[10px] text-[#6E6C66]">{session.title}</span></button>
                ))}
                {isSelected && jobs.filter((job) => job.agentRole === agent.role).length === 0 && <div className="border-b border-[#DCD9D0]/50 bg-[#ECE9E1] px-10 py-2 font-mono text-[10px] text-[#A19E95]">Nenhuma sessão registrada</div>}
                </div>
              );
            })}
          </nav>

          <div className="border-t border-[#DCD9D0] px-5 py-4">
            <button onClick={() => setAutomationsOpen((open) => !open)} className="mt-4 flex w-full items-center justify-between border border-[#191919]/25 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.14em] transition-colors hover:bg-[#191919] hover:text-[#F0EEE9]"><span>Automações</span><ChevronRight className={`h-3.5 w-3.5 transition-transform ${automationsOpen ? 'rotate-90' : ''}`} /></button>
            {automationsOpen && <div className="mt-2 space-y-1.5">{DISPATCH_JOBS.map((job) => <button key={job.name} onClick={() => void handleDispatch(job.name, job.role)} disabled={dispatching !== null || !dispatchJob} className="flex w-full items-center justify-between px-2 py-1 text-left text-[10px] text-[#6E6C66] hover:bg-[#ECE9E1] disabled:opacity-40"><span>{job.label}</span>{dispatching === job.name && <Loader2 className="h-3 w-3 animate-spin" />}</button>)}{CLI_JOBS.map((job) => <div key={job.script} className="px-2 py-1 font-mono text-[10px] text-[#8B8880]">{job.label}</div>)}{dispatchError && <p className="px-2 font-mono text-[10px] text-[#191919]">{dispatchError}</p>}</div>}
          </div>
        </aside>

        {/* Cena Three.js — acompanhamento somente leitura */}
        <main className="relative min-w-0 flex-1">
          <AtelierScene
            agents={agents}
            jobs={jobs}
            selectedId={selectedAgent?.id}
            onSelect={selectAgent}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 border border-[#DCD9D0] bg-[#F5F3EE] px-4 py-2.5 font-mono text-[11px] text-[#6E6C66]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sincronizando com o Control Plane…
              </div>
            </div>
          )}

          {error && (
            <div
              className={`${styles.overlayFadeIn} absolute left-1/2 top-4 z-10 max-w-md -translate-x-1/2 border border-[#191919] bg-[#F5F3EE] px-4 py-3`}
              role="alert"
            >
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]">
                <AlertTriangle className="h-3.5 w-3.5" />
                Falha ao consultar o Control Plane
              </div>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-[#6E6C66]">
                {error} — nova tentativa automática em instantes.
              </p>
            </div>
          )}

          {/* Fala da estação selecionada */}
          <div className="pointer-events-none absolute inset-x-6 bottom-6 max-w-xl">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#6E6C66]">
              {selectedAgent ? selectedAgent.name : 'Central de Controle'}
            </div>
            <p className="mt-1.5 font-mono text-xs leading-relaxed text-[#4A4842]">
              {selectedAgent
                ? selectedAgent.currentTask
                : 'Observação passiva do event log — nenhum fluxo atinge produção sem aprovação humana.'}
            </p>
          </div>

          {/* Controles de câmera */}
          <div className="absolute bottom-6 right-6 flex flex-col border border-[#DCD9D0] bg-[#F5F3EE]/90 p-1 backdrop-blur-sm">
            <button
              onClick={() => camera.current?.zoom(1)}
              className="cursor-pointer p-2 text-[#6E6C66] transition-colors hover:bg-[#191919] hover:text-[#F0EEE9]"
              aria-label="Aproximar câmera"
              title="Aproximar"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => camera.current?.zoom(-1)}
              className="cursor-pointer p-2 text-[#6E6C66] transition-colors hover:bg-[#191919] hover:text-[#F0EEE9]"
              aria-label="Afastar câmera"
              title="Afastar"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="mx-2 my-0.5 border-t border-[#DCD9D0]" />
            <button
              onClick={() => camera.current?.reset()}
              className="cursor-pointer p-2 text-[#6E6C66] transition-colors hover:bg-[#191919] hover:text-[#F0EEE9]"
              aria-label="Restaurar câmera"
              title="Restaurar enquadramento"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Gate humano pendente */}
          {telemetry && telemetry.pendingApprovalsCount > 0 && (
            <button
              onClick={() => {
                setGateError(null);
                setModalOpen(true);
              }}
              className={`${styles.gateBreathe} absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-3 bg-[#191919] py-2.5 pl-4 pr-3 text-[#F0EEE9] transition-colors hover:bg-black`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em]">Gate humano</span>
              <span className="font-mono text-[11px] text-[#F0EEE9]/70">
                {telemetry.pendingApprovalsCount}{' '}
                {telemetry.pendingApprovalsCount === 1 ? 'decisão pendente' : 'decisões pendentes'}
              </span>
              <span className="flex items-center gap-1 border-l border-[#F0EEE9]/25 pl-3 text-[11px] uppercase tracking-[0.18em]">
                Revisar
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          )}
        </main>

        {/* Inspetor da estação */}
        {selectedAgent && !workspaceAgent && (
          <aside
            className={`${styles.panelRiseIn} flex w-[340px] shrink-0 flex-col border-l border-[#DCD9D0] bg-[#F5F3EE]`}
            aria-label="Detalhes da estação"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#DCD9D0] px-5 py-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E6C66]">
                  Estação {pad(agents.findIndex((a) => a.id === selectedAgent.id) + 1)} ·{' '}
                  {ROLE_LABEL[selectedAgent.role]}
                </span>
                <div className="mt-1.5 text-sm font-semibold">{selectedAgent.name}</div>
                <div className="mt-0.5 text-xs text-[#6E6C66]">{selectedAgent.title}</div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="cursor-pointer p-1 text-[#A19E95] transition-colors hover:text-[#191919]"
                aria-label="Fechar inspetor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <div className="flex items-center gap-2">
                <StatusDot status={selectedAgent.status} />
                <span className="text-[11px] uppercase tracking-[0.16em]">
                  {STATUS_LABEL[selectedAgent.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-px border border-[#DCD9D0] bg-[#DCD9D0]">
                <div className="bg-[#F5F3EE] p-3">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#A19E95]">Tokens</span>
                  <p className="mt-1 font-mono text-sm">
                    {selectedAgent.tokensProcessed.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-[#F5F3EE] p-3">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#A19E95]">Custo</span>
                  <p className="mt-1 font-mono text-sm">${selectedAgent.costUsd.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <SectionLabel>Ferramentas autorizadas</SectionLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedAgent.activeTools.map((tool) => (
                    <span
                      key={tool}
                      className="border border-[#191919]/20 px-2 py-0.5 font-mono text-[10px] text-[#4A4842]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Job ativo</SectionLabel>
                {activeJob ? (
                  <div className="mt-2 border border-[#DCD9D0] bg-[#F0EEE9]">
                    <div className="border-b border-[#DCD9D0] px-3 py-2.5">
                      <div className="text-[12px] font-medium">{activeJob.title}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-[#8B8880]">
                        {activeJob.project} · {activeJob.status === 'waiting_approval' ? 'retido em gate' : activeJob.status}
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#A19E95]">
                        Evidências
                      </span>
                      <ul className="mt-1.5 space-y-1.5">
                        {activeJob.evidence.length > 0 ? (
                          activeJob.evidence.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-[11px] leading-relaxed text-[#4A4842]">
                              <span className="font-mono text-[9px] text-[#A19E95]">{pad(index + 1)}</span>
                              <span className="font-mono">{item}</span>
                            </li>
                          ))
                        ) : (
                          <li className="font-mono text-[10px] text-[#A19E95]">—</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 font-mono text-[10px] text-[#A19E95]">
                    Nenhum job ativo para esta estação.
                  </p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {secondarySidebarOpen && (
        <div className="fixed inset-y-0 right-0 z-40 flex w-full sm:w-[clamp(280px,24vw,360px)] border-l border-[#191919] bg-[#F0EEE9] shadow-[-12px_0_0_rgba(25,25,25,0.08)]">
          <section className="flex h-full w-full flex-col" aria-label={`Chat ${workspaceAgent ? `de ${workspaceAgent.name}` : 'geral'}`}>
            <header className="flex items-center justify-between border-b border-[#191919] px-5 py-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#6E6C66]">Workspace do agente</div>
                <div className="mt-1 text-sm font-semibold">{workspaceAgent?.name ?? 'Chat geral'}</div>
              </div>
              <button onClick={() => setWorkspaceAgent(null)} className="cursor-pointer p-1 text-[#6E6C66] hover:text-[#191919]" aria-label="Fechar workspace"><X className="h-4 w-4" /></button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col bg-[#F5F3EE]">
                <div className="flex items-center gap-2 border-b border-[#DCD9D0] px-4 py-3 text-[11px] uppercase tracking-[0.16em]"><MessageSquare className="h-3.5 w-3.5" /> chat · NVIDIA NIM</div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed"><div className="text-[#6E6C66]">Modelo: NVIDIA NIM · contexto: {workspaceAgent?.name ?? 'geral'}</div>{chatReply && <div className="mt-4 whitespace-pre-wrap border-l-2 border-[#191919] pl-3">{chatReply}</div>}{chatError && <div className="mt-4 text-red-700">{chatError}</div>}</div>
                <div className="shrink-0 border-t border-[#DCD9D0] bg-[#F5F3EE]">
                  <div className="border-b border-[#DCD9D0] px-3 py-2"><div className="text-[9px] uppercase tracking-[0.18em] text-[#8B8880]">Tools usados / autorizados</div><div className="mt-1 flex flex-wrap gap-1">{(workspaceAgent?.activeTools ?? ['control_plane', 'nvidia_nim', 'approval_gate']).map((tool, index) => <span key={`${tool}-${index}`} className="rounded-full border border-[#191919]/15 bg-[#ECE9E1] px-2 py-0.5 font-mono text-[9px] text-[#4A4842]">{tool}</span>)}</div></div>
                  <div className="p-3">
                  <input id="agent-attachment" type="file" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
                  <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendAgentMessage(); } }} placeholder="Peça qualquer coisa" rows={2} className="w-full resize-none bg-transparent px-1 py-1 font-mono text-[11px] outline-none" disabled={chatBusy} />
                  <div className="flex items-center gap-1.5 text-[10px] text-[#6E6C66]">
                    <label htmlFor="agent-attachment" className="cursor-pointer rounded-full p-2 hover:bg-[#E7E4DC]" title={selectedFile?.name || 'Anexar arquivo'}><Paperclip className="h-4 w-4" /></label>
                    <button type="button" onClick={() => setPermissionMode(permissionMode === 'read' ? 'request' : permissionMode === 'request' ? 'approve' : permissionMode === 'approve' ? 'full' : 'read')} className="flex items-center gap-1 rounded-full px-2 py-1.5 hover:bg-[#E7E4DC]" title="Alternar nível de permissão"><ShieldCheck className="h-3.5 w-3.5" />{permissionMode === 'read' ? 'Somente leitura' : permissionMode === 'request' ? 'Solicitar acesso' : permissionMode === 'approve' ? 'Aprovar ações' : 'Acesso completo'}</button>
                    <span className="flex-1" />
                    <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} className="w-[240px] min-w-[220px] rounded-full border border-[#191919]/15 bg-[#ECE9E1] px-3 py-1.5 font-mono text-[10px] text-[#191919] outline-none transition-colors hover:border-[#191919]/40 focus:border-[#191919]" aria-label="Modelo NVIDIA NIM" disabled={!nvidiaModels.length}>{nvidiaModels.map((model, index) => <option key={`${model.id}-${index}`} value={model.id}>{model.name || model.id}</option>)}</select>
                    <button type="button" onClick={toggleVoiceInput} className={`rounded-full p-2 hover:bg-[#E7E4DC] ${listening ? 'text-red-600' : ''}`} title="Voice to text"><Mic className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void sendAgentMessage()} disabled={chatBusy} className="rounded-full bg-[#2F6BDB] p-2.5 text-white shadow-sm disabled:opacity-40" title={chatInput.trim() || selectedFile ? 'Enviar' : 'Iniciar chamada'}>{chatInput.trim() || selectedFile ? <Send className="h-4 w-4" /> : <Phone className="h-4 w-4" />}</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {terminalPanelOpen && (
        <aside className="fixed bottom-0 left-0 right-0 z-30 flex h-56 flex-col border-t border-[#191919] bg-[#111] text-[#E7E5E0] shadow-[0_-8px_20px_rgba(25,25,25,0.12)]" aria-label="Painel do terminal">
          <div className="flex h-9 items-center justify-between border-b border-white/10 px-4 font-mono text-[11px]"><span className="flex items-center gap-2"><Terminal className="h-3.5 w-3.5" /> TERMINAL{workspaceAgent ? ` · ${workspaceAgent.role}` : ''}</span><button onClick={() => setTerminalPanelOpen(false)} className="text-zinc-400 hover:text-white" aria-label="Fechar painel do terminal"><X className="h-3.5 w-3.5" /></button></div>
          <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-6"><div className="text-emerald-400">$ NVIDIA_NIM_PROVIDER=enabled</div><div className="text-zinc-400">$ agent attach --role {workspaceAgent?.role ?? 'control-plane'}</div><div className="mt-3 text-zinc-300">Painel vinculado ao body e ao Control Plane.</div><div className="text-zinc-500">Comandos executados pelo agente aparecem aqui com auditoria.</div><div className="mt-4 text-amber-300">aguardando comando…</div></div>
        </aside>
      )}

      {/* Modal do gate de aprovação humana (ADR-0028) */}
      {modalOpen && pendingJob && gate && (
        <div
          className={`${styles.overlayFadeIn} fixed inset-0 z-50 flex items-center justify-center bg-[#191919]/35 p-4 backdrop-blur-[2px]`}
          role="dialog"
          aria-modal="true"
          aria-label="Gate de aprovação humana"
          onClick={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <div className="w-full max-w-xl border border-[#191919] bg-[#F0EEE9] shadow-[10px_10px_0_rgba(25,25,25,0.18)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#191919] px-6 py-4">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#6E6C66]">
                  Gate de aprovação humana
                </span>
                <p className="mt-1 text-[11px] text-[#8B8880]">
                  AI → AI → AI → HUMAN · nenhuma ação externa ocorre sem esta decisão.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="cursor-pointer p-1 text-[#A19E95] transition-colors hover:text-[#191919]"
                aria-label="Decidir depois"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <h2 className="text-lg font-semibold leading-snug">{gate.title}</h2>

              <dl className="border-t border-[#DCD9D0] text-[12px]">
                <div className="flex justify-between gap-4 border-b border-[#DCD9D0] py-2">
                  <dt className="text-[#8B8880]">Projeto / Contexto</dt>
                  <dd className="text-right font-medium">{pendingJob.project || pendingJob.client}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#DCD9D0] py-2">
                  <dt className="text-[#8B8880]">Tipo de gate</dt>
                  <dd className="text-right font-mono text-[11px] uppercase">{gate.type}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#DCD9D0] py-2">
                  <dt className="text-[#8B8880]">Solicitante</dt>
                  <dd className="text-right font-medium">{ROLE_LABEL[gate.requestedBy]}</dd>
                </div>
              </dl>

              <div>
                <SectionLabel>Evidências anexadas</SectionLabel>
                <ul className="mt-2 border border-[#DCD9D0] bg-[#F5F3EE]">
                  {gate.evidence.length > 0 ? (
                    gate.evidence.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 border-b border-[#DCD9D0]/70 px-3 py-2 text-[11px] leading-relaxed last:border-b-0"
                      >
                        <span className="font-mono text-[9px] text-[#A19E95]">{pad(index + 1)}</span>
                        <span className="font-mono text-[#4A4842]">{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 font-mono text-[10px] text-[#A19E95]">—</li>
                  )}
                </ul>
              </div>

              {gate.type === 'outbound_contact' && (
                <p className="text-[11px] leading-relaxed text-[#6E6C66]">
                  Ao aprovar, o envio real é processado via Resend com registro auditorado de eventos.
                </p>
              )}

              <div>
                <SectionLabel>Motivo da rejeição (opcional)</SectionLabel>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={2}
                  className="mt-2 w-full resize-none border border-[#191919]/25 bg-[#F5F3EE] px-3 py-2 font-mono text-[11px] text-[#191919] outline-none transition-colors placeholder:text-[#A19E95] focus:border-[#191919]"
                  placeholder="Descreva o ajuste solicitado ao agente…"
                />
              </div>

              {gateError && (
                <p className="flex items-center gap-2 font-mono text-[10px] text-[#191919]" role="alert">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {gateError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#191919] px-6 py-4">
              <button
                onClick={() => setModalOpen(false)}
                disabled={processing}
                className="cursor-pointer text-[11px] uppercase tracking-[0.18em] text-[#6E6C66] transition-colors hover:text-[#191919] disabled:opacity-40"
              >
                Decidir depois
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="cursor-pointer border border-[#191919]/40 px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-[#191919] disabled:opacity-40"
                >
                  Rejeitar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex cursor-pointer items-center gap-2 bg-[#191919] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#F0EEE9] transition-colors hover:bg-black disabled:opacity-40"
                >
                  {processing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {GATE_ACTION_LABEL[gate.type]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
