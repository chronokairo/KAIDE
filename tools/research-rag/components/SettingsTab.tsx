'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Settings,
  Zap,
  RefreshCw,
  Monitor,
  Database,
  HardDrive,
  Wifi,
  Loader2,
  Bot,
  Check,
  Upload,
  FileText,
} from 'lucide-react'
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

export default function SettingsTab() {
  const [stats, setStats] = useState<any>(null)
  const [systemHistory, setSystemHistory] = useState<any[]>([])
  const [isIndexing, setIsIndexing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [chartGridColor, setChartGridColor] = useState('#e0e0e0')
  const [chartTextColor, setChartTextColor] = useState('#666666')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [currentModel, setCurrentModel] = useState<string>('')
  const [isUpdatingModel, setIsUpdatingModel] = useState(false)
  const [generalPrompt, setGeneralPrompt] = useState<string>('')
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files)
  }

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return

    setIsUploading(true)
    const formData = new FormData()
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i])
    }

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (data.success) {
        alert(`${data.savedFiles.length} arquivos enviados com sucesso! Clique em 'Reconstruir' para atualizar o índice.`)
        setSelectedFiles(null)
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao enviar arquivos.')
    } finally {
      setIsUploading(false)
    }
  }

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/models')
      const data = await response.json()
      if (data.models) setAvailableModels(data.models)
      if (data.currentModel) setCurrentModel(data.currentModel)
      
      // Também buscar configurações para o prompt
      const settingsResponse = await fetch('/api/admin/settings')
      const settingsData = await settingsResponse.json()
      if (settingsData.prompts?.general) {
        setGeneralPrompt(settingsData.prompts.general)
      }
    } catch (error) {
      console.error('Erro ao buscar modelos/configurações:', error)
    }
  }

  const handlePromptUpdate = async () => {
    setIsUpdatingPrompt(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: { general: generalPrompt } }),
      })
      alert('Prompt atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar prompt:', error)
    } finally {
      setIsUpdatingPrompt(false)
    }
  }

  const handleModelChange = async (model: string) => {
    setIsUpdatingModel(true)
    try {
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      })
      if (response.ok) {
        setCurrentModel(model)
        alert(`Modelo alterado para ${model}. O sistema usará este modelo na próxima inicialização.`)
      }
    } catch (error) {
      console.error('Erro ao mudar modelo:', error)
    } finally {
      setIsUpdatingModel(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      setStats(data)

      setSystemHistory(prev => {
        const newHistory = [...prev, {
          timestamp: new Date(),
          cpu: data.system?.cpu?.usagePercent || 0,
          memory: data.system?.memory?.usagePercent || 0,
          gpu: data.system?.gpu?.[0]?.utilization || 0
        }].slice(-10)
        return newHistory
      })
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchModels()
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() || '#e0e0e0'
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-text').trim() || '#666666'
    setChartGridColor(gridColor)
    setChartTextColor(textColor)
  }, [])

  const rebuildIndex = async () => {
    setIsIndexing(true)
    setLogs([])
    setProgress(0)

    try {
      const response = await fetch('/api/chat/index/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ md_only: true }),
      })
      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'log' || data.type === 'progress') {
                setLogs((prev) => [...prev.slice(-50), data.message])
              }
              if (data.type === 'progress') {
                setProgress(data.value)
              }
              if (data.type === 'done') {
                setProgress(100)
                fetchStats()
              }
            } catch (e) { }
          }
        }
      }
    } catch (error) {
      setLogs((prev) => [...prev, `Erro: ${(error as Error).message}`])
    } finally {
      setIsIndexing(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded border border-[var(--border)] mb-4">
            <Settings className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Configurações</h2>
          <p className="text-[var(--text-secondary)]">Gerencie o índice e configure o sistema</p>
        </div>

        {stats?.system && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Monitoramento do Sistema
              </h3>
              <button
                onClick={fetchStats}
                className="p-2 border border-[var(--border)] rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                title="Atualizar dados do sistema"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    CPU
                  </h4>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {stats.system.cpu?.usagePercent || 0}%
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {stats.system.cpu?.cores || 0} cores
                    </div>
                  </div>
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] h-2 mb-2">
                  <div
                    className="bg-[var(--accent)] h-2 transition-all duration-300"
                    style={{ width: `${Math.min(stats.system.cpu?.usagePercent || 0, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-[var(--text-secondary)] truncate">
                  {stats.system.cpu?.model || 'Unknown CPU'}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                  {(stats.system.cpu?.speed || 0).toFixed(1)} GHz
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Memória RAM
                  </h4>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {stats.system.memory?.usagePercent || 0}%
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {(stats.system.memory?.used / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB usado
                    </div>
                  </div>
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] h-2 mb-2">
                  <div
                    className="bg-[var(--accent)] h-2 transition-all duration-300"
                    style={{ width: `${Math.min(stats.system.memory?.usagePercent || 0, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Total: {(stats.system.memory?.total / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                  Livre: {(stats.system.memory?.free / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    Disco
                  </h4>
                  <div className="text-right">
                    {stats.system.disk && stats.system.disk.length > 0 ? (
                      <>
                        <div className="text-lg font-bold">
                          {Math.round((stats.system.disk[0].used / stats.system.disk[0].size) * 100) || 0}%
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {(stats.system.disk[0].used / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB usado
                        </div>
                      </>
                    ) : (
                      <div className="text-lg font-bold text-[var(--text-tertiary)]">N/A</div>
                    )}
                  </div>
                </div>
                {stats.system.disk && stats.system.disk.length > 0 ? (
                  <>
                    <div className="w-full bg-[var(--bg-tertiary)] h-2 mb-2">
                      <div
                        className="bg-[var(--accent)] h-2 transition-all duration-300"
                        style={{ width: `${Math.min((stats.system.disk[0].used / stats.system.disk[0].size) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">
                      {stats.system.disk[0].mount || 'C:'}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">
                      Total: {(stats.system.disk[0].size / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-[var(--text-tertiary)]">Disco não detectado</div>
                )}
              </div>

              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    Rede
                  </h4>
                  <div className="text-right">
                    {stats.system.network && stats.system.network.length > 0 ? (
                      <>
                        <div className="text-lg font-bold">
                          {stats.system.network[0].speed || 0} Mbps
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {stats.system.network[0].state || 'Desconhecido'}
                        </div>
                      </>
                    ) : (
                      <div className="text-lg font-bold text-[var(--text-tertiary)]">N/A</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-[var(--text-secondary)] truncate">
                  {stats.system.network?.[0]?.iface || 'Interface não detectada'}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                  Tipo: {stats.system.network?.[0]?.type || 'Desconhecido'}
                </div>
                {stats.system.network?.[0]?.ip4 && (
                  <div className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                    IP: {stats.system.network[0].ip4}
                  </div>
                )}
              </div>
            </div>

            {stats.system.gpu && stats.system.gpu.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  GPUs Detectadas ({stats.system.gpu.length})
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {stats.system.gpu.map((gpu: any, index: number) => (
                    <div key={index} className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium">GPU {index}</h5>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {gpu.utilization || 0}%
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)]">
                            {gpu.temperature ? `${gpu.temperature}°C` : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-[var(--bg-tertiary)] h-2 mb-2">
                        <div
                          className="bg-[var(--accent)] h-2 transition-all duration-300"
                          style={{ width: `${Math.min(gpu.utilization || 0, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] truncate">
                        {gpu.vendor} {gpu.model}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-1">
                        Memória: {gpu.memoryUsed ? `${gpu.memoryUsed}MB` : 'N/A'} / {gpu.memoryTotal ? `${gpu.memoryTotal}MB` : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
                <h4 className="font-medium mb-4">Uso de Recursos do Sistema</h4>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: ['CPU', 'Memória', 'GPU'],
                      datasets: [{
                        label: 'Uso (%)',
                        data: [
                          stats.system.cpu?.usagePercent || 0,
                          stats.system.memory?.usagePercent || 0,
                          stats.system.gpu?.[0]?.utilization || 0
                        ],
                        backgroundColor: ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)'],
                        borderColor: ['rgba(0,0,0,1)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)'],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, max: 100, ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
                        x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
                <h4 className="font-medium mb-4">Histórico de Uso (Últimas 10 Leituras)</h4>
                <div className="h-64">
                  <Line
                    data={{
                      labels: systemHistory.map((_, i) => `${i + 1}`),
                      datasets: [
                        {
                          label: 'CPU (%)',
                          data: systemHistory.map(h => h.cpu),
                          borderColor: 'rgba(0,0,0,0.9)',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          tension: 0.4
                        },
                        {
                          label: 'Memória (%)',
                          data: systemHistory.map(h => h.memory),
                          borderColor: 'rgba(0,0,0,0.6)',
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          tension: 0.4
                        },
                        {
                          label: 'GPU (%)',
                          data: systemHistory.map(h => h.gpu),
                          borderColor: 'rgba(0,0,0,0.3)',
                          backgroundColor: 'rgba(0,0,0,0.01)',
                          tension: 0.4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: { color: chartTextColor, boxWidth: 12, padding: 10 }
                        }
                      },
                      scales: {
                        y: { beginAtZero: true, max: 100, ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
                        x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } }
                      },
                      interaction: { intersect: false, mode: 'index' as const }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
              <h4 className="font-medium mb-4">Distribuição de Memória</h4>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: ['Usada', 'Livre'],
                    datasets: [{
                      data: [
                        stats.system.memory?.used || 0,
                        stats.system.memory?.free || 0
                      ],
                      backgroundColor: ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.2)'],
                      borderColor: ['rgba(0,0,0,1)', 'rgba(0,0,0,0.3)'],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' as const, labels: { color: chartTextColor } } }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Template do Prompt (Geral)
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Personalize o prompt principal usado para gerar as respostas. Use <code>{'{context}'}</code> e <code>{'{question}'}</code> como placeholders.
          </p>

          <div className="flex flex-col gap-4">
            <textarea
              value={generalPrompt}
              onChange={(e) => setGeneralPrompt(e.target.value)}
              rows={12}
              placeholder="Digite o template do prompt aqui..."
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm font-mono focus:ring-1 focus:ring-[var(--accent)] outline-none resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handlePromptUpdate}
                disabled={isUpdatingPrompt}
                className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded text-sm font-medium flex items-center gap-2"
              >
                {isUpdatingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Salvar Template
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de Documentos
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Adicione novos arquivos (PDF, DOCX, TXT, MD) à base de conhecimento.
          </p>

          <div className="flex flex-col gap-4">
            <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center hover:border-[var(--accent)] transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-10 h-10 text-[var(--text-tertiary)] mb-2" />
                <span className="text-sm font-medium">Clique para selecionar arquivos</span>
                <span className="text-xs text-[var(--text-tertiary)] mt-1">
                  PDF, DOCX, TXT ou Markdown
                </span>
              </label>
            </div>

            {selectedFiles && selectedFiles.length > 0 && (
              <div className="flex items-center justify-between bg-[var(--bg-tertiary)] p-3 rounded">
                <div className="text-sm">
                  <strong>{selectedFiles.length}</strong> arquivos selecionados
                </div>
                <button
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className="px-4 py-1.5 bg-[var(--accent)] text-[var(--accent-text)] rounded text-sm font-medium flex items-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Enviar Arquivos
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Configuração do Modelo LLM
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Escolha qual modelo do Ollama será usado para gerar as respostas.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">
                Modelo Ativo
              </label>
              <div className="flex gap-2">
                <select
                  value={currentModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  disabled={isUpdatingModel || availableModels.length === 0}
                  className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm focus:ring-1 focus:ring-[var(--accent)] outline-none"
                >
                  {availableModels.length === 0 ? (
                    <option>Carregando modelos...</option>
                  ) : (
                    availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))
                  )}
                </select>
                <button
                  onClick={fetchModels}
                  className="p-2 border border-[var(--border)] rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                  title="Recarregar modelos"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdatingModel ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {currentModel && (
              <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 p-2 rounded">
                <Check className="w-3.5 h-3.5" />
                <span>O modelo <strong>{currentModel}</strong> está configurado como padrão.</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded mb-6">
          <h3 className="text-lg font-semibold mb-4">Reconstruir Índice</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Reindexe seus documentos quando adicionar ou modificar arquivos.
          </p>

          <div className="flex gap-3 mb-4">
            <button
              onClick={rebuildIndex}
              disabled={isIndexing}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-[var(--accent-text)] 
                         disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] rounded font-medium transition-colors"
            >
              {isIndexing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isIndexing ? 'Indexando...' : 'Reconstruir'}
            </button>

            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded font-medium 
                         hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <Database className="w-4 h-4" />
              Atualizar Stats
            </button>
          </div>

          {isIndexing && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--text-secondary)]">Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)]">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded max-h-48 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="text-[var(--text-secondary)] py-0.5">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
