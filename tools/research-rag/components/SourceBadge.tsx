'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'

interface Source {
  file?: string
  title?: string
  content?: string
  relevance?: number
  source?: string
  endpoint?: string
  dataPreview?: string
}

export default function SourceBadge({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false)

  const sourceName = source.title || source.file || source.source || source.endpoint || 'Fonte'
  const sourceDetail = source.dataPreview || source.content

  return (
    <div className="inline-block">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border)] 
                   hover:border-[var(--border-hover)] rounded text-xs font-medium transition-colors"
      >
        <FileText className="w-3 h-3" />
        <span className="max-w-[120px] truncate">{sourceName}</span>
        {source.relevance && (
          <span className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px]">
            {Math.round(source.relevance * 100)}%
          </span>
        )}
      </button>

      {expanded && sourceDetail && (
        <div className="mt-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-xs max-w-md">
          <p className="line-clamp-4">{sourceDetail}</p>
        </div>
      )}
    </div>
  )
}
