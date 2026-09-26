import { NextRequest, NextResponse } from 'next/server';
import { analyzeMatriculaDraft, EMPTY_MATRICULA_DRAFT, type MatriculaDraft } from '@/lib/matricula';

function extractDraft(body: unknown): Partial<MatriculaDraft> {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const candidate = body as { draft?: Partial<MatriculaDraft> } & Partial<MatriculaDraft>;
  if (candidate.draft && typeof candidate.draft === 'object') {
    return candidate.draft;
  }

  return candidate;
}

export async function GET() {
  return NextResponse.json(analyzeMatriculaDraft(EMPTY_MATRICULA_DRAFT));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const analysis = analyzeMatriculaDraft(extractDraft(body));
    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}