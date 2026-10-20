'use client';
import React, { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import styles from './AiChatPanel.module.css';

export interface AiChatMessage {
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
}

export interface AiModelOption {
  readonly id: string;
  readonly label?: string;
}

export interface AiChatPanelProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly messages: readonly AiChatMessage[];
  readonly busy?: boolean;
  readonly error?: string | null;
  readonly models?: readonly AiModelOption[];
  readonly selectedModel?: string;
  readonly onSelectModel?: (model: string) => void;
  readonly responseMode?: 'light' | 'detailed';
  readonly onSelectResponseMode?: (mode: 'light' | 'detailed') => void;
  readonly suggestions?: readonly string[];
  readonly placeholder?: string;
  readonly onSendMessage: (content: string) => void | Promise<void>;
  readonly onClear?: () => void;
  readonly headerActions?: ReactNode;
  readonly customSlot?: ReactNode;
}

const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.emptyIcon}>
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
    <path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
    <path d="M19 11h2m-1 -1v2" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.sendIcon}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

/**
 * Painel de Chat com IA compartilhado da platform (padrão Support / Mail).
 * 100% agnóstico de framework: React puro + CSS Modules + SVG inline.
 * Zero dependência de Tailwind, PostCSS ou Next.js.
 */
export function AiChatPanel({
  title = 'Assistente IA',
  subtitle = 'Descreva o que você precisa. Eu preparo, você aprova.',
  messages,
  busy = false,
  error = null,
  models = [],
  selectedModel = '',
  onSelectModel,
  responseMode = 'detailed',
  onSelectResponseMode,
  suggestions = [],
  placeholder = 'Peça qualquer coisa…',
  onSendMessage,
  onClear,
  headerActions,
  customSlot,
}: AiChatPanelProps) {
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof endRef.current?.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, busy, customSlot]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    setDraft('');
    await onSendMessage(content);
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSubmit(event);
    }
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.chat} aria-label={title}>
        <header className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerTitle}>{title}</h1>
            <p className={styles.headerSubtitle}>{subtitle}</p>
          </div>
          <div className={styles.actions}>
            {headerActions}
            {onClear ? (
              <button
                type="button"
                className={styles.actionButton}
                disabled={busy || messages.length === 0}
                onClick={onClear}
                title="Limpar conversa"
              >
                Limpar
              </button>
            ) : null}
          </div>
        </header>

        <div className={styles.messages} role="log" aria-live="polite" aria-busy={busy}>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <SparklesIcon />
              <h2 className={styles.emptyTitle}>Como posso ajudar hoje?</h2>
              <p className={styles.emptyDesc}>Comece escolhendo uma sugestão abaixo ou digitando sua mensagem.</p>
              {suggestions.length > 0 ? (
                <div className={styles.suggestions}>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className={styles.suggestionButton}
                      onClick={() => void onSendMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            messages.map((message, index) => (
              <article
                key={index}
                className={`${styles.message} ${message.role === 'user' ? styles.userMessage : ''}`}
              >
                <span className={styles.sender}>
                  {message.role === 'user' ? 'Você' : 'Assistente IA'}
                </span>
                <p className={styles.messageContent}>{message.content}</p>
              </article>
            ))
          )}

          {customSlot ? <div className={styles.customSlot}>{customSlot}</div> : null}

          {busy ? (
            <p className={styles.pending} role="status">
              A IA está preparando a resposta…
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.inputRow}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={draft}
              maxLength={8000}
              rows={2}
              placeholder={placeholder}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                {models.length > 0 && onSelectModel ? (
                  <select
                    className={styles.modelSelect}
                    aria-label="Modelo de IA"
                    value={selectedModel}
                    disabled={busy}
                    onChange={(e) => onSelectModel(e.target.value)}
                  >
                    {models.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label ?? opt.id}
                      </option>
                    ))}
                  </select>
                ) : null}

                {onSelectResponseMode ? (
                  <select
                    className={styles.modeSelect}
                    aria-label="Modo de resposta"
                    value={responseMode}
                    disabled={busy}
                    onChange={(e) => onSelectResponseMode(e.target.value as 'light' | 'detailed')}
                  >
                    <option value="light">Leve</option>
                    <option value="detailed">Detalhado</option>
                  </select>
                ) : null}
              </div>

              <div className={styles.toolbarGroup}>
                <button
                  type="submit"
                  className={styles.sendButton}
                  disabled={!draft.trim() || busy}
                  aria-label="Enviar mensagem"
                >
                  <ArrowUpIcon />
                </button>
              </div>
            </div>
          </div>
          <span className={styles.hint}>Enter para enviar · Shift + Enter para nova linha</span>
        </form>
      </section>
    </div>
  );
}
