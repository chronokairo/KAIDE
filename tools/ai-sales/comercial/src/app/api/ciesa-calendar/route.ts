/**
 * GET  /api/ciesa-calendar — returns indexing status for the current (or given) year
 * POST /api/ciesa-calendar — triggers a full re-index of the academic calendar PDF
 *
 * Body for POST: { baseUrl: string; year?: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { indexCalendar, getCalendarStatus } from '@/lib/calendar-rag';

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get('year');
  const year = yearParam ? parseInt(yearParam, 10) : undefined;

  try {
    const status = await getCalendarStatus(year);
    return NextResponse.json(status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: { baseUrl?: string; year?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { baseUrl, year } = body;

  if (!baseUrl) {
    return NextResponse.json({ error: 'baseUrl is required' }, { status: 400 });
  }

  const targetYear = year ?? new Date().getFullYear();

  try {
    const result = await indexCalendar(targetYear, baseUrl);
    const status = await getCalendarStatus(targetYear);
    return NextResponse.json({ ...result, ...status, message: 'Indexing complete' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
