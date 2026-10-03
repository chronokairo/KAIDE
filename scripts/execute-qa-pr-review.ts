/**
 * Script de Execução Real do Job 'qa.review_pr' no harness ChronoKairo AI.
 * 
 * Abordagem Adversarial:
 * 1. Testes Unitários (cobertura e casos limítrofes/fuzzing)
 * 2. Testes de Integração (contratos de portas e idempotência)
 * 3. Auditoria de Segurança (scan de segredos e injeções)
 * 4. Isolamento Multitenant & RBAC (cross-tenant spoofing e escalada de privilégio)
 */

import { defaultPullRequestRepository } from '@/infrastructure/qa/forge-pull-request-repository';
import { defaultCompanyControlPlane } from '@/infrastructure/control-plane/supabase-control-plane-adapter';
import { ExecuteQaPrReviewUseCase } from '@/application/use-cases/execute-qa-pr-review';

async function main() {
  console.log('='.repeat(80));
  console.log('CHRONOKAIRO AI - CONTROL PLANE / HARNESS (SUPABASE PROD OFICIAL)');
  console.log("Executando Job: 'qa.review_pr' (AI QA - Auditoria Adversarial de PRs)");
  console.log('='.repeat(80));

  const useCase = new ExecuteQaPrReviewUseCase(
    defaultPullRequestRepository,
    defaultCompanyControlPlane
  );

  console.log('\n[1/4] Varrendo Pull Requests abertos para revisão técnica...');
  const openPrs = await defaultPullRequestRepository.listOpenPullRequests();
  console.log(`-> Encontrados ${openPrs.length} PRs aguardando auditoria:\n`);

  openPrs.forEach((pr, i) => {
    console.log(`  ${i + 1}. [${pr.id}] ${pr.title}`);
    console.log(`     Autor: ${pr.author} | Branch: ${pr.branch} -> ${pr.baseBranch}`);
    console.log(`     Arquivos modificados (${pr.filesChanged.length}):`);
    pr.filesChanged.forEach((f) => console.log(`       - ${f}`));
    console.log(`     Resumo: ${pr.changesSummary}\n`);
  });

  console.log('[2/4] Executando análise adversarial nas 4 dimensões obrigatórias...');
  const result = await useCase.execute();

  console.log(`-> Auditoria concluída. Relatório emitido para ${result.reports.length} PRs:\n`);

  result.reports.forEach((rep, i) => {
    console.log('-'.repeat(80));
    console.log(`RELATÓRIO DE AUDITORIA #${i + 1}: ${rep.prId} - "${rep.prTitle}"`);
    console.log(`Veredito Geral: [${rep.overallVerdict}] | Score: ${rep.overallScore}/100 | Elegível para Merge: ${rep.canMerge ? 'SIM' : 'NÃO (BLOQUEADO)'}`);
    console.log('-'.repeat(80));

    rep.adversarialDimensions.forEach((dim) => {
      const icon = dim.verdict === 'PASS' ? '✅' : '❌';
      console.log(`\n  ${icon} [${dim.dimension.toUpperCase()}] ${dim.title} (Score: ${dim.score}/100 - ${dim.verdict})`);
      dim.checks.forEach((c) => {
        console.log(`     • ${c.name}: [${c.verdict}]`);
        console.log(`       Detalhe: ${c.detail}`);
        console.log(`       Evidência: ${c.evidence}`);
      });
    });

    if (rep.blockers.length > 0) {
      console.log(`\n  🚨 BLOQUEADORES CRÍTICOS:`);
      rep.blockers.forEach((b) => console.log(`     ! ${b}`));
    }

    if (rep.recommendations.length > 0) {
      console.log(`\n  💡 RECOMENDAÇÕES DO AI QA:`);
      rep.recommendations.forEach((rec) => console.log(`     * ${rec}`));
    }
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('[3/4] Registrando Job no Control Plane da Empresa Virtual...');
  const snapshot = await defaultCompanyControlPlane.getSnapshot();
  const job = snapshot.jobs.find((j) => j.id === result.jobId);
  const qaAgent = snapshot.agents.find((a) => a.role === 'qa');

  console.log(`-> Job ID: ${job?.id}`);
  console.log(`-> Agente Responsável: ${qaAgent?.name} (${qaAgent?.status.toUpperCase()})`);
  console.log(`-> Resumo das Alterações: "${job?.changesSummary}"`);
  console.log(`-> Ferramentas Usadas: ${job?.toolsUsed.join(', ')}`);
  console.log(`-> Total de Evidências Registradas: ${job?.evidence.length}`);

  console.log('\n[4/4] Síntese de Governança (ADR-0028):');
  console.log(`-> ${result.overallSummary}`);
  console.log('-> PRs com falha de segurança foram impedidos de merge na branch main.');
  console.log('='.repeat(80));
  console.log('JOB QA.REVIEW_PR CONCLUÍDO COM SUCESSO');
  console.log('='.repeat(80));
}

main().catch((err) => {
  console.error('Falha na execução do job qa.review_pr:', err);
  process.exit(1);
});
