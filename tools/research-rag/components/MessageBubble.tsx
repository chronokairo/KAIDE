'use client'

import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import { User, Bot, ThumbsUp, ThumbsDown, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import CopyButton from './CopyButton'
import SourceBadge from './SourceBadge'

if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
  )
}

const Bar = dynamic(() => import('react-chartjs-2').then(m => m.Bar), { ssr: false })
const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), { ssr: false })
const Line = dynamic(() => import('react-chartjs-2').then(m => m.Line), { ssr: false })

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

interface Source {
  file?: string
  title?: string
  content?: string
  relevance?: number
  source?: string
  endpoint?: string
  dataPreview?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: Source[]
  timestamp: Date
  isStreaming?: boolean
  charts?: ChartData[]
  feedback?: 'positive' | 'negative' | null
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(message.feedback || null)

  useEffect(() => {
    setFeedback(message.feedback || null)
  }, [message.feedback])

  const handleFeedback = async (type: 'positive' | 'negative') => {
    const newFeedback = feedback === type ? null : type
    setFeedback(newFeedback)
    
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: newFeedback }),
      })
      
      if (!response.ok) {
        // Reverter se der erro
        setFeedback(feedback)
      }
    } catch (error) {
      console.error('Erro ao enviar feedback:', error)
      setFeedback(feedback)
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`} data-message-id={message.id}>
      <div
        className={`flex-shrink-0 w-9 h-9 rounded flex items-center justify-center border border-[var(--border)]
                   ${isUser ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'bg-[var(--bg-tertiary)]'}`}
      >
        {isUser ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`relative px-4 py-3 rounded border ${isUser
            ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
            : 'bg-[var(--bg-secondary)] border-[var(--border)]'
          }`}
        >
          {message.isStreaming && (
            <div className="absolute -top-2 -right-2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-40"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--accent)]"></span>
              </span>
            </div>
          )}

          <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
            <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
          </div>

          {isAssistant && message.content && !message.isStreaming && (
            <div className="absolute -bottom-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleFeedback('positive')}
                className={`p-1.5 rounded border bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors
                           ${feedback === 'positive' ? 'text-green-500 border-green-500' : 'text-[var(--text-tertiary)] border-[var(--border)]'}`}
                title="Gostei da resposta"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedback('negative')}
                className={`p-1.5 rounded border bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors
                           ${feedback === 'negative' ? 'text-red-500 border-red-500' : 'text-[var(--text-tertiary)] border-[var(--border)]'}`}
                title="Não gostei da resposta"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
              <CopyButton text={message.content} />
            </div>
          )}
        </div>

        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.sources.slice(0, 4).map((source, i) => (
              <SourceBadge key={i} source={source} />
            ))}
            {message.sources.length > 4 && (
              <span className="text-xs text-[var(--text-tertiary)] self-center">
                +{message.sources.length - 4} mais
              </span>
            )}
          </div>
        )}

        {isAssistant && message.charts && message.charts.length > 0 && (
          <div className="mt-4 space-y-4">
            {message.charts.map((chart, i) => (
              <div key={i} data-chart-container className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
                <h4 className="font-medium mb-4">{chart.title}</h4>
                <div className="h-64">
                  {chart.type === 'bar' && (
                    <Bar
                      data={{
                        labels: chart.labels,
                        datasets: chart.datasets.map(ds => ({
                          ...ds,
                          backgroundColor: ds.backgroundColor || ['rgba(0, 0, 0, 0.8)'],
                          borderColor: ds.borderColor || ['rgba(0, 0, 0, 1)'],
                          borderWidth: 1
                        }))
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { beginAtZero: true, ticks: { color: 'var(--chart-text)' }, grid: { color: 'var(--chart-grid)' } },
                          x: { ticks: { color: 'var(--chart-text)' }, grid: { color: 'var(--chart-grid)' } }
                        }
                      }}
                    />
                  )}
                  {chart.type === 'line' && (
                    <Line
                      data={{
                        labels: chart.labels,
                        datasets: chart.datasets.map(ds => ({
                          ...ds,
                          borderColor: ds.borderColor || 'rgba(0, 0, 0, 0.8)',
                          backgroundColor: ds.backgroundColor || 'rgba(0, 0, 0, 0.05)',
                          tension: 0.4
                        }))
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' as const, labels: { color: 'var(--chart-text)', boxWidth: 12, padding: 10 } } },
                        scales: {
                          y: { beginAtZero: true, ticks: { color: 'var(--chart-text)' }, grid: { color: 'var(--chart-grid)' } },
                          x: { ticks: { color: 'var(--chart-text)' }, grid: { color: 'var(--chart-grid)' } }
                        }
                      }}
                    />
                  )}
                  {chart.type === 'pie' && (
                    <Doughnut
                      data={{
                        labels: chart.labels,
                        datasets: chart.datasets.map(ds => ({
                          ...ds,
                          backgroundColor: ds.backgroundColor || ['#000', '#444', '#888', '#bbb', '#ddd', '#eee', '#ccc', '#999'],
                          borderColor: ds.borderColor || ['#000', '#444', '#888', '#bbb', '#ddd', '#eee', '#ccc', '#999'],
                          borderWidth: 1
                        }))
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' as const, labels: { color: 'var(--chart-text)' } } }
                      }}
                    />
                  )}
                  {chart.type === 'doughnut' && (
                    <Doughnut
                      data={{
                        labels: chart.labels,
                        datasets: chart.datasets.map(ds => ({
                          ...ds,
                          backgroundColor: ds.backgroundColor || ['#000', '#444', '#888', '#bbb', '#ddd', '#eee', '#ccc', '#999'],
                          borderColor: ds.borderColor || ['#000', '#444', '#888', '#bbb', '#ddd', '#eee', '#ccc', '#999'],
                          borderWidth: 1
                        }))
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' as const, labels: { color: 'var(--chart-text)' } } }
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`mt-1.5 text-[10px] text-[var(--text-tertiary)] ${isUser ? 'text-right' : ''}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
