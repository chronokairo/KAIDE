/**
 * Tipos compartilhados para o sistema de BI generativo da Anna.
 * A IA chama `render_bi_chart` com um ChartSpec e o frontend renderiza.
 */

export type ChartType =
  | 'bar'           // barras verticais
  | 'bar_horizontal'// barras horizontais
  | 'line'          // linha temporal
  | 'area'          // área preenchida
  | 'pie'           // pizza
  | 'donut'         // rosca
  | 'scatter'       // dispersão
  | 'radar'         // radar/aranha
  | 'funnel'        // funil de conversão
  | 'metric'        // KPI card (número grande + trend)
  | 'table'         // tabela de dados
  | 'combo';        // barra + linha sobrepostos

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;       // segunda série (combo, scatter)
  category?: string;     // agrupamento por cor
  [key: string]: unknown;
}

export interface ChartSeries {
  name: string;
  dataKey: string;
  color?: string;
  type?: 'bar' | 'line' | 'area';
}

export interface MetricSpec {
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;   // ex: "+12% vs mês anterior"
  description?: string;
}

export interface ChartSpec {
  type: ChartType;
  title: string;
  description?: string;   // insight gerado pela IA
  data: ChartDataPoint[];
  series?: ChartSeries[];  // para charts multi-série
  metric?: MetricSpec;     // para type === 'metric'
  xAxisLabel?: string;
  yAxisLabel?: string;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'mixed';
  unit?: string;           // unidade dos valores (R$, %, alunos…)
  stacked?: boolean;
}
