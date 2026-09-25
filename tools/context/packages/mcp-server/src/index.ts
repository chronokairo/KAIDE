import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerChatEndpoints } from './chatEndpoints';
import { registerProjectEndpoints } from './projectEndpoints';
import { registerResourceEndpoints } from './resourceEndpoints';
import { registerPromptEndpoints } from './promptEndpoints';
import { registerEventEndpoints } from './eventEndpoints';
import { getEventBus } from '@anamnesic/core';

const server = new McpServer({
  name: 'anamnesic',
  version: '2.0.0',
});

registerChatEndpoints(server);
registerProjectEndpoints(server);
registerResourceEndpoints(server);
registerPromptEndpoints(server);
registerEventEndpoints(server);

// Start watching for cross-process events and notify MCP clients
const bus = getEventBus('mcp-server');
bus.startWatching();
bus.on('*', (event) => {
  // Notify connected MCP clients that resources have changed
  // (e.g. pipeline state updated by VS Code or CLI)
  if (event.type.startsWith('pipeline:') || event.type.startsWith('project:')) {
    try { server.sendResourceListChanged(); } catch { /* not connected yet */ }
  }
});

server.connect(new StdioServerTransport());