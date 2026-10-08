import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY não configurada.' },
      { status: 500 },
    )
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system:
        'Você é Froia, um assistente especializado em design e UX. ' +
        'Ajude com design systems, prototipação, wireframes, pesquisa UX e acessibilidade. ' +
        'Responda sempre em português, de forma concisa e prática.',
      messages: (messages as { role: string; content: string }[]).map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  })

  if (!upstream.ok) {
    const body = await upstream.text()
    return NextResponse.json({ error: body }, { status: upstream.status })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
