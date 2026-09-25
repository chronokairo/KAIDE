/**
 * Chart generation utilities
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

export function createBarChart(
    title: string,
    data: ChartData,
    options: { horizontal?: boolean } = {}
): ChartConfiguration {
    return {
        type: 'bar',
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
                y: { beginAtZero: true },
            },
        },
    };
}

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
                y: { beginAtZero: true },
            },
        },
    };
}

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
                legend: { position: 'right' },
            },
        },
    };
}

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
                legend: { position: 'right' },
            },
        },
    };
}

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
