'use client';

interface SuggestionsSidebarProps {
  isAiGenerated: boolean;
  loading: boolean;
  suggestions: string[];
  onClose: () => void;
  onPick: (suggestion: string) => void;
}

export default function SuggestionsSidebar({
  isAiGenerated,
  loading,
  suggestions,
  onClose,
  onPick,
}: SuggestionsSidebarProps) {
  return (
    <aside className="fixed right-0 top-0 h-screen w-80 z-[200] bg-surface-container-low border-l border-outline-variant flex flex-col shadow-xl">
      <div className="flex items-center justify-between px-4 py-4 border-b border-outline-variant flex-shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lightbulb
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Sugestões</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar sugestões"
          className="text-on-surface-variant hover:text-primary transition-colors rounded-lg p-1 hover:bg-surface-container active:scale-95 duration-100"
        >
          <span className="material-symbols-outlined">last_page</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 space-y-2">
        <p className="text-[11px] text-on-surface-variant uppercase tracking-wide font-medium mb-1">
          {isAiGenerated ? 'Geradas pela Anna com base na conversa' : 'Para começar'}
        </p>
        {loading && (
          <div className="flex items-center gap-2 text-on-surface-variant px-1 py-2">
            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            <span className="font-body-sm text-body-sm">Gerando sugestões…</span>
          </div>
        )}
        {!loading && suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="w-full text-left px-4 py-3 rounded-xl border border-secondary/30 text-secondary font-button text-button bg-white hover:bg-secondary/5 transition-colors shadow-sm"
          >
            {s}
          </button>
        ))}
      </div>
    </aside>
  );
}
