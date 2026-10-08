export interface AiMetric {
  id: string;
  organization_id: string;
  session_id: string;
  metric_name: string;
  value: number;
  recorded_at: string;
}
