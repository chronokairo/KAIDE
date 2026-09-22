'use client';

import React, { useState, useCallback } from 'react';
import { useApplyPatch } from '@/modules/dev/hooks/useHarness';

const SAMPLE_PATCH = `--- a/src/lib/example.ts
+++ b/src/lib/example.ts (new)
@@ -0,3 +0,3 @@
+export function greet(name: string): string {
+  return \`Hello, \${name}!\`;
+}`;

export const PatchPreviewPanel: React.FC = () => {
  const { dryRun, apply, revert, dryRunResult, lastResult, loading, error } = useApplyPatch();
  const [patch, setPatch] = useState('');
  const [lastPatchId, setLastPatchId] = useState<number | null>(null);

  const handleDryRun = useCallback(async () => {
    if (!patch.trim()) return;
    await dryRun(patch);
  }, [patch, dryRun]);

  const handleApply = useCallback(async () => {
    if (!patch.trim()) return;
    const result = await apply(patch, undefined, true);
    if (result) {
      setLastPatchId(result.patch_id ?? null);
    }
  }, [patch, apply]);

  const handleRevert = useCallback(async () => {
    if (lastPatchId === null) return;
    await revert(lastPatchId);
    setLastPatchId(null);
  }, [lastPatchId, revert]);

  const renderChange = (item: any, idx: number) => {
    const typeColors: Record<string, string> = {
      Add: 'bg-emerald-100 text-emerald-800',
      Delete: 'bg-red-100 text-red-800',
      Update: 'bg-amber-100 text-amber-800',
    };

    const typeLabels: Record<string, string> = {
      Add: 'A',
      Delete: 'D',
      Update: 'M',
    };

    const changeType = item.change?.type || (item.addedLines ? 'Add' : item.deletedLines ? 'Delete' : 'Update');
    const path = item.path || (typeof item === 'string' ? item : 'Arquivo');

    return (
      <div key={idx} className="p-3 border border-outline-variant/30 rounded-xl bg-white">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${typeColors[changeType] || ''}`}>
            {typeLabels[changeType] || '?'}
          </span>
          <span className="text-xs font-mono text-primary font-semibold">{path}</span>
          <span className="text-[10px] text-on-surface-variant">({changeType})</span>
        </div>
        {item.change?.unified_diff && (
          <pre className="text-[10px] font-mono bg-surface-container-low p-2 rounded-lg overflow-x-auto text-on-surface whitespace-pre-wrap">
            {item.change.unified_diff}
          </pre>
        )}
        {item.change?.content && changeType === 'Add' && (
          <pre className="text-[10px] font-mono bg-surface-container-low p-2 rounded-lg overflow-x-auto text-on-surface whitespace-pre-wrap">
            {item.change.content}
          </pre>
        )}
      </div>
    );
  };

  const dryRunChanges = dryRunResult?.changes || dryRunResult?.fileChanges || [];
  const appliedChanges = lastResult?.applied || lastResult?.modifiedFiles || [];

  return (
    <div className="space-y-4">
      {/* Editor */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/40 bg-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary">Aplicar Patch</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Valide e aplique patches no workspace</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPatch(SAMPLE_PATCH)}
              className="px-3 py-1.5 rounded-xl text-[10px] font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Template
            </button>
            <button
              type="button"
              onClick={handleDryRun}
              disabled={loading || !patch.trim()}
              className="px-3 py-1.5 rounded-xl border border-outline-variant/60 text-xs font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              Testar (Dry Run)
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={loading || !patch.trim()}
              className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-2xs"
            >
              Aplicar Patch
            </button>
            {lastPatchId !== null && (
              <button
                type="button"
                onClick={handleRevert}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Reverter #{lastPatchId}
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          <textarea
            value={patch}
            onChange={(e) => setPatch(e.target.value)}
            placeholder="Cole o patch diff aqui (Unified Diff)..."
            rows={10}
            className="w-full font-mono text-xs p-3 bg-surface-container-low border border-outline-variant/40 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Dry Run Result */}
      {dryRunResult && !lastResult && (
        <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-outline-variant/40 bg-white">
            <h3 className="font-bold text-sm text-primary">Dry Run Result</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{dryRunResult.summary || 'Prévia gerada com sucesso'}</p>
          </div>
          <div className="p-4 space-y-2">
            {dryRunChanges.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">Nenhuma alteração detectada.</p>
            ) : (
              dryRunChanges.map((item: any, idx: number) => renderChange(item, idx))
            )}
          </div>
        </div>
      )}

      {/* Apply Result */}
      {lastResult && (
        <div className="bg-surface border border-outline-variant/60 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-outline-variant/40 bg-white">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">✓</span>
              <h3 className="font-bold text-sm text-primary">Patch {lastResult.patch_id ? `#${lastResult.patch_id}` : ''} Aplicado</h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">{lastResult.summary || 'Alterações aplicadas com sucesso'}</p>
          </div>
          <div className="p-4 space-y-2">
            {appliedChanges.map((item: any, idx: number) => renderChange(item, idx))}
          </div>
        </div>
      )}
    </div>
  );
};
