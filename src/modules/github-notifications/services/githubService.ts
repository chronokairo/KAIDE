import { GitHubNotificationItem, WorkflowDiagnostic } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/initial-notifications';

const NOTIFICATIONS_STORAGE_KEY = 'chronokairo_github_notifications';
const GITHUB_TOKEN_STORAGE_KEY = 'chronokairo_github_pat';

export function loadSavedNotifications(): GitHubNotificationItem[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      saveNotifications(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_NOTIFICATIONS;
  } catch (err) {
    console.error('Failed to read notifications from localStorage:', err);
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(items: GitHubNotificationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save notifications to localStorage:', err);
  }
}

export function getSavedGitHubToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveGitHubToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, token.trim());
  } catch {}
}

export function generateAutomatedDiagnostic(
  repo: string,
  workflowName: string,
  eventTitle: string,
  branch: string
): WorkflowDiagnostic {
  const lowerWf = workflowName.toLowerCase();
  const lowerTitle = eventTitle.toLowerCase();

  if (lowerWf.includes('codeql') || lowerTitle.includes('codeql')) {
    return {
      category: 'codeql_build',
      categoryLabel: 'CodeQL Action v2 Descontinuada',
      severity: 'critical',
      explanation: 'O GitHub Actions descontinuou o suporte à versão v2 da CodeQL Action em favor da v3.',
      rootCause: 'Uso de `github/codeql-action/init@v2` ou falha de autobuild do analisador.',
      suggestedFix: 'Atualizar os steps para `github/codeql-action/init@v3` e `analyze@v3` e configurar permissão `security-events: write`.',
      affectedFile: '.github/workflows/codeql.yml',
      patchCode: `- uses: github/codeql-action/init@v3
  with:
    languages: 'javascript-typescript'
- uses: github/codeql-action/analyze@v3`,
      cliRerunCmd: `gh run rerun --repo ${repo} --failed`,
      relevantDocsUrl: 'https://github.blog/changelog/2024-01-18-codeql-action-v2-is-now-deprecated/',
    };
  }

  if (lowerWf.includes('artifact') || lowerWf.includes('purge') || lowerTitle.includes('artifact')) {
    return {
      category: 'deprecated_action',
      categoryLabel: 'Ação Deprecada / Permissões de Artefato',
      severity: 'high',
      explanation: 'A ação de limpeza de artefatos utiliza runtime desatualizado (Node 12/16) ou falta escopo `actions: write`.',
      rootCause: 'Runner rejeita actions antigas ou token sem permissão de exclusão de artefatos.',
      suggestedFix: 'Substituir a biblioteca pelo script nativo com `actions/github-script@v7` e adicionar `permissions: { actions: write }`.',
      affectedFile: '.github/workflows/delete-old-artifacts.yml',
      patchCode: `permissions:
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
              repo: context.repo.repo
            });
            for (const a of res.data.artifacts) {
              await github.rest.actions.deleteArtifact({
                owner: context.repo.owner,
                repo: context.repo.repo,
                artifact_id: a.id
              });
            }`,
      cliRerunCmd: `gh run rerun --repo ${repo} --failed`,
    };
  }

  if (lowerWf.includes('issue') || lowerWf.includes('stale') || lowerTitle.includes('close-issue')) {
    return {
      category: 'permissions',
      categoryLabel: 'Permissão GITHUB_TOKEN Faltando',
      severity: 'critical',
      explanation: 'Workflow de triagem de issues falhou por falta de permissão de escrita de issues no repositório.',
      rootCause: 'O token padrão tem escopo apenas de leitura. É obrigatório declarar `permissions: { issues: write }`.',
      suggestedFix: 'Inserir permissão de escrita no arquivo YAML do workflow.',
      affectedFile: '.github/workflows/close-issues.yml',
      patchCode: `permissions:
  issues: write
  pull-requests: write`,
      cliRerunCmd: `gh run rerun --repo ${repo} --failed`,
    };
  }

  if (lowerWf.includes('dependency') || lowerWf.includes('audit') || lowerTitle.includes('dependency')) {
    return {
      category: 'dependency_vulnerability',
      categoryLabel: 'Vulnerabilidade em Dependências',
      severity: 'high',
      explanation: 'Scanner de dependências falhou devido a pacotes vulneráveis ou falha no download do registro npm.',
      rootCause: 'Advisories de segurança detectados com severidade High/Critical.',
      suggestedFix: 'Executar `npm audit fix` ou aplicar `overrides` no package.json.',
      affectedFile: 'package.json',
      patchCode: `// No package.json:
"scripts": {
  "audit:ci": "npm audit --audit-level=critical"
}`,
      cliRerunCmd: `gh run rerun --repo ${repo} --failed`,
    };
  }

  if (lowerWf.includes('live-check') || lowerWf.includes('openclaw') || lowerTitle.includes('live-check')) {
    return {
      category: 'timeout_network',
      categoryLabel: 'Timeout ou Erro no Endpoint Live',
      severity: 'high',
      explanation: 'Health check agendado falhou por timeout ou indisponibilidade temporária do serviço monitorado.',
      rootCause: 'Endpoint HTTP retornou código de erro 5xx ou excedeu timeout.',
      suggestedFix: 'Adicionar timeout explícito e retry exponencial de 3 tentativas na requisição.',
      affectedFile: '.github/workflows/openclaw-scheduled-live-checks.yml',
      patchCode: `steps:
  - name: Health Check com Retry
    run: |
      for i in {1..3}; do
        curl -f -m 15 "\${{ secrets.HEALTH_URL }}" && break || sleep 5;
      done`,
      cliRerunCmd: `gh run rerun --repo ${repo} --failed`,
    };
  }

  return {
    category: 'general',
    categoryLabel: 'Falha de Execução de CI',
    severity: 'medium',
    explanation: `O workflow \`${workflowName}\` falhou durante a execução na branch \`${branch}\`.`,
    rootCause: 'Falha de compilação, teste unitário quebrado ou variável de ambiente ausente.',
    suggestedFix: 'Verificar os logs detalhados do job e executar o comando de rerun com depuração ativada.',
    cliRerunCmd: `gh run rerun --repo ${repo} --failed --debug`,
  };
}

export function parseRawNotificationsText(text: string): GitHubNotificationItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('Skip to') && !l.startsWith('Notifications') && !l.startsWith('Folders') && !l.startsWith('Filters') && !l.startsWith('Add new') && !l.startsWith('Repositories') && !l.startsWith('Search notifications') && !l.startsWith('Notifications by date') && !l.startsWith('Select all') && !l.startsWith('ProTip!') && !/^\d+-\d+ of \d+$/.test(l));

  const items: GitHubNotificationItem[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check if line matches pattern: "org/repo – workflow_name #run_number" or "org/repo – workflow_name"
    const headerMatch = line.match(/^([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\s+[–\-—]\s+(.+?)(?:\s+#(\d+))?$/);

    if (headerMatch) {
      const repo = headerMatch[1];
      const workflowName = headerMatch[2].trim();
      const runNumber = headerMatch[3] ? parseInt(headerMatch[3], 10) : undefined;

      let eventTitle = '';
      let timeAgo = 'recently';
      let actor = '@developer';
      let branch = 'main';

      if (i + 1 < lines.length && !lines[i + 1].includes('–')) {
        eventTitle = lines[i + 1];
        i++;
      } else {
        eventTitle = `${workflowName} workflow run failed`;
      }

      // Extract branch if present in title
      const branchMatch = eventTitle.match(/for\s+([a-zA-Z0-9_./-]+)\s+branch/i);
      if (branchMatch) {
        branch = branchMatch[1];
      }

      if (i + 1 < lines.length && !lines[i + 1].includes('–') && !lines[i + 1].startsWith('@')) {
        timeAgo = lines[i + 1];
        i++;
      }

      if (i + 1 < lines.length && lines[i + 1].startsWith('@')) {
        actor = lines[i + 1];
        i++;
      }

      if (i + 1 < lines.length && lines[i + 1].toLowerCase().includes('activity')) {
        i++;
      }

      const diagnostic = generateAutomatedDiagnostic(repo, workflowName, eventTitle, branch);

      items.push({
        id: `parsed-notif-${Date.now()}-${items.length + 1}`,
        repo,
        workflowName,
        runNumber,
        status: 'failed',
        reason: 'ci_activity',
        branch,
        eventTitle,
        timeAgo,
        timestamp: new Date().toISOString(),
        actor,
        unread: true,
        htmlUrl: `https://github.com/${repo}/actions`,
        workflowPath: workflowName.includes('.yml') ? workflowName : `.github/workflows/${workflowName}.yml`,
        errorSummary: diagnostic.explanation,
        diagnostic,
      });
    }

    i++;
  }

  return items;
}

export async function fetchLiveGitHubNotifications(token: string): Promise<GitHubNotificationItem[]> {
  if (!token) throw new Error('Token de acesso pessoal (PAT) do GitHub não fornecido.');

  const response = await fetch('https://api.github.com/notifications?all=true&per_page=50', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token inválido ou expirado. Verifique as permissões de `notifications` e `repo`.');
    }
    throw new Error(`Erro na API do GitHub: ${response.status} ${response.statusText}`);
  }

  const rawList = await response.json();
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item: any) => {
    const repo = item.repository?.full_name || 'unknown/repo';
    const title = item.subject?.title || 'Notification';
    const type = item.subject?.type || 'WorkflowRun';
    const reason = item.reason || 'ci_activity';
    const unread = item.unread ?? true;
    const updatedAt = item.updated_at || new Date().toISOString();

    const diagnostic = generateAutomatedDiagnostic(repo, title, title, 'main');

    return {
      id: String(item.id),
      repo,
      workflowName: title,
      status: type === 'WorkflowRun' || title.toLowerCase().includes('failed') ? 'failed' : 'in_progress',
      reason: reason as any,
      branch: 'main',
      eventTitle: title,
      timeAgo: new Date(updatedAt).toLocaleDateString(),
      timestamp: updatedAt,
      actor: '@github',
      unread,
      htmlUrl: item.repository?.html_url ? `${item.repository.html_url}/actions` : undefined,
      workflowPath: title.includes('.yml') ? title : undefined,
      errorSummary: diagnostic.explanation,
      diagnostic,
    };
  });
}

export function generateAiFixPrompt(notification: GitHubNotificationItem): string {
  const diag = notification.diagnostic;
  return `### 🚨 Correção de Falha em Pipeline GitHub Actions

**Repositório:** \`${notification.repo}\`
**Workflow:** \`${notification.workflowName}\` ${notification.runNumber ? `(#${notification.runNumber})` : ''}
**Branch:** \`${notification.branch}\`
**Gatilho / Notificação:** ${notification.eventTitle}
**Causa Raiz Identificada:** ${diag?.categoryLabel || 'Falha de CI'}

**Diagnóstico Técnico:**
${diag?.explanation || notification.errorSummary || 'A pipeline falhou na execução agendada ou no push da branch.'}

${diag?.rootCause ? `**Causa Raiz:**\n${diag.rootCause}\n` : ''}
${diag?.suggestedFix ? `**Solução Recomendada:**\n${diag.suggestedFix}\n` : ''}

${
  diag?.patchCode
    ? `**Código / Patch Sugerido (${diag.affectedFile || 'Workflow YAML'}):**
\`\`\`yaml
${diag.patchCode}
\`\`\`
`
    : ''
}

${diag?.cliRerunCmd ? `**Comando de Execução:** \`${diag.cliRerunCmd}\`\n` : ''}

Por favor, analise essa falha em detalhe, explique como reproduzir ou validar localmente e me ajude a aplicar a correção necessária no repositório.`;
}
