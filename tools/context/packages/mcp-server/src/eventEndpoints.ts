/**
 * MCP Event Endpoints — Expose the EventBus to AI assistants
 *
 * Tools:
 *   get_recent_events   — Get recent cross-process events (pipeline changes, etc.)
 *   subscribe_events    — Check for new events since a given timestamp
 *   emit_event          — Emit a custom event to the bus (notify VS Code, CLI, etc.)
 */

import { z } from 'zod';
import { getEventBus } from '@anamnesic/core';
import type { EventType } from '@anamnesic/core';

const bus = getEventBus('mcp-server');

const EVENT_TYPES: EventType[] = [
    'pipeline:created',
    'pipeline:phase:started',
    'pipeline:phase:completed',
    'pipeline:phase:approved',
    'pipeline:phase:rejected',
    'pipeline:task:started',
    'pipeline:task:completed',
    'pipeline:task:failed',
    'pipeline:completed',
    'pipeline:failed',
    'pipeline:resumed',
    'context:changed',
    'decision:changed',
    'project:changed',
    'chat:message',
];

export function registerEventEndpoints(server: any) {
    server.tool(
        'get_recent_events',
        'Get recent cross-process events from the Anamnesic event bus. Shows pipeline state changes, task completions, etc. from all connected processes (VS Code, CLI, other AIs).',
        {
            limit: z.number().optional().describe('Max number of events to return (default: 30)'),
            type: z.string().optional().describe('Filter by event type prefix (e.g. "pipeline:" for all pipeline events)'),
        },
        async ({ limit, type }: { limit?: number; type?: string }) => {
            let events = bus.getRecent(limit || 30);
            if (type) {
                events = events.filter(e => e.type.startsWith(type));
            }
            return {
                content: [{
                    type: 'text',
                    text: events.length > 0
                        ? JSON.stringify(events, null, 2)
                        : 'No recent events.',
                }],
            };
        }
    );

    server.tool(
        'poll_events',
        'Check for new events since a given timestamp. Use this to poll for updates when working on a pipeline. Returns only events newer than the provided timestamp.',
        {
            since: z.string().describe('ISO timestamp — only return events after this time'),
            type: z.string().optional().describe('Filter by event type prefix (e.g. "pipeline:")'),
        },
        async ({ since, type }: { since: string; type?: string }) => {
            const sinceDate = new Date(since);
            let events = bus.getRecent(100)
                .filter(e => new Date(e.timestamp) > sinceDate);
            if (type) {
                events = events.filter(e => e.type.startsWith(type));
            }
            return {
                content: [{
                    type: 'text',
                    text: events.length > 0
                        ? `${events.length} new event(s):\n${JSON.stringify(events, null, 2)}`
                        : `No new events since ${since}.`,
                }],
            };
        }
    );

    server.tool(
        'emit_event',
        'Emit a custom event to the Anamnesic event bus. This notifies all connected processes (VS Code extension, CLI, other AIs) in real-time.',
        {
            type: z.enum(EVENT_TYPES as [string, ...string[]]).describe('Event type'),
            projectId: z.string().optional().describe('Project ID'),
            pipelineId: z.string().optional().describe('Pipeline ID'),
            data: z.record(z.unknown()).optional().describe('Additional event data'),
        },
        async ({ type, projectId, pipelineId, data }: {
            type: EventType; projectId?: string; pipelineId?: string;
            data?: Record<string, unknown>;
        }) => {
            const event = bus.emit(type, { projectId, pipelineId, data });
            return {
                content: [{
                    type: 'text',
                    text: `Event emitted: ${event.type} (${event.id})`,
                }],
            };
        }
    );
}
