'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: string;
}

function isToday(date: Date) {
  return date.toDateString() === new Date().toDateString();
}

function isYesterday(date: Date) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return date.toDateString() === y.toDateString();
}

const NAV_ITEMS: Array<{ href: string; icon: string; label: string }> = [
  { href: '/campus', icon: 'map', label: 'Info do Campus' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeConvId = searchParams.get('conversationId');

  const [items, setItems] = useState<ConversationItem[]>([]);

  useEffect(() => {
    fetch('/api/conversations')
      .then((r) => (r.ok ? r.json() as Promise<{ conversations: ConversationItem[] }> : Promise.reject()))
      .then((data) => setItems(data.conversations))
      .catch(() => {});
  }, [pathname, activeConvId]);

  const todayItems = items.filter((i) => isToday(new Date(i.updatedAt)));
  const yesterdayItems = items.filter((i) => isYesterday(new Date(i.updatedAt)));
  const olderItems = items.filter((i) => {
    const d = new Date(i.updatedAt);
    return !isToday(d) && !isYesterday(d);
  });

  function ConvGroup({ label, group }: { label: string; group: ConversationItem[] }) {
    if (group.length === 0) return null;
    return (
      <div className="mb-2">
        <p className="px-3 py-1 text-[11px] font-label-md text-on-surface-variant/60 uppercase tracking-wider">{label}</p>
        {group.map((item) => {
          const isActive = activeConvId === item.id;
          return (
            <Link
              key={item.id}
              href={`/chat?conversationId=${item.id}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[13px] font-body-sm leading-tight ${
                isActive
                  ? 'bg-surface-container-high text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] flex-shrink-0">chat_bubble</span>
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40 bg-surface-container-low flex flex-col border-r border-outline-variant">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <Image
          src="/logo.png"
          alt="Anna — Inteligência Artificial do CIESA"
          width={192}
          height={64}
          priority
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Novo Chat */}
      <div className="px-3 pb-3 flex-shrink-0">
        <button
          onClick={() => router.push('/chat?reset=' + Date.now())}
          className="w-full py-2.5 bg-primary text-on-primary font-button text-button rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 duration-100"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Chat
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 pb-2 flex-shrink-0 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const isActive =
            pathname === href ||
            (href === '/chat' && (pathname === '/' || pathname === '/dashboard') && !activeConvId);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-body-md text-body-md ${
                isActive
                  ? 'text-primary font-semibold bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'active-nav-item' : ''}`}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Divider + History */}
      <div className="mx-3 border-t border-outline-variant mb-2 flex-shrink-0" />
      <div className="px-3 flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <p className="px-3 py-2 text-[12px] text-on-surface-variant/50">Nenhuma conversa salva.</p>
        ) : (
          <>
            <ConvGroup label="Hoje" group={todayItems} />
            <ConvGroup label="Ontem" group={yesterdayItems} />
            <ConvGroup label="Mais antigas" group={olderItems} />
          </>
        )}
      </div>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-outline-variant flex-shrink-0 space-y-0.5">
        <Link
          href="/login?next=/chat"
          className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all font-body-md text-body-md"
        >
          <span className="material-symbols-outlined text-[20px]">login</span>
          Entrar
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all font-body-md text-body-md"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          Configurações
        </Link>
      </div>
    </aside>
  );
}
