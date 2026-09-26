// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import {
    Bot, Send, FileText, Sparkles, User,
    BarChart2, TrendingUp, BookOpen, DollarSign, Users, Layers, Plus
} from 'lucide-react';
import { T } from '../../../shared/config/tokens';
import { ollamaChat, CRM_SYSTEM_PROMPT, DEFAULT_MODEL, type OllamaMessage } from '../../../shared/api/ollama';

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
        label: 'Dashboard & Relatórios', color: T.blue, bg: T.blueBg,
        icon: BarChart2,
        questions: ['Dashboard completo do sistema', 'Relatório executivo completo', 'Visão geral de tudo'],
    },
    {
        label: 'Pipeline & Conversão', color: T.green, bg: T.greenBg,
        icon: TrendingUp,
        questions: ['Quantos negócios estão no pipeline?', 'Qual a taxa de conversão?', 'Ciclo médio de vendas'],
    },
    {
        label: 'Clientes & Projetos', color: T.purple, bg: T.purpleBg,
        icon: BookOpen,
        questions: ['Quais são os principais clientes?', 'Projetos em andamento', 'Volume de serviços prestados'],
    },
    {
        label: 'Receita & Faturamento', color: T.amber, bg: T.amberBg,
        icon: DollarSign,
        questions: ['Contratos de maior valor', 'Previsão de receita', 'MRR atual'],
    },
    {
        label: 'Produtividade & Equipe', color: T.red, bg: T.redBg,
        icon: Users,
        questions: ['Produtividade por consultor', 'Tempo de resposta a leads', 'Atividades pendentes'],
    },
    {
        label: 'Análises Combinadas', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',
        icon: Layers,
        questions: ['Pipeline e MRR', 'Produtividade e conversão', 'Visão 360 do negócio'],
    },
];

const QUICK = ['Previsão de receita', 'Taxa de conversão', 'Projetos em andamento', 'Pipeline de vendas'];

// ── Simple markdown renderer (bold, list, table, code block) ───────────────────
const MD = ({ text }: { text: string }) => {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // h3
        if (line.startsWith('### ')) { nodes.push(<p key={i} style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 4, marginTop: 10 }}>{line.slice(4)}</p>); i++; continue; }
        // h2
        if (line.startsWith('## '))  { nodes.push(<p key={i} style={{ fontSize: 14, fontWeight: 700, color: T.text1, marginBottom: 6, marginTop: 12 }}>{line.slice(3)}</p>); i++; continue; }
        // code block
        if (line.startsWith('```')) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
            nodes.push(<pre key={i} style={{ fontFamily: 'monospace', fontSize: 11, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', overflowX: 'auto', margin: '6px 0' }}>{codeLines.join('\n')}</pre>);
            i++; continue;
        }
        // table
        if (line.startsWith('|')) {
            const rows: string[][] = [];
            while (i < lines.length && lines[i].startsWith('|')) {
                if (!lines[i].includes('---')) rows.push(lines[i].split('|').slice(1,-1).map(c => c.trim()));
                i++;
            }
            nodes.push(
                <table key={i} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, margin: '6px 0' }}>
                    <thead>
                        <tr>{rows[0]?.map((h, ci) => <th key={ci} style={{ padding: '4px 10px', textAlign: 'left', fontWeight: 600, background: T.bg2, borderBottom: `1px solid ${T.border}`, color: T.text2 }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {rows.slice(1).map((row, ri) => (
                            <tr key={ri}>{row.map((c, ci) => <td key={ci} style={{ padding: '4px 10px', borderBottom: `1px solid ${T.bg3}`, color: T.text1 }}>{c}</td>)}</tr>
                        ))}
                    </tbody>
                </table>
            );
            continue;
        }
        // bullet
        if (line.startsWith('- ') || line.startsWith('* ')) {
            nodes.push(<li key={i} style={{ fontSize: 13, color: T.text1, marginLeft: 16, marginBottom: 2 }} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, `<strong>$1</strong>`) }} />);
            i++; continue;
        }
        // numbered
        if (/^\d+\./.test(line)) {
            nodes.push(<li key={i} style={{ fontSize: 13, color: T.text1, marginLeft: 16, marginBottom: 2, listStyleType: 'decimal' }} dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s*/, '').replace(/\*\*(.+?)\*\*/g, `<strong>$1</strong>`) }} />);
            i++; continue;
        }
        // empty
        if (!line.trim()) { nodes.push(<div key={i} style={{ height: 6 }} />); i++; continue; }
        // paragraph
        nodes.push(<p key={i} style={{ fontSize: 13, color: T.text1, lineHeight: 1.6, margin: '2px 0' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, `<strong>$1</strong>`) }} />);
        i++;
    }
    return <div>{nodes}</div>;
};

// ── Component ──────────────────────────────────────────────────────────────────
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
        // Check if Ollama is running on component mount
        fetch('/ollama/api/tags')
            .then(res => {
                if (!res.ok) setIsOllamaOffline(true);
            })
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

        // Build Ollama message history
        const history: OllamaMessage[] = [
            { role: 'system', content: CRM_SYSTEM_PROMPT },
            ...updatedMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ];

        // Placeholder for streaming
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
            if (err.name === 'AbortError') {
                // User cancelled — keep partial response
            } else {
                const msg = err.message?.includes('fetch') || err.message?.includes('NetworkError')
                    ? 'Não foi possível conectar ao Ollama. Verifique se ele está rodando em http://localhost:11434'
                    : err.message ?? 'Erro desconhecido';
                setOllamaError(msg);
                setMessages(prev => prev.filter(m => m.id !== assistantId));
            }
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    };

    const handleReindex = async () => {
        if (!window.confirm('Reindexar todos os documentos? Isso pode levar alguns minutos.')) return;
        setIndexing(true);
        try {
            await fetch('/api/chat/index/rebuild', { method: 'POST', credentials: 'include' });
        } catch { /* ignore */ }
        finally { setIndexing(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)' }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4 flex-shrink-0">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text1, lineHeight: 1.2 }}>Relatorios Chat RAG</h1>
                    </div>
                    <p style={{ fontSize: 13, color: T.text3, marginTop: 4 }}>Consulte dados e gere relatorios usando inteligencia artificial</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleReindex} disabled={indexing}
                        className="flex items-center gap-1.5"
                        style={{ fontSize: 12, fontWeight: 500, color: T.text2, padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg1, cursor: indexing ? 'not-allowed' : 'pointer', opacity: indexing ? 0.6 : 1 }}>
                        <FileText size={13} strokeWidth={1.8} /> {indexing ? 'Reindexando...' : 'Reindexar Dados'}
                    </button>
                    <select value={model} onChange={e => setModel(e.target.value)}
                        style={{ fontSize: 12, color: T.text2, padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg1, cursor: 'pointer', outline: 'none' }}>
                        <option value="llama3">llama3</option>
                        <option value="llama3.2">llama3.2</option>
                        <option value="mistral">mistral</option>
                        <option value="gemma3">gemma3</option>
                        <option value="qwen2.5">qwen2.5</option>
                        <option value="phi4">phi4</option>
                    </select>
                    <button onClick={() => { setMessages([]); setOllamaError(null); }}
                        className="flex items-center gap-1.5"
                        style={{ fontSize: 12, fontWeight: 500, color: T.text2, padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg1, cursor: 'pointer' }}>
                        <Plus size={13} strokeWidth={1.8} /> Nova Conversa
                    </button>
                </div>
            </div>

            {/* Ollama error banner */}
            {(isOllamaOffline || ollamaError) && (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12 }}>
                    ⚠️ {isOllamaOffline ? 'Ollama está offline. Por favor, certifique-se de que o Ollama está rodando localmente (http://localhost:11434).' : ollamaError}
                </div>
            )}

            {/* Chat box */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', minHeight: 0 }}>
                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                    {messages.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: T.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <Sparkles size={24} color={T.blue} strokeWidth={1.6} />
                            </div>
                            <p style={{ fontSize: 16, fontWeight: 600, color: T.text1, marginBottom: 4, textAlign: 'center' }}>Bem-vindo ao Chat RAG</p>
                            <p style={{ fontSize: 13, color: T.text3, marginBottom: 28, textAlign: 'center' }}>Faca perguntas sobre seus dados e relatorios</p>

                            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                {CATEGORIES.map(cat => (
                                    <div key={cat.label}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div style={{ width: 20, height: 20, borderRadius: 5, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <cat.icon size={11} color={cat.color} strokeWidth={1.8} />
                                            </div>
                                            <p style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat.label}</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {cat.questions.map(q => (
                                                <button key={q} onClick={() => send(q)}
                                                    style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, fontSize: 12, color: T.text1, background: T.bg0, border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all .15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.background = cat.bg; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg0; }}>
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                            <Bot size={14} color={T.blue} strokeWidth={1.8} />
                                        </div>
                                    )}
                                    <div style={{
                                        maxWidth: '65%', width: 'fit-content', borderRadius: 10, padding: '6px 10px',
                                        background: msg.role === 'user' ? T.accent : T.bg0,
                                        border: msg.role === 'user' ? 'none' : `1px solid ${T.border}`,
                                        color: msg.role === 'user' ? '#fff' : T.text1,
                                    }}>
                                        {msg.role === 'assistant' ? <MD text={msg.content} /> : <p style={{ fontSize: 13 }}>{msg.content}</p>}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                                                <p style={{ fontSize: 10, color: T.text3, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <FileText size={10} /> Fontes consultadas:
                                                </p>
                                                {msg.sources.map((s: any, i: number) => (
                                                    <p key={i} style={{ fontSize: 10, color: T.text2, marginBottom: 1 }}>• {typeof s === 'string' ? s : s.title || s.source || JSON.stringify(s)}</p>
                                                ))}
                                            </div>
                                        )}
                                        <p style={{ fontSize: 10, color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : T.text3, marginTop: 4 }}>
                                            {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                            <User size={14} color={T.accent} strokeWidth={1.8} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-3 mb-4">
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Bot size={14} color={T.blue} strokeWidth={1.8} />
                                    </div>
                                    <div style={{ background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                                        {[0, 150, 300].map(d => (
                                            <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: T.text3, animation: `bounce 1s ${d}ms infinite` }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </>
                    )}
                </div>

                {/* Input area */}
                <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 16px', background: T.bg0, flexShrink: 0 }}>
                    {messages.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <p style={{ fontSize: 11, color: T.text3 }}>Sugestoes rapidas:</p>
                            {QUICK.map(q => (
                                <button key={q} onClick={() => send(q)} disabled={loading}
                                    style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, color: T.text2, background: T.bg1, border: `1px solid ${T.border}`, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                            placeholder="Digite sua pergunta..."
                            disabled={loading}
                            style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text1, background: T.bg1, outline: 'none' }} />
                        <button onClick={() => send()} disabled={!input.trim() || loading}
                            style={{ width: 38, height: 38, borderRadius: 8, background: !input.trim() || loading ? T.bg2 : T.accent, border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Send size={15} color={!input.trim() || loading ? T.text3 : '#fff'} strokeWidth={1.8} />
                        </button>
                    </div>
                    <p style={{ fontSize: 10, color: T.text3, marginTop: 6 }}>Enter para enviar • Clique nas sugestoes para usar</p>
                </div>
            </div>

            <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
        </div>
    );
};

export default RelatoriosChatRAG;
