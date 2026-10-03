import { NextRequest, NextResponse } from 'next/server';
import { defaultCompanyControlPlane } from '@/infrastructure/control-plane/in-memory-control-plane';
import { defaultLeadRepository } from '@/infrastructure/crm/in-memory-lead-repository';
import { ExecuteCommercialFollowupUseCase } from '@/application/use-cases/execute-commercial-followup';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const jobName = body.jobName || 'commercial.followup';

    if (jobName === 'commercial.followup') {
      const useCase = new ExecuteCommercialFollowupUseCase(defaultLeadRepository, defaultCompanyControlPlane);
      const result = await useCase.execute();

      return NextResponse.json({
        success: true,
        message: "Job 'commercial.followup' executado com sucesso no Control Plane.",
        jobId: result.jobId,
        status: 'waiting_approval',
        requiresApproval: true,
        approvalGateId: result.approvalGateId,
        leadsCheckedCount: result.leadsScannedCount,
        draftsGenerated: result.drafts,
      });
    }

    return NextResponse.json(
      { error: `Job '${jobName}' não reconhecido pelo harness do Control Plane.` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Erro ao executar job no Control Plane:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao processar execução de job.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const useCase = new ExecuteCommercialFollowupUseCase(defaultLeadRepository, defaultCompanyControlPlane);
    const result = await useCase.execute();

    return NextResponse.json({
      success: true,
      message: "Job 'commercial.followup' executado com sucesso no Control Plane.",
      jobId: result.jobId,
      status: 'waiting_approval',
      requiresApproval: true,
      approvalGateId: result.approvalGateId,
      leadsCheckedCount: result.leadsScannedCount,
      draftsGenerated: result.drafts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
