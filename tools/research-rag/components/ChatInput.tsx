'use client'

import { useRef, useEffect, useState } from 'react'
import { Send, Trash2, Loader2, Bot, ChevronDown, Check } from 'lucide-react'

interface ChatStatus {
  status: 'online' | 'offline' | 'error'
  llmModel?: string
  llmProvider?: string
  embeddingModel?: string
  availableModels?: string[]
  documents?: number
  ollama?: boolean
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  onClear,
  hasMessages,
  status,
  onProviderChange,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  onClear: () => void
  hasMessages: boolean
  status?: ChatStatus | null
  onProviderChange?: (provider: string, model: string) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [selectedProvider, setSelectedProvider] = useState('ollama')
  const [selectedModel, setSelectedModel] = useState('')

  useEffect(() => {
    if (status?.llmModel && !selectedModel) {
      setSelectedModel(status.llmModel)
    }
  }, [status?.llmModel])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [value])

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider)
    onProviderChange?.(provider, selectedModel)
  }

  const handleModelSelect = (model: string) => {
    setSelectedModel(model)
    onProviderChange?.(selectedProvider, model)
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-primary)] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2">
          {hasMessages && (
            <button
              onClick={onClear}
              className="flex-shrink-0 p-3 rounded border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
              title="Limpar conversa"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo sobre seus documentos..."
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-[var(--bg-secondary)] border border-[var(--border)] rounded 
                         text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none 
                         focus:border-[var(--border-hover)] disabled:opacity-50 transition-colors"
            />

            {value.length > 100 && (
              <span className="absolute right-14 bottom-3 text-xs text-[var(--text-tertiary)]">
                {value.length}/2000
              </span>
            )}
          </div>

          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setPopoverOpen(!popoverOpen)}
              className="flex-shrink-0 p-3 rounded border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
              title="Provedor e Modelos"
            >
              <Bot className="w-5 h-5" />
            </button>

            {popoverOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-72 bg-[var(--bg-primary)] border border-[var(--border)] rounded shadow-xl z-50">
                <div className="p-3 border-b border-[var(--border)]">
                  <h4 className="text-sm font-semibold">Provedor e Modelo</h4>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {status?.status === 'online' ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>

                <div className="p-3 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                      Provedor
                    </label>
                    <div className="flex gap-1">
                      {['ollama', 'lmstudio'].map((p) => (
                        <button
                          key={p}
                          onClick={() => handleProviderSelect(p)}
                          className={`flex-1 px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                            selectedProvider === p
                              ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                              : 'border border-[var(--border)] hover:bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          {p === 'ollama' ? 'Ollama' : 'LM Studio'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                      Modelo
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                      {(status?.availableModels?.length ? status.availableModels : [status?.llmModel || 'gemma3:1b']).map((model) => (
                        <button
                          key={model}
                          onClick={() => handleModelSelect(model)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${
                            selectedModel === model
                              ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                              : 'hover:bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          <span className="flex-1 text-left truncate">{model}</span>
                          {selectedModel === model && <Check className="w-3 h-3 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-2 border-t border-[var(--border)] bg-[var(--bg-secondary)] rounded-b">
                  <p className="text-[10px] text-[var(--text-tertiary)] text-center">
                    {selectedProvider === 'ollama'
                      ? 'Ollama: modelos locais via Ollama'
                      : 'LM Studio: modelos via API compatível com OpenAI'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onSubmit}
            disabled={isLoading || !value.trim()}
            className="flex-shrink-0 p-3 rounded bg-[var(--accent)] text-[var(--accent-text)] 
                       disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] 
                       disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-[var(--text-tertiary)]">
          Pressione Enter para enviar &bull; Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
