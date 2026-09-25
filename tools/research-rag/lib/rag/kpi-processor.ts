/**
 * KPI and metrics processor for data analysis
 */

export interface KPIMetric {
    name: string;
    value: number | string;
    unit?: string;
    description: string;
    category: string;
}

export interface DashboardData {
    title: string;
    metrics: KPIMetric[];
    charts: ChartData[];
    insights: string[];
    recommendations: string[];
}

export interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    title: string;
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string[];
    }[];
}

/**
 * Processa dados de atendentes e extrai KPIs
 */
export function extractAttendantKPIs(attendantData: any[]): KPIMetric[] {
    const metrics: KPIMetric[] = [];

    // Robust validation: ensure it's a valid array with reduce method
    if (!Array.isArray(attendantData) || attendantData.length === 0 || typeof attendantData.reduce !== 'function') {
        console.log('[KPIPROCESSOR] Invalid attendantData:', typeof attendantData, Array.isArray(attendantData), attendantData?.length);
        return metrics;
    }

    // KPI: Total de atendentes
    metrics.push({
        name: 'Total de Atendentes',
        value: attendantData.length,
        unit: 'atendentes',
        description: 'Número total de atendentes cadastrados no sistema',
        category: 'Recursos Humanos'
    });

    // KPI: Distribuição por tipo de permissão
    const permissionCount = attendantData.reduce((acc: Record<string, number>, att: any) => {
        acc[att.PERMISSAO] = (acc[att.PERMISSAO] || 0) + 1;
        return acc;
    }, {});

    Object.entries(permissionCount).forEach(([permission, count]) => {
        metrics.push({
            name: `Atendentes ${permission}`,
            value: count,
            unit: 'atendentes',
            description: `Número de atendentes com permissão ${permission}`,
            category: 'Recursos Humanos'
        });
    });

    // KPI: Percentual de admins
    const adminPercent = attendantData.length > 0 ?
        Math.round((permissionCount['ADMIN'] || 0) / attendantData.length * 100) : 0;

    metrics.push({
        name: 'Percentual de Administradores',
        value: adminPercent,
        unit: '%',
        description: 'Percentual de atendentes com permissões administrativas',
        category: 'Recursos Humanos'
    });

    return metrics;
}

/**
 * Processa dados de histórico de atendimento e extrai KPIs
 */
export function extractAttendanceKPIs(attendanceData: any[]): KPIMetric[] {
    const metrics: KPIMetric[] = [];

    // Robust validation: ensure it's a valid array with reduce method
    if (!Array.isArray(attendanceData) || attendanceData.length === 0 || typeof attendanceData.reduce !== 'function') {
        console.log('[KPIPROCESSOR] Invalid attendanceData:', typeof attendanceData, Array.isArray(attendanceData), attendanceData?.length);
        return metrics;
    }

    // KPI: Total de atendimentos
    metrics.push({
        name: 'Total de Atendimentos',
        value: attendanceData.length,
        unit: 'atendimentos',
        description: 'Número total de atendimentos realizados',
        category: 'Atendimento'
    });

    // KPI: Candidatos únicos atendidos
    const uniqueCandidates = new Set(attendanceData.map((h: any) => h.CANDIDATO_NROINSCRICAO)).size;
    metrics.push({
        name: 'Candidatos Únicos Atendidos',
        value: uniqueCandidates,
        unit: 'candidatos',
        description: 'Número de candidatos únicos que receberam atendimento',
        category: 'Atendimento'
    });

    // KPI: Distribuição por status
    const statusCount = attendanceData.reduce((acc: Record<string, number>, h: any) => {
        acc[h.STATUS] = (acc[h.STATUS] || 0) + 1;
        return acc;
    }, {});

    Object.entries(statusCount).forEach(([status, count]) => {
        const percentage = Math.round((count / attendanceData.length) * 100);
        metrics.push({
            name: `Candidatos ${status}`,
            value: percentage,
            unit: '%',
            description: `Percentual de candidatos com status "${status}"`,
            category: 'Status dos Candidatos'
        });
    });

    // KPI: Áreas de interesse mais demandadas
    const areaCount = attendanceData.reduce((acc: Record<string, number>, h: any) => {
        if (h.AREA_INTERESSES) {
            acc[h.AREA_INTERESSES] = (acc[h.AREA_INTERESSES] || 0) + 1;
        }
        return acc;
    }, {});

    const topAreas = Object.entries(areaCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    topAreas.forEach(([area, count]) => {
        metrics.push({
            name: `Demanda: ${area}`,
            value: count,
            unit: 'atendimentos',
            description: `Número de atendimentos na área "${area}"`,
            category: 'Áreas de Interesse'
        });
    });

    // KPI: Processos seletivos ativos
    const uniqueProcesses = new Set(attendanceData.map((h: any) => h.PROCESSO)).size;
    metrics.push({
        name: 'Processos Seletivos Ativos',
        value: uniqueProcesses,
        unit: 'processos',
        description: 'Número de processos seletivos com atendimentos ativos',
        category: 'Processos Seletivos'
    });

    return metrics;
}

/**
 * Gera dados estruturados para dashboard
 */
export function generateDashboardData(attendantData: any[], attendanceData: any[]): DashboardData {
    // Ensure data is valid arrays
    const validAttendantData = Array.isArray(attendantData) ? attendantData : [];
    const validAttendanceData = Array.isArray(attendanceData) ? attendanceData : [];

    console.log(`[KPIPROCESSOR] attendantData type: ${typeof attendantData}, isArray: ${Array.isArray(attendantData)}, length: ${Array.isArray(attendantData) ? attendantData.length : 'N/A'}`);
    console.log(`[KPIPROCESSOR] attendanceData type: ${typeof attendanceData}, isArray: ${Array.isArray(attendanceData)}, length: ${Array.isArray(attendanceData) ? attendanceData.length : 'N/A'}`);

    const attendantKPIs = extractAttendantKPIs(validAttendantData);
    const attendanceKPIs = extractAttendanceKPIs(validAttendanceData);

    const allKPIs = [...attendantKPIs, ...attendanceKPIs];

    // Gerar dados para gráficos
    const charts: ChartData[] = [];

    // Gráfico de distribuição por status
    if (validAttendanceData && validAttendanceData.length > 0) {
        const statusData = validAttendanceData.reduce((acc: Record<string, number>, h: any) => {
            acc[h.STATUS] = (acc[h.STATUS] || 0) + 1;
            return acc;
        }, {});

        charts.push({
            type: 'pie',
            title: 'Distribuição de Candidatos por Status',
            labels: Object.keys(statusData),
            datasets: [{
                label: 'Candidatos',
                data: Object.values(statusData),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ]
            }]
        });
    }

    // Gráfico de áreas de interesse
    if (validAttendanceData && validAttendanceData.length > 0) {
        const areaData = validAttendanceData.reduce((acc: Record<string, number>, h: any) => {
            if (h.AREA_INTERESSES) {
                acc[h.AREA_INTERESSES] = (acc[h.AREA_INTERESSES] || 0) + 1;
            }
            return acc;
        }, {});

        const topAreas = Object.entries(areaData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        charts.push({
            type: 'bar',
            title: 'Top 5 Cursos por Atendimentos',
            labels: topAreas.map(([area]) => area),
            datasets: [{
                label: 'Atendimentos',
                data: topAreas.map(([, count]) => count),
                backgroundColor: ['#36A2EB']
            }]
        });
    }

    // Gráfico de distribuição de atendimentos por atendente
    if (validAttendanceData && validAttendanceData.length > 0) {
        const attendantDataCount = validAttendanceData.reduce((acc: Record<string, number>, h: any) => {
            const attendant = h.SPSATEND || h.ATENDENTE || h.ATENDENTE_CODIGO || 'Desconhecido';
            acc[attendant] = (acc[attendant] || 0) + 1;
            return acc;
        }, {});

        const topAttendants = Object.entries(attendantDataCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10); // Top 10 atendentes

        if (topAttendants.length > 0) {
            charts.push({
                type: 'pie',
                title: 'Distribuição de Atendimentos por Atendente',
                labels: topAttendants.map(([attendant]) => attendant),
                datasets: [{
                    label: 'Atendimentos',
                    data: topAttendants.map(([, count]) => count),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                        '#FF9F40', '#4BC0C0'
                    ]
                }]
            });
        }
    }

    // Gráfico de distribuição de permissões dos atendentes
    if (validAttendantData && validAttendantData.length > 0) {
        const permissionData = validAttendantData.reduce((acc: Record<string, number>, att: any) => {
            const permission = att.PERMISSAO || 'Desconhecido';
            acc[permission] = (acc[permission] || 0) + 1;
            return acc;
        }, {});

        charts.push({
            type: 'pie',
            title: 'Distribuição de Atendentes por Permissão',
            labels: Object.keys(permissionData),
            datasets: [{
                label: 'Atendentes',
                data: Object.values(permissionData),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40'
                ]
            }]
        });
    }

    // Gerar insights baseados nos dados
    const insights: string[] = [];

    if (validAttendantData && validAttendantData.length > 0) {
        insights.push(`A instituição conta com ${validAttendantData.length} atendentes especializados.`);
    }

    if (validAttendanceData && validAttendanceData.length > 0) {
        const totalAttendances = validAttendanceData.length;
        const uniqueCandidates = new Set(validAttendanceData.map((h: any) => h.CANDIDATO_NROINSCRICAO)).size;
        insights.push(`${totalAttendances} atendimentos realizados para ${uniqueCandidates} candidatos únicos.`);

        const statusData = validAttendanceData.reduce((acc: Record<string, number>, h: any) => {
            acc[h.STATUS] = (acc[h.STATUS] || 0) + 1;
            return acc;
        }, {});

        const mostCommonStatus = Object.entries(statusData)
            .sort(([, a], [, b]) => b - a)[0];

        if (mostCommonStatus) {
            insights.push(`O status mais comum entre os candidatos é "${mostCommonStatus[0]}" (${mostCommonStatus[1]} casos).`);
        }
    }

    // Recomendações
    const recommendations: string[] = [];

    if (validAttendanceData && validAttendanceData.length > 0) {
        const areaData = validAttendanceData.reduce((acc: Record<string, number>, h: any) => {
            if (h.AREA_INTERESSES) {
                acc[h.AREA_INTERESSES] = (acc[h.AREA_INTERESSES] || 0) + 1;
            }
            return acc;
        }, {});

        const topArea = Object.entries(areaData)
            .sort(([, a], [, b]) => b - a)[0];

        if (topArea) {
            recommendations.push(`Considerar expansão de oferta na área "${topArea[0]}" devido à alta demanda (${topArea[1]} atendimentos).`);
        }

        const uniqueProcesses = new Set(validAttendanceData.map((h: any) => h.PROCESSO)).size;
        if (uniqueProcesses > 3) {
            recommendations.push('Diversificar processos seletivos pode otimizar a distribuição de candidatos por área.');
        }
    }

    return {
        title: 'Dashboard Institucional - Visão Geral',
        metrics: allKPIs,
        charts,
        insights,
        recommendations
    };
}

/**
 * Formata dados do dashboard como texto estruturado
 */
export function formatDashboardAsText(dashboard: DashboardData): string {
    let output = `# ${dashboard.title}\n\n`;

    // Métricas principais
    output += '## 📊 Métricas Principais\n\n';
    const categories = [...new Set(dashboard.metrics.map(m => m.category))];

    categories.forEach(category => {
        output += `### ${category}\n`;
        const categoryMetrics = dashboard.metrics.filter(m => m.category === category);
        categoryMetrics.forEach(metric => {
            output += `- **${metric.name}**: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}\n`;
            output += `  ${metric.description}\n`;
        });
        output += '\n';
    });

    // Insights
    if (dashboard.insights.length > 0) {
        output += '## 💡 Insights\n\n';
        dashboard.insights.forEach(insight => {
            output += `- ${insight}\n`;
        });
        output += '\n';
    }

    // Recomendações
    if (dashboard.recommendations.length > 0) {
        output += '## 🎯 Recomendações\n\n';
        dashboard.recommendations.forEach(rec => {
            output += `- ${rec}\n`;
        });
        output += '\n';
    }

    // Dados para gráficos (formato estruturado)
    if (dashboard.charts.length > 0) {
        output += '## 📈 Dados para Visualização\n\n';
        dashboard.charts.forEach((chart, index) => {
            output += `### Gráfico ${index + 1}: ${chart.title}\n`;
            output += `- **Tipo**: ${chart.type}\n`;
            output += `- **Labels**: ${chart.labels.join(', ')}\n`;
            output += `- **Dados**: ${chart.datasets[0].data.join(', ')}\n\n`;
        });
    }

    return output;
}
