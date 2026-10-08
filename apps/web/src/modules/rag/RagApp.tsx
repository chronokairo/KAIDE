'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import React from 'react'
import './RagApp.css'
import {
    Send,
    Search,
    Settings,
    MessageSquare,
    Bot,
    User,
    Sparkles,
    FileText,
    Trash2,
    Copy,
    Check,
    Loader2,
    Database,
    Zap,
    Shield,
    BookOpen,
    RefreshCw,
    HardDrive,
    Wifi,
    Monitor,
    Menu,
    X,
    BarChart3,
    PieChart,
    Users,
    UserCheck,
    TrendingUp,
    Target,
    Activity,
    List,
    Plus,
} from 'lucide-react';
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
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ThemeProvider, ThemeToggle, Button } from '@chronokairo/platform/ui';

// Register Chart.js components
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
);

// Types
interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    sources?: Source[];
    timestamp: Date;
    isStreaming?: boolean;
    charts?: ChartData[];
}

interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    title: string;
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string[];
    }[];
}

interface Source {
    file?: string;
    title?: string;
    content?: string;
    relevance?: number;
    source?: string;
    endpoint?: string;
    dataPreview?: string;
}

interface ChatStatus {
    status: 'online' | 'offline' | 'error';
    indexed_documents?: number;
    models?: {
        llm?: string;
        embedding?: string;
    };
}

interface SystemInfo {
    cpu: number;
    gpu: number;
    memory: number;
    disk: number;
    network: string;
}

// Utility functions
const generateId = () => Math.random().toString(36).substring(2, 15);

// Resolve a design token CSS variable at render time (theme-aware)
const cssVar = (name: string) =>
    typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888888'
        : '#888888';

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Function to extract and parse chart data from message content
const extractChartsFromContent = (content: string): { cleanContent: string, charts: ChartData[] } => {
    const charts: ChartData[] = [];
    let cleanContent = content;

    // Regex to find chart JSON blocks
    const chartRegex = /Gráfico de (?:Barras|Pizza|Linhas|Linha) \(JSON\):\s*\n\s*(\[[\s\S]*?\])/g;

    let match;
    while ((match = chartRegex.exec(content)) !== null) {
        try {
            const jsonStr = match[1];
            const chartData = JSON.parse(jsonStr);

            // Handle both single chart and array of charts
            const chartsToAdd = Array.isArray(chartData) ? chartData : [chartData];

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
                    });
                }
            });

            // Remove the chart JSON from content
            cleanContent = cleanContent.replace(match[0], '').trim();
        } catch (error) {
            console.warn('Failed to parse chart JSON:', error);
        }
    }

    // Also try to find chart data in code blocks
    const codeBlockRegex = /```(?:json)?\s*\n?\s*(\[[\s\S]*?\])\s*\n?\s*```/g;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        try {
            const jsonStr = match[1];
            const chartData = JSON.parse(jsonStr);

            const chartsToAdd = Array.isArray(chartData) ? chartData : [chartData];
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
                    });
                }
            });

            cleanContent = cleanContent.replace(match[0], '').trim();
        } catch (error) {
            // Ignore parsing errors
        }
    }

    return { cleanContent, charts };
};

// Custom hook for system information
function useSystemInfo() {
    const [systemInfo, setSystemInfo] = useState<SystemInfo>({
        cpu: 0,
        gpu: 0,
        memory: 0,
        disk: 0,
        network: 'online'
    });

    useEffect(() => {
        let cpuHistory: number[] = [];
        let lastTime = performance.now();

        const updateSystemInfo = () => {
            const now = performance.now();
            const timeDiff = now - lastTime;
            lastTime = now;

            // CPU usage simulation (rough estimate based on performance)
            const cpuUsage = Math.min(100, Math.max(0, Math.random() * 30 + 10)); // Simulated 10-40%
            cpuHistory.push(cpuUsage);
            if (cpuHistory.length > 10) cpuHistory.shift();
            const avgCpu = cpuHistory.reduce((a, b) => a + b, 0) / cpuHistory.length;

            // Memory usage (if available)
            let memoryUsage = 0;
            if ('memory' in performance) {
                const memInfo = (performance as any).memory;
                memoryUsage = Math.round((memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100);
            } else {
                memoryUsage = Math.round(Math.random() * 40 + 30); // Simulated 30-70%
            }

            // Disk usage simulation
            const diskUsage = Math.round(Math.random() * 20 + 60); // Simulated 60-80%

            // GPU usage simulation
            const gpuUsage = Math.round(Math.random() * 25 + 15); // Simulated 15-40%

            // Network status
            const networkStatus = navigator.onLine ? 'online' : 'offline';

            setSystemInfo({
                cpu: Math.round(avgCpu),
                gpu: gpuUsage,
                memory: memoryUsage,
                disk: diskUsage,
                network: networkStatus
            });
        };

        // Update every 2 seconds
        const interval = setInterval(updateSystemInfo, 2000);
        updateSystemInfo(); // Initial update

        return () => clearInterval(interval);
    }, []);

    return systemInfo;
}

// Components
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
            title="Copiar"
        >
            {copied ? (
                <Check className="w-4 h-4 text-green-400" />
            ) : (
                <Copy className="w-4 h-4 text-on-surface-variant" />
            )}
        </button>
    );
}

function SourceBadge({ source }: { source: Source }) {
    const [expanded, setExpanded] = useState(false);
    
    // Support different source formats
    const sourceName = source.title || source.file || source.source || source.endpoint || 'Fonte';
    const sourceDetail = source.dataPreview || source.content;

    return (
        <div className="inline-block">
            <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high 
                           hover:bg-surface-container-highest border border-outline rounded-full 
                           text-xs font-medium text-on-surface transition-all"
            >
                <FileText className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{sourceName}</span>
                {source.relevance && (
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px]">
                        {Math.round(source.relevance * 100)}%
                    </span>
                )}
            </button>

            {expanded && sourceDetail && (
                <div className="mt-2 p-3 bg-surface-container/80 border border-outline rounded-lg text-xs text-on-surface-variant max-w-md">
                    <p className="line-clamp-4">{sourceDetail}</p>
                </div>
            )}
        </div>
    );
}

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`} data-message-id={message.id}>
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                           ${isUser
                        ? 'bg-primary'
                        : 'bg-surface-container-highest'
                    }`}
            >
                {isUser ? (
                    <User className="w-5 h-5 text-on-primary" />
                ) : (
                    <Bot className="w-5 h-5 text-on-surface" />
                )}
            </div>

            {/* Content */}
            <div className={`flex-1 max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
                <div
                    className={`relative px-4 py-3 rounded-2xl ${isUser
                        ? 'bg-primary text-on-primary rounded-tr-md'
                        : 'bg-surface-container/80 backdrop-blur border border-outline/50 text-on-surface rounded-tl-md'
                        }`}
                >
                    {/* Streaming indicator */}
                    {message.isStreaming && (
                        <div className="absolute -top-2 -right-2">
                            <span className="flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                        </div>
                    )}

                    {/* Message content */}
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                        <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                    </div>

                    {/* Actions */}
                    {isAssistant && message.content && !message.isStreaming && (
                        <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={message.content} />
                        </div>
                    )}
                </div>

                {/* Sources */}
                {isAssistant && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {message.sources.slice(0, 4).map((source, i) => (
                            <SourceBadge key={i} source={source} />
                        ))}
                        {message.sources.length > 4 && (
                            <span className="text-xs text-on-surface-variant self-center">
                                +{message.sources.length - 4} mais
                            </span>
                        )}
                    </div>
                )}

                {/* Charts */}
                {isAssistant && message.charts && message.charts.length > 0 && (
                    <div className="mt-4 space-y-4">
                        {message.charts.map((chart, i) => (
                            <div key={i} data-chart-container className="p-4 bg-surface-container/50 border border-outline rounded-xl">
                                <h4 className="font-medium text-on-surface mb-4">{chart.title}</h4>
                                <div className="h-64">
                                    {chart.type === 'bar' && (
                                        <Bar
                                            data={{
                                                labels: chart.labels,
                                                datasets: chart.datasets.map(ds => ({
                                                    ...ds,
                                                    backgroundColor: ds.backgroundColor || ['rgba(59, 130, 246, 0.8)'],
                                                    borderColor: ds.borderColor || ['rgb(59, 130, 246)'],
                                                    borderWidth: 1
                                                }))
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: {
                                                            color: cssVar('--on-surface-variant')
                                                        },
                                                        grid: {
                                                            color: cssVar('--outline')
                                                        }
                                                    },
                                                    x: {
                                                        ticks: {
                                                            color: cssVar('--on-surface-variant')
                                                        },
                                                        grid: {
                                                            color: cssVar('--outline')
                                                        }
                                                    }
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
                                                    borderColor: ds.borderColor || 'rgb(59, 130, 246)',
                                                    backgroundColor: ds.backgroundColor || 'rgba(59, 130, 246, 0.1)',
                                                    tension: 0.4
                                                }))
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom' as const,
                                                        labels: {
                                                            color: cssVar('--on-surface-variant'),
                                                            boxWidth: 12,
                                                            padding: 10
                                                        }
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: {
                                                            color: cssVar('--on-surface-variant')
                                                        },
                                                        grid: {
                                                            color: cssVar('--outline')
                                                        }
                                                    },
                                                    x: {
                                                        ticks: {
                                                            color: cssVar('--on-surface-variant')
                                                        },
                                                        grid: {
                                                            color: cssVar('--outline')
                                                        }
                                                    }
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
                                                    backgroundColor: ds.backgroundColor || [
                                                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                                                    ],
                                                    borderColor: ds.borderColor || [
                                                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                                                    ],
                                                    borderWidth: 1
                                                }))
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom' as const,
                                                        labels: {
                                                            color: cssVar('--on-surface-variant')
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    {chart.type === 'doughnut' && (
                                        <Doughnut
                                            data={{
                                                labels: chart.labels,
                                                datasets: chart.datasets.map(ds => ({
                                                    ...ds,
                                                    backgroundColor: ds.backgroundColor || [
                                                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                                                    ],
                                                    borderColor: ds.borderColor || [
                                                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                                                    ],
                                                    borderWidth: 1
                                                }))
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom' as const,
                                                        labels: {
                                                            color: cssVar('--on-surface-variant')
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <div className={`mt-1.5 text-[10px] text-on-surface-variant ${isUser ? 'text-right' : ''}`}>
                    {formatTime(message.timestamp)}
                </div>
            </div>
        </div>
    );
}

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
    const suggestions = [
        // Consultas sobre matrículas e alunos
        { text: 'Quantos alunos estão matriculados no total?', icon: Users },
        { text: 'Quais cursos têm mais alunos matriculados?', icon: BarChart3 },
        { text: 'Quantas matrículas existem por status?', icon: PieChart },
        { text: 'Liste os cursos disponíveis na instituição', icon: BookOpen },

        // Consultas sobre atendentes
        { text: 'Quantos atendentes trabalham na instituição?', icon: UserCheck },
        { text: 'Qual atendente tem mais atendimentos realizados?', icon: TrendingUp },
        { text: 'Mostre estatísticas gerais de atendimento', icon: Activity },

        // Consultas analíticas e dashboards
        { text: 'Mostre o dashboard de performance dos atendentes', icon: BarChart3 },
        { text: 'Quais são os cursos mais procurados?', icon: Target },
        { text: 'Análise completa dos dados de matrículas', icon: FileText },
        { text: 'Relatório de distribuição por área de conhecimento', icon: PieChart },

        // Consultas específicas
        { text: 'Quantos alunos há em cada turma?', icon: Users },
        { text: 'Liste todos os candidatos inscritos', icon: List },
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            {/* Logo */}
            <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl">
                    <Sparkles className="w-10 h-10 text-on-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                    <Check className="w-3 h-3 text-on-surface" />
                </div>
            </div>

            <h1 className="text-2xl font-bold text-on-surface mb-2">
                Kaide
            </h1>
            <p className="text-on-surface-variant mb-8 max-w-md">
                Consultas inteligentes sobre matrículas, cursos, atendentes e estatísticas acadêmicas.
                Dados em tempo real das APIs institucionais com análise avançada.
            </p>

            {/* Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {suggestions.map((suggestion, i) => (
                    <button
                        key={i}
                        onClick={() => onSuggestionClick(suggestion.text)}
                        className="flex items-center gap-3 p-4 bg-surface-container/50 hover:bg-surface-container border border-outline/50 
                                   hover:border-secondary rounded-xl text-left transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high 
                                      group-hover:bg-surface-container-highest 
                                      flex items-center justify-center">
                            <suggestion.icon className="w-4 h-4 text-on-surface" />
                        </div>
                        <span className="text-sm text-on-surface group-hover:text-on-surface transition-colors">
                            {suggestion.text}
                        </span>
                    </button>
                ))}
            </div>

            {/* Features */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>100% Local & Seguro</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    <span>Dados em Tempo Real</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Gráficos & Dashboards</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Análise Acadêmica</span>
                </div>
            </div>
        </div>
    );
}

function ChatInput({
    value,
    onChange,
    onSubmit,
    isLoading,
    onClear,
    hasMessages,
}: {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    onClear: () => void;
    hasMessages: boolean;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
        }
    }, [value]);

    return (
        <div className="border-t border-outline-variant bg-surface-container-low/80 backdrop-blur-xl p-4">
            <div className="max-w-4xl mx-auto">
                <div className="relative flex items-end gap-2">
                    {/* Clear button */}
                    {hasMessages && (
                        <Button
                            onClick={onClear}
                            variant="ghost"
                            title="Limpar conversa"
                            aria-label="Limpar conversa"
                            icon={<Trash2 className="w-5 h-5" />}
                        />
                    )}

                    {/* Input container */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pergunte algo sobre seus documentos..."
                            disabled={isLoading}
                            rows={1}
                            className="w-full px-4 py-3 pr-12 bg-surface-container border border-outline rounded-xl 
                                       text-on-surface placeholder:text-on-surface-variant resize-none focus:outline-none 
                                       focus:ring-2 focus:ring-primary/50 focus:border-primary 
                                       disabled:opacity-50 transition-all"
                        />

                        {/* Character count */}
                        {value.length > 100 && (
                            <span className="absolute right-14 bottom-3 text-xs text-on-surface-variant">
                                {value.length}/2000
                            </span>
                        )}
                    </div>

                    {/* Submit button */}
                    <Button
                        onClick={onSubmit}
                        disabled={isLoading || !value.trim()}
                        title="Enviar"
                        aria-label="Enviar mensagem"
                        icon={isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    />
                </div>

                <p className="mt-2 text-center text-xs text-on-surface-variant">
                    Pressione Enter para enviar • Shift+Enter para nova linha
                </p>
            </div>
        </div>
    );
}

function SystemInfoBar({ systemInfo }: { systemInfo: SystemInfo }) {
    return (
        <div className="flex items-center gap-4 text-xs bg-surface-container/30 px-3 py-1 rounded-lg border border-outline/50">
            {/* CPU */}
            <div className="flex items-center gap-1.5">
                <Monitor className="w-3 h-3 text-blue-400" />
                <span className="text-on-surface">CPU</span>
                <span className={`font-medium ${systemInfo.cpu > 80 ? 'text-error' : systemInfo.cpu > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {systemInfo.cpu}%
                </span>
            </div>

            {/* GPU */}
            <div className="flex items-center gap-1.5">
                <Monitor className="w-3 h-3 text-cyan-400" />
                <span className="text-on-surface">GPU</span>
                <span className={`font-medium ${systemInfo.gpu > 80 ? 'text-error' : systemInfo.gpu > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {systemInfo.gpu}%
                </span>
            </div>

            {/* Memory */}
            <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-purple-400" />
                <span className="text-on-surface">RAM</span>
                <span className={`font-medium ${systemInfo.memory > 80 ? 'text-error' : systemInfo.memory > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {systemInfo.memory}%
                </span>
            </div>

            {/* Disk */}
            <div className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-orange-400" />
                <span className="text-on-surface">Disco</span>
                <span className={`font-medium ${systemInfo.disk > 90 ? 'text-error' : systemInfo.disk > 75 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {systemInfo.disk}%
                </span>
            </div>

            {/* Network */}
            <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-on-surface">Rede</span>
                <span className={`font-medium ${systemInfo.network === 'online' ? 'text-green-400' : 'text-error'}`}>
                    {systemInfo.network === 'online' ? 'Online' : 'Offline'}
                </span>
            </div>
        </div>
    );
}

function StatusBar({ status }: { status: ChatStatus | null }) {
    return (
        <div className="flex items-center gap-4 text-xs">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
                <span
                    className={`w-2 h-2 rounded-full ${status?.status === 'online'
                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                        : status?.status === 'error'
                            ? 'bg-error'
                            : 'bg-surface-container-highest'
                        }`}
                />
                <span className="text-on-surface-variant">
                    {status?.status === 'online' ? 'Online' : status?.status === 'error' ? 'Erro' : 'Offline'}
                </span>
            </div>

            {/* Documents count */}
            {status?.indexed_documents !== undefined && (
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <Database className="w-3.5 h-3.5" />
                    <span>{status.indexed_documents} docs</span>
                </div>
            )}

            {/* Model info */}
            {status?.models?.llm && (
                <div className="hidden sm:flex items-center gap-1.5 text-on-surface-variant">
                    <Bot className="w-3.5 h-3.5" />
                    <span>{status.models.llm}</span>
                </div>
            )}
        </div>
    );
}

function Sidebar({
    isOpen,
    onClose,
    conversations,
    activeConversationIndex,
    onConversationSelect,
    onDeleteConversation,
}: {
    isOpen: boolean;
    onClose: () => void;
    conversations: Array<{ id: string, title: string, messages: Message[], createdAt: Date }>;
    activeConversationIndex: number;
    onConversationSelect: (index: number) => void;
    onDeleteConversation: (index: number) => void;
}) {
    const tabs = [
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'search', icon: Search, label: 'Buscar' },
        { id: 'settings', icon: Settings, label: 'Configurações' },
    ];

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-container-low border-r border-outline-variant 
                           transform transition-transform duration-300 lg:transform-none
                           ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-outline-variant">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-on-primary" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-on-surface">Kaide</h1>
                                    <p className="text-xs text-on-surface-variant">Assistente de IA</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="lg:hidden p-2 hover:bg-surface-container rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3">
                        <div className="space-y-2">
                            {conversations.map((conv, index) => (
                                <div key={conv.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${index === activeConversationIndex ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface'}`} onClick={() => { onConversationSelect(index); onClose(); }}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-on-surface truncate">{conv.title}</h3>
                                            <p className="text-xs text-on-surface-variant">{conv.createdAt.toLocaleDateString()} • {conv.messages.length} mensagens</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteConversation(index); }} className="p-1 hover:bg-error rounded">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-outline-variant">
                        <div className="flex items-center justify-between text-xs text-on-surface-variant">
                            <span>v1.0.0</span>
                            <div className="flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5" />
                                <span>Local & Privado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

function SearchTab() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Source[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, top_k: 10 }),
            });
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            setError(`❌ Erro na busca: ${errorMessage}`);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
                        <Search className="w-8 h-8 text-on-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface mb-2">Busca Semântica</h2>
                    <p className="text-on-surface-variant">
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
                            className="w-full px-5 py-4 pr-14 bg-surface-container border border-outline rounded-xl 
                                       text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 
                                       focus:ring-primary/50 focus:border-primary"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-on-primary 
                                       hover:opacity-90 rounded-lg transition-colors"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </form>

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-error/10 border border-error/50 rounded-xl">
                        <div className="flex items-center justify-between">
                            <p className="text-error">{error}</p>
                            <CopyButton text={error} />
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="space-y-4">
                    {results.map((result, i) => (
                        <div
                            key={i}
                            className="p-4 bg-surface-container/50 border border-outline rounded-xl hover:border-secondary transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-on-surface">{result.title || result.file}</h3>
                                {result.relevance && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                                        {Math.round(result.relevance * 100)}% match
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-on-surface-variant mb-2">{result.file}</p>
                            {result.content && (
                                <p className="text-sm text-on-surface line-clamp-3">{result.content}</p>
                            )}
                        </div>
                    ))}

                    {results.length === 0 && query && !isLoading && (
                        <div className="text-center py-12 text-on-surface-variant">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum resultado encontrado</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SettingsTab() {
    const [stats, setStats] = useState<any>(null);
    const [systemHistory, setSystemHistory] = useState<any[]>([]);
    const [isIndexing, setIsIndexing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            setStats(data);

            // Add to history for trending
            setSystemHistory(prev => {
                const newHistory = [...prev, {
                    timestamp: new Date(),
                    cpu: data.system?.cpu?.usagePercent || 0,
                    memory: data.system?.memory?.usagePercent || 0,
                    gpu: data.system?.gpu?.[0]?.utilization || 0
                }].slice(-10); // Keep last 10 readings
                return newHistory;
            });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const rebuildIndex = async () => {
        setIsIndexing(true);
        setLogs([]);
        setProgress(0);

        try {
            const response = await fetch('/api/index/rebuild', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ md_only: true }),
            });
            const reader = response.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'log' || data.type === 'progress') {
                                setLogs((prev) => [...prev.slice(-50), data.message]);
                            }
                            if (data.type === 'progress') {
                                setProgress(data.value);
                            }
                            if (data.type === 'done') {
                                setProgress(100);
                                fetchStats();
                            }
                        } catch (e) { }
                    }
                }
            }
        } catch (error) {
            setLogs((prev) => [...prev, `❌ Erro: ${(error as Error).message}`]);
        } finally {
            setIsIndexing(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-container-highest mb-4">
                        <Settings className="w-8 h-8 text-on-surface" />
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface mb-2">Configurações</h2>
                    <p className="text-on-surface-variant">Gerencie o índice e configure o sistema</p>
                </div>

                {/* System Monitoring */}
                {stats?.system && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                Monitoramento do Sistema
                            </h3>
                            <Button
                                onClick={fetchStats}
                                variant="ghost"
                                size="sm"
                                title="Atualizar dados do sistema"
                                icon={<RefreshCw className="w-4 h-4" />}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* CPU */}
                            <div className="p-4 bg-surface-container/50 border border-outline rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-on-surface flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-blue-400" />
                                        CPU
                                    </h4>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-blue-400">
                                            {stats.system.cpu?.usagePercent || 0}%
                                        </div>
                                        <div className="text-xs text-on-surface-variant">
                                            {stats.system.cpu?.cores || 0} cores
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-surface-container-highest rounded-full h-2 mb-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(stats.system.cpu?.usagePercent || 0, 100)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-on-surface-variant truncate">
                                    {stats.system.cpu?.model || 'Unknown CPU'}
                                </div>
                                <div className="text-xs text-on-surface-variant mt-1">
                                    {(stats.system.cpu?.speed || 0).toFixed(1)} GHz
                                </div>
                            </div>

                            {/* Memory */}
                            <div className="p-4 bg-surface-container/50 border border-outline rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-on-surface flex items-center gap-2">
                                        <Database className="w-4 h-4 text-green-400" />
                                        Memória RAM
                                    </h4>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-green-400">
                                            {stats.system.memory?.usagePercent || 0}%
                                        </div>
                                        <div className="text-xs text-on-surface-variant">
                                            {(stats.system.memory?.used / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB usado
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-surface-container-highest rounded-full h-2 mb-2">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(stats.system.memory?.usagePercent || 0, 100)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-on-surface-variant">
                                    Total: {(stats.system.memory?.total / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB
                                </div>
                                <div className="text-xs text-on-surface-variant mt-1">
                                    Livre: {(stats.system.memory?.free / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB
                                </div>
                            </div>

                            {/* Disk */}
                            <div className="p-4 bg-surface-container/50 border border-outline rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-on-surface flex items-center gap-2">
                                        <HardDrive className="w-4 h-4 text-orange-400" />
                                        Disco
                                    </h4>
                                    <div className="text-right">
                                        {stats.system.disk && stats.system.disk.length > 0 ? (
                                            <>
                                                <div className="text-lg font-bold text-orange-400">
                                                    {Math.round((stats.system.disk[0].used / stats.system.disk[0].size) * 100) || 0}%
                                                </div>
                                                <div className="text-xs text-on-surface-variant">
                                                    {(stats.system.disk[0].used / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB usado
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-lg font-bold text-on-surface-variant">N/A</div>
                                        )}
                                    </div>
                                </div>
                                {stats.system.disk && stats.system.disk.length > 0 ? (
                                    <>
                                        <div className="w-full bg-surface-container-highest rounded-full h-2 mb-2">
                                            <div
                                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min((stats.system.disk[0].used / stats.system.disk[0].size) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-on-surface-variant truncate">
                                            {stats.system.disk[0].mount || 'C:'}
                                        </div>
                                        <div className="text-xs text-on-surface-variant mt-1">
                                            Total: {(stats.system.disk[0].size / 1024 / 1024 / 1024)?.toFixed(1) || 0}GB
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-xs text-on-surface-variant">Disco não detectado</div>
                                )}
                            </div>

                            {/* Network/Wi-Fi */}
                            <div className="p-4 bg-surface-container/50 border border-outline rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-on-surface flex items-center gap-2">
                                        <Wifi className="w-4 h-4 text-cyan-400" />
                                        Rede
                                    </h4>
                                    <div className="text-right">
                                        {stats.system.network && stats.system.network.length > 0 ? (
                                            <>
                                                <div className="text-lg font-bold text-cyan-400">
                                                    {stats.system.network[0].speed || 0} Mbps
                                                </div>
                                                <div className="text-xs text-on-surface-variant">
                                                    {stats.system.network[0].state || 'Desconhecido'}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-lg font-bold text-on-surface-variant">N/A</div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-on-surface-variant truncate">
                                    {stats.system.network?.[0]?.iface || 'Interface não detectada'}
                                </div>
                                <div className="text-xs text-on-surface-variant mt-1">
                                    Tipo: {stats.system.network?.[0]?.type || 'Desconhecido'}
                                </div>
                                {stats.system.network?.[0]?.ip4 && (
                                    <div className="text-xs text-on-surface-variant mt-1 truncate">
                                        IP: {stats.system.network[0].ip4}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* GPU Section */}
                        {stats.system.gpu && stats.system.gpu.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-medium text-on-surface mb-4 flex items-center gap-2">
                                    <Monitor className="w-5 h-5 text-purple-400" />
                                    GPUs Detectadas ({stats.system.gpu.length})
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {stats.system.gpu.map((gpu: any, index: number) => (
                                        <div key={index} className="p-4 bg-surface-container/50 border border-outline rounded-xl">
                                            <div className="flex items-center justify-between mb-3">
                                                <h5 className="font-medium text-on-surface">GPU {index}</h5>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-purple-400">
                                                        {gpu.utilization || 0}%
                                                    </div>
                                                    <div className="text-xs text-on-surface-variant">
                                                        {gpu.temperature ? `${gpu.temperature}°C` : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-surface-container-highest rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${Math.min(gpu.utilization || 0, 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-on-surface-variant truncate">
                                                {gpu.vendor} {gpu.model}
                                            </div>
                                            <div className="text-xs text-on-surface-variant mt-1">
                                                Memória: {gpu.memoryUsed ? `${gpu.memoryUsed}MB` : 'N/A'} / {gpu.memoryTotal ? `${gpu.memoryTotal}MB` : 'N/A'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* System Charts */}
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* CPU/Memory Usage Chart */}
                            <div className="p-4 bg-surface-container/50 border border-outline rounded-xl">
                                <h4 className="font-medium text-on-surface mb-4">Uso de Recursos do Sistema</h4>
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
                                                backgroundColor: [
                                                    'rgba(59, 130, 246, 0.8)',
                                                    'rgba(34, 197, 94, 0.8)',
                                                    'rgba(168, 85, 247, 0.8)'
                                                ],
                                                borderColor: [
                                                    'rgb(59, 130, 246)',
                                                    'rgb(34, 197, 94)',
                                                    'rgb(168, 85, 247)'
                                                ],
                                                borderWidth: 1
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    max: 100,
                                                    ticks: {
                                                        color: cssVar('--on-surface-variant')
                                                    },
                                                    grid: {
                                                        color: cssVar('--outline')
                                                    }
                                                },
                                                x: {
                                                    ticks: {
                                                        color: cssVar('--on-surface-variant')
                                                    },
                                                    grid: {
                                                        color: cssVar('--outline')
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* System Usage History */}
                            <div className="p-4 bg-surface-container/50 border border-outline rounded-xl">
                                <h4 className="font-medium text-on-surface mb-4">Histórico de Uso (Últimas 10 Leituras)</h4>
                                <div className="h-64">
                                    <Line
                                        data={{
                                            labels: systemHistory.map((_, i) => `${i + 1}`),
                                            datasets: [
                                                {
                                                    label: 'CPU (%)',
                                                    data: systemHistory.map(h => h.cpu),
                                                    borderColor: 'rgb(59, 130, 246)',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                    tension: 0.4
                                                },
                                                {
                                                    label: 'Memória (%)',
                                                    data: systemHistory.map(h => h.memory),
                                                    borderColor: 'rgb(34, 197, 94)',
                                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                    tension: 0.4
                                                },
                                                {
                                                    label: 'GPU (%)',
                                                    data: systemHistory.map(h => h.gpu),
                                                    borderColor: 'rgb(168, 85, 247)',
                                                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
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
                                                    labels: {
                                                        color: cssVar('--on-surface-variant'),
                                                        boxWidth: 12,
                                                        padding: 10
                                                    }
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    max: 100,
                                                    ticks: {
                                                        color: cssVar('--on-surface-variant')
                                                    },
                                                    grid: {
                                                        color: cssVar('--outline')
                                                    }
                                                },
                                                x: {
                                                    ticks: {
                                                        color: cssVar('--on-surface-variant')
                                                    },
                                                    grid: {
                                                        color: cssVar('--outline')
                                                    }
                                                }
                                            },
                                            interaction: {
                                                intersect: false,
                                                mode: 'index' as const
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Memory Distribution Chart */}
                        <div className="mt-6 p-4 bg-surface-container/50 border border-outline rounded-xl">
                            <h4 className="font-medium text-on-surface mb-4">Distribuição de Memória</h4>
                            <div className="h-64 flex items-center justify-center">
                                <Doughnut
                                    data={{
                                        labels: ['Usada', 'Livre'],
                                        datasets: [{
                                            data: [
                                                stats.system.memory?.used || 0,
                                                stats.system.memory?.free || 0
                                            ],
                                            backgroundColor: [
                                                'rgba(239, 68, 68, 0.8)',
                                                'rgba(34, 197, 94, 0.8)'
                                            ],
                                            borderColor: [
                                                'rgb(239, 68, 68)',
                                                'rgb(34, 197, 94)'
                                            ],
                                            borderWidth: 1
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom' as const,
                                                labels: {
                                                    color: cssVar('--on-surface-variant')
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Rebuild Index */}
                <div className="p-6 bg-surface-container/50 border border-outline rounded-xl mb-6">
                    <h3 className="text-lg font-semibold text-on-surface mb-4">Reconstruir Índice</h3>
                    <p className="text-sm text-on-surface-variant mb-4">
                        Reindexe seus documentos quando adicionar ou modificar arquivos.
                    </p>

                    <div className="flex gap-3 mb-4">
                        <Button
                            onClick={rebuildIndex}
                            disabled={isIndexing}
                            icon={isIndexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        >
                            {isIndexing ? 'Indexando...' : 'Reconstruir'}
                        </Button>

                        <Button
                            onClick={fetchStats}
                            variant="secondary"
                            icon={<Database className="w-4 h-4" />}
                        >
                            Atualizar Stats
                        </Button>
                    </div>

                    {/* Progress */}
                    {isIndexing && (
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-on-surface-variant">Progresso</span>
                                <span className="text-on-surface">{progress}%</span>
                            </div>
                            <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Logs */}
                    {logs.length > 0 && (
                        <div className="p-3 bg-surface rounded-lg max-h-48 overflow-y-auto font-mono text-xs">
                            {logs.map((log, i) => (
                                <div key={i} className="text-on-surface-variant py-0.5">
                                    {log}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Main App
function RagApp() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<ChatStatus | null>(null);
    const [activeTab, setActiveTab] = useState('chat');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // System information hook
    const systemInfo = useSystemInfo();

    // Conversation management with API persistence
    const [conversations, setConversations] = useState<Array<{ id: string, title: string, messages: Message[], createdAt: Date }>>([]);
    const [activeConversationIndex, setActiveConversationIndex] = useState<number>(-1);

    // Load conversations from API on mount
    useEffect(() => {
        const loadConversations = async () => {
            try {
                const response = await fetch('/api/conversations');
                if (response.ok) {
                    const data = await response.json();
                    const formattedConversations = data.map((conv: any) => ({
                        id: conv.id,
                        title: conv.title,
                        messages: conv.messages || [],
                        createdAt: new Date(conv.createdAt),
                    }));
                    setConversations(formattedConversations);
                    if (formattedConversations.length > 0) {
                        setActiveConversationIndex(0);
                    }
                }
            } catch (error) {
                console.error('Error loading conversations from API:', error);
            }
        };
        loadConversations();
    }, []);

    // Create initial conversation if none exist
    useEffect(() => {
        if (conversations.length === 0) {
            handleNewChat();
        }
    }, [conversations.length]);

    // Functions for API interaction
    const saveConversationToAPI = async (conversation: { id: string, title: string, messages: Message[], createdAt: Date }) => {
        try {
            const response = await fetch(`/api/conversations/${conversation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: conversation.title }),
            });
            if (!response.ok) {
                console.error('Failed to save conversation');
            }
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    const createConversationInAPI = async (id: string, title: string) => {
        try {
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title }),
            });
            if (!response.ok) {
                console.error('Failed to create conversation');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    };

    const deleteConversationFromAPI = async (id: string) => {
        try {
            const response = await fetch(`/api/conversations/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                console.error('Failed to delete conversation');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    const addMessageToAPI = async (conversationId: string, message: Message) => {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            if (!response.ok) {
                console.error('Failed to add message');
            }
        } catch (error) {
            console.error('Error adding message:', error);
        }
    };

    const updateMessageInAPI = async (messageId: string, content: string, isStreaming: boolean, sources?: any[], charts?: any[]) => {
        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, isStreaming, sources, charts }),
            });
            if (!response.ok) {
                console.error('Failed to update message');
            }
        } catch (error) {
            console.error('Error updating message:', error);
        }
    };

    const currentMessages = activeConversationIndex >= 0 ? conversations[activeConversationIndex]?.messages || [] : [];
    const setCurrentMessages = (msgs: Message[]) => {
        if (activeConversationIndex >= 0) {
            setConversations(prev => prev.map((conv, i) =>
                i === activeConversationIndex ? { ...conv, messages: msgs } : conv
            ));
        }
    };

    const handleNewChat = async () => {
        const newConv = {
            id: generateId(),
            title: 'Nova Conversa',
            messages: [],
            createdAt: new Date()
        };
        await createConversationInAPI(newConv.id, newConv.title);
        setConversations(prev => {
            const updated = [...prev, newConv];
            setActiveConversationIndex(updated.length - 1);
            return updated;
        });
        setActiveTab('chat');
    };

    const handleDeleteConversation = async (index: number) => {
        const conversationToDelete = conversations[index];
        if (conversationToDelete) {
            await deleteConversationFromAPI(conversationToDelete.id);
        }
        setConversations(prev => prev.filter((_, i) => i !== index));
        if (activeConversationIndex === index) {
            if (conversations.length > 1) {
                setActiveConversationIndex(index > 0 ? index - 1 : 0);
            } else {
                setActiveConversationIndex(-1);
            }
        } else if (activeConversationIndex > index) {
            setActiveConversationIndex(activeConversationIndex - 1);
        }
    };

    const exportToPDF = async () => {
        const pdf = new jsPDF();
        let yPosition = 20;

        // Header
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Relatório do Chat - Kaide', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPosition);
        yPosition += 15;

        // Add line separator
        pdf.setDrawColor(100, 100, 100);
        pdf.line(20, yPosition, 190, yPosition);
        yPosition += 10;

        for (const message of currentMessages) {
            // Check if we need a new page
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }

            // Message header (using text labels instead of emojis)
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            const role = message.role === 'user' ? 'Você:' : 'IA:';
            pdf.text(role, 20, yPosition);
            yPosition += 8;

            // Message content - clean up markdown and special characters
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');

            // Clean up the content: remove markdown formatting and special characters
            let cleanContent = message.content
                .replace(/[#*_`~]/g, '') // Remove markdown symbols
                .replace(/[\u{1F000}-\u{1F9FF}]/gu, '') // Remove all emojis
                .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
                .replace(/^\s*#+\s*/gm, '') // Remove heading markers
                .replace(/^\s*-+\s*/gm, '- ') // Keep list markers but normalize them
                .trim();

            // Split content into lines and add to PDF
            const lines = pdf.splitTextToSize(cleanContent, 160);
            for (const line of lines) {
                if (yPosition > 270) {
                    pdf.addPage();
                    yPosition = 20;
                }
                pdf.text(line, 25, yPosition);
                yPosition += 5;
            }
            yPosition += 3;

            // Sources
            if (message.sources && message.sources.length > 0) {
                if (yPosition > 260) {
                    pdf.addPage();
                    yPosition = 20;
                }

                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'italic');
                pdf.text('Fontes consultadas:', 25, yPosition);
                yPosition += 6;

                message.sources.forEach((source: any, index) => {
                    if (yPosition > 270) {
                        pdf.addPage();
                        yPosition = 20;
                    }

                    // Support different source formats
                    const sourceName = source.title || source.file || source.source || source.endpoint || 'Fonte desconhecida';
                    const sourceDetail = source.dataPreview || source.content || '';
                    const sourceText = sourceDetail 
                        ? `${index + 1}. ${sourceName} - ${sourceDetail}`
                        : `${index + 1}. ${sourceName}`;
                    
                    const sourceLines = pdf.splitTextToSize(sourceText, 155);
                    pdf.text(sourceLines, 30, yPosition);
                    yPosition += sourceLines.length * 4 + 2;
                });
                yPosition += 2;
            }

            // Charts - capture as images and add to PDF
            if (message.charts && message.charts.length > 0) {
                // Get all chart containers
                const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
                if (messageElement) {
                    const chartContainers = messageElement.querySelectorAll('[data-chart-container]');
                    
                    for (let chartIndex = 0; chartIndex < chartContainers.length && chartIndex < message.charts.length; chartIndex++) {
                        const chartContainer = chartContainers[chartIndex] as HTMLElement;
                        const chart = message.charts[chartIndex];

                        // Check if we need a new page for the chart
                        if (yPosition > 200) {
                            pdf.addPage();
                            yPosition = 20;
                        }

                        try {
                            // Capture chart as image
                            const canvas = await html2canvas(chartContainer, {
                                backgroundColor: cssVar('--surface-container'),
                                scale: 2,
                                logging: false
                            });
                            
                            const imgData = canvas.toDataURL('image/png');
                            const imgWidth = 170;
                            const imgHeight = (canvas.height * imgWidth) / canvas.width;

                            // Add chart title
                            pdf.setFontSize(10);
                            pdf.setFont('helvetica', 'bold');
                            pdf.text(chart.title, 20, yPosition);
                            yPosition += 7;

                            // Add chart image
                            pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
                            yPosition += imgHeight + 5;

                        } catch (error) {
                            console.error('Error capturing chart:', error);
                            // Fallback to text data if image capture fails
                            pdf.setFontSize(9);
                            pdf.setFont('helvetica', 'bold');
                            pdf.text(`${chartIndex + 1}. ${chart.title}`, 25, yPosition);
                            yPosition += 5;

                            chart.datasets.forEach(ds => {
                                if (yPosition > 270) {
                                    pdf.addPage();
                                    yPosition = 20;
                                }
                                pdf.setFontSize(8);
                                pdf.setFont('helvetica', 'normal');
                                const chartData = `${ds.label}: ${ds.data.join(', ')}`;
                                const chartLines = pdf.splitTextToSize(chartData, 150);
                                pdf.text(chartLines, 30, yPosition);
                                yPosition += chartLines.length * 4 + 2;
                            });
                        }
                        yPosition += 3;
                    }
                }
            }

            // Timestamp
            if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
            }

            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(100, 100, 100);
            pdf.text(formatTime(message.timestamp), 25, yPosition);
            pdf.setTextColor(0, 0, 0);
            yPosition += 8;

            // Separator between messages
            if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.setDrawColor(200, 200, 200);
            pdf.line(20, yPosition, 190, yPosition);
            yPosition += 8;
        }

        // Footer
        const pageCount = pdf.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Página ${i} de ${pageCount}`, 20, 285);
            pdf.text('Gerado por Kaide', 105, 285, { align: 'center' });
        }

        pdf.save(`chat-chronokairo-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Fetch status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/chat/status');
                const data = await response.json();
                setStatus({ status: 'online', ...data });
            } catch {
                setStatus({ status: 'error' });
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 800);
        return () => clearInterval(interval);
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages]);

    const handleSubmit = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: '',
            sources: [],
            timestamp: new Date(),
            isStreaming: true,
        };

        const messagesWithUser = [...currentMessages, userMessage, assistantMessage];
        setCurrentMessages(messagesWithUser);
        setInput('');
        setIsLoading(true);

        // Add user message to API
        if (activeConversationIndex >= 0) {
            await addMessageToAPI(conversations[activeConversationIndex].id, userMessage);
        }

        // Update conversation title if it's the first message
        if (activeConversationIndex >= 0 && conversations[activeConversationIndex].title === 'Nova Conversa') {
            const newTitle = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '');
            setConversations(prev => prev.map((conv, i) =>
                i === activeConversationIndex ? { ...conv, title: newTitle } : conv
            ));
            await saveConversationToAPI({ ...conversations[activeConversationIndex], title: newTitle });
        }

        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content }),
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            let fullContent = '';
            let sources: Source[] = [];
            let charts: ChartData[] = [];
            let lastUpdateTime = 0;
            const updateInterval = 100; // Update UI every 100ms

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'sources') {
                                sources = data.data;
                            } else if (data.type === 'charts') {
                                charts = data.data;
                            } else if (data.type === 'chunk') {
                                fullContent += data.data;

                                // Debounced UI update
                                const now = Date.now();
                                if (now - lastUpdateTime >= updateInterval) {
                                    const newMessages = [...messagesWithUser];
                                    const lastMessage = newMessages[newMessages.length - 1];
                                    if (lastMessage && lastMessage.role === 'assistant') {
                                        lastMessage.content = fullContent;
                                        lastMessage.sources = sources;
                                        lastMessage.charts = charts;
                                    }
                                    setCurrentMessages([...newMessages]);
                                    lastUpdateTime = now;
                                }
                            }
                        } catch { }
                    }
                }
            }

            // Final update with complete content
            const newMessages = [...messagesWithUser];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                // Extract charts from content before setting final message
                const { cleanContent, charts: extractedCharts } = extractChartsFromContent(fullContent);

                lastMessage.content = cleanContent;
                lastMessage.sources = sources;
                lastMessage.charts = [...charts, ...extractedCharts]; // Merge SSE charts with extracted charts
                lastMessage.isStreaming = false;

                // Add assistant message to API
                if (activeConversationIndex >= 0) {
                    await addMessageToAPI(conversations[activeConversationIndex].id, lastMessage);
                }
            }
            setCurrentMessages(newMessages);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const newMessages = [...messagesWithUser];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = `❌ Erro ao processar sua mensagem: ${errorMessage}`;
                lastMessage.isStreaming = false;
                // Add error message to API
                if (activeConversationIndex >= 0) {
                    await addMessageToAPI(conversations[activeConversationIndex].id, lastMessage);
                }
            }
            setCurrentMessages(newMessages);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, currentMessages, conversations, activeConversationIndex]);

    const handleSuggestionClick = (text: string) => {
        setInput(text);
    };

    const clearChat = () => {
        setCurrentMessages([]);
    };

    return (
        <div className="h-screen flex bg-background text-on-background">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                conversations={conversations}
                activeConversationIndex={activeConversationIndex}
                onConversationSelect={setActiveConversationIndex}
                onDeleteConversation={handleDeleteConversation}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-surface-container rounded-lg"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="font-semibold text-on-surface">
                            {activeTab === 'chat' && 'Chat'}
                            {activeTab === 'turmas' && 'Turmas & Matrículas'}
                            {activeTab === 'search' && 'Busca Semântica'}
                            {activeTab === 'settings' && 'Configurações'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={handleNewChat} className="p-2 hover:bg-surface-container rounded-lg" title="Nova Conversa">
                            <Plus className="w-5 h-5" />
                        </button>
                        <button onClick={() => setActiveTab('chat')} className={`p-2 rounded-lg ${activeTab === 'chat' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface'}`} title="Chat">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <button onClick={() => setActiveTab('search')} className={`p-2 rounded-lg ${activeTab === 'search' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface'}`} title="Buscar">
                            <Search className="w-5 h-5" />
                        </button>
                        <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-lg ${activeTab === 'settings' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface'}`} title="Configurações">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>

                    <SystemInfoBar systemInfo={systemInfo} />
                    <StatusBar status={status} />
                    <ThemeToggle />
                    {activeTab === 'chat' && currentMessages.length > 0 && (
                        <Button
                            onClick={exportToPDF}
                            variant="secondary"
                            size="sm"
                            icon={<FileText className="w-4 h-4" />}
                        >
                            Export PDF
                        </Button>
                    )}
                </header>

                {/* Content */}
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
                        />
                    </>
                )}

                {activeTab === 'search' && <SearchTab />}
                {activeTab === 'settings' && <SettingsTab />}
            </div>
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <RagApp />
        </ThemeProvider>
    );
}
