'use client';

import type { ProviderInfo } from '../model-config';

interface ChatAppBarProps {
  localProviders: ProviderInfo[];
  chatProviderId: string;
  chatModels: string[];
  chatModelId: string;
  chatModelsLoading: boolean;
  suggestionsOpen: boolean;
  onProviderSelect: (id: string) => void;
  onModelSelect: (modelId: string) => void;
  onToggleSuggestions: () => void;
}

export default function ChatAppBar({
  localProviders,
  chatProviderId,
  chatModels,
  chatModelId,
  chatModelsLoading,
  suggestionsOpen,
  onProviderSelect,
  onModelSelect,
  onToggleSuggestions,
}: ChatAppBarProps) {
  return (
    <header className="bg-surface/95 backdrop-blur-sm flex justify-between items-center px-margin-desktop py-4 border-b border-outline-variant/30">
      <span className="font-headline-md text-headline-md font-bold text-primary">Anna AI</span>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button
            onClick={onToggleSuggestions}
            aria-label="Sugestões de perguntas"
            title="Sugestões de perguntas"
            className={`hover:text-primary transition-colors active:scale-95 duration-100 ${suggestionsOpen ? 'text-primary' : ''}`}
          >
            <span
              className="material-symbols-outlined"
              style={suggestionsOpen ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              lightbulb
            </span>
          </button>
          <button className="hover:text-primary transition-colors active:scale-95 duration-100">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="hover:text-primary transition-colors active:scale-95 duration-100">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </div>
    </header>
  );
}
