'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface ConversationItem {
  id: string;
  title: string;
  preview: string;
  providerId: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

function isToday(date: Date) {
  return date.toDateString() === new Date().toDateString();
}

function isYesterday(date: Date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

function isWithinLastWeek(date: Date) {
  return Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function providerMeta(_providerId: string) {
  return {
    icon: 'smart_toy',
    iconBg: 'bg-primary-fixed',
    iconFg: 'text-primary',
  };
}

function HistoryCard({ item }: { item: ConversationItem }) {
  const meta = providerMeta(item.providerId);

  return (
    <div className="group bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant hover:border-primary/30 hover:shadow-lg transition-all duration-300 flex justify-between items-center">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${meta.iconBg} flex items-center justify-center ${meta.iconFg} flex-shrink-0`}>
          <span className="material-symbols-outlined">{meta.icon}</span>
        </div>
        <div>
          <h4 className="font-headline-md text-[18px] text-on-surface group-hover:text-primary transition-colors line-clamp-1">
            {item.title}
          </h4>
          <p className="font-body-sm text-on-surface-variant mt-1 line-clamp-2">{item.preview || 'Sem prévia disponível.'}</p>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-[12px] font-label-md text-on-surface-variant">{formatTime(item.updatedAt)}</span>
          </div>
        </div>
      </div>
      <Link
        href={`/chat?conversationId=${item.id}`}
        className="bg-surface-container-high text-primary p-3 rounded-full hover:bg-primary hover:text-on-primary transition-all active:scale-90 flex-shrink-0"
        title="Retomar conversa"
      >
        <span className="material-symbols-outlined">arrow_forward</span>
      </Link>
    </div>
  );
}

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/conversations')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ conversations: ConversationItem[] }>;
      })
      .then((data) => {
        setItems(data.conversations);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.preview.toLowerCase().includes(q),
    );
  }, [items, search]);

  const todayItems = filteredItems.filter((item) => isToday(new Date(item.updatedAt)));
  const yesterdayItems = filteredItems.filter((item) => isYesterday(new Date(item.updatedAt)));
  const lastWeekItems = filteredItems.filter((item) => {
    const date = new Date(item.updatedAt);
    return !isToday(date) && !isYesterday(date) && isWithinLastWeek(date);
  });
  const olderItems = filteredItems.filter((item) => !isWithinLastWeek(new Date(item.updatedAt)));
  const isEmpty = !loading && !error && filteredItems.length === 0;

  return (
    <main className="ml-64 min-h-screen">
      <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md px-margin-desktop py-4 flex justify-between items-center border-b border-outline-variant/30">
        <h2 className="font-headline-md text-headline-md font-bold text-primary">Histórico</h2>

        <div className="flex items-center gap-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversas..."
              className="bg-surface-container-lowest border border-outline-variant rounded-full pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-margin-desktop py-8">
        {loading && (
          <div className="flex items-center gap-2 text-on-surface-variant py-12">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span>Carregando histórico real...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-error/30 bg-error-container px-5 py-4 text-sm text-on-error-container">
            Erro ao carregar histórico: {error}
          </div>
        )}

        {todayItems.length > 0 && (
          <section className="mb-10">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Hoje
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {todayItems.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {yesterdayItems.length > 0 && (
          <section className="mb-10">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-6">Ontem</h3>
            <div className="grid grid-cols-1 gap-4">
              {yesterdayItems.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {lastWeekItems.length > 0 && (
          <section className="mb-10">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-6">Semana Passada</h3>
            <div className="grid grid-cols-1 gap-4">
              {lastWeekItems.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {olderItems.length > 0 && (
          <section>
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-6">Mais Antigas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {olderItems.map((item) => {
                return (
                  <Link
                    key={item.id}
                    href={`/chat?conversationId=${item.id}`}
                    className="group bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">smart_toy</span>
                      </div>
                      <span className="text-[12px] font-label-md text-on-surface-variant">{formatShortDate(item.updatedAt)}</span>
                    </div>
                    <h4 className="font-headline-md text-[18px] text-on-surface group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="font-body-sm text-on-surface-variant mt-2 line-clamp-2">{item.preview || 'Sem prévia disponível.'}</p>
                    <div className="mt-6 flex justify-between items-center gap-3">
                      <span className="font-button text-button text-primary hover:underline decoration-primary flex items-center gap-1">
                        Retomar
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {isEmpty && (
          <div className="text-center py-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl">history</span>
            <p className="font-body-md text-body-md mt-4">Nenhuma conversa salva encontrada.</p>
          </div>
        )}
      </div>
    </main>
  );
}
