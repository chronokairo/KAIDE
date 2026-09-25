/**
 * MCP Resources — Expose project data as browsable resources
 *
 * Resources allow AI assistants to discover and read project context
 * without needing to call tools. This gives AIs a "file-system-like"
 * view of all Anamnesic data.
 *
 * Static resources:
 *   anamnesic://projects          — List all projects
 *   anamnesic://agent-config      — Agent roles and quality tiers
 *
 * Dynamic resources (templates):
 *   anamnesic://project/{id}/summary     — Full project summary
 *   anamnesic://project/{id}/context     — All context entries
 *   anamnesic://project/{id}/decisions   — All architectural decisions
 *   anamnesic://project/{id}/pipelines   — All pipelines
 */

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    getDatabase,
    ProjectService,
    ContextService,
    DecisionService,
    PipelineService,
    exportProject,
    QUALITY_PRESETS,
    AGENT_META,
} from '@anamnesic/core';

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

export function registerResourceEndpoints(server: any) {
    // ═══════════════════════════════════════════════════════════════
    // STATIC: List all projects
    // ═══════════════════════════════════════════════════════════════

    server.resource(
        'projects',
        'anamnesic://projects',
        { description: 'List of all Anamnesic projects with IDs, names, and status.' },
        async () => {
            const { projectService } = await services();
            const projects = await projectService.list();
            const summary = projects.map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                status: p.status,
                workspace: p.workspace,
                createdAt: p.createdAt,
            }));
            return {
                contents: [{
                    uri: 'anamnesic://projects',
                    mimeType: 'application/json',
                    text: JSON.stringify(summary, null, 2),
                }],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // STATIC: Agent configuration (roles + quality tiers)
    // ═══════════════════════════════════════════════════════════════

    server.resource(
        'agent-config',
        'anamnesic://agent-config',
        { description: 'Available AI agent roles, quality tiers, and model assignments.' },
        async () => {
            const config = {
                agents: AGENT_META,
                tiers: Object.entries(QUALITY_PRESETS).map(([key, tier]: [string, any]) => ({
                    id: key,
                    label: tier.label,
                    subtitle: tier.subtitle,
                    description: tier.description,
                    costRange: tier.costRange,
                    ranking: tier.ranking,
                })),
            };
            return {
                contents: [{
                    uri: 'anamnesic://agent-config',
                    mimeType: 'application/json',
                    text: JSON.stringify(config, null, 2),
                }],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // TEMPLATE: Full project summary
    // ═══════════════════════════════════════════════════════════════

    server.resource(
        'project-summary',
        new ResourceTemplate('anamnesic://project/{id}/summary', {
            list: async () => {
                const { projectService } = await services();
                const projects = await projectService.list();
                return {
                    resources: projects.map((p: any) => ({
                        uri: `anamnesic://project/${p.id}/summary`,
                        name: `${p.name} — Summary`,
                        description: `Full summary of project "${p.name}" including context, decisions, and pipelines.`,
                    })),
                };
            },
        }),
        { description: 'Complete project summary with context, decisions, and pipeline status.' },
        async (uri: URL, variables: Record<string, string>) => {
            const id = variables.id;
            const { projectService, contextService, decisionService } = await services();
            const project = await projectService.get(id);
            if (!project) {
                return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: `Project not found: ${id}` }] };
            }

            const context = await contextService.listByProject(id);
            const decisions = await decisionService.listByProject(id);
            const pipelines = pipelineService.list(id);

            const contextByCategory: Record<string, any[]> = {};
            for (const entry of context) {
                const cat = entry.category || 'general';
                if (!contextByCategory[cat]) contextByCategory[cat] = [];
                contextByCategory[cat].push({ key: entry.key, value: entry.value, priority: entry.priority });
            }

            const summary = {
                project: {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    workspace: project.workspace,
                },
                stats: {
                    contextEntries: context.length,
                    decisions: decisions.length,
                    pipelines: pipelines.length,
                },
                context: contextByCategory,
                decisions: decisions.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    description: d.description,
                    status: d.status,
                    createdAt: d.createdAt,
                })),
                activePipeline: pipelineService.getActive(id) || null,
            };

            return {
                contents: [{
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify(summary, null, 2),
                }],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // TEMPLATE: Project context entries
    // ═══════════════════════════════════════════════════════════════

    server.resource(
        'project-context',
        new ResourceTemplate('anamnesic://project/{id}/context', {
            list: async () => {
                const { projectService } = await services();
                const projects = await projectService.list();
                return {
                    resources: projects.map((p: any) => ({
                        uri: `anamnesic://project/${p.id}/context`,
                        name: `${p.name} — Context`,
                        description: `All context entries for project "${p.name}".`,
                    })),
                };
            },
        }),
        { description: 'All context entries for a project, grouped by category.' },
        async (uri: URL, variables: Record<string, string>) => {
            const id = variables.id;
            const { contextService } = await services();
            const entries = await contextService.listByProject(id);

            const grouped: Record<string, any[]> = {};
            for (const entry of entries) {
                const cat = entry.category || 'general';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push({
                    id: entry.id,
                    key: entry.key,
                    value: entry.value,
                    priority: entry.priority,
                });
            }

            return {
                contents: [{
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify({ projectId: id, totalEntries: entries.length, context: grouped }, null, 2),
                }],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // TEMPLATE: Project decisions (ADRs)
    // ═══════════════════════════════════════════════════════════════

    server.resource(
        'project-decisions',
        new ResourceTemplate('anamnesic://project/{id}/decisions', {
            list: async () => {
                const { projectService } = await services();
                const projects = await projectService.list();
                return {
                    resources: projects.map((p: any) => ({
                        uri: `anamnesic://project/${p.id}/decisions`,
                        name: `${p.name} — Decisions`,
                        description: `Architectural Decision Records for project "${p.name}".`,
                    })),
                };
            },
        }),
        { description: 'Architectural Decision Records (ADRs) for a project.' },
        async (uri: URL, variables: Record<string, string>) => {
            const id = variables.id;
            const { decisionService } = await services();
            const decisions = await decisionService.listByProject(id);

            return {
                contents: [{
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        projectId: id,
                        totalDecisions: decisions.length,
                        decisions: decisions.map((d: any) => ({
                            id: d.id,
                            title: d.title,
                            description: d.description,
                            status: d.status,
                            createdAt: d.createdAt,
                        })),
                    }, null, 2),
                }],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // TEMPLATE: Project pipelines
    // ═══════════════════════════════════════════════════════════════

    server.resource(
        'project-pipelines',
        new ResourceTemplate('anamnesic://project/{id}/pipelines', {
            list: async () => {
                const { projectService } = await services();
                const projects = await projectService.list();
                return {
                    resources: projects.map((p: any) => ({
                        uri: `anamnesic://project/${p.id}/pipelines`,
                        name: `${p.name} — Pipelines`,
                        description: `Task pipelines for project "${p.name}".`,
                    })),
                };
            },
        }),
        { description: 'Task pipelines and their phase status for a project.' },
        async (uri: URL, variables: Record<string, string>) => {
            const id = variables.id;
            const pipelines = pipelineService.list(id);
            const active = pipelineService.getActive(id);

            return {
                contents: [{
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        projectId: id,
                        totalPipelines: pipelines.length,
                        activePipeline: active ? {
                            id: active.id,
                            objective: active.objective,
                            status: active.status,
                            currentPhase: active.currentPhase,
                            phases: active.phases,
                        } : null,
                        pipelines: pipelines.map((p: any) => ({
                            id: p.id,
                            objective: p.objective,
                            status: p.status,
                            currentPhase: p.currentPhase,
                            totalPhases: p.phases?.length ?? 0,
                        })),
                    }, null, 2),
                }],
            };
        }
    );
}
