import {
    getDatabase,
    ProjectService,
    ContextService,
    DecisionService,
    PipelineService,
    exportProject,
    getExportFilename,
} from '@anamnesic/core';
import type { ExportFormat } from '@anamnesic/core';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

let _projectService: ProjectService | null = null;
let _contextService: ContextService | null = null;
let _decisionService: DecisionService | null = null;

const pipelineService = new PipelineService();

async function services() {
    if (!_projectService) {
        const db = await getDatabase();
        _projectService = new ProjectService(db);
        _contextService = new ContextService(db);
        _decisionService = new DecisionService(db);
    }
    return {
        projectService: _projectService!,
        contextService: _contextService!,
        decisionService: _decisionService!,
    };
}

export function registerProjectEndpoints(server: any) {
    // ─── Projects ────────────────────────────────────────────────

    server.tool(
        'list_projects',
        'List all Anamnesic projects.',
        {},
        async () => {
            const { projectService } = await services();
            const projects = await projectService.list();
            return { content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }] };
        }
    );

    server.tool(
        'get_project',
        'Get a project by ID.',
        { id: z.string().describe('Project ID') },
        async ({ id }: { id: string }) => {
            const { projectService } = await services();
            const project = await projectService.get(id);
            if (!project) return { content: [{ type: 'text', text: `Project not found: ${id}` }] };
            return { content: [{ type: 'text', text: JSON.stringify(project, null, 2) }] };
        }
    );

    server.tool(
        'create_project',
        'Create a new Anamnesic project.',
        {
            name: z.string().describe('Project name'),
            description: z.string().optional().describe('Project description'),
            workspace: z.string().optional().describe('Absolute path to workspace folder to link'),
        },
        async ({ name, description, workspace }: { name: string; description?: string; workspace?: string }) => {
            const { projectService } = await services();
            const project = await projectService.create({ name, description });
            if (workspace) {
                await projectService.linkWorkspace(project.id, workspace);
            }
            return { content: [{ type: 'text', text: `Project created: ${project.name} (${project.id})` }] };
        }
    );

    server.tool(
        'update_project',
        'Update an existing project name or description.',
        {
            id: z.string().describe('Project ID'),
            name: z.string().optional().describe('New name'),
            description: z.string().optional().describe('New description'),
        },
        async ({ id, name, description }: { id: string; name?: string; description?: string }) => {
            const { projectService } = await services();
            await projectService.update(id, { name, description });
            return { content: [{ type: 'text', text: `Project updated: ${id}` }] };
        }
    );

    server.tool(
        'delete_project',
        'Delete a project by ID.',
        { id: z.string().describe('Project ID') },
        async ({ id }: { id: string }) => {
            const { projectService } = await services();
            await projectService.delete(id);
            return { content: [{ type: 'text', text: `Project deleted: ${id}` }] };
        }
    );

    server.tool(
        'find_project_by_workspace',
        'Find a project linked to a specific workspace directory. Returns the project if found, or null. Useful for auto-detecting which project belongs to the current workspace.',
        {
            workspace: z.string().describe('Absolute path to the workspace directory'),
        },
        async ({ workspace }: { workspace: string }) => {
            const { projectService } = await services();
            const project = await projectService.findByWorkspace(workspace);
            if (!project) {
                return { content: [{ type: 'text', text: `No project linked to workspace: ${workspace}` }] };
            }
            return { content: [{ type: 'text', text: JSON.stringify(project, null, 2) }] };
        }
    );

    server.tool(
        'link_workspace',
        'Link an existing project to a workspace directory. This allows find_project_by_workspace to discover the project automatically.',
        {
            projectId: z.string().describe('Project ID'),
            workspace: z.string().describe('Absolute path to the workspace directory'),
        },
        async ({ projectId, workspace }: { projectId: string; workspace: string }) => {
            const { projectService } = await services();
            await projectService.linkWorkspace(projectId, workspace);
            return { content: [{ type: 'text', text: `Project ${projectId} linked to workspace: ${workspace}` }] };
        }
    );

    // ─── Context ─────────────────────────────────────────────────

    server.tool(
        'list_context',
        'List context entries for a project, optionally filtered by category.',
        {
            projectId: z.string().describe('Project ID'),
            category: z.string().optional().describe('Category filter (architecture, requirements, dependencies, standards, general)'),
        },
        async ({ projectId, category }: { projectId: string; category?: string }) => {
            const { contextService } = await services();
            const items = await contextService.listByProject(projectId, category);
            return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
        }
    );

    server.tool(
        'search_context',
        'Search context entries for a project by keyword.',
        {
            projectId: z.string().describe('Project ID'),
            query: z.string().describe('Search query'),
        },
        async ({ projectId, query }: { projectId: string; query: string }) => {
            const { contextService } = await services();
            const items = await contextService.search(projectId, query);
            return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
        }
    );

    server.tool(
        'add_context',
        'Add a context entry to a project.',
        {
            projectId: z.string().describe('Project ID'),
            key: z.string().describe('Short label for this context'),
            value: z.string().describe('Context content/value'),
            category: z.enum(['architecture', 'requirements', 'dependencies', 'standards', 'general']).describe('Category'),
            priority: z.number().optional().describe('Priority (1=low, 2=normal, 3=high). Default 1.'),
        },
        async ({ projectId, key, value, category, priority }: {
            projectId: string; key: string; value: string;
            category: 'architecture' | 'requirements' | 'dependencies' | 'standards' | 'general';
            priority?: number;
        }) => {
            const { contextService } = await services();
            const item = await contextService.create({ projectId, key, value, category, priority });
            return { content: [{ type: 'text', text: `Context added: [${category}] ${key} (${item.id})` }] };
        }
    );

    server.tool(
        'bulk_add_context',
        'Add multiple context entries to a project in a single call.',
        {
            projectId: z.string().describe('Project ID'),
            entries: z.array(z.object({
                key: z.string().describe('Short label'),
                value: z.string().describe('Context content'),
                category: z.enum(['architecture', 'requirements', 'dependencies', 'standards', 'general']),
                priority: z.number().optional(),
            })).describe('Array of context entries to add'),
        },
        async ({ projectId, entries }: {
            projectId: string;
            entries: Array<{ key: string; value: string; category: string; priority?: number }>;
        }) => {
            const { contextService } = await services();
            const results: string[] = [];
            for (const entry of entries) {
                const item = await contextService.create({
                    projectId,
                    key: entry.key,
                    value: entry.value,
                    category: entry.category,
                    priority: entry.priority,
                });
                results.push(`[${entry.category}] ${entry.key} (${item.id})`);
            }
            return { content: [{ type: 'text', text: `Added ${results.length} context entries:\n${results.join('\n')}` }] };
        }
    );

    server.tool(
        'update_context',
        'Update an existing context entry.',
        {
            id: z.string().describe('Context entry ID'),
            key: z.string().optional().describe('New key/label'),
            value: z.string().optional().describe('New value'),
            category: z.enum(['architecture', 'requirements', 'dependencies', 'standards', 'general']).optional(),
            priority: z.number().optional(),
        },
        async ({ id, key, value, category, priority }: {
            id: string; key?: string; value?: string;
            category?: 'architecture' | 'requirements' | 'dependencies' | 'standards' | 'general';
            priority?: number;
        }) => {
            const { contextService } = await services();
            await contextService.update(id, { key, value, category, priority });
            return { content: [{ type: 'text', text: `Context updated: ${id}` }] };
        }
    );

    server.tool(
        'delete_context',
        'Delete a context entry by ID.',
        { id: z.string().describe('Context entry ID') },
        async ({ id }: { id: string }) => {
            const { contextService } = await services();
            await contextService.delete(id);
            return { content: [{ type: 'text', text: `Context deleted: ${id}` }] };
        }
    );

    server.tool(
        'search_all_projects',
        'Search context entries across ALL projects by keyword. Useful for finding information without knowing which project it belongs to.',
        {
            query: z.string().describe('Search query / keyword'),
        },
        async ({ query }: { query: string }) => {
            const { projectService, contextService } = await services();
            const projects = await projectService.list();
            const results: Array<{ project: string; projectId: string; matches: any[] }> = [];

            for (const project of projects) {
                const matches = await contextService.search(project.id, query);
                if (matches.length > 0) {
                    results.push({ project: project.name, projectId: project.id, matches });
                }
            }

            if (results.length === 0) {
                return { content: [{ type: 'text', text: `No results found for "${query}" across ${projects.length} projects.` }] };
            }

            return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
        }
    );

    // ─── Decisions ───────────────────────────────────────────────

    server.tool(
        'list_decisions',
        'List architectural decisions recorded for a project.',
        { projectId: z.string().describe('Project ID') },
        async ({ projectId }: { projectId: string }) => {
            const { decisionService } = await services();
            const items = await decisionService.listByProject(projectId);
            return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
        }
    );

    server.tool(
        'add_decision',
        'Record an architectural decision for a project.',
        {
            projectId: z.string().describe('Project ID'),
            title: z.string().describe('Short title of the decision'),
            description: z.string().describe('What was decided and why'),
        },
        async ({ projectId, title, description }: { projectId: string; title: string; description: string }) => {
            const { decisionService } = await services();
            const item = await decisionService.create({ projectId, title, description });
            return { content: [{ type: 'text', text: `Decision recorded: ${title} (${item.id})` }] };
        }
    );

    server.tool(
        'update_decision',
        'Update an architectural decision.',
        {
            id: z.string().describe('Decision ID'),
            title: z.string().optional(),
            description: z.string().optional(),
        },
        async ({ id, title, description }: { id: string; title?: string; description?: string }) => {
            const { decisionService } = await services();
            await decisionService.update(id, { title, description });
            return { content: [{ type: 'text', text: `Decision updated: ${id}` }] };
        }
    );

    server.tool(
        'delete_decision',
        'Delete an architectural decision by ID.',
        { id: z.string().describe('Decision ID') },
        async ({ id }: { id: string }) => {
            const { decisionService } = await services();
            await decisionService.delete(id);
            return { content: [{ type: 'text', text: `Decision deleted: ${id}` }] };
        }
    );

    // ─── Export / Sync ────────────────────────────────────────────

    server.tool(
        'export_project',
        'Export a project context to a specific format. Returns the file content as text.',
        {
            projectId: z.string().describe('Project ID'),
            format: z.enum(['markdown', 'json', 'plain', 'copilot', 'claude', 'cursor']).describe('Export format'),
        },
        async ({ projectId, format }: { projectId: string; format: ExportFormat }) => {
            const { projectService } = await services();
            const project = await projectService.get(projectId);
            if (!project) return { content: [{ type: 'text', text: `Project not found: ${projectId}` }] };
            const content = exportProject(project, format);
            return { content: [{ type: 'text', text: content }] };
        }
    );

    server.tool(
        'sync_context_files',
        'Write context export files (copilot-instructions, CLAUDE.md, .cursorrules) to the workspace directory.',
        {
            projectId: z.string().describe('Project ID'),
            workspaceRoot: z.string().describe('Absolute path to the workspace root directory'),
        },
        async ({ projectId, workspaceRoot }: { projectId: string; workspaceRoot: string }) => {
            const { projectService } = await services();
            const project = await projectService.get(projectId);
            if (!project) return { content: [{ type: 'text', text: `Project not found: ${projectId}` }] };

            const formats: ExportFormat[] = ['copilot', 'claude', 'cursor'];
            const written: string[] = [];

            for (const fmt of formats) {
                const content = exportProject(project, fmt);
                const filename = getExportFilename(fmt, project.name);
                const targetPath = path.join(workspaceRoot, filename);
                const dir = path.dirname(targetPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(targetPath, content, 'utf-8');
                written.push(filename);
            }

            return { content: [{ type: 'text', text: `Synced: ${written.join(', ')}` }] };
        }
    );

    // ─── Pipelines ───────────────────────────────────────────────

    server.tool(
        'list_pipelines',
        'List all pipelines for a project.',
        { projectId: z.string().describe('Project ID') },
        async ({ projectId }: { projectId: string }) => {
            const pipelines = pipelineService.list(projectId);
            return { content: [{ type: 'text', text: JSON.stringify(pipelines, null, 2) }] };
        }
    );

    server.tool(
        'get_active_pipeline',
        'Get the currently active pipeline for a project.',
        { projectId: z.string().describe('Project ID') },
        async ({ projectId }: { projectId: string }) => {
            const pipeline = pipelineService.getActive(projectId);
            if (!pipeline) return { content: [{ type: 'text', text: 'No active pipeline.' }] };
            return { content: [{ type: 'text', text: JSON.stringify(pipeline, null, 2) }] };
        }
    );

    server.tool(
        'create_pipeline',
        'Create a new pipeline for a project.',
        {
            projectId: z.string().describe('Project ID'),
            objective: z.string().describe('What should be built / the pipeline objective'),
            workspace: z.string().optional().describe('Absolute path to the workspace root'),
        },
        async ({ projectId, objective, workspace }: { projectId: string; objective: string; workspace?: string }) => {
            const pipeline = pipelineService.create(projectId, objective, workspace ?? '');
            return { content: [{ type: 'text', text: `Pipeline created: ${pipeline.id} — "${pipeline.objective}"` }] };
        }
    );

    server.tool(
        'batch_create_pipelines',
        'Create multiple pipelines for a project in a single call. Useful for setting up a swarm of AIs to work on different aspects of the project simultaneously.',
        {
            projectId: z.string().describe('Project ID'),
            workspace: z.string().optional().describe('Absolute path to the workspace root'),
            pipelines: z.array(z.object({
                objective: z.string().describe('What should be built / the pipeline objective'),
            })).describe('Array of pipelines to create, each with an objective'),
        },
        async ({ projectId, workspace, pipelines: pipelineDefs }: {
            projectId: string; workspace?: string;
            pipelines: Array<{ objective: string }>;
        }) => {
            const results: string[] = [];
            for (const def of pipelineDefs) {
                const pipeline = pipelineService.create(projectId, def.objective, workspace ?? '');
                results.push(`${pipeline.id}: ${pipeline.objective}`);
            }
            return {
                content: [{
                    type: 'text',
                    text: `Created ${results.length} pipelines:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
                }],
            };
        }
    );

    server.tool(
        'approve_pipeline_phase',
        'Approve the current phase of the active pipeline, advancing to the next.',
        {
            projectId: z.string().describe('Project ID'),
            pipelineId: z.string().describe('Pipeline ID'),
        },
        async ({ projectId, pipelineId }: { projectId: string; pipelineId: string }) => {
            const updated = pipelineService.approvePhase(projectId, pipelineId);
            if (!updated) return { content: [{ type: 'text', text: 'Pipeline not found or phase approval failed.' }] };
            const nextPhase = updated.phases[updated.currentPhase];
            const msg = updated.status === 'completed'
                ? 'Pipeline completed! All phases done.'
                : `Phase approved. Next: ${nextPhase?.name ?? 'unknown'}`;
            return { content: [{ type: 'text', text: msg }] };
        }
    );

    server.tool(
        'reject_pipeline_phase',
        'Reject the current phase of the active pipeline with feedback.',
        {
            projectId: z.string().describe('Project ID'),
            pipelineId: z.string().describe('Pipeline ID'),
            feedback: z.string().describe('What needs to be changed or improved'),
        },
        async ({ projectId, pipelineId, feedback }: { projectId: string; pipelineId: string; feedback: string }) => {
            pipelineService.rejectPhase(projectId, pipelineId, feedback);
            return { content: [{ type: 'text', text: 'Phase rejected. Agents will redo with the provided feedback.' }] };
        }
    );

    // ─── Create Project from Template ────────────────────────────

    server.tool(
        'create_project_from_template',
        'Create a new project pre-populated with context entries from a template. Templates: "web-app", "api", "monorepo", "library", "empty".',
        {
            name: z.string().describe('Project name'),
            template: z.enum(['web-app', 'api', 'monorepo', 'library', 'empty']).describe('Template type'),
            description: z.string().optional().describe('Project description'),
            workspace: z.string().optional().describe('Absolute path to workspace folder'),
        },
        async ({ name, template, description, workspace }: {
            name: string; template: string; description?: string; workspace?: string;
        }) => {
            const { projectService, contextService } = await services();
            const project = await projectService.create({ name, description: description || `${name} (${template} template)` });
            if (workspace) {
                await projectService.linkWorkspace(project.id, workspace);
            }

            const TEMPLATES: Record<string, Array<{ key: string; value: string; category: string }>> = {
                'web-app': [
                    { key: 'stack', value: 'Frontend web application (React/Vue/Svelte + bundler)', category: 'architecture' },
                    { key: 'structure', value: 'src/ — source code\npublic/ — static assets\ntests/ — test files\ndist/ — build output', category: 'architecture' },
                    { key: 'standards', value: 'TypeScript strict mode, ESLint, Prettier, component-based architecture', category: 'standards' },
                    { key: 'testing', value: 'Unit tests with Vitest/Jest, E2E with Playwright/Cypress', category: 'requirements' },
                ],
                'api': [
                    { key: 'stack', value: 'REST/GraphQL API backend (Node.js/Express/Fastify)', category: 'architecture' },
                    { key: 'structure', value: 'src/routes/ — endpoints\nsrc/services/ — business logic\nsrc/models/ — data models\nsrc/middleware/ — middleware', category: 'architecture' },
                    { key: 'standards', value: 'TypeScript, input validation (zod), error handling middleware, request logging', category: 'standards' },
                    { key: 'security', value: 'Authentication required, rate limiting, CORS configuration, input sanitization', category: 'requirements' },
                ],
                'monorepo': [
                    { key: 'stack', value: 'Monorepo with multiple packages (pnpm workspaces / turborepo)', category: 'architecture' },
                    { key: 'structure', value: 'packages/ — individual packages\napps/ — applications\nshared/ — shared utilities\nconfigs/ — shared configs', category: 'architecture' },
                    { key: 'standards', value: 'Shared tsconfig, consistent versioning, cross-package type safety', category: 'standards' },
                    { key: 'dependencies', value: 'Workspace protocol (workspace:*), hoisted devDependencies, shared build tooling', category: 'dependencies' },
                ],
                'library': [
                    { key: 'stack', value: 'Reusable library / npm package', category: 'architecture' },
                    { key: 'structure', value: 'src/ — source code\ntests/ — test files\ndist/ — compiled output\nREADME.md — docs', category: 'architecture' },
                    { key: 'standards', value: 'TypeScript declarations, semantic versioning, tree-shakeable exports, minimal dependencies', category: 'standards' },
                    { key: 'publishing', value: 'npm publish, changelog generation, CI/CD pipeline for releases', category: 'requirements' },
                ],
                'empty': [],
            };

            const entries = TEMPLATES[template] || [];
            for (const entry of entries) {
                await contextService.create({ projectId: project.id, key: entry.key, value: entry.value, category: entry.category });
            }

            return {
                content: [{
                    type: 'text',
                    text: `Project "${name}" created from "${template}" template (${project.id}) with ${entries.length} context entries.`,
                }],
            };
        }
    );

    // ─── File tools ──────────────────────────────────────────────

    server.tool(
        'edit_file',
        'Edit a file by replacing an exact string with a new string. The old string must match exactly (including whitespace/newlines). Use read_file first to get the exact content.',
        {
            path: z.string().describe('Relative path to the file from workspace root'),
            workspaceRoot: z.string().describe('Absolute path to the workspace root'),
            oldString: z.string().describe('The exact text to find and replace (must match exactly once)'),
            newString: z.string().describe('The replacement text'),
        },
        async ({ path: filePath, workspaceRoot, oldString, newString }: {
            path: string; workspaceRoot: string; oldString: string; newString: string;
        }) => {
            const absPath = path.resolve(workspaceRoot, filePath);
            if (!absPath.startsWith(path.resolve(workspaceRoot))) {
                return { content: [{ type: 'text', text: 'Error: path traversal detected. File must be inside workspace.' }] };
            }
            if (!fs.existsSync(absPath)) {
                return { content: [{ type: 'text', text: `File not found: ${filePath}` }] };
            }
            // FIX: use split/join instead of String.replace() to avoid $ interpolation bugs
            const raw = fs.readFileSync(absPath, 'utf-8');
            const parts = raw.split(oldString);
            const occurrences = parts.length - 1;
            if (occurrences === 0) {
                return { content: [{ type: 'text', text: `Error: oldString not found in ${filePath}. Make sure it matches exactly (including whitespace).` }] };
            }
            if (occurrences > 1) {
                return { content: [{ type: 'text', text: `Error: oldString found ${occurrences} times in ${filePath}. It must match exactly once. Add more context to make it unique.` }] };
            }
            fs.writeFileSync(absPath, parts.join(newString), 'utf-8');
            return { content: [{ type: 'text', text: `File edited: ${filePath} (1 replacement applied)` }] };
        }
    );

    server.tool(
        'read_file',
        'Read the contents of a file with optional line range.',
        {
            path: z.string().describe('Relative path to the file from workspace root'),
            workspaceRoot: z.string().describe('Absolute path to the workspace root'),
            startLine: z.number().optional().describe('Start line (1-based)'),
            endLine: z.number().optional().describe('End line (1-based, inclusive)'),
        },
        async ({ path: filePath, workspaceRoot, startLine, endLine }: {
            path: string; workspaceRoot: string; startLine?: number; endLine?: number;
        }) => {
            const absPath = path.resolve(workspaceRoot, filePath);
            if (!absPath.startsWith(path.resolve(workspaceRoot))) {
                return { content: [{ type: 'text', text: 'Error: path traversal detected.' }] };
            }
            if (!fs.existsSync(absPath)) {
                return { content: [{ type: 'text', text: `File not found: ${filePath}` }] };
            }
            const content = fs.readFileSync(absPath, 'utf-8');
            const lines = content.split('\n');
            if (startLine || endLine) {
                const start = Math.max(1, startLine || 1);
                const end = Math.min(lines.length, endLine || lines.length);
                const slice = lines.slice(start - 1, end);
                const numbered = slice.map((l, i) => `${start + i}: ${l}`).join('\n');
                return { content: [{ type: 'text', text: `File: ${filePath} (lines ${start}-${end} of ${lines.length})\n\n${numbered}` }] };
            }
            return { content: [{ type: 'text', text: `File: ${filePath} (${lines.length} lines)\n\n${content}` }] };
        }
    );

    server.tool(
        'write_file',
        'Create or overwrite a file in the workspace.',
        {
            path: z.string().describe('Relative path to the file from workspace root'),
            workspaceRoot: z.string().describe('Absolute path to the workspace root'),
            content: z.string().describe('File content to write'),
        },
        async ({ path: filePath, workspaceRoot, content }: {
            path: string; workspaceRoot: string; content: string;
        }) => {
            const absPath = path.resolve(workspaceRoot, filePath);
            if (!absPath.startsWith(path.resolve(workspaceRoot))) {
                return { content: [{ type: 'text', text: 'Error: path traversal detected.' }] };
            }
            const dir = path.dirname(absPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const existed = fs.existsSync(absPath);
            fs.writeFileSync(absPath, content, 'utf-8');
            return { content: [{ type: 'text', text: `${existed ? 'File updated' : 'File created'}: ${filePath} (${content.length} bytes)` }] };
        }
    );

    server.tool(
        'list_files',
        'List files in a directory (non-recursive by default).',
        {
            path: z.string().optional().describe('Relative directory path (default: root)'),
            workspaceRoot: z.string().describe('Absolute path to the workspace root'),
            recursive: z.boolean().optional().describe('List recursively (default: false)'),
            maxDepth: z.number().optional().describe('Max depth for recursive listing (default: 3)'),
        },
        async ({ path: dirPath, workspaceRoot, recursive, maxDepth }: {
            path?: string; workspaceRoot: string; recursive?: boolean; maxDepth?: number;
        }) => {
            const absDir = path.resolve(workspaceRoot, dirPath || '.');
            if (!absDir.startsWith(path.resolve(workspaceRoot))) {
                return { content: [{ type: 'text', text: 'Error: path traversal detected.' }] };
            }
            if (!fs.existsSync(absDir)) {
                return { content: [{ type: 'text', text: `Directory not found: ${dirPath || '.'}` }] };
            }
            const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'coverage', '.cache', 'target', '.anamnesic']);
            const results: string[] = [];
            const limit = maxDepth ?? 3;

            function walk(dir: string, prefix: string, depth: number) {
                if (depth > limit) return;
                let entries: fs.Dirent[];
                try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
                entries.sort((a, b) => {
                    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
                for (const entry of entries) {
                    if (IGNORE.has(entry.name) || entry.name.startsWith('.')) continue;
                    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
                    if (entry.isDirectory()) {
                        results.push(`${rel}/`);
                        if (recursive) walk(path.join(dir, entry.name), rel, depth + 1);
                    } else {
                        results.push(rel);
                    }
                }
            }

            walk(absDir, '', 0);
            return { content: [{ type: 'text', text: results.join('\n') || '(empty directory)' }] };
        }
    );
}
