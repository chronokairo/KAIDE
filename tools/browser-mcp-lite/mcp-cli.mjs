#!/usr/bin/env node
// Cliente MCP para browser-mcp-lite (Streamable HTTP)
import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

let TOKEN = process.env.MCP_TOKEN;
if (!TOKEN) {
  try {
    const tokenFile = join(homedir(), ".browser-mcp-secrets.token");
    TOKEN = readFileSync(tokenFile, "utf8").trim();
  } catch {
    try {
      const secretsFile = join(homedir(), ".browser-mcp-secrets.json");
      const secrets = JSON.parse(readFileSync(secretsFile, "utf8"));
      TOKEN = secrets.token;
    } catch {}
  }
}

const URL = process.env.MCP_URL || "http://127.0.0.1:12307/mcp";
if (!TOKEN) {
  console.error("❌ Falta MCP_TOKEN e não foi encontrado em ~/.browser-mcp-secrets.token");
  process.exit(1);
}

const cmd = process.argv[2];
const arg = process.argv[3];

let sessionId = null;

async function post(body, headers = {}) {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "Authorization": `Bearer ${TOKEN}`,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      ...headers,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const sid = res.headers.get("mcp-session-id");
  if (sid) sessionId = sid;
  const raw = await res.text();
  const lines = raw.split("\n").filter(l => l.startsWith("data:"));
  return lines.map(l => { try { return JSON.parse(l.slice(5)); } catch { return null; } }).filter(Boolean);
}

async function init() {
  const msgs = await post({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "opencode-cli", version: "1.0" } },
  });
  const init = msgs.find(m => m.id === 1);
  if (init?.result?.serverInfo) console.error(`[MCP] ${init.result.serverInfo.name} v${init.result.serverInfo.version}`);
  await post({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
}

async function callTool(name, params = {}) {
  const msgs = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: params } });
  const msg = msgs.find(m => m.id === 2);
  if (!msg) throw new Error("Sem resposta do tool");
  if (msg.error) throw new Error(JSON.stringify(msg.error));
  const content = msg.result?.content || [];
  return content.map(c => c.text ?? c.image ?? "").join("\n");
}

(async () => {
  await init();
  switch (cmd) {
    case "list_tabs": {
      const r = await callTool("list_tabs");
      console.log(r);
      break;
    }
    case "read_page": {
      const r = await callTool("read_page", arg ? { tabId: Number(arg) } : {});
      console.log(r);
      break;
    }
    case "screenshot": {
      const { writeFileSync } = await import("node:fs");
      const r = await callTool("screenshot", arg ? { tabId: Number(arg) } : {});
      const b64 = r.replace(/^data:image\/png;base64,/, "");
      writeFileSync("screenshot.png", Buffer.from(b64, "base64"));
      console.log("Salvo em screenshot.png");
      break;
    }
    case "focus": {
      const r = await callTool("focus_tab", { tabId: Number(arg) });
      console.log(r);
      break;
    }
    case "open": {
      const r = await callTool("open_tab", { url: arg });
      console.log(r);
      break;
    }
    case "navigate": {
      const [url, tabId] = process.argv.slice(3);
      const r = await callTool("navigate_tab", { url, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "reload": {
      const r = await callTool("reload_extension");
      console.log(r);
      break;
    }
    case "click": {
      const [sel, tabId] = process.argv.slice(3);
      const r = await callTool("dom_click", { selector: sel, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "set": {
      const [sel, value, tabId] = process.argv.slice(3);
      const r = await callTool("dom_set_value", { selector: sel, value, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "upload": {
      const [sel, name, mime, b64, tabId] = process.argv.slice(3);
      const r = await callTool("dom_upload_file", { selector: sel, name, mimeType: mime, base64: b64, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "find": {
      const [sel, tabId] = process.argv.slice(3);
      const r = await callTool("dom_find", { selector: sel, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "probe": {
      const [search, tabId] = process.argv.slice(3);
      const r = await callTool("dom_probe", { ...(search ? { search } : {}), ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "cookies": {
      const tabId = process.argv[3];
      const r = await callTool("list_cookies", tabId ? { tabId: Number(tabId) } : {});
      console.log(r);
      break;
    }
    case "intercept": {
      const tabId = process.argv[3];
      const r = await callTool("dom_intercept", tabId ? { tabId: Number(tabId) } : {});
      console.log(r);
      break;
    }
    case "fetchurl": {
      const [url, out, tabId] = process.argv.slice(3);
      if (!url || !out) { console.error("uso: fetchurl <url> <arquivo_de_saida> [tabId]"); process.exit(1); }
      const r = await callTool("dom_fetch", { url, ...(tabId ? { tabId: Number(tabId) } : {}) });
      const parsed = typeof r === 'string' ? JSON.parse(r) : r;
      if (!parsed.ok) { console.error(JSON.stringify(parsed)); process.exit(1); }
      writeFileSync(out, parsed.text, 'utf8');
      console.log(`salvo: ${out} (${parsed.len} bytes)`);
      break;
    }
    case "req": {
      const [method, path, body, tabId] = process.argv.slice(3);
      if (!method || !path) { console.error("uso: req <METHOD> <path> [jsonBody] [tabId]"); process.exit(1); }
      const url = path.startsWith('http') ? path : `https://painel.levelhost.com.br/backend${path}`;
      const r = await callTool("dom_fetch", {
        url,
        method,
        ...(body ? { body, headers: { 'Content-Type': 'application/json' } } : {}),
        ...(tabId ? { tabId: Number(tabId) } : {}),
      });
      const parsed = typeof r === 'string' ? JSON.parse(r) : r;
      if (parsed.error) { console.error("dom_fetch error:", parsed.error); process.exit(1); }
      const snippet = (parsed.text || '').slice(0, 1200);
      console.log(`${method} ${url} => ${parsed.status}`);
      console.log(snippet);
      break;
    }
    case "inject": {
      const [code, tabId] = process.argv.slice(3);
      const r = await callTool("inject_script", { code, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "wait": {
      const [sel, text, idle, to] = process.argv.slice(3);
      const r = await callTool("wait_for", {
        ...(sel ? { selector: sel } : {}),
        ...(text ? { text } : {}),
        ...(idle ? { networkIdle: Number(idle) } : {}),
        ...(to ? { timeout: Number(to) } : {}),
      });
      console.log(r);
      break;
    }
    case "clicktext": {
      const [text, exact, tabId] = process.argv.slice(3);
      const r = await callTool("dom_click_text", { text, ...(exact === "true" ? { exact: true } : {}), ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "scroll": {
      const [dir, amount, sel, tabId] = process.argv.slice(3);
      const r = await callTool("dom_scroll", {
        ...(dir ? { direction: dir } : {}),
        ...(amount ? { amount: Number(amount) } : {}),
        ...(sel ? { selector: sel } : {}),
        ...(tabId ? { tabId: Number(tabId) } : {}),
      });
      console.log(r);
      break;
    }
    case "hover": {
      const [sel, tabId] = process.argv.slice(3);
      const r = await callTool("dom_hover", { selector: sel, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "type": {
      const [sel, value, tabId] = process.argv.slice(3);
      const r = await callTool("dom_type", { selector: sel, value, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "press": {
      const [key, tabId] = process.argv.slice(3);
      const r = await callTool("dom_press_key", { key, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "check": {
      const [sel, state, tabId] = process.argv.slice(3);
      const r = await callTool("dom_check", { selector: sel, ...(state === "false" ? { checked: false } : {}), ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "select": {
      const [sel, label, tabId] = process.argv.slice(3);
      const r = await callTool("dom_select", { selector: sel, label, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "close": {
      const tabId = process.argv[3];
      const r = await callTool("close_tab", tabId ? { tabId: Number(tabId) } : {});
      console.log(r);
      break;
    }
    case "dup": {
      const tabId = process.argv[3];
      const r = await callTool("duplicate_tab", tabId ? { tabId: Number(tabId) } : {});
      console.log(r);
      break;
    }
    case "log": {
      const [tabId, clear] = process.argv.slice(3);
      const r = await callTool("page_log", {
        ...(clear === "clear" ? { clear: true } : {}),
        ...(tabId ? { tabId: Number(tabId) } : {}),
      });
      console.log(r);
      break;
    }
    case "download": {
      const [url, filename, tabId] = process.argv.slice(3);
      if (!url) { console.error("uso: download <url> [filename] [tabId]"); process.exit(1); }
      const r = await callTool("dom_download", { url, ...(filename ? { filename } : {}), ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "har": {
      const [clear, max, tabId] = process.argv.slice(3);
      const r = await callTool("network_har", { ...(clear === "clear" ? { clear: true } : {}), ...(max ? { max: Number(max) } : {}), ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "shotdiff": {
      const [reset, tabId] = process.argv.slice(3);
      const r = await callTool("screenshot_diff", { ...(reset === "reset" ? { reset: true } : {}), ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "watch": {
      const [timeout, tabId] = process.argv.slice(3);
      const r = await callTool("watch_page", { ...(timeout ? { timeout: Number(timeout) } : {}), ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "drag": {
      const [source, target, tabId] = process.argv.slice(3);
      if (!source || !target) { console.error("uso: drag <sourceSel> <targetSel> [tabId]"); process.exit(1); }
      const r = await callTool("dom_drag_drop", { source, target, ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "clickrole": {
      const [role, name, index, tabId] = process.argv.slice(3);
      if (!role) { console.error("uso: clickrole <role> [name] [index] [tabId]"); process.exit(1); }
      const r = await callTool("dom_click_role", { role, ...(name ? { name } : {}), ...(index ? { index: Number(index) } : {}), ...(tabId ? { tabId: Number(tabId) } : {}) });
      console.log(r);
      break;
    }
    case "windows": {
      const r = await callTool("list_windows", {});
      console.log(r);
      break;
    }
    case "winnew": {
      const [url, incognito] = process.argv.slice(3);
      const r = await callTool("create_window", { ...(url ? { url } : {}), ...(incognito === "incognito" ? { incognito: true } : {}) });
      console.log(r);
      break;
    }
    case "winclose": {
      const windowId = process.argv[3];
      if (!windowId) { console.error("uso: winclose <windowId>"); process.exit(1); }
      const r = await callTool("close_window", { windowId: Number(windowId) });
      console.log(r);
      break;
    }
    case "winmerge": {
      const [from, to] = process.argv.slice(3);
      if (!from || !to) { console.error("uso: winmerge <fromWindowId> <toWindowId>"); process.exit(1); }
      const r = await callTool("merge_windows", { fromWindowId: Number(from), toWindowId: Number(to) });
      console.log(r);
      break;
    }
    case "record": {
      const state = process.argv[3];
      const active = state !== "off";
      const r = await callTool("session_record", { active });
      console.log(r);
      break;
    }
    case "replay": {
      const r = await callTool("session_replay", {});
      console.log(r);
      break;
    }
    case "script": {
      const r = await callTool("session_script", {});
      console.log(r);
      break;
    }
    case "audit": {
      const limit = process.argv[3];
      const r = await callTool("audit_status", limit ? { limit: Number(limit) } : {});
      console.log(r);
      break;
    }
    default:
      console.error("Comandos: list_tabs | read_page [tabId] | screenshot [tabId] | focus tabId | open <url> | navigate <url> [tabId] | reload | click <sel> [tabId] | clicktext <text> [exact] [tabId] | clickrole <role> [name] [index] [tabId] | set <sel> <valor> [tabId] | type <sel> <valor> [tabId] | press <key> [tabId] | check <sel> [true|false] [tabId] | select <sel> <label> [tabId] | upload <sel> <nome> <mime> <base64> [tabId] | inject <code> [tabId] | scroll [dir] [amount] [sel] [tabId] | hover <sel> [tabId] | drag <sourceSel> <targetSel> [tabId] | wait [sel] [text] [networkIdle] [timeout] | watch [timeout] [tabId] | log [tabId] [clear] | har [clear] [max] [tabId] | shotdiff [reset] [tabId] | windows | winnew [url] [incognito] | winclose <windowId> | winmerge <from> <to> | record [off] | replay | script | audit [limit] | close [tabId] | dup [tabId] | download <url> [filename] [tabId] | req <METHOD> <path> [jsonBody] [tabId]");
      process.exit(1);
  }
})().catch(e => { console.error("ERRO:", e.message); process.exit(1); });
