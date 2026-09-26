/**
 * /api/calendar-tool — test endpoint for the buscar_calendario tool.
 * POST { query: string, baseUrl: string } → returns raw chunks found.
 * Used to verify what data the tool returns for a given question.
 */
import { NextRequest } from 'next/server';
import { searchCalendar } from '@/lib/calendar-rag';

export async function POST(req: NextRequest) {
  let body: { query: string; baseUrl: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { query, baseUrl } = body;
  if (!query || !baseUrl) {
    return new Response(JSON.stringify({ error: 'Missing query or baseUrl' }), { status: 400 });
  }

  const result = await searchCalendar(query, baseUrl, 5);
  return new Response(JSON.stringify({ query, result: result ?? null }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
