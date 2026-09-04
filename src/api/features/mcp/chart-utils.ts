/**
 * @layer features/mcp
 * @description Utilitários para geração de gráficos com dados TOTVS
 */

import type { ChartConfiguration } from 'chart.js';

export interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string[];
    }>;
}

/**
 * Cores padrão para gráficos
 */
export const CHART_COLORS = {
    primary: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)',
        'rgba(255, 99, 255, 0.8)',
        'rgba(99, 255, 132, 0.8)',
    ],
    border: [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)',
        'rgba(255, 99, 255, 1)',
        'rgba(99, 255, 132, 1)',
    ],
};

/**
 * Gera configuração de gráfico de barras
 */
export function createBarChart(
    title: string,
    data: ChartData,
    options: { horizontal?: boolean } = {}
): ChartConfiguration {
    return {
        type: options.horizontal ? 'bar' : 'bar',
        data,
        options: {
            indexAxis: options.horizontal ? 'y' : 'x',
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: { size: 16, weight: 'bold' },
                },
                legend: {
                    display: data.datasets.length > 1,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    };
}

/**
 * Gera configuração de gráfico de linhas
 */
export function createLineChart(title: string, data: ChartData): ChartConfiguration {
    return {
        type: 'line',
        data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: { size: 16, weight: 'bold' },
                },
                legend: {
                    display: data.datasets.length > 1,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    };
}

/**
 * Gera configuração de gráfico de pizza
 */
export function createPieChart(title: string, data: ChartData): ChartConfiguration {
    return {
        type: 'pie',
        data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: { size: 16, weight: 'bold' },
                },
                legend: {
                    position: 'right',
                },
            },
        },
    };
}

/**
 * Gera configuração de gráfico de rosca
 */
export function createDoughnutChart(title: string, data: ChartData): ChartConfiguration {
    return {
        type: 'doughnut',
        data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: { size: 16, weight: 'bold' },
                },
                legend: {
                    position: 'right',
                },
            },
        },
    };
}

/**
 * Converte dados de ranking em formato ChartData
 */
export function rankingToChartData(ranking: Array<{ NOME: string; QTD: number }>): ChartData {
    return {
        labels: ranking.map(item => item.NOME),
        datasets: [{
            label: 'Quantidade',
            data: ranking.map(item => item.QTD),
            backgroundColor: CHART_COLORS.primary.slice(0, ranking.length),
            borderColor: CHART_COLORS.border.slice(0, ranking.length),
        }],
    };
}

/**
 * Converte dados de distribuição por status em ChartData
 */
export function statusDistributionToChartData(statusData: Record<string, number>): ChartData {
    const entries = Object.entries(statusData);
    return {
        labels: entries.map(([status]) => status),
        datasets: [{
            label: 'Quantidade',
            data: entries.map(([, count]) => count),
            backgroundColor: CHART_COLORS.primary.slice(0, entries.length),
            borderColor: CHART_COLORS.border.slice(0, entries.length),
        }],
    };
}

/**
 * Converte dados de matrículas por curso em ChartData
 */
export function matriculasPorCursoToChartData(matriculasData: Record<string, number>): ChartData {
    const entries = Object.entries(matriculasData).sort((a, b) => b[1] - a[1]);
    return {
        labels: entries.map(([curso]) => curso),
        datasets: [{
            label: 'Matrículas',
            data: entries.map(([, count]) => count),
            backgroundColor: CHART_COLORS.primary.slice(0, entries.length),
            borderColor: CHART_COLORS.border.slice(0, entries.length),
        }],
    };
}

/**
 * Aplica cores padrão aos datasets se não especificadas
 */
export function applyDefaultColors(data: ChartData): ChartData {
    return {
        ...data,
        datasets: data.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: dataset.backgroundColor || CHART_COLORS.primary.slice(0, data.labels.length),
            borderColor: dataset.borderColor || CHART_COLORS.border.slice(0, data.labels.length),
        })),
    };
}