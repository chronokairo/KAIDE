#!/usr/bin/env node
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import { registerTools, registerResources } from './tools.js';
import { ensureToken } from './token.js';
import { setExtensionSocket, getExtensionSocket, resolvePendingRequest, failAllPending, getExtensionConnected } from './bridge.js';

// --- Config ---
const PORT = process.env.MCP_PORT || 12307;
const HOST = '127.0.0.1';

// --- Ensure token (auto-setup on first run) ---
const { token: TOKEN, isNew } = ensureToken();

// --- Per-session MCP transport management ---
const sessions = new Map(); // sessionId -> transport

function createSessionTransport() {
  const server = new McpServer({ name: 'browser-mcp-lite', version: '1.0.0' });
  registerTools(server);
  registerResources(server);
  let sessionId = null;
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      sessionId = id;
      sessions.set(id, transport);
      console.log(`[MCP] Session started: ${id.slice(0, 8)}...`);
    },
  });
  transport.onclose = () => {
    if (sessionId) {
      sessions.delete(sessionId);
      console.log(`[MCP] Session closed: ${sessionId.slice(0, 8)}...`);
    }
  };
  server.connect(transport);
  return transport;
}

// --- Fastify app ---
const app = Fastify({ logger: false });
await app.register(websocket);

// Auth check — only for /mcp routes
function checkAuth(request, reply) {
  const auth = request.headers.authorization;
  if (!auth || auth !== `Bearer ${TOKEN}`) {
    reply.code(401).send({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// MCP route — per-session transport management
app.all('/mcp', async (request, reply) => {
  if (!checkAuth(request, reply)) return;

  const sessionId = request.headers['mcp-session-id'];
  let transport = sessions.get(sessionId);

  if (!transport) {
    if (request.method === 'GET' || request.method === 'DELETE') {
      reply.code(400).send({ jsonrpc: '2.0', error: { code: -32000, message: 'No active session' } });
      return;
    }
    // POST without session -> new session (initialize request)
    transport = createSessionTransport();
  }

  reply.hijack();
  await transport.handleRequest(request.raw, reply.raw, request.body);
});

// Health check (no auth)
app.get('/ping', async () => ({ status: 'ok', extension: getExtensionConnected() }));

// WebSocket endpoint for Chrome Extension
// First message must be: { "type": "auth", "token": "<TOKEN>" }
app.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (socket, request) => {
    let authenticated = false;

    // Auth timeout — close if no valid auth within 5 seconds
    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        console.log('[WS] Auth timeout — closing');
        socket.close(4001, 'Auth timeout');
      }
    }, 5000);

    socket.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      // First message must be auth
      if (!authenticated) {
        if (msg.type === 'auth' && msg.token === TOKEN) {
          authenticated = true;
          clearTimeout(authTimeout);
          // Close previous extension connection if any
          const previous = getExtensionSocket();
          if (previous && previous !== socket) {
            previous.close(4002, 'Replaced by new connection');
          }
          setExtensionSocket(socket);
          console.log('[WS] Extension authenticated and connected');
          socket.send(JSON.stringify({ type: 'auth_ok' }));
        } else {
          console.log('[WS] Invalid auth — closing');
          socket.close(4003, 'Invalid token');
        }
        return;
      }

      // Ignore pings
      if (msg.type === 'ping') return;

      resolvePendingRequest(msg.id, msg.result, msg.error);
    });

    socket.on('close', () => {
      clearTimeout(authTimeout);
      if (getExtensionSocket() === socket) {
        console.log('[WS] Extension disconnected');
        setExtensionSocket(null);
        failAllPending('Extension disconnected');
      }
    });
  });
});

// --- Start ---
await app.listen({ port: PORT, host: HOST });

const mcpUrl = `http://${HOST}:${PORT}/mcp`;
const wsUrl = `ws://${HOST}:${PORT}/ws`;
const sep = '\u2501'.repeat(53);

console.log(`[browser-mcp-lite] MCP server: ${mcpUrl}`);
console.log(`[browser-mcp-lite] WebSocket:  ${wsUrl}`);

if (isNew) {
  console.log('\n\u26A0 First run \u2014 new token generated');
  console.log(`\n\u2501\u2501\u2501 Auth Token (paste into Chrome Extension popup) \u2501\u2501\u2501`);
  console.log(TOKEN);
  console.log(sep);
  console.log(`\n\u2501\u2501\u2501 MCP Client Config (save as .mcp.json) \u2501\u2501\u2501`);
  console.log(JSON.stringify({
    mcpServers: {
      browser: {
        type: 'http',
        url: mcpUrl,
        headers: { Authorization: `Bearer ${TOKEN}` },
      },
    },
  }, null, 2));
  console.log(sep);
} else {
  console.log(`[browser-mcp-lite] Token: ${TOKEN.slice(0, 8)}...`);
}

console.log('\n[browser-mcp-lite] Waiting for Chrome Extension...');
