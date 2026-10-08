export interface LegalProcess {
  id: string;
  numero_processo: string;
  tribunal: string;
  assunto: string;
  polo_passivo: string;
  polo_ativo: string;
  valor_causa: number;
  status: string;
  nivel_risco: string;
}

export interface LegalPillarSummary {
  total_processos: number;
  tribunal_predominante: string;
  polo_passivo_porcentagem: number;
  valor_total_contingencia: number;
  principais_processos: LegalProcess[];
}

export interface PersonRelationship {
  nome: string;
  doc: string;
  vinculo: string;
  risco_associado: string;
}

export interface PersonPillarSummary {
  target_nome: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  naturalidade: string;
  empresas_associadas_count: number;
  holdings_patrimoniais: string[];
  vinculos_familiares_empresariais: PersonRelationship[];
  alerta_pep: boolean;
}

export interface QsaMember {
  nome: string;
  qualificacao: string;
  participacao_pct: number;
  pais_origem: string;
}

export interface CompanyData {
  cnpj: string;
  razos_social: string;
  nome_fantasia: string;
  capital_social: number;
  situacao_cadastral: string;
  data_abertura: string;
  qsa: QsaMember[];
  nivel_risco_operacional: string;
}

export interface CompanyPillarSummary {
  total_empresas_mapeadas: number;
  empresas_ativas: number;
  empresas_inaptas_ou_baixadas: number;
  capital_social_acumulado: number;
  lista_empresas: CompanyData[];
}

export interface ExtractedContent {
  url: string;
  title: string;
  content: string;
  markdown: string;
  metadata: {
    author?: string;
    published_date?: string;
    description?: string;
    language?: string;
    word_count: number;
  };
  provider: string;
  hash_sha256: string;
}

export interface IngestPipelineResult {
  legal_pillar: LegalPillarSummary;
  person_pillar: PersonPillarSummary;
  company_pillar: CompanyPillarSummary;
  web_sources?: ExtractedContent[];
}

export interface GraphNode {
  id: string;
  label: string;
  node_type: 'person' | 'company' | 'legal_case' | 'asset';
  sub_label: string;
  risk_score: number;
  is_target: boolean;
  details: Record<string, string>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
  verified: boolean;
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_entities: number;
  total_connections: number;
  hidden_nexus_count: number;
}

export interface InvestigationHypothesis {
  id: string;
  titulo: string;
  descricao: string;
  nivel_severidade: 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO';
  confianca_percentual: number;
  nos_relacionados: string[];
  recomendacao_due_diligence: string;
}

export interface ResearcherAnalysis {
  agente_modelo: string;
  resumo_investigativo: string;
  acoes_recomendadas: string[];
  hipoteses_geradas: InvestigationHypothesis[];
}

export interface VerifiedEvidenceItem {
  id: string;
  fonte: string;
  item: string;
  status_validacao: string;
  score_confianca: number;
  data_checagem: string;
  hash_sha256?: string;
  url_fonte?: string;
}

export interface VerificationReport {
  total_evidencias_auditadas: number;
  evidencias_confirmadas: number;
  alertas_inconsistencia: number;
  score_global_confiabilidade: number;
  lgpd_compliance_status: string;
  lgpd_fundamento_legal?: string;
  hash_dossie_global?: string;
  evidencias: VerifiedEvidenceItem[];
}

export interface TimelineEvent {
  ano_data: string;
  evento: string;
  categoria: string;
  impacto_risco: string;
}

export interface InvestigationDossier {
  id: string;
  data_geracao: string;
  alvo_investigacao: string;
  documento_alvo: string;
  nivel_risco_global: string;
  score_risco_numerico: number;
  resumo_executivo: string;
  ingest_data: IngestPipelineResult;
  graph: RelationshipGraph;
  researcher_analysis: ResearcherAnalysis;
  verification_report: VerificationReport;
  linha_do_tempo: TimelineEvent[];
}

export interface AcpProviderInfo {
  id: 'kilo' | 'opencode';
  display_name: string;
  installed: boolean;
  version?: string;
  binary_path?: string;
  models: string[];
  model_count: number;
  default_model?: string;
  error?: string;
}

export type PrimaryAiProvider = 'nvidia' | 'kilo' | 'opencode';

export interface ProviderSettings {
  primaryAiProvider: PrimaryAiProvider;
  nvidiaApiKey: string;
  nvidiaPlannerModel: string;
  nvidiaExecutorModel: string;
  kiloModel: string;
  openCodeModel: string;
  tavilyApiKey: string;
  serpApiKey: string;
  perplexityApiKey: string;
  exaApiKey: string;
  searchMode: 'local' | 'web' | 'hybrid';
}

export interface EnvStatus {
  has_nvidia_env: boolean;
  has_tavily_env: boolean;
  has_serp_env: boolean;
  has_perplexity_env: boolean;
  has_exa_env: boolean;
}

export type HarnessActivityKind =
  | 'run'
  | 'plan'
  | 'model'
  | 'tool'
  | 'observation'
  | 'evidence'
  | 'result'
  | 'error'
  | 'status';

export type HarnessActivityStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface HarnessActivity {
  id: string;
  run_id: string;
  source: 'investigation' | 'chat' | 'acp' | 'system';
  kind: HarnessActivityKind;
  status: HarnessActivityStatus;
  title: string;
  detail?: string;
  tool_name?: string;
  step?: number;
  total?: number;
  timestamp: string;
  elapsed_ms?: number;
}

