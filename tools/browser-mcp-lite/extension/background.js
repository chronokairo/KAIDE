// Browser MCP Lite — Service Worker (Background Script)
// WebSocket client + message router
// Uses chrome.alarms to survive MV3 Service Worker termination

const WS_URL = 'ws://127.0.0.1:12307/ws';
const KEEPALIVE_ALARM = 'keepalive';
const KEEPALIVE_INTERVAL = 0.4; // minutes (~24 seconds, under 30s SW timeout)

let ws = null;
let connected = false;
let wsToken = null; // Loaded from chrome.storage.local

// --- Connection State ---
function updateState(isConnected) {
  connected = isConnected;
  chrome.runtime.sendMessage({ type: 'connectionState', connected }).catch(() => {});
}

// --- Load token from storage ---
async function loadToken() {
  const result = await chrome.storage.local.get('token');
  wsToken = result.token || null;
  return wsToken;
}

// --- WebSocket Connection ---
async function connect() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;

  if (!wsToken) await loadToken();
  if (!wsToken) {
    console.log('[MCP] No token configured — open popup to set one');
    return;
  }

  try {
    ws = new WebSocket(WS_URL);
  } catch {
    return; // alarm will retry
  }

  ws.onopen = () => {
    console.log('[MCP] WebSocket open, authenticating...');
    ws.send(JSON.stringify({ type: 'auth', token: wsToken }));
  };

  ws.onmessage = async (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }

    if (msg.type === 'auth_ok') {
      console.log('[MCP] Authenticated');
      updateState(true);
      return;
    }

    handleToolRequest(msg);
  };

  ws.onclose = (event) => {
    console.log('[MCP] Disconnected', event.code, event.reason);
    ws = null;
    updateState(false);
    // alarm will handle reconnection
  };

  ws.onerror = () => {};
}

function disconnect() {
  chrome.alarms.clear(KEEPALIVE_ALARM);
  if (ws) { ws.close(); ws = null; }
  updateState(false);
}

// --- Keepalive Alarm ---
// Fires every ~24 seconds to keep the Service Worker alive
// and reconnect the WebSocket if needed.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('[MCP] Alarm: reconnecting...');
      connect();
    }
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }
});

async function startKeepalive() {
  await loadToken();
  if (!wsToken) {
    console.log('[MCP] No token — skipping auto-connect');
    return;
  }
  chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: KEEPALIVE_INTERVAL });
  connect();
}

// --- Tool Request Handler ---
async function handleToolRequest(msg) {
  const { id, method, params } = msg;
  try {
    let result;
    switch (method) {
      case 'list_tabs':
        result = await toolListTabs();
        break;
      case 'read_page':
        result = await toolReadPage(params);
        break;
      case 'screenshot':
        result = await toolScreenshot(params);
        break;
      case 'focus_tab':
        result = await toolFocusTab(params);
        break;
      case 'inject_script':
        result = await toolInjectScript(params);
        break;
      case 'open_tab':
        result = await toolOpenTab(params);
        break;
      case 'navigate_tab':
        result = await toolNavigate(params);
        break;
      case 'reload_extension':
        result = await toolReloadExtension();
        break;
      case 'dom_click':
        result = await toolDomClick(params);
        break;
      case 'dom_set_value':
        result = await toolDomSetValue(params);
        break;
      case 'dom_upload_file':
        result = await toolDomUploadFile(params);
        break;
      case 'dom_find':
        result = await toolDomFind(params);
        break;
      case 'dom_probe':
        result = await toolDomProbe(params);
        break;
      case 'dom_intercept':
        result = await toolDomIntercept(params);
        break;
      case 'dom_fetch':
        result = await toolDomFetch(params);
        break;
      case 'list_cookies':
        result = await toolListCookies(params);
        break;
      case 'wait_for':
        result = await toolWaitFor(params);
        break;
      case 'dom_click_text':
        result = await toolDomClickText(params);
        break;
      case 'dom_scroll':
        result = await toolDomScroll(params);
        break;
      case 'dom_hover':
        result = await toolDomHover(params);
        break;
      case 'dom_type':
        result = await toolDomType(params);
        break;
      case 'dom_press_key':
        result = await toolDomPressKey(params);
        break;
      case 'dom_check':
        result = await toolDomCheck(params);
        break;
      case 'dom_select':
        result = await toolDomSelect(params);
        break;
      case 'close_tab':
        result = await toolCloseTab(params);
        break;
      case 'duplicate_tab':
        result = await toolDuplicateTab(params);
        break;
      case 'page_log':
        result = await toolPageLog(params);
        break;
      case 'dom_download':
        result = await toolDomDownload(params);
        break;
      case 'network_har':
        result = await toolNetworkHar(params);
        break;
      case 'screenshot_diff':
        result = await toolScreenshotDiff(params);
        break;
      case 'watch_page':
        result = await toolWatchPage(params);
        break;
      case 'dom_drag_drop':
        result = await toolDomDragDrop(params);
        break;
      case 'dom_click_role':
        result = await toolDomClickRole(params);
        break;
      case 'list_windows':
        result = await toolListWindows(params);
        break;
      case 'create_window':
        result = await toolCreateWindow(params);
        break;
      case 'close_window':
        result = await toolCloseWindow(params);
        break;
      case 'merge_windows':
        result = await toolMergeWindows(params);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
    ws?.send(JSON.stringify({ id, result }));
  } catch (err) {
    ws?.send(JSON.stringify({ id, error: err.message }));
  }
}

// --- Tool Implementations ---

async function toolListTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.map(t => ({ id: t.id, url: t.url, title: t.title, active: t.active }));
}

const RESTRICTED_PREFIXES = ['chrome://', 'chrome-extension://', 'about:', 'file://', 'data:'];

function isRestricted(url) {
  const lower = (url || '').toLowerCase();
  return !url || RESTRICTED_PREFIXES.some(p => lower.startsWith(p));
}

async function getTargetTab(tabId) {
  if (tabId != null) {
    const tab = await chrome.tabs.get(tabId);
    return tab;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab found');
  return tab;
}

async function toolReadPage(params) {
  const tab = await getTargetTab(params?.tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot read this type of page');

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['inject/accessibility-tree.js'],
  });

  if (!results?.[0]?.result) throw new Error('Failed to read page DOM');
  return results[0].result;
}

async function toolScreenshot(params) {
  const tab = await getTargetTab(params?.tabId);
  if (!tab.active) {
    await chrome.tabs.update(tab.id, { active: true });
    await new Promise(r => setTimeout(r, 300));
  }
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  return dataUrl;
}

async function toolFocusTab(params) {
  const { tabId } = params;
  if (tabId == null) throw new Error('tabId is required');
  const tab = await chrome.tabs.get(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot focus this type of page');
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
  return { ok: true };
}

async function toolOpenTab(params) {
  const { url, active = true } = params;
  if (!url || !/^https?:\/\//i.test(url)) throw new Error('Invalid URL (use http/https)');
  const tab = await chrome.tabs.create({ url, active });
  return { id: tab.id, url: tab.url, title: tab.title, active: tab.active };
}

async function toolNavigate(params) {
  const { url, tabId } = params;
  if (!url || !/^https?:\/\//i.test(url)) throw new Error('Invalid URL (use http/https)');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot navigate this type of page');
  await chrome.tabs.update(tab.id, { url });
  await chrome.windows.update(tab.windowId, { focused: true });
  return { ok: true, url };
}

async function toolReloadExtension() {
  setTimeout(() => chrome.runtime.reload(), 100);
  return { ok: true, reloading: true };
}

async function toolDomClick(params) {
  const { selector, tabId } = params;
  if (!selector) throw new Error('selector is required');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel) => {
      let el = null;
      try { el = document.querySelector(sel); } catch (err) { el = null; }
      if (!el && sel.startsWith('text:')) {
        const text = sel.slice(5).trim();
        const candidates = document.querySelectorAll('button, a, [role=button], label, [role=option], input[type=submit]');
        for (const c of candidates) {
          const t = (c.innerText || c.value || '').trim();
          if (t === text || t.includes(text)) { el = c; break; }
        }
      }
      if (!el) return { ok: false, error: `Elemento nao encontrado: ${sel}` };
      el.scrollIntoView({ block: 'center' });
      el.click();
      return { ok: true, tag: el.tagName, text: (el.innerText || el.value || '').slice(0, 80) };
    },
    args: [selector],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomSetValue(params) {
  const { selector, value, tabId } = params;
  if (!selector) throw new Error('selector is required');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return { ok: false, error: `Elemento nao encontrado: ${sel}` };
      const proto = el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : el instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      if (!setter) return { ok: false, error: 'Sem setter nativo do valor' };
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true, value: el.value };
    },
    args: [selector, value],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomFind(params) {
  const { selector, tabId } = params;
  if (!selector) throw new Error('selector is required');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel) => {
      const out = [];
      const walk = (root) => {
        let nodes;
        try { nodes = root.querySelectorAll(sel); } catch (err) { return [{ error: String(err.message) }]; }
        for (const n of Array.from(nodes)) {
          const info = { tag: n.tagName, id: n.id || undefined, cls: n.className ? String(n.className).slice(0, 60) : undefined, type: n.type || undefined, name: n.name || undefined, placeholder: n.placeholder || undefined, disabled: n.disabled || undefined, value: (n.value != null ? String(n.value).slice(0, 40) : undefined), text: (n.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60) };
          if (info.text || info.value || info.id || info.placeholder) out.push(info);
          if (out.length >= 25) return;
        }
        for (const e of Array.from(root.querySelectorAll('*'))) {
          if (out.length >= 25) return;
          if (e.shadowRoot) walk(e.shadowRoot);
        }
      };
      walk(document);
      return out;
    },
    args: [selector],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (res.error) return { ok: false, error: res.error };
  return { ok: true, count: res.length, items: res };
}

async function toolDomIntercept(params) {
  const { tabId } = params;
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: () => {
      if (window.__fetchLogV !== 'v2') {
        window.__fetchLog = [];
        window.__fetchLogV = 'v2';
        const origFetch = window.fetch.bind(window);
        window.fetch = async (...args) => {
          const [input, init] = args;
          const rec = { xhr: false, method: (init && init.method) || (input && input.method) || 'GET', url: String(input && input.url || input), at: new Date().toISOString() };
          if (init && init.body) {
            let b = init.body;
            if (b instanceof FormData) {
              const o = {};
              b.forEach((v, k) => { o[k] = typeof v === 'string' ? v : `[File ${v.name}]`; });
              b = JSON.stringify(o);
            } else if (typeof b === 'string') b = b.slice(0, 2000);
            else { try { b = JSON.stringify(b).slice(0, 2000); } catch { b = '[body]'; } }
            rec.body = b;
          }
          window.__fetchLog.push(rec);
          return origFetch(...args);
        };
      }
      if (!window.__xhrLogWrapped) {
        window.__xhrLogWrapped = true;
        const OrigXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function () {
          const xhr = new OrigXHR();
          let method = '', url = '';
          const origOpen = xhr.open.bind(xhr);
          const origSend = xhr.send.bind(xhr);
          xhr.open = function (m, u, ...rest) { method = m; url = u; return origOpen(m, u, ...rest); };
          xhr.send = function (body) {
            let rec = null;
            if (url && !/\.js|\.css|\.png|\.svg|\.woff|\.ico|\.json$/.test(url)) {
              rec = { xhr: true, method, url: String(url), at: new Date().toISOString() };
              if (body) {
                let b = body;
                if (b instanceof FormData) {
                  const o = {};
                  b.forEach((v, k) => { o[k] = typeof v === 'string' ? v : `[File ${v.name}]`; });
                  b = JSON.stringify(o);
                } else if (typeof b === 'string') b = b.slice(0, 2000);
                rec.body = b;
              }
              window.__fetchLog.push(rec);
            }
            xhr.addEventListener('loadend', () => {
              if (rec) { rec.status = xhr.status; rec.resp = String(xhr.responseText || '').slice(0, 500); }
            });
            return origSend(body);
          };
          return xhr;
        };
      }
      return { ok: true, log: window.__fetchLog };
    },
  });
  return { ok: true };
}

async function toolListCookies(params) {
  const { tabId } = params;
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const cookies = await chrome.cookies.getAll({ url: tab.url });
  return cookies.map(c => ({ name: c.name, httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite, path: c.path, size: c.value.length, looksJwt: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(c.value) }));
}

async function toolDomFetch(params) {
  const { url, tabId, method, body, headers } = params;
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (u, m, b, h) => {
      const r = await fetch(u, {
        method: m || 'GET',
        credentials: 'include',
        ...(b != null ? { body: b } : {}),
        ...(h ? { headers: h } : {}),
      });
      const t = await r.text();
      return { ok: r.ok, status: r.status, url: r.url, len: t.length, text: t };
    },
    args: [url, method, body, headers],
  });
  const dbg = { argsCount: arguments, rawLen: results?.length, raw0: results?.[0], url, method, body, headers };
  const res = results?.[0];
  if (!res?.result) {
    return { error: res?.error || 'Sem resultado do script', dbg };
  }
  return res.result;
}

async function toolDomProbe(params) {
  const { tabId, search } = params;
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: (needle) => {
      const html = document.documentElement ? document.documentElement.outerHTML : null;
      const idx = needle ? html.indexOf(needle) : -1;
      const cards = Array.from(document.querySelectorAll('button')).filter(b => /border|option/i.test(b.className) || /preview|produção|domínio/i.test(b.textContent || ''));
      return {
        inputCount: document.querySelectorAll('input').length,
        inputPlaceholder: document.querySelector('input')?.placeholder || null,
        inputValue: document.querySelector('input')?.value || null,
        needle: needle,
        needleIdx: idx,
        snippet: idx >= 0 ? html.slice(Math.max(0, idx - 500), idx + 500) : null,
        optionButtons: cards.map(b => ({ cls: String(b.className).slice(0, 120), text: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50), ariaSelected: b.getAttribute('aria-selected'), ariaPressed: b.getAttribute('aria-pressed') })),
        fetchLog: window.__fetchLog ? window.__fetchLog.slice(-15) : null,
        jwts: (() => {
          const out = [];
          const seen = new Set();
          const add = (name, val) => {
            if (!val || typeof val !== 'string' || seen.has(val)) return;
            const parts = String(val).split('.');
            if (parts.length !== 3) return;
            seen.add(val);
            let header = null, payload = null;
            try { header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'))); } catch { }
            try { payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { }
            if (payload) out.push({ name, header, payload, sigLen: parts[2].length });
          };
          document.cookie.split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) add(c.slice(0, i).trim(), c.slice(i + 1).trim()); });
          for (let i = 0; i < window.localStorage.length; i++) { const k = window.localStorage.key(i); add(k, window.localStorage.getItem(k)); }
          return out;
        })(),
        lsKeys: (() => { const o = {}; for (let i = 0; i < window.localStorage.length; i++) { const k = window.localStorage.key(i); const v = window.localStorage.getItem(k); o[k] = { len: v ? v.length : 0, jwt: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v || '') }; } return o; })(),
        scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src).filter(Boolean).slice(-20),
      };
    },
    args: [search || ''],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  return res;
}

async function toolDomUploadFile(params) {
  const { selector, name, mimeType, base64, tabId } = params;
  if (!selector || !name || !base64) throw new Error('selector, name e base64 sao obrigatorios');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel, fileName, fileType, b64) => {
      const input = document.querySelector(sel);
      if (!input) return { ok: false, error: `input nao encontrado: ${sel}` };
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const file = new File([bytes], fileName, { type: fileType || 'application/octet-stream' });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return { ok: true, name: file.name, size: file.size, type: file.type };
    },
    args: [selector, name, mimeType || '', base64],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolInjectScript(params) {
  const { code, tabId } = params;
  if (!code) throw new Error('code is required');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot inject into this type of page');

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (userCode) => {
      try {
        const value = (0, eval)(userCode);
        try {
          JSON.stringify(value);
        } catch {
          return { ok: false, error: `Return value is not JSON serializable: ${typeof value}` };
        }
        return { ok: true, value };
      } catch (err) {
        return { ok: false, error: `${err.message}\n${(err.stack || '').slice(0, 500)}` };
      }
    },
    args: [code],
  });

  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolListWindows() {
  const windows = await chrome.windows.getAll({ populate: true });
  return {
    ok: true,
    windows: windows.map((w) => ({
      id: w.id,
      focused: w.focused,
      incognito: w.incognito,
      state: w.state,
      type: w.type,
      tabs: (w.tabs || []).map((t) => ({ id: t.id, active: t.active, url: t.url, title: t.title })),
    })),
  };
}

async function toolCreateWindow(params) {
  const { url, incognito = false, focused = true } = params || {};
  const createProps = { focused };
  if (incognito) createProps.incognito = true;
  if (url) createProps.url = String(url);
  let w;
  try {
    w = await chrome.windows.create(createProps);
  } catch (err) {
    throw new Error(`Não foi possível criar a janela: ${err.message} (janela incognito exige a extensão habilitada no modo anônimo)`);
  }
  return {
    ok: true,
    windowId: w.id,
    incognito: w.incognito,
    state: w.state,
    tabs: (w.tabs || []).map((t) => ({ id: t.id, active: t.active, url: t.url, title: t.title })),
  };
}

async function toolCloseWindow(params) {
  const { windowId } = params || {};
  if (!windowId) throw new Error('windowId é obrigatório');
  await chrome.windows.remove(windowId);
  return { ok: true, closed: windowId };
}

async function toolMergeWindows(params) {
  const { fromWindowId, toWindowId } = params || {};
  if (!fromWindowId || !toWindowId) throw new Error('fromWindowId e toWindowId são obrigatórios');
  const tabs = await chrome.tabs.query({ windowId: fromWindowId });
  if (tabs.length) {
    await chrome.tabs.move(tabs.map((t) => t.id), { windowId: toWindowId, index: -1 });
  }
  try { await chrome.windows.remove(fromWindowId); } catch {}
  return { ok: true, movedTabs: tabs.length, fromWindowId, toWindowId };
}

// --- 2026: wait_for / richer interactions / tabs / observability ---

async function toolWaitFor(params) {
  const { selector, text, networkIdle, timeout = 15000, tabId } = params || {};
  if (!selector && !text && networkIdle == null) throw new Error('Informe selector, text ou networkIdle');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (sel, txt, idleMs, to) => {
      const start = Date.now();
      const deadline = start + to;
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      while (Date.now() < deadline) {
        let found = null;
        if (sel) {
          let el = null;
          try { el = document.querySelector(sel); } catch { el = null; }
          if (el) found = { kind: 'selector', value: sel, tag: el.tagName, text: (el.innerText || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 80) };
        }
        if (!found && txt) {
          const el = Array.from(document.querySelectorAll('body *')).find(e => (e.innerText || '').includes(txt));
          if (el) found = { kind: 'text', value: txt, tag: el.tagName };
        }
        if (!found && idleMs != null) {
          const resources = performance.getEntriesByType('resource');
          const last = resources.length ? Math.max(...resources.map(r => r.responseEnd)) : 0;
          if (last > 0 && Date.now() - last >= idleMs) found = { kind: 'networkIdle', ms: idleMs };
        }
        if (found) return { ok: true, found, elapsedMs: Date.now() - start };
        await sleep(200);
      }
      return { ok: false, error: `Timeout de ${to}ms: condicao nao atendida (selector=${sel}, text=${txt}, networkIdle=${idleMs})` };
    },
    args: [selector || null, text || null, networkIdle ?? null, timeout],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomClickText(params) {
  const { text, exact = false, tabId } = params || {};
  if (!text) throw new Error('text is required');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (txt, exactMatch) => {
      const selector = 'button, a, [role=button], [role=tab], [role=menuitem], [role=option], [role=link], [role=checkbox], [role=radio], [role=switch], label, input[type=submit], input[type=button], input[type=checkbox], input[type=radio], summary, [onclick]';
      const wanted = String(txt).trim();
      let el = null;
      const els = document.querySelectorAll(selector);
      for (const c of els) {
        const t = (c.innerText || c.value || '').replace(/\s+/g, ' ').trim();
        if (!t) continue;
        if (exactMatch ? t === wanted : t.includes(wanted)) { el = c; break; }
      }
      if (!el) return { ok: false, error: `Nenhum elemento com texto "${txt}"` };
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      el.click();
      return { ok: true, tag: el.tagName, role: el.getAttribute('role') || undefined, text: (el.innerText || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 80) };
    },
    args: [text, exact],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomScroll(params) {
  const { selector, amount = 500, direction = 'down', tabId } = params || {};
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel, amt, dir) => {
      const target = sel ? document.querySelector(sel) : null;
      const win = target || window;
      const el = target || document.scrollingElement || document.documentElement;
      if (dir === 'top') { el.scrollTop = 0; win.scrollTo?.({ top: 0, behavior: 'instant' }); }
      else if (dir === 'bottom') { el.scrollTop = el.scrollHeight; win.scrollTo?.({ top: el.scrollHeight, behavior: 'instant' }); }
      else if (dir === 'up') { el.scrollTop -= amt; win.scrollBy?.({ top: -amt, behavior: 'instant' }); }
      else if (dir === 'down') { el.scrollTop += amt; win.scrollBy?.({ top: amt, behavior: 'instant' }); }
      else if (dir === 'left') { el.scrollLeft -= amt; win.scrollBy?.({ left: -amt, behavior: 'instant' }); }
      else if (dir === 'right') { el.scrollLeft += amt; win.scrollBy?.({ left: amt, behavior: 'instant' }); }
      if (target) target.scrollIntoView({ block: 'center', behavior: 'instant' });
      return { ok: true, scrollTop: el.scrollTop, scrollLeft: el.scrollLeft, scrollHeight: el.scrollHeight };
    },
    args: [selector || null, amount, direction],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomHover(params) {
  const { selector, tabId } = params || {};
  if (!selector) throw new Error('selector is required');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel) => {
      let el = null;
      try { el = document.querySelector(sel); } catch { el = null; }
      if (!el) return { ok: false, error: `Elemento nao encontrado: ${sel}` };
      el.scrollIntoView({ block: 'center' });
      const opts = { bubbles: true, cancelable: true, composed: true };
      el.dispatchEvent(new MouseEvent('mouseover', opts));
      el.dispatchEvent(new MouseEvent('mouseenter', opts));
      el.dispatchEvent(new MouseEvent('mousemove', opts));
      return { ok: true, tag: el.tagName, text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80) };
    },
    args: [selector],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomType(params) {
  const { selector, value = '', clear = true, key, tabId } = params || {};
  if (!selector && !key) throw new Error('Informe selector (para preencher) ou key (para teclar)');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel, val, doClear, pressKey) => {
      let el = null;
      if (sel) {
        try { el = document.querySelector(sel); } catch { el = null; }
        if (!el) return { ok: false, error: `Elemento nao encontrado: ${sel}` };
        el.focus();
        const proto = el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : el instanceof HTMLSelectElement
            ? HTMLSelectElement.prototype
            : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        if (!setter) return { ok: false, error: 'Sem setter nativo do valor' };
        const next = doClear ? val : (el.value || '') + val;
        setter.call(el, next);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (pressKey) {
        const target = el || document.activeElement || document.body;
        const keyOpts = { key: pressKey, code: pressKey, bubbles: true, cancelable: true };
        target.dispatchEvent(new KeyboardEvent('keydown', keyOpts));
        target.dispatchEvent(new KeyboardEvent('keypress', keyOpts));
        target.dispatchEvent(new KeyboardEvent('keyup', keyOpts));
      }
      return { ok: true, target: sel || '(focused)', value: el ? el.value : undefined, key: pressKey || undefined };
    },
    args: [selector || null, String(value), !!clear, key || null],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomPressKey(params) {
  const { key, keyCode, tabId } = params || {};
  if (!key) throw new Error('key is required');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (k, code) => {
      const keyMap = { Enter: 'Enter', Escape: 'Escape', Tab: 'Tab', Backspace: 'Backspace', Delete: 'Delete', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown', ' ': 'Space' };
      const target = document.activeElement || document.body;
      const codeVal = code || keyMap[k] || (k.length === 1 ? `Key${k.toUpperCase()}` : k);
      const keyVal = k === ' ' ? ' ' : k;
      const opts = { key: keyVal, code: codeVal, bubbles: true, cancelable: true, composed: true };
      target.dispatchEvent(new KeyboardEvent('keydown', opts));
      target.dispatchEvent(new KeyboardEvent('keypress', opts));
      target.dispatchEvent(new KeyboardEvent('keyup', opts));
      return { ok: true, key: keyVal, code: codeVal, on: target.tagName };
    },
    args: [key, keyCode || null],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomCheck(params) {
  const { selector, checked = true, tabId } = params || {};
  if (!selector) throw new Error('selector is required');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel, isChecked) => {
      const el = document.querySelector(sel);
      if (!el) return { ok: false, error: `Elemento nao encontrado: ${sel}` };
      if (el.type !== 'checkbox' && el.type !== 'radio') return { ok: false, error: `Elemento não é checkbox/radio: ${el.tagName} type=${el.type}` };
      if (el.checked !== isChecked) {
        el.click();
      }
      return { ok: true, checked: el.checked, type: el.type };
    },
    args: [selector, !!checked],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomSelect(params) {
  const { selector, label, value, index, tabId } = params || {};
  if (!selector || (label == null && value == null && index == null)) throw new Error('Informe selector e um de: label, value, index');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel, lbl, val, idx) => {
      const el = document.querySelector(sel);
      if (!el) return { ok: false, error: `Elemento nao encontrado: ${sel}` };
      if (!(el instanceof HTMLSelectElement)) return { ok: false, error: `Elemento não é <select>` };
      let targetIdx = -1;
      if (idx != null) targetIdx = idx;
      else if (val != null) {
        for (let i = 0; i < el.options.length; i++) if (el.options[i].value === String(val)) { targetIdx = i; break; }
      } else {
        const wanted = String(lbl).trim().toLowerCase();
        for (let i = 0; i < el.options.length; i++) {
          const t = (el.options[i].text || '').trim().toLowerCase();
          if (t === wanted || t.includes(wanted)) { targetIdx = i; break; }
        }
      }
      if (targetIdx < 0 || targetIdx >= el.options.length) return { ok: false, error: `Opção não encontrada` };
      el.selectedIndex = targetIdx;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      const opt = el.options[targetIdx];
      return { ok: true, value: opt.value, text: opt.text, index: targetIdx };
    },
    args: [selector, label ?? null, value ?? null, index ?? null],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolCloseTab(params) {
  const tab = await getTargetTab(params?.tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot close this type of page');
  const { id, url, title } = tab;
  await chrome.tabs.remove(id);
  return { ok: true, closed: id, url, title };
}

async function toolDuplicateTab(params) {
  const tab = await getTargetTab(params?.tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot duplicate this type of page');
  const dup = await chrome.tabs.duplicate(tab.id);
  return { ok: true, id: dup.id, url: dup.url, title: dup.title, active: dup.active };
}

async function toolPageLog(params) {
  const { tabId, clear = false, limit = 60 } = params || {};
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: (doClear, max) => {
      const safeStr = (v) => {
        try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); }
      };
      const trim = (s, n) => String(s || '').slice(0, n);
      const push = (entry) => {
        window.__pageLog.push(entry);
        if (window.__pageLog.length > 500) window.__pageLog.splice(0, window.__pageLog.length - 500);
      };
      if (!window.__pageLog) window.__pageLog = [];
      if (doClear) { window.__pageLog = []; window.__fetchLog = []; return { ok: true, cleared: true }; }
      if (!window.__pageLogInstalled) {
        window.__pageLogInstalled = true;
        ['log', 'warn', 'error', 'info', 'debug'].forEach(level => {
          const orig = console[level] ? console[level].bind(console) : null;
          console[level] = (...args) => {
            push({ type: 'console', level, at: new Date().toISOString(), text: trim(args.map(safeStr).join(' '), 2000) });
            if (orig) orig(...args);
          };
        });
        window.addEventListener('error', (e) => {
          push({ type: 'error', at: new Date().toISOString(), message: trim(e.message, 1000), source: trim(e.filename, 160), line: e.lineno });
        });
        window.addEventListener('unhandledrejection', (e) => {
          const r = e.reason;
          push({ type: 'unhandledrejection', at: new Date().toISOString(), message: trim(r && (r.message || String(r)), 1000) });
        });
        if (!window.__fetchLogV2) {
          window.__fetchLogV2 = true;
          if (!window.__fetchLog) window.__fetchLog = [];
          const origFetch = window.fetch.bind(window);
          window.fetch = async (...args) => {
            const [input, init] = args;
            const rec = { xhr: false, method: (init && init.method) || (input && input.method) || 'GET', url: String(input && input.url || input), at: new Date().toISOString() };
            window.__fetchLog.push(rec);
            if (window.__fetchLog.length > 500) window.__fetchLog.splice(0, window.__fetchLog.length - 500);
            const p = origFetch(...args);
            p.then(r => { rec.status = r.status; }).catch(err => { rec.error = trim(err.message || err, 300); });
            return p;
          };
        }
      }
      return { ok: true, installed: true, log: window.__pageLog.slice(-max), network: (window.__fetchLog || []).slice(-max) };
    },
    args: [!!clear, limit],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  return res;
}

async function toolDomDownload(params) {
  const { url, filename, tabId } = params || {};
  if (!url) throw new Error('url is required');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (u, fname) => {
      const r = await fetch(u, { method: 'GET', credentials: 'include' });
      const buf = new Uint8Array(await r.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      const b64 = btoa(bin);
      const name = fname || decodeURIComponent((u.split('?')[0].split('/').pop() || 'download.bin').replace(/[^a-zA-Z0-9._-]/g, '_'));
      return { ok: r.ok, status: r.status, filename: name, contentType: r.headers.get('content-type') || '', len: buf.length, base64: b64 };
    },
    args: [url, filename || null],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  return res;
}

async function toolNetworkHar(params) {
  const { clear = false, max = 50, tabId } = params || {};
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (doClear, limit) => {
      const trim = (s, n) => String(s || '').slice(0, n);
      if (doClear) { window.__harLog = []; return { ok: true, cleared: true, entries: [] }; }
      if (!window.__harLog) window.__harLog = [];
      const push = (method, url) => {
        const e = { method, url, startedAt: new Date().toISOString(), t0: performance.now() };
        window.__harLog.push(e);
        if (window.__harLog.length > 500) window.__harLog.splice(0, window.__harLog.length - 500);
        return e;
      };
      if (!window.__harFetchWrapped) {
        window.__harFetchWrapped = true;
        const origFetch = window.fetch.bind(window);
        window.fetch = async (...args) => {
          const [input, init] = args;
          const url = String(input && input.url ? input.url : input);
          const method = (init && init.method) || (input && input.method) || 'GET';
          const e = push(method, url);
          if (init && init.body) e.reqBody = trim(typeof init.body === 'string' ? init.body : String(init.body), 4000);
          try {
            const r = await origFetch(...args);
            const ct = r.headers.get('content-type') || '';
            let body = null;
            if (/json|text|xml|javascript|x-www-form-urlencoded/i.test(ct)) {
              try { const t = await r.clone().text(); body = trim(t, 10000); } catch {}
            }
            Object.assign(e, { status: r.status, statusText: r.statusText, contentType: ct, respHeaders: Object.fromEntries(r.headers), body, durationMs: Math.round(performance.now() - e.t0) });
            return r;
          } catch (err) {
            e.error = trim(err && err.message ? err.message : err, 500);
            e.durationMs = Math.round(performance.now() - e.t0);
            throw err;
          }
        };
      }
      if (!window.__harXhrWrapped) {
        window.__harXhrWrapped = true;
        const OrigXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function () {
          const xhr = new OrigXHR();
          const origOpen = xhr.open.bind(xhr);
          const origSend = xhr.send.bind(xhr);
          let method = '';
          let url = '';
          xhr.open = function (m, u, ...rest) { method = m; url = u; return origOpen(m, u, ...rest); };
          xhr.send = function (body) {
            const e = push(method || 'GET', String(url));
            if (body !== undefined && body !== null) e.reqBody = trim(typeof body === 'string' ? body : String(body), 4000);
            const t0 = performance.now();
            xhr.addEventListener('loadend', () => {
              const ct = xhr.getResponseHeader('content-type') || '';
              let respBody = null;
              if (/json|text|xml|javascript/i.test(ct)) respBody = trim(xhr.responseText, 10000);
              Object.assign(e, { status: xhr.status, contentType: ct, body: respBody, durationMs: Math.round(performance.now() - t0) });
            });
            xhr.addEventListener('error', () => { e.error = 'network error'; });
            return origSend(body);
          };
          return xhr;
        };
      }
      return { ok: true, entries: window.__harLog.slice(-limit) };
    },
    args: [!!clear, Math.max(1, Number(max) || 50)],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  return res;
}

async function toolScreenshotDiff(params) {
  const { reset = false, tabId } = params || {};
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  if (!tab.active) {
    await chrome.tabs.update(tab.id, { active: true });
    await new Promise((r) => setTimeout(r, 350));
  }
  const current = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  const key = `shotBase_${tab.id}`;
  const stored = await chrome.storage.session.get(key);
  const base = stored[key];

  if (reset || !base) {
    await chrome.storage.session.set({ [key]: current });
    return { ok: true, baseline: true, note: reset ? 'Baseline redefinida.' : 'Baseline definido. Chame novamente para comparar.' };
  }

  const dec = async (dataUrl) => {
    const bmp = await createImageBitmap(await (await fetch(dataUrl)).blob());
    const cv = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = cv.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    return { bmp, cv, ctx, w: bmp.width, h: bmp.height };
  };
  const A = await dec(base);
  const B = await dec(current);
  if (A.w !== B.w || A.h !== B.h) {
    return { ok: true, sameSize: false, sizeBefore: { w: A.w, h: A.h }, sizeNow: { w: B.w, h: B.h }, note: 'Dimensões mudaram (viewport/resolução). Reset para nova baseline.' };
  }
  const dA = A.ctx.getImageData(0, 0, A.w, A.h).data;
  const dB = B.ctx.getImageData(0, 0, B.w, B.h).data;
  let changed = 0;
  let minX = A.w, minY = A.h, maxX = -1, maxY = -1;
  const total = A.w * A.h;
  for (let y = 0; y < A.h; y++) {
    for (let x = 0; x < A.w; x++) {
      const i = (y * A.w + x) * 4;
      const d = Math.abs(dA[i] - dB[i]) + Math.abs(dA[i + 1] - dB[i + 1]) + Math.abs(dA[i + 2] - dB[i + 2]);
      if (d > 60) {
        changed++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  let diffImage = null;
  try {
    const overlay = new OffscreenCanvas(A.w, A.h);
    const octx = overlay.getContext('2d');
    octx.drawImage(A.bmp, 0, 0);
    const img = octx.getImageData(0, 0, A.w, A.h);
    for (let i = 0; i < img.data.length; i += 4) {
      const d = Math.abs(img.data[i] - dA[i]) + Math.abs(img.data[i + 1] - dA[i + 1]) + Math.abs(img.data[i + 2] - dA[i + 2]);
      if (d > 60) { img.data[i] = 255; img.data[i + 1] = 0; img.data[i + 2] = 0; img.data[i + 3] = 200; }
    }
    octx.putImageData(img, 0, 0);
    const blob = await overlay.convertToBlob({ type: 'image/png' });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    diffImage = 'data:image/png;base64,' + btoa(bin);
  } catch {}
  return {
    ok: true,
    sameSize: true,
    diffPct: +((changed / total) * 100).toFixed(2),
    changedPixels: changed,
    totalPixels: total,
    bbox: maxX >= 0 ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null,
    diffImage,
    note: 'Chame com reset=true para definir nova baseline.',
  };
}

async function toolWatchPage(params) {
  const { timeout = 15000, tabId } = params || {};
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (to) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      if (!window.__mutationCount) {
        window.__mutationCount = 0;
        new MutationObserver(() => { window.__mutationCount++; })
          .observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true });
      }
      const startUrl = location.href;
      const startCount = window.__mutationCount;
      const startTitle = document.title;
      const deadline = Date.now() + to;
      while (Date.now() < deadline) {
        if (location.href !== startUrl) return { ok: true, changed: 'url', url: location.href, title: document.title };
        if (window.__mutationCount !== startCount) return { ok: true, changed: 'dom', url: location.href, title: document.title, mutations: window.__mutationCount - startCount };
        await sleep(250);
      }
      return { ok: false, error: `Sem mudança em ${to}ms` };
    },
    args: [Math.max(1000, Number(timeout) || 15000)],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomDragDrop(params) {
  const { source, target, tabId } = params || {};
  if (!source || !target) throw new Error('source e target são obrigatórios');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (srcSel, tgtSel) => {
      const src = document.querySelector(srcSel);
      const tgt = document.querySelector(tgtSel);
      if (!src) return { ok: false, error: `Origem não encontrada: ${srcSel}` };
      if (!tgt) return { ok: false, error: `Alvo não encontrado: ${tgtSel}` };
      const dt = new DataTransfer();
      const opts = { bubbles: true, cancelable: true, dataTransfer: dt };
      src.dispatchEvent(new DragEvent('dragstart', opts));
      tgt.dispatchEvent(new DragEvent('dragover', opts));
      tgt.dispatchEvent(new DragEvent('drop', opts));
      src.dispatchEvent(new DragEvent('dragend', opts));
      return { ok: true, source: srcSel, target: tgtSel };
    },
    args: [String(source), String(target)],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}

async function toolDomClickRole(params) {
  const { role, name, index = 0, tabId } = params || {};
  if (!role) throw new Error('role é obrigatório');
  const tab = await getTargetTab(tabId);
  if (isRestricted(tab.url)) throw new Error('Cannot access this type of page');
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (r, nm, idx) => {
      const nameOf = (el) =>
        (el.getAttribute('aria-label') || '') ||
        (el.getAttribute('aria-labelledby')
          ? el.getAttribute('aria-labelledby').split(/\s+/).map((id) => (document.getElementById(id)?.textContent || '').trim()).filter(Boolean).join(' ')
          : '') ||
        (el.innerText || el.value || '').trim();
      const els = [];
      for (const el of document.querySelectorAll('button, a, input, [role]')) {
        const elRole = el.getAttribute('role') ||
          (el.tagName === 'BUTTON' ? 'button' : el.tagName === 'A' ? 'link' : el.type === 'checkbox' ? 'checkbox' : el.type === 'radio' ? 'radio' : null);
        if (elRole === r) els.push(el);
      }
      const wanted = nm ? String(nm).toLowerCase() : null;
      let target = null;
      if (wanted) {
        target = els.find((el) => { const t = nameOf(el).toLowerCase(); return t === wanted || t.includes(wanted); });
      } else {
        target = els[idx] || null;
      }
      if (!target) return { ok: false, error: `Nenhum elemento role="${r}"${nm ? ` com nome "${nm}"` : ''}` };
      target.scrollIntoView({ block: 'center' });
      target.click();
      return { ok: true, tag: target.tagName, role: r, name: nameOf(target).slice(0, 80) };
    },
    args: [String(role), name != null ? String(name) : null, Math.max(0, Number(index) || 0)],
  });
  const res = results?.[0]?.result;
  if (!res) throw new Error('Sem resultado do script');
  if (!res.ok) throw new Error(res.error);
  return res;
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getState') {
    sendResponse({ connected, hasToken: !!wsToken });
    return;
  }
  if (msg.type === 'setToken') {
    wsToken = msg.token;
    chrome.storage.local.set({ token: msg.token });
    sendResponse({ ok: true });
    return;
  }
  if (msg.type === 'connect') {
    startKeepalive();
    sendResponse({ ok: true });
    return;
  }
  if (msg.type === 'disconnect') {
    disconnect();
    sendResponse({ ok: true });
    return;
  }
});

// --- Auto-start on install/startup ---
chrome.runtime.onInstalled.addListener(() => startKeepalive());
chrome.runtime.onStartup.addListener(() => startKeepalive());
startKeepalive();
