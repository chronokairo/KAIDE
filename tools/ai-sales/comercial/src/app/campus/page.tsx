'use client';

import React, { useEffect, useState } from 'react';
import type { CiesaInfo } from '@/app/api/ciesa-info/route';

/* ─── helpers ────────────────────────────────────────────── */
function ExternalLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-container rounded-3xl ${className}`} />
  );
}

/* ─── sub-components ─────────────────────────────────────── */
function ContactCard({ contato }: { contato: CiesaInfo['contato'] }) {
  return (
    <div className="col-span-12 md:col-span-5 bg-primary text-on-primary p-8 rounded-3xl relative overflow-hidden flex flex-col gap-6 hover:-translate-y-1 transition-transform duration-300">
      {/* background blobs */}
      <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-primary-container rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute top-8 -left-8 w-32 h-32 bg-secondary rounded-full blur-2xl opacity-20 pointer-events-none" />

      <div className="relative z-10">
        <p className="font-label-md text-label-md text-primary-fixed opacity-70 uppercase tracking-widest mb-1">
          Central de Atendimento
        </p>
        <h3 className="font-headline-md text-headline-md font-bold">Fale com o CIESA</h3>
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        {contato.telefones.map((tel) => (
          <a key={tel} href={`tel:${tel.replace(/\D/g, '')}`}
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-4 py-3 border border-white/10">
            <span className="material-symbols-outlined text-primary-fixed">phone</span>
            <span className="font-semibold tracking-wide">{tel}</span>
          </a>
        ))}
        <a href={`mailto:${contato.email}`}
          className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-4 py-3 border border-white/10">
          <span className="material-symbols-outlined text-primary-fixed">mail</span>
          <span className="font-semibold">{contato.email}</span>
        </a>
      </div>

      <ExternalLink href={contato.whatsapp}
        className="relative z-10 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] transition-colors text-white font-semibold py-3 rounded-2xl">
        <span className="material-symbols-outlined">chat</span>
        WhatsApp — Pré-matrícula
      </ExternalLink>
    </div>
  );
}

function UnitsCard({ enderecos }: { enderecos: string[] }) {
  return (
    <div className="col-span-12 md:col-span-7 bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-on-secondary-container">location_on</span>
        </div>
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-xs">Manaus — AM</p>
          <h3 className="font-headline-sm font-bold text-on-surface">Unidades do CIESA</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {enderecos.map((end, i) => {
          const [unitLabel, ...rest] = end.split(' — ');
          const address = rest.join(' — ');
          const mapsQuery = encodeURIComponent(address);
          return (
            <ExternalLink
              key={i}
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors group"
            >
              <div className="w-9 h-9 shrink-0 bg-primary-container rounded-xl flex items-center justify-center mt-0.5">
                <span className="font-bold text-on-primary-container text-xs">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface text-sm">{unitLabel}</p>
                <p className="text-on-surface-variant text-xs mt-0.5 leading-relaxed">{address}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                open_in_new
              </span>
            </ExternalLink>
          );
        })}
      </div>
    </div>
  );
}

function QuickLinksCard({ links }: { links: CiesaInfo['links'] }) {
  const items = [
    { icon: 'school', label: 'Portal do Aluno', sub: 'Notas, histórico e declarações', href: links.portalAluno, color: 'bg-primary text-on-primary' },
    { icon: 'cast_for_education', label: 'Portal do Professor', sub: 'Lançamento de notas e faltas', href: links.portalProfessor, color: 'bg-secondary text-on-secondary' },
    { icon: 'menu_book', label: 'Minha Biblioteca', sub: 'Acervo digital online', href: links.minhabiblioteca, color: 'bg-tertiary-container text-on-tertiary-container' },
    { icon: 'calendar_month', label: 'Calendário Acadêmico', sub: 'Datas de provas e eventos (PDF)', href: links.calendarioAcademico, color: 'bg-surface-container-high text-on-surface' },
    { icon: 'folder_open', label: 'Documentos', sub: 'Requerimentos e formulários', href: links.centralDocumentos, color: 'bg-surface-container-high text-on-surface' },
    { icon: 'edit_square', label: 'Matrícula Online', sub: 'Novos e veteranos', href: links.matricula, color: 'bg-surface-container-high text-on-surface' },
  ];

  return (
    <div className="col-span-12 bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container">link</span>
        </div>
        <h3 className="font-headline-sm font-bold text-on-surface">Acessos Rápidos</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item) => (
          <ExternalLink key={item.label} href={item.href}
            className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-surface-container hover:bg-surface-container-high hover:-translate-y-1 transition-all text-center group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface text-xs leading-snug">{item.label}</p>
              <p className="text-on-surface-variant text-[10px] mt-0.5 leading-snug hidden md:block">{item.sub}</p>
            </div>
          </ExternalLink>
        ))}
      </div>
    </div>
  );
}

function ScholarshipsCard({ bolsas }: { bolsas: string[] }) {
  const icons = ['volunteer_activism', 'account_balance', 'location_city'];
  const colors = [
    'bg-tertiary-fixed text-tertiary',
    'bg-secondary-container text-on-secondary-container',
    'bg-primary-container text-on-primary-container',
  ];
  const names = ['ProUni', 'FIES', 'Bolsa Universidade'];

  return (
    <div className="col-span-12 md:col-span-6 bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-tertiary">payments</span>
        </div>
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-xs">Financiamento</p>
          <h3 className="font-headline-sm font-bold text-on-surface">Bolsas de Estudo</h3>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {bolsas.map((bolsa, i) => {
          const [name, ...rest] = bolsa.split(' — ');
          return (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container">
              <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${colors[i] ?? colors[0]}`}>
                <span className="material-symbols-outlined text-sm">{icons[i] ?? icons[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-on-surface text-sm">{names[i] ?? name}</p>
                <p className="text-on-surface-variant text-xs mt-0.5 leading-relaxed">{rest.join(' — ')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CoursesCard({ cursos }: { cursos: CiesaInfo['cursos'] }) {
  const [tab, setTab] = useState<'grad' | 'pos'>('grad');
  const list = tab === 'grad' ? cursos.graduacao : cursos.posGraduacao;

  return (
    <div className="col-span-12 md:col-span-6 bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container">school</span>
          </div>
          <h3 className="font-headline-sm font-bold text-on-surface">Cursos</h3>
        </div>
        <div className="flex bg-surface-container rounded-xl p-1 gap-1">
          {(['grad', 'pos'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
              {t === 'grad' ? 'Graduação' : 'Pós-Graduação'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-64 flex flex-col gap-2 scrollbar-hide">
        {list.map((curso, i) => {
          const [name, detail] = curso.includes('(') ? [curso.split('(')[0].trim(), curso.match(/\(([^)]+)\)/)?.[1]] : [curso, null];
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
              <span className="w-6 h-6 shrink-0 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-on-surface text-sm truncate">{name}</p>
                {detail && <p className="text-on-surface-variant text-[10px]">{detail}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewsCard({ noticias }: { noticias: CiesaInfo['noticias'] }) {
  if (noticias.length === 0) return null;

  return (
    <div className="col-span-12 bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-on-secondary-container">newspaper</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-xs">Atualizações</p>
            <h3 className="font-headline-sm font-bold text-on-surface">Notícias Recentes</h3>
          </div>
        </div>
        <ExternalLink href="https://ciesa.br/noticias"
          className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
          Ver todas
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </ExternalLink>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {noticias.slice(0, 8).map((n, i) => (
          <ExternalLink key={i} href={n.url}
            className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high hover:-translate-y-1 transition-all group">
            <div className="w-8 h-8 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary-container text-sm">article</span>
            </div>
            <p className="text-on-surface text-sm font-medium leading-snug line-clamp-3 flex-1">{n.titulo}</p>
            <span className="flex items-center gap-1 text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Ler mais <span className="material-symbols-outlined text-xs">open_in_new</span>
            </span>
          </ExternalLink>
        ))}
      </div>
    </div>
  );
}

/* ─── about strip ───────────────────────────────────────── */
function AboutStrip({ sobre }: { sobre: string }) {
  return (
    <div className="col-span-12 bg-gradient-to-r from-primary to-primary-container text-on-primary p-6 rounded-3xl flex items-center gap-6">
      <div className="w-16 h-16 shrink-0 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
        <span className="material-symbols-outlined text-3xl">account_balance</span>
      </div>
      <p className="text-sm leading-relaxed opacity-90">{sobre}</p>
      <ExternalLink href="https://ciesa.br"
        className="shrink-0 flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors px-5 py-3 rounded-2xl font-semibold text-sm border border-white/20 whitespace-nowrap">
        <span className="material-symbols-outlined text-base">language</span>
        ciesa.br
      </ExternalLink>
    </div>
  );
}

/* ─── OcrModelCard ──────────────────────────────────────── */
interface PullState {
  model: string;
  status: 'idle' | 'pulling' | 'ready' | 'error';
  percent: number;
  downloadedGB: number;
  totalGB: number;
  lastMessage: string;
  error?: string;
}
interface OllamaStatus {
  available: boolean;
  model: string;
  modelReady?: boolean;
  pullState: PullState;
}

function OcrModelCard() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const r = await fetch('/api/ollama-setup');
      const d = (await r.json()) as OllamaStatus;
      setStatus(d);
      // Se estiver fazendo pull, continua o polling; caso contrário, para
      if (d.pullState.status !== 'pulling' && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    setLoading(true);
    fetchStatus().finally(() => setLoading(false));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inicia polling se o pull estiver em andamento
  useEffect(() => {
    if (status?.pullState.status === 'pulling' && !pollRef.current) {
      pollRef.current = setInterval(fetchStatus, 3_000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.pullState.status]);

  async function handleDownload() {
    try {
      await fetch('/api/ollama-setup', { method: 'POST' });
      await fetchStatus();
      // Inicia polling para acompanhar o progresso
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchStatus, 3_000);
      }
    } catch { /* ignore */ }
  }

  const ps = status?.pullState;
  const isPulling = ps?.status === 'pulling';
  const isReady = ps?.status === 'ready' || status?.modelReady;
  const isError = ps?.status === 'error';

  return (
    <div className="col-span-12 md:col-span-6 bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isReady ? 'bg-secondary-container' : 'bg-surface-container-high'}`}>
            <span className={`material-symbols-outlined ${isReady ? 'text-on-secondary-container' : 'text-on-surface-variant'}`}>
              image_search
            </span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-xs">OCR Avançado</p>
            <h3 className="font-headline-sm font-bold text-on-surface">Modelo glm-ocr</h3>
          </div>
        </div>

        {!loading && status?.available && !isReady && (
          <button
            onClick={handleDownload}
            disabled={isPulling}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            <span className={`material-symbols-outlined text-base ${isPulling ? 'animate-spin' : ''}`}>
              {isPulling ? 'progress_activity' : 'download'}
            </span>
            {isPulling ? 'Baixando…' : 'Baixar modelo'}
          </button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {/* Status geral do Ollama */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${status?.available ? 'bg-[#25D366]' : 'bg-error'}`} />
          <p className="text-sm text-on-surface">
            Ollama — {loading ? '…' : status?.available ? 'rodando em localhost:11434' : 'não encontrado'}
          </p>
        </div>

        {/* Status do modelo */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isReady ? 'bg-[#25D366]' : isPulling ? 'bg-primary animate-pulse' : 'bg-outline-variant'}`} />
          <p className="text-sm text-on-surface">
            {loading ? '…' : isReady ? 'glm-ocr disponível — OCR de PDF ativado' : isPulling ? `Baixando glm-ocr…` : isError ? `Erro: ${ps?.error}` : 'glm-ocr não baixado'}
          </p>
        </div>

        {/* Barra de progresso do pull */}
        {isPulling && ps && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>{ps.lastMessage}</span>
              <span>{ps.downloadedGB.toFixed(1)} / {ps.totalGB.toFixed(1)} GB</span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${ps.percent}%` }}
              />
            </div>
            <p className="text-xs text-on-surface-variant text-right">{ps.percent}%</p>
          </div>
        )}

        {/* Descrição */}
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {isReady
            ? 'O OCR por visão computacional está ativo. Na próxima reindexação do calendário, o texto será extraído visualmente preservando a estrutura de meses e eventos.'
            : 'glm-ocr usa visão computacional para ler o PDF do calendário com precisão. Baixe o modelo (~5 GB) para ativar esta funcionalidade.'}
        </p>
      </div>
    </div>
  );
}

/* ─── page ──────────────────────────────────────────────── */
interface CalendarStatus {
  year: number;
  chunks: number;
  hasEmbeddings: boolean;
  pdfUrl: string | null;
  indexedAt: string | null;
  extractionMethod?: 'ocr' | 'pdfparse';
  indexing?: {
    active: boolean;
    step: 'idle' | 'downloading' | 'ocr' | 'chunking' | 'embedding' | 'storing' | 'done' | 'error';
    ocrPage: number;
    ocrTotal: number;
    extractionMethod: 'ocr' | 'pdfparse' | null;
    startedAt: string | null;
    error?: string;
  };
}

const STEP_LABELS: Record<string, string> = {
  idle: 'Aguardando',
  downloading: 'Baixando PDF…',
  ocr: 'OCR — lendo páginas…',
  chunking: 'Dividindo em chunks…',
  embedding: 'Gerando embeddings…',
  storing: 'Salvando no banco…',
  done: 'Concluído',
  error: 'Erro',
};

function CalendarCard() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const r = await fetch('/api/ciesa-calendar');
      const d = (await r.json()) as CalendarStatus;
      setStatus(d);
      if (!d.indexing?.active && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setSubmitting(false);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchStatus();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Se ao carregar já estiver indexando, inicia polling
  useEffect(() => {
    if (status?.indexing?.active && !pollRef.current) {
      setSubmitting(true);
      pollRef.current = setInterval(fetchStatus, 2_000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.indexing?.active]);

  async function handleReindex() {
    setSubmitting(true);
    setError(null);
    let baseUrl = 'http://127.0.0.1:1234/v1';
    try {
      const cfg = JSON.parse(localStorage.getItem('anna:model-config') ?? '{}') as { baseUrl?: string };
      if (cfg.baseUrl) baseUrl = cfg.baseUrl;
    } catch { /* use default */ }

    // Dispara o reindex em background (não espera terminar)
    fetch('/api/ciesa-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error ?? `HTTP ${res.status}`);
      } else {
        const result = (await res.json()) as CalendarStatus;
        setStatus(result);
      }
      setSubmitting(false);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }).catch((e) => {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    });

    // Começa polling imediatamente
    await new Promise((r) => setTimeout(r, 800));
    await fetchStatus();
    if (!pollRef.current) {
      pollRef.current = setInterval(fetchStatus, 2_000);
    }
  }

  const year = new Date().getFullYear();
  const isIndexed = (status?.chunks ?? 0) > 0;
  const isCurrentYear = status?.year === year;
  const ix = status?.indexing;
  const isOcr = ix?.active && ix.step === 'ocr' && ix.ocrTotal > 0;
  const ocrPct = isOcr ? Math.round((ix.ocrPage / ix.ocrTotal) * 100) : 0;

  return (
    <div className="col-span-12 bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIndexed && isCurrentYear ? 'bg-secondary-container' : 'bg-surface-container-high'}`}>
            <span className={`material-symbols-outlined ${isIndexed && isCurrentYear ? 'text-on-secondary-container' : 'text-on-surface-variant'} ${submitting ? 'animate-pulse' : ''}`}>
              calendar_month
            </span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-xs">Calendário Acadêmico</p>
            <h3 className="font-headline-sm font-bold text-on-surface">Índice de Datas — Anna</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status?.pdfUrl && (
            <ExternalLink href={status.pdfUrl}
              className="flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline">
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Ver PDF
            </ExternalLink>
          )}
          <button
            onClick={handleReindex}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            <span className={`material-symbols-outlined text-base ${submitting ? 'animate-spin' : ''}`}>
              {submitting ? 'progress_activity' : 'sync'}
            </span>
            {submitting ? 'Indexando…' : `Reindexar ${year}`}
          </button>
        </div>
      </div>

      {/* Barra de progresso da indexação */}
      {ix?.active && (
        <div className="mt-5 p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-primary">
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              {STEP_LABELS[ix.step] ?? ix.step}
            </span>
            {isOcr && (
              <span className="text-xs text-on-surface-variant font-mono">
                página {ix.ocrPage} / {ix.ocrTotal}
              </span>
            )}
          </div>
          {isOcr && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${ocrPct}%` }}
                />
              </div>
              <p className="text-xs text-on-surface-variant text-right">{ocrPct}% — OCR com glm-ocr</p>
            </div>
          )}
          {!isOcr && ix.step !== 'idle' && (
            <div className="w-full h-1.5 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full animate-pulse w-full" />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-surface-container text-center">
          <p className="text-2xl font-bold text-on-surface">{status?.chunks ?? '—'}</p>
          <p className="text-xs text-on-surface-variant mt-1">Chunks indexados</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container text-center">
          <p className={`text-2xl font-bold ${isIndexed && isCurrentYear ? 'text-secondary' : 'text-on-surface-variant'}`}>
            {isIndexed && isCurrentYear ? '✓' : year}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">{isIndexed && isCurrentYear ? 'Ano atual indexado' : 'Ano sem índice'}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container text-center">
          <p className={`text-2xl font-bold ${status?.hasEmbeddings ? 'text-secondary' : 'text-on-surface-variant'}`}>
            {status?.hasEmbeddings ? '✓' : '—'}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Embeddings</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container text-center">
          <p className="text-sm font-semibold text-on-surface truncate">
            {status?.indexedAt
              ? new Date(status.indexedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
              : '—'}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Última indexação</p>
        </div>
      </div>

      {(status?.extractionMethod || ix?.extractionMethod) && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">
            {(status?.extractionMethod ?? ix?.extractionMethod) === 'ocr' ? 'image_search' : 'text_fields'}
          </span>
          Extração via <span className="font-semibold text-on-surface">
            {(status?.extractionMethod ?? ix?.extractionMethod) === 'ocr' ? 'glm-ocr (visão)' : 'pdf-parse (texto)'}
          </span>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </p>
      )}

      {!isIndexed && !submitting && (
        <p className="mt-4 text-sm text-on-surface-variant">
          O calendário ainda não foi indexado para {year}. Clique em{' '}
          <span className="font-semibold text-primary">Reindexar {year}</span> para que a Anna consiga responder perguntas sobre datas acadêmicas.
        </p>
      )}
      {isIndexed && isCurrentYear && !submitting && (
        <p className="mt-4 text-sm text-on-surface-variant">
          A Anna já consulta o calendário acadêmico ao responder perguntas sobre datas, provas, feriados e prazos.
          O índice é renovado automaticamente a cada virada de ano.
        </p>
      )}
    </div>
  );
}

export default function CampusPage() {
  const [data, setData] = useState<CiesaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ciesa-info')
      .then((r) => r.json())
      .then((d: CiesaInfo) => setData(d))
      .catch(() => {/* keep null — show fallback */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="ml-64 p-10 min-h-screen relative">
      {/* Background glow */}
      <div className="fixed top-0 right-0 -z-10 w-1/2 h-screen overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-primary-fixed to-transparent rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Info do Campus</h2>
          <p className="text-on-surface-variant font-body-md">
            Endereços, contatos, cursos e serviços do CIESA.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {data?.fetchedAt && (
            <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#25D366] rounded-full inline-block" />
              Atualizado {new Date(data.fetchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <ExternalLink href="https://ciesa.br"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-base">language</span>
            Site oficial
          </ExternalLink>
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-12 gap-6">
          <CardSkeleton className="col-span-12 md:col-span-5 h-72" />
          <CardSkeleton className="col-span-12 md:col-span-7 h-72" />
          <CardSkeleton className="col-span-12 h-36" />
          <CardSkeleton className="col-span-12 md:col-span-6 h-80" />
          <CardSkeleton className="col-span-12 md:col-span-6 h-80" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-12 gap-6">
          <AboutStrip sobre={data.sobre} />
          <ContactCard contato={data.contato} />
          <UnitsCard enderecos={data.contato.enderecos} />
          <QuickLinksCard links={data.links} />
          <CalendarCard />
          <OcrModelCard />
          <ScholarshipsCard bolsas={data.bolsas} />
          <CoursesCard cursos={data.cursos} />
          {data.noticias.length > 0 && <NewsCard noticias={data.noticias} />}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl">wifi_off</span>
          <p className="font-semibold text-lg">Não foi possível carregar os dados</p>
          <p className="text-sm">Verifique sua conexão e tente novamente.</p>
          <button onClick={() => { setLoading(true); fetch('/api/ciesa-info').then(r => r.json()).then(setData).finally(() => setLoading(false)); }}
            className="mt-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-opacity">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-outline-variant flex flex-wrap justify-between items-center gap-4">
        <p className="text-xs text-on-surface-variant">
          Dados institucionais © CIESA — Centro Universitário de Ensino Superior do Amazonas
        </p>
        <div className="flex gap-4 text-xs text-on-surface-variant">
          <ExternalLink href="https://ciesa.br/fale-conosco" className="hover:text-primary transition-colors">Fale Conosco</ExternalLink>
          <ExternalLink href="https://ciesa.br/documentos" className="hover:text-primary transition-colors">Documentos</ExternalLink>
          <ExternalLink href="https://ciesa.br/matricula" className="hover:text-primary transition-colors">Matrícula</ExternalLink>
        </div>
      </footer>
    </main>
  );
}
