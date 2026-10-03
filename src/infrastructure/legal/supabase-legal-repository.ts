import { LegalRepositoryPort } from '@/application/ports/legal-repository-port';
import {
  LegalCase,
  LegalContract,
  LegalCaseKind,
  LegalCaseStatus,
  LegalAuditReport,
  ContractComplianceReport,
  LegalPartyReference,
  LegalWitnessReference,
  LegalContractNotes,
} from '@/domain/legal';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

/**
 * Adapta os campos JSONB do B.O. (`reporting_party`, `involved_parties`,
 * `witnesses`) para o domínio. O banco pode devolver objeto, array ou string,
 * dependendo de como o documento foi importado.
 */
function toParty(value: unknown): LegalPartyReference | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value ? { name: value } : undefined;
  if (Array.isArray(value)) return value[0] ? toParty(value[0]) : undefined;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (!obj.name) return undefined;
    const roles = obj.role_in_document;
    return {
      name: String(obj.name),
      document: obj.document ? String(obj.document) : undefined,
      roleInDocument: Array.isArray(roles) ? roles.map((r) => String(r)) : undefined,
    };
  }
  return undefined;
}

function toParties(value: unknown): LegalPartyReference[] | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value : [value];
  const parsed = raw.map(toParty).filter((p): p is LegalPartyReference => Boolean(p));
  return parsed.length > 0 ? parsed : undefined;
}

function toWitnesses(value: unknown): LegalWitnessReference[] | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value : [value];
  const parsed = raw
    .map((item) => toParty(item))
    .filter((p): p is LegalWitnessReference => Boolean(p));
  return parsed.length > 0 ? parsed : undefined;
}

/**
 * `contracts.notes` guarda JSON como texto nas minutas. Parse defensivo:
 * nunca lança, apenas devolve `undefined` quando o conteúdo não é JSON.
 */
function parseNotes(notes: unknown): LegalContractNotes | undefined {
  if (!notes) return undefined;
  if (typeof notes === 'object') return notes as LegalContractNotes;
  if (typeof notes !== 'string') return undefined;
  try {
    const parsed = JSON.parse(notes);
    return typeof parsed === 'object' && parsed !== null ? (parsed as LegalContractNotes) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Adaptador Secundário Real do Supabase para o Repositório Jurídico.
 *
 * Conectado ao Supabase de Produção (chronokairo-prod / your-project-ref).
 * Consome `legal_cases` e `contracts`. Somente leitura: nenhum relatório
 * jurídico altera o estado de um caso ou de uma minuta contratual.
 */
export class SupabaseLegalRepository implements LegalRepositoryPort {
  async listCases(): Promise<LegalCase[]> {
    const { data, error } = await supabaseAdmin
      .from('legal_cases')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('case_number', { ascending: true });

    if (error || !data) {
      console.warn('[SupabaseLegalRepository] Falha ao listar casos jurídicos:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      caseNumber: row.case_number,
      kind: (row.kind || 'Other') as LegalCaseKind,
      authority: row.authority || undefined,
      relatedParty: row.related_party || undefined,
      position: row.position || undefined,
      responsible: row.responsible || undefined,
      status: (row.status || 'Open') as LegalCaseStatus,
      claimAmountBrl: row.claim_amount ? Number(row.claim_amount) : undefined,
      nextDeadline: row.next_deadline || undefined,
      summary: row.summary || undefined,
      source: row.source || undefined,
      narrative: row.narrative || undefined,
      occurredLocation: row.occurrence_location || undefined,
      natureCode: row.nature_code || undefined,
      natureDescription: row.nature_description || undefined,
      reportingParty: toParty(row.reporting_party),
      involvedParties: toParties(row.involved_parties),
      witnesses: toWitnesses(row.witnesses),
      sourceFilename: row.source_filename || undefined,
      sourceDocumentNumber: row.source_document_number || undefined,
      firstRecordedAt: row.first_recorded_at || undefined,
      registrationStartedAt: row.registration_started_at || undefined,
      registrationFinishedAt: row.registration_finished_at || undefined,
      occurrenceStartedAt: row.occurrence_started_at || undefined,
    }));
  }

  async listContracts(): Promise<LegalContract[]> {
    const { data, error } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('contract_number', { ascending: true });

    if (error || !data) {
      console.warn('[SupabaseLegalRepository] Falha ao listar contratos:', error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      contractNumber: row.contract_number,
      title: row.title || '',
      status: row.status || 'Draft',
      totalValueBrl: Number(row.total_value || 0),
      customerId: row.customer_id || undefined,
      startDate: row.start_date || undefined,
      endDate: row.end_date || undefined,
      notes: row.notes || undefined,
      structuredNotes: parseNotes(row.notes),
    }));
  }

  async saveAuditReport(report: LegalAuditReport): Promise<void> {
    await supabaseAdmin.from('audit_logs').insert({
      organization_id: PROD_ORGANIZATION_ID,
      action: 'LEGAL_CASE_AUDITED',
      target: `legal_cases/${report.caseNumber}`,
      success: true,
      details: {
        verdict: report.verdict,
        confidenceScore: report.confidenceScore,
        evidenceCount: report.evidence.length,
        evidenceGaps: report.evidenceGaps,
      },
      created_at: new Date().toISOString(),
    });
  }

  async saveContractComplianceReport(report: ContractComplianceReport): Promise<void> {
    await supabaseAdmin.from('audit_logs').insert({
      organization_id: PROD_ORGANIZATION_ID,
      action: 'LEGAL_CONTRACT_REVIEWED',
      target: `contracts/${report.contractNumber}`,
      success: report.verdict !== 'bloqueado',
      details: {
        verdict: report.verdict,
        score: report.score,
        missingClauses: report.missingClauses,
        blockingIssues: report.blockingIssues,
      },
      created_at: new Date().toISOString(),
    });
  }
}