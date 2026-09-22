import { IGitHubApiClientPort } from '../../../domain/ports/secondary/IGitHubApiClientPort';
import { GitHubNotificationItem } from '../../../domain/entities/notification.entity';
import { IWorkflowDiagnosticEnginePort } from '../../../domain/ports/secondary/IWorkflowDiagnosticEnginePort';

export class FetchGitHubApiClient implements IGitHubApiClientPort {
  constructor(private readonly diagnosticEngine: IWorkflowDiagnosticEnginePort) {}

  public async fetchNotifications(token: string): Promise<GitHubNotificationItem[]> {
    if (!token) {
      throw new Error('Token de acesso pessoal (PAT) do GitHub não fornecido.');
    }

    const response = await fetch('https://api.github.com/notifications?all=true&per_page=50', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token do GitHub inválido ou expirado. Verifique os escopos de `notifications` e `repo`.');
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

      const diagnostic = this.diagnosticEngine.diagnose(repo, title, title, 'main');

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
}
