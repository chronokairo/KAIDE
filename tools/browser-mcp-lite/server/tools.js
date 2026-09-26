import { z } from 'zod';
import { sendToExtension, getExtensionConnected } from './bridge.js';
import { writeFileSync, mkdirSync, existsSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const downloadsDir = fileURLToPath(new URL('../downloads/', import.meta.url));

const ALLOWLIST_PATH = join(homedir(), '.browser-mcp-allowlist.json');
const AUDIT_PATH = join(homedir(), '.browser-mcp-audit.jsonl');

// --- audit trail + record/replay (registrados centralmente via wrapper) ---
const SENSITIVE_ARG = /pass|token|secret|key|authorization|cookie|api[_-]?key|base64|body/i;
const METADATA_TOOLS = /^(audit_|session_|allowlist_status|screenshot_diff|screenshot)/;

let recordingOn = false;
let recording = [];
let replaying = false;
const toolHandlers = new Map();

function redactArgs(args) {
  const out = {};
  for (const [k, v] of Object.entries(args || {})) {
    if (SENSITIVE_ARG.test(k)) out[k] = '[REDACTED]';
    else if (typeof v === 'string' && v.length > 500) out[k] = v.slice(0, 500) + '...';
    else out[k] = v;
  }
  return out;
}

function audit(name, args, ok, ms, error) {
  const line = { ts: new Date().toISOString(), tool: name, args: redactArgs(args), ok, ms, error };
  try { appendFileSync(AUDIT_PATH, JSON.stringify(line) + '\n'); } catch {}
}

function recordCall(name, args, ok, ms, err) {
  audit(name, args, ok, ms, err ? err.message : undefined);
  if (recordingOn && ok && !replaying && !METADATA_TOOLS.test(name)) {
    recording.push({ tool: name, args: args || {} });
  }
}

function patchTool(server) {
  const origTool = server.tool.bind(server);
  server.tool = (name, ...rest) => {
    const handler = rest[rest.length - 1];
    const wrapped = async (args) => {
      const t0 = Date.now();
      try {
        const result = await handler(args);
        recordCall(name, args, true, Date.now() - t0);
        return result;
      } catch (err) {
        recordCall(name, args, false, Date.now() - t0, err);
        throw err;
      }
    };
    toolHandlers.set(name, wrapped);
    return origTool(name, ...rest.slice(0, -1), wrapped);
  };
}

function extractText(content) {
  const first = Array.isArray(content) ? content[0] : null;
  return first && typeof first.text === 'string' ? first.text.slice(0, 2000) : null;
}

function loadAllowlist() {
  try {
    const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
    return { mode: raw.mode || 'allow', domains: Array.isArray(raw.domains) ? raw.domains : [] };
  } catch {
    return { mode: 'allow', domains: [] };
  }
}

function domainMatch(domain, pattern) {
  const p = String(pattern).toLowerCase();
  if (p.startsWith('*.')) return domain === p.slice(2) || domain.endsWith(p.slice(1));
  return domain === p;
}

function checkUrlAllowed(url) {
  const cfg = loadAllowlist();
  if (cfg.mode === 'allow') return { allowed: true, mode: 'allow' };
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return { allowed: false, error: 'URL inválida', mode: cfg.mode };
  }
  const listed = cfg.domains.some((p) => domainMatch(host, p));
  if (cfg.mode === 'allowlist') {
    return listed ? { allowed: true, mode: 'allowlist' } : { allowed: false, error: `Domínio bloqueado pela allowlist: ${host}`, mode: 'allowlist' };
  }
  if (cfg.mode === 'deny') return { allowed: false, error: `Modo deny ativo para: ${host}`, mode: 'deny' };
  return { allowed: true, mode: cfg.mode };
}

function guardUrl(url) {
  const check = checkUrlAllowed(url);
  if (!check.allowed) throw new Error(check.error || 'URL bloqueada');
}

// --- inject_script risk detection ---
const RISK_PATTERNS = [
  { pattern: /\b(fetch|XMLHttpRequest|sendBeacon|navigator\.sendBeacon)\s*\(/i, label: 'network request' },
  { pattern: /document\.cookie/i, label: 'cookie access' },
  { pattern: /localStorage|sessionStorage/i, label: 'storage access' },
  { pattern: /indexedDB/i, label: 'IndexedDB access' },
  { pattern: /new\s+WebSocket\s*\(/i, label: 'WebSocket connection' },
  { pattern: /new\s+EventSource\s*\(/i, label: 'EventSource connection' },
  { pattern: /window\.open\s*\(/i, label: 'window.open' },
  { pattern: /document\.write/i, label: 'document.write' },
];

function detectRisks(code) {
  return RISK_PATTERNS.filter(r => r.pattern.test(code)).map(r => r.label);
}

export function registerTools(server) {
  patchTool(server);

  // --- list_tabs ---
  server.tool('list_tabs', 'List all open browser tabs with their URLs and titles', async () => {
    const tabs = await sendToExtension('list_tabs');
    return { content: [{ type: 'text', text: JSON.stringify(tabs, null, 2) }] };
  });

  // --- read_page ---
  // URL restriction is enforced by the extension (single source of truth).
  server.tool(
    'read_page',
    'Read the DOM structure of a browser tab as an accessibility tree',
    { tabId: z.number().optional().describe('Tab ID to read. Defaults to the active tab.') },
    async ({ tabId }) => {
      const result = await sendToExtension('read_page', { tabId });
      return { content: [{ type: 'text', text: result }] };
    }
  );

  // --- screenshot ---
  server.tool(
    'screenshot',
    'Capture a screenshot of the visible area of a browser tab',
    { tabId: z.number().optional().describe('Tab ID to capture. Defaults to the active tab.') },
    async ({ tabId }) => {
      const dataUrl = await sendToExtension('screenshot', { tabId });
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      return { content: [{ type: 'image', data: base64, mimeType: 'image/png' }] };
    }
  );

  // --- focus_tab ---
  server.tool(
    'focus_tab',
    'Switch to a specific browser tab (bring it to the foreground)',
    { tabId: z.number().describe('Tab ID to focus.') },
    async ({ tabId }) => {
      await sendToExtension('focus_tab', { tabId });
      return { content: [{ type: 'text', text: `Focused tab ${tabId}` }] };
    }
  );

  // --- open_tab / navigate_tab ---
  server.tool(
    'open_tab',
    'Open a new browser tab with a given http(s) URL and return its tab ID',
    { url: z.string().describe('http(s) URL to open'), active: z.boolean().optional().describe('Bring tab to foreground (default true)') },
    async ({ url, active }) => {
      guardUrl(url);
      const result = await sendToExtension('open_tab', { url, active });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'navigate_tab',
    'Navigate an existing browser tab to a given http(s) URL',
    { url: z.string().describe('http(s) URL to navigate to'), tabId: z.number().optional().describe('Tab ID. Defaults to the active tab.') },
    async ({ url, tabId }) => {
      guardUrl(url);
      const result = await sendToExtension('navigate_tab', { url, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- reload_extension ---
  server.tool(
    'reload_extension',
    'Reload the Chrome extension (re-reads background.js from disk). Use after code changes.',
    async () => {
      const result = await sendToExtension('reload_extension');
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- dom_click / dom_set_value / dom_upload_file ---
  // Deterministic DOM tools (no eval) that work even on pages with strict CSP.
  const domTarget = { tabId: z.number().optional().describe('Tab ID. Defaults to the active tab.') };

  server.tool(
    'dom_click',
    'Click an element on the page by CSS selector',
    { selector: z.string().describe('CSS selector of the element to click'), ...domTarget },
    async ({ selector, tabId }) => {
      const result = await sendToExtension('dom_click', { selector, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_set_value',
    'Set the value of an input/textarea/select by CSS selector (React-friendly events)',
    { selector: z.string().describe('CSS selector of the input'), value: z.string().describe('Value to set'), ...domTarget },
    async ({ selector, value, tabId }) => {
      const result = await sendToExtension('dom_set_value', { selector, value, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_upload_file',
    'Attach a file (from base64) to a file input by CSS selector',
    {
      selector: z.string().describe('CSS selector of the <input type=file>'),
      name: z.string().describe('File name'),
      mimeType: z.string().optional().describe('MIME type'),
      base64: z.string().describe('File content base64-encoded'),
      ...domTarget,
    },
    async ({ selector, name, mimeType, base64, tabId }) => {
      const result = await sendToExtension('dom_upload_file', { selector, name, mimeType, base64, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_find',
    'List DOM elements matching a CSS selector (useful to discover controls and their attributes)',
    { selector: z.string().describe('CSS selector to match'), ...domTarget },
    async ({ selector, tabId }) => {
      const result = await sendToExtension('dom_find', { selector, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_probe',
    'Debug: dump structural info + raw HTML snippet from the page',
    { search: z.string().optional().describe('Text to search in the raw HTML'), tabId: z.number().optional().describe('Tab ID. Defaults to the active tab.') },
    async ({ search, tabId }) => {
      const result = await sendToExtension('dom_probe', { search, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_intercept',
    'Wrap window.fetch to log requests (read via dom_probe.fetchLog)',
    { tabId: z.number().optional().describe('Tab ID. Defaults to the active tab.') },
    async ({ tabId }) => {
      const result = await sendToExtension('dom_intercept', { tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'list_cookies',
    'List cookie names and flags for a tab URL (values not returned)',
    { tabId: z.number().optional().describe('Tab ID. Defaults to the active tab.') },
    async ({ tabId }) => {
      const result = await sendToExtension('list_cookies', { tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_fetch',
    'Fetch a URL from inside the page context (bypasses CF challenge). Supports method/body/headers for API calls with the page session.',
    {
      url: z.string(),
      tabId: z.number().optional().describe('Tab ID. Defaults to the active tab.'),
      method: z.string().optional().describe('HTTP method (GET, POST, PUT, PATCH, DELETE). Default GET.'),
      body: z.string().optional().describe('Request body (e.g. JSON string).'),
      headers: z.record(z.string()).optional().describe('Request headers.'),
    },
    async ({ url, tabId, method, body, headers }) => {
      guardUrl(url);
      const result = await sendToExtension('dom_fetch', { url, tabId, method, body, headers });
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  // --- inject_script ---
  server.tool(
    'inject_script',
    'Execute custom JavaScript code in a browser tab and return the result',
    {
      code: z.string().max(10000).describe('JavaScript code to execute (max 10,000 chars). Must return a JSON-serializable value.'),
      tabId: z.number().optional().describe('Tab ID to inject into. Defaults to the active tab.'),
    },
    async ({ code, tabId }) => {
      const risks = detectRisks(code);
      const result = await sendToExtension('inject_script', { code, tabId });
      const output = JSON.stringify(result, null, 2);
      if (risks.length > 0) {
        const warning = `\u26A0 RISK: This script uses ${risks.join(', ')}. Verify this was intentional.`;
        return { content: [{ type: 'text', text: `${warning}\n\n${output}` }] };
      }
      return { content: [{ type: 'text', text: output }] };
    }
  );

  // --- 2026: wait_for / richer interactions / tabs / observability ---

  const tabArg = { tabId: z.number().optional().describe('Tab ID. Defaults to the active tab.') };

  server.tool(
    'wait_for',
    'Wait until a condition is met on the page: a CSS selector appears, visible text appears, or the network goes idle. Use before interacting with dynamic content.',
    {
      selector: z.string().optional().describe('CSS selector to wait for'),
      text: z.string().optional().describe('Visible text to wait for'),
      networkIdle: z.number().optional().describe('Wait until no network activity for N milliseconds'),
      timeout: z.number().optional().describe('Timeout in ms (default 15000)'),
      ...tabArg,
    },
    async (params) => {
      const result = await sendToExtension('wait_for', params);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_click_text',
    'Click an element by its visible text (button, link, label, role=button, etc.). No CSS selector needed.',
    {
      text: z.string().describe('Visible text to click'),
      exact: z.boolean().optional().describe('Match the full text exactly (default: substring)'),
      ...tabArg,
    },
    async ({ text, exact, tabId }) => {
      const result = await sendToExtension('dom_click_text', { text, exact, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_scroll',
    'Scroll the page or a specific element (up/down/left/right or top/bottom)',
    {
      selector: z.string().optional().describe('CSS selector to scroll. Defaults to the page.'),
      amount: z.number().optional().describe('Scroll amount in px (default 500)'),
      direction: z.enum(['up', 'down', 'left', 'right', 'top', 'bottom']).optional().describe('Direction (default: down)'),
      ...tabArg,
    },
    async ({ selector, amount, direction, tabId }) => {
      const result = await sendToExtension('dom_scroll', { selector, amount, direction, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_hover',
    'Hover over an element by CSS selector (dispatches mouseover/mouseenter/mousemove)',
    { selector: z.string().describe('CSS selector to hover'), ...tabArg },
    async ({ selector, tabId }) => {
      const result = await sendToExtension('dom_hover', { selector, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_type',
    'Fill an input/textarea by CSS selector (React-friendly events) and/or press a key afterwards',
    {
      selector: z.string().optional().describe('CSS selector of the field (omit to only press key)'),
      value: z.string().optional().describe('Text to type'),
      clear: z.boolean().optional().describe('Clear the field before typing (default true)'),
      key: z.string().optional().describe('Key to press after filling (e.g. Enter)'),
      ...tabArg,
    },
    async ({ selector, value, clear, key, tabId }) => {
      const result = await sendToExtension('dom_type', { selector, value, clear, key, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_press_key',
    'Press a keyboard key on the focused element (Enter, Escape, Tab, ArrowDown, etc.)',
    {
      key: z.string().describe('Key to press (e.g. Enter, Escape, Tab, ArrowDown)'),
      keyCode: z.string().optional().describe('Optional DOM code (e.g. KeyA)'),
      ...tabArg,
    },
    async ({ key, keyCode, tabId }) => {
      const result = await sendToExtension('dom_press_key', { key, keyCode, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_check',
    'Check or uncheck a checkbox/radio by CSS selector',
    {
      selector: z.string().describe('CSS selector of the checkbox/radio'),
      checked: z.boolean().optional().describe('Desired state (default: true)'),
      ...tabArg,
    },
    async ({ selector, checked, tabId }) => {
      const result = await sendToExtension('dom_check', { selector, checked, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_select',
    'Choose an option in a <select> by label, value or index',
    {
      selector: z.string().describe('CSS selector of the <select>'),
      label: z.string().optional().describe('Option text (substring match)'),
      value: z.string().optional().describe('Option value'),
      index: z.number().optional().describe('Option index'),
      ...tabArg,
    },
    async ({ selector, label, value, index, tabId }) => {
      const result = await sendToExtension('dom_select', { selector, label, value, index, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'close_tab',
    'Close a browser tab (defaults to the active one)',
    { ...tabArg },
    async ({ tabId }) => {
      const result = await sendToExtension('close_tab', { tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'duplicate_tab',
    'Duplicate a browser tab (defaults to the active one)',
    { ...tabArg },
    async ({ tabId }) => {
      const result = await sendToExtension('duplicate_tab', { tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'page_log',
    'Read captured page activity: console messages, JS errors, unhandled rejections and fetch requests. Installs the capture on first call (MAIN world) and keeps up to 500 entries per tab.',
    {
      clear: z.boolean().optional().describe('Clear the captured log buffer'),
      limit: z.number().optional().describe('Max entries to return (default 60)'),
      ...tabArg,
    },
    async ({ clear, limit, tabId }) => {
      const result = await sendToExtension('page_log', { clear, limit, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_download',
    'Download a file through the page context (bypasses CORS/Cloudflare, uses the logged-in session) and save it to the local downloads folder',
    {
      url: z.string().describe('URL of the file'),
      filename: z.string().optional().describe('Save as (default: inferred from URL)'),
      ...tabArg,
    },
    async ({ url, filename, tabId }) => {
      guardUrl(url);
      const result = await sendToExtension('dom_download', { url, filename, tabId });
      if (!result?.ok) return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      mkdirSync(downloadsDir, { recursive: true });
      let name = String(result.filename || 'download.bin').replace(/[\\/]/g, '_');
      if (!name) name = 'download.bin';
      let finalPath = join(downloadsDir, name);
      let counter = 1;
      while (existsSync(finalPath)) {
        finalPath = join(downloadsDir, `${counter}_${name}`);
        counter++;
      }
      const buf = Buffer.from(result.base64 || '', 'base64');
      writeFileSync(finalPath, buf);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, file: finalPath, bytes: result.len != null ? result.len : buf.length, status: result.status, contentType: result.contentType }, null, 2) }] };
    }
  );

  // --- 2026: observabilidade / interação avançada ---

  server.tool(
    'network_har',
    'Capture network activity (fetch + XHR) with status, headers, timings and response bodies (capped). Install on first call, keeps up to 500 entries per tab.',
    {
      clear: z.boolean().optional().describe('Clear the captured network buffer'),
      max: z.number().optional().describe('Max entries to return (default 50)'),
      ...tabArg,
    },
    async ({ clear, max, tabId }) => {
      const result = await sendToExtension('network_har', { clear, max, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'screenshot_diff',
    'Capture a screenshot and compare it against a stored baseline: returns diff percentage, changed-pixel bounding box and a diff image (changed pixels highlighted in red).',
    {
      reset: z.boolean().optional().describe('Reset the baseline to the current screenshot'),
      ...tabArg,
    },
    async ({ reset, tabId }) => {
      const result = await sendToExtension('screenshot_diff', { reset, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'watch_page',
    'Wait for the page to change (URL navigation or DOM mutations) and return what changed. Returns after the first change or timeout.',
    {
      timeout: z.number().optional().describe('Max wait in ms (default 15000)'),
      ...tabArg,
    },
    async ({ timeout, tabId }) => {
      const result = await sendToExtension('watch_page', { timeout, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_drag_drop',
    'Simulate a drag & drop from a source element to a target element (HTML5 DnD events)',
    {
      source: z.string().describe('CSS selector of the draggable source element'),
      target: z.string().describe('CSS selector of the drop target'),
      ...tabArg,
    },
    async ({ source, target, tabId }) => {
      const result = await sendToExtension('dom_drag_drop', { source, target, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'dom_click_role',
    'Click an element by ARIA role and accessible name (like Playwright getByRole)',
    {
      role: z.string().describe('ARIA role: button, link, checkbox, radio, tab, menuitem, option, textbox...'),
      name: z.string().optional().describe('Accessible name (aria-label, aria-labelledby or text) to match'),
      index: z.number().optional().describe('Index when multiple elements match (default 0)'),
      ...tabArg,
    },
    async ({ role, name, index, tabId }) => {
      const result = await sendToExtension('dom_click_role', { role, name, index, tabId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'allowlist_status',
    'Show the current domain allowlist configuration (~/.browser-mcp-allowlist.json)',
    {},
    async () => {
      const cfg = loadAllowlist();
      const status = {
        path: ALLOWLIST_PATH,
        mode: cfg.mode,
        domains: cfg.domains,
        hint: 'mode "allow" libera tudo; "allowlist" restringe aos domínios; "deny" bloqueia tudo.',
      };
      return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
    }
  );

  // --- 2026: janelas múltiplas ---

  server.tool(
    'list_windows',
    'List all browser windows with their tabs',
    {},
    async () => {
      const result = await sendToExtension('list_windows');
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'create_window',
    'Create a new browser window (optionally incognito) and return its window ID and first tab',
    {
      url: z.string().optional().describe('URL to open in the new window'),
      incognito: z.boolean().optional().describe('Create an incognito window (extension must be enabled in incognito)'),
      focused: z.boolean().optional().describe('Focus the new window (default true)'),
    },
    async ({ url, incognito, focused }) => {
      guardUrl(url);
      const result = await sendToExtension('create_window', { url, incognito, focused });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'close_window',
    'Close a browser window by ID',
    { windowId: z.number().describe('Window ID to close') },
    async ({ windowId }) => {
      const result = await sendToExtension('close_window', { windowId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'merge_windows',
    'Move all tabs from one window into another and close the source window',
    {
      fromWindowId: z.number().describe('Source window (moves tabs out of it)'),
      toWindowId: z.number().describe('Target window (tabs move into it)'),
    },
    async ({ fromWindowId, toWindowId }) => {
      const result = await sendToExtension('merge_windows', { fromWindowId, toWindowId });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- 2026: sessão (record/replay) e auditoria ---

  server.tool(
    'session_record',
    'Start or stop recording tool calls for later replay (session_replay / session_script)',
    { active: z.boolean().describe('true to start recording, false to stop') },
    async ({ active }) => {
      recordingOn = !!active;
      if (active) recording = [];
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, recording: recordingOn, recorded: recording.length }, null, 2) }] };
    }
  );

  server.tool(
    'session_replay',
    'Execute the recorded sequence of tool calls and return each result',
    {},
    async () => {
      const calls = [...recording];
      if (!calls.length) return { content: [{ type: 'text', text: JSON.stringify({ ok: true, replay: [] }, null, 2) }] };
      replaying = true;
      const results = [];
      try {
        for (const call of calls) {
          const handler = toolHandlers.get(call.tool);
          if (!handler) { results.push({ tool: call.tool, ok: false, error: 'handler não encontrado' }); continue; }
          try {
            const res = await handler(call.args);
            results.push({ tool: call.tool, ok: true, result: extractText(res.content) });
          } catch (err) {
            results.push({ tool: call.tool, ok: false, error: err.message });
          }
        }
      } finally {
        replaying = false;
      }
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, replayed: results.length, results }, null, 2) }] };
    }
  );

  server.tool(
    'session_script',
    'Export the recorded tool calls as a JSON script (sequence of {tool, args})',
    {},
    async () => {
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, count: recording.length, calls: recording }, null, 2) }] };
    }
  );

  server.tool(
    'audit_status',
    'Show the audit trail location and last audit entries (~/.browser-mcp-audit.jsonl)',
    { limit: z.number().optional().describe('Max entries to return (default 20)') },
    async ({ limit }) => {
      const n = Math.max(1, Number(limit) || 20);
      const lines = [];
      try {
        const raw = readFileSync(AUDIT_PATH, 'utf8');
        const all = raw.split('\n').filter(Boolean);
        for (const line of all.slice(-n)) {
          try { lines.push(JSON.parse(line)); } catch {}
        }
      } catch {}
      return { content: [{ type: 'text', text: JSON.stringify({ path: AUDIT_PATH, count: lines.length, entries: lines }, null, 2) }] };
    }
  );
}

export function registerResources(server) {
  server.registerResource('page-active', 'page://active', { title: 'Página ativa (accessibility tree)', mimeType: 'application/json' }, async (uri) => {
    const result = await sendToExtension('read_page', {});
    return { contents: [{ uri, mimeType: 'application/json', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] };
  });

  server.registerResource('tabs-list', 'tabs://list', { title: 'Abas abertas', mimeType: 'application/json' }, async (uri) => {
    const result = await sendToExtension('list_tabs');
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerResource('server-status', 'server://status', { title: 'Status do servidor', mimeType: 'application/json' }, async (uri) => {
    const allowlist = loadAllowlist();
    const status = {
      extensionConnected: getExtensionConnected(),
      downloadsDir,
      allowlistMode: allowlist.mode,
      allowlistDomains: allowlist.domains,
      auditPath: AUDIT_PATH,
      recording: recordingOn,
      recordedCalls: recording.length,
    };
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(status, null, 2) }] };
  });
}
