import http from 'node:http';
import crypto from 'node:crypto';
import { createOpencodeClient } from '@opencode-ai/sdk';

const PORT = Number(process.env.PORT || 8787);
const DEFAULT_UPSTREAM = process.env.GATEWAY_DEFAULT_UPSTREAM || 'kilo';
const PROMPT_TIMEOUT_MS = Number(process.env.PROMPT_TIMEOUT_MS || 240000);

const UPSTREAMS = {
  kilo: {
    prefix: 'kilo',
    port: Number(process.env.KILO_PORT || 4096),
  },
  opencode: {
    prefix: 'opencode',
    port: Number(process.env.OPENCODE_PORT || 4097),
  },
};

for (const u of Object.values(UPSTREAMS)) {
  u.client = createOpencodeClient({ baseUrl: `http://127.0.0.1:${u.port}` });
}

const NATIVE_TOOLS_DISABLED = Object.fromEntries(
  ['bash','read','glob','grep','edit','write','task','webfetch','todowrite','websearch',
   'skill','apply_patch','plan_exit','suggest','question','background_process',
   'interactive_terminal','notify_user','send_file','kilo_memory_recall','kilo_memory_save',
   'kilo_local_recall'].map(t => [t, false])
);

let catalog = { entries: new Map(), models: [] };
let catalogAt = 0;
const CATALOG_TTL = 300_000;

async function loadCatalog(force = false) {
  if (!force && catalog.models.length && Date.now() - catalogAt < CATALOG_TTL) return catalog;
  const entries = new Map();
  const models = [];
  for (const key of Object.keys(UPSTREAMS)) {
    const up = UPSTREAMS[key];
    try {
      const r = await up.client.config.providers();
      const providers = r.data?.providers || [];
      const def = r.data?.default || {};
      let defaultEntry = null;
      for (const p of providers) {
        for (const modelID of Object.keys(p.models || {})) {
          const id = `${up.prefix}/${modelID}`;
          const entry = { upstream: key, providerID: p.id, modelID, id };
          if (!entries.has(id)) {
            entries.set(id, entry);
            models.push({ ...entry, display: `${p.id}: ${modelID}` });
          }
        }
      }
      const defProviderID = def[up.prefix] !== undefined ? up.prefix : Object.keys(def)[0];
      if (defProviderID && def[defProviderID]) {
        const found = [...entries.values()].find(e => e.upstream === key && e.providerID === defProviderID && e.modelID === def[defProviderID]);
        if (found) defaultEntry = found;
      }
      up.defaultEntry = defaultEntry || [...entries.values()].find(e => e.upstream === key) || null;
    } catch (e) {
      console.error(`catalog[${key}]:`, e.message || e);
      up.defaultEntry = up.defaultEntry || null;
    }
  }
  catalog = { entries, models };
  catalogAt = Date.now();
  return catalog;
}

async function resolveModel(model) {
  await loadCatalog();
  let rest = null;
  let upstreamKey = DEFAULT_UPSTREAM;
  if (typeof model === 'string' && model.trim()) {
    for (const key of Object.keys(UPSTREAMS)) {
      if (model.startsWith(`${UPSTREAMS[key].prefix}/`)) {
        upstreamKey = key;
        rest = model.slice(UPSTREAMS[key].prefix.length + 1);
        break;
      }
    }
    if (rest === null && !/^claude/i.test(model.trim())) {
      const guess = catalog.entries.get(`kilo/${model.trim()}`) ? 'kilo'
        : catalog.entries.get(`opencode/${model.trim()}`) ? 'opencode' : null;
      if (guess) { upstreamKey = guess; rest = model.trim(); }
    }
  }
  const up = UPSTREAMS[upstreamKey] || UPSTREAMS.kilo;
  if (rest) {
    let hit = catalog.entries.get(`${up.prefix}/${rest}`);
    if (!hit) {
      await loadCatalog(true);
      hit = catalog.entries.get(`${up.prefix}/${rest}`);
    }
    if (hit) return hit;
    console.warn(`modelo desconhecido "${model}", usando padrao do ${up.prefix}`);
  }
  return up.defaultEntry || { upstream: up.prefix, providerID: up.prefix, modelID: 'default', id: up.prefix + '/default' };
}

function errMsg(e) {
  return e?.data?.message || e?.message || (typeof e === 'string' ? e : JSON.stringify(e?.data || e)).slice(0, 300);
}

function stripInjected(text) {
  return text.replace(/\s*<environment_details>[\s\S]*?<\/environment_details>/g, '');
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.filter(c => c.type === 'text').map(c => c.text).join('\n');
}

function toolProtocol(tools) {
  if (!tools?.length) return '';
  const defs = tools.map(t =>
    `- ${t.name}: ${t.description || ''}\n  Parameters JSON Schema: ${JSON.stringify(t.input_schema || { type: 'object' })}`
  ).join('\n');
  return `
# TOOL CALLING PROTOCOL
You have access to these tools:
${defs}

To call a tool, output EXACTLY this format (raw, no markdown fence):
<tool_call>{"name":"ToolName","input":{"param":"value"}}</tool_call>

The content between <tool_call> and </tool_call> must be MINIFIED JSON ONLY: a "name" string and an "input" object. NEVER use XML, YAML or <args> tags inside <tool_call>.

Rules:
- Output at most ONE tool_call per response, placed at the very END of your reply.
- Any explanation you want to give must come BEFORE the tool_call.
- ALWAYS close the tag with </tool_call>.
- Do NOT simulate results. Stop immediately after </tool_call>. The result will be provided in the next turn wrapped in <tool_result>.
- If the conversation already contains a <tool_result> answering your pending question, USE that result in your reply and do NOT call the same tool again.
- If no tool is needed, just answer normally without any tags.
- NEVER repeat or mention <environment_details> blocks or similar metadata that may appear in the conversation.`.trim();
}

function serializeMessages(messages, hasTools) {
  const lines = [];
  for (const msg of messages.slice(0, -1)) {
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') { lines.push(`<user>\n${msg.content}\n</user>`); continue; }
      for (const c of Array.isArray(msg.content) ? msg.content : []) {
        if (c.type === 'tool_result') {
          lines.push(`<tool_result id="${c.tool_use_id || ''}">\n${textOf(c.content)}\n</tool_result>`);
        } else if (c.type === 'text') {
          lines.push(`<user>\n${c.text}\n</user>`);
        } else if (c.type === 'image') {
          lines.push('<user>[image attached]</user>');
        }
      }
    } else if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') { lines.push(`<assistant>\n${msg.content}\n</assistant>`); continue; }
      for (const c of Array.isArray(msg.content) ? msg.content : []) {
        if (c.type === 'text') lines.push(`<assistant>\n${c.text}\n</assistant>`);
        else if (c.type === 'thinking') continue;
        else if (c.type === 'tool_use' && hasTools) {
          lines.push(`<assistant>\n<tool_call>${JSON.stringify({ id: c.id, name: c.name, input: c.input })}</tool_call>\n</assistant>`);
        }
      }
    }
  }

  const last = messages[messages.length - 1];
  let prompt = '';
  if (last?.role === 'user') {
    if (typeof last.content === 'string') {
      prompt = last.content;
    } else {
      const rest = [];
      for (const c of Array.isArray(last.content) ? last.content : []) {
        if (c.type === 'tool_result') rest.push(`<tool_result id="${c.tool_use_id || ''}">\n${textOf(c.content)}\n</tool_result>`);
        else if (c.type === 'text') rest.push(c.text);
        else if (c.type === 'image') rest.push('[image attached]');
      }
      prompt = rest.join('\n\n');
    }
  } else if (last) {
    prompt = 'Continue.';
  }
  return { history: lines.filter(Boolean).join('\n\n'), prompt };
}

function parseParams(inner) {
  const input = {};
  const pre = /<([\w.-]+)>([\s\S]*?)<\/\1\s*>/g;
  let m;
  while ((m = pre.exec(inner))) {
    const raw = m[2].trim();
    if (/^<[\w.-]+>/.test(raw)) {
      Object.assign(input, parseParams(raw));
    } else {
      let val;
      try { val = JSON.parse(raw); } catch { val = raw; }
      input[m[1]] = val;
    }
  }
  return input;
}

function extractToolCall(bodyStr) {
  try {
    const obj = JSON.parse(bodyStr);
    if (obj && typeof obj.name === 'string') return { id: obj.id, name: obj.name, input: obj.input ?? {} };
  } catch {}
  const open = bodyStr.match(/<([A-Za-z_][\w.-]*)>/);
  if (!open) return null;
  const name = open[1];
  if (!/^[A-Z]/.test(name)) return null;
  let inner = bodyStr.slice(open.index + open[0].length);
  const closeRe = new RegExp(`</${name}\\s*>\\s*$`);
  inner = inner.replace(closeRe, '');
  const input = parseParams(inner);
  if (!Object.keys(input).length && inner.trim()) return null;
  return { name, input };
}

function parseSegments(text) {
  const segs = [];
  const re = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
  let idx = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > idx) segs.push({ type: 'text', text: text.slice(idx, m.index) });
    const seg = extractToolCall(m[1]);
    if (seg) {
      segs.push({ type: 'call', ...seg });
    } else {
      segs.push({ type: 'text', text: m[0] });
    }
    idx = re.lastIndex;
  }
  if (idx < text.length) segs.push({ type: 'text', text: text.slice(idx) });
  return segs;
}

function partialHold(pending) {
  const marker = '<tool_call>';
  const max = Math.min(pending.length, marker.length - 1);
  for (let k = max; k > 0; k--) {
    if (pending.endsWith(marker.slice(0, k))) return k;
  }
  return 0;
}

function newId() { return 'toolu_' + crypto.randomBytes(10).toString('hex'); }

class StreamTranslator {
  constructor(res, model) {
    this.res = res;
    this.model = model;
    this.blockIndex = 0;
    this.openType = null;
    this.pending = '';
    this.emittedRaw = 0;
    this.callsEmitted = 0;
    this.usage = { input_tokens: 0, output_tokens: 0 };
  }

  sse(event, data) {
    if (!this.res.writableEnded) this.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  start() {
    this.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    this.sse('message_start', {
      type: 'message_start',
      message: {
        id: 'msg_' + crypto.randomBytes(8).toString('hex'),
        type: 'message', role: 'assistant', model: this.model,
        content: [], stop_reason: null, stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0 },
      },
    });
  }

  ensureBlock(type) {
    if (this.openType !== type) {
      if (this.openType) this.sse('content_block_stop', { type: 'content_block_stop', index: this.blockIndex });
      this.blockIndex++;
      this.sse('content_block_start', {
        type: 'content_block_start', index: this.blockIndex,
        content_block: type === 'text'
          ? { type: 'text', text: '', citations: [] }
          : { type: 'tool_use', id: newId(), name: '', input: {} },
      });
      this.openType = type;
    }
  }

  closeOpen() {
    if (this.openType) {
      this.sse('content_block_stop', { type: 'content_block_stop', index: this.blockIndex });
      this.openType = null;
    }
  }

  emitText(t) {
    if (!t) return;
    this.ensureBlock('text');
    this.sse('content_block_delta', { type: 'content_block_delta', index: this.blockIndex, delta: { type: 'text_delta', text: t } });
  }

  emitCall(seg) {
    this.closeOpen();
    this.blockIndex++;
    const id = seg.id || newId();
    this.sse('content_block_start', { type: 'content_block_start', index: this.blockIndex, content_block: { type: 'tool_use', id, name: seg.name, input: {} } });
    this.sse('content_block_delta', { type: 'content_block_delta', index: this.blockIndex, delta: { type: 'input_json_delta', partial_json: JSON.stringify(seg.input) } });
    this.sse('content_block_stop', { type: 'content_block_stop', index: this.blockIndex });
  }

  feed(delta) {
    this.pending += delta;
    for (;;) {
      const i = this.pending.indexOf('<tool_call>');
      if (i === -1) {
        const hold = partialHold(this.pending);
        const out = this.pending.slice(0, this.pending.length - hold);
        if (out) { this.emitText(out); this.emittedRaw += out.length; }
        this.pending = this.pending.slice(this.pending.length - hold);
        return;
      }
      const j = this.pending.indexOf('</tool_call>', i);
      if (j === -1) {
        const pre = this.pending.slice(0, i);
        if (pre) { this.emitText(pre); this.emittedRaw += pre.length; }
        this.pending = this.pending.slice(i);
        return;
      }
      const pre = this.pending.slice(0, i);
      if (pre) { this.emitText(pre); this.emittedRaw += pre.length; }
      const body = this.pending.slice(i + 11, j);
      const rawTag = this.pending.slice(i, j + 12);
      const seg = extractToolCall(body);
      if (seg) { this.emitCall(seg); this.callsEmitted++; }
      else { this.emitText(rawTag); this.emittedRaw += rawTag.length; }
      this.pending = this.pending.slice(j + 12);
    }
  }

  finalize(fullText) {
    const segs = parseSegments(fullText);
    let callIdx = 0;
    for (const seg of segs) {
      if (seg.type === 'call') {
        if (callIdx >= this.callsEmitted) { this.emitCall(seg); this.callsEmitted++; }
        callIdx++;
      }
    }
    if (this.pending) {
      const i = this.pending.indexOf('<tool_call>');
      if (i !== -1) {
        const pre = this.pending.slice(0, i);
        if (pre) { this.emitText(pre); this.emittedRaw += pre.length; }
        const seg = extractToolCall(this.pending.slice(i + 11));
        if (seg) { this.emitCall(seg); this.callsEmitted++; }
        else { this.emitText(this.pending.slice(i)); }
      } else {
        this.emitText(this.pending);
      }
      this.pending = '';
    }
    this.closeOpen();
  }

  end(stopReason) {
    this.sse('message_delta', {
      type: 'message_delta',
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: this.usage,
    });
    this.sse('message_stop', { type: 'message_stop' });
    if (!this.res.writableEnded) this.res.end();
  }
}

async function handleMessages(req, res, body) {
  const entry = await resolveModel(body.model);
  const client = UPSTREAMS[entry.upstream].client;
  const stream = body.stream !== false;

  const session = await client.session.create({
    body: { title: 'claude-code-gateway', model: { providerID: entry.providerID, id: entry.modelID } },
  });
  const sid = session.data.id;
  let aborted = false;
  req.on('close', () => {
    if (!res.writableEnded && !res.destroyed) {
      aborted = true;
      client.session.abort({ path: { id: sid } }).catch(() => {});
    }
  });

  try {
    const hasTools = Array.isArray(body.tools) && body.tools.length > 0;
    const { history, prompt } = serializeMessages(body.messages || [], hasTools);
    const sysParts = [textOf(body.system), toolProtocol(body.tools)].filter(Boolean).join('\n\n');
    const userPart = [history, prompt].filter(Boolean).join('\n\n');
    const parts = [];
    if (sysParts) parts.push({ type: 'text', text: sysParts, synthetic: true });
    parts.push({ type: 'text', text: userPart });

    const promptPromise = client.session.prompt({
      path: { id: sid },
      body: { parts, model: { providerID: entry.providerID, modelID: entry.modelID }, tools: NATIVE_TOOLS_DISABLED },
    }).catch(e => ({ error: e }));

    const withTimeout = () => Promise.race([
      promptPromise,
      new Promise((_, rej) => setTimeout(() => {
        client.session.abort({ path: { id: sid } }).catch(() => {});
        rej(new Error(`upstream timeout apos ${PROMPT_TIMEOUT_MS}ms (modelo ${entry.providerID}/${entry.modelID})`));
      }, PROMPT_TIMEOUT_MS)),
    ]);

    if (!stream) {
      const result = await withTimeout();
      if (result.error) throw result.error;
      const info = result.data.info || {};
      const t = info.tokens || {};
      const fullText = stripInjected((result.data.parts || []).filter(p => p.type === 'text').map(p => p.text).join(''));
      const content = [];
      for (const seg of parseSegments(fullText)) {
        if (seg.type === 'text') { if (seg.text.trim()) content.push({ type: 'text', text: seg.text }); }
        else content.push({ type: 'tool_use', id: seg.id || newId(), name: seg.name, input: seg.input });
      }
      if (!content.length) content.push({ type: 'text', text: '' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'msg_' + crypto.randomBytes(8).toString('hex'),
        type: 'message', role: 'assistant', model: body.model || entry.modelID,
        content,
        stop_reason: content.some(c => c.type === 'tool_use') ? 'tool_use' : 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: t.input || 0, output_tokens: t.output || 0, cache_read_input_tokens: t.cache?.read || 0 },
      }));
      return;
    }

    const tr = new StreamTranslator(res, body.model || entry.modelID);
    tr.start();
    const done = promptPromise.then(r => {
      if (r.error) throw r.error;
      return r.data;
    });

    try {
      if (!aborted) {
        const { stream: events } = await client.event.subscribe();
        const partKinds = new Map();
        const buffered = new Map();
        const flush = (pid) => {
          const rec = buffered.get(pid);
          if (rec?.kind === 'text' && rec.chunks.length) {
            tr.feed(rec.chunks.join(''));
            rec.chunks = [];
          }
        };
        for (;;) {
          const race = await Promise.race([done.then(() => 'done'), events.next()]);
          if (race === 'done' || race.done) break;
          const e = race.value;
          if (!e || e.properties?.sessionID !== sid) continue;
          if (e.type === 'message.part.updated') {
            const pid = e.properties.part?.id;
            if (pid) {
              let rec = buffered.get(pid);
              if (!rec) { rec = { kind: null, chunks: [] }; buffered.set(pid, rec); }
              rec.kind = e.properties.part.type;
              flush(pid);
            }
          }
          if (e.type === 'message.part.delta' && e.properties.field === 'text' && !aborted) {
            const pid = e.properties.partID;
            let rec = buffered.get(pid);
            if (!rec) { rec = { kind: null, chunks: [] }; buffered.set(pid, rec); }
            rec.chunks.push(e.properties.delta || '');
            flush(pid);
          }
          if (e.type === 'session.idle') {
            const settled = await Promise.race([done.then(() => true), new Promise(r => setTimeout(() => r(false), 15000))]);
            if (settled) break;
          }
          if (aborted) break;
        }
      }
      const result = await Promise.race([withTimeout(), new Promise((_, rej) => setTimeout(() => rej(new Error('finalizacao timeout')), 30000))]);
      const info = result.info || {};
      const t = info.tokens || {};
      tr.usage = { input_tokens: t.input || 0, output_tokens: t.output || 0 };
      const fullText = (result.parts || []).filter(p => p.type === 'text').map(p => p.text).join('');
      tr.finalize(fullText);
      tr.end(parseSegments(fullText).some(s => s.type === 'call') ? 'tool_use' : 'end_turn');
    } catch (err) {
      tr.finalize('');
      tr.end('end_turn');
      console.error('stream error:', err.message || err);
    }
  } catch (error) {
    console.error('messages error:', errMsg(error));
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { type: 'api_error', message: errMsg(error) } }));
    } else if (!res.writableEnded) {
      res.end();
    }
  } finally {
    client.session.delete({ path: { id: sid } }).catch(() => {});
  }
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    const raw = Buffer.concat(chunks).toString();
    const url = new URL(req.url, `http://localhost:${PORT}`);

    try {
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          upstreams: Object.fromEntries(Object.entries(UPSTREAMS).map(([k, u]) => [k, `http://127.0.0.1:${u.port}`])),
          default_upstream: DEFAULT_UPSTREAM,
        }));
        return;
      }

      if (url.pathname === '/v1/models') {
        const cat = await loadCatalog(true);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          data: cat.models.map(m => ({
            id: m.id, type: 'model', display_name: `${m.upstream} / ${m.display}`,
            created_at: new Date().toISOString(),
          })),
          object: 'list',
        }));
        return;
      }

      if (url.pathname === '/v1/messages/count_tokens' && req.method === 'POST') {
        const body = JSON.parse(raw || '{}');
        const chars = JSON.stringify(body.messages || '').length;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ input_tokens: Math.ceil(chars / 4) }));
        return;
      }

      if (url.pathname === '/v1/messages' && req.method === 'POST') {
        const body = JSON.parse(raw || '{}');
        await handleMessages(req, res, body);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { type: 'not_found_error', message: `${req.method} ${url.pathname}` } }));
    } catch (err) {
      console.error('unhandled:', errMsg(err));
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
      if (!res.writableEnded) res.end(JSON.stringify({ error: { type: 'internal_error', message: errMsg(err) } }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`gateway em http://localhost:${PORT}`);
  console.log(`upstreams: ${Object.entries(UPSTREAMS).map(([k, u]) => `${k}@${u.port}`).join(', ')}`);
  console.log(`uso: ANTHROPIC_BASE_URL=http://localhost:${PORT} ANTHROPIC_AUTH_TOKEN=x claude`);
});
