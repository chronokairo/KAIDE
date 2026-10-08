import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ShieldAlert, 
  FileText, 
  Network, 
  Terminal, 
  Trash2, 
  Copy, 
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  Globe,
  Loader2,
  RefreshCw,
  Camera
} from 'lucide-react';
import { HarnessActivity, InvestigationDossier, ProviderSettings } from '../types';
import { AgentActivityTimeline } from './AgentActivityTimeline';
import { GraphView } from './GraphView';
import { DossierPreview } from './DossierPreview';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  runId?: string;
  isStreaming?: boolean;
  evidenceCard?: {
    title: string;
    type: 'dossier' | 'graph' | 'evidence' | 'hypothesis';
    details: string;
    itemCount?: number;
  };
}

interface IntelligenceChatWorkbenchProps {
  activeDossier: InvestigationDossier | null;
  providerSettings: ProviderSettings;
  activities: HarnessActivity[];
  onAskAgent: (prompt: string, runId: string) => Promise<string>;
  onExportMarkdown: () => void;
}

const CHAT_STORAGE_KEY = 'chronokairo_chat_history_v1';

const createChatRunId = () =>
  `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const IntelligenceChatWorkbench: React.FC<IntelligenceChatWorkbenchProps> = ({
  activeDossier,
  providerSettings,
  activities,
  onAskAgent,
  onExportMarkdown,
}) => {
  const primaryExecutor: 'nim' | 'kilo' | 'opencode' =
    providerSettings.primaryAiProvider === 'nvidia' ? 'nim' : providerSettings.primaryAiProvider;
  const primaryProviderLabel = primaryExecutor === 'nim'
    ? 'NVIDIA NIM'
    : primaryExecutor === 'kilo'
      ? 'Kilo Code ACP'
      : 'OpenCode ACP';
  const primaryModel = primaryExecutor === 'nim'
    ? providerSettings.nvidiaExecutorModel
    : primaryExecutor === 'kilo'
      ? providerSettings.kiloModel
      : providerSettings.openCodeModel;
  const latestRunId = [...activities].reverse().find((activity) => activity.source !== 'system')?.run_id;
  const latestRunActivities = latestRunId
    ? activities.filter((activity) => activity.run_id === latestRunId)
    : [];
  const latestRunActive = latestRunActivities.some((activity) => activity.status === 'running');
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'graph' | 'dossier'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as ChatMessage[];
        return saved.map((message) => ({ ...message, isStreaming: false }));
      }
    } catch {}
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        content: `**Bem-vindo ao Centro de Inteligência Chronokairo.**\n\nO **${primaryProviderLabel}** é o provedor primário configurado. Você pode fazer perguntas sobre o alvo ativo e solicitar análises de risco, evidências e próximos passos verificáveis.`,
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: primaryModel,
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Save chat to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Erro ao salvar chat:', e);
    }
  }, [messages]);

  // Append evidence card when activeDossier updates
  useEffect(() => {
    if (activeDossier) {
      const cardMsgId = `card-${activeDossier.id}`;
      setMessages((prev) => {
        if (prev.some((m) => m.id === cardMsgId)) return prev;
        return [
          ...prev,
          {
            id: cardMsgId,
            sender: 'system',
            content: `Dossiê de Investigação carregado para **${activeDossier.alvo_investigacao}** (${activeDossier.documento_alvo}).`,
            timestamp: new Date().toLocaleTimeString(),
            evidenceCard: {
              title: `Dossiê ${activeDossier.alvo_investigacao}`,
              type: 'dossier',
              details: `Risco Global: ${activeDossier.nivel_risco_global} (${activeDossier.score_risco_numerico}/100) • ${activeDossier.graph.nodes.length} entidades no Grafo • ${activeDossier.ingest_data.legal_pillar.principais_processos.length || activeDossier.ingest_data.legal_pillar.total_processos} processos mapeados.`,
              itemCount: activeDossier.graph.nodes.length,
            }
          }
        ];
      });
    }
  }, [activeDossier]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeSubTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSubTab]);

  const [lastUserPrompt, setLastUserPrompt] = useState<string>('de quem é a empresa chronokairo rlv ?');

  const handleSendMessage = async (customText?: string) => {
    const executor = primaryExecutor;
    const textToSend = customText || inputPrompt || lastUserPrompt;
    if (!textToSend.trim() || isAsking) return;

    setLastUserPrompt(textToSend);
    const runId = createChatRunId();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    const assistantMsgId = `ast-${Date.now()}`;
    const selectedModel = primaryModel;
    const streamingAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      modelUsed: selectedModel,
      runId,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, streamingAssistantMsg]);
    if (!customText) setInputPrompt('');
    setIsAsking(true);

    try {
      const fullResponse = await onAskAgent(textToSend, runId);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMsgId
            ? { ...message, content: fullResponse, isStreaming: false }
            : message
        )
      );
    } catch (err: any) {
      const executorLabel = executor === 'nim' ? 'NVIDIA NIM' : executor === 'kilo' ? 'Kilo Code ACP' : 'OpenCode ACP';
      const errorMsg = `⚠️ Falha ao obter resposta do ${executorLabel}: ${err?.message || err}`;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: errorMsg, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsAsking(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'sources' | 'history' | 'snapshots' | 'add'>('sources');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customSources, setCustomSources] = useState<any[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [capturedSnapshots, setCapturedSnapshots] = useState<any[]>([]);
  const [isCapturingUrl, setIsCapturingUrl] = useState<string | null>(null);

  // Form states for adding custom source
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceCat, setNewSourceCat] = useState('web_osint');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceDesc, setNewSourceDesc] = useState('');

  const fetchCkiSources = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<any[]>('get_public_sources_by_category', { category: 'all' });
        const flat: any[] = [];
        res.forEach((catObj: any) => {
          catObj.sources.forEach((s: any) => {
            flat.push({ ...s, catKey: catObj.category });
          });
        });
        setCustomSources(flat);

        const logs = await invoke<any[]>('get_public_sources_history');
        setHistoryLogs(logs);

        const snaps = await invoke<any[]>('get_captured_snapshots');
        setCapturedSnapshots(snaps);
      }
    } catch (err) {
      console.warn('Erro ao carregar fontes ~/.cki/:', err);
    }
  };

  const handleCaptureSnapshot = async (url: string, sourceName?: string) => {
    setIsCapturingUrl(url);
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<any>('capture_web_snapshot', { url, source_name: sourceName || null });
        
        const snaps = await invoke<any[]>('get_captured_snapshots');
        setCapturedSnapshots(snaps);

        const sysMsg: ChatMessage = {
          id: `snap-${Date.now()}`,
          sender: 'system',
          content: `📸 **Snapshot PNG Registrado com Sucesso (LGPD Art. 7º IX)**\n\n- **Fonte:** ${res.source_name}\n- **URL:** [${res.url}](${res.url})\n- **Snapshot PNG:** \`${res.snapshot_path}\`\n- **Hash SHA-256:** \`${res.hash_sha256}\`\n- **Timestamp UTC:** \`${res.timestamp_utc}\`\n\n**Texto Extraído (OCR/DOM):**\n\`\`\`text\n${res.extracted_text.slice(0, 500)}\n\`\`\``,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, sysMsg]);
      }
    } catch (err: any) {
      console.error('Erro ao capturar snapshot:', err);
    } finally {
      setIsCapturingUrl(null);
    }
  };

  useEffect(() => {
    if (isSourcesModalOpen) {
      fetchCkiSources();
    }
  }, [isSourcesModalOpen]);

  const handleAddSourceSubmit = async () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('add_public_source', {
          name: newSourceName.trim(),
          category: newSourceCat,
          description: newSourceDesc.trim() || 'Fonte pública catalogada pelo investigador',
          url: newSourceUrl.trim(),
          agent_name: `Investigador / ${primaryProviderLabel}`,
        });
        setNewSourceName('');
        setNewSourceUrl('');
        setNewSourceDesc('');
        setModalTab('sources');
        fetchCkiSources();
      }
    } catch (err) {
      console.error('Erro ao adicionar fonte:', err);
    }
  };

  const handleRemoveSource = async (sourceName: string) => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('remove_public_source', {
          source_name: sourceName,
          agent_name: `Investigador / ${primaryProviderLabel}`,
        });
        fetchCkiSources();
      }
    } catch (err) {
      console.error('Erro ao remover fonte:', err);
    }
  };

  const PUBLIC_SOURCES_LIST = customSources.length > 0 ? customSources : [
    { catKey: 'societario', name: 'Receita Federal do Brasil (CNPJ/QSA)', category: 'Societário / QSA', desc: 'Consulta de quadros de sócios, capital social, representante legal e situação cadastral.', lgpd: 'Art. 7º, IX (Legítimo Interesse)' },
    { catKey: 'processual', name: 'Tribunais de Justiça (TJSP, TJAM, TRF1-6, STJ, STF)', category: 'Processual', desc: 'Pesquisa unificada em sistemas e-SAJ, PJe e Projud de processos cíveis, fiscais e criminais.', lgpd: 'Art. 7º, IX da LGPD' },
    { catKey: 'compliance_pep', name: 'Portal da Transparência & CGU (PEP, CEIS, CNEP)', category: 'Compliance / PEP', desc: 'Identificação de Pessoas Politicamente Expostas e sanções governamentais/inidoneidade.', lgpd: 'Art. 7º, IX da LGPD' },
    { catKey: 'societario', name: 'Juntas Comerciais Estaduais (JUCEA, JUCESP, JUCERJA)', category: 'Registro Empresarial', desc: 'Atos constitutivos, participações societárias e histórico de alterações contratuais.', lgpd: 'Art. 7º, IX da LGPD' },
    { catKey: 'processual', name: 'Diários Oficiais da União e dos Estados (DOU / DOE)', category: 'Publicações Oficiais', desc: 'Leitura automática de citações, intimições judiciais e atos administrativos.', lgpd: 'Art. 7º, IX da LGPD' },
    { catKey: 'patrimonial', name: 'Cartórios de Imóveis & Registros Públicos (ONR/SREI)', category: 'Patrimonial', desc: 'Mapeamento de propriedades imobiliárias e indisponibilidades judiciais de bens.', lgpd: 'Art. 7º, IX da LGPD' },
    { catKey: 'societario', name: 'Comissão de Valores Mobiliários (CVM)', category: 'Mercado Financeiro', desc: 'Mapeamento de companhias abertas, diretores, fundos de investimento e administradores.', lgpd: 'Art. 7º, IX da LGPD' },
    { catKey: 'web_osint', name: 'Provedores OSINT Web (Tavily, SerpAPI, Perplexity, Exa)', category: 'Web Crawling OSINT', desc: 'Pesquisa estruturada com extração de artigos, notícias do setor e hashes SHA-256 de origem.', lgpd: 'Art. 7º, IX da LGPD' },
    { catKey: 'acp_local', name: 'Ferramentas ACP (Kilo Code & OpenCode Protocol)', category: 'Multi-Agente Local', desc: 'Agentes locais autônomos para varredura avançada, raciocínio em código e correlação.', lgpd: 'Art. 7º, IX da LGPD' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md relative">
      {/* Top Workbench Navigation & Active Target Header */}
      <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Intelligence Workbench</span>
              {activeDossier && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                  Alvo: {activeDossier.alvo_investigacao}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Provedor primário: {primaryProviderLabel} • Modelo: {primaryModel}
            </div>
          </div>
        </div>

        {/* View Selector Tabs & Fontes Publicas Modal Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSourcesModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-400 text-xs font-mono transition-all flex items-center gap-1.5"
            title="Ver Fontes Públicas Auditadas (~/.cki/)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Fontes Públicas ({PUBLIC_SOURCES_LIST.length})</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'chat'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> Intelligence Chat
            </button>
            <button
              onClick={() => setActiveSubTab('graph')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'graph'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" /> Grafo ({activeDossier?.graph.nodes.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab('dossier')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'dossier'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Dossiê Completo
            </button>
          </div>
        </div>
      </div>

      {/* Fontes Publicas Auditadas Modal Overlay */}
      {isSourcesModalOpen && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Fontes Públicas Dinâmicas (~/.cki/)</h3>
                <p className="text-[11px] text-slate-400 font-mono">Persistência local em ~/.cki/public_sources.json com auditoria SHA-256</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                <button
                  onClick={() => setModalTab('sources')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    modalTab === 'sources' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fontes ({PUBLIC_SOURCES_LIST.length})
                </button>
                <button
                  onClick={() => setModalTab('snapshots')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    modalTab === 'snapshots' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-3 h-3" /> Snapshots PNG ({capturedSnapshots.length})
                </button>
                <button
                  onClick={() => setModalTab('history')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    modalTab === 'history' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Histórico SHA-256 ({historyLogs.length})
                </button>
                <button
                  onClick={() => setModalTab('add')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    modalTab === 'add' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  + Nova Fonte
                </button>
              </div>

              <button
                onClick={() => setIsSourcesModalOpen(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all font-mono text-xs"
              >
                ✕ Fechar
              </button>
            </div>
          </div>

          {/* Modal Tab: Sources List */}
          {modalTab === 'sources' && (
            <>
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 py-3 border-b border-slate-800 overflow-x-auto text-[11px] font-mono scrollbar-none shrink-0">
                {['all', 'societario', 'processual', 'compliance_pep', 'patrimonial', 'web_osint', 'acp_local'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg transition-all capitalize shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Todas' : cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="flex-1 my-4 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                {PUBLIC_SOURCES_LIST
                  .filter((s) => selectedCategory === 'all' || s.catKey === selectedCategory)
                  .map((source, sIdx) => (
                    <div key={sIdx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-1 group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          {source.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCaptureSnapshot(source.url, source.name)}
                            disabled={isCapturingUrl === source.url}
                            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition-all disabled:opacity-50"
                            title="Tirar snapshot PNG e registrar hash SHA-256 em ~/.cki/snapshots/"
                          >
                            <Camera className="w-3 h-3 text-cyan-400" />
                            <span>{isCapturingUrl === source.url ? 'Capturando PNG...' : '📸 Snap PNG'}</span>
                          </button>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {source.lgpd || source.lgpd_basis}
                          </span>
                          <button
                            onClick={() => handleRemoveSource(source.name)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                            title="Remover fonte e registrar no histórico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans">{source.desc || source.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-800/50">
                        <span>URL: {source.url}</span>
                        <span className="text-cyan-400">Tool Call: get_public_sources_by_category(&quot;{source.catKey || source.category}&quot;)</span>
                      </div>
                    </div>
                ))}
              </div>
            </>
          )}

          {/* Modal Tab: Snapshots PNG (~/.cki/snapshots/) */}
          {modalTab === 'snapshots' && (
            <div className="flex-1 my-4 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
              {capturedSnapshots.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
                  <Camera className="w-8 h-8 text-cyan-500/40" />
                  <p className="font-mono text-slate-400">Nenhum snapshot PNG registrado ainda em ~/.cki/snapshots/</p>
                  <p className="text-[11px] text-slate-500">Clique no botão &quot;📸 Snap PNG&quot; em qualquer fonte para capturar a prova digital.</p>
                </div>
              ) : (
                capturedSnapshots.map((snap) => (
                  <div key={snap.id} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        {snap.source_name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {snap.lgpd_basis}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 font-sans font-medium">{snap.title}</div>

                    <div className="text-[10px] text-slate-400 truncate">
                      URL: <a href={snap.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{snap.url}</a>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 whitespace-pre-wrap font-mono max-h-28 overflow-y-auto">
                      {snap.extracted_text}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60 gap-1">
                      <span>Caminho PNG: <code className="text-slate-300">{snap.snapshot_path}</code></span>
                      <span className="text-emerald-400 font-bold">SHA-256: {snap.hash_sha256}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Modal Tab: History Logs (~/.cki/public_sources_history.json) */}
          {modalTab === 'history' && (
            <div className="flex-1 my-4 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800 font-mono text-xs">
              {historyLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
                  <FileText className="w-8 h-8" />
                  <p>Nenhum registro de alteração no histórico ainda.</p>
                </div>
              ) : (
                historyLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'ADD' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {log.action === 'ADD' ? '+ ADICIONADO' : '- REMOVIDO'}
                        </span>
                        <span className="font-bold text-white">{log.source_name}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">{log.timestamp_utc}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Categoria: <span className="text-cyan-300">{log.category}</span> • Agente: <span className="text-purple-300">{log.origin_agent}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono break-all pt-1 border-t border-slate-800/40">
                      Hash SHA-256: <span className="text-emerald-400">{log.hash_sha256}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Modal Tab: Add Custom Source Form */}
          {modalTab === 'add' && (
            <div className="flex-1 my-4 space-y-4 max-w-xl mx-auto font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Nome da Fonte Pública</label>
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="Ex: Cartório de Protestos do Amazonas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Categoria</label>
                <select
                  value={newSourceCat}
                  onChange={(e) => setNewSourceCat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                >
                  <option value="societario">Societário & Registro Empresarial</option>
                  <option value="processual">Processual & Tribunais</option>
                  <option value="compliance_pep">Compliance & PEP</option>
                  <option value="patrimonial">Patrimonial & Imóveis</option>
                  <option value="web_osint">Web OSINT Engine</option>
                  <option value="acp_local">ACP Local Worker</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">URL Oficial ou Caminho Local</label>
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://... ou file://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Descrição Investigativa</label>
                <textarea
                  value={newSourceDesc}
                  onChange={(e) => setNewSourceDesc(e.target.value)}
                  placeholder="Descrição da fonte pública e utilidade para devida diligência..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleAddSourceSubmit}
                disabled={!newSourceName.trim() || !newSourceUrl.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
              >
                Salvar Fonte em ~/.cki/public_sources.json
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
            <span>Diretório de Persistência Local: <code className="text-cyan-400">~/.cki/</code></span>
            <span className="text-emerald-400">● Auditoria de Alterações SHA-256 Habilitada</span>
          </div>
        </div>
      )}

      {/* Main SubTab Content View */}
      {activeSubTab === 'graph' && (
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950">
          <GraphView graph={activeDossier ? activeDossier.graph : null} />
        </div>
      )}

      {activeSubTab === 'dossier' && (
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950">
          <DossierPreview dossier={activeDossier} onExportMarkdown={onExportMarkdown} />
        </div>
      )}

      {activeSubTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
          {/* Chat Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 font-sans text-xs">
            {latestRunId && (
              <details
                className="sticky top-0 z-10 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-xl shadow-black/20 backdrop-blur-xl"
                {...(latestRunActive ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-[10px] font-semibold text-slate-200">
                    {latestRunActive ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-400" /> : <Terminal className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                    <span className="truncate">Harness activity · {latestRunActivities.at(-1)?.title}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-slate-500">#{latestRunId.slice(-6)} · {latestRunActivities.length} eventos</span>
                </summary>
                <div className="max-h-64 overflow-y-auto border-t border-slate-800 px-3 py-2">
                  <AgentActivityTimeline activities={latestRunActivities} compact />
                </div>
              </details>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : msg.sender === 'system'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-slate-900 text-cyan-400 border border-slate-800'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : msg.sender === 'system' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Content Bubble */}
                <div
                  className={`max-w-[82%] rounded-2xl p-4 space-y-2 border transition-all ${
                    msg.sender === 'user'
                      ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-50 shadow-md shadow-cyan-500/10'
                      : msg.sender === 'system'
                      ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                      : 'bg-slate-900/80 border-slate-800/80 text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 font-mono pb-1 border-b border-slate-800/50">
                    <span className="font-bold flex items-center gap-1">
                      {msg.sender === 'user' ? 'Investigador' : msg.sender === 'system' ? 'Sistema Harness OSINT' : 'Assistente IA'}
                      {msg.modelUsed && <span className="text-cyan-400 font-normal">({msg.modelUsed})</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="text-slate-400 hover:text-cyan-300 transition-colors"
                        title="Copiar mensagem"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {msg.sender === 'assistant' && msg.runId && (
                    <details
                      className="rounded-xl border border-slate-800 bg-slate-950/70"
                      {...(msg.isStreaming ? { open: true } : {})}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:text-white">
                        <span className="flex items-center gap-2">
                          {msg.isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" /> : <Terminal className="h-3.5 w-3.5 text-emerald-400" />}
                          Agent loop
                          <span className="rounded-full bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
                            {activities.filter((activity) => activity.run_id === msg.runId).length} eventos
                          </span>
                        </span>
                        <span className={
                          msg.isStreaming
                            ? 'text-cyan-400'
                            : activities.some((activity) => activity.run_id === msg.runId && activity.status === 'failed')
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                        }>
                          {msg.isStreaming
                            ? 'executando'
                            : activities.some((activity) => activity.run_id === msg.runId && activity.status === 'failed')
                              ? 'falhou'
                              : 'concluído'}
                        </span>
                      </summary>
                      <div className="border-t border-slate-800 px-2 py-2">
                        <AgentActivityTimeline
                          activities={activities.filter((activity) => activity.run_id === msg.runId)}
                          compact
                        />
                      </div>
                    </details>
                  )}

                  <MarkdownRenderer content={msg.content} />
                  {msg.isStreaming && (
                    <span className="inline-block ml-1 text-cyan-400 font-bold font-mono animate-pulse text-sm">
                      ▋
                    </span>
                  )}

                  {/* Interactive Retry Button if error occurred */}
                  {msg.content.includes('⚠️ Falha ao obter resposta') && (
                    <div className="mt-3 pt-2 border-t border-rose-900/50 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-rose-400 font-medium">Falha na chamada do provedor primário</span>
                      <button
                        onClick={() => handleSendMessage(lastUserPrompt)}
                        className="px-3 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 border border-rose-500/50 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-900/30"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-rose-300" />
                        <span>Tentar Novamente (Retry Job)</span>
                      </button>
                    </div>
                  )}

                  {/* Embedded Evidence Card if Present */}
                  {msg.evidenceCard && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-cyan-900/50 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-cyan-400" /> {msg.evidenceCard.title}
                        </span>
                        <button
                          onClick={() => setActiveSubTab('dossier')}
                          className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-mono flex items-center gap-1"
                        >
                          Ver Dossiê <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">{msg.evidenceCard.details}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Suggestions Bar */}
          <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-900 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
            <span className="text-slate-500 font-mono shrink-0">Sugestões:</span>
            <button
              onClick={() => handleSendMessage('Qual o resumo do risco patrimonial e holdings do alvo?')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-all"
            >
              🏢 Analisar Holdings
            </button>
            <button
              onClick={() => handleSendMessage('Existe risco de penhora SISBAJUD nos processos mapeados?')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-all"
            >
              ⚖️ Processos Judiciais
            </button>
            <button
              onClick={() => handleSendMessage('Verificar a fundamentação LGPD Art. 7º IX das evidências.')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-all"
            >
              🛡️ Checar LGPD & Hashes
            </button>
            <button
              onClick={() => setIsSourcesModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 whitespace-nowrap transition-all flex items-center gap-1"
            >
              📸 Capturar Snapshots PNG (~/.cki/snapshots/)
            </button>
          </div>

          {/* Prompt Input Form Bar */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center gap-3">
            <button
              onClick={handleClearChat}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-rose-400 transition-all shrink-0"
              title="Limpar Conversa"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              <textarea
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder={
                  activeDossier
                    ? `Pergunte ao ${primaryProviderLabel} sobre ${activeDossier.alvo_investigacao}...`
                    : `Pergunte ao ${primaryProviderLabel} sobre qualquer alvo, empresa ou processo OSINT...`
                }
                className="w-full resize-none max-h-32 bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all font-sans"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isAsking || !inputPrompt.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
                title="Enviar Mensagem"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
