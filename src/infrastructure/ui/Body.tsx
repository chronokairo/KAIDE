'use client';

import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Source } from '@/domain/chat';
import { 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Copy, 
  Check, 
  Trash2, 
  FileText, 
  Loader2, 
  Database, 
  Shield, 
  BarChart3, 
  Search,
  BookOpen
} from 'lucide-react';
import { DevAgentesTab } from '@/modules/ai/components/DevAgentesTab';

interface BodyProps {
  activeTab: 'chat' | 'search' | 'agentes' | 'settings';
  messages: Message[];
  isLoading: boolean;
  input: string;
  onInputChange: (val: string) => void;
  onSendMessage: (text?: string) => void;
  onClearChat: () => void;
  onInspectSources?: (sources: Source[]) => void;
}

export function Body({
  activeTab,
  messages,
  isLoading,
  input,
  onInputChange,
  onSendMessage,
  onClearChat,
  onInspectSources,
}: BodyProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 bg-background overflow-hidden relative">
      {/* 1. VISÃO DE CHAT */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col h-full min-w-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.length === 0 ? (
              <WelcomeScreen onSuggestionClick={(sug) => onSendMessage(sug)} />
            ) : (
              <div className="max-w-4xl mx-auto space-y-5">
                {messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    onInspectSources={onInspectSources}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Barra de Input fixa na base */}
          <div className="p-3 sm:p-4 border-t border-outline-variant bg-surface-container-low/60 backdrop-blur-md">
            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-surface-container rounded-xl border border-outline-variant/80 p-2 focus-within:border-outline focus-within:ring-1 focus-within:ring-secondary/30 transition-all shadow-sm">
              {messages.length > 0 && (
                <button
                  onClick={onClearChat}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                  title="Limpar conversa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Faça uma pergunta sobre código, contratos, TOTVS ou dados..."
                rows={1}
                className="flex-1 bg-transparent border-0 resize-none text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden py-1.5 px-2 max-h-32 min-h-[38px]"
              />

              <button
                onClick={() => onSendMessage()}
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
                title="Enviar mensagem (Enter)"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="max-w-4xl mx-auto flex items-center justify-between text-[11px] text-on-surface-variant/60 px-2 mt-1.5 font-mono">
              <span>Shift + Enter para nova linha</span>
              <span>ChronoKairo Hybrid RAG</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. VISÃO DE BUSCA SEMÂNTICA */}
      {activeTab === 'search' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-outline-variant">
            <Search className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-semibold text-on-surface">Busca Semântica & Documentos</h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Consulte a base de conhecimento vetorial e contratos corporativos diretamente.
          </p>
          <div className="p-4 rounded-xl border border-outline-variant bg-surface-container text-xs text-on-surface-variant">
            Use o campo de chat principal para realizar buscas híbridas combinando texto e embeddings em tempo real.
          </div>
        </div>
      )}

      {/* 3. VISÃO DE AGENTES & AUTOMAÇÕES */}
      {activeTab === 'agentes' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
          <DevAgentesTab />
        </div>
      )}

      {/* 4. VISÃO DE CONFIGURAÇÕES */}
      {activeTab === 'settings' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-outline-variant">
            <h2 className="text-lg font-semibold text-on-surface">Configurações do Sistema</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container space-y-2">
              <h3 className="font-semibold text-on-surface text-sm">Modelos e Provedores</h3>
              <p className="text-on-surface-variant">
                O ChronoKairo AI utiliza roteamento híbrido entre provedores na nuvem (NVIDIA NIM, Groq) e motores locais (Ollama, CKI Rust).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container space-y-2">
              <h3 className="font-semibold text-on-surface text-sm">Auditoria e Governança</h3>
              <p className="text-on-surface-variant">
                Todas as ferramentas com efeito colateral exigem confirmação explícita e registram logs imutáveis em conformidade com as regras de produto.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Subcomponente de Item de Mensagem
function MessageItem({
  message,
  onInspectSources,
}: {
  message: Message;
  onInspectSources?: (sources: Source[]) => void;
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-surface-container-highest border border-outline flex items-center justify-center text-secondary shrink-0 shadow-xs mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-on-surface ${
          isUser
            ? 'bg-surface-container-highest border border-outline'
            : 'bg-surface-container-low border border-outline-variant/60 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] text-on-surface-variant pb-1 border-b border-outline-variant/30">
          <span className="font-medium text-xs">
            {isUser ? 'Você' : 'ChronoKairo AI'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
              title="Copiar mensagem"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-secondary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="prose prose-invert prose-sm max-w-none text-on-surface leading-relaxed break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content || (message.isStreaming ? 'Pensando...' : '')}
          </ReactMarkdown>
        </div>

        {/* Fontes consultadas no rodapé da mensagem */}
        {message.sources && message.sources.length > 0 && (
          <div className="pt-2 border-t border-outline-variant/40 flex items-center gap-2 text-xs">
            <button
              onClick={() => onInspectSources?.(message.sources!)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-[11px] text-secondary font-medium transition-colors"
            >
              <FileText className="w-3 h-3" />
              <span>{message.sources.length} fonte(s) citada(s)</span>
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline flex items-center justify-center text-on-surface shrink-0 shadow-xs mt-0.5">
          <User className="w-4 h-4 text-on-surface-variant" />
        </div>
      )}
    </div>
  );
}

// Subcomponente de Tela de Boas-Vindas
function WelcomeScreen({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  const suggestions = [
    'Quais turmas têm vagas abertas no sistema?',
    'Liste os candidatos inscritos com documentação pendente',
    'Explique a arquitetura hexagonal deste repositório',
    'Como configurar um novo provedor de LLM com fallback?',
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center max-w-xl mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-highest border border-outline flex items-center justify-center text-secondary shadow-md mb-4">
        <Sparkles className="w-7 h-7" />
      </div>

      <h1 className="text-xl font-bold text-on-surface mb-2 tracking-tight">
        ChronoKairo AI
      </h1>
      <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
        Assistente de inteligência artificial corporativa com RAG unificado, contratos de integração e execução de ferramentas seguras.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(sug)}
            className="p-3 rounded-xl border border-outline-variant/60 bg-surface-container/60 hover:bg-surface-container hover:border-secondary/40 text-xs text-on-surface transition-all"
          >
            {sug}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-on-surface-variant/60">
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-secondary" /> 100% Auditado
        </span>
        <span className="flex items-center gap-1">
          <Database className="w-3.5 h-3.5 text-secondary" /> Conectores Reais
        </span>
        <span className="flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5 text-secondary" /> Gráficos Dinâmicos
        </span>
      </div>
    </div>
  );
}
