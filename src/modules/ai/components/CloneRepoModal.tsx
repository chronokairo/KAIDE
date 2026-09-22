"use client";

import React, { useState } from 'react';
import { useCloneRepo } from '@/modules/dev/hooks/useHarness';
import type { HarnessRepo } from '@/modules/dev/harness-client';

interface CloneRepoModalProps {
  onClose: () => void;
  onCloned: (repo: HarnessRepo) => void;
}

export const CloneRepoModal: React.FC<CloneRepoModalProps> = ({ onClose, onCloned }) => {
  const { clone, cloning, error: hookError } = useCloneRepo();
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [destDir, setDestDir] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClone = async () => {
    if (!url.trim() || !destDir.trim()) return;
    setError(null);
    const repo = await clone(url.trim(), destDir.trim(), branch.trim());
    if (repo) {
      onCloned(repo);
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
              <span className="material-symbols-outlined text-[20px]">download</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-primary">Clonar Repositório Remote</h3>
              <p className="text-xs text-on-surface-variant">Clona via Git CLI e registra automaticamente no Harness</p>
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
              URL do Repositório (HTTPS ou SSH)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                const u = e.target.value;
                setUrl(u);
                if (!destDir && u.includes('/')) {
                  const repoName = u.split('/').pop()?.replace('.git', '') || '';
                  if (repoName) setDestDir(`C:/Users/luann/Documents/GitHub/${repoName}`);
                }
              }}
              placeholder="https://github.com/usuario/repositorio.git"
              className="w-full h-10 px-3 font-mono text-xs border border-outline-variant rounded-xl bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Branch Inicial
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full h-10 px-3 font-mono text-xs border border-outline-variant rounded-xl bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            <div>
              <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Diretório Destino
              </label>
              <input
                type="text"
                value={destDir}
                onChange={(e) => setDestDir(e.target.value)}
                placeholder="C:/Users/.../novo-repo"
                className="w-full h-10 px-3 font-mono text-xs border border-outline-variant rounded-xl bg-surface-container-low focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
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
            onClick={handleClone}
            disabled={cloning || !url.trim() || !destDir.trim()}
            className="h-9 px-5 bg-secondary text-on-secondary font-semibold text-xs rounded-xl hover:bg-secondary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {cloning ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                Clonando…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">download</span>
                Clonar & Indexar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
