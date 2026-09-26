'use client';

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ChartSpec } from '@/ai/bi/chartTypes';

// ---------------------------------------------------------------------------
// Paletas de cores
// ---------------------------------------------------------------------------

const PALETTES: Record<string, string[]> = {
  blue:   ['#3B82F6', '#93C5FD', '#1D4ED8', '#60A5FA', '#BFDBFE'],
  green:  ['#10B981', '#6EE7B7', '#059669', '#34D399', '#A7F3D0'],
  purple: ['#8B5CF6', '#C4B5FD', '#7C3AED', '#A78BFA', '#DDD6FE'],
  orange: ['#F59E0B', '#FCD34D', '#D97706', '#FBBF24', '#FDE68A'],
  mixed:  ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
};

function palette(scheme?: string, count = 5): string[] {
  const colors = PALETTES[scheme ?? 'mixed'] ?? PALETTES.mixed;
  // repeat if needed
  const result: string[] = [];
  for (let i = 0; i < count; i++) result.push(colors[i % colors.length]!);
  return result;
}

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

// ---------------------------------------------------------------------------
// Formatador de valores
// ---------------------------------------------------------------------------
function fmt(value: number, unit?: string): string {
  if (unit === 'R$') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M${unit ? ` ${unit}` : ''}`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k${unit ? ` ${unit}` : ''}`;
  return `${value.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}`;
}

// ---------------------------------------------------------------------------
// Subcomponentes de chart
// ---------------------------------------------------------------------------

function BarChartView({ spec }: { spec: ChartSpec }) {
  const colors = palette(spec.colorScheme, spec.data.length);
  const isMultiSeries = (spec.series?.length ?? 0) > 1;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v, spec.unit)} width={50} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v ?? 0), spec.unit)]} />
        {isMultiSeries ? (
          <>
            <Legend iconSize={10} />
            {spec.series!.map((s, i) => (
              <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color ?? colors[i]} stackId={spec.stacked ? 'a' : undefined} radius={[4, 4, 0, 0]} />
            ))}
          </>
        ) : (
          <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]}>
            {spec.data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function BarHorizontalView({ spec }: { spec: ChartSpec }) {
  const colors = palette(spec.colorScheme, spec.data.length);
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, spec.data.length * 32)}>
      <BarChart layout="vertical" data={spec.data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v, spec.unit)} />
        <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={90} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v ?? 0), spec.unit)]} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {spec.data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartView({ spec }: { spec: ChartSpec }) {
  const colors = palette(spec.colorScheme);
  const isMultiSeries = (spec.series?.length ?? 0) > 1;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v, spec.unit)} width={50} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v ?? 0), spec.unit)]} />
        {isMultiSeries ? (
          <>
            <Legend iconSize={10} />
            {spec.series!.map((s, i) => (
              <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color ?? colors[i]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </>
        ) : (
          <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={{ r: 3 }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

function AreaChartView({ spec }: { spec: ChartSpec }) {
  const colors = palette(spec.colorScheme);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors[0]} stopOpacity={0.25} />
            <stop offset="95%" stopColor={colors[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v, spec.unit)} width={50} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v ?? 0), spec.unit)]} />
        <Area type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} fill="url(#areaGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PieChartView({ spec, donut = false }: { spec: ChartSpec; donut?: boolean }) {
  const colors = palette(spec.colorScheme, spec.data.length);
  const total = spec.data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={spec.data}
          dataKey="value"
          nameKey="label"
          cx="50%" cy="50%"
          innerRadius={donut ? '55%' : 0}
          outerRadius="75%"
          paddingAngle={2}
          labelLine={false}
        >
          {spec.data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v ?? 0), spec.unit), '']} />
        <Legend iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function RadarChartView({ spec }: { spec: ChartSpec }) {
  const colors = palette(spec.colorScheme);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={spec.data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis tick={{ fontSize: 10 }} />
        <Radar name={spec.title} dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.25} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function ScatterChartView({ spec }: { spec: ChartSpec }) {
  const colors = palette(spec.colorScheme);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="value" name={spec.xAxisLabel ?? 'X'} tick={{ fontSize: 11 }} />
        <YAxis dataKey="value2" name={spec.yAxisLabel ?? 'Y'} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={spec.data} fill={colors[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function ComboChartView({ spec }: { spec: ChartSpec }) {
  const colors = palette(spec.colorScheme);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v, spec.unit)} width={50} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v ?? 0), spec.unit)]} />
        <Legend iconSize={10} />
        {(spec.series ?? []).map((s, i) =>
          s.type === 'line'
            ? <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color ?? colors[i]} strokeWidth={2} />
            : <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color ?? colors[i]} radius={[4, 4, 0, 0]} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function FunnelView({ spec }: { spec: ChartSpec }) {
  const colors = palette(spec.colorScheme, spec.data.length);
  const max = Math.max(...spec.data.map(d => d.value), 1);
  return (
    <div className="space-y-1.5 py-2">
      {spec.data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-28 text-xs text-slate-600 truncate text-right">{d.label}</span>
          <div className="flex-1 relative h-7 rounded overflow-hidden bg-slate-100">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: colors[i % colors.length] }}
            />
            <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold text-white mix-blend-multiply">
              {fmt(d.value, spec.unit)}
            </span>
          </div>
          {i < spec.data.length - 1 && (
            <span className="text-xs text-slate-400">
              {((spec.data[i + 1]!.value / d.value) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MetricView({ spec }: { spec: ChartSpec }) {
  const m = spec.metric!;
  const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus;
  const trendColor = m.trend === 'up' ? 'text-emerald-600' : m.trend === 'down' ? 'text-red-500' : 'text-slate-400';
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-1">
      <p className="text-4xl font-extrabold tracking-tight text-slate-900">
        {m.unit === 'R$' ? `R$ ` : ''}{typeof m.value === 'number' ? m.value.toLocaleString('pt-BR') : m.value}{m.unit && m.unit !== 'R$' ? ` ${m.unit}` : ''}
      </p>
      {m.trendValue && (
        <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
          {m.trendValue}
        </div>
      )}
      {m.description && <p className="text-xs text-slate-500 mt-1">{m.description}</p>}
    </div>
  );
}

function TableView({ spec }: { spec: ChartSpec }) {
  return (
    <div className="overflow-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-slate-700">{spec.xAxisLabel ?? 'Item'}</th>
            <th className="px-3 py-2 text-right font-semibold text-slate-700">{spec.yAxisLabel ?? 'Valor'}</th>
          </tr>
        </thead>
        <tbody>
          {spec.data.map((d, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              <td className="px-3 py-1.5 text-slate-700">{d.label}</td>
              <td className="px-3 py-1.5 text-right font-medium text-slate-900">{fmt(d.value, spec.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card raiz
// ---------------------------------------------------------------------------

export function BiChartCard({ spec }: { spec: ChartSpec }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden my-2">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-900">{spec.title}</p>
        {spec.description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{spec.description}</p>
        )}
      </div>

      {/* Chart body */}
      <div className="px-3 py-3">
        {spec.type === 'bar'            && <BarChartView spec={spec} />}
        {spec.type === 'bar_horizontal' && <BarHorizontalView spec={spec} />}
        {spec.type === 'line'           && <LineChartView spec={spec} />}
        {spec.type === 'area'           && <AreaChartView spec={spec} />}
        {spec.type === 'pie'            && <PieChartView spec={spec} />}
        {spec.type === 'donut'          && <PieChartView spec={spec} donut />}
        {spec.type === 'scatter'        && <ScatterChartView spec={spec} />}
        {spec.type === 'radar'          && <RadarChartView spec={spec} />}
        {spec.type === 'combo'          && <ComboChartView spec={spec} />}
        {spec.type === 'funnel'         && <FunnelView spec={spec} />}
        {spec.type === 'metric'         && <MetricView spec={spec} />}
        {spec.type === 'table'          && <TableView spec={spec} />}
      </div>
    </div>
  );
}
