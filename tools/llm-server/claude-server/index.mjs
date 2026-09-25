/**
 * SIGED LLM Bridge — Ollama-compatible HTTP server
 *
 * Modos (LLM_MODE):
 *   claude  – usa o binário `claude` local (padrão); fallback automático para Ollama
 *             quando o CLI não está autenticado (/login)
 *   ollama  – proxia diretamente para um servidor Ollama real
 *
 * Environment variables:
 *   PORT        – porta de escuta              (padrão: 11437)
 *   LLM_MODE    – "claude" | "ollama"          (padrão: "claude")
 *   CLAUDE_BIN  – caminho do binário claude    (padrão: "claude")
 *   OLLAMA_URL  – URL do Ollama (proxy e fallback) (padrão: "http://localhost:11434")
 */

import http from "http";
import https from "https";
import { spawn } from "child_process";
import { writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const PORT = Number(process.env.PORT ?? 11437);
const LLM_MODE = (process.env.LLM_MODE ?? "claude").toLowerCase();
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";
const OLLAMA_URL = (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\/$/, "");

// ─── Models ────────────────────────────────────────────────────────────────

const MODELS = [
  { name: "claude-sonnet-4-6", family: "claude-sonnet-4.6", alias: "sonnet", ctx: 200000 },
  { name: "claude-haiku-4-5", family: "claude-haiku-4.5", alias: "haiku", ctx: 200000 },
  { name: "claude-opus-4-7", family: "claude-opus-4.7", alias: "opus", ctx: 200000 },
];

function resolveModelAlias(ollamaName) {
  if (!ollamaName || ollamaName === "auto") return "sonnet";
  const n = ollamaName.split(":")[0].toLowerCase();
  if (n.includes("opus")) return "opus";
  if (n.includes("haiku")) return "haiku";
  return "sonnet";
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk.toString()));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  if (res.writableEnded) return;
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(json),
  });
  res.end(json);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function nowNano() {
  return Number(process.hrtime.bigint());
}

function isLoginError(msg) {
  return /login|API key/i.test(msg);
}

/**
 * Fallback: chama o Ollama upstream diretamente com o payload Ollama original.
 * Suporta streaming (NDJSON) e resposta única.
 */
function ollamaFallback(endpoint, payload, res) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const target = new URL(endpoint, OLLAMA_URL);
    const transport = target.protocol === "https:" ? https : http;

    const proxyReq = transport.request(
      {
        hostname: target.hostname,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
        path: target.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(Buffer.byteLength(body)),
        },
      },
      (proxyRes) => {
        const fwd = { "Access-Control-Allow-Origin": "*" };
        if (proxyRes.headers["content-type"]) fwd["Content-Type"] = proxyRes.headers["content-type"];
        if (proxyRes.headers["transfer-encoding"]) fwd["Transfer-Encoding"] = proxyRes.headers["transfer-encoding"];
        res.writeHead(proxyRes.statusCode ?? 200, fwd);
        proxyRes.pipe(res);
        proxyRes.on("end", resolve);
        proxyRes.on("error", reject);
      },
    );

    proxyReq.on("error", reject);
    proxyReq.write(body);
    proxyReq.end();
  });
}

// ─── Claude CLI invocation ─────────────────────────────────────────────────

/**
 * Invoca o claude CLI com --print.
 * - prompt: texto enviado via stdin
 * - system: system prompt opcional
 * - model: alias (sonnet/haiku/opus)
 * - imagePaths: caminhos de PNGs temporários para o claude ler
 * - onText: callback de streaming (se fornecido, usa --output-format stream-json)
 */
function invokeClaude({ model, prompt, system, imagePaths = [], onText }) {
  return new Promise((resolve, reject) => {
    const streaming = typeof onText === "function";

    const args = [
      "--print",
      "--output-format", streaming ? "stream-json" : "json",
      "--model", model,
      "--no-session-persistence",
    ];

    if (system) args.push("--system-prompt", system);

    // Permite que o claude leia arquivos de imagem temporários
    if (imagePaths.length > 0) {
      args.push("--add-dir", tmpdir());
      args.push("--allowedTools", "Read");
    }

    const proc = spawn(CLAUDE_BIN, args, { shell: false });

    // Envia o prompt via stdin (suporta prompts longos sem limite de argumento)
    proc.stdin.write(prompt, "utf8");
    proc.stdin.end();

    let stdout = "";
    const stderrParts = [];

    proc.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;

      if (streaming) {
        for (const line of text.split("\n")) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            // Emite texto dos content blocks do assistente
            if (ev.type === "assistant" && Array.isArray(ev.message?.content)) {
              for (const block of ev.message.content) {
                if (block.type === "text" && block.text) {
                  onText(block.text);
                }
              }
            }
          } catch { /* linha incompleta, ignorar */ }
        }
      }
    });

    proc.stderr.on("data", (c) => stderrParts.push(c.toString()));

    proc.on("close", () => {
      // Limpa arquivos temporários
      for (const p of imagePaths) {
        try { rmSync(p); } catch { /* ignorar */ }
      }

      if (streaming) {
        // Detecta erro de login mesmo em modo stream-json (CLI emite JSON único em vez de stream)
        const trimmed = stdout.trim();
        if (trimmed.startsWith("{")) {
          try {
            const result = JSON.parse(trimmed);
            if (result.is_error) {
              reject(new Error(result.result ?? "Claude CLI retornou erro"));
              return;
            }
          } catch { /* era stream normal, ignorar */ }
        }
        resolve("");
        return;
      }

      // Modo não-streaming: parse do JSON final
      try {
        const result = JSON.parse(stdout.trim());
        if (result.is_error) {
          const msg = result.result ?? "Claude CLI retornou erro";
          if (msg.includes("/login") || msg.includes("API key")) {
            reject(new Error(`Não autenticado. Execute: claude /login  |  ${msg}`));
          } else {
            reject(new Error(msg));
          }
        } else {
          resolve(result.result ?? "");
        }
      } catch {
        const err = stderrParts.join("").trim();
        reject(new Error(
          `Claude CLI: falha ao parsear resposta. stdout: ${stdout.slice(0, 300)}` +
          (err ? ` | stderr: ${err.slice(0, 200)}` : "")
        ));
      }
    });

    proc.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error(`claude CLI não encontrado (${CLAUDE_BIN}). Instale em https://claude.ai/code`));
      } else {
        reject(new Error(`Falha ao iniciar claude CLI (${CLAUDE_BIN}): ${err.message}`));
      }
    });
  });
}

// ─── Conversão de mensagens ────────────────────────────────────────────────

/**
 * Converte mensagens Ollama em { system, prompt, imagePaths }.
 * Conversas multi-turn são formatadas como Human/Assistant.
 * Imagens base64 são escritas em arquivos PNG temporários.
 */
function prepareMessages(ollamaMessages) {
  const system = ollamaMessages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n")
    .trim() || undefined;

  const nonSystem = ollamaMessages.filter((m) => m.role !== "system");
  const imagePaths = [];

  const parts = nonSystem.map((m) => {
    const role = m.role === "assistant" ? "Assistant" : "Human";
    let content = m.content ?? "";

    // Escreve imagens em temp e referencia o caminho no prompt
    if (m.images?.length) {
      const refs = m.images.map((b64) => {
        const path = join(tmpdir(), `siged-${randomUUID()}.png`);
        writeFileSync(path, Buffer.from(b64, "base64"));
        imagePaths.push(path);
        return path;
      });
      content = refs.map((p) => `<image>${p}</image>`).join("\n") +
        (content ? "\n" + content : "");
    }

    return nonSystem.length === 1 ? content : `${role}: ${content}`;
  });

  return { system, prompt: parts.join("\n\n"), imagePaths };
}

// ─── Handlers ─────────────────────────────────────────────────────────────

function handleTags(res) {
  const now = new Date().toISOString();
  const models = MODELS.map((m) => ({
    name: m.name,
    model: m.name,
    modified_at: now,
    size: 0,
    digest: `sha256:${"0".repeat(64)}`,
    details: {
      parent_model: "",
      format: "api",
      family: m.family,
      families: [m.family],
      parameter_size: `${m.ctx / 1000}Kctx`,
      quantization_level: "none",
    },
  }));
  sendJson(res, 200, { models });
}

async function handleChat(req, res) {
  const raw = await readBody(req);
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    sendError(res, 400, "invalid JSON in request body");
    return;
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    sendError(res, 400, "messages array is required");
    return;
  }

  const model = resolveModelAlias(payload.model);
  const stream = payload.stream !== false;
  const startNs = nowNano();
  const { system, prompt, imagePaths } = prepareMessages(payload.messages);

  try {
    if (stream) {
      // Headers adiados: se claude falhar antes do 1º chunk, ainda podemos fazer fallback
      let headersWritten = false;
      const writeHead = () => {
        if (!headersWritten) {
          res.writeHead(200, { "Content-Type": "application/x-ndjson", "Transfer-Encoding": "chunked" });
          headersWritten = true;
        }
      };

      await invokeClaude({
        model, prompt, system, imagePaths,
        onText: (text) => {
          writeHead();
          res.write(JSON.stringify({
            model: payload.model ?? model,
            created_at: new Date().toISOString(),
            message: { role: "assistant", content: text },
            done: false,
          }) + "\n");
        },
      });

      writeHead();
      const totalNs = nowNano() - startNs;
      res.write(JSON.stringify({
        model: payload.model ?? model,
        created_at: new Date().toISOString(),
        message: { role: "assistant", content: "" },
        done: true,
        done_reason: "stop",
        total_duration: totalNs,
      }) + "\n");
      res.end();
    } else {
      const text = await invokeClaude({ model, prompt, system, imagePaths });
      sendJson(res, 200, {
        model: payload.model ?? model,
        created_at: new Date().toISOString(),
        message: { role: "assistant", content: text },
        done: true,
        done_reason: "stop",
        total_duration: nowNano() - startNs,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isLoginError(message) && !res.headersSent) {
      console.warn("[/api/chat] claude não autenticado → Ollama fallback →", OLLAMA_URL);
      try {
        await ollamaFallback("/api/chat", payload, res);
      } catch (fbErr) {
        const fbMsg = fbErr instanceof Error ? fbErr.message : String(fbErr);
        if (!res.headersSent) sendError(res, 502, `claude não autenticado e Ollama indisponível: ${fbMsg}`);
        else res.end();
      }
      return;
    }
    console.error("[/api/chat] Error:", message);
    if (!res.headersSent) sendError(res, 500, `chat failed: ${message}`);
    else res.end();
  }
}

async function handleGenerate(req, res) {
  const raw = await readBody(req);
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    sendError(res, 400, "invalid JSON in request body");
    return;
  }

  const model = resolveModelAlias(payload.model);
  const stream = payload.stream !== false;
  const startNs = nowNano();

  const imagePaths = [];
  let prompt = payload.prompt ?? "";

  if (payload.images?.length) {
    const refs = payload.images.map((b64) => {
      const path = join(tmpdir(), `siged-${randomUUID()}.png`);
      writeFileSync(path, Buffer.from(b64, "base64"));
      imagePaths.push(path);
      return path;
    });
    prompt = refs.map((p) => `<image>${p}</image>`).join("\n") +
      (prompt ? "\n" + prompt : "");
  }

  try {
    if (stream) {
      let headersWritten = false;
      const writeHead = () => {
        if (!headersWritten) {
          res.writeHead(200, { "Content-Type": "application/x-ndjson", "Transfer-Encoding": "chunked" });
          headersWritten = true;
        }
      };

      await invokeClaude({
        model, prompt, system: payload.system, imagePaths,
        onText: (text) => {
          writeHead();
          res.write(JSON.stringify({
            model: payload.model ?? model,
            created_at: new Date().toISOString(),
            response: text,
            done: false,
          }) + "\n");
        },
      });

      writeHead();
      const totalNs = nowNano() - startNs;
      res.write(JSON.stringify({
        model: payload.model ?? model,
        created_at: new Date().toISOString(),
        response: "",
        done: true,
        done_reason: "stop",
        total_duration: totalNs,
      }) + "\n");
      res.end();
    } else {
      const text = await invokeClaude({ model, prompt, system: payload.system, imagePaths });
      sendJson(res, 200, {
        model: payload.model ?? model,
        created_at: new Date().toISOString(),
        response: text,
        done: true,
        done_reason: "stop",
        total_duration: nowNano() - startNs,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isLoginError(message) && !res.headersSent) {
      console.warn("[/api/generate] claude não autenticado → Ollama fallback →", OLLAMA_URL);
      try {
        await ollamaFallback("/api/generate", payload, res);
      } catch (fbErr) {
        const fbMsg = fbErr instanceof Error ? fbErr.message : String(fbErr);
        if (!res.headersSent) sendError(res, 502, `claude não autenticado e Ollama indisponível: ${fbMsg}`);
        else res.end();
      }
      return;
    }
    console.error("[/api/generate] Error:", message);
    if (!res.headersSent) sendError(res, 500, `generation failed: ${message}`);
    else res.end();
  }
}

// ─── Ollama proxy ────────────────────────────────────────────────────────────

/**
 * Proxia a requisição atual para o servidor Ollama upstream e faz pipe da resposta.
 * Funciona com respostas streaming (NDJSON / chunked) e respostas normais.
 */
function proxyToOllama(req, res, body) {
  const target = new URL(req.url ?? "/", OLLAMA_URL);
  const transport = target.protocol === "https:" ? https : http;

  const headers = { "Content-Type": req.headers["content-type"] ?? "application/json" };
  if (body) headers["Content-Length"] = String(Buffer.byteLength(body));

  const proxyReq = transport.request(
    {
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      path: target.pathname + target.search,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      const fwd = {};
      if (proxyRes.headers["content-type"]) fwd["Content-Type"] = proxyRes.headers["content-type"];
      if (proxyRes.headers["transfer-encoding"]) fwd["Transfer-Encoding"] = proxyRes.headers["transfer-encoding"];
      fwd["Access-Control-Allow-Origin"] = "*";
      res.writeHead(proxyRes.statusCode ?? 200, fwd);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (err) => {
    console.error("[proxy] Ollama upstream error:", err.message);
    if (!res.headersSent) sendError(res, 502, `Ollama upstream unreachable: ${err.message}`);
    else res.end();
  });

  if (body) proxyReq.write(body);
  proxyReq.end();
}

// ─── Server ────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  const method = req.method ?? "GET";
  const url = (req.url ?? "/").split("?")[0];

  console.log(`[server] ${method} ${url}`);

  if (method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // ── Modo Ollama: proxia tudo para OLLAMA_URL ──────────────────────────────
  if (LLM_MODE === "ollama") {
    try {
      const body = (method === "POST" || method === "PUT") ? await readBody(req) : "";
      proxyToOllama(req, res, body);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!res.headersSent) sendError(res, 500, `proxy error: ${message}`);
    }
    return;
  }

  // ── Modo Claude CLI ───────────────────────────────────────────────────────
  try {
    if (method === "GET" && url === "/") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Ollama is running");
      return;
    }
    if (method === "HEAD" && url === "/") { res.writeHead(200); res.end(); return; }
    if (method === "GET" && (url === "/api/tags" || url === "/api/models")) {
      handleTags(res); return;
    }
    if (method === "GET" && url === "/api/version") {
      sendJson(res, 200, { version: "0.1.0-claude-cli" }); return;
    }
    if (method === "POST" && url === "/api/chat") {
      await handleChat(req, res); return;
    }
    if (method === "POST" && url === "/api/generate") {
      await handleGenerate(req, res); return;
    }
    sendError(res, 404, `unknown endpoint: ${method} ${url}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[server] Unhandled error:", message);
    if (!res.headersSent) sendError(res, 500, `internal server error: ${message}`);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  if (LLM_MODE === "ollama") {
    console.log(`SIGED LLM Bridge → http://127.0.0.1:${PORT}  [modo: ollama → ${OLLAMA_URL}]`);
  } else {
    console.log(`SIGED LLM Bridge → http://127.0.0.1:${PORT}  [modo: claude CLI → ${CLAUDE_BIN}  |  fallback: ${OLLAMA_URL}]`);
  }
  console.log(`  /api/tags      listar modelos`);
  console.log(`  /api/chat      chat Ollama-compatible`);
  console.log(`  /api/generate  generate Ollama-compatible`);
  console.log(`  Mude o modo com LLM_MODE=claude|ollama`);
});

