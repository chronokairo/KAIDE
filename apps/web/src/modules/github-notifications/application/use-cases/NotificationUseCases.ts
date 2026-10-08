import {
  INotificationUseCase,
  SyncGitHubApiCommand,
  SyncResult,
  ImportRawTextCommand,
  ImportResult,
  ToggleUnreadCommand,
  FilterNotificationsQuery,
  GenerateAiFixPromptRequest,
  DiagnosticResult,
  BatchTriageSummary,
} from '../../domain/ports/primary/contracts';
import { GitHubNotificationItem } from '../../domain/entities/notification.entity';
import { INotificationRepository } from '../../domain/ports/secondary/INotificationRepository';
import { IGitHubApiClientPort } from '../../domain/ports/secondary/IGitHubApiClientPort';
import { IWorkflowDiagnosticEnginePort } from '../../domain/ports/secondary/IWorkflowDiagnosticEnginePort';

export class NotificationUseCases implements INotificationUseCase {
  constructor(
    private readonly repository: INotificationRepository,
    private readonly apiClient: IGitHubApiClientPort,
    private readonly diagnosticEngine: IWorkflowDiagnosticEnginePort
  ) {}

  public async getNotifications(): Promise<GitHubNotificationItem[]> {
    return this.repository.getAll();
  }

  public async saveNotifications(items: GitHubNotificationItem[]): Promise<void> {
    return this.repository.saveAll(items);
  }

  public filterNotifications(query: FilterNotificationsQuery): GitHubNotificationItem[] {
    const { notifications, filters } = query;
    return notifications.filter((n) => {
      if (filters.repo !== 'all' && n.repo !== filters.repo) return false;
      if (filters.status === 'unread' && !n.unread) return false;
      if (filters.status === 'failed' && n.status !== 'failed') return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          n.repo.toLowerCase().includes(q) ||
          n.workflowName.toLowerCase().includes(q) ||
          n.branch.toLowerCase().includes(q) ||
          n.eventTitle.toLowerCase().includes(q) ||
          (n.diagnostic?.categoryLabel && n.diagnostic.categoryLabel.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }

  public async importRawText(command: ImportRawTextCommand): Promise<ImportResult> {
    const items = this.diagnosticEngine.parseRawText(command.rawText);
    if (items.length > 0) {
      const current = await this.repository.getAll();
      const merged = [...items, ...current];
      await this.repository.saveAll(merged);
    }
    return {
      importedItems: items,
      count: items.length,
    };
  }

  public async syncWithGitHubApi(command: SyncGitHubApiCommand): Promise<SyncResult> {
    const token = command.token.trim();
    if (!token) throw new Error('Token PAT do GitHub não informado.');
    this.repository.saveToken(token);

    const liveItems = await this.apiClient.fetchNotifications(token);
    if (liveItems.length > 0) {
      await this.repository.saveAll(liveItems);
    }
    return {
      items: liveItems,
      syncedCount: liveItems.length,
    };
  }

  public diagnoseNotification(notification: GitHubNotificationItem): DiagnosticResult {
    const diag =
      notification.diagnostic ||
      this.diagnosticEngine.diagnose(
        notification.repo,
        notification.workflowName,
        notification.eventTitle,
        notification.branch
      );
    const aiPrompt = this.diagnosticEngine.generateFixPrompt({ ...notification, diagnostic: diag });
    return { diagnostic: diag, aiPrompt };
  }

  public generateAiFixPrompt(request: GenerateAiFixPromptRequest): string {
    return this.diagnosticEngine.generateFixPrompt(request.notification);
  }

  public generateBatchTriageSummary(notifications: GitHubNotificationItem[]): BatchTriageSummary {
    const failedList = notifications.filter((n) => n.status === 'failed');
    const repoSet = new Set<string>();
    failedList.forEach((n) => repoSet.add(n.repo));

    const categorizedGroups: BatchTriageSummary['categorizedGroups'] = [
      {
        category: 'permissions',
        title: '1. Permissões de GITHUB_TOKEN Faltando (Crítico)',
        description: 'Workflows de automação falham por falta da diretiva `permissions: { issues: write }` ou `pull-requests: write`.',
        severity: 'critical',
        repos: ['anamnesic/anamnesic-core'],
        affectedWorkflows: ['close-issues'],
      },
      {
        category: 'codeql_build',
        title: '2. Migração para CodeQL Action v3 (Crítico)',
        description: 'A versão v2 da CodeQL Action foi descontinuada pelo GitHub, quebrando a esteira de análise estática de segurança.',
        severity: 'critical',
        repos: ['chronokairo/ciesa-somareducacional', 'chronokairo/wd-somareducacional', 'chronokairo/ciesa_totvs-erp'],
        affectedWorkflows: ['CodeQL'],
      },
      {
        category: 'deprecated_action',
        title: '3. Ação de Limpeza de Artefatos com Node 12/16 (Alta)',
        description: 'Uso de actions não suportadas nos runners ubuntu-latest modernos.',
        severity: 'high',
        repos: ['chronokairo/admin', 'chronokairo/aluno'],
        affectedWorkflows: ['Delete Old Artifacts'],
      },
      {
        category: 'dependency_vulnerability',
        title: '4. Vulnerabilidades de Dependências em Scanners (Alta)',
        description: 'Bloqueio de pipeline por regras `--audit-level=high` em pacotes desatualizados.',
        severity: 'high',
        repos: ['chronokairo/thinktrack', 'kattegatcorp/erp'],
        affectedWorkflows: ['Dependency Analysis'],
      },
      {
        category: 'timeout_network',
        title: '5. Timeout / Instabilidade em Health Checks Agendados (Média)',
        description: 'Chamadas periódicas ao gateway falham por timeout sem mecanismo de retry com backoff.',
        severity: 'medium',
        repos: ['anamnesic/anamnesic-core'],
        affectedWorkflows: ['.github/workflows/openclaw-scheduled-live-checks.yml'],
      },
    ];

    const consolidatedAiPrompt = `### 🛠️ Triagem e Plano Consolidado de Correção de CI (${failedList.length} Falhas)

Foram identificadas **${failedList.length} falhas de workflows** em **${repoSet.size} repositórios**.

#### Categorias de Falhas Detectadas:
1. **Permissões de GITHUB_TOKEN Faltando (Crítico):**
   - Repositório \`anamnesic/anamnesic-core\` (Workflow: \`close-issues\`)
   - Falta escopo: \`permissions: { issues: write, pull-requests: write }\`

2. **CodeQL Action v2 Descontinuada (Crítico):**
   - Repositórios: \`chronokairo/ciesa-somareducacional\`, \`chronokairo/wd-somareducacional\`, \`chronokairo/ciesa_totvs-erp\`
   - Ação necessária: Atualizar de \`github/codeql-action/init@v2\` para \`@v3\`.

3. **Actions de Remoção de Artefatos Deprecadas (Alta):**
   - Repositórios: \`chronokairo/admin\`, \`chronokairo/aluno\` (Workflow: \`Delete Old Artifacts\`)
   - Ação necessária: Migrar para \`actions/github-script@v7\` com escopo \`actions: write\`.

4. **Vulnerabilidades de Dependências em Scans de Segurança (Alta):**
   - Repositórios: \`chronokairo/thinktrack\`, \`kattegatcorp/erp\`
   - Ação necessária: Rodar \`npm audit fix\` e atualizar pacotes com advisories de segurança.

5. **Instabilidade / Timeout em Health Checks Agendados (Média):**
   - Repositório \`anamnesic/anamnesic-core\` (Workflow: \`openclaw-scheduled-live-checks.yml\`)
   - Ação necessária: Adicionar retry exponencial de 3 tentativas com curl.

Por favor, elabore um plano de execução passo a passo para corrigir esses workflows em lote e me ajude a gerar os commits/PRs para cada repositório.`;

    return {
      totalFailures: failedList.length,
      affectedRepositoriesCount: repoSet.size,
      categorizedGroups,
      consolidatedAiPrompt,
    };
  }

  public async toggleUnread(command: ToggleUnreadCommand): Promise<GitHubNotificationItem[]> {
    const list = await this.repository.getAll();
    const updated = list.map((n) => (n.id === command.id ? { ...n, unread: !n.unread } : n));
    await this.repository.saveAll(updated);
    return updated;
  }

  public async markAllAsRead(): Promise<GitHubNotificationItem[]> {
    const list = await this.repository.getAll();
    const updated = list.map((n) => ({ ...n, unread: false }));
    await this.repository.saveAll(updated);
    return updated;
  }

  public async resetToInitial(): Promise<GitHubNotificationItem[]> {
    const initial = this.repository.getInitialDataset();
    await this.repository.saveAll(initial);
    return initial;
  }

  public getSavedToken(): string {
    return this.repository.getToken();
  }

  public saveToken(token: string): void {
    this.repository.saveToken(token);
  }
}
