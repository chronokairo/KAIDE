'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { Bot, Send, Loader2, Sparkles, Trash2, RotateCcw, Terminal } from 'lucide-react'

export type Message = { role: 'user' | 'assistant'; content: string }

export type SlashCmd = {
  name: string
  description: string
  aliases?: string[]
  /** 'local' = handled client-side, 'prompt' = sends a message to the API */
  kind: 'local' | 'prompt'
  /** For kind='prompt': the text sent to the API. Use {args} for user arguments. */
  prompt?: string
}

export type ChatPanelPersona = {
  /** Nome do agente mostrado no header (ex.: Froia, Rapunzel) */
  name: string
  /** Subtítulo do header (ex.: Agente de Design IA, Agente de Conteúdo IA) */
  role: string
  /** aria-label do painel */
  ariaLabel: string
  /** Mensagem de boas-vindas */
  welcome: string
  /** Rota da API de streaming (ex.: /api/froia, /api/rapunzel) */
  apiPath: string
  /** Rodapé (ex.: 'Froia · powered by Claude') */
  footer: string
  /** Comandos slash próprios do agente */
  commands: SlashCmd[]
  /** Perguntas rápidas do estado vazio */
  quickPrompts: string[]
}

const XRAY = 'froiaSpin'
export default function ChatPanel({
  persona,
  open,
  width = 340,
  onWidthChange,
}: {
  persona: ChatPanelPersona
  open: boolean
  width?: number
  onWidthChange?: (w: number) => void
}) {
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

  const commands = persona.commands

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

  const filteredCmds = commands.filter(c =>
    c.name.startsWith(cmdFilter) ||
    (c.aliases ?? []).some(a => a.startsWith(cmdFilter))
  )

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

  function handleLocalCommand(cmd: SlashCmd) {
    if (cmd.name === 'clear') {
      setMessages([])
      setError(null)
      return
    }
    if (cmd.name === 'help') {
      const helpText = commands.map(c =>
        `/${c.name}${c.aliases ? ' (' + c.aliases.map(a => '/' + a).join(', ') + ')' : ''} — ${c.description}`
      ).join('\n')
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `**Comandos disponíveis:**\n\n${helpText}` },
      ])
    }
  }

  function applyCommand(cmd: SlashCmd, args: string) {
    setCmdPicker(false)
    setInput('')
    if (cmd.kind === 'local') {
      handleLocalCommand(cmd)
      return
    }
    const text = (cmd.prompt ?? cmd.description).replace('{args}', args).trim()
    fireMessage(text, `/${cmd.name}${args ? ' ' + args : ''}`)
  }

  const fireMessage = useCallback(async (apiText: string, displayText?: string) => {
    setError(null)
    const userMsg: Message = { role: 'user', content: displayText ?? apiText }
    const history: Message[] = [...messages, { role: 'user', content: apiText }]
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setLoading(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch(persona.apiPath, {
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
  }, [messages, persona.apiPath])

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
      setCmdPicker(parts.length <= 1)
      setCmdIndex(0)
    } else {
      setCmdPicker(false)
    }
  }

  return (
    <aside
      aria-label={persona.ariaLabel}
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
                {persona.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.3 }}>
                {persona.role}
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
                {persona.welcome}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 8 }}>
                {persona.quickPrompts.map(q => (
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
                      style={{ animation: `${XRAY} 1s linear infinite` }}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            )
          })}

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

        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
            position: 'relative',
          }}
        >
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
                style={{ animation: `${XRAY} 1s linear infinite` }}
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
            {persona.footer}
          </p>
        </div>
    </aside>
  )
}