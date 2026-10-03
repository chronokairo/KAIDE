import { LegalCase, LegalContract, LegalAuditReport, ContractComplianceReport } from '@/domain/legal';

/**
 * Driven port for the Legal & Due Diligence Repository.
 *
 * Strictly read-only for production legal records: the AI Analyst never mutates
 * `legal_cases` or `contracts`. Case audits and contract reviews generate factual
 * evidence reports for the Human Legal Director's formal decision.
 */
export interface LegalRepositoryPort {
  listCases(): Promise<LegalCase[]>;
  listContracts(): Promise<LegalContract[]>;
  saveAuditReport?(report: LegalAuditReport): Promise<void>;
  saveContractComplianceReport?(report: ContractComplianceReport): Promise<void>;
}