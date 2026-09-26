import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import type { AiExecutionMode, AiToolCall, AiToolDefinition, GitHubActionRunDTO, GitHubIssueDTO, GitHubPullRequestDTO, IWorkspaceGateway } from '../../core/application/ports/out/IGateways';

const REPOSITORY_PATTERN = /^chronokairo\/[A-Za-z0-9_.-]+$/i;
const MAX_FILE_SIZE = 512 * 1024;

function safeRepo(repoFullName: unknown) {
  if (typeof repoFullName !== 'string' || !REPOSITORY_PATTERN.test(repoFullName)) throw new Error('Repo inválido. Use chronokairo/<repo>.');
  return repoFullName;
}

function safeRelativePath(value: unknown, repoFullName?: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Informe filePath relativo à raiz do clone (ex.: .github/workflows/ci.yml).');
  // A IA frequentemente envia caminhos absolutos ou prefixados com o nome do repo.
  // Normalizamos para relativo à raiz do clone antes de validar; o confinamento real
  // continua garantido em readFile via absolute.startsWith(root).
  let candidate = value.trim().replaceAll('\\', '/');
  if (repoFullName) {
    const repoName = repoFullName.split('/').pop() ?? '';
    // Remove prefixos como "chronokairo/thinktrack/" ou ".../repos/chronokairo-thinktrack/".
    const prefixes = [`${repoFullName}/`, repoName ? `${repoName}/` : ''].filter(Boolean);
    for (const prefix of prefixes) {
      const index = candidate.indexOf(prefix);
      if (index !== -1) { candidate = candidate.slice(index + prefix.length); break; }
    }
  }
  candidate = candidate.replace(/^\.\//, '').replace(/^\/+/, '');
  const normalized = candidate.replaceAll('\\', '/');
  const isGitMetadata = normalized === '.git' || normalized.startsWith('.git/');
  if (!candidate) throw new Error('Informe filePath relativo à raiz do clone (ex.: .github/workflows/ci.yml).');
  if (path.isAbsolute(candidate)) throw new Error(`Caminho não permitido: use um caminho relativo à raiz do clone, sem "${candidate}" absoluto. Ex.: .github/workflows/ci.yml.`);
  if (candidate.includes('..')) throw new Error('Caminho não permitido: não use ".." para sair da raiz do clone.');
  if (isGitMetadata) throw new Error('Caminho não permitido: os metadados .git/ não são legíveis.');
  if (normalized.includes('node_modules')) throw new Error('Caminho não permitido: node_modules está fora do escopo.');
  if (/^\.env/i.test(path.basename(candidate))) throw new Error('Caminho não permitido: arquivos .env contêm secrets e não são legíveis.');
  return candidate;
}

function safeBranch(value: unknown) {
  if (typeof value !== 'string' || !value || !/^[A-Za-z0-9._/-]+$/.test(value) || value.startsWith('-') || value.includes('..')) throw new Error('Branch inválida.');
  return value;
}

function redact(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(/(token|secret|password|api[_-]?key|authorization)\s*[:=]\s*[^\s,}]+/gi, '$1=[REDACTED]');
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [/token|secret|password|key|authorization/i.test(key) ? key : key, /token|secret|password|key|authorization/i.test(key) ? '[REDACTED]' : redact(item)]));
  return value;
}

export class AiToolRegistry {
  readonly definitions: AiToolDefinition[] = [
    { name: 'list_repositories', description: 'Lista os repositórios da organização chronokairo, indicando quais estão clonados no workspace local.', risk: 'read', parameters: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'list_notifications', description: 'Lista Issues, PRs ou execuções Actions dos repositórios clonados.', risk: 'read', parameters: { type: 'object', properties: { kind: { type: 'string', enum: ['issues', 'prs', 'actions'] }, repoFullName: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] } }, required: ['kind'], additionalProperties: false } },
    { name: 'inspect_repository', description: 'Inspeciona o contexto local de um repositório clonado.', risk: 'diagnostic', parameters: { type: 'object', properties: { repoFullName: { type: 'string' } }, required: ['repoFullName'], additionalProperties: false } },
    { name: 'search_repository', description: 'Busca texto em arquivos do clone, ignorando dependências e secrets.', risk: 'read', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, query: { type: 'string', minLength: 1, maxLength: 200 } }, required: ['repoFullName', 'query'], additionalProperties: false } },
    { name: 'read_repository_file', description: 'Lê um arquivo permitido do clone local.', risk: 'read', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, filePath: { type: 'string' } }, required: ['repoFullName', 'filePath'], additionalProperties: false } },
    { name: 'git_status', description: 'Consulta branch atual e alterações locais do clone.', risk: 'diagnostic', parameters: { type: 'object', properties: { repoFullName: { type: 'string' } }, required: ['repoFullName'], additionalProperties: false } },
    { name: 'switch_branch', description: 'Propõe trocar a branch atual no clone local.', risk: 'write', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, branch: { type: 'string' } }, required: ['repoFullName', 'branch'], additionalProperties: false } },
    { name: 'merge_branch', description: 'Propõe mesclar uma branch local na branch atualmente ativa.', risk: 'write', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, branch: { type: 'string' } }, required: ['repoFullName', 'branch'], additionalProperties: false } },
    { name: 'create_branch', description: 'Propõe a criação de uma branch de trabalho no clone.', risk: 'write', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, branch: { type: 'string', pattern: '^[A-Za-z0-9._/-]+$' } }, required: ['repoFullName', 'branch'], additionalProperties: false } },
    { name: 'apply_patch', description: 'Propõe a aplicação de um patch unified diff no clone.', risk: 'write', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, patch: { type: 'string', minLength: 1, maxLength: 100000 } }, required: ['repoFullName', 'patch'], additionalProperties: false } },
    { name: 'commit_changes', description: 'Propõe um commit com arquivos explicitamente indicados.', risk: 'write', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, message: { type: 'string', minLength: 5, maxLength: 120 }, files: { type: 'array', items: { type: 'string' }, maxItems: 100 } }, required: ['repoFullName', 'message', 'files'], additionalProperties: false } },
    { name: 'push_branch', description: 'Propõe o push da branch atual para o remote origin. A publicação exige aprovação explícita.', risk: 'publish', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, branch: { type: 'string' } }, required: ['repoFullName', 'branch'], additionalProperties: false } },
    { name: 'create_pull_request', description: 'Propõe a abertura de um Pull Request para a branch base.', risk: 'publish', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, title: { type: 'string', minLength: 5, maxLength: 200 }, body: { type: 'string', maxLength: 10000 }, head: { type: 'string' }, base: { type: 'string' } }, required: ['repoFullName', 'title', 'body', 'head', 'base'], additionalProperties: false } },
    { name: 'update_pull_request', description: 'Propõe fechar ou reabrir um Pull Request existente.', risk: 'write', parameters: { type: 'object', properties: { repoFullName: { type: 'string' }, number: { type: 'number' }, state: { type: 'string', enum: ['open', 'closed'] } }, required: ['repoFullName', 'number', 'state'], additionalProperties: false } },
  ];

  constructor(private readonly workspace: IWorkspaceGateway, private readonly issues?: { listIssues(repo: string): Promise<GitHubIssueDTO[]> }, private readonly pulls?: { listPullRequests(repo: string): Promise<GitHubPullRequestDTO[]>; createPullRequest?: (repo: string, input: { title: string; body: string; head: string; base: string }) => Promise<GitHubPullRequestDTO>; updatePullRequest?: (repo: string, number: number, input: { state?: 'open' | 'closed' }) => Promise<GitHubPullRequestDTO> }, private readonly actions?: { listActionRuns(repo: string): Promise<GitHubActionRunDTO[]> }) {}

  definitionsForMode(mode: AiExecutionMode) {
    return mode === 'strategy' ? this.definitions.filter((definition) => definition.risk === 'read' || definition.risk === 'diagnostic') : this.definitions;
  }

  async execute(call: AiToolCall, context?: { repoFullName: string; branch: string }, options: { approved?: boolean; mode?: AiExecutionMode } = {}) {
    const definition = this.definitions.find((item) => item.name === call.name);
    if (!definition) throw new Error(`Tool não permitida: ${call.name}.`);
    const requestedRepo = call.arguments.repoFullName;
    if (context && requestedRepo && requestedRepo !== context.repoFullName) throw new Error(`Tool bloqueada: o agente está preso a ${context.repoFullName}.`);
    const scopedArguments = context && !requestedRepo ? { ...call.arguments, repoFullName: context.repoFullName } : call.arguments;
    if (['write', 'publish'].includes(definition.risk) && !options.approved && !(options.mode === 'auto' && definition.risk === 'write')) return { callId: call.id, tool: call.name, risk: definition.risk, approvalRequired: true, preview: redact(scopedArguments) };
    const data = call.name === 'list_repositories' ? await this.listRepositories() : call.name === 'list_notifications' ? await this.listNotifications(scopedArguments) : call.name === 'inspect_repository' ? await this.inspectRepository(scopedArguments) : call.name === 'search_repository' ? await this.searchRepository(scopedArguments) : call.name === 'read_repository_file' ? await this.readFile(scopedArguments) : call.name === 'git_status' ? await this.gitStatus(scopedArguments) : call.name === 'switch_branch' ? await this.switchBranch(scopedArguments) : call.name === 'merge_branch' ? await this.mergeBranch(scopedArguments) : call.name === 'create_branch' ? await this.createBranch(scopedArguments) : call.name === 'apply_patch' ? await this.applyPatch(scopedArguments) : call.name === 'commit_changes' ? await this.commitChanges(scopedArguments) : call.name === 'push_branch' ? await this.pushBranch(scopedArguments) : call.name === 'create_pull_request' ? await this.createPullRequest(scopedArguments) : await this.updatePullRequest(scopedArguments);
    return { callId: call.id, tool: call.name, risk: definition.risk, data: redact(data) };
  }

  private async listRepositories() {
    const repos = await this.workspace.listOrganizationRepositories('chronokairo');
    return repos.map((repo) => ({ repoFullName: repo.repoFullName, cloned: repo.cloned, defaultBranch: repo.defaultBranch, currentBranch: repo.clone?.currentBranch ?? null }));
  }

  private async listNotifications(args: Record<string, unknown>) {
    const kind = args.kind;
    const repos = (await this.workspace.listOrganizationRepositories('chronokairo')).filter((repo) => repo.cloned && (!args.repoFullName || repo.repoFullName === args.repoFullName));
    const data = await Promise.all(repos.map(async (repo) => ({ repoFullName: repo.repoFullName, items: kind === 'issues' ? await this.issues?.listIssues(repo.repoFullName) : kind === 'prs' ? await this.pulls?.listPullRequests(repo.repoFullName) : await this.actions?.listActionRuns(repo.repoFullName) })));
    return data;
  }

  private async inspectRepository(args: Record<string, unknown>) {
    const repo = safeRepo(args.repoFullName);
    const clone = (await this.workspace.listClones()).find((item) => item.repoFullName === repo);
    if (!clone) throw new Error('O repositório não está clonado no workspace.');
    return { repoFullName: repo, currentBranch: clone.currentBranch, latestCommitAt: clone.latestCommitAt, documents: await this.workspace.listDocumentation(repo) };
  }

  private async readFile(args: Record<string, unknown>) {
    const repo = safeRepo(args.repoFullName); const filePath = safeRelativePath(args.filePath, repo);
    const clone = (await this.workspace.listClones()).find((item) => item.repoFullName === repo);
    if (!clone) throw new Error('O repositório não está clonado no workspace.');
    const root = path.resolve(clone.path); const absolute = path.resolve(root, filePath);
    if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error('Caminho não permitido: o arquivo resolvido fica fora da raiz do clone.');
    if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new Error(`Arquivo não encontrado: "${filePath}" não existe no clone de ${repo}. Confira o caminho relativo à raiz (use search_repository para localizar).`);
    if (statSync(absolute).size > MAX_FILE_SIZE) throw new Error('Arquivo excede o limite de leitura.');
    return { repoFullName: repo, filePath, content: readFileSync(absolute, 'utf8') };
  }

  private async searchRepository(args: Record<string, unknown>) {
    const repo = safeRepo(args.repoFullName); const query = typeof args.query === 'string' ? args.query : '';
    if (!query || query.length > 200) throw new Error('Busca inválida.');
    const clone = (await this.workspace.listClones()).find((item) => item.repoFullName === repo); if (!clone) throw new Error('O repositório não está clonado no workspace.');
    const matches: Array<{ filePath: string; line: number; text: string }> = []; const walk = (directory: string, depth: number) => { if (depth > 5 || matches.length >= 50) return; for (const entry of readdirSync(directory, { withFileTypes: true })) { if (['.git', 'node_modules', 'dist', 'build', '.next'].includes(entry.name) || /^\.env/i.test(entry.name)) continue; const absolute = path.join(directory, entry.name); if (entry.isDirectory()) walk(absolute, depth + 1); else if (entry.isFile() && statSync(absolute).size <= MAX_FILE_SIZE) { const content = readFileSync(absolute, 'utf8'); content.split(/\r?\n/).forEach((text, index) => { if (matches.length < 50 && text.toLowerCase().includes(query.toLowerCase())) matches.push({ filePath: path.relative(clone.path, absolute).split(path.sep).join('/'), line: index + 1, text: text.slice(0, 400) }); }); } } }; walk(clone.path, 0); return { repoFullName: repo, query, matches }; 
  }

  private cloneRoot(repoFullName: unknown) {
    const repo = safeRepo(repoFullName); const clone = this.workspace.listClones();
    return clone.then((items) => { const item = items.find((entry) => entry.repoFullName === repo); if (!item) throw new Error('O repositório não está clonado no workspace.'); return { repo, root: path.resolve(item.path) }; });
  }

  private async createBranch(args: Record<string, unknown>) {
    const { repo, root } = await this.cloneRoot(args.repoFullName); const branch = typeof args.branch === 'string' ? args.branch : '';
    if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith('/') || branch.endsWith('/')) throw new Error('Nome de branch inválido.');
    execFileSync('git', ['switch', '-c', branch], { cwd: root, encoding: 'utf8', timeout: 15000 });
    return { repoFullName: repo, branch, status: 'created' };
  }

  private async gitStatus(args: Record<string, unknown>) {
    const { repo, root } = await this.cloneRoot(args.repoFullName);
    const branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8', timeout: 15000 }).trim();
    const status = execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8', timeout: 15000 }).trim();
    return { repoFullName: repo, branch, clean: !status, status };
  }

  private async switchBranch(args: Record<string, unknown>) {
    const { repo, root } = await this.cloneRoot(args.repoFullName); const branch = safeBranch(args.branch);
    execFileSync('git', ['switch', branch], { cwd: root, encoding: 'utf8', timeout: 15000 });
    return { repoFullName: repo, branch, status: 'switched' };
  }

  private async mergeBranch(args: Record<string, unknown>) {
    const { repo, root } = await this.cloneRoot(args.repoFullName); const branch = safeBranch(args.branch);
    const current = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8', timeout: 15000 }).trim();
    if (!current) throw new Error('Não é possível mesclar em estado detached HEAD.');
    execFileSync('git', ['merge', '--no-edit', branch], { cwd: root, encoding: 'utf8', timeout: 120000 });
    const hash = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', timeout: 15000 }).trim();
    return { repoFullName: repo, currentBranch: current, mergedBranch: branch, hash, status: 'merged' };
  }

  private async applyPatch(args: Record<string, unknown>) {
    const { repo, root } = await this.cloneRoot(args.repoFullName); const patch = typeof args.patch === 'string' ? args.patch : '';
    if (!patch || patch.length > 100000 || patch.includes('.env') || patch.includes('node_modules')) throw new Error('Patch inválido ou contém caminho protegido.');
    const normalizedPatch = patch.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
    try {
      execFileSync('git', ['apply', '--check', '--recount', '--whitespace=fix', '-'], { cwd: root, input: normalizedPatch, encoding: 'utf8', timeout: 15000 });
      execFileSync('git', ['apply', '--recount', '--whitespace=fix', '-'], { cwd: root, input: normalizedPatch, encoding: 'utf8', timeout: 15000 });
    } catch (error) {
      const detail = error && typeof error === 'object' && 'stderr' in error && typeof error.stderr === 'string' ? error.stderr.trim() : 'o contexto do arquivo mudou';
      throw new Error(`Patch não aplicado em ${repo}: ${detail}. Leia novamente o arquivo atual e gere um patch contra esse conteúdo antes de tentar outra vez.`);
    }
    return { repoFullName: repo, status: 'patched', normalized: normalizedPatch !== patch, patch: normalizedPatch.slice(0, 100000) };
  }

  private async commitChanges(args: Record<string, unknown>) {
    const { repo, root } = await this.cloneRoot(args.repoFullName); const message = typeof args.message === 'string' ? args.message.trim() : ''; const files = Array.isArray(args.files) ? args.files : [];
    if (message.length < 5 || message.length > 120 || !files.length || files.length > 100) throw new Error('Commit inválido: informe mensagem e arquivos.');
    const safeFiles = files.map((file) => safeRelativePath(file, repo));
    execFileSync('git', ['add', '--', ...safeFiles], { cwd: root, encoding: 'utf8', timeout: 15000 });
    execFileSync('git', ['commit', '-m', message], { cwd: root, encoding: 'utf8', timeout: 30000 });
    const hash = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', timeout: 15000 }).trim();
    return { repoFullName: repo, hash, message, files: safeFiles, status: 'committed' };
  }

  private async pushBranch(args: Record<string, unknown>) {
    const { repo, root } = await this.cloneRoot(args.repoFullName); const branch = typeof args.branch === 'string' ? args.branch : '';
    const current = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8', timeout: 15000 }).trim();
    if (!branch || branch !== current || !/^[A-Za-z0-9._/-]+$/.test(branch)) throw new Error('Push bloqueado: a branch informada precisa ser a branch atual e válida.');
    execFileSync('git', ['push', 'origin', branch], { cwd: root, encoding: 'utf8', timeout: 120000 });
    return { repoFullName: repo, branch, status: 'pushed' };
  }

  private async createPullRequest(args: Record<string, unknown>) {
    const repo = safeRepo(args.repoFullName); if (!this.pulls || typeof this.pulls.createPullRequest !== 'function') throw new Error('Provider não permite criar Pull Requests.');
    const title = typeof args.title === 'string' ? args.title.trim() : ''; const body = typeof args.body === 'string' ? args.body : ''; const head = typeof args.head === 'string' ? args.head : ''; const base = typeof args.base === 'string' ? args.base : '';
    if (!title || !head || !base) throw new Error('Dados de Pull Request inválidos.');
    return this.pulls.createPullRequest(repo, { title, body, head, base });
  }

  private async updatePullRequest(args: Record<string, unknown>) {
    const repo = safeRepo(args.repoFullName); const number = typeof args.number === 'number' ? args.number : Number(args.number); const state = args.state === 'closed' ? 'closed' : args.state === 'open' ? 'open' : null;
    if (!Number.isInteger(number) || number < 1 || !state || !this.pulls || typeof this.pulls.updatePullRequest !== 'function') throw new Error('Dados inválidos ou provider não permite atualizar PRs.');
    return this.pulls.updatePullRequest(repo, number, { state });
  }
}
