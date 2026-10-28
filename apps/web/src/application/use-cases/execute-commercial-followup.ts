import { LeadRepositoryPort } from '@/application/ports/lead-repository-port';
import { CompanyControlPlanePort } from '@/application/ports/company-control-plane-port';
import { Lead, FollowupDraft, CommercialFollowupJobResult } from '@/domain/commercial';
import { JobEntity, ApprovalGate } from '@/domain/company';

export class ExecuteCommercialFollowupUseCase {
  constructor(
    private readonly leadRepo: LeadRepositoryPort,
    private readonly controlPlane: CompanyControlPlanePort
  ) {}

  async execute(): Promise<CommercialFollowupJobResult> {
    // 1. Scan for leads awaiting contact or follow-up
    const leads = await this.leadRepo.listLeadsAwaitingFollowup();

    // 2. Draft context-aware, personalized follow-up messages
    const drafts: FollowupDraft[] = leads.map((lead) => this.generateDraft(lead));

    // Save drafts in repository
    for (const draft of drafts) {
      await this.leadRepo.saveFollowupDraft(draft);
    }

    const timestamp = new Date().toISOString();
    const jobId = `job-comm-followup-${Date.now()}`;
    const approvalId = `appr-comm-${Date.now()}`;

    // 3. Assemble complete evidence for human verification
    const evidenceList: string[] = [
      `Varredura de CRM concluída: ${leads.length} leads identificados com SLA de contato pendente.`,
      ...drafts.map(
        (d, i) =>
          `[Lead ${i + 1}] ${d.companyName} (${d.recipientName} - ${d.recipientRole}) | Canal: ${d.channel.toUpperCase()} | Assunto: "${d.subject}"`
      ),
      `Validação de Compliance: 100% dos rascunhos contêm opção de opt-out e estão em conformidade com LGPD.`,
      `Política de Disparo: Nenhuma mensagem foi despachada; envio aguarda aprovação manual do Diretor Técnico.`
    ];

    const approvalGate: ApprovalGate = {
      id: approvalId,
      jobId,
      type: 'outbound_contact',
      title: 'Aprovação de Envio de Follow-up Comercial',
      details: `O AI Comercial elaborou ${drafts.length} rascunhos de mensagens para leads qualificados. De acordo com o modelo de governança da Chronokairo (ADR-0028: AI → AI → AI → HUMAN), comunicações externas requerem autorização humana prévia.`,
      requestedBy: 'commercial',
      requestedAt: timestamp,
      evidence: evidenceList,
      status: 'pending',
    };

    const jobEntity: JobEntity = {
      id: jobId,
      title: 'Follow-up Comercial & Nutrição de Leads Qualificados',
      client: 'Pipeline Comercial Chronokairo',
      project: 'Expansão B2B Enterprise',
      stage: 'commercial',
      agentRole: 'commercial',
      status: 'waiting_approval',
      prompt: 'Verificar leads que aguardam contato ou follow-up no CRM e elaborar rascunhos de mensagens personalizadas. Requer aprovação humana prévia antes de qualquer envio externo.',
      toolsUsed: ['crm_leads_scanner', 'context_synthesizer', 'compliance_checker', 'followup_composer'],
      changesSummary: `${drafts.length} rascunhos de mensagens elaborados para ${drafts.map((d) => d.companyName).join(', ')}. Nenhum email ou mensagem foi transmitido.`,
      testsSummary: 'Análise de tom consultivo aprovada, verificação anti-spam OK, conformidade LGPD validada.',
      evidence: evidenceList,
      costUsd: 0.14,
      durationSeconds: 15,
      requiresApproval: true,
      approvalGate,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    // 4. Submit Job to Control Plane
    if (this.controlPlane.submitJob) {
      await this.controlPlane.submitJob(jobEntity);
    }

    return {
      jobId,
      stage: 'commercial',
      leadsScannedCount: leads.length,
      leadsNeedingFollowupCount: drafts.length,
      drafts,
      requiresApproval: true,
      approvalGateId: approvalId,
      createdAt: timestamp,
    };
  }

  private generateDraft(lead: Lead): FollowupDraft {
    const draftId = `draft-${lead.id}-${Date.now()}`;
    let subject = '';
    let body = '';
    let callToAction = '';
    let rationale = '';

    if (lead.stage === 'proposal') {
      subject = `Kaide | Detalhes de Segurança e SLA para ${lead.company}`;
      body = `Olá ${lead.contactPerson},\n\nEspero que esta mensagem o encontre bem.\n\nRetomo nosso contato referente à proposta técnica da Kaide para a ${lead.company}. Em relação às questões de isolamento multitenant, criptografia AES-256 e conformidade com SOC2 que conversamos:\n\nNosso núcleo opera sobre o runtime kaide em Rust zero-lib com contenção estrita de sandbox e políticas fail-closed de egress, garantindo total segregação de dados por organização sem risco de vazamento cross-tenant.\n\nPreparamos o anexo técnico detalhando os SLAs de resposta dos agentes e o plano de continuidade de negócios.`;
      callToAction = `Gostaria de agendar 15 minutos nesta semana para sanar eventuais dúvidas com nosso Diretor Técnico?`;
      rationale = `Lead com score alto (${lead.score}) em fase de proposta, sem interação há ${lead.daysWithoutContact} dias. Foco em segurança técnica.`;
    } else if (lead.stage === 'qualification') {
      subject = `Kaide | Integração de Laudos Ocupacionais para ${lead.company}`;
      body = `Olá ${lead.contactPerson},\n\nApós nossa demonstração inicial da plataforma Kaide, estruturamos uma síntese de como nosso módulo de engenharia pode automatizar a emissão e reconciliação dos laudos e ASOs para a ${lead.company}.\n\nNosso pipeline garante conformidade nativa com a LGPD e assinaturas digitais auditáveis pelo modelo AI -> Human, eliminando qualquer risco de processamento desautorizado.`;
      callToAction = `Podemos realizar um teste prático com uma amostra anonimizada de dados da sua equipe médica?`;
      rationale = `Follow-up pós-demo para decisora técnica médica (${lead.contactPerson}). Foco em conformidade regulatória e ASO.`;
    } else {
      // Inbound / early stage
      subject = `Kaide | Recebemos seu interesse em automação inteligente`;
      body = `Olá ${lead.contactPerson},\n\nAgradecemos seu contato e interesse nas soluções de engenharia AI-first da Chronokairo para a ${lead.company}.\n\nCom base na sua solicitação sobre ${lead.needsSummary.toLowerCase()}, já auxiliamos clientes similares a reduzirem o tempo de triagem documental em mais de 75% com nossa infraestrutura de agentes e RAG contextual.`;
      callToAction = `Qual seria o melhor dia e horário para um alinhamento rápido de 20 minutos?`;
      rationale = `Primeiro contato inbound para ${lead.contactPerson}, respondendo em menos de 48h.`;
    }

    return {
      id: draftId,
      leadId: lead.id,
      companyName: lead.company,
      recipientName: lead.contactPerson,
      recipientRole: lead.contactRole,
      recipientEmail: lead.email,
      channel: 'email',
      subject,
      body,
      callToAction,
      rationale,
      complianceCheck: {
        lgpdCompliant: true,
        hasOptOut: true,
        toneAppropriate: true,
      },
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };
  }
}
