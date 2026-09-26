import React, { useState, useRef, useEffect } from 'react';
import { SparkIcon, CloseIcon } from './icons';
import { useLocation } from 'react-router-dom';

let _msgCounter = 0;
const nextId = () => String(++_msgCounter);

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface Suggestion {
    label: string;
    prompt: string;
}

const ROUTE_CONTEXT: Record<string, { title: string; suggestions: Suggestion[] }> = {
    '/': {
        title: 'Dashboard',
        suggestions: [
            { label: 'Analisar performance', prompt: 'Como está a performance geral das minhas campanhas?' },
            { label: 'Próximas ações', prompt: 'Quais são as próximas ações recomendadas para melhorar meus resultados?' },
        ],
    },
    '/conversoes': {
        title: 'Conversões',
        suggestions: [
            { label: 'Otimizar Landing Page', prompt: 'Como posso otimizar minha landing page para aumentar conversões?' },
            { label: 'Sugerir título', prompt: 'Sugira 5 títulos de alta conversão para minha landing page.' },
            { label: 'Melhorar CTA', prompt: 'Quais CTAs tendem a converter mais no meu segmento?' },
        ],
    },
    '/trafego': {
        title: 'Tráfego',
        suggestions: [
            { label: 'Palavras-chave', prompt: 'Sugira palavras-chave de cauda longa com alto potencial.' },
            { label: 'Melhor horário', prompt: 'Qual é o melhor horário para postar nas redes sociais?' },
            { label: 'Conteúdo para Instagram', prompt: 'Gere uma legenda para Instagram sobre marketing digital.' },
        ],
    },
    '/relacionamento': {
        title: 'Relacionamento',
        suggestions: [
            { label: 'Assunto de email', prompt: 'Sugira 5 assuntos de email com alta taxa de abertura.' },
            { label: 'Fluxo de automação', prompt: 'Como estruturar um fluxo de boas-vindas eficiente?' },
            { label: 'Mensagem WhatsApp', prompt: 'Escreva uma mensagem de follow-up para WhatsApp.' },
        ],
    },
    '/leads': {
        title: 'Leads',
        suggestions: [
            { label: 'Segmentar leads', prompt: 'Como devo segmentar meus leads para campanhas mais eficientes?' },
            { label: 'Qualificação', prompt: 'Quais critérios usar para qualificar leads como prontos para venda?' },
        ],
    },
    '/analytics': {
        title: 'Analytics',
        suggestions: [
            { label: 'Interpretar métricas', prompt: 'Como interpretar a taxa de conversão das minhas campanhas?' },
            { label: 'Melhorar ROI', prompt: 'Quais ações melhoram o ROI das campanhas de email?' },
        ],
    },
};

const DEFAULT_CONTEXT = {
    title: 'CK Marketing',
    suggestions: [
        { label: 'Dicas de marketing', prompt: 'Dê 3 dicas rápidas para melhorar minha estratégia de marketing digital.' },
        { label: 'Como começar', prompt: 'Por onde devo começar para gerar mais leads?' },
    ],
};

function getContext(pathname: string) {
    const exact = ROUTE_CONTEXT[pathname];
    if (exact) return exact;
    for (const key of Object.keys(ROUTE_CONTEXT)) {
        if (key !== '/' && pathname.startsWith(key)) return ROUTE_CONTEXT[key];
    }
    return DEFAULT_CONTEXT;
}

const INITIAL_MESSAGE: Message = {
    id: 'welcome',
    role: 'assistant',
    content: 'Olá! Sou o **Mentor IA** da CK Marketing. Posso ajudar com sugestões de títulos, assuntos de email, conteúdo para redes sociais, segmentação de leads e muito mais. O que você precisa?',
};

interface MentorIASidebarProps {
    open: boolean;
    onClose: () => void;
}

export const MentorIASidebar: React.FC<MentorIASidebarProps> = ({ open, onClose }) => {
    const location = useLocation();
    const ctx = getContext(location.pathname);
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMsg: Message = { id: nextId(), role: 'user', content: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Simulated AI response (replace with real API call when backend is ready)
        await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 600));

        const responses = getSimulatedResponse(trimmed, ctx.title);
        const assistantMsg: Message = {
            id: nextId(),
            role: 'assistant',
            content: responses,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <aside
            style={{
                ...styles.sidebar,
                transform: open ? 'translateX(0)' : 'translateX(100%)',
                pointerEvents: open ? 'all' : 'none',
            }}
            aria-label="Mentor IA"
        >
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.aiAvatarSmall}>
                        <SparkIcon size={14} color="#fff" />
                    </div>
                    <div>
                        <div style={styles.headerTitle}>Mentor IA</div>
                        <div style={styles.headerSub}>Contexto: {ctx.title}</div>
                    </div>
                </div>
                <button style={styles.closeBtn} onClick={onClose} aria-label="Fechar Mentor IA">
                    <CloseIcon size={16} />
                </button>
            </div>

            {/* Messages */}
            <div style={styles.messages}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            ...styles.messageRow,
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                    >
                        {msg.role === 'assistant' && (
                            <div style={styles.aiDot}>
                                <SparkIcon size={10} color="#fff" />
                            </div>
                        )}
                        <div
                            style={{
                                ...styles.bubble,
                                ...(msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI),
                            }}
                        >
                            <FormattedContent content={msg.content} />
                        </div>
                    </div>
                ))}

                {loading && (
                    <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                        <div style={styles.aiDot}>
                            <SparkIcon size={10} color="#fff" />
                        </div>
                        <div style={{ ...styles.bubble, ...styles.bubbleAI }}>
                            <div style={styles.typingDots} className="mentor-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && (
                <div style={styles.suggestionsArea}>
                    <div style={styles.suggestionsLabel}>Sugestões</div>
                    <div style={styles.suggestions}>
                        {ctx.suggestions.map((s) => (
                            <button
                                key={s.prompt}
                                style={styles.suggestionChip}
                                onClick={() => sendMessage(s.prompt)}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div style={styles.inputArea}>
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte ao Mentor IA..."
                    rows={1}
                    style={styles.textarea}
                    disabled={loading}
                />
                <button
                    style={{
                        ...styles.sendBtn,
                        opacity: input.trim() && !loading ? 1 : 0.4,
                    }}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    aria-label="Enviar"
                >
                    <SparkIcon size={15} color="#fff" />
                </button>
            </div>
        </aside>
    );
};

/** Renders **bold** markdown inline */
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return (
        <span style={{ fontSize: 13, lineHeight: 1.6 }}>
            {parts.map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={i}>{part.slice(2, -2)}</strong>
                ) : (
                    part
                )
            )}
        </span>
    );
};

function getSimulatedResponse(prompt: string, context: string): string {
    const lower = prompt.toLowerCase();

    if (lower.includes('título') || lower.includes('headline')) {
        return '**Sugestões de títulos:**\n\n1. "Aumente suas vendas em 30% com automação"\n2. "A ferramenta que seus concorrentes já usam"\n3. "Transforme leads em clientes em 7 dias"\n4. "Marketing que funciona enquanto você dorme"\n5. "Resultados reais. Sem complicação."';
    }
    if (lower.includes('assunto') || lower.includes('email')) {
        return '**Assuntos de email com alta abertura:**\n\n1. "Você viu isso, [Nome]?"\n2. "Última chance antes de fechar as vagas"\n3. "Como [concorrente] faz para dobrar as vendas"\n4. "Resposta rápida: você está perdendo leads?"\n5. "Exclusivo para você 🎯"';
    }
    if (lower.includes('instagram') || lower.includes('legenda')) {
        return '**Legenda para Instagram:**\n\nVocê está deixando dinheiro na mesa? 💰\n\nA maioria das empresas ainda depende só de indicação. Enquanto isso, seus concorrentes captam leads 24h por dia no automático.\n\nQuer saber como? Deixa um ✅ nos comentários!\n\n#MarketingDigital #Leads #Automação #Vendas';
    }
    if (lower.includes('cta') || lower.includes('call to action')) {
        return '**CTAs de alta conversão:**\n\n• "Quero meus leads agora"\n• "Começar gratuitamente"\n• "Ver como funciona"\n• "Falar com especialista"\n• "Ativar minha conta"\n\nDica: CTAs em primeira pessoa (+10-15% de cliques) e verbos de ação têm melhor performance.';
    }
    if (lower.includes('segmentar') || lower.includes('segmentação')) {
        return '**Critérios de segmentação recomendados:**\n\n1. **Por estágio no funil** — novo lead, engajado, pronto para venda\n2. **Por fonte** — anúncio, orgânico, indicação\n3. **Por comportamento** — abriu email, visitou página de preços\n4. **Por perfil** — cargo, segmento, porte da empresa\n\nComeçe com estágio no funil para maior impacto imediato.';
    }
    if (lower.includes('roi') || lower.includes('resultad')) {
        return `**Como melhorar o ROI em ${context}:**\n\n1. Teste A/B em elementos críticos (títulos, CTAs)\n2. Segmente sua base — mensagens genéricas têm 3x menos conversão\n3. Automatize follow-ups — 80% das vendas ocorrem após o 5º contato\n4. Monitore onde os leads abandonam o funil\n5. Use lead scoring para priorizar os melhores contatos`;
    }

    return `Ótima pergunta sobre **${context}**! Para dar uma resposta personalizada, o Mentor IA precisará estar conectado à API de IA (configuração pendente no backend). Mas posso adiantar: foque em **testar hipóteses rapidamente**, medir resultados e iterar. Qual aspecto específico você quer explorar?`;
}

const styles: Record<string, React.CSSProperties> = {
    sidebar: {
        width: 320,
        height: '100vh',
        background: 'var(--bg1)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        right: 0,
        transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        overflow: 'hidden',
        zIndex: 40,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg1)',
        flexShrink: 0,
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    aiAvatarSmall: {
        width: 30,
        height: 30,
        borderRadius: 10,
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--t1)',
        lineHeight: 1.2,
    },
    headerSub: {
        fontSize: 11,
        color: 'var(--t3)',
        lineHeight: 1.2,
    },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--t3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    messages: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    messageRow: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
    },
    aiDot: {
        width: 22,
        height: 22,
        borderRadius: 8,
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginBottom: 2,
    },
    bubble: {
        maxWidth: 230,
        padding: '10px 12px',
        borderRadius: 14,
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
    },
    bubbleAI: {
        background: 'var(--bg2)',
        borderBottomLeftRadius: 4,
        color: 'var(--t1)',
    },
    bubbleUser: {
        background: 'var(--accent)',
        borderBottomRightRadius: 4,
        color: '#fff',
    },
    typingDots: {
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        padding: '2px 0',
        minWidth: 36,
    },
    suggestionsArea: {
        padding: '0 14px 12px',
        flexShrink: 0,
    },
    suggestionsLabel: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: 'var(--t4)',
        marginBottom: 8,
    },
    suggestions: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
    },
    suggestionChip: {
        padding: '5px 10px',
        borderRadius: 20,
        border: '1px solid var(--border)',
        background: 'var(--bg2)',
        color: 'var(--t2)',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.1s',
    },
    inputArea: {
        display: 'flex',
        gap: 8,
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        alignItems: 'flex-end',
        flexShrink: 0,
    },
    textarea: {
        flex: 1,
        resize: 'none',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg2)',
        color: 'var(--t1)',
        fontSize: 13,
        padding: '8px 12px',
        outline: 'none',
        lineHeight: 1.5,
        fontFamily: 'var(--font)',
        maxHeight: 120,
        overflowY: 'auto',
    },
    sendBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        border: 'none',
        background: 'var(--green)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'opacity 0.15s',
    },
};
