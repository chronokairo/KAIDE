/**
 * GET /api/ciesa-info
 *
 * Fetches key institutional data from ciesa.br and returns it as structured
 * JSON for use in Anna's system prompt. Results are cached in-memory for 1 hour
 * to avoid hammering the public site on every chat request.
 */

import { NextResponse } from 'next/server';
import { buscarOfertas } from '@ciesa/anna-shared';

/* ─── in-memory cache (disabled for immediate update) ─────── */
let cachedData: CiesaInfo | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 0; // disabled

export interface CiesaInfo {
  fetchedAt: string;
  contato: {
    telefones: string[];
    email: string;
    whatsapp: string;
    enderecos: string[];
  };
  links: {
    portalAluno: string;
    portalProfessor: string;
    minhabiblioteca: string;
    calendarioAcademico: string;
    centralDocumentos: string;
    matricula: string;
    site: string;
  };
  cursos: {
    graduacao: string[];
    posGraduacao: string[];
  };
  formasIngresso: string[];
  noticias: Array<{ titulo: string; url: string }>;
  bolsas: string[];
  sobre: string;
}

/* ─── static baseline (always available, no network needed) ── */
const STATIC: CiesaInfo = {
  fetchedAt: '',
  contato: {
    telefones: ['(92) 99350-2810', '(92) 3211-3977'],
    email: 'secretaria@ciesa.br',
    whatsapp: 'https://wa.me/5592993502810',
    enderecos: [
      'Unidade 1 — Av. Joaquim Nabuco, 1232 — Centro, Manaus-AM',
      'Unidade 3 — Av. Joaquim Nabuco, 1270 — Centro, Manaus-AM, CEP 69020-030',
      'Unidade 8 — Rua Huascar de Figueiredo, 227 — Centro, Manaus-AM',
      'Unidade Ponta Negra — Av. Coronel Teixeira, 4371 — Ponta Negra, Manaus-AM',
    ],
  },
  links: {
    portalAluno: 'https://portal.wdedu.com.br/FrameHTML/web/app/edu/portaleducacional/login/',
    portalProfessor: 'https://portal.wdedu.com.br/FrameHTML/web/App/Edu/PortalDoProfessor/#/login',
    minhabiblioteca: 'https://sso.minhabiblioteca.com.br/Login.aspx?key=CIESA',
    calendarioAcademico: 'https://ciesa-cms-midias.s3.us-east-1.amazonaws.com/documents/calendario_academico_2026.pdf',
    centralDocumentos: 'https://ciesa.br/documentos',
    matricula: 'https://ciesa.br/matricula',
    site: 'https://ciesa.br',
  },
  cursos: {
    graduacao: [
      'Direito',
      'Ciência da Computação',
      'Tecnólogo em Análise e Desenvolvimento de Sistemas',
      'Inteligência Artificial',
      'Engenharia da Computação',
      'Tecnólogo em Jogos Digitais',
      'Tecnólogo em Construção Naval',
      'Tecnólogo em Estética e Cosmética',
      'Administração',
      'Ciências Contábeis',
      'Pedagogia',
      'Psicologia',
      'Enfermagem',
      'Fisioterapia',
      'Farmácia',
      'Educação Física',
      'Arquitetura e Urbanismo',
      'Engenharia Civil',
      'Logística',
      'Gestão de Recursos Humanos',
      'Marketing',
    ],
    posGraduacao: [
      'MBA em Gestão de Pessoas',
      'MBA em Gestão de Projetos',
      'Especialização em Direito Empresarial',
      'Especialização em Psicopedagogia',
      'Especialização em Saúde Pública',
      'Mestrado em Direito',
    ],
  },
  formasIngresso: [
    'Vestibular Online (Agendado via site)',
    'Ingresso via Nota do ENEM (Ingresso Direto)',
    'Transferência Externa (Para alunos de outras faculdades)',
    'Portador de Diploma (Segunda Graduação)',
  ],
  noticias: [],
  bolsas: [
    'ProUni — Bolsas integrais e parciais para baixa renda (via ENEM)',
    'FIES — Financiamento estudantil com juros baixos, pagamento após formatura',
    'Bolsa Universidade — 100% gratuito para comprovantes de baixa renda (sgbu.manaus.am.gov.br)',
  ],
  sobre:
    'O CIESA — Centro Universitário de Ensino Superior do Amazonas — está em Manaus há mais de 38 anos (fundado em 1986). ' +
    'Oferece Graduação, Pós-Graduação, Mestrado e Doutorado. Recredenciado como Centro Universitário pelo MEC. ' +
    'Possui laboratórios de Big Data, IoT e Makerspace. Integrado ao grupo WD Educacional.',
};

/* ─── live news fetch ─────────────────────────────────────── */
async function fetchLiveNoticias(): Promise<Array<{ titulo: string; url: string }>> {
  try {
    const res = await fetch('https://ciesa.br/noticias', {
      headers: { 'User-Agent': 'AnnaBot/1.0 (+https://ciesa.br)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const html = await res.text();

    const pattern = /href="(https?:\/\/ciesa\.br\/noticia\/[^"]+)"[^>]*>([^<]{10,120})/g;
    const seen = new Set<string>();
    const items: Array<{ titulo: string; url: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(html)) !== null && items.length < 8) {
      const url = m[1];
      const titulo = m[2].trim().replace(/\s+/g, ' ');
      if (!seen.has(url) && titulo.length > 10) {
        seen.add(url);
        items.push({ titulo, url });
      }
    }
    return items;
  } catch {
    return [];
  }
}

/* ─── live courses fetch ──────────────────────────────────── */
async function fetchLiveCursos(): Promise<{ graduacao: string[]; posGraduacao: string[] }> {
  const finalCursos = {
    graduacao: [...STATIC.cursos.graduacao],
    posGraduacao: [...STATIC.cursos.posGraduacao],
  };

  try {
    const ofertas = await buscarOfertas();
    if (!ofertas.length) return finalCursos;

    const livePrices: Map<string, number> = new Map();

    for (const o of ofertas) {
      const nomeRaw = (o.CURSO || o.NOMECURSO || '').trim();
      if (!nomeRaw) continue;

      const valor = typeof o.VAL_MENSAL_CURSO === 'number' ? o.VAL_MENSAL_CURSO : 0;
      if (valor <= 0) continue;

      // Normalização simples para matching
      const nomeNorm = nomeRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
      const currentMin = livePrices.get(nomeNorm);

      if (currentMin === undefined || valor < currentMin) {
        livePrices.set(nomeNorm, valor);
      }
    }

    const processList = (list: string[]) =>
      list.map((nome) => {
        const nomeNorm = nome.toLowerCase().replace(/[^a-z0-9]/g, '');
        const preco = livePrices.get(nomeNorm);
        if (preco) {
          return `${nome} (a partir de ${preco.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })})`;
        }
        return nome;
      });

    return {
      graduacao: processList(finalCursos.graduacao),
      posGraduacao: processList(finalCursos.posGraduacao),
    };
  } catch {
    return finalCursos;
  }
}

/* ─── route handler ─────────────────────────────────────────  */
export async function GET() {
  const now = Date.now();

  if (cachedData && now < cacheExpiresAt) {
    return NextResponse.json(cachedData);
  }

  const [noticias, liveCursos] = await Promise.all([fetchLiveNoticias(), fetchLiveCursos()]);

  cachedData = {
    ...STATIC,
    fetchedAt: new Date().toISOString(),
    noticias: noticias.length > 0 ? noticias : STATIC.noticias,
    cursos: liveCursos,
  };
  cacheExpiresAt = now + CACHE_TTL_MS;

  return NextResponse.json(cachedData);
}

