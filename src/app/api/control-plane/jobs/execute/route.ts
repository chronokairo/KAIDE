import { NextRequest, NextResponse } from 'next/server';
import { defaultCompanyControlPlane } from '@/infrastructure/control-plane/supabase-control-plane-adapter';
import { SupabaseLeadRepository } from '@/infrastructure/crm/supabase-lead-repository';
import { defaultPullRequestRepository } from '@/infrastructure/qa/forge-pull-request-repository';
import { ExecuteCommercialFollowupUseCase } from '@/application/use-cases/execute-commercial-followup';
import { ExecuteQaPrReviewUseCase } from '@/application/use-cases/execute-qa-pr-review';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const jobName = body.jobName || 'qa.review_pr';

    if (jobName === 'commercial.followup') {
      const useCase = new ExecuteCommercialFollowupUseCase(new SupabaseLeadRepository(), defaultCompanyControlPlane);
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

    if (jobName === 'qa.review_pr') {
      const useCase = new ExecuteQaPrReviewUseCase(defaultPullRequestRepository, defaultCompanyControlPlane);
      const result = await useCase.execute();

      return NextResponse.json({
        success: true,
        message: "Job 'qa.review_pr' executado com sucesso no Control Plane.",
        jobId: result.jobId,
        stage: 'qa',
        prsScannedCount: result.prsScannedCount,
        reports: result.reports,
        overallSummary: result.overallSummary,
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobName = searchParams.get('job') || 'qa.review_pr';

  try {
    if (jobName === 'commercial.followup') {
      const useCase = new ExecuteCommercialFollowupUseCase(new SupabaseLeadRepository(), defaultCompanyControlPlane);
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

    const useCase = new ExecuteQaPrReviewUseCase(defaultPullRequestRepository, defaultCompanyControlPlane);
    const result = await useCase.execute();

    return NextResponse.json({
      success: true,
      message: "Job 'qa.review_pr' executado com sucesso no Control Plane.",
      jobId: result.jobId,
      stage: 'qa',
      prsScannedCount: result.prsScannedCount,
      reports: result.reports,
      overallSummary: result.overallSummary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
