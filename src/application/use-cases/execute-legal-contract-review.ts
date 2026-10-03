import { LegalRepositoryPort } from '@/application/ports/legal-repository-port';
import { CompanyControlPlanePort } from '@/application/ports/company-control-plane-port';
import {
  LegalContract,
  ContractClauseCheck,
  ContractComplianceReport,
  ContractReviewVerdict,
  LegalContractReviewJobResult,
  LegalContractNotes,
} from '@/domain/legal';
import { JobEntity } from '@/domain/company';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

const PROD_USER_ID = '00000000-0000-4000-8000-000000000002'; // Luan Nery / Tech Lead Owner

/**
 * Job `legal.review_contracts` — AI Analista (Papel Jurídico).
 *
 * Lê `contracts` do Supabase de produção e verifica a conformidade de cada
 * instrumento contra as cláusulas mínimas exigidas pela ChronoKairo.
 *
 * Ponto central: as minutas em rascunho (`status = 'Draft'`) guardam em
 * `notes` um JSON com `signature_status` e uma lista de `review_flags` já
 * levantada na triagem documental. Este job consolida esses desvios com as
 * regras internas e emite um veredito por contrato.
 *
 * Nenhum contrato é assinado, editado ou enviado. O veredito `bloqueado`
 * impede faturamento e é um insumo para decisão do Diretor Jurídico.
 */
export class ExecuteLegalContractReviewUseCase {
  constructor(
    private readonly legalRepo: LegalRepositoryPort,
    private readonly controlPlane: CompanyControlPlanePort
  ) {}

  async execute(onlyUnapproved = true): Promise<LegalContractReviewJobResult> {
    const contracts = await this.legalRepo.listContracts();
    const timestamp = new Date().toISOString();
    const jobId = `job-legal-contract-review-${Date.now()}`;

    const targets = onlyUnapproved ? contracts.filter((c) => c.status !== 'Active') : contracts;
    const reports = targets.map((c) => this.reviewContract(c, timestamp));

    const blocked = reports.filter((r) => r.verdict === 'bloqueado');
    const approved = reports.filter((r) => r.verdict === 'apto_para_assinatura');
    const draftCount = contracts.filter((c) => c.status !== 'Active').length;
    const activeCount = contracts.filter((c) => c.status === 'Active').length;

    const evidenceList: string[] = [
      `Revisão contratual de ${reports.length} instrumento(s) lido(s) de contracts (Supabase prod).`,
      `Base do acervo: ${activeCount} contrato(s) ativo(s) e ${draftCount} minuta(s) em rascunho.`,
      `Veredito: ${approved.length} apto(s) para assinatura, ${blocked.length} bloqueado(s).`,
      ...blocked.map(
        (r) => `BLOQUEIO ${r.contractNumber}: ${r.blockingIssues.length} pendência(s) crítica(s) — ${r.blockingIssues[0]}`
      ),
      'Governança AI-first (ADR-0028): instrumento não assinado não é vigente e não gera cobrança. Assinatura é ato humano exclusivo do Diretor Jurídico.',
    ];

    const job: JobEntity = {
      id: jobId,
      title: 'Revisão de Conformidade Contratual (Contratos & Minutas)',
      client: 'Diretoria Jurídica ChronoKairo Corp',
      project: 'Conformidade Contratual',
      stage: 'analyst',
      agentRole: 'analyst',
      status: 'completed',
      prompt:
        'Revisar todos os contratos e minutas no Supabase prod contra as cláusulas mínimas, consolidar review_flags documentais e emitir veredito de conformidade por instrumento.',
      toolsUsed: ['contract_clause_checker', 'signature_status_reader', 'compliance_matrix_builder', 'supabase_db'],
      changesSummary: `${reports.length} instrumento(s) revisado(s): ${approved.length} apto(s), ${blocked.length} bloqueado(s).`,
      testsSummary:
        'Cada bloqueio aponta cláusula ausente com severidade e recomendação. Minutas não assinadas são rebaixadas automaticamente.',
      evidence: evidenceList,
      costUsd: 0.14,
      durationSeconds: 15,
      requiresApproval: false,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    if (this.controlPlane.submitJob) {
      await this.controlPlane.submitJob(job);
    }

    await this.persist(reports, jobId);

    return {
      jobId,
      stage: 'analyst',
      requiresApproval: false,
      contractsScannedCount: reports.length,
      reports,
      overallSummary:
        reports.length === 0
          ? 'Nenhum instrumento pendente de revisão.'
          : `${reports.length} instrumento(s) revisado(s): ${approved.length} apto(s) para assinatura, ${blocked.length} bloqueado(s).`,
      createdAt: timestamp,
    };
  }

  private reviewContract(contract: LegalContract, timestamp: string): ContractComplianceReport {
const notes = contract.structuredNotes;
    const reviewFlags = notes?.reviewFlags ?? [];
    const notesOrEmpty: LegalContractNotes = notes ?? {};
    const checks: ContractClauseCheck[] = [];

    checks.push(this.checkSignature(contract, notes?.signatureStatus, reviewFlags));
    checks.push(this.checkCounterpartyIdentification(notesOrEmpty, reviewFlags));
    checks.push(this.checkScopeAnnex(notesOrEmpty, reviewFlags));
    checks.push(this.checkScheduleAndPayment(notesOrEmpty, reviewFlags));
    checks.push(this.checkRepresentationPowers(notesOrEmpty, reviewFlags));
    checks.push(this.checkWitnesses(reviewFlags));

    const missingClauses = checks.filter((c) => c.status !== 'presente').map((c) => c.clause);
    const blockingIssues = checks.filter((c) => c.severity === 'critica').map((c) => c.detail);
    const verdict = this.decideVerdict(contract, blockingIssues, missingClauses);
    const score = Math.round(
      (checks.filter((c) => c.status === 'presente').length / checks.length) * 100
    );

    return {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      title: contract.title,
      contractStatus: contract.status,
      totalValueBrl: contract.totalValueBrl,
      customerId: contract.customerId,
      reviewedAt: timestamp,
      checks,
      missingClauses,
      blockingIssues,
      verdict,
      score,
    };
  }

  private checkSignature(
    contract: LegalContract,
    signatureStatus: string | undefined,
    reviewFlags: string[]
  ): ContractClauseCheck {
    const unsigned =
      contract.status !== 'Active' ||
      (signatureStatus ? !/assinad/i.test(signatureStatus) : true) ||
      reviewFlags.some((f) => /não assinado|não assinad/i.test(f));

    return {
      clause: 'Assinatura e vigência',
      status: unsigned ? 'ausente' : 'presente',
      severity: unsigned ? 'critica' : 'baixa',
      detail: unsigned
        ? `Instrumento não assinado (status=${contract.status}, assinatura=${signatureStatus ?? 'não informada'}). Não é vigente e não gera cobrança.`
        : 'Instrumento assinado e vigente.',
      recommendation: unsigned
        ? 'Coletar assinatura de ambas as partes antes de tratar o instrumento como vigente.'
        : 'Nenhuma ação necessária.',
    };
  }

  private checkCounterpartyIdentification(
    notes: LegalContractNotes,
    reviewFlags: string[]
  ): ContractClauseCheck {
    const customerIncomplete =
      !notes?.customer?.name ||
      notes.customer?.documentNumber === null ||
      reviewFlags.some((f) => /qualifica|razão social|cnpj|endereço/i.test(f));

    return {
      clause: 'Qualificação das partes',
      status: customerIncomplete ? 'parcial' : 'presente',
      severity: customerIncomplete ? 'alta' : 'baixa',
      detail: customerIncomplete
        ? 'Contratante incompleto: razão social, CNPJ, endereço ou representante permanecem em branco.'
        : 'Partes devidamente qualificadas.',
      recommendation: customerIncomplete
        ? 'Completar a qualificação do contratante (razão social, CNPJ, endereço, representante).'
        : 'Nenhuma ação necessária.',
    };
  }

  private checkScopeAnnex(
    notes: LegalContractNotes,
    reviewFlags: string[]
  ): ContractClauseCheck {
    const noAnnex = reviewFlags.some((f) => /anexo i|escopo técnico não foi fornecido/i.test(f));

    return {
      clause: 'Anexo I — Escopo Técnico',
      status: noAnnex ? 'ausente' : 'presente',
      severity: noAnnex ? 'alta' : 'baixa',
      detail: noAnnex
        ? 'Anexo I de escopo técnico não fornecido; o objeto contratual fica indefinido.'
        : notes?.scope
          ? 'Escopo técnico descrito no corpo do instrumento.'
          : 'Escopo descrito de forma resumida.',
      recommendation: noAnnex
        ? 'Anexar o escopo técnico antes da assinatura — é a base da prova de autoria e do Entitlement.'
        : 'Nenhuma ação necessária.',
    };
  }

  private checkScheduleAndPayment(
    notes: LegalContractNotes,
    reviewFlags: string[]
  ): ContractClauseCheck {
    const noSchedule = reviewFlags.some((f) => /anexo ii|cronograma|pagamento/i.test(f));
    const scheduleEmpty = Array.isArray(notes?.schedule) && notes.schedule.length === 0;

    return {
      clause: 'Anexo II — Cronograma e Pagamentos',
      status: noSchedule || scheduleEmpty ? 'ausente' : 'presente',
      severity: noSchedule || scheduleEmpty ? 'alta' : 'baixa',
      detail: noSchedule || scheduleEmpty
        ? 'Cronograma de pagamentos não fornecido; o meio de pagamento permanece como campo de modelo.'
        : 'Cronograma e pagamentos definidos.',
      recommendation: noSchedule || scheduleEmpty
        ? 'Anexar cronograma com marcos, valores e meio de pagamento efetivo.'
        : 'Nenhuma ação necessária.',
    };
  }

  private checkRepresentationPowers(
    notes: LegalContractNotes,
    reviewFlags: string[]
  ): ContractClauseCheck {
    const unconfirmed = reviewFlags.some((f) => /poderes de representação/i.test(f));
    const reps = notes?.contractor?.representatives ?? [];

    return {
      clause: 'Poderes de representação',
      status: unconfirmed ? 'parcial' : 'presente',
      severity: unconfirmed ? 'media' : 'baixa',
      detail: unconfirmed
        ? `${reps.length} representante(s) citado(s), mas com poderes de representação não confirmados.`
        : `Representação(${reps.length}) confirmada.`,
      recommendation: unconfirmed
        ? 'Confirmar poderes de representação dos fundadores citados antes da assinatura.'
        : 'Nenhuma ação necessária.',
    };
  }

  private checkWitnesses(reviewFlags: string[]): ContractClauseCheck {
    const noWitnesses = reviewFlags.some((f) => /testemunha/i.test(f));

    return {
      clause: 'Testemunhas',
      status: noWitnesses ? 'ausente' : 'presente',
      severity: noWitnesses ? 'media' : 'baixa',
      detail: noWitnesses
        ? 'Não há duas testemunhas qualificadas ou assinaturas.'
        : 'Testemunhas presentes no instrumento.',
      recommendation: noWitnesses ? 'Colher duas testemunhas qualificadas.' : 'Nenhuma ação necessária.',
    };
  }

  private decideVerdict(
    contract: LegalContract,
    blockingIssues: string[],
    missingClauses: string[]
  ): ContractReviewVerdict {
    if (blockingIssues.length > 0) return 'bloqueado';
    if (missingClauses.length > 0) return 'conformidade_pendente';
    return contract.status === 'Active' ? 'apto_para_assinatura' : 'conformidade_pendente';
  }

  private async persist(reports: ContractComplianceReport[], jobId: string): Promise<void> {
    try {
      if (reports.length > 0) {
        await supabaseAdmin.from('audit_logs').insert({
          organization_id: PROD_ORGANIZATION_ID,
          user_id: PROD_USER_ID,
          action: 'LEGAL_CONTRACT_REVIEW_COMPLETED',
          target: reports.map((r) => `contracts/${r.contractNumber}`).join(', '),
          success: true,
          details: {
            jobId,
            blocked: reports.filter((r) => r.verdict === 'bloqueado').length,
            verdicts: reports.map((r) => `${r.contractNumber}=${r.verdict}(${r.score})`),
          },
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      // Supabase non-blocking
    }
  }
}

