'use client'

import { Bot, Menu, Trash2 } from 'lucide-react'

interface Source {
  file?: string
  title?: string
  content?: string
  relevance?: number
  source?: string
  endpoint?: string
  dataPreview?: string
}

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut'
  title: string
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
  }[]
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: Source[]
  timestamp: Date
  isStreaming?: boolean
  charts?: ChartData[]
}

export default function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationIndex,
  onConversationSelect,
  onDeleteConversation,
}: {
  isOpen: boolean
  onClose: () => void
  conversations: Array<{ id: string, title: string, messages: Message[], createdAt: Date }>
  activeConversationIndex: number
  onConversationSelect: (index: number) => void
  onDeleteConversation: (index: number) => void
}) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'var(--overlay)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[var(--bg-primary)] border-r border-[var(--border)]
                   transform transition-transform duration-300 lg:transform-none
                   ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded border border-[var(--border)] flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-bold">Athena</h1>
                  <p className="text-xs text-[var(--text-tertiary)]">Assistente IA</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-[var(--bg-tertiary)] rounded"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-1">
              {conversations.map((conv, index) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded cursor-pointer transition-colors ${index === activeConversationIndex ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'hover:bg-[var(--bg-tertiary)]'}`}
                  onClick={() => { onConversationSelect(index); onClose() }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{conv.title}</h3>
                      <p className={`text-xs ${index === activeConversationIndex ? 'opacity-70' : 'text-[var(--text-tertiary)]'}`}>
                        {conv.createdAt.toLocaleDateString()} &bull; {conv.messages.length} mensagens
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteConversation(index) }}
                      className={`p-1 rounded ${index === activeConversationIndex ? 'hover:bg-[rgba(255,255,255,0.2)]' : 'hover:bg-[var(--bg-tertiary)]'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>v1.0.0</span>
              <span>Local &amp; Privado</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
