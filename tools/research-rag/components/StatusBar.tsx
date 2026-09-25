'use client'

import { Database, Bot } from 'lucide-react'

interface ChatStatus {
  status: 'online' | 'offline' | 'error'
  indexed_documents?: number
  models?: {
    llm?: string
    embedding?: string
  }
}

export default function StatusBar({ status }: { status: ChatStatus | null }) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${status?.status === 'online'
            ? 'bg-[var(--accent)]'
            : 'bg-[var(--text-tertiary)]'
          }`}
        />
        <span className="text-[var(--text-secondary)]">
          {status?.status === 'online' ? 'Online' : status?.status === 'error' ? 'Erro' : 'Offline'}
        </span>
      </div>

      {status?.indexed_documents !== undefined && (
        <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
          <Database className="w-3.5 h-3.5" />
          <span>{status.indexed_documents} docs</span>
        </div>
      )}

      {status?.models?.llm && (
        <div className="hidden sm:flex items-center gap-1.5 text-[var(--text-tertiary)]">
          <Bot className="w-3.5 h-3.5" />
          <span>{status.models.llm}</span>
        </div>
      )}
    </div>
  )
}
