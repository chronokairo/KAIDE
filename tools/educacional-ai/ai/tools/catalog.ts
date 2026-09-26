import type { AnnaUploadToolDefinition } from '@/contracts';

export interface McpToolDefinition {
  name: string;
  description: string;
  deprecated?: boolean;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export const mcpToolsBase: McpToolDefinition[] = [
  // -- Unidades -----------------------------------------------------------------
  {
    name: 'admin_list_unidades',
    description: 'Lista todas as unidades/campus da instituição.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'admin_create_unidade',
    description: 'Cria uma nova unidade/campus.',
    inputSchema: {
      type: 'object',
      properties: {
        name:    { type: 'string', description: 'Nome da unidade' },
        city:    { type: 'string', description: 'Cidade' },
        state:   { type: 'string', description: 'UF (ex: SP)' },
        address: { type: 'string', description: 'Endereço completo' },
        phone:   { type: 'string', description: 'Telefone' },
        email:   { type: 'string', description: 'E-mail' },
      },
      required: ['name'],
    },
  },
  {
    name: 'admin_update_unidade',
    description: 'Atualiza dados de uma unidade pelo id.',
    inputSchema: {
      type: 'object',
      properties: {
        id:      { type: 'string', description: 'ID da unidade' },
        name:    { type: 'string' },
        city:    { type: 'string' },
        state:   { type: 'string' },
        address: { type: 'string' },
        phone:   { type: 'string' },
        email:   { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'admin_delete_unidade',
    description: 'Exclui uma unidade pelo id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },

  // -- Cursos -------------------------------------------------------------------
  {
    name: 'admin_list_cursos',
    description: 'Lista todos os cursos cadastrados.',
    inputSchema: { type: 'object', properties: { q: { type: 'string', description: 'Filtro por nome/código' } }, required: [] },
  },
  {
    name: 'admin_create_curso',
    description: 'Cria um novo curso.',
    inputSchema: {
      type: 'object',
      properties: {
        name:         { type: 'string', description: 'Nome do curso' },
        nivelEnsino:  { type: 'string', description: 'GRADUACAO | POS_GRADUACAO | TECNICO | EXTENSAO' },
        modalidade:   { type: 'string', description: 'PRESENCIAL | EAD | SEMIPRESENCIAL' },
        cargaHoraria: { type: 'number', description: 'Carga horária total em horas' },
      },
      required: ['name'],
    },
  },
  {
    name: 'admin_update_curso',
    description: 'Atualiza dados de um curso pelo id.',
    inputSchema: {
      type: 'object',
      properties: {
        id:           { type: 'string' },
        name:         { type: 'string' },
        nivelEnsino:  { type: 'string' },
        modalidade:   { type: 'string' },
        cargaHoraria: { type: 'number' },
        status:       { type: 'string', description: 'ATIVO | INATIVO' },
      },
      required: ['id'],
    },
  },
  {
    name: 'admin_delete_curso',
    description: 'Exclui um curso pelo id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },

  // -- Disciplinas --------------------------------------------------------------
  {
    name: 'admin_list_disciplinas',
    description: 'Lista todas as disciplinas cadastradas.',
    inputSchema: { type: 'object', properties: { q: { type: 'string', description: 'Filtro por nome/código' } }, required: [] },
  },
  {
    name: 'admin_create_disciplina',
    description: 'Cria uma nova disciplina.',
    inputSchema: {
      type: 'object',
      properties: {
        name:         { type: 'string', description: 'Nome da disciplina' },
        cargaHoraria: { type: 'number', description: 'Carga horária em horas' },
        tipo:         { type: 'string', description: 'OBRIGATORIA | ELETIVA | COMPLEMENTAR | ESTAGIO | TCC' },
        ementa:       { type: 'string', description: 'Ementa da disciplina' },
      },
      required: ['name'],
    },
  },
  {
    name: 'admin_update_disciplina',
    description: 'Atualiza dados de uma disciplina pelo id.',
    inputSchema: {
      type: 'object',
      properties: {
        id:           { type: 'string' },
        name:         { type: 'string' },
        cargaHoraria: { type: 'number' },
        tipo:         { type: 'string' },
        ementa:       { type: 'string' },
        status:       { type: 'string', description: 'ATIVA | INATIVA' },
      },
      required: ['id'],
    },
  },
  {
    name: 'admin_delete_disciplina',
    description: 'Exclui uma disciplina pelo id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },

  // -- Turmas -------------------------------------------------------------------
  {
    name: 'admin_list_turmas',
    description: 'Lista todas as turmas cadastradas.',
    inputSchema: {
      type: 'object',
      properties: {
        q:       { type: 'string', description: 'Filtro por nome/código' },
        cursoId: { type: 'string', description: 'Filtrar por curso' },
      },
      required: [],
    },
  },
  {
    name: 'admin_create_turma',
    description: 'Cria uma nova turma vinculada a um curso.',
    inputSchema: {
      type: 'object',
      properties: {
        name:      { type: 'string', description: 'Nome da turma' },
        cursoId:   { type: 'string', description: 'ID do curso' },
        cursoName: { type: 'string', description: 'Nome do curso (opcional, para exibição)' },
        periodo:   { type: 'string', description: 'Período letivo (ex: 2025.1)' },
        turno:     { type: 'string', description: 'MATUTINO | VESPERTINO | NOTURNO | INTEGRAL | EAD' },
        vagas:     { type: 'number', description: 'Número de vagas' },
      },
      required: ['name', 'cursoId'],
    },
  },
  {
    name: 'admin_update_turma',
    description: 'Atualiza dados de uma turma pelo id.',
    inputSchema: {
      type: 'object',
      properties: {
        id:      { type: 'string' },
        name:    { type: 'string' },
        periodo: { type: 'string' },
        turno:   { type: 'string' },
        vagas:   { type: 'number' },
        status:  { type: 'string', description: 'ATIVA | INATIVA' },
      },
      required: ['id'],
    },
  },
  {
    name: 'admin_delete_turma',
    description: 'Exclui uma turma pelo id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },

  // -- Processos Seletivos -------------------------------------------------------
  {
    name: 'admin_list_processos_seletivos',
    description: 'Lista os processos seletivos cadastrados.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'admin_create_processo_seletivo',
    description: 'Cria um processo seletivo.',
    inputSchema: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Nome do processo' },
        periodo:     { type: 'string', description: 'Período letivo alvo' },
        dataInicio:  { type: 'string', description: 'Data de início (ISO)' },
        dataFim:     { type: 'string', description: 'Data de fim (ISO)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'admin_update_processo_seletivo',
    description: 'Atualiza um processo seletivo pelo id.',
    inputSchema: {
      type: 'object',
      properties: {
        id:         { type: 'string' },
        name:       { type: 'string' },
        periodo:    { type: 'string' },
        dataInicio: { type: 'string' },
        dataFim:    { type: 'string' },
        status:     { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'admin_delete_processo_seletivo',
    description: 'Exclui um processo seletivo pelo id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },

  // -- Níveis de Ensino ----------------------------------------------------------
  {
    name: 'admin_list_niveis_ensino',
    description: 'Lista os níveis de ensino cadastrados.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'admin_create_nivel_ensino',
    description: 'Cria um nível de ensino.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do nível (ex: Graduação)' },
        code: { type: 'string', description: 'Código (ex: GRAD)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'admin_update_nivel_ensino',
    description: 'Atualiza um nível de ensino pelo id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' }, code: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'admin_delete_nivel_ensino',
    description: 'Exclui um nível de ensino pelo id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },

  // -- Modalidades ---------------------------------------------------------------
  {
    name: 'admin_list_modalidades',
    description: 'Lista as modalidades de ensino.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'admin_create_modalidade',
    description: 'Cria uma modalidade de ensino.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da modalidade (ex: Presencial)' },
        code: { type: 'string', description: 'Código (ex: PRES)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'admin_update_modalidade',
    description: 'Atualiza uma modalidade pelo id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' }, code: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'admin_delete_modalidade',
    description: 'Exclui uma modalidade pelo id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },

  // -- Notificações / Comunicação -----------------------------------------------
  {
    name: 'com_send_notifications',
    description: 'Envia notificação multicanal para um destinatário ou grupo.',
    inputSchema: {
      type: 'object',
      properties: {
        recipientId: { type: 'string', description: 'ID do destinatário' },
        subject:     { type: 'string', description: 'Assunto/título da mensagem' },
        body:        { type: 'string', description: 'Corpo da mensagem' },
        channels:    { type: 'array',  items: { type: 'string' }, description: 'Canais: email, sms, push, in_app' },
      },
      required: ['recipientId', 'subject', 'body'],
    },
  },

  // -- Matrícula conversacional -------------------------------------------------
  {
    name: 'edu_enroll_new_student',
    description: 'Inicia e propõe uma matrícula conversacional para um novo aluno. Não executa — apenas gera proposta para aprovação.',
    inputSchema: {
      type: 'object',
      properties: {
        studentName: { type: 'string', description: 'Nome completo do aluno' },
        cpf:         { type: 'string', description: 'CPF do aluno' },
        programId:   { type: 'string', description: 'ID do curso/programa' },
        entryType:   { type: 'string', description: 'CALOURO | TRANSFER_INTERNAL | TRANSFER_EXTERNAL | REOPTION | RETURN_AFTER_JUBILATION | DIPLOMA_HOLDER' },
      },
      required: ['studentName', 'cpf', 'programId'],
    },
  },

  // -- Importação ---------------------------------------------------------------
  {
    name: 'edu_batch_import_candidates',
    description: 'Importa candidatos em lote via CSV para o processo seletivo.',
    inputSchema: {
      type: 'object',
      properties: {
        csv: { type: 'string', description: 'Conteúdo do CSV com candidatos' },
      },
      required: ['csv'],
    },
  },
  {
    name: 'edu_transcript_intake',
    description: 'Processa um histórico acadêmico para auto-matrícula por equivalência.',
    inputSchema: {
      type: 'object',
      properties: {
        transcriptId: { type: 'string', description: 'ID do histórico já extraído' },
      },
      required: ['transcriptId'],
    },
  },

  // -- BI Generativo ------------------------------------------------------------
  {
    name: 'render_bi_chart',
    description: `Renderiza um gráfico ou painel de BI diretamente no chat da Anna.
Use SEMPRE que o usuário pedir métricas, gráficos, relatórios, dashboards, KPIs ou análise visual.
Use dados reais quando disponíveis. Quando não houver dados reais, informe explicitamente no campo description que os dados são ilustrativos.
Tipos: bar, bar_horizontal, line, area, pie, donut, scatter, radar, funnel, metric, table, combo.`,
    inputSchema: {
      type: 'object',
      required: ['type', 'title', 'data'],
      properties: {
        type: {
          type: 'string',
          enum: ['bar','bar_horizontal','line','area','pie','donut','scatter','radar','funnel','metric','table','combo'],
        },
        title:       { type: 'string' },
        description: { type: 'string', description: 'Insight analítico. Se dados forem ilustrativos, mencione aqui.' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            required: ['label', 'value'],
            properties: {
              label:    { type: 'string' },
              value:    { type: 'number' },
              value2:   { type: 'number' },
              category: { type: 'string' },
            },
          },
        },
        series: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name:    { type: 'string' },
              dataKey: { type: 'string' },
              color:   { type: 'string' },
              type:    { type: 'string', enum: ['bar','line','area'] },
            },
          },
        },
        metric: {
          type: 'object',
          properties: {
            value:      { type: ['string','number'] },
            unit:       { type: 'string' },
            trend:      { type: 'string', enum: ['up','down','flat'] },
            trendValue: { type: 'string' },
            description:{ type: 'string' },
          },
        },
        colorScheme: { type: 'string', enum: ['blue','green','purple','orange','mixed'] },
        unit:        { type: 'string' },
        xAxisLabel:  { type: 'string' },
        yAxisLabel:  { type: 'string' },
        stacked:     { type: 'boolean' },
      },
    },
  },

  // -- Calendário Acadêmico -----------------------------------------------------
  {
    name: 'buscar_calendario',
    description: 'Consulta o Calendário Acadêmico Oficial do CIESA. Use quando o usuário perguntar sobre datas, prazos, semestres, avaliações, feriados ou eventos letivos. Nunca invente datas sem chamar esta ferramenta.',
    inputSchema: {
      type: 'object',
      required: ['consulta'],
      properties: {
        consulta: { type: 'string', description: 'Termos de busca (ex: "término semestre 2026.1")' },
      },
    },
  },
];

export function getAnnaUploadTools(): AnnaUploadToolDefinition[] {
  return [
    {
      name: 'edu_transcript_intake',
      annaUpload: {
        accept: 'application/pdf,.pdf',
        intentKeywords: ['histórico', 'transcript', 'diploma', 'histórico escolar', 'transferência'],
        describe: 'Vou analisar este histórico acadêmico...',
      },
    },
    {
      name: 'edu_batch_import_candidates',
      annaUpload: {
        accept: 'text/csv,.csv',
        intentKeywords: ['candidatos', 'importar', 'lote', 'csv', 'processo seletivo'],
        describe: 'Vou importar estes candidatos...',
      },
    },
  ];
}
