'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { Bot, Send, Loader2, Sparkles, Trash2, RotateCcw, Terminal } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

// ── Slash commands mirrored from the Froia TUI ──────────────────────────────
type SlashCmd = {
  name: string
  description: string
  aliases?: string[]
  /** 'local' = handled client-side, 'prompt' = sends a message to the API */
  kind: 'local' | 'prompt'
  /** For kind='prompt': the text sent to the API. Use {args} for user arguments. */
  prompt?: string
}

const SLASH_COMMANDS: SlashCmd[] = [
  {
    name: 'clear',
    aliases: ['reset', 'new'],
    description: 'Limpar histórico da conversa',
    kind: 'local',
  },
  {
    name: 'help',
    description: 'Mostrar comandos disponíveis',
    kind: 'local',
  },
  {
    name: 'compact',
    description: 'Compactar histórico mantendo um resumo no contexto',
    kind: 'prompt',
    prompt: 'Por favor, faça um resumo conciso de tudo que discutimos até agora nesta conversa, preservando as informações mais importantes. Em seguida, continue a partir desse resumo.',
  },
  {
    name: 'plan',
    description: 'Criar ou visualizar um plano para a tarefa atual',
    kind: 'prompt',
    prompt: 'Crie um plano detalhado passo a passo para: {args}',
  },
  {
    name: 'review',
    description: 'Revisar o design ou código discutido',
    kind: 'prompt',
    prompt: 'Faça uma revisão crítica do que discutimos até agora, apontando problemas, melhorias e boas práticas: {args}',
  },
  {
    name: 'diff',
    description: 'Analisar e explicar mudanças não commitadas',
    kind: 'prompt',
    prompt: 'Analise e explique as mudanças mais recentes que discutimos, como se fosse um diff de código. {args}',
  },
  {
    name: 'skills',
    description: 'Listar habilidades e áreas de expertise do Froia',
    kind: 'prompt',
    prompt: 'Liste todas as suas habilidades, especialidades e áreas de conhecimento como agente de design IA.',
  },
  {
    name: 'memory',
    description: 'Mostrar o que o Froia se lembra desta sessão',
    kind: 'prompt',
    prompt: 'Resuma tudo o que você aprendeu ou memorizou sobre mim e meus projetos nesta sessão.',
  },
  {
    name: 'status',
    description: 'Mostrar status do agente e configurações',
    kind: 'prompt',
    prompt: 'Mostre seu status atual: modelo em uso, configurações e capacidades disponíveis.',
  },
  {
    name: 'model',
    description: 'Informações sobre o modelo de IA em uso',
    kind: 'prompt',
    prompt: 'Qual modelo de IA você está usando atualmente? Descreva suas capacidades.',
  },
  {
    name: 'cost',
    description: 'Estimativa de custo e uso da sessão atual',
    kind: 'prompt',
    prompt: 'Dê uma estimativa do uso de tokens e custo desta conversa até agora.',
  },
  {
    name: 'commit',
    description: 'Sugerir uma mensagem de commit para as mudanças discutidas',
    kind: 'prompt',
    prompt: 'Baseado no que discutimos, sugira uma mensagem de commit convencional (conventional commits) para as mudanças: {args}',
  },
  {
    name: 'security',
    description: 'Revisar aspectos de segurança do código/design',
    kind: 'prompt',
    prompt: 'Faça uma revisão de segurança do que discutimos, identificando vulnerabilidades OWASP e boas práticas: {args}',
  },
  {
    name: 'advisor',
    description: 'Obter conselho de design ou arquitetura',
    kind: 'prompt',
    prompt: 'Como consultor sênior de design e UX, dê sua opinião honesta e recomendações sobre: {args}',
  },
  {
    name: 'init',
    description: 'Inicializar um novo projeto de design',
    kind: 'prompt',
    prompt: 'Ajude-me a inicializar um novo projeto de design: {args}. Sugira estrutura, ferramentas e próximos passos.',
  },
]

const WELCOME = 'Olá! Sou o Froia, seu agente de design IA.\nDigite / para ver os comandos disponíveis.'

export default function FroiaChat({ open, width = 340, onWidthChange }: { open: boolean; width?: number; onWidthChange?: (w: number) => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cmdPicker, setCmdPicker] = useState(false)
  const [cmdFilter, setCmdFilter] = useState('')
  const [cmdIndex, setCmdIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(width)

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    dragStartX.current = e.clientX
    dragStartWidth.current = width
    setIsDragging(true)
    const onMove = (ev: MouseEvent) => {
      const delta = dragStartX.current - ev.clientX
      const next = Math.min(640, Math.max(240, dragStartWidth.current + delta))
      onWidthChange?.(next)
    }
    const onUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Filtered slash commands
  const filteredCmds = SLASH_COMMANDS.filter(c =>
    c.name.startsWith(cmdFilter) ||
    (c.aliases ?? []).some(a => a.startsWith(cmdFilter))
  )

  // Keep index in bounds
  useEffect(() => {
    setCmdIndex(i => Math.min(i, Math.max(0, filteredCmds.length - 1)))
  }, [filteredCmds.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const stop = () => {
    abortRef.current?.abort()
    setLoading(false)
  }

  // ── Client-side command handlers ─────────────────────────────────────────
  function handleLocalCommand(cmd: SlashCmd) {
    if (cmd.name === 'clear') {
      setMessages([])
      setError(null)
      return
    }
    if (cmd.name === 'help') {
      const helpText = SLASH_COMMANDS.map(c =>
        `/${c.name}${c.aliases ? ' (' + c.aliases.map(a => '/' + a).join(', ') + ')' : ''} — ${c.description}`
      ).join('\n')
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `**Comandos disponíveis:**\n\n${helpText}` },
      ])
    }
  }

  // ── Apply a selected slash command ───────────────────────────────────────
  function applyCommand(cmd: SlashCmd, args: string) {
    setCmdPicker(false)
    setInput('')
    if (cmd.kind === 'local') {
      handleLocalCommand(cmd)
      return
    }
    // prompt-based: fire immediately with the resolved prompt
    const text = (cmd.prompt ?? cmd.description).replace('{args}', args).trim()
    fireMessage(text, `/${cmd.name}${args ? ' ' + args : ''}`)
  }

  // ── Core send (separated so commands can fire it directly) ───────────────
  const fireMessage = useCallback(async (apiText: string, displayText?: string) => {
    setError(null)
    const userMsg: Message = { role: 'user', content: displayText ?? apiText }
    const history: Message[] = [...messages, { role: 'user', content: apiText }]
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setLoading(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/froia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: ctrl.signal,
      })

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => 'Erro desconhecido')
        throw new Error(msg)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw || raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              setMessages(prev => {
                const msgs = [...prev]
                const last = msgs[msgs.length - 1]
                msgs[msgs.length - 1] = { ...last, content: last.content + parsed.delta.text }
                return msgs
              })
            }
          } catch { /* ignore malformed SSE */ }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Erro ao conectar com o agente.'
      setMessages(prev => prev.slice(0, -1))
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    await fireMessage(text)
  }, [input, loading, fireMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (cmdPicker && filteredCmds.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setCmdIndex(i => Math.min(i + 1, filteredCmds.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setCmdIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        const parts = input.slice(1).split(' ')
        applyCommand(filteredCmds[cmdIndex], parts.slice(1).join(' '))
        return
      }
      if (e.key === 'Escape') { setCmdPicker(false); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
    if (val.startsWith('/')) {
      const parts = val.slice(1).split(' ')
      setCmdFilter(parts[0].toLowerCase())
      setCmdPicker(parts.length <= 1) // hide picker once args are being typed
      setCmdIndex(0)
    } else {
      setCmdPicker(false)
    }
  }

  return (
    <aside
      aria-label="Agente Froia"
      style={{
        position: 'fixed',
        right: 0,
        top: 56,
        bottom: 0,
        zIndex: 50,
        width: open ? width : 0,
        background: 'var(--bg1)',
        borderLeft: open ? '1px solid var(--border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'width 200ms ease',
      }}
    >
      {/* Drag handle */}
      {open && (
        <div
          onMouseDown={handleDragStart}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
            cursor: 'col-resize', zIndex: 10,
            background: isDragging ? 'var(--accent)' : 'transparent',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = 'var(--border-h)' }}
          onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = 'transparent' }}
        />
      )}
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            minHeight: 60,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>
                Froia
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.3 }}>
                Agente de Design IA
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {messages.length > 0 && !loading && (
              <button
                onClick={() => { setMessages([]); setError(null) }}
                title="Limpar conversa"
                style={{
                  padding: 6, border: 'none', background: 'transparent',
                  cursor: 'pointer', color: 'var(--t3)', borderRadius: 6,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* Welcome */}
          {messages.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: 10,
                padding: '32px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={26} color="var(--accent)" />
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--t2)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  maxWidth: 240,
                }}
              >
                {WELCOME}
              </p>

              {/* Quick prompts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 8 }}>
                {[
                  'O que é um design system?',
                  'Boas práticas de acessibilidade',
                  'Como criar um protótipo interativo?',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q) }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg2)',
                      color: 'var(--t2)',
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--bg3)'
                      e.currentTarget.style.color = 'var(--t1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--bg2)'
                      e.currentTarget.style.color = 'var(--t2)'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1
            const isStreaming = loading && isLast && msg.role === 'assistant'
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 6,
                }}
              >
                {msg.role === 'assistant' && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--accent-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={11} color="var(--accent)" />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '8px 12px',
                    borderRadius:
                      msg.role === 'user'
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                    background:
                      msg.role === 'user' ? 'var(--accent)' : 'var(--bg2)',
                    color: msg.role === 'user' ? 'white' : 'var(--t1)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    minHeight: isStreaming && !msg.content ? 36 : undefined,
                    display: 'flex',
                    alignItems: isStreaming && !msg.content ? 'center' : 'flex-start',
                  }}
                >
                  {isStreaming && !msg.content ? (
                    <Loader2
                      size={14}
                      color="var(--t3)"
                      style={{ animation: 'froiaSpin 1s linear infinite' }}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            )
          })}

          {/* Error banner */}
          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--error)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ flex: 1 }}>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{
                  border: 'none', background: 'transparent',
                  cursor: 'pointer', color: 'var(--error)', padding: 2,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* Slash command picker */}
          {cmdPicker && filteredCmds.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 16, right: 16,
              background: 'var(--bg1)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              marginBottom: 4,
              maxHeight: 280,
              overflowY: 'auto',
            }}>
              <div style={{
                padding: '6px 10px',
                fontSize: 10,
                color: 'var(--t3)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                <Terminal size={10} />
                Comandos TUI
              </div>
              {filteredCmds.map((cmd, i) => (
                <button
                  key={cmd.name}
                  onMouseDown={e => { e.preventDefault(); applyCommand(cmd, '') }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: i === cmdIndex ? 'var(--accent-light)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={() => setCmdIndex(i)}
                >
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: i === cmdIndex ? 'var(--accent)' : 'var(--t1)',
                    fontFamily: 'monospace',
                  }}>
                    /{cmd.name}
                    {cmd.aliases && (
                      <span style={{ fontWeight: 400, color: 'var(--t3)', marginLeft: 4, fontFamily: 'inherit' }}>
                        · {cmd.aliases.map(a => '/' + a).join(' ')}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.3 }}>
                    {cmd.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <button
              onClick={stop}
              style={{
                width: '100%',
                padding: '8px 0',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg2)',
                color: 'var(--t2)',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Loader2
                size={13}
                style={{ animation: 'froiaSpin 1s linear infinite' }}
              />
              Gerando... (clique para parar)
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-end',
                background: 'var(--bg2)',
                borderRadius: 10,
                border: '1px solid var(--border)',
                padding: '8px 8px 8px 12px',
                transition: 'border-color 150ms ease',
              }}
              onFocusCapture={e => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'
              }}
              onBlurCapture={e => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Mensagem ou / para comandos…"
                rows={1}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--t1)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  maxHeight: 96,
                  overflow: 'auto',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                title="Enviar (Enter)"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  border: 'none',
                  flexShrink: 0,
                  background: input.trim() ? 'var(--accent)' : 'var(--bg3)',
                  color: input.trim() ? 'white' : 'var(--t4)',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms ease',
                }}
              >
                <Send size={13} />
              </button>
            </div>
          )}
          <p
            style={{
              fontSize: 10,
              color: 'var(--t4)',
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            Froia · powered by Claude
          </p>
        </div>
    </aside>
  )
}
