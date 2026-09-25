'use client'

import { Bot, MessageSquare, Database, FileText } from 'lucide-react'

export default function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  const suggestions = [
    { text: 'Quantos alunos estão matriculados no total?', icon: MessageSquare },
    { text: 'Quais cursos têm mais alunos matriculados?', icon: MessageSquare },
    { text: 'Quantas matrículas existem por status?', icon: MessageSquare },
    { text: 'Liste os cursos disponíveis na instituição', icon: MessageSquare },
    { text: 'Quantos atendentes trabalham na instituição?', icon: MessageSquare },
    { text: 'Mostre o dashboard de performance dos atendentes', icon: MessageSquare },
    { text: 'Análise completa dos dados de matrículas', icon: MessageSquare },
    { text: 'Relatório de distribuição por área de conhecimento', icon: MessageSquare },
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded border border-[var(--border)] flex items-center justify-center mb-6">
        <Bot className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold mb-2">
        Assistente Acadêmico RAG
      </h1>
      <p className="text-[var(--text-secondary)] mb-8 max-w-md">
        Consultas inteligentes sobre matrículas, cursos, atendentes e estatísticas acadêmicas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="flex items-center gap-3 p-3 border border-[var(--border)] hover:border-[var(--border-hover)] 
                       rounded text-left transition-all group"
          >
            <suggestion.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm group-hover:text-[var(--text-primary)] transition-colors">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-[var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <Database className="w-4 h-4" />
          <span>100% Local &amp; Seguro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Database className="w-4 h-4" />
          <span>Dados em Tempo Real</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          <span>Gráficos &amp; Dashboards</span>
        </div>
      </div>
    </div>
  )
}
