import * as mupdf from "mupdf";
import { createWorker } from "tesseract.js";
import path from "path";

const LLM_BASE = process.env.LLM_BASE_URL ?? "http://localhost:11434";

// por.traineddata lives at packages/web/ (project root when Next.js runs)
const LANG_PATH = path.resolve(process.cwd(), ".");

export async function ocrPdf(buffer: Buffer): Promise<string> {
  const doc = mupdf.Document.openDocument(
    buffer as unknown as ArrayBuffer,
    "application/pdf"
  );
  const numPages = doc.countPages();
  const pages: string[] = [];

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  try {
    for (let i = 0; i < numPages; i++) {
      const page = doc.loadPage(i);

      // Fast path: extract embedded text via MuPDF
      const textJson = page.toStructuredText("preserve-whitespace").asJSON();
      const parsed = JSON.parse(textJson) as {
        blocks?: Array<{ lines?: Array<{ spans?: Array<{ text: string }> }> }>;
      };
      const embedded = (parsed.blocks ?? [])
        .flatMap((b) => b.lines ?? [])
        .flatMap((l) => l.spans ?? [])
        .map((s) => s.text)
        .join(" ")
        .trim();

      if (embedded) {
        pages.push(embedded);
        continue;
      }

      // Render page to PNG for OCR
      const scale = 2.5;
      const matrix = mupdf.Matrix.scale(scale, scale);
      const pixmap = page.toPixmap(
        matrix,
        mupdf.ColorSpace.DeviceRGB,
        false,
        true
      );
      const pngBytes = pixmap.asPNG();
      const pngBuffer = Buffer.from(pngBytes);

      // Tesseract OCR (local, no API cost)
      let tesseractText = "";
      try {
        if (!worker) {
          worker = await createWorker("por", 1, { langPath: LANG_PATH });
        }
        const { data } = await worker.recognize(pngBuffer);
        tesseractText = data.text?.trim() ?? "";
      } catch (e) {
        console.error(`[ocr] Tesseract falhou na página ${i + 1}:`, e);
      }

      if (tesseractText) {
        // Pass raw OCR text to Claude via text prompt for cleanup
        const cleanRes = await fetch(`${LLM_BASE}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "auto",
            prompt:
              `O texto abaixo foi extraído por OCR (Tesseract) de um documento digitalizado. ` +
              `Corrija erros de OCR, normalize espaçamento e preserve o conteúdo integral sem adicionar nem remover informação:\n\n${tesseractText}`,
            stream: false,
          }),
        });

        if (cleanRes.ok) {
          const cleanData = (await cleanRes.json()) as { response?: string };
          const cleaned = cleanData.response?.trim();
          if (cleaned) {
            pages.push(cleaned);
            continue;
          }
        } else {
          console.error(
            `[ocr] Limpeza LLM falhou: ${cleanRes.status} ${cleanRes.statusText}`
          );
        }

        // LLM cleanup unavailable — use raw Tesseract output
        pages.push(tesseractText);
        continue;
      }

      // Final fallback: Claude vision (Tesseract returned nothing)
      const b64 = pngBuffer.toString("base64");
      const visionRes = await fetch(`${LLM_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "auto",
          prompt:
            "Transcreva integralmente todo o texto visível nesta imagem. Preserve a ordem de leitura natural. Não adicione comentários, explicações ou formatação extra — apenas o texto transcrito.",
          images: [b64],
          stream: false,
        }),
      });

      if (!visionRes.ok) {
        console.error(
          `[ocr] Visão LLM falhou: ${visionRes.status} ${visionRes.statusText}`
        );
        continue;
      }

      const visionData = (await visionRes.json()) as { response?: string };
      const pageText = visionData.response?.trim();
      if (pageText) pages.push(pageText);
    }
  } finally {
    if (worker) await worker.terminate();
  }

  return pages.join("\n\n").trim();
}
