import { ensureToken } from './token.js';

const PORT = process.env.MCP_PORT || 12307;
const HOST = '127.0.0.1';
const mcpUrl = `http://${HOST}:${PORT}/mcp`;
const sep = '\u2501'.repeat(53);

const { token, isNew } = ensureToken();

if (isNew) {
  console.log('\u26A0 New token generated');
} else {
  console.log('Token already exists');
}

console.log(`\n\u2501\u2501\u2501 Auth Token (paste into Chrome Extension popup) \u2501\u2501\u2501`);
console.log(token);
console.log(sep);

console.log(`\n\u2501\u2501\u2501 MCP Client Config (save as .mcp.json) \u2501\u2501\u2501`);
console.log(JSON.stringify({
  mcpServers: {
    browser: {
      type: 'http',
      url: mcpUrl,
      headers: { Authorization: `Bearer ${token}` },
    },
  },
}, null, 2));
console.log(sep);
