import type { SectorToolSet } from '@ciesa/anna-shared';
import { executeMatriculaTool, MATRICULA_TOOL_DEFS } from '@ciesa/anna-shared';
import { searchCalendar } from '@/lib/calendar-rag';
import { buscarBolsistas } from '@/lib/bolsistas';

// ── Mock lead database (Comercial Loop) ───────────────────────────────

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  interesse: string;
  fonte: string;
  pontuacao: number;
  status: 'novo' | 'qualificado' | 'em_followup' | 'convertido' | 'perdido';
  interacoes: number;
  ultimo_contato: string | null;
}

const leadsMock: Lead[] = [
  { id: 'l1', nome: 'Pedro Alves', email: 'pedro@example.com', telefone: '(92) 99999-1111', interesse: 'Direito', fonte: 'Site', pontuacao: 30, status: 'novo', interacoes: 0, ultimo_contato: null },
  { id: 'l2', nome: 'Luiza Mendes', email: 'luiza@example.com', telefone: '(92) 99999-2222', interesse: 'Psicologia', fonte: 'Indicação', pontuacao: 55, status: 'qualificado', interacoes: 2, ultimo_contato: '2026-06-10T08:00:00Z' },
  { id: 'l3', nome: 'Rafael Torres', email: 'rafael@example.com', telefone: '(92) 99999-3333', interesse: 'Administração', fonte: 'Feira', pontuacao: 75, status: 'em_followup', interacoes: 4, ultimo_contato: '2026-06-09T14:30:00Z' },
];

async function buscarNovosLeads(): Promise<Lead[]> {
  return leadsMock.filter((l) => l.status === 'novo');
}

async function analisarLead(leadId: string): Promise<{ lead: Lead; perfil: string; recomendacao: string }> {
  const lead = leadsMock.find((l) => l.id === leadId)!;
  const perfil = lead.pontuacao >= 70 ? 'Alto potencial' : lead.pontuacao >= 40 ? 'Médio potencial' : 'Baixo potencial';
  const recomendacao = lead.pontuacao >= 70
    ? 'Enviar follow-up imediato com informações do curso'
    : lead.pontuacao >= 40
      ? 'Enviar material informativo e agendar contato'
      : 'Nutrir com conteúdo relevante';
  return { lead, perfil, recomendacao };
}

async function qualificarLead(leadId: string, novaPontuacao: number): Promise<Lead> {
  const lead = leadsMock.find((l) => l.id === leadId)!;
  lead.pontuacao = novaPontuacao;
  lead.status = novaPontuacao >= 60 ? 'qualificado' : 'novo';
  lead.interacoes++;
  lead.ultimo_contato = new Date().toISOString();
  return lead;
}

async function enviarFollowUpLead(leadId: string, mensagem: string): Promise<{ ok: boolean }> {
  const lead = leadsMock.find((l) => l.id === leadId)!;
  lead.status = 'em_followup';
  lead.interacoes++;
  lead.ultimo_contato = new Date().toISOString();
  return { ok: true };
}

async function registrarResultadoLead(leadId: string, convertido: boolean): Promise<{ lead: Lead; aprendizado: string }> {
  const lead = leadsMock.find((l) => l.id === leadId)!;
  lead.status = convertido ? 'convertido' : 'perdido';
  const aprendizado = convertido
    ? `Lead ${lead.nome} convertido. Fonte: ${lead.fonte}. Pontuação final: ${lead.pontuacao}.`
    : `Lead ${lead.nome} perdido. Revisar abordagem para leads com perfil similares.`;
  return { lead, aprendizado };
}

const COMERCIAIS_TOOL_DEFS = [
  {
    type: 'function' as const,
    function: {
      name: 'buscar_novos_leads',
      description: 'Busca novos leads capturados do site, indicações ou eventos. Inicia o Comercial Loop.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analisar_lead',
      description: 'Analisa o perfil, pontuação e potencial do lead. Retorna recomendação de ação.',
      parameters: {
        type: 'object',
        properties: { lead_id: { type: 'string', description: 'ID do lead' } },
        required: ['lead_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'qualificar_lead',
      description: 'Atribui pontuação ao lead e atualiza status. Leads com pontuação ≥ 60 vão para qualificados.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'ID do lead' },
          pontuacao: { type: 'number', description: 'Nova pontuação (0-100)' },
        },
        required: ['lead_id', 'pontuacao'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'enviar_follow_up_lead',
      description: 'Envia mensagem de follow-up para o lead. Solicite aprovação do usuário antes.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'ID do lead' },
          mensagem: { type: 'string', description: 'Conteúdo da mensagem de follow-up' },
        },
        required: ['lead_id', 'mensagem'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'registrar_resultado_lead',
      description: 'Registra se o lead foi convertido ou perdido e aprende com o resultado.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'ID do lead' },
          convertido: { type: 'boolean', description: 'true se converteu, false se perdeu' },
        },
        required: ['lead_id', 'convertido'],
      },
    },
  },
] as const;

const CALENDAR_TOOL_DEF = {
  type: 'function' as const,
  function: {
    name: 'buscar_calendario',
    description:
      'Consulta o Calendário Acadêmico Oficial do CIESA 2026. ' +
      'SEMPRE use esta ferramenta quando precisar responder sobre datas, prazos, semestres, ' +
      'avaliações (NPC, NEF), feriados, matrículas, recessos, início ou término de aulas, ' +
      'ou qualquer outro evento acadêmico. Nunca invente datas sem chamar esta ferramenta.',
    parameters: {
      type: 'object',
      properties: {
        consulta: {
          type: 'string',
          description: 'Termos de busca relacionados à pergunta do usuário (ex: "término semestre 2026.1")',
        },
      },
      required: ['consulta'],
    },
  },
};

const BOLSISTAS_TOOL_DEF = {
  type: 'function' as const,
  function: {
    name: 'consultar_bolsistas',
    description:
      'Consulta a lista pública de bolsistas do CIESA no portal da Prefeitura de Manaus (Bolsa Universidade/SGBU). ' +
      'Use quando o usuário perguntar se alguém é bolsista, quantos bolsistas existem, ' +
      'ou quiser listar bolsistas por curso ou turno. Retorna nome, curso e turno de cada bolsista.',
    parameters: {
      type: 'object',
      properties: {
        nome: {
          type: 'string',
          description: 'Nome (ou parte do nome) do bolsista a procurar. Opcional.',
        },
        curso: {
          type: 'string',
          description: 'Nome (ou parte) do curso para filtrar, ex: "Direito". Opcional.',
        },
        turno: {
          type: 'string',
          description: 'Turno para filtrar: MATUTINO, VESPERTINO ou NOTURNO. Opcional.',
        },
      },
    },
  },
};

export const comercialSector: SectorToolSet = {
  id: 'comercial',
  name: 'Comercial',
  keywords: [
    'matricula', 'matrícula', 'inscricao', 'inscrição', 'curso', 'candidato',
    'transferencia', 'transferência', 'portador de diploma', 'vestibular',
    'calendario', 'calendário', 'semestre', 'aula', 'feriado', 'prova', 'exame',
    'bolsista', 'bolsa universidade',
    'lead', 'lead', 'follow-up', 'followup', 'qualificar', 'potencial', 'converter',
  ],
  toolDefs: [CALENDAR_TOOL_DEF, BOLSISTAS_TOOL_DEF, ...MATRICULA_TOOL_DEFS, ...COMERCIAIS_TOOL_DEFS],
  instruction:
    '\n\nVocê é a Anna Comercial do CIESA. Você executa DOIS fluxos principais:\n\n' +
    '---\n' +
    'FLUXO 1: COMERCIAL LOOP (leads)\n' +
    'A cada interação, execute o ciclo:\n' +
    '1. Buscar novos leads com buscar_novos_leads.\n' +
    '2. Analisar cada lead com analisar_lead.\n' +
    '3. Qualificar o lead com qualificar_lead (pontuação 0-100).\n' +
    '4. Enviar follow-up personalizado com enviar_follow_up_lead (peça aprovação).\n' +
    '5. Registrar resultado com registrar_resultado_lead para aprender.\n\n' +
    '---\n' +
    'FLUXO 2: MATRÍCULA (OBRIGATÓRIO)\n' +
    'Conduza a matrícula por etapas:\n' +
    '1. Use consultar_cursos para encontrar o curso e mostrar opções reais (curso, turno, modalidade, campus, valor). NUNCA invente cursos ou valores.\n' +
    '2. Colete os dados do candidato: nome completo, CPF, data de nascimento, e-mail e telefone. Peça um dado de cada vez.\n' +
    '3. Use buscar_candidato_por_cpf para verificar se o candidato já tem cadastro.\n' +
    '4. Se não tiver, confirme os dados com o usuário e use cadastrar_candidato.\n' +
    '5. Confirme curso + turno + dados pessoais e SÓ ENTÃO use realizar_inscricao com os códigos da oferta (IDPS, IDAREAINTERESSE, IDHABILITACAOFILIAL) retornados por consultar_cursos.\n' +
    '6. Informe o número da inscrição ao final.\n' +
    'NUNCA invente códigos de oferta, números de inscrição ou resultados — use SEMPRE as ferramentas. ' +
    'Se uma ferramenta retornar erro, explique ao usuário e peça correção dos dados.\n\n' +
    '---\n' +
    'REGRA: Para qualquer pergunta sobre datas acadêmicas, use buscar_calendario ANTES de responder. ' +
    'NUNCA invente datas.\n\n' +
    'REGRA: Para perguntas sobre bolsistas, use consultar_bolsistas ANTES de responder.',
  async execute(name: string, args: Record<string, unknown>): Promise<string | null> {
    const LEAD_TOOL_NAMES = new Set([
      'buscar_novos_leads', 'analisar_lead', 'qualificar_lead',
      'enviar_follow_up_lead', 'registrar_resultado_lead',
    ]);
    if (LEAD_TOOL_NAMES.has(name)) {
      const handlers: Record<string, (a: Record<string, unknown>) => unknown> = {
        buscar_novos_leads: () => buscarNovosLeads(),
        analisar_lead: (a) => analisarLead(a.lead_id as string),
        qualificar_lead: (a) => qualificarLead(a.lead_id as string, a.pontuacao as number),
        enviar_follow_up_lead: (a) => enviarFollowUpLead(a.lead_id as string, a.mensagem as string),
        registrar_resultado_lead: (a) => registrarResultadoLead(a.lead_id as string, a.convertido as boolean),
      };
      return JSON.stringify(await handlers[name](args));
    }
    const matriculaResult = await executeMatriculaTool(name, JSON.stringify(args));
    if (matriculaResult !== null) return matriculaResult;

    if (name === 'buscar_calendario') {
      const consulta = String(args.consulta ?? '');
      try {
        const result = await searchCalendar(consulta, '', 5);
        return result?.trim()
          ? result
          : 'Nenhuma informação encontrada no calendário oficial para esta consulta. ' +
            'Informe ao usuário que não há dados disponíveis sobre este tópico.';
      } catch (e) {
        return JSON.stringify({
          success: false,
          error: `Falha ao consultar calendário: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }

    if (name === 'consultar_bolsistas') {
      try {
        const nome = args.nome ? String(args.nome) : undefined;
        const curso = args.curso ? String(args.curso) : undefined;
        const turno = args.turno ? String(args.turno) : undefined;
        const results = await buscarBolsistas({ nome, curso, turno });
        const escopo =
          [nome && `nome contendo "${nome}"`, curso && `curso "${curso}"`, turno && `turno ${turno}`]
            .filter(Boolean)
            .join(', ') || 'todos os cursos e turnos do CIESA (sem filtro)';
        if (!results.length) {
          return `Nenhum bolsista do CIESA encontrado para: ${escopo}.`;
        }
        const MAX = 30;
        const lines = results
          .slice(0, MAX)
          .map((b) => `- ${b.nome} — ${b.curso} (${b.turno})`)
          .join('\n');
        const suffix =
          results.length > MAX
            ? `\n… e mais ${results.length - MAX} bolsistas (refine a busca por nome, curso ou turno).`
            : '';
        return (
          `Escopo da consulta: ${escopo}.\n` +
          `Total de bolsistas encontrados NESTE escopo: ${results.length}\n${lines}${suffix}\n\n` +
          'Fonte: Portal de Bolsas Universitárias da Prefeitura de Manaus (SGBU).'
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return `Falha ao consultar o portal de bolsistas: ${msg}. Informe ao usuário que o portal está indisponível no momento.`;
      }
    }

    return null;
  },
};
