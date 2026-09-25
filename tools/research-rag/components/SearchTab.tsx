'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import CopyButton from './CopyButton'

interface Source {
  file?: string
  title?: string
  content?: string
  relevance?: number
  source?: string
  endpoint?: string
  dataPreview?: string
}

export default function SearchTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: 10 }),
      })
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(`Erro na busca: ${errorMessage}`)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded border border-[var(--border)] mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Busca Semântica</h2>
          <p className="text-[var(--text-secondary)]">
            Encontre documentos relevantes usando busca por similaridade
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite termos de busca..."
              className="w-full px-5 py-4 pr-14 bg-[var(--bg-secondary)] border border-[var(--border)] rounded 
                         text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none 
                         focus:border-[var(--border-hover)]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[var(--accent)] text-[var(--accent-text)] 
                         rounded transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 border border-[var(--border)] rounded mb-4">
            <div className="flex items-center justify-between">
              <p>{error}</p>
              <CopyButton text={error} />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {results.map((result, i) => (
            <div
              key={i}
              className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded hover:border-[var(--border-hover)] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{result.title || result.file}</h3>
                {result.relevance && (
                  <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs font-medium">
                    {Math.round(result.relevance * 100)}% match
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-2">{result.file}</p>
              {result.content && (
                <p className="text-sm line-clamp-3">{result.content}</p>
              )}
            </div>
          ))}

          {results.length === 0 && query && !isLoading && (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum resultado encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
