/**
 * @layer features/chat
 * @description Serviço de chat com RAG baseado em documentos
 */

import type { ChatMessage, ChatResponse, ChatSource, StreamChunk } from './types.js';
import { DocumentRAGEngine } from '../rag/document-engine.js';
import { generateDashboardData, formatDashboardAsText, type ChartData } from '../rag/kpi-processor.js';
import { getTOTVSClient } from '../api-client/client.js';

export class ChatService {
  private ragEngine: DocumentRAGEngine;

  constructor() {
    this.ragEngine = new DocumentRAGEngine();
  }

  /**
   * Inicializa o sistema RAG
   */
  async initialize(): Promise<void> {
    await this.ragEngine.initialize();
  }

  /**
   * Indexa documentos
   */
  async indexDocuments(): Promise<any> {
    return await this.ragEngine.indexDocuments();
  }

  /**
   * Processa uma mensagem de chat
   */
  async processMessage(message: string): Promise<ChatResponse> {
    console.log(`[ChatService] Processing message: "${message}"`);
    const response = await this.ragEngine.query(message);
    console.log(`[ChatService] RAG response: "${response.answer?.substring(0, 100)}..."`);
    const sources = await this.ragEngine.getSourcesForQuery(message);

    return {
      response: response.answer,
      sources: sources.map((s) => ({
        source: s.source,
        endpoint: s.endpoint,
        dataPreview: s.dataPreview,
      })),
    };
  }

  /**
   * Gera dados estruturados para dashboard/KPI
   */
  async generateDashboard(message: string): Promise<ChatResponse> {
    console.log(`[ChatService] Generating dashboard for: "${message}"`);

    try {
      // Buscar dados das APIs relevantes
      const client = getTOTVSClient();

      // Buscar dados de atendentes e histórico
      const atendentesResult = await client.getAtendentes();

      // Agregar histórico de todos os atendentes
      let allHistorico: any[] = [];
      if (atendentesResult.success && Array.isArray(atendentesResult.data)) {
        for (const atendente of atendentesResult.data as any[]) {
          try {
            const hist = await client.getHistoricoAtendimento(atendente.CODIGO);
            if (hist.success && Array.isArray(hist.data)) {
              allHistorico = [...allHistorico, ...hist.data];
            }
          } catch (err) {
            console.warn(`[ChatService] Erro ao buscar histórico de ${atendente.CODIGO}:`, err);
          }
        }
      }

      const historicoResult = { success: true, data: allHistorico };

      const attendantData = atendentesResult.success && atendentesResult.data && typeof atendentesResult.data === 'object' && 'atendentes' in atendentesResult.data
        ? (atendentesResult.data as any).atendentes || []
        : [];
      const attendanceData = Array.isArray(allHistorico) ? allHistorico : [];

      // Gerar dados do dashboard
      const dashboardData = generateDashboardData(attendantData, attendanceData);
      const formattedResponse = formatDashboardAsText(dashboardData);

      // Buscar fontes relevantes para o contexto
      const sources = await this.ragEngine.getSourcesForQuery(message);

      return {
        response: formattedResponse,
        sources: sources.map((s) => ({
          source: s.source,
          endpoint: s.endpoint,
          dataPreview: s.dataPreview,
        })),
        charts: dashboardData.charts,
      };
    } catch (error) {
      console.error('[ChatService] Error generating dashboard:', error);
      return {
        response: `Erro ao gerar dashboard: ${error}. Verifique se os serviços estão disponíveis.`,
        sources: [],
      };
    }
  }

  /**
   * Processa uma mensagem com streaming
   */
  async *processMessageStream(message: string): AsyncGenerator<StreamChunk> {
    // Verificar se é uma consulta específica sobre atendentes/performance
    const isAttendantDashboardQuery = /dashboard.*atendente|performance.*atendente|estatísticas.*atendente|relatório.*atendente|kpi.*atendente|atendente.*dashboard|atendente.*performance|atendente.*estatísticas|atendente.*relatório|atendente.*kpi/i.test(message);

    if (isAttendantDashboardQuery) {
      // Gerar dashboard com gráficos de atendentes
      const dashboardResponse = await this.generateDashboard(message);

      // Enviar fontes
      yield { type: 'sources', data: dashboardResponse.sources };

      // Enviar gráficos
      if (dashboardResponse.charts && dashboardResponse.charts.length > 0) {
        yield { type: 'charts', data: dashboardResponse.charts };
      }

      // Enviar resposta formatada
      yield { type: 'chunk', data: dashboardResponse.response };

      yield { type: 'done' };
      return;
    }

    // Verificar se é uma consulta sobre matrículas
    const isMatriculasQuery = /matrícul|matricul|inscri|aluno|turma|curso|oferta|atendente/i.test(message);

    if (isMatriculasQuery) {
      yield* this.processMessageMatriculas(message);
      return;
    }

    // Primeiro, enviar as fontes
    const sources = await this.ragEngine.getSourcesForQuery(message);
    yield { type: 'sources', data: sources };

    // Depois, stream da resposta
    for await (const chunk of this.ragEngine.queryStream(message)) {
      yield { type: 'chunk', data: chunk };
    }

    yield { type: 'done' };
  }

  /**
   * Processa consulta de turmas/matrículas com dados em tempo real das APIs
   */
  async *processMessageTurmas(message: string): AsyncGenerator<StreamChunk> {
    console.log(`[ChatService] Processando consulta de turmas: "${message}"`);

    try {
      const client = getTOTVSClient();

      // 1. Buscar TODAS as matrículas de TODOS os atendentes (E.HISTATEND)
      console.log('[ChatService] Buscando matrículas de todos os atendentes...');
      const matriculasResult = await client.get<any>('atendentes/matriculas');

      let todasMatriculas: any[] = [];
      if (matriculasResult.success && matriculasResult.data) {
        const data = matriculasResult.data as any;
        todasMatriculas = data.matriculas || [];
      }

      // 2. Buscar ofertas de cursos (E.OFERTAS)
      console.log('[ChatService] Buscando ofertas de cursos...');
      const ofertasResult = await client.getOfertas();
      let ofertas: any[] = [];

      if (ofertasResult.success && ofertasResult.data) {
        // Ofertas retorna array direto
        ofertas = Array.isArray(ofertasResult.data) ? ofertasResult.data : [];
      }

      console.log(`[ChatService] Ofertas encontradas: ${ofertas.length}`);

      // 3. Buscar ranking de cursos populares (E.RANKCURSO)
      console.log('[ChatService] Buscando ranking de cursos...');
      const rankResult = await client.getRankCursos();
      let ranking: any[] = [];

      if (rankResult.success && rankResult.data) {
        // Ranking retorna array direto
        ranking = Array.isArray(rankResult.data) ? rankResult.data : [];
      }

      console.log(`[ChatService] Ranking encontrado: ${ranking.length}`);

      // 4. Mesclar e preparar contexto para o NLP
      const contexto = this.prepararContextoTurmas(todasMatriculas, ofertas, ranking);

      console.log(`[ChatService] Contexto preparado: ${contexto.length} caracteres`);
      console.log(`[ChatService] Matrículas: ${todasMatriculas.length}, Ofertas: ${ofertas.length}, Ranking: ${ranking.length}`);

      // Enviar fontes
      yield {
        type: 'sources',
        data: [
          { source: 'E.HISTATEND', endpoint: 'atendentes/matriculas', dataPreview: `${todasMatriculas.length} matrículas` },
          { source: 'E.OFERTAS', endpoint: 'ofertas', dataPreview: `${ofertas.length} cursos` },
          { source: 'E.RANKCURSO', endpoint: 'rank-cursos', dataPreview: `${ranking.length} no ranking` },
        ],
      };

      // 5. Usar NLP para gerar resposta
      for await (const chunk of this.ragEngine.generateStreamWithContext(message, contexto)) {
        yield { type: 'chunk', data: chunk };
      }

      yield { type: 'done' };

    } catch (error) {
      console.error('[ChatService] Erro ao processar turmas:', error);
      yield { type: 'chunk', data: `Erro ao consultar dados: ${error}` };
      yield { type: 'done' };
    }
  }

  /**
   * Processa consulta de matrículas com dados em tempo real das APIs
   */
  async *processMessageMatriculas(message: string): AsyncGenerator<StreamChunk> {
    console.log(`[ChatService] Processando consulta de matrículas: "${message}"`);

    try {
      const client = getTOTVSClient();

      // 1. Buscar TODAS as matrículas de TODOS os atendentes (E.HISTATEND)
      console.log('[ChatService] Buscando matrículas de todos os atendentes...');
      const matriculasResult = await client.get<any>('atendentes/matriculas');

      let todasMatriculas: any[] = [];
      if (matriculasResult.success && matriculasResult.data) {
        const data = matriculasResult.data as any;
        todasMatriculas = data.matriculas || [];
      }

      // 2. Buscar ofertas de cursos (E.OFERTAS)
      console.log('[ChatService] Buscando ofertas de cursos...');
      const ofertasResult = await client.getOfertas();
      let ofertas: any[] = [];

      if (ofertasResult.success && ofertasResult.data) {
        // Ofertas retorna array direto
        ofertas = Array.isArray(ofertasResult.data) ? ofertasResult.data : [];
      }

      console.log(`[ChatService] Ofertas encontradas: ${ofertas.length}`);

      // 3. Buscar atendentes para contexto
      console.log('[ChatService] Buscando dados de atendentes...');
      const atendentesResult = await client.getAtendentes();
      let atendentes: any[] = [];

      if (atendentesResult.success && atendentesResult.data) {
        // Atendentes retorna objeto {success, atendentes: [...]}
        const data = atendentesResult.data as any;
        atendentes = data.atendentes || [];
      }

      console.log(`[ChatService] Atendentes encontrados: ${atendentes.length}`);

      // 4. Mesclar e preparar contexto para o NLP
      const contexto = this.prepararContextoMatriculas(todasMatriculas, ofertas, atendentes);

      console.log(`[ChatService] Contexto preparado: ${contexto.length} caracteres`);
      console.log(`[ChatService] Matrículas: ${todasMatriculas.length}, Ofertas: ${ofertas.length}, Atendentes: ${atendentes.length}`);

      // 5. Gerar dados de gráficos
      const charts = this.gerarGraficosMatriculas(todasMatriculas, atendentes);

      // Enviar fontes
      yield {
        type: 'sources',
        data: [
          { source: 'E.HISTATEND', endpoint: 'atendentes/matriculas', dataPreview: `${todasMatriculas.length} matrículas` },
          { source: 'E.OFERTAS', endpoint: 'ofertas', dataPreview: `${ofertas.length} cursos` },
          { source: 'E.ATENDENTE', endpoint: 'atendentes', dataPreview: `${atendentes.length} atendentes` },
        ],
      };

      // Enviar gráficos se houver
      if (charts.length > 0) {
        yield { type: 'charts', data: charts };
      }

      // 6. Usar NLP para gerar resposta
      console.log('[ChatService] Iniciando geração de resposta via NLP...');
      for await (const chunk of this.ragEngine.generateStreamWithContext(message, contexto)) {
        yield { type: 'chunk', data: chunk };
      }

      console.log('[ChatService] Resposta completa enviada');
      yield { type: 'done' };

    } catch (error) {
      console.error('[ChatService] Erro ao processar matrículas:', error);
      yield { type: 'chunk', data: `Erro ao consultar dados de matrículas: ${error}` };
      yield { type: 'done' };
    }
  }

  /**
   * Prepara contexto estruturado para consulta de turmas
   */
  private prepararContextoTurmas(matriculas: any[], ofertas: any[], ranking: any[]): string {
    const partes: string[] = [];

    // Estatísticas de matrículas
    if (matriculas.length > 0) {
      // Agrupar por área de interesse (curso)
      const porCurso: Record<string, any[]> = {};
      const porStatus: Record<string, number> = {};
      const porProcesso: Record<string, number> = {};

      for (const m of matriculas) {
        const curso = m.AREA_INTERESSES || 'Não especificado';
        const status = m.STATUS || 'Desconhecido';
        const processo = m.PROCESSO || 'Não especificado';

        if (!porCurso[curso]) porCurso[curso] = [];
        porCurso[curso].push(m);

        porStatus[status] = (porStatus[status] || 0) + 1;
        porProcesso[processo] = (porProcesso[processo] || 0) + 1;
      }

      partes.push(`=== MATRÍCULAS E INSCRIÇÕES (E.HISTATEND) ===
Total de matrículas: ${matriculas.length}

MATRÍCULAS POR CURSO/ÁREA DE INTERESSE:
${Object.entries(porCurso)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([curso, lista]) => `• ${curso}: ${lista.length} aluno(s)`)
          .join('\n')}

DISTRIBUIÇÃO POR STATUS:
${Object.entries(porStatus)
          .sort((a, b) => b[1] - a[1])
          .map(([status, qtd]) => `• ${status}: ${qtd}`)
          .join('\n')}

MATRÍCULAS POR PROCESSO SELETIVO:
${Object.entries(porProcesso)
          .sort((a, b) => b[1] - a[1])
          .map(([proc, qtd]) => `• ${proc}: ${qtd}`)
          .join('\n')}`);
    } else {
      partes.push('=== MATRÍCULAS ===\nNenhuma matrícula encontrada no sistema.');
    }

    // Ofertas de cursos
    if (ofertas.length > 0) {
      partes.push(`\n=== CURSOS DISPONÍVEIS (E.OFERTAS) ===
Total de ofertas: ${ofertas.length}

${ofertas.slice(0, 30).map((o: any) =>
        `• ${o.CURSO || o.CODCURSO} - ${o.TIPOHABILITACAO || 'N/A'} (${o.TURNO || 'N/A'}) - R$ ${o.VAL_MENSAL_CURSO?.toFixed(2) || '0.00'}`
      ).join('\n')}`);
    }

    // Ranking de cursos populares
    if (ranking.length > 0) {
      partes.push(`\n=== CURSOS MAIS POPULARES (E.RANKCURSO) ===
${ranking
          .sort((a: any, b: any) => (b.QTD || 0) - (a.QTD || 0))
          .slice(0, 15)
          .map((r: any, i: number) => `${i + 1}º ${r.NOME || r.CODCURSO}: ${r.QTD || 0} interessados`)
          .join('\n')}`);
    }

    return partes.join('\n\n');
  }

  /**
   * Prepara contexto estruturado para consulta de matrículas
   */
  private prepararContextoMatriculas(matriculas: any[], ofertas: any[], atendentes: any[]): string {
    const partes: string[] = [];

    // Instrução clara para o NLP
    partes.push(`INSTRUÇÕES IMPORTANTES PARA GERAÇÃO DA RESPOSTA:
- Não repita informações sobre o mesmo curso em seções diferentes
- Cada curso deve ser mencionado apenas uma vez na resposta
- Foque na análise dos dados, não em listar todos os cursos individualmente
- Não inclua dados de gráficos, JSON ou código no texto da resposta
- Os gráficos são gerados automaticamente e enviados separadamente
- Use os dados para fornecer insights e estatísticas, não listagens exaustivas`);

    // Estatísticas de matrículas
    if (matriculas.length > 0) {
      // Deduplicar matrículas por candidato + processo para evitar contagens artificiais
      const matriculasUnicas = matriculas.filter((m, index, self) =>
        index === self.findIndex(other =>
          other.CANDIDATO_CPF === m.CANDIDATO_CPF &&
          other.PROCESSO === m.PROCESSO &&
          other.AREA_INTERESSES === m.AREA_INTERESSES
        )
      );

      // Agrupar por área de interesse (curso)
      const porCurso: Record<string, any[]> = {};
      const porStatus: Record<string, number> = {};
      const porAtendente: Record<string, number> = {};
      const porProcesso: Record<string, number> = {};

      for (const m of matriculasUnicas) {
        const curso = m.AREA_INTERESSES || 'Não especificado';
        const status = m.STATUS || 'Desconhecido';
        const atendente = m.SPSATEND || 'Não atribuído';
        const processo = m.PROCESSO || 'Não especificado';

        if (!porCurso[curso]) porCurso[curso] = [];
        porCurso[curso].push(m);

        porStatus[status] = (porStatus[status] || 0) + 1;
        porAtendente[atendente] = (porAtendente[atendente] || 0) + 1;
        porProcesso[processo] = (porProcesso[processo] || 0) + 1;
      }

      partes.push(`=== MATRÍCULAS E INSCRIÇÕES (E.HISTATEND) ===
Total de matrículas únicas: ${matriculasUnicas.length} (de ${matriculas.length} registros)

TOP 10 CURSOS MAIS PROCURADOS:
${Object.entries(porCurso)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 10)
          .map(([curso, lista], index) => `${index + 1}º ${curso}: ${lista.length} candidato(s)`)
          .join('\n')}

DISTRIBUIÇÃO POR STATUS:
${Object.entries(porStatus)
          .sort((a, b) => b[1] - a[1])
          .map(([status, qtd]) => `• ${status}: ${qtd}`)
          .join('\n')}

MATRÍCULAS POR ATENDENTE:
${Object.entries(porAtendente)
          .sort((a, b) => b[1] - a[1])
          .map(([atendente, qtd]) => `• ${atendente}: ${qtd}`)
          .join('\n')}

MATRÍCULAS POR PROCESSO SELETIVO:
${Object.entries(porProcesso)
          .sort((a, b) => b[1] - a[1])
          .map(([proc, qtd]) => `• ${proc}: ${qtd}`)
          .join('\n')}`);
    } else {
      partes.push('=== MATRÍCULAS ===\nNenhuma matrícula encontrada no sistema.');
    }

    // Atendentes
    if (atendentes.length > 0) {
      partes.push(`\n=== ATENDENTES (E.ATENDENTE) ===
Total de atendentes: ${atendentes.length}

LISTA DE ATENDENTES:
${atendentes
          .sort((a: any, b: any) => (a.NOME || '').localeCompare(b.NOME || ''))
          .map((a: any) => `• ${a.NOME || 'Nome não informado'} (${a.CODIGO})`)
          .join('\n')}`);
    }

    // Ofertas de cursos - estatísticas gerais apenas
    if (ofertas.length > 0) {
      // Deduplicar ofertas por curso para estatísticas
      const cursosUnicos = [...new Set(ofertas.map((o: any) => o.CURSO).filter(Boolean))];

      // Separar por nível de ensino
      const graduacao = ofertas.filter((o: any) => o.NIVEL_ENSINO === 'GRADUAÇÃO' && o.VAL_MENSAL_CURSO > 0);
      const posGrad = ofertas.filter((o: any) => o.NIVEL_ENSINO === 'PÓS-GRADUAÇÃO' && o.VAL_MENSAL_CURSO > 0);
      const mestradoDoutorado = ofertas.filter((o: any) => o.NIVEL_ENSINO === 'MESTRADO/DOUTORADO' && o.VAL_MENSAL_CURSO > 0);

      // Calcular estatísticas de preço
      const calcularEstatisticasPreco = (lista: any[]) => {
        if (lista.length === 0) return null;
        const precos = lista.map((o: any) => o.VAL_MENSAL_CURSO).sort((a, b) => a - b);
        return {
          count: lista.length,
          min: precos[0],
          max: precos[precos.length - 1],
          avg: precos.reduce((a, b) => a + b, 0) / precos.length
        };
      };

      const statsGrad = calcularEstatisticasPreco(graduacao);
      const statsPos = calcularEstatisticasPreco(posGrad);
      const statsMest = calcularEstatisticasPreco(mestradoDoutorado);

      partes.push(`\n=== OFERTAS DE CURSOS (E.OFERTAS) ===
Total de ofertas ativas: ${ofertas.length}
Total de cursos únicos: ${cursosUnicos.length}

DISTRIBUIÇÃO POR NÍVEL DE ENSINO:
- Graduação: ${graduacao.length} ofertas${statsGrad ? ` (R$ ${statsGrad.min.toFixed(2)} - R$ ${statsGrad.max.toFixed(2)})` : ''}
- Pós-Graduação: ${posGrad.length} ofertas${statsPos ? ` (R$ ${statsPos.min.toFixed(2)} - R$ ${statsPos.max.toFixed(2)})` : ''}
- Mestrado/Doutorado: ${mestradoDoutorado.length} ofertas${statsMest ? ` (R$ ${statsMest.min.toFixed(2)} - R$ ${statsMest.max.toFixed(2)})` : ''}

FAIXA DE PREÇOS GERAIS:
- Mais barato: R$ ${Math.min(...ofertas.map((o: any) => o.VAL_MENSAL_CURSO || 999999).filter(p => p < 999999)).toFixed(2)}
- Mais caro: R$ ${Math.max(...ofertas.map((o: any) => o.VAL_MENSAL_CURSO || 0)).toFixed(2)}
- Média: R$ ${(ofertas.reduce((sum, o) => sum + (o.VAL_MENSAL_CURSO || 0), 0) / ofertas.length).toFixed(2)}`);
    }

    return partes.join('\n\n');
  }

  /**
   * Gera gráficos para visualização de matrículas
   */
  private gerarGraficosMatriculas(matriculas: any[], atendentes: any[]): ChartData[] {
    const charts: ChartData[] = [];

    if (matriculas.length === 0) return charts;

    // Gráfico de barras: Matrículas por Curso
    const porCurso: Record<string, number> = {};
    for (const m of matriculas) {
      const curso = m.AREA_INTERESSES || 'Não especificado';
      porCurso[curso] = (porCurso[curso] || 0) + 1;
    }

    // Ordenar e pegar top 20 cursos
    const topCursos = Object.entries(porCurso)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    if (topCursos.length > 0) {
      charts.push({
        type: 'bar',
        title: 'Matrículas por Curso',
        labels: topCursos.map(([curso]) => curso),
        datasets: [{
          label: 'Número de Matrículas',
          data: topCursos.map(([, count]) => count),
        }],
      });
    }

    // Gráfico de barras: Matrículas por Atendente
    const porAtendente: Record<string, number> = {};
    for (const m of matriculas) {
      const atendente = m.SPSATEND || 'Não atribuído';
      porAtendente[atendente] = (porAtendente[atendente] || 0) + 1;
    }

    // Ordenar por quantidade
    const topAtendentes = Object.entries(porAtendente)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topAtendentes.length > 0) {
      charts.push({
        type: 'bar',
        title: 'Matrículas por Atendente',
        labels: topAtendentes.map(([atendente]) => atendente),
        datasets: [{
          label: 'Número de Matrículas',
          data: topAtendentes.map(([, count]) => count),
        }],
      });
    }

    return charts;
  }

  /**
   * Verifica status do sistema
   */
  async getStatus(): Promise<Record<string, any>> {
    return this.ragEngine.getStatus();
  }

  /**
   * Obtém estatísticas
   */
  getStats(): any {
    return this.ragEngine.getStats();
  }

  /**
   * Busca semântica nos documentos indexados
   */
  async search(query: string, topK: number = 10): Promise<any[]> {
    const results = await this.ragEngine.retrieve(query, topK);
    return results.map((doc, idx) => ({
      file: doc.metadata.source,
      title: doc.metadata.title,
      content: doc.content.slice(0, 500),
      relevance: 1 - (idx * 0.1), // Aproximado baseado na ordem
    }));
  }
}

// Singleton para uso global
let chatService: ChatService | null = null;

export function getChatService(): ChatService {
  if (!chatService) {
    chatService = new ChatService();
  }
  return chatService;
}
