'use client';

import { FormEvent, useState } from 'react';
import { useNvidiaAiSidebar } from '../hooks/useNvidiaAiSidebar';

export function NvidiaAiSidebar() {
  const [isAiSidebarOpen, setAiSidebarOpen] = useState(false);
  const closeAiSidebar = () => setAiSidebarOpen(false);
  const ai = useNvidiaAiSidebar();
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');

  if (!isAiSidebarOpen) return null;

  const submitKey = async (event: FormEvent) => {
    event.preventDefault();
    await ai.saveCredential(apiKey);
    setApiKey('');
  };

  const submitPrompt = async (event: FormEvent) => {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || ai.loading) return;
    setPrompt('');
    await ai.sendMessage(content);
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-outline-variant bg-surface shadow-2xl sm:w-96" aria-label="Chat IA NVIDIA">
      <header className="flex h-14 items-center justify-between border-b border-outline-variant px-4">
        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">smart_toy</span><div><h2 className="m-0 text-sm font-bold text-primary">Chat IA</h2><p className="m-0 text-[10px] text-on-surface-variant">NVIDIA NIM · chave individual</p></div></div>
        <button type="button" onClick={closeAiSidebar} className="rounded-lg border-0 bg-transparent p-2 text-on-surface-variant" aria-label="Fechar chat"><span className="material-symbols-outlined">close</span></button>
      </header>

      {!ai.configured ? (
        <form onSubmit={submitKey} className="m-auto w-full max-w-sm space-y-4 p-6">
          <div className="rounded-2xl bg-surface-container p-4"><span className="material-symbols-outlined text-3xl text-primary">key</span><h3 className="mt-2 text-sm font-bold text-primary">Conectar NVIDIA NIM</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">A key será cifrada no servidor e vinculada somente ao seu usuário. Ela nunca retorna ao navegador.</p></div>
          <label className="block text-xs font-bold text-primary">NVIDIA API key<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" required minLength={20} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm outline-none" placeholder="nvapi-…" /></label>
          {ai.error && <p className="text-xs text-error">{ai.error}</p>}
          <button type="submit" disabled={ai.loading} className="w-full rounded-xl border-0 bg-primary px-4 py-2.5 text-xs font-bold text-on-primary disabled:opacity-50">{ai.loading ? 'Salvando…' : 'Salvar key e conectar'}</button>
        </form>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-outline-variant p-3">
            <select value={ai.model} onChange={(event) => ai.setModel(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container px-2 py-2 text-[11px] text-primary">{ai.models.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            <button type="button" onClick={() => void ai.deleteCredential()} className="rounded-lg border border-outline-variant bg-transparent p-2 text-error" title="Remover minha key"><span className="material-symbols-outlined text-base">key_off</span></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {ai.messages.length === 0 && <div className="mt-12 text-center"><span className="material-symbols-outlined text-4xl text-primary/40">forum</span><p className="text-xs text-on-surface-variant">Converse com o modelo selecionado.</p></div>}
            {ai.messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-5 ${message.role === 'user' ? 'ml-auto bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}>{message.content}</div>)}
            {ai.loading && <p className="text-xs text-on-surface-variant">Pensando…</p>}
            {ai.error && <p className="rounded-lg bg-error-container p-2 text-xs text-error">{ai.error}</p>}
          </div>
          <form onSubmit={submitPrompt} className="border-t border-outline-variant p-3"><div className="flex gap-2"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={2} className="min-w-0 flex-1 resize-none rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs outline-none" placeholder="Pergunte à IA…" /><button type="submit" disabled={ai.loading || !prompt.trim()} className="rounded-xl border-0 bg-primary px-3 text-on-primary disabled:opacity-40"><span className="material-symbols-outlined">send</span></button></div></form>
        </>
      )}
    </aside>
  );
}
