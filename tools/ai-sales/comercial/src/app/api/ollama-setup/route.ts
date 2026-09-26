import { NextResponse } from 'next/server';
import {
  isOllamaAvailable,
  listModels,
  hasModel,
  getPullState,
  startPull,
  OCR_MODEL,
} from '@/lib/ollama-ocr';

export const dynamic = 'force-dynamic';

/** GET /api/ollama-setup — status do Ollama e do modelo glm-ocr */
export async function GET() {
  const available = await isOllamaAvailable();

  if (!available) {
    return NextResponse.json({
      available: false,
      model: OCR_MODEL,
      pullState: getPullState(OCR_MODEL),
      models: [],
    });
  }

  const [models, modelReady] = await Promise.all([listModels(), hasModel(OCR_MODEL)]);

  const pullState = getPullState(OCR_MODEL);

  return NextResponse.json({
    available: true,
    model: OCR_MODEL,
    modelReady,
    pullState: modelReady ? { ...pullState, status: 'ready', percent: 100 } : pullState,
    models: models.map((m) => ({ name: m.name, sizeGB: (m.size / 1e9).toFixed(2) })),
  });
}

/** POST /api/ollama-setup — inicia o download do glm-ocr */
export async function POST() {
  const available = await isOllamaAvailable();

  if (!available) {
    return NextResponse.json(
      { error: 'Ollama não está rodando em localhost:11434' },
      { status: 503 },
    );
  }

  const already = await hasModel(OCR_MODEL);
  if (already) {
    return NextResponse.json({ message: `${OCR_MODEL} já está disponível`, status: 'ready' });
  }

  const current = getPullState(OCR_MODEL);
  if (current.status === 'pulling') {
    return NextResponse.json({
      message: 'Download já em andamento',
      pullState: current,
    });
  }

  startPull(OCR_MODEL);

  return NextResponse.json({
    message: `Download de "${OCR_MODEL}" iniciado em background`,
    pullState: getPullState(OCR_MODEL),
  });
}
