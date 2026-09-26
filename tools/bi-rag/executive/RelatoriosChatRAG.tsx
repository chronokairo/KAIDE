// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import {
    Bot, Send, FileText, Sparkles, User,
    BarChart2, BarChart3, TrendingUp, BookOpen, DollarSign, Users, Layers, Plus,
    StopCircle, RefreshCw, Cpu, Brain, Database, Search, ChevronRight, ArrowRight
} from 'lucide-react';
import { T, spacing, borderRadius, shadows } from '@/shared/config/tokens';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { ollamaChat, CRM_SYSTEM_PROMPT, DEFAULT_MODEL, type OllamaMessage } from '@/features/analytics/api/ollama';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: string[];
}

// ── Suggestion categories ───────────────────────────────────────────────────────
const CATEGORIES = [
    {
        label: 'Inteligência de Vendas', color: T.green, bg: T.greenBg,
        icon: TrendingUp,
        questions: ['Qual a taxa de conversão?', 'Ciclo médio de vendas', 'Pipeline atual'],
    },
    {
        label: 'Gestão de Receita', color: T.purple, bg: T.purpleBg,
        icon: DollarSign,
        questions: ['Contratos de maior valor', 'Previsão de MRR', 'Faturamento mensal'],
    },
    {
        label: 'Operações & Equipe', color: T.amber, bg: T.amberBg,
        icon: Users,
        questions: ['Produtividade por consultor', 'Tempo de resposta médio', 'Gargalos no processo'],
    },
];

const QUICK = ['Resumo executivo', 'Principais KPIs hoje', 'Alertas de pipeline'];

// ── Simple markdown renderer ───────────────────
const MD = ({ text }: { text: string }) => {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (line.startsWith('### ')) { nodes.push(<h3 key={i} className="text-sm font-black uppercase tracking-widest mt-6 mb-2" style={{ color: T.accent }}>{line.slice(4)}</h3>); i++; continue; }
        if (line.startsWith('## '))  { nodes.push(<h2 key={i} className="text-lg font-black tracking-tight mt-8 mb-4 border-b pb-2" style={{ color: T.text1, borderColor: T.border }}>{line.slice(3)}</h2>); i++; continue; }
        if (line.startsWith('```')) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
            nodes.push(<pre key={i} className="font-mono text-[11px] p-4 rounded-2xl border my-4 overflow-x-auto shadow-inner" style={{ background: T.bg0, borderColor: T.border, color: T.text2 }}>{codeLines.join('\n')}</pre>);
            i++; continue;
        }
        if (line.startsWith('|')) {
            const rows: string[][] = [];
            while (i < lines.length && lines[i].startsWith('|')) {
                if (!lines[i].includes('---')) rows.push(lines[i].split('|').slice(1,-1).map(c => c.trim()));
                i++;
            }
            nodes.push(
                <div key={i} className="overflow-hidden rounded-2xl border my-4 shadow-sm" style={{ borderColor: T.border }}>
                  <table className="w-full border-collapse text-xs">
                      <thead>
                          <tr style={{ background: T.bg0 }}>{rows[0]?.map((h, ci) => <th key={ci} className="p-3 text-left font-black uppercase tracking-tighter" style={{ borderBottom: `1px solid ${T.border}`, color: T.text3 }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                          {rows.slice(1).map((row, ri) => (
                              <tr key={ri} className="hover:opacity-80 transition-colors border-b last:border-0" style={{ borderColor: T.bg3 }}>
                                {row.map((c, ci) => <td key={ci} className="p-3 font-medium" style={{ color: T.text1 }}>{c}</td>)}
                              </tr>
                          ))}
                      </tbody>
                  </table>
                </div>
            );
            continue;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
            nodes.push(<li key={i} className="text-sm ml-4 mb-2 list-disc" style={{ color: T.text2 }} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, `<strong>$1</strong>`) }} />);
            i++; continue;
        }
        if (/^\d+\./.test(line)) {
            nodes.push(<li key={i} className="text-sm ml-4 mb-2 list-decimal" style={{ color: T.text2 }} dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s*/, '').replace(/\*\*(.+?)\*\*/g, `<strong>$1</strong>`) }} />);
            i++; continue;
        }
        if (!line.trim()) { nodes.push(<div key={i} className="h-4" />); i++; continue; }
        nodes.push(<p key={i} className="text-sm leading-relaxed mb-4 font-medium" style={{ color: T.text1 }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, `<span style="color:${T.accent};font-weight:800">$1</span>`) }} />);
        i++;
    }
    return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">{nodes}</div>;
};

const RelatoriosChatRAG = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [indexing, setIndexing] = useState(false);
    const [model, setModel]       = useState(DEFAULT_MODEL);
    const [ollamaError, setOllamaError] = useState<string | null>(null);
    const [isOllamaOffline, setIsOllamaOffline] = useState(false);
    const abortRef  = useRef<AbortController | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

    useEffect(() => {
        fetch('/ollama/api/tags')
            .then(res => { if (!res.ok) setIsOllamaOffline(true); })
            .catch(() => setIsOllamaOffline(true));
    }, []);

    const send = async (text?: string) => {
        const q = (text ?? input).trim();
        if (!q || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: q, timestamp: new Date() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);
        setOllamaError(null);

        const history: OllamaMessage[] = [
            { role: 'system', content: CRM_SYSTEM_PROMPT },
            ...updatedMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ];

        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), sources: [] }]);

        abortRef.current = new AbortController();

        try {
            await ollamaChat({
                model,
                messages: history,
                signal: abortRef.current.signal,
                onChunk: (chunk) => {
                    setMessages(prev => prev.map(m =>
                        m.id === assistantId ? { ...m, content: m.content + chunk } : m
                    ));
                },
            });
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                const msg = err.message?.includes('fetch') || err.message?.includes('NetworkError')
                    ? 'Conexão falhou. Ollama rodando?'
                    : err.message ?? 'Erro desconhecido';
                setOllamaError(msg);
            }
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    };

    const handleReindex = async () => {
        if (!window.confirm('Reindexar dados?')) return;
        setIndexing(true);
        try { await fetch('/api/chat/index/rebuild', { method: 'POST', credentials: 'include' }); } catch { /* ignore */ }
        finally { setIndexing(false); }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
            <PageHeader
                icon={<BarChart3 size={18} />}
                title="Relatórios"
                subtitle="Análise de dados com inteligência artificial"
            />
            {/* AI Command Center Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: `${spacing.md} ${spacing.lg}`, borderRadius: borderRadius.lg, border: `1px solid ${T.border}`, background: T.bg1, marginBottom: 12 }}>
                <div className="flex items-center gap-4">
                    <div style={{ width: 36, height: 36, borderRadius: borderRadius.lg, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accentBg, color: T.accent }}>
                        <Brain size={24} className="relative z-10" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 600, color: T.text1, margin: 0 }}>Relatórios Chat RAG</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ background: isOllamaOffline ? T.redBg : T.greenBg, color: isOllamaOffline ? T.red : T.green }}>
                            {isOllamaOffline ? 'Offline' : `Local: ${model}`}
                          </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleReindex}
                        disabled={indexing}
                        icon={<Database size={18} className={indexing ? 'animate-spin' : ''} />}
                        title="Reindexar Dados"
                    />
                    <select value={model} onChange={e => setModel(e.target.value)}
                            className="text-xs font-bold px-4 py-2.5 rounded-xl border outline-none cursor-pointer"
                            style={{ borderColor: T.border, color: T.text2, background: T.bg1 }}>
                        {['llama3', 'llama3.2', 'mistral', 'gemma2', 'qwen2.5', 'phi4'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMessages([])}
                        icon={<Plus size={18} />}
                        title="Nova Conversa"
                    />
                </div>
            </div>

            {/* Chat Experience */}
            <div className="flex-1 flex flex-col rounded-[2.5rem] border shadow-2xl overflow-hidden relative" style={{ background: T.bg1, borderColor: T.border }}>
                
                {/* Message Canvas */}
                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-hide">
                    {messages.length === 0 ? (
                        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-700">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center mb-8 shadow-inner">
                                <Sparkles size={40} className="text-indigo-500" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight mb-4" style={{ color: T.text1 }}>Como posso ajudar com seus dados hoje?</h2>
                            <p className="text-sm font-medium mb-12 opacity-60 max-w-md" style={{ color: T.text3 }}>Consulte relatórios, analise o pipeline ou peça uma visão executiva do seu negócio.</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                {CATEGORIES.map(cat => (
                                    <div key={cat.label} className="space-y-3">
                                        <div className="flex items-center gap-2 px-3">
                                            <cat.icon size={14} style={{ color: cat.color }} />
                                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>{cat.label}</span>
                                        </div>
                                        {cat.questions.map(q => (
                                            <button key={q} onClick={() => send(q)}
                                                    className="w-full text-left p-4 rounded-2xl border text-xs font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                                                    style={{ background: T.bg0, borderColor: T.border, color: T.text1 }}>
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto w-full space-y-12">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <Bot size={20} className="text-indigo-500" />
                                        </div>
                                    )}
                                    <div className={`relative ${msg.role === 'user' ? 'max-w-[80%]' : 'flex-1'}`}>
                                        {msg.role === 'user' ? (
                                            <div className="px-6 py-4 rounded-[2rem] font-bold text-sm shadow-xl" style={{ background: T.accent, color: '#fff' }}>
                                                {msg.content}
                                            </div>
                                        ) : (
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <MD text={msg.content} />
                                            </div>
                                        )}
                                        <div className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-right opacity-40' : 'opacity-40'}`} style={{ color: T.text3 }}>
                                            {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 border flex items-center justify-center flex-shrink-0 shadow-sm" style={{ borderColor: T.border }}>
                                            <User size={20} style={{ color: T.text2 }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-6 animate-pulse">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                        <Bot size={20} className="text-indigo-500" />
                                    </div>
                                    <div className="flex-1 flex gap-2 pt-4">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-indigo-500/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-indigo-500/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} className="h-20" />
                        </div>
                    )}
                </div>

                {/* AI Input Dock */}
                <div className="p-8 relative z-20" style={{ background: `linear-gradient(to top, ${T.bg1} 80%, transparent 100%)` }}>
                    <div className="max-w-3xl mx-auto">
                        <div className="relative group shadow-2xl rounded-3xl overflow-hidden border transition-all focus-within:ring-4 focus-within:ring-indigo-500/20"
                             style={{ background: T.bg0, borderColor: T.border }}>
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                                placeholder="Descreva o relatório ou pergunta que você precisa..."
                                fullWidth
                                style={{ background: 'transparent', color: T.text1, paddingRight: '60px' }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {loading ? (
                                    <Button
                                        onClick={() => abortRef.current?.abort()}
                                        size="md"
                                        variant="destructive"
                                        icon={<StopCircle size={20} />}
                                    />
                                ) : (
                                    <Button
                                        onClick={() => send()}
                                        disabled={!input.trim()}
                                        size="md"
                                        icon={<ArrowRight size={22} />}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: T.text3 }}>
                             <Cpu size={12} /> Local Processing
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: T.text3 }}>
                             <Search size={12} /> RAG Enabled
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RelatoriosChatRAG;
