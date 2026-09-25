/**
 * ollama-ocr.ts — Integração com glm-ocr via Ollama para OCR do calendário.
 *
 * Arquitetura:
 *  - Pull do modelo roda em background (fire-and-forget) com estado em memória
 *  - UI faz polling em /api/ollama-setup para ver progresso
 *  - Reindex só usa OCR se o modelo já estiver baixado (sem bloquear)
 */

export const OLLAMA_BASE = 'http://localhost:11434';
export const OCR_MODEL = 'glm-ocr';

/* ── Estado de pull em memória (persiste enquanto o servidor Next.js rodar) */
export interface PullState {
  model: string;
  status: 'idle' | 'pulling' | 'ready' | 'error';
  percent: number;          // 0–100
  downloadedGB: number;
  totalGB: number;
  lastMessage: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

const pullStates = new Map<string, PullState>();

export function getPullState(model = OCR_MODEL): PullState {
  return pullStates.get(model) ?? {
    model,
    status: 'idle',
    percent: 0,
    downloadedGB: 0,
    totalGB: 0,
    lastMessage: '',
  };
}

/* ── Verificações de disponibilidade ─────────────────────────────── */

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3_000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function listModels(): Promise<{ name: string; size: number }[]> {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!r.ok) return [];
    const data = (await r.json()) as { models?: { name: string; size: number }[] };
    return data.models ?? [];
  } catch {
    return [];
  }
}

export async function hasModel(name: string): Promise<boolean> {
  const models = await listModels();
  return models.some((m) => m.name === name || m.name.startsWith(name + ':'));
}

/* ── Pull em background (fire-and-forget) ────────────────────────── */

export function startPull(model = OCR_MODEL): void {
  const state = getPullState(model);
  if (state.status === 'pulling' || state.status === 'ready') return;

  pullStates.set(model, {
    model,
    status: 'pulling',
    percent: 0,
    downloadedGB: 0,
    totalGB: 0,
    lastMessage: 'Iniciando download...',
    startedAt: new Date().toISOString(),
  });

  console.log(`[OllamaOCR] Iniciando pull de "${model}" em background...`);

  // Fire-and-forget
  (async () => {
    try {
      const r = await fetch(`${OLLAMA_BASE}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model, stream: true }),
        // 60 min — modelos grandes
        signal: AbortSignal.timeout(3_600_000),
      });

      if (!r.ok) {
        const err = await r.text();
        throw new Error(`HTTP ${r.status}: ${err}`);
      }

      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line) as {
              status: string;
              total?: number;
              completed?: number;
              error?: string;
            };

            if (msg.error) throw new Error(msg.error);

            const current = pullStates.get(model)!;
            const update: PullState = { ...current, lastMessage: msg.status };

            if (msg.total && msg.completed) {
              update.percent = Math.floor((msg.completed / msg.total) * 100);
              update.downloadedGB = msg.completed / 1e9;
              update.totalGB = msg.total / 1e9;
            }

            pullStates.set(model, update);
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      pullStates.set(model, {
        ...getPullState(model),
        status: 'ready',
        percent: 100,
        lastMessage: 'Download concluído!',
        completedAt: new Date().toISOString(),
      });
      console.log(`[OllamaOCR] "${model}" baixado com sucesso.`);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      pullStates.set(model, {
        ...getPullState(model),
        status: 'error',
        error: errMsg,
        lastMessage: `Erro: ${errMsg}`,
      });
      console.error(`[OllamaOCR] Falha ao baixar "${model}":`, errMsg);
    }
  })();
}

/* ── ensureOcrModel — não-bloqueante: checa e dispara pull se necessário ── */

export async function ensureOcrModel(): Promise<boolean> {
  if (!(await isOllamaAvailable())) return false;

  if (await hasModel(OCR_MODEL)) {
    const s = getPullState(OCR_MODEL);
    if (s.status !== 'ready') pullStates.set(OCR_MODEL, { ...s, status: 'ready', percent: 100 });
    return true;
  }

  // Dispara pull em background — não bloqueia o reindex
  startPull(OCR_MODEL);
  return false;
}

/* ── OCR de uma imagem PNG em base64 ─────────────────────────────── */

export async function ocrImage(base64Png: string): Promise<string> {
  const r = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OCR_MODEL,
      prompt:
        'Extraia todo o texto desta imagem exatamente como aparece. ' +
        'Preserve todas as datas, nomes de eventos, meses e formatação. ' +
        'Retorne apenas o texto extraído, sem comentários.',
      images: [base64Png],
      stream: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!r.ok) throw new Error(`[OllamaOCR] OCR falhou: ${r.status}`);
  const data = (await r.json()) as { response?: string };
  return (data.response ?? '').trim();
}

/* ── Renderiza cada página do PDF como PNG e faz OCR ─────────────── */

export async function ocrPdf(
  url: string,
  onProgress?: (page: number, total: number) => void,
): Promise<string> {
  // Baixa o PDF como buffer
  const pdfRes = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!pdfRes.ok) throw new Error(`[OllamaOCR] Não foi possível baixar o PDF: ${pdfRes.status}`);
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

  // @napi-rs/canvas — implementação nativa de Canvas para Node.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createCanvas } = require('@napi-rs/canvas') as {
    createCanvas: (w: number, h: number) => {
      width: number;
      height: number;
      getContext: (type: '2d') => CanvasRenderingContext2D;
      toBuffer: (mime: 'image/png') => Buffer;
    };
  };

  // canvasFactory compatível com pdfjs — passado direto no construtor PDFParse
  const nodeCanvasFactory = {
    create(width: number, height: number) {
      const canvas = createCanvas(width, height);
      return { canvas, context: canvas.getContext('2d') };
    },
    reset(
      item: { canvas: { width: number; height: number }; context: unknown },
      width: number,
      height: number,
    ) {
      item.canvas.width = width;
      item.canvas.height = height;
    },
    destroy() {},
  };

  // PDFParse aceita qualquer opção válida do pdfjs getDocument() incluindo canvasFactory
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require('pdf-parse') as {
    PDFParse: new (opts: Record<string, unknown>) => {
      getScreenshot(opts?: { scale?: number }): Promise<{
        pages: Array<{
          pageNumber: number;
          dataUrl: string;
          data: Uint8Array;
        }>;
      }>;
    };
  };

  const parser = new PDFParse({
    data: new Uint8Array(pdfBuffer),
    canvasFactory: nodeCanvasFactory,
    imageDataUrl: true,
    imageBuffer: false,
  });

  const screenshots = await parser.getScreenshot({ scale: 2 });
  const pageTexts: string[] = [];

  for (const page of screenshots.pages) {
    console.log(`[OllamaOCR] OCR página ${page.pageNumber}/${screenshots.pages.length}`);    onProgress?.(page.pageNumber, screenshots.pages.length);    // dataUrl = "data:image/png;base64,..." — extrair só o base64
    const base64 = page.dataUrl.replace(/^data:image\/\w+;base64,/, '');

    try {
      const text = await ocrImage(base64);
      if (text) pageTexts.push(`=== Página ${page.pageNumber} ===\n${text}`);
    } catch (e) {
      console.warn(`[OllamaOCR] Falha na página ${page.pageNumber}:`, e);
    }
  }

  return pageTexts.join('\n\n');
}
