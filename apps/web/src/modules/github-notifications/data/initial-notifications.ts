import { GitHubNotificationItem } from '../types';

export const INITIAL_NOTIFICATIONS: GitHubNotificationItem[] = [
  {
    id: 'gh-notif-1',
    repo: 'anamnesic/anamnesic-core',
    workflowName: '.github/workflows/openclaw-scheduled-live-checks.yml',
    runNumber: 46,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: '.github/workflows/openclaw-scheduled-live-checks.yml workflow run failed for main branch',
    timeAgo: '10 hours ago',
    timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/46',
    workflowPath: '.github/workflows/openclaw-scheduled-live-checks.yml',
    errorSummary: 'Scheduled live health check timeout connecting to upstream endpoint. Status code: 504 Gateway Timeout.',
    diagnostic: {
      category: 'timeout_network',
      categoryLabel: 'Timeout / Endpoint Indisponível',
      severity: 'high',
      explanation: 'O workflow executa verificações periódicas em endpoints remotos do OpenClaw. A chamada excedeu o timeout padrão de 30s ou o secret de autenticação expirou.',
      rootCause: 'HTTP request para o gateway do OpenClaw falhou com HTTP 504 Gateway Timeout durante o step `Run Live Checks`. Falta retry com backoff exponencial ou fallback para retry status.',
      suggestedFix: 'Adicionar timeout configurável, retry exponencial de 3 tentativas usando curl/node-fetch e verificação defensiva de variáveis de ambiente secretas.',
      affectedFile: '.github/workflows/openclaw-scheduled-live-checks.yml',
      patchCode: `name: OpenClaw Scheduled Live Checks
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  live-check:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run Live Checks with Retries
        env:
          OPENCLAW_API_KEY: \${{ secrets.OPENCLAW_API_KEY }}
          ENDPOINT_URL: \${{ secrets.OPENCLAW_ENDPOINT_URL }}
        run: |
          npx --yes retry-cli --attempts 3 --delay 5000 -- npm run test:live-health`,
      cliRerunCmd: 'gh run rerun 46 --repo anamnesic/anamnesic-core --failed',
      relevantDocsUrl: 'https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions',
    },
  },
  {
    id: 'gh-notif-2',
    repo: 'anamnesic/anamnesic-core',
    workflowName: 'close-issues',
    runNumber: 45,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'close-issues workflow run failed for main branch',
    timeAgo: '12 hours ago',
    timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/45',
    workflowPath: '.github/workflows/close-issues.yml',
    errorSummary: 'Resource not accessible by integration (HTTP 403: Forbidden - write access to issues required).',
    diagnostic: {
      category: 'permissions',
      categoryLabel: 'Permissão GITHUB_TOKEN Faltando',
      severity: 'critical',
      explanation: 'O workflow `close-issues` tenta fechar ou rotular issues usando o `GITHUB_TOKEN`, mas as permissões padrão do repositório estão como read-only.',
      rootCause: 'GitHub Actions restringe permissões por padrão em repositórios novos. Falta declarar explicitamente o bloco `permissions: issues: write` no topo do workflow YAML.',
      suggestedFix: 'Inserir a declaração de permissões `permissions: { issues: write, pull-requests: write }` no escopo do job ou workflow.',
      affectedFile: '.github/workflows/close-issues.yml',
      patchCode: `name: Close Stale Issues
on:
  schedule:
    - cron: '30 1 * * *'
  workflow_dispatch:

permissions:
  issues: write
  pull-requests: write

jobs:
  close-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          repo-token: \${{ secrets.GITHUB_TOKEN }}
          days-before-stale: 30
          days-before-close: 7
          stale-issue-message: 'Esta issue está inativa e será fechada em breve.'
          close-issue-message: 'Fechada por inatividade.'`,
      cliRerunCmd: 'gh run rerun 45 --repo anamnesic/anamnesic-core --failed',
      relevantDocsUrl: 'https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token',
    },
  },
  {
    id: 'gh-notif-3',
    repo: 'chronokairo/admin',
    workflowName: 'Delete Old Artifacts',
    runNumber: 20,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'Delete Old Artifacts workflow run failed for main branch',
    timeAgo: '15 hours ago',
    timestamp: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/chronokairo/admin/actions/runs/20',
    workflowPath: '.github/workflows/delete-old-artifacts.yml',
    errorSummary: 'Action kolpav/purge-artifacts-action relies on Node.js 12/16 runtime which is deprecated and disabled in GitHub Actions runner.',
    diagnostic: {
      category: 'deprecated_action',
      categoryLabel: 'Ação Deprecada (Node Runtime)',
      severity: 'high',
      explanation: 'A ação de limpeza de artefatos utiliza uma biblioteca de terceiros desatualizada executada em runtime Node.js incompatível com os runners ubuntu-latest modernos.',
      rootCause: 'GitHub descontinuou suporte a Node 12 e Node 16 em runners de CI. O runner aborta imediatamente com erro fatal de runtime.',
      suggestedFix: 'Migrar para o script oficial GitHub REST API via `actions/github-script@v7` ou utilizar `geekyeggo/delete-artifact@v5`.',
      affectedFile: '.github/workflows/delete-old-artifacts.yml',
      patchCode: `name: Delete Old Artifacts
on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

permissions:
  actions: write

jobs:
  delete-artifacts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const res = await github.rest.actions.listArtifactsForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              per_page: 100
            });
            const now = Date.now();
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            for (const art of res.data.artifacts) {
              if (now - new Date(art.created_at).getTime() > sevenDaysMs) {
                console.log('Deleting artifact: ' + art.name + ' (' + art.id + ')');
                await github.rest.actions.deleteArtifact({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  artifact_id: art.id
                });
              }
            }`,
      cliRerunCmd: 'gh run rerun 20 --repo chronokairo/admin --failed',
      relevantDocsUrl: 'https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node16-to-node20/',
    },
  },
  {
    id: 'gh-notif-4',
    repo: 'chronokairo/aluno',
    workflowName: 'Delete Old Artifacts',
    runNumber: 20,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'v2',
    eventTitle: 'Delete Old Artifacts workflow run failed for v2 branch',
    timeAgo: '16 hours ago',
    timestamp: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/chronokairo/aluno/actions/runs/20',
    workflowPath: '.github/workflows/delete-old-artifacts.yml',
    errorSummary: 'Action kolpav/purge-artifacts-action runtime failed on branch v2. Missing actions: write scope.',
    diagnostic: {
      category: 'deprecated_action',
      categoryLabel: 'Ação Deprecada & Permissão actions:write',
      severity: 'high',
      explanation: 'Mesma causa detectada no repositório chronokairo/admin: a action de purga de artefatos precisa de atualização para a API v7 e permissão de escrita de artefatos.',
      rootCause: 'Runner falhou ao chamar o endpoint de remoção de artefatos com token restrito em branch v2.',
      suggestedFix: 'Substituir a step pelo snippet moderno com `actions/github-script@v7` e permissão `actions: write`.',
      affectedFile: '.github/workflows/delete-old-artifacts.yml',
      patchCode: `name: Delete Old Artifacts
on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:

permissions:
  actions: write

jobs:
  delete-artifacts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const { data } = await github.rest.actions.listArtifactsForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo
            });
            for (const a of data.artifacts) {
              await github.rest.actions.deleteArtifact({
                owner: context.repo.owner,
                repo: context.repo.repo,
                artifact_id: a.id
              });
            }`,
      cliRerunCmd: 'gh run rerun 20 --repo chronokairo/aluno --failed',
      relevantDocsUrl: 'https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node16-to-node20/',
    },
  },
  {
    id: 'gh-notif-5',
    repo: 'anamnesic/anamnesic-core',
    workflowName: '.github/workflows/openclaw-scheduled-live-checks.yml',
    runNumber: 45,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: '.github/workflows/openclaw-scheduled-live-checks.yml workflow run failed for main branch',
    timeAgo: 'yesterday',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/45',
    workflowPath: '.github/workflows/openclaw-scheduled-live-checks.yml',
    errorSummary: 'Scheduled live health check network connection reset.',
    diagnostic: {
      category: 'timeout_network',
      categoryLabel: 'Instabilidade de Conexão Recorrente',
      severity: 'medium',
      explanation: 'Falha intermitente na execução agendada das verificações de integridade do OpenClaw.',
      rootCause: 'Endpoint expira sem mecanismo de retry resiliente.',
      suggestedFix: 'Implementar circuit breaker e log detalhado da resposta HTTP antes de falhar o build.',
      cliRerunCmd: 'gh run rerun 45 --repo anamnesic/anamnesic-core --failed',
    },
  },
  {
    id: 'gh-notif-6',
    repo: 'anamnesic/anamnesic-core',
    workflowName: 'close-issues',
    runNumber: 44,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'close-issues workflow run failed for main branch',
    timeAgo: 'yesterday',
    timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/44',
    workflowPath: '.github/workflows/close-issues.yml',
    errorSummary: 'Missing permissions for issues:write token.',
    diagnostic: {
      category: 'permissions',
      categoryLabel: 'Permissão GITHUB_TOKEN Faltando',
      severity: 'critical',
      explanation: 'Execução diária falhou por falta de permissão de escrita de issues.',
      rootCause: 'Token padrão sem escopo `issues: write`.',
      suggestedFix: 'Adicionar `permissions: issues: write` ao workflow.',
      cliRerunCmd: 'gh run rerun 44 --repo anamnesic/anamnesic-core --failed',
    },
  },
  {
    id: 'gh-notif-7',
    repo: 'chronokairo/admin',
    workflowName: 'Delete Old Artifacts',
    runNumber: 19,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'Delete Old Artifacts workflow run failed for main branch',
    timeAgo: 'yesterday',
    timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/chronokairo/admin/actions/runs/19',
    workflowPath: '.github/workflows/delete-old-artifacts.yml',
    errorSummary: 'Node.js 12 runtime deprecation error.',
    diagnostic: {
      category: 'deprecated_action',
      categoryLabel: 'Ação Deprecada',
      severity: 'high',
      explanation: 'Falha recorrente do job de limpeza de artefatos.',
      rootCause: 'Uso de action não mantida.',
      suggestedFix: 'Atualizar para actions/github-script@v7.',
      cliRerunCmd: 'gh run rerun 19 --repo chronokairo/admin --failed',
    },
  },
  {
    id: 'gh-notif-8',
    repo: 'chronokairo/aluno',
    workflowName: 'Delete Old Artifacts',
    runNumber: 19,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'v2',
    eventTitle: 'Delete Old Artifacts workflow run failed for v2 branch',
    timeAgo: 'yesterday',
    timestamp: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/chronokairo/aluno/actions/runs/19',
    workflowPath: '.github/workflows/delete-old-artifacts.yml',
    errorSummary: 'Node.js 12 runtime deprecation error.',
    diagnostic: {
      category: 'deprecated_action',
      categoryLabel: 'Ação Deprecada',
      severity: 'high',
      explanation: 'Falha de limpeza de artefatos na branch v2.',
      rootCause: 'Action legado de exclusão de artefatos.',
      suggestedFix: 'Substituir por script oficial v7.',
      cliRerunCmd: 'gh run rerun 19 --repo chronokairo/aluno --failed',
    },
  },
  {
    id: 'gh-notif-9',
    repo: 'anamnesic/anamnesic-core',
    workflowName: '.github/workflows/openclaw-scheduled-live-checks.yml',
    runNumber: 44,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: '.github/workflows/openclaw-scheduled-live-checks.yml workflow run failed for main branch',
    timeAgo: '2 days ago',
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/44',
  },
  {
    id: 'gh-notif-10',
    repo: 'anamnesic/anamnesic-core',
    workflowName: 'close-issues',
    runNumber: 43,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'close-issues workflow run failed for main branch',
    timeAgo: '2 days ago',
    timestamp: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/43',
  },
  {
    id: 'gh-notif-11',
    repo: 'chronokairo/admin',
    workflowName: 'Delete Old Artifacts',
    runNumber: 18,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'Delete Old Artifacts workflow run failed for main branch',
    timeAgo: '3 days ago',
    timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/chronokairo/admin/actions/runs/18',
  },
  {
    id: 'gh-notif-12',
    repo: 'chronokairo/aluno',
    workflowName: 'Delete Old Artifacts',
    runNumber: 18,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'v2',
    eventTitle: 'Delete Old Artifacts workflow run failed for v2 branch',
    timeAgo: '3 days ago',
    timestamp: new Date(Date.now() - 74 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/chronokairo/aluno/actions/runs/18',
  },
  {
    id: 'gh-notif-13',
    repo: 'anamnesic/anamnesic-core',
    workflowName: '.github/workflows/openclaw-scheduled-live-checks.yml',
    runNumber: 43,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: '.github/workflows/openclaw-scheduled-live-checks.yml workflow run failed for main branch',
    timeAgo: '4 days ago',
    timestamp: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/43',
  },
  {
    id: 'gh-notif-14',
    repo: 'anamnesic/anamnesic-core',
    workflowName: 'close-issues',
    runNumber: 42,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'close-issues workflow run failed for main branch',
    timeAgo: '4 days ago',
    timestamp: new Date(Date.now() - 98 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/42',
  },
  {
    id: 'gh-notif-15',
    repo: 'chronokairo/admin',
    workflowName: 'Delete Old Artifacts',
    runNumber: 17,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'Delete Old Artifacts workflow run failed for main branch',
    timeAgo: '4 days ago',
    timestamp: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/chronokairo/admin/actions/runs/17',
  },
  {
    id: 'gh-notif-16',
    repo: 'chronokairo/aluno',
    workflowName: 'Delete Old Artifacts',
    runNumber: 17,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'v2',
    eventTitle: 'Delete Old Artifacts workflow run failed for v2 branch',
    timeAgo: '4 days ago',
    timestamp: new Date(Date.now() - 102 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/chronokairo/aluno/actions/runs/17',
  },
  {
    id: 'gh-notif-17',
    repo: 'anamnesic/anamnesic-core',
    workflowName: '.github/workflows/openclaw-scheduled-live-checks.yml',
    runNumber: 42,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: '.github/workflows/openclaw-scheduled-live-checks.yml workflow run failed for main branch',
    timeAgo: '5 days ago',
    timestamp: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/42',
  },
  {
    id: 'gh-notif-18',
    repo: 'anamnesic/anamnesic-core',
    workflowName: 'close-issues',
    runNumber: 41,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'close-issues workflow run failed for main branch',
    timeAgo: '5 days ago',
    timestamp: new Date(Date.now() - 122 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/anamnesic/anamnesic-core/actions/runs/41',
  },
  {
    id: 'gh-notif-19',
    repo: 'chronokairo/admin',
    workflowName: 'Delete Old Artifacts',
    runNumber: 16,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'Delete Old Artifacts workflow run failed for main branch',
    timeAgo: '5 days ago',
    timestamp: new Date(Date.now() - 124 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/chronokairo/admin/actions/runs/16',
  },
  {
    id: 'gh-notif-20',
    repo: 'chronokairo/aluno',
    workflowName: 'Delete Old Artifacts',
    runNumber: 16,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'v2',
    eventTitle: 'Delete Old Artifacts workflow run failed for v2 branch',
    timeAgo: '5 days ago',
    timestamp: new Date(Date.now() - 126 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: false,
    htmlUrl: 'https://github.com/chronokairo/aluno/actions/runs/16',
  },
  {
    id: 'gh-notif-21',
    repo: 'chronokairo/thinktrack',
    workflowName: 'Dependency Analysis',
    runNumber: 6,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'Dependency Analysis workflow run failed for main branch',
    timeAgo: 'last week',
    timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/chronokairo/thinktrack/actions/runs/6',
    workflowPath: '.github/workflows/dependency-analysis.yml',
    errorSummary: 'Audit step failed with 3 High and 1 Critical vulnerabilities found in transitive dependencies.',
    diagnostic: {
      category: 'dependency_vulnerability',
      categoryLabel: 'Vulnerabilidade em Pacotes (Audit CI)',
      severity: 'critical',
      explanation: 'O scanner de segurança de dependências (npm audit / yarn audit) bloqueou a esteira devido a vulnerabilidades conhecidas em pacotes npm.',
      rootCause: 'Pacotes vulneráveis como `tar`, `axios` ou `semver` em versões antigas travaram a regra de segurança `--audit-level=high`.',
      suggestedFix: 'Executar `npm audit fix` ou adicionar overrides no `package.json` para forçar versões corrigidas sem quebras de compatibilidade.',
      affectedFile: 'package.json',
      patchCode: `// No package.json adicione:
{
  "overrides": {
    "tar": ">=7.4.3",
    "axios": ">=1.7.4",
    "semver": ">=7.5.4"
  },
  "scripts": {
    "audit:ci": "npm audit --audit-level=critical"
  }
}`,
      cliRerunCmd: 'gh run rerun 6 --repo chronokairo/thinktrack --failed',
      relevantDocsUrl: 'https://docs.npmjs.com/cli/v9/commands/npm-audit',
    },
  },
  {
    id: 'gh-notif-22',
    repo: 'chronokairo/ciesa-somareducacional',
    workflowName: 'CodeQL',
    runNumber: 23,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'CodeQL workflow run failed for main branch',
    timeAgo: 'last week',
    timestamp: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/chronokairo/ciesa-somareducacional/actions/runs/23',
    workflowPath: '.github/workflows/codeql.yml',
    errorSummary: 'CodeQL Action v2 is deprecated. Runner failed to initialize codeql database.',
    diagnostic: {
      category: 'codeql_build',
      categoryLabel: 'CodeQL Action v2 Descontinuada',
      severity: 'critical',
      explanation: 'GitHub desativou a versão v2 das actions de CodeQL. Pipelines que ainda referenciam `@v2` falham na inicialização do analisador estático.',
      rootCause: 'Uso de `github/codeql-action/init@v2` e `github/codeql-action/analyze@v2`.',
      suggestedFix: 'Atualizar todas as steps do CodeQL para a versão `@v3`.',
      affectedFile: '.github/workflows/codeql.yml',
      patchCode: `name: "CodeQL Analysis"
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  schedule:
    - cron: '15 5 * * 0'

permissions:
  actions: read
  contents: read
  security-events: write

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: 'javascript-typescript'

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3`,
      cliRerunCmd: 'gh run rerun 23 --repo chronokairo/ciesa-somareducacional --failed',
      relevantDocsUrl: 'https://github.blog/changelog/2024-01-18-codeql-action-v2-is-now-deprecated/',
    },
  },
  {
    id: 'gh-notif-23',
    repo: 'chronokairo/wd-somareducacional',
    workflowName: 'CodeQL',
    runNumber: 39,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'CodeQL workflow run failed for main branch',
    timeAgo: 'last week',
    timestamp: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/chronokairo/wd-somareducacional/actions/runs/39',
    workflowPath: '.github/workflows/codeql.yml',
    errorSummary: 'CodeQL Action v2 deprecation and autobuild failure.',
    diagnostic: {
      category: 'codeql_build',
      categoryLabel: 'CodeQL Action v2 Descontinuada',
      severity: 'critical',
      explanation: 'Pipeline do repositório wd-somareducacional falhou pela descontinuação da action v2.',
      rootCause: 'Uso de `github/codeql-action/analyze@v2`.',
      suggestedFix: 'Atualizar para `@v3` e garantir escopo `security-events: write`.',
      affectedFile: '.github/workflows/codeql.yml',
      patchCode: `// Atualizar actions para v3:
- uses: github/codeql-action/init@v3
- uses: github/codeql-action/analyze@v3`,
      cliRerunCmd: 'gh run rerun 39 --repo chronokairo/wd-somareducacional --failed',
    },
  },
  {
    id: 'gh-notif-24',
    repo: 'kattegatcorp/erp',
    workflowName: 'Dependency Analysis',
    runNumber: 7,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'Dependency Analysis workflow run failed for main branch',
    timeAgo: 'last week',
    timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/kattegatcorp/erp/actions/runs/7',
    workflowPath: '.github/workflows/dependency-analysis.yml',
    errorSummary: 'Critical security advisory found in dependency graph.',
    diagnostic: {
      category: 'dependency_vulnerability',
      categoryLabel: 'Alerta de Segurança em Dependências',
      severity: 'critical',
      explanation: 'Advisory de segurança com CVSS >= 8.0 encontrado nas dependências do ERP Kattegat.',
      rootCause: 'Pacotes desatualizados no lockfile.',
      suggestedFix: 'Executar `npm audit fix --force` ou atualizar bibliotecas principais.',
      cliRerunCmd: 'gh run rerun 7 --repo kattegatcorp/erp --failed',
    },
  },
  {
    id: 'gh-notif-25',
    repo: 'chronokairo/ciesa_totvs-erp',
    workflowName: 'CodeQL',
    runNumber: 23,
    status: 'failed',
    reason: 'ci_activity',
    branch: 'main',
    eventTitle: 'CodeQL workflow run failed for main branch',
    timeAgo: 'last week',
    timestamp: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
    actor: '@lu4nn3ry',
    unread: true,
    htmlUrl: 'https://github.com/chronokairo/ciesa_totvs-erp/actions/runs/23',
    workflowPath: '.github/workflows/codeql.yml',
    errorSummary: 'CodeQL Action v2 deprecation and autobuild failure.',
    diagnostic: {
      category: 'codeql_build',
      categoryLabel: 'CodeQL Action v2 Descontinuada',
      severity: 'critical',
      explanation: 'Pipeline de segurança estática do TOTVS ERP falhou por uso da action v2 descontinuada.',
      rootCause: 'Migração obrigatória para CodeQL v3 não realizada.',
      suggestedFix: 'Atualizar step para `github/codeql-action/init@v3` e `analyze@v3`.',
      affectedFile: '.github/workflows/codeql.yml',
      patchCode: `// No arquivo .github/workflows/codeql.yml:
- uses: github/codeql-action/init@v3
  with:
    languages: 'csharp, javascript-typescript'
- uses: github/codeql-action/analyze@v3`,
      cliRerunCmd: 'gh run rerun 23 --repo chronokairo/ciesa_totvs-erp --failed',
    },
  },
];
