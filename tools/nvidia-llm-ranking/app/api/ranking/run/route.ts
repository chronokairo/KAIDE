import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const scriptPath = path.resolve(process.cwd(), "scripts/generate-nvidia-ranking.mjs");
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const child = spawn("node", [scriptPath], {
        cwd: process.cwd(),
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      send({ type: "start", message: "Benchmark iniciado." });

      child.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        for (const line of text.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed) send({ type: "log", stream: "stdout", message: trimmed });
        }
      });

      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        for (const line of text.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed) send({ type: "log", stream: "stderr", message: trimmed });
        }
      });

      child.on("close", (code) => {
        send({ type: "done", code: code ?? 1 });
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
