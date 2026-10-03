/**
 * Pure domain entities and types for the Legal & Due Diligence Module
 * (AI Analyst / Legal Role).
 *
 * Directly mirrors the production schema from Supabase:
 * `legal_cases` and `contracts`.
 *
 * This module equips ChronoKairo with technical evidence audits (e.g. intellectual
 * property disputes, software authorship verification, contract compliance).
 * The AI Analyst does not draft legal court pleadings or contact authorities;
 * it strictly generates verified technical fact reports for review by the Legal Director
 * in adherence to ADR-0028 (AI -> AI -> AI -> HUMAN).
 *
 * Hexagonal Architecture: pure domain models with zero dependencies on database or SDKs.
 */

/**
 * Commercial contract projection for legal compliance reviews.
 * Kept autonomous in the legal domain to avoid tight coupling with the finance domain.
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
  structuredNotes?: LegalContractNotes;
}

export interface LegalCaseKindMap {
  PoliceReport: 'Police Report / Civil Police';
  CivilLawsuit: 'Civil Lawsuit';
  LaborClaim: 'Labor Claim';
  TaxAudit: 'Tax Audit';
  Other: 'Other';
}

/**
 * Party cited in official proceedings or police reports.
 * Structured from JSONB fields (`reporting_party`, `involved_parties`, `witnesses`).
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
 * Structured document metadata extracted from `contracts.notes` JSON.
 * Serves as the primary evidence source for draft contract compliance.
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

/** Technical evidence item cited in case reports. */
export type LegalEvidenceKind =
  | 'commit'
  | 'delivery_report'
  | 'contract'
  | 'invoice'
  | 'api_log'
  | 'technical_note'
  | 'witness_statement';

export interface LegalEvidenceItem {
  id: string;
  kind: LegalEvidenceKind;
  description: string;
  source: string;
  author?: string;
  timestamp?: string;
  /** Indicates whether the evidence substantiates the defense. */
  supportsDefense: boolean;
}

export type LegalAuditVerdict = 'defensible' | 'high_risk' | 'critical_risk';

export type FindingDimension =
  | 'software_authorship'
  | 'contract_scope'
  | 'billing_revenue'
  | 'probative_evidence'
  | 'statute_deadline';

export type FindingStatus = 'confirmed' | 'partial' | 'missing' | 'contradictory';

export interface LegalTechnicalFinding {
  dimension: FindingDimension;
  title: string;
  status: FindingStatus;
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
  evidenceGaps: string[];
  verdict: LegalAuditVerdict;
  confidenceScore: number;
  recommendations: string[];
}

export type ContractReviewVerdict = 'compliance_pending' | 'ready_for_signature' | 'blocked';

export interface ContractClauseCheck {
  clause: string;
  status: 'present' | 'partial' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
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