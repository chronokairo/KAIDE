import type { SectorToolDefinition, SectorToolSet } from '@ciesa/anna-shared';

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  produto_interesse: string;
  pontuacao: number;
  status: 'pronto' | 'quente' | 'morno' | 'frio';
}

interface Proposta {
  id: string;
  lead_id: string;
  produto: string;
  valor: number;
  parcelas: number;
  status: 'rascunho' | 'enviada' | 'visualizada' | 'aceita' | 'recusada';
  data_envio: string | null;
}

// ── Mock executor ──────────────────────────────────────────────────────

const leadsMock: Lead[] = [
  {
    id: '1',
    nome: 'Carlos Silva',
    email: 'carlos@example.com',
    telefone: '(11) 99999-0001',
    produto_interesse: 'Pós-graduação em Direito Digital',
    pontuacao: 85,
    status: 'pronto',
  },
  {
    id: '2',
    nome: 'Ana Oliveira',
    email: 'ana@example.com',
    telefone: '(11) 99999-0002',
    produto_interesse: 'MBA em Gestão Empresarial',
    pontuacao: 72,
    status: 'quente',
  },
  {
    id: '3',
    nome: 'Mariana Costa',
    email: 'mariana@example.com',
    telefone: '(11) 99999-0003',
    produto_interesse: 'Graduação em Psicologia',
    pontuacao: 45,
    status: 'morno',
  },
];

const propostasMock: Proposta[] = [
  {
    id: 'p1',
    lead_id: '1',
    produto: 'Pós-graduação em Direito Digital',
    valor: 8990,
    parcelas: 18,
    status: 'enviada',
    data_envio: '2026-06-01T10:00:00Z',
  },
];

async function buscarLeadsProntos(): Promise<Lead[]> {
  return leadsMock.filter((l) => l.status === 'pronto' || l.status === 'quente');
}

async function recomendarProdutos(leadId: string): Promise<string[]> {
  const lead = leadsMock.find((l) => l.id === leadId);
  if (!lead) return [];
  return [
    `${lead.produto_interesse} — R$ 8.990 (18x sem juros)`,
    `Curso de Extensão em ${lead.produto_interesse.split('em ')[1] || 'Área Correlata'} — R$ 1.990`,
  ];
}

async function criarProposta(leadId: string, produto: string, valor: number, parcelas: number): Promise<Proposta> {
  const prop: Proposta = {
    id: `p-${Date.now()}`,
    lead_id: leadId,
    produto,
    valor,
    parcelas,
    status: 'rascunho',
    data_envio: null,
  };
  propostasMock.push(prop);
  return prop;
}

async function enviarProposta(propostaId: string): Promise<{ ok: boolean; message: string }> {
  const prop = propostasMock.find((p) => p.id === propostaId);
  if (!prop) return { ok: false, message: 'Proposta não encontrada' };
  prop.status = 'enviada';
  prop.data_envio = new Date().toISOString();
  return { ok: true, message: 'Proposta enviada com sucesso' };
}

async function monitorarAbertura(propostaId: string): Promise<{ visualizada: boolean; ultima_visualizacao: string | null }> {
  return { visualizada: true, ultima_visualizacao: '2026-06-10T14:30:00Z' };
}

async function seguirComLead(leadId: string): Promise<{ ok: boolean; acao: string }> {
  return { ok: true, acao: 'E-mail de follow-up enviado para o lead' };
}

// ── Tool definitions ───────────────────────────────────────────────────

const VENDAS_TOOL_DEFS = [
  {
    type: 'function' as const,
    function: {
      name: 'buscar_leads_prontos',
      description:
        'Busca leads que já estão prontos ou quentes para comprar (pontuação ≥ 60). ' +
        'Use esta ferramenta para iniciar o Vendas Loop.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'recomendar_produtos_lead',
      description:
        'Recomenda produtos com base no interesse do lead. ' +
        'Chame esta ferramenta com o ID do lead obtido em buscar_leads_prontos.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'ID do lead' },
        },
        required: ['lead_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'criar_proposta',
      description:
        'Cria uma proposta comercial personalizada para o lead. ' +
        'Solicite confirmação do usuário ANTES de criar.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'ID do lead' },
          produto: { type: 'string', description: 'Nome do produto/serviço' },
          valor: { type: 'number', description: 'Valor total em reais' },
          parcelas: { type: 'number', description: 'Número de parcelas' },
        },
        required: ['lead_id', 'produto', 'valor', 'parcelas'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'enviar_proposta',
      description:
        'Envia a proposta por e-mail para o lead. ' +
        'SEMPRE pergunte ao usuário antes de enviar.',
      parameters: {
        type: 'object',
        properties: {
          proposta_id: { type: 'string', description: 'ID da proposta' },
        },
        required: ['proposta_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'monitorar_abertura_proposta',
      description:
        'Verifica se o lead visualizou a proposta enviada.',
      parameters: {
        type: 'object',
        properties: {
          proposta_id: { type: 'string', description: 'ID da proposta' },
        },
        required: ['proposta_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'follow_up_proposta',
      description:
        'Envia um e-mail de follow-up para leads que não responderam após 48h ' +
        'do envio da proposta. Pergunte ao usuário antes de executar.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'ID do lead' },
        },
        required: ['lead_id'],
      },
    },
  },
] satisfies SectorToolDefinition[];

async function executeVendasTool(name: string, args: Record<string, unknown>): Promise<string | null> {
  switch (name) {
    case 'buscar_leads_prontos':
      return JSON.stringify(await buscarLeadsProntos());
    case 'recomendar_produtos_lead':
      return JSON.stringify(await recomendarProdutos(args.lead_id as string));
    case 'criar_proposta':
      return JSON.stringify(
        await criarProposta(
          args.lead_id as string,
          args.produto as string,
          args.valor as number,
          args.parcelas as number,
        ),
      );
    case 'enviar_proposta':
      return JSON.stringify(await enviarProposta(args.proposta_id as string));
    case 'monitorar_abertura_proposta':
      return JSON.stringify(await monitorarAbertura(args.proposta_id as string));
    case 'follow_up_proposta':
      return JSON.stringify(await seguirComLead(args.lead_id as string));
    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}

// ── Sector export ──────────────────────────────────────────────────────

export const vendasSector: SectorToolSet = {
  id: 'vendas',
  name: 'Vendas',
  keywords: ['venda', 'proposta', 'lead', 'orçamento', 'matrícula', 'comprar', 'produto'],
  instruction:
    'Você está no setor de **Vendas**. Seu objetivo é executar o Vendas Loop: ' +
    'buscar leads prontos, recomendar produtos, criar propostas personalizadas, ' +
    'enviar e-mail, monitorar abertura e fazer follow-up.',
  toolDefs: VENDAS_TOOL_DEFS,
  execute: executeVendasTool,
};
