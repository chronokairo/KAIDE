import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const provider = body.provider || 'ollama';
    const url = body.url;
    const cleanUrl = (url || (provider === 'lmstudio' ? 'http://localhost:1234/v1' : 'http://localhost:11434')).replace(/\/+$/, '');

    if (provider === 'ollama') {
      try {
        const res = await fetch(`${cleanUrl}/api/tags`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(3500),
        });

        if (res.ok) {
          const data = await res.json();
          const models = data?.models?.map((m: any) => m.name) || [];
          return NextResponse.json({ online: true, models, count: models.length, url: cleanUrl });
        }
      } catch (err: any) {
        return NextResponse.json({ online: false, error: err.message, url: cleanUrl });
      }
    } else if (provider === 'lmstudio') {
      try {
        const res = await fetch(`${cleanUrl}/models`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(3500),
        });

        if (res.ok) {
          const data = await res.json();
          const models = data?.data?.map((m: any) => m.id) || [];
          return NextResponse.json({ online: true, models, count: models.length, url: cleanUrl });
        }
      } catch (err: any) {
        return NextResponse.json({ online: false, error: err.message, url: cleanUrl });
      }
    }

    return NextResponse.json({ online: false, url: cleanUrl });
  } catch (err: any) {
    return NextResponse.json({ online: false, error: err.message }, { status: 500 });
  }
}
