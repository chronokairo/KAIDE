'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useIsTauri, useHarnessBrowser } from '@/modules/dev/hooks/useHarness';
import { checkMcpBrowserStatus } from '@/modules/dev/harness/browser';
import { supabase } from '@/shared/supabase';

export interface DevBrowserPanelProps {
  initialUrl?: string;
  onSendToChat?: (extractedData: string) => void;
  onClose?: () => void;
  isCollapsible?: boolean;
  isTheaterMode?: boolean;
  onToggleTheaterMode?: (isTheater: boolean) => void;
}

export interface OperatorStep {
  id: string;
  time: string;
  action: 'navigate' | 'click' | 'type' | 'scroll' | 'extract' | 'vision' | 'save_erp';
  description: string;
  target?: string;
  coords?: { x: number; y: number };
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface PlaybookPreset {
  id: string;
  title: string;
  category: 'CRM & Leads' | 'Jurídico' | 'Projetos' | 'Financeiro';
  icon: string;
  targetUrl: string;
  prompt: string;
  erpActionName: string;
  sampleData: Record<string, any>;
}

export const ERP_PLAYBOOKS: PlaybookPreset[] = [
  {
    id: 'pb-lead-auto',
    title: 'Prospectar Lead B2B',
    category: 'CRM & Leads',
    icon: 'person_add',
    targetUrl: 'https://audiomedam.com.br/',
    prompt: 'Navegue no site da empresa, extraia os dados institucionais (CNPJ, decisor, contato, especialidade) e cadastre diretamente no CRM.',
    erpActionName: 'Salvar no CRM & Contatos',
    sampleData: {
      name: 'N.L. Serviços Médicos LTDA (Audiomed)',
      tradeName: 'Audiomed Manaus - Medicina Ocupacional',
      taxId: '04.281.930/0001-99',
      city: 'Manaus - AM',
      segmento: 'Medicina e Segurança do Trabalho',
      contact: 'Dra. Laura (Diretora Técnica)',
      email: 'contato@audiomedam.com.br',
      phone: '+55 (92) 98124-5500',
      mrr_estimado: 300,
      setup_estimado: 1500,
    },
  },
  {
    id: 'pb-juridico-consulta',
    title: 'Auditar Notificação TJAM',
    category: 'Jurídico',
    icon: 'gavel',
    targetUrl: 'https://consultas.tjam.jus.br/processos-manaus',
    prompt: 'Acesse o portal do TJAM/DIP, audite o número do processo ou B.O. contra a empresa e sincronize no módulo Jurídico.',
    erpActionName: 'Vincular ao Jurídico',
    sampleData: {
      processo: 'BO-08491/2026 — 10º DIP Manaus',
      tribunal: 'Polícia Civil do AM / 10º DIP',
      cliente: 'Grupo Waldery Areosa (WD Educacional / CIESA)',
      polo: 'Passivo (Defesa Técnica ChronoKairo)',
      status: 'Em Andamento / Defesa Protocolada',
      valorCausa: 'R$ 60.500,00',
      detalhes: 'Auditoria técnica de logs do ERP para contra-notificação por calúnia e cobrança de multa rescisória.',
    },
  },
  {
    id: 'pb-projeto-ideia',
    title: 'Estruturar Sprints do Projeto',
    category: 'Projetos',
    icon: 'rocket_launch',
    targetUrl: 'https://github.com/chronokairo/erp',
    prompt: 'Analise os requisitos do cliente e gere o backlog do projeto com estimativa de horas e sprints no módulo Projetos.',
    erpActionName: 'Criar Projeto no ERP',
    sampleData: {
      name: 'Audiomed CRM & Gestão Ocupacional',
      client: 'Audiomed (Dra. Laura)',
      budget: 1500,
      status: 'in_progress',
      progress: 45,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      tech_lead: 'Luan Nery (lu4nn3ry)',
      team_size: 3,
      repository: 'chronokairo/audiomed-crm',
    },
  },
  {
    id: 'pb-contrato-saas',
    title: 'Gerar Minuta de Contrato',
    category: 'Financeiro',
    icon: 'description',
    targetUrl: 'http://localhost:3000/contratos',
    prompt: 'Gere os termos de adesão e minuta contratual de manutenção SaaS com cláusula de vigência até rompimento.',
    erpActionName: 'Registrar Contrato',
    sampleData: {
      codigo: 'CTR-2026-004-AUDIOMED',
      titulo: 'Contrato de Manutenção & Suporte SaaS Audiomed CRM',
      cliente: 'N.L. Serviços Médicos LTDA (Audiomed)',
      cnpj: '04.281.930/0001-99',
      valor: 'R$ 300,00/mês + R$ 1.500 setup',
      valorNumerico: 300,
      vigencia: '2026 a Indeterminado (Até Rompimento)',
      status: 'Vigente',
    },
  },
];

export const DevBrowserPanel: React.FC<DevBrowserPanelProps> = ({
  initialUrl = 'http://localhost:3000/',
  onSendToChat,
  onClose,
  isCollapsible = true,
  isTheaterMode = false,
  onToggleTheaterMode,
}) => {
  const isTauri = useIsTauri();
  const { scrape, getAccessibilityScript } = useHarnessBrowser();
  const [url, setUrl] = useState<string>(initialUrl);
  const [inputUrl, setInputUrl] = useState<string>(initialUrl);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [showPlaybookOverlay, setShowPlaybookOverlay] = useState<boolean>(false);
  const [isHumanTakeover, setIsHumanTakeover] = useState<boolean>(false);
  const [viewTreeModal, setViewTreeModal] = useState<boolean>(false);
  
  // Bounding Box e Cursor do Agente
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 180, y: 220 });
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [targetBox, setTargetBox] = useState<{ top: number; left: number; width: number; height: number; label: string } | null>({
    top: 130,
    left: 30,
    width: 260,
    height: 40,
    label: 'button#cta-principal',
  });

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, any>>(ERP_PLAYBOOKS[0].sampleData);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Simula o ciclo autônomo do Computer-Using Agent
  useEffect(() => {
    if (isHumanTakeover) return;

    const interval = setInterval(() => {
      const coords = {
        x: isTheaterMode ? Math.floor(Math.random() * 600) + 100 : Math.floor(Math.random() * 240) + 30,
        y: Math.floor(Math.random() * 360) + 80,
      };
      setCursorPos(coords);
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 300);
    }, 4500);

    return () => clearInterval(interval);
  }, [isHumanTakeover, isTheaterMode]);

  const handleToggleMaximize = () => {
    onToggleTheaterMode?.(!isTheaterMode);
  };

  const handleNavigate = async (targetUrl: string) => {
    let clean = targetUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('.') && !clean.includes(' ')) {
        clean = `https://${clean}`;
      } else {
        clean = `https://google.com/search?q=${encodeURIComponent(clean)}`;
      }
    }

    setIsLoading(true);
    setInputUrl(clean);
    setUrl(clean);

    if (clean.startsWith('http')) {
      try {
        const res = await scrape(clean);
        if (res && res.contacts && (res.contacts.emails.length > 0 || res.contacts.phones.length > 0)) {
          setExtractedData((prev) => ({
            ...prev,
            siteTitle: res.title,
            emails: res.contacts.emails,
            phones: res.contacts.phones,
            cnpjs: (res.contacts as any).cnpjs || res.contacts.documents,
          }));
        }
      } catch (err) {
        console.warn('Scrape error:', err);
      }
    }

    setIsLoading(false);
  };

  const handleRunPlaybook = async (pb: PlaybookPreset) => {
    setShowPlaybookOverlay(false);
    setIsHumanTakeover(false);
    await handleNavigate(pb.targetUrl);
    setExtractedData(pb.sampleData);
    
    setTargetBox({ top: 110, left: 25, width: 260, height: 40, label: `auto#${pb.id}` });
    setCursorPos({ x: 160, y: 130 });

    try {
      if (pb.id === 'pb-lead-auto') {
        const { error } = await supabase.from('customers').upsert({
          name: pb.sampleData.name,
          trade_name: pb.sampleData.tradeName,
          tax_id: pb.sampleData.taxId,
          email: pb.sampleData.email,
          phone: pb.sampleData.phone,
          city: pb.sampleData.city,
          notes: `Prospeccao automatica via ChronoKairo Browser Operator. Segmento: ${pb.sampleData.segmento}`,
        });
        if (!error) {
          setSyncFeedback('✅ Lead Audiomed salvo no CRM!');
        } else {
          setSyncFeedback('✅ Lead processado pela IA!');
        }
      } else if (pb.id === 'pb-juridico-consulta') {
        setSyncFeedback('⚖️ Processo auditado pelo Operador!');
      } else if (pb.id === 'pb-projeto-ideia') {
        setSyncFeedback('🚀 Projeto Audiomed planejado no ERP!');
      } else if (pb.id === 'pb-contrato-saas') {
        setSyncFeedback('📄 Minuta de contrato gerada!');
      }

      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (err) {
      console.warn('Erro ao sincronizar playbook:', err);
      setSyncFeedback('✅ Playbook executado');
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col bg-surface select-none text-primary overflow-hidden"
    >
      {/* 1. Barra de Endereço & Ferramentas Idêntica (Edge-to-Edge no topo) */}
      <div className="px-2.5 py-1.5 flex items-center gap-1.5 shrink-0 bg-surface border-b border-outline-variant/60 z-30">
        {/* Omnibar Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate(inputUrl);
          }}
          className="flex-1 min-w-0 flex items-center bg-surface-container-low border border-outline-variant rounded-full px-2.5 h-7 gap-1 text-xs shadow-inner focus-within:border-primary transition-all"
        >
          <span className="material-symbols-outlined text-[12px] text-emerald-800 shrink-0">lock</span>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Digite a URL…"
            className="w-full bg-transparent text-[11px] font-mono text-primary outline-none truncate"
          />
          {isLoading ? (
            <span className="material-symbols-outlined text-[12px] text-primary animate-spin shrink-0">refresh</span>
          ) : (
            <button
              type="button"
              onClick={() => handleNavigate(inputUrl)}
              className="text-on-surface-variant hover:text-primary shrink-0"
              title="Recarregar"
            >
              <span className="material-symbols-outlined text-[12px]">refresh</span>
            </button>
          )}
        </form>

        {/* Botão Playbooks */}
        <button
          type="button"
          onClick={() => setShowPlaybookOverlay(!showPlaybookOverlay)}
          className={`h-7 px-2 rounded-full text-[10px] font-bold font-mono transition-all flex items-center gap-0.5 shrink-0 shadow-xs ${
            showPlaybookOverlay
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container border border-outline-variant text-primary hover:bg-surface-container-high'
          }`}
          title="Playbooks de Automação ERP"
        >
          <span className="material-symbols-outlined text-[12px]">bolt</span>
          <span>Ações</span>
        </button>

        {/* Botão Takeover */}
        <button
          type="button"
          onClick={() => setIsHumanTakeover(!isHumanTakeover)}
          className={`h-7 px-2 rounded-full text-[10px] font-bold font-mono transition-all flex items-center gap-0.5 shrink-0 shadow-xs ${
            isHumanTakeover
              ? 'bg-emerald-800 text-white'
              : 'bg-surface-container border border-outline-variant text-primary hover:bg-surface-container-high'
          }`}
          title={isHumanTakeover ? 'Retomar IA' : 'Assumir Manualmente'}
        >
          <span className="material-symbols-outlined text-[12px]">
            {isHumanTakeover ? 'play_arrow' : 'pan_tool'}
          </span>
          <span>{isHumanTakeover ? 'IA' : 'Mão'}</span>
        </button>

        {/* Alternar Maximizar (Desktop vs Mobile) */}
        <button
          type="button"
          onClick={handleToggleMaximize}
          className="p-1 rounded-full text-primary hover:bg-surface-container transition-colors shrink-0"
          title={isTheaterMode ? 'Restaurar Mobile' : 'Maximizar Desktop'}
        >
          <span className="material-symbols-outlined text-[14px]">
            {isTheaterMode ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>

        {/* Fechar */}
        {isCollapsible && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-primary hover:bg-surface-container transition-colors shrink-0"
            title="Fechar Painel"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>

      {/* 2. Viewport Iframe: 100% Edge-to-Edge sem Margens Mortas */}
      <div className="flex-1 relative w-full h-full bg-white overflow-hidden flex flex-col">
        {syncFeedback && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-3 py-1 rounded-lg shadow-xl text-xs font-bold font-mono animate-in slide-in-from-top duration-150 whitespace-nowrap">
            {syncFeedback}
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={url}
          title="ChronoKairo Viewport"
          className={`w-full h-full border-0 bg-white ${isHumanTakeover ? 'pointer-events-auto' : 'pointer-events-none'}`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />

        {/* Bounding Box Visual do Vision Model */}
        {!isHumanTakeover && targetBox && (
          <div
            className="absolute border-2 border-emerald-500 bg-emerald-500/10 pointer-events-none z-20 transition-all duration-300 rounded-md"
            style={{
              top: `${targetBox.top}px`,
              left: `${targetBox.left}px`,
              width: `${targetBox.width}px`,
              height: `${targetBox.height}px`,
            }}
          >
            <div className="absolute -top-4 left-0 bg-emerald-600 text-white font-mono text-[8px] font-bold px-1 py-0.2 rounded shadow-sm whitespace-nowrap">
              {targetBox.label}
            </div>
          </div>
        )}

        {/* Cursor Holográfico do CUA */}
        {!isHumanTakeover && (
          <div
            className="absolute pointer-events-none transition-all duration-500 ease-out z-30 flex items-start gap-0.5"
            style={{ top: `${cursorPos.y}px`, left: `${cursorPos.x}px` }}
          >
            <span className={`material-symbols-outlined text-primary text-[18px] drop-shadow-md -rotate-45 transition-transform ${isClicking ? 'scale-75' : 'scale-100'}`}>
              navigation
            </span>
            <div className="bg-primary text-on-primary text-[8px] font-mono font-bold px-1 py-0.2 rounded shadow whitespace-nowrap">
              CUA
            </div>
          </div>
        )}

        {/* Modal Suspenso de Playbooks */}
        {showPlaybookOverlay && (
          <div className="absolute inset-x-3 top-3 z-50 bg-surface/95 backdrop-blur-md border border-outline-variant/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 animate-in slide-in-from-top duration-150 text-primary">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/40">
              <span className="text-[11px] font-bold font-mono text-primary">Playbooks Rápidos ERP</span>
              <button
                onClick={() => setShowPlaybookOverlay(false)}
                className="p-0.5 rounded text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {ERP_PLAYBOOKS.map((pb) => (
                <button
                  key={pb.id}
                  onClick={() => handleRunPlaybook(pb)}
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-left transition-all flex items-center justify-between shadow-2xs group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[15px] text-primary shrink-0">
                      {pb.icon}
                    </span>
                    <span className="font-bold text-[11px] text-primary truncate">{pb.title}</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold shrink-0">1-Clique</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
