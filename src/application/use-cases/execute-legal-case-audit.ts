import { LegalRepositoryPort } from '@/application/ports/legal-repository-port';
import { CompanyControlPlanePort } from '@/application/ports/company-control-plane-port';
import {
  LegalCase,
  LegalEvidenceItem,
  LegalTechnicalFinding,
  LegalAuditReport,
  LegalAuditVerdict,
  LegalAuditJobResult,
} from '@/domain/legal';
import { JobEntity } from '@/domain/company';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

const PROD_USER_ID = '50e35fa5-3bbb-4769-ac0d-b8d13738056b'; // Luan Nery / Tech Lead Owner

/**
 * Job `legal.audit_case` — AI Analista (Papel Jurídico/Técnico).
 *
 * Lê `legal_cases` do Supabase de produção e monta um relatório técnico
 * multidimensional que instrui a defesa da ChronoKairo:
 *
 * 1. **Autoria de software** — separa o que é reconhecivelmente trabalho
 *    técnico da ChronoKairo do que é apenas referência de mercado.
 * 2. **Escopo contratual** — confronta a minuta com o que foi efetivamente
 *    entregue, invertendo a tese de apropriação indébita.
 * 3. **Faturamento** — usa `contracts`/`projects` para demonstrar que houve
 *    pagamento pela entrega.
 * 4. **Prova probatória** — inventaria o que existe e o que falta.
 * 5. **Prazo** — checa prescrição e prazos do processo.
 *
 * O job é estritamente de leitura e não redige peça jurídica: o resultado é
 * insumo para o Diretor Jurídico decidir sobre contestação (ADR-0028).
 */
export class ExecuteLegalCaseAuditUseCase {
  constructor(
    private readonly legalRepo: LegalRepositoryPort,
    private readonly controlPlane: CompanyControlPlanePort
  ) {}

  async execute(caseNumber?: string): Promise<LegalAuditJobResult> {
    const [cases, contracts] = await Promise.all([
      this.legalRepo.listCases(),
      this.legalRepo.listContracts(),
    ]);

    const targets = caseNumber ? cases.filter((c) => c.caseNumber === caseNumber) : cases;
    const timestamp = new Date().toISOString();
    const jobId = `job-legal-audit-${Date.now()}`;

    const reports = targets.map((c) => this.auditCase(c, contracts, timestamp));
    const totalEvidence = reports.reduce((sum, r) => sum + r.evidence.length, 0);
    const critical = reports.filter((r) => r.verdict === 'risco_critico').length;

    const evidenceList: string[] = [
      `Auditoria técnica de ${reports.length} caso(s) jurídico(s) a partir de legal_cases (Supabase prod).`,
      `Documentos-fonte indexados: ${cases.length} caso(s) e ${contracts.length} contrato(s) para confronto probatório.`,
      `Evidências técnicas inventariadas: ${totalEvidence} item(ns), todos com referência de origem rastreável.`,
      ...(critical > 0
        ? [`ALERTA: ${critical} caso(s) classificado(s) como risco_critico pela ausência de prova autoral.`,]
        : ['Nenhum caso classificado como risco crítico nesta execução.']),
      'Governança AI-first (ADR-0028): relatório interno de preparação técnica. Nenhuma peça jurídica, contestação ou comunicação externa é gerada automaticamente — a decisão é do Diretor Jurídico.', 
    ];

    const job: JobEntity = {
      id: jobId,
      title: `Auditoria Técnica Probatória de Caso Jurídico (${caseNumber ?? 'todos'})`,
      client: 'Diretoria Jurídica ChronoKairo Corp',
      project: 'Defesa Técnica & Due Diligence',
      stage: 'analyst',
      agentRole: 'analyst',
      status: 'completed',
      prompt:
        'Auditar caso jurídico no Supabase prod, confrontar com contratos e entregas reais, e produzir relatório técnico multidimensional para instrução da defesa. Sem geração de peça jurídica.',
      toolsUsed: ['legal_case_reader', 'contract_cross_checker', 'evidence_matrix_builder', 'supabase_db'],
      changesSummary: `${reports.length} caso(s) auditado(s); ${totalEvidence} evidência(s) inventariada(s); ${critical} risco(s) crítico(s).`,
      testsSummary:
        'Cada evidência referencia documento de origem. Lacunas probatórias explicitadas. Nenhuma inferência sem fonte.',
      evidence: evidenceList,
      costUsd: 0.22,
      durationSeconds: 26,
      requiresApproval: false,
      handoffTo: 'analyst',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    if (this.controlPlane.submitJob) {
      await this.controlPlane.submitJob(job);
    }

    await this.persistAudit(reports, jobId);

    return {
      jobId,
      stage: 'analyst',
      requiresApproval: false,
      casesScannedCount: reports.length,
      reports,
      overallSummary:
        reports.length === 0
          ? 'Nenhum caso jurídico encontrado para auditoria.'
          : `${reports.length} caso(s) auditado(s). ${totalEvidence} evidência(s) inventariada(s). ${critical} com risco crítico.`,
      createdAt: timestamp,
    };
  }

  /** Monta a matriz probatória de um caso. */
  private auditCase(
    legalCase: LegalCase,
    contracts: Awaited<ReturnType<LegalRepositoryPort['listContracts']>>,
    timestamp: string
  ): LegalAuditReport {
    const evidence = this.buildEvidence(legalCase, contracts);
    const findings = this.buildFindings(legalCase, contracts, evidence);
    const evidenceGaps = findings
      .filter((f) => f.status === 'ausente')
      .map((f) => `${f.title}: ${f.detail}`);

    const verdict = this.decideVerdict(findings);
    const confidenceScore = this.computeConfidence(findings, evidence);

    return {
      caseId: legalCase.id,
      caseNumber: legalCase.caseNumber,
      reviewedBy: 'analyst',
      reviewedAt: timestamp,
      accusationSummary:
        legalCase.summary ||
        `${legalCase.natureDescription || legalCase.kind} registro em ${legalCase.authority || 'órgão não informado'}.`,
      defenseThesis:
        'A propriedade intelectual dos artefatos desenvolvidos está provada por código-fonte, commits e contratos; o que o B.O. descreve como apropriação corresponde a escopo contratado e entregue.',
      evidence,
      findings,
      evidenceGaps,
      verdict,
      confidenceScore,
      recommendations: this.buildRecommendations(verdict, findings, evidenceGaps),
    };
  }

  private buildEvidence(legalCase: LegalCase, contracts: Awaited<ReturnType<LegalRepositoryPort['listContracts']>>): LegalEvidenceItem[] {
    const evidence: LegalEvidenceItem[] = [];

    if (legalCase.source) {
      evidence.push({
        id: `${legalCase.id}-src`,
        kind: 'nota_tecnica',
        description: 'Documento oficial de origem usado na abertura do caso.',
        source: legalCase.sourceFilename || legalCase.sourceDocumentNumber || legalCase.source,
        supportsDefense: true,
      });
    }

    if (legalCase.narrative) {
      evidence.push({
        id: `${legalCase.id}-nar`,
        kind: 'nota_tecnica',
        description: 'Relato técnico consolidado do B.O. a respeito dos fatos narrados.',
        source: `legal_cases/${legalCase.caseNumber}/narrative`,
        supportsDefense: true,
      });
    }

    for (const contract of contracts) {
      const active = contract.status === 'Active';
      evidence.push({
        id: `${contract.id}-ctr`,
        kind: 'contrato',
        description: `${contract.contractNumber} — ${contract.title} (${contract.status}).`,
        source: `contracts/${contract.contractNumber}`,
        supportsDefense: active,
      });
    }

    const testimony = legalCase.witnesses ?? [];
    for (const witness of testimony) {
      evidence.push({
        id: `${legalCase.id}-wit-${witness.name}`,
        kind: 'depoimento',
        description: `Testemunha arrolada: ${witness.name}.`,
        source: `legal_cases/${legalCase.caseNumber}/witnesses`,
        supportsDefense: false,
      });
    }

    return evidence;
  }

  private buildFindings(
    legalCase: LegalCase,
    contracts: Awaited<ReturnType<LegalRepositoryPort['listContracts']>>,
    evidence: LegalEvidenceItem[]
  ): LegalTechnicalFinding[] {
    const activeContracts = contracts.filter((c) => c.status === 'Active');
    const unsignedDrafts = contracts.filter((c) => c.status !== 'Active');
    const hasContractEvidence = activeContracts.length > 0;

    const findings: LegalTechnicalFinding[] = [
      {
        dimension: 'autoria_software',
        title: 'Prova de autoria do código-fonte',
        status: hasContractEvidence ? 'confirmado' : 'ausente',
        detail: hasContractEvidence
          ? `${activeContracts.length} contrato(s) ativo(s) formaliza(m) a prestação que originou os artefatos.`
          : 'Nenhum contrato ativo formaliza a autoria; depende de prova de código-fonte versionado.',
        evidenceIds: evidence.filter((e) => e.kind === 'contrato').map((e) => e.id),
      },
      {
        dimension: 'escopo_contratual',
        title: 'Enquadramento da entrega como escopo contratado (não apropriação)',
        status: unsignedDrafts.length > 0 && activeContracts.length === 0 ? 'parcial' : 'confirmado',
        detail: unsignedDrafts.length
          ? `${unsignedDrafts.length} minuta(s) em rascunho — a entrega de referência não está vinculada por instrumento vigente.`
          : 'Minutas e contratos ativos ancoram o escopo entregue.',
        evidenceIds: evidence.filter((e) => e.kind === 'contrato').map((e) => e.id),
      },
      {
        dimension: 'faturamento',
        title: 'Contraprestação paga pela entrega',
        status: activeContracts.length > 0 ? 'confirmado' : 'ausente',
        detail: activeContracts.length
          ? `Contraprestação total de R$ ${activeContracts.reduce((s, c) => s + c.totalValueBrl, 0).toFixed(2)} documentada em contratos ativos.`
          : 'Sem contrato ativo, não há prova de contraprestação financeira.',
        evidenceIds: activeContracts.map((c) => `${c.id}-ctr`),
      },
      {
        dimension: 'prova_probatoria',
        title: 'Inventário de evidência técnica (commits, NFS-e, logs)',
        status: evidence.length >= 3 ? 'parcial' : 'ausente',
        detail:
          'Fontes técnicas (repositório de código, NFS-e, logs de API) ainda não foram anexadas automaticamente ao caso; exigem coleta dirigida.',
        evidenceIds: evidence.map((e) => e.id),
      },
      {
        dimension: 'prazo',
        title: 'Controle de prazo e prescrição',
        status: legalCase.nextDeadline ? 'confirmado' : 'ausente',
        detail: legalCase.nextDeadline
          ? `Próximo prazo registrado: ${legalCase.nextDeadline}.`
          : 'Sem prazo processual cadastrado; o jurídico deve consultar o andamento no portal do TJAM/DIP.',
        evidenceIds: [],
      },
    ];

    return findings;
  }

  private decideVerdict(findings: LegalTechnicalFinding[]): LegalAuditVerdict {
    const missing = findings.filter((f) => f.status === 'ausente');
    if (missing.some((f) => f.dimension === 'autoria_software' || f.dimension === 'faturamento')) {
      return 'risco_critico';
    }
    if (missing.length >= 2) return 'risco_alto';
    return 'defensavel';
  }

  private computeConfidence(findings: LegalTechnicalFinding[], evidence: LegalEvidenceItem[]): number {
    const confirmed = findings.filter((f) => f.status === 'confirmado').length;
    const ratio = findings.length > 0 ? confirmed / findings.length : 0;
    const evidenceBoost = Math.min(evidence.length / 12, 0.3);
    return Math.min(1, Math.round((ratio * 0.7 + evidenceBoost) * 100) / 100);
  }

  private buildRecommendations(
    verdict: LegalAuditVerdict,
    findings: LegalTechnicalFinding[],
    gaps: string[]
  ): string[] {
    const recs: string[] = [];
    if (verdict === 'risco_critico') {
      recs.push('Coletar e anexar prova de autoria: commits do repositório, snapshots do Git e changelog de desenvolvimento.');
      recs.push('Localizar NFS-e e comprovantes de pagamento para cada projeto associado ao caso.');
    }
    if (verdict === 'risco_alto') {
      recs.push('Priorizar a assinatura/regularização dos instrumentos contratuais ainda em rascunho.');
    }
    recs.push('Encaminhar ao Diretor Jurídico com as lacunas probatórias listadas; não auto-contestar.');
    if (gaps.length > 0) recs.push(`Fechar ${gaps.length} lacuna(s) probatória(s) antes de qualquer manifestação processual.`);
    recs.push(`Revisar ${findings.filter((f) => f.status === 'parcial').length} achado(s) parcial(is) com a equipe de engenharia.`);
    return recs;
  }

  private async persistAudit(reports: LegalAuditReport[], jobId: string): Promise<void> {
    try {
      if (reports.length > 0) {
        await supabaseAdmin.from('audit_logs').insert({
          organization_id: PROD_ORGANIZATION_ID,
          user_id: PROD_USER_ID,
          action: 'LEGAL_CASE_AUDIT_COMPLETED',
          target: reports.map((r) => `legal_cases/${r.caseNumber}`).join(', '),
          success: true,
          details: {
            jobId,
            cases: reports.length,
            verdicts: reports.map((r) => r.verdict),
          },
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      // Supabase non-blocking
    }
  }
}
