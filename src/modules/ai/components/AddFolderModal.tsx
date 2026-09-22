"use client";

import React, { useState } from 'react';
import { useAddWorkspaceFolder } from '@/modules/dev/hooks/useHarness';
import type { HarnessRepo } from '@/modules/dev/harness-client';

interface AddFolderModalProps {
  onClose: () => void;
  onAdded: (repo: HarnessRepo) => void;
}

export const AddFolderModal: React.FC<AddFolderModalProps> = ({ onClose, onAdded }) => {
  const { add, adding, error: hookError } = useAddWorkspaceFolder();
  const [folderPath, setFolderPath] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!folderPath.trim()) return;
    setError(null);
    const repo = await add(folderPath.trim());
    if (repo) {
      onAdded(repo);
      onClose();
    } else if (hookError) {
      setError(hookError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface dark:bg-surface-container-high border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-5 border-b border-outline-variant/40 bg-surface-container-low/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold shadow-xs">
              <span className="material-symbols-outlined text-[20px]">create_new_folder</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-primary">Adicionar Pasta Local</h3>
              <p className="text-xs text-on-surface-variant">Registra um workspace sem copiar arquivos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {error && (
          <div className="px-5 py-2 bg-error-container/30 text-error text-xs flex items-center gap-2 border-b border-error/20">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}

        <div className="p-6 space-y-4">
          <div>
            <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Caminho Absoluto do Diretório
            </label>
            <input
              type="text"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="Ex: C:/Users/luann/Documents/GitHub/meu-projeto"
              className="w-full h-10 px-3 font-mono text-xs border border-outline-variant rounded-xl bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant space-y-1.5">
            <div className="font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">saved_search</span>
              Detecção Automática de Runtimes
            </div>
            <p className="text-[11px] leading-relaxed">
              O ChronoKairo inspecionará o diretório buscando por <code className="font-mono text-secondary">.git</code>, <code className="font-mono text-secondary">package.json</code>, <code className="font-mono text-secondary">Cargo.toml</code>, <code className="font-mono text-secondary">pyproject.toml</code> e <code className="font-mono text-secondary">go.mod</code>.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant/40 bg-surface-container-low/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 border border-outline-variant text-on-surface-variant text-xs rounded-xl hover:bg-surface-container-low transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={adding || !folderPath.trim()}
            className="h-9 px-5 bg-secondary text-on-secondary font-semibold text-xs rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {adding ? 'Registrando…' : 'Registrar Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
};
