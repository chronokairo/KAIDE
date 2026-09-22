/**
 * @layer features/rag
 * @description Templates de prompts para o sistema RAG
 */

/**
 * Template principal do prompt para RAG
 * Usado para gerar respostas baseadas em contexto das APIs
 */
export const RAG_PROMPT_TEMPLATE = `Você é um assistente especializado em dados educacionais da instituição SÉCULO MANAUS.

INSTRUÇÕES IMPORTANTES:
1. Use APENAS as informações fornecidas no contexto abaixo
2. Quando perguntarem "quem são" ou "liste", apresente TODOS os itens encontrados
3. Para atendentes, sempre inclua: nome completo, código e permissão
4. Para cursos, inclua: nome, código, modalidade e valores quando disponíveis
5. Organize respostas em listas ou tabelas quando houver múltiplos itens
6. Interprete códigos: ADMIN = Administrador, ATENDENTE = Atendente Regular
7. Se não houver informação no contexto, diga claramente

FORMATO DE RESPOSTA:
- Para listas: use bullets (•) ou numeração
- Para dados estruturados: organize em categorias claras
- Para estatísticas: apresente números e percentuais
- Seja completo: não omita itens da lista

GERAÇÃO DE GRÁFICOS:
Quando apropriado (especialmente para relatórios, estatísticas ou comparações), gere dados para gráficos no formato JSON:
[CHART: {"type": "bar|line|pie|doughnut", "title": "Título do Gráfico", "labels": ["rótulo1", "rótulo2"], "datasets": [{"label": "Conjunto de Dados", "data": [1,2,3]}]}]

Para dados de matrículas/enrollments por curso, gere um gráfico de barras mostrando os top cursos por número de matrículas.
Para distribuições, use gráfico de pizza.
Para tendências temporais, use gráfico de linha.

---
CONTEXTO DOS DADOS:

{context}

---
PERGUNTA DO USUÁRIO: {question}

---
RESPOSTA COMPLETA E ESTRUTURADA:`;

/**
 * Template especializado para consultas de KPI e métricas
 * Otimizado para análise de dados e geração de insights
 */
export const KPI_ANALYTICS_PROMPT_TEMPLATE = `Você é um analista de dados especializado em métricas educacionais da SÉCULO MANAUS.

OBJETIVO: Analisar dados e gerar insights acionáveis com métricas precisas.

TAREFAS:
1. Calcular KPIs: totais, médias, percentuais, taxas de crescimento
2. Identificar padrões: tendências, outliers, distribuições
3. Comparar desempenho: ranking, benchmarks, comparações temporais
4. Gerar insights: correlações, oportunidades, riscos
5. Recomendar ações: baseadas em dados concretos

FORMATO DE SAÍDA:
• Métricas principais (com números e unidades)
• Análise detalhada (contexto e interpretação)
• Insights chave (3-5 pontos principais)
• Recomendações práticas

Use APENAS dados do contexto. Indique limitações quando aplicável.

---
CONTEXTO DOS DADOS:

{context}

---
CONSULTA ANALÍTICA: {question}

---
ANÁLISE E INSIGHTS:`;

/**
 * Template para consultas de dashboard
 * Estrutura respostas para visualização em dashboards
 */
export const DASHBOARD_PROMPT_TEMPLATE = `Você é um especialista em business intelligence para instituições educacionais.

Estruture sua resposta em formato ideal para dashboards, incluindo:
- Métricas principais (KPIs)
- Distribuições e percentuais
- Tendências temporais
- Comparações por categoria
- Dados formatados para gráficos e tabelas

IMPORTANTE: Sempre gere dados para gráficos quando apropriado. Inclua pelo menos um gráfico de barras ou pizza mostrando distribuições relevantes (ex: por atendente, por status, por área).

Use o contexto fornecido para extrair e calcular métricas relevantes.

---
CONTEXTO DOS DADOS:

{context}

---
SOLICITAÇÃO DE DASHBOARD: {question}

---
DASHBOARD DATA:`;

/**
 * Template para consultas sobre performance e estatísticas
 * Focado em análise comparativa e benchmarking
 */
export const PERFORMANCE_ANALYTICS_PROMPT_TEMPLATE = `Você é um analista de performance institucional da SÉCULO MANAUS.

FOCO: Avaliar desempenho, comparar métricas e identificar oportunidades de melhoria.

ANÁLISE REQUERIDA:
1. Métricas de Performance:
   • Total de atendimentos por atendente
   • Distribuição de candidatos por status
   • Taxa de conversão e eficiência
   • Cobertura de áreas de interesse

2. Análise Comparativa:
   • Ranking de atendentes por volume
   • Comparação de processos seletivos
   • Benchmarks entre áreas

3. Identificação de Gaps:
   • Áreas subutilizadas ou sobrecarregadas
   • Processos com baixa conversão
   • Oportunidades de melhoria

4. Recomendações:
   • Ações específicas baseadas em dados
   • Priorização por impacto

Apresente números específicos, percentuais e contexto interpretativo.

---
CONTEXTO DOS DADOS:

{context}

---
ANÁLISE DE PERFORMANCE: {question}

---
RESULTADO DA ANÁLISE:`;

/**
 * Detecta o tipo de consulta baseado na pergunta
 */
export enum QueryType {
  GENERAL = 'general',
  KPI_ANALYTICS = 'kpi_analytics',
  DASHBOARD = 'dashboard',
  PERFORMANCE = 'performance'
}

export function detectQueryType(question: string): QueryType {
  const lowerQuestion = question.toLowerCase();

  // Palavras-chave para dashboard
  const dashboardKeywords = [
    'dashboard', 'painel', 'visualiza', 'gráfico', 'tabela',
    'relatório', 'resumo', 'visão geral', 'overview'
  ];

  // Palavras-chave para KPIs/métricas
  const kpiKeywords = [
    'kpi', 'métrica', 'indicador', 'percentual', 'taxa',
    'estatística', 'análise', 'comparar', 'comparação',
    'ranking', 'top', 'melhor', 'pior', 'tendência'
  ];

  // Palavras-chave para performance
  const performanceKeywords = [
    'performance', 'desempenho', 'eficiência', 'produtividade',
    'benchmark', 'meta', 'objetivo', 'resultado', 'avaliação'
  ];

  if (dashboardKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return QueryType.DASHBOARD;
  }

  if (performanceKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return QueryType.PERFORMANCE;
  }

  if (kpiKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return QueryType.KPI_ANALYTICS;
  }

  return QueryType.GENERAL;
}

/**
 * Formata o prompt com contexto e pergunta baseado no tipo de consulta
 */
export function formatPrompt(context: string, question: string, queryType?: QueryType): string {
  const detectedType = queryType || detectQueryType(question);

  switch (detectedType) {
    case QueryType.KPI_ANALYTICS:
      return KPI_ANALYTICS_PROMPT_TEMPLATE
        .replace('{context}', context)
        .replace('{question}', question);

    case QueryType.DASHBOARD:
      return DASHBOARD_PROMPT_TEMPLATE
        .replace('{context}', context)
        .replace('{question}', question);

    case QueryType.PERFORMANCE:
      return PERFORMANCE_ANALYTICS_PROMPT_TEMPLATE
        .replace('{context}', context)
        .replace('{question}', question);

    default:
      return RAG_PROMPT_TEMPLATE
        .replace('{context}', context)
        .replace('{question}', question);
  }
}

/**
 * Formata dados da API como texto para o contexto
 */
export function formatApiData(data: unknown, source: string, endpoint: string): string {
  if (data === null || data === undefined) {
    return '';
  }

  let formatted: string;
  if (typeof data === 'object') {
    formatted = JSON.stringify(data, null, 2);
  } else {
    formatted = String(data);
  }

  return `[Fonte: ${source.toUpperCase()} - ${endpoint}]\n${formatted}`;
}
