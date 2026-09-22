/**
 * @layer features/mcp
 * @description Servidor MCP para expor APIs TOTVS como ferramentas para IA
 * Usa índice vetorial (RAG) para buscas eficientes, consultando APIs apenas para atualizações
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Importar sistema RAG
import { DocumentRAGEngine } from '../rag/document-engine.js';

// Importar clientes das APIs TOTVS (apenas para re-indexação)
import { buscarAreas } from '../totvs/api/areas.js';
import { buscarOfertas } from '../totvs/api/ofertas.js';
import { buscarNiveis, buscarRankCurso } from '../totvs/api/niveis.js';
import { buscarAtendentes } from '../totvs/api/atendentes.js';

// Importar Chart.js para geração de gráficos
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

// Importar utilitários de gráficos
import {
    createBarChart,
    createLineChart,
    createPieChart,
    createDoughnutChart,
    rankingToChartData,
    statusDistributionToChartData,
    matriculasPorCursoToChartData,
    applyDefaultColors,
    type ChartData,
} from './chart-utils.js';

/**
 * Servidor MCP que usa RAG para consultas eficientes
 */
export class TOTVSMCPServer {
    private server: Server;
    private ragEngine: DocumentRAGEngine;
    private lastIndexTime: number = 0;
    private indexInterval: number = 1000 * 60 * 60; // Re-indexar a cada 1 hora
    private chartJS: ChartJSNodeCanvas;

    constructor() {
        this.server = new Server(
            {
                name: 'totvs-api-server',
                version: '2.0.0',
            }
        );

        this.ragEngine = new DocumentRAGEngine();
        this.chartJS = new ChartJSNodeCanvas({
            width: 800,
            height: 600,
            chartCallback: (ChartJS: any) => {
                ChartJS.defaults.responsive = true;
                ChartJS.defaults.maintainAspectRatio = false;
            }
        });
        this.setupHandlers();
    }

    /**
     * Inicializa e indexa dados se necessário
     */
    private async ensureIndexed(): Promise<void> {
        const now = Date.now();
        const needsReindex = now - this.lastIndexTime > this.indexInterval;

        if (needsReindex) {
            console.error('[MCP] Indexando dados das APIs TOTVS...');
            await this.ragEngine.initialize();
            await this.ragEngine.indexDocuments();
            this.lastIndexTime = now;
            console.error('[MCP] Indexação concluída');
        }
    }

    /**
     * Configura os handlers do servidor MCP
     */
    private setupHandlers(): void {
        // Lista todas as ferramentas disponíveis
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'buscar_informacoes',
                        description:
                            'Busca informações sobre cursos, áreas de ensino, níveis educacionais, ranking e ofertas usando busca semântica no índice vetorial. Use esta ferramenta para qualquer pergunta sobre a instituição, cursos disponíveis, áreas de ensino, avaliações, etc. A busca é inteligente e entende linguagem natural.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Pergunta ou busca em linguagem natural. Ex: "cursos de tecnologia", "ranking dos melhores cursos", "áreas de ensino disponíveis"',
                                },
                                topK: {
                                    type: 'number',
                                    description: 'Número de resultados mais relevantes a retornar (padrão: 5)',
                                    default: 5,
                                },
                            },
                            required: ['query'],
                        },
                    },
                    {
                        name: 'forcar_atualizacao',
                        description:
                            'Força uma re-indexação completa dos dados das APIs TOTVS. Use apenas quando precisar garantir que os dados estão absolutamente atualizados. A indexação automática já mantém os dados atualizados a cada hora.',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: [],
                        },
                    },
                    {
                        name: 'status_sistema',
                        description:
                            'Retorna o status do sistema de busca, incluindo número de documentos indexados, última atualização e estatísticas.',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: [],
                        },
                    },
                    {
                        name: 'gerar_grafico',
                        description:
                            'Gera gráficos usando Chart.js para visualização de dados. Suporta diversos tipos de gráficos como barras, linhas, pizza, etc. Retorna uma imagem base64 do gráfico gerado.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                tipo: {
                                    type: 'string',
                                    enum: ['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea'],
                                    description: 'Tipo do gráfico a ser gerado',
                                },
                                titulo: {
                                    type: 'string',
                                    description: 'Título do gráfico',
                                },
                                dados: {
                                    type: 'object',
                                    description: 'Dados do gráfico no formato Chart.js',
                                    properties: {
                                        labels: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            description: 'Rótulos dos dados',
                                        },
                                        datasets: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    label: { type: 'string' },
                                                    data: {
                                                        type: 'array',
                                                        items: { type: 'number' }
                                                    },
                                                    backgroundColor: {
                                                        type: 'array',
                                                        items: { type: 'string' }
                                                    },
                                                    borderColor: {
                                                        type: 'array',
                                                        items: { type: 'string' }
                                                    },
                                                },
                                                required: ['data'],
                                            },
                                            description: 'Conjuntos de dados para o gráfico',
                                        },
                                    },
                                    required: ['labels', 'datasets'],
                                },
                                largura: {
                                    type: 'number',
                                    description: 'Largura do gráfico em pixels (padrão: 800)',
                                    default: 800,
                                },
                                altura: {
                                    type: 'number',
                                    description: 'Altura do gráfico em pixels (padrão: 600)',
                                    default: 600,
                                },
                            },
                            required: ['tipo', 'dados'],
                        },
                    },
                    {
                        name: 'gerar_relatorio_grafico',
                        description:
                            'Gera gráficos automaticamente baseados em dados TOTVS. Analisa os dados e cria visualizações apropriadas como rankings de cursos, distribuição de status, matrículas por área, etc.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                tipo_relatorio: {
                                    type: 'string',
                                    enum: ['ranking_cursos', 'distribuicao_status', 'matriculas_curso', 'estatisticas_atendentes', 'ofertas_modalidade'],
                                    description: 'Tipo de relatório a gerar',
                                },
                                titulo: {
                                    type: 'string',
                                    description: 'Título personalizado do gráfico (opcional)',
                                },
                                tipo_grafico: {
                                    type: 'string',
                                    enum: ['bar', 'horizontalBar', 'pie', 'doughnut', 'line'],
                                    description: 'Tipo de gráfico preferido (padrão: automático baseado no tipo de relatório)',
                                    default: 'bar',
                                },
                                largura: {
                                    type: 'number',
                                    description: 'Largura do gráfico em pixels (padrão: 800)',
                                    default: 800,
                                },
                                altura: {
                                    type: 'number',
                                    description: 'Altura do gráfico em pixels (padrão: 600)',
                                    default: 600,
                                },
                            },
                            required: ['tipo_relatorio'],
                        },
                    },
                    {
                        name: 'criar_dashboard',
                        description:
                            'Cria um dashboard com múltiplos gráficos relacionados para análise completa dos dados TOTVS. Útil para relatórios abrangentes e comparações visuais.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                titulo_dashboard: {
                                    type: 'string',
                                    description: 'Título do dashboard',
                                },
                                graficos: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            tipo_relatorio: {
                                                type: 'string',
                                                enum: ['ranking_cursos', 'distribuicao_status', 'matriculas_curso', 'estatisticas_atendentes', 'ofertas_modalidade'],
                                                description: 'Tipo de relatório para este gráfico',
                                            },
                                            titulo: {
                                                type: 'string',
                                                description: 'Título específico para este gráfico',
                                            },
                                            tipo_grafico: {
                                                type: 'string',
                                                enum: ['bar', 'horizontalBar', 'pie', 'doughnut', 'line'],
                                                description: 'Tipo de gráfico',
                                            },
                                        },
                                        required: ['tipo_relatorio'],
                                    },
                                    description: 'Lista de gráficos a incluir no dashboard',
                                },
                                largura: {
                                    type: 'number',
                                    description: 'Largura de cada gráfico em pixels (padrão: 600)',
                                    default: 600,
                                },
                                altura: {
                                    type: 'number',
                                    description: 'Altura de cada gráfico em pixels (padrão: 400)',
                                    default: 400,
                                },
                            },
                            required: ['titulo_dashboard', 'graficos'],
                        },
                    },
                ],
            };
        });

        // Executa uma ferramenta
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                // Garantir que dados estão indexados
                await this.ensureIndexed();

                switch (name) {
                    case 'buscar_informacoes': {
                        const { query, topK = 5 } = args as { query: string; topK?: number };

                        console.error(`[MCP] Buscando: "${query}"`);

                        // Usar RAG para busca eficiente
                        const documents = await this.ragEngine.retrieve(query, topK);

                        if (documents.length === 0) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Não encontrei informações relevantes para sua busca. Tente reformular a pergunta ou use termos mais específicos.',
                                    },
                                ],
                            };
                        }

                        // Formatar documentos encontrados
                        const results = documents.map((doc, index) => ({
                            posicao: index + 1,
                            fonte: doc.metadata.source,
                            titulo: doc.metadata.title || doc.metadata.source,
                            conteudo: doc.content,
                        }));

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(
                                        {
                                            query,
                                            total_resultados: results.length,
                                            resultados: results,
                                        },
                                        null,
                                        2
                                    ),
                                },
                            ],
                        };
                    }

                    case 'forcar_atualizacao': {
                        console.error('[MCP] Forçando re-indexação...');
                        this.lastIndexTime = 0; // Reset para forçar re-indexação
                        await this.ensureIndexed();

                        const stats = this.ragEngine.getStats();

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(
                                        {
                                            status: 'sucesso',
                                            mensagem: 'Dados atualizados com sucesso',
                                            documentos_indexados: stats.totalDocuments,
                                            ultima_atualizacao: new Date(this.lastIndexTime).toISOString(),
                                        },
                                        null,
                                        2
                                    ),
                                },
                            ],
                        };
                    }

                    case 'status_sistema': {
                        const stats = this.ragEngine.getStats();
                        const status = await this.ragEngine.getStatus();

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(
                                        {
                                            status: 'online',
                                            documentos_indexados: stats.totalDocuments,
                                            ultima_indexacao: new Date(this.lastIndexTime).toISOString(),
                                            proxima_atualizacao: new Date(
                                                this.lastIndexTime + this.indexInterval
                                            ).toISOString(),
                                            modelo_llm: status.llmModel,
                                            modelo_embedding: status.embeddingModel,
                                            ollama_disponivel: status.ollamaAvailable,
                                        },
                                        null,
                                        2
                                    ),
                                },
                            ],
                        };
                    }

                    case 'gerar_grafico': {
                        const { tipo, titulo, dados, largura = 800, altura = 600 } = args as {
                            tipo: string;
                            titulo?: string;
                            dados: any;
                            largura?: number;
                            altura?: number;
                        };

                        console.error(`[MCP] Gerando gráfico: ${tipo} - ${titulo || 'Sem título'}`);

                        // Configurar o gráfico Chart.js
                        const configuration = {
                            type: tipo,
                            data: dados,
                            options: {
                                responsive: true,
                                plugins: {
                                    title: titulo ? {
                                        display: true,
                                        text: titulo,
                                        font: {
                                            size: 16,
                                            weight: 'bold',
                                        },
                                    } : undefined,
                                    legend: {
                                        display: true,
                                        position: 'top' as const,
                                    },
                                },
                                scales: tipo === 'bar' || tipo === 'line' ? {
                                    y: {
                                        beginAtZero: true,
                                    },
                                } : undefined,
                            },
                        };

                        // Atualizar dimensões se especificadas
                        const chartInstance = new ChartJSNodeCanvas({
                            width: largura,
                            height: altura,
                            chartCallback: (ChartJS: any) => {
                                ChartJS.defaults.responsive = true;
                                ChartJS.defaults.maintainAspectRatio = false;
                            }
                        });

                        // Gerar o gráfico como buffer
                        const buffer = await chartInstance.renderToBuffer(configuration as any);
                        const base64Image = buffer.toString('base64');

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Gráfico gerado com sucesso (${tipo}). Aqui está a visualização:`,
                                },
                                {
                                    type: 'image',
                                    data: base64Image,
                                    mimeType: 'image/png',
                                },
                            ],
                        };
                    }

                    case 'gerar_relatorio_grafico': {
                        const { tipo_relatorio, titulo, tipo_grafico = 'bar', largura = 800, altura = 600 } = args as {
                            tipo_relatorio: string;
                            titulo?: string;
                            tipo_grafico?: string;
                            largura?: number;
                            altura?: number;
                        };

                        console.error(`[MCP] Gerando relatório gráfico: ${tipo_relatorio}`);

                        let chartConfig: any;
                        let searchQuery = '';
                        let defaultTitle = '';

                        // Definir consulta e configuração baseada no tipo de relatório
                        switch (tipo_relatorio) {
                            case 'ranking_cursos':
                                searchQuery = 'ranking cursos mais procurados quantidade';
                                defaultTitle = titulo || 'Ranking dos Cursos Mais Procurados';
                                break;
                            case 'distribuicao_status':
                                searchQuery = 'distribuição status candidatos matrículas';
                                defaultTitle = titulo || 'Distribuição de Candidatos por Status';
                                break;
                            case 'matriculas_curso':
                                searchQuery = 'matrículas por curso área quantidade alunos';
                                defaultTitle = titulo || 'Matrículas por Curso/Área';
                                break;
                            case 'estatisticas_atendentes':
                                searchQuery = 'estatísticas atendentes performance quantidade atendimentos';
                                defaultTitle = titulo || 'Estatísticas dos Atendentes';
                                break;
                            case 'ofertas_modalidade':
                                searchQuery = 'ofertas cursos modalidade ensino turno';
                                defaultTitle = titulo || 'Ofertas de Cursos por Modalidade';
                                break;
                            default:
                                throw new Error(`Tipo de relatório desconhecido: ${tipo_relatorio}`);
                        }

                        // Buscar dados relevantes
                        const documents = await this.ragEngine.retrieve(searchQuery, 20);

                        if (documents.length === 0) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: `Não foi possível encontrar dados suficientes para gerar o relatório "${tipo_relatorio}". Tente buscar informações primeiro.`,
                                    },
                                ],
                            };
                        }

                        // Processar dados baseado no tipo de relatório
                        let chartData: ChartData;

                        switch (tipo_relatorio) {
                            case 'ranking_cursos': {
                                // Extrair dados de ranking dos documentos
                                const rankingData: Array<{ NOME: string; QTD: number }> = [];
                                for (const doc of documents) {
                                    if (doc.metadata.source === 'totvs_ranking') {
                                        // Tentar extrair dados do conteúdo
                                        const lines = doc.content.split('\n');
                                        for (const line of lines) {
                                            const match = line.match(/Curso Popular #\d+: (.+?) (\d+) interessados/);
                                            if (match) {
                                                rankingData.push({
                                                    NOME: match[1],
                                                    QTD: parseInt(match[2]),
                                                });
                                            }
                                        }
                                    }
                                }
                                chartData = rankingToChartData(rankingData);
                                break;
                            }

                            case 'distribuicao_status': {
                                // Extrair distribuição de status
                                const statusData: Record<string, number> = {};
                                for (const doc of documents) {
                                    if (doc.metadata.source.includes('matriculas') || doc.metadata.source.includes('atendentes')) {
                                        const lines = doc.content.split('\n');
                                        for (const line of lines) {
                                            const match = line.match(/• (\w+): (\d+)/);
                                            if (match) {
                                                statusData[match[1]] = (statusData[match[1]] || 0) + parseInt(match[2]);
                                            }
                                        }
                                    }
                                }
                                chartData = statusDistributionToChartData(statusData);
                                break;
                            }

                            case 'matriculas_curso': {
                                // Extrair matrículas por curso
                                const matriculasData: Record<string, number> = {};
                                for (const doc of documents) {
                                    if (doc.metadata.source.includes('matriculas') || doc.metadata.source.includes('turmas')) {
                                        const lines = doc.content.split('\n');
                                        for (const line of lines) {
                                            const match = line.match(/(\d+)\. (.+): (\d+) matrícula/);
                                            if (match) {
                                                matriculasData[match[2]] = parseInt(match[3]);
                                            }
                                        }
                                    }
                                }
                                chartData = matriculasPorCursoToChartData(matriculasData);
                                break;
                            }

                            case 'estatisticas_atendentes': {
                                // Extrair estatísticas dos atendentes
                                const atendenteStats: Array<{ nome: string; atendimentos: number }> = [];
                                for (const doc of documents) {
                                    if (doc.metadata.source.includes('atendentes_estatisticas')) {
                                        const lines = doc.content.split('\n');
                                        let nome = '';
                                        let atendimentos = 0;
                                        for (const line of lines) {
                                            const nomeMatch = line.match(/Atendente: (.+)/);
                                            const atendMatch = line.match(/Total de Atendimentos Realizados: (\d+)/);
                                            if (nomeMatch) nome = nomeMatch[1];
                                            if (atendMatch) atendimentos = parseInt(atendMatch[1]);
                                        }
                                        if (nome && atendimentos > 0) {
                                            atendenteStats.push({ nome, atendimentos });
                                        }
                                    }
                                }
                                chartData = {
                                    labels: atendenteStats.map(a => a.nome),
                                    datasets: [{
                                        label: 'Atendimentos',
                                        data: atendenteStats.map(a => a.atendimentos),
                                    }],
                                };
                                break;
                            }

                            case 'ofertas_modalidade': {
                                // Extrair ofertas por modalidade
                                const modalidadeData: Record<string, number> = {};
                                for (const doc of documents) {
                                    if (doc.metadata.source === 'totvs_ofertas') {
                                        const lines = doc.content.split('\n');
                                        for (const line of lines) {
                                            const match = line.match(/Modalidade de Ensino: (.+)/);
                                            if (match) {
                                                modalidadeData[match[1]] = (modalidadeData[match[1]] || 0) + 1;
                                            }
                                        }
                                    }
                                }
                                chartData = {
                                    labels: Object.keys(modalidadeData),
                                    datasets: [{
                                        label: 'Ofertas',
                                        data: Object.values(modalidadeData),
                                    }],
                                };
                                break;
                            }

                            default:
                                throw new Error(`Tipo de relatório não implementado: ${tipo_relatorio}`);
                        }

                        // Aplicar cores padrão
                        chartData = applyDefaultColors(chartData);

                        // Criar configuração do gráfico
                        let configuration: any;
                        switch (tipo_grafico) {
                            case 'bar':
                                configuration = createBarChart(defaultTitle, chartData);
                                break;
                            case 'horizontalBar':
                                configuration = createBarChart(defaultTitle, chartData, { horizontal: true });
                                break;
                            case 'pie':
                                configuration = createPieChart(defaultTitle, chartData);
                                break;
                            case 'doughnut':
                                configuration = createDoughnutChart(defaultTitle, chartData);
                                break;
                            case 'line':
                                configuration = createLineChart(defaultTitle, chartData);
                                break;
                            default:
                                configuration = createBarChart(defaultTitle, chartData);
                        }

                        // Atualizar dimensões
                        const chartInstance = new ChartJSNodeCanvas({
                            width: largura,
                            height: altura,
                            chartCallback: (ChartJS: any) => {
                                ChartJS.defaults.responsive = true;
                                ChartJS.defaults.maintainAspectRatio = false;
                            }
                        });

                        // Gerar o gráfico
                        const buffer = await chartInstance.renderToBuffer(configuration as any);
                        const base64Image = buffer.toString('base64');

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Relatório gráfico "${tipo_relatorio}" gerado com sucesso. Aqui está a visualização dos dados:`,
                                },
                                {
                                    type: 'image',
                                    data: base64Image,
                                    mimeType: 'image/png',
                                },
                            ],
                        };
                    }

                    case 'criar_dashboard': {
                        const { titulo_dashboard, graficos, largura = 600, altura = 400 } = args as {
                            titulo_dashboard: string;
                            graficos: Array<{
                                tipo_relatorio: string;
                                titulo?: string;
                                tipo_grafico?: string;
                            }>;
                            largura?: number;
                            altura?: number;
                        };

                        console.error(`[MCP] Criando dashboard: ${titulo_dashboard} com ${graficos.length} gráficos`);

                        const dashboardContent: Array<{ type: string; text?: string; data?: string; mimeType?: string }> = [
                            {
                                type: 'text',
                                text: `📊 **Dashboard: ${titulo_dashboard}**\n\nAqui estão os gráficos solicitados para análise visual dos dados:`,
                            },
                        ];

                        // Gerar cada gráfico do dashboard
                        for (let i = 0; i < graficos.length; i++) {
                            const grafico = graficos[i];
                            const { tipo_relatorio, titulo, tipo_grafico = 'bar' } = grafico;

                            try {
                                // Reutilizar a lógica de gerar_relatorio_grafico
                                let searchQuery = '';
                                let defaultTitle = '';

                                switch (tipo_relatorio) {
                                    case 'ranking_cursos':
                                        searchQuery = 'ranking cursos mais procurados quantidade';
                                        defaultTitle = titulo || 'Ranking dos Cursos Mais Procurados';
                                        break;
                                    case 'distribuicao_status':
                                        searchQuery = 'distribuição status candidatos matrículas';
                                        defaultTitle = titulo || 'Distribuição de Candidatos por Status';
                                        break;
                                    case 'matriculas_curso':
                                        searchQuery = 'matrículas por curso área quantidade alunos';
                                        defaultTitle = titulo || 'Matrículas por Curso/Área';
                                        break;
                                    case 'estatisticas_atendentes':
                                        searchQuery = 'estatísticas atendentes performance quantidade atendimentos';
                                        defaultTitle = titulo || 'Estatísticas dos Atendentes';
                                        break;
                                    case 'ofertas_modalidade':
                                        searchQuery = 'ofertas cursos modalidade ensino turno';
                                        defaultTitle = titulo || 'Ofertas de Cursos por Modalidade';
                                        break;
                                    default:
                                        throw new Error(`Tipo de relatório desconhecido: ${tipo_relatorio}`);
                                }

                                const documents = await this.ragEngine.retrieve(searchQuery, 20);

                                if (documents.length === 0) {
                                    dashboardContent.push({
                                        type: 'text',
                                        text: `\n❌ **Gráfico ${i + 1}**: Não foi possível gerar "${tipo_relatorio}" - dados insuficientes.`,
                                    });
                                    continue;
                                }

                                // Processar dados (lógica similar ao case anterior)
                                let chartData: ChartData;

                                switch (tipo_relatorio) {
                                    case 'ranking_cursos': {
                                        const rankingData: Array<{ NOME: string; QTD: number }> = [];
                                        for (const doc of documents) {
                                            if (doc.metadata.source === 'totvs_ranking') {
                                                const lines = doc.content.split('\n');
                                                for (const line of lines) {
                                                    const match = line.match(/Curso Popular #\d+: (.+?) (\d+) interessados/);
                                                    if (match) {
                                                        rankingData.push({
                                                            NOME: match[1],
                                                            QTD: parseInt(match[2]),
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                        chartData = rankingToChartData(rankingData);
                                        break;
                                    }

                                    case 'distribuicao_status': {
                                        const statusData: Record<string, number> = {};
                                        for (const doc of documents) {
                                            if (doc.metadata.source.includes('matriculas') || doc.metadata.source.includes('atendentes')) {
                                                const lines = doc.content.split('\n');
                                                for (const line of lines) {
                                                    const match = line.match(/• (\w+): (\d+)/);
                                                    if (match) {
                                                        statusData[match[1]] = (statusData[match[1]] || 0) + parseInt(match[2]);
                                                    }
                                                }
                                            }
                                        }
                                        chartData = statusDistributionToChartData(statusData);
                                        break;
                                    }

                                    case 'matriculas_curso': {
                                        const matriculasData: Record<string, number> = {};
                                        for (const doc of documents) {
                                            if (doc.metadata.source.includes('matriculas') || doc.metadata.source.includes('turmas')) {
                                                const lines = doc.content.split('\n');
                                                for (const line of lines) {
                                                    const match = line.match(/(\d+)\. (.+): (\d+) matrícula/);
                                                    if (match) {
                                                        matriculasData[match[2]] = parseInt(match[3]);
                                                    }
                                                }
                                            }
                                        }
                                        chartData = matriculasPorCursoToChartData(matriculasData);
                                        break;
                                    }

                                    case 'estatisticas_atendentes': {
                                        const atendenteStats: Array<{ nome: string; atendimentos: number }> = [];
                                        for (const doc of documents) {
                                            if (doc.metadata.source.includes('atendentes_estatisticas')) {
                                                const lines = doc.content.split('\n');
                                                let nome = '';
                                                let atendimentos = 0;
                                                for (const line of lines) {
                                                    const nomeMatch = line.match(/Atendente: (.+)/);
                                                    const atendMatch = line.match(/Total de Atendimentos Realizados: (\d+)/);
                                                    if (nomeMatch) nome = nomeMatch[1];
                                                    if (atendMatch) atendimentos = parseInt(atendMatch[1]);
                                                }
                                                if (nome && atendimentos > 0) {
                                                    atendenteStats.push({ nome, atendimentos });
                                                }
                                            }
                                        }
                                        chartData = {
                                            labels: atendenteStats.map(a => a.nome),
                                            datasets: [{
                                                label: 'Atendimentos',
                                                data: atendenteStats.map(a => a.atendimentos),
                                            }],
                                        };
                                        break;
                                    }

                                    case 'ofertas_modalidade': {
                                        const modalidadeData: Record<string, number> = {};
                                        for (const doc of documents) {
                                            if (doc.metadata.source === 'totvs_ofertas') {
                                                const lines = doc.content.split('\n');
                                                for (const line of lines) {
                                                    const match = line.match(/Modalidade de Ensino: (.+)/);
                                                    if (match) {
                                                        modalidadeData[match[1]] = (modalidadeData[match[1]] || 0) + 1;
                                                    }
                                                }
                                            }
                                        }
                                        chartData = {
                                            labels: Object.keys(modalidadeData),
                                            datasets: [{
                                                label: 'Ofertas',
                                                data: Object.values(modalidadeData),
                                            }],
                                        };
                                        break;
                                    }

                                    default:
                                        continue;
                                }

                                chartData = applyDefaultColors(chartData);

                                let configuration: any;
                                switch (tipo_grafico) {
                                    case 'bar':
                                        configuration = createBarChart(defaultTitle, chartData);
                                        break;
                                    case 'horizontalBar':
                                        configuration = createBarChart(defaultTitle, chartData, { horizontal: true });
                                        break;
                                    case 'pie':
                                        configuration = createPieChart(defaultTitle, chartData);
                                        break;
                                    case 'doughnut':
                                        configuration = createDoughnutChart(defaultTitle, chartData);
                                        break;
                                    case 'line':
                                        configuration = createLineChart(defaultTitle, chartData);
                                        break;
                                    default:
                                        configuration = createBarChart(defaultTitle, chartData);
                                }

                                const chartInstance = new ChartJSNodeCanvas({
                                    width: largura,
                                    height: altura,
                                    chartCallback: (ChartJS: any) => {
                                        ChartJS.defaults.responsive = true;
                                        ChartJS.defaults.maintainAspectRatio = false;
                                    }
                                });

                                const buffer = await chartInstance.renderToBuffer(configuration as any);
                                const base64Image = buffer.toString('base64');

                                dashboardContent.push(
                                    {
                                        type: 'text',
                                        text: `\n📈 **Gráfico ${i + 1}: ${defaultTitle}**`,
                                    },
                                    {
                                        type: 'image',
                                        data: base64Image,
                                        mimeType: 'image/png',
                                    }
                                );

                            } catch (error) {
                                console.error(`[MCP] Erro ao gerar gráfico ${i + 1}:`, error);
                                dashboardContent.push({
                                    type: 'text',
                                    text: `\n❌ **Gráfico ${i + 1}**: Erro ao gerar "${tipo_relatorio}" - ${error}`,
                                });
                            }
                        }

                        dashboardContent.push({
                            type: 'text',
                            text: `\n✅ Dashboard "${titulo_dashboard}" concluído com ${graficos.length} gráfico(s).`,
                        });

                        return {
                            content: dashboardContent,
                        };
                    }

                    default:
                        throw new Error(`Ferramenta desconhecida: ${name}`);
                }
            } catch (error) {
                console.error(`[MCP] Erro ao executar ${name}:`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Erro ao executar ${name}: ${error}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    /**
     * Inicia o servidor MCP via stdio
     */
    async start(): Promise<void> {
        // Indexar dados na inicialização
        await this.ensureIndexed();

        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('[MCP] Servidor TOTVS MCP iniciado com busca vetorial');
    }
}

// Se executado diretamente, inicia o servidor
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new TOTVSMCPServer();
    server.start().catch(console.error);
}
