import { chromium } from 'playwright';
import { requireApiKey } from './application/configuration.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import http from 'http';
import https from 'https';
import { networkInterfaces } from 'os';

const TARGET = 'https://japiim.com.br';
const API_KEY = requireApiKey(process.env);
const SESSION_FILE = 'session.json';
const MODELS_CACHE_FILE = 'models.json';
const PORT = 3000;
const targetUrl = new URL(TARGET);

let browser, sessionCookies = [], sessionValid = false;

const modelsCache = existsSync(MODELS_CACHE_FILE)
  ? JSON.parse(readFileSync(MODELS_CACHE_FILE, 'utf-8'))
  : null;

// OpenAI-compatible model list from cache
function openaiModels() {
  if (!modelsCache?.data) return null;
  return {
    object: 'list',
    data: modelsCache.data.map(m => ({
      id: m.id,
      object: 'model',
      created: m.created || m.info?.created_at || 1779321600,
      owned_by: m.owned_by || 'openai',
    })),
  };
}

const MODEL_PATHS = new Set([
  '/api/models', '/api/v1/models', '/v1/models', '/models',
]);

const CHAT_PATHS = new Set([
  '/api/chat/completions', '/api/v1/chat/completions',
  '/v1/chat/completions', '/chat/completions',
]);

function cookieHeader() {
  return sessionCookies
    .filter(c => !c.expires || Date.now() < c.expires * 1000)
    .map(c => `${c.name}=${c.value}`).join('; ');
}

function saveCookies(cookies) {
  sessionCookies = cookies;
  writeFileSync(SESSION_FILE, JSON.stringify({ cookies }, null, 2));
}

function fixContentType(ct) {
  if (!ct) return 'application/json';
  // Target sometimes concatenates types (ex: "text/event-stream; charset=utf-8application/javascript")
  const match = ct.match(/^((?:text\/event-stream|application\/json|text\/plain)(?:;\s*charset=[^;]+)?)/);
  return match ? match[1] : ct.split(/[;, ]/)[0];
}

async function tryRestoreSession() {
  if (!existsSync(SESSION_FILE)) return false;
  try {
    const data = JSON.parse(readFileSync(SESSION_FILE, 'utf-8'));
    if (!data.cookies?.length) return false;
    sessionCookies = data.cookies;
    const result = await new Promise((resolve, reject) => {
      const r = https.get({
        hostname: targetUrl.hostname, port: 443, path: '/api/v1/models',
        timeout: 15000, rejectUnauthorized: true,
        headers: { Authorization: `Bearer ${API_KEY}`, Cookie: cookieHeader(),
          'User-Agent': 'Mozilla/5.0' },
      }, (resp) => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => resolve(d)); });
      r.on('error', reject); r.end();
    });
    JSON.parse(result);
    console.log('Session restored from session.json.');
    sessionValid = true;
    return true;
  } catch (err) {
    console.log('Session expired, need browser auth.');
    sessionCookies = [];
    return false;
  }
}

async function ensureSession() {
  if (sessionValid) return;
  console.log('Opening browser for WAF challenge...');
  browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1280, height: 800 }, locale: 'pt-BR',
  });
  if (sessionCookies.length) await ctx.addCookies(sessionCookies);
  const page = await ctx.newPage();
  page.goto(TARGET, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  console.log('Solve the CAPTCHA in the browser window...');
  await page.waitForFunction(() => {
    const html = document.documentElement.innerHTML.toLowerCase();
    return !html.includes('azure waf') && !html.includes('captcha') && html.length > 500;
  }, { timeout: 300000 });
  saveCookies(await ctx.cookies());
  console.log('WAF challenge solved! Session saved.');
  sessionValid = true;
}

function forwardRequest(req, res, targetPath) {
  const bodyChunks = [];
  req.on('data', c => bodyChunks.push(c));
  req.on('end', async () => {
    try {
      if (!sessionValid) await ensureSession();
      const body = Buffer.concat(bodyChunks);
      const url = new URL(`${TARGET}${targetPath}`);
      const options = {
        hostname: url.hostname, port: 443, path: url.pathname + url.search,
        method: req.method, rejectUnauthorized: true,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Cookie: cookieHeader(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': req.headers['content-type'] || 'application/json',
          Accept: req.headers['accept'] || '*/*',
          'Content-Length': body.length || 0,
        },
      };

      const proxyReq = https.request(options, (proxyRes) => {
        try {
          if (proxyRes.statusCode === 403) {
            proxyRes.resume();
            console.log('Session expired, re-authenticating...');
            sessionValid = false;
            ensureSession().then(() => forwardRequest(req, res, targetPath)).catch(e => {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: e.message }));
            });
            return;
          }

          const ct = fixContentType(proxyRes.headers['content-type']);
          const headers = {
            'Content-Type': ct,
            'Access-Control-Allow-Origin': '*',
          };
          if (proxyRes.headers['transfer-encoding']) headers['Transfer-Encoding'] = proxyRes.headers['transfer-encoding'];

          res.writeHead(proxyRes.statusCode, headers);

          if (proxyRes.headers['set-cookie']) {
            for (const c of proxyRes.headers['set-cookie']) {
              const [nv] = c.split(';');
              const [n, ...vs] = nv.split('=');
              const v = vs.join('=');
              const idx = sessionCookies.findIndex(x => x.name === n);
              const cookie = { name: n, value: v, domain: url.hostname, path: '/' };
              if (idx >= 0) sessionCookies[idx] = cookie;
              else sessionCookies.push(cookie);
            }
            writeFileSync(SESSION_FILE, JSON.stringify({ cookies: sessionCookies }, null, 2));
          }

          proxyRes.pipe(res);
          proxyRes.on('error', () => { if (!res.destroyed) res.end(); });
        } catch (e) {
          if (!res.destroyed) { res.writeHead(502); res.end(JSON.stringify({ error: e.message })); }
        }
      });

      proxyReq.on('error', (e) => {
        console.error('Request error:', e.message);
        if (!res.destroyed) { res.writeHead(502); res.end(JSON.stringify({ error: e.message })); }
      });

      if (body.length) proxyReq.write(body);
      proxyReq.end();
    } catch (e) {
      if (!res.destroyed) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
    }
  });
  req.on('error', () => { if (!res.destroyed) { res.writeHead(500); res.end('{"error":"request error"}'); } });
}

function handleRequest(req, res) {
  const path = req.url;
  console.log(`  ${req.method} ${path}`);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
    'Access-Control-Allow-Headers': '*',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...corsHeaders, 'Access-Control-Max-Age': '86400' });
    return res.end();
  }

  // Root health check
  if (path === '/' || path === '/health') {
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', proxy: 'japiim-waf-bypass' }));
  }

  // Model listing (from cache, no auth needed)
  if (MODEL_PATHS.has(path)) {
    const models = openaiModels();
    if (!models) {
      res.writeHead(503, { ...corsHeaders, 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Models not loaded' }));
    }
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(models));
  }

  // Chat completions – proxy to Japiim v1 path
  if (CHAT_PATHS.has(path)) {
    return forwardRequest(req, res, '/api/v1/chat/completions');
  }

  // All other paths proxy as-is (e.g. /api/v1/embeddings)
  forwardRequest(req, res, path);
}

function printBanner() {
  console.log(`\n\u250C Japiim Proxy (Open WebUI) - http://localhost:${PORT}`);
  console.log(`\u2502 Modelos: ${modelsCache?.data?.length || 0} (cache)`);
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) console.log(`\u2502 Rede: http://${iface.address}:${PORT}`);
    }
  }
  console.log(`\u2502 Sess\u00E3o: ${sessionValid ? 'restaurada' : 'autenticacao pendente'}`);
  console.log(`\u2514 Proxy pronto\n`);
}

const server = http.createServer(handleRequest);

(async () => {
  const restored = await tryRestoreSession();
  if (restored) {
    printBanner();
    server.listen(PORT);
  } else {
    await ensureSession();
    printBanner();
    server.listen(PORT);
  }
})();
