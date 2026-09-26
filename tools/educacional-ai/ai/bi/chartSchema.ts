import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schema — espelha ChartSpec de @/ai/bi/chartTypes.ts
// Usado para validar o output do LLM antes de enviar ao frontend.
// ---------------------------------------------------------------------------

const chartDataPointSchema = z.object({
  label:    z.string(),
  value:    z.number(),
  value2:   z.number().optional(),
  category: z.string().optional(),
}).catchall(z.unknown());

const chartSeriesSchema = z.object({
  name:    z.string(),
  dataKey: z.string(),
  color:   z.string().optional(),
  type:    z.enum(['bar','line','area']).optional(),
});

const metricSpecSchema = z.object({
  value:      z.union([z.string(), z.number()]),
  unit:       z.string().optional(),
  trend:      z.enum(['up','down','flat']).optional(),
  trendValue: z.string().optional(),
  description:z.string().optional(),
});

export const chartSpecSchema = z.object({
  type: z.enum(['bar','bar_horizontal','line','area','pie','donut','scatter','radar','funnel','metric','table','combo']),
  title:       z.string().min(1),
  description: z.string().optional(),
  data:        z.array(chartDataPointSchema).min(1),
  series:      z.array(chartSeriesSchema).optional(),
  metric:      metricSpecSchema.optional(),
  colorScheme: z.enum(['blue','green','purple','orange','mixed']).optional(),
  unit:        z.string().optional(),
  xAxisLabel:  z.string().optional(),
  yAxisLabel:  z.string().optional(),
  stacked:     z.boolean().optional(),
});

export type ValidatedChartSpec = z.infer<typeof chartSpecSchema>;
