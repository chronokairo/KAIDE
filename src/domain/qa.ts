/**
 * Entidades e Tipos de Domínio para o Módulo de QA da Empresa Virtual ChronoKairo AI.
 * Arquitetura Hexagonal: Domínio Puro (sem dependências de frameworks ou React).
 */

export type PRStatus = 'open' | 'reviewing' | 'approved' | 'changes_requested' | 'merged';

export interface PullRequest {
  id: string;
  title: string;
  branch: string;
  baseBranch: string;
  author: string;
  changesSummary: string;
  filesChanged: string[];
  stage: string;
  status: PRStatus;
  createdAt: string;
}

export type ReviewVerdict = 'PASS' | 'FAIL' | 'WARNING';

export interface AdversarialCheckItem {
  name: string;
  verdict: ReviewVerdict;
  detail: string;
  evidence: string;
}

export interface AdversarialDimensionReview {
  dimension: 'unit_tests' | 'integration_tests' | 'security' | 'tenant_rbac';
  title: string;
  verdict: ReviewVerdict;
  score: number; // 0 a 100
  checks: AdversarialCheckItem[];
  evidence: string[];
}

export interface PullRequestReviewReport {
  prId: string;
  prTitle: string;
  reviewedBy: 'qa';
  reviewedAt: string;
  overallVerdict: 'PASS' | 'FAIL';
  overallScore: number;
  adversarialDimensions: AdversarialDimensionReview[];
  blockers: string[];
  recommendations: string[];
  canMerge: boolean;
}

export interface QaReviewJobResult {
  jobId: string;
  stage: 'qa';
  prsScannedCount: number;
  reports: PullRequestReviewReport[];
  overallSummary: string;
  createdAt: string;
}
