import { describe, it, expect, vi } from 'vitest';
import { extractTaskCodes, parseConventionalCommit } from '@/domain/forge';
import { GhCliGitHubAdapter } from '../gh-cli-github-adapter';
import { GlabCliGitLabAdapter } from '../glab-cli-gitlab-adapter';
import { ForgeSourceControlAdapter } from '../forge-source-control-adapter';
import { CliRunnerPort, CliExecutionResult } from '@/application/ports/cli-runner-port';
import { ForgePullRequestRepository } from '@/infrastructure/qa/forge-pull-request-repository';

describe('Forge Domain & Adapters', () => {
  it('extractTaskCodes: extracts valid task codes and filters reserved codes', () => {
    const text = 'feat(auth): SECP-01 implement rbac for TSK-4EC62792 and AUDIO-ASO-01 (ADR-0038)';
    const codes = extractTaskCodes(text);

    expect(codes).toContain('SECP-01');
    expect(codes).toContain('TSK-4EC62792');
    expect(codes).toContain('AUDIO-ASO-01');
    expect(codes).not.toContain('ADR-0038');
  });

  it('parseConventionalCommit: parses type, scope, breaking, and references', () => {
    const commit = parseConventionalCommit('feat(finance)!: implement real finance jobs (ADR-0037)');
    expect(commit).toBeDefined();
    expect(commit?.type).toBe('feat');
    expect(commit?.scope).toBe('finance');
    expect(commit?.breaking).toBe(true);
    expect(commit?.references).toContain('(ADR-0037)');
  });

  it('GhCliGitHubAdapter: parses pull requests, files, and branches via CliRunnerPort', async () => {
    const mockRunner: CliRunnerPort = {
      exec: vi.fn().mockImplementation(async (cmd: string, args: string[]): Promise<CliExecutionResult> => {
        if (args.includes('pr') && args.includes('list')) {
          return {
            ok: true,
            stdout: JSON.stringify([
              {
                number: 104,
                title: 'feat(aso): SECP-01 ASO Module',
                state: 'OPEN',
                isDraft: false,
                headRefName: 'feature/secp-01',
                baseRefName: 'main',
                author: { login: 'coder-bot' },
                url: 'https://github.com/chronokairo/ai/pull/104',
                createdAt: '2026-10-03T10:00:00Z',
                updatedAt: '2026-10-03T10:00:00Z',
                reviewDecision: 'APPROVED',
                files: [{ path: 'src/domain/aso.ts' }],
              },
            ]),
            stderr: '',
          };
        }
        if (args.some((a) => a.includes('branches'))) {
          return {
            ok: true,
            stdout: 'main\nfeature/secp-01\n',
            stderr: '',
          };
        }
        if (args.some((a) => a.includes('auth'))) {
          return {
            ok: true,
            stdout: 'Logged in to github.com account chronokairo-bot',
            stderr: '',
          };
        }
        return { ok: true, stdout: '[]', stderr: '' };
      }),
    };

    const adapter = new GhCliGitHubAdapter({ cliRunner: mockRunner });
    const auth = await adapter.getAuthStatus();
    expect(auth.authenticated).toBe(true);
    expect(auth.account).toBe('chronokairo-bot');

    const branches = await adapter.listBranches();
    expect(branches.length).toBe(2);
    expect(branches[1].taskCodes).toContain('SECP-01');

    const prs = await adapter.listPullRequests('open');
    expect(prs.length).toBe(1);
    expect(prs[0].number).toBe(104);
    expect(prs[0].filesChanged).toContain('src/domain/aso.ts');
  });

  it('GlabCliGitLabAdapter: parses merge requests and commits via CliRunnerPort', async () => {
    const mockRunner: CliRunnerPort = {
      exec: vi.fn().mockImplementation(async (cmd: string, args: string[]): Promise<CliExecutionResult> => {
        if (args.includes('mr') && args.includes('list')) {
          return {
            ok: true,
            stdout: JSON.stringify([
              {
                id: 201,
                iid: 201,
                title: 'fix(db): TSK-4EC62792 fix indexing',
                state: 'opened',
                draft: false,
                source_branch: 'fix/tsk-4ec62792',
                target_branch: 'main',
                author: { username: 'luan-bot' },
                web_url: 'https://gitlab.com/chronokairo/ai/-/merge_requests/201',
                created_at: '2026-10-03T10:00:00Z',
                updated_at: '2026-10-03T10:00:00Z',
                approvals_required: 0,
              },
            ]),
            stderr: '',
          };
        }
        if (args.includes('auth')) {
          return {
            ok: true,
            stdout: 'Logged in to gitlab.com as luan-bot',
            stderr: '',
          };
        }
        return { ok: true, stdout: '[]', stderr: '' };
      }),
    };

    const adapter = new GlabCliGitLabAdapter({ cliRunner: mockRunner });
    const auth = await adapter.getAuthStatus();
    expect(auth.authenticated).toBe(true);
    expect(auth.account).toBe('luan-bot');

    const mrs = await adapter.listMergeRequests('opened');
    expect(mrs.length).toBe(1);
    expect(mrs[0].iid).toBe(201);
    expect(mrs[0].taskCodes).toContain('TSK-4EC62792');
  });

  it('ForgeSourceControlAdapter: aggregates multi-forge activity and binds to task codes', async () => {
    const mockGithub = new GhCliGitHubAdapter({
      cliRunner: {
        exec: vi.fn().mockResolvedValue({
          ok: true,
          stdout: JSON.stringify([
            {
              number: 101,
              title: 'feat: SECP-01 token rotation',
              state: 'OPEN',
              isDraft: false,
              headRefName: 'feature/secp-01',
              baseRefName: 'main',
              author: { login: 'coder' },
              url: 'https://github.com/chronokairo/ai/pull/101',
              createdAt: '2026-10-03T10:00:00Z',
              updatedAt: '2026-10-03T10:00:00Z',
            },
          ]),
          stderr: '',
        }),
      },
    });

    const mockGitlab = new GlabCliGitLabAdapter({
      cliRunner: {
        exec: vi.fn().mockResolvedValue({
          ok: true,
          stdout: JSON.stringify([
            {
              id: 201,
              iid: 201,
              title: 'perf: TSK-4EC62792 query cache',
              state: 'opened',
              draft: false,
              source_branch: 'feature/tsk-4ec62792',
              target_branch: 'main',
              author: { username: 'luan' },
              web_url: 'https://gitlab.com/chronokairo/ai/-/merge_requests/201',
              created_at: '2026-10-03T10:00:00Z',
              updated_at: '2026-10-03T10:00:00Z',
            },
          ]),
          stderr: '',
        }),
      },
    });

    const adapter = new ForgeSourceControlAdapter({
      github: mockGithub,
      gitlab: mockGitlab,
    });

    const activity = await adapter.collectActivity(['SECP-01', 'TSK-4EC62792']);
    expect(activity.providers).toContain('github');
    expect(activity.providers).toContain('gitlab');
    expect(activity.taskEvidence['SECP-01'].isLinked).toBe(true);
    expect(activity.taskEvidence['TSK-4EC62792'].isLinked).toBe(true);
  });

  it('ForgePullRequestRepository: maps GitHub pull requests to domain model', async () => {
    const mockGithub = new GhCliGitHubAdapter({
      cliRunner: {
        exec: vi.fn().mockImplementation(async (cmd: string, args: string[]) => {
          if (args.includes('pr') && args.includes('list')) {
            return {
              ok: true,
              stdout: JSON.stringify([
                {
                  number: 104,
                  title: 'feat(aso): Módulo de Emissão de ASO',
                  state: 'OPEN',
                  isDraft: false,
                  headRefName: 'feature/aso',
                  baseRefName: 'main',
                  author: { login: 'ai-coder' },
                  files: [{ path: 'src/domain/aso.ts' }],
                },
              ]),
              stderr: '',
            };
          }
          return { ok: true, stdout: '[]', stderr: '' };
        }),
      },
    });

    const repo = new ForgePullRequestRepository({ github: mockGithub });
    const prs = await repo.listOpenPullRequests();

    expect(prs.length).toBe(1);
    expect(prs[0].id).toBe('PR-104');
    expect(prs[0].branch).toBe('feature/aso');
    expect(prs[0].filesChanged).toContain('src/domain/aso.ts');
  });
});
