export const biMetricsRepository = {
  findMany: async () => [
    { metric: 'MRR', value: 124500.0, changePercent: 8.5, period: 'Agosto 2026' },
    { metric: 'ARR', value: 1494000.0, changePercent: 12.1, period: '2026' },
    { metric: 'CAC', value: 1450.0, changePercent: -4.2, period: 'Agosto 2026' },
    { metric: 'LTV', value: 18200.0, changePercent: 6.8, period: 'Agosto 2026' },
    { metric: 'LTV/CAC', value: 12.55, changePercent: 11.0, period: 'Agosto 2026' },
    { metric: 'Churn Rate', value: 0.8, changePercent: -0.3, period: 'Agosto 2026' },
  ],
  getFinancialSummary: async (_orgId?: string) => ({
    total_balance: 960900.0,
    outstanding_receivables: 89500.0,
    outstanding_payables: 35700.0,
    received_revenue: 342500.0,
    known_total_revenue: 432000.0,
  }),
  getCrmPipeline: async (_orgId?: string) => ({
    total_opportunities: 6,
    total_open_pipeline_value: 193000.0,
    weighted_pipeline_value: 142000.0,
    total_won_value: 120000.0,
    won_count: 3,
    lost_count: 1,
  }),
  getContractRevenue: async (_orgId?: string) => ({
    active_contracts_count: 5,
    total_contract_value: 720000.0,
    mrr: 60000.0,
    arr: 720000.0,
  }),
  getProjectUtilization: async (_orgId?: string) => ({
    active_projects_count: 4,
    total_duration_minutes: 9600,
    billable_duration_minutes: 8400,
    billable_utilization_rate: 87.5,
  }),
};
