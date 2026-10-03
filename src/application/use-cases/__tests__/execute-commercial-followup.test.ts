import { describe, it, expect, beforeEach } from 'vitest';
import { ExecuteCommercialFollowupUseCase } from '../execute-commercial-followup';
import { InMemoryLeadRepository } from '@/infrastructure/crm/in-memory-lead-repository';
import { InMemoryCompanyControlPlaneAdapter } from '@/infrastructure/control-plane/in-memory-control-plane';

describe('ExecuteCommercialFollowupUseCase', () => {
  let leadRepo: InMemoryLeadRepository;
  let controlPlane: InMemoryCompanyControlPlaneAdapter;
  let useCase: ExecuteCommercialFollowupUseCase;

  beforeEach(() => {
    leadRepo = new InMemoryLeadRepository();
    controlPlane = new InMemoryCompanyControlPlaneAdapter(leadRepo);
    useCase = new ExecuteCommercialFollowupUseCase(leadRepo, controlPlane);
  });

  it('deve escanear leads pendentes de contato e elaborar rascunhos de follow-up personalizados', async () => {
    const result = await useCase.execute();

    expect(result.leadsScannedCount).toBeGreaterThan(0);
    expect(result.drafts.length).toBe(result.leadsScannedCount);
    expect(result.stage).toBe('commercial');
    expect(result.requiresApproval).toBe(true);

    // Verifica conteúdo dos rascunhos
    const inovaHealthDraft = result.drafts.find((d) => d.companyName === 'InovaHealth');
    expect(inovaHealthDraft).toBeDefined();
    expect(inovaHealthDraft?.recipientName).toBe('Dra. Camila Santos');
    expect(inovaHealthDraft?.subject).toContain('Laudos Ocupacionais');
    expect(inovaHealthDraft?.complianceCheck.lgpdCompliant).toBe(true);
    expect(inovaHealthDraft?.complianceCheck.hasOptOut).toBe(true);
    expect(inovaHealthDraft?.status).toBe('pending_approval');

    const alphaDraft = result.drafts.find((d) => d.companyName === 'Alpha Finanças S/A');
    expect(alphaDraft).toBeDefined();
    expect(alphaDraft?.recipientRole).toBe('CTO');
    expect(alphaDraft?.subject).toContain('Segurança');
  });

  it('deve registrar o job no Control Plane com status waiting_approval e NÃO enviar mensagens antes da aprovação', async () => {
    const result = await useCase.execute();

    const snapshot = await controlPlane.getSnapshot();
    const job = snapshot.jobs.find((j) => j.id === result.jobId);

    expect(job).toBeDefined();
    expect(job?.agentRole).toBe('commercial');
    expect(job?.status).toBe('waiting_approval');
    expect(job?.requiresApproval).toBe(true);
    expect(job?.approvalGate).toBeDefined();
    expect(job?.approvalGate?.type).toBe('outbound_contact');
    expect(job?.approvalGate?.status).toBe('pending');

    // Agente comercial deve estar aguardando aprovação
    const commAgent = snapshot.agents.find((a) => a.role === 'commercial');
    expect(commAgent?.status).toBe('waiting_approval');
    expect(commAgent?.currentJobId).toBe(job?.id);

    // Mensagens devem permanecer como não despachadas no repositório
    const drafts = leadRepo.getAllDrafts();
    expect(drafts.every((d) => d.status === 'pending_approval')).toBe(true);
    expect(drafts.some((d) => d.status === 'dispatched')).toBe(false);
  });

  it('quando o Diretor aprovar o gate, o job deve ser concluído e as mensagens despachadas', async () => {
    const result = await useCase.execute();

    // Humano aprova o gate
    await controlPlane.approveJob(result.approvalGateId, 'Aprovado pelo Diretor Técnico após conferência dos rascunhos.');

    const snapshot = await controlPlane.getSnapshot();
    const job = snapshot.jobs.find((j) => j.id === result.jobId);

    expect(job?.status).toBe('completed');
    expect(job?.approvalGate?.status).toBe('approved');
    expect(job?.evidence.some((e) => e.includes('Disparo Externo Concluído'))).toBe(true);

    // Rascunhos devem estar marcados como despachados
    const drafts = leadRepo.getAllDrafts();
    expect(drafts.every((d) => d.status === 'dispatched')).toBe(true);
  });

  it('quando o Diretor rejeitar o gate, o job deve ser rejeitado e as mensagens NÃO despachadas', async () => {
    const result = await useCase.execute();

    // Humano rejeita o gate
    await controlPlane.rejectJob(result.approvalGateId, 'Tom muito agressivo, aguardar fechamento do mês.');

    const snapshot = await controlPlane.getSnapshot();
    const job = snapshot.jobs.find((j) => j.id === result.jobId);

    expect(job?.status).toBe('rejected');
    expect(job?.approvalGate?.status).toBe('rejected');

    const drafts = leadRepo.getAllDrafts();
    expect(drafts.some((d) => d.status === 'dispatched')).toBe(false);
  });
});
