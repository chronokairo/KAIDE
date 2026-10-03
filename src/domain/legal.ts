/**
 * Entidades e tipos de domínio do Módulo Jurídico e Due Diligence (AI Analista).
 *
 * Mapeiam, em forma pura, as tabelas reais do Supabase de produção:
 * legal_cases e contracts.
 *
 * O módulo existe para instruir a defesa técnica da ChronoKairo em casos de
 * apropriação indébita de propriedade intelectual, reunindo evidências
 * verificáveis (commits, contratos, NFS-e, logs). O agente não redige peça
 * jurídica nem comunicação externa — produz apenas relatório técnico para
 * revisão do Diretor Jurídico (AI → AI → AI → HUMAN, ADR-0028).
 *
 * Arquitetura Hexagonal: Domínio Puro (sem Supabase, Next, React ou SDKs).
 */

/**
 * Contrato comercial read-only para o módulo jurídico.
 *
 * Deliberadamente declarado aqui (e não importado de `@/domain/finance`) para
 * manter o módulo jurídico autocontido e independente do módulo de
 * controladoria: os dois leem `contracts`, mas cada um projeta apenas o que
 * precisa, e o jurídico não deve acoplar em relatório financeiro.
 */
export interface LegalContract {
  id: string;
  contractNumber: string;
  title: string;
  status: string;
  totalValueBrl: number;
  customerId?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  /** `notes` já parseado, quando o registro traz JSON estruturado. */
  structuredNotes?: LegalContractNotes;
}

export interface LegalCaseKindMap {
  PoliceReport: 'B.O. / Polícia Civil';
  CivilLawsuit: 'Ação Civil';
  LaborClaim: 'Reclamação Trabalhista';
  TaxAudit: 'Auditoria Fiscal';
  Other: 'Outro';
}

/**
 * Pessoa citada em documento oficial. No banco esses campos são JSONB
 * (`reporting_party`, `involved_parties`, `witnesses`), por isso o domínio
 * tipa a estrutura em vez de assumir texto livre.
 */
export interface LegalPartyReference {
  name: string;
  document?: string;
  roleInDocument?: string[];
}

export interface LegalWitnessReference {
  name: string;
  document?: string;
  roleInDocument?: string[];
}

export type LegalCaseKind = 'PoliceReport' | 'CivilLawsuit' | 'LaborClaim' | 'TaxAudit' | 'Other';

export type LegalCaseStatus = 'Open' | 'UnderReview' | 'Closed' | 'Archived';

export interface LegalCase {
  id: string;
  caseNumber: string;
  kind: LegalCaseKind;
  authority?: string;
  relatedParty?: string;
  position?: string;
  responsible?: string;
  status: LegalCaseStatus;
  claimAmountBrl?: number;
  nextDeadline?: string;
  summary?: string;
  source?: string;
  narrative?: string;
  occurredLocation?: string;
  natureCode?: string;
  natureDescription?: string;
  reportingParty?: LegalPartyReference;
  involvedParties?: LegalPartyReference[];
  witnesses?: LegalWitnessReference[];
  sourceFilename?: string;
  sourceDocumentNumber?: string;
  firstRecordedAt?: string;
  registrationStartedAt?: string;
  registrationFinishedAt?: string;
  occurrenceStartedAt?: string;
}

/**
 * bloco estruturado encontrado em `contracts.notes` (JSON serializado como
 * texto nas minutas em rascunho). É a fonte primária dos desvios de
 * conformidade da revisão contratual.
 */
export interface LegalContractNotes {
  signatureStatus?: string;
  contractor?: {
    tradeName?: string;
    legalName?: string;
    documentNumber?: string;
    address?: string;
    representatives?: string[];
  };
  customer?: {
    name?: string;
    tradeName?: string;
    documentNumber?: string | null;
    address?: string | null;
  };
  scope?: string;
  optionalMonthlyMaintenance?: number | null;
  schedule?: unknown[];
  reviewFlags?: string[];
}

/** Evidência técnica juntada ao caso. Sempre referencia uma fonte local rastreável. */
export type LegalEvidenceKind =
  | 'commit'
  | 'relatorio_entrega'
  | 'contrato'
  | 'nota_fiscal'
  | 'log_api'
  | 'nota_tecnica'
  | 'depoimento';

export interface LegalEvidenceItem {
  id: string;
  kind: LegalEvidenceKind;
  description: string;
  source: string;
  author?: string;
  timestamp?: string;
  /** Indica se a evidência sustenta a defesa da ChronoKairo neste caso. */
  supportsDefense: boolean;
}

export type LegalAuditVerdict = 'defensavel' | 'risco_alto' | 'risco_critico';

export interface LegalTechnicalFinding {
  dimension: 'autoria_software' | 'escopo_contratual' | 'faturamento' | 'prova_probatoria' | 'prazo';
  title: string;
  status: 'confirmado' | 'parcial' | 'ausente' | 'contraditorio';
  detail: string;
  evidenceIds: string[];
}

export interface LegalAuditReport {
  caseId: string;
  caseNumber: string;
  reviewedBy: 'analyst';
  reviewedAt: string;
  accusationSummary: string;
  defenseThesis: string;
  evidence: LegalEvidenceItem[];
  findings: LegalTechnicalFinding[];
  /** Lacunas probatórias que o jurídico precisa preencher antes de contestar. */
  evidenceGaps: string[];
  verdict: LegalAuditVerdict;
  confidenceScore: number;
  recommendations: string[];
}

export type ContractReviewVerdict = 'conformidade_pendente' | 'apto_para_assinatura' | 'bloqueado';

export interface ContractClauseCheck {
  clause: string;
  status: 'presente' | 'parcial' | 'ausente';
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  detail: string;
  recommendation: string;
}

export interface ContractComplianceReport {
  contractId: string;
  contractNumber: string;
  title: string;
  contractStatus: string;
  totalValueBrl: number;
  customerId?: string;
  reviewedAt: string;
  checks: ContractClauseCheck[];
  missingClauses: string[];
  blockingIssues: string[];
  verdict: ContractReviewVerdict;
  score: number;
}

export interface LegalAuditJobResult {
  jobId: string;
  stage: 'analyst';
  requiresApproval: false;
  casesScannedCount: number;
  reports: LegalAuditReport[];
  overallSummary: string;
  createdAt: string;
}

export interface LegalContractReviewJobResult {
  jobId: string;
  stage: 'analyst';
  requiresApproval: false;
  contractsScannedCount: number;
  reports: ContractComplianceReport[];
  overallSummary: string;
  createdAt: string;
}