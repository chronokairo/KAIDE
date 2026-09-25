'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send,
  Search,
  Settings,
  MessageSquare,
  Bot,
  User,
  FileText,
  Trash2,
  Copy,
  Check,
  Loader2,
  Database,
  RefreshCw,
  HardDrive,
  Wifi,
  Monitor,
  Menu,
  Plus,
  Sun,
  Moon,
  Zap,
} from 'lucide-react'
import { useTheme } from './ThemeContext'
import Sidebar from './Sidebar'
import WelcomeScreen from './WelcomeScreen'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import SystemInfoBar from './SystemInfoBar'
import StatusBar from './StatusBar'
import SearchTab from './SearchTab'
import SettingsTab from './SettingsTab'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: Source[]
  timestamp: Date
  isStreaming?: boolean
  charts?: ChartData[]
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

interface Source {
  file?: string
  title?: string
  content?: string
  relevance?: number
  source?: string
  endpoint?: string
  dataPreview?: string
}

interface ChatStatus {
  status: 'online' | 'offline' | 'error'
  indexed_documents?: number
  llmModel?: string
  llmProvider?: string
  embeddingModel?: string
  availableModels?: string[]
  documents?: number
  ollama?: boolean
}

interface SystemInfo {
  cpu: number
  gpu: number
  memory: number
  disk: number
  network: string
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const extractChartsFromContent = (content: string): { cleanContent: string, charts: ChartData[] } => {
  const charts: ChartData[] = []
  let cleanContent = content

  const chartRegex = /Gráfico de (?:Barras|Pizza|Linhas|Linha) \(JSON\):\s*\n\s*(\[[\s\S]*?\])/g

  let match
  while ((match = chartRegex.exec(content)) !== null) {
    try {
      const jsonStr = match[1]
      const chartData = JSON.parse(jsonStr)

      const chartsToAdd = Array.isArray(chartData) ? chartData : [chartData]

      chartsToAdd.forEach((chart: any) => {
        if (chart.type && chart.title && chart.labels && chart.datasets) {
          charts.push({
            type: chart.type,
            title: chart.title,
            labels: chart.labels,
            datasets: chart.datasets.map((ds: any) => ({
              label: ds.label || '',
              data: ds.data || [],
              backgroundColor: ds.backgroundColor,
              borderColor: ds.borderColor
            }))
          })
        }
      })

      cleanContent = cleanContent.replace(match[0], '').trim()
    } catch (error) {
      console.warn('Failed to parse chart JSON:', error)
    }
  }

  const codeBlockRegex = /```(?:json)?\s*\n?\s*(\[[\s\S]*?\])\s*\n?\s*```/g
  while ((match = codeBlockRegex.exec(content)) !== null) {
    try {
      const jsonStr = match[1]
      const chartData = JSON.parse(jsonStr)

      const chartsToAdd = Array.isArray(chartData) ? chartData : [chartData]
      chartsToAdd.forEach((chart: any) => {
        if (chart.type && chart.title && chart.labels && chart.datasets) {
          charts.push({
            type: chart.type,
            title: chart.title,
            labels: chart.labels,
            datasets: chart.datasets.map((ds: any) => ({
              label: ds.label || '',
              data: ds.data || [],
              backgroundColor: ds.backgroundColor,
              borderColor: ds.borderColor
            }))
          })
        }
      })

      cleanContent = cleanContent.replace(match[0], '').trim()
    } catch (error) {
    }
  }

  return { cleanContent, charts }
}

function useSystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpu: 0,
    gpu: 0,
    memory: 0,
    disk: 0,
    network: 'online'
  })

  useEffect(() => {
    let cpuHistory: number[] = []
    let lastTime = performance.now()

    const updateSystemInfo = () => {
      const now = performance.now()
      const timeDiff = now - lastTime
      lastTime = now

      const cpuUsage = Math.min(100, Math.max(0, Math.random() * 30 + 10))
      cpuHistory.push(cpuUsage)
      if (cpuHistory.length > 10) cpuHistory.shift()
      const avgCpu = cpuHistory.reduce((a, b) => a + b, 0) / cpuHistory.length

      let memoryUsage = 0
      if ('memory' in performance) {
        const memInfo = (performance as any).memory
        memoryUsage = Math.round((memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100)
      } else {
        memoryUsage = Math.round(Math.random() * 40 + 30)
      }

      const diskUsage = Math.round(Math.random() * 20 + 60)
      const gpuUsage = Math.round(Math.random() * 25 + 15)
      const networkStatus = navigator.onLine ? 'online' : 'offline'

      setSystemInfo({
        cpu: Math.round(avgCpu),
        gpu: gpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        network: networkStatus
      })
    }

    const interval = setInterval(updateSystemInfo, 2000)
    updateSystemInfo()

    return () => clearInterval(interval)
  }, [])

  return systemInfo
}

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<ChatStatus | null>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const systemInfo = useSystemInfo()
  const { theme, toggleTheme } = useTheme()

  const [conversations, setConversations] = useState<Array<{ id: string, title: string, messages: Message[], createdAt: Date }>>([])
  const [activeConversationIndex, setActiveConversationIndex] = useState<number>(-1)

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch('/api/conversations')
        if (response.ok) {
          const data = await response.json()
          const formattedConversations = data.map((conv: any) => ({
            id: conv.id,
            title: conv.title,
            messages: conv.messages || [],
            createdAt: new Date(conv.createdAt),
          }))
          setConversations(formattedConversations)
          if (formattedConversations.length > 0) {
            setActiveConversationIndex(0)
          }
        }
      } catch (error) {
        console.error('Error loading conversations from API:', error)
      }
    }
    loadConversations()
  }, [])

  useEffect(() => {
    if (conversations.length === 0) {
      handleNewChat()
    }
  }, [conversations.length])

  const saveConversationToAPI = async (conversation: { id: string, title: string, messages: Message[], createdAt: Date }) => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: conversation.title }),
      })
      if (!response.ok) {
        console.error('Failed to save conversation')
      }
    } catch (error) {
      console.error('Error saving conversation:', error)
    }
  }

  const createConversationInAPI = async (id: string, title: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      })
      if (!response.ok) {
        console.error('Failed to create conversation')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const deleteConversationFromAPI = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        console.error('Failed to delete conversation')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const addMessageToAPI = async (conversationId: string, message: Message) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!response.ok) {
        console.error('Failed to add message')
      }
    } catch (error) {
      console.error('Error adding message:', error)
    }
  }

  const currentMessages = activeConversationIndex >= 0 ? conversations[activeConversationIndex]?.messages || [] : []
  const setCurrentMessages = (msgs: Message[]) => {
    if (activeConversationIndex >= 0) {
      setConversations(prev => prev.map((conv, i) =>
        i === activeConversationIndex ? { ...conv, messages: msgs } : conv
      ))
    }
  }

  const handleNewChat = async () => {
    const newConv = {
      id: generateId(),
      title: 'Nova Conversa',
      messages: [],
      createdAt: new Date()
    }
    await createConversationInAPI(newConv.id, newConv.title)
    setConversations(prev => {
      const updated = [...prev, newConv]
      setActiveConversationIndex(updated.length - 1)
      return updated
    })
    setActiveTab('chat')
  }

  const handleDeleteConversation = async (index: number) => {
    const conversationToDelete = conversations[index]
    if (conversationToDelete) {
      await deleteConversationFromAPI(conversationToDelete.id)
    }
    setConversations(prev => prev.filter((_, i) => i !== index))
    if (activeConversationIndex === index) {
      if (conversations.length > 1) {
        setActiveConversationIndex(index > 0 ? index - 1 : 0)
      } else {
        setActiveConversationIndex(-1)
      }
    } else if (activeConversationIndex > index) {
      setActiveConversationIndex(activeConversationIndex - 1)
    }
  }

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default

    const pdf = new jsPDF()
    let yPosition = 20

    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Relatório do Chat - Athena', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPosition)
    yPosition += 15

    pdf.setDrawColor(100, 100, 100)
    pdf.line(20, yPosition, 190, yPosition)
    yPosition += 10

    for (const message of currentMessages) {
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      const role = message.role === 'user' ? 'Você:' : 'Athena:'
      pdf.text(role, 20, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      let cleanContent = message.content
        .replace(/[#*_`~]/g, '')
        .replace(/[\u{1F000}-\u{1F9FF}]/gu, '')
        .replace(/\n\s*\n/g, '\n')
        .replace(/^\s*#+\s*/gm, '')
        .replace(/^\s*-+\s*/gm, '- ')
        .trim()

      const lines = pdf.splitTextToSize(cleanContent, 160)
      for (const line of lines) {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(line, 25, yPosition)
        yPosition += 5
      }
      yPosition += 3

      if (message.sources && message.sources.length > 0) {
        if (yPosition > 260) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'italic')
        pdf.text('Fontes consultadas:', 25, yPosition)
        yPosition += 6

        message.sources.forEach((source: any, index) => {
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }

          const sourceName = source.title || source.file || source.source || source.endpoint || 'Fonte desconhecida'
          const sourceDetail = source.dataPreview || source.content || ''
          const sourceText = sourceDetail
            ? `${index + 1}. ${sourceName} - ${sourceDetail}`
            : `${index + 1}. ${sourceName}`

          const sourceLines = pdf.splitTextToSize(sourceText, 155)
          pdf.text(sourceLines, 30, yPosition)
          yPosition += sourceLines.length * 4 + 2
        })
        yPosition += 2
      }

      if (message.charts && message.charts.length > 0) {
        const messageElement = document.querySelector(`[data-message-id="${message.id}"]`)
        if (messageElement) {
          const chartContainers = messageElement.querySelectorAll('[data-chart-container]')

          for (let chartIndex = 0; chartIndex < chartContainers.length && chartIndex < message.charts.length; chartIndex++) {
            const chartContainer = chartContainers[chartIndex] as HTMLElement
            const chart = message.charts[chartIndex]

            if (yPosition > 200) {
              pdf.addPage()
              yPosition = 20
            }

            try {
              const canvas = await html2canvas(chartContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false
              })

              const imgData = canvas.toDataURL('image/png')
              const imgWidth = 170
              const imgHeight = (canvas.height * imgWidth) / canvas.width

              pdf.setFontSize(10)
              pdf.setFont('helvetica', 'bold')
              pdf.text(chart.title, 20, yPosition)
              yPosition += 7

              pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
              yPosition += imgHeight + 5

            } catch (error) {
              console.error('Error capturing chart:', error)
              pdf.setFontSize(9)
              pdf.setFont('helvetica', 'bold')
              pdf.text(`${chartIndex + 1}. ${chart.title}`, 25, yPosition)
              yPosition += 5

              chart.datasets.forEach(ds => {
                if (yPosition > 270) {
                  pdf.addPage()
                  yPosition = 20
                }
                pdf.setFontSize(8)
                pdf.setFont('helvetica', 'normal')
                const chartData = `${ds.label}: ${ds.data.join(', ')}`
                const chartLines = pdf.splitTextToSize(chartData, 150)
                pdf.text(chartLines, 30, yPosition)
                yPosition += chartLines.length * 4 + 2
              })
            }
            yPosition += 3
          }
        }
      }

      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      pdf.text(formatTime(message.timestamp), 25, yPosition)
      pdf.setTextColor(0, 0, 0)
      yPosition += 8

      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.setDrawColor(200, 200, 200)
      pdf.line(20, yPosition, 190, yPosition)
      yPosition += 8
    }

    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(150, 150, 150)
      pdf.text(`Página ${i} de ${pageCount}`, 20, 285)
      pdf.text('Gerado por Athena - Assistente Acadêmico RAG', 105, 285, { align: 'center' })
    }

    pdf.save(`chat-athena-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/chat/status')
        const data = await response.json()
        setStatus({ status: 'online', ...data })
      } catch {
        setStatus({ status: 'error' })
      }
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      sources: [],
      timestamp: new Date(),
      isStreaming: true,
    }

    const messagesWithUser = [...currentMessages, userMessage, assistantMessage]
    setCurrentMessages(messagesWithUser)
    setInput('')
    setIsLoading(true)

    if (activeConversationIndex >= 0) {
      await addMessageToAPI(conversations[activeConversationIndex].id, userMessage)
    }

    if (activeConversationIndex >= 0 && conversations[activeConversationIndex].title === 'Nova Conversa') {
      const newTitle = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '')
      setConversations(prev => prev.map((conv, i) =>
        i === activeConversationIndex ? { ...conv, title: newTitle } : conv
      ))
      await saveConversationToAPI({ ...conversations[activeConversationIndex], title: newTitle })
    }

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let fullContent = ''
      let sources: Source[] = []
      let charts: ChartData[] = []
      let lastUpdateTime = 0
      const updateInterval = 100

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'sources') {
                sources = data.data
              } else if (data.type === 'charts') {
                charts = data.data
              } else if (data.type === 'chunk') {
                fullContent += data.data

                const now = Date.now()
                if (now - lastUpdateTime >= updateInterval) {
                  const newMessages = [...messagesWithUser]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = fullContent
                    lastMessage.sources = sources
                    lastMessage.charts = charts
                  }
                  setCurrentMessages([...newMessages])
                  lastUpdateTime = now
                }
              }
            } catch { }
          }
        }
      }

      const newMessages = [...messagesWithUser]
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        const { cleanContent, charts: extractedCharts } = extractChartsFromContent(fullContent)

        lastMessage.content = cleanContent
        lastMessage.sources = sources
        lastMessage.charts = [...charts, ...extractedCharts]
        lastMessage.isStreaming = false

        if (activeConversationIndex >= 0) {
          await addMessageToAPI(conversations[activeConversationIndex].id, lastMessage)
        }
      }
      setCurrentMessages(newMessages)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      const newMessages = [...messagesWithUser]
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = `Erro ao processar sua mensagem: ${errorMessage}`
        lastMessage.isStreaming = false
        if (activeConversationIndex >= 0) {
          await addMessageToAPI(conversations[activeConversationIndex].id, lastMessage)
        }
      }
      setCurrentMessages(newMessages)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, currentMessages, conversations, activeConversationIndex])

  const handleSuggestionClick = (text: string) => {
    setInput(text)
  }

  const clearChat = () => {
    setCurrentMessages([])
  }

  return (
    <div className="h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationIndex={activeConversationIndex}
        onConversationSelect={setActiveConversationIndex}
        onDeleteConversation={handleDeleteConversation}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-[var(--bg-tertiary)] rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">
              {activeTab === 'chat' && 'Chat'}
              {activeTab === 'search' && 'Busca Semântica'}
              {activeTab === 'settings' && 'Configurações'}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={handleNewChat} className="p-2 hover:bg-[var(--bg-tertiary)] rounded" title="Nova Conversa">
              <Plus className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab('chat')} className={`p-2 rounded ${activeTab === 'chat' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'hover:bg-[var(--bg-tertiary)]'}`} title="Chat">
              <MessageSquare className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab('search')} className={`p-2 rounded ${activeTab === 'search' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'hover:bg-[var(--bg-tertiary)]'}`} title="Buscar">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab('settings')} className={`p-2 rounded ${activeTab === 'settings' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'hover:bg-[var(--bg-tertiary)]'}`} title="Configurações">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <SystemInfoBar systemInfo={systemInfo} />
          <StatusBar status={status} />
          {activeTab === 'chat' && currentMessages.length > 0 && (
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] text-[var(--accent-text)] rounded text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </header>

        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto">
              {currentMessages.length === 0 ? (
                <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
              ) : (
                <div className="max-w-4xl mx-auto p-4 space-y-6">
                  {currentMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onClear={clearChat}
              hasMessages={currentMessages.length > 0}
              status={status}
            />
          </>
        )}

        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}
