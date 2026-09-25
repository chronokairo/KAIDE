/**
 * MCP Prompts — Pre-built prompt templates for common AI workflows
 *
 * Prompts give AI assistants structured starting points for complex tasks,
 * automatically enriched with project context from Anamnesic.
 *
 * Available prompts:
 *   code-review         — Review code with project architecture & standards context
 *   architecture-decision — Help make an ADR with existing decisions as reference
 *   refactor-plan       — Plan a refactoring using project structure/standards
 *   bug-analysis        — Analyze a bug with project context & recent decisions
 *   project-onboarding  — Generate a comprehensive onboarding guide for new devs
 *   context-sync-check  — Audit what context is missing or outdated
 */

import { z } from 'zod';
import {
    getDatabase,
    ProjectService,
    ContextService,
    DecisionService,
    PipelineService,
    exportProject,
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

/** Build a context block from project data for injection into prompts */
async function buildProjectContext(projectId: string): Promise<string> {
    const { projectService, contextService, decisionService } = await services();
    const project = await projectService.get(projectId);
    if (!project) return `[Project ${projectId} not found]`;

    const context = await contextService.listByProject(projectId);
    const decisions = await decisionService.listByProject(projectId);

    const sections: string[] = [];
    sections.push(`# Project: ${project.name}`);
    if (project.description) sections.push(project.description);

    // Group context by category
    const grouped: Record<string, any[]> = {};
    for (const entry of context) {
        const cat = entry.category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(entry);
    }

    for (const [category, entries] of Object.entries(grouped)) {
        sections.push(`\n## ${category.charAt(0).toUpperCase() + category.slice(1)}`);
        for (const e of entries) {
            sections.push(`- **${e.key}**: ${e.value}`);
        }
    }

    if (decisions.length > 0) {
        sections.push('\n## Architectural Decisions');
        for (const d of decisions) {
            sections.push(`- **${d.title}** [${d.status || 'active'}]: ${d.description}`);
        }
    }

    return sections.join('\n');
}

export function registerPromptEndpoints(server: any) {
    // ═══════════════════════════════════════════════════════════════
    // PROMPT: Code Review with Project Context
    // ═══════════════════════════════════════════════════════════════

    server.prompt(
        'code-review',
        'Review code with full awareness of project architecture, standards, and past decisions. Provides context-aware feedback instead of generic review.',
        {
            projectId: z.string().describe('Anamnesic project ID'),
            code: z.string().describe('The code to review (paste the file content or diff)'),
            focus: z.string().optional().describe('Specific review focus: security, performance, architecture, readability, or all'),
        },
        async ({ projectId, code, focus }: { projectId: string; code: string; focus?: string }) => {
            const contextBlock = await buildProjectContext(projectId);
            const focusArea = focus || 'all';

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `You are a senior code reviewer with deep knowledge of this project. Use the project context below to provide specific, actionable feedback.

<project-context>
${contextBlock}
</project-context>

<review-focus>${focusArea}</review-focus>

<code-to-review>
${code}
</code-to-review>

Instructions:
1. Check alignment with the project's architecture and standards
2. Verify consistency with existing architectural decisions
3. Flag any violations of documented requirements
4. Review for ${focusArea === 'all' ? 'security, performance, readability, and architecture' : focusArea}
5. Provide specific suggestions referencing the project context

Format your review as:
### Summary
### Issues Found (by severity)
### Suggestions
### Alignment with Project Standards`,
                        },
                    },
                ],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // PROMPT: Architecture Decision Record
    // ═══════════════════════════════════════════════════════════════

    server.prompt(
        'architecture-decision',
        'Help make an architectural decision with full awareness of existing ADRs and project context. Generates a structured ADR with rationale and alternatives.',
        {
            projectId: z.string().describe('Anamnesic project ID'),
            topic: z.string().describe('The architectural topic or question to decide on'),
            constraints: z.string().optional().describe('Any specific constraints or requirements to consider'),
        },
        async ({ projectId, topic, constraints }: { projectId: string; topic: string; constraints?: string }) => {
            const contextBlock = await buildProjectContext(projectId);

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `You are a software architect helping make a decision for this project. Consider all existing context, past decisions, and constraints.

<project-context>
${contextBlock}
</project-context>

<decision-topic>${topic}</decision-topic>
${constraints ? `<constraints>${constraints}</constraints>` : ''}

Provide a structured Architecture Decision Record (ADR):

### Title
(Concise decision title)

### Status
proposed

### Context
(What is the issue? Why does this decision need to be made? Reference existing project decisions and architecture.)

### Options Considered
For each option:
- **Option N: Name**
  - Description
  - Pros
  - Cons
  - Impact on existing architecture

### Decision
(Which option is recommended and why)

### Consequences
- Positive consequences
- Negative consequences / trade-offs
- Migration steps needed

### Related Decisions
(Reference any existing project decisions that are affected)`,
                        },
                    },
                ],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // PROMPT: Refactoring Plan
    // ═══════════════════════════════════════════════════════════════

    server.prompt(
        'refactor-plan',
        'Plan a refactoring with full awareness of project architecture, dependencies, and safety net features. Produces a step-by-step migration plan.',
        {
            projectId: z.string().describe('Anamnesic project ID'),
            target: z.string().describe('What to refactor (file, module, pattern, etc.)'),
            goal: z.string().describe('What the refactoring should achieve'),
        },
        async ({ projectId, target, goal }: { projectId: string; target: string; goal: string }) => {
            const contextBlock = await buildProjectContext(projectId);
            const pipelines = pipelineService.list(projectId);
            const activePipeline = pipelineService.getActive(projectId);

            let pipelineInfo = '';
            if (activePipeline) {
                pipelineInfo = `\n<active-pipeline>
Objective: ${activePipeline.objective}
Phase: ${activePipeline.currentPhase + 1}/${activePipeline.phases?.length ?? 0}
Status: ${activePipeline.status}
</active-pipeline>`;
            }

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `You are a senior engineer planning a safe refactoring for this project. The project uses Anamnesic's safety net (file snapshots + rollback).

<project-context>
${contextBlock}
</project-context>
${pipelineInfo}

<refactoring-target>${target}</refactoring-target>
<refactoring-goal>${goal}</refactoring-goal>

Create a detailed refactoring plan:

### 1. Impact Analysis
- Files and modules affected
- Dependencies that may break
- Alignment with existing architectural decisions

### 2. Pre-Refactoring Checklist
- [ ] Tests to run before starting
- [ ] Snapshots to take (Anamnesic safety net)
- [ ] Dependencies to check

### 3. Step-by-Step Plan
(Ordered steps with rollback points)

### 4. Validation
- Tests to run after each step
- Integration checks
- Performance benchmarks if applicable

### 5. Rollback Strategy
- What to do if something breaks
- How to use Anamnesic snapshots for recovery`,
                        },
                    },
                ],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // PROMPT: Bug Analysis
    // ═══════════════════════════════════════════════════════════════

    server.prompt(
        'bug-analysis',
        'Analyze a bug with full project context: architecture, dependencies, recent decisions, and pipeline status. Provides root cause analysis and fix suggestions.',
        {
            projectId: z.string().describe('Anamnesic project ID'),
            description: z.string().describe('Bug description: what is happening vs what is expected'),
            errorOutput: z.string().optional().describe('Error messages, stack traces, or logs'),
        },
        async ({ projectId, description, errorOutput }: { projectId: string; description: string; errorOutput?: string }) => {
            const contextBlock = await buildProjectContext(projectId);

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `You are a senior debugger with deep knowledge of this project's architecture and dependencies. Analyze this bug systematically.

<project-context>
${contextBlock}
</project-context>

<bug-description>
${description}
</bug-description>
${errorOutput ? `<error-output>\n${errorOutput}\n</error-output>` : ''}

Provide a structured analysis:

### 1. Bug Classification
- Severity (critical/major/minor/cosmetic)
- Category (logic, data, integration, config, dependency, race condition)

### 2. Root Cause Analysis
- Most likely cause based on project architecture
- How it relates to existing context/decisions
- Which components/modules are involved

### 3. Suggested Fix
- Specific code changes or configuration fixes
- Impact on other components
- Whether this reveals a deeper architectural issue

### 4. Prevention
- Tests to add to prevent regression
- Context entries to add to Anamnesic for future reference
- Whether an architectural decision should be recorded`,
                        },
                    },
                ],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // PROMPT: Project Onboarding Guide
    // ═══════════════════════════════════════════════════════════════

    server.prompt(
        'project-onboarding',
        'Generate a comprehensive onboarding guide for a new developer joining the project. Uses all stored context, decisions, and standards.',
        {
            projectId: z.string().describe('Anamnesic project ID'),
            role: z.string().optional().describe('New developer role: fullstack, backend, frontend, devops, qa'),
        },
        async ({ projectId, role }: { projectId: string; role?: string }) => {
            const { projectService } = await services();
            const project = await projectService.get(projectId);
            const markdownExport = project ? exportProject(project, 'markdown') : '[Project not found]';
            const devRole = role || 'fullstack';

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Generate a developer onboarding guide for a new **${devRole}** developer joining this project. Use ALL the project information below.

<project-export>
${markdownExport}
</project-export>

Create a structured onboarding guide:

### Welcome to ${project?.name || 'the project'}

### 1. Project Overview
(Explain what the project does, in simple terms)

### 2. Architecture
(Key architectural patterns and decisions to understand first)

### 3. Getting Started
- Environment setup
- Key dependencies & tools
- How to run, build, test

### 4. Codebase Tour
(Most important files/folders to read first, given the ${devRole} role)

### 5. Standards & Conventions
(Coding standards, naming conventions, commit patterns)

### 6. Key Decisions to Know
(Summarize the most impactful architectural decisions)

### 7. Common Tasks
(How to add a feature, fix a bug, deploy — for a ${devRole})

### 8. Who/What to Ask
(Where to find more info, how to use Anamnesic for context)`,
                        },
                    },
                ],
            };
        }
    );

    // ═══════════════════════════════════════════════════════════════
    // PROMPT: Context Sync Check (Audit)
    // ═══════════════════════════════════════════════════════════════

    server.prompt(
        'context-sync-check',
        'Audit what project context might be missing, outdated, or incomplete. Helps keep Anamnesic context fresh and useful.',
        {
            projectId: z.string().describe('Anamnesic project ID'),
            recentChanges: z.string().optional().describe('Description of recent changes to the project'),
        },
        async ({ projectId, recentChanges }: { projectId: string; recentChanges?: string }) => {
            const contextBlock = await buildProjectContext(projectId);

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `You are a context quality auditor for this project's Anamnesic database. Analyze the current stored context and identify gaps.

<current-context>
${contextBlock}
</current-context>
${recentChanges ? `<recent-changes>\n${recentChanges}\n</recent-changes>` : ''}

Audit the project context:

### 1. Coverage Analysis
For each category (architecture, requirements, dependencies, standards, general):
- What's well documented
- What seems missing
- What might be outdated

### 2. Missing Context (High Priority)
- Critical information that should be added
- Suggested \`add_context\` calls with key/value/category

### 3. Potentially Outdated
- Entries that may no longer be accurate
- Suggested updates

### 4. Decision Gaps
- Important decisions that seem to have been made but not recorded
- Suggested \`add_decision\` calls

### 5. Recommended Actions
(Prioritized list of context updates to make via Anamnesic tools)`,
                        },
                    },
                ],
            };
        }
    );
}
