import { LegalCase, LegalContract, LegalAuditReport, ContractComplianceReport } from '@/domain/legal';

/**
 * Porta Secundária (Driven Port) do Repositório Jurídico.
 *
 * Somente leitura: o módulo jurídico nunca grava em `legal_cases` nem em
 * `contracts`. A revisão contratual e a auditoria de caso produzem relatórios,
 * e a decisão sobre minuta ou contestação é sempre do Diretor Jurídico.
 */
export interface LegalRepositoryPort {
  listCases(): Promise<LegalCase[]>;
  listContracts(): Promise<LegalContract[]>;
  saveAuditReport?(report: LegalAuditReport): Promise<void>;
  saveContractComplianceReport?(report: ContractComplianceReport): Promise<void>;
}