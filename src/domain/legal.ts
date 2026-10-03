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
  reportingParty?: string;
  involvedParties?: string;
  witnesses?: string;
  sourceFilename?: string;
  sourceDocumentNumber?: string;
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