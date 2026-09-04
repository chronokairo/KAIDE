#!/usr/bin/env node
/**
 * Script para iniciar o servidor MCP das APIs TOTVS
 * Este servidor expõe as APIs TOTVS como ferramentas MCP para serem usadas por LLMs
 */

import './env.js';
import { TOTVSMCPServer } from './features/mcp/server.js';

const server = new TOTVSMCPServer();
server.start().catch((error) => {
    console.error('[MCP] Erro fatal:', error);
    process.exit(1);
});
